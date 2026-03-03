export default class ProductMessages {
    constructor() {
        this.container = document.querySelector('[data-product-messages]');
        if (!this.container) {
            console.warn('ProductMessages: a container with [data-product-messages] is required.');
            this.container = document.createElement('div'); // fallback
        }
    }

    showMessage(type, message, target = null) {
        const container = target || this.container;
        // Clear existing messages of the same type
        this.hideMessage(type, container);

        const messageEl = document.createElement('div');
        messageEl.classList.add('cs-product-message', `cs-product-message--${type}`);
        messageEl.dataset.messageType = type;
        messageEl.innerHTML = message;

        container.appendChild(messageEl);
    }

    hideMessage(type, target = null) {
        const container = target || this.container;
        const message = container.querySelector(`[data-message-type="${type}"]`);
        if (message) {
            message.remove();
        }
    }

    hideAllMessages() {
        this.container.innerHTML = '';
    }
}
