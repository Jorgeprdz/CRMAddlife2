// app.js
// ENTERPRISE APPLICATION CORE
// Production Ready PWA/WPA Architecture
// ─────────────────────────────────────────────────────────────────────────────
// RESPONSABILIDADES:
//   - Inicialización de Supabase (AuthService)
//   - Autenticación Google OAuth
//   - Enrutamiento SPA (EnterpriseRouter)
//   - Bootstrap del ciclo de vida de la app (AppManager)
//   - Hidratación del header tras auth
//   - Listeners globales: navegación, logout, tema, chat
//
// FLUJO DE ARRANQUE:
//   DOMContentLoaded
//     → AppManager.init()
//       → AppShell.showLoader()        (spinner mientras arranca)
//       → AuthService.init()           (crea cliente Supabase)
//       → DB.init()                    (inicializa IndexedDB)
//       → Core.init()                  (infraestructura enterprise)
//       → AuthService.getUser()        (pone user en AppState)
//         → SI usuario: _showApp() → router.navigate('dashboard')
//         → SI no:      _showLogin()
//       → AppShell.hideLoader()        (oculta spinner siempre)
// ─────────────────────────────────────────────────────────────────────────────

console.log(
    '%cAPP V7 ENTERPRISE',
    'color:#007AFF;font-weight:bold;font-size:12px;'
);

// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════

import { DB }           from './db.js';
import { showToast }    from './utils.js';

import { renderDashboard,   bindDashboardEvents   } from './dashboard.js';
import { renderProspeccion, bindProspeccionEvents  } from './prospeccion.js';
import { renderReferidos,   bindReferidosEvents    } from './referidos.js';
import { renderActividad,   bindActividadEvents    } from './actividad.js';
import { renderCartera,     bindCarteraEvents      } from './cartera.js';
import { renderComisiones,  bindComisionesEvents   } from './comisiones.js';

import { Core }         from './core-app-engine.js';
import { AppState }     from './state-manager.js';
import { EventBus }     from './event-system.js';
import { Lifecycle }    from './module-lifecycle.js';
import { RenderEngine } from './ui-render-engine.js';
import { SyncEngine }   from './sync-orchestrator.js';
import { Analytics }    from './analytics-engine.js';
import { ErrorHandler } from './error-boundary.js';
import { Logger }       from './logger.js';
import { AppShell }     from './app-shell-manager.js';

// ═══════════════════════════════════════════════════════════════
// SANITIZADOR LOCAL
// Protege cualquier dato externo antes de inyectarlo al DOM.
// Usado en renderError, _showFatalError y _handleChatSend.
// ═══════════════════════════════════════════════════════════════

const _escapeHtml = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#x27;');
};

// ═══════════════════════════════════════════════════════════════
// ENV CONFIG
// Leído de window.__ENV__ inyectado por env.js (ver index.html).
// NUNCA hardcodear valores aquí.
// ═══════════════════════════════════════════════════════════════

const ENV = Object.freeze({
    SUPABASE_URL: window.__ENV__?.SUPABASE_URL || '',
    SUPABASE_KEY: window.__ENV__?.SUPABASE_KEY || '',
});

// ═══════════════════════════════════════════════════════════════
// AUTH SERVICE
// ═══════════════════════════════════════════════════════════════

class AuthService {

    constructor() {
        this.client = null;
        this.user   = null;
    }

    init() {

        if (!window.supabase) {
            throw new Error('Supabase SDK missing');
        }

        if (!ENV.SUPABASE_URL || !ENV.SUPABASE_KEY) {
            throw new Error('ENV VARIABLES MISSING — verifica env.js');
        }

        this.client = window.supabase.createClient(
            ENV.SUPABASE_URL,
            ENV.SUPABASE_KEY,
            {
                auth: {
                    persistSession:     true,
                    autoRefreshToken:   true,
                    detectSessionInUrl: true,
                },
            }
        );

        // Expuesto como global SOLO para compatibilidad con módulos legacy
        // pendientes de migración. Los módulos ya migrados NO usan esto.
        // TODO: eliminar window.supabaseClient cuando migración esté completa.
        window.supabaseClient = this.client;

        Logger.info('[AUTH] READY');

        return true;
    }

