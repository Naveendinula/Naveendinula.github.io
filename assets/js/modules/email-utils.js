/**
 * Email Utility Module
 * Handles email copying and notification functionality
 */

class EmailUtils {
    constructor() {
        this.email = "ngnaveen.p@gmail.com";
        this.popup = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupPopup());
        } else {
            this.setupPopup();
        }
    }

    setupPopup() {
        this.popup = document.getElementById('emailPopup');
    }

    async copyEmailToClipboard(event) {
        if (event) {
            event.preventDefault();
        }

        try {
            // Modern clipboard API
            await navigator.clipboard.writeText(this.email);
            this.showEmailPopup();
        } catch (err) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard();
        }
    }

    fallbackCopyToClipboard() {
        const textArea = document.createElement("textarea");
        textArea.value = this.email;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showEmailPopup();
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        
        document.body.removeChild(textArea);
    }

    showEmailPopup() {
        if (!this.popup) return;

        this.popup.style.display = 'block';
        
        // Animate slide down
        setTimeout(() => {
            this.popup.style.top = '20px';
        }, 10);
        
        // Auto-close after 3 seconds
        setTimeout(() => this.closeEmailPopup(), 3000);
    }

    closeEmailPopup() {
        if (!this.popup) return;

        this.popup.style.top = '-100px';
        
        // Hide after animation completes
        setTimeout(() => {
            this.popup.style.display = 'none';
        }, 300);
    }
}

// Create instance and expose globally
const emailUtils = new EmailUtils();

// Expose the main function globally for onclick handlers
window.copyEmailToClipboard = (event) => emailUtils.copyEmailToClipboard(event);

// Export for module usage
export default EmailUtils;
