package com.firebasestudio.app;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
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
import com.google.firebase.messaging.FirebaseMessaging;

public class NativeHomeActivity extends AppCompatActivity {

    private static final String UI_PREFS = "chirp_chat_native_ui";
    private static final String KEY_FAB_X = "fab_x";
    private static final String KEY_FAB_Y = "fab_y";

    private NativeSessionManager sessionManager;
    private NativeSessionManager.NativeUserSession currentSession;
    private EditText searchInput;
    private BottomNavigationView bottomNavigationView;
    private FloatingActionButton newChatFab;

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
        bottomNavigationView = findViewById(R.id.bottomNavigation);
        newChatFab = findViewById(R.id.newChatFab);

        if (savedInstanceState == null) {
            showFragment(createFragmentForMenu(R.id.nav_chats));
        }

        bottomNavigationView.setOnItemSelectedListener(item -> {
            if (item.getItemId() == R.id.nav_contacts) {
                startActivity(new Intent(this, ContactsActivity.class));
                return false;
            }
            showFragment(createFragmentForMenu(item.getItemId()));
            updateUiForMenu(item.getItemId());
            return true;
        });

        newChatFab.setOnClickListener(view -> startActivity(new Intent(this, ContactsActivity.class)));
        attachFabDragBehavior();

        searchInput.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) { }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                Fragment current = getSupportFragmentManager().findFragmentById(R.id.homeFragmentContainer);
                if (current instanceof ChatsFragment) {
                    ((ChatsFragment) current).filter(s == null ? "" : s.toString());
                }
            }

            @Override public void afterTextChanged(Editable s) { }
        });

        propagateSession(currentSession);
        updateUiForMenu(R.id.nav_chats);
        restoreFabPosition();

        FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task -> {
            if (!task.isSuccessful() || currentSession == null) {
                return;
            }
            String token = task.getResult();
            new FirebaseChatRepository().updateFcmToken(currentSession.getPhoneNumber(), token);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (bottomNavigationView != null && bottomNavigationView.getSelectedItemId() != R.id.nav_settings) {
            bottomNavigationView.setSelectedItemId(R.id.nav_chats);
            updateUiForMenu(R.id.nav_chats);
        }
    }

    private Fragment createFragmentForMenu(@IdRes int itemId) {
        if (itemId == R.id.nav_settings) {
            return SettingsFragment.newInstance(currentSession);
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

    private void updateUiForMenu(@IdRes int itemId) {
        boolean chatsSelected = itemId == R.id.nav_chats;
        if (searchInput != null) {
            searchInput.setVisibility(chatsSelected ? View.VISIBLE : View.GONE);
        }
        if (newChatFab != null) {
            newChatFab.setVisibility(chatsSelected ? View.VISIBLE : View.GONE);
        }
    }

    private void restoreFabPosition() {
        if (newChatFab == null) {
            return;
        }
        SharedPreferences preferences = getSharedPreferences(UI_PREFS, MODE_PRIVATE);
        float savedX = preferences.getFloat(KEY_FAB_X, Float.NaN);
        float savedY = preferences.getFloat(KEY_FAB_Y, Float.NaN);
        if (Float.isNaN(savedX) || Float.isNaN(savedY)) {
            return;
        }
        newChatFab.post(() -> {
            View parent = (View) newChatFab.getParent();
            if (parent == null) {
                return;
            }
            newChatFab.setX(clamp(savedX, 0f, parent.getWidth() - newChatFab.getWidth()));
            newChatFab.setY(clamp(savedY, 0f, parent.getHeight() - newChatFab.getHeight()));
        });
    }

    private void saveFabPosition(float x, float y) {
        getSharedPreferences(UI_PREFS, MODE_PRIVATE)
                .edit()
                .putFloat(KEY_FAB_X, x)
                .putFloat(KEY_FAB_Y, y)
                .apply();
    }

    private void attachFabDragBehavior() {
        if (newChatFab == null) {
            return;
        }
        newChatFab.setOnTouchListener(new View.OnTouchListener() {
            float downRawX;
            float downRawY;
            float downX;
            float downY;
            boolean moved;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                View parent = (View) v.getParent();
                if (parent == null) {
                    return false;
                }
                switch (event.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        downRawX = event.getRawX();
                        downRawY = event.getRawY();
                        downX = v.getX();
                        downY = v.getY();
                        moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float deltaX = event.getRawX() - downRawX;
                        float deltaY = event.getRawY() - downRawY;
                        if (!moved && (Math.abs(deltaX) > 12f || Math.abs(deltaY) > 12f)) {
                            moved = true;
                        }
                        if (moved) {
                            float nextX = clamp(downX + deltaX, 0f, parent.getWidth() - v.getWidth());
                            float nextY = clamp(downY + deltaY, 0f, parent.getHeight() - v.getHeight());
                            v.setX(nextX);
                            v.setY(nextY);
                            return true;
                        }
                        return false;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        if (moved) {
                            saveFabPosition(v.getX(), v.getY());
                            v.performHapticFeedback(android.view.HapticFeedbackConstants.VIRTUAL_KEY);
                            return true;
                        }
                        if (event.getActionMasked() == MotionEvent.ACTION_UP) {
                            v.performClick();
                        }
                        return true;
                    default:
                        return false;
                }
            }
        });
    }

    private float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }

    private void showSessionDialog(boolean forced) {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_native_session, null, false);
        TextInputEditText nameInput = dialogView.findViewById(R.id.nativeSessionNameInput);
        TextInputEditText phoneInput = dialogView.findViewById(R.id.nativeSessionPhoneInput);

        if (currentSession != null) {
            nameInput.setText(currentSession.getDisplayName());
            phoneInput.setText(currentSession.getPhoneNumber());
        }

        MaterialAlertDialogBuilder builder = new MaterialAlertDialogBuilder(this)
                .setTitle(R.string.session_dialog_title)
                .setMessage(R.string.session_dialog_message)
                .setView(dialogView)
                .setCancelable(!forced)
                .setPositiveButton(R.string.session_dialog_save, null);

        if (!forced) {
            builder.setNeutralButton(R.string.session_dialog_clear, (dialogInterface, which) -> {
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
                phoneInput.setError(getString(R.string.contacts_phone_required));
                return;
            }
            if (name.isEmpty()) {
                name = phone;
            }

            sessionManager.saveSession(phone, name);
            currentSession = sessionManager.getSession();
            propagateSession(currentSession);
            Toast.makeText(this, getString(R.string.session_saved_toast, phone), Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        }));
        dialog.show();
    }
}
