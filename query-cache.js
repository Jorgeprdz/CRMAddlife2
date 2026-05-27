// query-cache.js

class QueryCache {

    constructor() {

        this.cache = new Map();
    }

    set(key, data, ttl = 30000) {

        this.cache.set(key, {

            data,

            expires:
                Date.now() + ttl
        });
    }

    get(key) {

        const entry =
            this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (
            Date.now() >
            entry.expires
        ) {

            this.cache.delete(key);

            return null;
        }

        return entry.data;
    }

    invalidate(key) {

        this.cache.delete(key);
    }

    clear() {

        this.cache.clear();
    }
}

export const QueryRuntime =
    new QueryCache();