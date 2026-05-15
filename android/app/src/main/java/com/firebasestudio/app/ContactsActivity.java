package com.firebasestudio.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
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
    private NativeSessionManager.NativeUserSession session;
    private ChatPreviewAdapter adapter;
    private RecyclerView recyclerView;
    private LinearLayout emptyState;
    private TextView emptySubtitle;
    private String activeQuery = "";
    private final List<ChatPreview> deviceContacts = new ArrayList<>();
    private ActivityResultLauncher<String> requestContactsPermission;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_contacts);

        NativeSessionManager sessionManager = new NativeSessionManager(this);
        session = sessionManager.getSession();
        if (session == null) {
            Toast.makeText(this, R.string.contacts_sign_in_first, Toast.LENGTH_LONG).show();
            finish();
            return;
        }

        requestContactsPermission = registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
            if (granted) {
                loadDeviceContacts();
            } else {
                showEmptyState(getString(R.string.contacts_permission_required_message));
            }
        });

        MaterialToolbar toolbar = findViewById(R.id.contactsToolbar);
        toolbar.setNavigationOnClickListener(v -> finish());

        EditText searchInput = findViewById(R.id.contactsSearchInput);
        MaterialButton addByPhoneButton = findViewById(R.id.addByPhoneButton);
        recyclerView = findViewById(R.id.contactsRecyclerView);
        emptyState = findViewById(R.id.contactsEmptyState);
        emptySubtitle = findViewById(R.id.contactsEmptySubtitle);

        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ChatPreviewAdapter(this, new ArrayList<>(), this::handleDeviceContactTap);
        recyclerView.setAdapter(adapter);

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) { }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                activeQuery = s == null ? "" : s.toString();
                if (adapter != null) {
                    adapter.filter(activeQuery);
                }
                updateEmptyStateForAdapter();
            }

            @Override public void afterTextChanged(Editable s) { }
        });

        addByPhoneButton.setOnClickListener(v -> showAddByPhoneDialog());
        ensureContactsAccess();
    }

    private void ensureContactsAccess() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) {
            loadDeviceContacts();
        } else {
            requestContactsPermission.launch(Manifest.permission.READ_CONTACTS);
        }
    }

    private void loadDeviceContacts() {
        String defaultCountryCode = getString(R.string.login_default_country_code);
        new Thread(() -> {
            List<ChatPreview> loadedContacts = DeviceContactLoader.loadContacts(this, defaultCountryCode);
            runOnUiThread(() -> {
                deviceContacts.clear();
                deviceContacts.addAll(loadedContacts);
                adapter.replaceChats(deviceContacts);
                if (adapter != null) {
                    adapter.filter(activeQuery);
                }
                if (loadedContacts.isEmpty()) {
                    showEmptyState(getString(R.string.contacts_empty_device_subtitle));
                } else {
                    updateEmptyStateForAdapter();
                }
            });
        }).start();
    }

    private void handleDeviceContactTap(ChatPreview contactPreview) {
        repository.lookupUserByPhone(contactPreview.getId(), new FirebaseChatRepository.ContactLookupListener() {
            @Override
            public void onFound(ChatPreview contact) {
                repository.addMutualContact(session.getPhoneNumber(), contact.getId(), new FirebaseChatRepository.OperationListener() {
                    @Override
                    public void onSuccess() {
                        runOnUiThread(() -> {
                            Toast.makeText(ContactsActivity.this, getString(R.string.contacts_added_toast, contact.getName()), Toast.LENGTH_SHORT).show();
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
                runOnUiThread(() -> Toast.makeText(ContactsActivity.this, R.string.contacts_not_on_chirp_chat, Toast.LENGTH_LONG).show());
            }

            @Override
            public void onError(String message) {
                runOnUiThread(() -> Toast.makeText(ContactsActivity.this, message, Toast.LENGTH_LONG).show());
            }
        });
    }

    private void updateEmptyStateForAdapter() {
        boolean showEmpty = adapter == null || adapter.getItemCount() == 0;
        emptyState.setVisibility(showEmpty ? View.VISIBLE : View.GONE);
        recyclerView.setVisibility(showEmpty ? View.GONE : View.VISIBLE);
        if (showEmpty) {
            emptySubtitle.setText(activeQuery.trim().isEmpty()
                    ? getString(R.string.contacts_empty_device_subtitle)
                    : getString(R.string.contacts_empty_search_subtitle));
        }
    }

    private void showEmptyState(String subtitle) {
        emptySubtitle.setText(subtitle);
        emptyState.setVisibility(View.VISIBLE);
        recyclerView.setVisibility(View.GONE);
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
            String phoneNumber = DeviceContactLoader.normalizeInternationalPhone(
                    String.valueOf(phoneInput.getText()).trim(),
                    getString(R.string.login_default_country_code)
            );
            if (phoneNumber.isEmpty()) {
                phoneInput.setError(getString(R.string.contacts_phone_required));
                return;
            }
            if (session.getPhoneNumber().equals(phoneNumber)) {
                phoneInput.setError(getString(R.string.contacts_add_self_error));
                return;
            }
            if (!phoneNumber.matches("^\\+[1-9][0-9]{6,14}$")) {
                phoneInput.setError(getString(R.string.contacts_invalid_phone_error));
                return;
            }

            repository.lookupUserByPhone(phoneNumber, new FirebaseChatRepository.ContactLookupListener() {
                @Override
                public void onFound(ChatPreview contact) {
                    repository.addMutualContact(session.getPhoneNumber(), contact.getId(), new FirebaseChatRepository.OperationListener() {
                        @Override
                        public void onSuccess() {
                            runOnUiThread(() -> {
                                Toast.makeText(ContactsActivity.this, getString(R.string.contacts_added_toast, contact.getName()), Toast.LENGTH_SHORT).show();
                                dialog.dismiss();
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
                    runOnUiThread(() -> phoneInput.setError(getString(R.string.contacts_not_on_chirp_chat)));
                }

                @Override
                public void onError(String message) {
                    runOnUiThread(() -> Toast.makeText(ContactsActivity.this, message, Toast.LENGTH_LONG).show());
                }
            });
        }));

        dialog.show();
    }
}
