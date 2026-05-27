// core-event-bus.js
// Enterprise Event Bus Runtime
// Production Hardened

class CoreEventBusRuntime {

    constructor() {

        this.events =
            new Map();

        this.debug =
            false;

        this.maxListeners =
            100;
    }

    on(
        event,
        callback
    ) {

        this.validate(
            event,
            callback
        );

        if (
            !this.events.has(event)
        ) {

            this.events.set(
                event,
                new Set()
            );
        }

        const listeners =
            this.events.get(event);

        if (
            listeners.size >=
            this.maxListeners
        ) {

            console.warn(

                '[CORE EVENT BUS] MAX LISTENERS',

                event
            );
        }

        listeners.add(callback);

        return () => {

            this.off(
                event,
                callback
            );
        };
    }

    once(
        event,
        callback
    ) {

        this.validate(
            event,
            callback
        );

        const unsubscribe =
            this.on(

                event,

                payload => {

                    unsubscribe();

                    callback(payload);
                }
            );

        return unsubscribe;
    }

    off(
        event,
        callback
    ) {

        const listeners =
            this.events.get(event);

        if (!listeners) {
            return;
        }

        listeners.delete(
            callback
        );

        if (
            listeners.size === 0
        ) {

            this.events.delete(
                event
            );
        }
    }

    emit(
        event,
        payload = {}
    ) {

        const listeners =
            this.events.get(event);

        if (!listeners) {
            return;
        }

        if (this.debug) {

            console.log(

                '[CORE EVENT BUS]',

                event,

                payload
            );
        }

        const queue =
            [...listeners];

        for (
            const listener
            of queue
        ) {

            try {

                listener(payload);

            } catch (err) {

                console.error(

                    '[CORE EVENT BUS ERROR]',

                    {

                        event,

                        message:
                            err.message,

                        stack:
                            err.stack
                    }
                );
            }
        }
    }

    clear(event) {

        if (event) {

            this.events.delete(
                event
            );

            return;
        }

        this.events.clear();
    }

    listenerCount(event) {

        return (
            this.events.get(event)
                ?.size || 0
        );
    }

    hasListeners(event) {

        return (
            this.listenerCount(
                event
            ) > 0
        );
    }

    enableDebug() {

        this.debug = true;
    }

    disableDebug() {

        this.debug = false;
    }

    destroy() {

        this.events.clear();

        this.debug = false;
    }

    validate(
        event,
        callback
    ) {

        if (
            typeof event !==
            'string'
        ) {

            throw new Error(
                'Invalid event name'
            );
        }

        if (
            typeof callback !==
            'function'
        ) {

            throw new Error(
                'Invalid event callback'
            );
        }
    }
}

export const CoreEventBus =
    new CoreEventBusRuntime();

export default CoreEventBus;