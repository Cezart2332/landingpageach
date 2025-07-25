// DEBUGGING: Testează încărcarea script-ului pe hosted
console.log('🚀 AcoomH Script Loading...', new Date().toISOString());
console.log('📱 Device:', navigator.userAgent);

// Test execuție imediată
try {
  console.log('✅ JavaScript engine functional');
} catch (error) {
  console.error('❌ JavaScript error:', error);
}

// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  console.log('🎯 DOM Ready - Starting script execution...');
  
  try {
    // Debugging pentru elemente critice - DECLARATE O SINGURĂ DATĂ
    const phoneVideo = document.getElementById('phone-video');
    const navToggle = document.querySelector(".nav-toggle");
    const heroButtons = document.querySelector(".hero-buttons");

    console.log('📱 Phone video element:', phoneVideo);
    console.log('🍔 Nav toggle element:', navToggle);
    console.log('🔘 Hero buttons element:', heroButtons);

    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    // Enhanced mobile detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    console.log('🔍 Device detection:', { isMobile, isTouch });

    // Mobile-specific scroll handling variables
    let touchStartY = 0;
    let touchEndY = 0;
    let lastTouchTime = 0;
    let scrollThreshold = 50; // Minimum distance for swipe
    let timeThreshold = 300; // Maximum time for swipe (ms)
    let cooldownTime = 1000; // Cooldown between scrolls (ms)
    let lastScrollTime = 0;

    // Disable default scroll behavior on mobile
    if (isMobile || isTouch) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Prevent default scroll on mobile
      document.addEventListener('touchmove', function(e) {
        if (!e.target.closest('.phone-video')) { // Allow video interactions
          e.preventDefault();
        }
      }, { passive: false });
      
      document.addEventListener('wheel', function(e) {
        e.preventDefault();
      }, { passive: false });
    }

    // Fullpage scroll functionality - declare these variables early
    const sections = document.querySelectorAll('section, footer');
    let isScrolling = false;
    let currentSectionIndex = 0;

    // Flag to prevent duplicate handler initialization
    let handlersInitialized = false;

    // Windows-compatible smooth scroll function
    function smoothScrollTo(targetY, duration = 1000) {
      const startY = window.pageYOffset;
      const distance = targetY - startY;
      const startTime = performance.now();

      function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      }

      function animation(currentTime) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutCubic(progress);
        
        window.scrollTo(0, startY + distance * ease);
        
        if (progress < 1) {
          requestAnimationFrame(animation);
        } else {
          isScrolling = false;
        }
      }

      requestAnimationFrame(animation);
    }

    // Update active indicator function - declare early
    function updateIndicators() {
      const dots = document.querySelectorAll('.section-indicator');
      dots.forEach((dot, index) => {
        if (index === currentSectionIndex) {
          dot.style.backgroundColor = 'rgba(139, 92, 246, 1)';
          dot.style.transform = 'scale(1.2)';
        } else {
          dot.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
          dot.style.transform = 'scale(1)';
        }
      });
    }

    // Update the scrollToSection function with Windows-compatible scrolling
    function scrollToSection(index) {
      if (index >= 0 && index < sections.length && !isScrolling) {
          isScrolling = true;
          currentSectionIndex = index;
          updateIndicators();
          
          const section = sections[index];
          const sectionTop = section.offsetTop;
          
          // Add extra offset for the first section to show full content
          const offset = index === 0 ? -20 : 0;
          const targetY = sectionTop + offset;
          
          // Use custom smooth scroll instead of native browser scrolling
          smoothScrollTo(targetY, 800);
      }
    }

    // Toggle mobile menu
    navToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");

      // Animate hamburger
      const bars = navToggle.querySelectorAll(".bar");
      bars.forEach((bar) => bar.classList.toggle("active"));
    });

    // Close menu when clicking on links
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        navMenu.classList.remove("active");
        const bars = navToggle.querySelectorAll(".bar");
        bars.forEach((bar) => bar.classList.remove("active"));
      });
    });

    // Smooth scrolling for navigation links
    navLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          // Calculate offset based on navbar height and section
          const navbarHeight = 70;
          
          // For home section, scroll to the very top
          if (targetId === '#home') {
            isScrolling = true;
            smoothScrollTo(0, 800);
            // Update the fullpage scroll system
            currentSectionIndex = 0;
            updateIndicators();
          } else if (targetId === '#footer') {
            // For footer, scroll to the very bottom to ensure it's fully visible
            isScrolling = true;
            smoothScrollTo(document.documentElement.scrollHeight, 800);
            // Update the fullpage scroll system to footer index
            const footerIndex = Array.from(sections).indexOf(targetSection);
            if (footerIndex !== -1) {
              currentSectionIndex = footerIndex;
              updateIndicators();
            }
          } else {
            // For other sections, account for navbar height
            const elementPosition = targetSection.offsetTop;
            const offsetPosition = elementPosition - navbarHeight;
            
            isScrolling = true;
            smoothScrollTo(offsetPosition, 800);
            
            // Update the fullpage scroll system
            const sectionIndex = Array.from(sections).indexOf(targetSection);
            if (sectionIndex !== -1) {
              currentSectionIndex = sectionIndex;
              updateIndicators();
            }
          }
        }
      });
    });

    // Navbar background on scroll
    const navbar = document.querySelector(".navbar");
    window.addEventListener("scroll", function () {
      if (window.scrollY > 50) {
        navbar.style.background = "rgba(15, 15, 15, 0.98)";
      } else {
        navbar.style.background = "rgba(15, 15, 15, 0.95)";
      }
    });

    // Scroll reveal animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll(
      ".feature-card, .about-text, .mystery-box"
    );
    animateElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });

    // Parallax effect for hero background
    window.addEventListener("scroll", function () {
      const scrolled = window.pageYOffset;
      const parallax = document.querySelector(".hero");
      const speed = scrolled * 0.5;

      if (parallax) {
        parallax.style.transform = `translateY(${speed}px)`;
      }
    });

    // Floating cards animation enhancement
    const cards = document.querySelectorAll(".card");
    cards.forEach((card, index) => {
      card.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-15px) scale(1.05)";
        this.style.zIndex = "10";
      });

      card.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0) scale(1)";
        this.style.zIndex = "1";
      });
    });

    // Button hover effects
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-2px)";
      });

      button.addEventListener("mouseleave", function () {
        this.style.transform = "translateY(0)";
      });
    });

    // Show download popup function
    function showDownloadPopup() {
      // Remove any existing popups first
      const existingPopups = document.querySelectorAll('.popup-overlay');
      existingPopups.forEach(popup => popup.remove());
      
      // Create popup overlay
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.zIndex = '10000';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.backdropFilter = 'blur(10px)';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';

      // Create popup content
      const popup = document.createElement('div');
      popup.className = 'popup-content';
      popup.style.background = 'linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95))';
      popup.style.border = '1px solid #6b46c1';
      popup.style.borderRadius = '25px';
      popup.style.padding = '40px 30px';
      popup.style.textAlign = 'center';
      popup.style.maxWidth = '400px';
      popup.style.width = '90%';
      popup.style.boxShadow = '0 20px 60px rgba(139, 92, 246, 0.4)';
      popup.style.transform = 'scale(0.8) translateY(20px)';
      popup.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      popup.style.position = 'relative';

      // Add popup content
      popup.innerHTML = `
        <div style="margin-bottom: 25px;">
          <i class="fas fa-rocket" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Aplicația nu este încă lansată</h3>
          <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Fii pe fază, ne vom vedea curând!</p>
        </div>
        <button class="popup-close-btn" style="
          background: linear-gradient(135deg, #6b46c1, #7c3aed);
          color: white;
          border: none;
          border-radius: 15px;
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        ">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Înțeles!
        </button>
      `;

      // Add hover effect to close button
      const closeBtn = popup.querySelector('.popup-close-btn');
      closeBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.5)';
      });
      closeBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.3)';
      });

      // Close popup function
      function closePopup() {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 300);
      }

      // Add event listeners
      closeBtn.addEventListener('click', closePopup);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closePopup();
        }
      });

      // Add escape key listener
      const escapeHandler = function(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Add to DOM
      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      // Animate in
      setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 10);
    }

    // Show early access popup function
    function showEarlyAccessPopup() {
      // Remove any existing popups first
      const existingPopups = document.querySelectorAll('.popup-overlay');
      existingPopups.forEach(popup => popup.remove());
      
      // Create popup overlay
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.zIndex = '10000';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.backdropFilter = 'blur(10px)';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';

      // Create popup content
      const popup = document.createElement('div');
      popup.className = 'popup-content';
      popup.style.background = 'linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95))';
      popup.style.border = '1px solid #6b46c1';
      popup.style.borderRadius = '25px';
      popup.style.padding = '40px 30px';
      popup.style.textAlign = 'center';
      popup.style.maxWidth = '400px';
      popup.style.width = '90%';
      popup.style.boxShadow = '0 20px 60px rgba(139, 92, 246, 0.4)';
      popup.style.transform = 'scale(0.8) translateY(20px)';
      popup.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      popup.style.position = 'relative';

      // Add popup content
      popup.innerHTML = `
        <div style="margin-bottom: 25px;">
          <i class="fas fa-clock" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Aplicația nu este încă lansată</h3>
          <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Fii pe fază, ne vom vedea curând!</p>
        </div>
        <button class="popup-close-btn" style="
          background: linear-gradient(135deg, #6b46c1, #7c3aed);
          color: white;
          border: none;
          border-radius: 15px;
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        ">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Înțeles!
        </button>
      `;

      // Add hover effect to close button
      const closeBtn = popup.querySelector('.popup-close-btn');
      closeBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.5)';
      });
      closeBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.3)';
      });

      // Close popup function
      function closePopup() {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 300);
      }

      // Add event listeners
      closeBtn.addEventListener('click', closePopup);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closePopup();
        }
      });

      // Add escape key listener
      const escapeHandler = function(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Add to DOM
      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      // Animate in
      setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 10);
    }

    // Show reservation popup function
    function showReservationPopup() {
      // Remove any existing popups first
      const existingPopups = document.querySelectorAll('.popup-overlay');
      existingPopups.forEach(popup => popup.remove());
      
      // Create popup overlay
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.zIndex = '10000';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.backdropFilter = 'blur(10px)';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';

      // Create popup content
      const popup = document.createElement('div');
      popup.className = 'popup-content';
      popup.style.background = 'linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95))';
      popup.style.border = '1px solid #6b46c1';
      popup.style.borderRadius = '25px';
      popup.style.padding = '40px 30px';
      popup.style.textAlign = 'center';
      popup.style.maxWidth = '400px';
      popup.style.width = '90%';
      popup.style.boxShadow = '0 20px 60px rgba(139, 92, 246, 0.4)';
      popup.style.transform = 'scale(0.8) translateY(20px)';
      popup.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      popup.style.position = 'relative';

      // Add popup content
      popup.innerHTML = `
        <div style="margin-bottom: 25px;">
          <i class="fas fa-wrench" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Funcționalitate în dezvoltare</h3>
          <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Această funcționalitate este încă în dezvoltare</p>
        </div>
        <button class="popup-close-btn" style="
          background: linear-gradient(135deg, #6b46c1, #7c3aed);
          color: white;
          border: none;
          border-radius: 15px;
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        ">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Înțeles!
        </button>
      `;

      // Add hover effect to close button
      const closeBtn = popup.querySelector('.popup-close-btn');
      closeBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 15px 35px rgba(139, 92, 246, 0.5)';
      });
      closeBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.3)';
      });

      // Close popup function
      function closePopup() {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 300);
      }

      // Add event listeners
      closeBtn.addEventListener('click', closePopup);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closePopup();
        }
      });

      // Add escape key listener
      const escapeHandler = function(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);

      // Add to DOM
      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      // Animate in
      setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 10);
    }

    // SINGLE, CLEAN button handler initialization
    function initializeButtonHandlers() {
      if (handlersInitialized) {
        return;
      }
      
      // Hero section buttons - Simple approach without cloning
      const heroButtons = document.querySelector(".hero-buttons");
      if (heroButtons) {
        const allHeroButtons = heroButtons.querySelectorAll("button");
        
        if (allHeroButtons.length >= 2) {
          // Rezervări button (first button)
          allHeroButtons[0].addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            showReservationPopup();
          });
          
          // Download button (second button)
          allHeroButtons[1].addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            showDownloadPopup();
          });
        }
      }
      
      // CTA section buttons - Simple approach without cloning
      const ctaSection = document.querySelector(".cta");
      if (ctaSection) {
        const ctaButtons = ctaSection.querySelector(".cta-buttons");
        if (ctaButtons) {
          const allCtaButtons = ctaButtons.querySelectorAll("button");
          
          allCtaButtons.forEach(button => {
            button.addEventListener("click", function(e) {
              e.preventDefault();
              e.stopPropagation();
              
              const buttonText = this.textContent.trim().toLowerCase();
              
              if (buttonText.includes("descarcă") || buttonText.includes("download")) {
                showDownloadPopup();
              } else if (buttonText.includes("acces") || buttonText.includes("anticipat")) {
                showEarlyAccessPopup();
              }
            });
          });
        }
      }

      handlersInitialized = true;
    }

    // Initialize ONLY once, with a delay to ensure DOM is ready
    setTimeout(() => {
      initializeButtonHandlers();
    }, 2000); // Wait 2 seconds for full page load including hosted environments

    // Mystery box interaction
    const mysteryBox = document.querySelector(".mystery-box");
    if (mysteryBox) {
      mysteryBox.addEventListener("click", function () {
        const content = this.querySelector(".box-content i");
        const icons = ["fa-question", "fa-eye", "fa-mask", "fa-star", "fa-magic"];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];

        content.className = `fas ${randomIcon}`;

        // Add ripple effect
        const ripple = document.createElement("div");
        ripple.style.position = "absolute";
        ripple.style.borderRadius = "50%";
        ripple.style.background = "rgba(139, 92, 246, 0.3)";
        ripple.style.transform = "scale(0)";
        ripple.style.animation = "ripple 0.6s linear";
        ripple.style.left = "50%";
        ripple.style.top = "50%";
        ripple.style.width = "20px";
        ripple.style.height = "20px";
        ripple.style.marginLeft = "-10px";
        ripple.style.marginTop = "-10px";

        this.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    }

    // Character-by-character text reveal animation - VERSIUNE RAPIDĂ
    function initCharacterRevealAnimation() {
      const textElements = document.querySelectorAll(".text-reveal");
      
      if (textElements.length > 0) {
        let totalDelay = 0;
        
        textElements.forEach((element, wordIndex) => {
          const text = element.textContent;
          element.innerHTML = ""; // Clear the text
          
          // Add animate class to show the element
          element.classList.add("animate");
          
          // Split text into characters and wrap each in a span
          const chars = text.split("").map((char, charIndex) => {
            const span = document.createElement("span");
            span.className = "char";
            span.textContent = char === " " ? "\u00A0" : char; // Use non-breaking space
            span.style.animationDelay = `${totalDelay + (charIndex * 40)}ms`; // RAPID: 40ms în loc de 80ms
            return span;
          });
          
          // Add all character spans to the element
          chars.forEach(char => element.appendChild(char));
          
          // Update total delay for next word (add time for all chars + word gap)
          totalDelay += (text.length * 40) + 200; // RAPID: 200ms gap în loc de 400ms
        });
      }
    }

    // Initialize character reveal animation on page load - RAPID
    setTimeout(() => {
      initCharacterRevealAnimation();
    }, 400); // RAPID: 400ms în loc de 800ms

    // Enhanced subtitle animation - RAPID
    const heroSubtitle = document.querySelector(".hero-subtitle");
    
    if (heroSubtitle) {
      heroSubtitle.style.opacity = "0";
      heroSubtitle.style.transform = "translateY(30px)";
      heroSubtitle.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      
      setTimeout(() => {
        heroSubtitle.style.opacity = "1";
        heroSubtitle.style.transform = "translateY(0)";
      }, 2200); // RAPID: 2200ms în loc de 3500ms
    }

    if (heroButtons) {
      heroButtons.style.opacity = "0";
      heroButtons.style.transform = "translateY(30px)";
      heroButtons.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      
      setTimeout(() => {
        heroButtons.style.opacity = "1";
        heroButtons.style.transform = "translateY(0)";
      }, 2600); // RAPID: 2600ms în loc de 3900ms
    }

    // Mobile touch swipe handling - TikTok style
    if (isMobile || isTouch) {
      console.log('📱 Activating mobile TikTok-style scroll...');
      
      // Touch event handlers for swipe detection
      document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
          return; // Allow normal interaction with video and popups
        }
        
        touchStartY = e.touches[0].clientY;
        lastTouchTime = Date.now();
      }, { passive: true });

      document.addEventListener('touchend', function(e) {
        if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
          return; // Allow normal interaction with video and popups
        }
        
        const currentTime = Date.now();
        touchEndY = e.changedTouches[0].clientY;
        
        const touchDistance = Math.abs(touchStartY - touchEndY);
        const touchTime = currentTime - lastTouchTime;
        const timeSinceLastScroll = currentTime - lastScrollTime;
        
        // Check if it's a valid swipe (like TikTok)
        if (touchDistance > scrollThreshold && 
            touchTime < timeThreshold && 
            timeSinceLastScroll > cooldownTime && 
            !isScrolling) {
          
          lastScrollTime = currentTime;
          
          // Determine direction and scroll
          if (touchStartY > touchEndY) {
            // Swipe up - next section
            scrollToSection(currentSectionIndex + 1);
          } else {
            // Swipe down - previous section
            scrollToSection(currentSectionIndex - 1);
          }
        }
      }, { passive: true });

      // Also handle fast swipes (shorter distance but very quick)
      document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
          return;
        }
        
        const currentY = e.touches[0].clientY;
        const currentTime = Date.now();
        const distance = Math.abs(touchStartY - currentY);
        const time = currentTime - lastTouchTime;
        
        // Detect very fast swipes (TikTok style)
        if (distance > 30 && time < 150 && !isScrolling) {
          const timeSinceLastScroll = currentTime - lastScrollTime;
          
          if (timeSinceLastScroll > cooldownTime) {
            lastScrollTime = currentTime;
            
            if (touchStartY > currentY) {
              // Fast swipe up
              scrollToSection(currentSectionIndex + 1);
            } else {
              // Fast swipe down
              scrollToSection(currentSectionIndex - 1);
            }
          }
        }
      }, { passive: true });
    }

    // Video playback observer cu debugging
    if (phoneVideo) {
      console.log('🎥 Configurez video handler...');
      console.log('Video element găsit:', phoneVideo);
      console.log('Video src:', phoneVideo.src);
      console.log('Video currentSrc:', phoneVideo.currentSrc);
      
      // Verifică dacă video-ul se încarcă
      phoneVideo.addEventListener('loadstart', () => {
        console.log('Video loadstart - începe încărcarea');
      });
      
      phoneVideo.addEventListener('loadedmetadata', () => {
        console.log('Video metadata încărcată');
        console.log('Video dimensions:', phoneVideo.videoWidth + 'x' + phoneVideo.videoHeight);
        console.log('Video duration:', phoneVideo.duration);
      });
      
      phoneVideo.addEventListener('error', (e) => {
        console.error('Video error:', e);
        console.error('Error code:', phoneVideo.error?.code);
        console.error('Error message:', phoneVideo.error?.message);
      });
      
      // Verifică dimensiunile container-ului
      const phoneScreen = document.querySelector('.phone-screen');
      if (phoneScreen) {
        console.log('Phone screen dimensions:', {
          width: phoneScreen.offsetWidth,
          height: phoneScreen.offsetHeight,
          computed: getComputedStyle(phoneScreen)
        });
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }

  // Create section indicators
  const indicators = document.createElement('div');
  indicators.className = 'section-indicators';
  indicators.style.position = 'fixed';
  indicators.style.right = '20px';
  indicators.style.top = '50%';
  indicators.style.transform = 'translateY(-50%)';
  indicators.style.zIndex = '1000';
  indicators.style.display = 'flex';
  indicators.style.flexDirection = 'column';
  indicators.style.gap = '10px';

  sections.forEach((section, index) => {
    const dot = document.createElement('div');
    dot.className = 'section-indicator';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.borderRadius = '50%';
    dot.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
    dot.style.cursor = 'pointer';
    dot.style.transition = 'all 0.3s ease';
    dot.setAttribute('data-section', section.id || `section-${index}`);
    
    dot.addEventListener('click', () => {
      if (!isScrolling) {
        scrollToSection(index);
      }
    });
    
    indicators.appendChild(dot);
  });

  document.body.appendChild(indicators);

  // Handle wheel events
  window.addEventListener('wheel', (e) => {
    if (!isScrolling) {
      // Check if we're at the footer and scrolling down (allow natural scroll within footer)
      const footer = document.querySelector('#footer');
      const footerRect = footer.getBoundingClientRect();
      const isInFooter = footerRect.top <= 0 && footerRect.bottom >= window.innerHeight;
      
      // Only allow natural scroll if we're IN the footer and scrolling down
      if (isInFooter && e.deltaY > 0) {
        return; // Don't prevent default, allow natural scroll within footer
      }
      
      // Normal snap scroll behavior for all other cases
      if (e.deltaY > 0) {
        scrollToSection(currentSectionIndex + 1);
      } else {
        scrollToSection(currentSectionIndex - 1);
      }
    }
    e.preventDefault();
  }, { passive: false });

  // Handle keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (!isScrolling) {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        scrollToSection(currentSectionIndex + 1);
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        scrollToSection(currentSectionIndex - 1);
        e.preventDefault();
      }
    }
  });

  // Update current section on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!isScrolling) {
        const currentScroll = window.scrollY;
        sections.forEach((section, index) => {
          const rect = section.getBoundingClientRect();
          if (rect.top >= -100 && rect.top <= 100) {
            currentSectionIndex = index;
            updateIndicators();
          }
        });
      }
    }, 50);
  });

  // Initialize first section
  updateIndicators();

  // Mobile-specific scroll handling variables
  let touchStartY = 0;
  let touchEndY = 0;
  let lastTouchTime = 0;
  let scrollThreshold = 50; // Minimum distance for swipe
  let timeThreshold = 300; // Maximum time for swipe (ms)
  let cooldownTime = 1000; // Cooldown between scrolls (ms)
  let lastScrollTime = 0;

  // Disable default scroll behavior on mobile
  if (isMobile || isTouch) {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Prevent default scroll on mobile
    document.addEventListener('touchmove', function(e) {
      if (!e.target.closest('.phone-video')) { // Allow video interactions
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('wheel', function(e) {
      e.preventDefault();
    }, { passive: false });
  }

  // Simple hover effects for circular icons
  function initCircularIcons() {
    const iconItems = document.querySelectorAll('.icon-item');
    const circularContainer = document.querySelector('.circular-icons');
    
    if (iconItems.length === 0 || !circularContainer) return;
    
    // No more pause/resume functionality - circle rotates continuously
    // Icons will only scale on individual hover via CSS
  }
  
  // Initialize circular icons when the about section comes into view
  const aboutSection = document.querySelector('#about');
  if (aboutSection) {
    const aboutObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            initCircularIcons();
          }, 500);
          aboutObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    
    aboutObserver.observe(aboutSection);
  }

  // Video playback observer - folosește variabila phoneVideo declarată mai sus
  if (phoneVideo) {
    // Verifică dacă video-ul se încarcă
    phoneVideo.addEventListener('loadstart', () => {
      console.log('Video loadstart - începe încărcarea');
    });
    
    phoneVideo.addEventListener('loadedmetadata', () => {
      console.log('Video metadata încărcată');
      console.log('Video dimensions:', phoneVideo.videoWidth + 'x' + phoneVideo.videoHeight);
      console.log('Video duration:', phoneVideo.duration);
    });
    
    phoneVideo.addEventListener('error', (e) => {
      console.error('Video error:', e);
      console.error('Error code:', phoneVideo.error?.code);
      console.error('Error message:', phoneVideo.error?.message);
      // Afișează fallback dacă video-ul nu se încarcă
      showVideoFallback();
    });
    
    // Verifică dimensiunile container-ului
    const phoneScreen = document.querySelector('.phone-screen');
    if (phoneScreen) {
      console.log('Phone screen dimensions:', {
        width: phoneScreen.offsetWidth,
        height: phoneScreen.offsetHeight,
        computed: getComputedStyle(phoneScreen)
      });
    }
    
    function showVideoFallback() {
      const fallback = phoneVideo.parentElement.querySelector('.video-fallback');
      if (fallback) {
        fallback.style.display = 'flex';
        fallback.style.opacity = '1';
        console.log('Fallback afișat pentru video');
      }
    }
    
    function hideVideoFallback() {
      const fallback = phoneVideo.parentElement.querySelector('.video-fallback');
      if (fallback) {
        fallback.style.display = 'none';
        fallback.style.opacity = '0';
      }
    }
    
    // Forțează încărcarea video-ului
    phoneVideo.load();
    
    // Încearcă să ruleze video-ul când devine vizibil
    const aboutSection = document.querySelector('#about');
    if (aboutSection) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            console.log('About section vizibilă, încearcă să ruleze video-ul');
            phoneVideo.play().catch(error => {
              console.log('Autoplay blocat:', error);
              console.log('Video va fi rulat la prima interacțiune');
            });
          }
        });
      }, { threshold: 0.1 });
      
      videoObserver.observe(aboutSection);
    }
    
    // Rulează video la prima interacțiune utilizator
    let userInteracted = false;
    function handleFirstInteraction() {
      if (!userInteracted) {
        userInteracted = true;
        console.log('Prima interacțiune detectată, rulează video-ul');
        phoneVideo.play().catch(console.log);
      }
    }
    
    ['click', 'touchstart', 'keydown'].forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true });
    });
  }

  // Add CSS for ripple animation
  const style = document.createElement("style");
  style.textContent = `
      @keyframes ripple {
          to {
              transform: scale(4);
              opacity: 0;
          }
      }
      
      .particle {
          animation: twinkle 2s ease-in-out infinite;
      }
      
      @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
      }
  `;
  document.head.appendChild(style);

  // Mobile touch swipe handling - TikTok style
  if (isMobile || isTouch) {
    // Touch event handlers for swipe detection
    document.addEventListener('touchstart', function(e) {
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return; // Allow normal interaction with video and popups
      }
      
      touchStartY = e.touches[0].clientY;
      lastTouchTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return; // Allow normal interaction with video and popups
      }
      
      const currentTime = Date.now();
      touchEndY = e.changedTouches[0].clientY;
      
      const touchDistance = Math.abs(touchStartY - touchEndY);
      const touchTime = currentTime - lastTouchTime;
      const timeSinceLastScroll = currentTime - lastScrollTime;
      
      // Check if it's a valid swipe (like TikTok)
      if (touchDistance > scrollThreshold && 
          touchTime < timeThreshold && 
          timeSinceLastScroll > cooldownTime && 
          !isScrolling) {
        
        lastScrollTime = currentTime;
        
        // Determine direction and scroll
        if (touchStartY > touchEndY) {
          // Swipe up - next section
          scrollToSection(currentSectionIndex + 1);
        } else {
          // Swipe down - previous section
          scrollToSection(currentSectionIndex - 1);
        }
      }
    }, { passive: true });

    // Also handle fast swipes (shorter distance but very quick)
    document.addEventListener('touchmove', function(e) {
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return;
      }
      
      const currentY = e.touches[0].clientY;
      const currentTime = Date.now();
      const distance = Math.abs(touchStartY - currentY);
      const time = currentTime - lastTouchTime;
      
      // Detect very fast swipes (TikTok style)
      if (distance > 30 && time < 150 && !isScrolling) {
        const timeSinceLastScroll = currentTime - lastScrollTime;
        
        if (timeSinceLastScroll > cooldownTime) {
          lastScrollTime = currentTime;
          
          if (touchStartY > currentY) {
            // Fast swipe up
            scrollToSection(currentSectionIndex + 1);
          } else {
            // Fast swipe down
            scrollToSection(currentSectionIndex - 1);
          }
        }
      }
    }, { passive: true });
  }

  // Enhanced scrollToSection for mobile with momentum
  function scrollToSectionMobile(index) {
    if (index >= 0 && index < sections.length && !isScrolling) {
      isScrolling = true;
      currentSectionIndex = index;
      updateIndicators();
      
      const section = sections[index];
      const sectionTop = section.offsetTop;
      
      // Mobile-optimized scroll with momentum effect
      const startY = window.pageYOffset;
      const targetY = sectionTop;
      const distance = targetY - startY;
      const duration = 600; // Faster on mobile
      const startTime = performance.now();

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function animateScroll(currentTime) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeOutCubic(progress);
        
        window.scrollTo(0, startY + distance * ease);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        } else {
          isScrolling = false;
        }
      }

      requestAnimationFrame(animateScroll);
    }
  }

  // Override scrollToSection for mobile devices
  if (isMobile || isTouch) {
    // Replace the existing scrollToSection with mobile version
    window.scrollToSection = scrollToSectionMobile;
  }
});
