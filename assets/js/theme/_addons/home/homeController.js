import PageManager from '../../page-manager';
import VehicleSelector from './vehicleSelector';
import ProductGrid from '../global/ui/productGrid';
import DataManager from '../global/dataManager';
import StateManager from '../global/stateManager';
import SearchEngine from '../global/search/searchEngine';

export default class HomeController extends PageManager {
    constructor(context) {
        super(context);
        this.vehicleSelector = new VehicleSelector(context);
        this.productGrid = new ProductGrid({
            gridType: 'collapsible',
            showAllText: 'Show All Products',
            showLessText: 'Show Less',
        });
        this.searchEngine = null;
        this.currentSelection = null;
        this.allProducts = [];
        this.unsubscribe = null;
    }

    onReady() {
        this.vehicleSelector.init();

        this.unsubscribe = StateManager.subscribe(this.handleStateChange.bind(this));

        const currentState = StateManager.getState();
        if (currentState.search.data) {
            this.handleStateChange(currentState);
        }

        DataManager.loadSearchData();
    }
    
    handleStateChange(state) {
        const { search, vehicle } = state;

        if (search.data && !this.searchEngine) {
            this.searchEngine = new SearchEngine(search.data);
            this.allProducts = this.searchEngine.products;
            this.vehicleSelector.setRegistry(search.data.vehicle_registry);
        }

        if (JSON.stringify(vehicle.selected) !== JSON.stringify(this.currentSelection)) {
            this.currentSelection = vehicle.selected;
        }
        
        this.checkAndRender();
    }

    checkAndRender() {
        if (!this.searchEngine) return;

        if (this.currentSelection) {
            const { make, model, generation } = this.currentSelection;
            const results = this.searchEngine.findRelated('', generation, Infinity);
            const vehicleName = this.searchEngine.getVehicleName(make, model, generation);
            const title = vehicleName ? `Products for your ${vehicleName}` : 'All Products';
            this.productGrid.render(results, title);
        } else {
            const allProductsSorted = [...this.allProducts].sort((a, b) => (a.sort_order || 10000) - (b.sort_order || 10000));
            this.productGrid.render(allProductsSorted, 'All Products');
        }
    }

    /**
     * Cleanup method for the addon. 
     * NOTE: Currently unused in standard page loads, but required for
     * future "URL Switching" / SPA features to prevent memory leaks.
     */
    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.vehicleSelector) this.vehicleSelector.destroy();
        if (this.productGrid) this.productGrid.destroy();
    }
}