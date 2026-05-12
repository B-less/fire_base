package com.firebasestudio.app;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.widget.EditText;
import android.widget.Toast;

import androidx.annotation.IdRes;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.google.android.material.textfield.TextInputEditText;

public class NativeHomeActivity extends AppCompatActivity {

    private NativeSessionManager sessionManager;
    private NativeSessionManager.NativeUserSession currentSession;
    private EditText searchInput;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_native_home);

        sessionManager = new NativeSessionManager(this);
        currentSession = sessionManager.getSession();
        if (currentSession == null) {
            startActivity(new Intent(this, NativeLoginActivity.class));
            finish();
            return;
        }

        MaterialToolbar toolbar = findViewById(R.id.homeToolbar);
        toolbar.setTitle(getString(R.string.home_title));
        toolbar.setNavigationOnClickListener(view -> showSessionDialog(false));

        searchInput = findViewById(R.id.searchInput);
        BottomNavigationView bottomNavigationView = findViewById(R.id.bottomNavigation);
        FloatingActionButton newChatFab = findViewById(R.id.newChatFab);

        if (savedInstanceState == null) {
            showFragment(createFragmentForMenu(R.id.nav_chats));
        }

        bottomNavigationView.setOnItemSelectedListener(item -> {
            showFragment(createFragmentForMenu(item.getItemId()));
            return true;
        });

        newChatFab.setOnClickListener(view ->
                startActivity(new Intent(this, ContactsActivity.class))
        );

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                Fragment current = getSupportFragmentManager().findFragmentById(R.id.homeFragmentContainer);
                if (current instanceof ChatsFragment) {
                    ((ChatsFragment) current).filter(s.toString());
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        propagateSession(currentSession);
    }

    private Fragment createFragmentForMenu(@IdRes int itemId) {
        if (itemId == R.id.nav_updates) {
            return PlaceholderFragment.newInstance(
                    getString(R.string.placeholder_updates_title),
                    getString(R.string.placeholder_updates_subtitle)
            );
        }
        if (itemId == R.id.nav_calls) {
            return PlaceholderFragment.newInstance(
                    getString(R.string.placeholder_calls_title),
                    getString(R.string.placeholder_calls_subtitle)
            );
        }
        if (itemId == R.id.nav_settings) {
            return PlaceholderFragment.newInstance(
                    getString(R.string.placeholder_settings_title),
                    getString(R.string.placeholder_settings_subtitle)
            );
        }
        ChatsFragment fragment = new ChatsFragment();
        fragment.setSession(currentSession);
        return fragment;
    }

    private void showFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.homeFragmentContainer, fragment)
                .commit();
    }

    private void propagateSession(@Nullable NativeSessionManager.NativeUserSession session) {
        Fragment current = getSupportFragmentManager().findFragmentById(R.id.homeFragmentContainer);
        if (current instanceof ChatsFragment) {
            ((ChatsFragment) current).setSession(session);
            ((ChatsFragment) current).filter(searchInput.getText().toString());
        }
    }

    private void showSessionDialog(boolean forced) {
        android.view.View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_native_session, null, false);
        TextInputEditText nameInput = dialogView.findViewById(R.id.nativeSessionNameInput);
        TextInputEditText phoneInput = dialogView.findViewById(R.id.nativeSessionPhoneInput);

        if (currentSession != null) {
            nameInput.setText(currentSession.getDisplayName());
            phoneInput.setText(currentSession.getPhoneNumber());
        }

        MaterialAlertDialogBuilder builder = new MaterialAlertDialogBuilder(this)
                .setTitle("Set up native preview")
                .setMessage("We’re now loading real chats natively. Enter the same phone number you use in Chirp Chat so the native shell can subscribe to your conversations.")
                .setView(dialogView)
                .setCancelable(!forced)
                .setPositiveButton("Save", null);

        if (!forced) {
            builder.setNeutralButton("Clear", (dialogInterface, which) -> {
                sessionManager.clearSession();
                currentSession = null;
                startActivity(new Intent(this, NativeLoginActivity.class));
                finish();
            });
        }

        androidx.appcompat.app.AlertDialog dialog = builder.create();
        dialog.setOnShowListener(dialogInterface -> dialog.getButton(androidx.appcompat.app.AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String name = String.valueOf(nameInput.getText()).trim();
            String phone = String.valueOf(phoneInput.getText()).trim();
            if (phone.isEmpty()) {
                phoneInput.setError("Phone number is required");
                return;
            }
            if (name.isEmpty()) {
                name = phone;
            }

            sessionManager.saveSession(phone, name);
            currentSession = sessionManager.getSession();
            propagateSession(currentSession);
            Toast.makeText(this, "Native session saved for " + phone, Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        }));
        dialog.show();
    }
}
