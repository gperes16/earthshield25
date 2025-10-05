(function(){
  // Panels
  const panels = {
    list: document.getElementById('panel-list'),
    map: document.getElementById('panel-map')
  };
  const mapBtn = document.getElementById('tab-map');
  const listBtn = document.getElementById('tab-list');

  let __map = null;
  let __marker = null;

  function showPanel(name){
    Object.values(panels).forEach(p => p.classList.remove('visible'));
    Object.values(panels).forEach(p => p.classList.add('hidden'));
    const el = panels[name];
    if (el){ el.classList.remove('hidden'); el.classList.add('visible'); }
    if (name === 'map'){
      initImpactMap();
      setTimeout(()=>__map && __map.invalidateSize(), 60);
    }
    listBtn.classList.toggle('active', name==='list');
    mapBtn.classList.toggle('active', name==='map');
  }

  // Map init
  function initImpactMap(){
    if (__map) return;
    __map = L.map('impact-map', {center:[0,0], zoom:2});
    const usgs = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'USGS Topo'
    }).addTo(__map);
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM'
    });
    // Camadas USGS adicionais
    const usgsHydro = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'USGS Hydro'
    });
    const usgsImagery = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'USGS Imagery'
    });
    L.control.layers({USGS: usgs, OSM: osm, 'USGS Hydro': usgsHydro, 'USGS Imagery': usgsImagery}).addTo(__map);

    __marker = L.marker([0,0], {draggable:true}).addTo(__map);
    const latEl = document.getElementById('map-lat');
    const lonEl = document.getElementById('map-lon');
    const targetEl = document.getElementById('impact-target');

    let __detectTimer = null;
    async function detectTargetByLocation(lat, lon){
      try{
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        let elevation = null;
        if (Array.isArray(data?.elevation)) elevation = Number(data.elevation[0]);
        else if (typeof data?.elevation === 'number') elevation = Number(data.elevation);
        if (Number.isFinite(elevation)){
          const ocean = elevation <= 0;
          if (targetEl){ targetEl.value = ocean ? 'ocean' : 'land'; }
        }
      }catch(_){ /* network optional; ignore */ }
    }
    function scheduleDetect(lat, lon){
      if (__detectTimer) clearTimeout(__detectTimer);
      __detectTimer = setTimeout(()=>detectTargetByLocation(lat, lon), 250);
    }
    function syncInputs(latlng){
      latEl.value = Number(latlng.lat).toFixed(4);
      lonEl.value = Number(latlng.lng).toFixed(4);
      scheduleDetect(latlng.lat, latlng.lng);
    }
    __map.on('click', e => { __marker.setLatLng(e.latlng); syncInputs(e.latlng); });
    __marker.on('dragend', e => syncInputs(__marker.getLatLng()));

    document.getElementById('btn-centermap').addEventListener('click', ()=>{
      const lat = parseFloat(latEl.value)||0, lon = parseFloat(lonEl.value)||0;
      __map.setView([lat,lon], 7);
      scheduleDetect(lat, lon);
    });

    // Simulate hook – expects a global simulateImpact in simulation.js to fill res-* ids
    document.getElementById('btn-simulate').addEventListener('click', () => {
      // simulation.js should read inputs and fill #impact-results
      const resultsBox = document.getElementById('impact-results');
      if (resultsBox) resultsBox.classList.remove('hidden');
      if (window.simulateImpact) window.simulateImpact();
    });

    // Expor utilitários do mapa para o módulo de simulação
    const overlays = [];
    function clearOverlays(){
      overlays.splice(0).forEach(layer=>{ try{ __map.removeLayer(layer); }catch(_){} });
    }
    function addOverlay(layer){ overlays.push(layer); layer.addTo(__map); }
    window.ImpactMap = {
      getMap: () => __map,
      getMarker: () => __marker,
      clearOverlays,
      addOverlay
    };

    // Função para resetar UI da simulação e limpar camadas
    window.resetSimulation = function(){
      try{ clearOverlays(); }catch(_){ }
      const ids = ['res-lat','res-lon','res-energy','res-mt','res-crater','res-class','res-airburst','res-mw','res-op5','res-op1','res-thermal'];
      ids.forEach(id=>{ const el = document.getElementById(id); if (el) el.textContent = '—'; });
      const box = document.getElementById('impact-results');
      if (box) box.classList.add('hidden');
    };
  }

  // List rendering
  const resultsEl = document.getElementById('results');
  const paginator = document.getElementById('paginator');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const pageInfo = document.getElementById('page-info');
  const form = document.getElementById('filters');
  const queryEl = document.getElementById('query');

  // Infinite scroll state
  const BATCH_SIZE = 10; // carregar 10 por vez
  let scroller = null;
  let loading = false;
  let done = false;
  let sentinel = null;

  function badge(hz){
    const cls = hz ? 'danger' : 'safe';
    const text = hz ? (window.I18N && I18N.t('card_hazardous')) : (window.I18N && I18N.t('card_safe'));
    return `<span class="badge ${cls}">${text}</span>`;
  }

  function fmtKm(km){
    if (km == null) return '—';
    const million = (window.I18N && I18N.t('fmt_million_km')) || 'mi km';
    const thousand = (window.I18N && I18N.t('fmt_thousand_km')) || 'mil km';
    const unit = (window.I18N && I18N.t('unit_km')) || 'km';
    if (km > 1e6) return (km/1e6).toFixed(2)+' '+million;
    if (km > 1e3) return (km/1e3).toFixed(0)+' '+thousand;
    return km.toFixed(0)+' '+unit;
  }

  function appendItems(slice){
    if (!slice || !slice.length) return;
    slice.forEach(item => {
      const right = `
        <div class="card-col right">
          <div class="sub"><strong>${(I18N && I18N.t('card_pass'))||'Passagem:'}</strong> ${item.approachDate || '—'}</div>
          <div class="sub"><strong>${(I18N && I18N.t('card_mindist'))||'Distância mínima:'}</strong> ${fmtKm(item.missDistanceKm)}</div>
          <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="icon-btn choose-btn" title="${(I18N && I18N.t('card_choose_title'))||'Simular'}" data-id="${item.id}" data-name="${item.name}" data-size="${item.sizeMeters||''}" data-speed="${item.speedKmPerS||''}">
              <img src="assets/img/colision_icon.png" alt="${(I18N && I18N.t('card_choose_alt'))||'Escolher'}">
            </button>
            <a class="icon-btn" title="${(I18N && I18N.t('card_open_title'))||'Abrir no JPL'}" href="https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(item.id||item.name)}" target="_blank" rel="noreferrer">
              <img src="assets/img/redirect_icon.png" alt="${(I18N && I18N.t('card_open_alt'))||'Abrir'}">
            </a>
          </div>
        </div>`;

      const left = `
        <div class="card-col">
          <h3>${item.name} ${badge(item.isHazardous)}</h3>
          <div class="sub">${(I18N && I18N.t('card_id'))||'ID:'} ${item.id || '—'}</div>
          <div><div class="sub">${(I18N && I18N.t('card_avg_size'))||'Tamanho médio:'} <strong>${item.sizeMeters ? item.sizeMeters.toFixed(0) : '—'} ${(I18N && I18N.t('unit_m'))||'m'}</strong></div>
          <div class="sub">${(I18N && I18N.t('card_speed'))||'Velocidade:'} <strong>${item.speedKmPerS ? item.speedKmPerS.toFixed(2) : '—'} ${(I18N && I18N.t('unit_km_s'))||'km/s'}</strong></div></div>
        </div>`;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="card-grid">${left}${right}</div>`;
      resultsEl.appendChild(card);
    });
    // wire choose buttons (apenas para os recém adicionados)
    resultsEl.querySelectorAll('.choose-btn').forEach(btn => {
      if (btn.__wired) return;
      btn.__wired = true;
      btn.addEventListener('click', ()=>{
        const size = parseFloat(btn.dataset.size)||500;
        const speed = parseFloat(btn.dataset.speed)||20;
        const sz = document.getElementById('ast-size');
        const sp = document.getElementById('ast-speed');
        if (sz) sz.value = size.toFixed(0);
        if (sp) sp.value = speed.toFixed(2);
        showPanel('map');
        if (window.resetSimulation) window.resetSimulation();
      });
    });
  }

  function ensureSentinel(){
    if (sentinel) return sentinel;
    sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.style.pointerEvents = 'none';
    resultsEl.appendChild(sentinel);
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if (e.isIntersecting){ loadMore(); }
      });
    }, { root: null, rootMargin: '300px 0px', threshold: 0 });
    io.observe(sentinel);
    return sentinel;
  }

  async function loadMore(){
    if (loading || done || !scroller) return;
    loading = true;
    const loader = document.createElement('div');
    loader.className = 'empty';
    loader.textContent = (I18N && I18N.t('loading')) || 'Carregando…';
    resultsEl.appendChild(loader);
    try{
      const { items, done: finished } = await scroller.next();
      loader.remove();
      if (items && items.length){
        appendItems(items);
        // garantir que o sentinel fique sempre no fim
        if (sentinel && sentinel.parentElement === resultsEl){
          resultsEl.appendChild(sentinel);
        }
      }
      if (finished || !items || !items.length){
        done = true;
        if (sentinel && sentinel.parentElement){ sentinel.remove(); sentinel = null; }
        if (!resultsEl.querySelector('.card')){
          const txt = (I18N && I18N.t('empty_not_found')) || 'Nada encontrado.';
          resultsEl.innerHTML = `<div class="empty">${txt}</div>`;
        }
      }
    }catch(e){
      loader.remove();
      console.error(e);
      if (!resultsEl.querySelector('.card')){
        const txt = (I18N && I18N.t('load_failed')) || 'Falha ao carregar.';
        resultsEl.innerHTML = `<div class="empty">${txt}</div>`;
      }
      done = true;
    }finally{
      loading = false;
    }
  }

  async function runSearch(){
    const q = queryEl.value;
    resultsEl.innerHTML = '';
    paginator.hidden = true; // esconder paginação antiga
    scroller = window.NasaClient.createScroller(q, BATCH_SIZE);
    loading = false;
    done = false;
    ensureSentinel();
    await loadMore();
  }

  // Paginator events
  // esconder e desativar paginação antiga permanentemente
  if (paginator) paginator.style.display = 'none';
  prevBtn.addEventListener('click', (e)=>{ e.preventDefault(); });
  nextBtn.addEventListener('click', (e)=>{ e.preventDefault(); });
  form.addEventListener('submit', (ev)=>{ ev.preventDefault(); runSearch(); });

  // Tabs
  document.querySelectorAll('.tab-button').forEach(btn=>{
    btn.addEventListener('click', ()=> showPanel(btn.dataset.tab));
  });

  // Initial
  // Se trocou idioma, garantir que iniciamos na lista
  try{
    if (sessionStorage.getItem('lang_switched') === '1'){
      sessionStorage.removeItem('lang_switched');
      showPanel('list');
    }
  }catch(_){ }
  try{ runSearch(); }catch(_){ setTimeout(()=>runSearch().catch(()=>{}), 50); }
  // Fallback: se nada carregar rapidamente, tentar novamente
  setTimeout(()=>{
    try{
      if (!resultsEl.querySelector('.card')){ runSearch(); }
    }catch(_){ /* ignore */ }
  }, 300);

  // ajustar ano no footer
  const yc = document.getElementById('year-copy');
  if (yc){ try{ yc.textContent = String(new Date().getFullYear()); }catch(_){ } }
})();