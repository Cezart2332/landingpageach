// Location Profile (static demo). In production, replace fetchSim with real API call.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('locationContent');
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  if(!id){
    root.innerHTML = `<p style="color:#ef4444;font-weight:600;">ID locație lipsă.</p>`;return;
  }

  // Simulated data (would be fetched by id)
  const locationData = {
    id: Number(id),
    name: 'Central Bistro',
    address: 'Str. Libertății 10, Cluj',
    tags: ['Bistro','Terasa','WiFi'],
    hasMenu: true,
    photo: 'https://picsum.photos/seed/lprof'+id+'/1200/800',
    reservationsEnabled: true
  };
  const reservations = [
    { id:1, customerName:'Andrei Pop', status:'confirmed', reservationDate:'2025-09-05', timeSlot:'19:00', numberOfPeople:4 },
    { id:2, customerName:'Maria Ionescu', status:'pending', reservationDate:'2025-09-06', timeSlot:'20:30', numberOfPeople:2 },
    { id:3, customerName:'John Doe', status:'cancelled', reservationDate:'2025-09-06', timeSlot:'18:00', numberOfPeople:6 }
  ];
  const hours = Array.from({length:7}).map((_,i)=>({day:i,isOpen:i!==1,open:'09:00',close:'23:00'}));

  function formatTime24(t){
    const [h,m]=t.split(':');
    const hour = parseInt(h,10); const ampm = hour>=12?'PM':'AM'; const disp = hour%12||12; return `${disp}:${m} ${ampm}`;
  }
  function todayHours(){
    const today = new Date().getDay();
    const h = hours.find(x=>x.day===today);
    return h && h.isOpen ? `${formatTime24(h.open)} - ${formatTime24(h.close)}` : 'Închis azi';
  }

  render();

  function render(){
    root.innerHTML = `
      <div class="hero-card">
        <div class="hero-media"><img src="${locationData.photo}" alt="${locationData.name}" loading="lazy"/></div>
        <h1 class="loc-title">${locationData.name}</h1>
        <div class="address-line"><i class="fas fa-location-dot" style="color:#7c3aed;"></i><span>${locationData.address}</span></div>
        <div class="tag-badges">${locationData.tags.map(t=>`<span class='tag'>${t}</span>`).join('')}</div>
        <div class="today-hours"><i class="fas fa-clock"></i> ${todayHours()}</div>
      </div>
      <div class="actions-row">
        <button class="action-btn" id="hoursBtn"><i class="fas fa-clock"></i> Program</button>
        <button class="action-btn green" id="reservationsBtn"><i class="fas fa-calendar"></i> Rezervări</button>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="number">${reservations.length}</div><div style="color:#9ca3af;font-size:.65rem;letter-spacing:.5px;font-weight:600;">REZERVĂRI</div></div>
        <div class="stat-card p2"><div class="number">${hours.filter(h=>h.isOpen).length}</div><div style="color:#9ca3af;font-size:.65rem;letter-spacing:.5px;font-weight:600;">ZILE DESCHIS</div></div>
      </div>
      ${reservations.length?`<div class="reservations-list"><h3 class="section-title">Rezervări Recente</h3>${reservations.slice(0,3).map(r=>reservationItem(r)).join('')}<button class="action-btn" style="flex:1 1 100%;margin-top:4px;" id="allReservations"><i class='fas fa-list'></i> Toate Rezervările</button></div>`:''}
      <div class="hours-table"><h3 class="section-title">Program Săptămânal</h3>${hours.map(h=>hoursRow(h)).join('')}</div>
      <div class="danger-bar"><div><strong style="color:#ef4444;">Atenție!</strong><div style="font-size:.7rem;color:#b8b8b8;margin-top:4px;">Ștergerea locației este permanentă și nu poate fi anulată.</div></div><button id="deleteBtn"><i class="fas fa-trash"></i> Șterge Locația</button></div>
    `;

  document.getElementById('hoursBtn').addEventListener('click',()=>window.location.href='business-location-hours.html?id='+id);
  document.getElementById('reservationsBtn').addEventListener('click',()=>window.location.href='business-reservations.html?id='+id);
  const allRes = document.getElementById('allReservations'); if(allRes) allRes.addEventListener('click',()=>alert('Listă completă rezervări (de implementat)'));
    document.getElementById('deleteBtn').addEventListener('click',()=>{
      if(confirm('Sigur ștergi această locație?')){ alert('Șters (demo)'); window.location.href='business-locations.html'; }
    });
  }

  function reservationItem(r){
    const statusCls = r.status==='confirmed'?'status-confirmed':r.status==='pending'?'status-pending':'status-cancelled';
    return `<div class="reservation-item"><div class="reservation-item-header"><div style='font-weight:600;'>${r.customerName}</div><span class="status-chip ${statusCls}">${r.status.toUpperCase()}</span></div><div style='font-size:.65rem;color:#9ca3af;'>${new Date(r.reservationDate).toLocaleDateString('ro-RO')} la ${r.timeSlot}</div><div style='font-size:.65rem;color:#9ca3af;'>${r.numberOfPeople} persoane</div></div>`;
  }

  function hoursRow(h){
    const daysRO = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
    const openTxt = h.isOpen ? `${formatTime24(h.open)} - ${formatTime24(h.close)}` : 'Închis';
    return `<div class="hours-row"><div class="hours-day">${daysRO[h.day]}</div><div class="hours-range ${h.isOpen?'hours-open':'hours-closed'}">${openTxt}</div></div>`;
  }
});