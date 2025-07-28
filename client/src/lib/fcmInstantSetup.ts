// FCM Instant Setup - Automatically generates FCM token and sends test notification immediately
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

interface FCMInstantResult {
  success: boolean;
  token?: string;
  error?: string;
  notificationSent?: boolean;
}

export class FCMInstantSetup {
  private static app: any = null;
  private static messaging: any = null;
  private static token: string | null = null;

  // Firebase configuration - hardcoded for instant setup
  private static firebaseConfig = {
    apiKey: "AIzaSyBbHSV2EJZ9BPE1C1ZC4_ZNYwFYJIR9VSo",
    authDomain: "myweb-1c1f37b3.firebaseapp.com",
    projectId: "myweb-1c1f37b3",
    storageBucket: "myweb-1c1f37b3.firebasestorage.app",
    messagingSenderId: "774950702828",
    appId: "1:774950702828:web:09c2dfc1198d45244a9fc9"
  };

  // Working VAPID key for token generation
  private static vapidKey = "BBeY7MuZB7850MAibtxV4fJxcKYAF3oQxNBB60l1FzHK63IjkTSI9ZFDPW1hmHnKSJPckGFM5gu7JlaCGavnwqA";

  static async setupInstantFCM(): Promise<FCMInstantResult> {
    try {
      console.log('🚀 Starting instant FCM setup...');

      // Step 1: Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return {
          success: false,
          error: 'Browser does not support push notifications'
        };
      }

      // Step 2: Initialize Firebase
      if (!this.app) {
        this.app = initializeApp(this.firebaseConfig);
        this.messaging = getMessaging(this.app);
        console.log('✅ Firebase initialized');
      }

      // Step 3: Register service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service worker registered');

      // Step 4: Request permission immediately
      if (Notification.permission !== 'granted') {
        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          return {
            success: false,
            error: 'Notification permission denied'
          };
        }
        console.log('✅ Permission granted');
      }

      // Step 5: Generate FCM token immediately
      console.log('🔑 Generating FCM token...');
      const swRegistration = await navigator.serviceWorker.getRegistration();
      
      const token = await getToken(this.messaging, {
        vapidKey: this.vapidKey,
        serviceWorkerRegistration: swRegistration
      });

      if (!token) {
        return {
          success: false,
          error: 'Failed to generate FCM token'
        };
      }

      this.token = token;
      console.log('✅ FCM token generated:', token.substring(0, 20) + '...');

      // Step 6: Register token with server
      await this.registerTokenWithServer(token);

      // Step 7: Send immediate test notification
      const notificationSent = await this.sendImmediateNotification(token);

      // Step 8: Setup foreground message listener
      this.setupForegroundListener();

      return {
        success: true,
        token,
        notificationSent
      };

    } catch (error) {
      console.error('❌ FCM instant setup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static async registerTokenWithServer(token: string): Promise<void> {
    try {
      // Get user ID from localStorage if available
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : 1; // Default to user 1 for testing

      const response = await fetch('/api/device-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token,
          deviceType: 'web'
        }),
      });

      if (response.ok) {
        console.log('✅ FCM token registered with server');
      } else {
        console.warn('⚠️ Failed to register token with server');
      }
    } catch (error) {
      console.warn('⚠️ Token registration failed:', error);
    }
  }

  private static async sendImmediateNotification(token: string): Promise<boolean> {
    try {
      console.log('📤 Sending immediate test notification...');
      
      // Method 1: Via server API
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title: '🎉 FCM Setup Complete!',
          body: 'Your push notifications are now working! You will receive notifications instantly.',
          data: {
            type: 'setup_success',
            timestamp: new Date().toISOString(),
            action: 'fcm_ready'
          }
        }),
      });

      let serverNotificationSent = false;
      if (response.ok) {
        const result = await response.json();
        serverNotificationSent = result.success;
        console.log('✅ Server notification result:', result);
      }

      // Method 2: Browser notification as immediate feedback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('FCM Ready! 🚀', {
          body: 'Push notifications are now enabled. You will receive instant updates.',
          icon: '/favicon.ico',
          tag: 'fcm-setup-success',
          badge: '/favicon.ico',
          requireInteraction: true,
          actions: [
            { action: 'view', title: 'View Dashboard' },
            { action: 'close', title: 'Close' }
          ]
        });

        console.log('✅ Browser notification sent immediately');
        return true;
      }

      return serverNotificationSent;
    } catch (error) {
      console.error('❌ Failed to send immediate notification:', error);
      return false;
    }
  }

  private static setupForegroundListener(): void {
    onMessage(this.messaging, (payload) => {
      console.log('📱 Foreground message received:', payload);
      
      // Show notification even in foreground
      if (payload.notification) {
        new Notification(payload.notification.title || 'Siraha Bazaar', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/favicon.ico',
          tag: payload.data?.type || 'general',
          badge: '/favicon.ico',
          data: payload.data
        });
      }
    });
  }

  static getToken(): string | null {
    return this.token;
  }

  // Quick test function to verify everything is working
  static async testNotificationSystem(): Promise<boolean> {
    if (!this.token) {
      console.error('❌ No FCM token available for testing');
      return false;
    }

    try {
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.token,
          title: '🧪 FCM Test',
          body: 'Testing FCM notification system - this should appear instantly!',
          data: { type: 'system_test' }
        }),
      });

      const result = await response.json();
      console.log('🧪 Test notification result:', result);
      return result.success;
    } catch (error) {
      console.error('❌ Test notification failed:', error);
      return false;
    }
  }
}

// Auto-setup function that can be called immediately
export const setupFCMInstantly = async (): Promise<FCMInstantResult> => {
  return FCMInstantSetup.setupInstantFCM();
};

// Export for global access
(window as any).FCMInstantSetup = FCMInstantSetup;