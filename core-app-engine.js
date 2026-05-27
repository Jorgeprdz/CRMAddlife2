// core-app-engine.js
// Enterprise Application Core

import { Network } from './network-manager.js';
import { OfflineSync } from './offline-sync.js';
import { Logger } from './logger.js';
import { PerformanceTracker } from './performance-monitor.js';
import { SessionGuard } from './auth-guard.js';
import { Responsive } from './responsive-engine.js';
import { Accessibility } from './accessibility-engine.js';
import { ErrorHandler } from './error-boundary.js';
import { Analytics } from './analytics-engine.js';
import { SyncEngine } from './sync-orchestrator.js';

class CoreAppEngine {

    constructor() {

        this.initialized =
            false;
    }

    async init() {

        if (
            this.initialized
        ) {

            return;
        }

        console.log(
            '[CORE] BOOTING'
        );

        Network.init();

        OfflineSync.init();

        PerformanceTracker.init();

        SessionGuard.init();

        Responsive.init();

        Accessibility.init();

        ErrorHandler.init();

        Analytics.init();

        await SyncEngine.init();

        this.initialized = true;

        Logger.info(
            '[CORE READY]'
        );
    }
}

export const Core =
    new CoreAppEngine();