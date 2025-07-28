// FCM Diagnostic Page - Comprehensive FCM troubleshooting
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Copy,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function FCMDiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();

  const addDiagnostic = (diagnostic: DiagnosticResult) => {
    setDiagnostics(prev => [...prev, diagnostic]);
  };

  const clearDiagnostics = () => {
    setDiagnostics([]);
  };

  const runComprehensiveDiagnostic = async () => {
    setIsRunning(true);
    clearDiagnostics();

    // Step 1: Check browser support
    addDiagnostic({
      step: '1. Browser Support',
      status: 'serviceWorker' in navigator && 'PushManager' in window ? 'success' : 'error',
      message: 'serviceWorker' in navigator && 'PushManager' in window 
        ? 'Browser supports push notifications' 
        : 'Browser does not support push notifications'
    });

    // Step 2: Check notification permission
    const currentPermission = Notification.permission;
    addDiagnostic({
      step: '2. Notification Permission',
      status: currentPermission === 'granted' ? 'success' : 
              currentPermission === 'denied' ? 'error' : 'warning',
      message: `Notification permission: ${currentPermission}`,
      details: currentPermission === 'denied' 
        ? 'You need to reset browser notifications manually'
        : currentPermission === 'default'
        ? 'Click "Request Permission" to continue'
        : 'Permission is granted, ready to generate FCM token'
    });

    // Step 3: Check Firebase config
    try {
      const { getFirebaseConfig } = await import('@/config/firebase');
      const config = getFirebaseConfig();
      
      addDiagnostic({
        step: '3. Firebase Configuration',
        status: config.apiKey && config.projectId ? 'success' : 'error',
        message: config.apiKey && config.projectId 
          ? 'Firebase configuration is valid'
          : 'Firebase configuration is missing required fields',
        details: `Project ID: ${config.projectId || 'Missing'}, API Key: ${config.apiKey ? 'Present' : 'Missing'}`
      });
    } catch (error) {
      addDiagnostic({
        step: '3. Firebase Configuration',
        status: 'error',
        message: 'Failed to load Firebase configuration',
        details: (error as Error).message
      });
    }

    // Step 4: Check VAPID key
    try {
      const { getVapidKey } = await import('@/config/firebase');
      const vapidKey = getVapidKey();
      
      addDiagnostic({
        step: '4. VAPID Key',
        status: vapidKey && vapidKey.length > 80 ? 'success' : 'error',
        message: vapidKey && vapidKey.length > 80 
          ? 'VAPID key is configured'
          : 'VAPID key is missing or invalid',
        details: vapidKey 
          ? `Key length: ${vapidKey.length} characters`
          : 'VAPID key is required for FCM token generation'
      });
    } catch (error) {
      addDiagnostic({
        step: '4. VAPID Key',
        status: 'error',
        message: 'Failed to load VAPID key',
        details: (error as Error).message
      });
    }

    // Step 5: Check service worker
    try {
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      addDiagnostic({
        step: '5. Service Worker',
        status: registration ? 'success' : 'warning',
        message: registration 
          ? 'Firebase service worker is registered'
          : 'Firebase service worker not found',
        details: registration 
          ? `Scope: ${registration.scope}`
          : 'Service worker will be registered automatically'
      });
    } catch (error) {
      addDiagnostic({
        step: '5. Service Worker',
        status: 'error',
        message: 'Service worker check failed',
        details: (error as Error).message
      });
    }

    // Step 6: Test Firebase initialization
    try {
      const { FirebaseNotificationService } = await import('@/lib/firebaseNotifications');
      const initialized = await FirebaseNotificationService.initialize();
      
      addDiagnostic({
        step: '6. Firebase Initialization',
        status: initialized ? 'success' : 'error',
        message: initialized 
          ? 'Firebase messaging service initialized successfully'
          : 'Firebase messaging service failed to initialize'
      });
    } catch (error) {
      addDiagnostic({
        step: '6. Firebase Initialization',
        status: 'error',
        message: 'Firebase initialization failed',
        details: (error as Error).message
      });
    }

    // Step 7: Check server-side FCM configuration
    try {
      const response = await fetch('/api/fcm/server-status');
      const serverStatus = await response.json();
      
      addDiagnostic({
        step: '7. Server Configuration',
        status: serverStatus.firebaseConfigured ? 'success' : 'warning',
        message: serverStatus.firebaseConfigured 
          ? 'Server-side Firebase is configured'
          : 'Server-side Firebase needs configuration',
        details: serverStatus.message || 'Firebase service account required for sending notifications'
      });
    } catch (error) {
      addDiagnostic({
        step: '7. Server Configuration',
        status: 'error',
        message: 'Failed to check server configuration',
        details: (error as Error).message
      });
    }

    setIsRunning(false);
  };

  const requestPermissionAndGenerateToken = async () => {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Required",
          description: "Notification permission is needed to generate FCM token",
          variant: "destructive"
        });
        return;
      }

      // Generate FCM token
      const { FirebaseNotificationService } = await import('@/lib/firebaseNotifications');
      const token = await FirebaseNotificationService.getDeviceToken();
      
      if (token) {
        setFcmToken(token);
        
        // Try to send immediate test notification
        await sendImmediateTestNotification(token);
        
        toast({
          title: "Success!",
          description: "FCM token generated and test notification sent",
        });
      } else {
        toast({
          title: "Token Generation Failed",
          description: "Unable to generate FCM token. Check diagnostics above.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Permission/token error:', error);
      toast({
        title: "Error",
        description: "Failed to generate FCM token",
        variant: "destructive",
      });
    }
  };

  const sendImmediateTestNotification = async (token: string) => {
    try {
      // Send via server API
      const response = await fetch('/api/fcm/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title: 'FCM Test Success! 🎉',
          body: 'Your FCM token is working perfectly! Notifications will now appear instantly.',
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        }),
      });

      const result = await response.json();
      console.log('Test notification result:', result);
      
      // Also try browser notification as backup
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('FCM Setup Complete! ✅', {
          body: 'Your push notifications are now working correctly.',
          icon: '/favicon.ico',
          tag: 'fcm-test-success'
        });
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const copyToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      toast({
        title: "Copied",
        description: "FCM token copied to clipboard",
      });
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      info: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  useEffect(() => {
    runComprehensiveDiagnostic();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            FCM Diagnostic Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Comprehensive Firebase Cloud Messaging troubleshooting and testing
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button 
            onClick={runComprehensiveDiagnostic}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          
          <Button 
            onClick={requestPermissionAndGenerateToken}
            variant="default"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Request Permission & Generate Token
          </Button>
        </div>

        {/* Diagnostics Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Diagnostic Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  {getStatusIcon(diagnostic.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{diagnostic.step}</span>
                      {getStatusBadge(diagnostic.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {diagnostic.message}
                    </p>
                    {diagnostic.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {diagnostic.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {diagnostics.length === 0 && !isRunning && (
                <div className="text-center py-8 text-gray-500">
                  Click "Run Diagnostics" to start troubleshooting
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FCM Token Display */}
        {fcmToken && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ FCM Token Generated Successfully</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium mb-2">Your FCM Device Token:</p>
                  <p className="text-xs font-mono bg-white dark:bg-gray-900 p-2 rounded border break-all">
                    {fcmToken}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={copyToken} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Token
                  </Button>
                  <Badge variant="default" className="px-3 py-1">
                    Token Length: {fcmToken.length} characters
                  </Badge>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    🎉 Success! Your FCM token is ready and notifications should work immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Troubleshooting Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-red-600">❌ Permission Denied:</h4>
                <p>Reset browser notifications: Settings → Privacy → Notifications → Reset for this site</p>
              </div>
              <div>
                <h4 className="font-semibold text-yellow-600">⚠️ VAPID Key Missing:</h4>
                <p>Server needs proper VAPID key configuration for token generation</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600">ℹ️ Server Configuration:</h4>
                <p>Firebase service account needed for sending notifications from server</p>
              </div>
              <div>
                <h4 className="font-semibold text-green-600">✅ All Good:</h4>
                <p>If all checks pass, your FCM setup is complete and ready for production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}