// sync-engine.js
// Enterprise Sync Runtime

import { Runtime } from './runtime.js';

const SYNC_LOCK =
    'addlife-sync-lock';

class SyncEngine {

    constructor() {

        this.channel = null;

        this.processing = false;

        this.retryDelay = 2000;

        this.maxRetries = 5;
    }

    init() {

        this.initBroadcast();

        this.bindConnectivity();
    }

    initBroadcast() {

        if (
            !('BroadcastChannel' in window)
        ) {
            return;
        }

        this.channel =
            new BroadcastChannel(
                'addlife-runtime'
            );

        this.channel.onmessage =
            this.onMessage.bind(this);
    }

    onMessage(event) {

        const {
            type,
            payload
        } = event.data || {};

        switch (type) {

            case 'QUEUE_UPDATED':

                this.processQueue();

                break;

            case 'FORCE_REFRESH':

                location.reload();

                break;
        }
    }

    broadcast(type, payload = {}) {

        this.channel?.postMessage({
            type,
            payload
        });
    }

    bindConnectivity() {

        window.addEventListener(
            'online',
            () => {

                this.processQueue();
            }
        );
    }

    async acquireLock() {

        if (
            !navigator.locks
        ) {

            return true;
        }

        return navigator.locks.request(
            SYNC_LOCK,
            {
                ifAvailable: true
            },
            lock => !!lock
        );
    }

    async processQueue() {

        if (
            this.processing
        ) {
            return;
        }

        const hasLock =
            await this.acquireLock();

        if (!hasLock) {
            return;
        }

        this.processing = true;

        try {

            const queue =
                await DB.getQueue();

            for (
                const item of queue
            ) {

                try {

                    await this.processItem(
                        item
                    );

                    await DB.removeQueueItem(
                        item.id
                    );

                } catch (err) {

                    console.error(
                        '[SYNC ITEM ERROR]',
                        err
                    );

                    await this.handleRetry(
                        item,
                        err
                    );
                }
            }

        } catch (err) {

            console.error(
                '[SYNC ENGINE ERROR]',
                err
            );

        } finally {

            this.processing = false;
        }
    }

    async processItem(item) {

        if (
            !navigator.onLine
        ) {

            throw new Error(
                'offline'
            );
        }

        switch (item.type) {

            case 'UPSERT_PROSPECT':

                return DB.syncProspect(
                    item.payload
                );

            case 'DELETE_PROSPECT':

                return DB.deleteProspectRemote(
                    item.payload.id
                );
        }
    }

    async handleRetry(item) {

        item.retryCount =
            (item.retryCount || 0) + 1;

        if (
            item.retryCount >=
            this.maxRetries
        ) {

            item.dead = true;

            await DB.moveToDeadLetter(
                item
            );

            return;
        }

        item.nextRetryAt =
            Date.now() +
            this.retryDelay *
            item.retryCount;

        await DB.updateQueueItem(
            item
        );
    }
}

export const SyncRuntime =
    new SyncEngine();