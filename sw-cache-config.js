// sw-cache-config.js
// Enterprise SW Cache Config

export const CACHE_CONFIG = {

    VERSION:
        'v6-enterprise-1',

    STATIC_CACHE:
        'static-v6-enterprise-1',

    RUNTIME_CACHE:
        'runtime-v6-enterprise-1',

    STATIC_ASSETS: [

        '/',
        '/index.html',
        '/styles.css',
        '/app.js'
    ],

    NETWORK_FIRST: [

        '/api/',
        '/auth/'
    ],

    CACHE_FIRST: [

        '.png',
        '.jpg',
        '.svg',
        '.woff2'
    ]
};