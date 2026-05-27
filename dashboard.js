// dashboard.js
// Dashboard Ejecutivo — Enterprise Architecture
// ─────────────────────────────────────────────────────────────────────────────
// ARQUITECTURA:
//   UI Template (renderDashboard)
//     → Controller (DashboardController.init)
//       → DB Layer (DB.obtenerTodos)
//         → State (AppState.get / AppState.set)
//           → EventBus (EventBus.emit)
//             → RenderEngine (RenderEngine.schedule)
//
// GARANTÍAS:
//   - Sin dependencia circular (NO importa de app.js)
//   - Usuario leído de AppState (puesto por AuthService antes del navigate)
//   - AbortController: cancela async si el módulo se destruye antes de resolver
//   - Cleanup registrado en Memory: el router destruye limpiamente
//   - Sanitización de todos los datos externos antes de inyectar al DOM
//   - Logger en lugar de console.* directo
//   - EventBus para comunicación desacoplada con otros módulos
//   - RenderEngine.schedule() para todas las mutaciones DOM
// ─────────────────────────────────────────────────────────────────────────────

import { DB }           from './db.js';
import { AppState }     from './state-manager.js';
import { EventBus }     from './event-system.js';
import { Logger }       from './logger.js';
import { Memory }       from './memory-manager.js';
import { RenderEngine } from './ui-render-engine.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE NEGOCIO
// ─────────────────────────────────────────────────────────────────────────────

const DASHBOARD_CONFIG = Object.freeze({
    META_SEMANAL:        125,
    VENTANA_FIDELIZACION: 30,    // días
    MS_POR_DIA:          86_400_000,

    PUNTOS: Object.freeze({
        referidos:        1,
        llamadas:         0.5,
        citas_agendadas:  2,
        citas_conectadas: 5,
        citas_cierre:     5,
        solicitudes:      10,
        pagadas:          15,
    }),
});

// ─────────────────────────────────────────────────────────────────────────────
// SANITIZADOR — Prevención XSS
// Todos los datos externos (DB, user_metadata) pasan por aquí antes del DOM
// ─────────────────────────────────────────────────────────────────────────────

