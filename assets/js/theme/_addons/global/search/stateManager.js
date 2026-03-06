export default class SearchStateManager {
    constructor() {
        this.state = {
            isLoading: false,
            data: null,
            error: null,
        };
        this.subscribers = new Set();
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        callback(this.state);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.state));
    }

    getState() {
        return this.state;
    }
}
