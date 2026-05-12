package com.firebasestudio.app;

public class ChatPreview {
    private final String id;
    private final String name;
    private final String preview;
    private final String time;
    private final int unreadCount;
    private final boolean online;
    private final String avatarUrl;
    private final long timeSortKey;

    public ChatPreview(String id, String name, String preview, String time, int unreadCount, boolean online, String avatarUrl, long timeSortKey) {
        this.id = id;
        this.name = name;
        this.preview = preview;
        this.time = time;
        this.unreadCount = unreadCount;
        this.online = online;
        this.avatarUrl = avatarUrl;
        this.timeSortKey = timeSortKey;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPreview() {
        return preview;
    }

    public String getTime() {
        return time;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public boolean isOnline() {
        return online;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public long getTimeSortKey() {
        return timeSortKey;
    }
}
