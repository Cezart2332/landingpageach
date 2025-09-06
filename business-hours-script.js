// Hours configuration page (static demo) - replicate mobile screen behavior
document.addEventListener('DOMContentLoaded', () => {
  const daysWrap = document.getElementById('daysWrap');
  const saveBtn = document.getElementById('saveHoursBtn');
  const params = new URLSearchParams(location.search);
  const locationId = params.get('id');
  const locNameSub = document.getElementById('locNameSub');
  const quickActions = document.getElementById('quickActions');

  // Simulated location name retrieval
  const locationName = locationId ? (locationId=='1'?'Central Bistro': locationId=='2'?'Urban Roast':'Garden Lounge') : 'Locație';
  locNameSub.textContent = locationName;

  const DAYS = [
    {value:0,label:'Duminică'},
    {value:1,label:'Luni'},
    {value:2,label:'Marți'},
    {value:3,label:'Miercuri'},
    {value:4,label:'Joi'},
    {value:5,label:'Vineri'},
    {value:6,label:'Sâmbătă'}
  ];

  let hours = DAYS.map(d=>({day:d.value,isOpen:true,is24:false,open:'09:00',close:'22:00'}));
  let dirty = false;

  function markDirty(){ dirty = true; saveBtn.disabled = false; }

  function formatDisp(t){
    const [h,m]=t.split(':'); const hour=parseInt(h,10); const am=hour>=12?'PM':'AM'; const disp=hour%12||12; return `${disp}:${m} ${am}`;
  }

  function render(){
    daysWrap.innerHTML = hours.map(h=>dayCard(h)).join('');
    attachEvents();
  }

  function dayCard(h){
    return `<div class="day-card" data-day="${h.day}">
      <div class="day-head">
        <h4>${DAYS.find(d=>d.value===h.day).label}</h4>
        <label class="switch"><input type="checkbox" data-open-toggle ${h.isOpen?'checked':''}><span class="slider"></span></label>
      </div>
      <div class="day-body">${h.isOpen?openSection(h):`<div class='closed-label'>ÎNCHIS</div>`}</div>
    </div>`;
  }

  function openSection(h){
    return `<div class="block">
        <label>24H NON‑STOP</label>
        <button type="button" class="toggle-24 ${h.is24?'active':''}" data-24>${h.is24?'<i class="fas fa-check"></i> Activ':'Activează'}</button>
      </div>
      ${h.is24?'':`<div class="block">
        <label>DESCHIDE</label>
        <button type="button" class="time-btn" data-time="open"> <i class="fas fa-clock"></i> ${formatDisp(h.open)}</button>
      </div>
      <div class="block">
        <label>ÎNCHIDE</label>
        <button type="button" class="time-btn" data-time="close"> <i class="fas fa-clock"></i> ${formatDisp(h.close)}</button>
      </div>`}`;
  }

  function attachEvents(){
    daysWrap.querySelectorAll('[data-open-toggle]').forEach(cb=>{
      cb.addEventListener('change', e=>{
        const card = e.target.closest('.day-card');
        const day = Number(card.dataset.day);
        const obj = hours.find(x=>x.day===day); obj.isOpen = e.target.checked; if(!obj.isOpen){ obj.is24=false; }
        markDirty(); render();
      });
    });
    daysWrap.querySelectorAll('[data-24]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const card = e.target.closest('.day-card');
        const day = Number(card.dataset.day);
        const obj = hours.find(x=>x.day===day); obj.is24 = !obj.is24; if(obj.is24){obj.open='00:00';obj.close='23:59';}
        markDirty(); render();
      });
    });
    daysWrap.querySelectorAll('[data-time]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const card = e.target.closest('.day-card');
        const day = Number(card.dataset.day);
        const field = btn.getAttribute('data-time');
        openTimePicker(day, field);
      });
    });
  }

  // Quick actions
  quickActions.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const act = btn.dataset.action;
      if(act==='nonstop') hours = hours.map(h=>({...h,isOpen:true,is24:true,open:'00:00',close:'23:59'}));
      else if(act==='openall') hours = hours.map(h=>({...h,isOpen:true,is24:false,open:'09:00',close:'22:00'}));
      else if(act==='closeall') hours = hours.map(h=>({...h,isOpen:false,is24:false}));
      else if(act==='weekdays') hours = hours.map(h=>({...h,isOpen:(h.day>=1&&h.day<=5),is24:false,open:'09:00',close:'18:00'}));
      else if(act==='weekend') hours = hours.map(h=>({...h,isOpen:(h.day===0||h.day===6),is24:false,open:'10:00',close:'23:00'}));
      markDirty(); render();
    });
  });

  // Time picker logic
  const modal = document.getElementById('timeModal');
  const listEl = document.getElementById('tmList');
  const confirmBtn = document.getElementById('tmConfirm');
  let pickerState = {day:null,field:null,value:null};

  function openTimePicker(day, field){
    pickerState.day = day; pickerState.field = field; pickerState.value = null;
    buildSlots();
    document.getElementById('tmTitle').textContent = `Selectează ora de ${field==='open'?'deschidere':'închidere'}`;
    modal.style.display='flex';
  }

  function buildSlots(){
    listEl.innerHTML='';
    const base = new Date(); base.setHours(0,0,0,0);
    for(let i=0;i<48;i++){
      const d = new Date(base.getTime()+ i*30*60000);
      const hh = d.getHours().toString().padStart(2,'0');
      const mm = d.getMinutes().toString().padStart(2,'0');
      const val = `${hh}:${mm}`;
      const active = pickerState.value===val;
      const div = document.createElement('div');
      div.className = 'tm-item'+(active?' active':'');
      div.innerHTML = `<span>${formatDisp(val)}</span><i class="fas fa-clock" style="opacity:.4;"></i>`;
      div.dataset.val = val;
      div.addEventListener('click', ()=>{
        pickerState.value = val;
        listEl.querySelectorAll('.tm-item').forEach(i=>i.classList.toggle('active', i.dataset.val===val));
      });
      listEl.appendChild(div);
    }
  }

  confirmBtn.addEventListener('click', ()=>{
    if(!pickerState.value){ alert('Selectează o oră.'); return; }
    const obj = hours.find(x=>x.day===pickerState.day);
    if(pickerState.field==='open') obj.open = pickerState.value; else obj.close = pickerState.value;
    markDirty(); modal.style.display='none'; render();
  });
  modal.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>{modal.style.display='none';}));

  saveBtn.addEventListener('click', ()=>{
    if(saveBtn.disabled) return;
    saveBtn.disabled = true; const span = saveBtn.querySelector('span'); span.textContent = 'Se salvează...';
    // Simulated async save
    setTimeout(()=>{
      dirty=false; span.textContent='Program Salvat';
      saveBtn.innerHTML = '<i class="fas fa-check"></i> <span>Program Salvat</span>';
      setTimeout(()=>{ saveBtn.innerHTML='<i class="fas fa-save"></i> <span>Salvează Program</span>'; saveBtn.disabled=true; }, 2600);
    }, 900);
  });

  render();
});
