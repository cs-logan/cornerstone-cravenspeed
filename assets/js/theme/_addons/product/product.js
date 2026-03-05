import DataManager from './dataManager';
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

            this.stateManager.subscribe(this.handleStateChange.bind(this));

            // Trigger initial check in case alias was resolved during initialization
            this.handleStateChange(this.stateManager.getState());
            
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
            const title = this.context.productTitle;

            // Breadcrumbs Strategy
            // We look for a breadcrumb that matches the start of the product title.
            // This handles cases where the archetype name is a prefix of the alias title.
            if (this.context.breadcrumbs && this.context.breadcrumbs.length) {
                // Check breadcrumbs from deepest to shallowest, excluding the current page
                const parents = this.context.breadcrumbs.slice(0, -1).reverse();

                for (const breadcrumb of parents) {
                    // Remove "Qty - " prefix which appears in some category names
                    const cleanName = breadcrumb.name.replace(/^Qty\s*-\s*/i, '').trim();

                    // If the product title starts with this category name, it's likely the archetype
                    if (cleanName && title.toLowerCase().startsWith(cleanName.toLowerCase())) {
                        return cleanName;
                    }
                }
            }

            // If no parent breadcrumb matches, assume the current title is the archetype title
            return title;
        }

        console.warn('No product title found in context. Defaulting to "Shift Knob".');
        return 'Shift Knob';
    }

    _slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
}
