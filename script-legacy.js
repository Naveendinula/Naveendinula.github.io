/**
 * Legacy Script - Maintained for Compatibility
 * This file now serves as a bridge to the new modular system
 * All functionality has been moved to the modular architecture in assets/js/
 */

// Import the new application (when modules are supported)
// For now, we'll use the global PortfolioApp instance

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Legacy script.js loaded - delegating to modular system');
    
    // The new PortfolioApp handles all initialization
    // This file is maintained for backward compatibility
    
    // If PortfolioApp is not yet loaded, wait for it
    if (window.PortfolioApp) {
        console.log('✅ PortfolioApp already initialized');
    } else {
        // Wait for PortfolioApp to be ready
        document.addEventListener('portfolioAppReady', function(event) {
            console.log('✅ PortfolioApp initialized via event');
        });
    }

    // Legacy functionality - kept for compatibility
    initLegacyFeatures();
});

function initLegacyFeatures() {
    // Page Navigation and Active State (maintained for backward compatibility)
    initAboutPage();
    
    const navButtons = document.querySelectorAll('.nav-button');

    // Set active state based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navButtons.forEach(button => {
        const buttonPage = button.getAttribute('data-page');
        
        if ((currentPage === 'index.html' && buttonPage === 'about') ||
            (currentPage === 'portfolio.html' && buttonPage === 'portfolio') ||
            (currentPage === 'building-analytics.html' && buttonPage === 'portfolio') ||
            (currentPage === 'eia-dashboard.html' && buttonPage === 'portfolio') ||
            (currentPage === 'contact.html' && buttonPage === 'contact')) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Navigation click handlers
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Portfolio Filter Functionality
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

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = 'Message Sent!';
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    this.reset();
                }, 2000);
            }, 1500);
        });
    }

    // Scroll animations
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

    const animateElements = document.querySelectorAll('.skill-item, .portfolio-item, .contact-item, .contact-method');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    setTimeout(() => {
        const elements = document.querySelectorAll('.fade-in');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('show');
            }, index * 100);
        });
    }, 200);
}

// About page initialization
function initAboutPage() {
    initTypingAnimation();
    
    const timelineTabs = document.querySelectorAll('.tab-button');
    const timelinePanels = document.querySelectorAll('.tab-panel');

    timelineTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetPanel = this.getAttribute('data-tab');
            
            timelineTabs.forEach(t => t.classList.remove('active'));
            timelinePanels.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            const panel = document.getElementById(targetPanel);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });
}

function initTypingAnimation() {
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

// Legacy functions for backward compatibility
function showNotification(message, type = 'success') {
    if (window.PortfolioApp && window.PortfolioApp.showNotification) {
        window.PortfolioApp.showNotification(message, type);
    } else {
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-weight: 500;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Ensure global functions are available
window.showNotification = showNotification;

// Add CSS keyframes for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