    async getUser() {

        try {

            const { data, error } = await this.client.auth.getUser();

            if (error) throw error;

            this.user = data?.user || null;

            AppState.set('user', this.user);

            return this.user;

        } catch (err) {

            Logger.error('[AUTH USER ERROR]', err);
            return null;
        }
    }

    async login() {

        try {

            Analytics.track('auth_login_attempt');

            await this.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo:          window.location.origin,
                    skipBrowserRedirect: false,
                },
            });

        } catch (err) {

            Logger.error('[LOGIN ERROR]', err);
            showToast('Error iniciando sesión', 'danger');
        }
    }

    async logout() {

        try {

            AppShell.showLoader('Cerrando sesión...');

            // Orden correcto:
            // 1. Destruir módulos montados (limpia listeners, timers, AbortControllers)
            // 2. Cerrar sesión en Supabase
            // 3. Resetear estado local
            // 4. Recargar (estado limpio garantizado)
            await Lifecycle.destroyAll();
            await this.client.auth.signOut();
            AppState.reset();
            location.reload();

        } catch (err) {

            Logger.error('[LOGOUT ERROR]', err);

            // Forzar recarga aunque falle signOut — no dejar UI en estado roto
            location.reload();
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE ROUTER
// ═══════════════════════════════════════════════════════════════

class EnterpriseRouter {

    constructor() {

        this.currentRoute = null;

        this.routes = {
            dashboard:   { render: renderDashboard,   bind: bindDashboardEvents   },
            prospeccion: { render: renderProspeccion,  bind: bindProspeccionEvents  },
            referidos:   { render: renderReferidos,    bind: bindReferidosEvents    },
            actividad:   { render: renderActividad,    bind: bindActividadEvents    },
            cartera:     { render: renderCartera,      bind: bindCarteraEvents      },
            comisiones:  { render: renderComisiones,   bind: bindComisionesEvents   },
        };
    }

    async navigate(route) {

        try {

            // Evitar re-navegación a la ruta activa
            if (this.currentRoute === route) return;

            const module = this.routes[route];

            if (!module) {
                throw new Error(`Ruta inválida: ${_escapeHtml(route)}`);
            }

            const appEl = document.getElementById('app-content');

            if (!appEl) {
                throw new Error('#app-content missing');
            }

            AppState.set('loading', true);

            // 1. Destruir módulo anterior — limpia Memory, AbortControllers,
            //    suscripciones a AppState, timers
            await Lifecycle.destroyAll();

            // 2. Renderizar template HTML estático del nuevo módulo
            //    Via RAF-scheduled para evitar layout thrashing
            RenderEngine.schedule(() => {
                appEl.innerHTML = module.render();
            });

            // 3. Montar nuevo módulo — bind events, cargar datos async
            await Lifecycle.mount(route, {
                mount: async () => {
                    await module.bind();
                },
            });

            this.currentRoute = route;

            AppState.set('route', route);

            this.updateNav(route);

            history.replaceState({}, '', '#' + route);

            Analytics.track('route_change', { route });

            EventBus.emit('route:changed', { route });

        } catch (err) {

            ErrorHandler.capture(err);
            this._renderError(err);

        } finally {

            AppState.set('loading', false);
        }
    }

    updateNav(route) {

        document.querySelectorAll('.nav-btn').forEach(btn => {

            btn.classList.remove('active');

            if (btn.dataset.target === route) {
                btn.classList.add('active');
            }
        });
    }

    _renderError(err) {

        const appEl = document.getElementById('app-content');
        if (!appEl) return;

        // err.message sanitizado — puede contener HTML si viene de Supabase o red
        appEl.innerHTML =
            `<div style="padding:32px;text-align:center;">` +
                `<div style="font-size:62px;margin-bottom:12px;">⚠️</div>` +
                `<h2>Error crítico</h2>` +
                `<p style="color:var(--danger);margin-top:8px;">` +
                    `${_escapeHtml(err?.message || 'Error desconocido')}` +
                `</p>` +
                `<button ` +
                    `onclick="location.reload()" ` +
                    `style="margin-top:20px;padding:10px 24px;border-radius:8px;` +
                           `background:var(--color-primary);color:white;border:none;` +
                           `font-size:14px;font-weight:600;cursor:pointer;"` +
                `>Reintentar</button>` +
            `</div>`;
    }
}

// ═══════════════════════════════════════════════════════════════
// APP MANAGER
// Orquesta el ciclo de vida completo de la aplicación.
// ═══════════════════════════════════════════════════════════════

class AppManager {

    constructor() {
        this.auth   = new AuthService();
        this.router = new EnterpriseRouter();
    }

    // ─────────────────────────────────────────────────────────
    // INIT — Bootstrap principal
    // ─────────────────────────────────────────────────────────

    async init() {

        // Mostrar spinner de carga global inmediatamente
        AppShell.showLoader('Iniciando CRM...');

        try {

            Logger.info('[APP] Bootstrap iniciado');

            // 1. Inicializar Supabase — debe ser primero
            this.auth.init();

            // 2. Inicializar IndexedDB
            await DB.init();

            // 3. Inicializar infraestructura enterprise
            if (typeof Core?.init === 'function') {
                await Core.init();
            }

            Analytics.init();
            ErrorHandler.init();

            // 4. Verificar sesión de usuario
            AppShell.showLoader('Verificando sesión...');

            const user = await this.auth.getUser();

            if (user) {

                Logger.info('[APP] Usuario autenticado:', user.email);
                Analytics.track('session_restored', { userId: user.id });

                // Revelar UI autenticada
                this._showApp(user);
                this._bindGlobalListeners();

                // 5. Navegar a ruta inicial
                // Respeta deep-link si el usuario llegó con #ruta en la URL
                const hashRoute    = window.location.hash.replace('#', '').trim();
                const initialRoute = this.router.routes[hashRoute]
                    ? hashRoute
                    : 'dashboard';

                AppShell.showLoader('Cargando...');

                await this.router.navigate(initialRoute);

                // 6. Arrancar sync engine en background — no bloquea UI
                if (typeof SyncEngine?.start === 'function') {
                    SyncEngine.start().catch(err => {
                        Logger.warn('[SYNC] Error al arrancar:', err);
                    });
                }

                Logger.info('[APP] Bootstrap completo');

            } else {

                // Sin sesión activa — pantalla de login
                Logger.info('[APP] Sin sesión — mostrando login');
                this._showLogin();
            }

        } catch (err) {

            Logger.error('[APP INIT ERROR]', err);
            ErrorHandler.capture(err);
            this._showFatalError(err);

        } finally {

            // Ocultar spinner SIEMPRE — tanto en éxito como en error
            AppShell.hideLoader();
        }
    }

    // ─────────────────────────────────────────────────────────
    // _showApp — Revela la UI tras autenticación exitosa
    // ─────────────────────────────────────────────────────────

    _showApp(user) {

        const nav    = document.getElementById('main-sidebar');
        const bubble = document.getElementById('ai-chat-bubble');

        if (nav)    nav.style.display    = '';
        if (bubble) bubble.style.display = '';

        this._hydrateHeader(user);
    }

    // ─────────────────────────────────────────────────────────
    // _hydrateHeader — Rellena nombre y avatar en el header
    // Usa textContent y src — nunca innerHTML con datos de usuario
    // ─────────────────────────────────────────────────────────

    _hydrateHeader(user) {

        const nombre = user?.user_metadata?.full_name?.split(' ')[0] || 'Asesor';
        const avatar = user?.user_metadata?.avatar_url || '';

        const greetingEl = document.getElementById('header-greeting');
        const nameEl     = document.getElementById('header-name');
        const avatarEl   = document.getElementById('header-avatar');

        if (greetingEl) {
            const hora   = new Date().getHours();
            const saludo =
                hora >= 5  && hora < 12 ? 'Buenos días'   :
                hora >= 12 && hora < 19 ? 'Buenas tardes' :
                                          'Buenas noches';
            greetingEl.textContent = saludo;
        }

        if (nameEl) {
            nameEl.textContent = nombre;
        }

        if (avatarEl && avatar) {
            avatarEl.src           = avatar;
            avatarEl.style.display = 'block';
        }
    }

    // ─────────────────────────────────────────────────────────
    // _showLogin — Pantalla de bienvenida para usuarios no auth
    // ─────────────────────────────────────────────────────────

    _showLogin() {

        const appEl = document.getElementById('app-content');
        if (!appEl) return;

        appEl.innerHTML =
            `<div style="display:flex;flex-direction:column;align-items:center;` +
                        `justify-content:center;min-height:80vh;padding:32px;` +
                        `text-align:center;gap:20px;">` +
                `<div style="font-size:56px;">📊</div>` +
                `<h1 style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">` +
                    `CRM Addlife` +
                `</h1>` +
                `<p style="font-size:14px;color:var(--text-secondary);max-width:280px;">` +
                    `Tu plataforma comercial para agentes de seguros` +
                `</p>` +
                `<button id="btn-login" ` +
                    `style="display:flex;align-items:center;gap:10px;` +
                           `padding:14px 28px;border-radius:12px;` +
                           `background:var(--color-primary);color:white;` +
                           `border:none;font-size:15px;font-weight:600;` +
                           `cursor:pointer;box-shadow:0 4px 16px rgba(0,122,255,0.3);">` +
                    `<span>Entrar con Google</span>` +
                `</button>` +
            `</div>`;

        // { once: true } — el listener se auto-elimina tras el primer click
        const btnLogin = document.getElementById('btn-login');
        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                this.auth.login();
            }, { once: true });
        }
    }

    // ─────────────────────────────────────────────────────────
    // _showFatalError — Bootstrap falló, mostrar error recuperable
    // ─────────────────────────────────────────────────────────

    _showFatalError(err) {

        const appEl = document.getElementById('app-content');
        if (!appEl) return;

        appEl.innerHTML =
            `<div style="padding:32px;text-align:center;">` +
                `<div style="font-size:48px;margin-bottom:16px;">🚨</div>` +
                `<h2 style="margin-bottom:8px;">Error de arranque</h2>` +
                `<p style="color:var(--danger);font-size:13px;margin-bottom:20px;">` +
                    `${_escapeHtml(err?.message || 'Error desconocido')}` +
                `</p>` +
                `<button ` +
                    `onclick="location.reload()" ` +
                    `style="padding:10px 24px;border-radius:8px;` +
                           `background:var(--color-primary);color:white;` +
                           `border:none;font-size:14px;font-weight:600;cursor:pointer;"` +
                `>Reintentar</button>` +
            `</div>`;
    }

    // ─────────────────────────────────────────────────────────
    // _bindGlobalListeners
    // Registrado UNA SOLA VEZ después de auth exitosa.
    // Delegación de eventos en nav para evitar re-registro
    // en cada navegación de ruta.
    // ─────────────────────────────────────────────────────────

    _bindGlobalListeners() {

        // ── Navegación inferior — delegación sobre el contenedor nav
        const nav = document.getElementById('main-sidebar');
        if (nav) {
            nav.addEventListener('click', (e) => {
                const btn = e.target.closest('.nav-btn[data-target]');
                if (!btn) return;
                const target = btn.dataset.target;
                if (target) this.router.navigate(target);
            });
        }

        // ── Logout
        const btnLogout = document.getElementById('btn-cerrar-sesion');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                this.auth.logout();
            });
        }

        // ── Toggle tema dark/light
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {

            // Restaurar preferencia guardada en localStorage
            const savedTheme = localStorage.getItem('crm-theme');
            if (savedTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeToggle.checked = true;
            }

            themeToggle.addEventListener('change', (e) => {
                const isDark = e.target.checked;
                document.documentElement.setAttribute(
                    'data-theme',
                    isDark ? 'dark' : 'light'
                );
                localStorage.setItem('crm-theme', isDark ? 'dark' : 'light');
                EventBus.emit('theme:changed', { dark: isDark });
            });
        }

        // ── Chat bubble — abrir ventana
        const chatBubble = document.getElementById('ai-chat-bubble');
        const chatWindow = document.getElementById('ai-chat-window');

        if (chatBubble && chatWindow) {
            chatBubble.addEventListener('click', () => {
                chatWindow.classList.add('chat-window-open');
                chatBubble.style.display = 'none';
                const input = document.getElementById('ai-chat-input');
                if (input) input.focus();
            });
        }

        // ── Chat — cerrar ventana
        const closeChat = document.getElementById('close-chat');
        if (closeChat && chatWindow && chatBubble) {
            closeChat.addEventListener('click', () => {
                chatWindow.classList.remove('chat-window-open');
                chatBubble.style.display = '';
            });
        }

        // ── Chat — enviar (botón)
        const sendBtn = document.getElementById('ai-chat-send');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this._handleChatSend();
            });
        }

        // ── Chat — enviar (Enter)
        const chatInput = document.getElementById('ai-chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._handleChatSend();
                }
            });
        }

        // ── Online / Offline
        window.addEventListener('online', () => {
            AppState.set('online', true);
            EventBus.emit('network:online');
            Logger.info('[NETWORK] Online');
            showToast('Conexión restaurada', 'success');
            if (typeof SyncEngine?.sync === 'function') {
                SyncEngine.sync().catch(err => {
                    Logger.warn('[SYNC] Error al sincronizar tras reconexión:', err);
                });
            }
        });

        window.addEventListener('offline', () => {
            AppState.set('online', false);
            EventBus.emit('network:offline');
            Logger.warn('[NETWORK] Offline');
            showToast('Sin conexión — modo offline', 'warning');
        });

        // ── Errores globales no capturados
        window.addEventListener('unhandledrejection', (e) => {
            Logger.error('[UNHANDLED REJECTION]', e.reason);
            ErrorHandler.capture(e.reason || new Error('Unhandled Promise rejection'));
        });

        window.addEventListener('error', (e) => {
            Logger.error('[GLOBAL ERROR]', e.error);
            ErrorHandler.capture(e.error || new Error(e.message));
        });

        Logger.info('[APP] Global listeners registrados');
    }

    // ─────────────────────────────────────────────────────────
    // _handleChatSend
    // UI básica del chat. La integración real con el modelo AI
    // se implementará en Phase 3 (ai-engine.js).
    // ─────────────────────────────────────────────────────────

    _handleChatSend() {

        const input    = document.getElementById('ai-chat-input');
        const messages = document.getElementById('ai-chat-messages');

        if (!input || !messages) return;

        const text = input.value.trim();
        if (!text) return;

        // Mensaje del usuario — sanitizado antes de ir al DOM
        const userRow = document.createElement('div');
        userRow.className = 'msg-row user-row';
        userRow.innerHTML =
            `<div class="chat-bubble user-bubble">${_escapeHtml(text)}</div>`;
        messages.appendChild(userRow);

        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        Analytics.track('chat_message_sent');

        // Placeholder hasta Phase 3
        setTimeout(() => {
            const iaRow = document.createElement('div');
            iaRow.className = 'msg-row ia-row';
            iaRow.innerHTML =
                `<div class="chat-bubble ia-bubble">` +
                    `Procesando tu consulta... (AI engine Phase 3)` +
                `</div>`;
            messages.appendChild(iaRow);
            messages.scrollTop = messages.scrollHeight;
        }, 600);
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT getSupabase
// Compatibilidad con módulos legacy pendientes de migración.
// Los módulos ya migrados leen el usuario desde AppState.get('user').
// TODO: eliminar cuando todos los módulos estén migrados.
// ═══════════════════════════════════════════════════════════════

export function getSupabase() {
    return window.supabaseClient || null;
}

// ═══════════════════════════════════════════════════════════════
// BOOTSTRAP
// DOMContentLoaded garantiza que el HTML está completamente
// parseado antes de acceder a cualquier elemento del DOM.
// ═══════════════════════════════════════════════════════════════

const _appInstance = new AppManager();

document.addEventListener('DOMContentLoaded', () => {
    _appInstance.init();
});
