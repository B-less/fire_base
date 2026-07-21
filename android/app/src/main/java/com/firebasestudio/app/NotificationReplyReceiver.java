package com.firebasestudio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.core.app.RemoteInput;

/**
 * Handles direct reply to notifications
 */
public class NotificationReplyReceiver extends BroadcastReceiver {
    
    private static final String TAG = "NotificationReply";
    private static final String REPLY_KEY = "reply_key";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String chatId = intent.getStringExtra("chatId");
            int notificationId = intent.getIntExtra("notificationId", -1);
            
            CharSequence replyText = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
                Bundle remoteInputResults = RemoteInput.getResultsFromIntent(intent);
                if (remoteInputResults != null) {
                    replyText = remoteInputResults.getCharSequence(REPLY_KEY);
                }
            }
            
            if (replyText != null && !replyText.toString().isEmpty() && chatId != null) {
                Log.d(TAG, "Received reply for chat: " + chatId);
                // TODO: Implement send message logic
                // Example: new FirebaseChatRepository().sendMessage(chatId, replyText.toString());
                
                // Dismiss notification after reply
                dismissNotification(context, notificationId);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling notification reply", e);
        }
    }
    
    private void dismissNotification(Context context, int notificationId) {
        try {
            android.app.NotificationManager notificationManager = 
                    (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(notificationId);
            }
        } catch (Exception e) {
            Log.w(TAG, "Error dismissing notification", e);
        }
    }
}
