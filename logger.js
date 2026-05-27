// logger.js
// Enterprise Structured Logging

class LoggerEngine {

    constructor() {

        this.debug =
            true;
    }

    info(...args) {

        if (
            !this.debug
        ) {

            return;
        }

        console.log(
            '[INFO]',
            ...args
        );
    }

    warn(...args) {

        console.warn(
            '[WARN]',
            ...args
        );
    }

    error(...args) {

        console.error(
            '[ERROR]',
            ...args
        );
    }
}

export const Logger =
    new LoggerEngine();