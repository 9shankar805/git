// Firebase Cloud Messaging (FCM) Push Notification Service
// Complete implementation with VAPID keys and service worker

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDjHQMcQjrpOdBn7DtB2xY7YFaE9ExAmpL",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "myweb-4cf30.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "myweb-4cf30",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "myweb-4cf30.appspot.com", 
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "397726322234",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:397726322234:web:fb62c9b3b2d4c9e3d4d3f3"
};

// VAPID key from Firebase Console
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "BLOTwE3i1oHIZpFN5BqF9SiEPQBUXk7sKJFa1XhkN2pQm1xV5z5LXxE3K8Q7m1pHdZ5YhT3nX2pQK7vE1gHsF9R";

export class FirebaseNotificationService {
  private static app: any = null;
  private static messaging: any = null;
  private static initialized = false;
  private static currentToken: string | null = null;

  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
        return false;
      }

      // Initialize Firebase app
      this.app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(this.app);

      // Register service worker
      await this.registerServiceWorker();

      this.initialized = true;
      console.log('✅ Firebase Cloud Messaging initialized');
      return true;
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
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

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        return true;
      } else {
        console.log('❌ Notification permission denied');
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

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
      });

      if (token) {
        this.currentToken = token;
        console.log('✅ FCM Device Token:', token);
        return token;
      } else {
        console.log('No registration token available');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
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

      const response = await fetch('/api/fcm/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title,
          body,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  static showLocalNotification(title: string, body: string, icon?: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/icon-72x72.png',
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
              const { notification } = payload;
              if (notification) {
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