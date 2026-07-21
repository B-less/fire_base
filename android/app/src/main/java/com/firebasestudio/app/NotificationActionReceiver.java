package com.firebasestudio.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Handles notification action broadcasts (mark as read, etc.)
 */
public class NotificationActionReceiver extends BroadcastReceiver {
    
    private static final String TAG = "NotificationAction";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String action = intent.getAction();
            String chatId = intent.getStringExtra("chatId");
            int notificationId = intent.getIntExtra("notificationId", -1);
            
            if ("MARK_AS_READ".equals(action) && chatId != null) {
                Log.d(TAG, "Marking chat as read: " + chatId);
                // TODO: Implement mark as read logic
                // Example: new FirebaseChatRepository().markChatAsRead(chatId);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error handling notification action", e);
        }
    }
}
