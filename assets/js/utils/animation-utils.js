/**
 * Animation Utilities
 * Helper functions for animations and transitions
 */

export const AnimationUtils = {
    /**
     * Fade in element
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration in milliseconds
     * @param {Function} callback - Completion callback
     */
    fadeIn(element, duration = 300, callback = null) {
        element.style.opacity = '0';
        element.style.display = 'block';

        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Fade out element
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration in milliseconds
     * @param {Function} callback - Completion callback
     */
    fadeOut(element, duration = 300, callback = null) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity) || 1;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Slide down element
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration in milliseconds
     * @param {Function} callback - Completion callback
     */
    slideDown(element, duration = 300, callback = null) {
        element.style.overflow = 'hidden';
        element.style.height = '0';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight;
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (targetHeight * progress) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Slide up element
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration in milliseconds
     * @param {Function} callback - Completion callback
     */
    slideUp(element, duration = 300, callback = null) {
        const startHeight = element.offsetHeight;
        element.style.overflow = 'hidden';
        element.style.height = startHeight + 'px';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (startHeight * (1 - progress)) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
                if (callback) callback();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Create typing animation
     * @param {Element} element - Target element
     * @param {string} text - Text to type
     * @param {number} speed - Typing speed in milliseconds per character
     * @param {Function} callback - Completion callback
     */
    typeWriter(element, text, speed = 100, callback = null) {
        element.textContent = '';
        let i = 0;
        
        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else if (callback) {
                callback();
            }
        };
        
        type();
    },

    /**
     * Animate element entrance with intersection observer
     * @param {string} selector - CSS selector for elements to animate
     * @param {Object} options - Intersection observer options
     * @param {string} animationClass - CSS class to add when visible
     */
    animateOnScroll(selector, options = {}, animationClass = 'animate-in') {
        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(animationClass);
                    observer.unobserve(entry.target);
                }
            });
        }, { ...defaultOptions, ...options });

        document.querySelectorAll(selector).forEach(el => {
            observer.observe(el);
        });

        return observer;
    },

    /**
     * Add bounce animation to element
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration in milliseconds
     */
    bounce(element, duration = 600) {
        const originalTransform = element.style.transform;
        
        element.style.animation = `bounce ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
            element.style.transform = originalTransform;
        }, duration);
    },

    /**
     * Add shake animation to element
     * @param {Element} element - Target element
     * @param {number} duration - Animation duration in milliseconds
     */
    shake(element, duration = 500) {
        const originalTransform = element.style.transform;
        
        element.style.animation = `shake ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
            element.style.transform = originalTransform;
        }, duration);
    },

    /**
     * Create staggered animation for multiple elements
     * @param {NodeList|Array} elements - Elements to animate
     * @param {Function} animationFn - Animation function to apply to each element
     * @param {number} delay - Delay between animations in milliseconds
     */
    stagger(elements, animationFn, delay = 100) {
        elements.forEach((element, index) => {
            setTimeout(() => {
                animationFn(element);
            }, index * delay);
        });
    }
};

// Add CSS keyframes for built-in animations
const style = document.createElement('style');
style.textContent = `
    @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0, 0, 0); }
        40%, 43% { transform: translate3d(0, -8px, 0); }
        70% { transform: translate3d(0, -4px, 0); }
        90% { transform: translate3d(0, -2px, 0); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
    
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
        transition: opacity 0.6s ease, transform 0.6s ease;
    }
    
    .animate-out {
        opacity: 0 !important;
        transform: translateY(20px) !important;
    }
`;
document.head.appendChild(style);

// Make available globally
window.AnimationUtils = AnimationUtils;
