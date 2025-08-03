import { Request, Response, Express } from "express";
import { Server } from "http";
import { storage } from "./storage";
import { notifications, insertNotificationSchema } from "../shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { createServer } from "http";

// Real-time tracking service
class RealTimeTrackingService {
  private deliveryPartners: Map<number, any> = new Map();
  
  updatePartnerLocation(partnerId: number, location: { lat: number; lng: number }) {
    this.deliveryPartners.set(partnerId, {
      ...this.deliveryPartners.get(partnerId),
      location,
      lastUpdated: new Date()
    });
  }
  
  getPartnerLocation(partnerId: number) {
    return this.deliveryPartners.get(partnerId);
  }
  
  getAllPartnerLocations() {
    return Array.from(this.deliveryPartners.entries()).map(([id, data]) => ({
      partnerId: id,
      ...data
    }));
  }
}

// Initialize real-time tracking service
const realTimeTrackingService = new RealTimeTrackingService();

export async function registerRoutes(app: Express): Promise<Server> {
  // API route interceptor
  app.use('/api/*', (req, res, next) => {
    console.log(`🔧 API route intercepted: ${req.method} ${req.path}`);
    next();
  });

  // Notification routes
  app.get("/api/notifications/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const notifications = await storage.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/user/:userId/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const success = await storage.markAllNotificationsAsRead(userId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  // Test FCM notification endpoint
  app.post("/api/test-fcm-notification", async (req, res) => {
    try {
      const { token, title, body } = req.body;
      
      // For demo purposes, always return success
      console.log(`Test FCM notification: ${title} - ${body} to token: ${token?.substring(0, 20)}...`);
      
      res.json({ 
        success: true,
        message: "Test notification sent successfully" 
      });
    } catch (error) {
      console.error("FCM test error:", error);
      res.status(500).json({ error: "Failed to send FCM test notification" });
    }
  });

  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { category, search, store, limit = 50 } = req.query;
      let products;

      if (category) {
        products = await storage.getProductsByCategory(parseInt(category as string));
      } else if (search) {
        products = await storage.searchProducts(search as string);
      } else if (store) {
        products = await storage.getProductsByStoreId(parseInt(store as string));
      } else {
        products = await storage.getAllProducts();
      }

      // Apply limit
      const limitNum = parseInt(limit as string) || 50;
      const limitedProducts = products.slice(0, limitNum);

      res.json(limitedProducts);
    } catch (error) {
      console.error("Products API error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Product API error:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Stores API
  app.get("/api/stores", async (req, res) => {
    try {
      const { owner, limit = 50 } = req.query;
      let stores;

      if (owner) {
        stores = await storage.getStoresByOwnerId(parseInt(owner as string));
      } else {
        stores = await storage.getAllStores();
      }

      // Apply limit
      const limitNum = parseInt(limit as string) || 50;
      const limitedStores = stores.slice(0, limitNum);

      res.json(limitedStores);
    } catch (error) {
      console.error("Stores API error:", error);
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  app.get("/api/stores/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const store = await storage.getStore(id);
      if (!store) {
        return res.status(404).json({ error: "Store not found" });
      }
      res.json(store);
    } catch (error) {
      console.error("Store API error:", error);
      res.status(500).json({ error: "Failed to fetch store" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Categories API error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Flash Sales API
  app.get("/api/flash-sales/active", async (req, res) => {
    try {
      // For now, return empty array - can be enhanced later
      res.json([]);
    } catch (error) {
      console.error("Flash sales API error:", error);
      res.status(500).json({ error: "Failed to fetch flash sales" });
    }
  });

  // Recommendations API
  app.get("/api/recommendations/homepage", async (req, res) => {
    try {
      // Get featured products as recommendations
      const products = await storage.getAllProducts();
      const recommendations = products.slice(0, 10); // Top 10 products
      res.json(recommendations);
    } catch (error) {
      console.error("Recommendations API error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/recommendations/track", async (req, res) => {
    try {
      // Track user interactions (can be enhanced later)
      res.json({ success: true });
    } catch (error) {
      console.error("Recommendations tracking error:", error);
      res.status(500).json({ error: "Failed to track recommendation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}