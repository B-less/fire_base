'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM or OneSignal.
 *
 * - sendPushNotification - A function that sends a push notification.
 * - PushNotificationInput - The input type for the sendPushNotification function.
 */

import { ai } from '@/ai/genkit';
import { adminApp, adminDb } from '@/lib/firebase-admin';
import { extractFcmTokens, getPushPreviewText } from '@/lib/push';
import type { User } from '@/lib/types';
import { getMessaging } from 'firebase-admin/messaging';
import { z } from 'genkit';

const PushNotificationInputSchema = z.object({
  recipientPhoneNumber: z.string().describe('The phone number of the recipient user.'),
  senderPhoneNumber: z.string().describe('The phone number of the user sending the message.'),
  senderName: z.string().describe('The name of the user sending the message.'),
  message: z.string().describe('The content of the message.'),
});
export type PushNotificationInput = z.infer<typeof PushNotificationInputSchema>;

const sendOneSignalPushNotification = async ({
  recipientExternalId,
  senderName,
  message,
}: {
  recipientExternalId: string;
  senderName: string;
  message: string;
}) => {
  const oneSignalAppId = process.env.ONESIGNAL_APP_ID;
  const oneSignalApiKey = process.env.ONESIGNAL_API_KEY;

  if (!oneSignalAppId || !oneSignalApiKey) {
    console.error('OneSignal is not configured. Missing ONESIGNAL_APP_ID or ONESIGNAL_API_KEY.');
    return;
  }

  const response = await fetch('https://api.onesignal.com/notifications?c=push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${oneSignalApiKey}`,
    },
    body: JSON.stringify({
      app_id: oneSignalAppId,
      include_aliases: {
        external_id: [recipientExternalId],
      },
      target_channel: 'push',
      headings: {
        en: `New message from ${senderName}`,
      },
      contents: {
        en: message || 'Sent you a media file.',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OneSignal push notification failed:', response.status, errorText);
  }
};

export async function sendPushNotification(input: PushNotificationInput): Promise<void> {
  return sendPushNotificationFlow(input);
}

const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: PushNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ recipientPhoneNumber, senderPhoneNumber, senderName, message }) => {
    const recipientSnapshot = await adminDb.ref(`users/${recipientPhoneNumber}`).get();
    if (!recipientSnapshot.exists()) {
      console.log('Recipient user not found, skipping push notification.');
      return;
    }

    const recipient = recipientSnapshot.val() as User;

    if (recipient.pushProvider === 'median-onesignal' && recipient.oneSignalExternalId) {
      await sendOneSignalPushNotification({
        recipientExternalId: recipient.oneSignalExternalId,
        senderName,
        message,
      });
      return;
    }

    const recipientTokens = extractFcmTokens(recipient);
    if (recipientTokens.length === 0) {
      console.log('No FCM token available for recipient, skipping push notification.');
      return;
    }

    try {
      const response = await getMessaging(adminApp).sendEachForMulticast({
        tokens: recipientTokens,
        notification: {
          title: `New message from ${senderName}`,
          body: getPushPreviewText(message),
        },
        data: {
          senderName,
          senderPhoneNumber,
          contactId: senderPhoneNumber,
          message: getPushPreviewText(message),
        },
        android: {
          priority: 'high',
        },
      });

      const invalidTokens: string[] = [];
      response.responses.forEach((result, index) => {
        const code = result.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(recipientTokens[index]);
        }
      });

      if (invalidTokens.length > 0) {
        const cleanupUpdates: Record<string, null> = {};
        invalidTokens.forEach((token) => {
          cleanupUpdates[`users/${recipientPhoneNumber}/fcmTokens/${encodeURIComponent(token)}`] = null;
          if (recipient.fcmToken === token) {
            cleanupUpdates[`users/${recipientPhoneNumber}/fcmToken`] = null;
          }
        });
        await adminDb.ref().update(cleanupUpdates);
      }

      console.log('Push notification sent successfully to tokens:', recipientTokens.length);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
);
