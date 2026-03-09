import PageManager from '../../page-manager';
import VehicleSelector from './vehicleSelector';
import ProductGrid from './productGrid';
import SearchDataManager from '../global/search/searchDataManager';
import SearchStateManager from '../global/search/stateManager';

export default class HomeController extends PageManager {
    constructor(context) {
        super(context);
        this.stateManager = new SearchStateManager();
        this.dataManager = new SearchDataManager(this.stateManager);
        this.vehicleSelector = new VehicleSelector(context);
        this.productGrid = new ProductGrid(context);
    }

    onReady() {
        this.vehicleSelector.init();
        this.productGrid.init();

        this.stateManager.subscribe((state) => {
            if (state.data) {
                this.vehicleSelector.setRegistry(state.data.vehicle_registry);
                this.productGrid.setData(state.data);
            }
        });

        this.dataManager.loadData();
    }
}