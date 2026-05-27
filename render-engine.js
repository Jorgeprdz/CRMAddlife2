// render-engine.js
// Enterprise Incremental Render Runtime

class RenderEngine {

    constructor() {

        this.pendingFrame = null;

        this.pendingTasks = [];

        this.isRendering = false;
    }

    schedule(task) {

        this.pendingTasks.push(task);

        if (this.pendingFrame) {
            return;
        }

        this.pendingFrame =
            requestAnimationFrame(
                () => {

                    this.flush();
                }
            );
    }

    flush() {

        this.pendingFrame = null;

        const fragment =
            document.createDocumentFragment();

        while (
            this.pendingTasks.length
        ) {

            const task =
                this.pendingTasks.shift();

            try {

                task(fragment);

            } catch (err) {

                console.error(
                    '[RENDER ENGINE ERROR]',
                    err
                );
            }
        }
    }

    batch(callback) {

        requestAnimationFrame(
            () => {

                callback();
            }
        );
    }

    safeReplace(container, nextNode) {

        if (!container) {
            return;
        }

        container.replaceChildren(
            nextNode
        );
    }

    preserveScroll(callback) {

        const scrollY =
            window.scrollY;

        callback();

        requestAnimationFrame(
            () => {

                window.scrollTo(
                    0,
                    scrollY
                );
            }
        );
    }
}

export const RenderRuntime =
    new RenderEngine();