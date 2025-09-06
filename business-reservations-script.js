// Reservations management (static demo). Replace with real API integration.
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const locationId = params.get('id') || '1';
  const locNameEl = document.getElementById('locName');
  const statsRow = document.getElementById('statsRow');
  const filterTabs = document.getElementById('filterTabs');
  const listEl = document.getElementById('reservationsList');
  const cancelModal = document.getElementById('cancelModal');
  const cancelReasonEl = document.getElementById('cancelReason');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const locProfileBtn = document.getElementById('locProfileBtn');

  locProfileBtn.addEventListener('click',()=>window.location.href='business-location.html?id='+locationId);

  const locationNames = {1:'Central Bistro',2:'Urban Roast',3:'Garden Lounge'};
  const locationName = locationNames[locationId] || 'Locație';
  locNameEl.textContent = locationName;

  let reservations = generateMock();
  let activeFilter = 'all';
  let cancelTarget = null;

  function generateMock(){
    const base = [
      { id:101, customerName:'Andrei Pop', date:'05 septembrie', time:'19:00', people:4, status:'confirmed', specialRequests:'Masă lângă geam', phone:'+40721222333' },
      { id:102, customerName:'Maria Ionescu', date:'06 septembrie', time:'20:30', people:2, status:'pending', specialRequests:'Aniversare', phone:'+40733444555' },
      { id:103, customerName:'John Doe', date:'06 septembrie', time:'18:00', people:6, status:'canceled', specialRequests:'', phone:'+40123456789' },
      { id:104, customerName:'Elena Radu', date:'07 septembrie', time:'21:15', people:3, status:'completed', specialRequests:'', phone:'+40766555444' },
      { id:105, customerName:'Matei Luca', date:'07 septembrie', time:'19:45', people:5, status:'pending', specialRequests:'Scaun pentru copil', phone:'+40712312312' }
    ];
    return base.map(r=>({...r, timestamp:Date.now()-Math.floor(Math.random()*5000000)}));
  }

  function stats(){
    const total = reservations.length;
    const pending = reservations.filter(r=>r.status==='pending').length;
    const confirmed = reservations.filter(r=>r.status==='confirmed').length;
    const completed = reservations.filter(r=>r.status==='completed').length;
    const canceled = reservations.filter(r=>r.status==='canceled').length;
    return {total,pending,confirmed,completed,canceled};
  }

  function renderStats(){
    const s = stats();
    statsRow.innerHTML = `
      <div class="stat-box"><div class="stat-label">TOTAL</div><div class="stat-value">${s.total}</div></div>
      <div class="stat-box amber"><div class="stat-label">ÎN AȘTEPTARE</div><div class="stat-value">${s.pending}</div></div>
      <div class="stat-box green"><div class="stat-label">CONFIRMATE</div><div class="stat-value">${s.confirmed}</div></div>
      <div class="stat-box"><div class="stat-label">FINALIZATE</div><div class="stat-value">${s.completed}</div></div>
      <div class="stat-box"><div class="stat-label" style="color:#ef4444;">ANULATE</div><div class="stat-value" style="color:#ef4444;">${s.canceled}</div></div>`;
  }

  function renderFilters(){
    const s = stats();
    const filters = [
      {id:'all',label:'Toate',count:s.total},
      {id:'pending',label:'În așteptare',count:s.pending},
      {id:'confirmed',label:'Confirmate',count:s.confirmed},
      {id:'completed',label:'Finalizate',count:s.completed},
      {id:'canceled',label:'Anulate',count:s.canceled},
    ];
    filterTabs.innerHTML = filters.map(f=>`<button type="button" class="filter-btn ${activeFilter===f.id?'active':''}" data-filter="${f.id}">${f.label} (${f.count})</button>`).join('');
    filterTabs.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{activeFilter=btn.dataset.filter; render();}));
  }

  function filtered(){
    const sorted = [...reservations].sort((a,b)=>{
      const priority = {pending:0,confirmed:1,completed:2,canceled:3};
      if(priority[a.status]!==priority[b.status]) return priority[a.status]-priority[b.status];
      return (b.timestamp||0)-(a.timestamp||0);
    });
    if(activeFilter==='all') return sorted; return sorted.filter(r=>r.status===activeFilter);
  }

  function chipCls(status){ return 'chip '+status; }

  function card(r){
    return `<div class="reservation-card" data-id="${r.id}">
      <div class="res-head">
        <h3 class="res-name">${r.customerName}</h3>
        <span class="${chipCls(r.status)}">${r.status.toUpperCase()}</span>
      </div>
      <div class="res-grid">
        <div class="res-meta"><h6>DATA</h6><span>${r.date}</span></div>
        <div class="res-meta"><h6>ORA</h6><span>${r.time}</span></div>
        <div class="res-meta"><h6>PERS</h6><span>${r.people}</span></div>
        <div class="res-meta"><h6>ID</h6><span>#${r.id}</span></div>
        <div class="res-meta"><h6>TELEFON</h6><span>${r.phone||'—'}</span></div>
      </div>
      ${r.specialRequests?`<div class="special-req"><i class="fas fa-comment-dots" style="opacity:.6;"></i> ${r.specialRequests}</div>`:''}
      <div class="actions-row">
        ${actionButtons(r)}
      </div>
    </div>`;
  }

  function actionButtons(r){
    if(r.status==='pending'){
      return `<button class="act-btn green" data-act="confirm" data-id="${r.id}"><i class='fas fa-check'></i> Confirmă</button><button class="act-btn red" data-act="cancel" data-id="${r.id}"><i class='fas fa-xmark'></i> Respinge</button>`;
    }
    if(r.status==='confirmed'){
      return `<button class="act-btn blue" data-act="complete" data-id="${r.id}"><i class='fas fa-flag-checkered'></i> Finalizează</button><button class="act-btn red" data-act="cancel" data-id="${r.id}"><i class='fas fa-ban'></i> Anulează</button>`;
    }
    return `<button class="act-btn" disabled style="opacity:.4;cursor:not-allowed;"><i class='fas fa-info-circle'></i> Fără acțiuni</button>`;
  }

  function renderList(){
    const items = filtered();
    if(!items.length){
      listEl.innerHTML = `<div class='empty-state'><div class='empty-icon'><i class="fas fa-calendar-xmark"></i></div><h3 style='margin:0 0 8px;font-size:1.4rem;'>Nicio rezervare</h3><p style='margin:0 0 14px;color:#94a3b8;font-size:.85rem;'>Rezervările vor apărea aici pe măsură ce sunt create.</p><button class='reload-btn' id='reloadBtn'><i class="fas fa-rotate"></i> Reîncarcă</button></div>`;
      document.getElementById('reloadBtn').addEventListener('click',()=>{reservations=generateMock(); render();});
      return;
    }
    listEl.innerHTML = items.map(r=>card(r)).join('');
    listEl.querySelectorAll('[data-act]').forEach(btn=>btn.addEventListener('click',handleAction));
  }

  function handleAction(e){
    const btn = e.currentTarget; const act = btn.dataset.act; const id = Number(btn.dataset.id);
    if(act==='confirm') updateStatus(id,'confirmed');
    else if(act==='complete') updateStatus(id,'completed');
    else if(act==='cancel'){ cancelTarget=id; openCancel(); }
  }

  function updateStatus(id, status, reason){
    reservations = reservations.map(r=> r.id===id? {...r,status, cancelReason:reason||r.cancelReason}: r);
    render();
  }

  function openCancel(){ cancelReasonEl.value=''; cancelModal.style.display='flex'; }
  function closeCancel(){ cancelModal.style.display='none'; }
  cancelModal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',closeCancel));
  confirmCancelBtn.addEventListener('click',()=>{
    if(cancelTarget!=null){ updateStatus(cancelTarget,'canceled',cancelReasonEl.value.trim()||'Fără motiv'); }
    closeCancel(); cancelTarget=null;
  });

  function render(){ renderStats(); renderFilters(); renderList(); }
  render();
});
