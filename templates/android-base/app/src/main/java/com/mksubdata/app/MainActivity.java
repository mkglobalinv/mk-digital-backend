package com.mksubdata.app;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private static final String TAG = "AppLaunchLog";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            Log.i(TAG, "Initializing minimal production APK runtime entrypoint...");
            webView = new WebView(this);
            setContentView(webView);

            WebSettings webSettings = webView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setAllowFileAccess(true);
            
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
