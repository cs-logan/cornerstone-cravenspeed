export default class FulfillmentStatus {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.element = document.querySelector('[data-product-fulfillment]');

        if (this.element) {
            this.stateManager.subscribe(this.update.bind(this));
        }
    }

    update(state) {
        const { aliasData, inventory } = state;

        let message = ''; // Default to empty string (fail-open)

        // Only attempt to create a message if an alias is selected
        if (aliasData && aliasData.base_id) {
            // If inventory data is available, check stock.
            if (inventory && inventory.global_inv) {
                const stockItem = inventory.global_inv[aliasData.base_id];
                message = stockItem ? this._getFulfillmentMessage(stockItem) : 'Out of Stock';
            }
            // If inventory is null, message remains '', which is the desired fail-open behavior.
        }

        this.render(message);
    }

    _getFulfillmentMessage(item) {
        const { av, a2b } = item;
        let stockText = '';
        let isMadeToOrder = false;
        let isOutOfStock = false;

        if (av > 10) {
            stockText = 'Plenty in stock';
        } else if (av > 0) {
            stockText = `Only ${av} left`;
        } else if (a2b > 0) {
            stockText = 'In Stock';
            isMadeToOrder = true;
        } else {
            stockText = 'Out of Stock';
            isOutOfStock = true;
        }

        if (isOutOfStock) {
            return stockText;
        }

        const shippingText = this._calculateShippingText(isMadeToOrder);

        return `${stockText}. ${shippingText}`;
    }

    _calculateShippingText(isMadeToOrder) {
        // Use Intl to get the true Pacific local time, handles PST/PDT automatically
        const now = new Date();
        const pacificFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Los_Angeles',
            hour: 'numeric',
            minute: 'numeric',
            weekday: 'short',
            hour12: false
        });

        const parts = pacificFormatter.formatToParts(now);
        const pacificHour = parseInt(parts.find(p => p.type === 'hour').value);
        const pacificMinute = parseInt(parts.find(p => p.type === 'minute').value);
        const weekday = parts.find(p => p.type === 'weekday').value; // 'Sun','Mon',...'Sat'

        const isBefore2PM = pacificHour < 14 || (pacificHour === 14 && pacificMinute === 0);
        const isFriday = weekday === 'Fri';
        const isSaturday = weekday === 'Sat';
        const isSunday = weekday === 'Sun';

        let text = 'today';

        if (!isBefore2PM) {
            text = 'tomorrow';
        }

        if (isMadeToOrder && text === 'today') {
            text = 'tomorrow';
        }

        // After 2pm Friday, or anytime Saturday/Sunday → ships Monday
        if ((text === 'tomorrow' && isFriday) || isSaturday || isSunday) {
            text = 'Monday';
        }

        return `Ships free, ${text}.`;
    }

    render(message) {
        if (this.element) {
            if (message) {
                this.element.textContent = message;
                this.element.style.visibility = 'visible';
                this.element.style.display = '';
                this.element.classList.remove('fade-in');
                void this.element.offsetWidth;
                this.element.classList.add('fade-in');
            } else {
                this.element.textContent = '';
                this.element.style.visibility = 'hidden';
                this.element.style.display = '';
            }
        }
    }
}