// Reservations management (API-driven)
// Loads reservations for a location, supports filtering and status updates.

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const locationId = params.get('id');
  if (!locationId) {
    alert('ID locație lipsă.');
    window.location.href = 'business-locations.html';
    return;
  }

  const locNameEl = document.getElementById('locName');
  const statsRow = document.getElementById('statsRow');
  const filterTabs = document.getElementById('filterTabs');
  const listEl = document.getElementById('reservationsList');
  const cancelModal = document.getElementById('cancelModal');
  const cancelReasonEl = document.getElementById('cancelReason');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const locProfileBtn = document.getElementById('locProfileBtn');

  locProfileBtn?.addEventListener('click', () => window.location.href = 'business-location.html?id=' + locationId);

  const state = {
    locationName: 'Locație',
    reservations: [],
    filter: 'all',
    cancelTarget: null,
    loading: true,
  };

  init();

  async function init() {
    try {
      if (!window.SecureApiService || !window.SecureApiService.isAuthenticated()) {
        window.location.href = 'business-auth.html';
        return;
      }
      await Promise.all([loadLocationName(), loadReservations()]);
      render();
    } catch (err) {
      console.error('Reservations init error:', err);
      alert('Eroare la încărcarea rezervărilor.');
    }
  }

  async function loadLocationName() {
    try {
      const resp = await (window.SecureApiService?.get(`/locations/${locationId}`) || {});
      const data = resp && resp.success ? resp.data : resp;
      if (data && data.name) state.locationName = data.name;
      if (locNameEl) locNameEl.textContent = state.locationName;
    } catch { /* ignore */ }
  }

  async function loadReservations() {
    try {
      // Prefer nested endpoint
      let resp = await (window.SecureApiService?.get(`/locations/${locationId}/reservations`) || {});
      let list = resp && resp.success ? resp.data : resp;
      if (!Array.isArray(list)) {
        // Fallback to global filtered
        resp = await (window.SecureApiService?.get(`/reservations?locationId=${encodeURIComponent(locationId)}`) || {});
        list = resp && resp.success ? resp.data : resp;
      }
      state.reservations = Array.isArray(list) ? list : [];
    } catch (err) {
      console.error('Load reservations error:', err);
      state.reservations = [];
    }
  }

  function stats() {
    const total = state.reservations.length;
    const pending = state.reservations.filter(r => statusOf(r) === 'pending').length;
    const confirmed = state.reservations.filter(r => statusOf(r) === 'confirmed').length;
    const completed = state.reservations.filter(r => statusOf(r) === 'completed').length;
    const canceled = state.reservations.filter(r => statusOf(r).startsWith('canceled')).length;
    return { total, pending, confirmed, completed, canceled };
  }

  function renderStats() {
    const s = stats();
    statsRow.innerHTML = `
      <div class="stat-box"><div class="stat-label">TOTAL</div><div class="stat-value">${s.total}</div></div>
      <div class="stat-box amber"><div class="stat-label">ÎN AȘTEPTARE</div><div class="stat-value">${s.pending}</div></div>
      <div class="stat-box green"><div class="stat-label">CONFIRMATE</div><div class="stat-value">${s.confirmed}</div></div>
      <div class="stat-box"><div class="stat-label">FINALIZATE</div><div class="stat-value">${s.completed}</div></div>
      <div class="stat-box"><div class="stat-label" style="color:#ef4444;">ANULATE</div><div class="stat-value" style="color:#ef4444;">${s.canceled}</div></div>`;
  }

  function renderFilters() {
    const s = stats();
    const filters = [
      { id: 'all', label: 'Toate', count: s.total },
      { id: 'pending', label: 'În așteptare', count: s.pending },
      { id: 'confirmed', label: 'Confirmate', count: s.confirmed },
      { id: 'completed', label: 'Finalizate', count: s.completed },
      { id: 'canceled', label: 'Anulate', count: s.canceled },
    ];
    filterTabs.innerHTML = filters.map(f => `<button type="button" class="filter-btn ${state.filter === f.id ? 'active' : ''}" data-filter="${f.id}">${f.label} (${f.count})</button>`).join('');
    filterTabs.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => { state.filter = btn.dataset.filter; render(); }));
  }

  function statusOf(r) {
    return (r.status || r.Status || '').toString().toLowerCase();
  }

  function filtered() {
    const sorted = [...state.reservations].sort((a, b) => {
      const pr = { pending: 0, confirmed: 1, completed: 2, canceled: 3, cancelled: 3 };
      const sa = statusOf(a), sb = statusOf(b);
      if (pr[sa] !== pr[sb]) return (pr[sa] ?? 99) - (pr[sb] ?? 99);
      const ta = new Date(a.createdAt || a.date || 0).getTime();
      const tb = new Date(b.createdAt || b.date || 0).getTime();
      return tb - ta;
    });
    if (state.filter === 'all') return sorted;
    if (state.filter === 'canceled') return sorted.filter(r => statusOf(r).startsWith('canceled'));
    return sorted.filter(r => statusOf(r) === state.filter);
  }

  function chipCls(status) { return 'chip ' + status; }

  function card(r) {
    const status = statusOf(r);
    const dateTxt = r.reservationDate || r.date || r.Date || '';
    const time = r.timeSlot || r.time || r.Time || '';
    const people = r.numberOfPeople || r.people || r.People || r.partySize || '';
    const phone = r.phone || r.Phone || r.customerPhone || '';
    const name = r.customerName || r.CustomerName || r.name || 'Client';
    const special = r.specialRequests || r.notes || '';
    const createdTs = r.createdAt ? new Date(r.createdAt).getTime() : Date.now();

    return `<div class="reservation-card" data-id="${r.id || r.Id}">
      <div class="res-head">
        <h3 class="res-name">${escapeHtml(name)}</h3>
        <span class="${chipCls(status)}">${escapeHtml(status.toUpperCase() || '—')}</span>
      </div>
      <div class="res-grid">
        <div class="res-meta"><h6>DATA</h6><span>${escapeHtml(dateTxt ? new Date(dateTxt).toLocaleDateString('ro-RO') : '')}</span></div>
        <div class="res-meta"><h6>ORA</h6><span>${escapeHtml(time)}</span></div>
        <div class="res-meta"><h6>PERS</h6><span>${escapeHtml(String(people))}</span></div>
        <div class="res-meta"><h6>ID</h6><span>#${escapeHtml(String(r.id || r.Id || createdTs))}</span></div>
        <div class="res-meta"><h6>TELEFON</h6><span>${escapeHtml(phone || '—')}</span></div>
      </div>
      ${special ? `<div class="special-req"><i class="fas fa-comment-dots" style="opacity:.6;"></i> ${escapeHtml(special)}</div>` : ''}
      <div class="actions-row">
        ${actionButtons(status, r)}
      </div>
    </div>`;
  }

  function actionButtons(status, r) {
    const id = r.id || r.Id;
    if (status === 'pending') {
      return `<button class="act-btn green" data-act="confirm" data-id="${id}"><i class='fas fa-check'></i> Confirmă</button><button class="act-btn red" data-act="cancel" data-id="${id}"><i class='fas fa-xmark'></i> Respinge</button>`;
    }
    if (status === 'confirmed') {
      return `<button class="act-btn blue" data-act="complete" data-id="${id}"><i class='fas fa-flag-checkered'></i> Finalizează</button><button class="act-btn red" data-act="cancel" data-id="${id}"><i class='fas fa-ban'></i> Anulează</button>`;
    }
    return `<button class="act-btn" disabled style="opacity:.4;cursor:not-allowed;"><i class='fas fa-info-circle'></i> Fără acțiuni</button>`;
  }

  function renderList() {
    const items = filtered();
    if (!items.length) {
      listEl.innerHTML = `<div class='empty-state'><div class='empty-icon'><i class="fas fa-calendar-xmark"></i></div><h3 style='margin:0 0 8px;font-size:1.4rem;'>Nicio rezervare</h3><p style='margin:0 0 14px;color:#94a3b8;font-size:.85rem;'>Rezervările vor apărea aici pe măsură ce sunt create.</p><button class='reload-btn' id='reloadBtn'><i class="fas fa-rotate"></i> Reîncarcă</button></div>`;
      document.getElementById('reloadBtn')?.addEventListener('click', async () => { await loadReservations(); render(); });
      return;
    }
    listEl.innerHTML = items.map(r => card(r)).join('');
    listEl.querySelectorAll('[data-act]')?.forEach(btn => btn.addEventListener('click', handleAction));
  }

  async function handleAction(e) {
    const btn = e.currentTarget; const act = btn.dataset.act; const id = btn.dataset.id;
    if (act === 'confirm') await updateStatus(id, 'confirmed');
    else if (act === 'complete') await updateStatus(id, 'completed');
    else if (act === 'cancel') { state.cancelTarget = id; openCancel(); }
  }

  async function updateStatus(resId, status, reason) {
    const statusMap = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', canceled: 'Canceled' };
    const backendStatus = statusMap[status] || 'Pending';
    const cleanedReason = (reason || '').trim();
    const jsonPayload = { status: backendStatus };
    if (cleanedReason) { jsonPayload.reason = cleanedReason; jsonPayload.notes = cleanedReason; }
    if (status === 'canceled') { jsonPayload.cancellationReason = cleanedReason || 'Anulat de restaurant'; }

    try {
      // 1) Preferred nested endpoint (JSON)
      let resp = await window.SecureApiService.post(`/locations/${locationId}/reservations/${resId}/status`, jsonPayload);
      if (resp && resp.success) {
        await loadReservations(); render(); return;
      }

      // 2) Fallback global endpoint (JSON)
      resp = await window.SecureApiService.post(`/reservations/${resId}/status`, { ...jsonPayload, locationId });
      if (resp && resp.success) {
        await loadReservations(); render(); return;
      }

      // 3) Legacy form endpoint (urlencoded) via direct request
      const formParams = new URLSearchParams();
      formParams.append('status', backendStatus);
      if (cleanedReason) { formParams.append('notes', cleanedReason); formParams.append('reason', cleanedReason); }
      if (status === 'canceled') { formParams.append('cancellationReason', cleanedReason || 'Anulat de restaurant'); }
      let direct = await window.SecureApiService.makeSecureRequest(`/reservation/${resId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formParams.toString()
      });
      if (direct && direct.success) { await loadReservations(); render(); return; }

      // 4) Last resort: POST same legacy endpoint
      direct = await window.SecureApiService.makeSecureRequest(`/reservation/${resId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formParams.toString()
      });
      if (direct && direct.success) { await loadReservations(); render(); return; }

      alert('Actualizarea statusului a eșuat');
    } catch (err) {
      console.error('Status update failed', err);
      alert('Actualizarea statusului a eșuat');
    }
  }

  function openCancel() { if (cancelModal) { cancelReasonEl.value = ''; cancelModal.style.display = 'flex'; } }
  function closeCancel() { if (cancelModal) cancelModal.style.display = 'none'; }
  cancelModal?.querySelectorAll('[data-close]')?.forEach(el => el.addEventListener('click', closeCancel));
  confirmCancelBtn?.addEventListener('click', async () => {
    if (state.cancelTarget != null) {
      await updateStatus(state.cancelTarget, 'canceled', cancelReasonEl.value.trim() || 'Fără motiv');
    }
    closeCancel(); state.cancelTarget = null;
  });

  function render() { renderStats(); renderFilters(); renderList(); if (locNameEl) locNameEl.textContent = state.locationName; }
});

function escapeHtml(str) { return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[s])); }
