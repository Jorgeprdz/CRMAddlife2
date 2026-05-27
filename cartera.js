// cartera.js
// ENTERPRISE POLICY MANAGEMENT ENGINE
// Production Ready Module

import { DB } from './db.js';

import {
    showToast,
    showConfirm
} from './utils.js';

import {
    AppState
} from './state-manager.js';

import {
    EventBus
} from './event-system.js';

import {
    RenderEngine
} from './ui-render-engine.js';

import {
    Analytics
} from './analytics-engine.js';

import {
    Logger
} from './logger.js';

import {
    Memory
} from './memory-manager.js';

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const CarteraState = {

    data: [],

    filtered: [],

    editingId: null,

    search: '',

    rendering: false,

    destroyed: false,

    virtualLimit: 50,

    importing: false
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function escapeHTML(value = '') {

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function currency(value = 0) {

    return new Intl.NumberFormat(
        'es-MX',
        {
            style: 'currency',
            currency: 'MXN'
        }
    ).format(value || 0);
}

function normalizeText(text = '') {

    return String(text)
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function safeDate(date) {

    if (!date) {

        return '';
    }

    try {

        return new Date(date)
            .toISOString()
            .split('T')[0];

    } catch {

        return '';
    }
}

function generateId() {

    return crypto.randomUUID();
}

function debounce(
    fn,
    delay = 250
) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(() => {

            fn(...args);

        }, delay);
    };
}

// ═══════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════

export function renderCartera() {

    return `
    <div
        id="cartera-root"
        style="padding-bottom:40px;"
    >

        <div
            class="glass-widget"
            style="
                padding:18px;
                margin-bottom:20px;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:16px;
                "
            >

                <div>

                    <h2
                        style="
                            margin:0;
                            font-size:22px;
                            font-weight:800;
                        "
                    >
                        Cartera
                    </h2>

                    <span
                        style="
                            font-size:12px;
                            color:var(--text-secondary);
                        "
                    >
                        Gestión enterprise de pólizas
                    </span>

                </div>

                <button
                    id="btn-import-excel"
                    class="btn-secondary btn-sm"
                >
                    📥 Excel
                </button>

            </div>

            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(3,1fr);
                    gap:10px;
                "
            >

                <div
                    class="glass-widget"
                    style="padding:14px;"
                >

                    <span
                        style="
                            font-size:11px;
                            color:var(--text-secondary);
                            text-transform:uppercase;
                            font-weight:700;
                        "
                    >
                        Total pólizas
                    </span>

                    <div
                        id="kpi-total-polizas"
                        style="
                            margin-top:8px;
                            font-size:24px;
                            font-weight:800;
                        "
                    >
                        0
                    </div>

                </div>

                <div
                    class="glass-widget"
                    style="padding:14px;"
                >

                    <span
                        style="
                            font-size:11px;
                            color:var(--text-secondary);
                            text-transform:uppercase;
                            font-weight:700;
                        "
                    >
                        Prima total
                    </span>

                    <div
                        id="kpi-total-prima"
                        style="
                            margin-top:8px;
                            font-size:24px;
                            font-weight:800;
                            color:var(--success);
                        "
                    >
                        $0
                    </div>

                </div>

                <div
                    class="glass-widget"
                    style="padding:14px;"
                >

                    <span
                        style="
                            font-size:11px;
                            color:var(--text-secondary);
                            text-transform:uppercase;
                            font-weight:700;
                        "
                    >
                        Alertas
                    </span>

                    <div
                        id="kpi-alertas"
                        style="
                            margin-top:8px;
                            font-size:24px;
                            font-weight:800;
                            color:#FF9500;
                        "
                    >
                        0
                    </div>

                </div>

            </div>

        </div>

        <div
            class="glass-widget"
            style="
                padding:18px;
                margin-bottom:18px;
            "
        >

            <div
                style="
                    display:flex;
                    gap:10px;
                    margin-bottom:14px;
                "
            >

                <input
                    id="cartera-search"
                    class="glass-input"
                    placeholder="Buscar cliente o póliza..."
                    autocomplete="off"
                    spellcheck="false"
                    style="flex:1;"
                >

                <button
                    id="btn-new-policy"
                    class="btn-primary"
                >
                    ➕ Nueva
                </button>

            </div>

            <div
                id="cartera-list"
                style="
                    display:flex;
                    flex-direction:column;
                    gap:12px;
                "
            ></div>

        </div>

        <input
            type="file"
            id="excel-input"
            accept=".xlsx,.xls"
            style="display:none;"
        >

    </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// BIND
// ═══════════════════════════════════════════════════════════════

export async function bindCarteraEvents() {

    CarteraState.destroyed =
        false;

    await loadData();

    const root =
        document.getElementById(
            'cartera-root'
        );

    if (!root) {

        return;
    }

    const searchInput =
        document.getElementById(
            'cartera-search'
        );

    const debouncedSearch =
        debounce(event => {

            CarteraState.search =
                event.target.value;

            filterData();

        });

    searchInput?.addEventListener(
        'input',
        debouncedSearch
    );

    root.addEventListener(
        'click',
        handleClicks
    );

    document
        .getElementById(
            'excel-input'
        )
        ?.addEventListener(
            'change',
            importExcel
        );

    Memory.add(() => {

        root.removeEventListener(
            'click',
            handleClicks
        );

        searchInput?.removeEventListener(
            'input',
            debouncedSearch
        );
    });

    EventBus.emit(
        'cartera:mounted'
    );
}

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

async function loadData() {

    try {

        const data =
            await DB.obtenerTodos(
                'cartera'
            );

        CarteraState.data =
            Array.isArray(data)
                ? data
                : [];

        AppState.set(
            'cartera',
            CarteraState.data
        );

        filterData();

        renderKPIs();

    } catch (err) {

        Logger.error(
            '[CARTERA LOAD ERROR]',
            err
        );

        showToast(
            'Error cargando cartera',
            'danger'
        );
    }
}

function filterData() {

    const query =
        normalizeText(
            CarteraState.search
        );

    if (!query) {

        CarteraState.filtered =
            [...CarteraState.data];

    } else {

        CarteraState.filtered =
            CarteraState.data.filter(
                item => {

                    return normalizeText(
                        item.cliente
                    ).includes(query)

                    ||

                    normalizeText(
                        item.poliza
                    ).includes(query);
                }
            );
    }

    renderList();
}

function renderKPIs() {

    const total =
        CarteraState.data.length;

    const prima =
        CarteraState.data.reduce(
            (
                acc,
                item
            ) => {

                return acc +
                    (
                        Number(item.prima)
                        || 0
                    );

            },
            0
        );

    const alerts =
        CarteraState.data.filter(
            item => {

                if (!item.fechaPago) {

                    return false;
                }

                const days =
                    Math.ceil(
                        (
                            new Date(item.fechaPago)
                            - new Date()
                        ) / 86400000
                    );

                return days <= 30;
            }
        ).length;

    document.getElementById(
        'kpi-total-polizas'
    ).innerText = total;

    document.getElementById(
        'kpi-total-prima'
    ).innerText = currency(prima);

    document.getElementById(
        'kpi-alertas'
    ).innerText = alerts;
}

// ═══════════════════════════════════════════════════════════════
// VIRTUAL RENDER
// ═══════════════════════════════════════════════════════════════

function renderList() {

    if (
        CarteraState.rendering
    ) {

        return;
    }

    CarteraState.rendering =
        true;

    RenderEngine.schedule(() => {

        try {

            const container =
                document.getElementById(
                    'cartera-list'
                );

            if (!container) {

                return;
            }

            const rows =
                CarteraState.filtered
                    .slice(
                        0,
                        CarteraState.virtualLimit
                    );

            container.innerHTML =
                rows.map(renderCard)
                    .join('');

        } finally {

            CarteraState.rendering =
                false;
        }
    });
}

function renderCard(policy) {

    const cliente =
        escapeHTML(
            policy.cliente
        );

    const poliza =
        escapeHTML(
            policy.poliza
        );

    const plan =
        escapeHTML(
            policy.plan
        );

    return `
    <div
        class="glass-widget"
        style="
            padding:16px;
        "
    >

        <div
            style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:12px;
            "
        >

            <div>

                <h3
                    style="
                        margin:0;
                        font-size:15px;
                        font-weight:700;
                    "
                >
                    ${cliente}
                </h3>

                <div
                    style="
                        margin-top:4px;
                        font-size:12px;
                        color:var(--text-secondary);
                    "
                >
                    ${poliza}
                </div>

                <div
                    style="
                        margin-top:4px;
                        font-size:12px;
                        color:var(--text-secondary);
                    "
                >
                    ${plan}
                </div>

            </div>

            <div
                style="
                    text-align:right;
                "
            >

                <div
                    style="
                        font-size:14px;
                        font-weight:700;
                        color:var(--success);
                    "
                >
                    ${currency(policy.prima)}
                </div>

                <div
                    style="
                        margin-top:6px;
                        font-size:11px;
                        color:var(--text-secondary);
                    "
                >
                    ${safeDate(policy.fechaPago)}
                </div>

            </div>

        </div>

        <div
            style="
                display:flex;
                justify-content:flex-end;
                gap:8px;
                margin-top:14px;
            "
        >

            <button
                class="btn-secondary btn-sm"
                data-edit="${policy.id}"
            >
                ✏️ Editar
            </button>

            <button
                class="btn-secondary btn-sm"
                data-delete="${policy.id}"
                style="
                    color:#FF3B30;
                "
            >
                🗑 Eliminar
            </button>

        </div>

    </div>
    `;
}

// ═══════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════

async function handleClicks(event) {

    const edit =
        event.target.closest(
            '[data-edit]'
        );

    if (edit) {

        const id =
            edit.dataset.edit;

        editPolicy(id);

        return;
    }

    const remove =
        event.target.closest(
            '[data-delete]'
        );

    if (remove) {

        const id =
            remove.dataset.delete;

        await deletePolicy(id);

        return;
    }

    if (
        event.target.id ===
        'btn-import-excel'
    ) {

        document
            .getElementById(
                'excel-input'
            )
            ?.click();

        return;
    }

    if (
        event.target.id ===
        'btn-new-policy'
    ) {

        showToast(
            'Formulario enterprise próximamente',
            'info'
        );
    }
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

function editPolicy(id) {

    const policy =
        CarteraState.data.find(
            item => item.id === id
        );

    if (!policy) {

        return;
    }

    CarteraState.editingId =
        id;

    Analytics.track(
        'policy_edit',
        { id }
    );

    showToast(
        `Editando ${policy.cliente}`,
        'info'
    );
}

async function deletePolicy(id) {

    const confirmed =
        await showConfirm(
            '¿Eliminar póliza?',
            'Confirmar',
            'Eliminar',
            true
        );

    if (!confirmed) {

        return;
    }

    try {

        await DB.eliminar(
            'cartera',
            id
        );

        CarteraState.data =
            CarteraState.data.filter(
                item => item.id !== id
            );

        filterData();

        renderKPIs();

        Analytics.track(
            'policy_deleted',
            { id }
        );

        EventBus.emit(
            'cartera:updated'
        );

        showToast(
            'Póliza eliminada',
            'success'
        );

    } catch (err) {

        Logger.error(
            '[DELETE POLICY ERROR]',
            err
        );

        showToast(
            'Error eliminando póliza',
            'danger'
        );
    }
}

// ═══════════════════════════════════════════════════════════════
// EXCEL IMPORT
// ═══════════════════════════════════════════════════════════════

async function importExcel(event) {

    try {

        const file =
            event.target.files?.[0];

        if (!file) {

            return;
        }

        if (
            CarteraState.importing
        ) {

            return;
        }

        CarteraState.importing =
            true;

        showToast(
            'Importando Excel...',
            'warning'
        );

        if (!window.XLSX) {

            await loadXLSX();
        }

        const buffer =
            await file.arrayBuffer();

        const workbook =
            XLSX.read(buffer);

        const sheet =
            workbook.Sheets[
                workbook.SheetNames[0]
            ];

        const rows =
            XLSX.utils.sheet_to_json(
                sheet
            );

        const batchSize = 50;

        let imported = 0;

        for (
            let i = 0;
            i < rows.length;
            i += batchSize
        ) {

            const batch =
                rows.slice(
                    i,
                    i + batchSize
                );

            await Promise.all(

                batch.map(async row => {

                    try {

                        const cliente =
                            String(
                                row.Cliente ||
                                row.cliente ||
                                ''
                            ).trim();

                        const poliza =
                            String(
                                row.Poliza ||
                                row.poliza ||
                                ''
                            ).trim();

                        if (
                            !cliente ||
                            !poliza
                        ) {

                            return;
                        }

                        const exists =
                            CarteraState.data
                                .some(
                                    item => {

                                        return item.poliza === poliza;
                                    }
                                );

                        if (exists) {

                            return;
                        }

                        const payload = {

                            id:
                                generateId(),

                            cliente,

                            poliza,

                            plan:
                                row.Plan ||
                                '',

                            prima:
                                Number(
                                    row.Prima || 0
                                ),

                            fechaPago:
                                safeDate(
                                    row.FechaPago
                                )
                        };

                        await DB.guardar(
                            'cartera',
                            payload
                        );

                        CarteraState.data.push(
                            payload
                        );

                        imported++;

                    } catch (err) {

                        Logger.error(
                            '[IMPORT ROW ERROR]',
                            err
                        );
                    }
                })
            );

            await new Promise(
                resolve => {

                    requestAnimationFrame(
                        resolve
                    );
                }
            );
        }

        filterData();

        renderKPIs();

        showToast(
            `${imported} pólizas importadas`,
            'success'
        );

        Analytics.track(
            'excel_import',
            {
                imported
            }
        );

    } catch (err) {

        Logger.error(
            '[IMPORT ERROR]',
            err
        );

        showToast(
            'Error importando Excel',
            'danger'
        );

    } finally {

        CarteraState.importing =
            false;

        event.target.value = '';
    }
}

async function loadXLSX() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const script =
                document.createElement(
                    'script'
                );

            script.src =
                'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

            script.onload =
                resolve;

            script.onerror =
                reject;

            document.head.appendChild(
                script
            );
        }
    );
}