// AcoomH - Landing Page Script
// Clean, production-ready version

document.addEventListener("DOMContentLoaded", function () {
  try {
    // Essential DOM elements
    const phoneVideo = document.getElementById('phone-video');
    const navToggle = document.querySelector(".nav-toggle");
    const heroButtons = document.querySelector(".hero-buttons");
    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    // Simplified universal device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isLargeScreen = window.innerWidth > 1024;
    const isDesktopDevice = !isMobile && isLargeScreen;
    
    // Use mobile scroll for actual mobile devices only
    const useMobileScroll = isMobile && window.innerWidth <= 1024;
    // Use universal scroll for all desktop/laptop devices
    const useUniversalScroll = isDesktopDevice;

    // Debug logging
    console.log('Universal Device Detection:', {
      isMobile,
      isTouch,
      isLargeScreen,
      isDesktopDevice,
      useMobileScroll,
      useUniversalScroll,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      windowWidth: window.innerWidth
    });

    // Scroll functionality variables
    const sections = document.querySelectorAll('section, footer');
    let isScrolling = false;
    let currentSectionIndex = 0;
    let handlersInitialized = false;
    
    // Windows scroll debouncing variables
    let wheelTimeout;
    let wheelCount = 0;
    let lastWheelTime = 0;
    const wheelDebounceTime = 150; // ms
    const maxWheelEvents = 3; // max events to consider as single scroll

    // Mobile touch variables
    let touchStartY = 0;
    let touchEndY = 0;
    let lastTouchTime = 0;
    let scrollThreshold = 50;
    let timeThreshold = 300;
    let cooldownTime = 1000;
    let lastScrollTime = 0;

    // Smooth scroll function
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

    // Update section indicators
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

    // Scroll to section
    function scrollToSection(index) {
      if (index >= 0 && index < sections.length && !isScrolling) {
          isScrolling = true;
          currentSectionIndex = index;
          updateIndicators();
          
          const section = sections[index];
          const sectionTop = section.offsetTop;
          const offset = index === 0 ? -20 : 0;
          const targetY = sectionTop + offset;
          
          smoothScrollTo(targetY, 800);
      }
    }

    // Mobile scroll to section
    function scrollToSectionMobile(index) {
      if (index >= 0 && index < sections.length && !isScrolling) {
        isScrolling = true;
        currentSectionIndex = index;
        updateIndicators();
        
        const section = sections[index];
        const sectionTop = section.offsetTop;
        
        const startY = window.pageYOffset;
        const targetY = sectionTop;
        const distance = targetY - startY;
        const duration = 600;
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

    // Mobile behavior (TikTok-style scroll)
    if (useMobileScroll) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      document.addEventListener('touchmove', function(e) {
        if (!e.target.closest('.phone-video')) {
          e.preventDefault();
        }
      }, { passive: false });
      
      document.addEventListener('wheel', function(e) {
        e.preventDefault();
      }, { passive: false });

      // Touch handlers
      document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
          return;
        }
        touchStartY = e.touches[0].clientY;
        lastTouchTime = Date.now();
      }, { passive: true });

      document.addEventListener('touchend', function(e) {
        if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
          return;
        }
        
        const currentTime = Date.now();
        touchEndY = e.changedTouches[0].clientY;
        
        const touchDistance = Math.abs(touchStartY - touchEndY);
        const touchTime = currentTime - lastTouchTime;
        const timeSinceLastScroll = currentTime - lastScrollTime;
        
        if (touchDistance > scrollThreshold && 
            touchTime < timeThreshold && 
            timeSinceLastScroll > cooldownTime && 
            !isScrolling) {
          
          lastScrollTime = currentTime;
          
          if (touchStartY > touchEndY) {
            scrollToSectionMobile(currentSectionIndex + 1);
          } else {
            scrollToSectionMobile(currentSectionIndex - 1);
          }
        }
      }, { passive: true });

      document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
          return;
        }
        
        const currentY = e.touches[0].clientY;
        const currentTime = Date.now();
        const distance = Math.abs(touchStartY - currentY);
        const time = currentTime - lastTouchTime;
        
        if (distance > 30 && time < 150 && !isScrolling) {
          const timeSinceLastScroll = currentTime - lastScrollTime;
          
          if (timeSinceLastScroll > cooldownTime) {
            lastScrollTime = currentTime;
            
            if (touchStartY > currentY) {
              scrollToSectionMobile(currentSectionIndex + 1);
            } else {
              scrollToSectionMobile(currentSectionIndex - 1);
            }
          }
        }
      }, { passive: true });
    }

    // Universal TikTok-style scroll behavior for all desktop/laptop devices
    if (useUniversalScroll) {
      let scrollTimeout;
      let scrollDeltaY = 0;
      let isUniversalScrolling = false;
      let lastScrollTime = 0;
      const scrollCooldown = 200; // Fast response time
      
      // Lock scrolling like TikTok - no free scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      window.addEventListener('wheel', (e) => {
        const currentTime = Date.now();
        
        // Prevent scrolling when already animating
        if (isScrolling || isUniversalScrolling) {
          e.preventDefault();
          return;
        }
        
        // Check cooldown to prevent rapid triggering
        if ((currentTime - lastScrollTime) < scrollCooldown) {
          e.preventDefault();
          return;
        }
        
        // Accumulate delta for all types of scroll input
        scrollDeltaY += e.deltaY;
        
        clearTimeout(scrollTimeout);
        
        // Very low threshold - works for trackpads, mice, and all input types
        scrollTimeout = setTimeout(() => {
          if (Math.abs(scrollDeltaY) > 1 && !isScrolling && !isUniversalScrolling) {
            isUniversalScrolling = true;
            lastScrollTime = currentTime;
            
            // Handle footer edge case
            const footer = document.querySelector('#footer');
            if (footer) {
              const footerRect = footer.getBoundingClientRect();
              const isInFooter = footerRect.top <= 0 && footerRect.bottom >= window.innerHeight;
              
              if (isInFooter && scrollDeltaY > 0) {
                scrollDeltaY = 0;
                isUniversalScrolling = false;
                e.preventDefault();
                return;
              }
            }
            
            if (scrollDeltaY > 0) {
              scrollToSection(currentSectionIndex + 1);
            } else {
              scrollToSection(currentSectionIndex - 1);
            }
            
            scrollDeltaY = 0;
            
            // Reset scrolling flag after animation
            setTimeout(() => {
              isUniversalScrolling = false;
            }, 200);
          } else {
            scrollDeltaY = 0;
            isUniversalScrolling = false;
          }
        }, 30); // Very fast response time
        
        e.preventDefault();
      }, { passive: false });

      // Keyboard navigation
      window.addEventListener('keydown', (e) => {
        if (!isScrolling && !isUniversalScrolling) {
          if (e.key === 'ArrowDown' || e.key === 'PageDown') {
            scrollToSection(currentSectionIndex + 1);
            e.preventDefault();
          } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
            scrollToSection(currentSectionIndex - 1);
            e.preventDefault();
          }
        }
      });
    }

    // Text reveal animation
    function initCharacterRevealAnimation() {
      const textElements = document.querySelectorAll(".text-reveal");
      
      if (textElements.length > 0) {
        let totalDelay = 0;
        
        textElements.forEach((element, wordIndex) => {
          const text = element.textContent;
          element.innerHTML = "";
          element.classList.add("animate");
          
          const chars = text.split("").map((char, charIndex) => {
            const span = document.createElement("span");
            span.className = "char";
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.animationDelay = `${totalDelay + (charIndex * 40)}ms`;
            return span;
          });
          
          chars.forEach(char => element.appendChild(char));
          totalDelay += (text.length * 40) + 200;
        });
      }
    }

    // Initialize animations
    setTimeout(() => {
      initCharacterRevealAnimation();
    }, 400);

    // Subtitle and button animations
    const heroSubtitle = document.querySelector(".hero-subtitle");
    
    if (heroSubtitle) {
      heroSubtitle.style.opacity = "0";
      heroSubtitle.style.transform = "translateY(30px)";
      heroSubtitle.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      
      setTimeout(() => {
        heroSubtitle.style.opacity = "1";
        heroSubtitle.style.transform = "translateY(0)";
      }, 2200);
    }

    if (heroButtons) {
      heroButtons.style.opacity = "0";
      heroButtons.style.transform = "translateY(30px)";
      heroButtons.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      
      setTimeout(() => {
        heroButtons.style.opacity = "1";
        heroButtons.style.transform = "translateY(0)";
      }, 2600);
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
          if (isMobile) {
            scrollToSectionMobile(index);
          } else {
            scrollToSection(index);
          }
        }
      });
      
      indicators.appendChild(dot);
    });

    document.body.appendChild(indicators);
    updateIndicators();

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

    // Mobile navigation
    navToggle.addEventListener("click", function () {
      navMenu.classList.toggle("active");
      const bars = navToggle.querySelectorAll(".bar");
      bars.forEach((bar) => bar.classList.toggle("active"));
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        navMenu.classList.remove("active");
        const bars = navToggle.querySelectorAll(".bar");
        bars.forEach((bar) => bar.classList.remove("active"));
      });
    });

    // Navigation link scrolling
    navLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          const navbarHeight = 70;
          
          if (targetId === '#home') {
            isScrolling = true;
            smoothScrollTo(0, 800);
            currentSectionIndex = 0;
            updateIndicators();
          } else if (targetId === '#footer') {
            isScrolling = true;
            smoothScrollTo(document.documentElement.scrollHeight, 800);
            const footerIndex = Array.from(sections).indexOf(targetSection);
            if (footerIndex !== -1) {
              currentSectionIndex = footerIndex;
              updateIndicators();
            }
          } else {
            const elementPosition = targetSection.offsetTop;
            const offsetPosition = elementPosition - navbarHeight;
            
            isScrolling = true;
            smoothScrollTo(offsetPosition, 800);
            
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

    const animateElements = document.querySelectorAll(
      ".feature-card, .about-text, .mystery-box"
    );
    animateElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(30px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(el);
    });

    // Parallax effect
    window.addEventListener("scroll", function () {
      const scrolled = window.pageYOffset;
      const parallax = document.querySelector(".hero");
      const speed = scrolled * 0.5;

      if (parallax) {
        parallax.style.transform = `translateY(${speed}px)`;
      }
    });

    // Card hover effects
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

    // Popup functions
    function showDownloadPopup() {
      const existingPopups = document.querySelectorAll('.popup-overlay');
      existingPopups.forEach(popup => popup.remove());
      
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(10px); opacity: 0; transition: opacity 0.3s ease;
      `;

      const popup = document.createElement('div');
      popup.className = 'popup-content';
      popup.style.cssText = `
        background: linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95));
        border: 1px solid #6b46c1; border-radius: 25px; padding: 40px 30px;
        text-align: center; max-width: 400px; width: 90%;
        box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `;

      popup.innerHTML = `
        <div style="margin-bottom: 25px;">
          <i class="fas fa-rocket" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Aplicația nu este încă lansată</h3>
          <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Fii pe fază, ne vom vedea curând!</p>
        </div>
        <button class="popup-close-btn" style="
          background: linear-gradient(135deg, #6b46c1, #7c3aed); color: white; border: none;
          border-radius: 15px; padding: 12px 30px; font-size: 1rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        ">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Înțeles!
        </button>
      `;

      function closePopup() {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => document.body.removeChild(overlay), 300);
      }

      popup.querySelector('.popup-close-btn').addEventListener('click', closePopup);
      overlay.addEventListener('click', (e) => e.target === overlay && closePopup());
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escHandler);
        }
      });

      overlay.appendChild(popup);
      document.body.appendChild(overlay);
      setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 10);
    }

    function showEarlyAccessPopup() {
      // Similar to showDownloadPopup but with clock icon
      const existingPopups = document.querySelectorAll('.popup-overlay');
      existingPopups.forEach(popup => popup.remove());
      
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(10px); opacity: 0; transition: opacity 0.3s ease;
      `;

      const popup = document.createElement('div');
      popup.className = 'popup-content';
      popup.style.cssText = `
        background: linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95));
        border: 1px solid #6b46c1; border-radius: 25px; padding: 40px 30px;
        text-align: center; max-width: 400px; width: 90%;
        box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `;

      popup.innerHTML = `
        <div style="margin-bottom: 25px;">
          <i class="fas fa-clock" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Aplicația nu este încă lansată</h3>
          <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Fii pe fază, ne vom vedea curând!</p>
        </div>
        <button class="popup-close-btn" style="
          background: linear-gradient(135deg, #6b46c1, #7c3aed); color: white; border: none;
          border-radius: 15px; padding: 12px 30px; font-size: 1rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        ">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Înțeles!
        </button>
      `;

      function closePopup() {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => document.body.removeChild(overlay), 300);
      }

      popup.querySelector('.popup-close-btn').addEventListener('click', closePopup);
      overlay.addEventListener('click', (e) => e.target === overlay && closePopup());
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escHandler);
        }
      });

      overlay.appendChild(popup);
      document.body.appendChild(overlay);
      setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 10);
    }

    function showReservationPopup() {
      // Similar structure with wrench icon
      const existingPopups = document.querySelectorAll('.popup-overlay');
      existingPopups.forEach(popup => popup.remove());
      
      const overlay = document.createElement('div');
      overlay.className = 'popup-overlay';
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(10px); opacity: 0; transition: opacity 0.3s ease;
      `;

      const popup = document.createElement('div');
      popup.className = 'popup-content';
      popup.style.cssText = `
        background: linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95));
        border: 1px solid #6b46c1; border-radius: 25px; padding: 40px 30px;
        text-align: center; max-width: 400px; width: 90%;
        box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
        transform: scale(0.8) translateY(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `;

      popup.innerHTML = `
        <div style="margin-bottom: 25px;">
          <i class="fas fa-wrench" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
          <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Funcționalitate în dezvoltare</h3>
          <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Această funcționalitate este încă în dezvoltare</p>
        </div>
        <button class="popup-close-btn" style="
          background: linear-gradient(135deg, #6b46c1, #7c3aed); color: white; border: none;
          border-radius: 15px; padding: 12px 30px; font-size: 1rem; font-weight: 600;
          cursor: pointer; transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        ">
          <i class="fas fa-check" style="margin-right: 8px;"></i>
          Înțeles!
        </button>
      `;

      function closePopup() {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => document.body.removeChild(overlay), 300);
      }

      popup.querySelector('.popup-close-btn').addEventListener('click', closePopup);
      overlay.addEventListener('click', (e) => e.target === overlay && closePopup());
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          closePopup();
          document.removeEventListener('keydown', escHandler);
        }
      });

      overlay.appendChild(popup);
      document.body.appendChild(overlay);
      setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
      }, 10);
    }

    // Button handlers
    function initializeButtonHandlers() {
      if (handlersInitialized) return;
      
      const heroButtons = document.querySelector(".hero-buttons");
      if (heroButtons) {
        const allHeroButtons = heroButtons.querySelectorAll("button");
        if (allHeroButtons.length >= 2) {
          allHeroButtons[0].addEventListener("click", (e) => {
            e.preventDefault();
            showReservationPopup();
          });
          allHeroButtons[1].addEventListener("click", (e) => {
            e.preventDefault();
            showDownloadPopup();
          });
        }
      }
      
      const ctaSection = document.querySelector(".cta");
      if (ctaSection) {
        const ctaButtons = ctaSection.querySelector(".cta-buttons");
        if (ctaButtons) {
          ctaButtons.querySelectorAll("button").forEach(button => {
            button.addEventListener("click", (e) => {
              e.preventDefault();
              const buttonText = button.textContent.trim().toLowerCase();
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

    setTimeout(initializeButtonHandlers, 2000);

    // Mystery box interaction
    const mysteryBox = document.querySelector(".mystery-box");
    if (mysteryBox) {
      mysteryBox.addEventListener("click", function () {
        const content = this.querySelector(".box-content i");
        const icons = ["fa-question", "fa-eye", "fa-mask", "fa-star", "fa-magic"];
        const randomIcon = icons[Math.floor(Math.random() * icons.length)];
        content.className = `fas ${randomIcon}`;

        const ripple = document.createElement("div");
        ripple.style.cssText = `
          position: absolute; border-radius: 50%; background: rgba(139, 92, 246, 0.3);
          transform: scale(0); animation: ripple 0.6s linear; left: 50%; top: 50%;
          width: 20px; height: 20px; margin-left: -10px; margin-top: -10px;
        `;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    }

    // Video playback observer
    if (phoneVideo) {
      phoneVideo.addEventListener('error', (e) => {
        console.error('Video error:', e);
      });
    }

  } catch (error) {
    console.error('Script error:', error);
  }
});
