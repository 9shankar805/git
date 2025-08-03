
/**
 * Deep Linking Service for Siraha Bazaar
 * Handles URL routing, parameter extraction, and WebView communication
 */

export interface DeepLinkData {
  path: string;
  params: Record<string, string>;
  fragment?: string;
  source: 'web' | 'android' | 'notification' | 'share';
}

export interface DeepLinkHandler {
  pattern: RegExp;
  handler: (data: DeepLinkData) => void;
  description: string;
}

class DeepLinkingService {
  private handlers: DeepLinkHandler[] = [];
  private isInitialized = false;

  /**
   * Initialize deep linking service
   */
  initialize() {
    if (this.isInitialized) return;

    this.registerDefaultHandlers();
    this.setupGlobalHandler();
    this.handleInitialUrl();
    
    this.isInitialized = true;
    console.log('🔗 Deep Linking Service initialized');
  }

  /**
   * Register a deep link handler
   */
  register(pattern: RegExp, handler: (data: DeepLinkData) => void, description: string) {
    this.handlers.push({ pattern, handler, description });
    console.log(`🔗 Registered deep link handler: ${description}`);
  }

  /**
   * Handle a deep link URL
   */
  handleDeepLink(url: string, source: DeepLinkData['source'] = 'web') {
    try {
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname;
      const params = Object.fromEntries(urlObj.searchParams.entries());
      const fragment = urlObj.hash.slice(1);

      const deepLinkData: DeepLinkData = {
        path,
        params,
        fragment: fragment || undefined,
        source
      };

      console.log('🔗 Processing deep link:', deepLinkData);

      // Find matching handler
      for (const { pattern, handler } of this.handlers) {
        if (pattern.test(path)) {
          console.log(`🔗 Matched pattern: ${pattern}`);
          handler(deepLinkData);
          return true;
        }
      }

      console.warn('🔗 No handler found for path:', path);
      return false;
    } catch (error) {
      console.error('🔗 Error processing deep link:', error);
      return false;
    }
  }

  /**
   * Generate a deep link URL
   */
  generateDeepLink(path: string, params?: Record<string, string>): string {
    const url = new URL(path, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Generate a shareable deep link with UTM parameters
   */
  generateShareableLink(path: string, params?: Record<string, string>, utmSource?: string): string {
    const shareParams = {
      ...params,
      utm_source: utmSource || 'app_share',
      utm_medium: 'deep_link',
      utm_campaign: 'user_share'
    };

    return this.generateDeepLink(path, shareParams);
  }

  /**
   * Register default handlers for common routes
   */
  private registerDefaultHandlers() {
    // Product details
    this.register(
      /^\/product\/(\d+)/,
      (data) => {
        const productId = data.path.split('/')[2];
        window.location.href = `/product/${productId}${this.buildQueryString(data.params)}`;
      },
      'Product Details'
    );

    // Store details
    this.register(
      /^\/store\/(\d+)/,
      (data) => {
        const storeId = data.path.split('/')[2];
        window.location.href = `/store/${storeId}${this.buildQueryString(data.params)}`;
      },
      'Store Details'
    );

    // Order tracking
    this.register(
      /^\/track\/(.+)/,
      (data) => {
        const orderId = data.path.split('/')[2];
        window.location.href = `/track/${orderId}${this.buildQueryString(data.params)}`;
      },
      'Order Tracking'
    );

    // Category browsing
    this.register(
      /^\/category\/(.+)/,
      (data) => {
        const category = data.path.split('/')[2];
        window.location.href = `/products?category=${encodeURIComponent(category)}${this.buildQueryString(data.params, '&')}`;
      },
      'Category Browsing'
    );

    // Search results
    this.register(
      /^\/search/,
      (data) => {
        const query = data.params.q || '';
        window.location.href = `/products?search=${encodeURIComponent(query)}${this.buildQueryString(data.params, '&')}`;
      },
      'Search Results'
    );

    // Cart
    this.register(
      /^\/cart/,
      (data) => {
        window.location.href = `/cart${this.buildQueryString(data.params)}`;
      },
      'Shopping Cart'
    );

    // Checkout
    this.register(
      /^\/checkout/,
      (data) => {
        window.location.href = `/checkout${this.buildQueryString(data.params)}`;
      },
      'Checkout'
    );

    // User account
    this.register(
      /^\/account/,
      (data) => {
        window.location.href = `/account${this.buildQueryString(data.params)}`;
      },
      'User Account'
    );

    // Default fallback
    this.register(
      /.*/,
      (data) => {
        console.log('🔗 Default handler - navigating to:', data.path);
        window.location.href = data.path + this.buildQueryString(data.params);
      },
      'Default Route Handler'
    );
  }

  /**
   * Setup global deep link handler for Android WebView
   */
  private setupGlobalHandler() {
    // Make handler available globally for Android WebView
    (window as any).handleDeepLink = (path: string) => {
      this.handleDeepLink(path, 'android');
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.deepLink) {
        this.handleDeepLink(window.location.href, 'web');
      }
    });
  }

  /**
   * Handle initial URL on page load
   */
  private handleInitialUrl() {
    const currentUrl = window.location.href;
    const hasQuery = window.location.search || window.location.hash;
    
    if (hasQuery) {
      this.handleDeepLink(currentUrl, 'web');
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, string>, prefix: string = '?'): string {
    const filteredParams = Object.entries(params).filter(([_, value]) => value);
    
    if (filteredParams.length === 0) return '';
    
    const queryString = filteredParams
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
      
    return `${prefix}${queryString}`;
  }

  /**
   * Get current deep link handlers for debugging
   */
  getHandlers(): DeepLinkHandler[] {
    return this.handlers;
  }
}

// Create singleton instance
export const deepLinkingService = new DeepLinkingService();

// Utility functions
export const generateProductDeepLink = (productId: number, params?: Record<string, string>) => {
  return deepLinkingService.generateDeepLink(`/product/${productId}`, params);
};

export const generateStoreDeepLink = (storeId: number, params?: Record<string, string>) => {
  return deepLinkingService.generateDeepLink(`/store/${storeId}`, params);
};

export const generateOrderTrackingDeepLink = (orderId: string, params?: Record<string, string>) => {
  return deepLinkingService.generateDeepLink(`/track/${orderId}`, params);
};

export const generateShareableProductLink = (productId: number, utmSource?: string) => {
  return deepLinkingService.generateShareableLink(`/product/${productId}`, undefined, utmSource);
};

// Initialize on module load
if (typeof window !== 'undefined') {
  deepLinkingService.initialize();
}
