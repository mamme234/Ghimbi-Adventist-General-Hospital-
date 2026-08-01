// ========== ANIMATION LIBRARY ==========
class AnimationController {
    constructor() {
        this.animations = new Map();
        this.observers = [];
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        this.init();
    }
    
    init() {
        // Setup intersection observer for scroll animations
        this.setupScrollObserver();
        
        // Setup animation frame handling
        this.setupAnimationFrame();
        
        // Setup resize handling
        this.setupResizeHandler();
        
        // Check for reduced motion
        this.checkReducedMotion();
        
        console.log('🎬 Animation controller initialized');
    }
    
    // ========== SCROLL ANIMATIONS ==========
    setupScrollObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.dataset.animation || 'fadeUp';
                    
                    this.playAnimation(element, animation);
                    
                    // Unobserve after animation
                    if (element.dataset.once !== 'false') {
                        observer.unobserve(element);
                    }
                }
            });
        }, options);
        
        // Observe elements with data-animation attribute
        document.querySelectorAll('[data-animation]').forEach(el => {
            observer.observe(el);
        });
        
        this.observers.push(observer);
    }
    
    // ========== PLAY ANIMATION ==========
    playAnimation(element, animation) {
        const duration = parseFloat(element.dataset.duration) || 600;
        const delay = parseFloat(element.dataset.delay) || 0;
        const ease = element.dataset.ease || 'ease-out';
        
        // Get animation styles
        const styles = this.getAnimationStyles(animation);
        
        // Apply animation
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        
        element.style.animation = `${this.getKeyframeName(animation)} ${duration}ms ${ease} ${delay}ms forwards`;
        
        // Dispatch event
        element.dispatchEvent(new CustomEvent('animationPlayed', {
            detail: { animation, duration, delay }
        }));
    }
    
    // ========== GET ANIMATION STYLES ==========
    getAnimationStyles(animation) {
        const styles = {
            fadeUp: {
                opacity: 0,
                transform: 'translateY(30px)'
            },
            fadeDown: {
                opacity: 0,
                transform: 'translateY(-30px)'
            },
            fadeLeft: {
                opacity: 0,
                transform: 'translateX(30px)'
            },
            fadeRight: {
                opacity: 0,
                transform: 'translateX(-30px)'
            },
            scale: {
                opacity: 0,
                transform: 'scale(0.8)'
            },
            rotate: {
                opacity: 0,
                transform: 'rotate(-10deg) scale(0.9)'
            },
            blur: {
                opacity: 0,
                filter: 'blur(10px)'
            },
            slideUp: {
                opacity: 0,
                transform: 'translateY(50px)',
                clipPath: 'inset(0 0 100% 0)'
            },
            bounce: {
                animation: 'bounce 1s ease'
            },
            pulse: {
                animation: 'pulse 2s ease-in-out infinite'
            },
            shimmer: {
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
            }
        };
        
        return styles[animation] || styles.fadeUp;
    }
    
    // ========== GET KEYFRAME NAME ==========
    getKeyframeName(animation) {
        const keyframes = {
            fadeUp: 'fadeUp',
            fadeDown: 'fadeDown',
            fadeLeft: 'fadeLeft',
            fadeRight: 'fadeRight',
            scale: 'scale',
            rotate: 'rotate',
            blur: 'blur',
            slideUp: 'slideUp'
        };
        
        return keyframes[animation] || 'fadeUp';
    }
    
    // ========== GENERATE KEYFRAMES ==========
    generateKeyframes() {
        const keyframes = {
            fadeUp: `
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `,
            fadeDown: `
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `,
            fadeLeft: `
                @keyframes fadeLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `,
            fadeRight: `
                @keyframes fadeRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `,
            scale: `
                @keyframes scale {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
            `,
            rotate: `
                @keyframes rotate {
                    from { opacity: 0; transform: rotate(-10deg) scale(0.9); }
                    to { opacity: 1; transform: rotate(0) scale(1); }
                }
            `,
            blur: `
                @keyframes blur {
                    from { opacity: 0; filter: blur(10px); }
                    to { opacity: 1; filter: blur(0); }
                }
            `,
            slideUp: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); clip-path: inset(0 0 100% 0); }
                    to { opacity: 1; transform: translateY(0); clip-path: inset(0 0 0 0); }
                }
            `,
            bounce: `
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-20px); }
                    60% { transform: translateY(-10px); }
                    80% { transform: translateY(-5px); }
                }
            `,
            pulse: `
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `,
            shimmer: `
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `
        };
        
        // Inject keyframes
        const style = document.createElement('style');
        style.id = 'animation-keyframes';
        style.textContent = Object.values(keyframes).join('\n');
        document.head.appendChild(style);
    }
    
    // ========== SETUP ANIMATION FRAME ==========
    setupAnimationFrame() {
        let frameId = null;
        let lastTime = 0;
        const fps = 60;
        const interval = 1000 / fps;
        
        const animate = (timestamp) => {
            const delta = timestamp - lastTime;
            
            if (delta >= interval) {
                lastTime = timestamp - (delta % interval);
                
                // Update active animations
                this.updateAnimations(timestamp);
            }
            
            frameId = requestAnimationFrame(animate);
        };
        
        // Start animation loop
        frameId = requestAnimationFrame(animate);
        
        // Store for cleanup
        this.animationFrameId = frameId;
    }
    
    // ========== UPDATE ANIMATIONS ==========
    updateAnimations(timestamp) {
        // Update progress for running animations
        this.animations.forEach((animation, id) => {
            if (!animation.isRunning) return;
            
            const progress = (timestamp - animation.startTime) / animation.duration;
            
            if (progress >= 1) {
                animation.isRunning = false;
                animation.element.style.animation = '';
                animation.element.style.opacity = '1';
                animation.element.style.transform = '';
                animation.element.style.filter = '';
                animation.element.style.clipPath = '';
                
                animation.element.dispatchEvent(new CustomEvent('animationComplete', {
                    detail: { animation: animation.type }
                }));
                
                this.animations.delete(id);
            }
        });
    }
    
    // ========== ANIMATE ELEMENT ==========
    animateElement(element, animation, options = {}) {
        if (this.prefersReducedMotion.matches) {
            return;
        }
        
        const duration = options.duration || 600;
        const delay = options.delay || 0;
        const ease = options.ease || 'ease-out';
        const id = Math.random().toString(36).substr(2, 9);
        
        // Get styles
        const styles = this.getAnimationStyles(animation);
        
        // Apply initial styles
        Object.assign(element.style, {
            opacity: styles.opacity || '0',
            transform: styles.transform || '',
            filter: styles.filter || '',
            clipPath: styles.clipPath || '',
            transition: `all ${duration}ms ${ease} ${delay}ms`
        });
        
        // Trigger reflow
        element.offsetHeight;
        
        // Store animation
        this.animations.set(id, {
            element,
            type: animation,
            duration,
            startTime: performance.now() + delay,
            isRunning: true
        });
        
        // Apply final styles after delay
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = '';
            element.style.filter = '';
            element.style.clipPath = '';
            element.style.transition = '';
        }, delay);
        
        return id;
    }
    
    // ========== STAGGER ANIMATION ==========
    staggerAnimate(elements, animation, options = {}) {
        if (this.prefersReducedMotion.matches) {
            elements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = '';
            });
            return;
        }
        
        const staggerDelay = options.staggerDelay || 100;
        const duration = options.duration || 600;
        const ease = options.ease || 'ease-out';
        const startDelay = options.startDelay || 0;
        
        elements.forEach((element, index) => {
            const delay = startDelay + (index * staggerDelay);
            this.animateElement(element, animation, {
                duration,
                delay,
                ease
            });
        });
    }
    
    // ========== PARALLAX EFFECT ==========
    setupParallax() {
        const elements = document.querySelectorAll('[data-parallax]');
        
        elements.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            
            window.addEventListener('scroll', () => {
                const rect = el.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                
                if (rect.top < windowHeight && rect.bottom > 0) {
                    const scrolled = window.pageYOffset;
                    const offset = rect.top + scrolled;
                    const distance = scrolled - offset;
                    const translate = distance * speed;
                    
                    el.style.transform = `translateY(${translate}px)`;
                }
            });
        });
    }
    
    // ========== NUMBER COUNTER ==========
    animateCounter(element, target, options = {}) {
        const duration = options.duration || 2000;
        const start = parseInt(element.textContent) || 0;
        const startTime = performance.now();
        
        const update = (timestamp) => {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * eased);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString();
                element.dispatchEvent(new CustomEvent('counterComplete', {
                    detail: { value: target }
                }));
            }
        };
        
        requestAnimationFrame(update);
    }
    
    // ========== PARTICLES EFFECT ==========
    createParticles(element, options = {}) {
        const count = options.count || 20;
        const color = options.color || '#0a6e4a';
        const size = options.size || 6;
        const duration = options.duration || 1000;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: 0;
                animation: particle ${duration}ms ease-out forwards;
                animation-delay: ${Math.random() * 200}ms;
            `;
            
            const angle = Math.random() * 2 * Math.PI;
            const distance = 50 + Math.random() * 100;
            
            const style = document.createElement('style');
            const keyframe = `
                @keyframes particle${i} {
                    0% {
                        opacity: 1;
                        transform: translate(0, 0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0);
                    }
                }
            `;
            style.textContent = keyframe;
            document.head.appendChild(style);
            
            particle.style.animation = `particle${i} ${duration}ms ease-out forwards`;
            
            element.style.position = 'relative';
            element.style.overflow = 'hidden';
            element.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
                style.remove();
            }, duration + 200);
        }
    }
    
    // ========== SETUP RESIZE ==========
    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }
    
    handleResize() {
        // Recalculate animations on resize
        document.querySelectorAll('[data-animation]').forEach(el => {
            if (!this.isElementInView(el)) {
                el.style.opacity = '0';
                el.style.transform = '';
            }
        });
    }
    
    // ========== CHECK REDUCED MOTION ==========
    checkReducedMotion() {
        if (this.prefersReducedMotion.matches) {
            document.body.classList.add('reduced-motion');
            
            // Disable animations
            document.querySelectorAll('[data-animation]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = '';
                el.style.animation = 'none';
            });
        }
        
        this.prefersReducedMotion.addEventListener('change', (e) => {
            if (e.matches) {
                document.body.classList.add('reduced-motion');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        });
    }
    
    // ========== UTILITY FUNCTIONS ==========
    isElementInView(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        return (
            rect.top < windowHeight &&
            rect.bottom > 0 &&
            rect.left < windowWidth &&
            rect.right > 0
        );
    }
    
    // ========== INITIALIZE KEYFRAMES ==========
    initKeyframes() {
        this.generateKeyframes();
    }
}

// ========== AUTO-INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    window.animationController = new AnimationController();
    window.animationController.initKeyframes();
    
    // Add animation attributes to elements
    document.querySelectorAll('.feature-card, .department-card, .fade-up').forEach(el => {
        if (!el.dataset.animation) {
            el.dataset.animation = 'fadeUp';
        }
    });
    
    // Setup parallax
    window.animationController.setupParallax();
});

// ========== EXPORT ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationController;
              }
