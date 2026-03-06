export default class SearchDataManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.dataUrl = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/cravenspeed-global-search.json';
        this.storageKey = 'cs_global_search_index';
        this.ttl = 1000 * 60 * 60 * 24; // 24 hours
    }

    loadData() {
        const state = this.stateManager.getState();
        // If we already have data or are loading, do nothing
        if (state.data || state.isLoading) return;

        this.stateManager.setState({ isLoading: true });

        // 1. Try to load from LocalStorage
        const cachedData = this._loadFromCache();
        if (cachedData) {
            console.log('SearchDataManager: Loaded from cache');
            this.stateManager.setState({ data: cachedData, isLoading: false });
            return;
        }

        // 2. Fetch from CDN
        console.log('SearchDataManager: Fetching from CDN');
        fetch(this.dataUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                this._saveToCache(data);
                this.stateManager.setState({ data, isLoading: false });
            })
            .catch(error => {
                console.error('SearchDataManager: Fetch error', error);
                this.stateManager.setState({ error, isLoading: false });
            });
    }

    _loadFromCache() {
        try {
            const recordStr = localStorage.getItem(this.storageKey);
            if (!recordStr) return null;

            const record = JSON.parse(recordStr);
            if (!record || !record.timestamp || !record.data) return null;

            // Check expiration
            const now = Date.now();
            if (now - record.timestamp > this.ttl) {
                console.log('SearchDataManager: Cache expired');
                localStorage.removeItem(this.storageKey);
                return null;
            }

            return record.data;
        } catch (e) {
            console.warn('SearchDataManager: Failed to load cache', e);
            return null;
        }
    }

    _saveToCache(data) {
        try {
            const record = {
                timestamp: Date.now(),
                data
            };
            localStorage.setItem(this.storageKey, JSON.stringify(record));
        } catch (e) {
            console.warn('SearchDataManager: Failed to save cache (likely quota exceeded)', e);
        }
    }
}