// app-shell-manager.js
// Enterprise App Shell Controller

class AppShellManager {

    constructor() {

        this.loader =
            null;
    }

    showLoader(
        message = 'Cargando...'
    ) {

        this.hideLoader();

        this.loader =
            document.createElement(
                'div'
            );

        this.loader.id =
            'global-loader';

        this.loader.style.cssText = `
            position:fixed;
            inset:0;
            z-index:99999;
            background:rgba(0,0,0,0.35);
            backdrop-filter:blur(10px);
            display:flex;
            align-items:center;
            justify-content:center;
        `;

        this.loader.innerHTML = `
            <div
                style="
                    background:var(--surface);
                    padding:24px;
                    border-radius:20px;
                    min-width:220px;
                    text-align:center;
                    box-shadow:0 10px 40px rgba(0,0,0,.25);
                "
            >
                <div
                    class="spinner"
                    style="
                        width:38px;
                        height:38px;
                        border-radius:50%;
                        border:3px solid rgba(0,122,255,.15);
                        border-top-color:#007AFF;
                        margin:0 auto 16px;
                        animation:spin .8s linear infinite;
                    "
                ></div>

                <div
                    style="
                        font-size:14px;
                        font-weight:600;
                    "
                >
                    ${message}
                </div>
            </div>
        `;

        document.body.appendChild(
            this.loader
        );
    }

    hideLoader() {

        if (
            this.loader
        ) {

            this.loader.remove();

            this.loader = null;
        }
    }
}

export const AppShell =
    new AppShellManager();