// query-runtime.js
// Enterprise Query Runtime

import {
    CacheRuntime
} from './cache-runtime.js';

class QueryRuntimeEngine {

    async query({

        key,

        ttl,

        query
    }) {

        const cached =
            CacheRuntime.get(
                key
            );

        if (cached) {

            return cached;
        }

        const result =
            await query();

        CacheRuntime.set(

            key,

            result,

            ttl
        );

        return result;
    }

    invalidate(key) {

        CacheRuntime.delete(
            key
        );
    }
}

export const QueryRuntime =
    new QueryRuntimeEngine();

export default QueryRuntime;