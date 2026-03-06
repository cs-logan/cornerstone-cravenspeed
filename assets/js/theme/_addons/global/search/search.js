import { debounce } from 'lodash';
import SearchDataManager from "./searchDataManager";
import SearchStateManager from "./stateManager";
import SearchEngine from "./searchEngine";
import QuickSearch from "./ui/quickSearch";
import ResultsPage from "./ui/resultsPage";
import RelatedProducts from "./ui/relatedProducts";

export default class SearchController {
    constructor(context) {
        this.context = context;
        this.stateManager = new SearchStateManager();
        this.dataManager = new SearchDataManager(this.stateManager);
        this.searchEngine = new SearchEngine();
        this.quickSearch = new QuickSearch();
        this.resultsPage = new ResultsPage();
        this.relatedProducts = new RelatedProducts();
        this.$searchInput = document.querySelector('[data-cs-search-input]');
        this.isEngineInitialized = false;

        // Routing State
        this.urlParams = new URLSearchParams(window.location.search);
        this.searchQuery = this.urlParams.get('search_query');
        this.isSearchPage = window.location.pathname === '/search.php';
        this.isProductPage = document.querySelector('.cs-product-archetype') !== null;
    }

    onReady() {
        this.bindEvents();
        this.subscribeToState();

        // If we are on the search page OR product page, we need data immediately
        if (this.isSearchPage || this.isProductPage) {
            this.dataManager.loadData();
        }
    }

    subscribeToState() {
        this.stateManager.subscribe(this.handleStateChange.bind(this));
    }

    handleStateChange(state) {
        if (state.data && !this.isEngineInitialized) {
            this.searchEngine = new SearchEngine(state.data);
            this.isEngineInitialized = true;

            // If user typed while loading, update results immediately
            if (this.$searchInput && this.$searchInput.value.trim().length > 0) {
                const query = this.$searchInput.value;
                const results = this.searchEngine.search(query, 8);
                this.quickSearch.update(results, query);
            }
        }

        // Phase 3: Render Full Results if on search page and data is ready
        if (state.data && this.isSearchPage && this.searchQuery) {
            const results = this.searchEngine.search(this.searchQuery, null); // null limit = all results
            this.resultsPage.render(results, this.searchQuery);
        }

        // Phase 4: Render Related Products if on product page
        if (state.data && this.isProductPage) {
            this.updateRelatedProducts();
        }
    }

    bindEvents() {
        if (!this.$searchInput) return;

        this.$searchInput.addEventListener('focus', () => {
            this.dataManager.loadData();
        }, { once: true });

        this.$searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value;
            const results = this.searchEngine.search(query, 8);
            this.quickSearch.update(results, query);
        }, 300));

        // Phase 3: Handle Enter Key for Full Search Redirect
        this.$searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.$searchInput.value.trim();
                if (query.length > 0) {
                    window.location.href = `/search.php?search_query=${encodeURIComponent(query)}`;
                }
            }
        });

        // Phase 4: Listen for vehicle selection changes on Product Page
        if (this.isProductPage) {
            const optionsContainer = document.querySelector('[data-product-options-container]');
            const yearSelect = document.getElementById('year');

            if (optionsContainer) {
                // Use event delegation to match aliasSelection.js behavior
                optionsContainer.addEventListener('change', (e) => {
                    if (e.target.id === 'year' || e.target.dataset.productOption === 'generation') {
                        setTimeout(() => this.updateRelatedProducts(), 100);
                    }
                });

                // Also listen for programmatic updates (when options are loaded via JS)
                const observer = new MutationObserver(() => {
                    // If the select is enabled and has a valid value, update
                    if (!yearSelect.disabled && yearSelect.value && !yearSelect.value.includes('Loading')) {
                        this.updateRelatedProducts();
                    }
                });
                if (yearSelect) {
                    observer.observe(yearSelect, { childList: true, attributes: true });
                }
            }
        }
    }

    updateRelatedProducts() {
        if (!this.isEngineInitialized) return;

        const currentUrl = window.location.pathname;
        const yearSelect = document.getElementById('year');
        
        let vehicleId = yearSelect ? yearSelect.value : null;
        
        // Filter out default/loading values from DOM
        if (vehicleId && (vehicleId.includes('Loading') || vehicleId === '')) {
            vehicleId = null;
        }

        // Fallback to LocalStorage if DOM is not ready or empty
        if (!vehicleId) {
            vehicleId = localStorage.getItem('cs_garage_generation');
        }

        // Get vehicle name for display (e.g. "MINI Cooper F56")
        // We can construct this from the other selects if they exist
        let make = document.getElementById('make')?.value;
        let model = document.getElementById('model')?.value;

        // Fallback for name components
        if (!make || make.includes('Loading')) make = localStorage.getItem('cs_garage_make');
        if (!model || model.includes('Loading')) model = localStorage.getItem('cs_garage_model');

        // Clean slugs: Site IDs often include the make prefix (e.g. "mazdamx-5miata"), 
        // but search index uses clean slugs (e.g. "mx-5miata").
        let cleanModel = model;
        if (make) {
            const cleanMake = make.toLowerCase().replace(/\s+/g, '');
            
            if (vehicleId && vehicleId.toLowerCase().startsWith(cleanMake)) {
                vehicleId = vehicleId.substring(cleanMake.length); // Clean Generation ID
            }
            
            if (model && model.toLowerCase().startsWith(cleanMake)) {
                cleanModel = model.substring(cleanMake.length); // Clean Model ID
            }
        }

        const vehicleName = (make && cleanModel && vehicleId) 
            ? this.searchEngine.getVehicleName(make, cleanModel, vehicleId) 
            : null;

        const related = this.searchEngine.findRelated(currentUrl, vehicleId);
        this.relatedProducts.render(related, vehicleName);
    }
}