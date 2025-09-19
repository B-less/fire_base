
'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM.
 *
 * - sendPushNotification - A function that sends a push notification.
 * - processMessageAndNotify - A flow that is triggered on a new message to send a notification.
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
    .describe("The FCM token of the device to send the notification to."),
  senderName: z.string().describe('The name of the user sending the message.'),
  message: z.string().describe('The content of the message.'),
});
export type PushNotificationInput = z.infer<typeof PushNotificationInputSchema>;

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
  async ({ recipientToken, senderName, message }) => {
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


const NewMessageSchema = z.object({
    content: z.string(),
    sender: z.string(),
    senderName: z.string(),
    recipientFcmToken: z.string().optional(),
    isGenerating: z.boolean().optional(),
});

ai.defineFlow(
  {
    name: 'processMessageAndNotify',
    inputSchema: NewMessageSchema,
    outputSchema: z.void(),
    trigger: {
      type: 'firebase',
      firebase: {
        eventType: 'google.firebase.database.ref.v1.written',
        // This path needs to match where your messages are stored.
        // The {conversationId} and {messageId} are wildcards.
        ref: 'messages/{conversationId}/{messageId}',
      },
    },
  },
  async (message) => {
    // The `message` object here is the data written to the database.
    if (!message.recipientFcmToken || message.isGenerating === true) {
      // No token or it's a temporary generation message, so don't send a notification.
      return;
    }

    await sendPushNotification({
      recipientToken: message.recipientFcmToken,
      senderName: message.senderName,
      message: message.content,
    });
  }
);
