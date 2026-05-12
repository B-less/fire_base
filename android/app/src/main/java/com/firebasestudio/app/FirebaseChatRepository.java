package com.firebasestudio.app;

import androidx.annotation.NonNull;

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
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TimeZone;

public class FirebaseChatRepository {

    public interface ChatsListener {
        void onChatsUpdated(List<ChatPreview> chats);
        void onError(String message);
    }

    public interface MessagesListener {
        void onMessagesUpdated(List<MessageUiModel> messages);
        void onError(String message);
    }

    public interface Subscription {
        void dispose();
    }

    private final FirebaseDatabase database;
    private final SimpleDateFormat isoParser;
    private final SimpleDateFormat timeFormatter;

    public FirebaseChatRepository() {
        database = FirebaseDatabase.getInstance();
        isoParser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US);
        isoParser.setTimeZone(TimeZone.getTimeZone("UTC"));
        timeFormatter = new SimpleDateFormat("h:mm a", Locale.US);
    }

    public Subscription observeChats(String currentUserPhone, ChatsListener listener) {
        DatabaseReference contactsRef = database.getReference("users").child(currentUserPhone).child("contacts");
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

                    ValueEventListener profileListener = new ValueEventListener() {
                        @Override
                        public void onDataChange(@NonNull DataSnapshot profileSnapshot) {
                            String name = profileSnapshot.child("name").getValue(String.class);
                            String profilePicture = profileSnapshot.child("profilePicture").getValue(String.class);
                            Boolean online = profileSnapshot.child("status").child("online").getValue(Boolean.class);

                            draft.name = (name == null || name.trim().isEmpty()) ? contactId : name;
                            draft.avatarUrl = profilePicture;
                            draft.online = online != null && online;
                            listener.onChatsUpdated(sortedChats(chatDrafts));
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
                            listener.onChatsUpdated(sortedChats(chatDrafts));
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

                listener.onChatsUpdated(sortedChats(chatDrafts));
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

    public Subscription observeConversation(String currentUserPhone, String otherPhone, MessagesListener listener) {
        DatabaseReference conversationRef = database.getReference("messages").child(conversationKey(currentUserPhone, otherPhone));

        ValueEventListener messagesListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                List<MessageUiModel> messages = new ArrayList<>();

                for (DataSnapshot child : snapshot.getChildren()) {
                    String text = child.child("content").getValue(String.class);
                    String timestamp = child.child("timestamp").getValue(String.class);
                    String sender = child.child("sender").getValue(String.class);
                    String status = child.child("status").getValue(String.class);
                    boolean sentByMe = currentUserPhone.equals(sender);

                    if (text == null || text.trim().isEmpty()) {
                        if (child.hasChild("image")) {
                            text = "\uD83D\uDCF7 Photo";
                        } else if (child.hasChild("video")) {
                            text = "\uD83C\uDFA5 Video";
                        } else if (child.hasChild("audio")) {
                            text = "\uD83C\uDFA4 Voice note";
                        } else {
                            text = "";
                        }
                    }

                    messages.add(new MessageUiModel(text, formatMessageMeta(timestamp, status, sentByMe), sentByMe));
                }

                listener.onMessagesUpdated(messages);
                markMessagesRead(snapshot, conversationRef, currentUserPhone, otherPhone);
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                listener.onError(error.getMessage());
            }
        };

        conversationRef.addValueEventListener(messagesListener);
        return () -> conversationRef.removeEventListener(messagesListener);
    }

    public void sendMessage(String currentUserPhone, String currentUserName, String otherPhone, String text) {
        DatabaseReference conversationRef = database.getReference("messages").child(conversationKey(currentUserPhone, otherPhone));
        DatabaseReference newMessageRef = conversationRef.push();

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", System.currentTimeMillis());
        payload.put("content", text);
        payload.put("timestamp", isoNow());
        payload.put("sender", currentUserPhone);
        payload.put("status", "sent");
        payload.put("db_key", newMessageRef.getKey());
        newMessageRef.setValue(payload);

        DatabaseReference currentUserRef = database.getReference("users").child(currentUserPhone);
        currentUserRef.child("name").setValue(currentUserName);
    }

    private void markMessagesRead(DataSnapshot snapshot, DatabaseReference conversationRef, String currentUserPhone, String otherPhone) {
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

    private List<String> extractContactIds(DataSnapshot snapshot) {
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
        return new ArrayList<>(new java.util.LinkedHashSet<>(ids));
    }

    private List<ChatPreview> sortedChats(Map<String, ChatDraft> chatDrafts) {
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

    private String conversationKey(String first, String second) {
        return first.compareTo(second) <= 0 ? first + "-" + second : second + "-" + first;
    }

    private long parseTimestampMillis(String timestamp) {
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

    private String isoNow() {
        return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US).format(new Date());
    }

    private String formatTimeOnly(String timestamp) {
        long millis = parseTimestampMillis(timestamp);
        if (millis == 0L) {
            return "";
        }
        return timeFormatter.format(new Date(millis));
    }

    private String formatMessageMeta(String timestamp, String status, boolean sentByMe) {
        String time = formatTimeOnly(timestamp);
        if (!sentByMe) {
            return time;
        }
        return time + ("read".equals(status) ? "  \u2713\u2713" : "  \u2713");
    }

    private boolean isPhoneNumber(Object value) {
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
