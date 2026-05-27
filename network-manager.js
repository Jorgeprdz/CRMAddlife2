// network-manager.js
// Enterprise Network Intelligence

import { EventBus } from './event-system.js';
import { AppState } from './state-manager.js';

class NetworkManager {

    constructor() {

        this.online =
            navigator.onLine;

        this.latency =
            null;

        this.interval =
            null;
    }

    init() {

        window.addEventListener(
            'online',
            () => this.handleOnline()
        );

        window.addEventListener(
            'offline',
            () => this.handleOffline()
        );

        this.startHealthCheck();

        console.log(
            '[NETWORK] READY'
        );
    }

    async ping() {

        const start =
            performance.now();

        try {

            await fetch(
                '/favicon.ico',
                {
                    method: 'HEAD',
                    cache: 'no-store'
                }
            );

            this.latency =
                Math.round(
                    performance.now() - start
                );

            return true;

        } catch {

            return false;
        }
    }

    startHealthCheck() {

        this.interval =
            setInterval(
                async () => {

                    const healthy =
                        await this.ping();

                    if (
                        healthy &&
                        !this.online
                    ) {

                        this.handleOnline();
                    }

                    if (
                        !healthy &&
                        this.online
                    ) {

                        this.handleOffline();
                    }

                    EventBus.emit(
                        'network:latency',
                        {
                            latency:
                                this.latency
                        }
                    );

                },
                15000
            );
    }

    handleOnline() {

        this.online = true;

        AppState.set(
            'online',
            true
        );

        EventBus.emit(
            'network:online'
        );
    }

    handleOffline() {

        this.online = false;

        AppState.set(
            'online',
            false
        );

        EventBus.emit(
            'network:offline'
        );
    }

    destroy() {

        clearInterval(
            this.interval
        );
    }
}

export const Network =
    new NetworkManager();