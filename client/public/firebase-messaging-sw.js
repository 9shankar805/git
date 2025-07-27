// Firebase Messaging Service Worker
// Handles background push notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration - using your actual config
const firebaseConfig = {
  apiKey: "AIzaSyBbHSV2EJZ9BPE1C1ZC4_ZNYwFYJIR9VSo",
  authDomain: "myweb-1c1f37b3.firebaseapp.com",
  projectId: "myweb-1c1f37b3",
  storageBucket: "myweb-1c1f37b3.firebasestorage.app",
  messagingSenderId: "774950702828",
  appId: "1:774950702828:web:09c2dfc1198d45244a9fc9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Siraha Bazaar';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/assets/icon2.png',
    badge: '/assets/icon2.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/assets/icon2.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icon2.png'
      }
    ],
    data: payload.data || {}
  };

  // Save notification to database when received in background
  try {
    // Try to save to notification center via background sync
    if ('serviceWorker' in navigator) {
      self.registration.sync.register('save-notification');
      
      // Store notification data for sync
      const notificationData = {
        title: notificationTitle,
        body: payload.notification?.body || 'You have a new notification',
        type: payload.data?.type || 'firebase',
        timestamp: Date.now()
      };
      
      // Store in IndexedDB or local storage for background sync
      if (typeof indexedDB !== 'undefined') {
        const request = indexedDB.open('FCMNotifications', 1);
        request.onsuccess = function(event) {
          const db = event.target.result;
          const transaction = db.transaction(['notifications'], 'readwrite');
          const store = transaction.objectStore('notifications');
          store.add(notificationData);
        };
      }
    }
  } catch (error) {
    console.error('Failed to save background notification:', error);
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (clients.openWindow) {
        const urlToOpen = event.notification.data?.url || '/';
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Service Worker cache management
const CACHE_NAME = 'siraha-bazaar-fcm-v1.1';
const urlsToCache = [
  '/',
  '/assets/icon2.png',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker activating');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});