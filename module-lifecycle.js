// module-lifecycle.js
// Enterprise Module Lifecycle Manager

import { Memory } from './memory-manager.js';

class ModuleLifecycle {

    constructor() {

        this.activeModules =
            new Map();
    }

    async mount(
        name,
        lifecycle
    ) {

        if (
            this.activeModules.has(name)
        ) {

            await this.unmount(name);
        }

        console.log(
            '[MODULE MOUNT]',
            name
        );

        if (
            lifecycle.beforeMount
        ) {

            await lifecycle.beforeMount();
        }

        if (
            lifecycle.mount
        ) {

            await lifecycle.mount();
        }

        this.activeModules.set(
            name,
            lifecycle
        );

        if (
            lifecycle.afterMount
        ) {

            await lifecycle.afterMount();
        }
    }

    async unmount(name) {

        const module =
            this.activeModules.get(name);

        if (!module) {

            return;
        }

        console.log(
            '[MODULE UNMOUNT]',
            name
        );

        if (
            module.beforeUnmount
        ) {

            await module.beforeUnmount();
        }

        if (
            module.unmount
        ) {

            await module.unmount();
        }

        Memory.cleanup();

        this.activeModules.delete(
            name
        );
    }

    async destroyAll() {

        for (
            const name
            of this.activeModules.keys()
        ) {

            await this.unmount(name);
        }
    }
}

export const Lifecycle =
    new ModuleLifecycle();