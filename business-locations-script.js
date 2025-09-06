// Locations Management (static demo replicating mobile screen look & feel)
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('locationsContent');

  // For now we simulate empty state first, then sample data (toggle by flag)
  const SAMPLE = true; // set false to show empty state

  if(!SAMPLE){
    root.innerHTML = `
      <div class="empty-wrap">
        <div class="empty-icon"><i class="fas fa-location-dot"></i></div>
        <h2>Nu există locații încă</h2>
        <p>Adaugă prima ta locație pentru a începe să îți gestionezi prezența comercială.</p>
        <button class="primary-btn" type="button">Adaugă Locație</button>
      </div>
    `;
    return;
  }

  // Simulated list
  const locations = [
    { id:1, name:'Central Bistro', address:'Str. Libertății 10, Cluj', tags:['Bistro','Terasa','WiFi'], hasMenu:true, photo:'https://picsum.photos/seed/l1/600/400' },
    { id:2, name:'Urban Roast', address:'Bd. Eroilor 25, Cluj', tags:['Cafea','Specialty'], hasMenu:false, photo:'https://picsum.photos/seed/l2/600/400' },
    { id:3, name:'Garden Lounge', address:'Str. Memorandumului 3', tags:['Lounge','Cocktail','Live'], hasMenu:true, photo:'https://picsum.photos/seed/l3/600/400' }
  ];

  renderList(locations);

  function renderList(list){
    const header = `
      <div class="locations-header">
        <div style="flex:1;min-width:240px;">
          <h2 style="margin:0 0 4px;font-size:1.6rem;">Locațiile Tale</h2>
          <p style="margin:0;color:var(--text-secondary);font-size:.85rem;">(${list.length}) — listă demonstrativă statică</p>
        </div>
        <div class="count-badge">${list.length} LOC</div>
        <button class="primary-btn" type="button" id="addBtn"><i class="fas fa-plus"></i> <span style="margin-left:6px;">Adaugă Locație</span></button>
      </div>`;

    const cards = list.map(loc => cardTemplate(loc)).join('');
    const addMore = `<div class="add-more" id="addMore"><i class="fas fa-plus-circle"></i> Adaugă altă locație</div>`;
    root.innerHTML = header + `<div class="cards-grid">${cards}</div>` + addMore;
  document.getElementById('addBtn').addEventListener('click',()=>window.location.href='business-add-location.html');
  document.getElementById('addMore').addEventListener('click',()=>window.location.href='business-add-location.html');
  root.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>window.location.href='business-edit-location.html?id='+btn.dataset.edit));
  root.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>window.location.href='business-location.html?id='+btn.dataset.view));
    root.querySelectorAll('[data-delete]').forEach(btn=>btn.addEventListener('click',()=>confirm('Ștergi locația #'+btn.dataset.delete+'?') && btn.closest('.location-card').remove()));
  root.querySelectorAll('[data-hours]').forEach(btn=>btn.addEventListener('click',()=>window.location.href='business-location-hours.html?id='+btn.dataset.hours));
  }

  function cardTemplate(l){
    const tags = (l.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('');
  return `<div class="location-card" data-view="${l.id}">
      <div class="card-actions">
        <button class="icon-btn" data-edit="${l.id}" title="Editează"><i class="fas fa-pen"></i></button>
        <button class="icon-btn danger" data-delete="${l.id}" title="Șterge"><i class="fas fa-trash"></i></button>
      </div>
      <img src="${l.photo}" alt="${l.name}" class="loc-photo" loading="lazy"/>
      <h4>${l.name}</h4>
      <div class="loc-address"><i class="fas fa-location-dot"></i><span>${l.address}</span></div>
      <div class="tags">${tags}</div>
      <div class="loc-footer">
        <div class="status-wrap"><span class="status-dot" style="background:${l.hasMenu ? '#10b981':'#6b7280'}"></span>${l.hasMenu?'Meniu Disponibil':'Fără Meniu'}</div>
        <button class="btn-inline" data-hours="${l.id}">Program</button>
      </div>
    </div>`;
  }
});