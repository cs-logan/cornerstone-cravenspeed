import CsGallery from '../utils/csGallery';

export default class ImageGallery {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.galleryElement = document.querySelector('.cs-gallery-wrapper');
        this.slidesContainer = this.galleryElement ? this.galleryElement.querySelector('.slides') : null;
        this.currentGallery = null;
        this.lastAliasData = undefined;
        this.unsubscribe = null;

        // Initialize gallery on default content
        this.initCsGallery();

        this.unsubscribe = this.stateManager.subscribe(this.update.bind(this));
    }

    update(state) {
        const { aliasData } = state;
        
        if (aliasData === this.lastAliasData) return;

        if (aliasData && aliasData.image_array) {
            this.lastAliasData = aliasData;
            this.renderAliasImages(aliasData.image_array);
        }
    }

    renderAliasImages(imageData) {
        if (!this.slidesContainer) return;

        // Destroy existing gallery instance
        if (this.currentGallery) {
            this.currentGallery.destroy();
        }

        // Construct image array (Secondary images + Main image at the end, per product-current.js logic)
        const imageArray = [];
        if (imageData.secondary_images_list) {
            imageArray.push(...imageData.secondary_images_list);
        }
        
        // Add main image
        imageArray.push({
            url: imageData.url,
            description: imageData.description,
            display_description: imageData.display_description
        });

        // Build HTML
        this.slidesContainer.innerHTML = '';

        // Trigger fade-in animation
        this.slidesContainer.classList.remove('fade-in');
        void this.slidesContainer.offsetWidth; // Force reflow
        this.slidesContainer.classList.add('fade-in');

        imageArray.forEach(image => {
            const slide = document.createElement('div');
            slide.classList.add('slide');
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.description || '';
            if (image.display_description) {
                img.setAttribute('data-caption', '');
            }
            
            slide.appendChild(img);
            this.slidesContainer.appendChild(slide);
        });

        this.initCsGallery();
    }

    revertToDefault() {
        if (!this.slidesContainer) return;
        if (this.currentGallery) this.currentGallery.destroy();
        this.slidesContainer.innerHTML = this.defaultSlidesHTML;

        // Trigger fade-in animation
        this.slidesContainer.classList.remove('fade-in');
        void this.slidesContainer.offsetWidth; // Force reflow
        this.slidesContainer.classList.add('fade-in');

        this.initCsGallery();
    }

    initCsGallery() {
        this.currentGallery = new CsGallery({
            containerClass: 'cs-gallery-wrapper',
            altCaption: true
        });
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.currentGallery && typeof this.currentGallery.destroy === 'function') this.currentGallery.destroy();
    }
}