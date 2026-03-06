export default class SearchEngine {
    constructor(data) {
        this.data = data || {};
        this.products = this._normalizeProducts(data);
        this.vehicleIndex = this._buildVehicleIndex(data ? data.vehicle_registry : null);
    }

    /**
     * Main search method
     * @param {string} query - User input
     * @param {number|null} limit - Max results to return (default null for all)
     * @returns {Array} - Top 8 matching products
     */
    search(query, limit = null) {
        const tokens = this.tokenize(query);
        if (!tokens.length) return [];
        
        if (this.products.length === 0) {
            return [];
        }

        let results = this.products
            .map(product => {
                const score = this.calculateScore(product, tokens);
                return { product, score };
            })
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score);

        if (limit) {
            results = results.slice(0, limit);
        }

        return results.map(result => result.product);
    }

    tokenize(query) {
        return query.toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove special characters
            .split(/\s+/) // Split by whitespace
            .filter(t => t.length > 0);
    }

    calculateScore(product, tokens) {
        let score = 0;
        const title = (product.title || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();
        
        // Handle general_keywords string from JSON (e.g., "lisense, lisence, numberplate")
        let keywords = [];
        if (typeof product.general_keywords === 'string') {
            keywords = product.general_keywords.toLowerCase().split(',').map(k => k.trim());
        }

        // Compatibility Check
        const productIds = product.compatibility_ids || [];
        // Universal if empty array or array with empty string
        const isUniversal = productIds.length === 0 || (productIds.length === 1 && productIds[0] === "");

        tokens.forEach(token => {
            // Scoring Weights
            if (sku.includes(token)) score += 20; // High priority for SKU/Part #
            if (title.includes(token)) score += 10;
            if (keywords.some(k => k.includes(token))) score += 5;

            // Vehicle Match
            if (this.vehicleIndex[token]) {
                if (isUniversal) {
                    score += 5; // Universal products match vehicle queries lightly
                } else if (productIds.some(id => this.vehicleIndex[token].has(id))) {
                    score += 15; // Strong match for specific vehicle
                }
            }
        });

        return score;
    }

    _normalizeProducts(data) {
        if (!data) return [];

        // Case 1: Data is the array (Flat list)
        if (Array.isArray(data)) {
            return data;
        }

        // Case 2: Data has a products key
        if (data && data.products) {
            if (Array.isArray(data.products)) return data.products;
            
            // Case 3: Products is an object map (URL -> Product)
            if (typeof data.products === 'object') {
                return Object.entries(data.products).map(([url, product]) => {
                    return { ...product, url: url };
                });
            }
        }

        console.warn('SearchEngine: Could not parse products from data', data);
        return [];
    }

    _buildVehicleIndex(registry) {
        const index = {};
        if (!registry) return index;

        const addIds = (term, ids) => {
            if (!term) return;

            // Tokenize the term in the same way the main search tokenizer does.
            // This ensures that a search for "Miata" will match a vehicle named "MX-5 Miata"
            // by indexing both "mx5" and "miata" as keywords pointing to the same vehicle IDs.
            const tokens = term.toLowerCase()
                .replace(/[^\w\s]/g, '') // Clean, but keep spaces for splitting
                .split(/\s+/)
                .filter(t => t.length > 0);

            tokens.forEach(token => {
                if (!index[token]) {
                    index[token] = new Set();
                }
                ids.forEach(id => index[token].add(id));
            });
        };

        // Helper to get IDs for a model
        const getModelIds = (modelSlug) => {
            const model = registry.models && registry.models[modelSlug];
            if (!model || !model.generations) return [];
            return Object.keys(model.generations);
        };

        // Index Brands
        if (registry.brands) {
            Object.entries(registry.brands).forEach(([brandSlug, brandData]) => {
                const modelSlugs = brandData.models || [];
                const brandIds = modelSlugs.reduce((acc, slug) => acc.concat(getModelIds(slug)), []);
                
                addIds(brandSlug, brandIds);
                if (brandData.name) addIds(brandData.name, brandIds);
            });
        }

        // Index Models
        if (registry.models) {
            Object.entries(registry.models).forEach(([modelSlug, modelData]) => {
                const ids = getModelIds(modelSlug);
                addIds(modelSlug, ids);
                if (modelData.name) addIds(modelData.name, ids);

                if (modelData.generations) {
                    Object.entries(modelData.generations).forEach(([genId, genName]) => {
                        addIds(genName, [genId]);
                    });
                }
            });
        }

        return index;
    }
}