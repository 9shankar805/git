// Modern Firebase Admin SDK for FCM HTTP v1 API
// Replaces deprecated server key authentication

import admin from 'firebase-admin';

export class FirebaseAdminV1Service {
  private static initialized = false;
  private static projectId = 'myweb-1c1f37b3'; // Your Firebase project ID

  static async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if already initialized
      if (admin.apps.length > 0) {
        console.log('✅ Firebase Admin already initialized');
        this.initialized = true;
        return true;
      }

      // Try to initialize with service account JSON file first (recommended)
      const serviceAccountPath = process.cwd() + '/firebase-service-account.json';
      const fs = await import('fs');
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.projectId
        });
        console.log('✅ Firebase Admin initialized with service account file');
        this.initialized = true;
        return true;
      }

      // Fallback: Try with environment variables
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      
      if (privateKey && clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: this.projectId,
            privateKey: privateKey,
            clientEmail: clientEmail,
          }),
          projectId: this.projectId
        });
        console.log('✅ Firebase Admin initialized with environment variables');
        this.initialized = true;
        return true;
      }

      // Last resort: Project ID only (limited functionality)
      admin.initializeApp({
        projectId: this.projectId
      });
      console.log('⚠️ Firebase Admin initialized with project ID only (limited functionality)');
      this.initialized = true;
      return false; // Return false to indicate limited functionality
      
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error);
      return false;
    }
  }

  static async sendNotification(
    token: string, 
    title: string, 
    body: string, 
    data?: any
  ): Promise<string | null> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('⚠️ Firebase Admin not properly configured - notification may not work');
      }

      const message = {
        notification: {
          title,
          body
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ) : undefined,
        token: token,
        android: {
          notification: {
            channelId: 'siraha_bazaar',
            icon: 'ic_notification',
            color: '#FF6B35',
            sound: 'default',
            priority: 'high' as const
          }
        },
        webpush: {
          notification: {
            icon: '/assets/icon2.png',
            badge: '/assets/icon2.png',
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Open App'
              }
            ]
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ FCM HTTP v1 notification sent successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ FCM HTTP v1 sending failed:', error);
      
      // Check if it's a credential error
      if (error.code === 'app/invalid-credential' || 
          error.message.includes('Credential implementation provided')) {
        console.log('📋 Need Firebase service account credentials for full functionality');
        return null;
      }
      
      // Check if it's a token error
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        console.log('❌ Invalid or expired FCM token');
        return null;
      }
      
      throw error;
    }
  }

  static async sendToMultipleTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: any
  ): Promise<{ success: number; failed: number }> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('⚠️ Firebase Admin not properly configured');
      }

      const message = {
        notification: {
          title,
          body
        },
        data: data ? Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ) : undefined,
        android: {
          notification: {
            channelId: 'siraha_bazaar',
            icon: 'ic_notification',
            color: '#FF6B35',
            sound: 'default',
            priority: 'high' as const
          }
        },
        webpush: {
          notification: {
            icon: '/assets/icon2.png',
            badge: '/assets/icon2.png',
            requireInteraction: true
          }
        }
      };

      const response = await admin.messaging().sendMulticast({
        ...message,
        tokens: tokens
      });

      console.log(`✅ FCM multicast: ${response.successCount} success, ${response.failureCount} failed`);
      
      return {
        success: response.successCount,
        failed: response.failureCount
      };
      
    } catch (error) {
      console.error('❌ FCM multicast failed:', error);
      return { success: 0, failed: tokens.length };
    }
  }

  static async sendOrderNotification(
    token: string,
    orderId: number,
    status: string
  ): Promise<boolean> {
    const statusMessages = {
      'placed': 'Your order has been placed successfully!',
      'confirmed': 'Your order has been confirmed by the store',
      'preparing': 'Your order is being prepared',
      'ready': 'Your order is ready for pickup',
      'picked_up': 'Your order has been picked up for delivery',
      'on_the_way': 'Your order is on the way!',
      'delivered': 'Your order has been delivered successfully!',
      'cancelled': 'Your order has been cancelled'
    };

    const title = `Order #${orderId} Update`;
    const body = statusMessages[status] || `Order status updated: ${status}`;
    
    const data = {
      type: 'order_update',
      orderId: orderId.toString(),
      status: status,
      url: `/orders/${orderId}`
    };

    const result = await this.sendNotification(token, title, body, data);
    return result !== null;
  }

  static async sendDeliveryAssignment(
    token: string,
    orderId: number,
    pickupAddress: string,
    deliveryAddress: string,
    earnings: number
  ): Promise<boolean> {
    const title = 'New Delivery Assignment';
    const body = `Earn Rs. ${earnings} - Pickup from ${pickupAddress}`;
    
    const data = {
      type: 'delivery_assignment',
      orderId: orderId.toString(),
      pickupAddress,
      deliveryAddress,
      earnings: earnings.toString(),
      url: `/delivery-partner`
    };

    const result = await this.sendNotification(token, title, body, data);
    return result !== null;
  }

  static getInitializationStatus(): { 
    initialized: boolean; 
    hasCredentials: boolean;
    projectId: string;
  } {
    const hasCredentials = !!(
      process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL
    ) || require('fs').existsSync(process.cwd() + '/firebase-service-account.json');
    
    return {
      initialized: this.initialized,
      hasCredentials,
      projectId: this.projectId
    };
  }
}

export default FirebaseAdminV1Service;