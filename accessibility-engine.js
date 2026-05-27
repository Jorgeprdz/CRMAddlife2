// accessibility-engine.js
// Enterprise Accessibility Engine

class AccessibilityEngine {

    init() {

        this.detectReducedMotion();

        this.setupKeyboardFocus();

        console.log(
            '[A11Y] READY'
        );
    }

    detectReducedMotion() {

        const reduce =
            window.matchMedia(
                '(prefers-reduced-motion: reduce)'
            );

        document.body.dataset.motion =
            reduce.matches
                ? 'reduced'
                : 'normal';
    }

    setupKeyboardFocus() {

        document.addEventListener(
            'keydown',
            e => {

                if (
                    e.key === 'Tab'
                ) {

                    document.body.classList.add(
                        'keyboard-navigation'
                    );
                }
            }
        );

        document.addEventListener(
            'mousedown',
            () => {

                document.body.classList.remove(
                    'keyboard-navigation'
                );
            }
        );
    }
}

export const Accessibility =
    new AccessibilityEngine();