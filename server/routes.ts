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

  const httpServer = createServer(app);
  return httpServer;
}