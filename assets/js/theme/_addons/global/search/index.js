import PageManager from '../../../page-manager';
import SearchController from './search';

export default class Search extends PageManager {
    onReady() {
        this.searchController = new SearchController(this.context);
        this.searchController.onReady();
    }
}
