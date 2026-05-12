package com.firebasestudio.app;

import android.content.Context;
import android.content.SharedPreferences;

public class NativeSessionManager {

    private static final String PREFS_NAME = "chirp_chat_native_session";
    private static final String KEY_PHONE = "phone";
    private static final String KEY_NAME = "name";

    private final SharedPreferences preferences;

    public NativeSessionManager(Context context) {
        preferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public void saveSession(String phoneNumber, String name) {
        preferences.edit()
                .putString(KEY_PHONE, phoneNumber)
                .putString(KEY_NAME, name)
                .apply();
    }

    public NativeUserSession getSession() {
        String phone = preferences.getString(KEY_PHONE, null);
        String name = preferences.getString(KEY_NAME, null);
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        return new NativeUserSession(phone, name == null ? phone : name);
    }

    public void clearSession() {
        preferences.edit().clear().apply();
    }

    public static class NativeUserSession {
        private final String phoneNumber;
        private final String displayName;

        public NativeUserSession(String phoneNumber, String displayName) {
            this.phoneNumber = phoneNumber;
            this.displayName = displayName;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
