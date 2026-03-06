import { debounce } from 'lodash';
import SearchDataManager from "./searchDataManager";
import SearchStateManager from "./stateManager";
import SearchEngine from "./searchEngine";
import QuickSearch from "./ui/quickSearch";

export default class SearchController {
    constructor(context) {
        this.context = context;
        this.stateManager = new SearchStateManager();
        this.dataManager = new SearchDataManager(this.stateManager);
        this.searchEngine = new SearchEngine();
        this.quickSearch = new QuickSearch();
        this.$searchInput = document.querySelector('[data-cs-search-input]');
        this.isEngineInitialized = false;

        // DEBUG: Expose instance to window for testing
        // window.CS_Search = this;
    }

    onReady() {
        this.bindEvents();
        this.subscribeToState();
    }

    subscribeToState() {
        this.stateManager.subscribe(this.handleStateChange.bind(this));
    }

    handleStateChange(state) {
        if (state.data && !this.isEngineInitialized) {
            this.searchEngine = new SearchEngine(state.data);
            this.isEngineInitialized = true;
        }
    }

    bindEvents() {
        if (!this.$searchInput) return;

        this.$searchInput.addEventListener('focus', () => {
            this.dataManager.loadData();
        }, { once: true });

        this.$searchInput.addEventListener('input', debounce((e) => {
            const query = e.target.value;
            const results = this.searchEngine.search(query, 8);
            this.quickSearch.update(results, query);
        }, 200));
    }
}