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
        
        // Register any additional plugins here if needed
        // this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
        //     add(YourPlugin.class);
        // }});
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