// feature-flags.js

class FeatureFlags {

    constructor() {

        this.flags = {

            newDashboard:
                false,

            aiAssistant:
                true,

            virtualLists:
                true,

            telemetry:
                true
        };
    }

    async load() {

        try {

            const response =
                await fetch(
                    '/api/flags'
                );

            if (!response.ok) {
                return;
            }

            const data =
                await response.json();

            this.flags = {

                ...this.flags,

                ...data
            };

        } catch (err) {

            console.warn(
                '[FLAGS ERROR]',
                err
            );
        }
    }

    enabled(flag) {

        return !!this.flags[flag];
    }
}

export const Flags =
    new FeatureFlags();