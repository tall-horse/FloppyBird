class WindEvent {
    constructor() {
        this.event = new Event('windTime');
        this.listeners = [];
    }

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    fire() {
        document.dispatchEvent(this.event);
        this.listeners.forEach(listener => listener());
    }
}

export default new WindEvent();
