// overlay-manager.js

class OverlayManager {

    constructor() {

        this.stack = [];

        this.baseZIndex = 5000;
    }

    register(element) {

        const id = crypto.randomUUID();

        element.dataset.overlayId = id;

        element.style.zIndex =
            this.baseZIndex + this.stack.length;

        this.stack.push({
            id,
            element
        });

        return id;
    }

    remove(id) {

        const index =
            this.stack.findIndex(x => x.id === id);

        if (index === -1) {
            return;
        }

        const item = this.stack[index];

        item.element.remove();

        this.stack.splice(index, 1);
    }

    clearAll() {

        this.stack.forEach(item => {
            item.element.remove();
        });

        this.stack = [];
    }
}

export const OverlayRuntime =
    new OverlayManager();