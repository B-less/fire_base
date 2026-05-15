package com.firebasestudio.app;

import androidx.annotation.Nullable;

public class MessageUiModel {
    private final String text;
    private final String meta;
    private final boolean sentByMe;
    private final String imageUrl;
    private final String videoUrl;
    private final String audioUrl;
    private final String messageKey;
    private final String clientMessageId;
    private final String timestampIso;
    private final String status;
    private final long sortKey;

    public MessageUiModel(
            String text,
            String meta,
            boolean sentByMe,
            @Nullable String imageUrl,
            @Nullable String videoUrl,
            @Nullable String audioUrl,
            @Nullable String status
    ) {
        this(text, meta, sentByMe, imageUrl, videoUrl, audioUrl, null, null, null, status, 0L);
    }

    public MessageUiModel(
            String text,
            String meta,
            boolean sentByMe,
            @Nullable String imageUrl,
            @Nullable String videoUrl,
            @Nullable String audioUrl,
            @Nullable String messageKey,
            @Nullable String clientMessageId,
            @Nullable String timestampIso,
            @Nullable String status,
            long sortKey
    ) {
        this.text = text == null ? "" : text;
        this.meta = meta == null ? "" : meta;
        this.sentByMe = sentByMe;
        this.imageUrl = imageUrl;
        this.videoUrl = videoUrl;
        this.audioUrl = audioUrl;
        this.messageKey = messageKey;
        this.clientMessageId = clientMessageId;
        this.timestampIso = timestampIso;
        this.status = status == null ? (sentByMe ? "sent" : "received") : status;
        this.sortKey = sortKey;
    }

    public String getText() {
        return text;
    }

    public String getMeta() {
        return meta;
    }

    public boolean isSentByMe() {
        return sentByMe;
    }

    @Nullable
    public String getImageUrl() {
        return imageUrl;
    }

    @Nullable
    public String getVideoUrl() {
        return videoUrl;
    }

    @Nullable
    public String getAudioUrl() {
        return audioUrl;
    }

    @Nullable
    public String getMessageKey() {
        return messageKey;
    }

    @Nullable
    public String getClientMessageId() {
        return clientMessageId;
    }

    @Nullable
    public String getTimestampIso() {
        return timestampIso;
    }

    public String getStatus() {
        return status;
    }

    public long getSortKey() {
        return sortKey;
    }

    public boolean hasImage() {
        return imageUrl != null && !imageUrl.trim().isEmpty();
    }

    public boolean hasVideo() {
        return videoUrl != null && !videoUrl.trim().isEmpty();
    }

    public boolean hasAudio() {
        return audioUrl != null && !audioUrl.trim().isEmpty();
    }

    public boolean isPending() {
        return "pending".equals(status);
    }

    public boolean isFailed() {
        return "failed".equals(status);
    }
}
