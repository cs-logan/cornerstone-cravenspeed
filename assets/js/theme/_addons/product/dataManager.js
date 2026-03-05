export default class DataManager {
    constructor(archetypeName) {
        if (!archetypeName) {
            throw new Error('DataManager requires an archetypeName during instantiation.');
        }
        this.archetypeName = archetypeName;
        this.cache = new Map();
        this.basePath = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com';
    }

    /**
     * Fetches JSON from a URL and caches the result.
     * @param {string} url - The URL to fetch.
     * @returns {Promise<any>}
     * @private
     */
    async _fetchJSON(url) {
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(url, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch and parse JSON from ${url}`, error);
            throw error;
        }
    }

    /**
     * Fetches the main archetype data file for the instance's archetype.
     * @returns {Promise<any>}
     */
    async getArchetypeData() {
        const url = `${this.basePath}/${this.archetypeName}/${this.archetypeName}.json`;
        return this._fetchJSON(url);
    }

    /**
     * Fetches the data for a specific alias within the instance's archetype.
     * @param {string} aliasFilename - The filename of the alias JSON (e.g., 'shift-knob-for-mini-f56-red.json').
     * @returns {Promise<any>}
     */
    async getAliasData(aliasFilename) {
        const url = `${this.basePath}/${this.archetypeName}/${aliasFilename}`;
        return this._fetchJSON(url);
    }

    /**
     * Fetches the global inventory data.
     */
    async getInventoryData() {
        const url = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/global-inventory.json';
        try {
            return await this._fetchJSON(url);
        } catch (error) {
            console.warn('Global inventory unreachable. Defaulting to in-stock behavior.', error);
            return null;
        }
    }
}