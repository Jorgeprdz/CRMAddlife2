// cartera-repository.js
// Enterprise Cartera Repository

import {
    BaseRepository
} from './base-repository.js';

import {
    DB
} from './db.js';

class CarteraRepository extends BaseRepository {

    constructor() {

        super('cartera');
    }

    async getAll() {

        return this.execute(
            async () => {

                const cache =
                    this.getCache(
                        'all'
                    );

                if (cache) {
                    return cache;
                }

                const data =
                    await DB.obtenerTodos(
                        'cartera'
                    );

                this.setCache(
                    'all',
                    data
                );

                return data;
            }
        );
    }

    async save(policy) {

        return this.execute(
            async () => {

                await DB.guardar(
                    'cartera',
                    policy
                );

                this.invalidate();

                return policy;
            }
        );
    }

    async update(
        id,
        policy
    ) {

        return this.execute(
            async () => {

                await DB.actualizar(
                    'cartera',
                    id,
                    policy
                );

                this.invalidate();

                return policy;
            }
        );
    }
}

export const carteraRepository =
    new CarteraRepository();

export default carteraRepository;