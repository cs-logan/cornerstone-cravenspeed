import PageManager from './page-manager';
import HomeController from './_addons/home/homeController';

export default class Home extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        const home = new HomeController(this.context)
        home.onReady();
    }
}