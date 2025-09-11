// Edit Location (API-driven)
// Loads existing location details, allows updating fields, uploads photo/menu, and saves via PUT.

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) {
    alert('Lipsește parametrul id al locației.');
    window.location.href = 'business-locations.html';
    return;
  }

  // Elements
  const form = document.getElementById('editLocationForm');
  const nameEl = document.getElementById('name');
  const addressEl = document.getElementById('address');
  const latEl = document.getElementById('lat');
  const lngEl = document.getElementById('lng');
  const descEl = document.getElementById('description');
  const tagsEl = document.getElementById('tags');
  const tagsPreview = document.getElementById('tagsPreview');
  const photoArea = document.getElementById('photoArea');
  const menuBtn = document.getElementById('menuBtn');
  const menuStatus = document.getElementById('menuStatus');
  const geoBtn = document.getElementById('geoBtn');
  const gpsBtn = document.getElementById('gpsBtn');
  const geoStatus = document.getElementById('geoStatus');
  const reservationsToggle = document.getElementById('reservationsToggle');
  const saveBtn = document.getElementById('saveBtn');

  // State
  let currentTags = [];
  let photoFile = null; // File
  let menuFile = null; // File
  let isLoading = false;
  const geo = { loading: false };

  // Utils
  const escapeHtml = (s) => (s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c] || c));
  const setSaveBtn = (text, disabled) => { if (saveBtn) { saveBtn.innerHTML = `<i class="fas fa-save"></i> ${text}`; saveBtn.disabled = !!disabled; } };
  function validate() {
    let valid = true;
    if (!nameEl.value.trim()) valid = false;
    if (!addressEl.value.trim()) valid = false;
    if (!latEl.value || !lngEl.value) valid = false;
    if (saveBtn) saveBtn.disabled = !valid;
    return valid;
  }

  // Tags: chips UI
  function parseTagsToArray(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map(t => t.trim()).filter(Boolean);
  }
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
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = tagsEl.value.trim();
        if (val) {
          if (!currentTags.includes(val)) currentTags.push(val);
          tagsEl.value = '';
          renderTags();
          validate();
        }
      }
      if (e.key === 'Backspace' && !tagsEl.value) {
        currentTags.pop();
        renderTags();
        validate();
      }
    });
  }

  // Photo preview handling
  function renderPhoto(url) {
    if (!photoArea) return;
    if (!url) {
      photoArea.innerHTML = `<i class="fas fa-camera" style="font-size:2rem;color:#a855f7;"></i><p style="margin:10px 0 4px;font-weight:600;color:#a855f7;">Adaugă / Înlocuiește foto</p><p style="margin:0;color:#64748b;font-size:.7rem;">Click pentru selectare (16:9)</p>`;
      return;
    }
    photoArea.innerHTML = `<img src="${escapeHtml(url)}" class="photo-preview" alt="loc" loading="lazy"/><button type="button" class="remove-photo" id="removePhoto"><i class='fas fa-times'></i> Elimină</button>`;
    const rm = document.getElementById('removePhoto');
    if (rm) rm.addEventListener('click', () => {
      photoFile = null;
      renderPhoto('');
    });
  }
  function choosePhoto() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      photoFile = f;
      const url = URL.createObjectURL(f);
      renderPhoto(url);
    };
    input.click();
  }
  if (photoArea) photoArea.addEventListener('click', () => choosePhoto());

  // Menu upload
  if (menuBtn) menuBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/pdf';
    input.onchange = () => {
      const f = input.files && input.files[0];
      if (!f) return;
      menuFile = f;
      if (menuStatus) menuStatus.innerHTML = `<span style='color:#22c55e;font-weight:600;'>${escapeHtml(f.name)} ✓</span>`;
    };
    input.click();
  });

  // Geocoding + GPS demo
  const GEO_KEY = 'd5466dbfa4a84344b872af4009106e17';
  function updateGeoStatus() {
    if (!geoStatus) return;
    if (geo.loading) { geoStatus.innerHTML = `<span style='color:#f59e0b;'>Obțin coordonate...</span>`; return; }
    if (latEl.value && lngEl.value) geoStatus.innerHTML = `<span style='color:#22c55e;'>Coord: ${latEl.value}, ${lngEl.value}</span>`; else geoStatus.innerHTML = '';
  }
  if (geoBtn) geoBtn.addEventListener('click', () => {
    const addr = addressEl.value.trim();
    if (!addr) { alert('Introdu adresa.'); return; }
    geo.loading = true; updateGeoStatus();
    fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addr + ', Romania')}&limit=1&lang=ro&filter=countrycode:ro&apiKey=${GEO_KEY}`)
      .then(r => r.json())
      .then(d => {
        const feat = d.features && d.features[0];
        if (feat) {
          const [lng, lat] = feat.geometry.coordinates;
          latEl.value = Number(lat).toFixed(6);
          lngEl.value = Number(lng).toFixed(6);
        } else {
          alert('Adresă negăsită');
        }
      })
      .catch(() => alert('Eroare geocodare'))
      .finally(() => { geo.loading = false; updateGeoStatus(); validate(); });
  });
  if (gpsBtn) gpsBtn.addEventListener('click', () => {
    alert('Demo GPS – valori setate.');
    latEl.value = '44.426800';
    lngEl.value = '26.102500';
    updateGeoStatus();
    validate();
  });

  // Load existing location via API
  async function loadLocation() {
    isLoading = true;
    try {
      const resp = await (window.SecureApiService?.get(`/locations/${id}`) || {});
      const data = resp && resp.success ? resp.data : null;
      if (!data) throw new Error('Nu s-au putut încărca detaliile locației');

      nameEl.value = data.name || '';
      addressEl.value = data.address || '';
      latEl.value = (data.latitude != null ? String(data.latitude) : '');
      lngEl.value = (data.longitude != null ? String(data.longitude) : '');
      descEl.value = data.description || '';

      // tags: string or array
      currentTags = parseTagsToArray(data.tags || (Array.isArray(data.Tags) ? data.Tags.join(',') : data.Tags));
      renderTags();

      // reservations flag
      const flag = (data.reservationsEnabled ?? data.ReservationsEnabled);
      if (typeof flag === 'boolean') reservationsToggle.checked = flag; else reservationsToggle.checked = true;

      // photo
      const photo = data.photoUrl || data.photo || '';
      renderPhoto(photo);

      // menu status
      if (data.hasMenu || data.HasMenu) {
        if (menuStatus) menuStatus.innerHTML = `<span style="color:#22c55e;font-weight:600;">Meniu existent ✅</span>`;
      }

    } catch (err) {
      console.error('Load location error:', err);
      alert('Eroare: nu s-au putut încărca detaliile locației');
      window.location.href = 'business-locations.html';
    } finally {
      isLoading = false;
      validate();
      updateGeoStatus();
    }
  }

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaveBtn('<i class="fas fa-spinner fa-spin"></i> Salvare...', true);

    try {
      const fd = new FormData();
      fd.append('name', nameEl.value.trim());
      fd.append('address', addressEl.value.trim());
      fd.append('latitude', latEl.value.trim());
      fd.append('longitude', lngEl.value.trim());
      fd.append('tags', currentTags.join(', '));
      fd.append('description', descEl.value || '');
      fd.append('reservationsEnabled', reservationsToggle.checked ? 'true' : 'false');

      if (photoFile) {
        fd.append('photo', photoFile, photoFile.name || 'location_photo.jpg');
      }
      if (menuFile) {
        fd.append('menu', menuFile, menuFile.name || 'menu.pdf');
      }

      const resp = await (window.SecureApiService?.put(`/locations/${id}`, fd) || {});
      if (resp && resp.success) {
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Locație actualizată';
        setTimeout(() => { window.location.href = `business-location.html?id=${encodeURIComponent(id)}`; }, 700);
        return;
      }

      // Error path
      let errorMessage = 'Actualizarea a eșuat';
      if (resp && resp.error) {
        errorMessage = resp.error?.Error || resp.error?.message || errorMessage;
      }
      alert(errorMessage);
      setSaveBtn(' Salvează Modificările', false);
    } catch (err) {
      console.error('Update error:', err);
      alert('Eroare de rețea la actualizare');
      setSaveBtn(' Salvează Modificările', false);
    }
  }

  // Wire up
  if (form) form.addEventListener('submit', handleSubmit);
  ['input','blur'].forEach(ev => nameEl.addEventListener(ev, validate));
  addressEl.addEventListener('input', validate);
  latEl.addEventListener('input', validate);
  lngEl.addEventListener('input', validate);

  // Start
  loadLocation();
});
