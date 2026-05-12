package com.firebasestudio.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;

import androidx.annotation.Nullable;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

public final class MediaUtils {

    private MediaUtils() {
    }

    public static boolean isDataUrl(@Nullable String value) {
        return value != null && value.startsWith("data:");
    }

    @Nullable
    public static Bitmap decodeImage(@Nullable String mediaUrl) {
        try {
            byte[] bytes = extractBytes(mediaUrl);
            if (bytes == null) {
                return null;
            }
            return BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        } catch (Exception ignored) {
            return null;
        }
    }

    @Nullable
    public static Uri writeToCache(Context context, @Nullable String mediaUrl, String prefix) {
        try {
            byte[] bytes = extractBytes(mediaUrl);
            if (bytes == null) {
                return mediaUrl != null ? Uri.parse(mediaUrl) : null;
            }

            String extension = "bin";
            if (mediaUrl != null) {
                int slashIndex = mediaUrl.indexOf('/');
                int semicolonIndex = mediaUrl.indexOf(';');
                if (slashIndex > 0 && semicolonIndex > slashIndex) {
                    extension = mediaUrl.substring(slashIndex + 1, semicolonIndex);
                }
            }

            File target = new File(context.getCacheDir(), prefix + "-" + UUID.randomUUID() + "." + extension);
            try (FileOutputStream outputStream = new FileOutputStream(target)) {
                outputStream.write(bytes);
                outputStream.flush();
            }
            return Uri.fromFile(target);
        } catch (Exception ignored) {
            return mediaUrl != null ? Uri.parse(mediaUrl) : null;
        }
    }

    @Nullable
    private static byte[] extractBytes(@Nullable String mediaUrl) throws Exception {
        if (mediaUrl == null || mediaUrl.trim().isEmpty()) {
            return null;
        }

        if (isDataUrl(mediaUrl)) {
            int commaIndex = mediaUrl.indexOf(',');
            if (commaIndex < 0) {
                return null;
            }
            String base64 = mediaUrl.substring(commaIndex + 1);
            return Base64.decode(base64, Base64.DEFAULT);
        }

        if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
            HttpURLConnection connection = (HttpURLConnection) new URL(mediaUrl).openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(20000);
            try (InputStream stream = connection.getInputStream()) {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                int read;
                while ((read = stream.read(chunk)) != -1) {
                    buffer.write(chunk, 0, read);
                }
                return buffer.toByteArray();
            } finally {
                connection.disconnect();
            }
        }

        return null;
    }
}
