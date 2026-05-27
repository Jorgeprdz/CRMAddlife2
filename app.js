// app.js
// ENTERPRISE APPLICATION CORE
// Production Ready WPA/PWA Architecture

console.log(
    '%cAPP V7 ENTERPRISE',
    'color:#007AFF;font-weight:bold;'
);

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

import { DB } from './db.js';

import {
    showToast
} from './utils.js';

import {
    renderDashboard,
    bindDashboardEvents
} from './dashboard.js';

import {
    renderProspeccion,
    bindProspeccionEvents
} from './prospeccion.js';

import {
    renderReferidos,
    bindReferidosEvents
} from './referidos.js';

import {
    renderActividad,
    bindActividadEvents
} from './actividad.js';

import {
    renderCartera,
    bindCarteraEvents
} from './cartera.js';

import {
    renderComisiones,
    bindComisionesEvents
} from './comisiones.js';

import {
    Core
} from './core-app-engine.js';

import {
    AppState
} from './state-manager.js';

import {
    EventBus
} from './event-system.js';

import {
    Lifecycle
} from './module-lifecycle.js';

import {
    RenderEngine
} from './ui-render-engine.js';

import {
    SyncEngine
} from './sync-orchestrator.js';

import {
    Analytics
} from './analytics-engine.js';

import {
    ErrorHandler
} from './error-boundary.js';

import {
    Logger
} from './logger.js';

// ═══════════════════════════════════════════════════════════════
// ENV CONFIG
// ═══════════════════════════════════════════════════════════════

const ENV = {

    SUPABASE_URL:
        window.__ENV__?.SUPABASE_URL ||
        '',

    SUPABASE_KEY:
        window.__ENV__?.SUPABASE_KEY ||
        ''
};

// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════

class AuthService {

    constructor() {

        this.client = null;

        this.user = null;
    }

    init() {

        if (!window.supabase) {

            throw new Error(
                'Supabase SDK missing'
            );
        }

        if (
            !ENV.SUPABASE_URL ||
            !ENV.SUPABASE_KEY
        ) {

            throw new Error(
                'ENV VARIABLES MISSING'
            );
        }

        this.client =
            window.supabase.createClient(
                ENV.SUPABASE_URL,
                ENV.SUPABASE_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );

        window.supabaseClient =
            this.client;

        Logger.info(
            '[AUTH] READY'
        );

        return true;
    }

    async getUser() {

        try {

            const {
                data,
                error
            } = await this.client
                .auth
                .getUser();

            if (error) {

                throw error;
            }

            this.user =
                data?.user || null;

            AppState.set(
                'user',
                this.user
            );

            return this.user;

        } catch (err) {

            Logger.error(
                '[AUTH USER ERROR]',
                err
            );

            return null;
        }
    }

    async login() {

        try {

            Analytics.track(
                'auth_login_attempt'
            );

            await this.client
                .auth
                .signInWithOAuth({

                    provider: 'google',

                    options: {

                        redirectTo:
                            window.location.origin,

                        skipBrowserRedirect: false
                    }
                });

        } catch (err) {

            Logger.error(
                '[LOGIN ERROR]',
                err
            );

            showToast(
                'Error iniciando sesión',
                'danger'
            );
        }
    }

    async logout() {

        try {

            await Lifecycle.destroyAll();

            await this.client
                .auth
                .signOut();

            AppState.reset();

            location.reload();

        } catch (err) {

            Logger.error(
                '[LOGOUT ERROR]',
                err
            );
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE ROUTER
// ═══════════════════════════════════════════════════════════════

class EnterpriseRouter {

    constructor() {

        this.currentRoute =
            null;

        this.routes = {

            dashboard: {

                render:
                    renderDashboard,

                bind:
                    bindDashboardEvents
            },

            prospeccion: {

                render:
                    renderProspeccion,

                bind:
                    bindProspeccionEvents
            },

            referidos: {

                render:
                    renderReferidos,

                bind:
                    bindReferidosEvents
            },

            actividad: {

                render:
                    renderActividad,

                bind:
                    bindActividadEvents
            },

            cartera: {

                render:
                    renderCartera,

                bind:
                    bindCarteraEvents
            },

            comisiones: {

                render:
                    renderComisiones,

                bind:
                    bindComisionesEvents
            }
        };
    }

    async navigate(route) {

        try {

            if (
                this.currentRoute === route
            ) {

                return;
            }

            const module =
                this.routes[route];

            if (!module) {

                throw new Error(
                    `Ruta inválida: ${route}`
                );
            }

            const app =
                document.getElementById(
                    'app-content'
                );

            if (!app) {

                throw new Error(
                    '#app-content missing'
                );
            }

            AppState.set(
                'loading',
                true
            );

            await Lifecycle.destroyAll();

            RenderEngine.schedule(() => {

                app.innerHTML =
                    module.render();
            });

            await Lifecycle.mount(
                route,
                {
                    mount: async () => {

                        await module.bind();
                    }
                }
            );

            this.currentRoute =
                route;

            AppState.set(
                'route',
                route
            );

            this.updateNav(route);

            history.replaceState(
                {},
                '',
                '#' + route
            );

            Analytics.track(
                'route_change',
                { route }
            );

            EventBus.emit(
                'route:changed',
                { route }
            );

        } catch (err) {

            ErrorHandler.capture(
                err
            );

            this.renderError(err);

        } finally {

            AppState.set(
                'loading',
                false
            );
        }
    }

    updateNav(route) {

        document
            .querySelectorAll(
                '.nav-btn'
            )
            .forEach(btn => {

                btn.classList.remove(
                    'active'
                );

                if (
                    btn.dataset.target === route
                ) {

                    btn.classList.add(
                        'active'
                    );
                }
            });
    }

    renderError(err) {

        const app =
            document.getElementById(
                'app-content'
            );

        if (!app) {

            return;
        }

        app.innerHTML = `
        <div
            style="
                padding:32px;
                text-align:center;
            "
        >

            <div
                style="
                    font-size:62px;
                    margin-bottom:12px;
                "
            >
                ⚠️
            </div>

            <h2>
                Error crítico
            </h2>

            <p
                style="
                    color:var(--danger);
                    margin-top:8px;
                "
            >
                ${err.message}
            </p>

        </div>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════
// APP MANAGER
// ═══════════════════════════════════════════════════════════════

class AppManager {

    constructor() {

        this.auth =
            new AuthService();

        this.router =
            new EnterpriseRouter();