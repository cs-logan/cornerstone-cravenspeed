import SearchEngine from '../global/search/searchEngine';

export default class ProductGrid {
    constructor(context, stateManager) {
        this.context = context;
        this.stateManager = stateManager;
        this.container = document.querySelector('[data-home-product-grid]');
        this.header = document.querySelector('[data-home-product-grid-header]');
        this.searchEngine = null;
        this.currentSelection = null;
        this.allProducts = [];
        this.unsubscribe = null;
    }

    init() {
        if (this.stateManager) {
            this.unsubscribe = this.stateManager.subscribe(this.handleStateChange.bind(this));
        }
        // Initial render based on current state
        this.handleStateChange(this.stateManager.getState());
    }

    setData(data) {
        this.searchEngine = new SearchEngine(data);
        this.allProducts = this.searchEngine.products;
        this.checkAndRender();
    }

    handleStateChange(state) {
        const { vehicle } = state;
        // Prevent re-rendering if the vehicle hasn't changed
        if (JSON.stringify(vehicle.selected) === JSON.stringify(this.currentSelection)) {
            return;
        }
        this.currentSelection = vehicle.selected;
        this.checkAndRender();
    }

    checkAndRender() {
        if (!this.searchEngine) return;

        if (this.currentSelection) {
            const { make, model, generation } = this.currentSelection;
            // findRelated now correctly finds vehicle-specific AND universal products.
            const results = this.searchEngine.findRelated('', generation, Infinity);
            const vehicleName = this.searchEngine.getVehicleName(make, model, generation);
            this.render(results, vehicleName);
        } else {
            // If no vehicle is selected, show all products sorted by the default order
            const allProductsSorted = [...this.allProducts].sort((a, b) => (a.sort_order || 10000) - (b.sort_order || 10000));
            this.render(allProductsSorted);
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

        const shouldCollapse = products.length > 6;
        const collapsedClass = shouldCollapse ? 'is-collapsed' : '';
        const buttonStyle = shouldCollapse ? '' : 'style="display: none;"';

        this.container.innerHTML = `
            <div class="cs-product-grid-wrapper ${collapsedClass}" id="product-grid-wrapper">
                <div class="productGrid ${collapsedClass}">${html}</div>
                <div class="cs-grid-fade"></div>
            </div>
            <div class="cs-grid-actions" ${buttonStyle}>
                <button class="button button--primary" id="grid-toggle-btn">Show All</button>
            </div>
        `;

        if (shouldCollapse) {
            const toggleBtn = this.container.querySelector('#grid-toggle-btn');
            const wrapper = this.container.querySelector('#product-grid-wrapper');
            const grid = wrapper.querySelector('.productGrid');
            if (toggleBtn && wrapper && grid) {
                toggleBtn.addEventListener('click', () => {
                    const isCollapsed = wrapper.classList.contains('is-collapsed');
                    if (isCollapsed) {
                        wrapper.classList.remove('is-collapsed');
                        grid.classList.remove('is-collapsed');
                        toggleBtn.textContent = 'Show Less';
                    } else {
                        wrapper.classList.add('is-collapsed');
                        grid.classList.add('is-collapsed');
                        toggleBtn.textContent = 'Show All';
                        wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }
        }
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}