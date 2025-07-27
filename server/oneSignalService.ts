// OneSignal Server-side Service
import * as OneSignal from 'onesignal-node';

export class OneSignalServerService {
  private static client: any;
  private static appId: string;
  private static apiKey: string;

  static initialize() {
    this.appId = process.env.ONESIGNAL_APP_ID || '6ae02b1b-ee75-4129-8f89-e481284a7b85';
    this.apiKey = process.env.ONESIGNAL_API_KEY || '';

    if (!this.appId || !this.apiKey) {
      console.warn('OneSignal credentials not configured. Push notifications will not work.');
      return;
    }

    try {
      this.client = new OneSignal.Client(this.appId, this.apiKey);
      console.log('✅ OneSignal server service initialized');
    } catch (error) {
      console.error('OneSignal initialization failed:', error);
    }
  }

  static isConfigured(): boolean {
    return !!(this.appId && this.apiKey && this.client);
  }

  // Send notification to specific user
  static async sendToUser(userId: string, title: string, message: string, data?: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('OneSignal not configured');
      return false;
    }

    try {
      const notification = {
        contents: { en: message },
        headings: { en: title },
        include_external_user_ids: [userId.toString()],
        data: data || {},
        web_url: process.env.FRONTEND_URL || 'https://sirahabazaar.com',
        chrome_web_icon: '/icon-192x192.png',
        firefox_icon: '/icon-192x192.png',
        chrome_web_badge: '/icon-72x72.png'
      };

      const response = await this.client.createNotification(notification);
      console.log('✅ OneSignal notification sent:', response.body.id);
      return true;
    } catch (error) {
      console.error('OneSignal send failed:', error);
      return false;
    }
  }

  // Send notification to all users
  static async sendToAll(title: string, message: string, data?: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('OneSignal not configured');
      return false;
    }

    try {
      const notification = {
        contents: { en: message },
        headings: { en: title },
        included_segments: ['Subscribed Users'],
        data: data || {},
        web_url: process.env.FRONTEND_URL || 'https://sirahabazaar.com',
        chrome_web_icon: '/icon-192x192.png',
        firefox_icon: '/icon-192x192.png',
        chrome_web_badge: '/icon-72x72.png'
      };

      const response = await this.client.createNotification(notification);
      console.log('✅ OneSignal broadcast sent:', response.body.id);
      return true;
    } catch (error) {
      console.error('OneSignal broadcast failed:', error);
      return false;
    }
  }

  // Send notification to delivery partners
  static async sendToDeliveryPartners(title: string, message: string, data?: any): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('OneSignal not configured');
      return false;
    }

    try {
      const notification = {
        contents: { en: message },
        headings: { en: title },
        filters: [
          { field: 'tag', key: 'user_type', relation: '=', value: 'delivery_partner' }
        ],
        data: data || {},
        web_url: process.env.FRONTEND_URL || 'https://sirahabazaar.com',
        chrome_web_icon: '/icon-192x192.png',
        firefox_icon: '/icon-192x192.png',
        chrome_web_badge: '/icon-72x72.png'
      };

      const response = await this.client.createNotification(notification);
      console.log('✅ OneSignal delivery partner notification sent:', response.body.id);
      return true;
    } catch (error) {
      console.error('OneSignal delivery partner send failed:', error);
      return false;
    }
  }

  // Send order notification
  static async sendOrderNotification(userId: string, orderId: number, status: string): Promise<boolean> {
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

    const message = statusMessages[status as keyof typeof statusMessages] || `Your order status has been updated: ${status}`;
    const title = `Order #${orderId} Update`;

    return this.sendToUser(userId, title, message, {
      orderId,
      status,
      type: 'order_update',
      url: `/orders/${orderId}/tracking`
    });
  }

  // Send delivery assignment notification
  static async sendDeliveryAssignment(
    deliveryPartnerId: string, 
    orderId: number, 
    pickupAddress: string, 
    deliveryAddress: string,
    earnings: number
  ): Promise<boolean> {
    const title = '🚛 New Delivery Available';
    const message = `Pickup from ${pickupAddress}. Earn ₹${earnings}`;

    return this.sendToUser(deliveryPartnerId, title, message, {
      orderId,
      pickupAddress,
      deliveryAddress,
      earnings,
      type: 'delivery_assignment',
      url: '/delivery-partner/dashboard'
    });
  }
}

// Initialize on module load
OneSignalServerService.initialize();