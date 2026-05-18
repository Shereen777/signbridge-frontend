/**
 * SignBridge Service Worker
 * Strategies:
 *   - App shell (HTML/CSS/JS):      CacheFirst
 *   - Sign videos (jsDelivr):       CacheFirst, max 60 entries
 *   - Icons / manifest:             CacheFirst
 *   - Translation worker / Flask:   NetworkFirst, fallback to cache
 *   - Firebase / Firestore / Auth:  bypass (Firebase has its own offline)
 *   - MediaPipe WASM (jsdelivr):    CacheFirst (model is huge, never changes)
 */

const VERSION = 'v1';
const SHELL_CACHE = `sb-shell-${VERSION}`;
const VIDEO_CACHE = `sb-videos-${VERSION}`;
const API_CACHE   = `sb-api-${VERSION}`;
const STATIC_CACHE = `sb-static-${VERSION}`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/firebase-config.js',
  '/js/translator.js',
  '/js/wlasl-videos.js',
  '/js/asl-words.js',
  '/js/asl-classifier.js',
  '/js/sign-recognition.js',
  '/js/speech-engine.js',
  '/js/sign-display.js',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const MAX_VIDEO_ENTRIES = 60;

// ===== Install: pre-cache app shell =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ===== Activate: clean old caches =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(k => k.startsWith('sb-') && !k.endsWith(VERSION))
        .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// ===== Fetch: route based on request type =====
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Bypass Firebase / Firestore / Auth — Firebase manages its own offline
  if (url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebasestorage.googleapis.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }

  // Sign videos from jsDelivr — CacheFirst with LRU eviction
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/signbridge-videos')) {
    event.respondWith(cacheFirstWithLimit(VIDEO_CACHE, req, MAX_VIDEO_ENTRIES));
    return;
  }

  // MediaPipe WASM from jsdelivr — CacheFirst, never expires (versioned URL)
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/mediapipe/')) {
    event.respondWith(cacheFirst(STATIC_CACHE, req));
    return;
  }

  // Translation API (Google Translate or our future Worker) — NetworkFirst
  if (url.hostname.includes('translate.googleapis.com') ||
      url.hostname.includes('signbridge-translate') ||
      url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(API_CACHE, req));
    return;
  }

  // Our own static assets (same-origin) — CacheFirst
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(SHELL_CACHE, req));
    return;
  }

  // Everything else — go to network
});

// ===== Strategies =====

async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (e) {
    // Offline + nothing cached
    return new Response('Offline and not cached', { status: 503 });
  }
}

async function cacheFirstWithLimit(cacheName, req, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      await cache.put(req, resp.clone());
      // LRU eviction: if cache exceeded max, delete oldest
      const keys = await cache.keys();
      if (keys.length > maxEntries) {
        // Delete oldest entries (first ones in keys list)
        const toDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(toDelete.map(k => cache.delete(k)));
      }
    }
    return resp;
  } catch (e) {
    return new Response('Offline and not cached', { status: 503 });
  }
}

async function networkFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}
