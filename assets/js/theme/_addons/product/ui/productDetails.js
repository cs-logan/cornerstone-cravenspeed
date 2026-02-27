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
        this.ratingElement = document.querySelector('[data-product-rating]');

        // Cache defaults (Handlebars rendered state) for reversion
        this.defaults = {
            description: this.descriptionElement ? this.descriptionElement.innerHTML : '',
            instructions: this.instructionsElement ? this.instructionsElement.innerHTML : '',
            sku: this.skuElement ? this.skuElement.textContent : '',
            price: this.priceElement ? this.priceElement.innerHTML : '',
            brand: this.brandElement ? this.brandElement.textContent : '',
            rating: this.ratingElement ? this.ratingElement.innerHTML : ''
        };

        this.stateManager.subscribe(this.update.bind(this));
    }

    update(state) {
        const { aliasData, inventory, archetypeData } = state;

        // Optimization: Only update DOM if relevant state (aliasData or inventory) has changed
        if (aliasData === this.lastAliasData && inventory === this.lastInventory) return;
        this.lastAliasData = aliasData;
        this.lastInventory = inventory;

        // If aliasData exists, use it; otherwise fallback to defaults
        let dataToRender = aliasData ? { ...aliasData } : this.defaults;

        // Calculate stock message if we have alias data and inventory
        if (aliasData && inventory && inventory.global_inv && aliasData.base_id) {
            const stockItem = inventory.global_inv[aliasData.base_id];
            if (stockItem) {
                dataToRender.stock_message = this._getStockMessage(stockItem);
            }
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

    _generateRatingHtml(average, count) {
        const rating = Math.round(parseFloat(average) || 0);
        const reviews = parseInt(count) || 0;
        
        let stars = '';
        for (let i = 0; i < 5; i++) {
            const isFull = i < rating;
            const iconClass = isFull ? 'icon--ratingFull' : 'icon--ratingEmpty';
            stars += `<span class="icon ${iconClass}"><svg><use xlink:href="#icon-star" /></svg></span>`;
        }
        
        return `${stars} <span class="rating-count">${average}/5 with ${reviews} reviews</span>`;
    }

    _generateInstructionsHtml(url) {
        return `<a href="${url}" target="_blank" class="button button--primary">View Instructions</a>`;
    }

    render(data, archetypeData) {
        if (this.descriptionElement) this.descriptionElement.innerHTML = data.description || this.defaults.description;
        if (this.instructionsElement) {
            if (data.instructions_url) {
                this.instructionsElement.innerHTML = this._generateInstructionsHtml(data.instructions_url);
                this.instructionsElement.style.display = 'flex';
            } else if (this.defaults.instructions && this.defaults.instructions.trim().length > 0) {
                this.instructionsElement.innerHTML = this.defaults.instructions;
                this.instructionsElement.style.display = 'flex';
            } else {
                this.instructionsElement.innerHTML = '';
                this.instructionsElement.style.display = 'none';
            }
        }
        if (this.skuElement) this.skuElement.textContent = data.base_sku || this.defaults.sku;
        if (this.brandElement) this.brandElement.textContent = data.brand_name || this.defaults.brand;
        if (this.priceElement) {
            const price = (data.price !== undefined) ? data.price : this.defaults.price;
            // Handle both numeric prices (from JSON) and string prices (from default HTML)
            this.priceElement.innerHTML = typeof price === 'number' 
                ? price.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
                : price;
        }
        if (this.ratingElement) {
            if (archetypeData && archetypeData.archetype_average_review) {
                this.ratingElement.innerHTML = this._generateRatingHtml(archetypeData.archetype_average_review, archetypeData.archetype_review_count);
            } else {
                this.ratingElement.innerHTML = this.defaults.rating;
            }
        }
    }
}