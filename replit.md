# Siraha Bazaar - Multi-Vendor E-commerce Platform

## Overview
Siraha Bazaar is a comprehensive multi-vendor e-commerce marketplace designed to provide a seamless shopping experience for customers and robust management tools for vendors. The platform supports real-time order tracking, delivery management, and extensive administrative controls. Its vision is to be a leading online marketplace, empowering multiple vendors to reach a wider customer base efficiently.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React with TypeScript
- **UI**: Shadcn/UI components, Radix UI primitives, Tailwind CSS
- **State Management**: TanStack Query
- **Build Tool**: Vite
- **Maps**: HERE Maps API for location and tracking

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (hosted on Neon)
- **ORM**: Drizzle ORM
- **Real-time**: WebSocket for live tracking and notifications
- **Authentication**: JWT-based with bcrypt

### Database Design
- **Primary**: PostgreSQL with Drizzle ORM for schema and migrations.
- **Connection**: pg Pool for efficient connections.

### Key Components & Features
- **User Management**: Multi-role support (customer, shopkeeper, delivery partner, admin) with secure authentication, email verification, and role-based access control. Admin approval for vendor accounts.
- **Store Management**: Multi-vendor support with inventory, product catalog, and analytics.
- **Order Processing**: Shopping cart, multi-vendor order splitting, real-time order tracking, and multiple payment options.
- **Real-Time Delivery Tracking**: HERE Maps integration for route optimization, live GPS tracking via WebSockets, and dynamic ETA calculations.
- **Admin Dashboard**: Comprehensive control over users, orders, platform analytics, and system configurations (delivery zones, fees).
- **Notification System**: Real-time push notifications via Firebase Cloud Messaging (FCM) and email (SendGrid) for various events (order confirmations, delivery assignments, promotions). Supports both web and Android app integrations.
- **Image Upload System**: Enhanced with 200KB compression and intelligent fallbacks for product and store images. Includes local image search integration (Google Images, Pixabay).
- **Review System**: Professional Daraz/Flipkart-style product and store review system with rating overviews, distribution visualization, helpful voting, and one-like-per-user restriction.
- **Search System**: Intelligent location-aware search with OpenStreetMap integration and comprehensive filtering for both shopping and food modes, including mode-specific filters.
- **Delivery Partner Features**: Streamlined registration with document upload, professional dashboard with performance analytics, incentives, and real-time delivery alerts. First-accept-first-serve assignment system.
- **Live Tracking**: Professional Leaflet maps integration with animated markers, real-time route simulation, and ETA calculations.
- **Payment Integration**: Supports multiple payment methods (Stripe, PayPal) with PCI compliance.
- **SEO & PWA**: Comprehensive SEO meta tags, manifest.json for PWA functionality, and structured data for improved search indexing.

## External Dependencies
- **HERE Maps API**: Location services, routing, geocoding, and map display.
- **Stripe**: Primary payment gateway.
- **PayPal SDK**: Alternative payment method.
- **SendGrid**: Transactional email delivery service.
- **Neon PostgreSQL**: Cloud-hosted database service (primary production database).
- **Firebase Cloud Messaging (FCM)**: Push notification services for web and Android applications.
- **Google Custom Search API / Pixabay API**: Product and image search functionality.
- **OpenStreetMap Nominatim**: Free geocoding service for location search.