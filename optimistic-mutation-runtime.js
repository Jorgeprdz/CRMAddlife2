// optimistic-mutation-runtime.js
// Enterprise Optimistic Runtime

class OptimisticMutationRuntime {

    constructor() {

        this.transactions =
            new Map();
    }

    apply({

        id,

        mutation,

        rollback
    }) {

        this.transactions.set(

            id,

            {

                rollback,

                timestamp:
                    Date.now()
            }
        );

        mutation();
    }

    commit(id) {

        this.transactions.delete(
            id
        );
    }

    rollback(id) {

        const tx =
            this.transactions.get(id);

        if (!tx) {
            return;
        }

        tx.rollback();

        this.transactions.delete(
            id
        );
    }
}

export const OptimisticMutationEngine =
    new OptimisticMutationRuntime();

export default OptimisticMutationEngine;