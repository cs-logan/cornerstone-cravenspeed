import DataManager from '../global/dataManager';
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
        this.updateHeading();
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
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

            this.unsubscribeLocal = this.stateManager.subscribe(this.handleLocalStateChange.bind(this));

            this.unsubscribeGlobal = GlobalStateManager.subscribe(this.handleGlobalStateChange.bind(this));

            this.handleGlobalStateChange(GlobalStateManager.getState());
            
        } catch (error) {
            console.error(`Failed to load archetype data for ${this.archetypeName}:`, error);
        }
    }

    handleGlobalStateChange(globalState) {
        const { selected: vehicle } = globalState.vehicle;
        if (JSON.stringify(vehicle) !== JSON.stringify(this.lastKnownVehicle)) {
            this.lastKnownVehicle = vehicle;
            this.stateManager.setVehicle(vehicle);
        }

        const { options } = globalState;
        if (options && options[this.archetypeName]) {
            const archetypeOptions = options[this.archetypeName];
            if (JSON.stringify(archetypeOptions) !== JSON.stringify(this.lastKnownOptions)) {
                this.lastKnownOptions = archetypeOptions;
                this.stateManager.setOptions(archetypeOptions);
            }
        }
    }

    async handleLocalStateChange(state) {
        const { currentAlias: newAliasFile } = state;

        if (newAliasFile === 'self' || newAliasFile === this.currentAliasFile) {
            return;
        }

        this.currentAliasFile = newAliasFile;

        if (newAliasFile) {
            try {
                const aliasData = await DataManager.getAliasData(this.archetypeName, newAliasFile);
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

    destroy() {
        if (this.unsubscribeGlobal) this.unsubscribeGlobal();
        if (this.unsubscribeLocal) this.unsubscribeLocal();
    }
}
