package com.firebasestudio.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

/**
 * Helper class for managing Android runtime permissions (API 23+)
 */
public class PermissionHelper {
    
    private static final String TAG = "PermissionHelper";
    
    public static final String[] REQUIRED_PERMISSIONS = {
            Manifest.permission.INTERNET,
            Manifest.permission.CAMERA,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.RECORD_AUDIO
    };
    
    public static final String[] OPTIONAL_PERMISSIONS = {
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_VIDEO,
            Manifest.permission.READ_MEDIA_AUDIO
    };

    /**
     * Check if a specific permission is granted
     */
    public static boolean hasPermission(Context context, String permission) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true; // Permissions automatically granted on Android < 6.0
        }
        return ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED;
    }
    
    /**
     * Check if all required permissions are granted
     */
    public static boolean hasAllRequiredPermissions(Context context) {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (!hasPermission(context, permission)) {
                Log.w(TAG, "Missing required permission: " + permission);
                return false;
            }
        }
        return true;
    }
    
    /**
     * Get list of permissions that need to be requested
     */
    public static String[] getMissingPermissions(Context context, String[] permissions) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return new String[0];
        }
        
        java.util.List<String> missingPermissions = new java.util.ArrayList<>();
        for (String permission : permissions) {
            if (!hasPermission(context, permission)) {
                missingPermissions.add(permission);
            }
        }
        return missingPermissions.toArray(new String[0]);
    }
    
    /**
     * Check if we should show permission rationale
     */
    public static boolean shouldShowPermissionRationale(android.app.Activity activity, String permission) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return false;
        }
        return activity.shouldShowRequestPermissionRationale(permission);
    }
}
