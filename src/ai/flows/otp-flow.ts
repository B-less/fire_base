
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
const africaTalkingSenderId =
  process.env.AFRICASTALKING_SENDER_ID || process.env.AFRICASTALKING_FROM;

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
        message: `Your ChirpChat verification code is: ${otp}. It will expire in 5 minutes.`
      });

      const smsResult = result as unknown as {
        SMSMessageData?: {
          Recipients?: Array<{ statusCode: number }>;
        };
        Recipients?: Array<{ statusCode: number }> | { statusCode: number };
      };
      const recipients = smsResult.SMSMessageData?.Recipients
        ?? (Array.isArray(smsResult.Recipients)
          ? smsResult.Recipients
          : smsResult.Recipients
            ? [smsResult.Recipients]
            : []);

      // Check if the status code for all recipients indicates success (less than 200)
       if (recipients.length > 0 && recipients.every((r) => r.statusCode < 200)) {
         // 4. Save OTP to database
        await set(otpRef, {
            hashedOtp,
            expires,
            createdAt: Date.now()
        });

        return { success: true, message: 'OTP sent successfully.' };
      } else {
        console.error("Africa's Talking error:", smsResult);
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
  sessionToken: z.string().optional(),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const createSessionToken = async (phoneNumber: string) => {
  const sessionId = crypto.randomUUID();
  const secret = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(secret).digest('hex');

  await set(ref(db, `sessions/${phoneNumber}/${sessionId}`), {
    hash,
    createdAt: Date.now(),
    expires: Date.now() + SESSION_DURATION_MS,
  });

  return `${phoneNumber}:${sessionId}.${secret}`;
};


export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
    return verifyOtpFlow(input);
}

export async function cleanupExpiredOtps(): Promise<void> {
  return cleanupExpiredOtpsFlow();
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
    const sessionToken = await createSessionToken(phoneNumber);

    return {
      success: true,
      message: 'Phone number verified successfully.',
      user,
      isNewUser,
      sessionToken,
    };
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
