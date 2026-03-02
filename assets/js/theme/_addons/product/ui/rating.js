export default class RatingDisplay {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.starContainer = document.querySelector('#star-rating');
        this.ratingInfo = document.querySelector('#rating-info');
        this.ratingLink = document.querySelector('#product-rating');

        // If elements aren't present, do nothing
        if (!this.starContainer || !this.ratingInfo) return;

        this.stateManager.subscribe(this.update.bind(this));
        
        if (this.ratingLink) {
            this.ratingLink.addEventListener('click', this._handleRatingClick.bind(this));
        }

        // Initial render
        this.update(this.stateManager.getState());
    }

    _handleRatingClick(e) {
        e.preventDefault();
        // Tab switching logic to scroll to reviews
        const tabTitles = document.querySelectorAll('.tab');
        tabTitles.forEach(t => t.classList.remove('is-active'));

        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(t => t.classList.remove('is-active'));

        const reviewsLink = document.querySelector('.tab a[href="#tab-reviews"]');
        if (reviewsLink) {
            const reviewsTitle = reviewsLink.parentNode;
            reviewsTitle.classList.add('is-active');
            
            const reviewsTab = document.querySelector('#tab-reviews');
            if (reviewsTab) reviewsTab.classList.add('is-active');

            reviewsTitle.focus();
            reviewsTitle.scrollIntoView({ behavior: 'smooth' });
        }
    }

    update(state) {
        const { archetypeData } = state;
        if (!archetypeData) return;

        const { archetype_average_review, archetype_review_count } = archetypeData;
        
        // Reset stars to empty state
        const stars = Array.from(this.starContainer.children);
        stars.forEach(star => {
            star.classList.remove('icon--ratingFull');
            star.classList.add('icon--ratingEmpty');
        });

        const count = parseInt(archetype_review_count, 10) || 0;
        const average = parseFloat(archetype_average_review) || 0;

        if (count === 0) {
            this.ratingInfo.textContent = ' Leave A Review!';
        } else {
            // Fill stars based on average
            const starValue = Math.ceil(average);
            for (let i = 0; i < starValue && i < stars.length; i++) {
                stars[i].classList.remove('icon--ratingEmpty');
                stars[i].classList.add('icon--ratingFull');
            }
            this.ratingInfo.textContent = ` ${average}/5 with ${count} reviews`;
        }
    }
}
