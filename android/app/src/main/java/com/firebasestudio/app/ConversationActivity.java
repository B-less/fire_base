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

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_conversation);

        String chatName = getIntent().getStringExtra(EXTRA_CHAT_NAME);
        if (chatName == null || chatName.trim().isEmpty()) {
            chatName = "Chirp Chat";
        }

        MaterialToolbar toolbar = findViewById(R.id.conversationToolbar);
        toolbar.setTitle(chatName);
        toolbar.setSubtitle(getString(R.string.conversation_online));
        toolbar.setNavigationOnClickListener(v -> finish());

        RecyclerView recyclerView = findViewById(R.id.messageRecyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(new MessageAdapter(createMockMessages(chatName)));

        EditText messageInput = findViewById(R.id.messageInput);
        FloatingActionButton sendButton = findViewById(R.id.sendButton);
        String finalChatName = chatName;
        sendButton.setOnClickListener(v -> {
            String draft = messageInput.getText().toString().trim();
            if (draft.isEmpty()) {
                Toast.makeText(this, "Type a message first.", Toast.LENGTH_SHORT).show();
                return;
            }
            Toast.makeText(this, "Next step: send \"" + draft + "\" to " + finalChatName, Toast.LENGTH_SHORT).show();
            messageInput.setText("");
        });
    }

    private List<MessageUiModel> createMockMessages(String chatName) {
        List<MessageUiModel> messages = new ArrayList<>();
        messages.add(new MessageUiModel("Hey " + chatName + ", I’ve started the native Android rewrite.", "3:32 PM", true));
        messages.add(new MessageUiModel("Nice. Can we make it feel close to WhatsApp?", "3:34 PM", false));
        messages.add(new MessageUiModel("Yes — compact bubbles, strong hierarchy, and faster navigation.", "3:36 PM", true));
        messages.add(new MessageUiModel("Perfect. Let’s keep the flow familiar and smooth.", "3:37 PM", false));
        return messages;
    }
}
