export default class SchemaManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.schemaPatched = false;
        this.unsubscribe = this.stateManager.subscribe(this.update.bind(this));
        this.update(this.stateManager.getState());
    }

    update(state) {
        if (this.schemaPatched || !state.archetypeData) return;
        this._patchSchema(state.archetypeData);
    }

    _patchSchema(archetypeData) {
        const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
        let productScript = null;
        let productSchema = null;

        schemaScripts.forEach((script) => {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'Product' && !productScript) {
                    productScript = script;
                    productSchema = data;
                }
            } catch (e) {
                // skip unparseable scripts
            }
        });

        if (!productScript || !productSchema) return;

        const {
            archetype_average_review: ratingValue,
            archetype_review_count: reviewCount,
        } = archetypeData;

        const count = parseInt(reviewCount, 10) || 0;

        if (count > 0 && ratingValue) {
            productSchema.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: String(parseFloat(ratingValue)),
                reviewCount: String(count),
                bestRating: '5',
                worstRating: '1',
            };
        }

        productScript.textContent = JSON.stringify(productSchema);
        this.schemaPatched = true;
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
    }
}
