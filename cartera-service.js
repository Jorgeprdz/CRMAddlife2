// services/cartera-service.js

import { CarteraRepository } from '../repositories/cartera-repository.js';
import { sanitizeHTML } from '../utils/sanitizer-utils.js';
import { emitEvent } from '../core/core-event-bus.js';

const REQUIRED_FIELDS = [
    'cliente',
    'poliza',
    'emision'
];

const PAYMENT_FREQUENCIES = [
    'Mensual',
    'Trimestral',
    'Semestral',
    'Anual',
    'Prima Única'
];

const DEFAULT_POLIZA = Object.freeze({
    cliente: '',
    nacimiento: '',
    emision: '',
    poliza: '',
    plan: '',
    variante: '',
    edadGmm: '',
    moneda: 'MXN',
    formaPago: '',
    conductoCobro: '',
    prima: 0,
    suma: 0,
    esPersonal: false,
    fechaPago: ''
});

class CarteraService {

    constructor() {

        this.repository =
            new CarteraRepository();

        this.abortControllers =
            new Map();
    }

    // ═══════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════

    async obtenerTodasPolizas() {

        const data =
            await this.repository
                .obtenerTodas();

        return data
            .map(poliza =>
                this.normalizarPoliza(poliza)
            )
            .sort(
                (a, b) =>
                    new Date(b.emision) -
                    new Date(a.emision)
            );
    }

    async guardarPoliza(payload) {

        const normalized =
            this.normalizarPoliza(payload);

        this.validarPoliza(normalized);

        normalized.fechaPago =
            this.calcularProximoVencimiento(
                normalized.emision,
                normalized.formaPago
            );

        const duplicated =
            await this.repository
                .buscarPorPoliza(
                    normalized.poliza
                );

        if (
            duplicated &&
            duplicated.id !== normalized.id
        ) {

            throw new Error(
                'Ya existe una póliza con ese número.'
            );
        }

        const optimisticId =
            normalized.id ||
            this.generarId();

        const optimisticPayload = {
            ...normalized,
            id: optimisticId
        };

        emitEvent(
            'cartera:poliza:optimistic-created',
            optimisticPayload
        );

        try {

            let result;

            if (normalized.id) {

                result =
                    await this.repository
                        .actualizar(
                            normalized.id,
                            optimisticPayload
                        );

            } else {

                result =
                    await this.repository
                        .guardar(
                            optimisticPayload
                        );
            }

            emitEvent(
                'cartera:poliza:saved',
                result
            );

            return result;

        } catch (error) {

            emitEvent(
                'cartera:poliza:rollback',
                optimisticPayload
            );

            throw error;
        }
    }

    async eliminarPoliza(id) {

        if (!id) {

            throw new Error(
                'ID inválido.'
            );
        }

        emitEvent(
            'cartera:poliza:optimistic-removed',
            { id }
        );

        try {

            await this.repository
                .eliminar(id);

            emitEvent(
                'cartera:poliza:deleted',
                { id }
            );

        } catch (error) {

            emitEvent(
                'cartera:poliza:rollback-delete',
                { id }
            );

            throw error;
        }
    }

    async importarPolizas(polizas = []) {

        if (!Array.isArray(polizas)) {

            throw new Error(
                'Formato inválido de importación.'
            );
        }

        const normalized =
            polizas
                .map(p =>
                    this.normalizarPoliza(p)
                )
                .filter(
                    p =>
                        p.cliente &&
                        p.poliza
                );

        const uniqueMap =
            new Map();

        for (const item of normalized) {

            const key =
                item.poliza.trim();

            if (!uniqueMap.has(key)) {

                uniqueMap.set(
                    key,
                    item
                );
            }
        }

        const deduplicated =
            Array.from(
                uniqueMap.values()
            );

        const chunkSize = 50;

        const results = [];

        for (
            let i = 0;
            i < deduplicated.length;
            i += chunkSize
        ) {

            const chunk =
                deduplicated.slice(
                    i,
                    i + chunkSize
                );

            const inserted =
                await Promise.all(
                    chunk.map(async item => {

                        try {

                            item.fechaPago =
                                this.calcularProximoVencimiento(
                                    item.emision,
                                    item.formaPago
                                );

                            return await this
                                .repository
                                .guardar({
                                    ...item,
                                    id:
                                        item.id ||
                                        this.generarId()
                                });

                        } catch (err) {

                            console.error(
                                '[IMPORT ERROR]',
                                err
                            );

                            return null;
                        }
                    })
                );

            results.push(
                ...inserted.filter(Boolean)
            );

            await this.delay(8);
        }

        emitEvent(
            'cartera:import:completed',
            {
                total: results.length
            }
        );

        return results;
    }

