// analytics-engine.js
// Enterprise Analytics Layer

class AnalyticsEngine {

    constructor() {

        this.queue = [];
    }

    init() {

        console.log(
            '[ANALYTICS] READY'
        );
    }

    track(
        event,
        payload = {}
    ) {

        const item = {

            event,

            payload,

            timestamp:
                Date.now()
        };

        this.queue.push(item);

        console.log(
            '[ANALYTICS]',
            item
        );

        this.flush();
    }

    async flush() {

        if (
            !navigator.onLine
        ) {

            return;
        }

        try {

            while (
                this.queue.length
            ) {

                const item =
                    this.queue.shift();

                // FUTURE:
                // send to analytics backend

                console.log(
                    '[ANALYTICS SENT]',
                    item
                );
            }

        } catch (err) {

            console.error(
                '[ANALYTICS ERROR]',
                err
            );
        }
    }
}

export const Analytics =
    new AnalyticsEngine();