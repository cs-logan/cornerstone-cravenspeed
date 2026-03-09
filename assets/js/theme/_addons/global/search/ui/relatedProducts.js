import { escapeHtml } from '../utils';

export default class RelatedProducts {
    constructor() {
        this.container = document.getElementById('more-products');
        this.header = document.getElementById('more-products-header');
    }

    render(products, vehicleName = null) {
        if (!this.container) return;

        if (products.length === 0) {
            this.container.innerHTML = '<p>No related products found.</p>';
            return;
        }

        this._renderHeader(vehicleName);
        this._renderGrid(products);
    }

    _renderHeader(vehicleName) {
        if (!this.header) return;
        
        if (vehicleName) {
            this.header.innerHTML = `<h3>More for your ${escapeHtml(vehicleName)}</h3>`;
        } else {
            this.header.innerHTML = `<h3>Related Products</h3>`;
        }
    }

    _renderGrid(products) {
        const gridHTML = products.map(product => this._buildCard(product)).join('');
        this.container.innerHTML = gridHTML;
    }

    _buildCard(product) {
        const title = escapeHtml(product.title);
        const url = escapeHtml(product.url);
        const image = escapeHtml(product.image);
        const price = escapeHtml(product.price);

        return `
            <div class="cs-product-card">
                <a href="${url}">
                    <img src="${image}" alt="${title}" title="${title}" style="max-width: 100%; height: auto;">
                </a>
                <h4 class="cs-card-title">
                    <a href="${url}" class="cs-card-title-link">${title}</a>
                </h4>
                <div class="cs-card-price">
                    ${price}
                </div>
            </div>
        `;
    }
}