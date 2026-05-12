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

import java.util.ArrayList;
import java.util.List;

public class ConversationActivity extends AppCompatActivity {

    public static final String EXTRA_CHAT_ID = "chat_id";
    public static final String EXTRA_CHAT_NAME = "chat_name";

    private final FirebaseChatRepository repository = new FirebaseChatRepository();
    private FirebaseChatRepository.Subscription messageSubscription;
    private NativeSessionManager.NativeUserSession session;

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

        MaterialToolbar toolbar = findViewById(R.id.conversationToolbar);
        toolbar.setTitle(chatName);
        toolbar.setSubtitle(getString(R.string.conversation_online));
        toolbar.setNavigationOnClickListener(v -> finish());

        RecyclerView recyclerView = findViewById(R.id.messageRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        MessageAdapter adapter = new MessageAdapter(new ArrayList<>());
        recyclerView.setAdapter(adapter);

        String finalChatId = chatId;
        messageSubscription = repository.observeConversation(session.getPhoneNumber(), finalChatId, new FirebaseChatRepository.MessagesListener() {
            @Override
            public void onMessagesUpdated(List<MessageUiModel> messages) {
                runOnUiThread(() -> {
                    adapter.replaceMessages(messages);
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
        String finalChatName = chatName;
        sendButton.setOnClickListener(v -> {
            String draft = messageInput.getText().toString().trim();
            if (draft.isEmpty()) {
                Toast.makeText(this, "Type a message first.", Toast.LENGTH_SHORT).show();
                return;
            }
            repository.sendMessage(session.getPhoneNumber(), session.getDisplayName(), finalChatId, draft);
            messageInput.setText("");
            Toast.makeText(this, "Sent to " + finalChatName, Toast.LENGTH_SHORT).show();
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (messageSubscription != null) {
            messageSubscription.dispose();
            messageSubscription = null;
        }
    }
}
