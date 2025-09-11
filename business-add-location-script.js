// Add Location (API-driven)
// Uses SecureApiService to POST a new location for the authenticated company.

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const form = document.getElementById('addLocationForm');
  const nameEl = document.getElementById('name');
  const nameErrorEl = document.getElementById('nameError');
  const addressEl = document.getElementById('address');
  const phoneEl = document.getElementById('phone');
  const descEl = document.getElementById('description');
  const tagsEl = document.getElementById('tags');
  const tagsPreview = document.getElementById('tagsPreview');
  const categoriesWrap = document.getElementById('categories');
  const reservationsToggle = document.getElementById('reservationsToggle');
  const submitBtn = document.getElementById('submitBtn');
  const geoStatus = document.getElementById('geoStatus');
  const photoArea = document.getElementById('photoArea');
  const photoInput = document.getElementById('photoInput');

  // State
  let companyId = null;
  let selectedCategory = '';
  let currentTags = [];
  let photoFile = null; // File
  let addressDebounce;
  const geoData = { lat: null, lng: null, loading: false };

  const GEO_API_KEY = 'd5466dbfa4a84344b872af4009106e17';
  const CATEGORIES = ['restaurant', 'pub', 'cafenea', 'club'];

  // Helpers
  function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function setSubmit(text, disabled) { if (submitBtn) { submitBtn.innerHTML = text; submitBtn.disabled = !!disabled; } }

  // Init categories
  if (categoriesWrap) {
    categoriesWrap.innerHTML = CATEGORIES.map(c => `<button type="button" class="cat-pill" data-cat="${c}">${c}</button>`).join('');
    categoriesWrap.querySelectorAll('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.cat;
        categoriesWrap.querySelectorAll('.cat-pill').forEach(b => b.classList.toggle('active', b === btn));
        validate();
      });
    });
  }

  // Tags input
  function renderTags() {
    tagsPreview.innerHTML = currentTags.map(t => `<span class="tag-chip">${escapeHtml(t)}<button type="button" data-del="${escapeHtml(t)}">×</button></span>`).join('');
    tagsPreview.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
      currentTags = currentTags.filter(x => x !== btn.dataset.del);
      renderTags();
      validate();
    }));
  }
  if (tagsEl) {
    tagsEl.addEventListener('input', () => {
      const raw = tagsEl.value;
      if (raw.includes(',')) {
        raw.split(',').map(t => t.trim()).filter(Boolean).forEach(t => { if (!currentTags.includes(t) && currentTags.length < 50) currentTags.push(t); });
        tagsEl.value = '';
        renderTags();
        validate();
      }
    });
    tagsEl.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); const val = tagsEl.value.trim(); if (val) { if (!currentTags.includes(val)) currentTags.push(val); tagsEl.value = ''; renderTags(); validate(); } }
      if (e.key === 'Backspace' && !tagsEl.value) { currentTags.pop(); renderTags(); validate(); }
    });
  }

  // Photo handlers
  function handlePhoto() {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return;
    photoFile = file;
    const url = URL.createObjectURL(file);
    photoArea.innerHTML = `<img src="${url}" class="photo-preview" alt="preview"/><button type="button" class="remove-photo" id="removePhoto">Elimină fotografia</button>`;
    const rm = document.getElementById('removePhoto');
    if (rm) rm.addEventListener('click', () => {
      photoFile = null; photoInput.value = '';
      photoArea.innerHTML = `<i class=\"fas fa-camera\" style=\"font-size:2rem;color:#a855f7;\"></i><p style=\"margin:10px 0 4px;font-weight:600;color:#a855f7;\">Adaugă o fotografie</p><p style=\"margin:0;color:#64748b;font-size:.7rem;\">Click sau trage o imagine (16:9 recomandat)</p><input type=\"file\" id=\"photoInput\" accept=\"image/*\" style=\"display:none;\" />`;
      document.getElementById('photoInput').addEventListener('change', handlePhoto);
    });
  }
  if (photoArea) photoArea.addEventListener('click', () => photoInput.click());
  if (photoInput) photoInput.addEventListener('change', handlePhoto);
  if (photoArea) {
    photoArea.addEventListener('dragover', e => { e.preventDefault(); photoArea.style.borderColor = '#a855f7'; });
    photoArea.addEventListener('dragleave', () => photoArea.style.borderColor = 'rgba(139,92,246,.3)');
    photoArea.addEventListener('drop', e => { e.preventDefault(); photoArea.style.borderColor = 'rgba(139,92,246,.3)'; if (e.dataTransfer.files[0]) { photoInput.files = e.dataTransfer.files; handlePhoto(); } });
  }

  // Geocoding
  function updateGeoStatus() {
    if (!geoStatus) return;
    if (geoData.loading) { geoStatus.innerHTML = `<div class="geo-status geo-loading"><i class="fas fa-hourglass-half"></i> Obțin coordonate...</div>`; return; }
    if (geoData.lat && geoData.lng) { geoStatus.innerHTML = `<div class="geo-status geo-ok"><i class="fas fa-check-circle"></i> Localizat: ${geoData.lat}, ${geoData.lng}</div>`; return; }
    if (addressEl.value.trim().length >= 5) { geoStatus.innerHTML = `<div class="geo-status geo-loading" style="background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.4);color:#ef4444;"><i class="fas fa-triangle-exclamation"></i> Nu s-au putut obține coordonatele</div>`; return; }
    geoStatus.innerHTML = '';
  }
  function geocode(addr) {
    geoData.loading = true; updateGeoStatus();
    fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addr + ', Romania')}&limit=1&lang=ro&filter=countrycode:ro&apiKey=${GEO_API_KEY}`)
      .then(r => r.json())
      .then(data => {
        const feat = data.features && data.features[0];
        if (feat) { const [lng, lat] = feat.geometry.coordinates; geoData.lat = Number(lat).toFixed(6); geoData.lng = Number(lng).toFixed(6); }
        else { geoData.lat = null; geoData.lng = null; }
      })
      .catch(() => { geoData.lat = null; geoData.lng = null; })
      .finally(() => { geoData.loading = false; updateGeoStatus(); validate(); });
  }
  if (addressEl) addressEl.addEventListener('input', () => {
    if (addressDebounce) clearTimeout(addressDebounce);
    const val = addressEl.value.trim();
    if (val.length < 5) { geoData.lat = null; geoData.lng = null; updateGeoStatus(); validate(); return; }
    addressDebounce = setTimeout(() => geocode(val), 650);
  });

  // Validation
  function validate() {
    let valid = true;
    const name = nameEl.value.trim();
    if (!name) { nameEl.classList.add('error'); nameErrorEl.style.display = 'block'; nameErrorEl.textContent = 'Introdu numele locației.'; valid = false; }
    else { nameEl.classList.remove('error'); nameErrorEl.style.display = 'none'; }
    if (!addressEl.value.trim() || !geoData.lat || !geoData.lng) valid = false;
    if (!phoneEl.value.trim()) valid = false;
    if (!selectedCategory) valid = false;
    if (submitBtn) submitBtn.disabled = !valid;
    return valid;
  }
  ['input', 'blur'].forEach(ev => nameEl.addEventListener(ev, validate));
  if (phoneEl) phoneEl.addEventListener('input', validate);
  if (descEl) descEl.addEventListener('input', validate);

  // API helpers
  async function safeProfile() {
    try { return await window.SecureApiService.getProfile(); } catch (e) { return null; }
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
  async function checkLocationNameExists(companyId, name) {
    try {
      const resp = await window.SecureApiService.get(`/companies/${companyId}/locations`);
      const list = (resp && resp.success && Array.isArray(resp.data)) ? resp.data : (Array.isArray(resp) ? resp : []);
      return list.some(loc => (loc.name || loc.Name || '').toLowerCase() === name.toLowerCase());
    } catch (err) {
      console.warn('Name check failed:', err);
      return false;
    }
  }

  // Submit
  if (form) form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmit('<i class="fas fa-spinner fa-spin"></i> Creare...', true);

    try {
      // Ensure companyId
      if (!companyId) {
        const profile = await safeProfile();
        companyId = extractCompanyId(profile);
      }
      if (!companyId) throw new Error('Nu s-a putut identifica compania.');

      // Duplicate name check
      const name = nameEl.value.trim();
      const exists = await checkLocationNameExists(companyId, name);
      if (exists) {
        nameErrorEl.style.display = 'block';
        nameErrorEl.textContent = 'O locație cu acest nume există deja. Alege un nume diferit.';
        alert('Nume Locație Duplicat: O locație cu acest nume există deja pentru compania ta.');
        setSubmit('<i class="fas fa-plus-circle"></i> Creează Locație', false);
        return;
      }

      // Validate numeric lat/lng
      const latNum = Number(geoData.lat);
      const lngNum = Number(geoData.lng);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        alert('Coordonatele nu sunt valide. Reintrodu adresa.');
        setSubmit('<i class="fas fa-plus-circle"></i> Creează Locație', false);
        return;
      }

      const fd = new FormData();
      fd.append('name', name);
      fd.append('address', addressEl.value.trim());
      fd.append('category', selectedCategory);
      fd.append('phoneNumber', phoneEl.value.trim());
      fd.append('latitude', latNum.toFixed(6));
      fd.append('longitude', lngNum.toFixed(6));
      fd.append('tags', currentTags.join(', '));
      fd.append('description', descEl.value || '');
      fd.append('reservationsEnabled', reservationsToggle.checked ? 'true' : 'false');
      if (photoFile) fd.append('photo', photoFile, photoFile.name || 'location_photo.jpg');

      const resp = await window.SecureApiService.post(`/companies/${companyId}/locations`, fd);
      if (resp && resp.success) {
        alert('Locația a fost adăugată cu succes!');
        window.location.href = 'business-locations.html';
        return;
      }

      // Error case
      let msg = 'Adăugarea locației a eșuat';
      if (resp && resp.error) {
        msg = resp.error?.detail || resp.error?.Error || resp.error?.message || msg;
        if (resp.status === 409) {
          alert('Nume Locație Duplicat: ' + msg);
          setSubmit('<i class="fas fa-plus-circle"></i> Creează Locație', false);
          return;
        }
      }
      alert(msg);
      setSubmit('<i class="fas fa-plus-circle"></i> Creează Locație', false);
    } catch (err) {
      console.error('Create location error:', err);
      alert('Eroare: adăugarea locației a eșuat');
      setSubmit('<i class="fas fa-plus-circle"></i> Creează Locație', false);
    }
  });

  // Bootstrap: get company id ASAP for later use
  (async function initCompany() {
    try {
      const profile = await safeProfile();
      companyId = extractCompanyId(profile);
    } catch { /* no-op */ }
  })();

  // Initial validate
  validate();
});