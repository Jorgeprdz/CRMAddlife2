// responsive-engine.js
// Enterprise Responsive Engine

import { AppState } from './state-manager.js';

class ResponsiveEngine {

    init() {

        this.update();

        window.addEventListener(
            'resize',
            () => this.update(),
            {
                passive: true
            }
        );

        console.log(
            '[RESPONSIVE] READY'
        );
    }

    update() {

        const width =
            window.innerWidth;

        let device =
            'desktop';

        if (width <= 768) {

            device = 'mobile';

        } else if (width <= 1024) {

            device = 'tablet';
        }

        AppState.set(
            'device',
            device
        );

        document.body.dataset.device =
            device;
    }
}

export const Responsive =
    new ResponsiveEngine();