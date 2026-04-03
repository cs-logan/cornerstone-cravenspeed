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
        const gridHTML = products.map(product => this._buildCard(product)).join('');
        this.container.innerHTML = `<div class="productGrid">${gridHTML}</div>`;
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
        const price = product.price;

        return `
            <div class="cs-product-card">
                <div class="cs-product-card-image-wrapper">
                    <a href="${url}">
                        <img class="cs-product-card-image" src="${image}" alt="${title}" title="${title}" width="360" height="270">
                    </a>
                </div>
                <div class="cs-product-card-details">
                    <h2 class="cs-card-title">
                        <a href="${url}" class="cs-card-title-link">${title}</a>
                    </h2>
                    <div class="cs-card-price">
                        ${price}
                    </div>
                </div>
            </div>
        `;
    }
}
