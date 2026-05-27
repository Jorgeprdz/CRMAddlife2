// telemetry.js
// Enterprise Telemetry Runtime

class TelemetryRuntime {

    constructor() {

        this.queue = [];

        this.sessionId =
            crypto.randomUUID();

        this.flushInterval =
            null;

        this.enabled = true;
    }

    init() {

        this.startFlushLoop();

        this.bindLifecycle();
    }

    track(event, payload = {}) {

        if (!this.enabled) {
            return;
        }

        this.queue.push({

            event,

            payload,

            sessionId:
                this.sessionId,

            timestamp:
                Date.now(),

            url:
                location.pathname
        });

        if (
            this.queue.length >= 20
        ) {

            this.flush();
        }
    }

    async flush() {

        if (
            !navigator.onLine
        ) {

            return;
        }

        if (!this.queue.length) {
            return;
        }

        const events =
            [...this.queue];

        this.queue = [];

        try {

            await fetch(

                '/api/telemetry',

                {

                    method: 'POST',

                    headers: {

                        'Content-Type':
                            'application/json'
                    },

                    body: JSON.stringify({
                        events
                    }),

                    keepalive: true
                }
            );

        } catch (err) {

            console.error(
                '[TELEMETRY ERROR]',
                err
            );

            this.queue.unshift(
                ...events
            );
        }
    }

    startFlushLoop() {

        this.flushInterval =
            setInterval(
                () => {

                    this.flush();

                },
                15000
            );
    }

    bindLifecycle() {

        window.addEventListener(
            'beforeunload',

            () => {

                this.flush();
            }
        );

        document.addEventListener(
            'visibilitychange',

            () => {

                if (
                    document.visibilityState ===
                    'hidden'
                ) {

                    this.flush();
                }
            }
        );
    }
}

export const Telemetry =
    new TelemetryRuntime();