
# Project Files

This file contains the full content of every file in the project. You can use this to reconstruct the project on your local machine.

---
---
---

# File: .env

````

````

---

# File: README.md

````md
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
````

---

# File: apphosting.yaml

````yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1
````

---

# File: components.json

````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
````

---

# File: next.config.ts

````ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
````

---

# File: package.json

````json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/googleai": "^1.14.1",
    "@genkit-ai/next": "^1.14.1",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "africastalking": "^0.6.5",
    "bcryptjs": "^2.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "embla-carousel-react": "^8.6.0",
    "firebase": "^10.12.2",
    "firebase-admin": "^12.1.1",
    "genkit": "^1.14.1",
    "lucide-react": "^0.475.0",
    "next": "15.3.8",
    "next-themes": "^0.3.0",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "react-virtuoso": "^4.7.11",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "wav": "^1.0.2",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "genkit-cli": "^1.14.1",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
````

---

# File: src/ai/dev.ts

````ts
import { config } from 'dotenv';
config();

import '@/ai/flows/smart-reply-suggestions.ts';
import '@/ai/flows/image-generation-flow.ts';
import '@/ai/flows/conversational-ai-flow.ts';
import '@/ai/flows/push-notification-flow.ts';
import '@/ai/flows/video-generation-flow.ts';
import '@/ai/flows/otp-flow.ts';
````

---

# File: src/ai/flows/conversational-ai-flow.ts

````ts
'use server';

/**
 * @fileOverview A conversational AI agent.
 *
 * - generateChatResponse - A function that generates a response in a conversation.
 * - ChatInput - The input type for the generateChatResponse function.
 * - ChatOutput - The return type for the generateChatResponse function.
 */

import { ai } from '@/ai/genkit';
import { logAIUsage } from '@/lib/ai-logger';
import { z } from 'genkit';

const ChatInputSchema = z.object({
  message: z.string().describe('The user message to respond to.'),
  conversationHistory: z.string().describe('The conversation history between the user and the AI.'),
  userId: z.string().optional().describe('The ID of the user initiating the chat.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function generateChatResponse(input: ChatInput): Promise<ChatOutput> {
  return conversationalAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalAIPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are a helpful and friendly AI assistant. Continue the following conversation.

Conversation History:
{{{conversationHistory}}}

User Message:
"{{{message}}}"

Your Response:`,
});

const conversationalAIFlow = ai.defineFlow(
  {
    name: 'conversationalAIFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (output) {
      await logAIUsage('chat', { userId: input.userId });
    }
    return output!;
  }
);
````

---

# File: src/ai/flows/image-generation-flow.ts

````ts
'use server';

/**
 * @fileOverview An AI-powered image generation and editing flow.
 *
 * - generateImage - A function that handles image generation or editing.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { logAIUsage } from '@/lib/ai-logger';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the image to generate or edit.'),
  baseImage: z.string().optional().describe(
    "A base image to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. If not provided, a new image will be generated."
  ),
  userId: z.string().optional().describe('The ID of the user generating the image.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated or edited image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async ({ prompt, baseImage, userId }) => {
    let response;
    if (baseImage) {
      // Image-to-image generation
      response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          { media: { url: baseImage } },
          { text: `Edit the image based on this prompt: ${prompt}` },
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });
    } else {
      // Text-to-image generation
      response = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Generate an image of: ${prompt}`,
      });
    }

    if (!response.media) {
      throw new Error('Image generation failed.');
    }

    await logAIUsage('image', { userId: userId, prompt: prompt });
    
    return { imageUrl: response.media.url };
  }
);
````

---

# File: src/ai/flows/otp-flow.ts

````ts
'use server';

/**
 * @fileOverview OTP generation and verification flows using Africa's Talking.
 *
 * - sendOtp - Generates and sends an OTP to a user's phone number.
 * - verifyOtp - Verifies a user-submitted OTP.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, set, get, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import AfricasTalking from 'africastalking';
import type { User } from '@/lib/types';

const SendOtpInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to send the OTP to, in international format.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;


const africasTalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_APIKEY!,
  username: process.env.AFRICASTALKING_USERNAME!,
});

const sms = africasTalking.SMS;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async ({ phoneNumber }) => {
    // 1. Rate limit check (simple version: one OTP per minute per number)
    const otpRef = ref(db, `otps/${phoneNumber}`);
    const existingOtp = await get(otpRef);
    if (existingOtp.exists() && existingOtp.val().createdAt > Date.now() - 60 * 1000) {
        return { success: false, message: "An OTP was recently sent. Please wait a minute before trying again." };
    }
    
    // 2. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 3. Send via Africa's Talking
    try {
      const result = await sms.send({
        to: [phoneNumber],
        message: `Your ChirpChat verification code is: ${otp}. It will expire in 5 minutes.`
      });

      // Check if the status code for all recipients indicates success (less than 200)
       if (result.SMSMessageData.Recipients.every((r: any) => r.statusCode < 200)) {
         // 4. Save OTP to database
        await set(otpRef, {
            hashedOtp,
            expires,
            createdAt: Date.now()
        });

        return { success: true, message: 'OTP sent successfully.' };
      } else {
        console.error("Africa's Talking error:", result.SMSMessageData);
        return { success: false, message: 'Failed to send OTP. Please check the phone number.' };
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: 'An unexpected error occurred while sending the OTP.' };
    }
  }
);


const VerifyOtpInputSchema = z.object({
  phoneNumber: z.string(),
  otp: z.string().length(6),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

const VerifyOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.any().optional(),
  isNewUser: z.boolean().optional(),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;


export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
    return verifyOtpFlow(input);
}

const verifyOtpFlow = ai.defineFlow({
    name: 'verifyOtpFlow',
    inputSchema: VerifyOtpInputSchema,
    outputSchema: VerifyOtpOutputSchema,
}, async ({ phoneNumber, otp }) => {
    const otpRef = ref(db, `otps/${phoneNumber}`);
    const otpDataSnapshot = await get(otpRef);

    // 1. Check if OTP record exists
    if (!otpDataSnapshot.exists()) {
        return { success: false, message: 'Invalid or expired OTP. Please try again.' };
    }
    
    const otpData = otpDataSnapshot.val();

    // 2. Check for expiry
    if (otpData.expires < Date.now()) {
        await remove(otpRef); // Clean up expired OTP
        return { success: false, message: 'OTP has expired. Please request a new one.' };
    }
    
    // 3. Verify OTP hash
    const isValid = await bcrypt.compare(otp, otpData.hashedOtp);

    if (!isValid) {
        // Do not remove on invalid attempt to prevent brute-forcing
        return { success: false, message: 'The OTP entered is incorrect.' };
    }
    
    // OTP is valid, now check user status before finalizing
    const userRef = ref(db, `users/${phoneNumber}`);
    let userSnapshot = await get(userRef);
    let userData = userSnapshot.val() as User | null;
    let isNewUser = false;

    if(userData && userData.status?.account && userData.status.account !== 'active') {
        if(userData.status.account === 'banned') {
            await remove(otpRef); // Clean up OTP
            return { success: false, message: "This account has been banned." };
        }
         if(userData.status.account === 'disabled') {
            await remove(otpRef); // Clean up OTP
            return { success: false, message: "This account is currently disabled." };
        }
    }


    // 4. OTP is valid, clean up
    await remove(otpRef);

    // 5. Check if user exists, if not, create one
    if (!userSnapshot.exists()) {
        isNewUser = true;
        // Simple name generation for new user, will be updated on profile setup
        const name = `User${phoneNumber.slice(-4)}`;
        const newUser: Omit<User, 'phoneNumber'> = {
            name: name,
            status: { online: false, lastSeen: 0, account: 'active' },
            contacts: []
        };
        await set(userRef, newUser);
        userSnapshot = await get(userRef); // re-fetch user data
        userData = userSnapshot.val();
    }
    
    const user = { ...userData, phoneNumber };

    return { success: true, message: 'Phone number verified successfully.', user, isNewUser };
});

// Optional: A flow to clean up expired OTPs (can be scheduled to run periodically)
const cleanupExpiredOtpsFlow = ai.defineFlow(
  {
    name: 'cleanupExpiredOtpsFlow',
    // Could be triggered by a cron job
  },
  async () => {
    const otpsRef = ref(db, 'otps');
    const snapshot = await get(otpsRef);
    if (snapshot.exists()) {
      const now = Date.now();
      const updates: Record<string, null> = {};
      snapshot.forEach(childSnapshot => {
        if (childSnapshot.val().expires < now) {
          updates[childSnapshot.key!] = null;
        }
      });
      if(Object.keys(updates).length > 0) {
        // Using update instead of set to remove multiple children at once
        await update(ref(db, 'otps'), updates);
        console.log(`Cleaned up ${Object.keys(updates).length} expired OTPs.`);
      }
    }
  }
);
````

---

# File: src/ai/flows/push-notification-flow.ts

````ts
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
````

---

# File: src/ai/flows/smart-reply-suggestions.ts

````ts
'use server';

/**
 * @fileOverview A smart reply suggestion AI agent.
 *
 * - generateSmartReplies - A function that generates smart reply suggestions.
 * - SmartReplyInput - The input type for the generateSmartReplies function.
 * - SmartReplyOutput - The return type for the generateSmartReplies function.
 */

import {ai} from '@/ai/genkit';
import { logAIUsage } from '@/lib/ai-logger';
import {z} from 'genkit';

const SmartReplyInputSchema = z.object({
  message: z.string().describe('The incoming message to generate smart replies for.'),
  conversationHistory: z
    .string()
    .describe('The conversation history between the user and the contact.'),
  userId: z.string().optional().describe('The ID of the user for whom replies are generated.'),
});
export type SmartReplyInput = z.infer<typeof SmartReplyInputSchema>;

const SmartReplyOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of smart reply suggestions for the incoming message.'),
});
export type SmartReplyOutput = z.infer<typeof SmartReplyOutputSchema>;

export async function generateSmartReplies(
  input: SmartReplyInput
): Promise<SmartReplyOutput> {
  return smartReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartReplyPrompt',
  input: {schema: SmartReplyInputSchema},
  output: {schema: SmartReplyOutputSchema},
  prompt: `You are a smart reply suggestion generator. Given the incoming message and the conversation history, generate an array of 3 concise, natural-sounding smart reply suggestions.

Conversation History:
{{{conversationHistory}}}

Incoming Message:
"{{{message}}}"

Suggestions:`,
});

const smartReplyFlow = ai.defineFlow(
  {
    name: 'smartReplyFlow',
    inputSchema: SmartReplyInputSchema,
    outputSchema: SmartReplyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (output && output.suggestions.length > 0) {
      await logAIUsage('smart-reply', { userId: input.userId });
    }
    return output!;
  }
);
````

---

# File: src/ai/flows/video-generation-flow.ts

````ts
'use server';

