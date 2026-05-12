package com.firebasestudio.app;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.textfield.TextInputEditText;

public class NativeLoginActivity extends AppCompatActivity {

    private NativeSessionManager sessionManager;
    private NativeAuthApi authApi;

    private View phoneStep;
    private View otpStep;
    private CircularProgressIndicator progressIndicator;
    private TextInputEditText countryCodeInput;
    private TextInputEditText phoneInput;
    private TextInputEditText otpInput;
    private TextView otpSubtitle;
    private MaterialButton sendOtpButton;
    private MaterialButton verifyOtpButton;

    private String normalizedPhoneNumber;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        sessionManager = new NativeSessionManager(this);
        NativeSessionManager.NativeUserSession session = sessionManager.getSession();
        if (session != null) {
            launchHome();
            return;
        }

        setContentView(R.layout.activity_native_login);
        authApi = new NativeAuthApi(this);

        phoneStep = findViewById(R.id.phoneStep);
        otpStep = findViewById(R.id.otpStep);
        progressIndicator = findViewById(R.id.loginProgress);
        countryCodeInput = findViewById(R.id.countryCodeInput);
        phoneInput = findViewById(R.id.phoneNumberInput);
        otpInput = findViewById(R.id.otpInput);
        otpSubtitle = findViewById(R.id.otpSubtitle);
        sendOtpButton = findViewById(R.id.sendOtpButton);
        verifyOtpButton = findViewById(R.id.verifyOtpButton);
        MaterialButton backButton = findViewById(R.id.backButton);

        countryCodeInput.setText(getString(R.string.login_default_country_code));
        otpInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                verifyOtpButton.setEnabled(s != null && s.length() == 6);
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });

        sendOtpButton.setOnClickListener(v -> requestOtp());
        verifyOtpButton.setOnClickListener(v -> verifyOtp());
        backButton.setOnClickListener(v -> showPhoneStep());

        showPhoneStep();
    }

    private void requestOtp() {
        String phone = normalizePhoneNumber();
        if (phone == null) {
            return;
        }

        setLoading(true);
        authApi.sendOtp(phone, new NativeAuthApi.Callback<NativeAuthApi.SendOtpResult>() {
            @Override
            public void onSuccess(NativeAuthApi.SendOtpResult result) {
                setLoading(false);
                normalizedPhoneNumber = phone;
                otpSubtitle.setText(getString(R.string.native_login_otp_subtitle, normalizedPhoneNumber));
                otpInput.setText("");
                showOtpStep();
                Toast.makeText(NativeLoginActivity.this, result.getMessage(), Toast.LENGTH_SHORT).show();
            }

            @Override
            public void onError(String message) {
                setLoading(false);
                Toast.makeText(NativeLoginActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void verifyOtp() {
        if (normalizedPhoneNumber == null || normalizedPhoneNumber.trim().isEmpty()) {
            showPhoneStep();
            Toast.makeText(this, "Start with your phone number first.", Toast.LENGTH_SHORT).show();
            return;
        }

        String otp = String.valueOf(otpInput.getText()).trim();
        if (otp.length() != 6) {
            otpInput.setError("Enter the 6-digit code");
            return;
        }

        setLoading(true);
        authApi.verifyOtp(normalizedPhoneNumber, otp, new NativeAuthApi.Callback<NativeAuthApi.VerifyOtpResult>() {
            @Override
            public void onSuccess(NativeAuthApi.VerifyOtpResult result) {
                setLoading(false);
                NativeSessionManager.NativeUserSession verifiedSession = result.getSession();
                if (verifiedSession == null) {
                    Toast.makeText(NativeLoginActivity.this, "Verification succeeded but no user session was returned.", Toast.LENGTH_LONG).show();
                    return;
                }

                sessionManager.saveSession(verifiedSession.getPhoneNumber(), verifiedSession.getDisplayName());
                Toast.makeText(
                        NativeLoginActivity.this,
                        result.isNewUser() ? "Welcome to Chirp Chat. Let’s start chatting." : "Signed in successfully.",
                        Toast.LENGTH_SHORT
                ).show();
                launchHome();
            }

            @Override
            public void onError(String message) {
                setLoading(false);
                Toast.makeText(NativeLoginActivity.this, message, Toast.LENGTH_LONG).show();
            }
        });
    }

    private void showPhoneStep() {
        phoneStep.setVisibility(View.VISIBLE);
        otpStep.setVisibility(View.GONE);
        sendOtpButton.setEnabled(true);
    }

    private void showOtpStep() {
        phoneStep.setVisibility(View.GONE);
        otpStep.setVisibility(View.VISIBLE);
        verifyOtpButton.setEnabled(false);
    }

    private void setLoading(boolean isLoading) {
        progressIndicator.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        sendOtpButton.setEnabled(!isLoading);
        verifyOtpButton.setEnabled(!isLoading && otpInput.getText() != null && otpInput.getText().length() == 6);
        phoneInput.setEnabled(!isLoading);
        countryCodeInput.setEnabled(!isLoading);
        otpInput.setEnabled(!isLoading);
    }

    @Nullable
    private String normalizePhoneNumber() {
        String countryCode = String.valueOf(countryCodeInput.getText()).trim();
        String localNumber = String.valueOf(phoneInput.getText()).trim().replaceAll("[^0-9+]", "");

        if (countryCode.isEmpty()) {
            countryCodeInput.setError("Country code is required");
            return null;
        }
        if (!countryCode.startsWith("+")) {
            countryCode = "+" + countryCode.replaceAll("[^0-9]", "");
        }
        if (!countryCode.matches("^\\+[1-9][0-9]{0,3}$")) {
            countryCodeInput.setError("Use an international code like +233");
            return null;
        }
        if (localNumber.isEmpty()) {
            phoneInput.setError("Phone number is required");
            return null;
        }

        String digits = localNumber.replaceAll("[^0-9]", "");
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (digits.length() < 7) {
            phoneInput.setError("Enter a valid phone number");
            return null;
        }
        return countryCode + digits;
    }

    private void launchHome() {
        Intent intent = new Intent(this, NativeHomeActivity.class);
        startActivity(intent);
        finish();
    }
}
