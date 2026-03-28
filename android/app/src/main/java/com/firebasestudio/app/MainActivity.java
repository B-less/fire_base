package com.firebasestudio.app;

import android.os.Bundle;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private NativeContactsBridge nativeContactsBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        if (bridge != null && bridge.getWebView() != null) {
            nativeContactsBridge = new NativeContactsBridge(this, bridge.getWebView());
            bridge.getWebView().addJavascriptInterface(nativeContactsBridge, "AndroidNativeContacts");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (nativeContactsBridge != null) {
            nativeContactsBridge.handlePermissionResult(requestCode, grantResults);
        }
    }
}
