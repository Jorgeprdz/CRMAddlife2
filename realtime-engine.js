// realtime-engine.js
// Enterprise Realtime Sync Layer

class RealtimeEngine {

    constructor() {

        this.channels =
            new Map();
    }

    subscribe(
        table,
        callback
    ) {

        if (
            !window.supabaseClient
        ) {

            console.warn(
                '[REALTIME] NO SUPABASE'
            );

            return;
        }

        if (
            this.channels.has(table)
        ) {

            return;
        }

        const channel =
            window.supabaseClient
                .channel(
                    `realtime:${table}`
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table
                    },
                    payload => {

                        callback(payload);
                    }
                )
                .subscribe();

        this.channels.set(
            table,
            channel
        );

        console.log(
            '[REALTIME] SUBSCRIBED',
            table
        );
    }

    unsubscribe(table) {

        const channel =
            this.channels.get(table);

        if (!channel) {

            return;
        }

        window.supabaseClient
            .removeChannel(
                channel
            );

        this.channels.delete(
            table
        );

        console.log(
            '[REALTIME] UNSUBSCRIBED',
            table
        );
    }

    destroy() {

        this.channels.forEach(
            channel => {

                window.supabaseClient
                    ?.removeChannel(
                        channel
                    );
            }
        );

        this.channels.clear();
    }
}

export const Realtime =
    new RealtimeEngine();