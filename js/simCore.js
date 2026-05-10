(function(global){
  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function estimateCraterDiameterMeters(diameterMeters, speedKmPerS, angleDeg, target){
    const k = target === 'ocean' ? 0.6 : 1.0;
    const v = clamp(speedKmPerS, 5, 70);
    const d = Math.max(1, diameterMeters);
    const angleFactor = Math.sin((clamp(angleDeg, 10, 90) * Math.PI) / 180);
    return k * Math.pow(d, 0.78) * Math.pow(v, 0.44) * (0.8 + 0.4 * angleFactor);
  }

  function estimateEnergyMt(diameterMeters, speedKmPerS, target){
    const density = target === 'ocean' ? 1000 : 3000;
    const radius = diameterMeters / 2;
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    const mass = density * volume;
    const v = speedKmPerS * 1000;
    const joules = 0.5 * mass * v * v;
    return joules / (4.184e15);
  }

  function estimateBlastRadiiKm(energyMt){
    const e = Math.max(0.001, energyMt);
    return {
      r5: 2.0 * Math.pow(e, 1 / 3),
      r1: 4.0 * Math.pow(e, 1 / 3),
      rThermal: 6.0 * Math.pow(e, 1 / 3),
    };
  }

  function applyDeflection(lat, lon, dvMmPerS, leadDays){
    const dv = Math.max(0, dvMmPerS) / 1000;
    const leadSec = Math.max(0, leadDays) * 86400;
    const displacementMeters = dv * leadSec;
    const displacementKm = displacementMeters / 1000;
    const earthKmPerDeg = 111;
    const cosLat = Math.max(0.0001, Math.abs(Math.cos(lat * Math.PI / 180)));
    const dLon = displacementKm / (earthKmPerDeg * cosLat);
    return { lat2: lat, lon2: lon + dLon, displacementKm };
  }

  function classifyEnergy(energyMt, t){
    if (energyMt >= 1000) return (t && t('class_catastrophic')) || 'Catastrófico';
    if (energyMt >= 50) return (t && t('class_severe')) || 'Severo';
    return (t && t('class_moderate')) || 'Moderado';
  }

  global.SimCore = {
    clamp,
    estimateCraterDiameterMeters,
    estimateEnergyMt,
    estimateBlastRadiiKm,
    applyDeflection,
    classifyEnergy,
  };
})(window);
