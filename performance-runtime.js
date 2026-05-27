// performance-runtime.js

import {
    Telemetry
} from './telemetry.js';

class PerformanceRuntime {

    measure(name, callback) {

        const start =
            performance.now();

        const result =
            callback();

        const end =
            performance.now();

        const duration =
            end - start;

        if (duration > 120) {

            Telemetry.track(

                'slow_render',

                {

                    name,

                    duration
                }
            );
        }

        return result;
    }

    async measureAsync(name, callback) {

        const start =
            performance.now();

        const result =
            await callback();

        const end =
            performance.now();

        const duration =
            end - start;

        if (duration > 200) {

            Telemetry.track(

                'slow_async',

                {

                    name,

                    duration
                }
            );
        }

        return result;
    }
}

export const PerformanceMonitor =
    new PerformanceRuntime();