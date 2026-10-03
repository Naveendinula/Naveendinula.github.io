// The map renderer and tile service require no account, token, or billable API.
export const MAPLIBRE_MODULE = 'https://unpkg.com/maplibre-gl@6.11.2/dist/maplibre-gl.mjs';
export const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
export const CHICAGO_CENTER = [-87.6298, 41.8781];

export function withTimeout(promise, milliseconds = 15000, message = 'The request timed out. Please retry.') {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), milliseconds);
  })]).finally(() => clearTimeout(timer));
}

export async function fetchJson(url, timeoutMs = 15000) {
  const controller = new AbortController();
  try {
    return await withTimeout((async () => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Could not load data (HTTP ${response.status}).`);
      return response.json();
    })(), timeoutMs);
  } finally {
    controller.abort();
  }
}

export function plainMapStyle() {
  return { version: 8, sources: {}, layers: [{ id: 'plain-background', type: 'background', paint: { 'background-color': '#e4ecee' } }] };
}

// style.load permits source/layer changes before remote tiles finish loading.
export function createLayerLifecycle(map, restore) {
  let styleReady = false;
  map.on('style.load', () => { styleReady = true; restore(); });
  return {
    loading() { styleReady = false; },
    refresh() { if (styleReady) restore(); }
  };
}

export function isBasemapReady(map) {
  return map.isStyleLoaded() && map.areTilesLoaded();
}

export function addContextBuildings(map, enabled) {
  if (!map.getSource('openmaptiles') || map.getLayer('context-buildings')) return;
  const label = map.getStyle().layers.find(layer => layer.type === 'symbol' && layer.layout?.['text-field']);
  map.addLayer({
    id: 'context-buildings', source: 'openmaptiles', 'source-layer': 'building', type: 'fill-extrusion', minzoom: 12,
    layout: { visibility: enabled ? 'visible' : 'none' },
    paint: { 'fill-extrusion-color': '#b5c2bf', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 0], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.75 }
  }, label?.id);
}

export function showNotice(id, message, retry) {
  let notice = document.getElementById(id);
  if (!notice) {
    let stack = document.getElementById('map-notice-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'map-notice-stack';
      document.body.appendChild(stack);
    }
    notice = document.createElement('div');
    notice.id = id;
    notice.className = 'map-notice';
    notice.setAttribute('role', 'status');
    stack.appendChild(notice);
  }
  notice.replaceChildren();
  const label = document.createElement('span');
  label.textContent = message;
  notice.appendChild(label);
  if (retry) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = 'Retry';
    button.addEventListener('click', retry);
    notice.appendChild(button);
  }
  notice.hidden = false;
}

export function hideNotice(id) {
  const notice = document.getElementById(id);
  if (notice) notice.hidden = true;
}

export function calculateMapPadding(mapRect, obstacles = []) {
  const padding = { top: 64, right: 60, bottom: 40, left: 30 };
  for (const { edge, rect } of obstacles) {
    if (rect.right <= mapRect.left || rect.left >= mapRect.right || rect.bottom <= mapRect.top || rect.top >= mapRect.bottom) continue;
    const amount = { left: rect.right - mapRect.left, right: mapRect.right - rect.left, top: rect.bottom - mapRect.top, bottom: mapRect.bottom - rect.top }[edge];
    padding[edge] = Math.max(padding[edge], amount + 20);
  }
  for (const [first, second, size, minimum] of [['left', 'right', mapRect.width, 120], ['top', 'bottom', mapRect.height, 100]]) {
    const total = padding[first] + padding[second];
    const available = Math.max(0, size - minimum);
    if (total > available) {
      padding[first] = Math.floor(padding[first] * available / total);
      padding[second] = Math.floor(padding[second] * available / total);
    }
  }
  return padding;
}

export function mapPadding(panel, bottomPanel) {
  const mobile = window.innerWidth <= 768;
  const mapRect = document.getElementById('map').getBoundingClientRect();
  const obstacles = [];
  const include = (element, edge) => {
    if (!element || element.hidden || getComputedStyle(element).visibility === 'hidden') return;
    const rect = element.getBoundingClientRect();
    if (rect.width && rect.height) obstacles.push({ rect, edge });
  };
  include(panel, mobile ? 'bottom' : panel?.dataset.mapEdge || 'left');
  if (bottomPanel?.classList.contains('open')) include(bottomPanel, 'bottom');
  include(document.getElementById('building-detail'), mobile ? 'bottom' : 'right');
  return calculateMapPadding(mapRect, obstacles);
}

export async function createMapEnvironment({ container = 'map', pitch = 0, restoreLayers }) {
  const lib = await withTimeout(import(MAPLIBRE_MODULE), 15000, 'The map library could not load. Please retry.');
  let map;
  try {
    map = new lib.Map({ container, style: plainMapStyle(), center: CHICAGO_CENTER, zoom: 10, pitch, renderWorldCopies: false, attributionControl: { compact: true } });
  } catch {
    throw new Error('Interactive maps require WebGL. Enable hardware acceleration or try another browser.');
  }
  map.addControl(new lib.NavigationControl({ visualizePitch: true }), 'top-right');
  map.addControl(new lib.FullscreenControl({ container: document.body }), 'top-right');
  map.addControl(new lib.ScaleControl({ maxWidth: 100 }), 'bottom-left');
  const layers = createLayerLifecycle(map, () => restoreLayers(map, lib));

  let generation = 0;
  let fallback = true;
  let startupTimer;
  let pending = false;
  let confirmedTiles = false;
  const noticeId = `${container}-basemap-notice`;
  const fallbackToLocal = () => {
    if (!fallback) {
      fallback = true;
      confirmedTiles = false;
      layers.loading();
      map.setStyle(plainMapStyle(), { diff: false });
    }
    clearTimeout(startupTimer);
    showNotice(noticeId, 'Street map unavailable. Local project data is still available.', retryBasemap);
  };

  async function retryBasemap() {
    if (pending) return;
    pending = true;
    const attempt = ++generation;
    showNotice(noticeId, 'Loading street map…');
    try {
      const style = await fetchJson(OPENFREEMAP_STYLE, 10000);
      for (const layer of style.layers) {
        if (layer.type === 'fill' && layer['source-layer'] === 'water') layer.paint = { ...layer.paint, 'fill-color': '#e2edf0' };
      }
      if (attempt !== generation) return;
      fallback = false;
      confirmedTiles = false;
      clearTimeout(startupTimer);
      layers.loading();
      map.setStyle(style, { diff: false });
      startupTimer = setTimeout(() => {
        if (!confirmedTiles) fallbackToLocal();
      }, 15000);
    } catch {
      if (attempt === generation) fallbackToLocal();
    } finally {
      pending = false;
    }
  }

  const markReady = () => {
    if (!fallback && !confirmedTiles && isBasemapReady(map)) {
      confirmedTiles = true;
      clearTimeout(startupTimer);
      hideNotice(noticeId);
    }
  };
  // Animated boundary highlights keep the map rendering and prevent `idle`.
  map.on('render', markReady);
  map.on('idle', markReady);
  map.on('error', event => {
    // A failed project overlay is handled by its own data loader; basemap
    // sources and glyph/sprite failures must not take local data down with them.
    const source = event.sourceId || event.error?.sourceId;
    if (!fallback && (!source || source === 'openmaptiles' || source === 'ne2_shaded')) fallbackToLocal();
  });
  map.on('remove', () => { generation += 1; clearTimeout(startupTimer); });
  void retryBasemap();
  return { map, lib, retryBasemap, refreshLayers: () => layers.refresh() };
}

export function setupPanelToggle(panel, button) {
  if (!panel || !button) return;
  const setCollapsed = collapsed => {
    panel.classList.toggle('is-collapsed', collapsed);
    button.setAttribute('aria-expanded', String(!collapsed));
    button.textContent = collapsed ? button.dataset.collapsedLabel || 'Show controls' : button.dataset.expandedLabel || 'Hide controls';
  };
  setCollapsed(window.innerWidth <= 768);
  button.addEventListener('click', () => setCollapsed(!panel.classList.contains('is-collapsed')));
}
