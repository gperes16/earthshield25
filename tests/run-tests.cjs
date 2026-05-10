const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function makeClassList() {
  const set = new Set();
  return {
    add: (...names) => names.forEach((name) => set.add(name)),
    remove: (...names) => names.forEach((name) => set.delete(name)),
    contains: (name) => set.has(name),
    toggle: (name, force) => {
      const next = force === undefined ? !set.has(name) : !!force;
      if (next) set.add(name);
      else set.delete(name);
      return next;
    },
    toArray: () => Array.from(set),
  };
}

function makeElement(initial = {}) {
  const el = {
    value: initial.value ?? '',
    textContent: initial.textContent ?? '',
    title: initial.title ?? '',
    hidden: !!initial.hidden,
    dataset: initial.dataset ?? {},
    classList: makeClassList(),
    attributes: {},
    style: {},
    addEventListener: () => {},
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    },
  };
  if (initial.className) el.className = initial.className;
  if (initial.classes) initial.classes.forEach((name) => el.classList.add(name));
  return el;
}

function buildSimulationSandbox() {
  const elements = {
    'map-lat': makeElement({ value: '10' }),
    'map-lon': makeElement({ value: '20' }),
    'impact-target': makeElement({ value: 'land' }),
    'impact-angle': makeElement({ value: '45' }),
    'ast-size': makeElement({ value: '500' }),
    'ast-speed': makeElement({ value: '20' }),
    'dv-mm': makeElement({ value: '10' }),
    'lead-days': makeElement({ value: '5' }),
    'simulation-error': makeElement(),
    'impact-results': makeElement(),
    'res-lat': makeElement(),
    'res-lon': makeElement(),
    'res-energy': makeElement(),
    'res-mt': makeElement(),
    'res-crater': makeElement(),
    'res-class': makeElement(),
    'res-airburst': makeElement(),
    'res-mw': makeElement(),
    'res-op5': makeElement(),
    'res-op1': makeElement(),
    'res-thermal': makeElement(),
    'res-defl-lat': makeElement(),
    'res-defl-lon': makeElement(),
    'res-defl-km': makeElement(),
  };

  const layers = [];
  const mapState = { layers, setViewCalls: [], setView(center, zoom) { this.setViewCalls.push({ center, zoom }); } };

  const sandbox = {
    window: null,
    document: {
      getElementById(id) {
        return elements[id] || null;
      },
    },
    ImpactMap: {
      getMap: () => mapState,
      clearOverlays: () => {
        mapState.layers.length = 0;
      },
      addOverlay: (layer) => {
        mapState.layers.push(layer);
        if (typeof layer.addTo === 'function') layer.addTo(mapState);
      },
    },
    I18N: {
      t: (key) => ({
        simulation_error_invalid: 'invalid',
        simulation_error_generic: 'generic',
        class_catastrophic: 'catastrophic',
        class_severe: 'severe',
        class_moderate: 'moderate',
      })[key] || key,
    },
    L: {
      circle: (center, opts) => ({ type: 'circle', center, opts, addTo: () => undefined }),
      polyline: (points, opts) => ({ type: 'polyline', points, opts, addTo: () => undefined }),
      marker: (point, opts) => ({ type: 'marker', point, opts, addTo: () => undefined }),
    },
    console,
    Math,
    Number,
    parseFloat,
    setTimeout,
    clearTimeout,
  };

  sandbox.window = sandbox;

  const coreCode = fs.readFileSync(path.join(root, 'js', 'simCore.js'), 'utf8');
  vm.runInNewContext(coreCode, sandbox, { filename: 'simCore.js' });

  const code = fs.readFileSync(path.join(root, 'js', 'simulation.js'), 'utf8');
  vm.runInNewContext(code, sandbox, { filename: 'simulation.js' });

  return { sandbox, elements, mapState };
}

function buildNasaSandbox(fetchImpl) {
  const sandbox = {
    window: null,
    fetch: fetchImpl,
    console,
    Math,
    Number,
    parseFloat,
    setTimeout,
    clearTimeout,
  };
  sandbox.window = sandbox;
  const code = fs.readFileSync(path.join(root, 'js', 'nasaClient.js'), 'utf8');
  vm.runInNewContext(code, sandbox, { filename: 'nasaClient.js' });
  return sandbox;
}

async function testSimulationValid() {
  const { sandbox, elements, mapState } = buildSimulationSandbox();
  sandbox.simulateImpact();

  assert.strictEqual(elements['simulation-error'].classList.contains('hidden'), true);
  assert.strictEqual(elements['impact-results'].classList.contains('hidden'), false);
  assert.match(elements['res-energy'].textContent, /J$/);
  assert.strictEqual(mapState.layers.length, 6);
  assert.notStrictEqual(elements['res-defl-km'].textContent, '0.00');
}

