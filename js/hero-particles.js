/**
 * HeroParticles
 * Canvas-based particle system for the hero section.
 * Particles drift lazily, then respond to cursor proximity
 * with smooth repulsion physics. Respects reduced motion.
 */
class HeroParticles {
    constructor(containerSelector, options = {}) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) return;

        // Skip on touch devices or reduced motion
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (window.innerWidth <= 768) return;

        this.options = {
            particleCount: options.particleCount || 160,
            particleColor: options.particleColor || 'rgba(26, 26, 26, 0.4)',
            lineColor: options.lineColor || 'rgba(26, 26, 26, 0.12)',
            particleSize: options.particleSize || 3,
            linkDistance: options.linkDistance || 180,
            mouseRadius: options.mouseRadius || 220,
            mouseForce: options.mouseForce || 0.15,
            driftSpeed: options.driftSpeed || 0.5,
            ...options
        };

        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: -1000, y: -1000 };
        this.rafId = null;
        this.resizeTimeout = null;

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'hero-particles-canvas';
        this.container.style.position = 'relative';
        this.container.insertBefore(this.canvas, this.container.firstChild);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        // Full viewport width, container height
        this.width = window.innerWidth;
        this.height = rect.height;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(dpr, dpr);
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.options.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * this.options.driftSpeed,
                vy: (Math.random() - 0.5) * this.options.driftSpeed,
                size: Math.random() * this.options.particleSize + 0.5,
                baseVx: (Math.random() - 0.5) * this.options.driftSpeed,
                baseVy: (Math.random() - 0.5) * this.options.driftSpeed
            });
        }
    }

    bindEvents() {
        const heroSection = this.container;

        // Listen on document so mouse works across full bleed canvas
        document.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            // Only track when vertically within the hero
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY - rect.top;
            } else {
                this.mouse.x = -1000;
                this.mouse.y = -1000;
            }
        }, { passive: true });

        heroSection.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                if (window.innerWidth <= 768) {
                    this.destroy();
                    return;
                }
                this.resize();
                this.createParticles();
            }, 200);
        }, { passive: true });
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Update and draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Mouse repulsion
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.options.mouseRadius && dist > 0) {
                const force = (this.options.mouseRadius - dist) / this.options.mouseRadius;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * this.options.mouseForce;
                p.vy += Math.sin(angle) * force * this.options.mouseForce;
            }

            // Drift back to base velocity
            p.vx += (p.baseVx - p.vx) * 0.02;
            p.vy += (p.baseVy - p.vy) * 0.02;

            // Damping
            p.vx *= 0.98;
            p.vy *= 0.98;

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Wrap edges
            if (p.x < -10) p.x = this.width + 10;
            if (p.x > this.width + 10) p.x = -10;
            if (p.y < -10) p.y = this.height + 10;
            if (p.y > this.height + 10) p.y = -10;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.options.particleColor;
            this.ctx.fill();

            // Draw connections to nearby particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx2 = p.x - p2.x;
                const dy2 = p.y - p2.y;
                const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                if (dist2 < this.options.linkDistance) {
                    const opacity = 1 - (dist2 / this.options.linkDistance);
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(26, 26, 26, ${opacity * 0.2})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }

        this.rafId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}
