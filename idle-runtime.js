// idle-runtime.js

class IdleRuntime {

    schedule(task, timeout = 2000) {

        if (
            'requestIdleCallback'
            in window
        ) {

            return requestIdleCallback(
                task,
                { timeout }
            );
        }

        return setTimeout(
            task,
            1
        );
    }

    cancel(id) {

        if (
            'cancelIdleCallback'
            in window
        ) {

            cancelIdleCallback(id);

            return;
        }

        clearTimeout(id);
    }
}

export const IdleEngine =
    new IdleRuntime();