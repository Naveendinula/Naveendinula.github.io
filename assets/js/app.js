/**
 * Application Entry Point
 * Coordinates all modules and handles application initialization
 */

// Import all modules (when using ES6 modules)
// import EmailUtils from './modules/email-utils.js';
// import PowerBIDashboard from './modules/powerbi-dashboard.js';

class PortfolioApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        if (this.isInitialized) return;

        console.log('🚀 Initializing Portfolio Application...');

        // Initialize core modules
        this.initCoreModules();
        
        // Initialize page-specific modules
        this.initPageSpecificModules();
        
        // Initialize shared functionality
        this.initSharedFeatures();

        this.isInitialized = true;
        console.log('✅ Portfolio Application initialized successfully');

        // Dispatch custom event for other modules
        document.dispatchEvent(new CustomEvent('portfolioAppReady', {
            detail: { app: this }
        }));
    }

    initCoreModules() {
        // Navigation system (from main.js)
        this.initNavigation();
        
        // Portfolio filters (from main.js)
        this.initPortfolioFilters();
        
        // Contact form (from main.js)
        this.initContactForm();
        
        // Scroll animations (from main.js)
        this.initScrollAnimations();
        
        // About page features (from main.js)
        this.initAboutPage();
    }

    initPageSpecificModules() {
        // Email utilities (extracted from inline script)
        if (document.getElementById('emailPopup')) {
            this.modules.emailUtils = window.emailUtils || null;
        }

        // PowerBI Dashboard (extracted from inline script)
        if (document.getElementById('powerbi-dashboard')) {
            this.modules.powerBIDashboard = window.powerBIDashboard || null;
        }
    }

    initSharedFeatures() {
        // Add any shared features here
        this.initGlobalErrorHandling();
        this.initPerformanceMonitoring();
    }

    initNavigation() {
        const navButtons = document.querySelectorAll('.nav-button');
        navButtons.forEach(button => {
            button.addEventListener('click', function() {
                navButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    initPortfolioFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const portfolioItems = document.querySelectorAll('.portfolio-item');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const filterValue = this.getAttribute('data-filter');

                portfolioItems.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'block';
                        item.style.animation = 'fadeIn 0.5s ease-in-out';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }

    initContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                submitBtn.textContent = 'Message Sent!';
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    contactForm.reset();
                }, 2000);
            }, 1500);
        });
    }

    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                }
            });
        }, observerOptions);

        const animateElements = document.querySelectorAll(
            '.skill-item, .portfolio-item, .contact-item, .contact-method'
        );
        
        animateElements.forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    }

    initAboutPage() {
        // Initialize typing animation if on about page
        if (document.querySelector('.typing-cursor')) {
            this.initTypingAnimation();
        }

        // Initialize timeline tabs
        this.initTimelineTabs();
    }

    initTypingAnimation() {
        const typingElement = document.querySelector('.typing-text');
        const cursor = document.querySelector('.typing-cursor');
        
        if (!typingElement || !cursor) return;

        const text = typingElement.textContent;
        typingElement.textContent = '';
        
        let i = 0;
        const typeSpeed = 100;
        
        function typeWriter() {
            if (i < text.length) {
                typingElement.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, typeSpeed);
            }
        }
        
        setTimeout(typeWriter, 1000);
    }

    initTimelineTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        if (tabButtons.length === 0) return;

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                button.classList.add('active');
                const targetPanel = document.getElementById(targetTab);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    initGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            // Could send to analytics service here
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            // Could send to analytics service here
        });
    }

    initPerformanceMonitoring() {
        // Simple performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('📊 Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                }, 0);
            });
        }
    }

    // Public API methods
    getModule(name) {
        return this.modules[name];
    }

    isReady() {
        return this.isInitialized;
    }

    // Utility methods
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Could implement actual notification system here
    }

    smoothScrollTo(targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initialize the application
const portfolioApp = new PortfolioApp();

// Make app available globally
window.PortfolioApp = portfolioApp;

// Export for module usage
export default PortfolioApp;
