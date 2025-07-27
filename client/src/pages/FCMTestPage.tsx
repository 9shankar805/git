// FCM Test Page - Test Firebase Cloud Messaging functionality
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import FirebaseNotificationService from '@/lib/firebaseNotifications';
import { Bell, Send, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function FCMTestPage() {
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isInitialized, setIsInitialized] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Notification');
  const [testBody, setTestBody] = useState('This is a test notification from Firebase Cloud Messaging!');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeFCM();
  }, []);

  const initializeFCM = async () => {
    try {
      const initialized = await FirebaseNotificationService.initialize();
      setIsInitialized(initialized);
      
      if (initialized) {
        // Check current permission status
        setPermissionStatus(Notification.permission);
        
        // Try to get existing token
        const token = FirebaseNotificationService.getCurrentToken();
        if (token) {
          setDeviceToken(token);
        }
      }
    } catch (error) {
      console.error('FCM initialization error:', error);
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize Firebase Cloud Messaging",
        variant: "destructive",
      });
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const granted = await FirebaseNotificationService.requestPermission();
      setPermissionStatus(Notification.permission);
      
      if (granted) {
        toast({
          title: "Permission Granted",
          description: "Notification permission has been granted",
        });
        await generateToken();
      } else {
        toast({
          title: "Permission Denied",
          description: "Notification permission was denied",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Permission request error:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = async () => {
    setIsLoading(true);
    try {
      const token = await FirebaseNotificationService.getDeviceToken();
      if (token) {
        setDeviceToken(token);
        toast({
          title: "Token Generated",
          description: "FCM device token generated successfully",
        });
      } else {
        toast({
          title: "Token Generation Failed",
          description: "Failed to generate FCM device token",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Token generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate device token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!deviceToken) {
      toast({
        title: "No Token",
        description: "Please generate a device token first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await FirebaseNotificationService.sendTestNotification(testTitle, testBody);
      
      if (success) {
        toast({
          title: "Notification Sent",
          description: "Test notification sent successfully",
        });
      } else {
        toast({
          title: "Send Failed",
          description: "Failed to send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Send notification error:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'granted':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Not Requested</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Firebase Cloud Messaging Test</h1>
        <p className="text-muted-foreground">
          Test Firebase Cloud Messaging (FCM) push notifications functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              FCM Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Initialized:</span>
              {isInitialized ? (
                <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Yes</Badge>
              ) : (
                <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />No</Badge>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span>Permission:</span>
              {getStatusBadge(permissionStatus)}
            </div>
            
            <div className="flex justify-between items-center">
              <span>Device Token:</span>
              {deviceToken ? (
                <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Generated</Badge>
              ) : (
                <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />None</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={requestPermission} 
              disabled={isLoading || permissionStatus === 'granted'}
              className="w-full"
            >
              {permissionStatus === 'granted' ? 'Permission Granted' : 'Request Permission'}
            </Button>
            
            <Button 
              onClick={generateToken} 
              disabled={isLoading || permissionStatus !== 'granted'}
              variant="outline"
              className="w-full"
            >
              {deviceToken ? 'Regenerate Token' : 'Generate Token'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Device Token Display */}
      {deviceToken && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Device Token</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={deviceToken}
              readOnly
              className="font-mono text-xs"
              placeholder="Device token will appear here..."
            />
            <p className="text-sm text-muted-foreground mt-2">
              This token identifies your device for push notifications
            </p>
          </CardContent>
        </Card>
      )}

      {/* Test Notification */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Send Test Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Notification title"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              placeholder="Notification message"
            />
          </div>
          
          <Button 
            onClick={sendTestNotification}
            disabled={isLoading || !deviceToken}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-2">
            <h4 className="font-semibold">Firebase Project Setup:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Firebase Console</a></li>
              <li>Enable Cloud Messaging in your Firebase project</li>
              <li>Generate VAPID keys in Project Settings → Cloud Messaging</li>
              <li>Update the environment variables with your Firebase config</li>
              <li>Deploy the service worker to handle background notifications</li>
            </ol>
          </div>
          
          <div className="text-sm space-y-2">
            <h4 className="font-semibold">Required Environment Variables:</h4>
            <ul className="list-disc list-inside space-y-1 font-mono text-xs">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
              <li>VITE_FIREBASE_VAPID_KEY</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}