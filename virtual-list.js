// virtual-list.js

export class VirtualList {

    constructor({

        container,

        items,

        itemHeight,

        renderItem,

        overscan = 8
    }) {

        this.container =
            container;

        this.items =
            items;

        this.itemHeight =
            itemHeight;

        this.renderItem =
            renderItem;

        this.overscan =
            overscan;

        this.visibleNodes =
            new Map();

        this.init();
    }

    init() {

        this.container.innerHTML = '';

        this.scroller =
            document.createElement('div');

        this.scroller.style.height =
            `${this.items.length * this.itemHeight}px`;

        this.scroller.style.position =
            'relative';

        this.container.appendChild(
            this.scroller
        );

        this.handleScroll =
            this.render.bind(this);

        this.container.addEventListener(
            'scroll',
            this.handleScroll,
            { passive: true }
        );

        this.render();
    }

    render() {

        const scrollTop =
            this.container.scrollTop;

        const height =
            this.container.clientHeight;

        const start =
            Math.max(
                0,
                Math.floor(
                    scrollTop /
                    this.itemHeight
                ) - this.overscan
            );

        const end =
            Math.min(
                this.items.length,
                Math.ceil(
                    (scrollTop + height) /
                    this.itemHeight
                ) + this.overscan
            );

        const nextVisible =
            new Set();

        for (
            let i = start;
            i < end;
            i++
        ) {

            nextVisible.add(i);

            if (
                this.visibleNodes.has(i)
            ) {
                continue;
            }

            const node =
                this.renderItem(
                    this.items[i],
                    i
                );

            node.style.position =
                'absolute';

            node.style.top =
                `${i * this.itemHeight}px`;

            node.style.left = '0';

            node.style.right = '0';

            this.scroller.appendChild(
                node
            );

            this.visibleNodes.set(
                i,
                node
            );
        }

        for (
            const [index, node]
            of this.visibleNodes
        ) {

            if (
                nextVisible.has(index)
            ) {
                continue;
            }

            node.remove();

            this.visibleNodes.delete(
                index
            );
        }
    }

    destroy() {

        this.container.removeEventListener(
            'scroll',
            this.handleScroll
        );

        this.visibleNodes.forEach(
            node => node.remove()
        );

        this.visibleNodes.clear();
    }
}