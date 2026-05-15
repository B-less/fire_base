package com.firebasestudio.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;

public class SettingsFragment extends Fragment {

    private static final String ARG_NAME = "name";
    private static final String ARG_PHONE = "phone";

    public static SettingsFragment newInstance(@Nullable NativeSessionManager.NativeUserSession session) {
        SettingsFragment fragment = new SettingsFragment();
        Bundle args = new Bundle();
        if (session != null) {
            args.putString(ARG_NAME, session.getDisplayName());
            args.putString(ARG_PHONE, session.getPhoneNumber());
        }
        fragment.setArguments(args);
        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_settings, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        TextView nameView = view.findViewById(R.id.settingsProfileName);
        TextView phoneView = view.findViewById(R.id.settingsProfilePhone);
        MaterialButton contactsButton = view.findViewById(R.id.settingsContactsButton);
        MaterialButton logoutButton = view.findViewById(R.id.settingsLogoutButton);

        Bundle args = getArguments();
        String name = args == null ? "" : args.getString(ARG_NAME, "");
        String phone = args == null ? "" : args.getString(ARG_PHONE, "");
        nameView.setText(name.isEmpty() ? getString(R.string.home_title) : name);
        phoneView.setText(phone);

        contactsButton.setOnClickListener(v -> startActivity(new Intent(requireContext(), ContactsActivity.class)));
        logoutButton.setOnClickListener(v -> {
            NativeSessionManager sessionManager = new NativeSessionManager(requireContext());
            sessionManager.clearSession();
            Intent intent = new Intent(requireContext(), NativeLoginActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            requireActivity().finish();
        });
    }
}
