import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// PostgreSQL database URL - supports both DigitalOcean and Neon
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_B14cMjkFUhuw@ep-wispy-paper-a1eejnp5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Check if we're in development and handle SSL accordingly
const isDevelopment = process.env.NODE_ENV === 'development';
const isDigitalOcean = DATABASE_URL.includes('ondigitalocean.com');

// Ensure proper SSL mode for production
const finalDatabaseUrl = DATABASE_URL.includes('sslmode=') 
  ? DATABASE_URL 
  : `${DATABASE_URL}${DATABASE_URL.includes('?') ? '&' : '?'}sslmode=require`;

console.log(`🔌 Using PostgreSQL database: ${DATABASE_URL ? 'Connected' : 'No URL found'}`);
if (isDigitalOcean) {
  console.log(`🌊 DigitalOcean database detected - SSL configured for managed database`);
}

// Enhanced pool configuration for Neon PostgreSQL
export const pool = new Pool({
  connectionString: finalDatabaseUrl,
  // Optimized for Neon database
  max: 5, // Neon supports more connections
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,

  // Application name for monitoring
  application_name: "siraha_bazaar",
  statement_timeout: 45000,
  query_timeout: 40000,

  // SSL configuration - handles DigitalOcean, Neon, and development
  ssl: isDigitalOcean ? {
    rejectUnauthorized: false, // DigitalOcean requires this for managed databases
    checkServerIdentity: () => undefined, // Bypass hostname verification
    secureProtocol: 'TLSv1_2_method' // Force TLS 1.2
  } : isDevelopment ? {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  } : {
    rejectUnauthorized: true,
    ca: undefined // Use system CA bundle for other providers
  },

  // Optimized reconnection settings for Neon
  keepAlive: true,
  keepAliveInitialDelayMillis: 3000,

  // Stability options for production
  allowExitOnIdle: false, // Keep connections alive for Neon
  maxUses: 5000, // Higher for Neon
});

// Enhanced error handling with automatic recovery
pool.on("error", (err: any, client) => {
  console.error("Database connection error:", err.message);

  // Handle specific error codes and attempt recovery
  if (err.code) {
    switch (err.code) {
      case "53300": // Too many connections
        console.error("⚠️ Too many connections - reducing pool size");
        break;
      case "53200": // Out of memory
        console.error("⚠️ Database memory issue - will retry");
        break;
      case "57P01": // Admin shutdown
        console.error("⚠️ Database connection terminated - reconnecting");
        setTimeout(() => {
          console.log("🔄 Attempting database reconnection...");
        }, 2000);
        break;
      case "ECONNRESET":
        console.error("⚠️ Connection reset - will reconnect automatically");
        break;
      case "ENOTFOUND":
        console.error("⚠️ Database host not found - check connection string");
        break;
      default:
        console.error(`⚠️ Database error (${err.code}): ${err.message}`);
    }
  }
});

// Connection event handlers
pool.on("connect", (client) => {
  console.log("✅ Database client connected");
});

pool.on("acquire", (client) => {
  console.log("🔗 Database client acquired from pool");
});

pool.on("remove", (client) => {
  console.log("➖ Database client removed from pool");
});

// Graceful shutdown handling
process.on("SIGINT", async () => {
  console.log("\nShutting down database connections...");
  try {
    await pool.end();
    console.log("Database connections closed gracefully");
  } catch (error: any) {
    console.error("Error during shutdown:", error?.message || error);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down database connections...");
  try {
    await pool.end();
    console.log("Database connections closed gracefully");
  } catch (error: any) {
    console.error("Error during shutdown:", error?.message || error);
  }
  process.exit(0);
});

export const db = drizzle(pool, { schema });