
'use server';

/**
 * @fileOverview OTP generation and verification flows using Africa's Talking.
 *
 * - sendOtp - Generates and sends an OTP to a user's phone number.
 * - verifyOtp - Verifies a user-submitted OTP.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ref, set, get, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import AfricasTalking from 'africastalking';

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

      if (result.SMSMessageData.Recipients.every((r: any) => r.statusCode === 101)) {
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
        // Do not clean up immediately, to prevent attackers from discovering valid phone numbers
        return { success: false, message: 'The OTP entered is incorrect.' };
    }

    // 4. OTP is valid, clean up
    await remove(otpRef);

    // 5. Check if user exists, if not, create one
    const userRef = ref(db, `users/${phoneNumber}`);
    let userSnapshot = await get(userRef);

    if (!userSnapshot.exists()) {
        // Simple name generation for new user
        const name = `User${phoneNumber.slice(-4)}`;
        const newUser = {
            name: name,
            phoneNumber: phoneNumber,
            status: { online: false, lastSeen: 0 },
            contacts: []
        };
        await set(userRef, newUser);
        userSnapshot = await get(userRef);
    }
    
    const user = { ...userSnapshot.val(), phoneNumber };

    return { success: true, message: 'Phone number verified successfully.', user };
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
