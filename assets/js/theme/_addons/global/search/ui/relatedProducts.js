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
        const gridHTML = `
            <ul class="productGrid">
                ${products.map(product => this._buildCard(product)).join('')}
            </ul>
        `;
        this.container.innerHTML = gridHTML;
    }

    _buildCard(product) {
        const title = escapeHtml(product.title);
        const url = escapeHtml(product.url);
        const image = escapeHtml(product.image);
        const price = escapeHtml(product.price);

        // Reusing the standard card structure
        return `
            <li class="product">
                <article class="card">
                    <figure class="card-figure">
                        <a href="${url}" class="card-figure__link" aria-label="${title}">
                            <div class="card-img-container">
                                <img class="card-image lazyload" 
                                     data-sizes="auto" 
                                     src="${image}" 
                                     alt="${title}" 
                                     title="${title}">
                            </div>
                        </a>
                    </figure>
                    <div class="card-body">
                        <h3 class="card-title">
                            <a href="${url}">${title}</a>
                        </h3>
                        <div class="card-text" data-test-info-type="price">
                            <div class="price-section price-section--withoutTax">
                                <span class="price price--withoutTax">${price}</span>
                            </div>
                        </div>
                    </div>
                </article>
            </li>
        `;
    }
}