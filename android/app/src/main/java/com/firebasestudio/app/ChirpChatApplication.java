package com.firebasestudio.app;

import android.app.Application;

import com.google.firebase.database.FirebaseDatabase;
import com.google.android.material.color.DynamicColors;

public class ChirpChatApplication extends Application {

    private static boolean firebasePersistenceEnabled = false;

    @Override
    public void onCreate() {
        super.onCreate();

        DynamicColors.applyToActivitiesIfAvailable(this);

        if (!firebasePersistenceEnabled) {
            try {
                FirebaseDatabase database = FirebaseDatabase.getInstance();
                database.setPersistenceEnabled(true);
                database.setPersistenceCacheSizeBytes(20L * 1024L * 1024L);
                firebasePersistenceEnabled = true;
            } catch (Exception ignored) {
                // If Firebase was already initialized elsewhere, we keep going with the default behavior.
            }
        }
    }
}
