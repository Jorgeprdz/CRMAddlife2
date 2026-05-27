// auth-guard.js
// Enterprise Session + Auth Guard

import { showToast } from './utils.js';

const SESSION_TIMEOUT =
    1000 * 60 * 60 * 8;

class AuthGuard {

    constructor() {

        this.lastActivity =
            Date.now();

        this.activityHandler =
            this.updateActivity.bind(this);

        this.timeoutCheck =
            null;
    }

    init() {

        [
            'click',
            'touchstart',
            'keydown',
            'mousemove'
        ].forEach(evt => {

            window.addEventListener(
                evt,
                this.activityHandler,
                {
                    passive: true
                }
            );
        });

        this.startWatcher();

        console.log(
            '[AUTH GUARD] READY'
        );
    }

    destroy() {

        [
            'click',
            'touchstart',
            'keydown',
            'mousemove'
        ].forEach(evt => {

            window.removeEventListener(
                evt,
                this.activityHandler
            );
        });

        if (
            this.timeoutCheck
        ) {

            clearInterval(
                this.timeoutCheck
            );
        }
    }

    updateActivity() {

        this.lastActivity =
            Date.now();
    }

    startWatcher() {

        this.timeoutCheck =
            setInterval(() => {

                const now =
                    Date.now();

                const inactive =
                    now - this.lastActivity;

                if (
                    inactive >
                    SESSION_TIMEOUT
                ) {

                    this.handleTimeout();
                }

            }, 60000);
    }

    handleTimeout() {

        console.warn(
            '[AUTH GUARD] SESSION EXPIRED'
        );

        showToast(
            'Sesión expirada por inactividad',
            'warning'
        );

        setTimeout(() => {

            location.reload();

        }, 1200);
    }
}

export const SessionGuard =
    new AuthGuard();