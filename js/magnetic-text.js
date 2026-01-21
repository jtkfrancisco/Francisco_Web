/**
 * MagneticHeroText
 * Creates a magnetic pull effect on hero text where words attract toward the cursor
 * with smooth spring physics and GPU-accelerated animations.
 */
class MagneticHeroText {
    constructor(selector, options = {}) {
        // Configuration
        this.selector = selector;
        this.options = {
            maxDistance: options.maxDistance || 200,
            maxDisplacement: options.maxDisplacement || 25,
            springEasing: options.springEasing || 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            activeDuration: options.activeDuration || 150,
            resetDuration: options.resetDuration || 300,
            ...options
        };

        // State
        this.element = null;
        this.words = [];
        this.wordRects = [];
        this.rafId = null;
        this.isActive = false;
        this.resizeTimeout = null;

        // Bind methods
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Initialize
        this.init();
    }

    /**
     * Check if device/environment is suitable for magnetic effect
     */
    shouldInitialize() {
        // Check for touch devices
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            return false;
        }

        // Check screen size (desktop only)
        if (window.innerWidth <= 1024) {
            return false;
        }

        // Check reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return false;
        }

        return true;
    }

    /**
     * Initialize the magnetic text effect
     */
    init() {
        if (!this.shouldInitialize()) {
            return;
        }

        this.element = document.querySelector(this.selector);
        if (!this.element) {
            console.warn(`MagneticHeroText: Element not found for selector "${this.selector}"`);
            return;
        }

        // Split text into words
        this.splitTextIntoWords();

        // Cache word positions
        this.cacheBoundingRects();

        // Setup event listeners
        this.setupEventListeners();

        // Listen for reduced motion changes
        this.setupReducedMotionListener();
    }

    /**
     * Split text content into individual word spans
     */
    splitTextIntoWords() {
        const originalText = this.element.textContent;
        const words = originalText.split(' ');

        // Clear element
        this.element.textContent = '';
        this.element.classList.add('magnetic-enabled');

        // Create spans for each word
        words.forEach((word, index) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word-magnetic';
            wordSpan.textContent = word;
            this.element.appendChild(wordSpan);
            this.words.push(wordSpan);

            // Add space after each word (except last)
            if (index < words.length - 1) {
                const spaceSpan = document.createElement('span');
                spaceSpan.className = 'word-space';
                spaceSpan.textContent = ' ';
                this.element.appendChild(spaceSpan);
            }
        });
    }

    /**
     * Cache bounding rectangles for performance
     */
    cacheBoundingRects() {
        this.wordRects = this.words.map(word => {
            const rect = word.getBoundingClientRect();
            return {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + window.scrollX + rect.width / 2,
                centerY: rect.top + window.scrollY + rect.height / 2
            };
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mouse events on hero section container
        const heroSection = this.element.closest('.hero-section');
        if (heroSection) {
            heroSection.addEventListener('mousemove', this.handleMouseMove, { passive: true });
            heroSection.addEventListener('mouseleave', this.handleMouseLeave);
        }

        // Resize handler (debounced)
        window.addEventListener('resize', this.handleResize, { passive: true });
    }

    /**
     * Setup reduced motion preference listener
     */
    setupReducedMotionListener() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                this.destroy();
            }
        });
    }

    /**
     * Handle mouse move with RAF throttling
     */
    handleMouseMove(e) {
        if (this.rafId) return;

        this.rafId = requestAnimationFrame(() => {
            this.updateWordPositions(e.clientX + window.scrollX, e.clientY + window.scrollY);
            this.rafId = null;
        });

        // Activate will-change on first interaction
        if (!this.isActive) {
            this.isActive = true;
            this.words.forEach(word => word.classList.add('active'));
        }
    }

    /**
     * Update word positions based on mouse position
     */
    updateWordPositions(mouseX, mouseY) {
        this.words.forEach((word, index) => {
            const rect = this.wordRects[index];
            const { translateX, translateY } = this.calculateMagneticForce(rect, mouseX, mouseY);
            this.animateWord(word, translateX, translateY);
        });
    }

    /**
     * Calculate magnetic force based on distance from cursor
     */
    calculateMagneticForce(wordRect, mouseX, mouseY) {
        const { centerX, centerY } = wordRect;
        const { maxDistance, maxDisplacement } = this.options;

        // Calculate distance from cursor to word center
        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // If outside magnetic field, no movement
        if (distance >= maxDistance) {
            return { translateX: 0, translateY: 0 };
        }

        // Calculate force (inverse of distance, normalized 0-1)
        const force = 1 - (distance / maxDistance);
        const displacement = force * maxDisplacement;

        // Calculate direction angle
        const angle = Math.atan2(deltaY, deltaX);

        // Calculate translation values
        const translateX = Math.cos(angle) * displacement;
        const translateY = Math.sin(angle) * displacement;

        return { translateX, translateY };
    }

    /**
     * Apply transform to word element
     */
    animateWord(word, x, y) {
        word.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    /**
     * Handle mouse leave - reset all words
     */
    handleMouseLeave() {
        // Cancel any pending RAF
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Reset all words to origin
        this.reset();
    }

    /**
     * Reset all words to their original positions
     */
    reset() {
        this.words.forEach(word => {
            word.style.transform = 'translate3d(0, 0, 0)';
        });

        // Remove will-change after animation completes
        if (this.isActive) {
            setTimeout(() => {
                this.words.forEach(word => word.classList.remove('active'));
                this.isActive = false;
            }, this.options.resetDuration);
        }
    }

    /**
     * Handle window resize (debounced)
     */
    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            // Check if should still be active
            if (!this.shouldInitialize()) {
                this.destroy();
                return;
            }

            // Recalculate word positions
            this.cacheBoundingRects();
        }, 150);
    }

    /**
     * Cleanup and destroy the magnetic effect
     */
    destroy() {
        // Cancel RAF
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Remove event listeners
        const heroSection = this.element?.closest('.hero-section');
        if (heroSection) {
            heroSection.removeEventListener('mousemove', this.handleMouseMove);
            heroSection.removeEventListener('mouseleave', this.handleMouseLeave);
        }
        window.removeEventListener('resize', this.handleResize);

        // Reset and restore original text
        if (this.element) {
            const originalText = this.words.map(word => word.textContent).join(' ');
            this.element.textContent = originalText;
            this.element.classList.remove('magnetic-enabled');
        }

        // Clear state
        this.words = [];
        this.wordRects = [];
        this.isActive = false;
    }
}
