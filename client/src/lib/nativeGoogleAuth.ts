/**
 * Native Google Authentication for Capacitor/WebView
 * This bypasses WebView limitations by using native Android OAuth
 */

import { CapacitorSocialLogin } from '@capgo/capacitor-social-login';

export interface NativeAuthResult {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    photoUrl?: string;
  };
}

export class NativeGoogleAuth {
  private static isInitialized = false;

  /**
   * Initialize the native auth plugin
   */
  static async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Plugin auto-initializes based on capacitor.config.ts
      this.isInitialized = true;
      console.log('🔐 Native Google Auth initialized');
    } catch (error) {
      console.error('❌ Failed to initialize native auth:', error);
      throw error;
    }
  }

  /**
   * Check if running in native Capacitor app
   */
  static isNativeApp(): boolean {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  }

  /**
   * Sign in with Google using native OAuth (bypasses WebView)
   */
  static async signInWithGoogle(): Promise<NativeAuthResult> {
    try {
      await this.initialize();

      if (!this.isNativeApp()) {
        throw new Error('Native auth only available in Capacitor app');
      }

      console.log('🚀 Starting native Google OAuth...');

      const result = await CapacitorSocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['profile', 'email'],
          requestIdToken: true,
          offlineAccess: true
        }
      });

      console.log('✅ Native Google OAuth successful:', result);

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          photoUrl: result.user.photoUrl
        }
      };

    } catch (error) {
      console.error('❌ Native Google OAuth failed:', error);
      throw error;
    }
  }

  /**
   * Sign out from native auth
   */
  static async signOut(): Promise<void> {
    try {
      if (this.isNativeApp()) {
        await CapacitorSocialLogin.logout({
          provider: 'google'
        });
        console.log('🔐 Native Google sign out successful');
      }
    } catch (error) {
      console.error('❌ Native sign out failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      if (!this.isNativeApp()) return false;

      const status = await CapacitorSocialLogin.getAuthStatus({
        provider: 'google'
      });

      return status.isAuthenticated;
    } catch (error) {
      console.error('❌ Auth status check failed:', error);
      return false;
    }
  }
}

/**
 * Smart Google Auth - automatically chooses best method
 */
export class SmartGoogleAuth {
  /**
   * Automatically choose the best Google auth method
   * - Native auth in Capacitor app (bypasses WebView)
   * - Web Firebase auth in browser
   */
  static async signIn(): Promise<any> {
    try {
      // Check if running in native app
      if (NativeGoogleAuth.isNativeApp()) {
        console.log('📱 Using native Google auth (WebView bypass)');
        return await NativeGoogleAuth.signInWithGoogle();
      } else {
        console.log('🌐 Using web Firebase auth');
        // Fallback to existing Firebase auth
        const { signInWithGoogle } = await import('./firebaseAuth');
        return await signInWithGoogle();
      }
    } catch (error) {
      console.error('❌ Smart Google auth failed:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      if (NativeGoogleAuth.isNativeApp()) {
        await NativeGoogleAuth.signOut();
      } else {
        const { signOutUser } = await import('./firebaseAuth');
        await signOutUser();
      }
    } catch (error) {
      console.error('❌ Smart sign out failed:', error);
      throw error;
    }
  }
}