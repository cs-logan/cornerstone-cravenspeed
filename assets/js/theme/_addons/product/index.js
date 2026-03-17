/*
 Import all product specific js
 */
import PageManager from '../../page-manager';
import ProductController from './productController';

export default class Product extends PageManager {
    constructor(context) {
        super(context);
    }

    onReady() {
        const product = new ProductController(this.context);
        product.onReady();
    }
}