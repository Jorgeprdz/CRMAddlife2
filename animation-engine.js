// animation-engine.js
// Enterprise Motion Engine

class AnimationEngine {

    fadeIn(
        element,
        duration = 280
    ) {

        if (!element) {

            return;
        }

        element.animate(
            [
                {
                    opacity: 0,
                    transform:
                        'translateY(8px)'
                },
                {
                    opacity: 1,
                    transform:
                        'translateY(0)'
                }
            ],
            {
                duration,
                easing:
                    'cubic-bezier(.2,.8,.2,1)',
                fill: 'forwards'
            }
        );
    }

    fadeOut(
        element,
        duration = 180
    ) {

        if (!element) {

            return;
        }

        return element.animate(
            [
                {
                    opacity: 1
                },
                {
                    opacity: 0
                }
            ],
            {
                duration,
                easing: 'ease',
                fill: 'forwards'
            }
        );
    }

    scaleIn(
        element,
        duration = 240
    ) {

        if (!element) {

            return;
        }

        element.animate(
            [
                {
                    opacity: 0,
                    transform:
                        'scale(.96)'
                },
                {
                    opacity: 1,
                    transform:
                        'scale(1)'
                }
            ],
            {
                duration,
                easing:
                    'cubic-bezier(.175,.885,.32,1.2)',
                fill: 'forwards'
            }
        );
    }
}

export const Motion =
    new AnimationEngine();