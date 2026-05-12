package com.firebasestudio.app;

public class MessageUiModel {
    private final String text;
    private final String meta;
    private final boolean sentByMe;
    private final String imageUrl;
    private final String videoUrl;
    private final String audioUrl;

    public MessageUiModel(String text, String meta, boolean sentByMe, String imageUrl, String videoUrl, String audioUrl) {
        this.text = text;
        this.meta = meta;
        this.sentByMe = sentByMe;
        this.imageUrl = imageUrl;
        this.videoUrl = videoUrl;
        this.audioUrl = audioUrl;
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

    public String getImageUrl() {
        return imageUrl;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public String getAudioUrl() {
        return audioUrl;
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
}
