
import { Request, Response } from 'express';
import { db } from '../db.ts';

export function setupDeepLinkRoutes(app: any) {
  // Generate deep link for product
  app.post('/api/deeplink/product/:id', async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const { utm_source = 'api', utm_medium = 'deeplink' } = req.body;

      // Verify product exists
      const product = await db.query('SELECT id, name FROM products WHERE id = $1', [productId]);
      
      if (product.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const baseUrl = process.env.APP_URL || 'https://sirahabazaar.com';
      const deepLink = `${baseUrl}/product/${productId}?utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=product_share`;

      res.json({
        success: true,
        deepLink,
        product: product.rows[0],
        qrCode: `${baseUrl}/api/qr?url=${encodeURIComponent(deepLink)}`
      });
    } catch (error) {
      console.error('Error generating product deep link:', error);
      res.status(500).json({ error: 'Failed to generate deep link' });
    }
  });

  // Generate deep link for store
  app.post('/api/deeplink/store/:id', async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.id);
      const { utm_source = 'api', utm_medium = 'deeplink' } = req.body;

      // Verify store exists
      const store = await db.query('SELECT id, name FROM stores WHERE id = $1', [storeId]);
      
      if (store.rows.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }

      const baseUrl = process.env.APP_URL || 'https://sirahabazaar.com';
      const deepLink = `${baseUrl}/store/${storeId}?utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=store_share`;

      res.json({
        success: true,
        deepLink,
        store: store.rows[0],
        qrCode: `${baseUrl}/api/qr?url=${encodeURIComponent(deepLink)}`
      });
    } catch (error) {
      console.error('Error generating store deep link:', error);
      res.status(500).json({ error: 'Failed to generate deep link' });
    }
  });

  // Generate QR code for deep links
  app.get('/api/qr', (req: Request, res: Response) => {
    const { url, size = '200' } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    // Use QR Server API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url as string)}`;
    
    res.redirect(qrUrl);
  });

  // Track deep link analytics
  app.post('/api/deeplink/analytics', async (req: Request, res: Response) => {
    try {
      const { 
        deepLink, 
        source, 
        userAgent, 
        referrer, 
        timestamp = Date.now() 
      } = req.body;

      // Store analytics data
      await db.query(`
        INSERT INTO deep_link_analytics (deep_link, source, user_agent, referrer, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [deepLink, source, userAgent, referrer, new Date(timestamp)]);

      res.json({ success: true });
    } catch (error) {
      console.error('Error tracking deep link analytics:', error);
      res.json({ success: false }); // Don't fail the request for analytics
    }
  });
}
