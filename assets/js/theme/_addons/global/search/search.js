import SearchDataManager from "./searchDataManager";
import QuickSearch from "./ui/quickSearch";

export default class SearchController {
    constructor(context) {
        this.context = context;
        this.dataManager = new SearchDataManager();
        this.quickSearch = new QuickSearch(context);
    }

    onReady() {
        this.dataManager.loadData().then(data => {
            this.quickSearch.setData(data);
        });
    }
}