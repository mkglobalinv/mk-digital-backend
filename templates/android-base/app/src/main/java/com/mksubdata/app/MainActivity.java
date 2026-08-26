package com.mksubdata.app;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import android.content.pm.PackageInfo;
import androidx.webkit.WebViewCompat;

import java.util.concurrent.Executor;

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

            // --- NATIVE BIOMETRIC BRIDGE ---
            // Exposes window.AndroidBiometric to the WebView's JavaScript. The web app
            // (mk-vtu-frontend/src/services/biometricService.js) already prefers this
            // bridge over the WebAuthn/WebView fallback above when it's present, and
            // falls back to that WebAuthn path automatically when it's absent -- so this
            // addition is purely additive and does not remove the existing fallback.
            Log.i(TAG, "[Biometric Diagnostic] Registering native AndroidBiometric JS bridge");
            webView.addJavascriptInterface(new BiometricBridge(), "AndroidBiometric");

            // Safe fallback compilation handling for SDK version limits
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
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

    /**
     * Sends the result of a native biometric attempt back into the WebView by invoking
     * window.onBiometricResult(callbackId, success, message) -- the exact callback contract
     * biometricService.js's authenticateBiometric() already sets up before calling
     * window.AndroidBiometric.authenticate(callbackId).
     */
    private void sendBiometricResult(final String callbackId, final boolean success, final String message) {
        if (webView == null) return;
        final String safeCallbackId = callbackId == null ? "" : callbackId.replace("\\", "\\\\").replace("'", "\\'");
        final String safeMessage = (message == null ? "" : message).replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
        final String js = "(function(){ if (window.onBiometricResult) { window.onBiometricResult('" + safeCallbackId + "', " + success + ", '" + safeMessage + "'); } })();";
        webView.post(new Runnable() {
            @Override
            public void run() {
                webView.evaluateJavascript(js, null);
            }
        });
    }

    /**
     * Shows the native Android BiometricPrompt (fingerprint/face, backed by the platform's
     * strong-box/Keystore-verified authenticators) and reports the outcome back to the
     * WebView. Must run on the UI thread -- JavascriptInterface methods are invoked on a
     * background thread by the WebView.
     */
    private void showBiometricPrompt(final String callbackId) {
        if (!(this instanceof androidx.fragment.app.FragmentActivity)) {
            // AppCompatActivity already extends FragmentActivity, so this should never trip;
            // guarding defensively rather than crashing if that ever changes.
            Log.e(TAG, "[Biometric Diagnostic] Activity is not a FragmentActivity, cannot show BiometricPrompt");
            sendBiometricResult(callbackId, false, "Biometric prompt unavailable on this screen");
            return;
        }

        Executor executor = ContextCompat.getMainExecutor(this);
        BiometricPrompt biometricPrompt = new BiometricPrompt(this, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                Log.i(TAG, "[Biometric Diagnostic] Native BiometricPrompt SUCCEEDED (callbackId=" + callbackId + ")");
                sendBiometricResult(callbackId, true, "");
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                // Distinguishable from a WebAuthn/WebView failure: this is always a genuine
                // native BiometricPrompt outcome (user cancel, lockout, hardware error, etc.),
                // never a browser/JS-side WebAuthn error.
                Log.w(TAG, "[Biometric Diagnostic] Native BiometricPrompt ERROR code=" + errorCode + " message=" + errString + " (callbackId=" + callbackId + ")");
                sendBiometricResult(callbackId, false, String.valueOf(errString));
            }

            @Override
            public void onAuthenticationFailed() {
                super.onAuthenticationFailed();
                // A single unrecognized fingerprint/face attempt -- not terminal. The system
                // prompt stays open and lets the user retry; only onAuthenticationError and
                // onAuthenticationSucceeded end the attempt and report back to JS.
                Log.w(TAG, "[Biometric Diagnostic] Native BiometricPrompt attempt not recognized, awaiting retry (callbackId=" + callbackId + ")");
            }
        });

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Verify your identity")
                .setSubtitle("Use your fingerprint to continue")
                .setNegativeButtonText("Cancel")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK)
                .build();

        try {
            biometricPrompt.authenticate(promptInfo);
        } catch (Exception e) {
            Log.e(TAG, "[Biometric Diagnostic] Failed to launch native BiometricPrompt", e);
            sendBiometricResult(callbackId, false, "Could not start biometric prompt");
        }
    }

    /**
     * JS bridge exposed as window.AndroidBiometric. Method names/signatures match what
     * mk-vtu-frontend/src/services/biometricService.js already expects:
     *  - isBiometricAvailable(): boolean, called synchronously.
     *  - authenticate(callbackId): fires the native prompt; result comes back async via
     *    window.onBiometricResult(callbackId, success, message).
     */
    private class BiometricBridge {
        @JavascriptInterface
        public boolean isBiometricAvailable() {
            BiometricManager biometricManager = BiometricManager.from(MainActivity.this);
            int result = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.BIOMETRIC_WEAK);
            boolean available = result == BiometricManager.BIOMETRIC_SUCCESS;

            // Distinguishable diagnostics for each non-available case (no hardware, hardware
            // temporarily unavailable, no fingerprint/face enrolled) rather than a single
            // opaque "unavailable" -- these are graceful-degradation cases, not errors.
            switch (result) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    Log.i(TAG, "[Biometric Diagnostic] Native canAuthenticate(): available");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                    Log.i(TAG, "[Biometric Diagnostic] Native canAuthenticate(): no biometric hardware on this device");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    Log.i(TAG, "[Biometric Diagnostic] Native canAuthenticate(): biometric hardware currently unavailable");
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    Log.i(TAG, "[Biometric Diagnostic] Native canAuthenticate(): no fingerprint/face enrolled on this device");
                    break;
                default:
                    Log.i(TAG, "[Biometric Diagnostic] Native canAuthenticate(): unavailable (code=" + result + ")");
                    break;
            }
            return available;
        }

        @JavascriptInterface
        public void authenticate(final String callbackId) {
            Log.i(TAG, "[Biometric Diagnostic] Native authenticate() requested (callbackId=" + callbackId + ")");
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    showBiometricPrompt(callbackId);
                }
            });
        }
    }
}
