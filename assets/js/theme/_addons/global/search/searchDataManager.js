export default class SearchDataManager {
    constructor() {
        this.dataUrl = 'https://craven-cdn-archetypes.sfo3.cdn.digitaloceanspaces.com/global/cravenspeed-global-search.json';
        this.data = null;
        this.loadingPromise = null;
    }

    async loadData() {
        if (this.data) {
            return this.data;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = fetch(this.dataUrl)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load search data: ${response.status}`);
                return response.json();
            })
            .then(data => {
                this.data = data;
                return data;
            });

        return this.loadingPromise;
    }
}