import PageManager from '../../page-manager';
import HomeController from './homeController';

export default class Home extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        console.log("HOME girl")
        const homeController = new HomeController(this.context);
        homeController.onReady();
    }
}