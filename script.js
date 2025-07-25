// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

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

  // Character-by-character text reveal animation
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
          span.style.animationDelay = `${totalDelay + (charIndex * 80)}ms`; // 80ms delay between chars
          return span;
        });
        
        // Add all character spans to the element
        chars.forEach(char => element.appendChild(char));
        
        // Update total delay for next word (add time for all chars + word gap)
        totalDelay += (text.length * 80) + 400; // 400ms gap between words
      });
    }
  }

  // Initialize character reveal animation on page load
  setTimeout(() => {
    initCharacterRevealAnimation();
  }, 800); // Start after initial page load

  // Enhanced subtitle animation
  const heroSubtitle = document.querySelector(".hero-subtitle");
  const heroButtons = document.querySelector(".hero-buttons");
  
  if (heroSubtitle) {
    heroSubtitle.style.opacity = "0";
    heroSubtitle.style.transform = "translateY(30px)";
    heroSubtitle.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    
    setTimeout(() => {
      heroSubtitle.style.opacity = "1";
      heroSubtitle.style.transform = "translateY(0)";
    }, 3500); // Start after character animation completes
  }

  if (heroButtons) {
    heroButtons.style.opacity = "0";
    heroButtons.style.transform = "translateY(30px)";
    heroButtons.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
    
    setTimeout(() => {
      heroButtons.style.opacity = "1";
      heroButtons.style.transform = "translateY(0)";
    }, 3900); // Start after subtitle animation
  }

  // Loading screen effect
  window.addEventListener("load", function () {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 100);
  });

  // Mouse glow effect
  const cursor = {
    glow: document.createElement('div')
  };
  
  // Create and style the glow element
  cursor.glow.className = 'cursor-glow';
  cursor.glow.style.position = 'fixed';
  cursor.glow.style.pointerEvents = 'none';
  cursor.glow.style.width = '30px';
  cursor.glow.style.height = '30px';
  cursor.glow.style.borderRadius = '50%';
  cursor.glow.style.background = 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%)';
  cursor.glow.style.transform = 'translate(-50%, -50%)';
  cursor.glow.style.zIndex = '9999';
  cursor.glow.style.transition = 'width 0.2s, height 0.2s, opacity 0.2s, background 0.2s';
  document.body.appendChild(cursor.glow);

  let isMoving = false;
  let moveTimeout;
  let clickTimeout;

  // Initialize mousemove listener
  window.addEventListener('mousemove', (e) => {
    cursor.glow.style.left = e.clientX + 'px';
    cursor.glow.style.top = e.clientY + 'px';
    
    // Enhance glow effect when moving
    if (!isMoving) {
      isMoving = true;
      cursor.glow.style.width = '50px';
      cursor.glow.style.height = '50px';
      cursor.glow.style.background = 'radial-gradient(circle at center, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)';
    }
    
    // Reset the timeout on each move
    clearTimeout(moveTimeout);
    moveTimeout = setTimeout(() => {
      isMoving = false;
      if (!clickTimeout) { // Only shrink if not in click animation
        cursor.glow.style.width = '30px';
        cursor.glow.style.height = '30px';
        cursor.glow.style.background = 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%)';
      }
    }, 100);
  });

  // Add click animation
  window.addEventListener('mousedown', () => {
    cursor.glow.style.width = '70px';
    cursor.glow.style.height = '70px';
    cursor.glow.style.background = 'radial-gradient(circle at center, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0) 70%)';
    
    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
      clickTimeout = null;
      if (!isMoving) {
        cursor.glow.style.width = '30px';
        cursor.glow.style.height = '30px';
        cursor.glow.style.background = 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0) 70%)';
      } else {
        cursor.glow.style.width = '50px';
        cursor.glow.style.height = '50px';
        cursor.glow.style.background = 'radial-gradient(circle at center, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0) 70%)';
      }
    }, 300);
  });

  // Remove old sparkle-related elements if they exist
  document.querySelectorAll('.cursor-circle').forEach(circle => circle.remove());

  // Console easter egg
  console.log(`
    🎭 Welcome to AcoomH - Discover the Hidden
    
    ░█████╗░░█████╗░░█████╗░░█████╗░███╗░░░███╗██╗░░██╗
    ██╔══██╗██╔══██╗██╔══██╗██╔══██╗████╗░████║██║░░██║
    ███████║██║░░╚═╝██║░░██║██║░░██║██╔████╔██║███████║
    ██╔══██║██║░░██╗██║░░██║██║░░██║██║╚██╔╝██║██╔══██║
    ██║░░██║╚█████╔╝╚█████╔╝╚█████╔╝██║░╚═╝░██║██║░░██║
    ╚═╝░░╚═╝░╚════╝░░╚════╝░░╚════╝░╚═╝░░░░░╚═╝╚═╝░░╚═╝
    
    You've found the hidden console. 
    Enter the shadows and discover what others never see...
    `);

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

  // Video playback observer for about section
  const phoneVideo = document.getElementById('phone-video');
  
  if (phoneVideo) {
    // Enhanced video setup for better compatibility and quality
    phoneVideo.setAttribute('webkit-playsinline', 'true');
    phoneVideo.setAttribute('playsinline', 'true');
    phoneVideo.setAttribute('muted', 'true');
    phoneVideo.setAttribute('autoplay', 'true');
    phoneVideo.muted = true; // Ensure muted is set programmatically
    
    // Force load the video with quality optimization
    phoneVideo.load();
    
    // Wait for video metadata to ensure proper dimensions
    phoneVideo.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded - dimensions:', phoneVideo.videoWidth, 'x', phoneVideo.videoHeight);
      
      // Force video to fill the container completely
      phoneVideo.style.width = '100%';
      phoneVideo.style.height = '100%';
      phoneVideo.style.objectFit = 'cover';
      phoneVideo.style.objectPosition = 'center center';
      phoneVideo.style.minWidth = '100%';
      phoneVideo.style.minHeight = '100%';
      
      // Try to play once metadata is loaded
      phoneVideo.play().catch(e => {
        console.log('Video metadata play attempt failed:', e);
      });
    });
    
    // Add quality optimization for hosted platforms
    phoneVideo.addEventListener('canplaythrough', () => {
      console.log('Video can play through');
      // Ensure video quality is maintained
      phoneVideo.style.imageRendering = 'crisp-edges';
      phoneVideo.style.transform = 'translateZ(0)';
    });
    
    // Add a fallback for autoplay restrictions
    let videoPlayAttempted = false;
    let userHasInteracted = false;
    
    // Track user interaction to enable video playback
    function enableVideoAfterInteraction() {
      if (!userHasInteracted) {
        userHasInteracted = true;
        if (phoneVideo && phoneVideo.paused) {
          phoneVideo.play().catch(e => {
            console.log('Video play after interaction failed:', e);
          });
        }
      }
    }
    
    // Listen for any user interaction to enable video
    document.addEventListener('click', enableVideoAfterInteraction, { once: true });
    document.addEventListener('touchstart', enableVideoAfterInteraction, { once: true });
    document.addEventListener('scroll', enableVideoAfterInteraction, { once: true });
    
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Multiple attempts to play video when about section is visible
          if (!videoPlayAttempted) {
            videoPlayAttempted = true;
            
            // Immediate play attempt
            phoneVideo.play().catch(e => {
              console.log('Immediate video autoplay prevented:', e);
              
              // Retry after a short delay
              setTimeout(() => {
                phoneVideo.play().catch(e2 => {
                  console.log('Delayed video autoplay prevented:', e2);
                });
              }, 500);
            });
          } else {
            // Resume if paused
            if (phoneVideo.paused) {
              phoneVideo.play().catch(e => {
                console.log('Video resume prevented:', e);
              });
            }
          }
        } else {
          // Pause video when about section is not visible
          if (!phoneVideo.paused) {
            phoneVideo.pause();
          }
        }
      });
    }, {
      threshold: 0.2, // Reduced threshold for earlier triggering
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe the about section
    if (aboutSection) {
      videoObserver.observe(aboutSection);
    }

    // Enhanced video event handlers
    phoneVideo.addEventListener('loadstart', () => {
      console.log('Video loading started');
    });
    
    phoneVideo.addEventListener('canplay', () => {
      console.log('Video can start playing');
      // Try to play when video is ready
      if (phoneVideo.paused) {
        phoneVideo.play().catch(e => {
          console.log('Video canplay autoplay prevented:', e);
        });
      }
    });

    phoneVideo.addEventListener('playing', () => {
      console.log('Video is playing');
    });

    phoneVideo.addEventListener('error', (e) => {
      console.error('Video loading error:', e);
      // Hide video and show fallback if video fails to load
      phoneVideo.style.display = 'none';
      
      // Show the fallback image from HTML
      const appInterface = document.querySelector('.app-interface');
      if (appInterface) {
        const fallbackImg = phoneVideo.querySelector('img');
        if (fallbackImg) {
          fallbackImg.style.display = 'block';
          fallbackImg.style.position = 'absolute';
          fallbackImg.style.top = '0';
          fallbackImg.style.left = '0';
          fallbackImg.style.zIndex = '2';
        }
      }
    });

    // Additional play attempt when user scrolls to about section
    window.addEventListener('scroll', () => {
      if (aboutSection) {
        const rect = aboutSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible && phoneVideo.paused && userHasInteracted) {
          phoneVideo.play().catch(e => {
            console.log('Scroll-triggered video play prevented:', e);
          });
        }
      }
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
});
