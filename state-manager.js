// state-manager.js
// Enterprise Global State Manager

import { EventBus } from './event-system.js';

class StateManager {

    constructor() {

        this.state = {

            user: null,

            route: null,

            online: navigator.onLine,

            syncing: false,

            loading: false,

            cartera: [],

            actividad: [],

            dashboard: {}
        };

        this.listeners =
            new Set();
    }

    get(key) {

        return this.state[key];
    }

    set(
        key,
        value
    ) {

        this.state[key] =
            value;

        this.notify(
            key,
            value
        );
    }

    patch(payload = {}) {

        Object.keys(payload)
            .forEach(key => {

                this.state[key] =
                    payload[key];

                this.notify(
                    key,
                    payload[key]
                );
            });
    }

    notify(
        key,
        value
    ) {

        this.listeners
            .forEach(listener => {

                try {

                    listener(
                        key,
                        value,
                        this.state
                    );

                } catch (err) {

                    console.error(
                        '[STATE ERROR]',
                        err
                    );
                }
            });

        EventBus.emit(
            'state:updated',
            {
                key,
                value
            }
        );
    }

    subscribe(listener) {

        this.listeners.add(
            listener
        );

        return () => {

            this.listeners.delete(
                listener
            );
        };
    }

    snapshot() {

        return structuredClone(
            this.state
        );
    }

    reset() {

        this.state = {};

        this.listeners.clear();
    }
}

export const AppState =
    new StateManager();