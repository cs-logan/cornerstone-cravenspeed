export default class Badges {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.element = document.querySelector('[data-product-badges]');

        if (this.element) {
            this.stateManager.subscribe(this.update.bind(this));
            this.update(this.stateManager.getState());
        }
    }

    update(state) {
        const { aliasData } = state;

        if (!aliasData) {
            this.element.classList.remove('visible');
            setTimeout(() => {
                if (!this.stateManager.getState().aliasData) {
                    this.element.innerHTML = '';
                }
            }, 500);
            return;
        }

        this.render(aliasData);
        requestAnimationFrame(() => this.element.classList.add('visible'));
    }

    render(data) {
        // 1. Made in USA Badge
        this._toggleBadge(
            'made-in-usa-badge',
            !!data.made_in_usa,
            () => this._createBadge('<img src="/product_images/uploaded_images/flag.png" alt="Made in USA"><h4>MADE IN USA</h4>'),
            'prepend'
        );

        // 2. Lifetime Warranty Badge (CravenSpeed Brand)
        this._toggleBadge(
            'warranty-badge',
            data.brand_name === 'CravenSpeed',
            () => {
                const el = this._createBadge('<h4>LIFETIME&nbsp;<br>WARRANTY</h4>');
                el.setAttribute('data-reveal-id', 'warranty-message');
                return el;
            },
            'after-usa'
        );

        // 3. Free Shipping Badge (Always displayed)
        this._toggleBadge(
            'free-shipping-badge',
            true,
            () => {
                const el = this._createBadge('<h4>FREE US&nbsp;<br>SHIPPING</h4>');
                el.setAttribute('data-reveal-id', 'shipping-message');
                return el;
            },
            'append'
        );
    }

    _createBadge(html) {
        const el = document.createElement('div');
        el.classList.add('fade-in');
        el.innerHTML = html;
        return el;
    }

    _toggleBadge(className, shouldShow, createFn, position) {
        const existing = this.element.querySelector(`.${className}`);

        if (shouldShow) {
            if (!existing) {
                const newEl = createFn();
                newEl.classList.add(className);

                if (position === 'prepend') {
                    this.element.prepend(newEl);
                } else if (position === 'append') {
                    this.element.appendChild(newEl);
                } else if (position === 'after-usa') {
                    const usa = this.element.querySelector('.made-in-usa-badge');
                    if (usa) {
                        usa.after(newEl);
                    } else {
                        this.element.prepend(newEl);
                    }
                }
            }
        } else {
            if (existing) {
                existing.remove();
            }
        }
    }
}