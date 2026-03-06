import { escapeHtml } from '../utils';

export default class QuickSearch {
    constructor() {
        this.$resultsContainer = document.querySelector('#cs-search-results');
    }

    /**
     * Renders the results into the dropdown
     * @param {Array} results - Array of product objects
     * @param {string} query - The search term used
     */
    update(results, query) {
        if (!this.$resultsContainer) return;

        // If query is empty or too short, clear results
        if (!query || query.length < 2) {
            this.clear();
            return;
        }

        if (results.length === 0) {
            this.renderNoResults(query);
            return;
        }

        const listHtml = results.map(product => this.buildCard(product)).join('');
        const footerHtml = this.buildFooter(query);

        this.$resultsContainer.innerHTML = `
            <div class="cs-search-list">
                ${listHtml}
            </div>
            ${footerHtml}
        `;
        
        this.show();
    }

    buildCard(product) {
        const image = escapeHtml(product.thumbnail || product.image || ''); 
        const title = escapeHtml(product.title || 'Unknown Product');
        const url = escapeHtml(product.url || '#');
        const sku = escapeHtml(product.sku || '');
        const price = product.price ? escapeHtml(`${product.price}`) : ''; 

        return `
            <a href="${url}" class="cs-search-result-item">
                <div class="cs-search-result-image">
                    <img src="${image}" alt="${title}" loading="lazy">
                </div>
                <div class="cs-search-result-info">
                    <span class="cs-search-result-title">${title}</span>
                    ${sku ? `<span class="cs-search-result-sku">SKU: ${sku}</span>` : ''}
                    ${price ? `<span class="cs-search-result-price">${price}</span>` : ''}
                </div>
            </a>
        `;
    }

    buildFooter(query) {
        return `
            <div class="cs-search-footer">
                <a href="/search.php?search_query=${encodeURIComponent(query)}" class="button button--primary button--small">
                    View All Results
                </a>
            </div>
        `;
    }

    renderNoResults(query) {
        const safeQuery = escapeHtml(query);
        this.$resultsContainer.innerHTML = `
            <div class="cs-search-no-results">
                <p>No results found for <strong>"${safeQuery}"</strong></p>
            </div>
        `;
        this.show();
    }

    clear() {
        if (this.$resultsContainer) {
            this.$resultsContainer.innerHTML = '';
            this.hide();
        }
    }

    show() {
        if (this.$resultsContainer) {
            this.$resultsContainer.classList.add('visible');
        }
    }

    hide() {
        if (this.$resultsContainer) {
            this.$resultsContainer.classList.remove('visible');
        }
    }
}