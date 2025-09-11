// Business Location Hours (API-driven)
// Loads existing hours, allows editing (open/close, 24h), and saves to backend.

document.addEventListener('DOMContentLoaded', () => {
  const daysWrap = document.getElementById('daysWrap');
  const saveBtn = document.getElementById('saveHoursBtn');
  const params = new URLSearchParams(location.search);
  const locationId = params.get('id');
  const locNameSub = document.getElementById('locNameSub');
  const quickActions = document.getElementById('quickActions');

  // Subtitle fallback if not provided by the page
  const locationName = locationId ? `Locație #${locationId}` : 'Locație';
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

  function markDirty() {
    dirty = true;
    if (saveBtn) saveBtn.disabled = false;
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
      markDirty();
      modal.style.display = 'none';
      render();
    });
    modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => { modal.style.display = 'none'; }));
  }

  // Save
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
        const { success, error } = await (window.SecureApiService?.post(`/locations/${locationId}/hours`, formData) || {});
        if (success) {
          dirty = false;
          saveBtn.innerHTML = '<i class="fas fa-check"></i> <span>Program Salvat</span>';
          setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i> <span>Salvează Program</span>'; saveBtn.disabled = true; }, 1400);
        } else {
          console.error('Save hours error:', error);
          alert('Eroare: salvarea programului a eșuat');
          saveBtn.disabled = false; if (span) span.textContent = 'Salvează Program';
        }
      } catch (err) {
        console.error('Error saving hours:', err);
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
      const resp = await (window.SecureApiService?.get(`/locations/${locationId}/hours`) || {});
      const list = (resp && resp.success && Array.isArray(resp.data)) ? resp.data : [];
      const mapped = list.map(mapBackendHour).filter(Boolean);
      // Ensure 7 days
      hours = DAYS.map(d => {
        const ex = mapped.find(m => m.day === d.value);
        return ex || { day: d.value, isOpen: true, is24: false, open: '09:00', close: '22:00' };
      });
    } catch (err) {
      console.warn('Failed to load hours, using defaults', err);
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

    const isClosed = !!(item.IsClosed || item.isClosed);
    const open = item.OpenTime || item.open || '';
    const close = item.CloseTime || item.close || '';
    const is24 = !isClosed && (item.Is24Hours === true || item.is24 === true || (open === '00:00' && (close === '23:59' || close === '24:00')));

    return {
      day,
      isOpen: !isClosed,
      is24: is24,
      open: is24 ? '00:00' : (open || '09:00'),
      close: is24 ? '23:59' : (close || '22:00')
    };
  }
});
