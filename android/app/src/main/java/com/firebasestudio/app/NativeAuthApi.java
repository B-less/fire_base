package com.firebasestudio.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NativeAuthApi {

    public interface Callback<T> {
        void onSuccess(T result);
        void onError(String message);
    }

    public static class SendOtpResult {
        private final boolean success;
        private final String message;

        public SendOtpResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }
    }

    public static class VerifyOtpResult {
        private final boolean success;
        private final String message;
        @Nullable
        private final NativeSessionManager.NativeUserSession session;
        private final boolean isNewUser;

        public VerifyOtpResult(boolean success, String message, @Nullable NativeSessionManager.NativeUserSession session, boolean isNewUser) {
            this.success = success;
            this.message = message;
            this.session = session;
            this.isNewUser = isNewUser;
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }

        @Nullable
        public NativeSessionManager.NativeUserSession getSession() {
            return session;
        }

        public boolean isNewUser() {
            return isNewUser;
        }
    }

    private static final ExecutorService EXECUTOR = Executors.newSingleThreadExecutor();
    private static final Handler MAIN_HANDLER = new Handler(Looper.getMainLooper());

    private final String baseUrl;

    public NativeAuthApi(Context context) {
        baseUrl = context.getString(R.string.native_backend_base_url).replaceAll("/+$", "");
    }

    public void sendOtp(@NonNull String phoneNumber, @NonNull Callback<SendOtpResult> callback) {
        EXECUTOR.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("phoneNumber", phoneNumber);

                JSONObject response = postJson("/api/native/auth/send-otp", body);
                SendOtpResult result = new SendOtpResult(
                        response.optBoolean("success", false),
                        response.optString("message", "OTP sent.")
                );

                if (result.isSuccess()) {
                    postSuccess(callback, result);
                } else {
                    postError(callback, result.getMessage());
                }
            } catch (Exception exception) {
                postError(callback, exception.getMessage() == null ? "Could not send OTP." : exception.getMessage());
            }
        });
    }

    public void verifyOtp(@NonNull String phoneNumber, @NonNull String otp, @NonNull Callback<VerifyOtpResult> callback) {
        EXECUTOR.execute(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("phoneNumber", phoneNumber);
                body.put("otp", otp);

                JSONObject response = postJson("/api/native/auth/verify-otp", body);
                boolean success = response.optBoolean("success", false);
                String message = response.optString("message", success ? "Verified." : "Verification failed.");
                boolean isNewUser = response.optBoolean("isNewUser", false);

                NativeSessionManager.NativeUserSession session = null;
                JSONObject userObject = response.optJSONObject("user");
                if (userObject != null) {
                    String verifiedPhone = userObject.optString("phoneNumber", phoneNumber);
                    String displayName = userObject.optString("name", verifiedPhone);
                    session = new NativeSessionManager.NativeUserSession(verifiedPhone, displayName);
                }

                VerifyOtpResult result = new VerifyOtpResult(success, message, session, isNewUser);
                if (success) {
                    postSuccess(callback, result);
                } else {
                    postError(callback, message);
                }
            } catch (Exception exception) {
                postError(callback, exception.getMessage() == null ? "Could not verify OTP." : exception.getMessage());
            }
        });
    }

    private JSONObject postJson(String path, JSONObject body) throws Exception {
        URL url = new URL(baseUrl + path);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(20000);
        connection.setDoInput(true);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        connection.setRequestProperty("Accept", "application/json");

        try (OutputStream outputStream = connection.getOutputStream();
             BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8))) {
            writer.write(body.toString());
            writer.flush();
        }

        int statusCode = connection.getResponseCode();
        InputStream inputStream = statusCode >= 200 && statusCode < 300
                ? connection.getInputStream()
                : connection.getErrorStream();

        if (inputStream == null) {
            throw new IllegalStateException("No response from server.");
        }

        StringBuilder responseBuilder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                responseBuilder.append(line);
            }
        } finally {
            connection.disconnect();
        }

        JSONObject response = new JSONObject(responseBuilder.toString());
        if (statusCode < 200 || statusCode >= 300) {
            throw new IllegalStateException(response.optString("message", "Server request failed."));
        }
        return response;
    }

    private <T> void postSuccess(Callback<T> callback, T result) {
        MAIN_HANDLER.post(() -> callback.onSuccess(result));
    }

    private <T> void postError(Callback<T> callback, String message) {
        MAIN_HANDLER.post(() -> callback.onError(message));
    }
}
