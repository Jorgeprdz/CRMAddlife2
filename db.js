// db.js
// Enterprise DB Facade

import {
    Storage
} from './storage-engine.js';

class DatabaseFacade {

    async init() {

        await Storage.init();

        console.log(
            '[DB] ENTERPRISE READY'
        );
    }

    async guardar(
        store,
        payload
    ) {

        try {

            return await Storage
                .save(
                    store,
                    payload
                );

        } catch (err) {

            console.error(
                '[DB SAVE ERROR]',
                err
            );

            throw err;
        }
    }

    async actualizar(
        store,
        id,
        payload
    ) {

        try {

            return await Storage
                .save(
                    store,
                    {
                        ...payload,
                        id
                    }
                );

        } catch (err) {

            console.error(
                '[DB UPDATE ERROR]',
                err
            );

            throw err;
        }
    }

    async obtenerTodos(store) {

        try {

            return await Storage
                .getAll(store);

        } catch (err) {

            console.error(
                '[DB GET ALL ERROR]',
                err
            );

            return [];
        }
    }

    async obtenerPorId(
        store,
        id
    ) {

        try {

            return await Storage
                .getById(
                    store,
                    id
                );

        } catch (err) {

            console.error(
                '[DB GET ERROR]',
                err
            );

            return null;
        }
    }

    async eliminar(
        store,
        id
    ) {

        try {

            return await Storage
                .delete(
                    store,
                    id
                );

        } catch (err) {

            console.error(
                '[DB DELETE ERROR]',
                err
            );

            throw err;
        }
    }

    async limpiar(store) {

        try {

            return await Storage
                .clear(store);

        } catch (err) {

            console.error(
                '[DB CLEAR ERROR]',
                err
            );

            throw err;
        }
    }
}

export const DB =
    new DatabaseFacade();