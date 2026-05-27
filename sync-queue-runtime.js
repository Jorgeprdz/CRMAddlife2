// sync-queue-runtime.js
// Enterprise Sync Queue Runtime

class SyncQueueRuntimeEngine {

    constructor() {

        this.queue = [];

        this.processing =
            false;
    }

    add(job) {

        this.queue.push({

            id:
                crypto.randomUUID(),

            timestamp:
                Date.now(),

            ...job
        });
    }

    async process(processor) {

        if (this.processing) {
            return;
        }

        this.processing = true;

        try {

            while (
                this.queue.length
            ) {

                const job =
                    this.queue[0];

                try {

                    await processor(job);

                    this.queue.shift();

                } catch (err) {

                    console.error(

                        '[SYNC QUEUE ERROR]',

                        err
                    );

                    break;
                }
            }

        } finally {

            this.processing = false;
        }
    }

    clear() {

        this.queue = [];
    }
}

export const SyncQueueRuntime =
    new SyncQueueRuntimeEngine();

export default SyncQueueRuntime;