// base-repository.js
// Enterprise Repository Base

import {
    Telemetry
} from './telemetry.js';

export class BaseRepository {

    constructor(entity) {

        this.entity =
            entity;

        this.cache =
            new Map();

        this.cacheTTL =
            60000;
    }

    async execute(operation) {

        const start =
            performance.now();

        try {

            const result =
                await operation();

            Telemetry.track(

                'repository_success',

                {

                    entity:
                        this.entity,

                    duration:

                        performance.now() -
                        start
                }
            );

            return result;

        } catch (err) {

            Telemetry.track(

                'repository_error',

                {

                    entity:
                        this.entity,

                    message:
                        err.message
                }
            );

            throw err;
        }
    }

    getCache(key) {

        const entry =
            this.cache.get(key);

        if (!entry) {
            return null;
        }

        const isExpired =

            Date.now() -
            entry.timestamp >

            this.cacheTTL;

        if (isExpired) {

            this.cache.delete(key);

            return null;
        }

        return entry.value;
    }

    setCache(
        key,
        value
    ) {

        this.cache.set(

            key,

            {

                value,

                timestamp:
                    Date.now()
            }
        );
    }

    invalidate(key) {

        if (key) {

            this.cache.delete(key);

            return;
        }

        this.cache.clear();
    }
}