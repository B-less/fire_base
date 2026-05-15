package com.firebasestudio.app;

import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.RecyclerView;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class MessageAdapter extends RecyclerView.Adapter<MessageAdapter.MessageViewHolder> {

    public interface MessageActionListener {
        void onDeleteMessage(MessageUiModel message);
        void onShareMessage(MessageUiModel message);
        void onForwardMessage(MessageUiModel message);
        void onDownloadMedia(MessageUiModel message);
    }

    private static final int TYPE_SENT = 1;
    private static final int TYPE_RECEIVED = 2;

    private final List<MessageUiModel> messages;
    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private final Runnable audioProgressUpdater = new Runnable() {
        @Override
        public void run() {
            if (mediaPlayer == null || !audioPrepared || !audioPlaying) {
                return;
            }
            try {
                activeAudioPositionMs = mediaPlayer.getCurrentPosition();
            } catch (IllegalStateException ignored) {
                activeAudioPositionMs = 0;
            }
            updateBoundAudioUi();
            progressHandler.postDelayed(this, 250L);
        }
    };

    @Nullable private MediaPlayer mediaPlayer;
    @Nullable private String activeAudioUrl;
    @Nullable private WeakReference<MessageViewHolder> activeAudioHolder;
    private boolean audioPrepared;
    private boolean audioPlaying;
    private boolean audioPlayWhenReady;
    private int activeAudioDurationMs;
    private int activeAudioPositionMs;
    private final MessageActionListener actionListener;

    public MessageAdapter(List<MessageUiModel> messages, MessageActionListener actionListener) {
        this.messages = new ArrayList<>(messages);
        this.actionListener = actionListener;
    }

    @Override
    public int getItemViewType(int position) {
        return messages.get(position).isSentByMe() ? TYPE_SENT : TYPE_RECEIVED;
    }

    @NonNull
    @Override
    public MessageViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        int layoutId = viewType == TYPE_SENT ? R.layout.item_message_sent : R.layout.item_message_received;
        View view = LayoutInflater.from(parent.getContext()).inflate(layoutId, parent, false);
        return new MessageViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull MessageViewHolder holder, int position) {
        MessageUiModel message = messages.get(position);
        
        boolean isSent = message.isSentByMe();
        boolean sameAsPrevious = position > 0 && messages.get(position - 1).isSentByMe() == isSent;
        boolean sameAsNext = position < messages.size() - 1 && messages.get(position + 1).isSentByMe() == isSent;
        
        int bgRes;
        if (!sameAsPrevious && !sameAsNext) {
            bgRes = isSent ? R.drawable.bg_bubble_sent_single : R.drawable.bg_bubble_received_single;
        } else if (!sameAsPrevious) {
            bgRes = isSent ? R.drawable.bg_bubble_sent_top : R.drawable.bg_bubble_received_top;
        } else if (sameAsNext) {
            bgRes = isSent ? R.drawable.bg_bubble_sent_middle : R.drawable.bg_bubble_received_middle;
        } else {
            bgRes = isSent ? R.drawable.bg_bubble_sent_bottom : R.drawable.bg_bubble_received_bottom;
        }
        
        holder.messageText.setBackgroundResource(bgRes);
        holder.messageImage.setBackgroundResource(bgRes);
        
        float density = holder.itemView.getContext().getResources().getDisplayMetrics().density;
        holder.messageRoot.setPadding(
                holder.messageRoot.getPaddingLeft(), 
                (int) ((sameAsPrevious ? 1 : 6) * density), 
                holder.messageRoot.getPaddingRight(), 
                (int) ((sameAsNext ? 1 : 6) * density)
        );
        
        if (sameAsNext) {
            holder.messageMeta.setVisibility(View.GONE);
        } else {
            holder.messageMeta.setVisibility(View.VISIBLE);
            holder.messageMeta.setText(message.getMeta());
        }

        if (message.getText() != null && !message.getText().trim().isEmpty()) {
            holder.messageText.setText(message.getText());
            holder.messageText.setVisibility(View.VISIBLE);
        } else {
            holder.messageText.setVisibility(View.GONE);
        }
        
        boolean isUploading = "uploading".equals(message.getStatus());
        if (holder.messageUploadProgress != null) {
            holder.messageUploadProgress.setVisibility(isUploading ? View.VISIBLE : View.GONE);
            holder.messageImage.setAlpha(isUploading ? 0.5f : 1.0f);
            holder.messageVideoCard.setAlpha(isUploading ? 0.5f : 1.0f);
            holder.messageAudioCard.setAlpha(isUploading ? 0.5f : 1.0f);
        }

        if (message.hasImage()) {
            holder.messageImage.setVisibility(View.VISIBLE);
            MediaUtils.loadImageInto(holder.itemView.getContext(), message.getImageUrl(), holder.messageImage, R.drawable.bg_media_card);
            holder.messageImage.setOnClickListener(v -> openMedia(holder, message.getImageUrl(), "image"));
        } else {
            holder.messageImage.setVisibility(View.GONE);
            holder.messageImage.setOnClickListener(null);
        }

        if (message.hasVideo()) {
            holder.messageVideoCard.setVisibility(View.VISIBLE);
            holder.messageVideoCard.setOnClickListener(v -> openMedia(holder, message.getVideoUrl(), "video"));
        } else {
            holder.messageVideoCard.setVisibility(View.GONE);
            holder.messageVideoCard.setOnClickListener(null);
        }

        bindAudio(holder, message);

        holder.messageRoot.setOnLongClickListener(v -> {
            androidx.appcompat.widget.PopupMenu popup = new androidx.appcompat.widget.PopupMenu(v.getContext(), v);
            popup.getMenu().add(0, 1, 0, "Copy");
            if (message.hasImage() || message.hasVideo() || message.hasAudio()) {
                popup.getMenu().add(0, 5, 0, "Download");
            }
            popup.getMenu().add(0, 2, 0, "Share");
            popup.getMenu().add(0, 3, 0, "Forward");
            if (message.isSentByMe()) {
                popup.getMenu().add(0, 4, 0, "Delete");
            }

            popup.setOnMenuItemClickListener(item -> {
                switch (item.getItemId()) {
                    case 1:
                        android.content.ClipboardManager clipboard = (android.content.ClipboardManager) v.getContext().getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                        String copyText = message.getText() != null ? message.getText() : (message.hasImage() ? "Image" : (message.hasVideo() ? "Video" : "Audio"));
                        android.content.ClipData clip = android.content.ClipData.newPlainText("Copied message", copyText);
                        if (clipboard != null) clipboard.setPrimaryClip(clip);
                        Toast.makeText(v.getContext(), "Copied to clipboard", Toast.LENGTH_SHORT).show();
                        return true;
                    case 2:
                        if (actionListener != null) actionListener.onShareMessage(message);
                        return true;
                    case 3:
                        if (actionListener != null) actionListener.onForwardMessage(message);
                        return true;
                    case 4:
                        if (actionListener != null) actionListener.onDeleteMessage(message);
                        return true;
                    case 5:
                        if (actionListener != null) actionListener.onDownloadMedia(message);
                        return true;
                }
                return false;
            });
            popup.show();
            return true;
        });
    }

    @Override
    public void onViewRecycled(@NonNull MessageViewHolder holder) {
        super.onViewRecycled(holder);
        holder.messageImage.setTag(null);
        holder.boundAudioUrl = null;
        if (activeAudioHolder != null) {
            MessageViewHolder activeHolder = activeAudioHolder.get();
            if (activeHolder == holder) {
                activeAudioHolder = null;
            }
        }
    }

    @Override
    public int getItemCount() {
        return messages.size();
    }

    public void replaceMessages(List<MessageUiModel> nextMessages) {
        messages.clear();
        messages.addAll(nextMessages);
        if (activeAudioUrl != null && indexOfAudio(activeAudioUrl) < 0) {
            release();
        }
        notifyDataSetChanged();
    }

    public void pausePlayback() {
        if (mediaPlayer == null || !audioPrepared || !audioPlaying) {
            return;
        }
        try {
            activeAudioPositionMs = mediaPlayer.getCurrentPosition();
            mediaPlayer.pause();
        } catch (IllegalStateException ignored) {
            activeAudioPositionMs = 0;
        }
        audioPlaying = false;
        stopProgressUpdates();
        updateBoundAudioUi();
    }

    public void release() {
        stopProgressUpdates();
        if (mediaPlayer != null) {
            try {
                mediaPlayer.stop();
            } catch (Exception ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }
        String previousUrl = activeAudioUrl;
        activeAudioUrl = null;
        activeAudioHolder = null;
        audioPrepared = false;
        audioPlaying = false;
        audioPlayWhenReady = false;
        activeAudioDurationMs = 0;
        activeAudioPositionMs = 0;
        notifyAudioItemChanged(previousUrl);
    }

    private void bindAudio(@NonNull MessageViewHolder holder, @NonNull MessageUiModel message) {
        holder.boundAudioUrl = message.getAudioUrl();
        holder.messageAudioPlayButton.setOnClickListener(null);
        holder.messageAudioSeekBar.setOnSeekBarChangeListener(null);

        if (!message.hasAudio()) {
            holder.messageAudioCard.setVisibility(View.GONE);
            holder.messageAudioCard.setOnClickListener(null);
            return;
        }

        holder.messageAudioCard.setVisibility(View.VISIBLE);
        holder.messageAudioTitle.setText(R.string.media_label_voice_note);
        holder.messageAudioCard.setOnClickListener(v -> openMedia(holder, message.getAudioUrl(), "audio"));
        applyAudioState(holder, message.getAudioUrl());

        holder.messageAudioPlayButton.setOnClickListener(v -> toggleAudioPlayback(holder, message.getAudioUrl()));
        holder.messageAudioSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (!fromUser || message.getAudioUrl() == null || !message.getAudioUrl().equals(activeAudioUrl) || mediaPlayer == null || !audioPrepared) {
                    return;
                }
                activeAudioPositionMs = progress;
                try {
                    mediaPlayer.seekTo(progress);
                } catch (IllegalStateException ignored) {
                    activeAudioPositionMs = 0;
                }
                updateBoundAudioUi();
            }

            @Override public void onStartTrackingTouch(SeekBar seekBar) { }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                if (message.getAudioUrl() != null && message.getAudioUrl().equals(activeAudioUrl)) {
                    updateBoundAudioUi();
                }
            }
        });
    }

    private void toggleAudioPlayback(@NonNull MessageViewHolder holder, @Nullable String audioUrl) {
        if (audioUrl == null || audioUrl.trim().isEmpty()) {
            Toast.makeText(holder.itemView.getContext(), R.string.media_audio_failed, Toast.LENGTH_SHORT).show();
            return;
        }

        if (audioUrl.equals(activeAudioUrl)) {
            activeAudioHolder = new WeakReference<>(holder);
            if (!audioPrepared) {
                return;
            }
            if (audioPlaying) {
                pausePlayback();
            } else {
                startPlayback();
            }
            return;
        }

        String previousUrl = activeAudioUrl;
        releaseCurrentPlayer();
        notifyAudioItemChanged(previousUrl);

        activeAudioUrl = audioUrl;
        activeAudioHolder = new WeakReference<>(holder);
        audioPrepared = false;
        audioPlaying = false;
        audioPlayWhenReady = true;
        activeAudioDurationMs = 0;
        activeAudioPositionMs = 0;
        applyAudioState(holder, audioUrl);

        MediaUtils.writeToCacheAsync(holder.itemView.getContext(), audioUrl, "audio", uri -> {
            if (activeAudioUrl == null || !activeAudioUrl.equals(audioUrl)) {
                return;
            }
            if (uri == null) {
                failAudioPlayback(holder);
                return;
            }
            preparePlayer(holder, audioUrl, uri);
        });
    }

    private void preparePlayer(@NonNull MessageViewHolder holder, @NonNull String audioUrl, @NonNull Uri audioUri) {
        boolean shouldStartWhenReady = audioPlayWhenReady;
        releaseCurrentPlayer();
        audioPlayWhenReady = shouldStartWhenReady;

        mediaPlayer = new MediaPlayer();
        try {
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
            );
            mediaPlayer.setDataSource(holder.itemView.getContext(), audioUri);
            mediaPlayer.setOnPreparedListener(player -> {
                if (activeAudioUrl == null || !activeAudioUrl.equals(audioUrl)) {
                    player.release();
                    return;
                }
                audioPrepared = true;
                activeAudioDurationMs = player.getDuration();
                if (activeAudioPositionMs > 0) {
                    try {
                        player.seekTo(activeAudioPositionMs);
                    } catch (IllegalStateException ignored) {
                        activeAudioPositionMs = 0;
                    }
                }
                if (audioPlayWhenReady) {
                    startPlayback();
                } else {
                    updateBoundAudioUi();
                }
            });
            mediaPlayer.setOnCompletionListener(player -> {
                audioPlaying = false;
                audioPlayWhenReady = false;
                activeAudioPositionMs = 0;
                try {
                    player.seekTo(0);
                } catch (IllegalStateException ignored) {
                    // Ignore; player is already finished.
                }
                stopProgressUpdates();
                updateBoundAudioUi();
            });
            mediaPlayer.setOnErrorListener((player, what, extra) -> {
                failAudioPlayback(holder);
                return true;
            });
            mediaPlayer.prepareAsync();
        } catch (Exception exception) {
            failAudioPlayback(holder);
        }
    }

    private void startPlayback() {
        if (mediaPlayer == null || !audioPrepared) {
            return;
        }
        try {
            mediaPlayer.start();
            audioPlaying = true;
            audioPlayWhenReady = false;
            startProgressUpdates();
            updateBoundAudioUi();
        } catch (IllegalStateException exception) {
            audioPlaying = false;
            audioPlayWhenReady = false;
            updateBoundAudioUi();
        }
    }

    private void failAudioPlayback(@NonNull MessageViewHolder holder) {
        String failedUrl = activeAudioUrl;
        releaseCurrentPlayer();
        activeAudioUrl = null;
        activeAudioHolder = null;
        audioPrepared = false;
        audioPlaying = false;
        audioPlayWhenReady = false;
        activeAudioDurationMs = 0;
        activeAudioPositionMs = 0;
        notifyAudioItemChanged(failedUrl);
        Toast.makeText(holder.itemView.getContext(), R.string.media_audio_failed, Toast.LENGTH_SHORT).show();
    }

    private void applyAudioState(@NonNull MessageViewHolder holder, @Nullable String audioUrl) {
        boolean isActive = audioUrl != null && audioUrl.equals(activeAudioUrl);
        holder.messageAudioPlayButton.setEnabled(true);
        holder.messageAudioSeekBar.setEnabled(isActive && audioPrepared);
        holder.messageAudioSeekBar.setMax(isActive && audioPrepared ? Math.max(1, activeAudioDurationMs) : 1000);
        holder.messageAudioSeekBar.setProgress(isActive && audioPrepared ? Math.min(activeAudioPositionMs, Math.max(1, activeAudioDurationMs)) : 0);

        if (isActive) {
            activeAudioHolder = new WeakReference<>(holder);
            if (!audioPrepared) {
                holder.messageAudioPlayButton.setEnabled(false);
                holder.messageAudioPlayButton.setImageResource(android.R.drawable.ic_media_play);
                holder.messageAudioPlayButton.setContentDescription(holder.itemView.getContext().getString(R.string.media_loading));
                holder.messageAudioDuration.setText(holder.itemView.getContext().getString(R.string.media_loading));
                return;
            }

            holder.messageAudioPlayButton.setImageResource(audioPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
            holder.messageAudioPlayButton.setContentDescription(holder.itemView.getContext().getString(audioPlaying ? R.string.media_audio_pause : R.string.media_audio_play));
            int labelTimeMs = activeAudioPositionOrDuration();
            holder.messageAudioDuration.setText(formatProgressLabel(labelTimeMs, activeAudioDurationMs));
            return;
        }

        holder.messageAudioPlayButton.setImageResource(android.R.drawable.ic_media_play);
        holder.messageAudioPlayButton.setContentDescription(holder.itemView.getContext().getString(R.string.media_audio_play));
        holder.messageAudioDuration.setText(formatProgressLabel(0, activeAudioDurationMs));
    }

    private int activeAudioPositionOrDuration() {
        if (audioPlaying && mediaPlayer != null) {
            try {
                activeAudioPositionMs = mediaPlayer.getCurrentPosition();
            } catch (IllegalStateException ignored) {
                activeAudioPositionMs = 0;
            }
        }
        return activeAudioPositionMs;
    }

    private void updateBoundAudioUi() {
        if (activeAudioHolder == null) {
            return;
        }
        MessageViewHolder holder = activeAudioHolder.get();
        if (holder == null || holder.boundAudioUrl == null || !holder.boundAudioUrl.equals(activeAudioUrl)) {
            return;
        }
        applyAudioState(holder, activeAudioUrl);
    }

    private void startProgressUpdates() {
        progressHandler.removeCallbacks(audioProgressUpdater);
        progressHandler.post(audioProgressUpdater);
    }

    private void stopProgressUpdates() {
        progressHandler.removeCallbacks(audioProgressUpdater);
    }

    private void notifyAudioItemChanged(@Nullable String audioUrl) {
        int index = indexOfAudio(audioUrl);
        if (index >= 0) {
            notifyItemChanged(index);
        }
    }

    private int indexOfAudio(@Nullable String audioUrl) {
        if (audioUrl == null || audioUrl.trim().isEmpty()) {
            return -1;
        }
        for (int index = 0; index < messages.size(); index++) {
            String candidate = messages.get(index).getAudioUrl();
            if (audioUrl.equals(candidate)) {
                return index;
            }
        }
        return -1;
    }

    private void releaseCurrentPlayer() {
        stopProgressUpdates();
        if (mediaPlayer != null) {
            try {
                mediaPlayer.reset();
            } catch (Exception ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }
        audioPrepared = false;
        audioPlaying = false;
        audioPlayWhenReady = false;
        activeAudioDurationMs = 0;
        activeAudioPositionMs = 0;
    }

    private void openMedia(@NonNull MessageViewHolder holder, String mediaUrl, String mediaType) {
        Intent intent = new Intent(holder.itemView.getContext(), MediaViewerActivity.class);
        intent.putExtra(MediaViewerActivity.EXTRA_MEDIA_URL, mediaUrl);
        intent.putExtra(MediaViewerActivity.EXTRA_MEDIA_TYPE, mediaType);
        intent.putExtra(
                MediaViewerActivity.EXTRA_MEDIA_TITLE,
                "video".equals(mediaType)
                        ? holder.itemView.getContext().getString(R.string.media_label_video)
                        : "audio".equals(mediaType)
                            ? holder.itemView.getContext().getString(R.string.media_audio_fullscreen_title)
                            : holder.itemView.getContext().getString(R.string.media_label_photo)
        );
        holder.itemView.getContext().startActivity(intent);
    }

    private String formatProgressLabel(int positionMs, int durationMs) {
        if (durationMs <= 0) {
            return formatDuration(0);
        }
        return String.format(Locale.US, "%s / %s", formatDuration(positionMs), formatDuration(durationMs));
    }

    private String formatDuration(int durationMs) {
        int totalSeconds = Math.max(0, durationMs / 1000);
        int minutes = totalSeconds / 60;
        int seconds = totalSeconds % 60;
        return String.format(Locale.US, "%d:%02d", minutes, seconds);
    }

    static class MessageViewHolder extends RecyclerView.ViewHolder {
        final LinearLayout messageRoot;
        final TextView messageText;
        final TextView messageMeta;
        final ImageView messageImage;
        final LinearLayout messageVideoCard;
        final LinearLayout messageAudioCard;
        final TextView messageAudioTitle;
        final ImageButton messageAudioPlayButton;
        final SeekBar messageAudioSeekBar;
        final TextView messageAudioDuration;
        final android.widget.ProgressBar messageUploadProgress;
        String boundAudioUrl;

        MessageViewHolder(@NonNull View itemView) {
            super(itemView);
            messageRoot = itemView.findViewById(R.id.messageRoot);
            messageText = itemView.findViewById(R.id.messageText);
            messageMeta = itemView.findViewById(R.id.messageMeta);
            messageImage = itemView.findViewById(R.id.messageImage);
            messageVideoCard = itemView.findViewById(R.id.messageVideoCard);
            messageAudioCard = itemView.findViewById(R.id.messageAudioCard);
            messageAudioTitle = itemView.findViewById(R.id.messageAudioTitle);
            messageAudioPlayButton = itemView.findViewById(R.id.messageAudioPlayButton);
            messageAudioSeekBar = itemView.findViewById(R.id.messageAudioSeekBar);
            messageAudioDuration = itemView.findViewById(R.id.messageAudioDuration);
            messageUploadProgress = itemView.findViewById(R.id.messageUploadProgress);
        }
    }
}
