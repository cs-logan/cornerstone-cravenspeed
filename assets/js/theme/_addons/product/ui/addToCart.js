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

        this.defaultButtonText = this.button.textContent;

        this.init();
    }

    init() {
        // Initial state: Disable button until alias is selected
        this.button.disabled = true;

        // Check for pre-existing alias (Universal products)
        this.updateButtonState(this.state.getState());

        this.bindEvents();
    }

    bindEvents() {
        // Watch for alias changes
        this.state.subscribe((state) => this.updateButtonState(state));

        // Intercept form submission
        this.form.addEventListener('submit', (event) => this.handleSubmit(event));
    }

    updateButtonState(state) {
        const { aliasData, inventory, blemSelected } = state;

        // We expect alias to be an object with a 'bc_id' property representing the BC Product ID
        if (aliasData && aliasData.bc_id) {
            // Check inventory
            let isStocked = true;
            let targetId = aliasData.bc_id;
            let inventoryId = aliasData.base_id;

            if (blemSelected && aliasData.blem) {
                targetId = aliasData.blem.big_c_id;
                inventoryId = aliasData.blem.qty_id;
            }

            if (!targetId) {
                console.error('AddToCart: Target Product ID not found.');
                this.button.disabled = true;
                return;
            }

            if (inventory && inventory.global_inv && inventoryId) {
                const stockItem = inventory.global_inv[inventoryId];
                if (stockItem) {
                    const { av, a2b } = stockItem;
                    if (av <= 0 && a2b <= 0) {
                        isStocked = false;
                    }
                } else {
                    // base_id exists but not found in inventory -> Out of Stock
                    isStocked = false;
                }
            }

            if (isStocked) {
                const wasDisabled = this.button.disabled;

                // Enable button
                this.button.disabled = false;
                this.button.textContent = this.defaultButtonText;

                // Update the hidden product_id field with the Alias ID (swapping out the Archetype ID)
                if (this.productIdInput) {
                    this.productIdInput.value = targetId;
                }

                if (wasDisabled) {
                    this.button.focus();
                }
            } else {
                // Alias selected but Out of Stock
                this.button.disabled = true;
                this.button.textContent = 'Out of Stock';
            }
        } else {
            // Disable button
            this.button.disabled = true;
            this.button.textContent = this.defaultButtonText;
        }
    }

    handleSubmit(event) {
        event.preventDefault();

        // Double check validation
        if (this.button.disabled) return;

        // Accessibility: Blur focus to prevent "aria-hidden" warning when modal opens
        if (document.activeElement) document.activeElement.blur();

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