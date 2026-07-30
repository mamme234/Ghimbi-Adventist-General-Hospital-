// ============================================
   SERVICE WORKER - Offline Mode & Caching
// ============================================

const CACHE_VERSION = 'v1';
const CACHE_NAME = `medicare-${CACHE_VERSION}`;
const OFFLINE_CACHE = 'medicare-offline';

// Files to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/contact.html',
    '/doctors.html',
    '/departments.html',
    '/services.html',
    '/appointments.html',
    '/emergency.html',
    '/patient-login.html',
    '/doctor-login.html',
    '/admin-login.html',
    
    // CSS
    '/css/style.css',
    '/css/responsive.css',
    '/css/animations.css',
    '/css/dark-mode.css',
    '/css/dashboard.css',
    '/css/login.css',
    '/css/print.css',
    
    // JS
    '/js/main.js',
    '/js/api.js',
    '/js/auth.js',
    '/js/notifications.js',
    '/js/qr.js',
    '/js/scanner.js',
    '/js/ai.js',
    
    // Images
    '/images/logo.svg',
    '/images/logo-white.svg',
    '/images/logo-192.png',
    '/images/logo-512.png',
    '/images/favicon.ico',
    
    // Fonts & Icons
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// ============================================
// INSTALL EVENT
// ============================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(CACHE_NAME)
                .then((cache) => {
                    console.log('[SW] Caching static assets');
                    return cache.addAll(STATIC_ASSETS);
                }),
            
            // Create offline cache
            caches.open(OFFLINE_CACHE)
                .then((cache) => {
                    console.log('[SW] Creating offline cache');
                    return cache.add('/offline.html');
                })
        ])
        .then(() => {
            console.log('[SW] Installation complete');
            self.skipWaiting();
        })
    );
});

// ============================================
// ACTIVATE EVENT
// ============================================
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            return name.startsWith('medicare-') && name !== CACHE_NAME;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),
            
            // Claim clients
            self.clients.claim()
        ])
        .then(() => {
            console.log('[SW] Activation complete');
        })
    );
});

// ============================================
// FETCH EVENT
// ============================================
self.addEventListener('fetch', (event) => {
    const request = event.request;
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // Skip browser extensions and analytics
    if (request.url.includes('chrome-extension') || 
        request.url.includes('google-analytics') ||
        request.url.includes('doubleclick')) {
        event.respondWith(fetch(request));
        return;
    }

    // Network-first strategy for API calls
    if (request.url.includes('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Cache-first strategy for static assets
    if (request.url.match(/\.(css|js|json|woff|woff2|ttf|eot)$/)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // Stale-while-revalidate for images and other assets
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
        event.respondWith(staleWhileRevalidateStrategy(request));
        return;
    }

    // Default: Network with fallback
    event.respondWith(networkWithFallbackStrategy(request));
});

// ============================================
   CACHING STRATEGIES
// ============================================

// Network First - For API calls
async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        return cachedResponse || new Response('Network unavailable', { status: 503 });
    }
}

// Cache First - For static assets
async function cacheFirstStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Asset not available offline', { status: 404 });
    }
}

// Stale While Revalidate - For images
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => {
            // Network failed, return cached if available
        });
    
    return cachedResponse || await fetchPromise || new Response('Image not available', { status: 404 });
}

// Network With Fallback - Default
async function networkWithFallbackStrategy(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.headers.get('accept').includes('text/html')) {
            const offlinePage = await cache.match('/offline.html');
            if (offlinePage) {
                return offlinePage;
            }
        }
        
        return new Response('Offline - Please connect to the internet', { status: 503 });
    }
}

// ============================================
// BACKGROUND SYNC
// ============================================
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    try {
        // Get pending data from IndexedDB
        const db = await openDB();
        const pendingData = await getPendingData(db);
        
        for (const data of pendingData) {
            try {
                await sendDataToServer(data);
                await markDataSynced(db, data.id);
            } catch (error) {
                console.error('Sync failed for data:', data.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync error:', error);
    }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch {
            data = {
                title: 'MediCare Hospital',
                body: event.data.text() || 'New notification',
                icon: '/images/logo-192.png',
                badge: '/images/logo-192.png'
            };
        }
    }

    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/images/logo-192.png',
        badge: data.badge || '/images/logo-192.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: data.actions || [],
        tag: data.tag || Date.now().toString(),
        requireInteraction: data.persistent || false,
        silent: data.silent || false
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'MediCare Hospital', options)
    );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const clickAction = event.notification.data?.action || 'open';
    const url = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        })
        .then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            return clients.openWindow(url);
        })
    );
});

// ============================================
// OFFLINE PAGE
// ============================================
// Create offline page if not exists
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(OFFLINE_CACHE)
            .then((cache) => {
                const offlineHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Offline - MediCare Hospital</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #f8fafc;
                            color: #1e293b;
                            padding: 20px;
                        }
                        .offline-container {
                            text-align: center;
                            max-width: 400px;
                            padding: 40px;
                            background: white;
                            border-radius: 16px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                        }
                        .offline-icon {
                            font-size: 64px;
                            color: #94a3b8;
                            margin-bottom: 20px;
                        }
                        h1 {
                            font-size: 24px;
                            margin-bottom: 10px;
                        }
                        p {
                            color: #64748b;
                            line-height: 1.6;
                            margin-bottom: 20px;
                        }
                        .retry-btn {
                            background: #2563eb;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 25px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        }
                        .retry-btn:hover {
                            background: #1d4ed8;
                            transform: translateY(-2px);
                        }
                    </style>
                </head>
                <body>
                    <div class="offline-container">
                        <div class="offline-icon">📡</div>
                        <h1>You're Offline</h1>
                        <p>Please check your internet connection and try again.</p>
                        <button class="retry-btn" onclick="location.reload()">
                            Try Again
                        </button>
                    </div>
                </body>
                </html>
                `;
                return cache.put('/offline.html', new Response(offlineHTML, {
                    headers: { 'Content-Type': 'text/html' }
                }));
            })
    );
});

// ============================================
// INDEXEDDB HELPERS
// ============================================
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MediCareSync', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('pendingData')) {
                db.createObjectStore('pendingData', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getPendingData(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingData'], 'readonly');
        const store = transaction.objectStore('pendingData');
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function markDataSynced(db, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['pendingData'], 'readwrite');
        const store = transaction.objectStore('pendingData');
        const request = store.delete(id);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function sendDataToServer(data) {
    return fetch('/api/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
                      }
