// Location Profile (API-driven)
// Loads location details, weekly hours, and recent reservations via SecureApiService.

document.addEventListener('DOMContentLoaded', () => {
  // Debug toggle: set localStorage.ac_debug = '1' to enable, '0' to disable (defaults to enabled)
  const DEBUG = (() => {
    try {
      const v = localStorage.getItem('ac_debug');
      if (v === null) return true; // default ON while investigating
      return v === '1' || v === 'true' || v === 'on';
    } catch { return true; }
  })();
  const dbg = (...args) => { if (DEBUG) console.debug('[LocationProfile]', ...args); };

  const root = document.getElementById('locationContent');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const idNum = Number(id);
  dbg('DOMContentLoaded', { id, idNum, href: location.href });

  if (!id) {
    if (root) root.innerHTML = `<p style="color:#ef4444;font-weight:600;">ID locație lipsă.</p>`;
    return;
  }

  const state = {
    location: null,
    hours: [],
    reservations: [],
    loading: true,
  };

  init();

  async function init() {
    try {
      dbg('init:start', { hasApi: !!window.SecureApiService, isAuth: !!window.SecureApiService?.isAuthenticated?.() });
      if (!window.SecureApiService || !window.SecureApiService.isAuthenticated()) {
        dbg('auth:missing -> redirect to business-auth.html');
        window.location.href = 'business-auth.html';
        return;
      }
      showLoading();
      await Promise.all([
        loadLocation(idNum),
        loadHours(idNum),
        loadRecentReservations(idNum)
      ]);
      dbg('init:data-loaded', { hasLocation: !!state.location, hours: state.hours.length, reservations: state.reservations.length });
      render();
    } catch (err) {
      console.error('Location init error:', err);
      showError('A apărut o eroare la încărcarea locației.');
    } finally {
      state.loading = false;
      dbg('init:done');
    }
  }

  function showLoading() {
    if (!root) return;
    root.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;padding:40px 0;">
        <div class="loading-spinner" style="width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:#7c3aed;border-radius:50%;animation:spin 1s linear infinite;"></div>
        <span style="margin-left:10px;color:#64748b;">Se încarcă detaliile locației...</span>
      </div>`;
  }

  function showError(msg) {
    if (!root) return;
    root.innerHTML = `
      <div class="empty-wrap">
        <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
        <h2>Eroare</h2>
        <p>${escapeHtml(msg)}</p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="primary-btn" type="button" id="backBtn"><i class="fas fa-arrow-left"></i> Înapoi</button>
        </div>
      </div>`;
    const backBtn = document.getElementById('backBtn');
    if (backBtn) backBtn.addEventListener('click', () => history.back());
  }

  async function loadLocation(locationId) {
    try {
      dbg('loadLocation:GET', { url: `/locations/${locationId}` });
      const resp = await (window.SecureApiService?.get(`/locations/${locationId}`) || {});
      dbg('loadLocation:resp', resp);
      const data = resp && resp.success ? resp.data : resp; // service may return raw
      if (!data) throw new Error('Nu s-au putut încărca detaliile locației');
      state.location = data;
      dbg('loadLocation:resolved', { id: data?.id ?? data?.Id ?? data?.ID, name: data?.name ?? data?.Name });
    } catch (err) {
      console.error('Load location error', err);
      state.location = null;
    }
  }

  async function loadHours(locationId) {
    try {
      dbg('loadHours:GET', { url: `/locations/${locationId}/hours` });
      const resp = await (window.SecureApiService?.get(`/locations/${locationId}/hours`) || {});
      dbg('loadHours:resp', resp);
      const list = extractHoursList(resp);
      dbg('loadHours:extracted', list);
      const mapped = Array.isArray(list) ? list.map(mapBackendHour).filter(Boolean) : [];
      dbg('loadHours:mapped', mapped);
      // ensure 7 days
      const DAYS = [0,1,2,3,4,5,6];
      state.hours = DAYS.map(d => mapped.find(m => m.day === d) || { day: d, isOpen: true, is24: false, open: '09:00', close: '22:00' });
      dbg('loadHours:finalNormalized7', state.hours);
    } catch (err) {
      console.warn('Hours load failed, using defaults', err);
      state.hours = Array.from({ length: 7 }, (_, i) => ({ day: i, isOpen: true, is24: false, open: '09:00', close: '22:00' }));
      dbg('loadHours:defaultsUsed', state.hours);
    }
  }

  async function loadRecentReservations(locationId) {
    try {
      // Prefer /locations/{id}/reservations; fallback to /reservations?locationId=
      dbg('loadRecentReservations:GET', { url: `/locations/${locationId}/reservations?limit=3` });
      let resp = await (window.SecureApiService?.get(`/locations/${locationId}/reservations?limit=3`) || {});
      dbg('loadRecentReservations:resp1', resp);
      let list = resp && resp.success ? resp.data : resp;
      if (!Array.isArray(list)) {
        dbg('loadRecentReservations:fallbackGET', { url: `/reservations?locationId=${encodeURIComponent(locationId)}&limit=3` });
        resp = await (window.SecureApiService?.get(`/reservations?locationId=${encodeURIComponent(locationId)}&limit=3`) || {});
        dbg('loadRecentReservations:resp2', resp);
        list = resp && resp.success ? resp.data : resp;
      }
      state.reservations = Array.isArray(list) ? list : [];
      dbg('loadRecentReservations:final', { count: state.reservations.length });
    } catch (err) {
      console.warn('Reservations load failed', err);
      state.reservations = [];
      dbg('loadRecentReservations:errorEmpty');
    }
  }

  function render() {
    dbg('render:start', { hasRoot: !!root, hasLocation: !!state.location, hours: state.hours.length, reservations: state.reservations.length });
    if (!root || !state.location) { showError('Detaliile locației nu sunt disponibile.'); return; }
    const l = state.location;

    const idVal = l.id || l.Id || l.ID || Number(id);
    const name = l.name || l.Name || 'Locație';
    const address = l.address || l.Address || l.location || 'Adresă necunoscută';
    const tagsArr = l.tags || l.Tags || [];
    const tags = Array.isArray(tagsArr) ? tagsArr : (typeof tagsArr === 'string' ? tagsArr.split(',') : []);
    const photo = l.photoUrl || l.photo || l.imageUrl || l.ImageUrl || 'https://picsum.photos/seed/lprof'+id+'/1200/800';

  const todayText = todayHoursText(state.hours);
  dbg('render:todayText', todayText);

    root.innerHTML = `
      <div class="hero-card">
        <div class="hero-media"><img src="${escapeHtml(photo)}" alt="${escapeHtml(name)}" loading="lazy"/></div>
        <h1 class="loc-title">${escapeHtml(name)}</h1>
        <div class="address-line"><i class="fas fa-location-dot" style="color:#7c3aed;"></i><span>${escapeHtml(address)}</span></div>
        <div class="tag-badges">${tags.map(t => `<span class='tag'>${escapeHtml(String(t).trim())}</span>`).join('')}</div>
        <div class="today-hours"><i class="fas fa-clock"></i> ${todayText}</div>
      </div>
      <div class="actions-row">
        <button class="action-btn" id="hoursBtn"><i class="fas fa-clock"></i> Program</button>
        <button class="action-btn" id="editBtn"><i class="fas fa-pen"></i> Editează</button>
        <button class="action-btn green" id="reservationsBtn"><i class="fas fa-calendar"></i> Rezervări</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="number">${state.reservations.length}</div><div style="color:#9ca3af;font-size:.65rem;letter-spacing:.5px;font-weight:600;">REZERVĂRI</div></div>
        <div class="stat-card p2"><div class="number">${state.hours.filter(h => h.isOpen).length}</div><div style="color:#9ca3af;font-size:.65rem;letter-spacing:.5px;font-weight:600;">ZILE DESCHIS</div></div>
      </div>
      ${state.reservations.length ? `<div class="reservations-list"><h3 class="section-title">Rezervări Recente</h3>${state.reservations.slice(0,3).map(r => reservationItem(r)).join('')}<button class="action-btn" style="flex:1 1 100%;margin-top:4px;" id="allReservations"><i class='fas fa-list'></i> Toate Rezervările</button></div>` : ''}
      <div class="hours-table"><h3 class="section-title">Program Săptămânal</h3>${state.hours.map(h => hoursRow(h)).join('')}</div>
      <div class="danger-bar"><div><strong style="color:#ef4444;">Atenție!</strong><div style="font-size:.7rem;color:#b8b8b8;margin-top:4px;">Ștergerea locației este permanentă și nu poate fi anulată.</div></div><button id="deleteBtn"><i class="fas fa-trash"></i> Șterge Locația</button></div>
    `;

    document.getElementById('hoursBtn')?.addEventListener('click', () => { dbg('nav:hours', { id: idVal }); window.location.href = 'business-location-hours.html?id=' + idVal; });
    document.getElementById('editBtn')?.addEventListener('click', () => { dbg('nav:edit', { id: idVal }); window.location.href = 'business-edit-location.html?id=' + idVal; });
    document.getElementById('reservationsBtn')?.addEventListener('click', () => { dbg('nav:reservations', { id: idVal }); window.location.href = 'business-reservations.html?id=' + idVal; });
    document.getElementById('allReservations')?.addEventListener('click', () => { dbg('nav:reservationsAll', { id: idVal }); window.location.href = 'business-reservations.html?id=' + idVal; });
    document.getElementById('deleteBtn')?.addEventListener('click', onDelete);
    dbg('render:done');
  }

  async function onDelete() {
    const confirmed = window.confirm('Sigur ștergi această locație?');
    if (!confirmed) return;
    try {
      dbg('delete:call', { url: `/locations/${id}` });
      await window.SecureApiService.delete(`/locations/${id}`);
      dbg('delete:success');
      alert('Locația a fost ștearsă.');
      window.location.href = 'business-locations.html';
    } catch (err) {
      console.error('Delete failed', err);
      dbg('delete:error', err);
      alert('Ștergerea locației a eșuat.');
    }
  }

  function reservationItem(r) {
    const status = (r.status || r.Status || '').toString().toLowerCase();
    const name = r.customerName || r.CustomerName || r.name || 'Client';
    const date = r.reservationDate || r.date || r.Date || r.createdAt || '';
    const time = r.timeSlot || r.time || r.Time || '';
    const people = r.numberOfPeople || r.people || r.People || r.partySize || '';
    const statusCls = status === 'confirmed' ? 'status-confirmed' : status === 'pending' ? 'status-pending' : status === 'canceled' || status === 'cancelled' ? 'status-cancelled' : '';
    const dateTxt = date ? new Date(date).toLocaleDateString('ro-RO') : '';
    return `<div class="reservation-item">
      <div class="reservation-item-header"><div style='font-weight:600;'>${escapeHtml(name)}</div><span class="status-chip ${statusCls}">${escapeHtml(status.toUpperCase() || '—')}</span></div>
      <div style='font-size:.65rem;color:#9ca3af;'>${escapeHtml(dateTxt)} ${time ? 'la ' + escapeHtml(time) : ''}</div>
      <div style='font-size:.65rem;color:#9ca3af;'>${escapeHtml(String(people))} persoane</div>
    </div>`;
  }

  function hoursRow(h) {
    const daysRO = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
    const openTxt = h.isOpen ? `${formatTime12(h.open)} - ${formatTime12(h.close)}` : 'Închis';
    return `<div class="hours-row"><div class="hours-day">${daysRO[h.day]}</div><div class="hours-range ${h.isOpen ? 'hours-open' : 'hours-closed'}">${openTxt}</div></div>`;
  }

  function todayHoursText(hours) {
    try {
      const today = new Date().getDay();
      const h = hours.find(x => x.day === today);
      const txt = h && h.isOpen ? `${formatTime12(h.open)} - ${formatTime12(h.close)}` : 'Închis azi';
      dbg('todayHoursText', { today, h, txt });
      return txt;
    } catch { return 'Închis azi'; }
  }

  function formatTime12(t) {
    if (!t) return '';
    const [h,m] = String(t).split(':');
    const hour = parseInt(h, 10) || 0; const ampm = hour >= 12 ? 'PM' : 'AM'; const disp = hour % 12 || 12; return `${disp}:${m ?? '00'} ${ampm}`;
  }

  function extractHoursList(resp) {
    if (!resp) return [];
    // Envelope { success, data }
    if (resp && typeof resp === 'object' && 'success' in resp && 'data' in resp) {
      const d = resp.data;
      if (Array.isArray(d)) return d;
      if (d && Array.isArray(d.items)) return d.items;
      if (d && Array.isArray(d.hours)) return d.hours;
      if (d && Array.isArray(d.Hours)) return d.Hours;
      return [];
    }
    // Raw array
    if (Array.isArray(resp)) return resp;
    // Raw object with common props
    if (resp && Array.isArray(resp.items)) return resp.items;
    if (resp && Array.isArray(resp.hours)) return resp.hours;
    if (resp && Array.isArray(resp.Hours)) return resp.Hours;
    return [];
  }

  function mapBackendHour(item) {
    if (!item) return null;
    const original = { ...item };
    // Determine day index
    let day = 0;
    if (typeof item.DayOfWeek === 'number') day = item.DayOfWeek;
    else if (typeof item.dayOfWeek === 'number') day = item.dayOfWeek;
    else if (typeof item.DayOfWeek === 'string') {
      const parsed = parseInt(item.DayOfWeek, 10);
      if (!isNaN(parsed)) day = parsed; else {
        const labels = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
        const idx = labels.findIndex(x => x.toLowerCase() === item.DayOfWeek.toLowerCase());
        day = idx >= 0 ? idx : 0;
      }
    } else if (typeof item.dayOfWeek === 'string') {
      const parsed = parseInt(item.dayOfWeek, 10);
      if (!isNaN(parsed)) day = parsed; else {
        const labels = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
        const idx = labels.findIndex(x => x.toLowerCase() === item.dayOfWeek.toLowerCase());
        day = idx >= 0 ? idx : 0;
      }
    } else if (typeof item.day === 'number') { day = item.day; }

    // Normalize to 0-6 where 0=Sunday
    if (day >= 1 && day <= 7) day = day % 7;
    if (day < 0 || day > 6) day = 0;

    const isClosed = !!(item.IsClosed || item.isClosed);
    const open = item.OpenTime || item.open || '';
    const close = item.CloseTime || item.close || '';
    const is24 = !isClosed && (item.Is24Hours === true || item.is24 === true || (open === '00:00' && (close === '23:59' || close === '24:00')));

    const normalized = {
      day,
      isOpen: !isClosed,
      is24: is24,
      open: is24 ? '00:00' : (open || '09:00'),
      close: is24 ? '23:59' : (close || '22:00')
    };
    dbg('mapBackendHour', { original, normalized });
    return normalized;
  }

  function escapeHtml(str) { return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }

  // Expose debug helpers for manual triggers in the console
  window.locationProfileDebug = {
    get state() { return state; },
    reload: async () => {
      try {
        dbg('manualReload:start');
        showLoading();
        await Promise.all([
          loadLocation(idNum),
          loadHours(idNum),
          loadRecentReservations(idNum)
        ]);
        render();
        dbg('manualReload:done');
      } catch (e) {
        console.error('manualReload:error', e);
      }
    },
    goHours: () => { const lId = state.location?.id ?? state.location?.Id ?? idNum; dbg('debugNav:hours', { id: lId }); window.location.href = 'business-location-hours.html?id=' + lId; },
    goEdit: () => { const lId = state.location?.id ?? state.location?.Id ?? idNum; dbg('debugNav:edit', { id: lId }); window.location.href = 'business-edit-location.html?id=' + lId; },
    goReservations: () => { const lId = state.location?.id ?? state.location?.Id ?? idNum; dbg('debugNav:reservations', { id: lId }); window.location.href = 'business-reservations.html?id=' + lId; }
  };
});