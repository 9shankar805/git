
import { getAuth, getRedirectResult } from 'firebase/auth';
import { AndroidBridge } from './androidBridge';

export class OAuthRedirectHandler {
  static async checkForRedirectResult() {
    try {
      const auth = getAuth();
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        console.log('🔄 OAuth redirect result found:', result.user.email);
        
        // Process the successful authentication
        const userData = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          emailVerified: result.user.emailVerified
        };
        
        // Send to backend
        const response = await fetch('/api/auth/social-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: userData.uid,
            email: userData.email,
            fullName: userData.displayName,
            photoUrl: userData.photoURL,
            emailVerified: userData.emailVerified,
            role: 'customer'
          }),
        });

        if (response.ok) {
          const { user } = await response.json();
          
          // Notify Android bridge
          if (AndroidBridge.isAndroidApp()) {
            AndroidBridge.showToast(`Welcome ${user.fullName}!`);
            AndroidBridge.logMessage(`OAuth redirect successful for ${user.email}`);
          }
          
          // Trigger app state update (you may need to emit an event or update context)
          window.dispatchEvent(new CustomEvent('oauth-success', { detail: user }));
          
          // Redirect to home
          window.location.href = '/';
          
          return user;
        }
      }
      
      return null;
    } catch (error) {
      console.error('🚫 OAuth redirect error:', error);
      
      if (AndroidBridge.isAndroidApp()) {
        AndroidBridge.showToast('Authentication failed. Please try again.');
        AndroidBridge.logMessage(`OAuth redirect error: ${error}`);
      }
      
      return null;
    }
  }
}
