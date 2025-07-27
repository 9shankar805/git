import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Smartphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationStatus {
  permission: NotificationPermission;
  serviceWorkerRegistered: boolean;
  pushManagerSupported: boolean;
  subscribed: boolean;
  vapidKeyAvailable: boolean;
}

export default function PushNotificationTest() {
  const [status, setStatus] = useState<NotificationStatus>({
    permission: 'default',
    serviceWorkerRegistered: false,
    pushManagerSupported: false,
    subscribed: false,
    vapidKeyAvailable: false
  });
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const permission = Notification.permission;
      const serviceWorkerRegistered = 'serviceWorker' in navigator;
      const pushManagerSupported = 'PushManager' in window;
      
      let subscribed = false;
      let vapidKeyAvailable = false;
      
      if (serviceWorkerRegistered) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const existingSubscription = await registration.pushManager.getSubscription();
          subscribed = !!existingSubscription;
          setSubscription(existingSubscription);
        } catch (error) {
          console.log('Service worker not ready yet');
        }
      }

      // Check VAPID key availability
      try {
        const response = await fetch('/api/notifications/vapid-public-key');
        vapidKeyAvailable = response.ok;
      } catch (error) {
        console.error('Failed to check VAPID key:', error);
      }

      setStatus({
        permission,
        serviceWorkerRegistered,
        pushManagerSupported,
        subscribed,
        vapidKeyAvailable
      });
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const requestPermission = async () => {
    try {
      setLoading(true);
      const permission = await Notification.requestPermission();
      setStatus(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast({
          title: "Permission Granted",
          description: "You can now receive push notifications",
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Push notifications are blocked",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPush = async () => {
    try {
      setLoading(true);
      
      if (status.permission !== 'granted') {
        await requestPermission();
        return;
      }

      // Get VAPID public key
      const vapidResponse = await fetch('/api/notifications/vapid-public-key');
      if (!vapidResponse.ok) {
        throw new Error('VAPID public key not available');
      }
      
      const { publicKey } = await vapidResponse.json();
      console.log('VAPID Public Key:', publicKey);

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push notifications
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      console.log('Push subscription:', pushSubscription);
      setSubscription(pushSubscription);

      // Send subscription to server (using a test user ID)
      const subscribeResponse = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1, // Test user ID
          subscription: pushSubscription,
        }),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to register push subscription');
      }

      setStatus(prev => ({ ...prev, subscribed: true }));
      
      toast({
        title: "Subscribed Successfully",
        description: "You're now subscribed to push notifications",
      });

    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription Failed",
        description: error instanceof Error ? error.message : "Failed to subscribe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setLoading(true);
      
      if (subscription) {
        await subscription.unsubscribe();
        setSubscription(null);
        setStatus(prev => ({ ...prev, subscribed: false }));
        
        toast({
          title: "Unsubscribed",
          description: "You won't receive push notifications anymore",
        });
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: "Error",
        description: "Failed to unsubscribe",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 1,
          title: 'Test Notification from Siraha Bazaar',
          body: 'This is a test push notification to verify your mobile notifications are working!',
          data: {
            orderId: 12345,
            status: 'test',
            timestamp: Date.now()
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      toast({
        title: "Test Notification Sent",
        description: "Check your device's notification center",
      });

    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Failed to Send",
        description: error instanceof Error ? error.message : "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getPermissionBadge = (permission: NotificationPermission) => {
    const variants = {
      granted: { variant: "default" as const, text: "Granted", className: "bg-green-100 text-green-800" },
      denied: { variant: "destructive" as const, text: "Denied", className: "bg-red-100 text-red-800" },
      default: { variant: "secondary" as const, text: "Not Requested", className: "bg-gray-100 text-gray-800" }
    };
    
    const config = variants[permission];
    return <Badge className={config.className}>{config.text}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Push Notification Test</h1>
        <p className="text-gray-600">Test PWA push notifications without Firebase</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Check if your device supports push notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Service Worker Support</span>
              {getStatusIcon(status.serviceWorkerRegistered)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Push Manager Support</span>
              {getStatusIcon(status.pushManagerSupported)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>VAPID Key Available</span>
              {getStatusIcon(status.vapidKeyAvailable)}
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span>Currently Subscribed</span>
              {getStatusIcon(status.subscribed)}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <span>Notification Permission</span>
            {getPermissionBadge(status.permission)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Controls
          </CardTitle>
          <CardDescription>
            Manage your push notification subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {status.permission !== 'granted' && (
              <Button 
                onClick={requestPermission} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Request Permission
              </Button>
            )}
            
            {status.permission === 'granted' && !status.subscribed && (
              <Button 
                onClick={subscribeToPush} 
                disabled={loading || !status.vapidKeyAvailable}
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                Subscribe to Notifications
              </Button>
            )}
            
            {status.subscribed && (
              <Button 
                onClick={unsubscribeFromPush} 
                disabled={loading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <BellOff className="h-4 w-4" />
                Unsubscribe
              </Button>
            )}
            
            {status.subscribed && (
              <Button 
                onClick={sendTestNotification} 
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Send Test Notification
              </Button>
            )}
          </div>

          {!status.vapidKeyAvailable && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">VAPID Configuration Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    VAPID keys need to be configured in environment variables for push notifications to work.
                  </p>
                </div>
              </div>
            </div>
          )}

          {subscription && (
            <div className="p-4 bg-gray-50 border rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Subscription Details</h4>
              <div className="text-xs text-gray-600 break-all">
                <strong>Endpoint:</strong> {subscription.endpoint}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}