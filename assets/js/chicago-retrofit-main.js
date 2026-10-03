import { toNumber, escapeHtml, normalizeBuildings, filterBuildings, buildingStats, buildFeatureCollection, geometryBounds } from './map-data.mjs';
import { createMapEnvironment, addContextBuildings, fetchJson, showNotice, hideNotice, setupPanelToggle, mapPadding } from './map-runtime.mjs?v=20261003-ui3';
import { PRIORITY_COLORS, renderBuildingDetail, renderFilterInsights } from './map-details.mjs?v=20261003-ui3';

const mapContainer = document.getElementById('map');
const panel = document.querySelector('.control-panel');
const COLORS = PRIORITY_COLORS;
let buildingsData = [];
let visibleBuildings = [];
let buildingsById = new Map();
let boundaryData = null;
let environment = null;
let currentPopup = null;
let selectedBuildingId = '';
let clusteringEnabled = true;
let threeDEnabled = true;
let candidatesOnly = false;
let loadingData = false;

const colorExpression = ['match', ['get', 'retrofit_priority'], ...Object.entries(COLORS).filter(([key]) => key !== 'default').flat(), COLORS.default];

function restoreLayers(map) {
  if (boundaryData && !map.getSource('community-context')) {
    map.addSource('community-context', { type: 'geojson', data: boundaryData });
    map.addLayer({ id: 'community-outline', type: 'line', source: 'community-context', paint: { 'line-color': '#64748b', 'line-width': 0.8, 'line-opacity': 0.35 } });
  }
  addContextBuildings(map, threeDEnabled);
  const features = buildFeatureCollection(visibleBuildings);
  if (!map.getSource('buildings-clustered')) {
    map.addSource('buildings-clustered', { type: 'geojson', data: features, cluster: true, clusterMaxZoom: 14, clusterRadius: 50 });
    map.addSource('buildings-unclustered', { type: 'geojson', data: features });
    map.addLayer({ id: 'clusters', type: 'circle', source: 'buildings-clustered', filter: ['has', 'point_count'], paint: { 'circle-color': '#38655c', 'circle-radius': ['step', ['get', 'point_count'], 17, 50, 23, 200, 30], 'circle-opacity': 0.92, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 } });
    if (map.getStyle().glyphs) map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'buildings-clustered', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 12 }, paint: { 'text-color': '#fff' } });
    for (const [id, source, filter] of [['building-points', 'buildings-clustered', ['!', ['has', 'point_count']]], ['all-building-points', 'buildings-unclustered', null]]) {
      map.addLayer({ id, type: 'circle', source, ...(filter ? { filter } : {}), paint: { 'circle-color': colorExpression, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 16, 8], 'circle-stroke-color': '#f8fafc', 'circle-stroke-width': 1, 'circle-opacity': 0.9 } });
    }
    map.addLayer({ id: 'selected-building', type: 'circle', source: 'buildings-unclustered', filter: ['==', ['get', 'id'], selectedBuildingId], paint: { 'circle-radius': 11, 'circle-color': '#ffffff', 'circle-opacity': 0, 'circle-stroke-color': '#243238', 'circle-stroke-width': 2 } });
  }
  updateClusteringVisibility(map);
}

function updateClusteringVisibility(map = environment?.map) {
  if (!map) return;
  for (const id of ['clusters', 'cluster-count', 'building-points']) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', clusteringEnabled ? 'visible' : 'none');
  }
  if (map.getLayer('all-building-points')) map.setLayoutProperty('all-building-points', 'visibility', clusteringEnabled ? 'none' : 'visible');
}

function removeCurrentPopup() {
  currentPopup?.remove();
  currentPopup = null;
  selectedBuildingId = '';
  document.getElementById('building-detail').hidden = true;
  if (environment?.map.getLayer('selected-building')) environment.map.setFilter('selected-building', ['==', ['get', 'id'], '']);
}

