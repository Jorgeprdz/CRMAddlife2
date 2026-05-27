// domain-events.js
// Enterprise Domain Events Registry

export const DOMAIN_EVENTS = Object.freeze({

    // Prospectos

    PROSPECT_CREATED:
        'prospect.created',

    PROSPECT_UPDATED:
        'prospect.updated',

    PROSPECT_DELETED:
        'prospect.deleted',

    PROSPECT_SELECTED:
        'prospect.selected',

    // Clientes

    CLIENT_CREATED:
        'client.created',

    CLIENT_UPDATED:
        'client.updated',

    CLIENT_DELETED:
        'client.deleted',

    // Actividad

    ACTIVITY_CREATED:
        'activity.created',

    ACTIVITY_UPDATED:
        'activity.updated',

    ACTIVITY_DELETED:
        'activity.deleted',

    // Dashboard

    DASHBOARD_REFRESH:
        'dashboard.refresh',

    DASHBOARD_UPDATED:
        'dashboard.updated',

    // Auth

    AUTH_LOGIN:
        'auth.login',

    AUTH_LOGOUT:
        'auth.logout',

    AUTH_EXPIRED:
        'auth.expired',

    // Sync

    SYNC_STARTED:
        'sync.started',

    SYNC_FINISHED:
        'sync.finished',

    SYNC_FAILED:
        'sync.failed',

    // Runtime

    APP_READY:
        'app.ready',

    APP_ERROR:
        'app.error',

    ROUTE_CHANGED:
        'route.changed',

    // Network

    ONLINE_MODE:
        'online.mode',

    OFFLINE_MODE:
        'offline.mode'
});

export default DOMAIN_EVENTS;