// AcoomH - Landing Page Script
// Clean, production-ready version with dynamic mobile detection

document.addEventListener("DOMContentLoaded", function () {
  try {
    // Essential DOM elements
    const phoneVideo = document.getElementById('phone-video');
    const navToggle = document.querySelector(".nav-toggle");
    const heroButtons = document.querySelector(".hero-buttons");
    const navMenu = document.querySelector(".nav-menu");
    const navLinks = document.querySelectorAll(".nav-link");

    // DYNAMIC mobile detection that updates on resize
    let currentMobileMode = false;
    let mobileEventListenersActive = false;
    let desktopEventListenersActive = false;

    function detectMobileMode() {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const screenWidth = window.innerWidth;
      
      // Force mobile mode when screen is small OR when DevTools mobile simulation is active
      const forceMobile = screenWidth <= 1024 || (isTouch && screenWidth <= 768);
      
      console.log('🔍 Dynamic Mobile Detection:', {
        isMobile,
        isTouch,
        screenWidth,
        forceMobile,
        userAgent: navigator.userAgent,
        maxTouchPoints: navigator.maxTouchPoints,
        currentMobileMode,
        windowHeight: window.innerHeight
      });
      
      return forceMobile;
    }

    // Scroll functionality variables
    const sections = document.querySelectorAll('section, footer');
    let isScrolling = false;
    let currentSectionIndex = 0;
    let handlersInitialized = false;
    
    // Mobile touch variables
    let touchStartY = 0;
    let touchStartTime = 0;
    const minSwipeDistance = 30;
    const maxSwipeTime = 500;
    const scrollCooldown = 800;
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

    // Desktop scroll to section - FIXED for snap scrolling
    function scrollToSection(index) {
      console.log('🔍 ScrollToSection called with:', {
        index,
        sectionsLength: sections.length,
        isScrolling,
        indexValid: index >= 0 && index < sections.length,
        conditionMet: index >= 0 && index < sections.length && !isScrolling
      });
      
      if (index >= 0 && index < sections.length && !isScrolling) {
        isScrolling = true;
        currentSectionIndex = index;
        updateIndicators();
        
        const section = sections[index];
        
        console.log('🖥️ Desktop scroll to section:', {
          index,
          sectionId: section.id,
          currentScroll: window.pageYOffset
        });
        
        // For desktop, we'll use transforms like mobile but without the wrapper
        // This gives us snap scrolling on desktop too
        let sectionsWrapper = document.querySelector('.sections-wrapper');
        if (!sectionsWrapper) {
          sectionsWrapper = document.createElement('div');
          sectionsWrapper.className = 'sections-wrapper';
          sectionsWrapper.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
          `;
          
          // Move all sections into the wrapper
          const body = document.body;
          const navbar = document.querySelector('.navbar');
          const sectionsToWrap = Array.from(sections);
          
          sectionsToWrap.forEach(section => {
            sectionsWrapper.appendChild(section);
          });
          
          // Insert wrapper after navbar
          if (navbar && navbar.nextSibling) {
            body.insertBefore(sectionsWrapper, navbar.nextSibling);
          } else {
            body.appendChild(sectionsWrapper);
          }
        }
        
        const viewportHeight = window.innerHeight;
        const targetY = index * viewportHeight;
        const translateY = -targetY;
        
        sectionsWrapper.style.transform = `translateY(${translateY}px)`;
        
        console.log('✅ Desktop scroll completed with transform:', {
          targetIndex: index,
          translateY,
          transform: sectionsWrapper.style.transform
        });
        
        // Update completion after animation
        setTimeout(() => {
          isScrolling = false;
        }, 800);
      } else {
        console.log('❌ ScrollToSection blocked:', {
          reason: index < 0 ? 'index too low' :
                 index >= sections.length ? 'index too high' :
                 isScrolling ? 'already scrolling' : 'unknown',
          index,
          sectionsLength: sections.length,
          isScrolling
        });
      }
    }

    // Mobile scroll to section - FIXED to use transforms instead of scrollTo
    function scrollToSectionMobile(index) {
      if (index >= 0 && index < sections.length && !isScrolling) {
        isScrolling = true;
        currentSectionIndex = index;
        updateIndicators();
        
        const section = sections[index];
        const viewportHeight = window.innerHeight;
        const targetY = index * viewportHeight;
        
        console.log('📱 Mobile scroll to section:', {
          index,
          sectionId: section.id,
          viewportHeight,
          targetY,
          currentScroll: window.pageYOffset,
          calculatedDistance: targetY - window.pageYOffset
        });
        
        // CRITICAL FIX: Use transforms instead of window.scrollTo for mobile
        // Create a wrapper for all sections if it doesn't exist
        let sectionsWrapper = document.querySelector('.sections-wrapper');
        if (!sectionsWrapper) {
          sectionsWrapper = document.createElement('div');
          sectionsWrapper.className = 'sections-wrapper';
          sectionsWrapper.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
          `;
          
          // Move all sections into the wrapper
          const body = document.body;
          const navbar = document.querySelector('.navbar');
          const sectionsToWrap = Array.from(sections);
          
          sectionsToWrap.forEach(section => {
            sectionsWrapper.appendChild(section);
          });
          
          // Insert wrapper after navbar
          if (navbar && navbar.nextSibling) {
            body.insertBefore(sectionsWrapper, navbar.nextSibling);
          } else {
            body.appendChild(sectionsWrapper);
          }
        }
        
        // Use transform to move to target section
        const translateY = -targetY;
        sectionsWrapper.style.transform = `translateY(${translateY}px)`;
        
        // Update completion after animation
        setTimeout(() => {
          isScrolling = false;
          console.log('✅ Mobile scroll completed with transform:', {
            targetIndex: index,
            translateY,
            transform: sectionsWrapper.style.transform
          });
        }, 600);
      }
    }

    // Touch event handlers (declared once, added/removed as needed)
    const touchStartHandler = function(e) {
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return;
      }
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      console.log('👆 Touch start:', { y: touchStartY, time: touchStartTime });
    };

    const touchEndHandler = function(e) {
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return;
      }
      
      if (isScrolling) {
        console.log('⏳ Already scrolling, ignoring touch end');
        return;
      }
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const swipeDistance = Math.abs(touchStartY - touchEndY);
      const swipeTime = touchEndTime - touchStartTime;
      const timeSinceLastScroll = touchEndTime - lastScrollTime;
      
      console.log('📊 Touch end analysis:', {
        startY: touchStartY,
        endY: touchEndY,
        swipeDistance,
        swipeTime,
        timeSinceLastScroll,
        minDistance: minSwipeDistance,
        maxTime: maxSwipeTime,
        cooldown: scrollCooldown
      });
      
      if (swipeDistance > minSwipeDistance && 
          swipeTime < maxSwipeTime && 
          timeSinceLastScroll > scrollCooldown) {
        
        lastScrollTime = touchEndTime;
        
        const direction = touchStartY > touchEndY ? 'down' : 'up';
        const targetIndex = direction === 'down' ? currentSectionIndex + 1 : currentSectionIndex - 1;
        
        console.log('✨ Valid swipe detected:', {
          direction,
          currentIndex: currentSectionIndex,
          targetIndex,
          sectionsLength: sections.length
        });
        
        scrollToSectionMobile(targetIndex);
      } else {
        console.log('❌ Swipe rejected:', {
          reason: swipeDistance <= minSwipeDistance ? 'distance too small' :
                 swipeTime >= maxSwipeTime ? 'took too long' :
                 timeSinceLastScroll <= scrollCooldown ? 'too soon after last scroll' : 'unknown'
        });
      }
    };

    const touchMoveHandler = function(e) {
      if (!e.target.closest('.phone-video') && !e.target.closest('.popup-overlay')) {
        e.preventDefault();
      }
    };

    const wheelHandler = function(e) {
      e.preventDefault();
    };

    // Desktop wheel event handlers
    let desktopWheelHandler;

    function initializeMobileMode() {
      if (mobileEventListenersActive) return;
      
      console.log('🔥 INITIALIZING MOBILE SCROLL BEHAVIOR');
      
      // Set overflow styles
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Add mobile event listeners
      document.addEventListener('touchstart', touchStartHandler, { passive: true });
      document.addEventListener('touchend', touchEndHandler, { passive: true });
      document.addEventListener('touchmove', touchMoveHandler, { passive: false });
      document.addEventListener('wheel', wheelHandler, { passive: false });
      
      mobileEventListenersActive = true;
      
      // Remove desktop listeners if active
      if (desktopEventListenersActive) {
        removeDesktopEventListeners();
      }
    }

    function initializeDesktopMode() {
      if (desktopEventListenersActive) return;
      
      console.log('🖥️ INITIALIZING DESKTOP SCROLL BEHAVIOR');
      
      // FIXED: Use hidden overflow for desktop snap scrolling too
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      let lastScrollTime = 0;
      const scrollCooldown = 600;
      
      desktopWheelHandler = (e) => {
        const currentTime = Date.now();
        
        if (isScrolling) {
          console.log('⏳ Desktop wheel blocked - already scrolling');
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        if ((currentTime - lastScrollTime) < scrollCooldown) {
          console.log('⏳ Desktop wheel blocked - cooldown active:', {
            timeSinceLastScroll: currentTime - lastScrollTime,
            cooldown: scrollCooldown
          });
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        const deltaY = e.deltaY;
        
        // CRITICAL FIX: Better trackpad detection for macOS
        // Trackpads send many small events, mouse wheels send fewer large events
        const isTrackpad = Math.abs(deltaY) < 50; // Trackpad usually sends smaller values
        const threshold = isTrackpad ? 15 : 0.5; // Higher threshold for trackpad
        
        console.log('🖱️ Desktop wheel event:', {
          deltaY,
          isTrackpad,
          threshold,
          meetsThreshold: Math.abs(deltaY) > threshold,
          isScrolling,
          timeSinceLastScroll: currentTime - lastScrollTime,
          cooldown: scrollCooldown
        });
        
        if (Math.abs(deltaY) > threshold) {
          lastScrollTime = currentTime;
          
          const targetIndex = deltaY > 0 ? currentSectionIndex + 1 : currentSectionIndex - 1;
          
          console.log('🔥 Desktop scroll triggered:', {
            direction: deltaY > 0 ? 'down' : 'up',
            currentSection: currentSectionIndex,
            targetSection: targetIndex,
            sectionsLength: sections.length,
            isScrolling: isScrolling,
            deviceType: isTrackpad ? 'trackpad' : 'mouse'
          });
          
          // Call scrollToSection immediately, it will handle the isScrolling flag
          if (deltaY > 0) {
            scrollToSection(currentSectionIndex + 1);
          } else {
            scrollToSection(currentSectionIndex - 1);
          }
        }
        
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Add desktop event listeners
      window.addEventListener('wheel', desktopWheelHandler, { passive: false, capture: true });
      document.addEventListener('wheel', desktopWheelHandler, { passive: false, capture: true });
      
      desktopEventListenersActive = true;
      
      // Remove mobile listeners if active
      if (mobileEventListenersActive) {
        removeMobileEventListeners();
      }
    }

    function removeMobileEventListeners() {
      if (!mobileEventListenersActive) return;
      
      console.log('🔄 REMOVING MOBILE EVENT LISTENERS');
      document.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchend', touchEndHandler);
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('wheel', wheelHandler);
      
      mobileEventListenersActive = false;
    }

    function removeDesktopEventListeners() {
      if (!desktopEventListenersActive || !desktopWheelHandler) return;
      
      console.log('🔄 REMOVING DESKTOP EVENT LISTENERS');
      window.removeEventListener('wheel', desktopWheelHandler);
      document.removeEventListener('wheel', desktopWheelHandler);
      
      desktopEventListenersActive = false;
    }

    function updateScrollMode() {
      const shouldUseMobile = detectMobileMode();
      
      if (shouldUseMobile !== currentMobileMode) {
        console.log(`🔄 SWITCHING FROM ${currentMobileMode ? 'MOBILE' : 'DESKTOP'} TO ${shouldUseMobile ? 'MOBILE' : 'DESKTOP'} MODE`);
        
        currentMobileMode = shouldUseMobile;
        
        if (currentMobileMode) {
          removeDesktopEventListeners();
          initializeMobileMode();
        } else {
          removeMobileEventListeners();
          initializeDesktopMode();
        }
      }
    }

    // Initialize on page load
    currentMobileMode = detectMobileMode();
    if (currentMobileMode) {
      initializeMobileMode();
    } else {
      initializeDesktopMode();
    }

    // Re-evaluate on window resize (for DevTools mobile simulation)
    window.addEventListener('resize', () => {
      setTimeout(updateScrollMode, 100); // Small delay to ensure resize is complete
    });

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
          const isCurrentlyMobile = detectMobileMode();
          console.log('🎯 Section indicator clicked:', index, 'Mobile mode:', isCurrentlyMobile);
          
          if (isCurrentlyMobile) {
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
          const viewportHeight = window.innerHeight;
          const isCurrentlyMobile = detectMobileMode();
          
          if (isCurrentlyMobile) {
            const newSectionIndex = Math.round(currentScroll / viewportHeight);
            if (newSectionIndex !== currentSectionIndex && newSectionIndex >= 0 && newSectionIndex < sections.length) {
              currentSectionIndex = newSectionIndex;
              updateIndicators();
            }
          } else {
            sections.forEach((section, index) => {
              const rect = section.getBoundingClientRect();
              if (rect.top >= -100 && rect.top <= 100) {
                currentSectionIndex = index;
                updateIndicators();
              }
            });
          }
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

    // Navigation link scrolling with dynamic mobile detection
    navLinks.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          const isCurrentlyMobile = detectMobileMode();
          console.log('🧭 Nav link clicked:', targetId, 'Mobile mode:', isCurrentlyMobile);
          
          const sectionIndex = Array.from(sections).indexOf(targetSection);
          console.log('📍 Target section index:', sectionIndex);
          
          if (sectionIndex !== -1) {
            if (isCurrentlyMobile) {
              console.log('📱 Using mobile scroll for navigation');
              scrollToSectionMobile(sectionIndex);
            } else {
              console.log('🖥️ Using desktop snap scroll for navigation');
              // Use the same snap scrolling system for desktop navigation
              scrollToSection(sectionIndex);
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
