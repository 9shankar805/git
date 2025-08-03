
// OneSignal Server Service
// Handles OneSignal REST API calls for push notifications

interface OneSignalNotification {
  app_id: string;
  include_player_ids?: string[];
  include_external_user_ids?: string[];
  headings: { [key: string]: string };
  contents: { [key: string]: string };
  data?: any;
  url?: string;
  icon?: string;
  large_icon?: string;
  small_icon?: string;
  android_channel_id?: string;
  priority?: number;
}

export class OneSignalService {
  private static readonly APP_ID = process.env.ONESIGNAL_APP_ID || 'your-onesignal-app-id';
  private static readonly REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || 'your-rest-api-key';
  private static readonly API_URL = 'https://onesignal.com/api/v1/notifications';

  static async sendNotification(notification: Partial<OneSignalNotification>): Promise<boolean> {
    try {
      const payload: OneSignalNotification = {
        app_id: this.APP_ID,
        headings: { en: 'Siraha Bazaar' },
        contents: { en: 'You have a new notification' },
        android_channel_id: 'siraha_bazaar',
        priority: 10,
        ...notification
      };

      console.log('📤 Sending OneSignal notification:', payload);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.REST_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ OneSignal notification sent successfully:', result);
        return true;
      } else {
        console.error('❌ OneSignal notification failed:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ OneSignal service error:', error);
      return false;
    }
  }

  static async sendToPlayer(playerId: string, title: string, message: string, data?: any): Promise<boolean> {
    return this.sendNotification({
      include_player_ids: [playerId],
      headings: { en: title },
      contents: { en: message },
      data
    });
  }

  static async sendToUser(userId: string, title: string, message: string, data?: any): Promise<boolean> {
    return this.sendNotification({
      include_external_user_ids: [userId],
      headings: { en: title },
      contents: { en: message },
      data
    });
  }

  static async sendOrderNotification(playerId: string, orderId: number, customerName: string, amount: number): Promise<boolean> {
    return this.sendNotification({
      include_player_ids: [playerId],
      headings: { en: 'New Order Received! 🛍️' },
      contents: { en: `Order #${orderId} from ${customerName} - ₹${amount}` },
      data: {
        type: 'order_update',
        orderId,
        customerName,
        amount
      },
      url: `/order-tracking?orderId=${orderId}`
    });
  }

  static async sendDeliveryNotification(playerId: string, orderId: number, pickupAddress: string, deliveryAddress: string): Promise<boolean> {
    return this.sendNotification({
      include_player_ids: [playerId],
      headings: { en: 'New Delivery Assignment! 🚚' },
      contents: { en: `Order #${orderId} - ${pickupAddress} to ${deliveryAddress}` },
      data: {
        type: 'delivery_assignment',
        orderId,
        pickupAddress,
        deliveryAddress
      },
      url: `/delivery-partner-dashboard?orderId=${orderId}`
    });
  }

  static async sendPromotionNotification(playerIds: string[], title: string, message: string): Promise<boolean> {
    return this.sendNotification({
      include_player_ids: playerIds,
      headings: { en: title },
      contents: { en: message },
      data: {
        type: 'promotion'
      },
      url: '/special-offers'
    });
  }
}

export default OneSignalService;
