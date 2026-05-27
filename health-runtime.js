// health-runtime.js

import {
    Telemetry
} from './telemetry.js';

class HealthRuntime {

    init() {

        this.monitorMemory();

        this.monitorFPS();

        this.monitorNetwork();
    }

    monitorMemory() {

        if (
            !performance.memory
        ) {

            return;
        }

        setInterval(
            () => {

                const memory =
                    performance.memory;

                const usage =
                    memory.usedJSHeapSize /
                    memory.jsHeapSizeLimit;

                if (usage > 0.8) {

                    Telemetry.track(

                        'high_memory_usage',

                        {

                            usage
                        }
                    );
                }

            },
            30000
        );
    }

    monitorFPS() {

        let last =
            performance.now();

        let frames = 0;

        const loop = () => {

            frames++;

            const now =
                performance.now();

            if (
                now >= last + 1000
            ) {

                const fps =
                    Math.round(

                        (frames * 1000) /
                        (now - last)
                    );

                if (fps < 40) {

                    Telemetry.track(

                        'low_fps',

                        { fps }
                    );
                }

                frames = 0;

                last = now;
            }

            requestAnimationFrame(
                loop
            );
        };

        loop();
    }

    monitorNetwork() {

        const connection =
            navigator.connection;

        if (!connection) {
            return;
        }

        connection.addEventListener(
            'change',

            () => {

                Telemetry.track(

                    'network_change',

                    {

                        type:
                            connection.effectiveType,

                        downlink:
                            connection.downlink
                    }
                );
            }
        );
    }
}

export const HealthRuntimeEngine =
    new HealthRuntime();