/**
 * GDPR Cookie Management System for AcoomH
 * Production-ready, lightweight, and fully compliant with GDPR regulations
 * @version 1.0.0
 * @author AcoomH Team
 */

class GDPRCookieManager {
  constructor() {
    // Configuration - easily customizable
    this.config = {
      cookieName: 'acoomh_gdpr_consent',
      consentVersion: '1.0',
      cookieExpireDays: 365,
      showBannerDelay: 1000, // Show banner after 1 second
      privacyPolicyUrl: 'privacy-policy.html', // Updated to point to the new privacy policy page
      
      // Cookie categories - modify as needed for your site
      categories: {
        necessary: {
          id: 'necessary',
          name: 'Necesare',
          description: 'Aceste cookie-uri sunt esențiale pentru funcționarea site-ului web și nu pot fi dezactivate.',
          required: true,
          cookies: ['PHPSESSID', 'acoomh_session', 'csrf_token'],
          cookieDescription: 'Informații de sesiune pentru autentificare, protecție împotriva atacurilor și păstrarea preferințelor de navigare pe parcursul vizitei tale.'
        },
        analytics: {
          id: 'analytics',
          name: 'Analiză',
          description: 'Ne ajută să înțelegem cum interacționezi cu site-ul nostru prin colectarea informațiilor în mod anonim.',
          required: false,
          cookies: ['_ga', '_ga_*', '_gid', '_gat', 'gtag'],
          cookieDescription: 'Statistici anonime despre vizitatorii site-ului, paginile vizitate și timpul petrecut pe fiecare pagină pentru îmbunătățirea experienței utilizatorilor.'
        },
        marketing: {
          id: 'marketing',
          name: 'Marketing',
          description: 'Utilizate pentru a-ți afișa reclame relevante și pentru a măsura eficiența campaniilor publicitare.',
          required: false,
          cookies: ['_fbp', '_fbc', 'fr', 'tr', 'ads_*'],
          cookieDescription: 'Urmărirea intereselor tale pentru afișarea de reclame personalizate pe AcoomH și pe alte site-uri partenere.'
        },
        preferences: {
          id: 'preferences',
          name: 'Preferințe',
          description: 'Permit site-ului să rețină informații care schimbă modul în care se comportă sau arată.',
          required: false,
          cookies: ['theme_preference', 'language', 'acoomh_preferences'],
          cookieDescription: 'Setările tale personale cum ar fi tema site-ului (modul întunecat/luminos), limba preferată și alte preferințe de afișare.'
        }
      }
    };

    this.consentData = null;
    this.isInitialized = false;
    
    // Bind methods to preserve context
    this.init = this.init.bind(this);
    this.showBanner = this.showBanner.bind(this);
    this.showPreferences = this.showPreferences.bind(this);
    this.acceptAll = this.acceptAll.bind(this);
    this.acceptNecessary = this.acceptNecessary.bind(this);
    this.savePreferences = this.savePreferences.bind(this);
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this.init);
    } else {
      this.init();
    }
  }

  /**
   * Initialize the GDPR Cookie Manager
   */
  init() {
    if (this.isInitialized) return;
    
    console.log('🍪 Initializing GDPR Cookie Manager...');
    
    try {
      // Load existing consent
      this.loadConsent();
      
      // Check if consent is needed
      if (!this.hasValidConsent()) {
        setTimeout(() => {
          this.showBanner();
        }, this.config.showBannerDelay);
      } else {
        // Apply existing consent
        this.applyConsent();
      }
      
      // Add global methods for external access
      window.acoomhCookies = {
        showPreferences: () => this.showPreferences(),
        getConsent: () => this.getConsent(),
        hasConsent: (category) => this.hasConsent(category),
        withdrawConsent: () => this.withdrawConsent()
      };
      
      this.isInitialized = true;
      console.log('✅ GDPR Cookie Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing GDPR Cookie Manager:', error);
    }
  }

  /**
   * Load existing consent from storage
   */
  loadConsent() {
    try {
      const stored = localStorage.getItem(this.config.cookieName);
      if (stored) {
        this.consentData = JSON.parse(stored);
        
        // Validate consent version
        if (this.consentData.version !== this.config.consentVersion) {
          console.log('🔄 Consent version outdated, requesting new consent');
          this.consentData = null;
        }
      }
    } catch (error) {
      console.error('Error loading consent data:', error);
      this.consentData = null;
    }
  }

  /**
   * Check if user has valid consent
   */
  hasValidConsent() {
    if (!this.consentData) return false;
    
    const expiryDate = new Date(this.consentData.timestamp);
    expiryDate.setDate(expiryDate.getDate() + this.config.cookieExpireDays);
    
    return new Date() < expiryDate;
  }

  /**
   * Show the cookie consent banner
   */
  showBanner() {
    // Remove any existing banners
    this.removeBanner();
    
    const banner = document.createElement('div');
    banner.id = 'gdpr-cookie-banner';
    banner.className = 'gdpr-banner';
    
    banner.innerHTML = `
      <div class="gdpr-banner-content">
        <div class="gdpr-banner-text">
          <div class="gdpr-banner-icon">
            <i class="fas fa-cookie-bite"></i>
          </div>
          <div class="gdpr-banner-message">
            <h3>Respectăm confidențialitatea ta</h3>
            <p>Folosim cookie-uri pentru a îmbunătăți experiența ta pe site-ul nostru. Poți alege ce tipuri de cookie-uri să accepți.</p>
          </div>
        </div>
        <div class="gdpr-banner-actions">
          <button class="gdpr-btn gdpr-btn-secondary" onclick="window.acoomhCookies.showPreferences()">
            <i class="fas fa-cog"></i>
            Personalizează
          </button>
          <button class="gdpr-btn gdpr-btn-outline" id="gdpr-accept-necessary">
            <i class="fas fa-shield-alt"></i>
            Doar necesare
          </button>
          <button class="gdpr-btn gdpr-btn-primary" id="gdpr-accept-all">
            <i class="fas fa-check"></i>
            Accept toate
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Add event listeners
    document.getElementById('gdpr-accept-all').addEventListener('click', this.acceptAll);
    document.getElementById('gdpr-accept-necessary').addEventListener('click', this.acceptNecessary);
    
    // Show banner with animation
    setTimeout(() => {
      banner.classList.add('gdpr-banner-visible');
    }, 100);
  }

  /**
   * Show cookie preferences modal
   */
  showPreferences() {
    // Remove any existing modals
    this.removePreferencesModal();
    
    const modal = document.createElement('div');
    modal.id = 'gdpr-preferences-modal';
    modal.className = 'gdpr-modal-overlay';
    
    // Build category checkboxes
    const categoriesHTML = Object.values(this.config.categories).map(category => {
      const isChecked = this.consentData ? 
        (this.consentData.categories[category.id] === true) : 
        category.required;
      
      return `
        <div class="gdpr-category">
          <div class="gdpr-category-header">
            <div class="gdpr-category-title">
              <label class="gdpr-checkbox-wrapper">
                <input type="checkbox" 
                       id="gdpr-${category.id}" 
                       ${isChecked ? 'checked' : ''} 
                       ${category.required ? 'disabled' : ''}
                       data-category="${category.id}">
                <span class="gdpr-checkbox-custom"></span>
                <span class="gdpr-category-name">${category.name}</span>
                ${category.required ? '<span class="gdpr-required">(Obligatoriu)</span>' : ''}
              </label>
            </div>
          </div>
          <div class="gdpr-category-description">
            <p>${category.description}</p>
            <div class="gdpr-cookies-list">
              <strong>Cookie-uri:</strong> ${category.cookieDescription}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    modal.innerHTML = `
      <div class="gdpr-modal-content">
        <div class="gdpr-modal-header">
          <h2><i class="fas fa-shield-alt"></i> Setări Cookie-uri</h2>
          <button class="gdpr-modal-close" id="gdpr-close-preferences">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="gdpr-modal-body">
          <div class="gdpr-privacy-info">
            <p>Alege ce tipuri de cookie-uri să permiti. Poți schimba aceste setări oricând accesând linkul din subsol.</p>
            <a href="${this.config.privacyPolicyUrl}" target="_blank" class="gdpr-privacy-link">
              <i class="fas fa-external-link-alt"></i>
              Vezi Politica de Confidențialitate
            </a>
          </div>
          
          <div class="gdpr-categories">
            ${categoriesHTML}
          </div>
        </div>
        
        <div class="gdpr-modal-footer">
          <button class="gdpr-btn gdpr-btn-outline" id="gdpr-reject-all">
            <i class="fas fa-times"></i>
            Respinge toate
          </button>
          <button class="gdpr-btn gdpr-btn-primary" id="gdpr-save-preferences">
            <i class="fas fa-save"></i>
            Salvează preferințele
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('gdpr-close-preferences').addEventListener('click', () => this.removePreferencesModal());
    document.getElementById('gdpr-save-preferences').addEventListener('click', this.savePreferences);
    document.getElementById('gdpr-reject-all').addEventListener('click', this.acceptNecessary);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.removePreferencesModal();
      }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', this.handleEscapeKey);
    
    // Show modal with animation
    setTimeout(() => {
      modal.classList.add('gdpr-modal-visible');
    }, 100);
    
    // CRITICAL: Disable custom website scrolling before applying our modal scroll prevention
    this.disableWebsiteScrolling();
    
    // CRITICAL: Comprehensive background scroll prevention
    this.preventBackgroundScroll();
    
    // CRITICAL: Setup modal-specific scrolling
    this.setupModalScrolling(modal);
  }

  /**
   * Disable the website's custom scrolling functionality
   */
  disableWebsiteScrolling() {
    // Add a flag to body to indicate modal is open
    document.body.setAttribute('data-gdpr-modal-open', 'true');
    
    // Store references to the website's scroll functions for restoration
    this.websiteScrollState = {
      // Disable mobile/desktop event listeners by setting flags
      mobileEventListenersActive: window.mobileEventListenersActive,
      desktopEventListenersActive: window.desktopEventListenersActive,
      isScrolling: window.isScrolling
    };
    
    // Set the website's scrolling flag to prevent interference
    if (typeof window.isScrolling !== 'undefined') {
      window.isScrolling = true; // This will prevent the website's scroll handlers from firing
    }
    
    // Remove the website's aggressive wheel event listeners
    if (window.desktopWheelHandler) {
      window.removeEventListener('wheel', window.desktopWheelHandler);
      document.removeEventListener('wheel', window.desktopWheelHandler);
    }
    
    // Remove the website's touch event listeners
    if (window.touchStartHandler) {
      document.removeEventListener('touchstart', window.touchStartHandler);
    }
    if (window.touchEndHandler) {
      document.removeEventListener('touchend', window.touchEndHandler);
    }
    if (window.touchMoveHandler) {
      document.removeEventListener('touchmove', window.touchMoveHandler);
    }
    if (window.wheelHandler) {
      document.removeEventListener('wheel', window.wheelHandler);
    }
  }

  /**
   * Prevent background scroll with multiple methods
   */
  preventBackgroundScroll() {
    // Store current scroll position
    this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Method 1: Hide overflow
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Method 2: Fix body position (prevents iOS scroll)
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
    
    // Method 3: Add no-scroll class for additional CSS control
    document.body.classList.add('gdpr-modal-open');
    document.documentElement.classList.add('gdpr-modal-open');
  }

  /**
   * Setup modal-specific scrolling that works independently
   */
  setupModalScrolling(modal) {
    const modalBody = modal.querySelector('.gdpr-modal-body');
    const modalContent = modal.querySelector('.gdpr-modal-content');
    
    if (!modalBody || !modalContent) return;
    
    // Create our own scroll event handlers specifically for the modal
    const modalWheelHandler = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Allow natural scrolling within the modal body
      const deltaY = e.deltaY;
      const currentScrollTop = modalBody.scrollTop;
      const maxScrollTop = modalBody.scrollHeight - modalBody.clientHeight;
      
      // Check if we're at the boundaries
      const atTop = currentScrollTop <= 0;
      const atBottom = currentScrollTop >= maxScrollTop;
      
      // Prevent scrolling beyond boundaries
      if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
        e.preventDefault();
      }
    };
    
    const modalTouchStartHandler = (e) => {
      e.stopPropagation();
      this.modalTouchStartY = e.touches[0].clientY;
      this.modalStartScrollTop = modalBody.scrollTop;
    };
    
    const modalTouchMoveHandler = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      if (!this.modalTouchStartY) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = this.modalTouchStartY - currentY;
      const currentScrollTop = modalBody.scrollTop;
      const maxScrollTop = modalBody.scrollHeight - modalBody.clientHeight;
      
      // Check boundaries
      const atTop = currentScrollTop <= 0;
      const atBottom = currentScrollTop >= maxScrollTop;
      
      // Allow scrolling within bounds, prevent when at boundaries
      if ((atTop && deltaY < 0) || (atBottom && deltaY > 0)) {
        e.preventDefault();
      }
    };
    
    const modalTouchEndHandler = (e) => {
      e.stopPropagation();
      this.modalTouchStartY = null;
      this.modalStartScrollTop = null;
    };
    
    // Apply event listeners specifically to modal elements
    modalBody.addEventListener('wheel', modalWheelHandler, { passive: false });
    modalBody.addEventListener('touchstart', modalTouchStartHandler, { passive: true });
    modalBody.addEventListener('touchmove', modalTouchMoveHandler, { passive: false });
    modalBody.addEventListener('touchend', modalTouchEndHandler, { passive: true });
    
    // Store handlers for cleanup
    this.modalScrollHandlers = {
      wheel: modalWheelHandler,
      touchstart: modalTouchStartHandler,
      touchmove: modalTouchMoveHandler,
      touchend: modalTouchEndHandler,
      element: modalBody
    };
    
    // Block all events on the overlay itself
    const blockAllEvents = (e) => {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };
    
    ['wheel', 'touchmove', 'scroll', 'mousewheel', 'DOMMouseScroll'].forEach(eventType => {
      modal.addEventListener(eventType, blockAllEvents, { 
        passive: false, 
        capture: true 
      });
    });
  }

  /**
   * Accept all cookies
   */
  acceptAll() {
    const consent = {
      version: this.config.consentVersion,
      timestamp: new Date().toISOString(),
      categories: {}
    };
    
    // Accept all categories
    Object.keys(this.config.categories).forEach(categoryId => {
      consent.categories[categoryId] = true;
    });
    
    this.saveConsent(consent);
    this.removeBanner();
    this.removePreferencesModal();
  }

  /**
   * Accept only necessary cookies
   */
  acceptNecessary() {
    const consent = {
      version: this.config.consentVersion,
      timestamp: new Date().toISOString(),
      categories: {}
    };
    
    // Accept only necessary categories
    Object.values(this.config.categories).forEach(category => {
      consent.categories[category.id] = category.required;
    });
    
    this.saveConsent(consent);
    this.removeBanner();
    this.removePreferencesModal();
  }

  /**
   * Save custom preferences from modal
   */
  savePreferences() {
    const consent = {
      version: this.config.consentVersion,
      timestamp: new Date().toISOString(),
      categories: {}
    };
    
    // Get preferences from checkboxes
    Object.keys(this.config.categories).forEach(categoryId => {
      const checkbox = document.getElementById(`gdpr-${categoryId}`);
      consent.categories[categoryId] = checkbox ? checkbox.checked : false;
    });
    
    this.saveConsent(consent);
    this.removePreferencesModal();
    this.removeBanner();
  }

  /**
   * Save consent data to storage
   */
  saveConsent(consent) {
    try {
      this.consentData = consent;
      localStorage.setItem(this.config.cookieName, JSON.stringify(consent));
      
      // Apply consent immediately
      this.applyConsent();
      
      // Trigger custom event for external scripts
      document.dispatchEvent(new CustomEvent('gdprConsentChanged', {
        detail: { consent: this.consentData }
      }));
      
      console.log('✅ GDPR consent saved:', consent);
      
    } catch (error) {
      console.error('❌ Error saving consent:', error);
    }
  }

  /**
   * Apply current consent settings
   */
  applyConsent() {
    if (!this.consentData) return;
    
    // Remove non-consented cookies
    this.cleanupCookies();
    
    // Load consented scripts
    this.loadConsentedScripts();
    
    console.log('🍪 Applied consent settings:', this.consentData.categories);
  }

  /**
   * Clean up cookies based on consent
   */
  cleanupCookies() {
    Object.values(this.config.categories).forEach(category => {
      if (!this.hasConsent(category.id)) {
        // Remove cookies for non-consented categories
        category.cookies.forEach(cookieName => {
          this.deleteCookie(cookieName);
        });
      }
    });
  }

  /**
   * Delete a specific cookie
   */
  deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  }

  /**
   * Load scripts based on consent (placeholder for future implementation)
   */
  loadConsentedScripts() {
    // Analytics scripts
    if (this.hasConsent('analytics')) {
      this.loadGoogleAnalytics();
    }
    
    // Marketing scripts
    if (this.hasConsent('marketing')) {
      this.loadMarketingScripts();
    }
  }

  /**
   * Load Google Analytics if consented
   */
  loadGoogleAnalytics() {
    // Example implementation - replace with your GA tracking ID
    if (window.gtag) return; // Already loaded
    
    // Uncomment and modify when you have a GA tracking ID
    /*
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID';
    script.async = true;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_TRACKING_ID');
    */
  }

  /**
   * Load marketing scripts if consented
   */
  loadMarketingScripts() {
    // Example implementation for Facebook Pixel
    // Uncomment and modify when needed
    /*
    if (window.fbq) return; // Already loaded
    
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
    */
  }

  /**
   * Check if user has consent for a specific category
   */
  hasConsent(categoryId) {
    if (!this.consentData) return false;
    return this.consentData.categories[categoryId] === true;
  }

  /**
   * Get current consent data
   */
  getConsent() {
    return this.consentData;
  }

  /**
   * Withdraw all consent and show banner again
   */
  withdrawConsent() {
    localStorage.removeItem(this.config.cookieName);
    this.consentData = null;
    this.cleanupCookies();
    this.showBanner();
  }

  /**
   * Remove cookie banner
   */
  removeBanner() {
    const banner = document.getElementById('gdpr-cookie-banner');
    if (banner) {
      banner.classList.remove('gdpr-banner-visible');
      setTimeout(() => {
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
      }, 300);
    }
  }

  /**
   * Remove preferences modal
   */
  removePreferencesModal() {
    const modal = document.getElementById('gdpr-preferences-modal');
    if (modal) {
      modal.classList.remove('gdpr-modal-visible');
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    }
    
    // CRITICAL: Restore all scroll prevention measures
    this.restoreBackgroundScroll();
    
    // Remove escape key listener
    document.removeEventListener('keydown', this.handleEscapeKey);
  }

  /**
   * Restore background scroll after modal closes
   */
  restoreBackgroundScroll() {
    // Remove no-scroll classes
    document.body.classList.remove('gdpr-modal-open');
    document.documentElement.classList.remove('gdpr-modal-open');
    
    // Remove the flag indicating modal is open
    document.body.removeAttribute('data-gdpr-modal-open');
    
    // Restore overflow
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Restore body position and scroll position
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    // Restore scroll position if it was stored
    if (typeof this.scrollPosition !== 'undefined') {
      window.scrollTo(0, this.scrollPosition);
      this.scrollPosition = undefined;
    }
    
    // CRITICAL: Restore the website's custom scrolling functionality
    this.restoreWebsiteScrolling();
    
    // Clean up modal scroll handlers
    this.cleanupModalScrollHandlers();
  }

  /**
   * Restore the website's custom scrolling functionality
   */
  restoreWebsiteScrolling() {
    // Restore the website's scrolling flag
    if (this.websiteScrollState && typeof window.isScrolling !== 'undefined') {
      window.isScrolling = this.websiteScrollState.isScrolling || false;
    }
    
    // Re-enable the website's scroll system by calling its update function
    // The website's script will automatically re-add the appropriate event listeners
    if (typeof window.updateScrollMode === 'function') {
      setTimeout(() => {
        window.updateScrollMode();
      }, 100);
    }
    
    // Clear stored state
    this.websiteScrollState = null;
  }

  /**
   * Clean up modal-specific scroll handlers
   */
  cleanupModalScrollHandlers() {
    if (this.modalScrollHandlers) {
      const { element, wheel, touchstart, touchmove, touchend } = this.modalScrollHandlers;
      
      if (element) {
        element.removeEventListener('wheel', wheel);
        element.removeEventListener('touchstart', touchstart);
        element.removeEventListener('touchmove', touchmove);
        element.removeEventListener('touchend', touchend);
      }
      
      this.modalScrollHandlers = null;
    }
    
    // Clear modal touch tracking variables
    this.modalTouchStartY = null;
    this.modalStartScrollTop = null;
  }

  /**
   * Handle Escape key press to close modal
   */
  handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      this.removePreferencesModal();
    }
  }
}

// Helper function to check consent from external scripts
window.hasGDPRConsent = function(category) {
  return window.acoomhCookies && window.acoomhCookies.hasConsent(category);
};

// Initialize the GDPR Cookie Manager
new GDPRCookieManager();