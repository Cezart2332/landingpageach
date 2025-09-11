// Business Dashboard Script
document.addEventListener('DOMContentLoaded', () => {
  const pendingRoot = document.getElementById('pendingRoot');
  const activeRoot = document.getElementById('activeRoot');
  const welcomeNameEls = document.querySelectorAll('[data-company-name]');
  const locationsEl = document.getElementById('statLocations');
  const eventsEl = document.getElementById('statEvents');

  function setCompanyName(name){ welcomeNameEls.forEach(el => el.textContent = name || 'Business'); }

  async function loadCompanyData(){
    try {
      // Try profile from API
      const resp = await (window.SecureApiService ? window.SecureApiService.getProfile() : Promise.resolve({ success:false }));
      if(resp.success && resp.data){
        const company = resp.data.company || resp.data;
        setCompanyName(company.name || company.CompanyName || 'Business');
        const isActive = (company.isActive === true || company.isActive === 1 || String(company.isActive) === '1');
        // Toggle views based on isActive
        pendingRoot.style.display = isActive ? 'none' : 'block';
        activeRoot.style.display = isActive ? 'block' : 'none';
        return company;
      }
      // Fallback: show active by default
      pendingRoot.style.display = 'none';
      activeRoot.style.display = 'block';
      setCompanyName('Business');
      return null;
    } catch (e) {
      // Default view
      pendingRoot.style.display = 'none';
      activeRoot.style.display = 'block';
      setCompanyName('Business');
      return null;
    }
  }

  async function fetchDashboardStats(company){
    try{
      if(!company || !company.id){
        locationsEl.textContent = '-';
        eventsEl.textContent = '-';
        return;
      }
      // Locations count
      const locRes = await window.SecureApiService.get(`/companies/${company.id}/locations`);
      const locData = locRes && locRes.success ? locRes.data : [];
      const locationsCount = Array.isArray(locData) ? locData.length : (Number(locData?.count) || 0);
      locationsEl.textContent = String(locationsCount);

      // Events count via formData post as per mobile logic
      const fd = new FormData();
      fd.append('id', String(company.id));
      const evRes = await window.SecureApiService.post('/companyevents', fd);
      const evData = evRes && evRes.success ? evRes.data : [];
      const eventsCount = Array.isArray(evData) ? evData.length : (Number(evData?.count) || 0);
      eventsEl.textContent = String(eventsCount);
    } catch (e){
      // Keep UI graceful
      locationsEl.textContent = '-';
      eventsEl.textContent = '-';
    }
  }

  // Navigation buttons
  document.querySelectorAll('[data-nav="locations"]').forEach(btn => btn.addEventListener('click', () => {
    window.location.href = 'business-locations.html';
  }));
  document.querySelectorAll('[data-nav="events"]').forEach(btn => btn.addEventListener('click', () => {
    window.location.href = 'business-events.html';
  }));

  // Logout with API + redirect
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', async () => {
    const ok = confirm('Sigur te deconectezi?');
    if(!ok) return;
    try { if(window.SecureApiService){ await window.SecureApiService.logout(); } } catch {}
    window.location.href = 'business-auth.html';
  }));

  // Init
  (async () => {
    const company = await loadCompanyData();
    await fetchDashboardStats(company);
  })();
});
