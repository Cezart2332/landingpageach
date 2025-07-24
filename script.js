// Mobile Navigation Toggle
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

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
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          // Update the fullpage scroll system
          currentSectionIndex = 0;
          updateIndicators();
        } else {
          // For other sections, account for navbar height
          const elementPosition = targetSection.offsetTop;
          const offsetPosition = elementPosition - navbarHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
          
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

  // Fullpage scroll functionality
  const sections = document.querySelectorAll('section');
  let isScrolling = false;
  let currentSectionIndex = 0;

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

  sections.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'section-indicator';
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.borderRadius = '50%';
    dot.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
    dot.style.cursor = 'pointer';
    dot.style.transition = 'all 0.3s ease';
    
    dot.addEventListener('click', () => {
      if (!isScrolling) {
        scrollToSection(index);
      }
    });
    
    indicators.appendChild(dot);
  });

  document.body.appendChild(indicators);

  // Update active indicator
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

  // Update the scrollToSection function
  function scrollToSection(index) {
    if (index >= 0 && index < sections.length) {
        isScrolling = true;
        currentSectionIndex = index;
        updateIndicators();
        
        const section = sections[index];
        const sectionTop = section.offsetTop;
        
        // Add extra offset for the first section to show full content
        const offset = index === 0 ? -20 : 0;
        
        window.scrollTo({
            top: sectionTop + offset,
            behavior: 'smooth'
        });

        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }
  }

  // Handle wheel events
  window.addEventListener('wheel', (e) => {
    if (!isScrolling) {
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
