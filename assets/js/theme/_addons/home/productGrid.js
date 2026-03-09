import SearchEngine from '../global/search/searchEngine';

export default class ProductGrid {
    constructor(context) {
        this.context = context;
        this.container = document.querySelector('[data-home-product-grid]');
        this.header = document.querySelector('[data-home-product-grid-header]');
        this.searchEngine = null;
        this.currentSelection = null;
        this.allProducts = [];
    }

    init() {
        document.addEventListener('cs:vehicle-selected', (e) => this.handleVehicleSelection(e.detail));
    }

    setData(data) {
        this.allProducts = Array.isArray(data.products) ? data.products : Object.values(data.products || {});
        this.searchEngine = new SearchEngine(data);
        this.checkAndRender();
    }

    handleVehicleSelection(selection) {
        this.currentSelection = selection;
        this.checkAndRender();
    }

    checkAndRender() {
        if (!this.searchEngine) return;

        if (this.currentSelection) {
            const { make, model, generation } = this.currentSelection;
            // Use findRelated with an empty URL to find products compatible with the vehicle ID (generation)
            const vehicleResults = this.searchEngine.findRelated('', generation, Infinity);

            // Filter for universal products
            const universalProducts = this.allProducts.filter(p => p.universal);

            // Combine and deduplicate based on URL
            const results = [...vehicleResults];
            const existingUrls = new Set(vehicleResults.map(p => p.url));
            universalProducts.forEach(p => {
                if (!existingUrls.has(p.url)) {
                    results.push(p);
                }
            });

            const vehicleName = this.searchEngine.getVehicleName(make, model, generation);
            this.render(results, vehicleName);
        } else {
            this.render(this.allProducts);
        }
    }

    render(products, vehicleName) {
        if (!this.container) return;

        if (this.header) {
            const title = vehicleName ? `Products for your ${vehicleName}` : 'All Products';
            this.header.innerHTML = `<h2 class="page-heading">${title}</h2>`;
        }

        if (products.length === 0) {
            const msg = vehicleName ? 'No products found for this vehicle.' : 'No products found.';
            this.container.innerHTML = `<p>${msg}</p>`;
            return;
        }

        // Render a simple grid of cards
        const html = products.map(p => `
            <div class="cs-product-card">
                <a href="${p.url}">
                    <img src="${p.image}" alt="${p.title}" title="${p.title}" style="max-width: 100%; height: auto;">
                </a>
                <h4 class="cs-card-title">
                    <a href="${p.url}" class="cs-card-title-link">${p.title}</a>
                </h4>
                <div class="cs-card-price">
                    ${p.price}
                </div>
            </div>
        `).join('');

        this.container.innerHTML = html;
    }
}