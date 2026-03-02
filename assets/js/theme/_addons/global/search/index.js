/*
 Import all search specific js
 */
import PageManager from '../../../page-manager';
import SearchController from './search';

export default class Search extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        const search = new SearchController(this.context);
        search.onReady();
    }
}