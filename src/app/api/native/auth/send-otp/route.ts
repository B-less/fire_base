import { NextResponse } from 'next/server';

import { sendOtp } from '@/ai/flows/otp-flow';

type SendOtpPayload = {
  phoneNumber?: unknown;
};

export async function POST(request: Request) {
  let payload: SendOtpPayload;

  try {
    payload = (await request.json()) as SendOtpPayload;
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload.' },
      { status: 400 }
    );
  }

  const phoneNumber =
    typeof payload.phoneNumber === 'string' ? payload.phoneNumber.trim() : '';

  if (!phoneNumber) {
    return NextResponse.json(
      { success: false, message: 'Phone number is required.' },
      { status: 400 }
    );
  }

  try {
    const result = await sendOtp({ phoneNumber });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('Native send OTP route failed', error);
    return NextResponse.json(
      { success: false, message: 'Could not send OTP right now. Please try again shortly.' },
      { status: 500 }
    );
  }
}
