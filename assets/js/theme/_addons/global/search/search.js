import { debounce } from 'lodash';
import DataManager from '../dataManager'; // Use Global DataManager
import StateManager from '../stateManager'; // Use Global StateManager
import SearchEngine from './searchEngine';
import QuickSearch from './ui/quickSearch';
import ResultsPage from './ui/resultsPage';
import ProductGrid from '../ui/productGrid';

export default class SearchController {
    constructor(context) {
        this.context = context;
        // Global managers are singletons, no `new` keyword needed
        this.stateManager = StateManager;
        this.dataManager = DataManager;
        this.searchEngine = new SearchEngine();
        this.quickSearch = new QuickSearch();
        this.resultsPage = new ResultsPage();
        this.relatedProducts = new ProductGrid({
            title: 'Related Products',
        });
        this.$searchInput = document.querySelector('[data-cs-search-input]');
        this.isEngineInitialized = false;
        this.lastKnownVehicle = null;
        this.unsubscribe = null;

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
            this.dataManager.loadSearchData(); // Use global method
        }
    }

    subscribeToState() {
        // Subscribe to the global state manager
        this.unsubscribe = this.stateManager.subscribe(this.handleStateChange.bind(this));
    }

    handleStateChange(state) {
        const { search: searchState, vehicle: vehicleState } = state;

        if (searchState.data && !this.isEngineInitialized) {
            this.searchEngine = new SearchEngine(searchState.data);
            this.isEngineInitialized = true;

            // If user typed while loading, update results immediately
            if (this.$searchInput && this.$searchInput.value.trim().length > 0) {
                const query = this.$searchInput.value;
                const results = this.searchEngine.search(query, 8);
                this.quickSearch.update(results, query);
            }
        }

        // Render Full Results if on search page and data is ready
        if (searchState.data && this.isSearchPage && this.searchQuery) {
            const results = this.searchEngine.search(this.searchQuery, null); // null limit = all results
            this.resultsPage.render(results, this.searchQuery);
        }

        // Render Related Products if on product page, and update when vehicle changes
        if (searchState.data && this.isProductPage) {
            const vehicle = vehicleState.selected;
            if (JSON.stringify(vehicle) !== JSON.stringify(this.lastKnownVehicle)) {
                this.lastKnownVehicle = vehicle;
                this.updateRelatedProducts(vehicle);
            }
        }
    }

    bindEvents() {
        if (!this.$searchInput) return;

        this.$searchInput.addEventListener('focus', () => {
            this.dataManager.loadSearchData(); // Use global method
        }, { once: true });

        this.$searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value;
            const results = this.searchEngine.search(query, 8);
            this.quickSearch.update(results, query);
        }, 300));

        this.$searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.$searchInput.value.trim();
                if (query.length > 0) {
                    window.location.href = `/search.php?search_query=${encodeURIComponent(query)}`;
                }
            }
        });

        if (this.isProductPage) {
            // This is now handled by the global state listener in `handleStateChange`
        }
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }

    updateRelatedProducts(vehicle = null) {
        if (!this.isEngineInitialized) return;

        const currentUrl = window.location.pathname;
        const isVehicleComplete = vehicle && vehicle.make && vehicle.model && vehicle.generation;
        const vehicleId = isVehicleComplete ? vehicle.generation : null;

        let cleanModel = isVehicleComplete ? vehicle.model : null;
        if (isVehicleComplete) {
            const cleanMake = vehicle.make.toLowerCase().replace(/\s+/g, '');
            if (vehicle.model.toLowerCase().startsWith(cleanMake)) {
                cleanModel = vehicle.model.substring(cleanMake.length);
            }
        }

        const vehicleName = isVehicleComplete
            ? this.searchEngine.getVehicleName(vehicle.make, cleanModel, vehicle.generation)
            : null;

        const related = this.searchEngine.findRelated(currentUrl, vehicleId);
        const title = vehicleName ? `More for your ${vehicleName}` : 'Related Products';
        this.relatedProducts.render(related, title);
    }
}
