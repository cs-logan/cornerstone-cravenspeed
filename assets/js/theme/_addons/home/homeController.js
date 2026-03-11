import PageManager from '../../page-manager';
import VehicleSelector from './vehicleSelector';
import ProductGrid from './productGrid';
import DataManager from '../global/dataManager';
import StateManager from '../global/stateManager';

export default class HomeController extends PageManager {
    constructor(context) {
        super(context);
        this.vehicleSelector = new VehicleSelector(context);
        this.productGrid = new ProductGrid(context, StateManager);
        this.unsubscribe = null;
    }

    onReady() {
        this.vehicleSelector.init();
        this.productGrid.init();

        const handleStateUpdate = (state) => {
            if (state.search.data) {
                this.vehicleSelector.setRegistry(state.search.data.vehicle_registry);
                this.productGrid.setData(state.search.data);
            }
        };

        this.unsubscribe = StateManager.subscribe(handleStateUpdate);

        const currentState = StateManager.getState();
        if (currentState.search.data) {
            handleStateUpdate(currentState);
        }

        DataManager.loadSearchData();
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