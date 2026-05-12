package com.firebasestudio.app;

import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.MediaController;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;

public class MediaViewerActivity extends AppCompatActivity {

    public static final String EXTRA_MEDIA_URL = "media_url";
    public static final String EXTRA_MEDIA_TYPE = "media_type";
    public static final String EXTRA_MEDIA_TITLE = "media_title";

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
        VideoView videoView = findViewById(R.id.mediaVideoView);
        TextView unsupportedView = findViewById(R.id.mediaUnsupportedText);

        if ("image".equals(mediaType)) {
            Bitmap bitmap = MediaUtils.decodeImage(mediaUrl);
            if (bitmap != null) {
                imageView.setImageBitmap(bitmap);
                imageView.setVisibility(View.VISIBLE);
                return;
            }
        } else if ("video".equals(mediaType)) {
            Uri videoUri = MediaUtils.writeToCache(this, mediaUrl, "chirpchat-video");
            if (videoUri != null) {
                MediaController mediaController = new MediaController(this);
                mediaController.setAnchorView(videoView);
                videoView.setMediaController(mediaController);
                videoView.setVideoURI(videoUri);
                videoView.setVisibility(View.VISIBLE);
                videoView.start();
                return;
            }
        }

        unsupportedView.setVisibility(View.VISIBLE);
        Toast.makeText(this, R.string.media_open_failed, Toast.LENGTH_SHORT).show();
    }
}
