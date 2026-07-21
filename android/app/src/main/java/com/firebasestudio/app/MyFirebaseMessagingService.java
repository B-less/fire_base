package com.firebasestudio.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.RemoteInput;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "chirp_chat_notifications";
    private static final String REPLY_KEY = "reply_key";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        String title = "New Message";
        String body = "You received a new message";
        String chatId = null;

        if (remoteMessage.getNotification() != null) {
            title = remoteMessage.getNotification().getTitle();
            body = remoteMessage.getNotification().getBody();
        }

        if (remoteMessage.getData().size() > 0) {
            if (remoteMessage.getData().containsKey("title")) {
                title = remoteMessage.getData().get("title");
            }
            if (remoteMessage.getData().containsKey("body")) {
                body = remoteMessage.getData().get("body");
            }
            if (remoteMessage.getData().containsKey("chatId")) {
                chatId = remoteMessage.getData().get("chatId");
            }
        }

        sendNotification(title, body, chatId);
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "Refreshed token: " + token);
        try {
            NativeSessionManager sessionManager = new NativeSessionManager(this);
            NativeSessionManager.NativeUserSession session = sessionManager.getSession();
            if (session != null && session.getPhoneNumber() != null) {
                new FirebaseChatRepository().updateFcmToken(session.getPhoneNumber(), token);
            } else {
                Log.w(TAG, "Session or phone number is null, skipping FCM token update");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error updating FCM token", e);
        }
    }

    private void sendNotification(String title, String messageBody, String chatId) {
        try {
            Intent intent;
            if (chatId != null && !chatId.isEmpty()) {
                intent = new Intent(this, ConversationActivity.class);
                intent.putExtra(ConversationActivity.EXTRA_CHAT_ID, chatId);
                intent.putExtra(ConversationActivity.EXTRA_CHAT_NAME, title);
            } else {
                intent = new Intent(this, NativeHomeActivity.class);
            }
            
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            // Use unique notification ID to prevent overwrites
            int notificationId = generateNotificationId(chatId);
            
            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this, 
                    notificationId,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );

            NotificationManager notificationManager =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            
            if (notificationManager == null) {
                Log.e(TAG, "NotificationManager is null");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Chat Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Notifications for new chat messages");
                notificationManager.createNotificationChannel(channel);
            }

            NotificationCompat.Builder notificationBuilder =
                    new NotificationCompat.Builder(this, CHANNEL_ID)
                            .setSmallIcon(R.mipmap.ic_launcher_round)
                            .setContentTitle(title)
                            .setContentText(messageBody)
                            .setAutoCancel(true)
                            .setContentIntent(pendingIntent)
                            .setPriority(NotificationCompat.PRIORITY_HIGH);
            
            // Add notification actions (reply and mark-as-read)
            addNotificationActions(notificationBuilder, chatId, notificationId);

            notificationManager.notify(notificationId, notificationBuilder.build());
            Log.d(TAG, "Notification sent with ID: " + notificationId);
        } catch (Exception e) {
            Log.e(TAG, "Error sending notification", e);
        }
    }
    
    /**
     * Generate unique notification ID based on chat ID
     */
    private int generateNotificationId(String chatId) {
        if (chatId != null && !chatId.isEmpty()) {
            return Math.abs(chatId.hashCode());
        }
        return (int) System.currentTimeMillis() % Integer.MAX_VALUE;
    }
    
    /**
     * Add quick action buttons to notification (reply and mark-as-read)
     */
    private void addNotificationActions(
            NotificationCompat.Builder builder,
            String chatId,
            int notificationId
    ) {
        try {
            // Reply action
            RemoteInput remoteInput = new RemoteInput.Builder(REPLY_KEY)
                    .setLabel("Reply")
                    .build();
            
            Intent replyIntent = new Intent(this, NotificationReplyReceiver.class);
            replyIntent.putExtra("chatId", chatId);
            replyIntent.putExtra("notificationId", notificationId);
            
            PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
                    this,
                    notificationId,
                    replyIntent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            NotificationCompat.Action replyAction = new NotificationCompat.Action.Builder(
                    0,
                    "Reply",
                    replyPendingIntent
            ).addRemoteInput(remoteInput).build();
            
            builder.addAction(replyAction);
            
            // Mark-as-read action
            Intent markReadIntent = new Intent(this, NotificationActionReceiver.class);
            markReadIntent.setAction("MARK_AS_READ");
            markReadIntent.putExtra("chatId", chatId);
            markReadIntent.putExtra("notificationId", notificationId);
            
            PendingIntent markReadPendingIntent = PendingIntent.getBroadcast(
                    this,
                    notificationId + 1,
                    markReadIntent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            builder.addAction(0, "Mark as Read", markReadPendingIntent);
            
        } catch (Exception e) {
            Log.w(TAG, "Error adding notification actions", e);
        }
    }
}
