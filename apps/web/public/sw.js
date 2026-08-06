const CACHE = 'family-english-shell-v1'
const PACKAGE_CACHE_PREFIX = 'family-english-package-'
const PACKAGE_META_CACHE = 'family-english-package-meta-v1'
const PACKAGE_ACTIVE_KEY = '/__family-english-active-package__'
const SHELL = ['/', '/learn', '/manifest.webmanifest', '/icon.svg']

async function activePackageName() {
  const metadata = await caches.open(PACKAGE_META_CACHE)
  const marker = await metadata.match(PACKAGE_ACTIVE_KEY)
  return marker ? marker.text() : null
}

async function clearPackageCaches(except) {
  const keys = await caches.keys()
  await Promise.all(keys.filter((key) => key.startsWith(PACKAGE_CACHE_PREFIX) && key !== except).map((key) => caches.delete(key)))
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== PACKAGE_META_CACHE && !key.startsWith(PACKAGE_CACHE_PREFIX)).map((key) => caches.delete(key)))))
  self.clients.claim()
})
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_PACKAGE' && Array.isArray(event.data.urls)) {
    event.waitUntil((async () => {
      const packageName = `${PACKAGE_CACHE_PREFIX}${event.data.version || 'pending'}`
      await caches.delete(packageName)
      const temporary = await caches.open(packageName)
      try {
        await temporary.addAll(event.data.urls)
        const metadata = await caches.open(PACKAGE_META_CACHE)
        await metadata.put(PACKAGE_ACTIVE_KEY, new Response(packageName))
        await clearPackageCaches(packageName)
        event.ports?.[0]?.postMessage({ ok: true })
      } catch {
        await caches.delete(packageName)
        event.ports?.[0]?.postMessage({ ok: false })
      }
    })())
  }
  if (event.data?.type === 'CLEAR_PACKAGE') {
    event.waitUntil((async () => {
      await caches.delete(PACKAGE_META_CACHE)
      await clearPackageCaches()
    })())
  }
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  event.respondWith((async () => {
    const packageName = await activePackageName()
    const packaged = packageName ? await caches.match(request, { cacheName: packageName }) : null
    if (packaged) return packaged
    if (url.pathname.startsWith('/api/')) return fetch(request)
    const shellAsset = request.mode === 'navigate' || ['style', 'script', 'font', 'image', 'manifest'].includes(request.destination)
    if (!shellAsset) return fetch(request)
    return fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
      return response
    }).catch(async () => (await caches.match(request, { cacheName: CACHE })) || (request.mode === 'navigate' ? caches.match('/', { cacheName: CACHE }) : Response.error()))
  })())
})
