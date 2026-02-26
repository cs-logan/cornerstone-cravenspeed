export default class StockInfo {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.stockElement = document.querySelector('[data-product-stock]');
        
        // Cache default content
        this.defaultStock = this.stockElement ? this.stockElement.innerHTML : '';

        if (this.stockElement) {
            this.stateManager.subscribe(this.update.bind(this));
        }
    }

    update(state) {
        const { aliasData, inventory } = state;
        
        let message = this.defaultStock;

        if (aliasData && inventory && inventory.global_inv && aliasData.base_id) {
            const stockItem = inventory.global_inv[aliasData.base_id];
            if (stockItem) {
                message = this._getStockMessage(stockItem);
            } else {
                message = 'Out of Stock';
            }
        } else if (aliasData && aliasData.stock_message) {
            // Fallback to alias data if global inventory isn't ready or found
            message = aliasData.stock_message;
        }

        this.render(message);
    }

    _getStockMessage(item) {
        const { av, a2b } = item;
        
        if (av > 10) return 'Plenty in stock';
        if (av > 0) return `Only ${av} left. Order soon!`;
        if (a2b > 0) return 'In Stock'; // Made to order
        return 'Out of Stock';
    }

    render(message) {
        if (this.stockElement) {
            this.stockElement.innerHTML = message;
        }
    }
}