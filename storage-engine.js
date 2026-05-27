// storage-engine.js
// Enterprise IndexedDB Engine

import {
    StorageValidator
} from './storage-validator.js';

import {
    StorageQueue
} from './storage-queue.js';

const DB_NAME =
    'ADDLIFE_CRM_ENTERPRISE';

const DB_VERSION = 4;

const STORES = [

    'cartera',
    'actividad_diaria',
    'prospeccion',
    'referidos',
    'comisiones',
    'sync_queue',
    'logs'
];

class StorageEngine {

    constructor() {

        this.db = null;

        this.queue =
            new StorageQueue();

        this.isOpening = false;
    }

    async init() {

        if (this.db) {

            return this.db;
        }

        if (this.isOpening) {

            return new Promise(
                resolve => {

                    const check = () => {

                        if (this.db) {

                            resolve(this.db);

                        } else {

                            requestAnimationFrame(
                                check
                            );
                        }
                    };

                    check();
                }
            );
        }

        this.isOpening = true;

        return new Promise((
            resolve,
            reject
        ) => {

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );

            request.onupgradeneeded =
                event => {

                    const db =
                        event.target.result;

                    STORES.forEach(
                        store => {

                            if (
                                !db.objectStoreNames.contains(
                                    store
                                )
                            ) {

                                db.createObjectStore(
                                    store,
                                    {
                                        keyPath:'id'
                                    }
                                );
                            }
                        }
                    );
                };

            request.onsuccess =
                event => {

                    this.db =
                        event.target.result;

                    this.isOpening =
                        false;

                    resolve(this.db);
                };

            request.onerror =
                event => {

                    this.isOpening =
                        false;

                    reject(
                        event.target.error
                    );
                };
        });
    }

    async transaction(
        store,
        mode,
        handler
    ) {

        await this.init();

        StorageValidator
            .validateStoreName(
                store
            );

        return this.queue.add(
            async () => {

                return new Promise((
                    resolve,
                    reject
                ) => {

                    try {

                        const tx =
                            this.db.transaction(
                                [store],
                                mode
                            );

                        const objectStore =
                            tx.objectStore(
                                store
                            );

                        const result =
                            handler(
                                objectStore
                            );

                        tx.oncomplete =
                            () => {

                                resolve(
                                    result
                                );
                            };

                        tx.onerror =
                            () => {

                                reject(
                                    tx.error
                                );
                            };

                    } catch (err) {

                        reject(err);
                    }
                });
            }
        );
    }

    async save(
        store,
        payload
    ) {

        StorageValidator
            .validatePayload(
                payload
            );

        const clean =
            StorageValidator
                .sanitizeObject(
                    payload
                );

        return this.transaction(
            store,
            'readwrite',
            objectStore => {

                objectStore.put({
                    ...clean,
                    updatedAt:
                        Date.now()
                });
            }
        );
    }

    async getAll(store) {

        return this.transaction(
            store,
            'readonly',
            objectStore => {

                return new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        const request =
                            objectStore
                                .getAll();

                        request.onsuccess =
                            () => {

                                resolve(
                                    request.result || []
                                );
                            };

                        request.onerror =
                            () => {

                                reject(
                                    request.error
                                );
                            };
                    }
                );
            }
        );
    }

    async getById(
        store,
        id
    ) {

        StorageValidator
            .validateId(id);

        return this.transaction(
            store,
            'readonly',
            objectStore => {

                return new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        const request =
                            objectStore.get(
                                id
                            );

                        request.onsuccess =
                            () => {

                                resolve(
                                    request.result || null
                                );
                            };

                        request.onerror =
                            () => {

                                reject(
                                    request.error
                                );
                            };
                    }
                );
            }
        );
    }

    async delete(
        store,
        id
    ) {

        StorageValidator
            .validateId(id);

        return this.transaction(
            store,
            'readwrite',
            objectStore => {

                objectStore.delete(id);
            }
        );
    }

    async clear(store) {

        return this.transaction(
            store,
            'readwrite',
            objectStore => {

                objectStore.clear();
            }
        );
    }
}

export const Storage =
    new StorageEngine();