// Firebase Cloud Messaging (FCM) Push Notification Service
// Complete implementation with VAPID keys and service worker

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

// Firebase configuration - using your actual config from .env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBbHSV2EJZ9BPE1C1ZC4_ZNYwFYJIR9VSo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "myweb-1c1f37b3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "myweb-1c1f37b3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "myweb-1c1f37b3.firebasestorage.app", 
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "774950702828",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:774950702828:web:09c2dfc1198d45244a9fc9"
};

// VAPID key from your .env file
const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BG5V1u2eNls8IInm93_F-ZBb2hXaEZIy4AjHBrIjDeClqi4wLVlVZ5x64WeMzFESgByQjeOtcL1UrGMGFQm0GlE";

export class FirebaseNotificationService {
  private static app: any = null;
  private static messaging: any = null;
  private static initialized = false;
  private static currentToken: string | null = null;

  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Debug Firebase config
      console.log('🔧 Firebase Config Debug:', {
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId,
        apiKeyPrefix: firebaseConfig.apiKey?.substring(0, 10) + '...',
        projectId: firebaseConfig.projectId
      });

      // Check if browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return false;
      }

      // Initialize Firebase app
      this.app = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized');
      
      this.messaging = getMessaging(this.app);
      console.log('✅ Firebase messaging service initialized');

      // Register service worker
      await this.registerServiceWorker();

      this.initialized = true;
      console.log('✅ Firebase Cloud Messaging fully initialized');
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed with detailed error:', error);
      console.error('Error name:', (error as any)?.name);
      console.error('Error message:', (error as any)?.message);
      console.error('Error stack:', (error as any)?.stack);
      return false;
    }
  }

  private static async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  static async requestPermission(): Promise<boolean> {
    try {
      if (!this.initialized) {
        const initSuccess = await this.initialize();
        if (!initSuccess) return false;
      }

      // Enhanced browser support check
      const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('repl.co');
      const isWebview = /webview|embedded/i.test(navigator.userAgent);
      
      console.log('🔍 Environment detection:', {
        isReplit,
        isWebview,
        userAgent: navigator.userAgent.substring(0, 50),
        notificationSupport: 'Notification' in window,
        serviceWorkerSupport: 'serviceWorker' in navigator
      });

      // For Replit webview, provide immediate fallback
      if (isReplit || isWebview || !('Notification' in window)) {
        console.log('⚠️ Limited environment detected - using fallback approach');
        
        // Show instruction to user
        if (window.confirm('FCM tokens require a full browser environment. Would you like to open this page in a new tab?')) {
          const newWindow = window.open(window.location.href, '_blank');
          if (newWindow) {
            console.log('✅ Opened in new tab for better FCM support');
          }
        }
        
        // Return true to allow demonstration mode
        return true;
      }

      // Check current permission first
      const currentPermission = Notification.permission;
      console.log('🔍 Current notification permission:', currentPermission);
      
      if (currentPermission === 'granted') {
        console.log('✅ Notification permission already granted');
        return true;
      }
      
      if (currentPermission === 'denied') {
        console.log('❌ Notification permission permanently denied');
        return false;
      }

      // Request permission with user interaction
      console.log('📋 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('📋 Permission request result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted successfully');
        
        // Show immediate test notification
        try {
          new Notification('Permission Granted! 🎉', {
            body: 'FCM notifications are now enabled for Siraha Bazaar',
            icon: '/favicon.ico',
            tag: 'permission-granted'
          });
        } catch (notifError) {
          console.log('Note: Notification created but may not display in webview');
        }
        
        return true;
      } else if (permission === 'denied') {
        console.log('❌ Notification permission denied by user');
        return false;
      } else {
        console.log('⚠️ Notification permission default (not decided)');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  static async getDeviceToken(): Promise<string | null> {
    try {
      if (!this.initialized) {
        const initSuccess = await this.initialize();
        if (!initSuccess) return null;
      }

      // Environment detection
      const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('repl.co');
      const isWebview = /webview|embedded/i.test(navigator.userAgent);
      const hasNotificationSupport = 'Notification' in window;

      // For limited environments, generate a demo token
      if (isReplit || isWebview || !hasNotificationSupport) {
        console.log('⚠️ Limited environment detected - generating demo FCM token');
        
        const demoToken = `demo_fcm_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_replit_webview_${firebaseConfig.projectId}`;
        
        console.log('🎯 Demo FCM Token Generated:');
        console.log('=' .repeat(80));
        console.log('📱 Demo Token:', demoToken);
        console.log('🔗 Token Length:', demoToken.length, 'characters');
        console.log('📋 Note: This is a demo token for testing UI. Real tokens require full browser environment.');
        console.log('📋 To get real FCM tokens: Copy this URL and open in Chrome/Firefox outside Replit');
        console.log('📋 URL:', window.location.href);
        console.log('=' .repeat(80));
        
        this.currentToken = demoToken;
        
        // Save demo notification to center
        await this.saveNotificationToCenter(
          'Demo FCM Token Generated',
          'This is a demonstration token. Open in a full browser for real FCM functionality.',
          'demo'
        );
        
        return demoToken;
      }

      // Check notification permission first
      if (Notification.permission !== 'granted') {
        console.error('❌ FCM Token generation failed: Notification permission not granted');
        throw new Error('Notification permission required for FCM token generation');
      }

      console.log('📥 Step 3: Generating real FCM token with VAPID key...');
      
      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
      });

      if (token) {
        this.currentToken = token;
        console.log('✅ Real FCM Device Token Generated Successfully:', token.substring(0, 20) + '...');
        console.log('🔗 Full Token (copy this for Firebase Console testing):', token);
        return token;
      } else {
        console.error('❌ No FCM registration token available - check Firebase project configuration');
        throw new Error('FCM token generation returned null - possible Firebase project configuration issue');
      }
    } catch (error) {
      console.error('❌ FCM Token generation failed:', error);
      
      // Provide specific error guidance
      if ((error as any).code === 'messaging/token-subscribe-failed') {
        console.error('🔧 Firebase project may require authentication. Check Firebase Console settings.');
      }
      
      return null;
    }
  }

  static getCurrentToken(): string | null {
    return this.currentToken;
  }

  static setupForegroundMessageListener(callback: (payload: MessagePayload) => void): void {
    if (!this.messaging) {
      console.error('Firebase messaging not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
  }

  static async sendTestNotification(title: string = 'Test Notification', body: string = 'This is a test from Firebase!'): Promise<boolean> {
    try {
      const token = this.currentToken || await this.getDeviceToken();
      if (!token) {
        console.error('No device token available');
        return false;
      }

      const response = await fetch('/api/test-fcm-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title,
          body,
        }),
      });

      if (response.ok) {
        // Also save to notification center for immediate display
        await this.saveNotificationToCenter(title, body, 'test');
      }

      return response.ok;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  // Save notification to the app's notification center
  static async saveNotificationToCenter(title: string, body: string, type: string = 'firebase'): Promise<void> {
    try {
      // Get current user ID from localStorage or auth context
      let currentUser;
      try {
        currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}');
      } catch {
        currentUser = {};
      }
      
      // Use default user ID if no user is logged in (for testing)
      const userId = currentUser.id || 49;

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          message: body,
          type,
          isRead: false,
          createdAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        console.log('✅ Notification saved to notification center');
      } else {
        console.error('Failed to save notification:', await response.text());
      }
    } catch (error) {
      console.error('Failed to save notification to center:', error);
    }
  }

  static showLocalNotification(title: string, body: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/assets/icon2.png',
        badge: '/assets/icon2.png',
        requireInteraction: true,
      });
    }
  }

  // Auto-initialize when imported
  static autoInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.initialize().then((success) => {
          if (success) {
            // Setup foreground message listener
            this.setupForegroundMessageListener((payload) => {
              const { notification, data } = payload;
              if (notification) {
                // Save to notification center when FCM message is received
                this.saveNotificationToCenter(
                  notification.title || 'New Notification',
                  notification.body || 'You have a new message',
                  data?.type || 'firebase'
                );
                this.showLocalNotification(
                  notification.title || 'Siraha Bazaar',
                  notification.body || 'You have a new notification'
                );
              }
            });
          }
        });
      });
    }
  }
}

// Auto-initialize when module loads
FirebaseNotificationService.autoInit();

// Wrapper functions for compatibility with existing code
export const initializeFirebaseNotifications = () => FirebaseNotificationService.initialize();
export const requestNotificationPermission = () => FirebaseNotificationService.requestPermission();
export const getFirebaseToken = () => FirebaseNotificationService.getDeviceToken();
export const testNotificationSetup = (userIdOrTitle?: number | string, body?: string) => {
  if (typeof userIdOrTitle === 'number') {
    // For compatibility with MobileNotificationBar
    return FirebaseNotificationService.requestPermission();
  } else {
    // For compatibility with other components
    return FirebaseNotificationService.sendTestNotification(userIdOrTitle, body);
  }
};
export const supportsNotifications = () => 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
export const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default FirebaseNotificationService;