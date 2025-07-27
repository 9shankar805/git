import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { OneSignalService } from "@/lib/oneSignalService";
import { Bell, CheckCircle, AlertCircle, Send, Users, User, Package, Truck } from "lucide-react";

export default function OneSignalTest() {
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("123");
  const [title, setTitle] = useState("Test Notification");
  const [message, setMessage] = useState("This is a test notification from Siraha Bazaar!");
  const [oneSignalUserId, setOneSignalUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check OneSignal configuration status
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/onesignal/status');
        const status = await response.json();
        setConfigStatus(status);
      } catch (error) {
        console.error('Failed to check OneSignal status:', error);
      }
    };

    checkConfig();
    
    // Try to get OneSignal user ID
    const getOneSignalId = async () => {
      try {
        const id = await OneSignalService.getUserId();
        setOneSignalUserId(id);
      } catch (error) {
        console.error('Failed to get OneSignal user ID:', error);
      }
    };

    setTimeout(getOneSignalId, 3000); // Wait for OneSignal to initialize
  }, []);

  const handleSendToUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onesignal/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, title, message }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Notification sent to user successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to send notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onesignal/send-to-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Broadcast notification sent successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to send broadcast');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send broadcast",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestOrderNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onesignal/send-order-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          orderId: 12345, 
          status: 'delivered' 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Order notification sent successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to send order notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send order notification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestDeliveryAssignment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/onesignal/send-delivery-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          deliveryPartnerId: userId,
          orderId: 12345,
          pickupAddress: "Siraha Electronics Hub, Siraha",
          deliveryAddress: "Customer Address, Lahan",
          earnings: 50
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: "Delivery assignment notification sent successfully",
        });
      } else {
        throw new Error(result.message || 'Failed to send delivery assignment');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send delivery assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = await OneSignalService.requestPermission();
      if (granted) {
        toast({
          title: "Permission Granted!",
          description: "You can now receive push notifications",
        });
        
        // Get user ID after permission is granted
        setTimeout(async () => {
          const id = await OneSignalService.getUserId();
          setOneSignalUserId(id);
        }, 2000);
      } else {
        toast({
          title: "Permission Denied",
          description: "You won't receive push notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OneSignal Push Notifications</h1>
          <p className="text-gray-600">Test and configure push notifications for Siraha Bazaar</p>
        </div>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuration Status
            </CardTitle>
            <CardDescription>
              Check if OneSignal is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Overall Status:</span>
                  <Badge variant={configStatus.configured ? "default" : "destructive"}>
                    {configStatus.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>App ID:</span>
                  <Badge variant={configStatus.appId === 'Configured' ? "default" : "secondary"}>
                    {configStatus.appId}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Key:</span>
                  <Badge variant={configStatus.apiKey === 'Configured' ? "default" : "secondary"}>
                    {configStatus.apiKey}
                  </Badge>
                </div>
                
                {!configStatus.configured && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Setup Required</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          You need to set up OneSignal environment variables:
                        </p>
                        <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                          <li>ONESIGNAL_APP_ID</li>
                          <li>ONESIGNAL_API_KEY</li>
                          <li>VITE_ONESIGNAL_APP_ID</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                <span>Checking configuration...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Notification Permission
            </CardTitle>
            <CardDescription>
              Check and request notification permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Browser Permission:</span>
              <Badge variant={
                Notification.permission === 'granted' ? 'default' :
                Notification.permission === 'denied' ? 'destructive' : 'secondary'
              }>
                {Notification.permission}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>OneSignal User ID:</span>
              <Badge variant={oneSignalUserId ? 'default' : 'secondary'}>
                {oneSignalUserId ? `${oneSignalUserId.substring(0, 8)}...` : 'Not available'}
              </Badge>
            </div>

            {Notification.permission !== 'granted' && (
              <Button onClick={requestPermission} className="w-full">
                Request Notification Permission
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Test Notifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Send to Specific User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Send to User
              </CardTitle>
              <CardDescription>
                Send notification to a specific user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Notification message"
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleSendToUser}
                disabled={loading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to User
              </Button>
            </CardContent>
          </Card>

          {/* Send to All Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Broadcast to All
              </CardTitle>
              <CardDescription>
                Send notification to all subscribed users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                This will send the same title and message to all users who have subscribed to notifications.
              </div>
              <Button 
                onClick={handleSendToAll}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <Users className="h-4 w-4 mr-2" />
                Send to All Users
              </Button>
            </CardContent>
          </Card>

          {/* Order Notification Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Notification
              </CardTitle>
              <CardDescription>
                Test order status notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Sends a simulated order delivery notification to the specified user.
              </div>
              <Button 
                onClick={handleTestOrderNotification}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <Package className="h-4 w-4 mr-2" />
                Test Order Delivered
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Assignment Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Assignment
              </CardTitle>
              <CardDescription>
                Test delivery partner notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Sends a simulated delivery assignment notification to the specified delivery partner.
              </div>
              <Button 
                onClick={handleTestDeliveryAssignment}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                <Truck className="h-4 w-4 mr-2" />
                Test Delivery Assignment
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>OneSignal Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to configure OneSignal for your app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">1. Create OneSignal Account</h4>
              <p className="text-sm text-gray-600">
                Go to <a href="https://onesignal.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">OneSignal.com</a> and create a free account
              </p>
              
              <h4 className="font-medium">2. Create Web App</h4>
              <p className="text-sm text-gray-600">
                Create a new app and select "Web" as the platform
              </p>
              
              <h4 className="font-medium">3. Configure Environment Variables</h4>
              <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono">
                <div>ONESIGNAL_APP_ID=your_app_id_here</div>
                <div>ONESIGNAL_API_KEY=your_api_key_here</div>
                <div>VITE_ONESIGNAL_APP_ID=your_app_id_here</div>
              </div>
              
              <h4 className="font-medium">4. Test Notifications</h4>
              <p className="text-sm text-gray-600">
                Use the test buttons above to verify your setup is working correctly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}