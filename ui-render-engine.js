// ui-render-engine.js
// Enterprise Smart Rendering Engine

class UIRenderEngine {

    constructor() {

        this.queue =
            new Set();

        this.scheduled =
            false;
    }

    schedule(task) {

        this.queue.add(task);

        if (
            this.scheduled
        ) {

            return;
        }

        this.scheduled = true;

        requestAnimationFrame(() => {

            this.flush();
        });
    }

    flush() {

        this.queue
            .forEach(task => {

                try {

                    task();

                } catch (err) {

                    console.error(
                        '[UI RENDER ERROR]',
                        err
                    );
                }
            });

        this.queue.clear();

        this.scheduled = false;
    }

    batch(tasks = []) {

        tasks.forEach(
            task => {

                this.schedule(task);
            }
        );
    }
}

export const RenderEngine =
    new UIRenderEngine();