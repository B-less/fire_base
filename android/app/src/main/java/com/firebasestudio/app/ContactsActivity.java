package com.firebasestudio.app;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.textfield.TextInputEditText;

import java.util.ArrayList;
import java.util.List;

public class ContactsActivity extends AppCompatActivity {

    private final FirebaseChatRepository repository = new FirebaseChatRepository();
    private FirebaseChatRepository.Subscription contactsSubscription;
    private NativeSessionManager.NativeUserSession session;
    private ChatPreviewAdapter adapter;
    private RecyclerView recyclerView;
    private LinearLayout emptyState;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_contacts);

        NativeSessionManager sessionManager = new NativeSessionManager(this);
        session = sessionManager.getSession();
        if (session == null) {
            Toast.makeText(this, "Sign in natively first.", Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        MaterialToolbar toolbar = findViewById(R.id.contactsToolbar);
        toolbar.setNavigationOnClickListener(v -> finish());

        EditText searchInput = findViewById(R.id.contactsSearchInput);
        MaterialButton addByPhoneButton = findViewById(R.id.addByPhoneButton);
        recyclerView = findViewById(R.id.contactsRecyclerView);
        emptyState = findViewById(R.id.contactsEmptyState);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ChatPreviewAdapter(this, new ArrayList<>());
        recyclerView.setAdapter(adapter);

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                adapter.filter(s == null ? "" : s.toString());
                updateEmptyState();
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        addByPhoneButton.setOnClickListener(v -> showAddByPhoneDialog());
        bindContacts();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (contactsSubscription != null) {
            contactsSubscription.dispose();
            contactsSubscription = null;
        }
    }

    private void bindContacts() {
        if (session == null) {
            return;
        }
        contactsSubscription = repository.observeChats(session.getPhoneNumber(), new FirebaseChatRepository.ChatsListener() {
            @Override
            public void onChatsUpdated(List<ChatPreview> chats) {
                runOnUiThread(() -> {
                    adapter.replaceChats(chats);
                    updateEmptyState();
                });
            }

            @Override
            public void onError(String message) {
                runOnUiThread(() -> Toast.makeText(ContactsActivity.this, "Could not load contacts: " + message, Toast.LENGTH_SHORT).show());
            }
        });
    }

    private void updateEmptyState() {
        boolean showEmpty = adapter == null || adapter.getItemCount() == 0;
        emptyState.setVisibility(showEmpty ? View.VISIBLE : View.GONE);
        recyclerView.setVisibility(showEmpty ? View.GONE : View.VISIBLE);
    }

    private void showAddByPhoneDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_add_contact, null, false);
        TextInputEditText phoneInput = dialogView.findViewById(R.id.addContactPhoneInput);

        androidx.appcompat.app.AlertDialog dialog = new MaterialAlertDialogBuilder(this)
                .setTitle(R.string.contacts_add_dialog_title)
                .setMessage(R.string.contacts_add_dialog_message)
                .setView(dialogView)
                .setNegativeButton(R.string.contacts_add_dialog_cancel, null)
                .setPositiveButton(R.string.contacts_add_dialog_confirm, null)
                .create();

        dialog.setOnShowListener(ignored -> dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String phoneNumber = normalizeInternationalPhone(String.valueOf(phoneInput.getText()).trim());
            if (phoneNumber.isEmpty()) {
                phoneInput.setError("Phone number is required");
                return;
            }
            if (session.getPhoneNumber().equals(phoneNumber)) {
                phoneInput.setError("You cannot add yourself.");
                return;
            }
            if (!phoneNumber.matches("^\\+[1-9][0-9]{6,14}$")) {
                phoneInput.setError("Use a full international phone number like +233501234567");
                return;
            }

            repository.lookupUserByPhone(phoneNumber, new FirebaseChatRepository.ContactLookupListener() {
                @Override
                public void onFound(ChatPreview contact) {
                    repository.addMutualContact(session.getPhoneNumber(), contact.getId(), new FirebaseChatRepository.OperationListener() {
                        @Override
                        public void onSuccess() {
                            runOnUiThread(() -> {
                                Toast.makeText(ContactsActivity.this, contact.getName() + " is now in your contacts.", Toast.LENGTH_SHORT).show();
                                dialog.dismiss();
                                adapter.filter("");
                                Intent intent = new Intent(ContactsActivity.this, ConversationActivity.class);
                                intent.putExtra(ConversationActivity.EXTRA_CHAT_ID, contact.getId());
                                intent.putExtra(ConversationActivity.EXTRA_CHAT_NAME, contact.getName());
                                startActivity(intent);
                            });
                        }

                        @Override
                        public void onError(String message) {
                            runOnUiThread(() -> Toast.makeText(ContactsActivity.this, message, Toast.LENGTH_LONG).show());
                        }
                    });
                }

                @Override
                public void onNotFound() {
                    runOnUiThread(() -> phoneInput.setError("No Chirp Chat user found for that number"));
                }

                @Override
                public void onError(String message) {
                    runOnUiThread(() -> Toast.makeText(ContactsActivity.this, message, Toast.LENGTH_LONG).show());
                }
            });
        }));

        dialog.show();
    }

    private String normalizeInternationalPhone(String rawPhoneNumber) {
        if (rawPhoneNumber == null) {
            return "";
        }
        String trimmed = rawPhoneNumber.trim().replaceAll("[\\s()-]", "");
        if (trimmed.startsWith("00")) {
            trimmed = "+" + trimmed.substring(2);
        }
        if (!trimmed.startsWith("+")) {
            trimmed = "+" + trimmed.replaceAll("[^0-9]", "");
        }
        return trimmed;
    }
}
