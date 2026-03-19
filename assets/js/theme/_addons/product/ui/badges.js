export default class Badges {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.element = document.querySelector('[data-product-badges]');
        this.unsubscribe = null;

        if (this.element) {
            this.unsubscribe = this.stateManager.subscribe(this.update.bind(this));
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
                    this.element.style.visibility = 'hidden';
                    this.element.style.display = 'flex';
                }
            }, 500);
            return;
        }

        this.element.style.display = 'flex';
        this.element.style.visibility = 'visible';
        this.render(aliasData);
        requestAnimationFrame(() => this.element.classList.add('visible'));
    }

    render(data) {
        // 1. Made in USA Badge
        this._toggleBadge(
            'made-in-usa-badge',
            !!data.made_in_usa,
            () => {
                const el = this._createBadge('<img src="/product_images/uploaded_images/flag.png" alt="Made in USA"><span class="badge-text">MADE IN USA</span>');
                el.setAttribute('data-reveal-id', 'usa-message');
                return el;
            },
            'prepend',
        );

        // 2. Lifetime Warranty Badge (CravenSpeed Brand)
        this._toggleBadge(
            'warranty-badge',
            data.brand_name === 'CravenSpeed',
            () => {
                const el = this._createBadge('<span class="badge-text">LIFETIME&nbsp;<br>WARRANTY</span>');
                el.setAttribute('data-reveal-id', 'warranty-message');
                return el;
            },
            'after-usa',
        );

        // 3. Free Shipping Badge (Always displayed)
        this._toggleBadge(
            'free-shipping-badge',
            true,
            () => {
                const el = this._createBadge('<span class="badge-text">FREE US&nbsp;<br>SHIPPING</span>');
                el.setAttribute('data-reveal-id', 'shipping-message');
                return el;
            },
            'append',
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
        } else if (existing) {
            existing.remove();
        }
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}
