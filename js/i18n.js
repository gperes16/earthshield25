(function(){
  const translations = {
    pt: {
      brand_name: 'EarthShield25',
      footer_edu: 'Conteúdo para fins educacionais.',
      footer_challenge: 'Desafio: NASA Space Apps',
      footer_theme: 'Tema: Meteor Madness',
      footer_desc: 'Simulações educativas de impacto e estratégias de mitigação. Use de forma responsável.',
      footer_project: 'Projeto',
      footer_refs: 'Referências',
      footer_link_asteroids: 'Asteróides',
      footer_link_sim: 'Simulação',
      footer_link_apis: 'APIs NASA',
      tab_list: 'Asteróides',
      tab_map: 'Simulação',
      list_title: 'Listagem de Asteróides (NASA NeoWs)',
      search_placeholder: 'Ex.: 2001 WJ4 ou 3092506',
      simulate: 'Simular Impacto',
      results_title: 'Resultado da Simulação',
      map_mitigation: 'Mapa & Mitigação',
      target: 'Alvo:', angle:'Ângulo (°):', diameter:'Diâmetro (m):', speed:'Velocidade (km/s):', dv:'Δv (mm/s):', lead:'Lead Time (dias):',
      target_land:'Continente', target_ocean:'Oceano',
      lat: 'Lat:', lon: 'Lon:',
      energy: 'Energia:', tnt: 'Equivalente TNT:',
      crater: 'Cratera (diâmetro):', event_class: 'Classe do Evento:',
      airburst: 'Altitude do Airburst:', mw: 'Magnitude sísmica (Mw):',
      r5: 'Raio 5 psi (km):', r1: 'Raio 1 psi (km):', thermal: 'Raio térmico (km):',
      defl_lat: 'Lat (desviado):', defl_lon: 'Lon (desviado):', defl_km: 'Desvio (km):',
      legend1: '1 psi', legend5: '5 psi', legendT: 'Térmico',
      info_r1: 'Sobrecarga que pode quebrar janelas.',
      info_r5: 'Sobrecarga que pode danificar edificações.',
      info_mw: 'Escala de magnitude de terremotos (Mw).',
      info_thermal: 'Raio onde o calor pode causar queimaduras/ignição.',
      // Dinâmicos (lista/cards, buscas, unidades)
      search_label: 'Buscar por nome ou ID',
      search_button: 'Buscar',
      empty_initial: 'Use os filtros e clique em Buscar.',
      empty_not_found: 'Nada encontrado.',
      load_failed: 'Falha ao carregar.',
      loading: 'Carregando…',
      card_hazardous: 'Perigoso',
      card_safe: 'Não perigoso',
      card_pass: 'Passagem:',
      card_mindist: 'Distância mínima:',
      card_id: 'ID:',
      card_avg_size: 'Tamanho médio:',
      card_speed: 'Velocidade:',
      card_choose_title: 'Simular',
      card_choose_alt: 'Escolher',
      card_open_title: 'Abrir no JPL',
      card_open_alt: 'Abrir',
      unit_m: 'm',
      unit_km_s: 'km/s',
      unit_km: 'km',
      fmt_million_km: 'mi km',
      fmt_thousand_km: 'mil km',
      btn_center_title: 'Centralizar',
      // Classes de evento
      class_catastrophic: 'Catastrófico',
      class_severe: 'Severo',
      class_moderate: 'Moderado'
    },
    en: {
      brand_name: 'EarthShield25',
      footer_edu: 'Content for educational purposes.',
      footer_challenge: 'Challenge: NASA Space Apps',
      footer_theme: 'Theme: Meteor Madness',
      footer_desc: 'Educational impact simulations and mitigation strategies. Use responsibly.',
      footer_project: 'Project',
      footer_refs: 'References',
      footer_link_asteroids: 'Asteroids',
      footer_link_sim: 'Simulation',
      footer_link_apis: 'NASA APIs',
      tab_list: 'Asteroids',
      tab_map: 'Simulation',
      list_title: 'Asteroid Listing (NASA NeoWs)',
      search_placeholder: 'e.g., 2001 WJ4 or 3092506',
      simulate: 'Simulate Impact',
      results_title: 'Simulation Results',
      map_mitigation: 'Map & Mitigation',
      target: 'Target:', angle:'Angle (°):', diameter:'Diameter (m):', speed:'Speed (km/s):', dv:'Δv (mm/s):', lead:'Lead Time (days):',
      target_land:'Land', target_ocean:'Ocean',
      lat: 'Lat:', lon: 'Lon:',
      energy: 'Energy:', tnt: 'TNT Equivalent:',
      crater: 'Crater (diameter):', event_class: 'Event Class:',
      airburst: 'Airburst Altitude:', mw: 'Seismic magnitude (Mw):',
      r5: '5 psi radius (km):', r1: '1 psi radius (km):', thermal: 'Thermal radius (km):',
      defl_lat: 'Lat (deflected):', defl_lon: 'Lon (deflected):', defl_km: 'Deflection (km):',
      legend1: '1 psi', legend5: '5 psi', legendT: 'Thermal',
      info_r1: 'Overpressure capable of breaking windows.',
      info_r5: 'Overpressure that can damage buildings.',
      info_mw: 'Earthquake magnitude scale (Mw).',
      info_thermal: 'Radius where heat can cause burns/ignition.',
      // Dynamic (list/cards, search, units)
      search_label: 'Search by name or ID',
      search_button: 'Search',
      empty_initial: 'Use the filters and click Search.',
      empty_not_found: 'Nothing found.',
      load_failed: 'Failed to load.',
      loading: 'Loading…',
      card_hazardous: 'Hazardous',
      card_safe: 'Not hazardous',
      card_pass: 'Passage:',
      card_mindist: 'Minimum distance:',
      card_id: 'ID:',
      card_avg_size: 'Average size:',
      card_speed: 'Speed:',
      card_choose_title: 'Simulate',
      card_choose_alt: 'Choose',
      card_open_title: 'Open on JPL',
      card_open_alt: 'Open',
      unit_m: 'm',
      unit_km_s: 'km/s',
      unit_km: 'km',
      fmt_million_km: 'M km',
      fmt_thousand_km: 'k km',
      btn_center_title: 'Center map',
      // Event classes
      class_catastrophic: 'Catastrophic',
      class_severe: 'Severe',
      class_moderate: 'Moderate'
    }
  };

  let __lang = 'en';

  function apply(lang){
    const t = translations[lang] || translations.pt;
    __lang = lang in translations ? lang : 'pt';
    const by = (id, key)=>{ const el = document.getElementById(id); if (el) el.textContent = t[key]; };
    by('tab-list','tab_list');
    by('tab-map','tab_map');
    by('list-title','list_title');
    by('impact-title','map_mitigation');
    const q = document.getElementById('query'); if (q) q.placeholder = t.search_placeholder;
    const slt = document.getElementById('search-label-text'); if (slt) slt.textContent = t.search_label;
    const sbtn = document.getElementById('btn-search-label'); if (sbtn) sbtn.textContent = t.search_button;
    const initEmpty = document.getElementById('results-empty-initial'); if (initEmpty) initEmpty.textContent = t.empty_initial;
    by('btn-simulate-label','simulate');
    by('results-title','results_title');
    // footer texts
    const byOpt = (id, key)=>{ const el = document.getElementById(id); if (el && t[key]) el.textContent = t[key]; };
    byOpt('ft-brand', 'brand_name');
    byOpt('ft-edu', 'footer_edu');
    byOpt('ft-challenge', 'footer_challenge');
    byOpt('ft-theme', 'footer_theme');
    byOpt('ft-desc','footer_desc');
    byOpt('ft-project','footer_project');
    byOpt('ft-refs','footer_refs');
    byOpt('ft-link-ast','footer_link_asteroids');
    byOpt('ft-link-sim','footer_link_sim');
    byOpt('ft-link-apis','footer_link_apis');
    by('lbl-lat','lat'); by('lbl-lon','lon');
    by('lbl-energy','energy'); by('lbl-tnt','tnt');
    by('lbl-crater','crater'); by('lbl-class','event_class');
    by('lbl-airburst','airburst'); by('lbl-mw','mw');
    by('lbl-r5','r5'); by('lbl-r1','r1'); by('lbl-thermal','thermal');
    by('lbl-defl-lat','defl_lat'); by('lbl-defl-lon','defl_lon'); by('lbl-defl-km','defl_km');
    // inputs
    by('lbl-input-lat','lat'); by('lbl-input-lon','lon');
    by('lbl-input-target','target'); by('lbl-input-angle','angle');
    by('lbl-input-size','diameter'); by('lbl-input-speed','speed');
    by('lbl-input-dv','dv'); by('lbl-input-lead','lead');
    const optLand = document.getElementById('opt-land'); if (optLand) optLand.textContent = t.target_land;
    const optOcean = document.getElementById('opt-ocean'); if (optOcean) optOcean.textContent = t.target_ocean;
    // legend labels + tooltips
    const l1 = document.getElementById('legend-1'); if (l1){ l1.textContent = t.legend1; l1.title = t.info_r1; }
    const l5 = document.getElementById('legend-5'); if (l5){ l5.textContent = t.legend5; l5.title = t.info_r5; }
    const lth = document.getElementById('legend-th'); if (lth){ lth.textContent = t.legendT; lth.title = t.info_thermal; }
    // tooltips
    const tip = (sel, text)=>{ const el = document.getElementById(sel); if (el) el.title = t[text]; };
    tip('tip-r1','info_r1'); tip('tip-r5','info_r5'); tip('tip-mw','info_mw'); tip('tip-th','info_thermal');
    document.documentElement.setAttribute('lang', lang);
    localStorage.setItem('lang', lang);
  }

  function init(){
    const saved = localStorage.getItem('lang') || 'en';
    apply(saved);
    const toggle = document.getElementById('lang-toggle');
    if (toggle){
      toggle.value = saved;
      toggle.addEventListener('change', ()=> {
        const v = toggle.value;
        localStorage.setItem('lang', v);
        // Recarregar e levar o usuário ao início/lista
        try{ sessionStorage.setItem('lang_switched','1'); }catch(_){ }
        const url = window.location.origin + window.location.pathname; // limpa hash/query
        window.location.assign(url);
      });
    }
    window.I18N = {
      set: apply,
      t: function(key){
        const lang = __lang;
        const table = translations[lang] || translations.pt;
        return table[key] != null ? table[key] : (translations.en[key] || translations.pt[key] || key);
      },
      lang: function(){ return __lang; }
    };
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{ init(); }
})();


