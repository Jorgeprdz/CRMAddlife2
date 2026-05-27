// service-worker.js
// Enterprise Offline-First Service Worker

importScripts(
    '/sw-cache-config.js'
);

const STATIC =
    CACHE_CONFIG.STATIC_CACHE;

const RUNTIME =
    CACHE_CONFIG.RUNTIME_CACHE;

self.addEventListener(
    'install',
    event => {

        event.waitUntil(
            caches.open(STATIC)
                .then(cache => {

                    return cache.addAll(
                        CACHE_CONFIG.STATIC_ASSETS
                    );
                })
        );

        self.skipWaiting();
    }
);

self.addEventListener(
    'activate',
    event => {

        event.waitUntil(

            caches.keys()
                .then(keys => {

                    return Promise.all(

                        keys.map(key => {

                            if (
                                ![
                                    STATIC,
                                    RUNTIME
                                ].includes(key)
                            ) {

                                return caches.delete(
                                    key
                                );
                            }
                        })
                    );
                })
        );

        self.clients.claim();
    }
);

self.addEventListener(
    'fetch',
    event => {

        const req =
            event.request;

        if (
            req.method !== 'GET'
        ) {

            return;
        }

        event.respondWith(

            caches.match(req)
                .then(async cached => {

                    try {

                        const fresh =
                            await fetch(req);

                        const cache =
                            await caches.open(
                                RUNTIME
                            );

                        cache.put(
                            req,
                            fresh.clone()
                        );

                        return fresh;

                    } catch {

                        return cached;
                    }
                })
        );
    }
);