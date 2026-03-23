'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM or OneSignal.
 *
 * - sendPushNotification - A function that sends a push notification.
 * - PushNotificationInput - The input type for the sendPushNotification function.
 */

import { ai } from '@/ai/genkit';
import { adminApp, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import { getMessaging } from 'firebase-admin/messaging';
import { z } from 'genkit';

const PushNotificationInputSchema = z.object({
  recipientPhoneNumber: z.string().describe('The phone number of the recipient user.'),
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
  async ({ recipientPhoneNumber, senderName, message }) => {
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

    if (!recipient.fcmToken) {
      console.log('No FCM token available for recipient, skipping push notification.');
      return;
    }

    try {
      await getMessaging(adminApp).send({
        notification: {
          title: `New message from ${senderName}`,
          body: message || 'Sent you a media file.',
        },
        token: recipient.fcmToken,
      });
      console.log('Push notification sent successfully to token:', recipient.fcmToken);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
);
