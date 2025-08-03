
// OneSignal Push Notification Service for WebView
// Optimized for Android WebView integration

declare global {
  interface Window {
    OneSignal?: any;
    AndroidApp?: {
      showToast: (message: string) => void;
      registerOneSignalToken: (token: string, userId: number) => void;
      getDeviceInfo: () => string;
      logMessage: (message: string) => void;
    };
  }
}

export class OneSignalNotificationService {
  private static initialized = false;
  private static appId = "your-onesignal-app-id"; // Replace with your OneSignal App ID
  private static currentToken: string | null = null;

  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if we're in webview
      const isWebview = /webview|embedded/i.test(navigator.userAgent) || 
                       window.location.hostname.includes('replit.dev');

      console.log('🔔 Initializing OneSignal for webview:', isWebview);

      // Load OneSignal SDK
      await this.loadOneSignalSDK();

      // Initialize OneSignal
      if (window.OneSignal) {
        await window.OneSignal.init({
          appId: this.appId,
          allowLocalhostAsSecureOrigin: true,
          autoRegister: true,
          autoResubscribe: true,
          notifyButton: {
            enable: false // Disable default button for webview
          },
          welcomeNotification: {
            disable: true // Disable welcome notification in webview
          },
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  autoPrompt: false, // Manual prompt for webview
                  text: {
                    actionMessage: "We'd like to show you notifications for order updates and delivery status",
                    acceptButton: "Allow",
                    cancelButton: "No Thanks"
                  }
                }
              ]
            }
          }
        });

        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('✅ OneSignal initialized successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ OneSignal initialization failed:', error);
      return false;
    }
  }

  private static async loadOneSignalSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.OneSignal) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load OneSignal SDK'));
      document.head.appendChild(script);
    });
  }

  private static setupEventListeners(): void {
    if (!window.OneSignal) return;

    // Notification permission changed
    window.OneSignal.on('notificationPermissionChange', (permissionChange: any) => {
      console.log('🔔 Notification permission changed:', permissionChange);
      
      if (permissionChange.to === 'granted') {
        this.getSubscriptionId();
      }
    });

    // Subscription changed
    window.OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
      console.log('🔔 Subscription changed:', isSubscribed);
      
      if (isSubscribed) {
        this.getSubscriptionId();
      }
    });

    // Notification display
    window.OneSignal.on('notificationDisplay', (event: any) => {
      console.log('🔔 Notification displayed:', event);
      
      // Send to Android app if available
      if (window.AndroidApp) {
        window.AndroidApp.showToast('New notification received');
      }
    });

    // Notification click
    window.OneSignal.on('notificationClick', (event: any) => {
      console.log('🔔 Notification clicked:', event);
      
      // Handle notification action based on data
      this.handleNotificationClick(event.data);
    });
  }

  static async requestPermission(): Promise<boolean> {
    try {
      if (!this.initialized) {
        const initSuccess = await this.initialize();
        if (!initSuccess) return false;
      }

      if (!window.OneSignal) return false;

      // Check current permission
      const permission = await window.OneSignal.getNotificationPermission();
      console.log('🔔 Current permission:', permission);

      if (permission === 'granted') {
        await this.getSubscriptionId();
        return true;
      }

      if (permission === 'denied') {
        console.log('❌ Notification permission denied');
        return false;
      }

      // Show permission prompt
      await window.OneSignal.showSlidedownPrompt();
      
      // Wait for permission response
      const newPermission = await window.OneSignal.getNotificationPermission();
      
      if (newPermission === 'granted') {
        await this.getSubscriptionId();
        console.log('✅ Notification permission granted');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }

  static async getSubscriptionId(): Promise<string | null> {
    try {
      if (!window.OneSignal) return null;

      const subscriptionId = await window.OneSignal.getUserId();
      
      if (subscriptionId) {
        this.currentToken = subscriptionId;
        console.log('🔔 OneSignal Subscription ID:', subscriptionId);
        
        // Send to Android app if available
        if (window.AndroidApp) {
          window.AndroidApp.logMessage(`OneSignal Token: ${subscriptionId}`);
        }
        
        // Save to server
        await this.saveTokenToServer(subscriptionId);
        
        return subscriptionId;
      }

      return null;
    } catch (error) {
      console.error('❌ Error getting subscription ID:', error);
      return null;
    }
  }

  private static async saveTokenToServer(token: string): Promise<void> {
    try {
      // Get current user
      let currentUser;
      try {
        currentUser = JSON.parse(localStorage.getItem('auth-user') || '{}');
      } catch {
        currentUser = {};
      }
      
      const userId = currentUser.id || 49; // Default user for testing

      const response = await fetch('/api/onesignal-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          token,
          deviceType: 'webview',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        console.log('✅ OneSignal token saved to server');
      } else {
        console.error('❌ Failed to save token:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error saving token to server:', error);
    }
  }

  private static handleNotificationClick(data: any): void {
    if (!data) return;

    console.log('🔔 Handling notification click:', data);

    // Handle different notification types
    switch (data.type) {
      case 'order_update':
        // Navigate to order details
        if (data.orderId) {
          window.location.href = `/order-tracking?orderId=${data.orderId}`;
        }
        break;
      case 'delivery_assignment':
        // Navigate to delivery dashboard
        if (data.orderId) {
          window.location.href = `/delivery-partner-dashboard?orderId=${data.orderId}`;
        }
        break;
      case 'promotion':
        // Navigate to promotions
        window.location.href = '/special-offers';
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  static async sendTestNotification(title: string = 'Test Notification', message: string = 'This is a test from OneSignal!'): Promise<boolean> {
    try {
      const token = this.currentToken || await this.getSubscriptionId();
      if (!token) {
        console.error('No subscription ID available');
        return false;
      }

      const response = await fetch('/api/test-onesignal-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title,
          message,
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      return false;
    }
  }

  static getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Auto-initialize when imported
  static autoInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.initialize();
      });
    }
  }
}

// Auto-initialize
OneSignalNotificationService.autoInit();

// Export convenience functions
export const initializeOneSignal = () => OneSignalNotificationService.initialize();
export const requestOneSignalPermission = () => OneSignalNotificationService.requestPermission();
export const getOneSignalToken = () => OneSignalNotificationService.getSubscriptionId();
export const sendOneSignalTest = (title?: string, message?: string) => 
  OneSignalNotificationService.sendTestNotification(title, message);

export default OneSignalNotificationService;
