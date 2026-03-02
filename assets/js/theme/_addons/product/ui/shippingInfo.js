/**
 * Handles displaying dynamic shipping information.
 */
class ShippingInfo {
    /**
     * @param {object} stateManager - The shared state manager instance.
     */
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.shippingInfoElement = document.querySelector('[data-product-shipping-info]');

        // Subscribe to state changes, if the element exists
        if (this.shippingInfoElement) {
            this.stateManager.subscribe(this.update.bind(this));
            this.update(this.stateManager.getState()); // Initial render
        }
    }

    /**
     * Update the component with the new state.
     * @param {object} newState - The new state from the state manager.
     */
    update(newState) {
        const { aliasData, inventory } = newState;
        
        let isMadeToOrder = false;

        // Determine if Made to Order based on inventory
        if (aliasData && inventory && inventory.global_inv && aliasData.base_id) {
            const stockItem = inventory.global_inv[aliasData.base_id];
            if (stockItem && stockItem.av <= 0 && stockItem.a2b > 0) {
                isMadeToOrder = true;
            }
        }

        const shippingText = this._calculateShippingText(isMadeToOrder);
        this.render(shippingText);
    }

    _calculateShippingText(isMadeToOrder) {
        const now = new Date();
        const timeZone = 'America/Los_Angeles';

        // Get day in Pacific Time
        const dayString = now.toLocaleDateString('en-US', { timeZone, weekday: 'short' });
        const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        const day = dayMap[dayString];

        // Get hour in Pacific Time (0-23)
        const hourString = now.toLocaleTimeString('en-US', { timeZone, hour: 'numeric', hour12: false });
        const hour = parseInt(hourString, 10);

        let text = 'today';
        const cutoffHour = 14; // 2:00 PM

        // Weekend Logic
        if (day === 6 || day === 0) {
            text = 'Monday';
        } else if (hour >= cutoffHour) {
            // Weekday after cutoff
            if (day === 5) { // Friday after cutoff
                text = 'Monday';
            } else {
                text = 'tomorrow';
            }
        }

        // If Made to Order, it can't ship "Today"
        if (isMadeToOrder && text === 'today') {
            text = 'tomorrow';
        }

        return `Ships free, ${text}.`;
    }

    /**
     * Generate shipping text and update the DOM.
     */
    render(text) {
        if (this.shippingInfoElement) {
            this.shippingInfoElement.textContent = text;
        }
    }
}

export default ShippingInfo;