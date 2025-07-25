/**
 * Application Configuration
 * Central configuration file for the portfolio application
 */

const AppConfig = {
    // Application metadata
    app: {
        name: 'Portfolio Website',
        version: '2.0.0',
        author: 'Naveen Panditharatne',
        description: 'Modern portfolio website with advanced analytics and interactive features'
    },

    // Contact information
    contact: {
        email: 'ngnaveen.p@gmail.com',
        linkedin: 'https://linkedin.com/in/your-profile',
        github: 'https://github.com/your-username',
        location: 'Your Location'
    },

    // Animation settings
    animations: {
        typingSpeed: 100,
        fadeInDuration: 600,
        hoverTransition: 300,
        scrollThreshold: 0.1,
        loadingTimeout: 10000
    },

    // PowerBI Dashboard settings
    powerbi: {
        embedUrl: 'your-powerbi-embed-url',
        loadTimeout: 10000,
        retryAttempts: 3,
        fallbackEnabled: true
    },

    // Portfolio filters
    portfolioCategories: [
        { id: 'all', label: 'All Projects', active: true },
        { id: 'web', label: 'Web Development', active: false },
        { id: 'mobile', label: 'Mobile Apps', active: false },
        { id: 'analytics', label: 'Data Analytics', active: false },
        { id: 'design', label: 'UI/UX Design', active: false }
    ],

    // Social media links
    social: {
        github: {
            url: 'https://github.com/your-username',
            icon: 'fab fa-github',
            label: 'GitHub'
        },
        linkedin: {
            url: 'https://linkedin.com/in/your-profile',
            icon: 'fab fa-linkedin',
            label: 'LinkedIn'
        },
        email: {
            url: 'mailto:ngnaveen.p@gmail.com',
            icon: 'fas fa-envelope',
            label: 'Email'
        }
    },

    // API endpoints (if needed in the future)
    api: {
        baseUrl: window.location.origin,
        endpoints: {
            contact: '/api/contact',
            projects: '/api/projects',
            analytics: '/api/analytics'
        }
    },

    // Feature flags
    features: {
        enableAnalytics: true,
        enableContactForm: true,
        enableDarkMode: false,
        enableServiceWorker: false,
        enableLazyLoading: true
    },

    // Performance settings
    performance: {
        enableDebugMode: false,
        enablePerformanceMonitoring: true,
        lazyLoadOffset: 100,
        imageOptimization: true
    },

    // Responsive breakpoints
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024,
        large: 1200
    },

    // Theme configuration
    theme: {
        primaryColor: '#ff6b00',
        secondaryColor: '#000000',
        backgroundColor: '#f8f9fa',
        textColor: '#000000',
        accentColor: '#e55a00'
    }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(AppConfig);

// Make configuration available globally
window.AppConfig = AppConfig;

// Export for module usage
export default AppConfig;
