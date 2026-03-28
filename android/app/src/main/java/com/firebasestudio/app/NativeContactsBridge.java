package com.firebasestudio.app;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.provider.ContactsContract;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class NativeContactsBridge {
    private static final int REQUEST_READ_CONTACTS = 4107;

    private final Activity activity;
    private final WebView webView;
    private final List<String> pendingCallbackIds = new ArrayList<>();

    public NativeContactsBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    @JavascriptInterface
    public void requestContacts(String callbackId) {
        activity.runOnUiThread(() -> {
            if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CONTACTS)
                == PackageManager.PERMISSION_GRANTED) {
                deliverContacts(callbackId);
                return;
            }

            pendingCallbackIds.add(callbackId);
            ActivityCompat.requestPermissions(
                activity,
                new String[]{Manifest.permission.READ_CONTACTS},
                REQUEST_READ_CONTACTS
            );
        });
    }

    public boolean handlePermissionResult(int requestCode, int[] grantResults) {
        if (requestCode != REQUEST_READ_CONTACTS) {
            return false;
        }

        List<String> callbackIds = new ArrayList<>(pendingCallbackIds);
        pendingCallbackIds.clear();

        boolean granted = grantResults.length > 0
            && grantResults[0] == PackageManager.PERMISSION_GRANTED;

        if (granted) {
            for (String callbackId : callbackIds) {
                deliverContacts(callbackId);
            }
        } else {
            for (String callbackId : callbackIds) {
                reject(callbackId, "Contacts permission was denied.");
            }
        }

        return true;
    }

    private void deliverContacts(String callbackId) {
        try {
            JSONArray contacts = new JSONArray();
            Cursor cursor = activity.getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                new String[]{
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER
                },
                null,
                null,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
            );

            if (cursor != null) {
                int nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);

                while (cursor.moveToNext()) {
                    JSONObject contact = new JSONObject();
                    contact.put("name", nameIndex >= 0 ? cursor.getString(nameIndex) : "");
                    contact.put("phone", numberIndex >= 0 ? cursor.getString(numberIndex) : "");
                    contacts.put(contact);
                }

                cursor.close();
            }

            resolve(callbackId, contacts.toString());
        } catch (Exception exception) {
            reject(callbackId, exception.getMessage() != null
                ? exception.getMessage()
                : "Failed to load contacts.");
        }
    }

    private void resolve(String callbackId, String payload) {
        String script =
            "window.__nativeContactsResolve && window.__nativeContactsResolve("
                + JSONObject.quote(callbackId)
                + ", "
                + JSONObject.quote(payload)
                + ");";
        activity.runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private void reject(String callbackId, String error) {
        String script =
            "window.__nativeContactsReject && window.__nativeContactsReject("
                + JSONObject.quote(callbackId)
                + ", "
                + JSONObject.quote(error)
                + ");";
        activity.runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }
}
