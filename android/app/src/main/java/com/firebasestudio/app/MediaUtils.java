package com.firebasestudio.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class MediaUtils {

    private static final ExecutorService MEDIA_EXECUTOR = Executors.newFixedThreadPool(3);
    private static final Handler MAIN_HANDLER = new Handler(Looper.getMainLooper());

    public interface BitmapCallback {
        void onResult(@Nullable Bitmap bitmap);
    }

    public interface UriCallback {
        void onResult(@Nullable Uri uri);
    }

    private MediaUtils() {
    }

    public static boolean isDataUrl(@Nullable String value) {
        return value != null && value.startsWith("data:");
    }

    @Nullable
    public static Bitmap decodeImage(@NonNull Context context, @Nullable String mediaUrl) {
        try {
            if (mediaUrl != null && (mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://"))) {
                try (InputStream inputStream = context.getContentResolver().openInputStream(Uri.parse(mediaUrl))) {
                    return BitmapFactory.decodeStream(inputStream);
                }
            }
            File cachedFile = ensureCachedFile(context, mediaUrl, "image");
            if (cachedFile == null || !cachedFile.exists()) {
                return null;
            }
            try (FileInputStream inputStream = new FileInputStream(cachedFile)) {
                return BitmapFactory.decodeStream(inputStream);
            }
        } catch (Exception ignored) {
            return null;
        }
    }

    public static void decodeImageAsync(@NonNull Context context, @Nullable String mediaUrl, @NonNull BitmapCallback callback) {
        MEDIA_EXECUTOR.execute(() -> {
            Bitmap bitmap = decodeImage(context, mediaUrl);
            MAIN_HANDLER.post(() -> callback.onResult(bitmap));
        });
    }

    public static void loadImageInto(@NonNull Context context, @Nullable String mediaUrl, @NonNull ImageView imageView, int placeholderRes) {
        imageView.setTag(mediaUrl);
        imageView.setImageResource(placeholderRes);

        if (mediaUrl == null || mediaUrl.trim().isEmpty()) {
            return;
        }

        MEDIA_EXECUTOR.execute(() -> {
            Bitmap bitmap = decodeImage(context, mediaUrl);
            MAIN_HANDLER.post(() -> {
                Object currentTag = imageView.getTag();
                if (!(currentTag instanceof String) || !mediaUrl.equals(currentTag) || bitmap == null) {
                    return;
                }
                imageView.setImageBitmap(bitmap);
            });
        });
    }

    public static void writeToCacheAsync(@NonNull Context context, @Nullable String mediaUrl, @NonNull String prefix, @NonNull UriCallback callback) {
        MEDIA_EXECUTOR.execute(() -> {
            Uri uri = writeToCache(context, mediaUrl, prefix);
            MAIN_HANDLER.post(() -> callback.onResult(uri));
        });
    }

    @Nullable
    public static Uri writeToCache(Context context, @Nullable String mediaUrl, String prefix) {
        try {
            if (mediaUrl != null && (mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://"))) {
                return Uri.parse(mediaUrl);
            }
            File cachedFile = ensureCachedFile(context, mediaUrl, prefix);
            if (cachedFile == null) {
                return mediaUrl != null ? Uri.parse(mediaUrl) : null;
            }
            return Uri.fromFile(cachedFile);
        } catch (Exception ignored) {
            return mediaUrl != null ? Uri.parse(mediaUrl) : null;
        }
    }

    @Nullable
    private static File ensureCachedFile(@NonNull Context context, @Nullable String mediaUrl, @NonNull String prefix) throws Exception {
        if (mediaUrl == null || mediaUrl.trim().isEmpty()) {
            return null;
        }

        File mediaDirectory = new File(context.getCacheDir(), "chirp-media");
        if (!mediaDirectory.exists()) {
            //noinspection ResultOfMethodCallIgnored
            mediaDirectory.mkdirs();
        }

        String extension = detectExtension(mediaUrl);
        File target = new File(mediaDirectory, prefix + "-" + hashFor(mediaUrl) + "." + extension);
        if (target.exists() && target.length() > 0) {
            return target;
        }

        byte[] bytes = extractBytes(context, mediaUrl);
        if (bytes == null) {
            return null;
        }

        try (BufferedOutputStream outputStream = new BufferedOutputStream(new FileOutputStream(target))) {
            outputStream.write(bytes);
            outputStream.flush();
        }
        return target;
    }

    @Nullable
    private static byte[] extractBytes(@NonNull Context context, @Nullable String mediaUrl) throws Exception {
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
            connection.setInstanceFollowRedirects(true);
            connection.setUseCaches(true);
            try (InputStream stream = new BufferedInputStream(connection.getInputStream())) {
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

        if (mediaUrl.startsWith("content://") || mediaUrl.startsWith("file://")) {
            Uri uri = Uri.parse(mediaUrl);
            try (InputStream stream = context.getContentResolver().openInputStream(uri)) {
                if (stream == null) {
                    return null;
                }
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                int read;
                while ((read = stream.read(chunk)) != -1) {
                    buffer.write(chunk, 0, read);
                }
                return buffer.toByteArray();
            }
        }

        return null;
    }

    @NonNull
    private static String detectExtension(@NonNull String mediaUrl) {
        if (isDataUrl(mediaUrl)) {
            int slashIndex = mediaUrl.indexOf('/');
            int semicolonIndex = mediaUrl.indexOf(';');
            if (slashIndex > 0 && semicolonIndex > slashIndex) {
                return sanitizeExtension(mediaUrl.substring(slashIndex + 1, semicolonIndex));
            }
        }

        try {
            String path = Uri.parse(mediaUrl).getLastPathSegment();
            if (path != null) {
                int dotIndex = path.lastIndexOf('.');
                if (dotIndex >= 0 && dotIndex < path.length() - 1) {
                    return sanitizeExtension(path.substring(dotIndex + 1));
                }
            }
        } catch (Exception ignored) {
        }
        return "bin";
    }

    @NonNull
    private static String sanitizeExtension(@Nullable String extension) {
        if (extension == null) {
            return "bin";
        }
        String normalized = extension.toLowerCase(Locale.US).replaceAll("[^a-z0-9]", "");
        return normalized.isEmpty() ? "bin" : normalized;
    }

    @NonNull
    private static String hashFor(@NonNull String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte current : bytes) {
                builder.append(String.format(Locale.US, "%02x", current));
            }
            return builder.toString();
        } catch (Exception exception) {
            return Integer.toHexString(value.hashCode());
        }
    }
}
