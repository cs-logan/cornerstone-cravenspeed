import PageManager from './page-manager';
import HomeController from './_addons/home/homeController';
import VehiclePersistence from './_addons/global/vehiclePersistence';

export default class Home extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        VehiclePersistence.init();
        const home = new HomeController(this.context);
        home.onReady();
    }
}