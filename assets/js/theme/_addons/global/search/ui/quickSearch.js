import { debounce } from 'lodash';

export default class QuickSearch {
    constructor(context) {
        this.context = context;
        this.input = document.querySelector('#cs-search-input');
        this.resultsContainer = null;
        this.searchData = null;

        // Search Indices
        this.productsMap = new Map(); // url -> product data
        this.invertedIndex = new Map(); // token -> Set<url>
        this.fitmentIndex = new Map(); // token -> Set<compatibility_id>
        this.fitmentProductIndex = new Map(); // compatibility_id -> Set<url>

        this.handleInput = debounce(this.onInput.bind(this), 200);

        if (this.input) {
            this.input.addEventListener('input', this.handleInput);
        }
    }

    setData(data) {
        this.searchData = data;
        this.buildSearchIndex();
    }

    buildSearchIndex() {
        if (!this.searchData) return;

        const { products, vehicle_registry } = this.searchData;

        // 1. Index Vehicle Registry (Fitment)
        this.indexFitment(vehicle_registry);

        // 2. Index Products
        this.indexProducts(products);
    }

    indexFitment(registry) {
        if (!registry) return;

        const { brands, models } = registry;
        const modelGenerations = new Map(); // modelId -> Set<generation_id>

        // Index Models
        if (models) {
            Object.entries(models).forEach(([modelId, modelData]) => {
                const gens = modelData.generations || [];
                modelGenerations.set(modelId, new Set(gens));

                const tokens = this.tokenize(modelData.name);
                tokens.forEach(token => {
                    if (!this.fitmentIndex.has(token)) {
                        this.fitmentIndex.set(token, new Set());
                    }
                    gens.forEach(gen => this.fitmentIndex.get(token).add(gen));
                });
            });
        }

        // Index Brands
        if (brands) {
            Object.entries(brands).forEach(([, brandData]) => {
                const brandTokens = this.tokenize(brandData.name);
                const brandGens = new Set();

                if (brandData.models && Array.isArray(brandData.models)) {
                    brandData.models.forEach(modelId => {
                        if (modelGenerations.has(modelId)) {
                            modelGenerations.get(modelId).forEach(gen => brandGens.add(gen));
                        }
                    });
                }

                brandTokens.forEach(token => {
                    if (!this.fitmentIndex.has(token)) {
                        this.fitmentIndex.set(token, new Set());
                    }
                    brandGens.forEach(gen => this.fitmentIndex.get(token).add(gen));
                });
            });
        }
    }

    indexProducts(products) {
        if (!products) return;

        Object.entries(products).forEach(([url, product]) => {
            this.productsMap.set(url, product);

            // Index Fitment Reverse Lookup
            if (product.compatibility_ids) {
                product.compatibility_ids.forEach(id => {
                    if (!this.fitmentProductIndex.has(id)) {
                        this.fitmentProductIndex.set(id, new Set());
                    }
                    this.fitmentProductIndex.get(id).add(url);
                });

                // Also index compatibility IDs as text tokens for direct search
                product.compatibility_ids.forEach(id => {
                    const tokens = this.tokenize(id);
                    tokens.forEach(token => {
                        this.addToInvertedIndex(token, url);
                    });
                });
            }

            // Index Title, Keywords, and SKU (if available)
            const textFields = [
                product.title,
                product.general_keywords,
                product.sku,
            ];

            textFields.forEach(text => {
                if (!text) return;
                const tokens = this.tokenize(String(text));
                tokens.forEach(token => {
                    this.addToInvertedIndex(token, url);
                });
            });
        });
    }

    addToInvertedIndex(token, url) {
        if (!this.invertedIndex.has(token)) {
            this.invertedIndex.set(token, new Set());
        }
        this.invertedIndex.get(token).add(url);
    }

    tokenize(text) {
        return String(text)
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special chars, keep alphanumeric, spaces, hyphens
            .split(/\s+/)
            .filter(t => t.length > 0);
    }

    onInput(event) {
        const query = event.target.value;
        if (query.length > 2) {
            const results = this.performSearch(query);
            this.renderResults(results);
        } else {
            this.clearResults();
        }
    }

