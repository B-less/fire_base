package com.firebasestudio.app;

import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.IdRes;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.floatingactionbutton.FloatingActionButton;

public class NativeHomeActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_native_home);

        BottomNavigationView bottomNavigationView = findViewById(R.id.bottomNavigation);
        FloatingActionButton newChatFab = findViewById(R.id.newChatFab);

        if (savedInstanceState == null) {
            showFragment(new ChatsFragment());
        }

        bottomNavigationView.setOnItemSelectedListener(item -> {
            showFragment(createFragmentForMenu(item.getItemId()));
            return true;
        });

        newChatFab.setOnClickListener(view ->
                Toast.makeText(this, "Next step: wire the native contact picker here.", Toast.LENGTH_SHORT).show()
        );
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
        return new ChatsFragment();
    }

    private void showFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.homeFragmentContainer, fragment)
                .commit();
    }
}
