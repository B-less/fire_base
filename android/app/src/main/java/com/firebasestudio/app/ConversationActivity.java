package com.firebasestudio.app;

import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import android.media.MediaRecorder;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.MotionEvent;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.content.Intent;
import android.net.Uri;
import android.media.MediaPlayer;
import android.os.Handler;
import android.view.View;

public class ConversationActivity extends AppCompatActivity {

    public static final String EXTRA_CHAT_ID = "chat_id";
    public static final String EXTRA_CHAT_NAME = "chat_name";

    private final FirebaseChatRepository repository = new FirebaseChatRepository();
    private FirebaseChatRepository.Subscription messageSubscription;
    private FirebaseChatRepository.Subscription presenceSubscription;
    private NativeSessionManager.NativeUserSession session;
    private MessageAdapter messageAdapter;
    private ActivityResultLauncher<androidx.activity.result.PickVisualMediaRequest> pickMedia;
    private MediaRecorder mediaRecorder;
    private String currentAudioPath;
    private boolean isRecording = false;
    private String currentChatId;
    private ActivityResultLauncher<String> requestRecordAudioPermission;
    private LinearLayout composerDefault;
    private LinearLayout composerVoicePreview;
    private ImageButton voiceDeleteButton;
    private ImageButton voicePlayButton;
    private TextView voiceDurationText;
    private MediaPlayer previewPlayer;
    private boolean isPreviewPlaying = false;
    private Handler timerHandler = new Handler(android.os.Looper.getMainLooper());
    private long recordingStartTime = 0;
    private Runnable timerRunnable = new Runnable() {
        @Override
        public void run() {
            if (isRecording) {
                long millis = System.currentTimeMillis() - recordingStartTime;
                int seconds = (int) (millis / 1000);
                int minutes = seconds / 60;
                seconds = seconds % 60;
                voiceDurationText.setText(String.format(java.util.Locale.US, "%d:%02d", minutes, seconds));
                timerHandler.postDelayed(this, 500);
            } else if (isPreviewPlaying && previewPlayer != null) {
                int millis = previewPlayer.getCurrentPosition();
                int seconds = millis / 1000;
                int minutes = seconds / 60;
                seconds = seconds % 60;
                voiceDurationText.setText(String.format(java.util.Locale.US, "%d:%02d", minutes, seconds));
                timerHandler.postDelayed(this, 500);
            }
        }
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_conversation);

