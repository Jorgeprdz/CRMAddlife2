// views/cartera-view.js

import {
    formatCurrency,
    escapeHTML
} from '../utils/cartera-utils.js';

const STATUS_CONFIG = Object.freeze({
    paid: {
        icon: '✅',
        color: '#34C759',
        label: 'Pagada'
    },

    overdue: {
        icon: '🚨',
        color: '#FF3B30',
        label: 'Vencida'
    },

    warning: {
        icon: '⚠️',
        color: '#FF9500',
        label: 'Próxima'
    },

    normal: {
        icon: '🟢',
        color: '#007AFF',
        label: 'Activa'
    }
});

export const CarteraView = {

    render() {

        return `
            <section
                id="cartera-module"
                class="cartera-module"
            >
                ${this.renderKPIsSkeleton()}

                ${this.renderFormulario()}

                ${this.renderImportador()}

                ${this.renderListadoSection()}
            </section>
        `;
    },

    // ═══════════════════════════════════════
    // KPI SECTION
    // ═══════════════════════════════════════

    renderKPIsSkeleton() {

        return `
            <section
                class="glass-widget"
                style="
                    padding:16px;
                    margin-bottom:20px;
                "
            >
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:14px;
                    "
                >
                    <h2
                        style="
                            font-size:16px;
                            font-weight:700;
                            margin:0;
                        "
                    >
                        📊 Resumen de Cartera
                    </h2>

                    <button
                        id="btn-refresh-cartera"
                        class="btn-secondary btn-sm"
                        aria-label="Actualizar cartera"
                    >
                        ↻
                    </button>
                </div>

                <div
                    id="cartera-kpis"
                    style="
                        display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:10px;
                    "
                >
                    ${this.renderKPILoading()}
                </div>
            </section>
        `;
    },

    renderKPILoading() {

        return `
            ${Array(3)
                .fill(0)
                .map(() => `
                    <div
                        class="glass-skeleton"
                        style="
                            height:76px;
                            border-radius:14px;
                        "
                    ></div>
                `)
                .join('')}
        `;
    },

    updateKPIs(kpis) {

        const root =
            document.getElementById(
                'cartera-kpis'
            );

        if (!root) return;

        root.innerHTML = `
            <div
                class="glass-widget"
                style="
                    padding:14px;
                    border:1px solid var(--separator);
                "
            >
                <span
                    style="
                        font-size:11px;
                        color:var(--text-secondary);
                        font-weight:700;
                        text-transform:uppercase;
                    "
                >
                    Pólizas
                </span>

                <div
                    style="
                        margin-top:8px;
                        font-size:24px;
                        font-weight:800;
                    "
                >
                    ${kpis.totalPolizas}
                </div>
            </div>

            <div
                class="glass-widget"
                style="
                    padding:14px;
                    border:1px solid var(--separator);
                "
            >
                <span
                    style="
                        font-size:11px;
                        color:var(--text-secondary);
                        font-weight:700;
                        text-transform:uppercase;
                    "
                >
                    Prima Total
                </span>

                <div
                    style="
                        margin-top:8px;
                        font-size:20px;
                        font-weight:800;
                        color:var(--success);
                    "
                >
                    ${formatCurrency(
                        kpis.primaTotal
                    )}
                </div>
            </div>

            <div
                class="glass-widget"
                style="
                    grid-column:span 2;
                    padding:14px;
                    border:1px solid var(--separator);
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                "
            >
                <span
                    style="
                        font-size:12px;
                        color:var(--text-secondary);
                        font-weight:600;
                    "
                >
                    Alertas de cobranza
                </span>

                <span
                    class="status-badge"
                    style="
                        background:
                            ${
                                kpis.alertas > 0
                                    ? 'rgba(255,59,48,0.12)'
                                    : 'rgba(52,199,89,0.12)'
                            };

                        color:
                            ${
                                kpis.alertas > 0
                                    ? '#FF3B30'
                                    : '#34C759'
                            };

                        border:
                            1px solid
                            ${
                                kpis.alertas > 0
                                    ? 'rgba(255,59,48,0.18)'
                                    : 'rgba(52,199,89,0.18)'
                            };
                    "
                >
                    ${kpis.alertas} pólizas
                </span>
            </div>
        `;
    },

    // ═══════════════════════════════════════
    // FORM
    // ═══════════════════════════════════════

    renderFormulario() {

        return `
            <section
                class="glass-widget"
                style="
                    padding:16px;
                    margin-bottom:20px;
                "
            >
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:14px;
                    "
                >
                    <h2
                        id="cartera-form-title"
                        style="
                            margin:0;
                            font-size:16px;
                            font-weight:700;
                        "
                    >
                        Alta de Póliza
                    </h2>

                    <span
                        id="cartera-form-mode"
                        class="status-badge"
                    >
                        NUEVA
                    </span>
                </div>

                <form
                    id="cartera-form"
                    autocomplete="off"
                >
                    <div
                        style="
                            display:grid;
                            grid-template-columns:
                                repeat(2, 1fr);
                            gap:10px;
                        "
                    >

                        <input
                            id="c-cliente"
                            name="cliente"
                            class="glass-input"
                            placeholder="Nombre del cliente"
                            style="grid-column:span 2;"
                            maxlength="120"
                        >

                        <div>
                            <label class="field-label">
                                Fecha Nacimiento
                            </label>

                            <input
                                id="c-nacimiento"
                                name="nacimiento"
                                type="date"
                                class="glass-input"
                            >
                        </div>

                        <div>
                            <label class="field-label">
                                Fecha Emisión
                            </label>

                            <input
                                id="c-emision"
                                name="emision"
                                type="date"
                                class="glass-input"
                            >
                        </div>

                        <input
                            id="c-poliza"
                            name="poliza"
                            class="glass-input"
                            placeholder="Número de póliza"
                            style="grid-column:span 2;"
                            maxlength="80"
                        >

                        <select
                            id="c-plan"
                            name="plan"
                            class="glass-input"
                            style="grid-column:span 2;"
                        >
                            <option value="">
                                Producto contratado...
                            </option>

                            <optgroup
                                label="Seguros Vida"
                            >
                                <option value="Star Temporal">
                                    Star Temporal
                                </option>

                                <option value="Orvi 99">
                                    Orvi 99
                                </option>

                                <option value="Respaldo Educativo">
                                    Respaldo Educativo
                                </option>
                            </optgroup>

                            <optgroup
                                label="GMM"
                            >
                                <option value="Alfa Medical">
                                    Alfa Medical
                                </option>

                                <option value="Alfa Medical Flex">
                                    Alfa Medical Flex
                                </option>
                            </optgroup>
                        </select>

                        <select
                            id="c-forma-pago"
                            name="formaPago"
                            class="glass-input"
                        >
                            <option value="">
                                Frecuencia...
                            </option>

                            <option value="Mensual">
                                Mensual
                            </option>

                            <option value="Trimestral">
                                Trimestral
                            </option>

                            <option value="Semestral">
                                Semestral
                            </option>

                            <option value="Anual">
                                Anual
                            </option>

                            <option value="Prima Única">
                                Prima Única
                            </option>
                        </select>

                        <select
                            id="c-moneda"
                            name="moneda"
                            class="glass-input"
                        >
                            <option value="MXN">
                                MXN
                            </option>

                            <option value="USD">
                                USD
                            </option>

                            <option value="UDIS">
                                UDIS
                            </option>
                        </select>

                        <input
                            id="c-prima"
                            name="prima"
                            type="number"
                            class="glass-input"
                            placeholder="Prima"
                        >

                        <input
                            id="c-suma"
                            name="suma"
                            type="number"
                            class="glass-input"
                            placeholder="Suma asegurada"
                        >

                        <div
                            style="
                                grid-column:span 2;
                                display:flex;
                                align-items:center;
                                gap:8px;
                                margin-top:4px;
                            "
                        >
                            <input
                                id="c-personal"
                                name="esPersonal"
                                type="checkbox"
                            >

                            <label
                                for="c-personal"
                                style="
                                    font-size:13px;
                                    color:var(--text-secondary);
                                "
                            >
                                Excluir de concursos
                            </label>
                        </div>

                        <button
                            id="btn-save-poliza"
                            type="submit"
                            class="btn-primary"
                            style="
                                grid-column:span 2;
                                margin-top:10px;
                            "
                        >
                            💾 Guardar póliza
                        </button>

                        <button
                            id="btn-cancel-edit"
                            type="button"
                            class="btn-secondary"
                            style="
                                display:none;
                                grid-column:span 2;
                            "
                        >
                            Cancelar edición
                        </button>
                    </div>
                </form>
            </section>
        `;
    },

    // ═══════════════════════════════════════
    // IMPORT
    // ═══════════════════════════════════════

    renderImportador() {

        return `
            <section
                class="glass-widget"
                style="
                    padding:16px;
                    margin-bottom:20px;
                    border:2px dashed rgba(150,150,150,0.25);
                    background:transparent;
                "
            >
                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        align-items:center;
                        margin-bottom:12px;
                    "
                >
                    <div>
                        <h2
                            style="
                                margin:0;
                                font-size:16px;
                                font-weight:700;
                            "
                        >
                            Importación Excel
                        </h2>

                        <span
                            style="
                                font-size:12px;
                                color:var(--text-secondary);
                            "
                        >
                            Procesamiento optimizado
                        </span>
                    </div>

                    <span
                        id="excel-import-status"
                        class="status-badge"
                    >
                        Idle
                    </span>
                </div>

                <input
                    type="file"
                    id="excel-file-input"
                    accept=".xlsx,.xls"
                    hidden
                >

                <button
                    id="btn-import-excel"
                    class="btn-secondary"
                >
                    📥 Importar Excel
                </button>
            </section>
        `;
    },

    // ═══════════════════════════════════════
    // LIST
    // ═══════════════════════════════════════

    renderListadoSection() {

        return `
            <section
                class="glass-widget"
                style="
                    padding:16px;
                "
            >
                <div
                    style="
                        display:flex;
                        gap:10px;
                        margin-bottom:16px;
                    "
                >
                    <input
                        id="cartera-search"
                        class="glass-input"
                        placeholder="Buscar cliente o póliza..."
                        autocomplete="off"
                    >
                </div>

                <div
                    id="cartera-list"
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:12px;
                    "
                >
                    ${this.renderEmptyState()}
                </div>
            </section>
        `;
    },

    renderPolizas(polizas = []) {

        const root =
            document.getElementById(
                'cartera-list'
            );

        if (!root) return;

        if (!polizas.length) {

            root.innerHTML =
                this.renderEmptyState();

            return;
        }

        const fragment =
            document.createDocumentFragment();

        for (const item of polizas) {

            fragment.appendChild(
                this.createPolizaCard(item)
            );
        }

        root.replaceChildren(fragment);
    },

    createPolizaCard(poliza) {

        const node =
            document.createElement('article');

        node.className =
            'glass-widget';

        node.style.padding =
            '16px';

        const status =
            this.resolveStatus(poliza);

        node.dataset.polizaId =
            poliza.id;

        node.innerHTML = `
            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:12px;
                "
            >
                <div
                    style="
                        min-width:0;
                        flex:1;
                    "
                >
                    <h3
                        style="
                            margin:0;
                            font-size:15px;
                            font-weight:700;
                            word-break:break-word;
                        "
                    >
                        ${escapeHTML(
                            poliza.cliente
                        )}
                    </h3>

                    <div
                        style="
                            margin-top:6px;
                            font-size:12px;
                            color:var(--text-secondary);
                            line-height:1.5;
                        "
                    >
                        <div>
                            <strong>
                                ${escapeHTML(
                                    poliza.poliza
                                )}
                            </strong>
                        </div>

                        <div>
                            ${escapeHTML(
                                poliza.plan || '-'
                            )}
                        </div>
                    </div>
                </div>

                <div
                    class="status-badge"
                    style="
                        background:${status.color}1A;
                        color:${status.color};
                        border:1px solid ${status.color}30;
                        font-size:11px;
                        font-weight:700;
                        white-space:nowrap;
                    "
                >
                    ${status.icon}
                    ${escapeHTML(
                        poliza.fechaPago || '-'
                    )}
                </div>
            </div>

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-top:14px;
                    padding-top:12px;
                    border-top:
                        1px solid
                        rgba(150,150,150,0.08);
                "
            >
                <div
                    style="
                        display:flex;
                        flex-direction:column;
                    "
                >
                    <span
                        style="
                            font-size:11px;
                            color:var(--text-secondary);
                        "
                    >
                        Prima
                    </span>

                    <strong
                        style="
                            font-size:15px;
                        "
                    >
                        ${formatCurrency(
                            poliza.prima || 0
                        )}
                    </strong>
                </div>

                <div
                    style="
                        display:flex;
                        gap:8px;
                    "
                >
                    <button
                        class="btn-secondary btn-sm"
                        data-action="edit-poliza"
                        data-id="${poliza.id}"
                    >
                        ✏️ Editar
                    </button>

                    <button
                        class="btn-danger btn-sm"
                        data-action="delete-poliza"
                        data-id="${poliza.id}"
                    >
                        🗑 Eliminar
                    </button>
                </div>
            </div>
        `;

        return node;
    },

    resolveStatus(poliza) {

        if (
            poliza.formaPago ===
            'Prima Única'
        ) {

            return STATUS_CONFIG.paid;
        }

        const dias =
            poliza.diasRestantes;

        if (dias < 0) {

            return STATUS_CONFIG.overdue;
        }

        if (dias <= 15) {

            return STATUS_CONFIG.warning;
        }

        return STATUS_CONFIG.normal;
    },

    renderEmptyState() {

        return `
            <div
                style="
                    padding:42px 20px;
                    text-align:center;
                "
            >
                <div
                    style="
                        font-size:48px;
                        margin-bottom:12px;
                    "
                >
                    📂
                </div>

                <h3
                    style="
                        margin:0 0 6px;
                        font-size:16px;
                    "
                >
                    Sin pólizas
                </h3>

                <p
                    style="
                        margin:0;
                        font-size:13px;
                        color:var(--text-secondary);
                    "
                >
                    Aún no existen registros.
                </p>
            </div>
        `;
    },

    // ═══════════════════════════════════════
    // FORM STATES
    // ═══════════════════════════════════════

    populateForm(poliza) {

        if (!poliza) return;

        const map = {
            cliente: 'c-cliente',
            nacimiento: 'c-nacimiento',
            emision: 'c-emision',
            poliza: 'c-poliza',
            plan: 'c-plan',
            formaPago: 'c-forma-pago',
            moneda: 'c-moneda',
            prima: 'c-prima',
            suma: 'c-suma'
        };

        for (const key in map) {

            const el =
                document.getElementById(
                    map[key]
                );

            if (el) {

                el.value =
                    poliza[key] || '';
            }
        }

        const checkbox =
            document.getElementById(
                'c-personal'
            );

        if (checkbox) {

            checkbox.checked =
                Boolean(
                    poliza.esPersonal
                );
        }

        const title =
            document.getElementById(
                'cartera-form-title'
            );

        if (title) {

            title.innerText =
                'Editar póliza';
        }

        const mode =
            document.getElementById(
                'cartera-form-mode'
            );

        if (mode) {

            mode.innerText =
                'EDITANDO';
        }

        const cancel =
            document.getElementById(
                'btn-cancel-edit'
            );

        if (cancel) {

            cancel.style.display =
                'block';
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },

    resetForm() {

        const form =
            document.getElementById(
                'cartera-form'
            );

        if (form) {

            form.reset();
        }

        const title =
            document.getElementById(
                'cartera-form-title'
            );

        if (title) {

            title.innerText =
                'Alta de Póliza';
        }

        const mode =
            document.getElementById(
                'cartera-form-mode'
            );

        if (mode) {

            mode.innerText =
                'NUEVA';
        }

        const cancel =
            document.getElementById(
                'btn-cancel-edit'
            );

        if (cancel) {

            cancel.style.display =
                'none';
        }
    },

    setImportStatus(text) {

        const el =
            document.getElementById(
                'excel-import-status'
            );

        if (el) {

            el.innerText = text;
        }
    }
};