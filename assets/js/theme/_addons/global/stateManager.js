/**
 * @file StateManager
 * @description A singleton module to hold and manage the global application state.
 * It uses an observer pattern to allow other modules to subscribe to state changes.
 */

class StateManager {
    constructor() {
        if (!StateManager.instance) {
            this.state = {
                vehicle: {
                    selected: null,
                    isCompatible: true,
                },
                options: {},
                search: {
                    query: '',
                    results: [],
                    isLoading: false,
                },
                product: {
                    currentAlias: null,
                    aliases: [],
                    isLoading: false,
                },
            };
            this.observers = [];
            StateManager.instance = this;
        }

        return StateManager.instance;
    }

    /**
     * Subscribe to state changes.
     * @param {function} observer - The callback function to execute when state changes.
     * @returns {function} - A function to unsubscribe the observer.
     */
    subscribe(observer) {
        this.observers.push(observer);
        return () => this.unsubscribe(observer);
    }

    // TEMPORARY FOR TESTING
    clearObservers() {
        this.observers = [];
    }

    /**
     * Unsubscribe from state changes.
     * @param {function} observer - The callback function to remove.
     */
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    /**
     * Notify all observers of a state change.
     */
    notify() {
        this.observers.forEach(observer => observer(this.state));
    }

    /**
     * Set new state and notify observers.
     * @param {object} newState - The new state to merge with the existing state.
     */
    setState(newState) {
        if (newState.vehicle) {
            console.log('GlobalStateManager: Vehicle state updated.', {
                selected: newState.vehicle.selected,
                isCompatible: newState.vehicle.isCompatible,
                page: window.location.pathname,
            });
        }
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    /**
     * Get the current state.
     * @returns {object} The current state.
     */
    getState() {
        return this.state;
    }
}

const instance = new StateManager();

export default instance;
