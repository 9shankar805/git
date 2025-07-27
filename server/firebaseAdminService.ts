// Firebase Admin SDK for server-side push notifications
import * as admin from 'firebase-admin';

export class FirebaseAdminService {
  private static initialized = false;

  static initialize(): boolean {
    if (this.initialized) return true;

    try {
      // Try to initialize with service account (production)
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (serviceAccount) {
        const serviceAccountKey = JSON.parse(serviceAccount);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountKey),
          projectId: process.env.FIREBASE_PROJECT_ID || 'myweb-4cf30'
        });
        console.log('✅ Firebase Admin initialized with service account');
      } else {
        // Fallback: Initialize with environment variables
        const config = {
          projectId: process.env.FIREBASE_PROJECT_ID || 'myweb-4cf30',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

        if (config.clientEmail && config.privateKey) {
          admin.initializeApp({
            credential: admin.credential.cert(config),
            projectId: config.projectId
          });
          console.log('✅ Firebase Admin initialized with environment variables');
        } else {
          console.warn('⚠️ Firebase Admin not configured - push notifications will not work');
          return false;
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error);
      return false;
    }
  }

  static isConfigured(): boolean {
    return this.initialized && admin.apps.length > 0;
  }

  // Send notification to specific device token
  static async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Firebase Admin not configured');
      return false;
    }

    try {
      const message = {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
        },
        data: data || {},
        token,
        webpush: {
          headers: {
            'TTL': '86400', // 24 hours
          },
          notification: {
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Open App',
                icon: '/icon-72x72.png'
              }
            ]
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM notification sent successfully:', response);
      return true;
    } catch (error) {
      console.error('❌ FCM send failed:', error);
      return false;
    }
  }

  // Send notification to multiple tokens
  static async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: number; failed: number }> {
    if (!this.isConfigured()) {
      console.warn('Firebase Admin not configured');
      return { success: 0, failed: tokens.length };
    }

    try {
      const message = {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
        },
        data: data || {},
        tokens,
        webpush: {
          headers: {
            'TTL': '86400',
          },
          notification: {
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            vibrate: [200, 100, 200],
            requireInteraction: true,
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ FCM multicast sent: ${response.successCount} success, ${response.failureCount} failed`);
      
      return {
        success: response.successCount,
        failed: response.failureCount
      };
    } catch (error) {
      console.error('❌ FCM multicast send failed:', error);
      return { success: 0, failed: tokens.length };
    }
  }

  // Send order notification
  static async sendOrderNotification(
    token: string,
    orderId: number,
    status: string
  ): Promise<boolean> {
    const statusMessages = {
      'placed': 'Your order has been placed successfully!',
      'confirmed': 'Your order has been confirmed by the store',
      'preparing': 'Your order is being prepared',
      'ready_for_pickup': 'Your order is ready for pickup',
      'assigned': 'A delivery partner has been assigned to your order',
      'picked_up': 'Your order has been picked up for delivery',
      'out_for_delivery': 'Your order is out for delivery',
      'delivered': 'Your order has been delivered successfully!',
      'cancelled': 'Your order has been cancelled'
    };

    const body = statusMessages[status as keyof typeof statusMessages] || 
                 `Your order status has been updated: ${status}`;
    const title = `Order #${orderId} Update`;

    return this.sendToToken(token, title, body, {
      orderId: orderId.toString(),
      status,
      type: 'order_update',
      url: `/orders/${orderId}/tracking`
    });
  }

  // Send delivery assignment notification
  static async sendDeliveryAssignment(
    token: string,
    orderId: number,
    pickupAddress: string,
    deliveryAddress: string,
    earnings: number
  ): Promise<boolean> {
    const title = '🚛 New Delivery Available';
    const body = `Pickup from ${pickupAddress}. Earn ₹${earnings}`;

    return this.sendToToken(token, title, body, {
      orderId: orderId.toString(),
      pickupAddress,
      deliveryAddress,
      earnings: earnings.toString(),
      type: 'delivery_assignment',
      url: '/delivery-partner/dashboard'
    });
  }

  // Test notification
  static async sendTestNotification(token: string): Promise<boolean> {
    return this.sendToToken(
      token,
      'Test from Siraha Bazaar',
      'Firebase Cloud Messaging is working correctly!',
      {
        type: 'test',
        timestamp: new Date().toISOString()
      }
    );
  }
}

// Initialize on module load
FirebaseAdminService.initialize();

export default FirebaseAdminService;