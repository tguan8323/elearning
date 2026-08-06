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
    event.waitUntil(caches.open(PACKAGE_CACHE).then(async (cache) => { await cache.keys().then((requests) => Promise.all(requests.map((request) => cache.delete(request)))); await cache.addAll(event.data.urls) }))
  }
  if (event.data?.type === 'CLEAR_PACKAGE') event.waitUntil(caches.delete(PACKAGE_CACHE))
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  event.respondWith((async () => {
    const packaged = await caches.match(request, { cacheName: PACKAGE_CACHE })
    if (packaged) return packaged
    if (url.pathname.startsWith('/api/')) return fetch(request)
    const shellAsset = request.mode === 'navigate' || ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination)
    if (!shellAsset) return fetch(request)
    return fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
      return response
    }).catch(async () => (await caches.match(request)) || (request.mode === 'navigate' ? caches.match('/') : Response.error()))
  })())
})
