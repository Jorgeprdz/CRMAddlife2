// route-transition-manager.js
// Enterprise Route Lifecycle Controller

import { Memory } from './memory-manager.js';

class RouteTransitionManager {

    constructor() {

        this.currentRoute =
            null;

        this.transitioning =
            false;
    }

    async transition(
        routeName,
        callback
    ) {

        if (
            this.transitioning
        ) {

            console.warn(
                '[ROUTE] BLOCKED'
            );

            return;
        }

        this.transitioning =
            true;

        try {

            Memory.cleanup();

            document.body.classList.add(
                'route-loading'
            );

            await callback();

            this.currentRoute =
                routeName;

        } catch (err) {

            console.error(
                '[ROUTE ERROR]',
                err
            );

            throw err;

        } finally {

            document.body.classList.remove(
                'route-loading'
            );

            this.transitioning =
                false;
        }
    }
}

export const RouteTransition =
    new RouteTransitionManager();