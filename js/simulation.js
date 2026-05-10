(function(){
  const SimCore = window.SimCore || {};

  function km(val){ return val / 1000; }

  function showError(message){
    const box = document.getElementById('simulation-error');
    if (!box) return;
    box.textContent = message;
    box.classList.remove('hidden');
    const results = document.getElementById('impact-results');
    if (results) results.classList.add('hidden');
  }

  function clearError(){
    const box = document.getElementById('simulation-error');
    if (!box) return;
    box.textContent = '';
    box.classList.add('hidden');
  }

  function readNumber(id, { min = -Infinity, max = Infinity, fallback = null } = {}){
    const el = document.getElementById(id);
    if (!el) return fallback;
    if (String(el.value).trim() === '') return fallback;
    const value = Number(el.value);
    if (!Number.isFinite(value)) return fallback;
    if (value < min || value > max) return fallback;
    return value;
  }

  function drawRings(lat, lon, craterKm, r5, r1, rThermal, target){
    if (!window.ImpactMap) return;
    const m = window.ImpactMap.getMap();
    const center = [lat, lon];
    window.ImpactMap.clearOverlays();
    // Cratera (borda)
    const crater = L.circle(center, { radius: craterKm*1000/2, color: '#ffaa00', weight: 2, opacity: 0.9, fillOpacity: 0.08 });
    window.ImpactMap.addOverlay(crater);
    // 5 psi
    const ring5 = L.circle(center, { radius: r5*1000, color: '#12e6ff', weight: 1.5, opacity: 0.8, fillOpacity: 0.06 });
    window.ImpactMap.addOverlay(ring5);
    // 1 psi
    const ring1 = L.circle(center, { radius: r1*1000, color: '#7ae7ff', weight: 1.5, opacity: 0.8, fillOpacity: 0.05 });
    window.ImpactMap.addOverlay(ring1);
    // térmico
    const ringT = L.circle(center, { radius: rThermal*1000, color: '#ffcc66', weight: 1.5, opacity: 0.8, fillOpacity: 0.04 });
    window.ImpactMap.addOverlay(ringT);
    // Inundação oceânica (didática): buffer elíptico orientado para a costa simplificado
    if (target === 'ocean'){
      // usar raio térmico como proxy da energia transmitida à água
      const floodKm = Math.max(10, rThermal * 0.35);
      const flood = L.circle(center, { radius: floodKm*1000, color:'#66aaff', weight:1, opacity:0.8, fillOpacity:0.12, dashArray:'4,4' });
      window.ImpactMap.addOverlay(flood);
    }
    m.setView(center, 7);
  }

  window.simulateImpact = function(){
    try{
      clearError();

      const core = window.SimCore;
      if (!core) {
        showError((window.I18N && I18N.t('simulation_error_generic')) || 'Não foi possível executar a simulação.');
        return;
      }

      const lat = readNumber('map-lat', { min: -90, max: 90 });
      const lon = readNumber('map-lon', { min: -180, max: 180 });
      const target = (document.getElementById('impact-target')?.value || 'land');
      const angle = readNumber('impact-angle', { min: 10, max: 90 });
      const sizeM = readNumber('ast-size', { min: 1 });
      const speed = readNumber('ast-speed', { min: 0.1 });
      const dvmm = readNumber('dv-mm', { min: 0 });
      const lead = readNumber('lead-days', { min: 0 });

      if ([lat, lon, angle, sizeM, speed, dvmm, lead].some(v => v == null)) {
        showError((window.I18N && I18N.t('simulation_error_invalid')) || 'Verifique os campos da simulação.');
        return;
      }

      const craterM = core.estimateCraterDiameterMeters(sizeM, speed, angle, target);
      const energyMt = core.estimateEnergyMt(sizeM, speed, target);
      const energyJ = energyMt * 4.184e15;
      const { r5, r1, rThermal } = core.estimateBlastRadiiKm(energyMt);

      drawRings(lat, lon, km(craterM), r5, r1, rThermal, target);

      // Visualização de mitigação (desvio)
      const defl = core.applyDeflection(lat, lon, dvmm, lead);
      if (window.ImpactMap){
        const map = window.ImpactMap.getMap();
        const p1 = [lat, lon];
        const p2 = [defl.lat2, defl.lon2];
        const line = L.polyline([p1, p2], { color:'#ff5577', weight:2, dashArray:'6,6', opacity:0.9 });
        window.ImpactMap.addOverlay(line);
        const m2 = L.marker(p2, { title:'Desviado', opacity:0.9, alt:'deflected', keyboard:false });
        window.ImpactMap.addOverlay(m2);
      }

      // preencher resultados
      const byId = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      byId('res-lat', lat.toFixed(4));
      byId('res-lon', lon.toFixed(4));
      byId('res-energy', `${energyJ.toExponential(2)} J`);
      byId('res-mt', `${energyMt.toFixed(2)} Mt`);
      byId('res-crater', `${km(craterM).toFixed(2)} km`);
      const cls = core.classifyEnergy(energyMt, window.I18N ? window.I18N.t.bind(window.I18N) : null);
      byId('res-class', cls);
      byId('res-airburst', target === 'ocean' ? '—' : `${(angle<30? 15: 25)} km`);
      byId('res-mw', (Math.log10(energyMt+1)/0.2).toFixed(1));
      byId('res-op5', r5.toFixed(2));
      byId('res-op1', r1.toFixed(2));
      byId('res-thermal', rThermal.toFixed(2));
      byId('res-defl-lat', defl.lat2.toFixed(4));
      byId('res-defl-lon', defl.lon2.toFixed(4));
      byId('res-defl-km', defl.displacementKm.toFixed(2));

      const box = document.getElementById('impact-results');
      if (box) box.classList.remove('hidden');
      clearError();
    }catch(_){
      showError((window.I18N && I18N.t('simulation_error_generic')) || 'Não foi possível executar a simulação.');
    }
  };
})();


