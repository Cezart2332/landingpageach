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

    // Rezervări button -> show feature-in-progress modal (no redirect)
    (function attachRezervariModal() {
      const rezervariBtn = document.querySelector('.hero-buttons .btn.btn-primary');
      if (!rezervariBtn) return;

  // Create modal lazily on first click
  let modalOverlay = null;
  let modalPopup = null;

      function ensureModal() {
        if (modalOverlay) return modalOverlay;

        // Overlay styled like Download popup
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'popup-overlay';
        modalOverlay.setAttribute('role', 'dialog');
        modalOverlay.setAttribute('aria-modal', 'true');
        modalOverlay.setAttribute('aria-label', 'Informare funcționalitate');
        modalOverlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.8); z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(10px); opacity: 0; transition: opacity 0.3s ease;
          padding: 16px; box-sizing: border-box;
        `;

        // Modal card styled like Download popup
        modalPopup = document.createElement('div');
        modalPopup.className = 'popup-content';
        modalPopup.style.cssText = `
          background: linear-gradient(145deg, #1a1a1a, rgba(26, 26, 26, 0.95));
          border: 1px solid #6b46c1; border-radius: 25px; padding: 40px 30px;
          text-align: center; max-width: 400px; width: 90%;
          box-shadow: 0 20px 60px rgba(139, 92, 246, 0.4);
          transform: scale(0.8) translateY(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #ffffff;
        `;

        modalPopup.innerHTML = `
          <div style="margin-bottom: 25px;">
            <i class="fas fa-tools" style="font-size: 3rem; color: #6b46c1; margin-bottom: 20px; display: block;"></i>
            <h3 style="color: #ffffff; margin-bottom: 15px; font-size: 1.5rem; font-weight: 600;">Această funcție este în curs de implementare</h3>
            <p style="color: #b3b3b3; font-size: 1.1rem; line-height: 1.6; margin-bottom: 25px;">Îți mulțumim pentru interes! Revino în curând pentru actualizări.</p>
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

        modalOverlay.appendChild(modalPopup);

        const closeModal = () => {
          modalOverlay.style.opacity = '0';
          modalPopup.style.transform = 'scale(0.8) translateY(20px)';
          setTimeout(() => {
            if (modalOverlay && modalOverlay.parentNode) {
              modalOverlay.style.display = 'none';
            }
          }, 300);
        };

        modalPopup.querySelector('.popup-close-btn').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
          if (e.target === modalOverlay) closeModal();
        });
        document.addEventListener('keydown', function escHandler(e) {
          if (e.key === 'Escape' && modalOverlay.style.opacity === '1') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
          }
        });

        document.body.appendChild(modalOverlay);
        return modalOverlay;
      }

      function openModal() {
        const overlay = ensureModal();
        overlay.style.display = 'flex';
        // force reflow for transition
        // eslint-disable-next-line no-unused-expressions
        overlay.offsetHeight;
        overlay.style.opacity = '1';
        if (modalPopup) {
          modalPopup.style.transform = 'scale(1) translateY(0)';
        }
      }

      function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.style.opacity = '0';
        if (modalPopup) modalPopup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => {
          modalOverlay.style.display = 'none';
        }, 300);
      }

  // Expose global helper so other handlers can open this modal without redirecting
  window.showFeatureInProgressModal = openModal;

      rezervariBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      });
    })();

    // Completely rewritten iOS-compatible video initialization
    function initializeVideoForIOS() {
      if (!phoneVideo) return;
      
      console.log('🎥 Starting video initialization with new 0821-copy.mp4...');
      
      // Clear any existing video attributes and start fresh
      phoneVideo.removeAttribute('autoplay');
      phoneVideo.removeAttribute('src');
      
      // Set essential iOS Safari attributes
      phoneVideo.setAttribute('muted', 'true');
      phoneVideo.setAttribute('playsinline', 'true');
      phoneVideo.setAttribute('webkit-playsinline', 'true');
      phoneVideo.setAttribute('preload', 'metadata');
      phoneVideo.setAttribute('loop', 'true');
      
      // Set properties
      phoneVideo.muted = true;
      phoneVideo.playsInline = true;
      phoneVideo.defaultMuted = true;
      phoneVideo.volume = 0;
      phoneVideo.loop = true;
      
      // Updated video sources with new primary video
      const videoSources = [
        '0821-copy.mp4',                // NEW: Primary video source
        'acoomharta_safe.mp4',         // Fallback 1
        'acoomharta_noaudio.mp4',      // Fallback 2
        'acoomharta.mp4'               // Fallback 3
      ];
      
      let currentSourceIndex = 0;
      let hasStartedPlaying = false;
      
      function loadNextVideo() {
        if (currentSourceIndex >= videoSources.length) {
          console.log('❌ All video sources failed, showing fallback image');
          showVideoFallback();
          return;
        }
        
        const videoSrc = videoSources[currentSourceIndex];
        console.log(`🎥 Trying video source: ${videoSrc}`);
        
        // Clear existing sources
        phoneVideo.innerHTML = '';
        
        // Create new source element
        const source = document.createElement('source');
        source.src = videoSrc;
        source.type = 'video/mp4';
        phoneVideo.appendChild(source);
        
        // Also set src directly for better compatibility
        phoneVideo.src = videoSrc;
        
        currentSourceIndex++;
        
        // Force reload
        phoneVideo.load();
      }
      
      function showVideoFallback() {
        const fallback = document.querySelector('.video-fallback');
        if (fallback) {
          fallback.style.display = 'block';
          phoneVideo.style.display = 'none';
          console.log('🖼️ Showing fallback image');
        }
      }
      
      function attemptPlay(strategy = 'unknown') {
        if (hasStartedPlaying) return Promise.resolve(true);
        
        console.log(`🎥 Attempting play with strategy: ${strategy}`);
        console.log(`🎥 Video readyState: ${phoneVideo.readyState}, networkState: ${phoneVideo.networkState}`);
        
        // For iOS, we need at least HAVE_CURRENT_DATA (readyState >= 2)
        if (phoneVideo.readyState < 2) {
          console.log(`🎥 Video not ready for playback, readyState: ${phoneVideo.readyState}`);
          return Promise.resolve(false);
        }
        // Ensure autoplay and muted are set before play
        phoneVideo.muted = true;
        phoneVideo.autoplay = true;
        const playPromise = phoneVideo.play();
        
        if (playPromise !== undefined) {
          return playPromise
            .then(() => {
              console.log(`✅ Video started playing with strategy: ${strategy}`);
              hasStartedPlaying = true;
              return true;
            })
            .catch(error => {
              console.log(`❌ Play failed with strategy: ${strategy} - ${error.name}: ${error.message}`);
              return false;
            });
        }
        
        return Promise.resolve(false);
      }
      
      // Enhanced error handling
      phoneVideo.addEventListener('error', (e) => {
        console.error('🎥 Video error:', {
          error: phoneVideo.error,
          networkState: phoneVideo.networkState,
          readyState: phoneVideo.readyState,
          currentSrc: phoneVideo.currentSrc
        });
        
        // Try next video source
        setTimeout(() => {
          loadNextVideo();
        }, 500);
      });
      
      phoneVideo.addEventListener('loadeddata', () => {
        console.log('🎥 Video data loaded successfully');
        if (!hasStartedPlaying) {
          setTimeout(() => attemptPlay('loadeddata'), 100);
        }
      });
      
      phoneVideo.addEventListener('canplay', () => {
        console.log('🎥 Video can play');
        if (!hasStartedPlaying) {
          setTimeout(() => attemptPlay('canplay'), 100);
        }
      });
      
      phoneVideo.addEventListener('canplaythrough', () => {
        console.log('🎥 Video can play through');
        if (!hasStartedPlaying) {
          setTimeout(() => attemptPlay('canplaythrough'), 200);
        }
      });
      
      phoneVideo.addEventListener('playing', () => {
        if (!hasStartedPlaying) {
          console.log('🎉 Video is now playing!');
          hasStartedPlaying = true;
        }
      });
      
      phoneVideo.addEventListener('stalled', () => {
        console.log('⚠️ Video stalled - trying next source');
        setTimeout(() => {
          if (!hasStartedPlaying && phoneVideo.readyState < 2) {
            loadNextVideo();
          }
        }, 3000);
      });
      
      phoneVideo.addEventListener('suspend', () => {
        console.log('⚠️ Video loading suspended - trying next source');
        setTimeout(() => {
          if (!hasStartedPlaying) {
            loadNextVideo();
          }
        }, 2000);
      });
      
      // iOS-specific: Set up intersection observer for autoplay when visible
      if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !hasStartedPlaying && phoneVideo.readyState >= 2) {
              console.log('🎥 Video visible, attempting autoplay');
              attemptPlay('intersection-observer').then(success => {
                if (success) {
                  videoObserver.unobserve(phoneVideo);
                }
              });
            }
          });
        }, { threshold: 0.1 });
        
        videoObserver.observe(phoneVideo);
      }
      
      // User interaction fallback - simplified
      function setupUserInteraction() {
        console.log('🎥 Setting up user interaction fallback');
        
        const handleUserInteraction = (eventType) => {
          console.log(`🎥 User ${eventType} detected`);
          
          if (!hasStartedPlaying) {
            if (phoneVideo.readyState < 2) {
              console.log('🎥 Video not ready, forcing reload');
              phoneVideo.load();
              
              // Wait for video to load then play
              const loadHandler = () => {
                if (phoneVideo.readyState >= 2) {
                  attemptPlay(`user-${eventType}-after-reload`);
                  phoneVideo.removeEventListener('loadeddata', loadHandler);
                }
              };
              phoneVideo.addEventListener('loadeddata', loadHandler);
            } else {
              attemptPlay(`user-${eventType}`);
            }
          }
          
          // Remove listeners after first interaction
          document.removeEventListener('click', clickHandler);
          document.removeEventListener('touchstart', touchHandler);
        };
        
        const clickHandler = () => handleUserInteraction('click');
        const touchHandler = () => handleUserInteraction('touch');
        
        document.addEventListener('click', clickHandler, { once: true, passive: true });
        document.addEventListener('touchstart', touchHandler, { once: true, passive: true });
      }
      
      // Start loading the first video
      loadNextVideo();
      
      // Set up user interaction after a delay
      setTimeout(setupUserInteraction, 2000);
    }
    
    // Inițializare video
    initializeVideoForIOS();

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
      
      return forceMobile;
    }

    // Scroll functionality variables
    const sections = document.querySelectorAll('section, footer');
    let isScrolling = false;
    let currentSectionIndex = 0;
    let handlersInitialized = false;
    let sectionsWrapper = null; // Store wrapper reference
    
    // Mobile touch variables
    let touchStartY = 0;
    let touchStartTime = 0;
    const minSwipeDistance = 30;
    const maxSwipeTime = 500;
    const scrollCooldown = 800;
    let lastScrollTime = 0;

    // CRITICAL FIX: Create sections wrapper immediately during initialization
    function createSectionsWrapper() {
      if (sectionsWrapper) return sectionsWrapper; // Return existing wrapper if already created
      
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
        transform: translateY(0px);
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
      
      return sectionsWrapper;
    }

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
      if (index >= 0 && index < sections.length && !isScrolling) {
        isScrolling = true;
        currentSectionIndex = index;
        updateIndicators();
        
        const section = sections[index];
        
        // Use the pre-created wrapper instead of creating it here
        if (!sectionsWrapper) {
          sectionsWrapper = createSectionsWrapper();
        }
        
        const viewportHeight = window.innerHeight;
        const targetY = index * viewportHeight;
        const translateY = -targetY;
        
        sectionsWrapper.style.transform = `translateY(${translateY}px)`;
        
        // Update completion after animation
        setTimeout(() => {
          isScrolling = false;
        }, 800);
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
        
        // Use the pre-created wrapper instead of creating it here
        if (!sectionsWrapper) {
          sectionsWrapper = createSectionsWrapper();
        }
        
        // Use transform to move to target section
        const translateY = -targetY;
        sectionsWrapper.style.transform = `translateY(${translateY}px)`;
        
        // Update completion after animation
        setTimeout(() => {
          isScrolling = false;
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
    };

    const touchEndHandler = function(e) {
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return;
      }
      
      if (isScrolling) {
        return;
      }
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const swipeDistance = Math.abs(touchStartY - touchEndY);
      const swipeTime = touchEndTime - touchStartTime;
      const timeSinceLastScroll = touchEndTime - lastScrollTime;
      const direction = touchStartY > touchEndY ? 'down' : 'up';
      
      // CRITICAL FIX: Allow pull-to-refresh when on first section and swiping down
      if (currentSectionIndex === 0 && direction === 'up') {
        return; // Don't prevent default, allow native pull-to-refresh
      }
      
      if (swipeDistance > minSwipeDistance && 
          swipeTime < maxSwipeTime && 
          timeSinceLastScroll > scrollCooldown) {
        
        lastScrollTime = touchEndTime;
        
        const targetIndex = direction === 'down' ? currentSectionIndex + 1 : currentSectionIndex - 1;
        
        scrollToSectionMobile(targetIndex);
      }
    };

    const touchMoveHandler = function(e) {
      // Don't prevent default for video or popup interactions
      if (e.target.closest('.phone-video') || e.target.closest('.popup-overlay')) {
        return;
      }
      
      // CRITICAL FIX: Allow pull-to-refresh when on first section
      // Check if user is on first section and moving downward (pull-to-refresh gesture)
      if (currentSectionIndex === 0) {
        const currentY = e.touches[0].clientY;
        const isMovingDown = currentY > touchStartY;
        
        if (isMovingDown) {
          return; // Don't prevent default, allow native pull-to-refresh
        }
      }
      
      // Prevent default for all other touch movements to maintain custom scroll behavior
      e.preventDefault();
    };

    const wheelHandler = function(e) {
      e.preventDefault();
    };

    // Desktop wheel event handlers
    let desktopWheelHandler;

    function initializeMobileMode() {
      if (mobileEventListenersActive) return;
      
      // CRITICAL: Create sections wrapper before adding event listeners
      if (!sectionsWrapper) {
        createSectionsWrapper();
      }
      
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
      
      // CRITICAL: Create sections wrapper before adding event listeners
      if (!sectionsWrapper) {
        createSectionsWrapper();
      }
      
      // FIXED: Use hidden overflow for desktop snap scrolling too
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      let lastScrollTime = 0;
      const scrollCooldown = 600;
      
      desktopWheelHandler = (e) => {
        const currentTime = Date.now();
        
        if (isScrolling) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        if ((currentTime - lastScrollTime) < scrollCooldown) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        
        const deltaY = e.deltaY;
        
        // CRITICAL FIX: Better trackpad detection for macOS
        // Trackpads send many small events, mouse wheels send fewer large events
        const isTrackpad = Math.abs(deltaY) < 50; // Trackpad usually sends smaller values
        const threshold = isTrackpad ? 15 : 0.5; // Higher threshold for trackpad
        
        if (Math.abs(deltaY) > threshold) {
          lastScrollTime = currentTime;
          
          const targetIndex = deltaY > 0 ? currentSectionIndex + 1 : currentSectionIndex - 1;
          
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
      
      document.removeEventListener('touchstart', touchStartHandler);
      document.removeEventListener('touchend', touchEndHandler);
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('wheel', wheelHandler);
      
      mobileEventListenersActive = false;
    }

    function removeDesktopEventListeners() {
      if (!desktopEventListenersActive || !desktopWheelHandler) return;
      
      window.removeEventListener('wheel', desktopWheelHandler);
      document.removeEventListener('wheel', desktopWheelHandler);
      
      desktopEventListenersActive = false;
    }

    function updateScrollMode() {
      const shouldUseMobile = detectMobileMode();
      
      if (shouldUseMobile !== currentMobileMode) {
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
            span.style.animationDelay = `${totalDelay + (charIndex * 20)}ms`; // Reduced from 40ms to 20ms
            return span;
          });
          
          chars.forEach(char => element.appendChild(char));
          totalDelay += (text.length * 20) + 100; // Reduced from 40ms and 200ms to 20ms and 100ms
        });
      }
    }

    // Initialize animations
    setTimeout(() => {
      initCharacterRevealAnimation();
    }, 200); // Reduced from 400ms to 200ms

    // Subtitle and button animations
    const heroSubtitle = document.querySelector(".hero-subtitle");
    
    if (heroSubtitle) {
      heroSubtitle.style.opacity = "0";
      heroSubtitle.style.transform = "translateY(30px)";
      heroSubtitle.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"; // Reduced from 0.8s to 0.6s
      
      setTimeout(() => {
        heroSubtitle.style.opacity = "1";
        heroSubtitle.style.transform = "translateY(0)";
      }, 1200); // Reduced from 2200ms to 1200ms
    }

    if (heroButtons) {
      heroButtons.style.opacity = "0";
      heroButtons.style.transform = "translateY(30px)";
      heroButtons.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)"; // Reduced from 0.8s to 0.6s
      
      setTimeout(() => {
        heroButtons.style.opacity = "1";
        heroButtons.style.transform = "translateY(0)";
      }, 1400); // Reduced from 2600ms to 1400ms
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
    // CRITICAL FIX: Make indicators less visible when not scrolling
    indicators.style.opacity = '0.3';
    indicators.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    indicators.style.transform = 'translateY(-50%) translateX(10px)'; // Slightly hidden to the right

    // Add responsive hiding for smaller screens
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    function handleMediaQuery(e) {
      if (e.matches) {
        // Hide on mobile to prevent text cutting
        indicators.style.display = 'none';
      } else {
        indicators.style.display = 'flex';
      }
    }
    
    handleMediaQuery(mediaQuery);
    mediaQuery.addListener(handleMediaQuery);

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
          
          if (isCurrentlyMobile) {
            scrollToSectionMobile(index);
          } else {
            scrollToSection(index);
          }
        }
      });
      
      indicators.appendChild(dot);
    });

    // Add hover effects to make indicators more visible when needed
    indicators.addEventListener('mouseenter', () => {
      indicators.style.opacity = '1';
      indicators.style.transform = 'translateY(-50%) translateX(0px)';
    });

    indicators.addEventListener('mouseleave', () => {
      indicators.style.opacity = '0.3';
      indicators.style.transform = 'translateY(-50%) translateX(10px)';
    });

    // Make indicators more visible during scrolling
    let scrollingTimeout;
    let lastScrollingTime = 0;

    // Track scrolling activity
    function showIndicatorsDuringScroll() {
      lastScrollingTime = Date.now();
      indicators.style.opacity = '0.8';
      indicators.style.transform = 'translateY(-50%) translateX(0px)';
      
      clearTimeout(scrollingTimeout);
      scrollingTimeout = setTimeout(() => {
        const timeSinceLastScroll = Date.now() - lastScrollingTime;
        if (timeSinceLastScroll >= 1500) { // Hide after 1.5 seconds of no scrolling
          indicators.style.opacity = '0.3';
          indicators.style.transform = 'translateY(-50%) translateX(10px)';
        }
      }, 1500);
    }

    // Listen for wheel events to show indicators during scrolling
    window.addEventListener('wheel', showIndicatorsDuringScroll, { passive: true });
    window.addEventListener('touchmove', showIndicatorsDuringScroll, { passive: true });

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
          
          const sectionIndex = Array.from(sections).indexOf(targetSection);
          
          if (sectionIndex !== -1) {
            if (isCurrentlyMobile) {
              scrollToSectionMobile(sectionIndex);
            } else {
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
          // Remove any existing event listeners to prevent conflicts
          allHeroButtons[0].replaceWith(allHeroButtons[0].cloneNode(true));
          const rezervariButton = heroButtons.querySelectorAll("button")[0];
          
          rezervariButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.showFeatureInProgressModal) {
              window.showFeatureInProgressModal();
            }
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

    // Initialize button handlers immediately instead of waiting 2 seconds
    initializeButtonHandlers();

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

    // Page Loading Overlay System - Prevents barrel roll animations
    function createLoadingOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'page-loading-overlay';
      overlay.id = 'pageLoadingOverlay';
      
      overlay.innerHTML = `
        <div class="loading-spinner-container">
          <div class="modern-loading-spinner"></div>
          <div class="loading-text">
            Se încarcă<span class="loading-dots"></span>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      return overlay;
    }

    function showLoadingOverlay() {
      // Add loading class to body to disable animations
      document.body.classList.add('loading');
      document.body.classList.remove('loaded');
      
      // Create overlay if it doesn't exist
      let overlay = document.getElementById('pageLoadingOverlay');
      if (!overlay) {
        overlay = createLoadingOverlay();
      }
      
      // Show overlay
      overlay.classList.remove('hidden');
    }

    function hideLoadingOverlay() {
      const overlay = document.getElementById('pageLoadingOverlay');
      if (overlay) {
        overlay.classList.add('hidden');
        
        // Remove overlay after transition
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 500);
      }
      
      // Re-enable animations
      document.body.classList.remove('loading');
      document.body.classList.add('loaded');
    }

    // Intercept page navigation to show loading overlay
    function navigateWithLoading(url) {
      // Clear any existing timeouts that might hide the overlay
      clearTimeout(window.loadingTimeout);
      
      showLoadingOverlay();
      
      // Navigate immediately - no delay needed
      window.location.href = url;
    }

    // FIXED: Ensure loading overlay is hidden when page becomes visible again
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        // Page became visible again - ensure loading overlay is hidden
        setTimeout(() => {
          const overlay = document.getElementById('pageLoadingOverlay');
          if (overlay && !overlay.classList.contains('hidden')) {
            hideLoadingOverlay();
          }
        }, 100);
      }
    });

    // FIXED: Handle back/forward navigation properly
    window.addEventListener('pageshow', function(event) {
      if (event.persisted) {
        // Page was restored from cache - hide loading overlay
        hideLoadingOverlay();
      }
    });

    // Initialize loading overlay system when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      // Hide loading overlay after page content is ready
      setTimeout(() => {
        hideLoadingOverlay();
      }, 800);
      
      // Override navigation links to use loading overlay
      setTimeout(() => {
        const navigationLinks = document.querySelectorAll('a[href*=".html"], .btn[href*=".html"], .nav-link[href*=".html"]');
        
        navigationLinks.forEach(link => {
          link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Only intercept internal navigation (not external links or anchors)
            if (href && href.includes('.html') && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
              e.preventDefault();
              navigateWithLoading(href);
            }
          });
        });
      }, 100);
    });

    // Show loading on page unload (when leaving page)
    window.addEventListener('beforeunload', function() {
      showLoadingOverlay();
    });

  } catch (error) {
    console.error('Script error:', error);
  }
});
