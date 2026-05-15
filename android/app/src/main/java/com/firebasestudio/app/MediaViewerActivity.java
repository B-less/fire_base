package com.firebasestudio.app;

import android.graphics.Bitmap;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.MediaController;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;

import java.util.Locale;

public class MediaViewerActivity extends AppCompatActivity {

    public static final String EXTRA_MEDIA_URL = "media_url";
    public static final String EXTRA_MEDIA_TYPE = "media_type";
    public static final String EXTRA_MEDIA_TITLE = "media_title";

    private VideoView mediaVideoView;
    private MediaPlayer audioPlayer;
    private final Handler audioHandler = new Handler(Looper.getMainLooper());
    private ImageButton audioPlayButton;
    private SeekBar audioSeekBar;
    private TextView audioDuration;
    private final Runnable audioProgressRunnable = new Runnable() {
        @Override
        public void run() {
            if (audioPlayer == null) {
                return;
            }
            try {
                int position = audioPlayer.getCurrentPosition();
                int duration = Math.max(audioPlayer.getDuration(), 1);
                audioSeekBar.setMax(duration);
                audioSeekBar.setProgress(position);
                audioDuration.setText(formatProgress(position, duration));
                audioHandler.postDelayed(this, 250L);
            } catch (IllegalStateException ignored) {
                audioDuration.setText(formatProgress(0, 0));
            }
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_media_viewer);

        MaterialToolbar toolbar = findViewById(R.id.mediaToolbar);
        toolbar.setNavigationOnClickListener(v -> finish());

        String mediaUrl = getIntent().getStringExtra(EXTRA_MEDIA_URL);
        String mediaType = getIntent().getStringExtra(EXTRA_MEDIA_TYPE);
        String mediaTitle = getIntent().getStringExtra(EXTRA_MEDIA_TITLE);

        if (mediaTitle != null && !mediaTitle.trim().isEmpty()) {
            toolbar.setTitle(mediaTitle);
        }

        ImageView imageView = findViewById(R.id.mediaImageView);
        mediaVideoView = findViewById(R.id.mediaVideoView);
        View audioContainer = findViewById(R.id.mediaAudioContainer);
        audioPlayButton = findViewById(R.id.mediaAudioPlayButton);
        audioSeekBar = findViewById(R.id.mediaAudioSeekBar);
        audioDuration = findViewById(R.id.mediaAudioDuration);
        TextView unsupportedView = findViewById(R.id.mediaUnsupportedText);
        unsupportedView.setText(R.string.media_loading);
        unsupportedView.setVisibility(View.VISIBLE);

        if ("image".equals(mediaType)) {
            MediaUtils.decodeImageAsync(this, mediaUrl, bitmap -> showImage(bitmap, imageView, mediaVideoView, audioContainer, unsupportedView));
            return;
        }

        if ("video".equals(mediaType)) {
            MediaUtils.writeToCacheAsync(this, mediaUrl, "chirpchat-video", uri -> showVideo(uri, mediaVideoView, imageView, audioContainer, unsupportedView));
            return;
        }

        if ("audio".equals(mediaType)) {
            MediaUtils.writeToCacheAsync(this, mediaUrl, "audio", uri -> showAudio(uri, audioContainer, imageView, mediaVideoView, unsupportedView));
            return;
        }

        showFailure(mediaVideoView, imageView, audioContainer, unsupportedView);
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (mediaVideoView != null) {
            mediaVideoView.pause();
        }
        if (audioPlayer != null) {
            try {
                if (audioPlayer.isPlaying()) {
                    audioPlayer.pause();
                }
            } catch (IllegalStateException ignored) {
                // Ignore invalid player state during shutdown.
            }
        }
        stopAudioProgress();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopAudioProgress();
        if (audioPlayer != null) {
            audioPlayer.release();
            audioPlayer = null;
        }
    }

    private void showImage(@Nullable Bitmap bitmap, ImageView imageView, VideoView videoView, View audioContainer, TextView unsupportedView) {
        if (isFinishing() || isDestroyed()) {
            return;
        }
        if (bitmap == null) {
            showFailure(videoView, imageView, audioContainer, unsupportedView);
            return;
        }
        unsupportedView.setVisibility(View.GONE);
        videoView.setVisibility(View.GONE);
        audioContainer.setVisibility(View.GONE);
        imageView.setImageBitmap(bitmap);
        imageView.setVisibility(View.VISIBLE);
    }

