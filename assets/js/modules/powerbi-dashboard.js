/**
 * PowerBI Dashboard Module
 * Handles PowerBI iframe loading with fallback functionality
 */

class PowerBIDashboard {
    constructor(config = {}) {
        this.config = {
            iframeId: 'powerbi-dashboard',
            loaderId: 'dashboardLoader',
            fallbackId: 'dashboard-fallback',
            retryButtonId: 'retryButton',
            loadTimeout: 10000,
            ...config
        };
        
        this.iframe = null;
        this.loader = null;
        this.fallback = null;
        this.retryBtn = null;
        this.timeoutId = null;
        
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupElements());
        } else {
            this.setupElements();
        }
    }

    setupElements() {
        this.iframe = document.getElementById(this.config.iframeId);
        this.loader = document.getElementById(this.config.loaderId);
        this.fallback = document.getElementById(this.config.fallbackId);
        this.retryBtn = document.getElementById(this.config.retryButtonId);

        if (!this.iframe) {
            console.warn('PowerBI iframe not found');
            return;
        }

        this.setupEventListeners();
        this.startLoadingTimeout();
    }

    setupEventListeners() {
        // Set up iframe event listeners
        this.iframe.addEventListener('load', () => this.hideLoader());
        this.iframe.addEventListener('error', () => this.showFallback());

        // Set up retry button
        if (this.retryBtn) {
            this.retryBtn.addEventListener('click', () => this.retryLoad());
        }
    }

    startLoadingTimeout() {
        // Give the iframe a maximum time to load
        this.timeoutId = setTimeout(() => this.showFallback(), this.config.loadTimeout);
    }

    showFallback() {
        if (this.loader) this.loader.style.display = 'none';
        if (this.iframe) this.iframe.style.opacity = '0';
        if (this.fallback) this.fallback.style.display = 'block';
        this.clearTimeout();
    }

    hideLoader() {
        if (this.loader) this.loader.style.display = 'none';
        if (this.iframe) this.iframe.style.opacity = '1';
        this.clearTimeout();
    }

    retryLoad() {
        if (this.fallback) this.fallback.style.display = 'none';
        if (this.loader) this.loader.style.display = 'flex';
        if (this.iframe) this.iframe.style.opacity = '0';
        
        // Force reload the iframe
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.location.reload();
        }
        
        this.startLoadingTimeout();
    }

    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    // Public method to manually trigger fallback
    triggerFallback() {
        this.showFallback();
    }

    // Public method to reset the dashboard
    reset() {
        this.clearTimeout();
        if (this.fallback) this.fallback.style.display = 'none';
        if (this.loader) this.loader.style.display = 'flex';
        if (this.iframe) this.iframe.style.opacity = '0';
        this.startLoadingTimeout();
    }
}

// Auto-initialize if elements are present
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('powerbi-dashboard')) {
        window.powerBIDashboard = new PowerBIDashboard();
    }
});

// Export for module usage
export default PowerBIDashboard;
