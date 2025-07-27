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

    // iOS Video Fix - Safari-specific enhanced video handling
    function initializeVideoForIOS() {
      if (!phoneVideo) return;
      
      // Enhanced iOS/Safari detection
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isIOSSafari = isIOS && (isSafari || /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent));
      
      // Set basic video properties for all devices
      phoneVideo.muted = true;
      phoneVideo.playsInline = true;
      phoneVideo.setAttribute('webkit-playsinline', 'true');
      phoneVideo.setAttribute('playsinline', 'true');
      phoneVideo.preload = 'metadata'; // Changed from 'auto' for Safari
      
      if (isIOS) {
        console.log(`iOS device detected (Safari: ${isIOSSafari}), applying iOS-specific video fixes`);
        
        // Safari-specific setup
        if (isIOSSafari) {
          console.log('Safari on iOS detected - using Safari-specific approach');
          
          // Force all required attributes for Safari
          phoneVideo.setAttribute('muted', '');
          phoneVideo.setAttribute('autoplay', '');
          phoneVideo.setAttribute('loop', '');
          phoneVideo.setAttribute('playsinline', '');
          phoneVideo.setAttribute('webkit-playsinline', '');
          phoneVideo.setAttribute('controls', 'false');
          phoneVideo.removeAttribute('controls');
          
          // Safari requires these to be set via properties too
          phoneVideo.muted = true;
          phoneVideo.autoplay = true;
          phoneVideo.loop = true;
          phoneVideo.playsInline = true;
          phoneVideo.controls = false;
          
          // Safari-specific preload strategy
          phoneVideo.preload = 'none';
          phoneVideo.load();
          
          // Wait for Safari to be ready, then set preload to metadata
          setTimeout(() => {
            phoneVideo.preload = 'metadata';
            phoneVideo.load();
          }, 100);
        }
        
        // Create immediate play strategy for Safari
        const safariPlayStrategy = () => {
          // Strategy 1: Direct play attempt
          const directPlay = () => {
            if (phoneVideo.readyState >= 2) { // HAVE_CURRENT_DATA
              return phoneVideo.play();
            }
            return Promise.reject('Video not ready');
          };
          
          // Strategy 2: Load then play
          const loadAndPlay = () => {
            return new Promise((resolve, reject) => {
              const onCanPlay = () => {
                phoneVideo.removeEventListener('canplay', onCanPlay);
                phoneVideo.removeEventListener('error', onError);
                phoneVideo.play().then(resolve).catch(reject);
              };
              
              const onError = (e) => {
                phoneVideo.removeEventListener('canplay', onCanPlay);
                phoneVideo.removeEventListener('error', onError);
                reject(e);
              };
              
              phoneVideo.addEventListener('canplay', onCanPlay, { once: true });
              phoneVideo.addEventListener('error', onError, { once: true });
              phoneVideo.load();
            });
          };
          
          // Try strategies in sequence
          return directPlay()
            .catch(() => loadAndPlay())
            .catch(() => {
              console.log('Safari autoplay blocked, setting up interaction handlers');
              setupSafariInteractionHandlers();
            });
        };
        
        // Safari-specific interaction handlers
        const setupSafariInteractionHandlers = () => {
          let videoPlayed = false;
          let interactionAttempts = 0;
          const maxAttempts = 3;
          
          const playSafariVideo = async () => {
            if (videoPlayed || interactionAttempts >= maxAttempts) return;
            
            interactionAttempts++;
            console.log(`Safari play attempt ${interactionAttempts}`);
            
            try {
              // Safari sometimes needs a small delay
              await new Promise(resolve => setTimeout(resolve, 50));
              
              // Ensure video is properly configured
              phoneVideo.muted = true;
              phoneVideo.playsInline = true;
              
              // Force reload if needed
              if (phoneVideo.readyState === 0) {
                phoneVideo.load();
                await new Promise(resolve => {
                  const onLoadStart = () => {
                    phoneVideo.removeEventListener('loadstart', onLoadStart);
                    resolve();
                  };
                  phoneVideo.addEventListener('loadstart', onLoadStart);
                });
              }
              
              const playPromise = phoneVideo.play();
              await playPromise;
              
              console.log('Safari video started successfully');
              videoPlayed = true;
              cleanupSafariHandlers();
              
            } catch (error) {
              console.log(`Safari play attempt ${interactionAttempts} failed:`, error);
              
              if (interactionAttempts >= maxAttempts) {
                console.log('All Safari play attempts failed, showing fallback');
                showVideoFallback();
                cleanupSafariHandlers();
              }
            }
          };
          
          const cleanupSafariHandlers = () => {
            document.removeEventListener('touchstart', playSafariVideo);
            document.removeEventListener('touchend', playSafariVideo);
            document.removeEventListener('touchmove', playSafariVideo);
            document.removeEventListener('click', playSafariVideo);
            document.removeEventListener('scroll', playSafariVideo);
            document.removeEventListener('keydown', playSafariVideo);
            window.removeEventListener('focus', playSafariVideo);
          };
          
          // Add comprehensive event listeners for Safari
          document.addEventListener('touchstart', playSafariVideo, { passive: true });
          document.addEventListener('touchend', playSafariVideo, { passive: true });
          document.addEventListener('touchmove', playSafariVideo, { passive: true });
          document.addEventListener('click', playSafariVideo, { passive: true });
          document.addEventListener('scroll', playSafariVideo, { passive: true });
          document.addEventListener('keydown', playSafariVideo, { passive: true });
          window.addEventListener('focus', playSafariVideo, { passive: true });
          
          // Safari-specific: Try on page visibility change
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !videoPlayed) {
              setTimeout(playSafariVideo, 100);
            }
          });
          
          // Safari-specific: Try when video becomes visible
          const safariObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && !videoPlayed) {
                setTimeout(playSafariVideo, 200);
              }
            });
          }, { threshold: 0.1 });
          
          safariObserver.observe(phoneVideo);
          
          // Cleanup observer when video plays
          const originalPlay = playSafariVideo;
          const wrappedPlay = async () => {
            await originalPlay();
            if (videoPlayed) {
              safariObserver.disconnect();
            }
          };
          
          // Replace the function reference
          document.removeEventListener('touchstart', playSafariVideo);
          document.addEventListener('touchstart', wrappedPlay, { passive: true });
        };
        
        // Initial play attempts with Safari-specific timing
        setTimeout(() => safariPlayStrategy(), 200);
        
        // Secondary attempt after page load
        if (document.readyState === 'complete') {
          setTimeout(() => safariPlayStrategy(), 800);
        } else {
          window.addEventListener('load', () => {
            setTimeout(() => safariPlayStrategy(), 800);
          });
        }
        
        // Handle Safari lifecycle events
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && phoneVideo.paused) {
            setTimeout(() => {
              phoneVideo.play().catch(e => console.log('Safari resume failed:', e));
            }, 300);
          }
        });
        
        window.addEventListener('pageshow', () => {
          if (phoneVideo.paused) {
            setTimeout(() => {
              phoneVideo.play().catch(e => console.log('Safari pageshow play failed:', e));
            }, 300);
          }
        });
        
      } else {
        // Non-iOS devices - standard approach
        setTimeout(() => {
          phoneVideo.play().catch(e => console.log('Non-iOS video autoplay failed:', e));
        }, 100);
      }
      
      // Show fallback function
      const showVideoFallback = () => {
        const fallback = phoneVideo.nextElementSibling;
        if (fallback && fallback.classList.contains('video-fallback')) {
          fallback.style.display = 'block';
          phoneVideo.style.display = 'none';
          console.log('Video fallback image shown');
        } else {
          // Create fallback if it doesn't exist
          const fallbackImg = document.createElement('img');
          fallbackImg.src = 'acoomh.png';
          fallbackImg.alt = 'AcoomH App Preview';
          fallbackImg.className = 'video-fallback';
          fallbackImg.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
          `;
          phoneVideo.parentNode.insertBefore(fallbackImg, phoneVideo.nextSibling);
          fallbackImg.style.display = 'block';
          phoneVideo.style.display = 'none';
          console.log('Video fallback image created and shown');
        }
      };
      
      // Enhanced error handling for Safari
      phoneVideo.addEventListener('error', (e) => {
        console.error('Video error:', e);
        console.error('Video error details:', {
          error: e.target.error,
          networkState: phoneVideo.networkState,
          readyState: phoneVideo.readyState,
          src: phoneVideo.currentSrc
        });
        showVideoFallback();
      });
      
      phoneVideo.addEventListener('loadstart', () => {
        console.log('Video loading started');
      });
      
      phoneVideo.addEventListener('canplay', () => {
        console.log('Video can start playing');
        if (isIOSSafari && phoneVideo.paused) {
          // Give Safari a moment before trying to play
          setTimeout(() => {
            phoneVideo.play().catch(e => console.log('Video play on canplay failed:', e));
          }, 100);
        }
      });
      
      // Safari-specific: Handle when video can play through
      phoneVideo.addEventListener('canplaythrough', () => {
        console.log('Video can play through');
        if (isIOSSafari && phoneVideo.paused) {
          setTimeout(() => {
            phoneVideo.play().catch(e => console.log('Video play on canplaythrough failed:', e));
          }, 100);
        }
      });
      
      // Intersection observer with Safari-optimized settings
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && phoneVideo.paused) {
            console.log('Video is visible, attempting to play');
            // Safari needs a longer delay when video becomes visible
            const delay = isIOSSafari ? 300 : 100;
            setTimeout(() => {
              phoneVideo.play().catch(e => console.log('Video intersection play failed:', e));
            }, delay);
          }
        });
      }, { threshold: isIOSSafari ? 0.1 : 0.3 }); // Lower threshold for Safari
      
      videoObserver.observe(phoneVideo);
    }
    
    // Initialize video handling immediately
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