const Sanitizer = {
    /**
     * Escapa caracteres HTML peligrosos en un string.
     * Nunca usar .innerHTML con datos sin pasar por aquí primero.
     * @param {unknown} value
     * @returns {string}
     */
    escape(value) {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#x27;');
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// CALCULADORAS DE NEGOCIO — Pure functions, sin efectos secundarios
// ─────────────────────────────────────────────────────────────────────────────

const DashboardCalculator = {

    /**
     * Calcula puntos acumulados en la semana actual (lunes–viernes).
     * @param {Array} historial — registros de actividad_diaria
     * @returns {{ puntos: number, meta: number, faltantes: number, badge: string }}
     */
    productividad(historial) {

        const hoy   = new Date();
        hoy.setHours(0, 0, 0, 0);

        const diaSemana = hoy.getDay(); // 0=Dom … 6=Sab
        const diasDesLunes = diaSemana === 0 ? 6 : diaSemana - 1;

        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - diasDesLunes);

        const viernes = new Date(lunes);
        viernes.setDate(lunes.getDate() + 4);
        viernes.setHours(23, 59, 59, 999);

        let puntos = 0;

        if (Array.isArray(historial)) {
            historial.forEach(reg => {
                // reg.id se usa como fecha YYYY-MM-DD
                const fechaReg = new Date(reg.id + 'T12:00:00');
                if (fechaReg >= lunes && fechaReg <= viernes) {
                    const p = DASHBOARD_CONFIG.PUNTOS;
                    puntos +=
                        ((reg.referidos          || 0) * p.referidos)        +
                        ((reg.llamadas            || 0) * p.llamadas)         +
                        ((reg.citas_agendadas     || 0) * p.citas_agendadas)  +
                        ((reg.citas_conectadas    || 0) * p.citas_conectadas) +
                        ((reg.citas_cierre        || 0) * p.citas_cierre)     +
                        ((reg.solicitudes         || 0) * p.solicitudes)      +
                        ((reg.pagadas             || 0) * p.pagadas);
                }
            });
        }

        const meta       = DASHBOARD_CONFIG.META_SEMANAL;
        const faltantes  = Math.max(0, meta - puntos);
        const numDia     = hoy.getDay();
        const diasRest   = (numDia >= 1 && numDia <= 5) ? (6 - numDia) : 0;

        let badge = '';
        if (faltantes <= 0) {
            badge = `<span class="badge badge-green">🎉 Meta cumplida</span>`;
        } else if (diasRest > 0) {
            const ptsDia = Math.ceil(faltantes / diasRest);
            badge = `<span class="badge badge-red">~${ptsDia} pts/día</span>`;
        } else {
            badge = `<span class="badge badge-orange">Sem. terminada</span>`;
        }

        return { puntos, meta, faltantes, badge };
    },

    /**
     * Calcula alertas de fidelización (cumpleaños, edad actuarial, aniversario póliza)
     * en los próximos N días.
     * @param {Array} cartera
     * @returns {string[]} — array de strings HTML ya sanitizados
     */
    fidelizacion(cartera) {

        const hoy    = new Date();
        const alertas = [];
        const ventana = DASHBOARD_CONFIG.VENTANA_FIDELIZACION;
        const msDay   = DASHBOARD_CONFIG.MS_POR_DIA;

        if (!Array.isArray(cartera)) return alertas;

        cartera.forEach(p => {
            const cliente = Sanitizer.escape(p.cliente);
            const poliza  = Sanitizer.escape(p.poliza);

            // — Cumpleaños
            if (p.nacimiento) {
                const fNac = new Date(p.nacimiento + 'T12:00:00');
                let proxCumple = new Date(
                    hoy.getFullYear(),
                    fNac.getMonth(),
                    fNac.getDate()
                );
                if (proxCumple < hoy) proxCumple.setFullYear(hoy.getFullYear() + 1);
                const diasCumple = Math.ceil((proxCumple - hoy) / msDay);

                if (diasCumple <= ventana) {
                    alertas.push(
                        `<div class="fidelization-row">` +
                            `<span>🎂 <strong>${cliente}</strong></span>` +
                            `<span class="badge badge-blue">en ${diasCumple}d</span>` +
                        `</div>`
                    );
                }

                // — Edad actuarial (6 meses antes del cumpleaños)
                let proxAct = new Date(proxCumple);
                proxAct.setMonth(proxAct.getMonth() - 6);
                if (proxAct < hoy) proxAct.setFullYear(proxAct.getFullYear() + 1);
                const diasAct = Math.ceil((proxAct - hoy) / msDay);

                if (diasAct <= ventana) {
                    alertas.push(
                        `<div class="fidelization-row">` +
                            `<span>📈 <strong>${cliente}</strong> ` +
                            `<span style="color:var(--text-tertiary);">edad actuarial</span></span>` +
                            `<span class="badge badge-orange">en ${diasAct}d</span>` +
                        `</div>`
                    );
                }
            }

            // — Aniversario de póliza
            if (p.emision) {
                const fEmi = new Date(p.emision + 'T12:00:00');
                let proxAniv = new Date(
                    hoy.getFullYear(),
                    fEmi.getMonth(),
                    fEmi.getDate()
                );
                if (proxAniv < hoy) proxAniv.setFullYear(hoy.getFullYear() + 1);
                const diasAniv = Math.ceil((proxAniv - hoy) / msDay);

                if (diasAniv <= ventana) {
                    alertas.push(
                        `<div class="fidelization-row">` +
                            `<span>🛡️ <strong>${poliza}</strong> ` +
                            `<span style="color:var(--text-tertiary);">aniversario</span></span>` +
                            `<span class="badge badge-purple">en ${diasAniv}d</span>` +
                        `</div>`
                    );
                }
            }
        });

        return alertas;
    },

    /**
     * Calcula pólizas con cobro pendiente en el mes actual.
     * @param {Array} cartera
     * @returns {string} — HTML ya sanitizado
     */
    cobranza(cartera) {

        const hoy = new Date();

        if (!Array.isArray(cartera)) {
            return `<p style="color:var(--color-success);font-size:14px;font-weight:600;">✅ Sin pólizas pendientes este mes.</p>`;
        }

        const pendientes = cartera.filter(p => {
            if (!p.fechaPago) return false;
            const f = new Date(p.fechaPago + 'T12:00:00');
            return (
                f.getMonth()    === hoy.getMonth() &&
                f.getFullYear() === hoy.getFullYear()
            );
        });

        if (pendientes.length === 0) {
            return `<p style="color:var(--color-success);font-size:14px;font-weight:600;">✅ Sin pólizas pendientes este mes.</p>`;
        }

        const nombres = pendientes
            .map(p => `<strong>${Sanitizer.escape(p.cliente)}</strong>`)
            .join(', ');

        return `<p style="color:var(--color-danger);font-size:14px;">⚠️ Pólizas de ${nombres} pendientes de cobro.</p>`;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM WRITER — Aísla todas las mutaciones DOM
// Cada método es idempotente y defensivo (verifica que el elemento existe)
// ─────────────────────────────────────────────────────────────────────────────

const DashboardView = {

    /**
     * Escribe el saludo personalizado en #dash-saludo.
     * @param {string} nombre — ya sanitizado antes de llamar
     */
    renderSaludo(nombre) {
        const el = document.getElementById('dash-saludo');
        if (!el) return;
        const hora   = new Date().getHours();
        const saludo =
            hora >= 5  && hora < 12 ? 'Buenos días'   :
            hora >= 12 && hora < 19 ? 'Buenas tardes' :
                                      'Buenas noches';
        // nombre ya viene sanitizado desde el controller
        el.innerHTML = `${saludo}, ${nombre} 👋`;
    },

    /**
     * Actualiza el KPI tile de puntos (#dash-pts-kpi).
     * @param {number} puntos
     */
    renderKpiPuntos(puntos) {
        const el = document.getElementById('dash-pts-kpi');
        if (!el) return;
        const valueEl = el.querySelector('.widget-value');
        if (valueEl) valueEl.textContent = puntos;
    },

    /**
     * Renderiza la sección de productividad semanal.
     * @param {{ puntos, meta, faltantes, badge }} kpi
     */
    renderProductividad(kpi) {
        const el = document.getElementById('dash-productividad');
        if (!el) return;
        const pct = Math.min(100, Math.round((kpi.puntos / kpi.meta) * 100));
        el.innerHTML =
            `<p style="font-size:14px;margin-bottom:10px;">` +
                `Esta semana llevas <strong>${kpi.puntos}</strong> de ${kpi.meta} puntos. ` +
                `Faltan <strong style="color:var(--color-danger);">${kpi.faltantes}</strong>.` +
            `</p>` +
            `<div class="progress-bar-track">` +
                `<div class="progress-bar-fill" style="width:${pct}%;"></div>` +
            `</div>` +
            `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">` +
                `<span style="font-size:12px;color:var(--text-secondary);font-weight:600;">${pct}% completado</span>` +
                `${kpi.badge}` +
            `</div>`;
    },

    /**
     * Renderiza el radar de fidelización.
     * @param {string[]} alertas — HTML pre-sanitizado
     */
    renderFidelizacion(alertas) {
        const el = document.getElementById('dash-fidelizacion');
        if (!el) return;
        el.innerHTML = alertas.length > 0
            ? alertas.join('')
            : `<p style="font-size:13px;color:var(--text-secondary);">Sin eventos próximos en los siguientes 30 días. ✅</p>`;
    },

    /**
     * Renderiza la sección de control de cartera / cobranza.
     * @param {string} html — HTML pre-sanitizado
     */
    renderCobranza(html) {
        const el = document.getElementById('dash-cartera');
        if (!el) return;
        el.innerHTML = html;
    },

    /**
     * Renderiza estado de error en el dashboard.
     * @param {string} mensaje — texto plano, NO HTML
     */
    renderError(mensaje) {
        const el = document.getElementById('dash-productividad');
        if (!el) return;
        el.innerHTML =
            `<p style="color:var(--color-danger);font-size:13px;">` +
                `⚠️ ${Sanitizer.escape(mensaje)}` +
            `</p>`;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLER — Orquesta datos, estado y renderizado
// ─────────────────────────────────────────────────────────────────────────────

const DashboardController = {

    /** AbortController activo para la carga de datos en curso */
    _abortController: null,

    /**
     * Punto de entrada. Llamado por bindDashboardEvents() desde el router.
     * Lee usuario de AppState (puesto por AuthService), carga datos de DB,
     * hidrata el DOM via RenderEngine, registra cleanup en Memory.
     */
    async init() {

        Logger.info('[Dashboard] init');

        // — Cancela cualquier carga previa que pudiera estar en vuelo
        this._abort();

        const controller = new AbortController();
        this._abortController = controller;

        // — Registrar cleanup en MemoryManager
        // El router llama a Memory.cleanup() en destroyAll() antes de cada navigate
        Memory.add(() => this._abort());

        // — Suscripción reactiva: si AppState.cartera cambia (sync en background),
        //   refrescar automáticamente la sección relevante sin recargar todo
        const unsubscribe = AppState.subscribe((key, value) => {
            if (key === 'cartera' && Array.isArray(value)) {
                Logger.info('[Dashboard] cartera actualizada via AppState, refrescando secciones');
                this._refreshCarteraSections(value);
            }
        });
        Memory.add(unsubscribe);

        try {

            // — Leer usuario desde AppState (AuthService ya lo puso ahí)
            // NUNCA llamar a supabase.auth.getUser() desde una vista
            const userRaw   = AppState.get('user');
            const nombre    = Sanitizer.escape(
                userRaw?.user_metadata?.full_name?.split(' ')[0] || 'Asesor'
            );

            // — Cargar datos en paralelo con soporte de cancelación
            const [historial, cartera] = await Promise.all([
                this._fetchWithAbort(
                    () => DB.obtenerTodos('actividad_diaria'),
                    controller.signal
                ),
                this._fetchWithAbort(
                    () => DB.obtenerTodos('cartera'),
                    controller.signal
                ),
            ]);

            // — Guardar en AppState para que otros módulos (ej. cartera.js) lo reusen
            AppState.set('dashboard', { historial, cartera, loadedAt: Date.now() });

            // — Hidratar DOM via RenderEngine (batched, RAF-scheduled)
            RenderEngine.batch([
                () => DashboardView.renderSaludo(nombre),
                () => {
                    const kpi = DashboardCalculator.productividad(historial);
                    DashboardView.renderKpiPuntos(kpi.puntos);
                    DashboardView.renderProductividad(kpi);
                },
                () => {
                    const alertas = DashboardCalculator.fidelizacion(cartera);
                    DashboardView.renderFidelizacion(alertas);
                },
                () => {
                    const cobranza = DashboardCalculator.cobranza(cartera);
                    DashboardView.renderCobranza(cobranza);
                },
            ]);

            // — Notificar al sistema que el dashboard cargó correctamente
            EventBus.emit('dashboard:loaded', {
                puntosSemanales: DashboardCalculator.productividad(historial).puntos,
                totalCartera:    Array.isArray(cartera) ? cartera.length : 0,
            });

            Logger.info('[Dashboard] carga completada');

        } catch (err) {

            // — Si fue cancelación intencional, no loggear como error
            if (err?.name === 'AbortError') {
                Logger.info('[Dashboard] carga cancelada (navigate)');
                return;
            }

            Logger.error('[Dashboard] error al cargar datos:', err);

            RenderEngine.schedule(() => {
                DashboardView.renderError('Error al cargar el dashboard. Intenta de nuevo.');
            });

            EventBus.emit('dashboard:error', { message: err?.message });
        }
    },

    /**
     * Refresca solo las secciones de cartera cuando AppState.cartera cambia.
     * Evita recargar historial innecesariamente.
     * @param {Array} cartera
     */
    _refreshCarteraSections(cartera) {
        RenderEngine.batch([
            () => {
                const alertas = DashboardCalculator.fidelizacion(cartera);
                DashboardView.renderFidelizacion(alertas);
            },
            () => {
                const cobranza = DashboardCalculator.cobranza(cartera);
                DashboardView.renderCobranza(cobranza);
            },
        ]);
    },

    /**
     * Ejecuta un fetcher solo si la señal no fue abortada.
     * Permite cancelar fetches de IndexedDB cuando el usuario navega.
     * @param {() => Promise<any>} fetcher
     * @param {AbortSignal} signal
     * @returns {Promise<any>}
     */
    async _fetchWithAbort(fetcher, signal) {
        if (signal.aborted) {
            const err  = new Error('Aborted before fetch');
            err.name   = 'AbortError';
            throw err;
        }
        const result = await fetcher();
        if (signal.aborted) {
            const err  = new Error('Aborted after fetch');
            err.name   = 'AbortError';
            throw err;
        }
        return result;
    },

    /**
     * Aborta la carga en curso y limpia la referencia.
     */
    _abort() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE — Solo HTML estático. Cero lógica de negocio aquí.
// Los IDs deben coincidir exactamente con los usados en DashboardView.*
// ─────────────────────────────────────────────────────────────────────────────

export function renderDashboard() {
    return `
        <div id="dashboard-container" style="display:flex;flex-direction:column;gap:14px;">

            <!-- Hero Greeting Widget -->
            <div class="card widget-accent" style="padding:24px !important;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <p style="font-size:12px;font-weight:600;opacity:0.75;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">CRM Addlife</p>
                        <h1 id="dash-saludo" style="font-size:24px;color:white;font-weight:800;letter-spacing:-0.5px;margin:0;">
                            <div class="skeleton-text skeleton-shimmer" style="width:200px;height:28px;background:rgba(255,255,255,0.20);"></div>
                        </h1>
                        <p style="margin:6px 0 0 0;opacity:0.80;font-size:13px;color:white;font-weight:400;">Estatus de tu negocio hoy.</p>
                    </div>
                    <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📊</div>
                </div>
            </div>

            <!-- 2-col KPI Grid -->
            <div class="widget-grid">
                <div id="dash-pts-kpi" class="widget">
                    <span class="widget-title">Puntos semana</span>
                    <span class="widget-value" style="color:var(--color-primary);">—</span>
                </div>
                <div id="dash-meta-kpi" class="widget">
                    <span class="widget-title">Meta semanal</span>
                    <span class="widget-value">${DASHBOARD_CONFIG.META_SEMANAL}</span>
                </div>
            </div>

            <!-- Productividad -->
            <div class="card" style="border-left:4px solid var(--color-primary) !important;">
                <h2 style="font-size:16px;margin-bottom:14px;">📊 Productividad Semanal</h2>
                <div id="dash-productividad">
                    <div class="skeleton-text skeleton-shimmer" style="width:88%;"></div>
                    <div class="skeleton-text skeleton-shimmer" style="width:55%;height:20px;border-radius:10px;margin-top:10px;"></div>
                </div>
            </div>

            <!-- Radar de Fidelización -->
            <div class="card" style="border-left:4px solid var(--color-warning) !important;">
                <h2 style="font-size:16px;margin-bottom:14px;">🎯 Radar de Fidelización</h2>
                <div id="dash-fidelizacion" style="display:flex;flex-direction:column;gap:0;">
                    <div class="skeleton-text skeleton-shimmer" style="width:85%;"></div>
                    <div class="skeleton-text skeleton-shimmer" style="width:70%;"></div>
                </div>
            </div>

            <!-- Control de Cartera -->
            <div class="card" style="border-left:4px solid var(--color-danger) !important;">
                <h2 style="font-size:16px;margin-bottom:14px;">💼 Control de Cartera</h2>
                <div id="dash-cartera">
                    <div class="skeleton-text skeleton-shimmer" style="width:92%;"></div>
                </div>
            </div>

        </div>
    `;
}

// ─────────────────────────────────────────────────────────────────────────────
// BIND — Entry point llamado por el router tras renderDashboard()
// ─────────────────────────────────────────────────────────────────────────────

export async function bindDashboardEvents() {
    await DashboardController.init();
}
