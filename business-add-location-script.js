// Add Location Form Logic (static demo)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addLocationForm');
  const nameEl = document.getElementById('name');
  const nameErrorEl = document.getElementById('nameError');
  const addressEl = document.getElementById('address');
  const phoneEl = document.getElementById('phone');
  const descEl = document.getElementById('description');
  const tagsEl = document.getElementById('tags');
  const tagsPreview = document.getElementById('tagsPreview');
  const categoriesWrap = document.getElementById('categories');
  const reservationsToggle = document.getElementById('reservationsToggle');
  const submitBtn = document.getElementById('submitBtn');
  const geoStatus = document.getElementById('geoStatus');
  const photoArea = document.getElementById('photoArea');
  const photoInput = document.getElementById('photoInput');

  let selectedCategory = '';
  let currentTags = [];
  let geoData = { lat:null, lng:null, loading:false };
  let addressDebounce;
  const GEO_API_KEY = 'd5466dbfa4a84344b872af4009106e17'; // NOTE: Public demo key – rotate for production.

  const CATEGORIES = ['restaurant','pub','cafenea','club'];
  categoriesWrap.innerHTML = CATEGORIES.map(c=>`<button type="button" class="cat-pill" data-cat="${c}">${c}</button>`).join('');
  categoriesWrap.querySelectorAll('.cat-pill').forEach(btn=>{
    btn.addEventListener('click',()=>{
      selectedCategory = btn.dataset.cat;
      categoriesWrap.querySelectorAll('.cat-pill').forEach(b=>b.classList.toggle('active', b===btn));
      validate();
    });
  });

  // Tags input -> split on comma
  tagsEl.addEventListener('input', ()=>{
    const raw = tagsEl.value;
    if(raw.includes(',')){
      raw.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>{
        if(!currentTags.includes(t) && currentTags.length < 12){ currentTags.push(t); }
      });
      tagsEl.value='';
      renderTags();
    }
  });
  tagsEl.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const val = tagsEl.value.trim();
      if(val){ if(!currentTags.includes(val)) currentTags.push(val); tagsEl.value=''; renderTags(); }
    }
    if(e.key==='Backspace' && !tagsEl.value){ currentTags.pop(); renderTags(); }
  });
  function renderTags(){
    tagsPreview.innerHTML = currentTags.map(t=>`<span class="tag-chip">${t}<button type="button" data-del="${t}">×</button></span>`).join('');
    tagsPreview.querySelectorAll('[data-del]').forEach(btn=>btn.addEventListener('click',()=>{currentTags=currentTags.filter(x=>x!==btn.dataset.del);renderTags();}));
  }

  // Photo upload
  photoArea.addEventListener('click', ()=> photoInput.click());
  photoInput.addEventListener('change', handlePhoto);
  photoArea.addEventListener('dragover', e=>{e.preventDefault(); photoArea.style.borderColor='#a855f7';});
  photoArea.addEventListener('dragleave', ()=> photoArea.style.borderColor='rgba(139,92,246,.3)');
  photoArea.addEventListener('drop', e=>{e.preventDefault(); photoArea.style.borderColor='rgba(139,92,246,.3)'; if(e.dataTransfer.files[0]) { photoInput.files = e.dataTransfer.files; handlePhoto(); }});
  let photoFile = null;
  function handlePhoto(){
    const file = photoInput.files && photoInput.files[0];
    if(!file) return;
    photoFile = file;
    const url = URL.createObjectURL(file);
    photoArea.innerHTML = `<img src="${url}" class="photo-preview" alt="preview"/><button type="button" class="remove-photo" id="removePhoto">Elimină fotografia</button>`;
    document.getElementById('removePhoto').addEventListener('click',()=>{
      photoFile = null; photoInput.value='';
      photoArea.innerHTML = `<i class=\"fas fa-camera\" style=\"font-size:2rem;color:#a855f7;\"></i><p style=\"margin:10px 0 4px;font-weight:600;color:#a855f7;\">Adaugă o fotografie</p><p style=\"margin:0;color:#64748b;font-size:.7rem;\">Click sau trage o imagine (16:9 recomandat)</p><input type=\"file\" id=\"photoInput\" accept=\"image/*\" style=\"display:none;\" />`;
      document.getElementById('photoInput').addEventListener('change', handlePhoto);
    });
  }

  // Address geocode debounce
  addressEl.addEventListener('input', ()=>{
    if(addressDebounce) clearTimeout(addressDebounce);
    if(addressEl.value.trim().length < 5){ geoData.lat=null; geoData.lng=null; updateGeoStatus(); validate(); return; }
    addressDebounce = setTimeout(()=> geocode(addressEl.value.trim()), 650);
  });

  function geocode(addr){
    geoData.loading = true; updateGeoStatus();
    fetch(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addr+', Romania')}&limit=1&lang=ro&filter=countrycode:ro&apiKey=${GEO_API_KEY}`)
      .then(r=>r.json())
      .then(data=>{
        const feat = data.features && data.features[0];
        if(feat){
          const [lng,lat] = feat.geometry.coordinates;
          geoData.lat = lat.toFixed(6); geoData.lng = lng.toFixed(6);
        } else {
          geoData.lat=null; geoData.lng=null;
        }
      })
      .catch(()=>{ geoData.lat=null; geoData.lng=null; })
      .finally(()=>{ geoData.loading=false; updateGeoStatus(); validate(); });
  }

  function updateGeoStatus(){
    if(geoData.loading){
      geoStatus.innerHTML = `<div class="geo-status geo-loading"><i class="fas fa-hourglass-half"></i> Obțin coordonate...</div>`; return;
    }
    if(geoData.lat && geoData.lng){
      geoStatus.innerHTML = `<div class="geo-status geo-ok"><i class="fas fa-check-circle"></i> Localizat: ${geoData.lat}, ${geoData.lng}</div>`;
    } else if(addressEl.value.trim().length >=5) {
      geoStatus.innerHTML = `<div class="geo-status geo-loading" style="background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.4);color:#ef4444;"><i class="fas fa-triangle-exclamation"></i> Nu s-au putut obține coordonatele</div>`;
    } else { geoStatus.innerHTML=''; }
  }

  function validate(){
    let valid = true;
    const name = nameEl.value.trim();
    if(!name){ nameEl.classList.add('error'); nameErrorEl.style.display='block'; nameErrorEl.textContent='Introdu numele locației.'; valid=false; }
    else { nameEl.classList.remove('error'); nameErrorEl.style.display='none'; }
    if(!addressEl.value.trim() || !geoData.lat){ valid=false; }
    if(!phoneEl.value.trim()) valid=false;
    if(!selectedCategory) valid=false;
    submitBtn.disabled = !valid;
    return valid;
  }
  ['input','blur'].forEach(ev=> nameEl.addEventListener(ev, validate));
  phoneEl.addEventListener('input', validate);
  descEl.addEventListener('input', validate);

  form.addEventListener('submit', e=>{
    e.preventDefault();
    if(!validate()) return;
    submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creare...';
    // Simulare request
    setTimeout(()=>{
      alert('Locație creată cu succes (demo).');
      window.location.href = 'business-locations.html';
    }, 900);
  });

  // Initial validate
  validate();
});