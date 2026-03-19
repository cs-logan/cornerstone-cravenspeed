import { escapeHtml } from '../utils';

export default class ResultsPage {
    constructor() {
        this.container = document.getElementById('global-search-results');
        this.heading = document.querySelector('#search-results-heading');
    }

    /**
     * Renders the full search results page
     * @param {Array} results - Array of product objects from SearchEngine
     * @param {string} query - The search query string
     */
    render(results, query) {
        if (!this.container) return;

        // Update Loading State
        this.container.setAttribute('aria-busy', 'false');

        // Update Heading
        this._renderHeading(results.length, query);

        // Render Grid
        if (results.length === 0) {
            this._renderNoResults(query);
        } else {
            this._renderGrid(results);
        }
    }

    _renderHeading(count, query) {
        const safeQuery = escapeHtml(query);
        const headingHTML = `
            <h1 class="page-heading">
                ${count} results for '${safeQuery}'
            </h1>
        `;

        if (this.heading) {
            this.heading.innerHTML = headingHTML;
        }
    }

    _renderGrid(products) {
        // We use the standard .productGrid class to inherit theme styles
        const gridHTML = `
            <ul class="productGrid">
                ${products.map(product => this._buildCard(product)).join('')}
            </ul>
        `;
        this.container.innerHTML = gridHTML;
    }

    _renderNoResults(query) {
        const safeQuery = escapeHtml(query);
        this.container.innerHTML = `
            <div class="panel panel--large">
                <div class="panel-body">
                    <p class="search-suggestion">
                        Your search for "<strong>${safeQuery}</strong>" did not match any products.
                    </p>
                    <p>Suggestions:</p>
                    <ul>
                        <li>Make sure all words are spelled correctly.</li>
                        <li>Try different keywords.</li>
                        <li>Try more general keywords.</li>
                    </ul>
                </div>
            </div>
        `;
    }

    _buildCard(product) {
        const title = escapeHtml(product.title);
        const url = escapeHtml(product.url);
        const image = escapeHtml(product.image);
        const price = escapeHtml(product.price);

        // Semantic HTML structure matching Cornerstone's components/products/card.html
        // Uses 'lazyload' class for lazysizes to pick up (if configured in theme)
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
