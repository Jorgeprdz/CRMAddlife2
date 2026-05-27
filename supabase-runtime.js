// supabase-runtime.js
// Enterprise Supabase Runtime

class SupabaseRuntimeEngine {

    constructor() {

        this.client = null;
    }

    init(client) {

        this.client = client;
    }

    getClient() {

        if (!this.client) {

            throw new Error(
                'Supabase not initialized'
            );
        }

        return this.client;
    }

    from(table) {

        return this
            .getClient()
            .from(table);
    }

    auth() {

        return this
            .getClient()
            .auth;
    }

    rpc(
        fn,
        params
    ) {

        return this
            .getClient()
            .rpc(
                fn,
                params
            );
    }
}

export const SupabaseRuntime =
    new SupabaseRuntimeEngine();

export default SupabaseRuntime;