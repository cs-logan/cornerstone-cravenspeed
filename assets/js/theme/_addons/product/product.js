import DataManager from '../global/dataManager'; // Import global manager
import GlobalStateManager from '../global/stateManager';
import StateManager from './stateManager';
import FulfillmentStatus from './ui/fulfillmentStatus';
import AliasSelection from './ui/aliasSelection';
import ProductDetails from './ui/productDetails';
import Rating from './ui/rating';
import ImageGallery from './ui/imageGallery';
import AddToCart from './ui/addToCart';
import ProductMessages from './ui/productMessages';
import Badges from './ui/badges';
import BlemProducts from './ui/blemProducts';

export default class ProductController {
    constructor(context) {
        this.context = context;
        this.archetypeTitle = this._resolveArchetypeTitle();
        this.archetypeName = this._slugify(this.archetypeTitle);
        this.currentAliasFile = null;
        this.lastKnownVehicle = null;
        this.lastKnownOptions = null;
        this.unsubscribeGlobal = null;
        this.unsubscribeLocal = null;
    }

    onReady() {
        console.log('ProductOrchestrator: onReady');
        this.updateHeading();
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            console.log(`Fetching archetype data for: ${this.archetypeName}`);
            // Use global DataManager
            const [archetypeData, inventoryData] = await Promise.all([
                DataManager.getArchetypeData(this.archetypeName),
                DataManager.getInventoryData(),
            ]);

            archetypeData.archetypeName = this.archetypeName;

            this.stateManager = new StateManager(archetypeData);
            this.stateManager.setInventoryData(inventoryData);

            this.productMessages = new ProductMessages();
            this.fulfillmentStatus = new FulfillmentStatus(this.stateManager);
            this.aliasSelection = new AliasSelection(this.stateManager, this.productMessages);
            this.productDetails = new ProductDetails(this.stateManager);
            this.rating = new Rating(this.stateManager);
            this.imageGallery = new ImageGallery(this.stateManager);
            this.addToCart = new AddToCart(this.stateManager);
            this.badges = new Badges(this.stateManager);
            this.blemProducts = new BlemProducts(this.stateManager);

            // Subscribe to local state changes for alias fetching
            this.unsubscribeLocal = this.stateManager.subscribe(this.handleLocalStateChange.bind(this));

            // Subscribe to global state for vehicle changes
            this.unsubscribeGlobal = GlobalStateManager.subscribe(this.handleGlobalStateChange.bind(this));

            // Initial sync with global state
            this.handleGlobalStateChange(GlobalStateManager.getState());
            
        } catch (error) {
            console.error(`Failed to load archetype data for ${this.archetypeName}:`, error);
        }
    }

    handleGlobalStateChange(globalState) {
        // Vehicle Change Detection
        const { selected: vehicle } = globalState.vehicle;
        if (JSON.stringify(vehicle) !== JSON.stringify(this.lastKnownVehicle)) {
            console.log('ProductController: Global vehicle changed', vehicle);
            this.lastKnownVehicle = vehicle;
            this.stateManager.setVehicle(vehicle);
        }

        // Options Change Detection
        const { options } = globalState;
        if (options && options[this.archetypeName]) {
            const archetypeOptions = options[this.archetypeName];
            if (JSON.stringify(archetypeOptions) !== JSON.stringify(this.lastKnownOptions)) {
                console.log('ProductController: Global options for archetype changed', archetypeOptions);
                this.lastKnownOptions = archetypeOptions;
                this.stateManager.setOptions(archetypeOptions);
            }
        }
    }

    async handleLocalStateChange(state) {
        const { currentAlias: newAliasFile } = state;

        if (newAliasFile === 'self' || newAliasFile === this.currentAliasFile) {
            return; // No change needed
        }

        this.currentAliasFile = newAliasFile;

        if (newAliasFile) {
            try {
                // Use the global DataManager to fetch...
                const aliasData = await DataManager.getAliasData(this.archetypeName, newAliasFile);
                console.log('Product Page: Alias data from JSON:', aliasData);
                // ...and push the result into the local state manager.
                this.stateManager.setAliasData(aliasData);
            } catch (error) {
                console.error(`Failed to load alias data for ${newAliasFile}:`, error);
            }
        }
    }

    updateHeading() {
        const heading = document.querySelector('.cs-product-title');
        if (heading) {
            heading.textContent = this.archetypeTitle;
        }
    }

    _resolveArchetypeTitle() {
        if (this.context.productTitle) {
            const title = this.context.productTitle;
            if (this.context.breadcrumbs && this.context.breadcrumbs.length) {
                const parents = this.context.breadcrumbs.slice(0, -1).reverse();
                for (const breadcrumb of parents) {
                    const cleanName = breadcrumb.name.replace(/^Qty\s*-\s*/i, '').trim();
                    if (cleanName && title.toLowerCase().startsWith(cleanName.toLowerCase())) {
                        return cleanName;
                    }
                }
            }
            return title;
        }
        console.warn('No product title found in context. Defaulting to "Shift Knob".');
        return 'Shift Knob';
    }

    _slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    /**
     * Cleanup method to remove event listeners and subscriptions.
     */
    destroy() {
        if (this.unsubscribeGlobal) this.unsubscribeGlobal();
        if (this.unsubscribeLocal) this.unsubscribeLocal();
    }
}
