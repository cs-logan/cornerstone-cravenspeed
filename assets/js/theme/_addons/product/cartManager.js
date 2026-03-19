import utils from '@bigcommerce/stencil-utils';
import modalFactory from '../../global/modal';

export default class CartManager {
    constructor() {
        this.utils = utils;
        this.previewModal = modalFactory('#modal')[0];
    }

    /**
     * Adds an item to the cart via the Stencil Utils API.
     *
     * @param {FormData} formData - The form data containing product_id, qty, etc.
     * @returns {Promise} - Resolves with response data on success, rejects on error.
     */
    addToCart(formData) {
        return new Promise((resolve, reject) => {
            this.utils.api.cart.itemAdd(formData, (err, response) => {
                const errorMessage = err || response.data.error;

                if (errorMessage) {
                    return reject(errorMessage);
                }

                // Update cart quantity
                const quantity = response.data.cart_quantity || 0;
                this.utils.hooks.emit('cart-quantity-update', quantity);

                // Open Modal with loading state
                if (this.previewModal) {
                    this.previewModal.open({ size: 'large' });

                    // Update aria-hidden to prevent accessibility warning
                    if (this.previewModal.$modal) {
                        this.previewModal.$modal.attr('aria-hidden', 'false');
                    }
                }

                // Fetch Cart Content
                const cartItemId = response.data.cart_item ? response.data.cart_item.id : null;
                this.getCartContent(cartItemId)
                    .then((modalContent) => {
                        if (this.previewModal) {
                            this.previewModal.updateContent(modalContent);
                        }
                        resolve(response);
                    })
                    .catch(() => resolve(response));
            });
        });
    }

    /**
     * Fetches the cart content using a specific template.
     *
     * @param {string} cartItemId - The ID of the item just added (to suggest/highlight).
     * @returns {Promise} - Resolves with the HTML content.
     */
    getCartContent(cartItemId) {
        const options = {
            template: 'products-cs/modals/cart-preview',
            params: {
                suggest: cartItemId,
            },
            config: {
                cart: {
                    suggestions: {
                        limit: 4,
                    },
                },
            },
        };

        return new Promise((resolve, reject) => {
            this.utils.api.cart.getContent(options, (err, response) => {
                if (err) {
                    return reject(err);
                }
                return resolve(response);
            });
        });
    }
}
