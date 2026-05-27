// performance-monitor.js
// Enterprise Performance Tracker

import { EventBus } from './event-system.js';

class PerformanceMonitor {

    constructor() {

        this.enabled = true;

        this.memoryInterval =
            null;
    }

    init() {

        if (!this.enabled) {

            return;
        }

        this.observeLongTasks();

        this.monitorMemory();

        console.log(
            '[PERFORMANCE] READY'
        );
    }

    observeLongTasks() {

        if (
            !window.PerformanceObserver
        ) {

            return;
        }

        try {

            const observer =
                new PerformanceObserver(
                    list => {

                        list
                            .getEntries()
                            .forEach(entry => {

                                if (
                                    entry.duration > 100
                                ) {

                                    console.warn(
                                        '[LONG TASK]',
                                        entry.duration
                                    );

                                    EventBus.emit(
                                        'performance:longtask',
                                        entry
                                    );
                                }
                            });
                    });

            observer.observe({
                entryTypes: [
                    'longtask'
                ]
            });

        } catch (err) {

            console.error(err);
        }
    }

    monitorMemory() {

        if (
            !performance.memory
        ) {

            return;
        }

        this.memoryInterval =
            setInterval(() => {

                const memory =
                    performance.memory;

                const usedMB =
                    Math.round(
                        memory.usedJSHeapSize /
                        1048576
                    );

                EventBus.emit(
                    'performance:memory',
                    {
                        usedMB
                    }
                );

                if (
                    usedMB > 180
                ) {

                    console.warn(
                        '[HIGH MEMORY]',
                        usedMB
                    );
                }

            }, 30000);
    }

    destroy() {

        clearInterval(
            this.memoryInterval
        );
    }
}

export const PerformanceTracker =
    new PerformanceMonitor();