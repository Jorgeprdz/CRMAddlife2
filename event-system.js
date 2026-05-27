// event-system.js
// Enterprise Global Event Bus

class EventSystem {

    constructor() {

        this.events =
            new Map();
    }

    on(
        event,
        listener
    ) {

        if (
            !this.events.has(event)
        ) {

            this.events.set(
                event,
                new Set()
            );
        }

        this.events
            .get(event)
            .add(listener);

        return () => {

            this.off(
                event,
                listener
            );
        };
    }

    once(
        event,
        listener
    ) {

        const wrapper =
            payload => {

                listener(payload);

                this.off(
                    event,
                    wrapper
                );
            };

        this.on(
            event,
            wrapper
        );
    }

    off(
        event,
        listener
    ) {

        if (
            !this.events.has(event)
        ) {

            return;
        }

        this.events
            .get(event)
            .delete(listener);
    }

    emit(
        event,
        payload = {}
    ) {

        if (
            !this.events.has(event)
        ) {

            return;
        }

        this.events
            .get(event)
            .forEach(listener => {

                try {

                    listener(payload);

                } catch (err) {

                    console.error(
                        '[EVENT ERROR]',
                        event,
                        err
                    );
                }
            });
    }

    clear() {

        this.events.clear();
    }
}

export const EventBus =
    new EventSystem();