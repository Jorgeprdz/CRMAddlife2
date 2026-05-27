// store.js
// Reactive State Runtime

class Store {

    constructor() {

        this.state = new Map();

        this.listeners = new Map();

        this.version = 0;
    }

    get(key) {

        return this.state.get(key);
    }

    set(key, value) {

        const oldValue =
            this.state.get(key);

        if (
            Object.is(oldValue, value)
        ) {
            return;
        }

        this.state.set(key, value);

        this.version++;

        this.emit(key, value);
    }

    update(key, updater) {

        const current =
            this.get(key);

        const next =
            updater(current);

        this.set(key, next);
    }

    subscribe(key, callback) {

        if (!this.listeners.has(key)) {

            this.listeners.set(
                key,
                new Set()
            );
        }

        const bucket =
            this.listeners.get(key);

        bucket.add(callback);

        return () => {

            bucket.delete(callback);
        };
    }

    emit(key, value) {

        const bucket =
            this.listeners.get(key);

        if (!bucket) {
            return;
        }

        bucket.forEach(listener => {

            try {

                listener(value);

            } catch (err) {

                console.error(
                    '[STORE LISTENER ERROR]',
                    err
                );
            }
        });
    }

    clear() {

        this.state.clear();

        this.listeners.clear();
    }
}

export const AppStore =
    new Store();