// error-boundary.js
// Enterprise Error Handling System

import { Analytics } from './analytics-engine.js';

class ErrorBoundary {

    init() {

        console.log(
            '[ERROR BOUNDARY] READY'
        );
    }

    capture(err) {

        console.error(
            '[CAPTURED ERROR]',
            err
        );

        Analytics.track(
            'app_error',
            {
                message:
                    err?.message,

                stack:
                    err?.stack
            }
        );
    }
}

export const ErrorHandler =
    new ErrorBoundary();