import DataManager from './dataManager';
import StateManager from './stateManager';
import ShippingInfo from './ui/shippingInfo';
import AliasSelection from './ui/aliasSelection';
import StockInfo from './ui/stockInfo';
import ProductDetails from './ui/productDetails';
import ImageGallery from './ui/imageGallery';

export default class ProductController {
    constructor(context) {
        this.context = context;
        this.archetypeTitle = this._resolveArchetypeTitle();
        this.archetypeName = this._slugify(this.archetypeTitle);
        this.dataManager = new DataManager(this.archetypeName);
        this.currentAlias = null;
    }

    onReady() {
        console.log('ProductOrchestrator: onReady');
        this.updateHeading();
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            console.log(`Fetching archetype data for: ${this.archetypeName}`);
            const [archetypeData, inventoryData] = await Promise.all([
                this.dataManager.getArchetypeData(),
                this.dataManager.getInventoryData()
            ]);

            this.stateManager = new StateManager(archetypeData);
            this.stateManager.setInventoryData(inventoryData);
            this.shippingInfo = new ShippingInfo(this.stateManager);
            this.aliasSelection = new AliasSelection(this.stateManager);
            this.stockInfo = new StockInfo(this.stateManager);
            this.productDetails = new ProductDetails(this.stateManager);
            this.imageGallery = new ImageGallery(this.stateManager);

            this.stateManager.subscribe(this.handleStateChange.bind(this));
            
        } catch (error) {
            console.error(`Failed to load archetype data for ${this.archetypeName}:`, error);
        }
    }

    async handleStateChange(state) {
        const { currentAlias } = state;

        if (currentAlias && currentAlias !== this.currentAlias) {
            this.currentAlias = currentAlias;
            console.log(`New alias detected: ${currentAlias}. Fetching data...`);
            try {
                const aliasData = await this.dataManager.getAliasData(currentAlias);
                this.stateManager.setAliasData(aliasData);
                console.log('Alias data set in state.');
                console.log('new alias:', this.stateManager.state.aliasData);
            } catch (error) {
                console.error(`Failed to load alias data for ${currentAlias}:`, error);
            }
        } else if (!currentAlias) {
            this.currentAlias = null;
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
            let title = this.context.productTitle;

            // Handle alias titles: split at the last " for " to isolate the archetype name
            // We use lastIndexOf because some product names might contain " for "
            const splitIndex = title.toLowerCase().lastIndexOf(' for ');
            if (splitIndex !== -1) {
                title = title.substring(0, splitIndex);
            }
            return title;
        }

        console.warn('No product title found in context. Defaulting to "Shift Knob".');
        return 'Shift Knob';
    }

    _slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
}
