'use server';
/**
 * @fileOverview A flow for sending push notifications via FCM.
 *
 * - sendPushNotification - A function that sends a push notification.
 * - PushNotificationInput - The input type for the sendPushNotification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

const PushNotificationInputSchema = z.object({
  recipientId: z.string().describe("The phone number of the user to send the notification to."),
  senderName: z.string().describe("The name of the user sending the message."),
  message: z.string().describe("The content of the message."),
});
export type PushNotificationInput = z.infer<typeof PushNotificationInputSchema>;


// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        console.log("Firebase Admin initialized successfully.");
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}


export async function sendPushNotification(input: PushNotificationInput): Promise<void> {
  return sendPushNotificationFlow(input);
}


const sendPushNotificationFlow = ai.defineFlow(
  {
    name: 'sendPushNotificationFlow',
    inputSchema: PushNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ recipientId, senderName, message }) => {
    
    if (!admin.apps.length) {
      console.error("Firebase Admin SDK not initialized.");
      return;
    }

    try {
        const db = admin.database();
        const userRef = db.ref(`users/${recipientId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData && userData.fcmToken) {
            const fcmToken = userData.fcmToken;

            const payload = {
                notification: {
                    title: `New message from ${senderName}`,
                    body: message,
                    icon: '/icon-192x192.png',
                },
                token: fcmToken,
            };

            await admin.messaging().send(payload);
            console.log('Push notification sent successfully to:', recipientId);

        } else {
            console.log('No FCM token found for user:', recipientId);
        }

    } catch (error) {
        console.error('Error sending push notification:', error);
    }
  }
);
