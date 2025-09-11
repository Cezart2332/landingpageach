// Locations Management (API-driven)
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('locationsContent');

  const state = {
    companyId: null,
    locations: [],
    loading: true,
  };

  init();

  async function init() {
    console.log('📍 LOCATIONS init');
    showLoading();
    try {
      // Ensure auth is present (page also has a guard)
      if (!window.SecureApiService || !window.SecureApiService.isAuthenticated()) {
        return (window.location.href = 'business-auth.html');
      }

      // Small delay to allow any recent auth changes to settle
      await delay(150);

      // Get company profile/id
      const profile = await safeProfile();
      const companyId = extractCompanyId(profile);
      if (!companyId) {
        console.warn('Could not determine company id from profile:', profile);
        showError('Nu s-a putut identifica compania. Reautentifică-te.');
        return;
      }
      state.companyId = companyId;
      await fetchAndRender();
    } catch (err) {
      console.error('LOCATIONS init error:', err);
      showError('A apărut o eroare la încărcarea locațiilor. Încearcă din nou.');
    }
  }

  async function fetchAndRender() {
    state.loading = true;
    showLoading();
    try {
      const list = await fetchLocations(state.companyId);
      state.locations = Array.isArray(list) ? list : [];
      if (!state.locations.length) {
        renderEmpty();
      } else {
        renderList(state.locations);
      }
    } catch (err) {
      console.error('fetchAndRender error:', err);
      showError('Nu s-au putut încărca locațiile.');
    } finally {
      state.loading = false;
    }
  }

  function showLoading() {
    root.innerHTML = `
      <div class="locations-header">
        <div style="flex:1;min-width:240px;">
          <h2 style="margin:0 0 4px;font-size:1.6rem;">Locațiile Tale</h2>
          <p style="margin:0;color:var(--text-secondary);font-size:.85rem;">Se încarcă...</p>
        </div>
        <button class="primary-btn" type="button" id="addBtn"><i class="fas fa-plus"></i><span style="margin-left:6px;"> Adaugă Locație</span></button>
      </div>
      <div class="loading-state" style="display:flex;align-items:center;justify-content:center;padding:40px 0;">
        <div class="loading-content">
          <div class="loading-spinner" style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#7c3aed;border-radius:50%;animation:spin 1s linear infinite;"></div>
          <p style="margin-top:10px;color:#64748b;font-size:.9rem;">Se încarcă locațiile...</p>
        </div>
      </div>`;
    const addBtn = document.getElementById('addBtn');
    if (addBtn) addBtn.addEventListener('click', () => (window.location.href = 'business-add-location.html'));
  }

  function showError(msg) {
    root.innerHTML = `
      <div class="empty-wrap">
        <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
        <h2>Eroare</h2>
        <p>${escapeHtml(msg)}</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="primary-btn" type="button" id="retryBtn"><i class="fas fa-rotate"></i> Încearcă din nou</button>
          <button class="primary-btn" type="button" id="addBtn"><i class="fas fa-plus"></i> Adaugă Locație</button>
        </div>
      </div>`;
    bindHeaderActions();
  }

  function renderEmpty() {
    root.innerHTML = `
      <div class="locations-header">
        <div style="flex:1;min-width:240px;">
          <h2 style="margin:0 0 4px;font-size:1.6rem;">Locațiile Tale</h2>
          <p style="margin:0;color:var(--text-secondary);font-size:.85rem;">0 rezultate</p>
        </div>
        <div class="count-badge">0 LOC</div>
        <button class="primary-btn" type="button" id="addBtn"><i class="fas fa-plus"></i> <span style="margin-left:6px;">Adaugă Locație</span></button>
      </div>
      <div class="empty-wrap">
        <div class="empty-icon"><i class="fas fa-location-dot"></i></div>
        <h2>Nu există locații încă</h2>
        <p>Adaugă prima ta locație pentru a începe să îți gestionezi prezența comercială.</p>
        <button class="primary-btn" type="button" id="addBtn2"><i class="fas fa-plus"></i> Adaugă Locație</button>
      </div>`;
    bindHeaderActions();
    const add2 = document.getElementById('addBtn2');
    if (add2) add2.addEventListener('click', () => (window.location.href = 'business-add-location.html'));
  }

  function renderList(list) {
    const header = `
      <div class="locations-header">
        <div style="flex:1;min-width:240px;">
          <h2 style="margin:0 0 4px;font-size:1.6rem;">Locațiile Tale</h2>
          <p style="margin:0;color:var(--text-secondary);font-size:.85rem;">${list.length} rezultate</p>
        </div>
        <div class="count-badge">${list.length} LOC</div>
        <div style="display:flex;gap:10px;">
          <button class="primary-btn" type="button" id="refreshBtn"><i class="fas fa-rotate"></i></button>
          <button class="primary-btn" type="button" id="addBtn"><i class="fas fa-plus"></i> <span style="margin-left:6px;">Adaugă Locație</span></button>
        </div>
      </div>`;

    const cards = list.map(loc => cardTemplate(loc)).join('');
    const addMore = `<div class="add-more" id="addMore"><i class="fas fa-plus-circle"></i> Adaugă altă locație</div>`;
    root.innerHTML = header + `<div class="cards-grid">${cards}</div>` + addMore;

    bindHeaderActions();
    root.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => window.location.href = 'business-edit-location.html?id=' + btn.dataset.edit));
    root.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => window.location.href = 'business-location.html?id=' + btn.dataset.view));
    root.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => handleDelete(btn.dataset.delete)));
    root.querySelectorAll('[data-hours]').forEach(btn => btn.addEventListener('click', () => window.location.href = 'business-location-hours.html?id=' + btn.dataset.hours));
  }

  function bindHeaderActions() {
    const addBtn = document.getElementById('addBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const retryBtn = document.getElementById('retryBtn');
    if (addBtn) addBtn.addEventListener('click', () => (window.location.href = 'business-add-location.html'));
    if (refreshBtn) refreshBtn.addEventListener('click', () => fetchAndRender());
    if (retryBtn) retryBtn.addEventListener('click', () => fetchAndRender());
    const addMore = document.getElementById('addMore');
    if (addMore) addMore.addEventListener('click', () => (window.location.href = 'business-add-location.html'));
  }

  async function handleDelete(id) {
    if (!id) return;
    const confirmed = window.confirm('Ștergi locația #' + id + '?');
    if (!confirmed) return;
    try {
      await window.SecureApiService.delete(`/locations/${id}`);
      await fetchAndRender();
    } catch (err) {
      console.error('Delete failed', err);
      alert('Ștergerea locației a eșuat.');
    }
  }

  function cardTemplate(l) {
    const id = l.id || l.Id || l.ID;
    const name = l.name || l.Name || 'Locație';
    const address = l.address || l.Address || l.location || 'Adresă necunoscută';
    const hasMenu = !!(l.hasMenu || l.menuAvailable || l.MenuAvailable);
    const tagsArr = l.tags || l.Tags || [];
    const tags = Array.isArray(tagsArr) ? tagsArr : (typeof tagsArr === 'string' ? tagsArr.split(',') : []);
    const tagsHtml = tags.map(t => `<span class="tag">${escapeHtml(String(t).trim())}</span>`).join('');
    // Placeholder photo or existing field
    const photo = l.photo || l.imageUrl || l.ImageUrl || 'https://picsum.photos/seed/acoomh-loc/600/400';
    return `<div class="location-card" data-view="${id}">
      <div class="card-actions">
        <button class="icon-btn" data-edit="${id}" title="Editează"><i class="fas fa-pen"></i></button>
        <button class="icon-btn danger" data-delete="${id}" title="Șterge"><i class="fas fa-trash"></i></button>
      </div>
      <img src="${photo}" alt="${escapeHtml(name)}" class="loc-photo" loading="lazy"/>
      <h4>${escapeHtml(name)}</h4>
      <div class="loc-address"><i class="fas fa-location-dot"></i><span>${escapeHtml(address)}</span></div>
      <div class="tags">${tagsHtml}</div>
      <div class="loc-footer">
        <div class="status-wrap"><span class="status-dot" style="background:${hasMenu ? '#10b981' : '#6b7280'}"></span>${hasMenu ? 'Meniu Disponibil' : 'Fără Meniu'}</div>
        <button class="btn-inline" data-hours="${id}">Program</button>
      </div>
    </div>`;
  }

  async function fetchLocations(companyId) {
    try {
      const url = `/companies/${companyId}/locations`;
      console.log('Fetching locations from:', url);
      const res = await window.SecureApiService.get(url);
      if (res === undefined || res === null) return [];
      return res;
    } catch (err) {
      // If 401, SecureApiService should handle refresh; we surface empty list
      console.error('Error fetching locations:', err);
      return [];
    }
  }

  async function safeProfile() {
    try {
      return await window.SecureApiService.getProfile();
    } catch (e) {
      console.warn('getProfile failed:', e);
      return null;
    }
  }

  function extractCompanyId(profile) {
    if (!profile) return null;
    return (
      profile.id || profile.Id ||
      profile.companyId || profile.CompanyId ||
      (profile.company && (profile.company.id || profile.company.Id)) ||
      null
    );
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
  function escapeHtml(str) { return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
});