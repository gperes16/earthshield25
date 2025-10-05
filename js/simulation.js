(function(){
  // Utilidades simples de física aproximada (didático, não científico)
  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function estimateCraterDiameterMeters(diameterMeters, speedKmPerS, angleDeg, target){
    // fórmula extremamente simplificada: crater ~ k * d^(0.78) * v^(0.44)
    const k = target === 'ocean' ? 0.6 : 1.0;
    const v = clamp(speedKmPerS, 5, 70);
    const d = Math.max(1, diameterMeters);
    const angleFactor = Math.sin((clamp(angleDeg, 10, 90) * Math.PI)/180);
    return k * Math.pow(d, 0.78) * Math.pow(v, 0.44) * (0.8 + 0.4*angleFactor);
  }

  function estimateEnergyMt(diameterMeters, speedKmPerS, target){
    // massa ~ esfera de rocha 3000 kg/m3; energia ~ 1/2 m v^2; converter para Mt TNT
    const density = target === 'ocean' ? 1000 : 3000; // kg/m3
    const radius = diameterMeters/2;
    const volume = (4/3) * Math.PI * Math.pow(radius, 3); // m3
    const mass = density * volume; // kg
    const v = speedKmPerS * 1000; // m/s
    const joules = 0.5 * mass * v * v;
    const mt = joules / (4.184e15); // 1 Mt TNT ~ 4.184e15 J
    return mt;
  }

  function km(val){ return val / 1000; }

  function estimateBlastRadiiKm(energyMt){
    // aproximações didáticas para raios overpressure (não científicos)
    const e = Math.max(0.001, energyMt);
    const r5 = 2.0 * Math.pow(e, 1/3);   // 5 psi
    const r1 = 4.0 * Math.pow(e, 1/3);   // 1 psi
    const rThermal = 6.0 * Math.pow(e, 1/3); // térmico
    return { r5, r1, rThermal };
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

  function applyDeflection(lat, lon, speedKmPerS, dvMmPerS, leadDays){
    // deslocamento aproximado = (Δv * leadTime) na direção de movimento (simplificado)
    const dv = Math.max(0, dvMmPerS)/1000; // m/s
    const leadSec = Math.max(0, leadDays) * 86400; // s
    const displacementMeters = dv * leadSec; // m
    const displacementKm = displacementMeters / 1000;
    // converter deslocamento para delta lat/lon aproximado pela latitude
    const earthKmPerDeg = 111;
    const dLat = 0; // assumir deflexão tangencial LON para visual simples
    const dLon = displacementKm / (earthKmPerDeg * Math.cos(lat * Math.PI/180));
    const lat2 = lat + dLat;
    const lon2 = lon + dLon;
    return { lat2, lon2, displacementKm };
  }

  window.simulateImpact = function(){
    const lat = parseFloat(document.getElementById('map-lat').value)||0;
    const lon = parseFloat(document.getElementById('map-lon').value)||0;
    const target = (document.getElementById('impact-target').value||'land');
    const angle = parseFloat(document.getElementById('impact-angle').value)||45;
    const sizeM = parseFloat(document.getElementById('ast-size').value)||500;
    const speed = parseFloat(document.getElementById('ast-speed').value)||20;
    const dvmm = parseFloat(document.getElementById('dv-mm').value)||0;
    const lead = parseFloat(document.getElementById('lead-days').value)||0;

    // aplicar Δv de forma didática (reduz velocidade efetiva em pequena fração)
    const speedAdj = Math.max(0.1, speed - (dvmm/1000)/1000);

    const craterM = estimateCraterDiameterMeters(sizeM, speedAdj, angle, target);
    const energyMt = estimateEnergyMt(sizeM, speedAdj, target);
    const { r5, r1, rThermal } = estimateBlastRadiiKm(energyMt);

    drawRings(lat, lon, km(craterM), r5, r1, rThermal, target);

    // Visualização de mitigação (desvio)
    const defl = applyDeflection(lat, lon, speedAdj, dvmm, lead);
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
    byId('res-energy', `${energyMt.toFixed(2)} Mt`);
    byId('res-mt', `${(energyMt*1).toFixed(2)} Mt`);
    byId('res-crater', `${km(craterM).toFixed(2)} km`);
    const cls = energyMt >= 1000
      ? (window.I18N && I18N.t('class_catastrophic')) || 'Catastrófico'
      : energyMt >= 50
        ? (window.I18N && I18N.t('class_severe')) || 'Severo'
        : (window.I18N && I18N.t('class_moderate')) || 'Moderado';
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
  };
})();


