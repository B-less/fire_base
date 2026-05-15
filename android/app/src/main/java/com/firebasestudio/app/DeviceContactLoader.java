package com.firebasestudio.app;

import android.content.Context;
import android.database.Cursor;
import android.provider.ContactsContract;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class DeviceContactLoader {

    private DeviceContactLoader() {
    }

    @NonNull
    public static List<ChatPreview> loadContacts(@NonNull Context context, @NonNull String defaultCountryCode) {
        Map<String, ChatPreview> contactsByPhone = new LinkedHashMap<>();
        Cursor cursor = null;
        try {
            cursor = context.getContentResolver().query(
                    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    new String[]{
                            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                            ContactsContract.CommonDataKinds.Phone.NUMBER
                    },
                    null,
                    null,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " COLLATE NOCASE ASC"
            );
            if (cursor == null) {
                return new ArrayList<>();
            }

            int nameColumn = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
            int numberColumn = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
            while (cursor.moveToNext()) {
                String rawName = nameColumn >= 0 ? cursor.getString(nameColumn) : null;
                String rawNumber = numberColumn >= 0 ? cursor.getString(numberColumn) : null;
                String normalizedPhone = normalizeInternationalPhone(rawNumber, defaultCountryCode);
                if (!normalizedPhone.matches("^\\+[1-9][0-9]{6,14}$")) {
                    continue;
                }
                String displayName = rawName == null || rawName.trim().isEmpty() ? normalizedPhone : rawName.trim();
                if (!contactsByPhone.containsKey(normalizedPhone)) {
                    contactsByPhone.put(normalizedPhone, new ChatPreview(
                            normalizedPhone,
                            displayName,
                            normalizedPhone,
                            "",
                            0,
                            false,
                            null,
                            0L
                    ));
                }
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        return new ArrayList<>(contactsByPhone.values());
    }

    @NonNull
    public static String normalizeInternationalPhone(String rawPhoneNumber, @NonNull String defaultCountryCode) {
        if (rawPhoneNumber == null) {
            return "";
        }
        String countryCode = defaultCountryCode.trim();
        if (!countryCode.startsWith("+")) {
            countryCode = "+" + countryCode.replaceAll("[^0-9]", "");
        }
        String normalized = rawPhoneNumber.trim().replaceAll("[\\s()\\-]", "");
        if (normalized.startsWith("00")) {
            normalized = "+" + normalized.substring(2);
        }
        if (normalized.startsWith("+")) {
            return "+" + normalized.substring(1).replaceAll("[^0-9]", "");
        }
        String digits = normalized.replaceAll("[^0-9]", "");
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        return String.format(Locale.US, "%s%s", countryCode, digits);
    }
}
