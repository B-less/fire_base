
'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM or OneSignal.
 *
 * - sendPushNotification - A function that sends a push notification.
 * - PushNotificationInput - The input type for the sendPushNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log('Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const PushNotificationInputSchema = z.object({
  recipientToken: z
    .string()
    .optional()
    .describe("The FCM token of the device to send the notification to."),
  recipientExternalId: z
    .string()
    .optional()
    .describe("The OneSignal external id for the recipient user."),
  recipientPushProvider: z
    .enum(['fcm', 'median-onesignal'])
    .optional()
    .describe("The push provider to use for the notification."),
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

export async function sendPushNotification(
  input: PushNotificationInput
): Promise<void> {
  return sendPushNotificationFlow(input);
}

const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: PushNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ recipientToken, recipientExternalId, recipientPushProvider, senderName, message }) => {
    if (recipientPushProvider === 'median-onesignal' && recipientExternalId) {
      await sendOneSignalPushNotification({
        recipientExternalId,
        senderName,
        message,
      });
      return;
    }

    if (!admin.apps.length) {
      console.error('Firebase Admin SDK not initialized.');
      return;
    }
    if (!recipientToken) {
        console.log("No FCM token provided for recipient, skipping notification.");
        return;
    }

    try {
      const payload = {
        notification: {
          title: `New message from ${senderName}`,
          body: message || "Sent you a media file.",
        },
        token: recipientToken,
      };

      await admin.messaging().send(payload);
      console.log('Push notification sent successfully to token:', recipientToken);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
);


