// utils.js
// Hardened UI Runtime Utilities

import { Runtime } from './runtime.js';
import { OverlayRuntime } from './overlay-manager.js';

const TOAST_LIMIT = 3;

const activeToasts = [];

function createSafeTextNode(text) {

    return document.createTextNode(
        String(text ?? '')
    );
}

export function showToast(message, type = 'info') {

    const icons = {
        success: '✅',
        danger: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    if (activeToasts.length >= TOAST_LIMIT) {

        const oldest = activeToasts.shift();

        oldest?.remove();
    }

    const toast = document.createElement('div');

    toast.className = 'ui-toast';

    toast.setAttribute('role', 'status');

    toast.setAttribute('aria-live', 'polite');

    const icon = document.createElement('span');

    icon.className = 'ui-toast-icon';

    icon.textContent = icons[type] || icons.info;

    const text = document.createElement('span');

    text.appendChild(
        createSafeTextNode(message)
    );

    toast.append(icon, text);

    document.body.appendChild(toast);

    activeToasts.push(toast);

    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    const removeToast = () => {

        toast.classList.remove('visible');

        const timer = setTimeout(() => {

            toast.remove();

            const index =
                activeToasts.indexOf(toast);

            if (index >= 0) {
                activeToasts.splice(index, 1);
            }

        }, 220);

        Runtime.registerTimer(timer);
    };

    const timer = setTimeout(removeToast, 3200);

    Runtime.registerTimer(timer);

    return removeToast;
}

export function showConfirm(
    text,
    title = 'Confirmar',
    confirmText = 'Aceptar',
    isDestructive = false
) {

    return new Promise(resolve => {

        const previousFocus = document.activeElement;

        const overlay = document.createElement('div');

        overlay.className = 'ui-modal-overlay';

        overlay.setAttribute('role', 'presentation');

        const modal = document.createElement('div');

        modal.className = 'ui-modal';

        modal.setAttribute('role', 'dialog');

        modal.setAttribute('aria-modal', 'true');

        modal.innerHTML = `
            <div class="ui-modal-body">
                <h3 class="ui-modal-title"></h3>
                <p class="ui-modal-text"></p>
            </div>
            <div class="ui-modal-actions">
                <button
                    class="ui-modal-btn"
                    data-action="cancel"
                    type="button"
                >
                    Cancelar
                </button>

                <button
                    class="ui-modal-btn ${isDestructive ? 'danger' : 'primary'}"
                    data-action="confirm"
                    type="button"
                >
                    ${confirmText}
                </button>
            </div>
        `;

        modal.querySelector('.ui-modal-title').textContent = title;

        modal.querySelector('.ui-modal-text').textContent = text;

        overlay.appendChild(modal);

        document.body.appendChild(overlay);

        const overlayId =
            OverlayRuntime.register(overlay);

        let resolved = false;

        const close = result => {

            if (resolved) {
                return;
            }

            resolved = true;

            overlay.classList.remove('visible');

            const timer = setTimeout(() => {

                OverlayRuntime.remove(overlayId);

                previousFocus?.focus?.();

                resolve(result);

            }, 180);

            Runtime.registerTimer(timer);
        };

        const onKeyDown = e => {

            if (e.key === 'Escape') {
                close(false);
            }
        };

        document.addEventListener(
            'keydown',
            onKeyDown
        );

        Runtime.registerCleanup(() => {
            document.removeEventListener(
                'keydown',
                onKeyDown
            );
        });

        overlay.addEventListener('click', e => {

            if (e.target === overlay) {
                close(false);
            }
        });

        modal.addEventListener('click', e => {

            const action =
                e.target.dataset.action;

            if (action === 'cancel') {
                close(false);
            }

            if (action === 'confirm') {
                close(true);
            }
        });

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        modal.querySelector(
            '[data-action="confirm"]'
        )?.focus();
    });
}

export function agendarCita(nombre, detalle) {

    const start = new Date();

    start.setDate(start.getDate() + 1);

    start.setHours(10, 0, 0, 0);

    const end = new Date(start);

    end.setHours(end.getHours() + 1);

    const format = date => {

        return date
            .toISOString()
            .replace(/[-:]/g, '')
            .split('.')[0] + 'Z';
    };

    const url = new URL(
        'https://www.google.com/calendar/render'
    );

    url.searchParams.set('action', 'TEMPLATE');

    url.searchParams.set(
        'text',
        `Cita con: ${nombre}`
    );

    url.searchParams.set(
        'details',
        detalle
    );

    url.searchParams.set(
        'dates',
        `${format(start)}/${format(end)}`
    );

    window.open(
        url.toString(),
        '_blank',
        'noopener,noreferrer'
    );
}