import CartManager from '../cartManager';

export default class AddToCart {
    constructor(stateManager) {
        this.state = stateManager;
        this.cartManager = new CartManager();

        this.button = document.querySelector('#product-add-button');
        this.form = document.querySelector('#product-selection');
        this.productIdInput = this.form ? this.form.querySelector('input[name="product_id"]') : null;

        if (!this.button || !this.form) {
            console.warn('AddToCart UI: Required elements not found.');
            return;
        }

        this.init();
    }

    init() {
        // Initial state: Disable button until alias is selected
        this.button.disabled = true;

        // Check for pre-existing alias (Universal products)
        const state = this.state.getState();
        if (state.aliasData) {
            this.handleAliasChange(state.aliasData);
        }

        this.bindEvents();
    }

    bindEvents() {
        // Watch for alias changes
        this.state.subscribe((state) => this.handleAliasChange(state.aliasData));

        // Intercept form submission
        this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    }

    handleAliasChange(alias) {
        // We expect alias to be an object with a 'bc_id' property representing the BC Product ID
        if (alias && alias.bc_id) {
            // Enable button
            this.button.disabled = false;

            // Update the hidden product_id field with the Alias ID (swapping out the Archetype ID)
            if (this.productIdInput) {
                this.productIdInput.value = alias.bc_id;
            }
        } else {
            // Disable button
            this.button.disabled = true;
        }
    }

    handleSubmit(event) {
        event.preventDefault();

        // Double check validation
        if (this.button.disabled) return;

        this.button.classList.add('loading');

        // Create FormData from the form element
        // This automatically captures the updated product_id value from the DOM
        const formData = new FormData(this.form);

        this.cartManager.addToCart(formData)
            .then((response) => {
                // Modal logic is handled in CartManager
            })
            .catch((error) => {
                console.error('Error adding to cart:', error);
                // TODO: Handle error UI
            })
            .finally(() => {
                this.button.classList.remove('loading');
            });
    }
}