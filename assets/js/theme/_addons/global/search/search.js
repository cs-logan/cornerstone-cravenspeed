import { debounce } from 'lodash';
import SearchDataManager from "./searchDataManager";
import SearchStateManager from "./stateManager";
import SearchEngine from "./searchEngine";
import QuickSearch from "./ui/quickSearch";
import ResultsPage from "./ui/resultsPage";

export default class SearchController {
    constructor(context) {
        this.context = context;
        this.stateManager = new SearchStateManager();
        this.dataManager = new SearchDataManager(this.stateManager);
        this.searchEngine = new SearchEngine();
        this.quickSearch = new QuickSearch();
        this.resultsPage = new ResultsPage();
        this.$searchInput = document.querySelector('[data-cs-search-input]');
        this.isEngineInitialized = false;

        // Routing State
        this.urlParams = new URLSearchParams(window.location.search);
        this.searchQuery = this.urlParams.get('search_query');
        this.isSearchPage = window.location.pathname === '/search.php';

        // DEBUG: Expose instance to window for testing
        // window.CS_Search = this;
    }

    onReady() {
        this.bindEvents();
        this.subscribeToState();

        // If we are on the search page, we need data immediately
        if (this.isSearchPage) {
            this.dataManager.loadData();
        }
    }

    subscribeToState() {
        this.stateManager.subscribe(this.handleStateChange.bind(this));
    }

    handleStateChange(state) {
        if (state.data && !this.isEngineInitialized) {
            this.searchEngine = new SearchEngine(state.data);
            this.isEngineInitialized = true;
        }

        // Phase 3: Render Full Results if on search page and data is ready
        if (state.data && this.isSearchPage && this.searchQuery) {
            const results = this.searchEngine.search(this.searchQuery, null); // null limit = all results
            this.resultsPage.render(results, this.searchQuery);
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

        // Phase 3: Handle Enter Key for Full Search Redirect
        this.$searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.$searchInput.value;
                if (query && query.length > 0) {
                    window.location.href = `/search.php?search_query=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}