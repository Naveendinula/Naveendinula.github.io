// Page Navigation and Active State
document.addEventListener('DOMContentLoaded', function() {
    // Initialize about page features
    initAboutPage();
    
    const navButtons = document.querySelectorAll('.nav-button');

    // Set active state based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navButtons.forEach(button => {
        const buttonPage = button.getAttribute('data-page');
        const href = button.parentElement.getAttribute('href');
        
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
            // Let the default link behavior handle navigation
            // Remove active class from all buttons
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });

    // Portfolio Filter Functionality
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

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

    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    
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

        // Simulate form submission (replace with actual submission logic)
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

    // Typing Animation for About Page
    function initTypingAnimation() {
        const typingElement = document.getElementById('typingText');
        if (!typingElement) return;

        const fullText = "Hi! I'm Naveen Panditharatne";
        let currentIndex = 0;
        
        function typeText() {
            if (currentIndex < fullText.length) {
                typingElement.innerHTML = fullText.substring(0, currentIndex + 1) + '<span class="typing-cursor"></span>';
                currentIndex++;
                setTimeout(typeText, 100);
            }
        }
        
        // Start typing animation after a short delay
        setTimeout(typeText, 500);
    }

    // Timeline Tabs Functionality
    function initTimelineTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');
                
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                this.classList.add('active');
                const targetPanel = document.getElementById(targetTab + '-tab');
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
            });
        });
    }

    // Initialize About Page Features
    function initAboutPage() {
        // Only run if we're on the about page (index.html)
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
            initTypingAnimation();
            initTimelineTabs();
        }
    }

    initAboutPage();
});

// Power BI Dashboard Loading Logic (matching React component logic)
let isLoading = true;

function handleIframeLoad() {
    console.log('Power BI iframe loaded successfully');
    isLoading = false;
    
    const loader = document.getElementById('dashboardLoader');
    const iframe = document.querySelector('.powerbi-iframe');
    
    // Hide loader
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Show iframe with smooth transition
    if (iframe) {
        iframe.style.opacity = '1';
    }
    
    // Clear any existing timeout
    if (dashboardLoadTimeout) {
        clearTimeout(dashboardLoadTimeout);
    }
}

function handleIframeError() {
    console.log('Power BI iframe failed to load - likely due to X-Frame-Options restrictions');
    showFallbackDashboard();
}

function showFallbackDashboard() {
    console.log('Showing fallback dashboard');
    const loader = document.getElementById('dashboardLoader');
    const iframe = document.querySelector('.powerbi-iframe');
    const fallback = document.getElementById('dashboard-fallback');
    
    if (loader) {
        loader.style.display = 'none';
    }
    
    if (iframe) {
        iframe.style.display = 'none';
    }
    
    if (fallback) {
        fallback.style.display = 'flex';
    }
}

function retryDashboardLoad() {
    console.log('Retrying Power BI dashboard load...');
    isLoading = true;
    
    const loader = document.getElementById('dashboardLoader');
    const iframe = document.querySelector('.powerbi-iframe');
    const fallback = document.getElementById('dashboard-fallback');
    
    // Hide fallback and show loader
    if (fallback) {
        fallback.style.display = 'none';
    }
    
    if (loader) {
        loader.style.display = 'flex';
        const loaderText = loader.querySelector('p');
        if (loaderText) {
            loaderText.textContent = 'Loading dashboard...';
        }
    }
    
    if (iframe) {
        iframe.style.display = 'block';
        iframe.style.opacity = '0';
        // Force reload the iframe with updated URL
        iframe.src = "https://app.fabric.microsoft.com/view?r=eyJrIjoiMTAzY2YzMjYtZjkxYy00N2U3LTkyM2EtOTVjZGI2ZDE5NmZkIiwidCI6IjdkYTQ1YTdmLTdhYTEtNDVmZS05ZWRiLWM5OTQyMjJiYTlmOCIsImMiOjN9";
    }
    
    // Restart the timeout
    if (dashboardLoadTimeout) {
        clearTimeout(dashboardLoadTimeout);
    }
    
    dashboardLoadTimeout = setTimeout(() => {
        if (isLoading) {
            console.log('Power BI dashboard retry timeout - showing fallback');
            showFallbackDashboard();
        }
    }, 10000); // 10 seconds timeout
}

// Initialize Power BI dashboard loading
function initPowerBIDashboard() {
    const loader = document.getElementById('dashboardLoader');
    const iframe = document.querySelector('.powerbi-iframe');
    
    if (!loader || !iframe) return;
    
    console.log('Initializing Power BI dashboard...');
    console.log('Dashboard URL:', iframe.src);
    console.log('Current page URL:', window.location.href);
    isLoading = true;
    
    // Show loader initially
    loader.style.display = 'flex';
    iframe.style.opacity = '0';
    
    // Add iframe load error detection
    iframe.addEventListener('load', function() {
        // Check if iframe actually loaded content or was blocked
        try {
            // Try to access iframe content to detect if it was blocked
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
                console.log('Iframe loaded successfully');
                handleIframeLoad();
            }
        } catch (e) {
            // Cross-origin restriction is expected, but iframe might still be loading
            console.log('Cross-origin iframe detected - checking if content loaded...');
            // Give it a moment then assume it loaded (this is normal for Power BI)
            setTimeout(() => {
                if (isLoading) {
                    console.log('Assuming iframe loaded (cross-origin restrictions prevent direct checking)');
                    handleIframeLoad();
                }
            }, 2000);
        }
    });
    
    // Set a timeout to show fallback if loading takes too long
    dashboardLoadTimeout = setTimeout(() => {
        if (isLoading) {
            console.log('Power BI dashboard loading timeout - this usually means iframe was blocked by X-Frame-Options');
            showFallbackDashboard();
        }
    }, 10000); // 10 seconds timeout
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the EIA dashboard page
    if (window.location.pathname.includes('eia-dashboard.html')) {
        initPowerBIDashboard();
    }
});

// Global variable for timeout management
let dashboardLoadTimeout;

// Helper Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
    }

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Portfolio item click handlers
document.addEventListener('DOMContentLoaded', function() {
    const portfolioLinks = document.querySelectorAll('.portfolio-link');
    
    portfolioLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const icon = this.querySelector('i');
            if (icon.classList.contains('fa-eye')) {
                showNotification('Live demo would open here!', 'success');
            } else if (icon.classList.contains('fa-github')) {
                showNotification('GitHub repository would open here!', 'success');
            }
        });
    });
});

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
