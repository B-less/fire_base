import { NextResponse } from 'next/server';

import { verifyOtp } from '@/ai/flows/otp-flow';

type VerifyOtpPayload = {
  phoneNumber?: unknown;
  otp?: unknown;
};

export async function POST(request: Request) {
  let payload: VerifyOtpPayload;

  try {
    payload = (await request.json()) as VerifyOtpPayload;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload.' },
      { status: 400 }
    );
  }

  const phoneNumber =
    typeof payload.phoneNumber === 'string' ? payload.phoneNumber.trim() : '';
  const otp = typeof payload.otp === 'string' ? payload.otp.trim() : '';

  if (!phoneNumber || otp.length !== 6) {
    return NextResponse.json(
      { success: false, message: 'Phone number and 6-digit OTP are required.' },
      { status: 400 }
    );
  }

  const result = await verifyOtp({ phoneNumber, otp });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
