// ============================================
// MAIN APPLICATION SCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    'use strict';
    
    // ============================================
    // LOADING SCREEN
    // ============================================
    function initLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('loader-progress-bar');
        let progress = 0;
        
        function updateProgress() {
            progress += Math.random() * 10;
            if (progress > 100) progress = 100;
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (progress < 100) {
                setTimeout(updateProgress, 200);
            } else {
                setTimeout(function() {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(function() {
                        loadingScreen.style.display = 'none';
                    }, 600);
                }, 500);
            }
        }
        
        updateProgress();
    }
    initLoadingScreen();

    // ============================================
    // NAVIGATION
    // ============================================
    function initNavigation() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Toggle mobile menu
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.toggle('active');
                navMenu.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });
        }
        
        // Close menu on link click (mobile)
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
        
        // Close menu on outside click
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                const nav = document.querySelector('.nav-content');
                if (nav && !nav.contains(e.target) && navMenu.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            }
        });
        
        // Dropdown for mobile
        const dropdownItems = document.querySelectorAll('.nav-item.dropdown');
        dropdownItems.forEach(item => {
            const link = item.querySelector('.dropdown-toggle');
            if (link) {
                link.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        item.classList.toggle('active');
                    }
                });
            }
        });
        
        // Sticky navbar
        const navbar = document.getElementById('mainNav');
        let lastScroll = 0;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        });
    }
    initNavigation();

    // ============================================
    // SEARCH OVERLAY
    // ============================================
    function initSearch() {
        const searchToggle = document.getElementById('searchToggle');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchClose = document.getElementById('searchClose');
        const searchInput = document.getElementById('searchInput');
        
        if (searchToggle && searchOverlay) {
            searchToggle.addEventListener('click', function() {
                searchOverlay.classList.add('active');
                setTimeout(() => {
                    if (searchInput) searchInput.focus();
                }, 300);
                document.body.style.overflow = 'hidden';
            });
        }
        
        if (searchClose && searchOverlay) {
            searchClose.addEventListener('click', function() {
                searchOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        if (searchOverlay) {
            searchOverlay.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchOverlay) {
                    if (searchOverlay.classList.contains('active')) {
                        searchOverlay.classList.remove('active');
                        document.body.style.overflow = '';
                    } else {
                        searchOverlay.classList.add('active');
                        setTimeout(() => {
                            if (searchInput) searchInput.focus();
                        }, 300);
                        document.body.style.overflow = 'hidden';
                    }
                }
            }
            if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('active')) {
                searchOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    initSearch();

    // ============================================
    // HERO SLIDER
    // ============================================
    function initHeroSlider() {
        const slides = document.querySelectorAll('.slide');
        const dotsContainer = document.getElementById('sliderDots');
        const prevBtn = document.getElementById('prevSlide');
        const nextBtn = document.getElementById('nextSlide');
        let currentSlide = 0;
        let slideInterval;
        
        if (slides.length === 0) return;
        
        // Create dots
        if (dotsContainer) {
            slides.forEach((_, index) => {
                const dot = document.createElement('button');
                dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
                dot.setAttribute('data-index', index);
                dot.addEventListener('click', function() {
                    goToSlide(parseInt(this.getAttribute('data-index')));
                });
                dotsContainer.appendChild(dot);
            });
        }
        
        function goToSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (dotsContainer) {
                    const dots = dotsContainer.querySelectorAll('.slider-dot');
                    if (dots[i]) dots[i].classList.remove('active');
                }
            });
            
            slides[index].classList.add('active');
            if (dotsContainer) {
                const dots = dotsContainer.querySelectorAll('.slider-dot');
                if (dots[index]) dots[index].classList.add('active');
            }
            
            currentSlide = index;
        }
        
        function nextSlide() {
            const next = (currentSlide + 1) % slides.length;
            goToSlide(next);
        }
        
        function prevSlide() {
            const prev = (currentSlide - 1 + slides.length) % slides.length;
            goToSlide(prev);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                prevSlide();
                resetInterval();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                nextSlide();
                resetInterval();
            });
        }
        
        function startInterval() {
            slideInterval = setInterval(nextSlide, 5000);
        }
        
        function resetInterval() {
            clearInterval(slideInterval);
            startInterval();
        }
        
        // Pause on hover
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.addEventListener('mouseenter', function() {
                clearInterval(slideInterval);
            });
            hero.addEventListener('mouseleave', function() {
                startInterval();
            });
        }
        
        startInterval();
    }
    initHeroSlider();

    // ============================================
    // COUNTER ANIMATION
    // ============================================
    function initCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const target = parseInt(element.getAttribute('data-count'));
                    const duration = 2000;
                    const startTime = performance.now();
                    
                    function updateCounter(currentTime) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(eased * target);
                        
                        element.textContent = current.toLocaleString();
                        
                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            element.textContent = target.toLocaleString();
                        }
                    }
                    
                    requestAnimationFrame(updateCounter);
                    observer.unobserve(element);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
    initCounters();

    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    function initScrollAnimations() {
        const animateElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.getAttribute('data-delay')) || 0;
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animateElements.forEach(el => observer.observe(el));
    }
    initScrollAnimations();

    // ============================================
    // SCROLL TO TOP
    // ============================================
    function initScrollTop() {
        const scrollBtn = document.getElementById('scrollTop');
        
        if (!scrollBtn) return;
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollBtn.classList.add('visible');
            } else {
                scrollBtn.classList.remove('visible');
            }
        });
        
        scrollBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    initScrollTop();

    // ============================================
    // DARK MODE
    // ============================================
    function initDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        const html = document.documentElement;
        
        // Check saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            html.setAttribute('data-theme', savedTheme);
            updateToggleIcon(savedTheme);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.setAttribute('data-theme', 'dark');
            updateToggleIcon('dark');
        }
        
        if (toggle) {
            toggle.addEventListener('click', function() {
                const currentTheme = html.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateToggleIcon(newTheme);
            });
        }
        
        function updateToggleIcon(theme) {
            if (toggle) {
                const icon = toggle.querySelector('i');
                if (icon) {
                    if (theme === 'dark') {
                        icon.className = 'fas fa-sun';
                    } else {
                        icon.className = 'fas fa-moon';
                    }
                }
            }
        }
    }
    initDarkMode();

    // ============================================
    // NEWSLETTER FORM
    // ============================================
    function initNewsletter() {
        const form = document.getElementById('newsletterForm');
        
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const input = this.querySelector('input[type="email"]');
                const email = input.value.trim();
                
                if (email) {
                    // Show success message
                    const originalText = this.querySelector('button').innerHTML;
                    this.querySelector('button').innerHTML = '<i class="fas fa-check"></i> Subscribed!';
                    this.querySelector('button').style.background = '#22c55e';
                    input.value = '';
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        this.querySelector('button').innerHTML = originalText;
                        this.querySelector('button').style.background = '';
                    }, 3000);
                }
            });
        }
    }
    initNewsletter();

    // ============================================
    // AI ASSISTANT
    // ============================================
    function initAIAssistant() {
        const toggle = document.getElementById('aiToggle');
        const chat = document.getElementById('aiChat');
        const close = document.querySelector('.ai-close');
        const input = document.getElementById('aiInput');
        const sendBtn = document.getElementById('aiSend');
        const messages = document.getElementById('aiMessages');
        
        if (toggle && chat) {
            toggle.addEventListener('click', function() {
                chat.classList.toggle('active');
                if (chat.classList.contains('active') && input) {
                    setTimeout(() => input.focus(), 300);
                }
            });
        }
        
        if (close && chat) {
            close.addEventListener('click', function() {
                chat.classList.remove('active');
            });
        }
        
        function sendMessage() {
            if (!input || !messages) return;
            const text = input.value.trim();
            if (!text) return;
            
            // Add user message
            const userMsg = document.createElement('div');
            userMsg.className = 'message user';
            userMsg.innerHTML = `<p>${text}</p>`;
            messages.appendChild(userMsg);
            
            // Clear input
            input.value = '';
            
            // Scroll to bottom
            messages.scrollTop = messages.scrollHeight;
            
            // Simulate AI response
            setTimeout(() => {
                const responses = [
                    'I understand your concern. Let me help you with that.',
                    'Great question! Here\'s what I can tell you about that.',
                    'Thank you for asking. Our team can assist you with this.',
                    'That\'s an important matter. Let me provide some information.'
                ];
                
                const aiMsg = document.createElement('div');
                aiMsg.className = 'message ai';
                aiMsg.innerHTML = `<p>${responses[Math.floor(Math.random() * responses.length)]}</p>`;
                messages.appendChild(aiMsg);
                messages.scrollTop = messages.scrollHeight;
            }, 1000);
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }
        
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }
    initAIAssistant();

    // ============================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ============================================
    // BROWSER SUPPORT CHECK
    // ============================================
    function checkBrowserSupport() {
        const isModern = 'Promise' in window && 
                        'fetch' in window && 
                        'IntersectionObserver' in window;
        
        if (!isModern) {
            const message = document.createElement('div');
            message.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                padding: 15px;
                background: #ef4444;
                color: white;
                text-align: center;
                z-index: 99999;
                font-family: sans-serif;
            `;
            message.innerHTML = '⚠️ Your browser is outdated. Please update for the best experience.';
            document.body.prepend(message);
        }
    }
    checkBrowserSupport();

    // ============================================
    // PERFORMANCE MONITORING
    // ============================================
    if ('performance' in window && 'mark' in performance) {
        performance.mark('app-ready');
        console.log('MediCare App Loaded in', 
            performance.now().toFixed(2), 'ms');
    }

    console.log('🏥 MediCare Hospital App Initialized');
});
