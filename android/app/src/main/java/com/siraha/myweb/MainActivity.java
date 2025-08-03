package com.siraha.myweb;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Handle deep link on app launch
        handleDeepLink(getIntent());
        
        // Configure WebView for in-app OAuth
        setupWebViewForOAuth();
        
        // Register any additional plugins here if needed
        // this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        //     add(YourPlugin.class);
        // }});
    }
    
    private void setupWebViewForOAuth() {
        // Configure WebView settings for OAuth
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings webSettings = webView.getSettings();
            
            // Enable JavaScript and DOM storage for OAuth
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setDatabaseEnabled(true);
            webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
            
            // Add JavaScript interface for Google Auth
            webView.addJavascriptInterface(new AndroidBridge(this), "AndroidBridge");
            
            // Set custom WebViewClient to handle OAuth redirects
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    String url = request.getUrl().toString();
                    Log.d(TAG, "WebView loading URL: " + url);
                    
                    // Handle Google OAuth URLs within WebView
                    if (url.contains("accounts.google.com") || 
                        url.contains("oauth2") || 
                        url.contains("googleapis.com")) {
                        // Load OAuth URLs in WebView instead of external browser
                        view.loadUrl(url);
                        return true;
                    }
                    
                    // Handle deep links
                    if (url.startsWith("siraha://") || 
                        url.contains("sirahabazaar.com")) {
                        handleDeepLink(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                        return true;
                    }
                    
                    return false;
                }
                
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.d(TAG, "Page finished loading: " + url);
                    
                    // Inject deep linking handler
                    String jsCode = "if (typeof window.handleDeepLink === 'undefined') {" +
                        "window.handleDeepLink = function(path) {" +
                        "console.log('Deep link received: ' + path);" +
                        "if (window.deepLinkingService && window.deepLinkingService.handleDeepLink) {" +
                        "window.deepLinkingService.handleDeepLink(window.location.origin + path, 'android');" +
                        "} else {" +
                        "window.location.href = path;" +
                        "}" +
                        "};" +
                        "}";
                    view.evaluateJavascript(jsCode, null);
                }
            });
        }
    }
    
    // Android Bridge class for JavaScript communication
    public class AndroidBridge {
        private Context context;
        
        public AndroidBridge(Context context) {
            this.context = context;
        }
        
        @JavascriptInterface
        public void setFirebaseToken(String token) {
            Log.d(TAG, "Firebase token received: " + token);
            // Store token in shared preferences or send to server
        }
        
        @JavascriptInterface
        public String getFirebaseToken() {
            // Return stored Firebase token
            return "";
        }
        
        @JavascriptInterface
        public void showToast(String message) {
            ((Activity) context).runOnUiThread(() -> {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
            });
        }
        
        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }
        
        @JavascriptInterface
        public void logMessage(String message) {
            Log.d(TAG, "Web log: " + message);
        }
        
        @JavascriptInterface
        public void shareContent(String url, String title, String text) {
            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("text/plain");
            shareIntent.putExtra(Intent.EXTRA_TEXT, url);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, title);
            context.startActivity(Intent.createChooser(shareIntent, "Share via"));
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }
    
    private void handleDeepLink(Intent intent) {
        String action = intent.getAction();
        Uri data = intent.getData();
        
        if (Intent.ACTION_VIEW.equals(action) && data != null) {
            Log.d(TAG, "Deep link received: " + data.toString());
            
            // Extract the path from the deep link
            String path = data.getPath();
            String query = data.getQuery();
            String fragment = data.getFragment();
            
            // Build the URL to load in WebView
            StringBuilder urlBuilder = new StringBuilder();
            
            if (path != null) {
                urlBuilder.append(path);
            }
            
            if (query != null) {
                urlBuilder.append("?").append(query);
            }
            
            if (fragment != null) {
                urlBuilder.append("#").append(fragment);
            }
            
            String deepLinkPath = urlBuilder.toString();
            
            // Inject JavaScript to handle the deep link
            if (bridge != null && bridge.getWebView() != null) {
                String jsCode = String.format(
                    "if (window.handleDeepLink) { window.handleDeepLink('%s'); } else { window.location.href = '%s'; }",
                    deepLinkPath.replace("'", "\\'"),
                    deepLinkPath.replace("'", "\\'")
                );
                
                bridge.getWebView().post(() -> {
                    bridge.getWebView().evaluateJavascript(jsCode, null);
                });
            }
        }
    }
}