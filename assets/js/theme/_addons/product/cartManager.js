import utils from '@bigcommerce/stencil-utils';

export default class CartManager {
    constructor() {
        this.utils = utils;
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

                return resolve(response);
            });
        });
    }
}