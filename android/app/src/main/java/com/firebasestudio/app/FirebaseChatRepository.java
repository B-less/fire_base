package com.firebasestudio.app;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.google.android.gms.tasks.Tasks;
import com.google.firebase.FirebaseApp;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.Query;
import com.google.firebase.database.ValueEventListener;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;
import java.util.UUID;

public class FirebaseChatRepository {

    public interface ChatsListener {
        void onChatsUpdated(List<ChatPreview> chats);
        void onError(String message);
    }

    public interface MessagesListener {
        void onMessagesUpdated(List<MessageUiModel> messages);
        void onError(String message);
    }

    public interface PresenceListener {
        void onPresenceUpdated(boolean isOnline);
    }

    public interface ContactLookupListener {
        void onFound(ChatPreview contact);
        void onNotFound();
        void onError(String message);
    }

    public interface OperationListener {
        void onSuccess();
        void onError(String message);
    }

    public interface Subscription {
        void dispose();
    }

    private final FirebaseDatabase database = FirebaseDatabase.getInstance();
    private final NativeChatCache cache;
    private final Map<String, MessagesListener> activeListeners = new HashMap<>();
    private final SimpleDateFormat isoParser;
    private final SimpleDateFormat isoFormatter;
    private final SimpleDateFormat timeFormatter;