/**
 * @fileOverview An AI-powered video generation and editing flow.
 *
 * - generateVideo - A function that handles video generation or editing.
 * - GenerateVideoInput - The input type for the generateVideo function.
 * - GenerateVideoOutput - The return type for the generateVideo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { logAIUsage } from '@/lib/ai-logger';

const GenerateVideoInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the video to generate or edit.'),
  baseMedia: z.string().optional().describe(
    "A base image or video to edit, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. If not provided, a new video will be generated from text."
  ),
  userId: z.string().optional().describe('The ID of the user generating the video.'),
});
export type GenerateVideoInput = z.infer<typeof GenerateVideoInputSchema>;

const GenerateVideoOutputSchema = z.object({
  videoUrl: z.string().describe('The data URI of the generated or edited video.'),
});
export type GenerateVideoOutput = z.infer<typeof GenerateVideoOutputSchema>;


export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  return generateVideoFlow(input);
}

const generateVideoFlow = ai.defineFlow(
  {
    name: 'generateVideoFlow',
    inputSchema: GenerateVideoInputSchema,
    outputSchema: GenerateVideoOutputSchema,
  },
  async ({ prompt, baseMedia, userId }) => {
    
    const promptParts = [{ text: prompt }];
    if (baseMedia) {
        const [header, data] = baseMedia.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        promptParts.push({ media: { url: baseMedia, contentType: mimeType } });
    }

    let { operation } = await ai.generate({
        model: googleAI.model('veo-2.0-generate-001'),
        prompt: promptParts,
        config: {
          durationSeconds: 5,
          aspectRatio: '16:9',
        },
    });

    if (!operation) {
        throw new Error('Expected the model to return an operation');
    }

    // Poll for completion
    while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        operation = await ai.checkOperation(operation);
    }

    if (operation.error) {
        throw new Error(`Failed to generate video: ${operation.error.message}`);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);

    if (!video || !video.media) {
        throw new Error('Failed to find the generated video in the operation result.');
    }

    await logAIUsage('video', { userId: userId, prompt: prompt });
    
    // The media URL from Veo is temporary and needs the API key to be downloaded.
    // For simplicity in this context, we will fetch it server-side and convert to a data URI.
    const fetch = (await import('node-fetch')).default;
    const videoDownloadResponse = await fetch(
      `${video.media.url}&key=${process.env.GEMINI_API_KEY}`
    );

    if (!videoDownloadResponse.ok || !videoDownloadResponse.body) {
        throw new Error(`Failed to download video from temporary URL: ${videoDownloadResponse.statusText}`);
    }
    
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const videoBase64 = Buffer.from(videoBuffer).toString('base64');
    const contentType = video.media.contentType || 'video/mp4';

    return { videoUrl: `data:${contentType};base64,${videoBase64}` };
  }
);
````

---

# File: src/ai/genkit.ts

````ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
````

---

# File: src/app/globals.css

````css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 25% 96.5%;
    --foreground: 222 84% 5%;
    --card: 210 40% 100%;
    --card-foreground: 222 84% 5%;
    --popover: 210 40% 100%;
    --popover-foreground: 222 84% 5%;
    --primary: 210 100% 56%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 91.4%;
    --secondary-foreground: 210 40% 9%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 210 40% 45%;
    --accent: 120 80% 85%;
    --accent-foreground: 120 60% 25%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 210 20% 86.5%;
    --input: 210 20% 93.5%;
    --ring: 210 100% 56%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222 84% 5%;
    --foreground: 210 40% 98%;
    --card: 222 84% 5%;
    --card-foreground: 210 40% 98%;
    --popover: 222 84% 5%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222 84% 5%;
    --secondary: 210 40% 14.9%;
    --secondary-foreground: 210 40% 98%;
    --muted: 210 40% 14.9%;
    --muted-foreground: 210 40% 63.9%;
    --accent: 120 80% 85%;
    --accent-foreground: 120 60% 25%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 210 40% 14.9%;
    --input: 210 40% 14.9%;
    --ring: 210 40% 98%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .message-in {
    animation: message-in-animation 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
  }

  @keyframes message-in-animation {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
````

---

# File: src/app/layout.tsx

````tsx
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { PT_Sans } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});


export const metadata: Metadata = {
  title: 'ChirpChat',
  description: 'A modern chat application',
  manifest: '/manifest.json',
  icons: {
    icon: '/robot-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("font-body antialiased", ptSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
````

---

# File: src/app/login/page.tsx

````tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Flame, Loader2 } from 'lucide-react';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { sendOtp, verifyOtp } from '@/ai/flows/otp-flow';

type LoginStep = 'phone' | 'otp';

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.code === value);
    if (selectedCountry) {
      setCountry(selectedCountry);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const trimmedPhoneNumber = phoneNumber.trim();

    if (!trimmedPhoneNumber) {
        toast({ title: "Phone Number Required", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    // Validate phone number against country pattern
    if (country.pattern && !country.pattern.test(trimmedPhoneNumber)) {
        toast({ 
            title: "Invalid Phone Number", 
            description: `Please enter a valid ${country.name} phone number.`,
            variant: "destructive" 
        });
        setIsLoading(false);
        return;
    }

    const fullPhoneNumber = `${country.dial_code}${trimmedPhoneNumber}`;

    try {
        const result = await sendOtp({ phoneNumber: fullPhoneNumber });
        if (result.success) {
            toast({ title: "OTP Sent", description: "A verification code has been sent to your phone." });
            setStep('otp');
        } else {
            toast({ title: "Failed to Send OTP", description: result.message, variant: "destructive" });
        }
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otp.length !== 6) {
        toast({ title: "Invalid OTP", description: "Please enter the 6-digit code.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const fullPhoneNumber = `${country.dial_code}${phoneNumber.trim()}`;
    
    try {
      const result = await verifyOtp({ phoneNumber: fullPhoneNumber, otp });

      if (result.success && result.user) {
        toast({ title: "Login Successful", description: "Welcome to ChirpChat!" });
        login(result.user.phoneNumber, result.user.name);
        
        if (result.isNewUser) {
          router.push('/profile-setup');
        } else {
          router.push('/');
        }
      } else {
        toast({ title: "Login Failed", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
       toast({ title: "Error", description: error.message || "An error occurred during verification.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    setStep('phone');
    setOtp('');
  }

  const renderPhoneStep = () => (
    <form onSubmit={handleSendOtp} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
                <Select value={country.code} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue>
                    <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.dial_code}</span>
                    </span>
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.name} ({c.dial_code})</span>
                        </span>
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="flex-1"
                />
            </div>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Sending Code...' : 'Send Code'}
        </Button>
    </form>
  );

  const renderOtpStep = () => (
     <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                required
                className="text-center text-lg tracking-[0.5em]"
            />
        </div>
        <div className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </Button>
            <Button variant="link" size="sm" onClick={handleBack} className="text-muted-foreground">
                Back
            </Button>
        </div>
    </form>
  );

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Flame className="h-8 w-8 text-primary-foreground" />
             </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 'phone' ? 'Welcome!' : 'Enter Code'}
            </CardTitle>
          <CardDescription>
            {step === 'phone' ? 'Sign in or create an account with your phone number.' : `We sent a code to ${country.dial_code}${phoneNumber}`}
            </CardDescription>
        </CardHeader>
        <CardContent>
            {step === 'phone' ? renderPhoneStep() : renderOtpStep()}
        </CardContent>
        <CardFooter className="flex-col items-center justify-center text-xs text-center text-muted-foreground pt-4">
             <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
````

---

# File: src/app/page.tsx

````tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ChatContainer } from '@/components/chat-container';
import { Skeleton } from '@/components/ui/skeleton';
import SettingsPage from '@/app/settings/page';

function LoadingSkeleton() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="flex h-full w-full max-w-7xl items-center gap-4 p-4">
        <Skeleton className="hidden h-[80%] w-1/3 rounded-2xl md:block" />
        <Skeleton className="h-[80%] w-full rounded-2xl md:w-2/3" />
      </div>
    </main>
  );
}

function HomePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSettings = searchParams.get('page') === 'settings';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingSkeleton />;
  }
  
  const handleBackToChat = () => {
    router.push('/');
  }

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="h-full w-full max-w-7xl rounded-none border-0 bg-card shadow-none md:rounded-2xl md:border md:shadow-lg overflow-hidden">
        {showSettings ? (
            <SettingsPage onBack={handleBackToChat} />
        ) : (
            <ChatContainer />
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}
````

---

# File: src/app/profile-setup/page.tsx

````tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from "firebase/database";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage } from '@/lib/utils';


export default function ProfileSetupPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <main className="flex h-screen w-full items-center justify-center bg-background p-4">
        <Loader2 className="h-10 w-10 animate-spin" />
      </main>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedImage = await compressImage(file);
        setProfilePicture(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        toast({
          title: "Image Error",
          description: "Could not process the image.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast({ title: "Name is required", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const userRef = ref(db, `users/${user.phoneNumber}`);
      const updates: any = { name: trimmedName };
      if (profilePicture) {
        updates.profilePicture = profilePicture;
      }
      
      await update(userRef, updates);

      // Update auth context with the new name
      login(user.phoneNumber, trimmedName);
      
      toast({ title: "Profile created!", description: "Welcome to ChirpChat!" });
      router.push('/');
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Save failed", description: "Could not save your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Let's set up your name and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <Avatar className="h-32 w-32 text-5xl">
                            <AvatarImage src={profilePicture ?? undefined} alt="Profile Picture" />
                            <AvatarFallback>
                                {isUploading ? <Loader2 className="h-12 w-12 animate-spin" /> : <UserIcon className="h-12 w-12 text-muted-foreground" />}
                            </AvatarFallback>
                        </Avatar>
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white font-semibold"
                            disabled={isUploading}
                        >
                            {isUploading ? 'Uploading...' : 'Choose Photo'}
                        </button>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleProfilePictureChange}
                            className="hidden"
                            accept="image/*"
                            disabled={isUploading}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? 'Saving...' : 'Continue to ChirpChat'}
                </Button>
            </form>
        </CardContent>
      </Card>
    </main>
  );
}
````

---

# File: src/app/robot-icon.tsx

````tsx
import { SVGProps } from "react";

export function RobotIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    )
}
````

---

# File: src/app/settings/page.tsx

````tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User as UserIcon, LogOut, ArrowLeft, Sparkles, Moon, Sun } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update, get } from "firebase/database";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { compressImage } from '@/lib/utils';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SettingsPageProps {
    onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const { user, login, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  // Fetch full user data on component mount
  useEffect(() => {
    if (user?.phoneNumber) {
      const userRef = ref(db, `users/${user.phoneNumber}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setName(userData.name || '');
          setProfilePicture(userData.profilePicture || null);
        }
      });
    }
  }, [user?.phoneNumber]);

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedImage = await compressImage(file);
        setProfilePicture(compressedImage);
      } catch (error) {
        console.error("Error compressing image:", error);
        toast({
          title: "Image Error",
          description: "Could not process the selected image. Please try another one.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast({ title: "Name is required", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    try {
      const userRef = ref(db, `users/${user.phoneNumber}`);
      const updates: any = { name: trimmedName };
      if (profilePicture) {
        updates.profilePicture = profilePicture;
      }
      
      await update(userRef, updates);

      // Update auth context
      login(user.phoneNumber, trimmedName);
      
      toast({ title: "Settings saved successfully!" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({ title: "Save failed", description: "Could not save your settings. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAIPictureGeneration = async (prompt: string) => {
    if(!prompt || !user) return;
    setIsUploading(true);
    try {
        const result = await generateImage({ prompt, userId: user.phoneNumber });
        setProfilePicture(result.imageUrl);
    } catch(error) {
        console.error("Error generating AI profile picture:", error);
        toast({ title: "AI Generation Failed", description: "Could not generate an image from that prompt.", variant: "destructive" });
    } finally {
        setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Profile Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
                <Avatar className="h-24 w-24 text-4xl">
                    <AvatarImage src={profilePicture ?? undefined} alt="Profile Picture" />
                    <AvatarFallback>
                        {isUploading ? <Loader2 className="h-10 w-10 animate-spin" /> : <UserIcon className="h-10 w-10 text-muted-foreground" />}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white text-xs font-semibold" disabled={isUploading}>Change</button>
                </div>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    accept="image/*"
                    disabled={isUploading}
                />
            </div>
            
            <div className="space-y-2 flex-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                 <GenerateAIPictureDialog onGenerate={handleAIPictureGeneration} isLoading={isUploading}/>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Appearance</h2>
            <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon/> : <Sun/>}
                    <Label htmlFor="dark-mode-switch">Dark Mode</Label>
                </div>
                <Switch 
                    id="dark-mode-switch"
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
            </div>
        </div>

        {/* Account Section */}
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Account</h2>
             <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
            </Button>
        </div>
      </div>
      
      <footer className="p-4 border-t mt-auto">
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
      </footer>
    </div>
  );
}


function GenerateAIPictureDialog({ onGenerate, isLoading }: { onGenerate: (prompt: string) => void, isLoading: boolean }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');

  const handleGenerateClick = () => {
    onGenerate(prompt);
    setOpen(false);
    setPrompt('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs justify-start p-0 h-auto" disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Profile Picture</DialogTitle>
          <DialogDescription>
            Describe the profile picture you want to create. Be creative!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
            <Label htmlFor="ai-prompt">Prompt</Label>
            <Input 
                id="ai-prompt"
                placeholder="e.g., A watercolor painting of a fox reading a book"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
        </div>
        <DialogFooter>
          <Button onClick={handleGenerateClick} disabled={!prompt.trim() || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
````

---

# File: src/components/admin-dashboard.tsx

````tsx
'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminDashboardProps {
    onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center gap-4 p-4 border-b">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to the Admin Dashboard</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Admin functionality is under construction.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
````

---

# File: src/components/broadcast-banner.tsx

````tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, query, limitToLast, off } from 'firebase/database';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from './ui/button';
import { Megaphone, X } from 'lucide-react';
import type { BroadcastMessage } from '@/lib/types';
import { cn } from '@/lib/utils';


export function BroadcastBanner() {
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const handleDismiss = () => {
    if (broadcast) {
      localStorage.setItem(`dismissed_broadcast_${broadcast.id}`, 'true');
    }
    setIsVisible(false);
  };

  useEffect(() => {
    const broadcastsRef = query(ref(db, 'broadcasts'), limitToLast(1));

    const listener = onValue(broadcastsRef, (snapshot) => {
      if (snapshot.exists()) {
        const broadcastsData = snapshot.val();
        const broadcastKey = Object.keys(broadcastsData)[0];
        const latestBroadcast = { id: broadcastKey, ...broadcastsData[broadcastKey]};
        
        // Check if this broadcast has been dismissed before
        const dismissed = localStorage.getItem(`dismissed_broadcast_${latestBroadcast.id}`);
        if (!dismissed) {
          setBroadcast(latestBroadcast);
          setIsVisible(true);
        }
      }
    });

    return () => {
      off(broadcastsRef, 'value', listener);
    };
  }, []);
  
  useEffect(() => {
    if(isVisible && broadcast) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 15000); // Auto-dismiss after 15 seconds

      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, broadcast]);


  if (!broadcast || !isVisible) {
    return null;
  }

  return (
    <div className={cn("p-2", !isVisible && "hidden")}>
        <Alert className="flex items-center justify-between bg-primary/10 border-primary/30 text-primary-foreground">
           <div className="flex items-center gap-3">
             <Megaphone className="h-5 w-5 text-primary flex-shrink-0" />
             <AlertDescription className="text-sm text-primary">{broadcast.message}</AlertDescription>
           </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary/80 hover:text-primary hover:bg-primary/20" onClick={handleDismiss}>
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
            </Button>
        </Alert>
    </div>
  );
}
````

---

# File: src/components/chat-container.tsx

````tsx
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Contact, Message, User } from '@/lib/types';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, get, child, remove, query, limitToLast, off, update, type ThenableReference } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { BroadcastBanner } from './broadcast-banner';
import { RobotIcon } from '@/app/robot-icon';

const AI_CONTACT_ID = 'ai-assistant';


// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function ChatContainer() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [messageCache, setMessageCache] = useState<Record<string, Record<string, Message>>>({});
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();


  // Fetch all users and set up listeners for last messages
  useEffect(() => {
    if (!currentUser?.phoneNumber) return;

    setIsLoading(true);
    const usersRef = ref(db, 'users');
    
    const usersListener = onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val() || {};
        setAllUsers(usersData);
        setIsLoading(false);
    });

    return () => {
      off(usersRef, 'value', usersListener);
    };
  }, [currentUser?.phoneNumber]);

  useEffect(() => {
    if (!currentUser?.phoneNumber) return;
    
    // This effect runs once when the current user is available.
    // It sets up a listener for the current user's contact list.
    const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);

    const contactsListener = onValue(currentUserContactsRef, (snapshot) => {
        const currentUserContacts: string[] = snapshot.val() || [];
        const contactIds = [...currentUserContacts, AI_CONTACT_ID];

        // This inner function will set up listeners for a given list of contacts
        const setupListeners = (ids: string[]) => {
            const unsubscribers = ids.flatMap(contactId => {
                if (!currentUser?.phoneNumber) return [];
                const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
                const messagesRef = query(ref(db, `messages/${conversationKey}`), limitToLast(1));
                const unreadRef = ref(db, `messages/${conversationKey}`);

                const lastMsgListener = onValue(messagesRef, (msgSnapshot) => {
                    if (msgSnapshot.exists()) {
                        const messagesData = msgSnapshot.val();
                        const lastMsgKey = Object.keys(messagesData)[0];
                        const lastMsg = messagesData[lastMsgKey];
                        setLastMessages(prev => ({ ...prev, [conversationKey]: lastMsg as Message }));
                    }
                }, () => { /* handle error */ });

                const unreadListener = onValue(unreadRef, (unreadSnapshot) => {
                    let unread = 0;
                    if (unreadSnapshot.exists() && currentUser?.phoneNumber) {
                        unreadSnapshot.forEach((childSnapshot) => {
                            const msg = childSnapshot.val();
                            if (msg.sender !== currentUser.phoneNumber && msg.status !== 'read' && !msg.isGenerating) {
                                unread++;
                            }
                        });
                    }
                    setUnreadCounts(prev => ({ ...prev, [conversationKey]: unread }));
                }, () => { /* handle error */ });

                const listenerRefs = [
                    { ref: messagesRef, listener: lastMsgListener, type: 'value' as const },
                    { ref: unreadRef, listener: unreadListener, type: 'value' as const }
                ];
                
                return listenerRefs;
            });

            return () => {
                unsubscribers.forEach(({ ref, listener, type }) => off(ref, type, listener));
            };
        };

        // Setup listeners for the initial contact list
        const cleanupListeners = setupListeners(contactIds);
        
        // Return a cleanup function that will be called when the component unmounts
        // or when the user changes.
        return () => {
            cleanupListeners();
        };
    });

    return () => {
        // Cleanup the listener for the contact list itself.
        off(currentUserContactsRef, 'value', contactsListener);
    };
  }, [currentUser?.phoneNumber]);


  const aiChatState: Contact = useMemo(() => {
    if (!currentUser) return {} as Contact; // Should not happen if logged in
    const conversationKey = getConversationKey(currentUser.phoneNumber, AI_CONTACT_ID);
    const lastMessage = lastMessages[conversationKey];
    
    return {
        id: AI_CONTACT_ID,
        name: 'AI Assistant',
        avatar: '/robot-icon.svg',
        online: true,
        lastMessage: lastMessage?.content || 'Ask me to generate media!',
        lastMessageTime: lastMessage?.timestamp || new Date(Date.now() - 60000).toISOString(),
        unreadCount: unreadCounts[conversationKey] || 0,
    };
  }, [currentUser, lastMessages, unreadCounts]);

  const userContacts: Contact[] = useMemo(() => {
    if (!currentUser?.phoneNumber || !Object.keys(allUsers).length) {
      return [];
    }

    const currentUserData = allUsers[currentUser.phoneNumber];
    if (!currentUserData || !currentUserData.contacts) {
      return [];
    }

    return currentUserData.contacts
      .map((contactId: string) => {
        const contactUser = allUsers[contactId];
        if (!contactUser) return null;

        const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
        const lastMessage = lastMessages[conversationKey];

        return {
          id: contactUser.phoneNumber,
          name: contactUser.name,
          avatar: contactUser.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`,
          online: contactUser.status?.online || false,
          lastSeen: contactUser.status?.lastSeen,
          lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : (lastMessage.video ? "Video" : ''))) : 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || '',
          unreadCount: unreadCounts[conversationKey] || 0, 
          isTyping: typingStatus[contactUser.phoneNumber] || false,
        };
      })
      .filter((c): c is Contact => c !== null);
  }, [currentUser?.phoneNumber, allUsers, lastMessages, typingStatus, unreadCounts]);


  // Listen for messages and typing status for the active conversation
  useEffect(() => {
      if (!activeContactId || !currentUser?.phoneNumber) return;
      
      const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
      
      if (!messageCache[conversationKey]) {
        setIsMessagesLoading(true);
      }

      const messagesRef = ref(db, `messages/${conversationKey}`);
      const typingRef = activeContactId !== AI_CONTACT_ID ? ref(db, `conversations/${conversationKey}/typing/${activeContactId}`) : null;
      
      const messagesListener = onValue(messagesRef, (snapshot) => {
          const messagesData = snapshot.val() || {};
          // Update the cache for this specific conversation
          setMessageCache(prev => ({...prev, [conversationKey]: messagesData}));

          // Mark messages as read
          const updates: Record<string, any> = {};
          Object.entries(messagesData).forEach(([key, message]: [string, any]) => {
              if (message.sender === activeContactId && message.status !== 'read') {
                  updates[`messages/${conversationKey}/${key}/status`] = 'read';
              }
          });

          if (Object.keys(updates).length > 0) {
              update(ref(db), updates);
          }
          setIsMessagesLoading(false);
      }, (error) => {
          console.error(`Error fetching messages for ${conversationKey}:`, error);
          setIsMessagesLoading(false);
      });
      
      let typingListener: any;
      if (typingRef) {
        typingListener = onValue(typingRef, (snapshot) => {
            const isOpponentTyping = snapshot.val() || false;
            setTypingStatus(prev => ({ ...prev, [activeContactId]: isOpponentTyping }));
        });
      }
      
      return () => {
          off(messagesRef, 'value', messagesListener);
          if (typingRef && typingListener) {
            off(typingRef, 'value', typingListener);
          }
      };
  }, [activeContactId, currentUser?.phoneNumber]);

  const handleSelectContact = (contactId: string) => {
    setActiveContactId(contactId);
    setSmartReplies([]);
  };

  const handleAddContact = async (user: User) => {
    if (!currentUser) return;
    
    if(userContacts.some(c => c.id === user.phoneNumber)) {
        handleSelectContact(user.phoneNumber);
        return;
    }
    
    // Add new contact to current user's list
    const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
    const currentUserSnapshot = await get(currentUserContactsRef);
    const currentUserContacts = currentUserSnapshot.val() || [];
    if (!currentUserContacts.includes(user.phoneNumber)) {
      await set(currentUserContactsRef, [...currentUserContacts, user.phoneNumber]);
    }

    // Add current user to the new contact's list
    const newContactContactsRef = ref(db, `users/${user.phoneNumber}/contacts`);
    const newContactSnapshot = await get(newContactContactsRef);
    const newContactCurrentContacts = newContactSnapshot.val() || [];
    if (!newContactCurrentContacts.includes(currentUser.phoneNumber)) {
        await set(newContactContactsRef, [...newContactCurrentContacts, currentUser.phoneNumber]);
    }
    
    handleSelectContact(user.phoneNumber);
  };
  
  const handleBackToContacts = () => {
    setActiveContactId(null);
  };

  const handleShowSettings = () => {
    router.push('/?page=settings');
  };
  
   const handleDeleteContact = async (contactId: string) => {
    if (!currentUser) return;
    
    try {
        // Remove contact from current user's list
        const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
        const currentUserSnapshot = await get(currentUserContactsRef);
        const currentUserContacts = (currentUserSnapshot.val() || []).filter((id: string) => id !== contactId);
        await set(currentUserContactsRef, currentUserContacts);
        
        // Remove current user from the other contact's list
        const otherUserContactsRef = ref(db, `users/${contactId}/contacts`);
        const otherUserSnapshot = await get(otherUserContactsRef);
        const otherUserContacts = (otherUserSnapshot.val() || []).filter((id: string) => id !== currentUser.phoneNumber);
        await set(otherUserContactsRef, otherUserContacts);

        if (activeContactId === contactId) {
            setActiveContactId(null);
        }

        toast({ title: "Chat Deleted", description: "The chat has been successfully deleted." });

    } catch (error) {
        console.error("Error deleting contact:", error);
        toast({ title: "Error", description: "Could not delete the chat. Please try again.", variant: "destructive" });
    }
   };

  const activeContactUser = useMemo(() => {
    if (!activeContactId) return null;
    if (activeContactId === AI_CONTACT_ID) return aiChatState;
    const user = allUsers[activeContactId];
    if (!user) return null;

    // Create a Contact object for the header, using last message data
    const conversationKey = getConversationKey(currentUser!.phoneNumber, activeContactId);
    const lastMessage = lastMessages[conversationKey];

    return {
        id: user.phoneNumber,
        name: user.name,
        avatar: user.profilePicture || `https://picsum.photos/seed/${activeContactId}/100/100`,
        online: user.status?.online || false,
        lastSeen: user.status?.lastSeen,
        isTyping: typingStatus[user.phoneNumber] || false,
        lastMessage: lastMessage?.content || '', // Not strictly needed for header
        lastMessageTime: lastMessage?.timestamp || '', // Not strictly needed for header
        unreadCount: 0,
    };
  }, [activeContactId, allUsers, aiChatState, currentUser, lastMessages, typingStatus]);


  const getSmartReplies = useCallback(async (contact: User, fullMessages: Message[]) => {
    if (!fullMessages.length || !currentUser || contact.phoneNumber === AI_CONTACT_ID) return;
    const lastMessage = fullMessages[fullMessages.length - 1];
    if (lastMessage.sender === currentUser.phoneNumber || lastMessage.isGenerating) return;

    const conversationHistory = fullMessages
      .slice(-10) // Use last 10 messages for context
      .filter(m => !m.isGenerating && m.content)
      .map((m) => `${m.sender === currentUser.phoneNumber ? 'User' : contact.name}: ${m.content}`)
      .join('\n');

    try {
      const result: SmartReplyOutput = await generateSmartReplies({
        message: lastMessage.content || '',
        conversationHistory: conversationHistory,
        userId: currentUser.phoneNumber,
      });
      setSmartReplies(result.suggestions);
    } catch (error) {
      console.error('Error generating smart replies:', error);
      setSmartReplies([]);
    }
  }, [currentUser]);
  
  const getAIResponse = useCallback(async (currentMessages: Message[]) => {
    if (!currentUser || activeContactId !== AI_CONTACT_ID) return;
    
    const conversationHistory = currentMessages
      .filter(m => !m.isGenerating && !m.image && m.content)
      .map(m => `${m.sender === currentUser.phoneNumber ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');


    const conversationKey = getConversationKey(currentUser.phoneNumber, AI_CONTACT_ID);
    const messagesRef = ref(db, `messages/${conversationKey}`);
    const loadingMessageRef = push(messagesRef);

    await set(loadingMessageRef, {
      content: "Thinking...",
      sender: AI_CONTACT_ID,
      timestamp: new Date().toISOString(),
      status: 'read',
      isGenerating: true,
    });
    
    const lastMessage = currentMessages[currentMessages.length - 1];

    try {
      const { response } = await generateChatResponse({
        message: lastMessage.content || "",
        conversationHistory,
        userId: currentUser.phoneNumber,
      });

      const aiMessage: Omit<Message, 'id'> = {
        content: response,
        sender: AI_CONTACT_ID,
        timestamp: new Date().toISOString(),
        status: 'read',
      };
      
      const newMessageRef = push(messagesRef, aiMessage);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
       const errorMessage: Omit<Message, 'id'> = {
        content: "Sorry, I couldn't process that request.",
        sender: AI_CONTACT_ID,
        timestamp: new Date().toISOString(),
        status: 'read',
      };
      const newErrorMessageRef = push(messagesRef);
      await set(newErrorMessageRef, errorMessage);
    } finally {
        const snapshot = await get(messagesRef);
        if (snapshot.exists()) {
            const messages = snapshot.val();
            for (const key in messages) {
                if (messages[key].isGenerating) {
                    await remove(ref(db, `messages/${conversationKey}/${key}`));
                }
            }
        }
    }
  }, [currentUser, activeContactId]);

  const handleSendMessage = (content: string, media?: string, isGenerating?: boolean): ThenableReference | undefined => {
    if (!activeContactId || !currentUser) return;

    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messagesRef = ref(db, `messages/${conversationKey}`);
    
    const recipient = allUsers[activeContactId];
    
    const dbMessage: Omit<Message, 'id' | 'db_key'> & {senderName: string, recipientFcmToken?: string} = {
      content,
      sender: currentUser.phoneNumber,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
      status: recipient?.status?.online ? 'delivered' : 'sent',
      ...(media && (media.startsWith('data:video') ? { video: media } : { image: media })),
      ...(isGenerating && { isGenerating }),
      ...(recipient?.fcmToken && { recipientFcmToken: recipient.fcmToken }),
    };
    
    const newMessageRef = push(messagesRef, dbMessage);

    const newMessages = [...currentChatMessages, { ...dbMessage, id: Date.now(), db_key: newMessageRef.key! }];

    if(activeContactId === AI_CONTACT_ID && dbMessage.content) {
      getAIResponse(newMessages);
    } else if (activeContactId !== AI_CONTACT_ID) {
      setSmartReplies([]);
    }

    return newMessageRef;
  };

  const handleUpdateMessage = (dbKey: string, content: string, media?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messageToUpdateRef = ref(db, `messages/${conversationKey}/${dbKey}`);
    
    const updatedMessage: any = { content: content };
    if (media !== undefined) {
      if (media.startsWith('data:video')) {
        updatedMessage.video = media;
        delete updatedMessage.image;
      } else {
        updatedMessage.image = media;
        delete updatedMessage.video;
      }
    }
    
    updatedMessage.isGenerating = isGenerating === true ? true : null;

    update(messageToUpdateRef, updatedMessage);
  }

  const handleDeleteMessage = (dbKey?: string) => {
    if (!activeContactId || !currentUser || !dbKey) {
        console.error("Cannot delete message without a database key.");
        return;
    }
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messageRef = ref(db, `messages/${conversationKey}/${dbKey}`);
    remove(messageRef);
  }

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTypingChange = (isTyping: boolean) => {
    if (!currentUser || !activeContactId || activeContactId === AI_CONTACT_ID) return;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const typingRef = ref(db, `conversations/${conversationKey}/typing/${currentUser.phoneNumber}`);
    
    if (isTyping) {
        set(typingRef, true);
        typingTimeoutRef.current = setTimeout(() => {
            set(typingRef, null); // Use null to remove from DB
        }, 2000); // 2 second timeout
    } else {
        set(typingRef, null);
    }
  };
  
  const currentChatMessages = useMemo(() => {
    if (!activeContactId || !currentUser) return [];
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const cachedMessages = messageCache[conversationKey] || {};

    return Object.entries(cachedMessages)
      .map(([key, value]) => ({ ...value, db_key: key, id: new Date(value.timestamp).getTime() }))
      .sort((a,b) => a.id - b.id);
  }, [activeContactId, currentUser, messageCache]);

  useEffect(() => {
    if (activeContactUser && currentChatMessages.length > 0) {
      if (activeContactUser.id !== AI_CONTACT_ID) {
        const fullContactUser = allUsers[activeContactUser.id];
        if (fullContactUser) {
           getSmartReplies(fullContactUser, currentChatMessages);
        }
      }
    }
  }, [currentChatMessages, getSmartReplies, allUsers, activeContactUser]);


  const NoContactsView = () => (
    <div className="hidden h-full flex-col items-center justify-center bg-muted/50 md:flex">
      <div className='flex flex-col items-center gap-4'>
         <div className='flex items-center justify-center w-24 h-24 bg-background rounded-full border-4 border-dashed border-muted-foreground/20'>
            <Plus className='w-12 h-12 text-muted-foreground/40' />
         </div>
         <p className="text-muted-foreground">No chats yet. Add a new contact to start messaging!</p>
      </div>
    </div>
  )
  
  return (
    <div className="flex h-full w-full flex-col">
       <BroadcastBanner />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`h-full w-full flex-shrink-0 transition-all duration-300 md:w-2/5 md:flex-shrink-0 lg:w-1/3 xl:w-1/4 ${
            activeContactId ? 'hidden md:flex' : 'flex'
          } flex-col`}
        >
          <ContactList
            contacts={[aiChatState, ...userContacts]}
            activeContactId={activeContactId}
            onSelectContact={handleSelectContact}
            onAddContact={handleAddContact}
            onDeleteContact={handleDeleteContact}
            onShowSettings={handleShowSettings}
            isLoading={isLoading}
          />
        </aside>
        <section
          className={`h-full flex-1 transition-all duration-300 ${
            activeContactId ? 'flex' : 'hidden md:flex'
          } flex-col`}
        >
          {activeContactId ? (
            <ChatPanel
              key={activeContactId}
              contactId={activeContactId}
              messages={currentChatMessages}
              onSendMessage={handleSendMessage}
              onUpdateMessage={handleUpdateMessage}
              onDeleteMessage={handleDeleteMessage}
              onBack={handleBackToContacts}
              smartReplies={smartReplies}
              setSmartReplies={setSmartReplies}
              isLoading={isMessagesLoading}
              onTypingChange={handleTypingChange}
            />
          ) : (
            <NoContactsView />
          )}
        </section>
      </div>
    </div>
  );
}
````

---

# File: src/components/chat-header.tsx

````tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, MoreVertical, Phone, User as UserIcon, Loader2 } from 'lucide-react';
import type { Contact, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { useAuth } from '@/context/auth-context';
import { RobotIcon } from '@/app/robot-icon';


interface ChatHeaderProps {
  contactId: string;
  onBack: () => void;
}

const AI_CONTACT_ID = 'ai-assistant';

export function ChatHeader({ contactId, onBack }: ChatHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [contactUser, setContactUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  const isAiAssistant = contactId === AI_CONTACT_ID;

  useEffect(() => {
    if (isAiAssistant || !contactId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const userRef = ref(db, `users/${contactId}`);
    const listener = onValue(userRef, (snapshot) => {
        if(snapshot.exists()) {
            setContactUser({ ...snapshot.val(), phoneNumber: contactId });
        }
        setIsLoading(false);
    });

    return () => off(userRef, 'value', listener);
  }, [contactId, isAiAssistant]);
  
  
  const contact: Contact | null = useMemo(() => {
    if (isAiAssistant) {
        return {
            id: AI_CONTACT_ID,
            name: 'AI Assistant',
            avatar: '/robot-icon.svg',
            online: true,
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
        }
    }
    if (!contactUser) return null;

    return {
        id: contactUser.phoneNumber,
        name: contactUser.name,
        avatar: contactUser.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`,
        online: contactUser.status?.online || false,
        lastSeen: contactUser.status?.lastSeen,
        lastMessage: '', // Not needed for header
        lastMessageTime: '', // Not needed for header
        unreadCount: 0,
    }
  }, [contactUser, contactId, isAiAssistant]);


  if (isLoading) {
    return (
       <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                </div>
                <div>
                    <div className="h-4 w-24 rounded-md bg-muted animate-pulse mb-1" />
                    <div className="h-3 w-16 rounded-md bg-muted animate-pulse" />
                </div>
            </div>
         </div>
         <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
       </div>
    )
  }

  if (!contact) {
    // Render a minimal state if contact not found after loading
    return (
       <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <p className="text-muted-foreground">Chat not found</p>
         </div>
       </div>
    )
  }
  
  const lastSeenText = () => {
    if(contact.online) return 'Online';
    if(isAiAssistant) return 'Always available';
    if(contact.lastSeen && typeof contact.lastSeen === 'number') {
        return `Last seen ${formatDistanceToNow(new Date(contact.lastSeen), { addSuffix: true })}`;
    }
    return 'Last seen recently';
  }

  return (
    <div className="flex items-center justify-between border-b bg-card p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-3 text-left" disabled={isAiAssistant}>
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} alt={contact.name} />
                  <AvatarFallback>{isAiAssistant ? <RobotIcon className="h-6 w-6"/> : contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {contact.online && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{contact.name}</h2>
                <p className="text-sm text-muted-foreground">
                   {contact.isTyping ? <span className="italic text-primary">typing...</span> : lastSeenText()}
                </p>
              </div>
            </button>
          </DialogTrigger>
          {!isAiAssistant && (
            <DialogContent>
              <DialogHeader className="items-center text-center">
                 <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={contact.avatar} alt={contact.name} />
                    <AvatarFallback className="text-4xl">{contact.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <DialogTitle className="text-2xl">{contact.name}</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="text-base font-medium">{contact.id}</p>
                    </div>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>

      </div>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-5 w-5 text-muted-foreground" />
      </Button>
    </div>
  );
}
````

---

# File: src/components/chat-input.tsx

````tsx
import { Paperclip, SendHorizontal, Sparkles, Video, ImageIcon } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: (type: 'text' | 'image' | 'video') => void;
  onFileSelect: (url: string) => void;
  isAIChat?: boolean;
  onTypingChange: (isTyping: boolean) => void;
}

export function ChatInput({ value, onChange, onSend, onFileSelect, isAIChat = false, onTypingChange }: ChatInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    onTypingChange(true);
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend('text');
      onTypingChange(false);
    }
  };

  const handleSendClick = (type: 'text' | 'image' | 'video') => {
      onSend(type);
      onTypingChange(false);
  }
  
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        if (file.type.startsWith('image/')) {
          const compressedDataUrl = await compressImage(file);
          onFileSelect(compressedDataUrl);
        } else {
          // For non-image files (like videos), read as data URL without compression
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            onFileSelect(dataUrl);
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        toast({
          title: "File Error",
          description: "Could not process the selected file. Please try another one.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
    // Reset file input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };


  const placeholder = isAIChat
    ? "Ask me to generate an image or video..."
    : "Type a message...";

  return (
    <div className="relative rounded-lg border bg-card p-2 shadow-sm flex flex-col">
       {isAIChat && (
        <div className="flex justify-center gap-2 mb-2 px-2">
            <Button variant="outline" size="sm" onClick={() => handleSendClick('image')} disabled={!value.trim()}>
                <ImageIcon className="mr-2 h-4 w-4" /> Generate Image
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSendClick('video')} disabled={!value.trim()}>
                <Video className="mr-2 h-4 w-4" /> Generate Video
            </Button>
        </div>
       )}
      <div className="relative flex items-center">
        <Textarea
          placeholder={placeholder}
          className="min-h-[48px] resize-none border-0 bg-transparent p-2 pr-20 shadow-none focus-visible:ring-0"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onBlur={() => onTypingChange(false)}
          rows={1}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*"
          disabled={isUploading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {!isAIChat && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleImageUploadClick} disabled={isUploading}>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share Media</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={() => handleSendClick('text')}
            disabled={!value.trim() && !isAIChat}
          >
              <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
````

---

# File: src/components/chat-panel.tsx

````tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Contact, Message, User } from '@/lib/types';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { SmartReplySuggestions } from './smart-reply-suggestions';
import { generateImage } from '@/ai/flows/image-generation-flow';
import { generateVideo } from '@/ai/flows/video-generation-flow';
import { useToast } from '@/hooks/use-toast';
import { MediaStudio } from './media-studio';
import type { ThenableReference } from 'firebase/database';
import { useAuth } from '@/context/auth-context';
import { update } from 'firebase/database';

interface ChatPanelProps {
  contactId: string;
  messages: Message[];
  onSendMessage: (content: string, media?: string, isGenerating?: boolean) => ThenableReference | undefined;
  onUpdateMessage: (dbKey: string, content: string, media?: string, isGenerating?: boolean) => void;
  onDeleteMessage: (dbKey?: string) => void;
  onBack: () => void;
  smartReplies: string[];
  setSmartReplies: (replies: string[]) => void;
  isLoading?: boolean;
  onTypingChange: (isTyping: boolean) => void;
}

export function ChatPanel({ 
  contactId,
  messages, 
  onSendMessage, 
  onUpdateMessage, 
  onDeleteMessage, 
  onBack, 
  smartReplies, 
  setSmartReplies, 
  isLoading = false, 
  onTypingChange 
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAIChat = contactId === 'ai-assistant';
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleImagine = async (prompt: string, baseImage?: string) => {
    setInputText('');
    setSmartReplies([]);
    
    // Create a temporary message and update it
    const messageRef = onSendMessage(`Generating image: "${prompt}"...`, baseImage, true)
    if (!messageRef || !messageRef.key) {
        toast({
            title: "Error",
            description: "Could not send message. Please try again.",
            variant: "destructive",
        });
        return;
    }
    
    const messageDbKey = messageRef.key;
    
    try {
      const result = await generateImage({ prompt, baseImage, userId: user?.phoneNumber });
      if(isMounted.current) {
        onUpdateMessage(messageDbKey, prompt, result.imageUrl, false);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      const failMessage = `Failed to generate image for prompt: "${prompt}"`;
      if(isMounted.current) {
        onUpdateMessage(messageDbKey, failMessage, baseImage, false);
        toast({
          title: "Image Generation Failed",
          description: "Sorry, I couldn't create an image for that prompt. Please try another one.",
          variant: "destructive",
        });
      }
    }
  }

  const handleVideoGenerate = async (prompt: string, baseMedia?: string) => {
    setInputText('');
    setSmartReplies([]);
    
    // For regular chats, create a temp message
    const messageRef = onSendMessage(`Generating video: "${prompt}"...`, baseMedia, true);
    if (!messageRef || !messageRef.key) {
      toast({
          title: "Error",
          description: "Could not send message. Please try again.",
          variant: "destructive",
      });
      return;
    }
    
    const messageDbKey = messageRef.key;
    
    try {
      const result = await generateVideo({ prompt, baseMedia, userId: user?.phoneNumber });
      if(isMounted.current) {
        onUpdateMessage(messageDbKey, prompt, result.videoUrl, false);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      const failMessage = `Failed to generate video for prompt: "${prompt}"`;
      if(isMounted.current) {
        onUpdateMessage(messageDbKey, failMessage, baseMedia, false);
        toast({
          title: "Video Generation Failed",
          description: "Sorry, I couldn't create a video for that prompt. Please try another one.",
          variant: "destructive",
        });
      }
    }
  }

  const handleSend = (type: 'text' | 'image' | 'video' = 'text') => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput && !mediaFile) return;

    if (isAIChat) {
      if (type === 'image') {
        handleImagine(trimmedInput);
      } else if (type === 'video') {
        handleVideoGenerate(trimmedInput);
      } else {
        onSendMessage(trimmedInput);
      }
    } else {
       if (mediaFile) {
        const messageRef = onSendMessage(trimmedInput, mediaFile, true);
        if (messageRef) {
          messageRef.then(() => {
            if (isMounted.current) {
                update(messageRef, { isGenerating: null });
            }
          });
        }
      } else {
        onSendMessage(trimmedInput);
      }
    }
    
    setInputText('');
    setSmartReplies([]);
    setMediaFile(null);
  };

  const handleSelectReply = (reply: string) => {
    onSendMessage(reply);
    setInputText('');
    setSmartReplies([]);
  };

  const handleFileSelect = (url: string) => {
    setMediaFile(url);
  }
  
  const handleStudioSend = (mediaUrl: string) => {
    const messageRef = onSendMessage(inputText, mediaUrl, true);
    if (messageRef) {
        messageRef.then(() => {
            if (isMounted.current) {
                update(messageRef, { isGenerating: null });
            }
        });
    }

    setInputText('');
    setMediaFile(null);
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    onTypingChange(e.target.value.length > 0);
  }

  return (
    <div id="chat-panel-root" className="flex h-full flex-col bg-muted/30">
      <ChatHeader contactId={contactId} onBack={onBack} />
      <MessageList messages={messages} contactId={contactId} onImagine={handleImagine} onDelete={onDeleteMessage} isLoading={isLoading} />
      <div className="p-4 pt-2">
        {!isAIChat && smartReplies.length > 0 && <SmartReplySuggestions suggestions={smartReplies} onSelectReply={handleSelectReply} />}
        <ChatInput
          value={inputText}
          onChange={handleTextChange}
          onSend={handleSend}
          onFileSelect={handleFileSelect}
          isAIChat={isAIChat}
          onTypingChange={onTypingChange}
        />
      </div>
      {mediaFile && (
        <MediaStudio 
            mediaUrl={mediaFile}
            onClose={() => setMediaFile(null)}
            onSend={handleStudioSend}
            generateImage={(input) => generateImage({...input, userId: user?.phoneNumber})}
            generateVideo={(input) => generateVideo({...input, userId: user?.phoneNumber})}
        />
      )}
    </div>
  );
}
````

---

# File: src/components/contact-list.tsx

````tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Bot, Settings, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import type { Contact, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { ref, get, child } from 'firebase/database';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboard } from '@/components/admin-dashboard';
import { Virtuoso } from 'react-virtuoso';


// =================================================================================
// IMPORTANT: ADMIN ACCESS SETUP
//
// 1. To become an admin, ensure the phone number below is the one you will use
//    to sign up and log in.
// 2. The phone number MUST include the country code (e.g., +1 for the US).
// 3. After logging in with this number, type '!admin' into the search bar
//    to open the admin dashboard.
// =================================================================================
const ADMIN_PHONE_NUMBER = '+233504151292'; 
const ADMIN_SECRET_CODE = '!admin';

const AI_CONTACT_ID = 'ai-assistant';


interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: (user: User) => void;
  onDeleteContact: (id: string) => void;
  onShowSettings: () => void;
  isLoading: boolean;
}

function AddContactDialog({ onAddContact, children }: { onAddContact: (user: User) => void, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.code === value);
    if (selectedCountry) {
      setCountry(selectedCountry);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !currentUser) return;
    setIsLoading(true);

    const fullPhoneNumber = `${country.dial_code}${phoneNumber}`;

    if (fullPhoneNumber === currentUser.phoneNumber) {
        toast({
            title: "Cannot Add Yourself",
            description: "You cannot start a chat with your own phone number.",
            variant: "destructive"
        });
        setIsLoading(false);
        return;
    }

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${fullPhoneNumber.trim()}`));

        if (snapshot.exists()) {
            const userData = snapshot.val();
            onAddContact({ ...userData, phoneNumber: fullPhoneNumber.trim()});
            setPhoneNumber('');
            setOpen(false);
        } else {
            toast({
                title: "User Not Found",
                description: "No user is registered with this phone number.",
                variant: "destructive"
            });
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "An error occurred while searching for the user.",
            variant: "destructive"
        });
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Enter the phone number of the person you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                 <Select value={country.code} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.dial_code}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name} ({c.dial_code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter a number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!phoneNumber.trim() || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Searching..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EmptyContactList({ onAddContact }: { onAddContact: (user: User) => void }) {
  return (
    <div className='flex flex-col h-full items-center justify-center p-4 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <AddContactDialog onAddContact={onAddContact}>
          <button className='flex items-center justify-center w-24 h-24 bg-background rounded-full border-4 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group'>
            <Plus className='w-12 h-12 text-muted-foreground/40 group-hover:text-primary/60 transition-colors' />
          </button>
        </AddContactDialog>
        <p className="text-muted-foreground max-w-xs">No chats yet. Click the plus to find someone and start messaging!</p>
      </div>
    </div>
  )
}

function ContactListSkeleton() {
    return (
        <div className="flex flex-col p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                           <Skeleton className="h-4 w-2/4" />
                           <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            ))}
        </div>
    )
}

const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return ''; // Return empty if the date is invalid
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch (e) {
        console.error("Invalid timestamp format:", isoString);
        return '';
    }
}


export function ContactList({ contacts, activeContactId, onSelectContact, onAddContact, onDeleteContact, onShowSettings, isLoading }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const { user: currentUser } = useAuth();
  
  useEffect(() => {
    if (searchTerm === ADMIN_SECRET_CODE && currentUser?.phoneNumber === ADMIN_PHONE_NUMBER) {
      setShowAdminPanel(true);
    } else {
      setShowAdminPanel(false);
    }
  }, [searchTerm, currentUser?.phoneNumber]);


  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      if (!a.name) return 1;
      if (!b.name) return -1;
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      if (isNaN(timeA)) return 1; // Put contacts with invalid time at the end
      if (isNaN(timeB)) return -1; // Keep contacts with valid time at the front
      return timeB - timeA;
    });
  }, [contacts]);

  const filteredContacts = sortedContacts.filter((contact) =>
    contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleBackToContacts = () => {
    setShowAdminPanel(false);
    setSearchTerm('');
  }

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
        onDeleteContact(contactToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setContactToDelete(null);
  };


  if (showAdminPanel) {
    return <AdminDashboard onBack={handleBackToContacts} />;
  }

  const Row = ({ index, data: contact }: { index: number, data: Contact }) => (
    <div
      key={contact.id}
      role="button"
      tabIndex={0}
      onClick={() => onSelectContact(contact.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectContact(contact.id)}
      className={cn(
        'flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        activeContactId === contact.id && 'bg-muted'
      )}
    >
      <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12">
              <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
              <AvatarFallback>{contact.name ? contact.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
          </Avatar>
          {contact.online && (
             <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
          )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="truncate font-semibold text-foreground">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(contact.lastMessageTime)}</p>
        </div>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">{contact.isTyping ? <span className="italic text-primary">typing...</span> : contact.lastMessage}</p>
          {contact.unreadCount > 0 && (
            <Badge variant="default" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0">
              {contact.unreadCount}
            </Badge>
          )}
        </div>
      </div>
       {contact.id !== AI_CONTACT_ID && (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <MoreVertical className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                      onClick={(e) => handleDeleteClick(contact, e)}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Chat</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
        return <ContactListSkeleton />
    }
    if (contacts.length <= 1 && !searchTerm) { // Only AI chat is there
        return <EmptyContactList onAddContact={onAddContact} />
    }
    if (filteredContacts.length > 0) {
        return (
          <Virtuoso
              style={{ flex: 1 }}
              data={filteredContacts}
              itemContent={(index, contact) => <Row index={index} data={contact} />}
          />
        )
    }
    return (
        <div className="p-4 text-center text-sm text-muted-foreground">
            No contacts found.
        </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">ChirpChat</h1>
          <div className="flex items-center gap-1">
             <AddContactDialog onAddContact={onAddContact}>
                <Button variant="ghost" size="icon">
                   <Plus className="h-5 w-5" />
                </Button>
             </AddContactDialog>
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onShowSettings}>
                        <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
          {renderContent()}
      </div>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete your chat history with {contactToDelete?.name}. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
````

---

# File: src/components/install-pwa.tsx

````tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) {
    return null;
  }

  return (
    <Button onClick={handleInstallClick} variant="ghost" className="w-full justify-start">
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
````

---

# File: src/components/media-studio.tsx

````tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2, Sparkles, Send, X } from 'lucide-react';
import type { GenerateImageInput, GenerateImageOutput } from '@/ai/flows/image-generation-flow';
import type { GenerateVideoInput, GenerateVideoOutput } from '@/ai/flows/video-generation-flow';

interface MediaStudioProps {
  mediaUrl: string;
  onClose: () => void;
  onSend: (mediaUrl: string) => void;
  generateImage: (input: Omit<GenerateImageInput, 'userId'>) => Promise<GenerateImageOutput>;
  generateVideo: (input: Omit<GenerateVideoInput, 'userId'>) => Promise<GenerateVideoOutput>;
}

export function MediaStudio({ mediaUrl, onClose, onSend, generateImage, generateVideo }: MediaStudioProps) {
  const [editedMediaUrl, setEditedMediaUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const isVideo = mediaUrl.startsWith('data:video');
  const displayUrl = editedMediaUrl || mediaUrl;

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    
    try {
      if (isVideo) {
        const result = await generateVideo({ prompt, baseMedia: displayUrl });
        setEditedMediaUrl(result.videoUrl);
      } else {
        const result = await generateImage({ prompt, baseImage: displayUrl });
        setEditedMediaUrl(result.imageUrl);
      }
    } catch (error) {
      console.error("AI generation failed:", error);
      // You might want to show a toast here
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSend = () => {
    onSend(displayUrl);
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Studio</DialogTitle>
          <DialogDescription>
            Use AI to edit your {isVideo ? 'video' : 'image'}. Describe the changes you want to make.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div className="relative w-full aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {isVideo ? (
                    <video key={displayUrl} src={displayUrl} controls className="w-full h-full object-contain" />
                ) : (
                    <Image src={displayUrl} alt="Media preview" layout="fill" objectFit="contain" />
                )}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <p>AI is working its magic...</p>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium">Edit Prompt</label>
                    <Input 
                        id="prompt"
                        placeholder={isVideo ? "e.g. 'Make this black and white'" : "e.g. 'Add a cat in the foreground'"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Generating...' : 'Apply AI Edit'}
                </Button>

                <div className="flex-grow"></div>
                
                 <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSend} disabled={isLoading}>
                       <Send className="mr-2 h-4 w-4" />
                       Send
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
````

---

# File: src/components/message-bubble.tsx

````tsx
'use client';

import { Check, CheckCheck, Bot, Sparkles, Image as ImageIcon, Trash2, Video, MoreHorizontal, Download } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { RobotIcon } from '@/app/robot-icon';


interface MessageBubbleProps {
  message: Message;
  contactAvatar: string;
  isFirstInGroup: boolean;
  onImagine: (prompt: string, baseImage: string) => void;
  onDelete: (dbKey?: string) => void;
}

const ReadStatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 text-blue-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }
  return <Check className="h-4 w-4 text-muted-foreground" />;
};

const isAI = (sender: string) => sender === 'ai-assistant';

const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
         if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch (e) {
        console.error("Invalid timestamp format:", isoString);
        return '';
    }
}


export function MessageBubble({ message, contactAvatar, isFirstInGroup, onImagine, onDelete }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isMyMessage = currentUser ? message.sender === currentUser.phoneNumber : false;
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const mediaUrl = message.video || message.image;
  const isVideo = !!message.video;

  const handleEditImage = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim() && message.image) {
      onImagine(prompt, message.image);
      setIsPromptOpen(false);
      setPrompt("");
    }
  }

  const handleDelete = () => {
    onDelete(message.db_key);
    setIsDeleteConfirmOpen(false);
  }

  const handleDownload = () => {
    if (!mediaUrl) return;
    const link = document.createElement('a');
    link.href = mediaUrl;
    // Extract extension from MIME type, default to .png or .mp4
    const mimeType = mediaUrl.match(/data:(.*);/)?.[1];
    const extension = mimeType?.split('/')[1] || (isVideo ? 'mp4' : 'png');
    link.download = `chirpchat-media-${message.id}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const senderIsAI = isAI(message.sender);
  const canBeDeleted = (isMyMessage || senderIsAI) && (message.content || mediaUrl) && !message.isGenerating;
  const canBeEdited = (isMyMessage || senderIsAI) && message.image && !isVideo && !message.isGenerating;
  const canBeDownloaded = mediaUrl && !message.isGenerating;

  return (
    <div
      className={cn(
        'flex items-end gap-2 message-in',
        isMyMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isMyMessage && (
        <Avatar className={cn('h-8 w-8', !isFirstInGroup && 'invisible')}>
          <AvatarImage src={contactAvatar} alt="Contact" />
          <AvatarFallback>{senderIsAI ? <RobotIcon className="h-5 w-5" /> : 'C'}</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg p-0 shadow-md group relative',
          isMyMessage
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-card text-card-foreground',
          message.isGenerating && 'bg-muted text-muted-foreground',
          senderIsAI && 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <CardContent className="p-3">
          {message.isGenerating && (
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Generating...</p>
            </div>
          )}
          {mediaUrl && (
            <div className="relative">
              {isVideo ? (
                <div className="relative w-full aspect-video rounded-md bg-black flex items-center justify-center">
                    <video key={mediaUrl} src={mediaUrl} controls className="max-w-full max-h-full rounded-md" />
                </div>
              ) : (
                <Image
                  src={mediaUrl}
                  alt="Shared media"
                  width={300}
                  height={200}
                  className={cn("rounded-md mb-2 object-cover", message.isGenerating && "opacity-50")}
                />
              )}
            </div>
          )}
          {message.content && (
            <div className="flex items-start gap-2">
               {(senderIsAI && !isMyMessage) && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {!message.isGenerating && (canBeEdited || canBeDeleted || canBeDownloaded) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                       canBeEdited && "bg-accent/80 text-accent-foreground shadow-md hover:bg-accent hover:shadow-lg hover:ring-2 hover:ring-accent/50 animate-pulse hover:animate-none",
                       !canBeEdited && isMyMessage && "bg-primary/50 hover:bg-primary/60 text-primary-foreground",
                       !isMyMessage && "bg-card/50 hover:bg-muted text-card-foreground"
                    )}
                  >
                     {canBeEdited ? <Sparkles className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canBeDownloaded && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </DropdownMenuItem>
                  )}
                  {canBeEdited && (
                    <DropdownMenuItem onClick={() => setIsPromptOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Edit with AI</span>
                    </DropdownMenuItem>
                  )}
                  {(canBeDownloaded || canBeEdited) && canBeDeleted && <DropdownMenuSeparator />}
                  {canBeDeleted && (
                    <DropdownMenuItem onClick={() => setIsDeleteConfirmOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          <div className="mt-1 flex items-center justify-end gap-2">
            <span className={cn('text-xs', isMyMessage && !message.isGenerating ? 'text-primary-foreground/70' : 'text-muted-foreground', senderIsAI && 'text-secondary-foreground/70')}>
              {formatTimestamp(message.timestamp)}
            </span>
            {isMyMessage && !message.isGenerating && <ReadStatusIcon status={message.status} />}
          </div>
        </CardContent>
      </Card>
      
      {/* AI Edit Image Dialog */}
      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image with AI</DialogTitle>
            <DialogDescription>
              Describe the changes you want to make to the image.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditImage} className="space-y-4">
            <Input 
              placeholder="e.g. 'Make it a sunny day'" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!prompt.trim()}>Generate</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
````

---

# File: src/components/message-list.tsx

````tsx
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Message, User } from '@/lib/types';
import { MessageBubble } from './message-bubble';
import { Skeleton } from './ui/skeleton';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

interface MessageListProps {
  messages: Message[];
  contactId: string;
  onImagine: (prompt: string, baseImage: string) => void;
  onDelete: (dbKey?: string) => void;
  isLoading?: boolean;
}

const AI_CONTACT_ID = 'ai-assistant';

function MessageListSkeleton() {
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-end gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
             <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
             <div className="flex items-end gap-2 justify-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-14 w-64 rounded-lg" />
            </div>
            <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
             <div className="flex items-end gap-2 justify-end">
                <Skeleton className="h-12 w-24 rounded-lg" />
            </div>
        </div>
    )
}

export function MessageList({ messages, contactId, onImagine, onDelete, isLoading = false }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [contactUser, setContactUser] = useState<User | null>(null);
  const [isContactLoading, setIsContactLoading] = useState(true);

  const isAiAssistant = contactId === AI_CONTACT_ID;

  useEffect(() => {
    if (isAiAssistant || !contactId) {
        setIsContactLoading(false);
        return;
    }

    setIsContactLoading(true);
    const userRef = ref(db, `users/${contactId}`);
    const listener = onValue(userRef, (snapshot) => {
        if(snapshot.exists()) {
            setContactUser({ ...snapshot.val(), phoneNumber: contactId });
        }
        setIsContactLoading(false);
    });

    return () => off(userRef, 'value', listener);
  }, [contactId, isAiAssistant]);

  const contactAvatar = useMemo(() => {
      if (isAiAssistant) return '/robot-icon.svg';
      return contactUser?.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`;
  }, [contactUser, contactId, isAiAssistant]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const combinedLoading = isLoading || (isContactLoading && !isAiAssistant);

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      {combinedLoading ? (
        <MessageListSkeleton />
      ) : (
        <div className="p-4 space-y-4">
            {messages.map((message, index) => (
            <MessageBubble
                key={`${message.db_key || message.id}-${index}`}
                message={message}
                contactAvatar={contactAvatar}
                isFirstInGroup={index === 0 || messages[index - 1].sender !== message.sender}
                onImagine={onImagine}
                onDelete={onDelete}
            />
            ))}
        </div>
      )}
    </ScrollArea>
  );
}
````

---

# File: src/components/smart-reply-suggestions.tsx

````tsx
import { Button } from '@/components/ui/button';

interface SmartReplySuggestionsProps {
  suggestions: string[];
  onSelectReply: (reply: string) => void;
}

export function SmartReplySuggestions({ suggestions, onSelectReply }: SmartReplySuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="h-auto py-1 px-3 text-sm"
          onClick={() => onSelectReply(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
````

---

# File: src/components/theme-provider.tsx

````tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
````

---

# File: src/components/ui/accordion.tsx

````tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
````

---

# File: src/components/ui/alert-dialog.tsx

````tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
````

---

# File: src/components/ui/alert.tsx

````tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
````

---

# File: src/components/ui/avatar.tsx

````tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
````

---

# File: src/components/ui/badge.tsx

````tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
````

---

# File: src/components/ui/button.tsx

````tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
````

---

# File: src/components/ui/calendar.tsx

````tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
````

---

# File: src/components/ui/card.tsx

````tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
````

---

# File: src/components/ui/carousel.tsx

````tsx
"use client"

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
````

---

# File: src/components/ui/chart.tsx

````tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
````

---

# File: src/components/ui/checkbox.tsx

````tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
````

---

# File: src/components/ui/collapsible.tsx

````tsx
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
````

---

# File: src/components/ui/dialog.tsx

````tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
````

---

# File: src/components/ui/dropdown-menu.tsx

````tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
````

---

# File: src/components/ui/form.tsx

````tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
````

---

# File: src/components/ui/input.tsx

````tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
````

---

# File: src/components/ui/label.tsx

````tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
````

---

# File: src/components/ui/menubar.tsx

````tsx
"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
````

---

# File: src/components/ui/popover.tsx

````tsx
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
````

---

# File: src/components/ui/progress.tsx

````tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
````

---

# File: src/components/ui/radio-group.tsx

````tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
````

---

# File: src/components/ui/scroll-area.tsx

````tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
````

---

# File: src/components/ui/select.tsx

````tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
````

---

# File: src/components/ui/separator.tsx

````tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
````

---

# File: src/components/ui/sheet.tsx

````tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
````

---

# File: src/components/ui/sidebar.tsx

````tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
````

---

# File: src/components/ui/skeleton.tsx

````tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
````

---

# File: src/components/ui/slider.tsx

````tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
````

---

# File: src/components/ui/switch.tsx

````tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
````

---

# File: src/components/ui/table.tsx

````tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
````

---

# File: src/components/ui/tabs.tsx

````tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
````

---

# File: src/components/ui/textarea.tsx

````tsx
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
````

---

# File: src/components/ui/toast.tsx

````tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
````

---

# File: src/components/ui/toaster.tsx

````tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
````

---

# File: src/components/ui/tooltip.tsx

````tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
````

---

# File: src/context/auth-context.tsx

````tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, set, onValue, off, serverTimestamp, onDisconnect, update } from 'firebase/database';
import { getMessaging, getToken } from 'firebase/messaging';
import { vapidKey } from '@/lib/firebase-env';

// For Median.co integration
declare global {
  interface Window {
    median: any;
  }
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'chirpchat_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        try {
          setUser(JSON.parse(storedUser));
        } catch (jsonError) {
          console.error("Failed to parse user from localStorage", jsonError);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error)
    {
      console.error("Could not access localStorage", error);
    } finally {
      setLoading(false);
    }
    
    // Register Service Worker for PWA, but NOT if inside Median wrapper
    if ('serviceWorker' in navigator && typeof window.median === 'undefined') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(error => {
          console.log('Service Worker registration failed:', error);
        });
      });
    }

  }, []);
  
  useEffect(() => {
    if (user) {
      const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
      const userRef = ref(db, `users/${user.phoneNumber}`);

      const isOnline = {
        online: true,
        lastSeen: serverTimestamp(),
      };
      const isOffline = {
        online: false,
        lastSeen: serverTimestamp(),
      };
      
      const connectedRef = ref(db, '.info/connected');
      
      const listener = onValue(connectedRef, (snap) => {
        if (snap.val() === true) {
          onDisconnect(userStatusRef).set(isOffline).then(() => {
             set(userStatusRef, isOnline);
          });
        }
      });
      
      // Request notification permission and get FCM token
      const requestNotificationPermission = async () => {
        try {
          // Check if running inside Median.co wrapper
          if (window.median && window.median.android && window.median.android.fcm) {
             window.median.android.fcm.getRegistrationId(async (token: string) => {
                if (token) {
                  console.log("Median FCM Token:", token);
                  await update(userRef, { fcmToken: token });
                }
             });
          } else {
            // Fallback for standard web browsers
            const messaging = getMessaging();
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const currentToken = await getToken(messaging, { vapidKey });
              if (currentToken) {
                await update(userRef, { fcmToken: currentToken });
              } else {
                console.log('No registration token available. Request permission to generate one.');
              }
            }
          }
        } catch (error) {
          console.error('An error occurred while retrieving token. ', error);
        }
      }
      
      requestNotificationPermission();

      return () => {
        if (user?.phoneNumber) {
            const userStatusOnUnmountRef = ref(db, `users/${user.phoneNumber}/status`);
            set(userStatusOnUnmountRef, isOffline);
        }
        off(connectedRef, 'value', listener);
      };
    }
  }, [user]);


  const login = (phoneNumber: string, name: string) => {
    try {
      const userData = { phoneNumber, name };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      router.push('/');
    } catch (error) {
      console.error("Could not set user in localStorage", error);
    }
  };

  const logout = async () => {
    try {
      if (user?.phoneNumber) {
         const userStatusRef = ref(db, `users/${user.phoneNumber}/status`);
         await set(userStatusRef, { online: false, lastSeen: serverTimestamp() });
      }
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error("Could not remove user from localStorage", error);
    }
  };

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
````

---

# File: src/hooks/use-mobile.tsx

````tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * @deprecated This hook is deprecated and will be removed in a future version.
 * Use Tailwind's responsive prefixes for styling (`md:`, `lg:`, etc.) instead of this hook for layout changes.
 * This hook may still be used for JavaScript logic that specifically needs to know if the user is on a mobile device.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    
    // Set the initial value
    onChange();

    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
````

---

# File: src/hooks/use-toast.ts

````ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
````

---

# File: src/lib/ai-logger.ts

````ts
'use server';

import { db } from '@/lib/firebase';
import { push, ref, serverTimestamp } from 'firebase/database';

export type AIFeature = 'chat' | 'image' | 'video' | 'smart-reply' | 'push-notification';

export async function logAIUsage(feature: AIFeature, metadata: Record<string, any> = {}) {
  try {
    const logRef = ref(db, 'aiUsageLogs');
    await push(logRef, {
      feature,
      timestamp: serverTimestamp(),
      ...metadata,
    });
  } catch (error) {
    console.error(`Failed to log AI usage for feature: ${feature}`, error);
  }
}
````

---

# File: src/lib/countries.ts

````ts
export type Country = {
  name: string;
  dial_code: string;
  code: string;
  flag: string;
  pattern?: RegExp;
};

export const countries: Country[] = [
  { "name": "Afghanistan", "dial_code": "+93", "code": "AF", "flag": "🇦🇫", "pattern": /^\d{9}$/ },
  { "name": "Albania", "dial_code": "+355", "code": "AL", "flag": "🇦🇱", "pattern": /^\d{9}$/ },
  { "name": "Algeria", "dial_code": "+213", "code": "DZ", "flag": "🇩🇿", "pattern": /^\d{9}$/ },
  { "name": "Andorra", "dial_code": "+376", "code": "AD", "flag": "🇦🇩", "pattern": /^\d{6}$/ },
  { "name": "Angola", "dial_code": "+244", "code": "AO", "flag": "🇦🇴", "pattern": /^\d{9}$/ },
  { "name": "Argentina", "dial_code": "+54", "code": "AR", "flag": "🇦🇷", "pattern": /^\d{10}$/ },
  { "name": "Armenia", "dial_code": "+374", "code": "AM", "flag": "🇦🇲", "pattern": /^\d{8}$/ },
  { "name": "Australia", "dial_code": "+61", "code": "AU", "flag": "🇦🇺", "pattern": /^\d{9}$/ },
  { "name": "Austria", "dial_code": "+43", "code": "AT", "flag": "🇦🇹", "pattern": /^\d{10,13}$/ },
  { "name": "Azerbaijan", "dial_code": "+994", "code": "AZ", "flag": "🇦🇿", "pattern": /^\d{9}$/ },
  { "name": "Bahamas", "dial_code": "+1242", "code": "BS", "flag": "🇧🇸", "pattern": /^\d{10}$/ },
  { "name": "Bahrain", "dial_code": "+973", "code": "BH", "flag": "🇧🇭", "pattern": /^\d{8}$/ },
  { "name": "Bangladesh", "dial_code": "+880", "code": "BD", "flag": "🇧🇩", "pattern": /^\d{10}$/ },
  { "name": "Belarus", "dial_code": "+375", "code": "BY", "flag": "🇧🇾", "pattern": /^\d{9}$/ },
  { "name": "Belgium", "dial_code": "+32", "code": "BE", "flag": "🇧🇪", "pattern": /^\d{9}$/ },
  { "name": "Belize", "dial_code": "+501", "code": "BZ", "flag": "🇧🇿", "pattern": /^\d{7}$/ },
  { "name": "Benin", "dial_code": "+229", "code": "BJ", "flag": "🇧🇯", "pattern": /^\d{8}$/ },
  { "name": "Bhutan", "dial_code": "+975", "code": "BT", "flag": "🇧🇹", "pattern": /^\d{8}$/ },
  { "name": "Bolivia", "dial_code": "+591", "code": "BO", "flag": "🇧🇴", "pattern": /^\d{8}$/ },
  { "name": "Bosnia and Herzegovina", "dial_code": "+387", "code": "BA", "flag": "🇧🇦", "pattern": /^\d{8}$/ },
  { "name": "Botswana", "dial_code": "+267", "code": "BW", "flag": "🇧🇼", "pattern": /^\d{7,8}$/ },
  { "name": "Brazil", "dial_code": "+55", "code": "BR", "flag": "🇧🇷", "pattern": /^\d{10,11}$/ },
  { "name": "Brunei", "dial_code": "+673", "code": "BN", "flag": "🇧🇳", "pattern": /^\d{7}$/ },
  { "name": "Bulgaria", "dial_code": "+359", "code": "BG", "flag": "🇧🇬", "pattern": /^\d{9}$/ },
  { "name": "Burkina Faso", "dial_code": "+226", "code": "BF", "flag": "🇧🇫", "pattern": /^\d{8}$/ },
  { "name": "Cambodia", "dial_code": "+855", "code": "KH", "flag": "🇰🇭", "pattern": /^\d{8,9}$/ },
  { "name": "Cameroon", "dial_code": "+237", "code": "CM", "flag": "🇨🇲", "pattern": /^\d{9}$/ },
  { "name": "Canada", "dial_code": "+1", "code": "CA", "flag": "🇨🇦", "pattern": /^\d{10}$/ },
  { "name": "Central African Republic", "dial_code": "+236", "code": "CF", "flag": "🇨🇫", "pattern": /^\d{8}$/ },
  { "name": "Chad", "dial_code": "+235", "code": "TD", "flag": "🇹🇩", "pattern": /^\d{8}$/ },
  { "name": "Chile", "dial_code": "+56", "code": "CL", "flag": "🇨🇱", "pattern": /^\d{9}$/ },
  { "name": "China", "dial_code": "+86", "code": "CN", "flag": "🇨🇳", "pattern": /^\d{11}$/ },
  { "name": "Colombia", "dial_code": "+57", "code": "CO", "flag": "🇨🇴", "pattern": /^\d{10}$/ },
  { "name": "Congo (Brazzaville)", "dial_code": "+242", "code": "CG", "flag": "🇨🇬", "pattern": /^\d{9}$/ },
  { "name": "Congo (Kinshasa)", "dial_code": "+243", "code": "CD", "flag": "🇨🇩", "pattern": /^\d{9}$/ },
  { "name": "Costa Rica", "dial_code": "+506", "code": "CR", "flag": "🇨🇷", "pattern": /^\d{8}$/ },
  { "name": "Croatia", "dial_code": "+385", "code": "HR", "flag": "🇭🇷", "pattern": /^\d{8,9}$/ },
  { "name": "Cuba", "dial_code": "+53", "code": "CU", "flag": "🇨🇺", "pattern": /^\d{8}$/ },
  { "name": "Cyprus", "dial_code": "+357", "code": "CY", "flag": "🇨🇾", "pattern": /^\d{8}$/ },
  { "name": "Czech Republic", "dial_code": "+420", "code": "CZ", "flag": "🇨🇿", "pattern": /^\d{9}$/ },
  { "name": "Denmark", "dial_code": "+45", "code": "DK", "flag": "🇩🇰", "pattern": /^\d{8}$/ },
  { "name": "Djibouti", "dial_code": "+253", "code": "DJ", "flag": "🇩🇯", "pattern": /^\d{6}$/ },
  { "name": "Dominica", "dial_code": "+1767", "code": "DM", "flag": "🇩🇲", "pattern": /^\d{7}$/ },
  { "name": "Dominican Republic", "dial_code": "+1809", "code": "DO", "flag": "🇩🇴", "pattern": /^\d{10}$/ },
  { "name": "Ecuador", "dial_code": "+593", "code": "EC", "flag": "🇪🇨", "pattern": /^\d{9}$/ },
  { "name": "Egypt", "dial_code": "+20", "code": "EG", "flag": "🇪🇬", "pattern": /^\d{10}$/ },
  { "name": "El Salvador", "dial_code": "+503", "code": "SV", "flag": "🇸🇻", "pattern": /^\d{8}$/ },
  { "name": "Estonia", "dial_code": "+372", "code": "EE", "flag": "🇪🇪", "pattern": /^\d{7,8}$/ },
  { "name": "Ethiopia", "dial_code": "+251", "code": "ET", "flag": "🇪🇹", "pattern": /^\d{9}$/ },
  { "name": "Fiji", "dial_code": "+679", "code": "FJ", "flag": "🇫🇯", "pattern": /^\d{7}$/ },
  { "name": "Finland", "dial_code": "+358", "code": "FI", "flag": "🇫🇮", "pattern": /^\d{9,10}$/ },
  { "name": "France", "dial_code": "+33", "code": "FR", "flag": "🇫🇷", "pattern": /^\d{9}$/ },
  { "name": "Gabon", "dial_code": "+241", "code": "GA", "flag": "🇬🇦", "pattern": /^\d{7,8}$/ },
  { "name": "Gambia", "dial_code": "+220", "code": "GM", "flag": "🇬🇲", "pattern": /^\d{7}$/ },
  { "name": "Georgia", "dial_code": "+995", "code": "GE", "flag": "🇬🇪", "pattern": /^\d{9}$/ },
  { "name": "Germany", "dial_code": "+49", "code": "DE", "flag": "🇩🇪", "pattern": /^\d{10,11}$/ },
  { "name": "Ghana", "dial_code": "+233", "code": "GH", "flag": "🇬🇭", "pattern": /^\d{9}$/ },
  { "name": "Greece", "dial_code": "+30", "code": "GR", "flag": "🇬🇷", "pattern": /^\d{10}$/ },
  { "name": "Guatemala", "dial_code": "+502", "code": "GT", "flag": "🇬🇹", "pattern": /^\d{8}$/ },
  { "name": "Guinea", "dial_code": "+224", "code": "GN", "flag": "🇬🇳", "pattern": /^\d{9}$/ },
  { "name": "Guyana", "dial_code": "+592", "code": "GY", "flag": "🇬🇾", "pattern": /^\d{7}$/ },
  { "name": "Haiti", "dial_code": "+509", "code": "HT", "flag": "🇭🇹", "pattern": /^\d{8}$/ },
  { "name": "Honduras", "dial_code": "+504", "code": "HN", "flag": "🇭🇳", "pattern": /^\d{8}$/ },
  { "name": "Hong Kong", "dial_code": "+852", "code": "HK", "flag": "🇭🇰", "pattern": /^\d{8}$/ },
  { "name": "Hungary", "dial_code": "+36", "code": "HU", "flag": "🇭🇺", "pattern": /^\d{9}$/ },
  { "name": "Iceland", "dial_code": "+354", "code": "IS", "flag": "🇮🇸", "pattern": /^\d{7}$/ },
  { "name": "India", "dial_code": "+91", "code": "IN", "flag": "🇮🇳", "pattern": /^\d{10}$/ },
  { "name": "Indonesia", "dial_code": "+62", "code": "ID", "flag": "🇮🇩", "pattern": /^\d{9,12}$/ },
  { "name": "Iran", "dial_code": "+98", "code": "IR", "flag": "🇮🇷", "pattern": /^\d{10}$/ },
  { "name": "Iraq", "dial_code": "+964", "code": "IQ", "flag": "🇮🇶", "pattern": /^\d{10}$/ },
  { "name": "Ireland", "dial_code": "+353", "code": "IE", "flag": "🇮🇪", "pattern": /^\d{9}$/ },
  { "name": "Israel", "dial_code": "+972", "code": "IL", "flag": "🇮🇱", "pattern": /^\d{9}$/ },
  { "name": "Italy", "dial_code": "+39", "code": "IT", "flag": "🇮🇹", "pattern": /^\d{10}$/ },
  { "name": "Jamaica", "dial_code": "+1876", "code": "JM", "flag": "🇯🇲", "pattern": /^\d{7}$/ },
  { "name": "Japan", "dial_code": "+81", "code": "JP", "flag": "🇯🇵", "pattern": /^\d{10}$/ },
  { "name": "Jordan", "dial_code": "+962", "code": "JO", "flag": "🇯🇴", "pattern": /^\d{9}$/ },
  { "name": "Kazakhstan", "dial_code": "+7", "code": "KZ", "flag": "🇰🇿", "pattern": /^\d{10}$/ },
  { "name": "Kenya", "dial_code": "+254", "code": "KE", "flag": "🇰🇪", "pattern": /^\d{9}$/ },
  { "name": "Kuwait", "dial_code": "+965", "code": "KW", "flag": "🇰🇼", "pattern": /^\d{8}$/ },
  { "name": "Kyrgyzstan", "dial_code": "+996", "code": "KG", "flag": "🇰🇬", "pattern": /^\d{9}$/ },
  { "name": "Laos", "dial_code": "+856", "code": "LA", "flag": "🇱🇦", "pattern": /^\d{10}$/ },
  { "name": "Latvia", "dial_code": "+371", "code": "LV", "flag": "🇱🇻", "pattern": /^\d{8}$/ },
  { "name": "Lebanon", "dial_code": "+961", "code": "LB", "flag": "🇱🇧", "pattern": /^\d{7,8}$/ },
  { "name": "Liberia", "dial_code": "+231", "code": "LR", "flag": "🇱🇷", "pattern": /^\d{7,9}$/ },
  { "name": "Libya", "dial_code": "+218", "code": "LY", "flag": "🇱🇾", "pattern": /^\d{9}$/ },
  { "name": "Liechtenstein", "dial_code": "+423", "code": "LI", "flag": "🇱🇮", "pattern": /^\d{7}$/ },
  { "name": "Lithuania", "dial_code": "+370", "code": "LT", "flag": "🇱🇹", "pattern": /^\d{8}$/ },
  { "name": "Luxembourg", "dial_code": "+352", "code": "LU", "flag": "🇱🇺", "pattern": /^\d{9}$/ },
  { "name": "Macedonia", "dial_code": "+389", "code": "MK", "flag": "🇲🇰", "pattern": /^\d{8}$/ },
  { "name": "Madagascar", "dial_code": "+261", "code": "MG", "flag": "🇲🇬", "pattern": /^\d{9}$/ },
  { "name": "Malaysia", "dial_code": "+60", "code": "MY", "flag": "🇲🇾", "pattern": /^\d{9,10}$/ },
  { "name": "Maldives", "dial_code": "+960", "code": "MV", "flag": "🇲🇻", "pattern": /^\d{7}$/ },
  { "name": "Mali", "dial_code": "+223", "code": "ML", "flag": "🇲🇱", "pattern": /^\d{8}$/ },
  { "name": "Malta", "dial_code": "+356", "code": "MT", "flag": "🇲🇹", "pattern": /^\d{8}$/ },
  { "name": "Mauritania", "dial_code": "+222", "code": "MR", "flag": "🇲🇷", "pattern": /^\d{8}$/ },
  { "name": "Mexico", "dial_code": "+52", "code": "MX", "flag": "🇲🇽", "pattern": /^\d{10}$/ },
  { "name": "Moldova", "dial_code": "+373", "code": "MD", "flag": "🇲🇩", "pattern": /^\d{8}$/ },
  { "name": "Monaco", "dial_code": "+377", "code": "MC", "flag": "🇲🇨", "pattern": /^\d{8,9}$/ },
  { "name": "Mongolia", "dial_code": "+976", "code": "MN", "flag": "🇲🇳", "pattern": /^\d{8}$/ },
  { "name": "Montenegro", "dial_code": "+382", "code": "ME", "flag": "🇲🇪", "pattern": /^\d{8}$/ },
  { "name": "Morocco", "dial_code": "+212", "code": "MA", "flag": "🇲🇦", "pattern": /^\d{9}$/ },
  { "name": "Myanmar", "dial_code": "+95", "code": "MM", "flag": "🇲🇲", "pattern": /^\d{8,10}$/ },
  { "name": "Namibia", "dial_code": "+264", "code": "NA", "flag": "🇳🇦", "pattern": /^\d{9}$/ },
  { "name": "Nepal", "dial_code": "+977", "code": "NP", "flag": "🇳🇵", "pattern": /^\d{10}$/ },
  { "name": "Netherlands", "dial_code": "+31", "code": "NL", "flag": "🇳🇱", "pattern": /^\d{9}$/ },
  { "name": "New Zealand", "dial_code": "+64", "code": "NZ", "flag": "🇳🇿", "pattern": /^\d{8,10}$/ },
  { "name": "Nicaragua", "dial_code": "+505", "code": "NI", "flag": "🇳🇮", "pattern": /^\d{8}$/ },
  { "name": "Niger", "dial_code": "+227", "code": "NE", "flag": "🇳🇪", "pattern": /^\d{8}$/ },
  { "name": "Nigeria", "dial_code": "+234", "code": "NG", "flag": "🇳🇬", "pattern": /^\d{10}$/ },
  { "name": "North Korea", "dial_code": "+850", "code": "KP", "flag": "🇰🇵", "pattern": /^\d{4,10}$/ },
  { "name": "Norway", "dial_code": "+47", "code": "NO", "flag": "🇳🇴", "pattern": /^\d{8}$/ },
  { "name": "Oman", "dial_code": "+968", "code": "OM", "flag": "🇴🇲", "pattern": /^\d{8}$/ },
  { "name": "Pakistan", "dial_code": "+92", "code": "PK", "flag": "🇵🇰", "pattern": /^\d{10}$/ },
  { "name": "Palestine", "dial_code": "+970", "code": "PS", "flag": "🇵🇸", "pattern": /^\d{9}$/ },
  { "name": "Panama", "dial_code": "+507", "code": "PA", "flag": "🇵🇦", "pattern": /^\d{7,8}$/ },
  { "name": "Paraguay", "dial_code": "+595", "code": "PY", "flag": "🇵🇾", "pattern": /^\d{9}$/ },
  { "name": "Peru", "dial_code": "+51", "code": "PE", "flag": "🇵🇪", "pattern": /^\d{9}$/ },
  { "name": "Philippines", "dial_code": "+63", "code": "PH", "flag": "🇵🇭", "pattern": /^\d{10}$/ },
  { "name": "Poland", "dial_code": "+48", "code": "PL", "flag": "🇵🇱", "pattern": /^\d{9}$/ },
  { "name": "Portugal", "dial_code": "+351", "code": "PT", "flag": "🇵🇹", "pattern": /^\d{9}$/ },
  { "name": "Qatar", "dial_code": "+974", "code": "QA", "flag": "🇶🇦", "pattern": /^\d{8}$/ },
  { "name": "Romania", "dial_code": "+40", "code": "RO", "flag": "🇷🇴", "pattern": /^\d{9}$/ },
  { "name": "Russia", "dial_code": "+7", "code": "RU", "flag": "🇷🇺", "pattern": /^\d{10}$/ },
  { "name": "Rwanda", "dial_code": "+250", "code": "RW", "flag": "🇷🇼", "pattern": /^\d{9}$/ },
  { "name": "Saudi Arabia", "dial_code": "+966", "code": "SA", "flag": "🇸🇦", "pattern": /^\d{9}$/ },
  { "name": "Senegal", "dial_code": "+221", "code": "SN", "flag": "🇸🇳", "pattern": /^\d{9}$/ },
  { "name": "Serbia", "dial_code": "+381", "code": "RS", "flag": "🇷🇸", "pattern": /^\d{8,9}$/ },
  { "name": "Singapore", "dial_code": "+65", "code": "SG", "flag": "🇸🇬", "pattern": /^\d{8}$/ },
  { "name": "Slovakia", "dial_code": "+421", "code": "SK", "flag": "🇸🇰", "pattern": /^\d{9}$/ },
  { "name": "Slovenia", "dial_code": "+386", "code": "SI", "flag": "🇸🇮", "pattern": /^\d{8}$/ },
  { "name": "Somalia", "dial_code": "+252", "code": "SO", "flag": "🇸🇴", "pattern": /^\d{7,8}$/ },
  { "name": "South Africa", "dial_code": "+27", "code": "ZA", "flag": "🇿🇦", "pattern": /^\d{9}$/ },
  { "name": "South Korea", "dial_code": "+82", "code": "KR", "flag": "🇰🇷", "pattern": /^\d{9,11}$/ },
  { "name": "Spain", "dial_code": "+34", "code": "ES", "flag": "🇪🇸", "pattern": /^\d{9}$/ },
  { "name": "Sri Lanka", "dial_code": "+94", "code": "LK", "flag": "🇱🇰", "pattern": /^\d{9}$/ },
  { "name": "Sudan", "dial_code": "+249", "code": "SD", "flag": "🇸🇩", "pattern": /^\d{9}$/ },
  { "name": "Sweden", "dial_code": "+46", "code": "SE", "flag": "🇸🇪", "pattern": /^\d{9,10}$/ },
  { "name": "Switzerland", "dial_code": "+41", "code": "CH", "flag": "🇨🇭", "pattern": /^\d{9}$/ },
  { "name": "Syria", "dial_code": "+963", "code": "SY", "flag": "🇸🇾", "pattern": /^\d{9}$/ },
  { "name": "Taiwan", "dial_code": "+886", "code": "TW", "flag": "🇹🇼", "pattern": /^\d{9}$/ },
  { "name": "Tanzania", "dial_code": "+255", "code": "TZ", "flag": "🇹🇿", "pattern": /^\d{9}$/ },
  { "name": "Thailand", "dial_code": "+66", "code": "TH", "flag": "🇹🇭", "pattern": /^\d{9}$/ },
  { "name": "Togo", "dial_code": "+228", "code": "TG", "flag": "🇹🇬", "pattern": /^\d{8}$/ },
  { "name": "Tunisia", "dial_code": "+216", "code": "TN", "flag": "🇹🇳", "pattern": /^\d{8}$/ },
  { "name": "Turkey", "dial_code": "+90", "code": "TR", "flag": "🇹🇷", "pattern": /^\d{10}$/ },
  { "name": "Uganda", "dial_code": "+256", "code": "UG", "flag": "🇺🇬", "pattern": /^\d{9}$/ },
  { "name": "Ukraine", "dial_code": "+380", "code": "UA", "flag": "🇺🇦", "pattern": /^\d{9}$/ },
  { "name": "United Arab Emirates", "dial_code": "+971", "code": "AE", "flag": "🇦🇪", "pattern": /^\d{9}$/ },
  { "name": "United Kingdom", "dial_code": "+44", "code": "GB", "flag": "🇬🇧", "pattern": /^\d{10}$/ },
  { "name": "United States", "dial_code": "+1", "code": "US", "flag": "🇺🇸", "pattern": /^\d{10}$/ },
  { "name": "Uruguay", "dial_code": "+598", "code": "UY", "flag": "🇺🇾", "pattern": /^\d{8}$/ },
  { "name": "Uzbekistan", "dial_code": "+998", "code": "UZ", "flag": "🇺🇿", "pattern": /^\d{9}$/ },
  { "name": "Venezuela", "dial_code": "+58", "code": "VE", "flag": "🇻🇪", "pattern": /^\d{10}$/ },
  { "name": "Vietnam", "dial_code": "+84", "code": "VN", "flag": "🇻🇳", "pattern": /^\d{9,10}$/ },
  { "name": "Yemen", "dial_code": "+967", "code": "YE", "flag": "🇾🇪", "pattern": /^\d{9}$/ },
  { "name": "Zambia", "dial_code": "+260", "code": "ZM", "flag": "🇿🇲", "pattern": /^\d{9}$/ },
  { "name": "Zimbabwe", "dial_code": "+263", "code": "ZW", "flag": "🇿🇼", "pattern": /^\d{9}$/ },
];
````

---

# File: src/lib/data.ts

````ts
import type { Contact, Message } from './types';

// This file is no longer the primary source of truth,
// but can be kept for reference or type definitions if needed.

export const CONTACTS: Contact[] = [];

export type AllMessages = {
    [key: string]: Message[];
}
````

---

# File: src/lib/firebase-env.ts

````ts
// This file is used to provide the Firebase config to the client-side code.
// It's important to use this file to avoid exposing sensitive data to the client.

export const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const vapidKey = "BM2jc26u4cps59zJPnXqUeHApp7e0EuMT3na9c1uY2nmq3QI3SSs8HTDXJ_EKxEn6daDDhjT9IJjeYgAo0AD1Us";
````

---

# File: src/lib/firebase.ts

````ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./firebase-env";


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app);


export { db, auth };
````

---

# File: src/lib/types.ts

````ts
export type Message = {
  id: number; // This is a client-side only ID derived from timestamp
  content: string;
  timestamp: string; // ISO 8601 string format
  sender: string; // phone number of the sender
  status: 'sent' | 'delivered' | 'read';
  image?: string;
  video?: string;
  isGenerating?: boolean;
  db_key?: string; // The key from Firebase DB
};

export type AllMessages = {
    [conversationKey: string]: {
        [messageKey: string]: Message;
    }
}

export type Contact = {
  id: string; // phone number of the contact
  name: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string; // ISO 8601 string format
  unreadCount: number;
  lastSeen?: number | object; // Can be timestamp or server timestamp object
  isTyping?: boolean;
};

export type UserAccountStatus = 'active' | 'banned' | 'disabled';

export type User = {
    phoneNumber: string;
    name: string;
    profilePicture?: string;
    contacts?: string[];
    status?: {
      online: boolean;
      lastSeen: number | object; // Can be timestamp or server timestamp object
      account: UserAccountStatus;
    };
    fcmToken?: string;
}

export type AIUsageLog = {
    id: string;
    feature: 'chat' | 'image' | 'video' | 'smart-reply';
    timestamp: number;
    userId?: string;
};

export type BroadcastMessage = {
    id: string;
    message: string;
    timestamp: number;
};
````

---

# File: src/lib/utils.ts

````ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function compressImage(file: File, quality = 0.8, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Use 'image/webp' for better compression, fallback to 'image/jpeg'
        const dataUrl = canvas.toDataURL('image/webp', quality);
        if (dataUrl.length > 10) { // Check if webp is supported
           resolve(dataUrl);
        } else {
           resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
    };
  });
}
````

---

# File: tailwind.config.ts

````ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['var(--font-pt-sans)', 'sans-serif'],
        headline: ['var(--font-pt-sans)', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
````

---

# File: tsconfig.json

````json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
````

---

# File: workspace/src/app/page.tsx

````tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ChatContainer } from '@/components/chat-container';
import { Skeleton } from '@/components/ui/skeleton';
import SettingsPage from '@/app/settings/page';

function LoadingSkeleton() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="flex h-full w-full max-w-7xl items-center gap-4 p-4">
        <Skeleton className="hidden h-[80%] w-1/3 rounded-2xl md:block" />
        <Skeleton className="h-[80%] w-full rounded-2xl md:w-2/3" />
      </div>
    </main>
  );
}

function HomePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showSettings = searchParams.get('page') === 'settings';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingSkeleton />;
  }
  
  const handleBackToChat = () => {
    router.push('/');
  }

  return (
    <main className="flex h-screen w-full items-center justify-center bg-background p-0 md:p-4">
      <div className="h-full w-full max-w-7xl rounded-none border-0 bg-card shadow-none md:rounded-2xl md:border md:shadow-lg overflow-hidden">
        {showSettings ? (
            <SettingsPage onBack={handleBackToChat} />
        ) : (
            <ChatContainer />
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}
````

---

# File: workspace/src/components/contact-list.tsx

````tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search, Plus, Bot, Settings, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import type { Contact, User } from '@/lib/types';
import { cn, formatTimestamp } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/context/auth-context';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/lib/firebase';
import { ref, get, child } from 'firebase/database';
import { Skeleton } from './ui/skeleton';
import { AdminDashboard } from './admin-dashboard';
import { Virtuoso } from 'react-virtuoso';


// =================================================================================
// IMPORTANT: ADMIN ACCESS SETUP
//
// 1. To become an admin, ensure the phone number below is the one you will use
//    to sign up and log in.
// 2. The phone number MUST include the country code (e.g., +1 for the US).
// 3. After logging in with this number, type '!admin' into the search bar
//    to open the admin dashboard.
// =================================================================================
const ADMIN_PHONE_NUMBER = '+233504151292'; 
const ADMIN_SECRET_CODE = '!admin';

const AI_CONTACT_ID = 'ai-assistant';


interface ContactListProps {
  contacts: Contact[];
  activeContactId: string | null;
  onSelectContact: (id: string) => void;
  onAddContact: (user: User) => void;
  onDeleteContact: (id: string) => void;
  onShowSettings: () => void;
  isLoading: boolean;
}

function AddContactDialog({ onAddContact, children }: { onAddContact: (user: User) => void, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState(countries.find(c => c.code === 'US')!);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.code === value);
    if (selectedCountry) {
      setCountry(selectedCountry);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !currentUser) return;
    setIsLoading(true);

    const fullPhoneNumber = `${country.dial_code}${phoneNumber}`;

    if (fullPhoneNumber === currentUser.phoneNumber) {
        toast({
            title: "Cannot Add Yourself",
            description: "You cannot start a chat with your own phone number.",
            variant: "destructive"
        });
        setIsLoading(false);
        return;
    }

    try {
        const dbRef = ref(db);
        const snapshot = await get(child(dbRef, `users/${fullPhoneNumber.trim()}`));

        if (snapshot.exists()) {
            const userData = snapshot.val();
            onAddContact({ ...userData, phoneNumber: fullPhoneNumber.trim()});
            setPhoneNumber('');
            setOpen(false);
        } else {
            toast({
                title: "User Not Found",
                description: "No user is registered with this phone number.",
                variant: "destructive"
            });
        }
    } catch (error) {
        toast({
            title: "Error",
            description: "An error occurred while searching for the user.",
            variant: "destructive"
        });
        console.error(error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Enter the phone number of the person you want to chat with.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                 <Select value={country.code} onValueChange={handleCountryChange}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.dial_code}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.name} ({c.dial_code})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter a number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!phoneNumber.trim() || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Searching..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EmptyContactList({ onAddContact }: { onAddContact: (user: User) => void }) {
  return (
    <div className='flex flex-col h-full items-center justify-center p-4 text-center'>
      <div className='flex flex-col items-center gap-4'>
        <AddContactDialog onAddContact={onAddContact}>
          <button className='flex items-center justify-center w-24 h-24 bg-background rounded-full border-4 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors group'>
            <Plus className='w-12 h-12 text-muted-foreground/40 group-hover:text-primary/60 transition-colors' />
          </button>
        </AddContactDialog>
        <p className="text-muted-foreground max-w-xs">No chats yet. Click the plus to find someone and start messaging!</p>
      </div>
    </div>
  )
}

function ContactListSkeleton() {
    return (
        <div className="flex flex-col p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                           <Skeleton className="h-4 w-2/4" />
                           <Skeleton className="h-3 w-1/4" />
                        </div>
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function ContactList({ contacts, activeContactId, onSelectContact, onAddContact, onDeleteContact, onShowSettings, isLoading }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const { user: currentUser } = useAuth();
  
  useEffect(() => {
    if (searchTerm === ADMIN_SECRET_CODE && currentUser?.phoneNumber === ADMIN_PHONE_NUMBER) {
      setShowAdminPanel(true);
    } else {
      setShowAdminPanel(false);
    }
  }, [searchTerm, currentUser?.phoneNumber]);


  const sortedContacts = useMemo(() => {
    return [...contacts].sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      if (isNaN(timeA)) return 1; // Put contacts with invalid time at the end
      if (isNaN(timeB)) return -1; // Keep contacts with valid time at the front
      return timeB - timeA;
    });
  }, [contacts]);

  const filteredContacts = sortedContacts.filter((contact) =>
    contact.name && contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleBackToContacts = () => {
    setShowAdminPanel(false);
    setSearchTerm('');
  }

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
        onDeleteContact(contactToDelete.id);
    }
    setIsDeleteDialogOpen(false);
    setContactToDelete(null);
  };


  if (showAdminPanel) {
    return <AdminDashboard onBack={handleBackToContacts} />;
  }

  const Row = ({ index, data: contact }: { index: number, data: Contact }) => (
    <div
      key={contact.id}
      role="button"
      tabIndex={0}
      onClick={() => onSelectContact(contact.id)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectContact(contact.id)}
      className={cn(
        'flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        activeContactId === contact.id && 'bg-muted'
      )}
    >
      <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12">
              <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint="person" />
              <AvatarFallback>{contact.name ? contact.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
          </Avatar>
          {contact.online && (
             <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card" />
          )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="truncate font-semibold text-foreground">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{formatTimestamp(contact.lastMessageTime)}</p>
        </div>
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm text-muted-foreground">{contact.isTyping ? <span className="italic text-primary">typing...</span> : contact.lastMessage}</p>
          {contact.unreadCount > 0 && (
            <Badge variant="default" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0">
              {contact.unreadCount}
            </Badge>
          )}
        </div>
      </div>
       {contact.id !== AI_CONTACT_ID && (
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 -translate-y-1/2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                  >
                      <MoreVertical className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                      onClick={(e) => handleDeleteClick(contact, e)}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Chat</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
        return <ContactListSkeleton />
    }
    if (contacts.length <= 1 && !searchTerm) { // Only AI chat is there
        return <EmptyContactList onAddContact={onAddContact} />
    }
    if (filteredContacts.length > 0) {
        return (
          <Virtuoso
              style={{ flex: 1 }}
              data={filteredContacts}
              itemContent={(index, contact) => <Row index={index} data={contact} />}
          />
        )
    }
    return (
        <div className="p-4 text-center text-sm text-muted-foreground">
            No contacts found.
        </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">ChirpChat</h1>
          <div className="flex items-center gap-1">
             <AddContactDialog onAddContact={onAddContact}>
                <Button variant="ghost" size="icon">
                   <Plus className="h-5 w-5" />
                </Button>
             </AddContactDialog>
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onShowSettings}>
                        <Settings className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
          {renderContent()}
      </div>

       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete your chat history with {contactToDelete?.name}. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
````

---

# File: workspace/src/components/message-bubble.tsx

````tsx
'use client';

import { Check, CheckCheck, Bot, Sparkles, Image as ImageIcon, Trash2, Video, MoreHorizontal, Download } from 'lucide-react';
import Image from 'next/image';
import { cn, formatTimestamp } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { RobotIcon } from '@/app/robot-icon';


interface MessageBubbleProps {
  message: Message;
  contactAvatar: string;
  isFirstInGroup: boolean;
  onImagine: (prompt: string, baseImage: string) => void;
  onDelete: (dbKey?: string) => void;
}

const ReadStatusIcon = ({ status }: { status: Message['status'] }) => {
  if (status === 'read') {
    return <CheckCheck className="h-4 w-4 text-blue-500" />;
  }
  if (status === 'delivered') {
    return <CheckCheck className="h-4 w-4 text-muted-foreground" />;
  }
  return <Check className="h-4 w-4 text-muted-foreground" />;
};

const isAI = (sender: string) => sender === 'ai-assistant';


export function MessageBubble({ message, contactAvatar, isFirstInGroup, onImagine, onDelete }: MessageBubbleProps) {
  const { user: currentUser } = useAuth();
  const isMyMessage = currentUser ? message.sender === currentUser.phoneNumber : false;
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const mediaUrl = message.video || message.image;
  const isVideo = !!message.video;

  const handleEditImage = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim() && message.image) {
      onImagine(prompt, message.image);
      setIsPromptOpen(false);
      setPrompt("");
    }
  }

  const handleDelete = () => {
    onDelete(message.db_key);
    setIsDeleteConfirmOpen(false);
  }

  const handleDownload = () => {
    if (!mediaUrl) return;
    const link = document.createElement('a');
    link.href = mediaUrl;
    // Extract extension from MIME type, default to .png or .mp4
    const mimeType = mediaUrl.match(/data:(.*);/)?.[1];
    const extension = mimeType?.split('/')[1] || (isVideo ? 'mp4' : 'png');
    link.download = `chirpchat-media-${message.id}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const senderIsAI = isAI(message.sender);
  const canBeDeleted = (isMyMessage || senderIsAI) && (message.content || mediaUrl) && !message.isGenerating;
  const canBeEdited = (isMyMessage || senderIsAI) && message.image && !isVideo && !message.isGenerating;
  const canBeDownloaded = mediaUrl && !message.isGenerating;

  return (
    <div
      className={cn(
        'flex items-end gap-2 message-in',
        isMyMessage ? 'justify-end' : 'justify-start'
      )}
    >
      {!isMyMessage && (
        <Avatar className={cn('h-8 w-8', !isFirstInGroup && 'invisible')}>
          <AvatarImage src={contactAvatar} alt="Contact" />
          <AvatarFallback>{senderIsAI ? <RobotIcon className="h-5 w-5" /> : 'C'}</AvatarFallback>
        </Avatar>
      )}
      <Card
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg p-0 shadow-md group relative',
          isMyMessage
            ? 'rounded-br-none bg-primary text-primary-foreground'
            : 'rounded-bl-none bg-card text-card-foreground',
          message.isGenerating && 'bg-muted text-muted-foreground',
          senderIsAI && 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <CardContent className="p-3">
          {message.isGenerating && (
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p className="text-sm">Generating...</p>
            </div>
          )}
          {mediaUrl && (
            <div className="relative">
              {isVideo ? (
                <div className="relative w-full aspect-video rounded-md bg-black flex items-center justify-center">
                    <video key={mediaUrl} src={mediaUrl} controls className="max-w-full max-h-full rounded-md" />
                </div>
              ) : (
                <Image
                  src={mediaUrl}
                  alt="Shared media"
                  width={300}
                  height={200}
                  className={cn("rounded-md mb-2 object-cover", message.isGenerating && "opacity-50")}
                />
              )}
            </div>
          )}
          {message.content && (
            <div className="flex items-start gap-2">
               {(senderIsAI && !isMyMessage) && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {!message.isGenerating && (canBeEdited || canBeDeleted || canBeDownloaded) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                       canBeEdited && "bg-accent/80 text-accent-foreground shadow-md hover:bg-accent hover:shadow-lg hover:ring-2 hover:ring-accent/50 animate-pulse hover:animate-none",
                       !canBeEdited && isMyMessage && "bg-primary/50 hover:bg-primary/60 text-primary-foreground",
                       !isMyMessage && "bg-card/50 hover:bg-muted text-card-foreground"
                    )}
                  >
                     {canBeEdited ? <Sparkles className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canBeDownloaded && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Download</span>
                    </DropdownMenuItem>
                  )}
                  {canBeEdited && (
                    <DropdownMenuItem onClick={() => setIsPromptOpen(true)}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      <span>Edit with AI</span>
                    </DropdownMenuItem>
                  )}
                  {(canBeDownloaded || canBeEdited) && canBeDeleted && <DropdownMenuSeparator />}
                  {canBeDeleted && (
                    <DropdownMenuItem onClick={() => setIsDeleteConfirmOpen(true)} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          <div className="mt-1 flex items-center justify-end gap-2">
            <span className={cn('text-xs', isMyMessage && !message.isGenerating ? 'text-primary-foreground/70' : 'text-muted-foreground', senderIsAI && 'text-secondary-foreground/70')}>
              {formatTimestamp(message.timestamp)}
            </span>
            {isMyMessage && !message.isGenerating && <ReadStatusIcon status={message.status} />}
          </div>
        </CardContent>
      </Card>
      
      {/* AI Edit Image Dialog */}
      <Dialog open={isPromptOpen} onOpenChange={setIsPromptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Image with AI</DialogTitle>
            <DialogDescription>
              Describe the changes you want to make to the image.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditImage} className="space-y-4">
            <Input 
              placeholder="e.g. 'Make it a sunny day'" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!prompt.trim()}>Generate</Button>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
````

---

# File: workspace/src/lib/utils.ts

````ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function compressImage(file: File, quality = 0.8, maxWidth = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = reject;
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Use 'image/webp' for better compression, fallback to 'image/jpeg'
        const dataUrl = canvas.toDataURL('image/webp', quality);
        if (dataUrl.length > 10) { // Check if webp is supported
           resolve(dataUrl);
        } else {
           resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
    };
  });
}

export const formatTimestamp = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) {
            // If it's already formatted (like "8:49 PM"), just return it.
            if (typeof isoString === 'string' && (isoString.includes('AM') || isoString.includes('PM'))) {
              return isoString;
            }
            throw new Error('Invalid date');
        }
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
        }).format(date);
    } catch (e) {
        console.error("Invalid timestamp format:", isoString);
        return '';
    }
}
````

---
---
---
