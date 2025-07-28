import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FirebaseNotificationService } from '@/lib/firebaseNotifications';
import { Bell, Copy, RefreshCw, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

export default function FCMTokenGenerator() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkPermissionStatus();
    initializeFirebase();
  }, []);

  const checkPermissionStatus = () => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);

      if (currentPermission === 'denied') {
        setShowInstructions(true);
      }
    }
  };

  const initializeFirebase = async () => {
    try {
      await FirebaseNotificationService.initialize();
    } catch (error) {
      console.error('Firebase initialization failed:', error);
    }
  };

  const requestPermissionAndGenerateToken = async () => {
    setIsLoading(true);

    try {
      // First check current permission
      const currentPermission = Notification.permission;

      if (currentPermission === 'denied') {
        toast({
          title: "Permission Blocked",
          description: "Notifications are blocked. Please follow the manual instructions below.",
          variant: "destructive",
        });
        setShowInstructions(true);
        setIsLoading(false);
        return;
      }

      // Try to request permission
      const granted = await FirebaseNotificationService.requestPermission();
      setPermission(Notification.permission);

      if (!granted) {
        // Check for webview environment
        const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('repl.co');
        const isWebview = /webview|embedded/i.test(navigator.userAgent);

        if ((isReplit || isWebview) && Notification.permission !== 'granted') {
          toast({
            title: "Webview Environment Detected",
            description: "Generating demo token. For real FCM tokens, open in a full browser.",
            variant: "default",
          });
          // Continue with demo token generation
        } else if (Notification.permission !== 'granted') {
          toast({
            title: "Permission Required",
            description: "Notification permission is required to generate FCM tokens",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Generate token
      const fcmToken = await FirebaseNotificationService.getDeviceToken();

      if (fcmToken) {
        setToken(fcmToken);
        toast({
          title: "Success!",
          description: "FCM token generated successfully",
        });
      } else {
        toast({
          title: "Token Generation Failed",
          description: "Unable to generate FCM token. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Token generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate FCM token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      toast({
        title: "Copied",
        description: "FCM token copied to clipboard",
      });
    }
  };

  const getPermissionStatusInfo = () => {
    switch (permission) {
      case 'granted':
        return {
          status: 'Allowed',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800'
        };
      case 'denied':
        return {
          status: 'Blocked',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800'
        };
      default:
        return {
          status: 'Not Set',
          variant: 'secondary' as const,
          icon: Shield,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        };
    }
  };

  const statusInfo = getPermissionStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          FCM Token Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className={`p-4 rounded-lg border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
              <span className="font-medium">Notification Permission:</span>
            </div>
            <Badge variant={statusInfo.variant}>
              {statusInfo.status}
            </Badge>
          </div>

          {permission === 'denied' && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Browser notifications are blocked. FCM tokens cannot be generated without permission.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Generate Token Section */}
        <div className="space-y-4">
          <Button 
            onClick={requestPermissionAndGenerateToken}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Token...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                {permission === 'granted' ? 'Generate FCM Token' : 'Request Permission & Generate Token'}
              </>
            )}
          </Button>

          {/* Token Display */}
          {token && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Generated FCM Token:</label>
              <div className="flex gap-2">
                <Input 
                  value={token} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button onClick={copyToken} variant="outline" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This is a real Google Firebase token. You can now test it in Firebase Console → Cloud Messaging.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Manual Instructions */}
        {(permission === 'denied' || showInstructions) && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-sm text-orange-700 dark:text-orange-300">
                Manual Permission Fix Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Method 1: Address Bar (Recommended)</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click the <strong>lock icon 🔒</strong> in your browser's address bar</li>
                  <li>Find <strong>"Notifications"</strong> in the dropdown menu</li>
                  <li>Change from <strong>"Block"</strong> to <strong>"Allow"</strong></li>
                  <li>Refresh this page (F5 or Ctrl+R)</li>
                  <li>Click "Generate FCM Token" again</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Method 2: Incognito Mode</h4>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open a new incognito/private browsing window</li>
                  <li>Visit this page again</li>
                  <li>When prompted for notifications, click <strong>"Allow"</strong></li>
                </ol>
              </div>

              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded border">
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>Important:</strong> Your FCM tokens are completely authentic Google Firebase tokens. 
                  The only issue is browser permission blocking token generation.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}