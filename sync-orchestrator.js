// sync-orchestrator.js
// Enterprise Sync Coordinator

import { OfflineSync } from './offline-sync.js';
import { Realtime } from './realtime-engine.js';
import { AppState } from './state-manager.js';
import { EventBus } from './event-system.js';

class SyncOrchestrator {

    constructor() {

        this.syncing =
            false;
    }

    async init() {

        Realtime.subscribe(
            'cartera',
            payload => {

                this.handleRealtime(
                    'cartera',
                    payload
                );
            }
        );

        Realtime.subscribe(
            'actividad_diaria',
            payload => {

                this.handleRealtime(
                    'actividad_diaria',
                    payload
                );
            }
        );

        console.log(
            '[SYNC ORCHESTRATOR] READY'
        );
    }

    async syncNow() {

        if (
            this.syncing
        ) {

            return;
        }

        this.syncing = true;

        AppState.set(
            'syncing',
            true
        );

        try {

            await OfflineSync
                .processQueue();

            EventBus.emit(
                'sync:completed'
            );

        } catch (err) {

            console.error(
                '[SYNC FAILED]',
                err
            );

            EventBus.emit(
                'sync:failed',
                err
            );

        } finally {

            this.syncing = false;

            AppState.set(
                'syncing',
                false
            );
        }
    }

    handleRealtime(
        table,
        payload
    ) {

        console.log(
            '[REALTIME UPDATE]',
            table,
            payload
        );

        EventBus.emit(
            'realtime:update',
            {
                table,
                payload
            }
        );
    }
}

export const SyncEngine =
    new SyncOrchestrator();