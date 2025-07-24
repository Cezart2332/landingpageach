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
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
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

  // Typewriter effect for hero title
  function typeWriter(element, text, speed = 100) {
    element.innerHTML = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        if (text.charAt(i) === "<") {
          let tag = "";
          while (text.charAt(i) !== ">" && i < text.length) {
            tag += text.charAt(i);
            i++;
          }
          tag += text.charAt(i);
          element.innerHTML += tag;
        } else {
          element.innerHTML += text.charAt(i);
        }
        i++;
        setTimeout(type, speed);
      }
    }

    type();
  }

  // Initialize typewriter effect on hero title
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    const originalText = heroTitle.innerHTML;
    setTimeout(() => {
      typeWriter(heroTitle, originalText, 50);
    }, 1000);
  }

  // Loading screen effect
  window.addEventListener("load", function () {
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 100);
  });

  // Cursor trail effect
  const coords = { x: 0, y: 0 };
  const circles = document.querySelectorAll(".cursor-circle");

  if (circles.length === 0) {
    // Create cursor trail circles
    for (let i = 0; i < 12; i++) {
      const circle = document.createElement("div");
      circle.className = "cursor-circle";
      circle.style.position = "fixed";
      circle.style.width = "20px";
      circle.style.height = "20px";
      circle.style.background = `rgba(139, 92, 246, ${0.8 - i * 0.05})`;
      circle.style.borderRadius = "50%";
      circle.style.pointerEvents = "none";
      circle.style.zIndex = "9999";
      circle.style.transition = "transform 0.1s ease";
      document.body.appendChild(circle);
    }
  }

  const cursorCircles = document.querySelectorAll(".cursor-circle");

  window.addEventListener("mousemove", function (e) {
    coords.x = e.clientX;
    coords.y = e.clientY;
  });

  function animateCircles() {
    let x = coords.x;
    let y = coords.y;

    cursorCircles.forEach((circle, index) => {
      circle.style.left = x - 10 + "px";
      circle.style.top = y - 10 + "px";
      circle.style.transform = `scale(${
        (cursorCircles.length - index) / cursorCircles.length
      })`;

      circle.x = x;
      circle.y = y;

      const nextCircle = cursorCircles[index + 1] || cursorCircles[0];
      x += (nextCircle.x || 0) * 0.3;
      y += (nextCircle.y || 0) * 0.3;
    });

    requestAnimationFrame(animateCircles);
  }

  animateCircles();

  // Interactive background particles
  function createParticle() {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.position = "fixed";
    particle.style.width = "2px";
    particle.style.height = "2px";
    particle.style.background = "rgba(139, 92, 246, 0.5)";
    particle.style.borderRadius = "50%";
    particle.style.pointerEvents = "none";
    particle.style.zIndex = "1";
    particle.style.left = Math.random() * window.innerWidth + "px";
    particle.style.top = window.innerHeight + "px";

    document.body.appendChild(particle);

    const duration = Math.random() * 3000 + 2000;
    const drift = (Math.random() - 0.5) * 100;

    particle
      .animate(
        [
          { transform: "translateY(0px) translateX(0px)", opacity: 0 },
          {
            transform: `translateY(-${
              window.innerHeight + 100
            }px) translateX(${drift}px)`,
            opacity: 1,
          },
        ],
        {
          duration: duration,
          easing: "linear",
        }
      )
      .addEventListener("finish", () => {
        particle.remove();
      });
  }

  // Create particles periodically
  setInterval(createParticle, 300);

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
});

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
