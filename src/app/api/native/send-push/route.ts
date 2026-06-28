export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { adminApp } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { receiverPhone, senderName, messageText, chatId } = body;

    if (!receiverPhone || !senderName || !messageText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const app = adminApp;
    const db = app.database();
    
    // Fetch the receiver's FCM token from Realtime Database
    const userSnapshot = await db.ref(`users/${receiverPhone}`).once("value");
    if (!userSnapshot.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = userSnapshot.val();
    const fcmToken = userData.fcmToken;

    if (!fcmToken) {
      return NextResponse.json({ success: true, message: "User has no FCM token, skipping push notification" });
    }

    // Send push notification via Firebase Admin SDK
    await app.messaging().send({
      token: fcmToken,
      notification: {
        title: senderName,
        body: messageText,
      },
      data: {
        chatId: chatId || "",
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK"
        }
      }
    });

    return NextResponse.json({ success: true, message: "Push notification sent successfully" });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
