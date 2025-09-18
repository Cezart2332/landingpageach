// Business Location Hours (API-driven)
// Loads existing hours, allows editing (open/close, 24h), and saves to backend.

document.addEventListener('DOMContentLoaded', () => {
  // Debug toggle via localStorage.ac_debug = '1' to enable
  const DEBUG = (() => {
    try {
      const v = localStorage.getItem('ac_debug');
      if (v === null) return true; // default ON while investigating
      return v === '1' || v === 'true' || v === 'on';
    } catch { return true; }
  })();
  const dbg = (...args) => { if (DEBUG) console.debug('[HoursEditor]', ...args); };
  const inf = (...args) => console.log('[HoursEditor]', ...args);
  const daysWrap = document.getElementById('daysWrap');
  const saveBtn = document.getElementById('saveHoursBtn');
  const params = new URLSearchParams(location.search);
  const locationId = params.get('id');
  const locNameSub = document.getElementById('locNameSub');
  const quickActions = document.getElementById('quickActions');

  // Subtitle fallback if not provided by the page
  const locationName = locationId ? `Locație #${locationId}` : 'Locație';
  dbg('init', { locationId, href: location.href });
  inf('init', { locationId, href: location.href });
  if (locNameSub) locNameSub.textContent = locationName;

  const DAYS = [
    { value: 0, label: 'Duminică' },
    { value: 1, label: 'Luni' },
    { value: 2, label: 'Marți' },
    { value: 3, label: 'Miercuri' },
    { value: 4, label: 'Joi' },
    { value: 5, label: 'Vineri' },
    { value: 6, label: 'Sâmbătă' }
  ];

  let hours = DAYS.map(d => ({ day: d.value, isOpen: true, is24: false, open: '09:00', close: '22:00' }));
  let dirty = false;
  let companyId = null;
  let lastEndpointUsed = null;

  // Storage dump for visibility
  (function dumpStorages(){
    try{
      const ss = {}; for(let i=0;i<sessionStorage.length;i++){ const k=sessionStorage.key(i); if(k) ss[k]=sessionStorage.getItem(k); }
      const ls = {}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k) ls[k]=localStorage.getItem(k); }
      inf('storageSnapshot', { sessionStorage: ss, localStorage: ls });
    }catch(e){ console.warn('[HoursEditor] storageSnapshot:error', e); }
  })();

  function markDirty() {
    dirty = true;
    if (saveBtn) saveBtn.disabled = false;
    dbg('markDirty', { dirty });
  }

  function formatDisp(t) {
    const [h, m] = t.split(':');
    const hour = parseInt(h || '0', 10);
    const am = hour >= 12 ? 'PM' : 'AM';
    const disp = hour % 12 || 12;
    return `${disp}:${m ?? '00'} ${am}`;
  }

  function dayCard(h) {
    const label = DAYS.find(d => d.value === h.day)?.label ?? '';
    return `<div class="day-card" data-day="${h.day}">
      <div class="day-head">
        <h4>${label}</h4>
        <label class="switch"><input type="checkbox" data-open-toggle ${h.isOpen ? 'checked' : ''}><span class="slider"></span></label>
      </div>
      <div class="day-body">${h.isOpen ? openSection(h) : `<div class='closed-label'>ÎNCHIS</div>`}</div>
    </div>`;
  }

  function openSection(h) {
    return `<div class="block">
        <label>24H NON‑STOP</label>
        <button type="button" class="toggle-24 ${h.is24 ? 'active' : ''}" data-24>${h.is24 ? '<i class="fas fa-check"></i> Activ' : 'Activează'}</button>
      </div>
      ${h.is24 ? '' : `<div class="block">
        <label>DESCHIDE</label>
        <button type="button" class="time-btn" data-time="open"> <i class="fas fa-clock"></i> ${formatDisp(h.open)}</button>
      </div>
      <div class="block">
        <label>ÎNCHIDE</label>
        <button type="button" class="time-btn" data-time="close"> <i class="fas fa-clock"></i> ${formatDisp(h.close)}</button>
      </div>`}`;
  }

  function render() {
    if (!daysWrap) return;
    dbg('render', { hours });
    inf('render', { count: hours.length });
    daysWrap.innerHTML = hours.map(h => dayCard(h)).join('');
    attachEvents();
  }

  function attachEvents() {
    if (!daysWrap) return;
    // Open/closed toggle
    daysWrap.querySelectorAll('[data-open-toggle]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const card = (e.target instanceof HTMLElement ? e.target : cb).closest('.day-card');
        const day = Number(card?.getAttribute('data-day'));
        const obj = hours.find(x => x.day === day);
        if (!obj) return;
        obj.isOpen = (e.target instanceof HTMLInputElement) ? !!e.target.checked : !obj.isOpen;
        dbg('toggleOpen', { day, isOpen: obj.isOpen });
        if (!obj.isOpen) obj.is24 = false;
        markDirty();
        render();
      });
    });
    // 24h toggle
    daysWrap.querySelectorAll('[data-24]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = (e.target instanceof HTMLElement ? e.target : btn).closest('.day-card');
        const day = Number(card?.getAttribute('data-day'));
        const obj = hours.find(x => x.day === day);
        if (!obj) return;
        obj.is24 = !obj.is24;
        dbg('toggle24', { day, is24: obj.is24 });
        if (obj.is24) { obj.open = '00:00'; obj.close = '23:59'; }
        markDirty();
        render();
      });
    });
    // Open time picker
    daysWrap.querySelectorAll('[data-time]').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.day-card');
        const day = Number(card?.getAttribute('data-day'));
        const field = btn.getAttribute('data-time');
        if (!field) return;
        dbg('openTimePicker', { day, field });
        openTimePicker(day, field);
      });
    });
  }

  // Quick actions
  if (quickActions) {
    quickActions.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const act = btn.getAttribute('data-action');
        if (act === 'nonstop') hours = hours.map(h => ({ ...h, isOpen: true, is24: true, open: '00:00', close: '23:59' }));
        else if (act === 'openall') hours = hours.map(h => ({ ...h, isOpen: true, is24: false, open: '09:00', close: '22:00' }));
        else if (act === 'closeall') hours = hours.map(h => ({ ...h, isOpen: false, is24: false }));
        else if (act === 'weekdays') hours = hours.map(h => ({ ...h, isOpen: (h.day >= 1 && h.day <= 5), is24: false, open: '09:00', close: '18:00' }));
        else if (act === 'weekend') hours = hours.map(h => ({ ...h, isOpen: (h.day === 0 || h.day === 6), is24: false, open: '10:00', close: '23:00' }));
        dbg('quickAction', { action: act, hours });
        markDirty();
        render();
      });
    });
  }

  // Time picker modal
  const modal = document.getElementById('timeModal');
  const listEl = document.getElementById('tmList');
  const confirmBtn = document.getElementById('tmConfirm');
  const titleEl = document.getElementById('tmTitle');
  const pickerState = { day: null, field: null, value: null };

  function openTimePicker(day, field) {
    if (!modal || !listEl || !confirmBtn || !titleEl) return;
    pickerState.day = day;
    pickerState.field = field;
    pickerState.value = null;
    buildSlots();
    titleEl.textContent = `Selectează ora de ${field === 'open' ? 'deschidere' : 'închidere'}`;
    dbg('timePicker:open', { day, field });
    modal.style.display = 'flex';
  }

  function buildSlots() {
    if (!listEl) return;
    listEl.innerHTML = '';
    const base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 48; i++) {
      const d = new Date(base.getTime() + i * 30 * 60000);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      const val = `${hh}:${mm}`;
      const item = document.createElement('div');
      item.className = 'tm-item';
      item.innerHTML = `<span>${formatDisp(val)}</span><i class="fas fa-clock" style="opacity:.4;"></i>`;
      item.dataset.val = val;
      item.addEventListener('click', () => {
        pickerState.value = val;
        listEl.querySelectorAll('.tm-item').forEach(i => i.classList.toggle('active', i.getAttribute('data-val') === val));
        item.classList.add('active');
        dbg('timePicker:select', { val });
      });
      listEl.appendChild(item);
    }
  }

  if (confirmBtn && modal) {
    confirmBtn.addEventListener('click', () => {
      if (!pickerState.value) { alert('Selectează o oră.'); return; }
      const obj = hours.find(x => x.day === pickerState.day);
      if (!obj) { modal.style.display = 'none'; return; }
      if (pickerState.field === 'open') obj.open = pickerState.value; else obj.close = pickerState.value;
      dbg('timePicker:confirm', { day: pickerState.day, field: pickerState.field, value: pickerState.value });
      markDirty();
      modal.style.display = 'none';
      render();
    });
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { modal.style.display = 'none'; }));
  }

  // Common helpers
  function extractList(resp){
    try{
      if (!resp) return [];
      if (Array.isArray(resp)) return resp;
      if (resp.success){
        if (Array.isArray(resp.data)) return resp.data;
        if (resp.data && Array.isArray(resp.data.items)) return resp.data.items;
      }
      return [];
    }catch{ return []; }
  }

  async function resolveCompanyId(){
    if (companyId) return companyId;
    try{
      const snap = localStorage.getItem('company');
      if (snap){
        try{ const obj = JSON.parse(snap); const cid = obj?.id || obj?.Id; if (cid){ companyId = cid; inf('companyId:fromStorage', { companyId }); return companyId; } }catch{}
      }
    }catch{}
    try{
      const me = await (window.SecureApiService?.getProfile() || {});
      const payload = me && me.success ? me.data : me;
      const cid = payload?.id || payload?.Id || payload?.companyId || payload?.CompanyId || payload?.company?.id || payload?.company?.Id;
      if (cid){ companyId = cid; inf('companyId:fromProfile', { companyId }); return companyId; }
    }catch(e){ dbg('companyId:error', e); }
    return null;
  }

  async function fetchHours(){
    // Try primary endpoint
    try{
      const url = `/locations/${locationId}/hours`;
      inf('load:GET', { url });
      const resp = await (window.SecureApiService?.get(url) || {});
      dbg('load:resp', resp);
      const list = extractList(resp);
      inf('load:extracted', { count: list.length });
      if (list.length > 0 || resp?.success){ lastEndpointUsed = url; return list; }
    }catch(e){ dbg('load:primary:error', e); }
    // Fallback to company-scoped endpoint if available
    try{
      const cid = await resolveCompanyId();
      if (!cid) return [];
      const url2 = `/companies/${cid}/locations/${locationId}/hours`;
      inf('load:GET:fallback', { url: url2 });
      const resp2 = await (window.SecureApiService?.get(url2) || {});
      dbg('load:resp:fallback', resp2);
      const list2 = extractList(resp2);
      inf('load:extracted:fallback', { count: list2.length });
      if (list2.length > 0 || resp2?.success){ lastEndpointUsed = url2; return list2; }
    }catch(e){ dbg('load:fallback:error', e); }
    return [];
  }

  async function saveHours(formData){
    // Try primary
    const primary = `/locations/${locationId}/hours`;
    inf('save:POST', { url: primary });
    let response = await (window.SecureApiService?.post(primary, formData) || {});
    dbg('save:respPOST', response);
    if (!response?.success){
      dbg('save:POST failed, trying PUT');
      response = await (window.SecureApiService?.put(primary, formData) || {});
      dbg('save:respPUT', response);
    }
    if (response?.success) { lastEndpointUsed = primary; return response; }
    // Fallback to company-scoped
    const cid = await resolveCompanyId();
    if (!cid) return response;
    const fallback = `/companies/${cid}/locations/${locationId}/hours`;
    inf('save:POST:fallback', { url: fallback });
    response = await (window.SecureApiService?.post(fallback, formData) || {});
    dbg('save:respPOST:fallback', response);
    if (!response?.success){
      dbg('save:POST fallback failed, trying PUT');
      response = await (window.SecureApiService?.put(fallback, formData) || {});
      dbg('save:respPUT:fallback', response);
    }
    if (response?.success) lastEndpointUsed = fallback;
    return response;
  }

  // Save
  function formDataToObject(fd) {
    const o = {};
    for (const [k, v] of fd.entries()) { o[k] = v; }
    return o;
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (saveBtn.disabled) return;
      const span = saveBtn.querySelector('span');
      saveBtn.disabled = true; if (span) span.textContent = 'Se salvează...';
      try {
        const formData = new FormData();
        DAYS.forEach((d, index) => {
          const h = hours.find(x => x.day === d.value) || { isOpen: true, is24: false, open: '09:00', close: '22:00' };
          const isClosed = !h.isOpen;
          const is24 = !!h.is24;
          formData.append(`day_${index}_closed`, String(isClosed));
          if (!isClosed) {
            const openTime = is24 ? '00:00' : h.open;
            const closeTime = is24 ? '23:59' : h.close;
            formData.append(`day_${index}_open`, openTime);
            formData.append(`day_${index}_close`, closeTime);
          }
        });
        const payloadPreview = formDataToObject(formData);
        inf('save:payloadPreview', payloadPreview);
        let response = await saveHours(formData);
        let { success, error, data } = response || {};
        if (success) {
          // If backend returns saved hours, remap from response; else keep our local hours
          try {
            const respList = Array.isArray(data) ? data : (data && Array.isArray(data.items) ? data.items : []);
            dbg('save:respDataExtracted', { count: Array.isArray(respList) ? respList.length : 0 });
            if (respList && respList.length) {
              const mapped = respList.map(mapBackendHour).filter(Boolean);
              dbg('save:respMapped', mapped);
              const DAYSIDX = [0,1,2,3,4,5,6];
              hours = DAYSIDX.map(d => mapped.find(m => m.day === d) || hours.find(h => h.day === d) || { day: d, isOpen: true, is24: false, open: '09:00', close: '22:00' });
            }
          } catch (e) { dbg('save:mapResponseError', e); }

          // Force re-fetch to confirm what backend persisted
          try {
            const refList = await fetchHours();
            const list2 = Array.isArray(refList) ? refList : [];
            if (list2.length) {
              const mapped2 = list2.map(mapBackendHour).filter(Boolean);
              hours = DAYS.map(d => mapped2.find(m => m.day === d.value) || { day: d.value, isOpen: true, is24: false, open: '09:00', close: '22:00' });
              dbg('save:refetch:mapped', hours);
              inf('save:refetch:mappedCount', hours.length);
            }
          } catch (e) { dbg('save:refetch:error', e); }

          dirty = false;
          saveBtn.innerHTML = '<i class="fas fa-check"></i> <span>Program Salvat</span>';
          setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>Salvează Program</span>'; saveBtn.disabled = true; }, 1400);
        } else {
          console.error('Save hours error:', error);
          dbg('save:error', error);
          alert('Eroare: salvarea programului a eșuat');
          saveBtn.disabled = false; if (span) span.textContent = 'Salvează Program';
        }
      } catch (err) {
        console.error('Error saving hours:', err);
        dbg('save:exception', err);
        alert('Eroare: salvarea programului a eșuat');
        saveBtn.disabled = false; const span2 = saveBtn.querySelector('span'); if (span2) span2.textContent = 'Salvează Program';
      }
    });
  }

  // Load existing hours
  (async function loadHours() {
    try {
      if (daysWrap) {
        daysWrap.innerHTML = `<div style="display:flex;justify-content:center;padding:28px 0;color:#64748b;">
          <i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Se încarcă programul...
        </div>`;
      }
      const list = await fetchHours();
      dbg('load:extracted', list);
      inf('load:listCount', { count: list.length, endpoint: lastEndpointUsed });
      const mapped = list.map(mapBackendHour).filter(Boolean);
      dbg('load:mapped', mapped);
      inf('load:mappedCount', mapped.length);
      // Ensure 7 days
      hours = DAYS.map(d => {
        const ex = mapped.find(m => m.day === d.value);
        return ex || { day: d.value, isOpen: true, is24: false, open: '09:00', close: '22:00' };
      });
    } catch (err) {
      console.warn('Failed to load hours, using defaults', err);
      dbg('load:errorDefaults', err);
      hours = DAYS.map(d => ({ day: d.value, isOpen: true, is24: false, open: '09:00', close: '22:00' }));
    } finally {
      dirty = false;
      if (saveBtn) saveBtn.disabled = true;
      render();
    }
  })();

  function mapBackendHour(item) {
    if (!item) return null;
    // DayOfWeek can be number, string index, or day label
    let day = 0;
    if (typeof item.DayOfWeek === 'number') day = item.DayOfWeek;
    else if (typeof item.DayOfWeek === 'string') {
      const parsed = parseInt(item.DayOfWeek, 10);
      if (!isNaN(parsed)) day = parsed; else {
        const found = DAYS.find(d => d.label.toLowerCase() === item.DayOfWeek.toLowerCase());
        day = found ? found.value : 0;
      }
    } else if (typeof item.day === 'number') { day = item.day; }

    // Normalize possible backend 1..7 to 0..6
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
    dbg('mapBackendHour', { original: item, normalized });
    return normalized;
  }

  // Expose small debug helper
  window.hoursDebug = {
    get hours() { return hours; },
    get endpoint() { return lastEndpointUsed; },
    render,
    markDirty,
    async company() { return await resolveCompanyId(); },
    dumpStorages(){
      try{
        const ss = {}; for(let i=0;i<sessionStorage.length;i++){ const k=sessionStorage.key(i); if(k) ss[k]=sessionStorage.getItem(k); }
        const ls = {}; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k) ls[k]=localStorage.getItem(k); }
        return { sessionStorage: ss, localStorage: ls };
      }catch{ return {}; }
    },
    async refetch() {
      try {
        dbg('debug:refetch');
        const list = await fetchHours();
        const mapped = list.map(mapBackendHour).filter(Boolean);
        hours = DAYS.map(d => mapped.find(m => m.day === d.value) || { day: d.value, isOpen: true, is24: false, open: '09:00', close: '22:00' });
        render();
      } catch (e) { console.error('debug:refetch error', e); }
    }
  };
});
