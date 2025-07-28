// FCM Instant Setup Page - One-click FCM token generation and immediate notification
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  CheckCircle, 
  XCircle, 
  Bell, 
  Copy,
  Play,
  RefreshCw
} from 'lucide-react';
import { FCMInstantSetup } from '@/lib/fcmInstantSetup';

export default function FCMInstantPage() {
  const [isSetupRunning, setIsSetupRunning] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string>('');
  const { toast } = useToast();

  const runInstantSetup = async () => {
    setIsSetupRunning(true);
    setSetupResult(null);
    
    try {
      toast({
        title: "Setting up FCM...",
        description: "Requesting permission and generating token...",
      });

      const result = await FCMInstantSetup.setupInstantFCM();
      setSetupResult(result);
      
      if (result.success && result.token) {
        setFcmToken(result.token);
        
        toast({
          title: "🎉 FCM Setup Complete!",
          description: "Token generated and test notification sent. Check your notifications!",
        });

        // Auto-test the system
        setTimeout(async () => {
          const testResult = await FCMInstantSetup.testNotificationSystem();
          if (testResult) {
            toast({
              title: "✅ System Test Passed",
              description: "FCM notification system is working perfectly!",
            });
          }
        }, 2000);
        
      } else {
        toast({
          title: "Setup Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast({
        title: "Error",
        description: "Failed to setup FCM notifications",
        variant: "destructive",
      });
    } finally {
      setIsSetupRunning(false);
    }
  };

  const sendTestNotification = async () => {
    const success = await FCMInstantSetup.testNotificationSystem();
    if (success) {
      toast({
        title: "Test Sent",
        description: "Check your notifications!",
      });
    } else {
      toast({
        title: "Test Failed",
        description: "Unable to send test notification",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-3">
            <Zap className="h-10 w-10 text-yellow-500" />
            FCM Instant Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            One-click Firebase Cloud Messaging setup with immediate notification testing
          </p>
        </div>

        {/* Quick Setup Card */}
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-2xl text-center text-purple-600 dark:text-purple-400">
              🚀 Instant FCM Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-700 dark:text-gray-300">
              Click the button below to instantly setup FCM notifications. This will:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Request notification permission</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Generate real FCM token</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Register with server</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Send instant test notification</span>
              </div>
            </div>

            <Button 
              onClick={runInstantSetup}
              disabled={isSetupRunning}
              size="lg"
              className="w-full md:w-auto px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSetupRunning ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Setting up FCM...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Setup FCM Instantly
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Setup Result */}
        {setupResult && (
          <Card className={`border-2 ${setupResult.success ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${setupResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {setupResult.success ? (
                  <>
                    <CheckCircle className="h-6 w-6" />
                    Setup Successful!
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6" />
                    Setup Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {setupResult.success ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <Badge variant="default" className="mb-2">Token Generated</Badge>
                      <p className="text-sm text-gray-600">✅ Real FCM token created</p>
                    </div>
                    <div className="text-center">
                      <Badge variant="default" className="mb-2">Server Registered</Badge>
                      <p className="text-sm text-gray-600">✅ Token saved to database</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={setupResult.notificationSent ? "default" : "secondary"} className="mb-2">
                        {setupResult.notificationSent ? "Notification Sent" : "Notification Pending"}
                      </Badge>
                      <p className="text-sm text-gray-600">
                        {setupResult.notificationSent ? "✅ Test notification delivered" : "⏳ Check your notifications"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 font-medium text-center">
                      🎉 FCM is now fully configured! You will receive notifications instantly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Error: {setupResult.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* FCM Token Display */}
        {fcmToken && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Bell className="h-5 w-5" />
                Your FCM Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-medium mb-2">FCM Device Token:</p>
                  <p className="text-xs font-mono bg-white dark:bg-gray-900 p-3 rounded border break-all">
                    {fcmToken}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button onClick={copyToken} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Token
                  </Button>
                  
                  <Button onClick={sendTestNotification} size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Send Test Notification
                  </Button>
                  
                  <Badge variant="outline" className="px-3 py-1">
                    Length: {fcmToken.length} chars
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <p className="font-semibold">Permission Request</p>
                  <p className="text-gray-600">Browser will ask for notification permission - click "Allow"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <p className="font-semibold">Token Generation</p>
                  <p className="text-gray-600">Firebase will generate a unique FCM token for your device</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <p className="font-semibold">Immediate Test</p>
                  <p className="text-gray-600">You'll receive a test notification instantly to confirm it's working</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                <div>
                  <p className="font-semibold">Ready for Production</p>
                  <p className="text-gray-600">Your app can now send real-time notifications for orders, deliveries, and updates</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}