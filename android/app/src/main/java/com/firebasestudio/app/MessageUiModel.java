package com.firebasestudio.app;

public class MessageUiModel {
    private final String text;
    private final String meta;
    private final boolean sentByMe;

    public MessageUiModel(String text, String meta, boolean sentByMe) {
        this.text = text;
        this.meta = meta;
        this.sentByMe = sentByMe;
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
}