        NativeSessionManager sessionManager = new NativeSessionManager(this);
        session = sessionManager.getSession();
        if (session == null) {
            Toast.makeText(this, "Set up your native session first from the Chats screen.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        String chatId = getIntent().getStringExtra(EXTRA_CHAT_ID);
        String chatName = getIntent().getStringExtra(EXTRA_CHAT_NAME);
        if (chatId == null || chatId.trim().isEmpty()) {
            finish();
            return;
        }
        if (chatName == null || chatName.trim().isEmpty()) {
            chatName = chatId;
        }
        String finalChatName = chatName;

        MaterialToolbar toolbar = findViewById(R.id.conversationToolbar);
        toolbar.setTitle(chatName);
        toolbar.setSubtitle("");
        toolbar.setNavigationOnClickListener(v -> finish());

        RecyclerView recyclerView = findViewById(R.id.messageRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        messageAdapter = new MessageAdapter(new ArrayList<>(), new MessageAdapter.MessageActionListener() {
            @Override
            public void onDeleteMessage(MessageUiModel message) {
                // TODO: Implement delete logic
                Toast.makeText(ConversationActivity.this, "Delete not implemented yet", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onShareMessage(MessageUiModel message) {
                Intent shareIntent = new Intent(Intent.ACTION_SEND);
                shareIntent.setType("text/plain");
                shareIntent.putExtra(Intent.EXTRA_TEXT, message.getText() != null ? message.getText() : (message.hasImage() ? message.getImageUrl() : message.getVideoUrl()));
                startActivity(Intent.createChooser(shareIntent, "Share Message"));
            }

            @Override
            public void onForwardMessage(MessageUiModel message) {
                Toast.makeText(ConversationActivity.this, "Forward not implemented yet", Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onDownloadMedia(MessageUiModel message) {
                String mediaUrl = message.hasImage() ? message.getImageUrl() : (message.hasVideo() ? message.getVideoUrl() : message.getAudioUrl());
                if (mediaUrl != null) {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(mediaUrl));
                    startActivity(browserIntent);
                }
            }
        });
        recyclerView.setAdapter(messageAdapter);

        currentChatId = chatId;
        
        requestRecordAudioPermission = registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
            if (isGranted) {
                startRecording();
            } else {
                Toast.makeText(this, "Microphone permission is required to send voice notes.", Toast.LENGTH_SHORT).show();
            }
        });
        
        pickMedia = registerForActivityResult(new ActivityResultContracts.PickVisualMedia(), uri -> {
            if (uri != null) {
                String type = getContentResolver().getType(uri);
                boolean isVideo = type != null && type.startsWith("video/");
                repository.uploadMedia(
                        this,
                        session.getPhoneNumber(),
                        session.getDisplayName(),
                        currentChatId,
                        finalChatName,
                        uri.toString(),
                        isVideo ? "video" : "image"
                );
            }
        });

        String finalChatId = chatId;
        presenceSubscription = repository.observePresence(finalChatId, isOnline -> {
            runOnUiThread(() -> {
                toolbar.setSubtitle(isOnline ? getString(R.string.conversation_online) : "");
            });
        });

        messageSubscription = repository.observeConversation(session.getPhoneNumber(), finalChatId, new FirebaseChatRepository.MessagesListener() {
            @Override
            public void onMessagesUpdated(List<MessageUiModel> messages) {
                runOnUiThread(() -> {
                    messageAdapter.replaceMessages(messages);
                    if (!messages.isEmpty()) {
                        recyclerView.scrollToPosition(messages.size() - 1);
                    }
                });
            }

            @Override
            public void onError(String message) {
                runOnUiThread(() ->
                        Toast.makeText(ConversationActivity.this, "Could not load messages: " + message, Toast.LENGTH_SHORT).show()
                );
            }
        });

        EditText messageInput = findViewById(R.id.messageInput);
        FloatingActionButton sendButton = findViewById(R.id.sendButton);
        ImageButton attachmentButton = findViewById(R.id.attachmentButton);
        composerDefault = findViewById(R.id.composerDefault);
        composerVoicePreview = findViewById(R.id.composerVoicePreview);
        voiceDeleteButton = findViewById(R.id.voiceDeleteButton);
        voicePlayButton = findViewById(R.id.voicePlayButton);
        voiceDurationText = findViewById(R.id.voiceDurationText);

        voiceDeleteButton.setOnClickListener(v -> deleteVoiceNote());
        voicePlayButton.setOnClickListener(v -> toggleVoicePreview());

        if (attachmentButton != null) {
            attachmentButton.setOnClickListener(v -> {
                pickMedia.launch(new androidx.activity.result.PickVisualMediaRequest.Builder()
                        .setMediaType(ActivityResultContracts.PickVisualMedia.ImageAndVideo.INSTANCE)
                        .build());
            });
        }

        sendButton.setImageResource(android.R.drawable.ic_btn_speak_now);
        messageInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s.toString().trim().length() > 0 || currentAudioPath != null) {
                    sendButton.setImageResource(android.R.drawable.ic_menu_send);
                } else {
                    sendButton.setImageResource(android.R.drawable.ic_btn_speak_now);
                }
            }
            @Override public void afterTextChanged(Editable s) {}
        });

        sendButton.setOnClickListener(v -> {
            String draft = messageInput.getText().toString().trim();
            if (draft.isEmpty()) {
                if (currentAudioPath != null && !isRecording) {
                    sendVoiceNote();
                }
                return;
            }
            repository.sendMessage(ConversationActivity.this, session.getPhoneNumber(), session.getDisplayName(), finalChatId, finalChatName, draft);
            messageInput.setText("");
        });

