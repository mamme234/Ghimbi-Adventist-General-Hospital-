// ========== SERVICE WORKER ==========
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `gimbi-hospital-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/about.html',
    '/departments.html',
    '/doctors.html',
    '/services.html',
    '/appointments.html',
    '/emergency.html',
    '/pharmacy.html',
    '/laboratory.html',
    '/radiology.html',
    '/contact.html',
    '/news.html',
    '/gallery.html',
    '/careers.html',
    '/patient-login.html',
    '/staff-login.html',
    '/admin-login.html',
    '/manifest.json',
    '/css/style.css',
    '/css/theme.css',
    '/css/responsive.css',
    '/js/main.js',
    '/js/theme.js',
    '/js/ai-assistant.js',
    '/js/animations.js',
    '/assets/logo.svg',
    '/assets/logo-white.svg',
    '/assets/favicon.png',
    '/assets/apple-touch-icon.png'
];

// Dynamic assets that should be cached
const DYNAMIC_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Urbanist:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.socket.io/4.7.0/socket.io.min.js',
    'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

// ========== INSTALL EVENT ==========
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Static assets cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

// ========== ACTIVATE EVENT ==========
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => {
                            console.log(`🗑️ Deleting old cache: ${name}`);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// ========== FETCH EVENT ==========
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip cross-origin requests except for allowed CDNs
    if (url.origin !== self.location.origin) {
        // Allow CDN resources
        if (url.hostname.includes('cdnjs.cloudflare.com') || 
            url.hostname.includes('fonts.googleapis.com') ||
            url.hostname.includes('fonts.gstatic.com') ||
            url.hostname.includes('cdn.jsdelivr.net')) {
            // Use cache-first strategy for CDN
            event.respondWith(cacheFirst(request));
        }
        return;
    }

    // Skip API requests - network first
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // For HTML pages - network first with fallback
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
        event.respondWith(networkFirst(request));
        return;
    }

    // For static assets - cache first
    if (url.pathname.startsWith('/css/') ||
        url.pathname.startsWith('/js/') ||
        url.pathname.startsWith('/assets/') ||
        url.pathname.startsWith('/images/')) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Default - stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
});

// ========== CACHING STRATEGIES ==========

// Cache First Strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Network First Strategy
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback for HTML pages
        if (request.headers.get('Accept').includes('text/html')) {
            return caches.match('/offline.html');
        }
        
        return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(response => {
            if (response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => {
            // Network error, return cached if available
        });
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    return fetchPromise;
}

// ========== BACKGROUND SYNC ==========
self.addEventListener('sync', event => {
    if (event.tag === 'sync-appointments') {
        event.waitUntil(syncAppointments());
    }
});

async function syncAppointments() {
    // Sync offline appointments when back online
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
        if (request.url.includes('/api/appointments')) {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.delete(request);
                }
            } catch (error) {
                console.error('Sync failed:', error);
            }
        }
    }
}

// ========== PUSH NOTIFICATIONS ==========
self.addEventListener('push', event => {
    let data = {};
    
    try {
        data = event.data.json();
    } catch {
        data = {
            title: 'Gimbi Hospital',
            body: 'You have a new notification',
            icon: '/assets/icons/icon-192x192.png',
            badge: '/assets/icons/badge-72x72.png'
        };
    }
    
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/assets/icons/icon-192x192.png',
        badge: data.badge || '/assets/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        actions: data.actions || [
            {
                action: 'open',
                title: 'View Details'
            },
            {
                action: 'close',
                title: 'Dismiss'
            }
        ],
        tag: data.tag || 'notification',
        renotify: true,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Gimbi Adventist General Hospital',
            options
        )
    );
});

// ========== NOTIFICATION CLICK ==========
self.addEventListener('notificationclick', event => {
    const notification = event.notification;
    const action = event.action;
    
    notification.close();
    
    if (action === 'open' || action === 'default') {
        const url = notification.data?.url || '/';
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then(clients => {
                    // Check if there's already a window/tab open with the target URL
                    for (const client of clients) {
                        if (client.url === url && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // If not, open a new window/tab
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

// ========== MESSAGE HANDLER ==========
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ========== PERIODIC BACKGROUND SYNC ==========
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-cache') {
        event.waitUntil(updateCache());
    }
});

async function updateCache() {
    const cache = await caches.open(CACHE_NAME);
    const requests = STATIC_ASSETS.map(url => new Request(url));
    
    try {
        const responses = await Promise.all(
            requests.map(request => fetch(request))
        );
        
        await Promise.all(
            responses.map((response, index) => {
                if (response.status === 200) {
                    return cache.put(requests[index], response);
                }
            })
        );
        
        console.log('🔄 Cache updated successfully');
    } catch (error) {
        console.error('❌ Cache update failed:', error);
    }
}

// ========== OFFLINE PAGE ==========
// Create offline page if not exists
const offlineHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Gimbi Hospital</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 500px;
            text-align: center;
            background: white;
            padding: 48px 32px;
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }
        .icon {
            font-size: 72px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 28px;
            color: #1a1a2e;
            margin-bottom: 12px;
        }
        p {
            color: #4a4a6a;
            margin-bottom: 24px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            padding: 12px 32px;
            background: #0a6e4a;
            color: white;
            border: none;
            border-radius: 9999px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #075a3b;
            transform: translateY(-2px);
        }
        .status {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e8edf2;
            font-size: 14px;
            color: #8a8aaa;
        }
        .status .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #dc3545;
            margin-right: 8px;
            animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.8); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🏥</div>
        <h1>You're Offline</h1>
        <p>
            It looks like you're not connected to the internet. 
            Some features may be unavailable until you're back online.
        </p>
        <button class="btn" onclick="window.location.reload()">
            Try Again
        </button>
        <div class="status">
            <span class="dot"></span>
            <span>No internet connection</span>
        </div>
    </div>
</body>
</html>
`;

// Cache offline page
caches.open(CACHE_NAME).then(cache => {
    cache.put('/offline.html', new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html' }
    }));
});
