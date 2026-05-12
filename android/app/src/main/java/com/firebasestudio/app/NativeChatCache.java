package com.firebasestudio.app;

import android.content.Context;

import androidx.annotation.NonNull;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public class NativeChatCache {

    private static final int MAX_CACHED_CHATS = 200;
    private static final int MAX_CACHED_MESSAGES = 160;

    private final File rootDirectory;

    public NativeChatCache(@NonNull Context context) {
        rootDirectory = new File(context.getFilesDir(), "native-chat-cache");
        if (!rootDirectory.exists()) {
            //noinspection ResultOfMethodCallIgnored
            rootDirectory.mkdirs();
        }
    }

    @NonNull
    public synchronized List<ChatPreview> getCachedChats(@NonNull String currentUserPhone) {
        JSONArray array = readArray(chatListFile(currentUserPhone));
        List<ChatPreview> chats = new ArrayList<>();
        for (int index = 0; index < array.length(); index++) {
            JSONObject item = array.optJSONObject(index);
            if (item == null) {
                continue;
            }
            chats.add(new ChatPreview(
                    item.optString("id"),
                    item.optString("name"),
                    item.optString("preview"),
                    item.optString("time"),
                    item.optInt("unreadCount", 0),
                    item.optBoolean("online", false),
                    emptyToNull(item.optString("avatarUrl", null)),
                    item.optLong("timeSortKey", 0L)
            ));
        }
        return chats;
    }

    public synchronized void putCachedChats(@NonNull String currentUserPhone, @NonNull List<ChatPreview> chats) {
        JSONArray array = new JSONArray();
        int limit = Math.min(chats.size(), MAX_CACHED_CHATS);
        for (int index = 0; index < limit; index++) {
            ChatPreview chat = chats.get(index);
            try {
                JSONObject item = new JSONObject();
                item.put("id", chat.getId());
                item.put("name", chat.getName());
                item.put("preview", chat.getPreview());
                item.put("time", chat.getTime());
                item.put("unreadCount", chat.getUnreadCount());
                item.put("online", chat.isOnline());
                item.put("avatarUrl", chat.getAvatarUrl());
                item.put("timeSortKey", chat.getTimeSortKey());
                array.put(item);
            } catch (JSONException ignored) {
                // Skip malformed items and keep the rest of the cache usable.
            }
        }
        writeArray(chatListFile(currentUserPhone), array);
    }

    @NonNull
    public synchronized List<MessageUiModel> getCachedMessages(@NonNull String currentUserPhone, @NonNull String otherPhone) {
        JSONArray array = readArray(conversationFile(currentUserPhone, otherPhone));
        List<MessageUiModel> messages = new ArrayList<>();
        for (int index = 0; index < array.length(); index++) {
            JSONObject item = array.optJSONObject(index);
            if (item == null) {
                continue;
            }
            messages.add(new MessageUiModel(
                    item.optString("text"),
                    item.optString("meta"),
                    item.optBoolean("sentByMe", false),
                    emptyToNull(item.optString("imageUrl", null)),
                    emptyToNull(item.optString("videoUrl", null)),
                    emptyToNull(item.optString("audioUrl", null))
            ));
        }
        return messages;
    }

    public synchronized void putCachedMessages(@NonNull String currentUserPhone, @NonNull String otherPhone, @NonNull List<MessageUiModel> messages) {
        JSONArray array = new JSONArray();
        int startIndex = Math.max(0, messages.size() - MAX_CACHED_MESSAGES);
        for (int index = startIndex; index < messages.size(); index++) {
            MessageUiModel message = messages.get(index);
            try {
                JSONObject item = new JSONObject();
                item.put("text", message.getText());
                item.put("meta", message.getMeta());
                item.put("sentByMe", message.isSentByMe());
                item.put("imageUrl", message.getImageUrl());
                item.put("videoUrl", message.getVideoUrl());
                item.put("audioUrl", message.getAudioUrl());
                array.put(item);
            } catch (JSONException ignored) {
                // Skip malformed items and keep the rest of the cache usable.
            }
        }
        writeArray(conversationFile(currentUserPhone, otherPhone), array);
    }

    public synchronized void clearUser(@NonNull String currentUserPhone) {
        deleteRecursively(userDirectory(currentUserPhone));
    }

    @NonNull
    private File chatListFile(@NonNull String currentUserPhone) {
        File directory = ensureUserDirectory(currentUserPhone);
        return new File(directory, "chats.json");
    }

    @NonNull
    private File conversationFile(@NonNull String currentUserPhone, @NonNull String otherPhone) {
        File directory = ensureUserDirectory(currentUserPhone);
        return new File(directory, "messages-" + digest(otherPhone) + ".json");
    }

    @NonNull
    private JSONArray readArray(@NonNull File file) {
        if (!file.exists()) {
            return new JSONArray();
        }
        try (FileInputStream inputStream = new FileInputStream(file)) {
            byte[] bytes = readFully(inputStream);
            String raw = new String(bytes, StandardCharsets.UTF_8);
            if (raw.trim().isEmpty()) {
                return new JSONArray();
            }
            return new JSONArray(raw);
        } catch (Exception ignored) {
            return new JSONArray();
        }
    }

    private void writeArray(@NonNull File file, @NonNull JSONArray array) {
        try (FileOutputStream outputStream = new FileOutputStream(file, false)) {
            outputStream.write(array.toString().getBytes(StandardCharsets.UTF_8));
            outputStream.flush();
        } catch (Exception ignored) {
            // We can safely ignore cache write failures and continue using the live Firebase feed.
        }
    }

    private byte[] readFully(@NonNull FileInputStream inputStream) throws java.io.IOException {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            return outputStream.toByteArray();
        }
    }

    private void deleteIfExists(@NonNull File file) {
        if (file.exists()) {
            //noinspection ResultOfMethodCallIgnored
            file.delete();
        }
    }

    private void deleteRecursively(@NonNull File file) {
        if (!file.exists()) {
            return;
        }
        if (file.isDirectory()) {
            File[] children = file.listFiles();
            if (children != null) {
                for (File child : children) {
                    if (child != null) {
                        deleteRecursively(child);
                    }
                }
            }
        }
        deleteIfExists(file);
    }

    @NonNull
    private String digest(@NonNull String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte current : bytes) {
                builder.append(String.format("%02x", current));
            }
            return builder.toString();
        } catch (Exception exception) {
            return Integer.toHexString(value.hashCode());
        }
    }

    private String emptyToNull(String value) {
        if (value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value)) {
            return null;
        }
        return value;
    }

    @NonNull
    private File ensureUserDirectory(@NonNull String currentUserPhone) {
        File directory = userDirectory(currentUserPhone);
        if (!directory.exists()) {
            //noinspection ResultOfMethodCallIgnored
            directory.mkdirs();
        }
        return directory;
    }

    @NonNull
    private File userDirectory(@NonNull String currentUserPhone) {
        return new File(rootDirectory, digest(currentUserPhone));
    }
}