        sendButton.setOnTouchListener((v, event) -> {
            if (messageInput.getText().toString().trim().length() > 0 || (currentAudioPath != null && !isRecording)) {
                return false;
            }
            if (event.getAction() == MotionEvent.ACTION_DOWN) {
                if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    startRecording();
                } else {
                    requestRecordAudioPermission.launch(android.Manifest.permission.RECORD_AUDIO);
                }
                return true;
            } else if (event.getAction() == MotionEvent.ACTION_UP || event.getAction() == MotionEvent.ACTION_CANCEL) {
                stopRecording();
                return true;
            }
            return false;
        });
    }

    private void startRecording() {
        if (isRecording) return;
        try {
            File audioFile = new File(getCacheDir(), "voice_note_" + System.currentTimeMillis() + ".m4a");
            currentAudioPath = audioFile.getAbsolutePath();
            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            mediaRecorder.setOutputFile(currentAudioPath);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            mediaRecorder.prepare();
            mediaRecorder.start();
            isRecording = true;
            
            composerDefault.setVisibility(View.GONE);
            composerVoicePreview.setVisibility(View.VISIBLE);
            voiceDeleteButton.setVisibility(View.INVISIBLE);
            voicePlayButton.setImageResource(android.R.drawable.presence_audio_online);
            voiceDurationText.setText("0:00");
            recordingStartTime = System.currentTimeMillis();
            timerHandler.post(timerRunnable);
            
        } catch (IOException e) {
            e.printStackTrace();
            Toast.makeText(this, getString(R.string.media_audio_recording_failed), Toast.LENGTH_SHORT).show();
        }
    }

    private void stopRecording() {
        if (!isRecording || mediaRecorder == null) return;
        try {
            mediaRecorder.stop();
            mediaRecorder.release();
            mediaRecorder = null;
            isRecording = false;
            timerHandler.removeCallbacks(timerRunnable);
            
            long duration = System.currentTimeMillis() - recordingStartTime;
            if (duration < 1000) {
                deleteVoiceNote();
                return;
            }
            
            voiceDeleteButton.setVisibility(View.VISIBLE);
            voicePlayButton.setImageResource(android.R.drawable.ic_media_play);
            FloatingActionButton sendButton = findViewById(R.id.sendButton);
            sendButton.setImageResource(android.R.drawable.ic_menu_send);
            
        } catch (Exception e) {
            e.printStackTrace();
            isRecording = false;
            deleteVoiceNote();
        }
    }
    
    private void deleteVoiceNote() {
        if (previewPlayer != null) {
            previewPlayer.release();
            previewPlayer = null;
        }
        isPreviewPlaying = false;
        timerHandler.removeCallbacks(timerRunnable);
        
        if (currentAudioPath != null) {
            new File(currentAudioPath).delete();
            currentAudioPath = null;
        }
        composerVoicePreview.setVisibility(View.GONE);
        composerDefault.setVisibility(View.VISIBLE);
        FloatingActionButton sendButton = findViewById(R.id.sendButton);
        sendButton.setImageResource(android.R.drawable.ic_btn_speak_now);
    }
    
    private void toggleVoicePreview() {
        if (currentAudioPath == null) return;
        
        if (previewPlayer == null) {
            previewPlayer = new android.media.MediaPlayer();
            try {
                previewPlayer.setDataSource(currentAudioPath);
                previewPlayer.prepare();
                previewPlayer.setOnCompletionListener(mp -> {
                    isPreviewPlaying = false;
                    voicePlayButton.setImageResource(android.R.drawable.ic_media_play);
                    voiceDurationText.setText("0:00");
                    timerHandler.removeCallbacks(timerRunnable);
                });
            } catch (IOException e) {
                e.printStackTrace();
                return;
            }
        }
        
        if (isPreviewPlaying) {
            previewPlayer.pause();
            isPreviewPlaying = false;
            voicePlayButton.setImageResource(android.R.drawable.ic_media_play);
            timerHandler.removeCallbacks(timerRunnable);
        } else {
            previewPlayer.start();
            isPreviewPlaying = true;
            voicePlayButton.setImageResource(android.R.drawable.ic_media_pause);
            timerHandler.post(timerRunnable);
        }
    }
    
    private void sendVoiceNote() {
        if (currentAudioPath == null) return;
        
        if (previewPlayer != null) {
            previewPlayer.release();
            previewPlayer = null;
        }
        isPreviewPlaying = false;
        timerHandler.removeCallbacks(timerRunnable);
        
        repository.uploadMedia(
                this,
                session.getPhoneNumber(),
                session.getDisplayName(),
                currentChatId,
                getIntent().getStringExtra(EXTRA_CHAT_NAME),
                "file://" + currentAudioPath,
                "audio"
        );
        
        currentAudioPath = null;
        composerVoicePreview.setVisibility(View.GONE);
        composerDefault.setVisibility(View.VISIBLE);
        FloatingActionButton sendButton = findViewById(R.id.sendButton);
        sendButton.setImageResource(android.R.drawable.ic_btn_speak_now);
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (messageAdapter != null) {
            messageAdapter.pausePlayback();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mediaRecorder != null) {
            try {
                mediaRecorder.release();
            } catch (Exception ignored) {
            }
            mediaRecorder = null;
        }
        isRecording = false;
        if (messageAdapter != null) {
            messageAdapter.release();
            messageAdapter = null;
        }
        if (messageSubscription != null) {
            messageSubscription.dispose();
            messageSubscription = null;
        }
        if (presenceSubscription != null) {
            presenceSubscription.dispose();
            presenceSubscription = null;
        }
    }
}
