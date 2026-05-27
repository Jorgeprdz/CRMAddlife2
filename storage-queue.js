// storage-queue.js
// Concurrency-safe operation queue

export class StorageQueue {

    constructor() {

        this.queue = [];
        this.running = false;
    }

    async add(operation) {

        return new Promise((
            resolve,
            reject
        ) => {

            this.queue.push({
                operation,
                resolve,
                reject
            });

            this.process();
        });
    }

    async process() {

        if (this.running) {

            return;
        }

        this.running = true;

        while (
            this.queue.length > 0
        ) {

            const item =
                this.queue.shift();

            try {

                const result =
                    await item.operation();

                item.resolve(result);

            } catch (err) {

                item.reject(err);
            }
        }

        this.running = false;
    }

    clear() {

        this.queue = [];
    }

    size() {

        return this.queue.length;
    }
}