// Edit Location (static demo) - populates form and simulates update
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '1';

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

  let currentTags = [];
  let photoFile = null; let menuFile = null; let geoData = {loading:false};

  // Simulated fetch of existing data
  const MOCK = {
    1:{ name:'Central Bistro', address:'Str. Libertății 10, Cluj', lat:'46.7712', lng:'23.6236', tags:['bistro','terasa','wifi'], description:'Locație centrală cu atmosferă relaxantă.', photo:`https://picsum.photos/seed/edit${id}/900/600`, hasMenu:true, reservationsEnabled:true },
    2:{ name:'Urban Roast', address:'Bd. Eroilor 25, Cluj', lat:'46.7700', lng:'23.5900', tags:['cafea','specialty'], description:'Cafea de origine și prăjituri artizanale.', photo:`https://picsum.photos/seed/edit${id}/900/600`, hasMenu:false, reservationsEnabled:true },
    3:{ name:'Garden Lounge', address:'Str. Memorandumului 3', lat:'46.7720', lng:'23.6200', tags:['lounge','cocktail','live'], description:'Cocktail bar cu live sessions.', photo:`https://picsum.photos/seed/edit${id}/900/600`, hasMenu:true, reservationsEnabled:false }
  };
  const data = MOCK[id] || MOCK[1];

  function populate(){
    nameEl.value = data.name; addressEl.value = data.address; latEl.value=data.lat; lngEl.value=data.lng; descEl.value=data.description; reservationsToggle.checked = !!data.reservationsEnabled;
    currentTags = [...data.tags]; renderTags();
    renderPhoto(data.photo);
    if(data.hasMenu){ menuStatus.innerHTML = `<span style="color:#22c55e;font-weight:600;">Meniu existent ✅</span>`; }
  }

  function renderPhoto(url){
    photoArea.innerHTML = `<img src="${url}" class="photo-preview" alt="loc" loading="lazy"/><button type="button" class="remove-photo" id="removePhoto"><i class='fas fa-times'></i> Elimină</button>`;
    document.getElementById('removePhoto').addEventListener('click',()=>{
      photoFile=null; photoArea.innerHTML = `<i class=\"fas fa-camera\" style=\"font-size:2rem;color:#a855f7;\"></i><p style=\"margin:10px 0 4px;font-weight:600;color:#a855f7;\">Adaugă / Înlocuiește foto</p><p style=\"margin:0;color:#64748b;font-size:.7rem;\">Click pentru selectare (16:9)</p>`;
    });
  }

  // Photo upload
  photoArea.addEventListener('click', ()=>choosePhoto());
  function choosePhoto(){
    const input = document.createElement('input'); input.type='file'; input.accept='image/*';
    input.onchange = () => { const f = input.files && input.files[0]; if(!f) return; photoFile=f; const url = URL.createObjectURL(f); renderPhoto(url); };
    input.click();
  }

  // Menu upload
  menuBtn.addEventListener('click', ()=>{
    const input = document.createElement('input'); input.type='file'; input.accept='application/pdf';
    input.onchange = () => { const f = input.files && input.files[0]; if(!f) return; menuFile=f; menuStatus.innerHTML = `<span style='color:#22c55e;font-weight:600;'>${f.name} ✓</span>`; };
    input.click();
  });

  // Tags input
  tagsEl.addEventListener('input', ()=>{
    const raw = tagsEl.value; if(raw.includes(',')){ raw.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>{ if(!currentTags.includes(t) && currentTags.length<20) currentTags.push(t);}); tagsEl.value=''; renderTags(); }
  });
  tagsEl.addEventListener('keydown', e=>{
    if(e.key==='Enter'){ e.preventDefault(); const val = tagsEl.value.trim(); if(val){ if(!currentTags.includes(val)) currentTags.push(val); tagsEl.value=''; renderTags(); } }
    if(e.key==='Backspace' && !tagsEl.value){ currentTags.pop(); renderTags(); }
  });
  function renderTags(){
    tagsPreview.innerHTML = currentTags.map(t=>`<span class="tag-chip">${t}<button type="button" data-del="${t}">×</button></span>`).join('');
    tagsPreview.querySelectorAll('[data-del]').forEach(btn=>btn.addEventListener('click',()=>{currentTags=currentTags.filter(x=>x!==btn.dataset.del);renderTags();}));
  }

  // Geocode
  const GEO_KEY='d5466dbfa4a84344b872af4009106e17';
  geoBtn.addEventListener('click', ()=>{
    const addr = addressEl.value.trim(); if(!addr){ alert('Introdu adresa.'); return; }
    geoData.loading=true; updateGeoStatus();
    fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addr+', Romania')}&limit=1&lang=ro&filter=countrycode:ro&apiKey=${GEO_KEY}`)
      .then(r=>r.json())
      .then(d=>{ const feat = d.features && d.features[0]; if(feat){ const [lng,lat]=feat.geometry.coordinates; latEl.value=lat.toFixed(6); lngEl.value=lng.toFixed(6); } else { alert('Adresă negăsită'); } })
      .catch(()=>alert('Eroare geocodare'))
      .finally(()=>{ geoData.loading=false; updateGeoStatus(); });
  });
  gpsBtn.addEventListener('click', ()=>{
    alert('Demo GPS – valori setate.'); latEl.value='44.426800'; lngEl.value='26.102500'; updateGeoStatus();
  });
  function updateGeoStatus(){
    if(geoData.loading){ geoStatus.innerHTML = `<span style='color:#f59e0b;'>Obțin coordonate...</span>`; return; }
    if(latEl.value && lngEl.value){ geoStatus.innerHTML = `<span style='color:#22c55e;'>Coord: ${latEl.value}, ${lngEl.value}</span>`; }
    else geoStatus.innerHTML='';
  }

  function validate(){
    let valid = true; if(!nameEl.value.trim()) valid=false; if(!addressEl.value.trim()) valid=false; if(!latEl.value || !lngEl.value) valid=false; saveBtn.disabled = !valid; return valid;
  }
  ['input','blur'].forEach(ev=> nameEl.addEventListener(ev, validate));
  addressEl.addEventListener('input', validate); latEl.addEventListener('input', validate); lngEl.addEventListener('input', validate);

  form.addEventListener('submit', e=>{
    e.preventDefault(); if(!validate()) return; saveBtn.disabled=true; saveBtn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Salvare...';
    setTimeout(()=>{ alert('Locație actualizată (demo).'); window.location.href='business-location.html?id='+id; }, 1000);
  });

  populate(); validate();
});
