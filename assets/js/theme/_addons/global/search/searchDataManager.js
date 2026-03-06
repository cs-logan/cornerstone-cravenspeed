export default class SearchDataManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.sourceUrl = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/cravenspeed-global-search.json';
        this.storageKey = 'cs_search_index';
        this.cacheDuration = 1000 * 60 * 60 * 24; // 24 Hours
    }

    async loadData() {
        // Prevent multiple fetches if already loaded or loading
        const currentState = this.stateManager.getState();
        if (currentState.data || currentState.isLoading) {
            return;
        }

        // 1. Try Local Storage
        const cachedData = this._loadFromStorage();
        if (cachedData) {
            this.stateManager.setState({ 
                isLoading: false, 
                data: cachedData 
            });
            return;
        }

        // 2. Fetch from Network
        this.stateManager.setState({ isLoading: true });

        try {
            const response = await fetch(this.sourceUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            let data = await response.json();
            
            // 3. Preprocess (Hook for data transformation/minification)
            data = this._preprocessData(data);

            // 4. Save to Storage
            this._saveToStorage(data);

            this.stateManager.setState({ 
                isLoading: false, 
                data: data 
            });
        } catch (error) {
            console.error('Search Data Fetch Error:', error);
            this.stateManager.setState({ 
                isLoading: false, 
                error: error 
            });
        }
    }

    _preprocessData(data) {
        // Example: Strip descriptions or unused fields here to save localStorage space
        return data;
    }

    _saveToStorage(data) {
        try {
            const payload = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch (e) {
            console.warn('Search: Failed to save to LocalStorage (likely quota exceeded).', e);
        }
    }

    _loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return null;

            const payload = JSON.parse(raw);
            
            // Check Expiration
            if (Date.now() - payload.timestamp > this.cacheDuration) {
                localStorage.removeItem(this.storageKey);
                return null;
            }

            // Validate Data Structure
            if (!payload.data || !payload.data.products) {
                localStorage.removeItem(this.storageKey);
                return null;
            }

            return payload.data;
        } catch (e) {
            return null;
        }
    }
}