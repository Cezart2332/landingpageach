// Business page interactions
document.addEventListener('DOMContentLoaded', () => {
  const DEBUG = (()=>{ try{ const v = localStorage.getItem('ac_debug'); return v===null?true:(v==='1'||v==='true'||v==='on'); }catch{return true;} })();
  const dbg = (...a)=>{ if(DEBUG) console.debug('[BusinessPage]', ...a); };
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

  // Keep logged-in users logged in: intercept "Alătură-te" button
  try {
    const joinBtn = document.querySelector('.biz-menu a[href="business-auth.html"], .biz-menu a.biz-cta-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', async (e) => {
        try {
          if (!window.SecureApiService) return; // no client, allow default
          // Print storage snapshot for debugging
          const ss = {}; const ls = {};
          try { for(let i=0;i<sessionStorage.length;i++){ const k=sessionStorage.key(i); if(k) ss[k]=sessionStorage.getItem(k); } } catch{}
          try { for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k) ls[k]=localStorage.getItem(k); } } catch{}
          dbg('join:storageSnapshot', { sessionStorage: ss, localStorage: ls });

          const authed = await window.SecureApiService.isAuthenticated();
          dbg('join:isAuthenticated', authed);
          if (authed) {
            e.preventDefault();
            window.location.href = 'business-dashboard.html';
          }
        } catch (err) {
          dbg('join:error', err);
        }
      }, { capture: true });
    }
  } catch (e) { dbg('join:initError', e); }
});
