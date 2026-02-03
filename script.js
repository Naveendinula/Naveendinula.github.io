(function () {
  'use strict';

  const Site = {
    state: {
      initialized: false,
      isDashboardLoading: false,
      dashboardLoadTimeout: null,
    },

    boot() {
      this.loadIncludes()
        .catch(() => {})
        .finally(() => {
          this.init();
        });
    },

    loadIncludes() {
      const includeElements = Array.from(document.querySelectorAll('[data-include]'));
      if (includeElements.length === 0) {
        return Promise.resolve();
      }

      const requests = includeElements.map((element) => {
        const url = element.getAttribute('data-include');
        if (!url || element.dataset.includeLoaded === 'true') {
          return Promise.resolve();
        }

        return fetch(url, { credentials: 'same-origin' })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Include request failed');
            }
            return response.text();
          })
          .then((html) => {
            element.innerHTML = html;
            element.dataset.includeLoaded = 'true';
          })
          .catch(() => {});
      });

      return Promise.all(requests).then(() => {});
    },

    init() {
      if (this.state.initialized) {
        return;
      }
      this.state.initialized = true;

      this.initNavigation();
      this.initPortfolioFilters();
      this.initContactForm();
      this.initScrollAnimations();
      this.initPageLoadAnimations();
      this.initAboutPage();
      this.initCollapsibles();
      this.initPowerBIDashboard();
      this.initPortfolioLinkNotifications();
      this.initEmailPopup();
    },

    getPageKey() {
      if (document.body && document.body.dataset.page) {
        return document.body.dataset.page;
      }

      const page = window.location.pathname.split('/').pop() || 'index.html';
      const pageMap = {
        'index.html': 'about',
        'portfolio.html': 'portfolio',
        'contact.html': 'contact',
        'building-analytics.html': 'portfolio',
        'ckc-environmental-analysis.html': 'portfolio',
        'urban-heat-island.html': 'portfolio',
        'wallacei-building-performance.html': 'portfolio',
        'eia-dashboard.html': 'portfolio',
        'chicago-energy-retrofit.html': 'portfolio',
        'building-permit-map.html': 'portfolio',
      };

      return pageMap[page] || '';
    },

    initNavigation() {
      const navButtons = document.querySelectorAll('.nav-button');
      if (!navButtons.length) {
        return;
      }

      const pageKey = this.getPageKey();

      navButtons.forEach((button) => {
        const buttonPage = button.getAttribute('data-page');
        if (buttonPage && buttonPage === pageKey) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });

      navButtons.forEach((button) => {
        if (button.dataset.navReady === 'true') {
          return;
        }

        button.dataset.navReady = 'true';
        button.addEventListener('click', () => {
          navButtons.forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
        });
      });
    },

    initPortfolioFilters() {
      const filterBtns = document.querySelectorAll('.filter-btn');
      const portfolioItems = document.querySelectorAll('.portfolio-item');

      if (filterBtns.length === 0 || portfolioItems.length === 0) {
        return;
      }

      filterBtns.forEach((btn) => {
        if (btn.dataset.filterReady === 'true') {
          return;
        }

        btn.dataset.filterReady = 'true';
        btn.addEventListener('click', () => {
          filterBtns.forEach((button) => button.classList.remove('active'));
          btn.classList.add('active');

          const filterValue = btn.getAttribute('data-filter');
          portfolioItems.forEach((item) => {
            if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
              item.style.display = 'block';
              item.style.animation = 'fadeIn 0.5s ease-in-out';
            } else {
              item.style.display = 'none';
            }
          });
        });
      });
    },

    initContactForm() {
      const contactForm = document.getElementById('contactForm');
      if (!contactForm || contactForm.dataset.contactReady === 'true') {
        return;
      }

      contactForm.dataset.contactReady = 'true';
      contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');

        if (!name || !email || !subject || !message) {
          this.showNotification('Please fill in all fields.', 'error');
          return;
        }

        if (!this.isValidEmail(email)) {
          this.showNotification('Please enter a valid email address.', 'error');
          return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        if (!submitBtn) {
          return;
        }

        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        setTimeout(() => {
          this.showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
          contactForm.reset();
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 2000);
      });
    },

    initScrollAnimations() {
      if (typeof IntersectionObserver === 'undefined') {
        return;
      }

      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
          }
        });
      }, observerOptions);

      const animateElements = document.querySelectorAll('.skill-item, .portfolio-item, .contact-item, .contact-method');
      animateElements.forEach((element) => {
        if (element.dataset.animateReady === 'true') {
          return;
        }

        element.dataset.animateReady = 'true';
        element.classList.add('fade-in');
        observer.observe(element);
      });
    },

    initPageLoadAnimations() {
      setTimeout(() => {
        const elements = document.querySelectorAll('.fade-in');
        elements.forEach((element, index) => {
          setTimeout(() => {
            element.classList.add('show');
          }, index * 100);
        });
      }, 200);
    },

    initAboutPage() {
      const pageKey = this.getPageKey();
      if (pageKey !== 'about' && !document.querySelector('.about-page')) {
        return;
      }

      this.initTypingAnimation();
      this.initTimelineTabs();
    },

    initTypingAnimation() {
      const typingElement = document.getElementById('typingText');
      if (!typingElement) {
        return;
      }

      const fullText = "Hi! I'm Naveen Panditharatne";
      let currentIndex = 0;

      const typeText = () => {
        if (currentIndex < fullText.length) {
          typingElement.innerHTML = fullText.substring(0, currentIndex + 1) + '<span class="typing-cursor"></span>';
          currentIndex += 1;
          setTimeout(typeText, 100);
        }
      };

      setTimeout(typeText, 500);
    },

    initTimelineTabs() {
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabPanels = document.querySelectorAll('.tab-panel');

      if (tabButtons.length === 0) {
        return;
      }

      tabButtons.forEach((button) => {
        if (button.dataset.tabReady === 'true') {
          return;
        }

        button.dataset.tabReady = 'true';
        button.addEventListener('click', () => {
          const targetTab = button.getAttribute('data-tab');

          tabButtons.forEach((btn) => btn.classList.remove('active'));
          tabPanels.forEach((panel) => panel.classList.remove('active'));

          button.classList.add('active');
          const targetPanel = document.getElementById(`${targetTab}-tab`);
          if (targetPanel) {
            targetPanel.classList.add('active');
          }
        });
      });
    },

    initCollapsibles() {
      const collapsibles = document.querySelectorAll('[data-collapsible]');
      collapsibles.forEach((collapsible) => {
        if (collapsible.dataset.collapsibleReady === 'true') {
          return;
        }

        const toggle = collapsible.querySelector('.collapsible-toggle');
        const content = collapsible.querySelector('.collapsible-content');

        if (!toggle || !content) {
          return;
        }

        collapsible.dataset.collapsibleReady = 'true';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', () => {
          const isExpanded = collapsible.classList.toggle('expanded');
          toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
          toggle.textContent = isExpanded ? 'Show less' : 'Show more';
        });
      });
    },

    initPowerBIDashboard() {
      const loader = document.getElementById('dashboardLoader');
      const iframe = document.querySelector('.powerbi-iframe');

      if (!loader || !iframe || iframe.dataset.powerbiReady === 'true') {
        return;
      }

      const fallback = document.getElementById('dashboard-fallback');
      const retryButton = document.getElementById('retryButton');

      iframe.dataset.powerbiReady = 'true';
      this.state.isDashboardLoading = true;

      loader.style.display = 'flex';
      iframe.style.opacity = '0';

      iframe.addEventListener('load', () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (iframeDoc) {
            this.handleIframeLoad(loader, iframe);
          }
        } catch (error) {
          setTimeout(() => {
            if (this.state.isDashboardLoading) {
              this.handleIframeLoad(loader, iframe);
            }
          }, 2000);
        }
      });

      iframe.addEventListener('error', () => {
        this.handleIframeError(loader, iframe, fallback);
      });

      if (retryButton && retryButton.dataset.retryReady !== 'true') {
        retryButton.dataset.retryReady = 'true';
        retryButton.addEventListener('click', () => {
          this.retryDashboardLoad(loader, iframe, fallback);
        });
      }

      if (this.state.dashboardLoadTimeout) {
        clearTimeout(this.state.dashboardLoadTimeout);
      }

      this.state.dashboardLoadTimeout = setTimeout(() => {
        if (this.state.isDashboardLoading) {
          this.showFallbackDashboard(loader, iframe, fallback);
        }
      }, 10000);
    },

    handleIframeLoad(loader, iframe) {
      this.state.isDashboardLoading = false;
      if (loader) {
        loader.style.display = 'none';
      }
      if (iframe) {
        iframe.style.opacity = '1';
      }
      if (this.state.dashboardLoadTimeout) {
        clearTimeout(this.state.dashboardLoadTimeout);
        this.state.dashboardLoadTimeout = null;
      }
    },

    handleIframeError(loader, iframe, fallback) {
      this.showFallbackDashboard(loader, iframe, fallback);
    },

    showFallbackDashboard(loader, iframe, fallback) {
      this.state.isDashboardLoading = false;

      if (loader) {
        loader.style.display = 'none';
      }
      if (iframe) {
        iframe.style.opacity = '0';
      }
      if (fallback) {
        fallback.style.display = 'block';
      }

      if (this.state.dashboardLoadTimeout) {
        clearTimeout(this.state.dashboardLoadTimeout);
        this.state.dashboardLoadTimeout = null;
      }
    },

    retryDashboardLoad(loader, iframe, fallback) {
      this.state.isDashboardLoading = true;

      if (fallback) {
        fallback.style.display = 'none';
      }
      if (loader) {
        loader.style.display = 'flex';
      }
      if (iframe) {
        iframe.style.opacity = '0';
        try {
          iframe.contentWindow.location.reload();
        } catch (error) {
          iframe.src = iframe.src;
        }
      }

      if (this.state.dashboardLoadTimeout) {
        clearTimeout(this.state.dashboardLoadTimeout);
      }
      this.state.dashboardLoadTimeout = setTimeout(() => {
        if (this.state.isDashboardLoading) {
          this.showFallbackDashboard(loader, iframe, fallback);
        }
      }, 10000);
    },

    initPortfolioLinkNotifications() {
      const portfolioLinks = document.querySelectorAll('.portfolio-link');
      if (!portfolioLinks.length) {
        return;
      }

      portfolioLinks.forEach((link) => {
        if (link.dataset.linkReady === 'true') {
          return;
        }

        link.dataset.linkReady = 'true';
        link.addEventListener('click', (event) => {
          event.preventDefault();

          const icon = link.querySelector('i');
          if (!icon) {
            return;
          }

          if (icon.classList.contains('fa-eye')) {
            this.showNotification('Live demo would open here!', 'success');
          } else if (icon.classList.contains('fa-github')) {
            this.showNotification('GitHub repository would open here!', 'success');
          }
        });
      });
    },

    initEmailPopup() {
      const copyLinks = document.querySelectorAll('[data-email-copy]');
      copyLinks.forEach((link) => {
        if (link.dataset.emailReady === 'true') {
          return;
        }

        link.dataset.emailReady = 'true';
        link.addEventListener('click', (event) => {
          if (typeof window.copyEmailToClipboard === 'function') {
            window.copyEmailToClipboard(event);
          }
        });
      });

      const closeTargets = document.querySelectorAll('[data-email-popup-close]');
      closeTargets.forEach((target) => {
        if (target.dataset.emailCloseReady === 'true') {
          return;
        }

        target.dataset.emailCloseReady = 'true';
        target.addEventListener('click', () => {
          if (typeof window.closeEmailPopup === 'function') {
            window.closeEmailPopup();
          }
        });
      });
    },

    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },

    showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;

      notification.style.cssText = [
        'position: fixed;',
        'top: 20px;',
        'right: 20px;',
        'padding: 15px 20px;',
        'border-radius: 5px;',
        'color: white;',
        'font-weight: 500;',
        'z-index: 10000;',
        'transform: translateX(400px);',
        'transition: transform 0.3s ease;',
        'max-width: 300px;',
        'word-wrap: break-word;'
      ].join(' ');

      if (type === 'success') {
        notification.style.backgroundColor = '#27ae60';
      } else if (type === 'error') {
        notification.style.backgroundColor = '#e74c3c';
      }

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 100);

      setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
    },
  };

  window.Site = Site;
  window.showNotification = (message, type) => Site.showNotification(message, type);

  const start = () => Site.boot();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

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
})();
