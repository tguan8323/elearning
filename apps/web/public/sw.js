const CACHE = 'family-english-shell-v1'
const PACKAGE_CACHE = 'family-english-package-v1'
const SHELL = ['/', '/learn', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))))
  self.clients.claim()
})
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_PACKAGE' && Array.isArray(event.data.urls)) {
    event.waitUntil(caches.open(PACKAGE_CACHE).then((cache) => cache.addAll(event.data.urls)))
  }
  if (event.data?.type === 'CLEAR_PACKAGE') event.waitUntil(caches.delete(PACKAGE_CACHE))
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return
  const shellAsset = request.mode === 'navigate' || ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination)
  if (!shellAsset) return
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
    return response
  }).catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? caches.match('/') : Response.error())))
})
