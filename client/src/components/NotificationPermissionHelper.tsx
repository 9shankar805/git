import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, Shield, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

interface NotificationPermissionHelperProps {
  onPermissionGranted?: () => void;
}

export default function NotificationPermissionHelper({ onPermissionGranted }: NotificationPermissionHelperProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          status: 'Allowed',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          canGenerate: true
        };
      case 'denied':
        return {
          status: 'Blocked',
          variant: 'destructive' as const,
          icon: AlertTriangle,
          color: 'text-red-600',
          canGenerate: false
        };
      default:
        return {
          status: 'Not Set',
          variant: 'secondary' as const,
          icon: Shield,
          color: 'text-yellow-600',
          canGenerate: false
        };
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        onPermissionGranted?.();
      } else if (result === 'denied') {
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const statusInfo = getPermissionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Permission Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            <span className="font-medium">Permission Status:</span>
          </div>
          <Badge variant={statusInfo.variant}>
            {statusInfo.status}
          </Badge>
        </div>

        {permission === 'default' && (
          <div className="space-y-3">
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                To receive push notifications and generate FCM tokens, you need to grant notification permission.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={requestPermission} 
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? 'Requesting Permission...' : 'Grant Notification Permission'}
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Notifications are blocked. FCM tokens cannot be generated without permission.
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Show Fix Instructions
            </Button>

            {showInstructions && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h4 className="font-semibold">How to Enable Notifications:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Click the <strong>lock icon 🔒</strong> in your browser's address bar</li>
                  <li>Find <strong>"Notifications"</strong> in the dropdown</li>
                  <li>Change from <strong>"Block"</strong> to <strong>"Allow"</strong></li>
                  <li>Refresh this page</li>
                  <li>Try generating FCM token again</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border-l-4 border-blue-400">
                  <p className="text-sm">
                    <strong>Alternative:</strong> Use incognito/private browsing mode and allow notifications when prompted.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {permission === 'granted' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Notifications are enabled! You can now generate FCM tokens and receive push notifications.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> FCM tokens are real Google Firebase tokens, not fake ones. 
          Permission is required for token generation and notification delivery.</p>
        </div>
      </CardContent>
    </Card>
  );
}