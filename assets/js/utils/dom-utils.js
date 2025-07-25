/**
 * DOM Utilities
 * Helper functions for DOM manipulation and element selection
 */

export const DOMUtils = {
    /**
     * Select a single element
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (optional)
     * @returns {Element|null}
     */
    select(selector, context = document) {
        return context.querySelector(selector);
    },

    /**
     * Select multiple elements
     * @param {string} selector - CSS selector
     * @param {Element} context - Context element (optional)
     * @returns {NodeList}
     */
    selectAll(selector, context = document) {
        return context.querySelectorAll(selector);
    },

    /**
     * Create an element with attributes
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string} content - Text content (optional)
     * @returns {Element}
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            element.textContent = content;
        }

        return element;
    },

    /**
     * Add event listener with automatic cleanup
     * @param {Element|string} element - Element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Cleanup function
     */
    on(element, event, handler, options = {}) {
        const el = typeof element === 'string' ? this.select(element) : element;
        if (!el) return () => {};

        el.addEventListener(event, handler, options);
        
        return () => el.removeEventListener(event, handler, options);
    },

    /**
     * Add delegated event listener
     * @param {Element|string} parent - Parent element or selector
     * @param {string} selector - Child selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @returns {Function} Cleanup function
     */
    delegate(parent, selector, event, handler) {
        const parentEl = typeof parent === 'string' ? this.select(parent) : parent;
        if (!parentEl) return () => {};

        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && parentEl.contains(target)) {
                handler.call(target, e);
            }
        };

        return this.on(parentEl, event, delegatedHandler);
    },

    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @param {number} threshold - Visibility threshold (0-1)
     * @returns {boolean}
     */
    isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);

        const visibleArea = visibleHeight * visibleWidth;
        const totalArea = rect.height * rect.width;

        return totalArea > 0 && (visibleArea / totalArea) >= threshold;
    },

    /**
     * Wait for element to appear in DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<Element>}
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = this.select(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = this.select(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    },

    /**
     * Smooth scroll to element
     * @param {Element|string} target - Target element or selector
     * @param {Object} options - Scroll options
     */
    scrollTo(target, options = {}) {
        const element = typeof target === 'string' ? this.select(target) : target;
        if (!element) return;

        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        };

        element.scrollIntoView({ ...defaultOptions, ...options });
    }
};

// Make available globally
window.DOMUtils = DOMUtils;
