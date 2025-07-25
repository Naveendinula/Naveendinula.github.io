/**
 * Core Portfolio Website Functionality
 * This file contains the main navigation and shared functionality
 */

// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all core features
    initNavigation();
    initPortfolioFilters();
    initContactForm();
    initScrollAnimations();
    initAboutPage();
});

/**
 * Navigation System
 * Handles active states and page navigation
 */
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Set active state based on current page
    navButtons.forEach(button => {
        const buttonPage = button.getAttribute('data-page');
        
        if ((currentPage === 'index.html' && buttonPage === 'about') ||
            (currentPage === 'portfolio.html' && buttonPage === 'portfolio') ||
            (currentPage === 'building-analytics.html' && buttonPage === 'portfolio') ||
            (currentPage === 'eia-dashboard.html' && buttonPage === 'portfolio') ||
            (currentPage === 'urban-heat-island.html' && buttonPage === 'portfolio') ||
            (currentPage === 'contact.html' && buttonPage === 'contact')) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Navigation click handlers
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });
}

/**
 * Portfolio Filter System
 * Handles filtering of portfolio items by category
 */
function initPortfolioFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (filterBtns.length === 0 || portfolioItems.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
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

/**
 * Contact Form Handler
 * Manages form submission and validation
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(this);
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');

        // Basic validation
        if (!name || !email || !subject || !message) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        // Simulate form submission
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            contactForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    });
}

/**
 * Scroll Animation System
 * Handles intersection observer for fade-in animations
 */
function initScrollAnimations() {
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

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.skill-item, .portfolio-item, .contact-item, .contact-method');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Page animations on load
    setTimeout(() => {
        const elements = document.querySelectorAll('.fade-in');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('show');
            }, index * 100);
        });
    }, 200);
}

/**
 * About Page Specific Features
 * Handles typing animation and timeline functionality
 */
function initAboutPage() {
    // Only run if we're on the about page
    if (!document.querySelector('.about-page')) return;
    
    initTypingAnimation();
    initTimelineTabs();
}

/**
 * Typing Animation for About Page
 */
function initTypingAnimation() {
    const typingElement = document.getElementById('typingText');
    if (!typingElement) return;

    const fullText = "Hi! I'm Naveen Panditharatne";
    let currentIndex = 0;
    
    function typeText() {
        if (currentIndex < fullText.length) {
            typingElement.textContent = fullText.slice(0, currentIndex + 1);
            currentIndex++;
            setTimeout(typeText, 100);
        }
    }
    
    // Start typing animation after a short delay
    setTimeout(typeText, 500);
}

/**
 * Timeline Tabs Functionality
 */
function initTimelineTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    if (tabButtons.length === 0) return;

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

/**
 * Utility Functions
 */

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 2rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        opacity: '0',
        transform: 'translateY(-20px)',
        transition: 'all 0.3s ease'
    });
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#28a745';
            break;
        case 'error':
            notification.style.background = '#dc3545';
            break;
        default:
            notification.style.background = '#007bff';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Smooth scroll utility
function smoothScrollTo(targetId) {
    const target = document.getElementById(targetId);
    if (target) {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Export for other modules if needed
window.PortfolioApp = {
    showNotification,
    smoothScrollTo,
    isValidEmail
};
