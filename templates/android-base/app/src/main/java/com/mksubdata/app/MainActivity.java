package com.mksubdata.app;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import android.content.pm.PackageInfo;
import androidx.webkit.WebViewCompat;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final String TAG = "AppLaunchLog";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            Log.i(TAG, "Initializing minimal production APK runtime entrypoint...");

            // --- DIAGNOSTIC LOGGING ---
            Log.i(TAG, "[Biometric Diagnostic] Android API level: " + Build.VERSION.SDK_INT);
            
            try {
                PackageInfo webViewPackage = WebViewCompat.getCurrentWebViewPackage(this);
                if (webViewPackage != null) {
                    Log.i(TAG, "[Biometric Diagnostic] WebView version: " + webViewPackage.versionName);
                } else {
                    Log.i(TAG, "[Biometric Diagnostic] WebView package is null");
                }
            } catch (Exception e) {
                Log.e(TAG, "[Biometric Diagnostic] Error getting WebView version", e);
            }
            
            boolean hasWebAuthn = WebViewFeature.isFeatureSupported(WebViewFeature.WEB_AUTHENTICATION);
            Log.i(TAG, "[Biometric Diagnostic] WebAuthn support level (WebViewFeature.WEB_AUTHENTICATION): " + hasWebAuthn);

            webView = new WebView(this);
            setContentView(webView);

            WebSettings webSettings = webView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowFileAccess(true);
            
            if (hasWebAuthn) {
                Log.i(TAG, "[Biometric Diagnostic] Enabling WEB_AUTHENTICATION_SUPPORT_FOR_APP");
                WebSettingsCompat.setWebAuthenticationSupport(webSettings, WebSettingsCompat.WEB_AUTHENTICATION_SUPPORT_FOR_APP);
            } else {
                Log.i(TAG, "[Biometric Diagnostic] WebAuthn is NOT supported in this WebView version, skipping setup.");
            }
            
            // Safe fallback compilation handling for SDK version limits
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }

            // Minimal splash fallback or webview connection handlers
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    Log.e(TAG, "WebView load failure: " + description + " for URL: " + failingUrl);
                    super.onReceivedError(view, errorCode, description, failingUrl);
                }
            });
            
            // --- 9. REPLACE LOCALHOST URLS WITH PRODUCTION DOMAIN ---
            // URL will be injected here by the build script
            String appUrl = "https://mksubdata.com"; 
            Log.i(TAG, "Targeting production destination: " + appUrl);
            webView.loadUrl(appUrl);
        } catch (Exception e) {
            Log.e(TAG, "Critical error caught during startup UI construction: " + e.getMessage(), e);
        }
    }

    @Override
    public void onBackPressed() {
        try {
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
            } else {
                super.onBackPressed();
            }
        } catch (Exception e) {
            super.onBackPressed();
        }
    }
}
