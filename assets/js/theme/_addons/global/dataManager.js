/**
 * @file DataManager
 * @description A singleton module to handle all API/data fetching logic.
 * It interacts with the StateManager to update the global state.
 */
import StateManager from './stateManager';

class DataManager {
    constructor() {
        if (DataManager.instance) {
            return DataManager.instance;
        }

        // Search-specific properties
        this.searchDataUrl = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/cravenspeed-global-search.json';
        this.searchStorageKey = 'cs_global_search_index';
        this.searchTtl = 1000 * 60 * 60 * 24; // 24 hours

        // Product-specific properties
        this.productBasePath = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com';
        this.jsonCache = new Map(); // For caching product JSONs
        this.pendingRequests = new Map(); // Track in-flight requests

        DataManager.instance = this;
    }

    /**
     * Generic private method to fetch and cache JSON.
     */
    async _fetchJSON(url) {
        if (this.jsonCache.has(url)) {
            return this.jsonCache.get(url);
        }

        if (this.pendingRequests.has(url)) {
            return this.pendingRequests.get(url);
        }

        const requestPromise = (async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                this.jsonCache.set(url, data);
                return data;
            } catch (error) {
                console.error(`[DataManager] Failed to fetch and parse JSON from ${url}`, error);
                throw error;
            } finally {
                this.pendingRequests.delete(url);
            }
        })();

        this.pendingRequests.set(url, requestPromise);
        return requestPromise;
    }

    /**
     * Loads the global search data, utilizing cache first.
     */
    loadSearchData() {
        const state = StateManager.getState();
        if (state.search.data || state.search.isLoading) return;

        StateManager.setState({ search: { ...state.search, isLoading: true } });

        const cachedData = this._loadFromCache();
        if (cachedData) {
            console.log('[DataManager] Search Data Loaded from cache. Last full update:', cachedData.last_json_full_update);
            StateManager.setState({ search: { ...StateManager.getState().search, data: cachedData, isLoading: false } });
            return;
        }

        fetch(this.searchDataUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('[DataManager] Search Data Loaded from network. Last full update:', data.last_json_full_update);
                this._saveToCache(data);
                StateManager.setState({ search: { ...StateManager.getState().search, data, isLoading: false } });
            })
            .catch(error => {
                console.error('[DataManager] Fetch error for search data', error);
                StateManager.setState({ search: { ...StateManager.getState().search, error, isLoading: false } });
            });
    }

    _loadFromCache() {
        try {
            const recordStr = localStorage.getItem(this.searchStorageKey);
            if (!recordStr) return null;
            const record = JSON.parse(recordStr);
            if (!record || !record.timestamp || !record.data) return null;
            const now = Date.now();
            if (now - record.timestamp > this.searchTtl) {
                localStorage.removeItem(this.searchStorageKey);
                return null;
            }
            return record.data;
        } catch (e) {
            console.warn('[DataManager] Failed to load search data from cache', e);
            return null;
        }
    }

    _saveToCache(data) {
        try {
            const record = { timestamp: Date.now(), data };
            localStorage.setItem(this.searchStorageKey, JSON.stringify(record));
        } catch (e) {
            console.warn('[DataManager] Failed to save search data to cache', e);
        }
    }

    /**
     * Fetches the data for a specific product alias. Does not update state directly.
     * @param {string} archetypeName - The product's archetype name (e.g., 'gemini-intake-f56').
     * @param {string} aliasFilename - The filename of the alias JSON (e.g., 'gemini-intake-f56-red.json').
     * @returns {Promise<any>}
     */
    async getAliasData(archetypeName, aliasFilename) {
        const url = `${this.productBasePath}/${archetypeName}/${aliasFilename}`;
        return this._fetchJSON(url);
    }
    
    /**
     * Fetches the main archetype data file. Does not update state directly.
     * @param {string} archetypeName - The archetype name to fetch.
     * @returns {Promise<any>}
     */
    async getArchetypeData(archetypeName) {
        const url = `${this.productBasePath}/${archetypeName}/${archetypeName}.json`;
        return this._fetchJSON(url);
    }

    /**
     * Fetches the global inventory data. Does not update state directly.
     * @returns {Promise<any>}
     */
    async getInventoryData() {
        const url = `${this.productBasePath}/global/global-inventory.json`;
        try {
            return await this._fetchJSON(url);
        } catch (error) {
            console.warn('[DataManager] Global inventory unreachable. Defaulting to in-stock behavior.', error);
            return null; // Return null instead of throwing, as it's non-critical
        }
    }
}

const instance = new DataManager();
Object.freeze(instance);

export default instance;
