import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.siraha.myweb',
  appName: 'Siraha Bazaar',
  webDir: 'client/public',
  plugins: {
    CapacitorSocialLogin: {
      providers: {
        google: {
          // Get these from Google Cloud Console
          clientId: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
          serverClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
          redirectUrl: "com.siraha.myweb://oauth/google"
        }
      }
    }
  }
};

export default config;