    buscarPolizas(data = [], query = '') {

        const term =
            String(query)
                .trim()
                .toLowerCase();

        if (!term) {

            return data;
        }

        return data.filter(item => {

            const cliente =
                item.cliente
                    ?.toLowerCase()
                    || '';

            const poliza =
                item.poliza
                    ?.toLowerCase()
                    || '';

            return (
                cliente.includes(term) ||
                poliza.includes(term)
            );
        });
    }

    calcularKPIs(data = []) {

        const totalPolizas =
            data.length;

        const primaTotal =
            data.reduce(
                (acc, item) =>
                    acc +
                    (
                        Number(item.prima)
                        || 0
                    ),
                0
            );

        const alertas =
            data.filter(item => {

                if (!item.fechaPago) {

                    return false;
                }

                const dias =
                    this.calcularDiasRestantes(
                        item.fechaPago
                    );

                return dias <= 30;

            }).length;

        return {
            totalPolizas,
            primaTotal,
            alertas
        };
    }

    calcularDiasRestantes(fecha) {

        if (!fecha) {

            return null;
        }

        const today =
            new Date();

        today.setHours(
            0, 0, 0, 0
        );

        const target =
            new Date(
                `${fecha}T12:00:00`
            );

        return Math.ceil(
            (
                target - today
            ) / 86400000
        );
    }

    calcularProximoVencimiento(
        fechaEmision,
        formaPago
    ) {

        if (
            !fechaEmision ||
            formaPago === 'Prima Única'
        ) {

            return fechaEmision;
        }

        const next =
            new Date(
                `${fechaEmision}T12:00:00`
            );

        const today =
            new Date();

        today.setHours(
            0, 0, 0, 0
        );

        while (next < today) {

            switch (formaPago) {

                case 'Mensual':

                    next.setMonth(
                        next.getMonth() + 1
                    );

                    break;

                case 'Trimestral':

                    next.setMonth(
                        next.getMonth() + 3
                    );

                    break;

                case 'Semestral':

                    next.setMonth(
                        next.getMonth() + 6
                    );

                    break;

                case 'Anual':

                    next.setFullYear(
                        next.getFullYear() + 1
                    );

                    break;

                default:
                    return fechaEmision;
            }
        }

        return next
            .toISOString()
            .split('T')[0];
    }

    // ═══════════════════════════════════════
    // VALIDATION
    // ═══════════════════════════════════════

    validarPoliza(payload) {

        for (const field of REQUIRED_FIELDS) {

            if (!payload[field]) {

                throw new Error(
                    `Campo obligatorio faltante: ${field}`
                );
            }
        }

        if (
            payload.prima < 0 ||
            payload.suma < 0
        ) {

            throw new Error(
                'Valores monetarios inválidos.'
            );
        }

        if (
            payload.formaPago &&
            !PAYMENT_FREQUENCIES.includes(
                payload.formaPago
            )
        ) {

            throw new Error(
                'Forma de pago inválida.'
            );
        }
    }

    // ═══════════════════════════════════════
    // NORMALIZATION
    // ═══════════════════════════════════════

    normalizarPoliza(payload = {}) {

        const safe = {
            ...DEFAULT_POLIZA,
            ...payload
        };

        return {
            id:
                safe.id ||
                null,

            cliente:
                sanitizeHTML(
                    String(
                        safe.cliente || ''
                    ).trim()
                ),

            nacimiento:
                String(
                    safe.nacimiento || ''
                ),

            emision:
                String(
                    safe.emision || ''
                ),

            poliza:
                sanitizeHTML(
                    String(
                        safe.poliza || ''
                    ).trim()
                ),

            plan:
                sanitizeHTML(
                    String(
                        safe.plan || ''
                    )
                ),

            variante:
                sanitizeHTML(
                    String(
                        safe.variante || ''
                    )
                ),

            edadGmm:
                String(
                    safe.edadGmm || ''
                ),

            moneda:
                String(
                    safe.moneda || 'MXN'
                ),

            formaPago:
                String(
                    safe.formaPago || ''
                ),

            conductoCobro:
                sanitizeHTML(
                    String(
                        safe.conductoCobro || ''
                    )
                ),

            prima:
                Number(
                    safe.prima
                ) || 0,

            suma:
                Number(
                    safe.suma
                ) || 0,

            esPersonal:
                Boolean(
                    safe.esPersonal
                ),

            fechaPago:
                String(
                    safe.fechaPago || ''
                )
        };
    }

    // ═══════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════

    generarId() {

        return (
            'pol_' +
            crypto.randomUUID()
        );
    }

    delay(ms) {

        return new Promise(resolve => {

            setTimeout(
                resolve,
                ms
            );
        });
    }

    abortOperation(key) {

        const controller =
            this.abortControllers.get(
                key
            );

        if (controller) {

            controller.abort();

            this.abortControllers.delete(
                key
            );
        }
    }

    createAbortController(key) {

        this.abortOperation(key);

        const controller =
            new AbortController();

        this.abortControllers.set(
            key,
            controller
        );

        return controller;
    }
}

export const carteraService =
    new CarteraService();