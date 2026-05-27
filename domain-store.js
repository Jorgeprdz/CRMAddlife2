// domain-store.js
// Enterprise Domain Store Runtime

class DomainStoreRuntime {

    constructor() {

        this.domains =
            new Map();

        this.subscribers =
            new Map();
    }

    createDomain(
        name,
        initialState = {}
    ) {

        if (
            this.domains.has(name)
        ) {

            return;
        }

        this.domains.set(

            name,

            structuredClone(
                initialState
            )
        );

        this.subscribers.set(
            name,
            new Set()
        );
    }

    getState(domain) {

        return (
            this.domains.get(domain)
        );
    }

    setState(
        domain,
        updater
    ) {

        const current =
            this.domains.get(domain);

        if (!current) {

            throw new Error(
                `Domain "${domain}" missing`
            );
        }

        const nextState =
            typeof updater ===
            'function'

                ? updater(current)

                : updater;

        this.domains.set(
            domain,
            nextState
        );

        this.notify(
            domain,
            nextState
        );
    }

    patchState(
        domain,
        partial
    ) {

        const current =
            this.getState(domain);

        this.setState(

            domain,

            {

                ...current,

                ...partial
            }
        );
    }

    subscribe(
        domain,
        callback
    ) {

        const listeners =
            this.subscribers.get(domain);

        if (!listeners) {

            throw new Error(
                `Domain "${domain}" missing`
            );
        }

        listeners.add(callback);

        return () => {

            listeners.delete(
                callback
            );
        };
    }

    notify(
        domain,
        state
    ) {

        const listeners =
            this.subscribers.get(domain);

        if (!listeners) {
            return;
        }

        listeners.forEach(listener => {

            try {

                listener(state);

            } catch (err) {

                console.error(

                    '[DOMAIN STORE ERROR]',

                    err
                );
            }
        });
    }

    reset(domain) {

        this.domains.delete(
            domain
        );

        this.subscribers.delete(
            domain
        );
    }

    destroy() {

        this.domains.clear();

        this.subscribers.clear();
    }
}

export const Domains =
    new DomainStoreRuntime();

export default Domains;