    private void showVideo(@Nullable Uri videoUri, VideoView videoView, ImageView imageView, View audioContainer, TextView unsupportedView) {
        if (isFinishing() || isDestroyed()) {
            return;
        }
        if (videoUri == null) {
            showFailure(videoView, imageView, audioContainer, unsupportedView);
            return;
        }
        MediaController mediaController = new MediaController(this);
        mediaController.setAnchorView(videoView);
        videoView.setMediaController(mediaController);
        videoView.setVideoURI(videoUri);
        imageView.setVisibility(View.GONE);
        audioContainer.setVisibility(View.GONE);
        unsupportedView.setVisibility(View.GONE);
        videoView.setVisibility(View.VISIBLE);
        videoView.start();
    }

    private void showAudio(@Nullable Uri audioUri, View audioContainer, ImageView imageView, VideoView videoView, TextView unsupportedView) {
        if (isFinishing() || isDestroyed()) {
            return;
        }
        if (audioUri == null) {
            showFailure(videoView, imageView, audioContainer, unsupportedView);
            return;
        }
        if (audioPlayer != null) {
            try {
                audioPlayer.release();
            } catch (Exception ignored) {
            }
            audioPlayer = null;
        }

        imageView.setVisibility(View.GONE);
        videoView.setVisibility(View.GONE);
        unsupportedView.setVisibility(View.GONE);
        audioContainer.setVisibility(View.VISIBLE);
        audioDuration.setText(formatProgress(0, 0));
        audioSeekBar.setEnabled(false);
        audioPlayButton.setEnabled(false);

        try {
            audioPlayer = new MediaPlayer();
            audioPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .build()
            );
            audioPlayer.setDataSource(this, audioUri);
            audioPlayer.setOnPreparedListener(player -> {
                audioSeekBar.setEnabled(true);
                audioPlayButton.setEnabled(true);
                audioSeekBar.setMax(Math.max(player.getDuration(), 1));
                audioDuration.setText(formatProgress(0, player.getDuration()));
                audioPlayButton.setImageResource(android.R.drawable.ic_media_play);
            });
            audioPlayer.setOnCompletionListener(player -> {
                stopAudioProgress();
                audioSeekBar.setProgress(0);
                audioDuration.setText(formatProgress(0, player.getDuration()));
                audioPlayButton.setImageResource(android.R.drawable.ic_media_play);
            });
            audioPlayer.prepareAsync();
        } catch (Exception exception) {
            showFailure(videoView, imageView, audioContainer, unsupportedView);
            return;
        }

        audioPlayButton.setOnClickListener(v -> toggleAudioPlayback());
        audioSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (!fromUser || audioPlayer == null) {
                    return;
                }
                try {
                    audioPlayer.seekTo(progress);
                    audioDuration.setText(formatProgress(progress, audioPlayer.getDuration()));
                } catch (IllegalStateException ignored) {
                    // Ignore invalid state during async preparation.
                }
            }

            @Override public void onStartTrackingTouch(SeekBar seekBar) { }

            @Override public void onStopTrackingTouch(SeekBar seekBar) { }
        });
    }

    private void toggleAudioPlayback() {
        if (audioPlayer == null) {
            Toast.makeText(this, R.string.media_audio_failed, Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            if (audioPlayer.isPlaying()) {
                audioPlayer.pause();
                stopAudioProgress();
                audioPlayButton.setImageResource(android.R.drawable.ic_media_play);
            } else {
                audioPlayer.start();
                audioPlayButton.setImageResource(android.R.drawable.ic_media_pause);
                startAudioProgress();
            }
        } catch (IllegalStateException exception) {
            Toast.makeText(this, R.string.media_audio_failed, Toast.LENGTH_SHORT).show();
        }
    }

    private void startAudioProgress() {
        stopAudioProgress();
        audioHandler.post(audioProgressRunnable);
    }

    private void stopAudioProgress() {
        audioHandler.removeCallbacks(audioProgressRunnable);
    }

    private String formatProgress(int positionMs, int durationMs) {
        return String.format(Locale.US, "%s / %s", formatDuration(positionMs), formatDuration(durationMs));
    }

    private String formatDuration(int durationMs) {
        int totalSeconds = Math.max(0, durationMs / 1000);
        int minutes = totalSeconds / 60;
        int seconds = totalSeconds % 60;
        return String.format(Locale.US, "%d:%02d", minutes, seconds);
    }

    private void showFailure(VideoView videoView, ImageView imageView, View audioContainer, TextView unsupportedView) {
        if (isFinishing() || isDestroyed()) {
            return;
        }
        imageView.setVisibility(View.GONE);
        videoView.setVisibility(View.GONE);
        audioContainer.setVisibility(View.GONE);
        unsupportedView.setText(R.string.media_open_failed);
        unsupportedView.setVisibility(View.VISIBLE);
        Toast.makeText(this, R.string.media_open_failed, Toast.LENGTH_SHORT).show();
    }
}
