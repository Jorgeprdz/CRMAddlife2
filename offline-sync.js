// offline-sync.js
// Enterprise Offline Sync Engine

import { DB } from './db.js';
import { Network } from './network-manager.js';

class OfflineSyncEngine {

    constructor() {

        this.processing =
            false;

        this.retryLimit = 5;

        this.retryDelay = 3000;

        this.unsubscribe =
            null;
    }

    async init() {

        this.unsubscribe =
            Network.subscribe(
                async ({
                    online
                }) => {

                    if (online) {

                        await this.processQueue();
                    }
                }
            );

        console.log(
            '[SYNC] READY'
        );
    }

    destroy() {

        if (this.unsubscribe) {

            this.unsubscribe();
        }
    }

    async enqueue(operation) {

        const payload = {

            id:
                crypto.randomUUID(),

            createdAt:
                Date.now(),

            retries: 0,

            status: 'pending',

            ...operation
        };

        await DB.guardar(
            'sync_queue',
            payload
        );

        console.log(
            '[SYNC] ENQUEUED',
            payload.type
        );

        return payload.id;
    }

    async processQueue() {

        if (this.processing) {

            return;
        }

        this.processing = true;

        try {

            const queue =
                await DB.obtenerTodos(
                    'sync_queue'
                );

            const pending =
                queue.filter(
                    item =>
                        item.status === 'pending'
                );

            console.log(
                `[SYNC] PROCESSING ${pending.length}`
            );

            for (const item of pending) {

                try {

                    await this.execute(item);

                    await DB.eliminar(
                        'sync_queue',
                        item.id
                    );

                } catch (err) {

                    console.error(
                        '[SYNC ERROR]',
                        err
                    );

                    await this.handleFailure(
                        item,
                        err
                    );
                }
            }

        } finally {

            this.processing = false;
        }
    }

    async execute(item) {

        switch (item.type) {

            case 'UPSERT':

                return this.syncUpsert(item);

            case 'DELETE':

                return this.syncDelete(item);

            default:

                throw new Error(
                    '[SYNC] Unknown operation'
                );
        }
    }

    async syncUpsert(item) {

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                'Supabase unavailable'
            );
        }

        const {
            error
        } = await window
            .supabaseClient
            .from(item.table)
            .upsert(item.payload);

        if (error) {

            throw error;
        }

        console.log(
            '[SYNC] UPSERT OK',
            item.table
        );
    }

    async syncDelete(item) {

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                'Supabase unavailable'
            );
        }

        const {
            error
        } = await window
            .supabaseClient
            .from(item.table)
            .delete()
            .eq(
                'id',
                item.recordId
            );

        if (error) {

            throw error;
        }

        console.log(
            '[SYNC] DELETE OK',
            item.table
        );
    }

    async handleFailure(
        item,
        error
    ) {

        const retries =
            (item.retries || 0) + 1;

        if (
            retries >=
            this.retryLimit
        ) {

            console.error(
                '[SYNC] DEAD LETTER',
                item.id
            );

            await DB.actualizar(
                'sync_queue',
                item.id,
                {
                    ...item,
                    status: 'failed',
                    retries,
                    lastError:
                        error.message
                }
            );

            return;
        }

        await DB.actualizar(
            'sync_queue',
            item.id,
            {
                ...item,
                retries,
                lastError:
                    error.message
            }
        );

        await this.delay(
            this.retryDelay * retries
        );
    }

    delay(ms) {

        return new Promise(
            resolve => {

                setTimeout(
                    resolve,
                    ms
                );
            }
        );
    }
}

export const OfflineSync =
    new OfflineSyncEngine();