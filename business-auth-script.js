// Business Auth Script: handles tab switching, validation, password strength & mock submission
document.addEventListener('DOMContentLoaded', () => {
  // Uses global SecureApiService loaded from secure-api.js
  const tabButtons = document.querySelectorAll('.tab-btn');
  const forms = document.querySelectorAll('.form-view');
  const passwordInput = document.getElementById('signupPassword');
  const confirmInput = document.getElementById('signupConfirm');
  const strengthBars = document.querySelectorAll('.password-strength span');
  const reqItems = document.querySelectorAll('.requirements .r');
  const fileInput = document.getElementById('certificateInput');
  const fileIndicator = document.getElementById('fileIndicator');
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const errorBox = document.getElementById('errorBox');
  const successBox = document.getElementById('successBox');

  function switchTab(target){
    tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === target));
    forms.forEach(f => f.style.display = f.dataset.view === target ? 'block' : 'none');
    if(target === 'signup') location.hash = '#signup'; else location.hash = '#login';
  }

  tabButtons.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  if(location.hash === '#signup') switchTab('signup'); else switchTab('login');

  // Password Strength
  function evaluatePassword(pwd){
    let score = 0;
    if(pwd.length >= 8) score++;
    if(/[a-z]/.test(pwd)) score++;
    if(/[A-Z]/.test(pwd)) score++;
    if(/[0-9]/.test(pwd)) score++;
    if(/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score; // 0..5
  }

  function updateStrength(){
    const pwd = passwordInput.value;
    const score = evaluatePassword(pwd);
    strengthBars.forEach((bar,i) => {
      if(i < score){
        let color = '#ef4444';
        if(score >=3) color='#f59e0b';
        if(score >=4) color='#3b82f6';
        if(score ===5) color='#10b981';
        bar.style.background = color;
      } else {
        bar.style.background = '#2d2d2d';
      }
    });
    // Requirements list
    const tests = [
      pwd.length >= 8,
      /[a-z]/.test(pwd),
      /[A-Z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[^a-zA-Z0-9]/.test(pwd)
    ];
    reqItems.forEach((el,idx) => {
      if(tests[idx]){ el.classList.add('valid'); el.querySelector('i').className='fas fa-check-circle'; }
      else { el.classList.remove('valid'); el.querySelector('i').className='far fa-circle'; }
    });
  }
  passwordInput.addEventListener('input', updateStrength);
  updateStrength();

  // File selection
  fileInput?.addEventListener('change', () => {
    if(fileInput.files && fileInput.files[0]){
      fileIndicator.style.display='flex';
      fileIndicator.querySelector('span').textContent = fileInput.files[0].name;
    } else {
      fileIndicator.style.display='none';
    }
  });

  // Toggle password visibility
  document.querySelectorAll('[data-toggle-pass]').forEach(icon => {
    icon.addEventListener('click', () => {
      const targetId = icon.getAttribute('data-toggle-pass');
      const input = document.getElementById(targetId);
      if(!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  });

  function showError(msg){
    errorBox.textContent = msg; errorBox.style.display='block'; successBox.style.display='none';
  }
  function showSuccess(msg){
    successBox.textContent = msg; successBox.style.display='block'; errorBox.style.display='none';
  }

  // Requests are handled by SecureApiService (timeouts & refresh)

  // Clear errors on input
  document.querySelectorAll('input, select').forEach(el => el.addEventListener('input', ()=>{ errorBox.style.display='none'; }));

  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nameEl = document.getElementById('companyName');
    const emailEl = document.getElementById('signupEmail');
    const categoryEl = document.getElementById('category');
    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const category = categoryEl ? categoryEl.value : '';
    const pwd = passwordInput.value.trim();
    const confirmPwd = confirmInput.value.trim();
    const cert = fileInput && fileInput.files && fileInput.files[0];

    if(!name || !email || !category || !pwd || !confirmPwd || !cert){
      showError('Completează toate câmpurile și încarcă certificatul.');
      return;
    }
    if(pwd !== confirmPwd){
      showError('Parolele nu se potrivesc.');
      return;
    }
    if(pwd.length < 8){
      showError('Parola trebuie să aibă cel puțin 8 caractere.');
      return;
    }
    if(evaluatePassword(pwd) < 3){
      showError('Parola este prea slabă.');
      return;
    }

    const submitBtn = signupForm.querySelector('.submit-btn');
    const prevHtml = submitBtn.innerHTML; submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Trimitere...';

    try{
      const fd = new FormData();
      fd.append('Name', name);
      fd.append('Email', email);
      fd.append('Password', pwd);
      fd.append('Category', category);
      fd.append('IsActive','0');
      fd.append('Certificate', cert);

  const resp = await (window.SecureApiService ? window.SecureApiService.registerWithFile(fd) : Promise.resolve({ success:false, status:0, error:'Secure API indisponibil' }));
  if(!resp.success){ showError(resp.error || `Înregistrarea a eșuat (cod ${resp.status}).`); return; }
      showSuccess('Înregistrare reușită! Redirecționăm...');
      setTimeout(()=> { window.location.href='business-dashboard.html'; }, 900);
    } catch(err){
  showError('Eroare de rețea. Încearcă din nou.');
    } finally {
      submitBtn.disabled = false; submitBtn.innerHTML = prevHtml;
    }
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const loginEmailEl = document.getElementById('loginEmail');
    const loginPwdEl = document.getElementById('loginPassword');
    const username = loginEmailEl ? loginEmailEl.value.trim() : '';
    const pwd = loginPwdEl ? loginPwdEl.value.trim() : '';
    if(!username){ showError('Te rog să introduci email-ul sau username-ul.'); return; }
    if(!pwd){ showError('Te rog să introduci parola.'); return; }
    if(pwd.length < 6){ showError('Parola trebuie să conțină cel puțin 6 caractere.'); return; }

    const btn = loginForm.querySelector('.submit-btn');
    const prev = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Autentificare...';

    try{
  const res = await (window.SecureApiService ? window.SecureApiService.login({ username, password: pwd }) : Promise.resolve({ success:false, status:0, error:'Secure API indisponibil' }));
  if(res.status === 401 || (!res.success && res.status === 401)){ showError('Email sau parolă incorectă. Verifică datele.'); return; }
  if(!res.success){ showError(res.error || `Eroare la autentificare (cod ${res.status}).`); return; }
      showSuccess('Autentificat! Redirecționăm...');
      setTimeout(()=> { window.location.href='business-dashboard.html'; }, 700);
    } catch(err){
  showError('Eroare de rețea. Încearcă din nou.');
    } finally {
      btn.disabled = false; btn.innerHTML = prev;
    }
  });
});
