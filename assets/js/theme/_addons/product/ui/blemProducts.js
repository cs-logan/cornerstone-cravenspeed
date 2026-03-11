export default class BlemProducts {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.container = document.querySelector('[data-product-blem]');
        this.modalId = 'scratch-and-dent';
        this.modal = document.getElementById(this.modalId);

        if (!this.container || !this.modal) return;

        this.acceptBtn = this.modal.querySelector('#blem-accept');
        this.declineBtn = this.modal.querySelector('#blem-decline');

        this._bindEvents();
        this.unsubscribe = this.stateManager.subscribe(this.update.bind(this));
    }

    _bindEvents() {
        // Modal Buttons
        if (this.acceptBtn) {
            this.acceptBtn.addEventListener('click', () => {
                this.stateManager.setBlemSelection(true);
                this._closeModal();
            });
        }

        if (this.declineBtn) {
            this.declineBtn.addEventListener('click', () => {
                this._closeModal();
            });
        }

        // Checkbox change event (delegated from container)
        this.container.addEventListener('change', (e) => {
            if (e.target.matches('#blem-check')) {
                this.stateManager.setBlemSelection(e.target.checked);
            }
        });
    }

    update(state) {
        const { aliasData, inventory, blemSelected } = state;

        // Reset if no alias or no blem data
        if (!aliasData || !aliasData.blem) {
            this.container.innerHTML = '';
            return;
        }

        // Check Inventory
        const blemQtyId = aliasData.blem.qty_id;
        let isStocked = false;

        if (inventory && inventory.global_inv && blemQtyId) {
            const stockItem = inventory.global_inv[blemQtyId];
            if (stockItem) {
                const { av, a2b } = stockItem;
                if (av > 0 || a2b > 0) {
                    isStocked = true;
                }
            }
        }

        if (!isStocked) {
            this.container.innerHTML = '';
            return;
        }

        // Render UI
        const savings = aliasData.price - aliasData.blem.price;

        if (blemSelected) {
            this._renderCheckbox(savings);
        } else {
            this._renderLink(savings);
        }
    }

    _renderLink(savings) {
        const formattedSavings = savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        
        // We use data-reveal-id to leverage Foundation's built-in modal trigger
        this.container.innerHTML = `
            <a href="#" data-reveal-id="${this.modalId}" class="blem-link">
                Interested in saving ${formattedSavings}?
            </a>
        `;
    }

    _renderCheckbox(savings) {
        const formattedSavings = savings.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        this.container.innerHTML = `
            <div class="form-field">
                <input type="checkbox" class="form-checkbox" id="blem-check" checked>
                <label for="blem-check" class="form-label">Apply Scratch & Dent Savings (-${formattedSavings})</label>
            </div>
        `;
    }

    _closeModal() {
        // Accessibility: Blur focus before closing to prevent "aria-hidden" warning
        if (document.activeElement) document.activeElement.blur();

        // Trigger the close button click to close the modal via Foundation without using jQuery directly
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.click();
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}