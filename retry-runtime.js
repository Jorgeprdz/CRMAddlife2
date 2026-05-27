// retry-runtime.js
// Enterprise Retry Runtime

class RetryRuntimeEngine {

    async execute({

        operation,

        retries = 3,

        delay = 1000
    }) {

        let lastError;

        for (
            let attempt = 1;
            attempt <= retries;
            attempt++
        ) {

            try {

                return await operation();

            } catch (err) {

                lastError = err;

                if (
                    attempt === retries
                ) {

                    break;
                }

                await this.sleep(
                    delay * attempt
                );
            }
        }

        throw lastError;
    }

    sleep(ms) {

        return new Promise(
            resolve => {

                setTimeout(
                    resolve,
                    ms
                );
            }
        );
    }
}

export const RetryRuntime =
    new RetryRuntimeEngine();

export default RetryRuntime;