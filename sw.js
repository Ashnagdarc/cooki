const CACHE_NAME = 'cooki-v1';
const CORE = [
    '/', '/index.html', '/style.css', '/main.js', '/data/nigeria.json'
];
self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', (e) => {
    const { request } = e;
    if (request.method !== 'GET') return;
    e.respondWith(
        caches.match(request).then(cached => cached || fetch(request).then(res => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, copy));
            return res;
        }).catch(() => caches.match('/index.html')))
    );
});
