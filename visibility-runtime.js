// visibility-runtime.js

class VisibilityRuntime {

    constructor() {

        this.observer = null;

        this.callbacks = new WeakMap();

        this.init();
    }

    init() {

        this.observer =
            new IntersectionObserver(

                entries => {

                    entries.forEach(entry => {

                        const callback =
                            this.callbacks.get(
                                entry.target
                            );

                        if (!callback) {
                            return;
                        }

                        callback(entry);
                    });

                },

                {
                    threshold: 0.1
                }
            );
    }

    observe(element, callback) {

        this.callbacks.set(
            element,
            callback
        );

        this.observer.observe(
            element
        );
    }

    unobserve(element) {

        this.observer.unobserve(
            element
        );

        this.callbacks.delete(
            element
        );
    }
}

export const VisibilityEngine =
    new VisibilityRuntime();