// cache-runtime.js
// Enterprise Memory Cache Runtime

class CacheRuntimeEngine {

    constructor() {

        this.cache =
            new Map();

        this.defaultTTL =
            60000;
    }

    set(
        key,
        value,
        ttl = this.defaultTTL
    ) {

        this.cache.set(

            key,

            {

                value,

                expires:
                    Date.now() + ttl
            }
        );
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

            this.cache.delete(
                key
            );

            return null;
        }

        return entry.value;
    }

    delete(key) {

        this.cache.delete(
            key
        );
    }

    clear() {

        this.cache.clear();
    }

    has(key) {

        return this.cache.has(
            key
        );
    }
}

export const CacheRuntime =
    new CacheRuntimeEngine();

export default CacheRuntime;