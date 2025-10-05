(function(global){
  const KEY = global.NASA_API_KEY || 'DEMO_KEY';
  // Usar o proxy local do servidor; ele injeta a chave e lida com CORS
  const BASE = '/api/neo/browse';

  async function fetchPage(page, size){
    const sz = Number.isFinite(size) && size > 0 ? size : 20;
    const url = `${BASE}?page=${page}&size=${sz}`;
    const res = await fetch(url, {cache: 'no-store'});
    if (!res.ok) throw new Error(`NASA NEO error ${res.status}`);
    return res.json();
  }

  function simplify(o){
    // average size (m)
    const est = o.estimated_diameter?.meters;
    const size = est ? ( (Number(est.estimated_diameter_min)||0) + (Number(est.estimated_diameter_max)||0) )/2 : NaN;

    // approach data (take the next/first available)
    let approachDate = null, missKm = null, kmps = null;
    const ca = Array.isArray(o.close_approach_data) ? o.close_approach_data[0] : null;
    if (ca){
      approachDate = ca.close_approach_date_full || ca.close_approach_date || null;
      const md = ca.miss_distance?.kilometers;
      missKm = md ? Number(md) : null;
      const v = ca.relative_velocity?.kilometers_per_second;
      kmps = v ? Number(v) : null;
    }

    return {
      id: o.id,
      name: o.name || o.designation || 'NEO',
      sizeMeters: Number.isFinite(size) ? size : null,
      speedKmPerS: Number.isFinite(kmps) ? kmps : 20,
      isHazardous: !!o.is_potentially_hazardous_asteroid,
      approachDate,
      missDistanceKm: missKm
    };
  }

  async function search(queryText='', pages){
    try{
      const all = [];

      // Buscar a primeira página para descobrir total_pages quando pages não for informado
      const first = await fetchPage(0, 20);
      const firstChunk = (first && first.near_earth_objects) || [];
      firstChunk.forEach(x => all.push(simplify(x)));

      const totalFromApi = Number(first?.page?.total_pages);
      const totalPages = Math.max(1, Number.isFinite(totalFromApi) ? totalFromApi : 1);
      // Para evitar carregamento muito demorado, limite padrão a 10 páginas (~200 itens)
      const defaultCap = 10;
      const maxPages = pages != null ? Math.min(totalPages, Number(pages) || 0) : Math.min(totalPages, defaultCap);

      for(let p=1; p<maxPages; p++){
        try{
          const data = await fetchPage(p, 20);
          const chunk = (data && data.near_earth_objects) || [];
          if (!chunk.length) break;
          chunk.forEach(x => all.push(simplify(x)));
        }catch(inner){
          // para não derrubar tudo se uma página falhar
          console.warn('Falha ao buscar página', p, inner);
          break;
        }
      }

      const q = (queryText||'').trim().toLowerCase();
      const filtered = q ? all.filter(x => (x.name||'').toLowerCase().includes(q) || (x.id||'').includes(q)) : all;
      return filtered;
    }catch(err){
      console.warn('NASA API fallback:', err);
      return [
        { id:'2001036', name:'1036 Ganymed', sizeMeters: 62740, speedKmPerS: 6.3, isHazardous:false, approachDate:'1910-02-25 08:36', missDistanceKm: 2926851826 },
        { id:'2001221', name:'1221 Amor', sizeMeters: 1444, speedKmPerS: 10.77, isHazardous:false, approachDate:'1908-03-14 13:14', missDistanceKm: 27512874 },
        { id:'2001566', name:'1566 Icarus', sizeMeters: 2126, speedKmPerS: 27.01, isHazardous:true, approachDate:'1902-06-11 20:20', missDistanceKm: 12638659 },
        { id:'2001580', name:'1580 Betulia', sizeMeters: 4500, speedKmPerS: 14.5, isHazardous:false, approachDate:'1929-06-09 14:54', missDistanceKm: 2766899888 }
      ];
    }
  }

  // Helper para infinite scroll: retorna um controlador com método next()
  // que busca até "batchSize" itens que correspondem ao filtro (nome/id)
  function createScroller(queryText='', batchSize=10, hardPageLimit){
    const q = (queryText||'').trim().toLowerCase();
    const pageSize = Math.max(1, Number(batchSize) || 10);
    let currentPage = 0;
    let totalPages = null;
    let finished = false;

    async function next(){
      if (finished) return { items: [], done: true };
      const collected = [];
      // Continuar buscando páginas até juntar "pageSize" itens filtrados
      while(collected.length < pageSize){
        const data = await fetchPage(currentPage, pageSize);
        if (totalPages == null){
          const totalFromApi = Number(data?.page?.total_pages);
          totalPages = Math.max(1, Number.isFinite(totalFromApi) ? totalFromApi : 1);
        }
        const raw = (data && data.near_earth_objects) || [];
        const simplified = raw.map(simplify);
        const filtered = q
          ? simplified.filter(x => (x.name||'').toLowerCase().includes(q) || (x.id||'').includes(q))
          : simplified;
        filtered.forEach(x => { if (collected.length < pageSize) collected.push(x); });

        currentPage += 1;
        const limitReached = hardPageLimit != null && currentPage >= Math.min(totalPages, Number(hardPageLimit) || 0);
        if (currentPage >= totalPages || raw.length === 0 || limitReached){
          finished = true;
          break;
        }
      }
      return { items: collected, done: finished };
    }

    return { next };
  }

  global.NasaClient = { search, createScroller };
})(window);
