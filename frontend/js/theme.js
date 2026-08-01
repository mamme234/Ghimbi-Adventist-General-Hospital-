// ========== THEME MANAGEMENT ==========
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
        this.elements = {
            toggle: document.getElementById('themeToggle'),
            html: document.documentElement,
            meta: document.querySelector('meta[name="theme-color"]')
        };
        
        this.init();
    }
    
    init() {
        // Apply saved theme or system preference
        if (!localStorage.getItem('theme')) {
            this.theme = this.systemTheme.matches ? 'dark' : 'light';
        }
        
        this.applyTheme(this.theme);
        this.setupEventListeners();
        this.setupSystemThemeListener();
        
        console.log(`🎨 Theme initialized: ${this.theme}`);
    }
    
    applyTheme(theme) {
        this.theme = theme;
        this.elements.html.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle button
        if (this.elements.toggle) {
            const icon = this.elements.toggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
        
        // Update meta theme color
        if (this.elements.meta) {
            this.elements.meta.content = theme === 'dark' ? '#0a0a1a' : '#0a6e4a';
        }
        
        // Update CSS variables for runtime
        this.updateCSSVariables(theme);
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme }
        }));
    }
    
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        
        // Add transition animation
        this.animateTransition(() => {
            this.applyTheme(newTheme);
        });
        
        // Analytics event
        if (window.gtag) {
            gtag('event', 'theme_toggle', {
                'theme': newTheme
            });
        }
    }
    
    animateTransition(callback) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: ${this.theme === 'light' ? '#0a0a1a' : '#f8fafc'};
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(overlay);
        
        // Fade in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
        });
        
        setTimeout(() => {
            // Apply theme
            callback();
            
            // Fade out
            requestAnimationFrame(() => {
                overlay.style.opacity = '0';
            });
            
            // Remove overlay
            setTimeout(() => {
                overlay.remove();
            }, 400);
        }, 300);
    }
    
    updateCSSVariables(theme) {
        const variables = theme === 'dark' ? {
            '--bg-primary': '#0a0a1a',
            '--bg-secondary': '#12122a',
            '--text-primary': '#f0f0f8',
            '--text-secondary': '#b0b0c8'
        } : {
            '--bg-primary': '#f8fafc',
            '--bg-secondary': '#e8edf2',
            '--text-primary': '#1a1a2e',
            '--text-secondary': '#4a4a6a'
        };
        
        const root = document.documentElement;
        Object.entries(variables).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }
    
    setupEventListeners() {
        // Theme toggle button
        if (this.elements.toggle) {
            this.elements.toggle.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // Add ripple effect
            this.elements.toggle.addEventListener('click', (e) => {
                this.createRipple(e);
            });
        }
        
        // Keyboard shortcut: Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }
    
    setupSystemThemeListener() {
        this.systemTheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            background: rgba(255,255,255,0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Get current theme
    getCurrentTheme() {
        return this.theme;
    }
    
    // Check if dark mode
    isDark() {
        return this.theme === 'dark';
    }
    
    // Check if light mode
    isLight() {
        return this.theme === 'light';
    }
}

// ========== INITIALIZE ==========
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// ========== EXPORT ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
              }
