/**
 * Francisco Designs Portfolio - Main JavaScript
 * Subtle animations and interactions
 */

// ===================================
// SCROLL-TRIGGERED ANIMATIONS
// ===================================

class AnimateOnScroll {
    constructor() {
        this.elements = document.querySelectorAll('[data-aos]');
        this.options = {
            threshold: 0.15,
            rootMargin: '0px 0px -100px 0px'
        };
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                this.options
            );

            this.elements.forEach(element => {
                this.observer.observe(element);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            this.elements.forEach(element => {
                element.classList.add('aos-animate');
            });
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                // Optional: unobserve after animation for performance
                // this.observer.unobserve(entry.target);
            }
        });
    }
}

// ===================================
// SMOOTH HEADER SCROLL EFFECT
// ===================================

class HeaderScroll {
    constructor() {
        this.header = document.querySelector('.main-header');
        this.lastScroll = 0;
        this.init();
    }

    init() {
        if (!this.header) return;

        window.addEventListener('scroll', () => {
            this.handleScroll();
        }, { passive: true });
    }

    handleScroll() {
        const currentScroll = window.pageYOffset;

        // Add shadow on scroll
        if (currentScroll > 10) {
            this.header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        } else {
            this.header.style.boxShadow = 'none';
        }

        this.lastScroll = currentScroll;
    }
}

// ===================================
// PAGE TRANSITION EFFECT
// ===================================

class PageTransition {
    constructor() {
        this.init();
    }

    init() {
        // Fade in on page load
        document.body.style.opacity = '0';
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.style.transition = 'opacity 0.5s ease';
                document.body.style.opacity = '1';
            }, 100);
        });

        // Smooth transitions for internal links
        const links = document.querySelectorAll('a[href^="/"]:not([href*="."]), a[href^="."]:not([href="#"])');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // Skip if it's an anchor link
                if (href.startsWith('#')) return;

                e.preventDefault();
                document.body.style.transition = 'opacity 0.3s ease';
                document.body.style.opacity = '0';

                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        });
    }
}

// ===================================
// IMAGE LOADING OPTIMIZATION
// ===================================

class LazyImageLoad {
    constructor() {
        this.images = document.querySelectorAll('img');
        this.init();
    }

    init() {
        this.images.forEach(img => {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.4s ease';

            if (img.complete) {
                img.style.opacity = '1';
            } else {
                img.addEventListener('load', () => {
                    img.style.opacity = '1';
                });
            }
        });
    }
}

// ===================================
// DISCIPLINE CYCLING ANIMATION (ABOUT PAGE)
// ===================================

class DisciplineCycle {
    constructor() {
        this.elements = document.querySelectorAll('.discipline-cycle');
        if (this.elements.length > 0) {
            this.init();
        }
    }

    init() {
        this.elements.forEach(element => {
            const disciplinesAttr = element.getAttribute('data-disciplines');
            if (!disciplinesAttr) return;

            const disciplines = disciplinesAttr.split(',').map(d => d.trim());
            let currentIndex = 0;

            // Start cycling after 1 second
            setTimeout(() => {
                setInterval(() => {
                    currentIndex = (currentIndex + 1) % disciplines.length;

                    // Fade out
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(-10px)';

                    // Change text and fade in
                    setTimeout(() => {
                        element.textContent = disciplines[currentIndex];
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }, 250);

                }, 1500); // Change every 1.5 seconds (faster)
            }, 1000);
        });
    }
}

// ===================================
// INITIALIZE ALL MODULES
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    new AnimateOnScroll();
    new HeaderScroll();
    new PageTransition();
    new LazyImageLoad();
    new DisciplineCycle();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// ===================================
// CURSOR INTERACTION (OPTIONAL)
// ===================================

// Subtle cursor effect for project cards
const projectLinks = document.querySelectorAll('.project-link');
projectLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
        document.body.style.cursor = 'pointer';
    });

    link.addEventListener('mouseleave', () => {
        document.body.style.cursor = 'default';
    });
});
