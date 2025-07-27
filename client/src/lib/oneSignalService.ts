// OneSignal Push Notification Service
// Much simpler alternative to VAPID keys

export class OneSignalService {
  private static appId: string = import.meta.env.VITE_ONESIGNAL_APP_ID || '6ae02b1b-ee75-4129-8f89-e481284a7b85';
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;

    try {
      // Load OneSignal SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.OneSignal = window.OneSignal || [];
        window.OneSignal.push(function() {
          window.OneSignal.init({
            appId: OneSignalService.appId,
            safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || 'web.onesignal.auto.641afdf7-f4bf-4e2a-9c3a-de381580c8ca',
            notifyButton: {
              enable: true,
              text: {
                'message.prenotify': 'Click to subscribe to notifications',
                'message.action.subscribed': "Thanks! You'll receive notifications for new orders, deliveries, and updates.",
                'message.action.resubscribed': "You're subscribed to notifications",
                'message.action.unsubscribed': "You won't receive notifications anymore",
                'dialog.main.title': 'Manage Notifications',
                'dialog.main.button.subscribe': 'SUBSCRIBE',
                'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                'dialog.blocked.title': 'Unblock Notifications',
                'dialog.blocked.message': "Follow these instructions to allow notifications:"
              },
              colors: {
                'circle.background': '#FF6B35',
                'circle.foreground': 'white',
                'badge.background': '#FF6B35',
                'badge.foreground': 'white',
                'badge.bordercolor': '#FF6B35',
                'pulse.color': '#FF6B35'
              },
              position: 'bottom-right',
              offset: {
                bottom: '20px',
                right: '20px'
              },
              size: 'medium'
            },
            welcomeNotification: {
              title: "Siraha Bazaar",
              message: "Thanks for subscribing! You'll get notified about orders, deliveries, and special offers.",
              url: window.location.origin
            },
            allowLocalhostAsSecureOrigin: true, // For development
          });
        });
      };

      this.initialized = true;
      console.log('✅ OneSignal initialized');
    } catch (error) {
      console.error('❌ OneSignal initialization failed:', error);
    }
  }

  static async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      window.OneSignal.push(function() {
        window.OneSignal.showNativePrompt();
        window.OneSignal.on('subscriptionChange', function(isSubscribed) {
          resolve(isSubscribed);
        });
      });
    });
  }

  static async sendNotification(userId: string, message: string, title: string = 'Siraha Bazaar') {
    try {
      // Send via your backend to OneSignal REST API
      const response = await fetch('/api/onesignal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          message,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send OneSignal notification:', error);
      return false;
    }
  }

  static async getUserId(): Promise<string | null> {
    return new Promise((resolve) => {
      window.OneSignal.push(function() {
        window.OneSignal.getUserId(function(userId) {
          resolve(userId);
        });
      });
    });
  }
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    OneSignal: any;
  }
}