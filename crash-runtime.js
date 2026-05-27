// crash-runtime.js

import {
    Telemetry
} from './telemetry.js';

class CrashRuntime {

    init() {

        window.addEventListener(
            'error',

            event => {

                this.capture(

                    'runtime_error',

                    event.error
                );
            }
        );

        window.addEventListener(
            'unhandledrejection',

            event => {

                this.capture(

                    'promise_rejection',

                    event.reason
                );
            }
        );
    }

    capture(type, error) {

        Telemetry.track(

            'crash',

            {

                type,

                message:
                    error?.message,

                stack:
                    error?.stack,

                userAgent:
                    navigator.userAgent
            }
        );
    }
}

export const CrashRuntimeEngine =
    new CrashRuntime();