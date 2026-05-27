// runtime.js
// Runtime Layer - Production Hardened

export class RuntimeManager {

    constructor() {

        this.currentRoute = null;

        this.navigationId = 0;

        this.isNavigating = false;

        this.currentAbortController = null;

        this.cleanupTasks = new Set();

        this.activeTimers = new Set();

        this.routeCache = new Map();
    }

    startNavigation() {

        this.navigationId += 1;

        const navigationId = this.navigationId;

        this.abortCurrentNavigation();

        this.currentAbortController =
            new AbortController();

        this.cleanupCurrentRoute();

        return {
            navigationId,
            signal: this.currentAbortController.signal
        };
    }

    isNavigationStale(id) {

        return id !== this.navigationId;
    }

    abortCurrentNavigation() {

        if (this.currentAbortController) {

            this.currentAbortController.abort();
        }
    }

    registerCleanup(fn) {

        if (typeof fn !== 'function') {
            return () => {};
        }

        this.cleanupTasks.add(fn);

        return () => {
            this.cleanupTasks.delete(fn);
        };
    }

    registerTimer(timerId) {

        this.activeTimers.add(timerId);

        return timerId;
    }

    cleanupCurrentRoute() {

        for (const cleanup of this.cleanupTasks) {

            try {
                cleanup();
            } catch (err) {
                console.error('[RUNTIME CLEANUP ERROR]', err);
            }
        }

        this.cleanupTasks.clear();

        for (const timerId of this.activeTimers) {

            clearTimeout(timerId);
            clearInterval(timerId);
        }

        this.activeTimers.clear();
    }

    async safeAsync(promise, signal) {

        if (!signal) {
            return promise;
        }

        return Promise.race([
            promise,
            new Promise((_, reject) => {

                signal.addEventListener(
                    'abort',
                    () => reject(new DOMException('Aborted', 'AbortError')),
                    { once: true }
                );
            })
        ]);
    }

    async lazyImport(loader) {

        if (this.routeCache.has(loader)) {
            return this.routeCache.get(loader);
        }

        const module = await loader();

        this.routeCache.set(loader, module);

        return module;
    }
}

export const Runtime = new RuntimeManager();