    public FirebaseChatRepository() {
        cache = new NativeChatCache(FirebaseApp.getInstance().getApplicationContext());
        isoParser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US);
        isoParser.setTimeZone(TimeZone.getTimeZone("UTC"));
        isoFormatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US);
        isoFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));
        timeFormatter = new SimpleDateFormat("h:mm a", Locale.US);
    }

    public Subscription observeChats(@NonNull String currentUserPhone, @NonNull ChatsListener listener) {
        listener.onChatsUpdated(cache.getCachedChats(currentUserPhone));

        DatabaseReference contactsRef = database.getReference("users").child(currentUserPhone).child("contacts");
        contactsRef.keepSynced(true);
        Map<String, ContactListeners> contactListeners = new HashMap<>();
        Map<String, ChatDraft> chatDrafts = new LinkedHashMap<>();

        ValueEventListener contactsListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                List<String> contactIds = extractContactIds(snapshot);
                Collection<String> existingIds = new ArrayList<>(contactListeners.keySet());

                for (String staleId : existingIds) {
                    if (!contactIds.contains(staleId)) {
                        ContactListeners staleListeners = contactListeners.remove(staleId);
                        if (staleListeners != null) {
                            staleListeners.detach();
                        }
                        chatDrafts.remove(staleId);
                    }
                }

                for (String contactId : contactIds) {
                    if (contactListeners.containsKey(contactId)) {
                        continue;
                    }

                    ChatDraft draft = new ChatDraft(contactId, contactId);
                    chatDrafts.put(contactId, draft);

                    DatabaseReference profileRef = database.getReference("users").child(contactId);
                    Query lastMessageQuery = database.getReference("messages")
                            .child(conversationKey(currentUserPhone, contactId))
                            .limitToLast(1);
                    profileRef.keepSynced(true);
                    lastMessageQuery.keepSynced(true);

                    ValueEventListener profileListener = new ValueEventListener() {
                        @Override
                        public void onDataChange(@NonNull DataSnapshot profileSnapshot) {
                            String name = profileSnapshot.child("name").getValue(String.class);
                            String profilePicture = profileSnapshot.child("profilePicture").getValue(String.class);
                            Boolean online = profileSnapshot.child("status").child("online").getValue(Boolean.class);

                            draft.name = (name == null || name.trim().isEmpty()) ? contactId : name;
                            draft.avatarUrl = profilePicture;
                            draft.online = online != null && online;
                            publishChats(currentUserPhone, chatDrafts, listener);
                        }

                        @Override
                        public void onCancelled(@NonNull DatabaseError error) {
                            listener.onError(error.getMessage());
                        }
                    };

                    ValueEventListener lastMessageListener = new ValueEventListener() {
                        @Override
                        public void onDataChange(@NonNull DataSnapshot messageSnapshot) {
                            String previewText = "Start a conversation";
                            String previewTime = "";
                            long sortKey = 0L;
                            int unreadCount = 0;

                            for (DataSnapshot child : messageSnapshot.getChildren()) {
                                String text = child.child("content").getValue(String.class);
                                String sender = child.child("sender").getValue(String.class);
                                String status = child.child("status").getValue(String.class);
                                String timestamp = child.child("timestamp").getValue(String.class);

                                if (text != null && !text.trim().isEmpty()) {
                                    previewText = text;
                                } else if (child.hasChild("image")) {
                                    previewText = "\uD83D\uDCF7 Photo";
                                } else if (child.hasChild("video")) {
                                    previewText = "\uD83C\uDFA5 Video";
                                } else if (child.hasChild("audio")) {
                                    previewText = "\uD83C\uDFA4 Voice note";
                                }

                                previewTime = formatTimeOnly(timestamp);
                                sortKey = parseTimestampMillis(timestamp);

                                if (sender != null && !sender.equals(currentUserPhone) && !"read".equals(status)) {
                                    unreadCount = 1;
                                } else {
                                    unreadCount = 0;
                                }
                            }

                            draft.preview = previewText;
                            draft.time = previewTime;
                            draft.unreadCount = unreadCount;
                            draft.timeSortKey = sortKey;
                            publishChats(currentUserPhone, chatDrafts, listener);
                        }

                        @Override
                        public void onCancelled(@NonNull DatabaseError error) {
                            listener.onError(error.getMessage());
                        }
                    };

                    profileRef.addValueEventListener(profileListener);
                    lastMessageQuery.addValueEventListener(lastMessageListener);
                    contactListeners.put(contactId, new ContactListeners(profileRef, profileListener, lastMessageQuery, lastMessageListener));
                }

                publishChats(currentUserPhone, chatDrafts, listener);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                listener.onError(error.getMessage());
            }
        };

        contactsRef.addValueEventListener(contactsListener);

        return () -> {
            contactsRef.removeEventListener(contactsListener);
            for (ContactListeners listeners : contactListeners.values()) {
                listeners.detach();
            }
        };
    }

    public Subscription observePresence(@NonNull String phone, @NonNull PresenceListener listener) {
        DatabaseReference statusRef = database.getReference("users").child(phone).child("status").child("online");
        ValueEventListener valueListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                Boolean online = snapshot.getValue(Boolean.class);
                listener.onPresenceUpdated(online != null && online);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
            }
        };
        statusRef.addValueEventListener(valueListener);
        return () -> statusRef.removeEventListener(valueListener);
    }

    public Subscription observeConversation(@NonNull String currentUserPhone, @NonNull String otherPhone, @NonNull MessagesListener listener) {
        String conversationKey = conversationKey(currentUserPhone, otherPhone);
        activeListeners.put(conversationKey, listener);

        listener.onMessagesUpdated(cache.getCachedMessages(currentUserPhone, otherPhone));

        DatabaseReference conversationRef = database.getReference("messages").child(conversationKey);
        conversationRef.keepSynced(true);

        ValueEventListener messagesListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                List<MessageUiModel> liveMessages = new ArrayList<>();
                List<MessageUiModel> cachedMessages = cache.getCachedMessages(currentUserPhone, otherPhone);

                for (DataSnapshot child : snapshot.getChildren()) {
                    String text = child.child("content").getValue(String.class);
                    String timestamp = child.child("timestamp").getValue(String.class);
                    String sender = child.child("sender").getValue(String.class);
                    String status = child.child("status").getValue(String.class);
                    String image = child.child("image").getValue(String.class);
                    String video = child.child("video").getValue(String.class);
                    String audio = child.child("audio").getValue(String.class);
                    String clientMessageId = child.child("clientMessageId").getValue(String.class);
                    boolean sentByMe = currentUserPhone.equals(sender);
                    long sortKey = parseTimestampMillis(timestamp);

                    liveMessages.add(new MessageUiModel(
                            text == null ? "" : text,
                            formatMessageMeta(timestamp, status, sentByMe),
                            sentByMe,
                            image,
                            video,
                            audio,
                            child.getKey(),
                            clientMessageId,
                            timestamp,
                            normalizeStatus(status, sentByMe),
                            sortKey
                    ));
                }

                List<MessageUiModel> mergedMessages = mergeMessagesWithPending(liveMessages, cachedMessages);
                cache.putCachedMessages(currentUserPhone, otherPhone, mergedMessages);
                listener.onMessagesUpdated(mergedMessages);
                markMessagesRead(snapshot, conversationRef, currentUserPhone, otherPhone);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                listener.onError(error.getMessage());
            }
        };

        conversationRef.addValueEventListener(messagesListener);
        return () -> {
            activeListeners.remove(conversationKey);
            conversationRef.removeEventListener(messagesListener);
        };
    }

    public void sendMessage(
            @NonNull android.content.Context context,
            @NonNull String currentUserPhone,
            @NonNull String currentUserName,
            @NonNull String otherPhone,
            @NonNull String otherDisplayName,
            @NonNull String text
    ) {
        String optimisticTimestamp = isoNow();
        String clientMessageId = UUID.randomUUID().toString();
        long sortKey = parseTimestampMillis(optimisticTimestamp);
        DatabaseReference conversationRef = database.getReference("messages").child(conversationKey(currentUserPhone, otherPhone));
        DatabaseReference newMessageRef = conversationRef.push();

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", System.currentTimeMillis());
        payload.put("content", text);
        payload.put("timestamp", optimisticTimestamp);
        payload.put("sender", currentUserPhone);
        payload.put("status", "sent");
        payload.put("clientMessageId", clientMessageId);
        payload.put("db_key", newMessageRef.getKey());
        newMessageRef.setValue(payload)
                .addOnFailureListener(error -> {
                    markCachedMessageFailed(currentUserPhone, otherPhone, clientMessageId);
                    notifyConversationListeners(currentUserPhone, otherPhone);
                });

        database.getReference("users").child(currentUserPhone).child("name").setValue(currentUserName);

        List<MessageUiModel> cachedMessages = new ArrayList<>(cache.getCachedMessages(currentUserPhone, otherPhone));
        cachedMessages.add(new MessageUiModel(
                text,
                formatMessageMeta(optimisticTimestamp, "pending", true),
                true,
                null,
                null,
                null,
                null,
                clientMessageId,
                optimisticTimestamp,
                "pending",
                sortKey
        ));
        cache.putCachedMessages(currentUserPhone, otherPhone, cachedMessages);
        upsertCachedChatPreview(currentUserPhone, otherPhone, otherDisplayName, text, optimisticTimestamp, sortKey);
        notifyConversationListeners(currentUserPhone, otherPhone);
        
        triggerPushNotification(context, otherPhone, currentUserName, text, currentUserPhone);
    }

    public void uploadMedia(
            @NonNull android.content.Context context,
            @NonNull String currentUserPhone,
            @NonNull String currentUserName,
            @NonNull String otherPhone,
            @NonNull String otherDisplayName,
            @NonNull String fileUriString,
            @NonNull String mediaType
    ) {
        String optimisticTimestamp = isoNow();
        long sortKey = parseTimestampMillis(optimisticTimestamp);
        String clientMessageId = UUID.randomUUID().toString();
        String image = "image".equals(mediaType) ? fileUriString : null;
        String video = "video".equals(mediaType) ? fileUriString : null;
        String audio = "audio".equals(mediaType) ? fileUriString : null;

        List<MessageUiModel> cachedMessages = new ArrayList<>(cache.getCachedMessages(currentUserPhone, otherPhone));
        cachedMessages.add(new MessageUiModel(
                "",
                formatMessageMeta(optimisticTimestamp, "uploading", true),
                true,
                image,
                video,
                audio,
                null,
                clientMessageId,
                optimisticTimestamp,
                "uploading",
                sortKey
        ));
        cache.putCachedMessages(currentUserPhone, otherPhone, cachedMessages);
        upsertCachedChatPreview(currentUserPhone, otherPhone, otherDisplayName, mediaPreview(mediaType), optimisticTimestamp, sortKey);
        notifyConversationListeners(currentUserPhone, otherPhone);

        DatabaseReference conversationRef = database.getReference("messages").child(conversationKey(currentUserPhone, otherPhone));
        DatabaseReference newMessageRef = conversationRef.push();
        android.net.Uri localUri = android.net.Uri.parse(fileUriString);
        String fileName = newMessageRef.getKey() + "_" + localUri.getLastPathSegment();
        new Thread(() -> {
            try {
                String baseUrl = context.getString(R.string.native_backend_base_url).replaceAll("/+$", "");
                java.net.URL url = new java.net.URL(baseUrl + "/api/native/upload");
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                
                String boundary = "----WebKitFormBoundary" + System.currentTimeMillis();
                connection.setRequestMethod("POST");
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
                
                java.io.OutputStream outputStream = connection.getOutputStream();
                java.io.PrintWriter writer = new java.io.PrintWriter(new java.io.OutputStreamWriter(outputStream, "UTF-8"), true);
                
                writer.append("--").append(boundary).append("\r\n");
                writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(fileName).append("\"\r\n");
                writer.append("Content-Type: application/octet-stream\r\n\r\n");
                writer.flush();
                
                java.io.InputStream inputStream = context.getContentResolver().openInputStream(localUri);
                if (inputStream == null) throw new java.io.IOException("Cannot open stream");
                byte[] buffer = new byte[4096];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                outputStream.flush();
                inputStream.close();
                
                writer.append("\r\n").flush();
                writer.append("--").append(boundary).append("--\r\n").flush();
                writer.close();
                
                int responseCode = connection.getResponseCode();
                if (responseCode >= 200 && responseCode < 300) {
                    java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(connection.getInputStream()));
                    StringBuilder response = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) response.append(line);
                    in.close();
                    
                    org.json.JSONObject jsonResponse = new org.json.JSONObject(response.toString());
                    String downloadUrl = jsonResponse.getString("url");
                    
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("id", System.currentTimeMillis());
                    payload.put("content", "");
                    payload.put("timestamp", optimisticTimestamp);
                    payload.put("sender", currentUserPhone);
                    payload.put("status", "sent");
                    payload.put("clientMessageId", clientMessageId);
                    payload.put("db_key", newMessageRef.getKey());
                    payload.put(mediaType, downloadUrl);

                    newMessageRef.setValue(payload)
                            .addOnFailureListener(error -> {
                                new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                                    android.widget.Toast.makeText(context, "DB Error: " + error.getMessage(), android.widget.Toast.LENGTH_LONG).show();
                                    markCachedMessageFailed(currentUserPhone, otherPhone, clientMessageId);
                                    notifyConversationListeners(currentUserPhone, otherPhone);
                                });
                            });
                    database.getReference("users").child(currentUserPhone).child("name").setValue(currentUserName);
                } else {
                    throw new java.io.IOException("Server returned status code: " + responseCode);
                }
            } catch (Exception e) {
                new android.os.Handler(android.os.Looper.getMainLooper()).post(() -> {
                    android.widget.Toast.makeText(context, "Upload Error: " + e.getMessage(), android.widget.Toast.LENGTH_LONG).show();
                    markCachedMessageFailed(currentUserPhone, otherPhone, clientMessageId);
                    notifyConversationListeners(currentUserPhone, otherPhone);
                });
            }
        }).start();
                
        triggerPushNotification(context, otherPhone, currentUserName, mediaPreview(mediaType), currentUserPhone);
    }

    public void lookupUserByPhone(@NonNull String phoneNumber, @NonNull ContactLookupListener listener) {
        if (!isPhoneNumber(phoneNumber)) {
            listener.onError("Use a full international phone number like +233501234567.");
            return;
        }

        DatabaseReference profileRef = database.getReference("users").child(phoneNumber);
        profileRef.get().addOnSuccessListener(snapshot -> {
            String name = snapshot.child("name").getValue(String.class);
            if (name == null || name.trim().isEmpty()) {
                listener.onNotFound();
                return;
            }
            String profilePicture = snapshot.child("profilePicture").getValue(String.class);
            Boolean online = snapshot.child("status").child("online").getValue(Boolean.class);
            listener.onFound(new ChatPreview(
                    phoneNumber,
                    name,
                    "Start a conversation",
                    "",
                    0,
                    online != null && online,
                    profilePicture,
                    0L
            ));
        }).addOnFailureListener(error ->
                listener.onError(error.getMessage() == null ? "Could not find that user." : error.getMessage())
        );
    }

    public void addMutualContact(@NonNull String currentUserPhone, @NonNull String otherPhone, @NonNull OperationListener listener) {
        if (currentUserPhone.trim().isEmpty() || otherPhone.trim().isEmpty()) {
            listener.onError("Both phone numbers are required.");
            return;
        }
        if (currentUserPhone.equals(otherPhone)) {
            listener.onError("You cannot add yourself.");
            return;
        }

        DatabaseReference currentContactsRef = database.getReference("users").child(currentUserPhone).child("contacts");
        DatabaseReference otherContactsRef = database.getReference("users").child(otherPhone).child("contacts");

        Tasks.whenAllSuccess(currentContactsRef.get(), otherContactsRef.get())
                .addOnSuccessListener(results -> {
                    DataSnapshot currentSnapshot = (DataSnapshot) results.get(0);
                    DataSnapshot otherSnapshot = (DataSnapshot) results.get(1);

                    List<String> currentContacts = extractContactIds(currentSnapshot);
                    List<String> otherContacts = extractContactIds(otherSnapshot);

                    if (!currentContacts.contains(otherPhone)) {
                        currentContacts.add(otherPhone);
                    }
                    if (!otherContacts.contains(currentUserPhone)) {
                        otherContacts.add(currentUserPhone);
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("users/" + currentUserPhone + "/contacts", currentContacts);
                    updates.put("users/" + otherPhone + "/contacts", otherContacts);

                    database.getReference().updateChildren(updates)
                            .addOnSuccessListener(unused -> listener.onSuccess())
                            .addOnFailureListener(error -> listener.onError(error.getMessage() == null ? "Could not add contact." : error.getMessage()));
                })
                .addOnFailureListener(error -> listener.onError(error.getMessage() == null ? "Could not read contacts." : error.getMessage()));
    }

    public void clearCachedDataForUser(@Nullable String currentUserPhone) {
        if (currentUserPhone == null || currentUserPhone.trim().isEmpty()) {
            return;
        }
        cache.clearUser(currentUserPhone);
    }

    public void updateFcmToken(String phone, String token) {
        if (phone == null || phone.trim().isEmpty() || token == null || token.trim().isEmpty()) return;
        database.getReference("users").child(phone).child("fcmToken").setValue(token);
    }

    private void notifyConversationListeners(@NonNull String currentUserPhone, @NonNull String otherPhone) {
        MessagesListener listener = activeListeners.get(conversationKey(currentUserPhone, otherPhone));
        if (listener != null) {
            listener.onMessagesUpdated(cache.getCachedMessages(currentUserPhone, otherPhone));
        }
    }
    
    private void triggerPushNotification(android.content.Context context, String receiverPhone, String senderName, String messageText, String chatId) {
        String baseUrl = context.getString(R.string.native_backend_base_url).replaceAll("/+$", "");
        new Thread(() -> {
            try {
                org.json.JSONObject body = new org.json.JSONObject();
                body.put("receiverPhone", receiverPhone);
                body.put("senderName", senderName);
                body.put("messageText", messageText);
                body.put("chatId", chatId);

                java.net.URL url = new java.net.URL(baseUrl + "/api/native/send-push");
                java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);
                connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                connection.setRequestProperty("Accept", "application/json");
                connection.setDoOutput(true);

                try (java.io.OutputStream outputStream = connection.getOutputStream();
                     java.io.BufferedWriter writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(outputStream, java.nio.charset.StandardCharsets.UTF_8))) {
                    writer.write(body.toString());
                    writer.flush();
                }

                int statusCode = connection.getResponseCode();
                connection.disconnect();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private void markMessagesRead(
            @NonNull DataSnapshot snapshot,
            @NonNull DatabaseReference conversationRef,
            @NonNull String currentUserPhone,
            @NonNull String otherPhone
    ) {
        Map<String, Object> updates = new HashMap<>();
        for (DataSnapshot child : snapshot.getChildren()) {
            String sender = child.child("sender").getValue(String.class);
            String status = child.child("status").getValue(String.class);
            if (otherPhone.equals(sender) && !"read".equals(status)) {
                updates.put(child.getKey() + "/status", "read");
            }
        }
        if (!updates.isEmpty()) {
            conversationRef.updateChildren(updates);
        }
    }

    @NonNull
    private List<MessageUiModel> mergeMessagesWithPending(
            @NonNull List<MessageUiModel> liveMessages,
            @NonNull List<MessageUiModel> cachedMessages
    ) {
        Map<String, MessageUiModel> pendingByClientId = new LinkedHashMap<>();
        for (MessageUiModel cachedMessage : cachedMessages) {
            if (!cachedMessage.isSentByMe()) {
                continue;
            }
            String clientMessageId = cachedMessage.getClientMessageId();
            if (clientMessageId == null || clientMessageId.trim().isEmpty()) {
                continue;
            }
            if (cachedMessage.isPending() || cachedMessage.isFailed() || "uploading".equals(cachedMessage.getStatus())) {
                pendingByClientId.put(clientMessageId, cachedMessage);
            }
        }

        List<MessageUiModel> mergedMessages = new ArrayList<>(liveMessages);
        for (MessageUiModel liveMessage : liveMessages) {
            String clientMessageId = liveMessage.getClientMessageId();
            if (clientMessageId != null) {
                pendingByClientId.remove(clientMessageId);
            }
        }
        mergedMessages.addAll(pendingByClientId.values());
        mergedMessages.sort(Comparator.comparingLong(MessageUiModel::getSortKey));
        return mergedMessages;
    }

    private void markCachedMessageFailed(@NonNull String currentUserPhone, @NonNull String otherPhone, @NonNull String clientMessageId) {
        List<MessageUiModel> cachedMessages = new ArrayList<>(cache.getCachedMessages(currentUserPhone, otherPhone));
        for (int index = 0; index < cachedMessages.size(); index++) {
            MessageUiModel cachedMessage = cachedMessages.get(index);
            if (clientMessageId.equals(cachedMessage.getClientMessageId())) {
                cachedMessages.set(index, new MessageUiModel(
                        cachedMessage.getText(),
                        formatMessageMeta(cachedMessage.getTimestampIso(), "failed", true),
                        true,
                        cachedMessage.getImageUrl(),
                        cachedMessage.getVideoUrl(),
                        cachedMessage.getAudioUrl(),
                        cachedMessage.getMessageKey(),
                        cachedMessage.getClientMessageId(),
                        cachedMessage.getTimestampIso(),
                        "failed",
                        cachedMessage.getSortKey()
                ));
                break;
            }
        }
        cache.putCachedMessages(currentUserPhone, otherPhone, cachedMessages);
    }

    private void upsertCachedChatPreview(
            @NonNull String currentUserPhone,
            @NonNull String otherPhone,
            @Nullable String otherDisplayName,
            @NonNull String previewText,
            @NonNull String timestamp,
            long sortKey
    ) {
        List<ChatPreview> cachedChats = cache.getCachedChats(currentUserPhone);
        ChatPreview existing = null;
        for (ChatPreview chat : cachedChats) {
            if (otherPhone.equals(chat.getId())) {
                existing = chat;
                break;
            }
        }

        cache.upsertCachedChat(
                currentUserPhone,
                new ChatPreview(
                        otherPhone,
                        otherDisplayName == null || otherDisplayName.trim().isEmpty()
                                ? (existing == null ? otherPhone : existing.getName())
                                : otherDisplayName,
                        previewText,
                        formatTimeOnly(timestamp),
                        0,
                        existing != null && existing.isOnline(),
                        existing == null ? null : existing.getAvatarUrl(),
                        sortKey
                )
        );
    }

    @NonNull
    private List<String> extractContactIds(@NonNull DataSnapshot snapshot) {
        List<String> ids = new ArrayList<>();
        Object raw = snapshot.getValue();
        if (raw instanceof List) {
            List<?> list = (List<?>) raw;
            for (Object item : list) {
                if (isPhoneNumber(item)) {
                    ids.add((String) item);
                }
            }
        } else if (raw instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) raw;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                Object key = entry.getKey();
                Object value = entry.getValue();

                if (isPhoneNumber(value)) {
                    ids.add((String) value);
                }

                if (key instanceof String && isPhoneNumber(key) && Boolean.TRUE.equals(value)) {
                    ids.add((String) key);
                }
            }
        }
        return new ArrayList<>(new LinkedHashSet<>(ids));
    }

    @NonNull
    private List<ChatPreview> sortedChats(@NonNull Map<String, ChatDraft> chatDrafts) {
        List<ChatPreview> chats = new ArrayList<>();
        for (ChatDraft draft : chatDrafts.values()) {
            chats.add(new ChatPreview(
                    draft.contactId,
                    draft.name,
                    draft.preview,
                    draft.time,
                    draft.unreadCount,
                    draft.online,
                    draft.avatarUrl,
                    draft.timeSortKey
            ));
        }
        chats.sort(Comparator.comparingLong(ChatPreview::getTimeSortKey).reversed());
        return chats;
    }

    private void publishChats(@NonNull String currentUserPhone, @NonNull Map<String, ChatDraft> chatDrafts, @NonNull ChatsListener listener) {
        List<ChatPreview> chats = sortedChats(chatDrafts);
        cache.putCachedChats(currentUserPhone, chats);
        listener.onChatsUpdated(chats);
    }

    @NonNull
    private String conversationKey(@NonNull String first, @NonNull String second) {
        return first.compareTo(second) <= 0 ? first + "-" + second : second + "-" + first;
    }

    private long parseTimestampMillis(@Nullable String timestamp) {
        if (timestamp == null || timestamp.trim().isEmpty()) {
            return 0L;
        }
        try {
            Date parsed = isoParser.parse(timestamp);
            return parsed == null ? 0L : parsed.getTime();
        } catch (ParseException ignored) {
            return 0L;
        }
    }

    @NonNull
    private String isoNow() {
        return isoFormatter.format(new Date());
    }

    @NonNull
    private String formatTimeOnly(@Nullable String timestamp) {
        long millis = parseTimestampMillis(timestamp);
        if (millis == 0L) {
            return "";
        }
        return timeFormatter.format(new Date(millis));
    }

    @NonNull
    private String formatMessageMeta(@Nullable String timestamp, @Nullable String status, boolean sentByMe) {
        String time = formatTimeOnly(timestamp);
        if (!sentByMe) {
            return time;
        }
        String normalizedStatus = normalizeStatus(status, true);
        if ("read".equals(normalizedStatus)) {
            return time + "  \u2713\u2713";
        }
        if ("failed".equals(normalizedStatus)) {
            return time + "  !";
        }
        if ("pending".equals(normalizedStatus) || "uploading".equals(normalizedStatus)) {
            return time + "  \u2022";
        }
        return time + "  \u2713";
    }

    @NonNull
    private String normalizeStatus(@Nullable String status, boolean sentByMe) {
        if (status == null || status.trim().isEmpty()) {
            return sentByMe ? "sent" : "received";
        }
        if ("read".equals(status) || "sent".equals(status) || "pending".equals(status) || "failed".equals(status) || "uploading".equals(status)) {
            return status;
        }
        return sentByMe ? "sent" : "received";
    }

    @NonNull
    private String mediaPreview(@NonNull String mediaType) {
        if ("image".equals(mediaType)) {
            return "\uD83D\uDCF7 Photo";
        }
        if ("video".equals(mediaType)) {
            return "\uD83C\uDFA5 Video";
        }
        if ("audio".equals(mediaType)) {
            return "\uD83C\uDFA4 Voice note";
        }
        return "Shared media";
    }

    private boolean isPhoneNumber(@Nullable Object value) {
        return value instanceof String && ((String) value).matches("^\\+[1-9][0-9]{6,14}$");
    }

    private static class ContactListeners {
        private final DatabaseReference profileRef;
        private final ValueEventListener profileListener;
        private final Query lastMessageQuery;
        private final ValueEventListener lastMessageListener;

        ContactListeners(DatabaseReference profileRef, ValueEventListener profileListener, Query lastMessageQuery, ValueEventListener lastMessageListener) {
            this.profileRef = profileRef;
            this.profileListener = profileListener;
            this.lastMessageQuery = lastMessageQuery;
            this.lastMessageListener = lastMessageListener;
        }

        void detach() {
            profileRef.removeEventListener(profileListener);
            lastMessageQuery.removeEventListener(lastMessageListener);
        }
    }

    private static class ChatDraft {
        final String contactId;
        String name;
        String preview;
        String time;
        int unreadCount;
        boolean online;
        String avatarUrl;
        long timeSortKey;

        ChatDraft(String contactId, String name) {
            this.contactId = contactId;
            this.name = name;
            this.preview = "Start a conversation";
            this.time = "";
            this.unreadCount = 0;
            this.online = false;
            this.avatarUrl = null;
            this.timeSortKey = 0L;
        }
    }
}
