// ========== MAIN APPLICATION ==========
const App = {
    // Configuration
    config: {
        apiUrl: 'https://ghimbi-adventist-general-hospital-1.onrender.com/api',
        wsUrl: 'wss://ghimbi-adventist-general-hospital-1.onrender.com',
        version: '2027.1.0',
        name: 'Gimbi Adventist General Hospital'
    },
    
    // State
    state: {
        isAuthenticated: false,
        user: null,
        theme: localStorage.getItem('theme') || 'light',
        language: 'en',
        notifications: [],
        online: navigator.onLine
    },
    
    // Initialize Application
    init() {
        console.log(`🏥 ${this.config.name} v${this.config.version}`);
        console.log('🚀 Initializing application...');
        
        // Apply theme
        this.applyTheme(this.state.theme);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup animations
        this.setupAnimations();
        
        // Setup service worker
        this.setupServiceWorker();
        
        // Setup online/offline detection
        this.setupNetworkDetection();
        
        // Setup AI Assistant        this.setupAIAssistant();
        
        // Setup scroll effects
        this.setupScrollEffects();
        
        // Setup counter animations
        this.animateCounters();
        
        // Remove preloader
        this.hidePreloader();
        
        console.log('✅ Application initialized successfully');
    },
    
    // ========== THEME ==========
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.state.theme = theme;
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icon
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            const icon = toggle.querySelector('i');
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
        
        // Update meta theme color
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = theme === 'dark' ? '#0a0a1a' : '#0a6e4a';
        }
    },
    
    toggleTheme() {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Add transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay active';
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 400);
        }, 300);
    },
    
    // ========== NAVIGATION ==========
    setupEventListeners() {
        // Mobile menu toggle
        const menuToggle = document.getElementById('mobileMenuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', () => {
                mobileMenu.classList.toggle('active');
                document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
            });
        }
        
        if (closeMenu && mobileMenu) {
            closeMenu.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close menu on link click
        document.querySelectorAll('.mobile-nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenu) {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Back to top
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                const isClickInside = mobileMenu.contains(e.target);
                const isToggleClick = menuToggle && menuToggle.contains(e.target);
                if (!isClickInside && !isToggleClick) {
                    mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
        });
    },
    
    // ========== SCROLL EFFECTS ==========
    setupScrollEffects() {
        const navbar = document.getElementById('navbar');
        const backToTop = document.getElementById('backToTop');
        
        let lastScroll = 0;
        
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            // Navbar shadow
            if (navbar) {
                if (currentScroll > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
            
            // Back to top button
            if (backToTop) {
                if (currentScroll > 400) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            }
            
            // Hide/show navbar on scroll (optional)
            if (currentScroll > lastScroll && currentScroll > 100) {
                // Scrolling down
            } else {
                // Scrolling up
            }
            
            lastScroll = currentScroll;
        });
    },
    
    // ========== ANIMATIONS ==========
    setupAnimations() {
        // Intersection Observer for fade-up animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.fade-up, .fade-right').forEach(el => {
            observer.observe(el);
        });
        
        // Staggered animation for cards
        document.querySelectorAll('.feature-card, .department-card').forEach((card, index) => {
            card.style.setProperty('--delay', `${0.1 + (index * 0.05)}s`);
        });
    },
    
    // ========== COUNTER ANIMATION ==========
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-count'));
                    this.animateCounter(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    },
    
    animateCounter(element, target) {
        const duration = 2000;
        const start = performance.now();
        const initial = 0;
        
        const update = (timestamp) => {
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        requestAnimationFrame(update);
    },
    
    // ========== AI ASSISTANT ==========
    setupAIAssistant() {
        const btn = document.getElementById('aiAssistantBtn');
        const modal = document.getElementById('aiChatModal');
        const close = document.getElementById('aiChatClose');
        const send = document.getElementById('aiChatSend');
        const input = document.getElementById('aiChatInput');
        const body = document.getElementById('aiChatBody');
        
        if (!btn || !modal) return;
        
        // Open modal
        btn.addEventListener('click', () => {
            modal.classList.toggle('active');
            if (modal.classList.contains('active')) {
                input?.focus();
            }
        });
        
        // Close modal
        if (close) {
            close.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        
        // Send message
        const sendMessage = () => {
            const message = input?.value.trim();
            if (!message) return;
            
            // Add user message
            this.addAIMessage(message, 'user');
            input.value = '';
            
            // Simulate AI response
            this.simulateAIResponse(message);
        };
        
        if (send) {
            send.addEventListener('click', sendMessage);
        }
        
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        // Add initial bot message with delay
        setTimeout(() => {
            this.addAIMessage(
                'Hello! I\'m your AI health assistant. How can I help you today? ' +
                '<small>Please note: I provide informational support only.</small>',
                'bot'
            );
        }, 500);
    },
    
    addAIMessage(text, type) {
        const body = document.getElementById('aiChatBody');
        if (!body) return;
        
        const message = document.createElement('div');
        message.className = `ai-message ai-message-${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar';
        avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
        
        const content = document.createElement('div');
        content.className = 'ai-message-content';
        content.innerHTML = text;
        
        message.appendChild(avatar);
        message.appendChild(content);
        body.appendChild(message);
        
        // Scroll to bottom
        body.scrollTop = body.scrollHeight;
    },
    
    simulateAIResponse(userMessage) {
        // Simple response logic
        const responses = {
            'hello': 'Hello! How can I assist you with your healthcare needs today?',
            'hi': 'Hi there! What can I help you with?',
            'doctor': 'You can book an appointment with our expert doctors through the appointments page. Would you like me to help you with that?',
            'appointment': 'I can help you book an appointment. Please visit the appointments page or call our reception at +251 911 234 567.',
            'emergency': '🚑 For emergencies, please call our emergency hotline: +251 911 234 567. Our ambulance service is available 24/7.',
            'pharmacy': 'Our pharmacy is open 24/7. You can check medicine availability and place orders online.',
            'lab': 'Our laboratory offers comprehensive diagnostic services. You can view your results through the patient portal.',
            'insurance': 'We accept various insurance plans. Please contact our finance department for detailed information.',
            'hours': 'Our hospital operates 24/7. Outpatient services are available from 8:00 AM to 6:00 PM daily.',
            'location': 'We are located in Gimbi, Ethiopia. You can find us on Google Maps.',
            'thanks': 'You\'re welcome! Is there anything else I can help you with?',
            'bye': 'Goodbye! Take care of your health. Come back if you need anything!'
        };
        
        // Find matching response
        let response = 'I appreciate your question. For specific medical inquiries, please consult our healthcare professionals directly. How else can I assist you?';
        const lowerMsg = userMessage.toLowerCase();
        
        for (const [key, value] of Object.entries(responses)) {
            if (lowerMsg.includes(key)) {
                response = value;
                break;
            }
        }
        
        // Add delay to simulate thinking
        setTimeout(() => {
            this.addAIMessage(response, 'bot');
        }, 800 + Math.random() * 600);
    },
    
    // ========== SERVICE WORKER ==========
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered successfully');
                    })
                    .catch(err => {
                        console.log('Service Worker registration failed:', err);
                    });
            });
        }
    },
    
    // ========== NETWORK DETECTION ==========
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.state.online = true;
            this.showNotification('You are back online!', 'success');
            document.body.classList.remove('offline');
        });
        
        window.addEventListener('offline', () => {
            this.state.online = false;
            this.showNotification('You are offline. Some features may be unavailable.', 'warning');
            document.body.classList.add('offline');
        });
    },
    
    // ========== NOTIFICATIONS ==========
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} glass`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Style
        notification.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            padding: 16px 20px;
            border-radius: var(--radius-md);
            background: var(--bg-card);
            border: 1px solid var(--border-light);
            box-shadow: var(--shadow-lg);
            transform: translateX(120%);
            transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 12px;
            backdrop-filter: var(--glass-blur);
        `;
        
        // Add close button
        const close = notification.querySelector('.notification-close');
        if (close) {
            close.style.cssText = `
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                padding: 4px;
                font-size: 16px;
                transition: var(--transition);
            `;
            close.addEventListener('click', () => {
                this.removeNotification(notification);
            });
        }
        
        document.body.appendChild(notification);
        
        // Show
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);
    },
    
    removeNotification(notification) {
        if (!notification.parentNode) return;
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 400);
    },
    
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },
    
    // ========== PRELOADER ==========
    hidePreloader() {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('hidden');
                setTimeout(() => {
                    preloader.style.display = 'none';
                }, 600);
            }, 800);
        }
    },
    
    // ========== UTILITY FUNCTIONS ==========
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ETB'
        }).format(amount);
    },
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// ========== EXPORT FOR MODULES ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
              }
