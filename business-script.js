// Business page interactions
document.addEventListener('DOMContentLoaded', () => {
  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('open');
    });
  });

  // Smooth scroll for internal anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if(href && href.startsWith('#') && href.length > 1){
        const target = document.querySelector(href);
        if(target){
          e.preventDefault();
          window.scrollTo({top: target.offsetTop - 80, behavior: 'smooth'});
        }
      }
    });
  });

  // Scroll reveal animation (similar to index page)
  const revealSelectors = '.feature-card, .step, .plan, .faq-item, .stat-card';
  const revealEls = Array.from(document.querySelectorAll(revealSelectors));
  revealEls.forEach((el, idx) => {
    el.classList.add('reveal-init');
    // Stagger via transition delay applied later when visible
    el.dataset.revealDelay = (idx * 60).toString();
  });

  function showEl(el){
    el.classList.add('reveal-visible');
    const delay = el.dataset.revealDelay || '0';
    el.style.transitionDelay = `${Math.min(Number(delay), 600)}ms`;
    el.classList.remove('reveal-init');
  }

  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if(en.isIntersecting){
          showEl(en.target);
          obs.unobserve(en.target);
        }
      });
    }, {threshold:0.15, rootMargin:'0px 0px -50px 0px'});
    revealEls.forEach(el => obs.observe(el));

    // Initial pass: immediately reveal any element already near viewport (desktop large hero case)
    const vh = window.innerHeight;
    revealEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if(rect.top < vh * 0.92) {
        showEl(el);
        obs.unobserve(el);
      }
    });
  } else {
    revealEls.forEach(showEl);
  }

  // Safety fallback: force show after 3s if still hidden (e.g., observer issue)
  setTimeout(() => {
    revealEls.forEach(el => {
      if(!el.classList.contains('reveal-visible')) showEl(el);
    });
  }, 3000);
});
