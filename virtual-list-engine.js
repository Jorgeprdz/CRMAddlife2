// virtual-list-engine.js
// Enterprise Virtualized Rendering

class VirtualList {

    constructor({

        container,
        rowHeight,
        renderRow,
        overscan = 6
    }) {

        this.container =
            container;

        this.rowHeight =
            rowHeight;

        this.renderRow =
            renderRow;

        this.overscan =
            overscan;

        this.items = [];

        this.scrollHandler =
            this.render.bind(this);
    }

    init(items = []) {

        this.items = items;

        this.container.addEventListener(
            'scroll',
            this.scrollHandler,
            {
                passive: true
            }
        );

        this.render();
    }

    destroy() {

        this.container.removeEventListener(
            'scroll',
            this.scrollHandler
        );
    }

    update(items) {

        this.items = items;

        this.render();
    }

    render() {

        const height =
            this.container.clientHeight;

        const scrollTop =
            this.container.scrollTop;

        const visibleStart =
            Math.floor(
                scrollTop /
                this.rowHeight
            );

        const visibleEnd =
            visibleStart +
            Math.ceil(
                height /
                this.rowHeight
            );

        const start =
            Math.max(
                0,
                visibleStart -
                this.overscan
            );

        const end =
            Math.min(
                this.items.length,
                visibleEnd +
                this.overscan
            );

        const visible =
            this.items
                .slice(start, end);

        this.container.innerHTML = `
            <div
                style="
                    height:${this.items.length * this.rowHeight}px;
                    position:relative;
                "
            >
                <div
                    style="
                        transform:translateY(${start * this.rowHeight}px);
                    "
                >
                    ${visible.map(
                        this.renderRow
                    ).join('')}
                </div>
            </div>
        `;
    }
}

export { VirtualList };