    performSearch(query) {
        const tokens = this.tokenize(query);
        if (tokens.length === 0) return [];

        const candidates = new Map(); // url -> score
        
        // Helper for prefix matching
        const getMatches = (index, token) => {
            const matches = new Set();
            // Exact match
            if (index.has(token)) {
                index.get(token).forEach(v => matches.add(v));
            }
            // Prefix match (only if token length > 1 to avoid massive results)
            if (token.length > 1) {
                for (const [key, val] of index) {
                    if (key.startsWith(token) && key !== token) {
                        val.forEach(v => matches.add(v));
                    }
                }
            }
            return matches;
        };

        // 1. Identify Fitment Context
        let fitmentIds = null;

        tokens.forEach(token => {
            const ids = getMatches(this.fitmentIndex, token);
            if (ids.size > 0) {
                if (fitmentIds === null) {
                    fitmentIds = new Set(ids);
                } else {
                    // Intersection: narrow down fitment (e.g. "Honda" AND "Civic")
                    fitmentIds = new Set([...fitmentIds].filter(x => ids.has(x)));
                }
            }
        });

        // 2. Gather Candidates & Score
        // A. From Fitment
        if (fitmentIds && fitmentIds.size > 0) {
            fitmentIds.forEach(fid => {
                if (this.fitmentProductIndex.has(fid)) {
                    this.fitmentProductIndex.get(fid).forEach(url => {
                        const currentScore = candidates.get(url) || 0;
                        // Base score for matching fitment
                        candidates.set(url, currentScore + 60);
                    });
                }
            });
        }

        // B. From Text (Title, SKU, Keywords)
        tokens.forEach(token => {
            const urls = getMatches(this.invertedIndex, token);
            if (urls.size > 0) {
                urls.forEach(url => {
                    let score = candidates.get(url) || 0;
                    const product = this.productsMap.get(url);

                    // Scoring Weights: Title > SKU > Fitment
                    // Title Match
                    if (this.tokenize(product.title).includes(token)) {
                        score += 100;
                    }

                    // SKU Match
                    if (product.sku && this.tokenize(product.sku).includes(token)) {
                        score += 80;
                    }

                    // Keyword Match (Lower priority)
                    if (product.general_keywords && this.tokenize(product.general_keywords).includes(token)) {
                        score += 40;
                    }

                    candidates.set(url, score);
                });
            }
        });

        // 3. Convert to Array and Sort
        return Array.from(candidates.entries())
            .map(([url, score]) => ({
                product: this.productsMap.get(url),
                url,
                score
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Limit results
    }

    renderResults(results) {
        if (!this.resultsContainer) {
            this.resultsContainer = document.querySelector('#cs-search-results');
            // Fallback: create container if it doesn't exist
            if (!this.resultsContainer && this.input) {
                const container = document.createElement('div');
                container.id = 'cs-search-results';
                this.input.parentNode.appendChild(container);
                this.resultsContainer = container;
            }
        }

        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = '';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'cs-search-no-results';
            noResults.textContent = 'No results found';
            this.resultsContainer.appendChild(noResults);
            this.resultsContainer.style.display = 'block';
            return;
        }

        const list = document.createElement('ul');
        list.className = 'cs-search-list';

        results.forEach(({ product, url }) => {
            const item = document.createElement('li');
            item.className = 'cs-search-item';

            const link = document.createElement('a');
            link.href = url;
            link.className = 'cs-search-link';

            if (product.image) {
                const img = document.createElement('img');
                img.src = product.image;
                img.alt = product.title;
                img.className = 'cs-search-thumb';
                link.appendChild(img);
            }

            const details = document.createElement('div');
            details.className = 'cs-search-details';

            const title = document.createElement('span');
            title.className = 'cs-search-title';
            title.textContent = product.title;
            details.appendChild(title);

            if (product.price) {
                const price = document.createElement('span');
                price.className = 'cs-search-price';
                price.textContent = product.price;
                details.appendChild(price);
            }

            link.appendChild(details);
            item.appendChild(link);
            list.appendChild(item);
        });

        this.resultsContainer.appendChild(list);
        this.resultsContainer.style.display = 'block';
    }

    clearResults() {
        if (this.resultsContainer) {
            this.resultsContainer.innerHTML = '';
            this.resultsContainer.style.display = 'none';
        }
    }
}