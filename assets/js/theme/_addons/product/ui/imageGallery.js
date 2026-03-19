import CsGallery from '../utils/csGallery';

export default class ImageGallery {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.galleryElement = document.querySelector('.cs-gallery-wrapper');
        this.slidesContainer = this.galleryElement ? this.galleryElement.querySelector('.slides') : null;
        this.currentGallery = null;
        if (this.slidesContainer) {
            this.defaultSlidesHTML = this.slidesContainer.innerHTML;
        }
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

        // Construct image array (Secondary images + Main image at the end, per product-current.js logic)
        const imageArray = [];
        if (imageData.secondary_images_list) {
            imageArray.push(...imageData.secondary_images_list);
        }

        // Add main image
        imageArray.push({
            url: imageData.url,
            description: imageData.description,
            display_description: imageData.display_description,
        });

        // Helper to extract BigCommerce image ID from URL for accurate diffing
        // Matches the directory ID immediately preceding the filename
        // Native: /products/123/456/file.jpg | QTY JSON: /products/123/images/456/file.jpg
        const getImgId = (url) => {
            const match = url ? url.match(/\/(\d+)\/[^\/]+\.(?:jpg|jpeg|png|webp|gif)/i) : null;
            return match ? match[1] : (url || '').split('?')[0];
        };

        const currentSlides = Array.from(this.slidesContainer.querySelectorAll('.slide'));
        let needsReinit = false;
        let isDifferent = false;

        if (currentSlides.length !== imageArray.length) {
            needsReinit = true;
        }

        imageArray.forEach((imageObj, index) => {
            let slide = currentSlides[index];

            if (!slide) {
                slide = document.createElement('div');
                slide.classList.add('slide');
                const img = document.createElement('img');
                slide.appendChild(img);
                this.slidesContainer.appendChild(slide);
                currentSlides.push(slide); // Track new slide for cleanup logic
                needsReinit = true;
            }

            const img = slide.querySelector('img');
            if (!img) return;

            const newUrl = imageObj.url || '';
            const currentId = getImgId(img.src);
            const newId = getImgId(newUrl);

            if (currentId !== newId || !img.src) {
                isDifferent = true;
                img.removeAttribute('srcset'); // Strip native srcset so browser respects the new src
                img.src = newUrl;
                img.alt = imageObj.description || '';

                if (imageObj.display_description) {
                    img.setAttribute('data-caption', '');
                } else {
                    img.removeAttribute('data-caption');
                }
            }
        });

        // Remove extra slides
        while (currentSlides.length > imageArray.length) {
            const extraSlide = currentSlides.pop();
            extraSlide.remove();
            needsReinit = true;
            isDifferent = true;
        }

        if (needsReinit || isDifferent) {
            if (this.currentGallery) {
                this.currentGallery.destroy();
            }

            this.slidesContainer.classList.remove('fade-in');
            void this.slidesContainer.offsetWidth; // Force reflow
            this.slidesContainer.classList.add('fade-in');

            this.initCsGallery();
        }
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
            altCaption: true,
        });
    }

    destroy() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.currentGallery && typeof this.currentGallery.destroy === 'function') this.currentGallery.destroy();
    }
}
