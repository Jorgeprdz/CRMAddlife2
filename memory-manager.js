// memory-manager.js
// Enterprise Memory Cleanup System

class MemoryManager {

    constructor() {

        this.cleaners = [];
    }

    add(cleaner) {

        if (
            typeof cleaner !==
            'function'
        ) {

            return;
        }

        this.cleaners.push(
            cleaner
        );
    }

    cleanup() {

        this.cleaners
            .forEach(cleaner => {

                try {

                    cleaner();

                } catch (err) {

                    console.error(
                        '[MEMORY CLEANUP ERROR]',
                        err
                    );
                }
            });

        this.cleaners = [];

        console.log(
            '[MEMORY CLEANUP DONE]'
        );
    }
}

export const Memory =
    new MemoryManager();