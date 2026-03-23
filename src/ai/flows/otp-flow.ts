'use server';

/**
 * @fileOverview OTP generation and verification flows using Africa's Talking.
 *
 * - sendOtp - Generates and sends an OTP to a user's phone number.
 * - verifyOtp - Verifies a user-submitted OTP.
 */

import { ai } from '@/ai/genkit';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';
import AfricasTalking from 'africastalking';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'genkit';

const SendOtpInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to send the OTP to, in international format.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

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
  customToken: z.string().optional(),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

const africasTalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_APIKEY!,
  username: process.env.AFRICASTALKING_USERNAME!,
});

const sms = africasTalking.SMS;
const africaTalkingSenderId =
  process.env.AFRICASTALKING_SENDER_ID || process.env.AFRICASTALKING_FROM;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
  return verifyOtpFlow(input);
}

export async function cleanupExpiredOtps(): Promise<void> {
  return cleanupExpiredOtpsFlow();
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async ({ phoneNumber }) => {
    const otpRef = adminDb.ref(`otps/${phoneNumber}`);
    const existingOtp = await otpRef.get();

    if (existingOtp.exists() && existingOtp.val().createdAt > Date.now() - 60 * 1000) {
      return {
        success: false,
        message: 'An OTP was recently sent. Please wait a minute before trying again.',
      };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = Date.now() + 5 * 60 * 1000;
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (!africaTalkingSenderId) {
      console.error("Africa's Talking sender ID is not configured.");
      return {
        success: false,
        message: 'SMS delivery is not configured yet. Please contact support.',
      };
    }

    try {
      const result = await sms.send({
        to: [phoneNumber],
        from: africaTalkingSenderId,
        message: `Your ChirpChat verification code is: ${otp}. It will expire in 5 minutes.`,
      });

      const smsResult = result as unknown as {
        SMSMessageData?: {
          Recipients?: Array<{ statusCode: number }>;
        };
        Recipients?: Array<{ statusCode: number }> | { statusCode: number };
      };
      const recipients =
        smsResult.SMSMessageData?.Recipients ??
        (Array.isArray(smsResult.Recipients)
          ? smsResult.Recipients
          : smsResult.Recipients
            ? [smsResult.Recipients]
            : []);

      if (recipients.length > 0 && recipients.every((recipient) => recipient.statusCode < 200)) {
        await otpRef.set({
          hashedOtp,
          expires,
          createdAt: Date.now(),
        });

        return { success: true, message: 'OTP sent successfully.' };
      }

      console.error("Africa's Talking error:", smsResult);
      return { success: false, message: 'Failed to send OTP. Please check the phone number.' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return { success: false, message: 'An unexpected error occurred while sending the OTP.' };
    }
  }
);

const verifyOtpFlow = ai.defineFlow(
  {
    name: 'verifyOtpFlow',
    inputSchema: VerifyOtpInputSchema,
    outputSchema: VerifyOtpOutputSchema,
  },
  async ({ phoneNumber, otp }) => {
    const otpRef = adminDb.ref(`otps/${phoneNumber}`);
    const otpDataSnapshot = await otpRef.get();

    if (!otpDataSnapshot.exists()) {
      return { success: false, message: 'Invalid or expired OTP. Please try again.' };
    }

    const otpData = otpDataSnapshot.val();

    if (otpData.expires < Date.now()) {
      await otpRef.remove();
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    const isValid = await bcrypt.compare(otp, otpData.hashedOtp);
    if (!isValid) {
      return { success: false, message: 'The OTP entered is incorrect.' };
    }

    const userRef = adminDb.ref(`users/${phoneNumber}`);
    let userSnapshot = await userRef.get();
    let userData = userSnapshot.val() as User | null;
    let isNewUser = false;

    if (userData?.status?.account && userData.status.account !== 'active') {
      await otpRef.remove();

      if (userData.status.account === 'banned') {
        return { success: false, message: 'This account has been banned.' };
      }

      if (userData.status.account === 'disabled') {
        return { success: false, message: 'This account is currently disabled.' };
      }
    }

    await otpRef.remove();

    if (!userSnapshot.exists()) {
      isNewUser = true;
      const name = `User${phoneNumber.slice(-4)}`;
      const newUser: Omit<User, 'phoneNumber'> = {
        name,
        status: { online: false, lastSeen: 0, account: 'active' },
        contacts: [],
      };

      await userRef.set(newUser);
      userSnapshot = await userRef.get();
      userData = userSnapshot.val();
    }

    const user = { ...userData, phoneNumber };
    const customToken = await adminAuth.createCustomToken(phoneNumber, {
      phoneNumber,
    });

    return {
      success: true,
      message: 'Phone number verified successfully.',
      user,
      isNewUser,
      customToken,
    };
  }
);

const cleanupExpiredOtpsFlow = ai.defineFlow(
  {
    name: 'cleanupExpiredOtpsFlow',
  },
  async () => {
    const otpsRef = adminDb.ref('otps');
    const snapshot = await otpsRef.get();

    if (!snapshot.exists()) {
      return;
    }

    const now = Date.now();
    const updates: Record<string, null> = {};

    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.val().expires < now) {
        updates[childSnapshot.key!] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await otpsRef.update(updates);
      console.log(`Cleaned up ${Object.keys(updates).length} expired OTPs.`);
    }
  }
);
