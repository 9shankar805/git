
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import OneSignalNotificationService from '@/lib/oneSignalNotifications';

const OneSignalTestPage: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testTitle, setTestTitle] = useState('Test Notification from OneSignal');
  const [testMessage, setTestMessage] = useState('This is a test notification from your webview app!');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    checkOneSignalStatus();
  }, []);

  const checkOneSignalStatus = async () => {
    try {
      const initialized = await OneSignalNotificationService.initialize();
      setIsInitialized(initialized);

      if (initialized && window.OneSignal) {
        const permission = await window.OneSignal.getNotificationPermission();
        setHasPermission(permission === 'granted');

        if (permission === 'granted') {
          const token = await OneSignalNotificationService.getSubscriptionId();
          setSubscriptionId(token);
        }
      }
    } catch (error) {
      console.error('Error checking OneSignal status:', error);
      setStatus({ type: 'error', message: 'Failed to check OneSignal status' });
    }
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      const granted = await OneSignalNotificationService.requestPermission();
      
      if (granted) {
        setHasPermission(true);
        const token = await OneSignalNotificationService.getSubscriptionId();
        setSubscriptionId(token);
        setStatus({ type: 'success', message: 'Notification permission granted successfully!' });
      } else {
        setStatus({ type: 'error', message: 'Notification permission denied' });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setStatus({ type: 'error', message: 'Failed to request notification permission' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      const success = await OneSignalNotificationService.sendTestNotification(testTitle, testMessage);
      
      if (success) {
        setStatus({ type: 'success', message: 'Test notification sent successfully!' });
      } else {
        setStatus({ type: 'error', message: 'Failed to send test notification' });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setStatus({ type: 'error', message: 'Failed to send test notification' });
    } finally {
      setIsLoading(false);
    }
  };

  const getEnvironmentInfo = () => {
    const isWebview = /webview|embedded/i.test(navigator.userAgent);
    const isReplit = window.location.hostname.includes('replit.dev');
    const isAndroidApp = !!(window as any).AndroidApp;

    return { isWebview, isReplit, isAndroidApp };
  };

  const { isWebview, isReplit, isAndroidApp } = getEnvironmentInfo();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">OneSignal WebView Test</h1>
        <p className="text-gray-600">Test OneSignal push notifications in your webview app</p>
      </div>

      {/* Environment Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Environment Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={isWebview ? "default" : "secondary"}>
              WebView: {isWebview ? "Yes" : "No"}
            </Badge>
            <Badge variant={isReplit ? "default" : "secondary"}>
              Replit: {isReplit ? "Yes" : "No"}
            </Badge>
            <Badge variant={isAndroidApp ? "default" : "secondary"}>
              Android App: {isAndroidApp ? "Yes" : "No"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            User Agent: {navigator.userAgent.substring(0, 80)}...
          </p>
        </CardContent>
      </Card>

      {/* OneSignal Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>OneSignal Status</CardTitle>
          <CardDescription>Current OneSignal configuration and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">Initialized</p>
              <p className="text-xs text-gray-600">{isInitialized ? 'Ready' : 'Not Ready'}</p>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">Permission</p>
              <p className="text-xs text-gray-600">{hasPermission ? 'Granted' : 'Not Granted'}</p>
            </div>
            <div className="text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${subscriptionId ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm font-medium">Subscription</p>
              <p className="text-xs text-gray-600">{subscriptionId ? 'Active' : 'None'}</p>
            </div>
          </div>

          {subscriptionId && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm font-medium">Subscription ID:</Label>
              <p className="text-xs font-mono break-all mt-1">{subscriptionId}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Request */}
      {isInitialized && !hasPermission && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 1: Request Permission</CardTitle>
            <CardDescription>Request notification permission from the user</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRequestPermission} disabled={isLoading} className="w-full">
              {isLoading ? 'Requesting...' : 'Request Notification Permission'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Notification */}
      {hasPermission && subscriptionId && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 2: Send Test Notification</CardTitle>
            <CardDescription>Send a test notification to verify the setup</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="testTitle">Notification Title</Label>
              <Input
                id="testTitle"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <Label htmlFor="testMessage">Notification Message</Label>
              <Input
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter notification message"
              />
            </div>
            <Button onClick={handleSendTestNotification} disabled={isLoading} className="w-full">
              {isLoading ? 'Sending...' : 'Send Test Notification'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {status && (
        <Alert className={`mb-6 ${status.type === 'error' ? 'border-red-500' : status.type === 'success' ? 'border-green-500' : ''}`}>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1. OneSignal Account:</strong> Create a free OneSignal account at onesignal.com</p>
            <p><strong>2. App Configuration:</strong> Replace 'your-onesignal-app-id' in the code with your actual OneSignal App ID</p>
            <p><strong>3. Environment Variables:</strong> Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in your .env file</p>
            <p><strong>4. WebView Integration:</strong> This configuration is optimized for Android WebView apps</p>
            <p><strong>5. Testing:</strong> Use this page to test notification setup before deploying to production</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OneSignalTestPage;