function setActiveView() {
  const priority = document.getElementById('priority-filter').value;
  for (const id of ['all-buildings', 'retrofit-candidates']) {
    const active = id === 'retrofit-candidates' ? candidatesOnly : !candidatesOnly && !priority;
    const button = document.getElementById(id);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  document.querySelectorAll('[data-priority]').forEach(button => button.setAttribute('aria-pressed', String(!candidatesOnly && priority === button.dataset.priority)));
}

function updateMapData(rows) {
  visibleBuildings = rows;
  removeCurrentPopup();
  const features = buildFeatureCollection(rows);
  for (const id of ['buildings-clustered', 'buildings-unclustered']) environment?.map.getSource(id)?.setData(features);
  updateStats();
}

function applyFilters() {
  const filters = {
    candidates: candidatesOnly,
    priority: document.getElementById('priority-filter').value,
    propertyType: document.getElementById('property-type').value,
    energyMin: toNumber(document.getElementById('energy-min').value),
    energyMax: toNumber(document.getElementById('energy-max').value)
  };
  if ((filters.energyMin !== null && (filters.energyMin < 1 || filters.energyMin > 100)) || (filters.energyMax !== null && (filters.energyMax < 1 || filters.energyMax > 100)) || (filters.energyMin !== null && filters.energyMax !== null && filters.energyMin > filters.energyMax)) {
    showNotice('filter-notice', 'Use an Energy Star range from 1 to 100, with minimum ≤ maximum.');
    return;
  }
  hideNotice('filter-notice');
  setActiveView();
  const filtered = filterBuildings(buildingsData, filters);
  updateMapData(filtered);
}

function clearFilters() {
  for (const id of ['priority-filter', 'property-type', 'energy-min', 'energy-max']) document.getElementById(id).value = '';
  candidatesOnly = false;
  hideNotice('filter-notice');
  setActiveView();
  updateMapData(buildingsData);
}

function fitToData(duration = 600, camera = {}) {
  const bounds = geometryBounds(buildFeatureCollection(visibleBuildings));
  if (bounds && environment) environment.map.fitBounds(bounds, { padding: mapPadding(panel), maxZoom: 16, duration, ...camera });
}

function updateStats() {
  const statistics = buildingStats(visibleBuildings);
  document.getElementById('total-buildings').textContent = `${statistics.total.toLocaleString()} / ${buildingsData.length.toLocaleString()}`;
  document.getElementById('critical-count').textContent = `${statistics.critical.toLocaleString()} Critical + ${statistics.high.toLocaleString()} High`;
  document.getElementById('avg-energy-score').textContent = statistics.averageEnergy === null ? 'N/A' : statistics.averageEnergy.toFixed(1);
  document.getElementById('mapped-buildings').textContent = statistics.mapped.toLocaleString();
  document.getElementById('filter-insights').innerHTML = renderFilterInsights(visibleBuildings, buildingsData.length);
  document.getElementById('data-message').textContent = !statistics.total ? 'No buildings match the current filters.' : `${statistics.mapped.toLocaleString()} mapped · ${(statistics.total - statistics.mapped).toLocaleString()} without valid coordinates · ${statistics.needsRetrofit.toLocaleString()} flagged for retrofit`;
}

async function loadData() {
  if (loadingData) return;
  loadingData = true;
  document.getElementById('loading').style.display = 'flex';
  try {
    buildingsData = normalizeBuildings(await fetchJson('assets/data/buildings.json'));
    buildingsById = new Map(buildingsData.map(row => [String(row.id), row]));
    const select = document.getElementById('property-type');
    select.replaceChildren(new Option('All property types', ''));
    [...new Set(buildingsData.map(row => row.primary_property_type).filter(Boolean))].sort().forEach(type => select.add(new Option(type, type)));
    clearFilters();
    hideNotice('data-notice');
    fitToData(0);
  } catch (error) {
    showNotice('data-notice', `${error.message} No sample data has been substituted.`, loadData);
    updateStats();
  } finally {
    loadingData = false;
    document.getElementById('loading').style.display = 'none';
  }
}

async function initializeMap() {
  if (environment) return;
  try {
    environment = await createMapEnvironment({ pitch: threeDEnabled ? 30 : 0, restoreLayers });
    const { map } = environment;
    fitToData(0);
    map.on('click', 'clusters', async event => {
      const feature = event.features?.[0];
      if (!feature) return;
      try {
        const zoom = await map.getSource('buildings-clustered').getClusterExpansionZoom(feature.properties.cluster_id);
        map.easeTo({ center: feature.geometry.coordinates, zoom, padding: mapPadding(panel) });
      } catch { showNotice('filter-notice', 'That cluster has changed. Select it again.'); }
    });
    for (const id of ['building-points', 'all-building-points']) {
      map.on('click', id, event => {
        const building = buildingsById.get(event.features?.[0]?.properties.id);
        if (building) showBuildingPopup(building);
      });
    }
    for (const id of ['clusters', 'building-points', 'all-building-points']) {
      map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
    }
    map.once('load', () => fitToData(0));
    hideNotice('map-initialization-notice');
  } catch (error) {
    showNotice('map-initialization-notice', `${error.message} Building statistics and filters remain available.`, initializeMap);
  }
}

function setupControls() {
  setupPanelToggle(panel, document.getElementById('controls-toggle'));
  document.getElementById('all-buildings').addEventListener('click', clearFilters);
  document.getElementById('retrofit-candidates').addEventListener('click', () => {
    clearFilters(); candidatesOnly = true; setActiveView(); applyFilters();
  });
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  for (const id of ['priority-filter', 'property-type']) document.getElementById(id).addEventListener('change', applyFilters);
  document.querySelectorAll('[data-priority]').forEach(button => button.addEventListener('click', () => {
    candidatesOnly = false;
    document.getElementById('priority-filter').value = button.dataset.priority;
    applyFilters();
  }));
  document.getElementById('fit-to-data').addEventListener('click', () => fitToData());
  document.getElementById('show-clusters').addEventListener('change', event => { clusteringEnabled = event.target.checked; removeCurrentPopup(); updateClusteringVisibility(); });
  document.getElementById('toggle-3d').addEventListener('click', event => {
    threeDEnabled = !threeDEnabled;
    event.currentTarget.textContent = '3D buildings';
    event.currentTarget.setAttribute('aria-pressed', String(threeDEnabled));
    const map = environment?.map;
    map?.easeTo({ pitch: threeDEnabled ? 45 : 0, bearing: 0 });
    if (map?.getLayer('context-buildings')) map.setLayoutProperty('context-buildings', 'visibility', threeDEnabled ? 'visible' : 'none');
  });
  document.getElementById('reset-view').addEventListener('click', () => {
    fitToData(600, { pitch: threeDEnabled ? 30 : 0, bearing: 0 });
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') removeCurrentPopup(); });
}

function showBuildingPopup(building) {
  removeCurrentPopup();
  const detail = document.getElementById('building-detail');
  detail.innerHTML = renderBuildingDetail(building);
  detail.hidden = false;
  detail.querySelector('[data-popup-close]').addEventListener('click', removeCurrentPopup);
  if (window.innerWidth <= 768 && !panel.classList.contains('is-collapsed')) document.getElementById('controls-toggle').click();
  const map = environment.map;
  selectedBuildingId = String(building.id);
  map.setFilter('selected-building', ['==', ['get', 'id'], selectedBuildingId]);
  currentPopup = new environment.lib.Popup({ offset: 14, closeButton: false, closeOnClick: false, className: 'building-map-label', maxWidth: '220px' })
    .setLngLat([building.longitude, building.latitude]).setText(building.property_name || 'Selected building').addTo(map);
  map.easeTo({ center: [building.longitude, building.latitude], padding: mapPadding(panel), duration: 450 });
}

setupControls();
void loadData();
void initializeMap();
fetchJson('assets/data/retrofit-v2/community_boundaries.geojson').then(data => {
  boundaryData = data;
  environment?.refreshLayers();
}).catch(() => { /* Optional context; the energy dataset remains usable. */ });
