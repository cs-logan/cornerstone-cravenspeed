let isInitialized = false;

/**
 * Binds accessibility fixes for common UI libraries.
 */
function bindModalAccessibilityEvents() {
    // 1. MutationObserver for OPENING (Focus Management)
    const modals = document.querySelectorAll('[data-reveal]');

    if (modals.length === 0) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const modal = mutation.target;
                const isOpen = modal.classList.contains('open');
                const oldClass = mutation.oldValue || '';
                const wasOpen = /\bopen\b/.test(oldClass);

                // Only act on state changes
                if (isOpen && !wasOpen) {
                    modal.setAttribute('aria-hidden', 'false');

                    // Shift focus to the first heading to provide immediate context
                    const heading = modal.querySelector('h1, h2, h3, h4, h5, h6');
                    if (heading) {
                        if (!heading.hasAttribute('tabindex')) {
                            heading.setAttribute('tabindex', '-1');
                            heading.style.outline = 'none';
                        }
                        heading.focus();
                    }
                }
            }
        });
    });

    modals.forEach((modal) => {
        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['class'],
            attributeOldValue: true,
        });
    });

    // 2. Event Capturing for CLOSING (Prevent "aria-hidden" warning)
    // We must blur focus *before* Foundation sets aria-hidden="true".

    const blurIfInModal = () => {
        const active = document.activeElement;
        if (active && active.closest('[data-reveal]')) {
            active.blur();
        }
    };

    // Capture clicks on standard close elements
    document.addEventListener('click', (e) => {
        const target = e.target;
        // Ensure target is an element
        if (target.nodeType !== 1) return;

        // Check for standard Foundation close triggers or background overlay
        if (target.matches('.modal-close, .modal-close *, .modal-background, [data-reveal-close], [data-reveal-close] *')) {
            blurIfInModal();
        }
    }, true); // Capture phase

    // Capture Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            blurIfInModal();
        }
    }, true);
}

export default function initGlobalAccessibility() {
    if (isInitialized) return;
    isInitialized = true;
    bindModalAccessibilityEvents();
}
