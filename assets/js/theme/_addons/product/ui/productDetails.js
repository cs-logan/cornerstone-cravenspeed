export default class ProductDetails {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.lastAliasData = undefined;
        this.lastInventory = undefined;
        
        // Selectors
        this.descriptionElement = document.querySelector('[data-product-description]');
        this.instructionsElement = document.querySelector('[data-product-instructions]');
        this.skuElement = document.querySelector('[data-product-sku]');
        this.priceElement = document.querySelector('[data-product-price]');
        this.brandElement = document.querySelector('[data-product-brand]');

        this.stateManager.subscribe(this.update.bind(this));
    }

    update(state) {
        const { aliasData, inventory, archetypeData } = state;

        // Optimization: Only update DOM if relevant state (aliasData or inventory) has changed
        if (aliasData === this.lastAliasData && inventory === this.lastInventory) return;
        this.lastAliasData = aliasData;
        this.lastInventory = inventory;

        let dataToRender = {};

        if (aliasData) {
            dataToRender = { ...aliasData };
            // Calculate stock message if we have alias data and inventory
            if (inventory && inventory.global_inv && aliasData.base_id) {
                const stockItem = inventory.global_inv[aliasData.base_id];
                if (stockItem) {
                    dataToRender.stock_message = this._getStockMessage(stockItem);
                }
            }
        } else if (archetypeData) {
            // Fallback to archetype data for description and brand
            dataToRender.description = archetypeData.description;
            dataToRender.brand_name = archetypeData.brand_name;
        }

        this.render(dataToRender, archetypeData);
    }

    _getStockMessage(item) {
        const { av, a2b } = item;
        
        if (av > 10) return 'Plenty in stock';
        if (av > 0) return `Only ${av} left. Order soon!`;
        if (a2b > 0) return 'In Stock'; // Made to order
        return 'Out of Stock';
    }

    _generateInstructionsHtml(url) {
        return `<a href="${url}" target="_blank" class="button button--primary">View Instructions</a>`;
    }

    _animate(element) {
        if (!element) return;
        element.classList.remove('fade-in');
        void element.offsetWidth; // trigger reflow
        element.classList.add('fade-in');
    }

    render(data, archetypeData) {
        if (this.descriptionElement) this.descriptionElement.innerHTML = data.description || '';
        if (this.instructionsElement) {
            if (data.instructions_url) {
                this.instructionsElement.innerHTML = this._generateInstructionsHtml(data.instructions_url);
                this.instructionsElement.style.display = 'flex';
                this._animate(this.instructionsElement);
            } else {
                this.instructionsElement.innerHTML = '';
                this.instructionsElement.style.display = 'none';
            }
        }
        if (this.skuElement) {
            this.skuElement.textContent = data.base_sku || '';
            if (data.base_sku) this._animate(this.skuElement);
        }
        if (this.brandElement) {
            if (data.brand_name) {
                this.brandElement.textContent = data.brand_name;
                this.brandElement.style.display = '';
                this._animate(this.brandElement);
            } else {
                this.brandElement.textContent = '';
            }
        }
        if (this.priceElement) {
            const price = data.price;
            
            if (price === undefined || price === null || price === 0 || price === '0' || (typeof price === 'string' && price.includes('$0.00'))) {
                this.priceElement.innerHTML = '';
            } else {
                // Handle both numeric prices (from JSON) and string prices (from default HTML)
                this.priceElement.innerHTML = typeof price === 'number' 
                    ? price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
                    : price;
                this._animate(this.priceElement);
            }
        }
    }
}