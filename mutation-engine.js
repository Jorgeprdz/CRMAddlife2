// mutation-engine.js

import { AppStore } from './store.js';
import { SyncRuntime } from './sync-engine.js';

class MutationEngine {

    async mutate({

        key,

        optimisticData,

        mutationFn,

        rollbackData
    }) {

        try {

            if (
                optimisticData !== undefined
            ) {

                AppStore.set(
                    key,
                    optimisticData
                );
            }

            const result =
                await mutationFn();

            return result;

        } catch (err) {

            console.error(
                '[MUTATION ERROR]',
                err
            );

            if (
                rollbackData !== undefined
            ) {

                AppStore.set(
                    key,
                    rollbackData
                );
            }

            throw err;
        }
    }

    async enqueue(type, payload) {

        await DB.enqueue({

            id: crypto.randomUUID(),

            type,

            payload,

            createdAt: Date.now(),

            retryCount: 0
        });

        SyncRuntime.broadcast(
            'QUEUE_UPDATED'
        );

        SyncRuntime.processQueue();
    }
}

export const Mutations =
    new MutationEngine();