async function testSimCore() {
  const sandbox = { window: null, Math, Number };
  sandbox.window = sandbox;
  const code = fs.readFileSync(path.join(root, 'js', 'simCore.js'), 'utf8');
  vm.runInNewContext(code, sandbox, { filename: 'simCore.js' });

  const crater = sandbox.SimCore.estimateCraterDiameterMeters(500, 20, 45, 'land');
  const energy = sandbox.SimCore.estimateEnergyMt(500, 20, 'land');
  const defl = sandbox.SimCore.applyDeflection(10, 20, 10, 5);

  assert.ok(crater > 0);
  assert.ok(energy > 0);
  assert.ok(defl.lon2 > 20);
  assert.strictEqual(sandbox.SimCore.classifyEnergy(2000, (k) => k), 'class_catastrophic');
}

async function testSimulationInvalid() {
  const { sandbox, elements } = buildSimulationSandbox();
  elements['ast-size'].value = '';
  sandbox.simulateImpact();

  assert.strictEqual(elements['simulation-error'].classList.contains('hidden'), false);
  assert.strictEqual(elements['impact-results'].classList.contains('hidden'), true);
  assert.strictEqual(elements['simulation-error'].textContent, 'invalid');
}

async function testNasaClientSearch() {
  const pages = {
    '0:20': {
      page: { total_pages: 2 },
      near_earth_objects: [
        { id: '1', name: 'Alpha', estimated_diameter: { meters: { estimated_diameter_min: 10, estimated_diameter_max: 14 } }, close_approach_data: [{ close_approach_date: '2020-01-01', miss_distance: { kilometers: '100' }, relative_velocity: { kilometers_per_second: '5' } }], is_potentially_hazardous_asteroid: false },
      ],
    },
    '1:20': {
      page: { total_pages: 2 },
      near_earth_objects: [
        { id: '2', name: 'Beta', estimated_diameter: { meters: { estimated_diameter_min: 20, estimated_diameter_max: 30 } }, close_approach_data: [{ close_approach_date_full: '2020-02-02 10:00', miss_distance: { kilometers: '200' }, relative_velocity: { kilometers_per_second: '6' } }], is_potentially_hazardous_asteroid: true },
      ],
    },
  };
  const calls = [];
  const sandbox = buildNasaSandbox(async (url) => {
    const qs = new URL(url, 'https://example.test').searchParams;
    const key = `${qs.get('page')}:${qs.get('size')}`;
    calls.push(key);
    return {
      ok: true,
      status: 200,
      async json() { return pages[key]; },
    };
  });

  const results = await sandbox.NasaClient.search('beta');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].name, 'Beta');
  assert.strictEqual(results[0].speedKmPerS, 6);
  assert.deepStrictEqual(calls, ['0:20', '1:20']);
}

async function testNasaClientScroller() {
  const pages = {
    '0:2': {
      page: { total_pages: 2 },
      near_earth_objects: [
        { id: '1', name: 'Alpha', estimated_diameter: { meters: { estimated_diameter_min: 10, estimated_diameter_max: 14 } }, close_approach_data: [], is_potentially_hazardous_asteroid: false },
        { id: '2', name: 'Beta', estimated_diameter: { meters: { estimated_diameter_min: 20, estimated_diameter_max: 30 } }, close_approach_data: [], is_potentially_hazardous_asteroid: true },
      ],
    },
    '1:2': {
      page: { total_pages: 2 },
      near_earth_objects: [
        { id: '3', name: 'Gamma', estimated_diameter: { meters: { estimated_diameter_min: 30, estimated_diameter_max: 40 } }, close_approach_data: [], is_potentially_hazardous_asteroid: false },
      ],
    },
  };

  const sandbox = buildNasaSandbox(async (url) => {
    const qs = new URL(url, 'https://example.test').searchParams;
    const key = `${qs.get('page')}:${qs.get('size')}`;
    return {
      ok: true,
      status: 200,
      async json() { return pages[key]; },
    };
  });

  const scroller = sandbox.NasaClient.createScroller('', 2);
  const first = await scroller.next();
  const second = await scroller.next();

  assert.strictEqual(first.items.length, 2);
  assert.strictEqual(second.items.length, 1);
  assert.strictEqual(second.done, true);
}

async function run() {
  const tests = [
    ['sim core', testSimCore],
    ['simulation valid', testSimulationValid],
    ['simulation invalid', testSimulationInvalid],
    ['nasa search', testNasaClientSearch],
    ['nasa scroller', testNasaClientScroller],
  ];

  for (const [name, fn] of tests) {
    await fn();
    process.stdout.write(`ok - ${name}\n`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
