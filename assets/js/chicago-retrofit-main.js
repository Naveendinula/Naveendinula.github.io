import { toNumber, escapeHtml, normalizeBuildings, filterBuildings, buildingStats, buildFeatureCollection, geometryBounds } from './map-data.mjs';
import { createMapEnvironment, addContextBuildings, fetchJson, showNotice, hideNotice, setupPanelToggle, mapPadding } from './map-runtime.mjs';

const mapContainer = document.getElementById('map');
const panel = document.querySelector('.control-panel');
const COLORS = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#65a30d', Minimal: '#059669', default: '#9ca3af' };
let buildingsData = [];
let visibleBuildings = [];
let buildingsById = new Map();
let boundaryData = null;
let environment = null;
let currentPopup = null;
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
    map.addLayer({ id: 'clusters', type: 'circle', source: 'buildings-clustered', filter: ['has', 'point_count'], paint: { 'circle-color': '#2563eb', 'circle-radius': ['step', ['get', 'point_count'], 17, 50, 23, 200, 30], 'circle-opacity': 0.85, 'circle-stroke-color': '#93c5fd', 'circle-stroke-width': 1.5 } });
    if (map.getStyle().glyphs) map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'buildings-clustered', filter: ['has', 'point_count'], layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 12 }, paint: { 'text-color': '#fff' } });
    for (const [id, source, filter] of [['building-points', 'buildings-clustered', ['!', ['has', 'point_count']]], ['all-building-points', 'buildings-unclustered', null]]) {
      map.addLayer({ id, type: 'circle', source, ...(filter ? { filter } : {}), paint: { 'circle-color': colorExpression, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 16, 8], 'circle-stroke-color': '#f8fafc', 'circle-stroke-width': 1, 'circle-opacity': 0.9 } });
    }
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
}

function setActiveView() {
  for (const id of ['all-buildings', 'retrofit-candidates']) {
    const active = (id === 'retrofit-candidates') === candidatesOnly;
    const button = document.getElementById(id);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.style.background = active ? '#2563eb' : 'transparent';
    button.style.color = active ? 'white' : '#60a5fa';
  }
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
  const filtered = filterBuildings(buildingsData, filters);
  updateMapData(filtered);
  showFilterInsights(filtered, { priorityFilter: filters.priority, propertyTypeFilter: filters.propertyType, energyMin: filters.energyMin ?? 0, energyMax: filters.energyMax ?? 100, view: candidatesOnly ? 'Retrofit Candidates' : '' });
}

function clearFilters() {
  for (const id of ['priority-filter', 'property-type', 'energy-min', 'energy-max']) document.getElementById(id).value = '';
  candidatesOnly = false;
  hideNotice('filter-notice');
  closeInsightsPopup();
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
    select.replaceChildren(new Option('All Types', ''));
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
  document.getElementById('fit-to-data').addEventListener('click', () => fitToData());
  document.getElementById('show-clusters').addEventListener('change', event => { clusteringEnabled = event.target.checked; removeCurrentPopup(); updateClusteringVisibility(); });
  document.getElementById('toggle-3d').addEventListener('click', event => {
    threeDEnabled = !threeDEnabled;
    event.currentTarget.textContent = threeDEnabled ? 'Switch to 2D' : 'Switch to 3D';
    event.currentTarget.setAttribute('aria-pressed', String(threeDEnabled));
    const map = environment?.map;
    map?.easeTo({ pitch: threeDEnabled ? 45 : 0, bearing: 0 });
    if (map?.getLayer('context-buildings')) map.setLayoutProperty('context-buildings', 'visibility', threeDEnabled ? 'visible' : 'none');
  });
  document.getElementById('reset-view').addEventListener('click', () => {
    fitToData(600, { pitch: threeDEnabled ? 30 : 0, bearing: 0 });
  });
}

setupControls();
void loadData();
void initializeMap();
fetchJson('assets/data/retrofit-v2/community_boundaries.geojson').then(data => {
  boundaryData = data;
  environment?.refreshLayers();
}).catch(() => { /* Optional context; the energy dataset remains usable. */ });

function formatMetric(value, fallback = 'N/A', digits = 0) {
    const number = toNumber(value);
    if (number === null) return fallback;
    return digits > 0 ? number.toFixed(digits) : Math.round(number).toLocaleString();
}

function showBuildingPopup(building) {
    removeCurrentPopup();

    const currentYear = new Date().getFullYear();
    const yearBuilt = toNumber(building.year_built);
    const buildingAge = yearBuilt ? currentYear - yearBuilt : 'Unknown';
    const energyScore = toNumber(building.energy_star_score);
    const retrofitScore = toNumber(building.retrofit_score);

    const popup = document.createElement('div');
    popup.className = 'local-map-popup';
    popup.innerHTML = `
        <div style="font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace; color: white; background: rgba(8, 8, 12, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; padding: 0; max-width: 280px; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); overflow: hidden;">
            <div style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.02); position: relative;">
                <button type="button" data-popup-close style="position: absolute; top: 12px; right: 12px; background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer; padding: 4px; width: 24px; height: 24px; border-radius: 4px;">x</button>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding-right: 30px;">
                    <div style="width: 4px; height: 4px; background: #60a5fa; border-radius: 50%;"></div>
                    <div style="font-size: 14px; font-weight: 600; color: #f8fafc; line-height: 1.2; word-wrap: break-word;">
                        ${escapeHtml((building.property_name || 'Building').substring(0, 35))}${(building.property_name || '').length > 35 ? '...' : ''}
                    </div>
                </div>
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; word-wrap: break-word;">
                    ${escapeHtml((building.address || 'Address not available').substring(0, 40))}${(building.address || '').length > 40 ? '...' : ''}
                </div>
            </div>
            <div style="padding: 16px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Energy Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${energyScore !== null && energyScore < 50 ? '#ef4444' : energyScore !== null && energyScore > 75 ? '#10b981' : '#f59e0b'}">${energyScore ?? 'N/A'}</div>
                    </div>
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Retrofit Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${retrofitScore !== null && retrofitScore > 60 ? '#ef4444' : retrofitScore !== null && retrofitScore < 30 ? '#10b981' : '#f59e0b'}">${retrofitScore !== null ? Math.round(retrofitScore) : 'N/A'}</div>
                    </div>
                </div>
                <div style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05)); padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(96, 165, 250, 0.2);">
                    <div style="font-size: 11px; color: #e2e8f0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Priority Level</div>
                    <div style="font-size: 18px; font-weight: 700; color: ${COLORS[building.retrofit_priority] || COLORS.default}; text-transform: capitalize;">${escapeHtml(building.retrofit_priority || 'Unknown')}</div>
                    ${building.needs_retrofit ? '<div style="margin-top: 6px; font-size: 10px; color: #fca5a5; background: rgba(220, 38, 38, 0.15); padding: 4px 8px; border-radius: 3px; text-align: center;">NEEDS RETROFIT</div>' : ''}
                </div>
                <div style="display: grid; gap: 8px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Type:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${escapeHtml((building.primary_property_type || 'N/A').substring(0, 20))}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Age:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${escapeHtml(buildingAge)} years</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Chicago Rating:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${escapeHtml(building.chicago_energy_rating || 'N/A')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: #94a3b8;">Site EUI:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${formatMetric(building.site_eui_kbtu_sq_ft)} kBtu/sq ft</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 6px 0;">
                        <span style="color: #94a3b8;">GHG Intensity:</span>
                        <span style="color: #e2e8f0; font-weight: 500;">${formatMetric(building.ghg_intensity_kg_co2e_sq_ft, 'N/A', 2)} kg/sq ft</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    popup.querySelector('[data-popup-close]').addEventListener('click', removeCurrentPopup);
    currentPopup = new environment.lib.Popup({ offset: 12, maxWidth: '320px', closeButton: false })
        .setLngLat([building.longitude, building.latitude]).setDOMContent(popup).addTo(environment.map);
}


function showFilterInsights(filteredData, filters) {
    const totalOriginal = buildingsData.length;
    const totalFiltered = filteredData.length;
    const percentage = totalOriginal > 0 ? ((totalFiltered / totalOriginal) * 100).toFixed(1) : '0.0';
    const priorities = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
    const priorityCount = Object.fromEntries(priorities.map((priority) => [priority, 0]));
    const typeCount = {};
    const stats = buildingStats(filteredData);

    filteredData.forEach((building) => {
        if (building.retrofit_priority && priorityCount[building.retrofit_priority] !== undefined) {
            priorityCount[building.retrofit_priority] += 1;
        }

        const type = building.primary_property_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;

    });

    const avgEnergy = stats.averageEnergy?.toFixed(1) ?? 'N/A';
    const avgRetrofit = stats.averageRetrofit?.toFixed(1) ?? 'N/A';
    const topTypes = Object.entries(typeCount).sort(([, a], [, b]) => b - a).slice(0, 3);
    const appliedFilters = [];

    if (filters.priorityFilter) appliedFilters.push(`Priority: ${filters.priorityFilter}`);
    if (filters.propertyTypeFilter) appliedFilters.push(`Type: ${filters.propertyTypeFilter}`);
    if (filters.energyMin > 0 || filters.energyMax < 100) appliedFilters.push(`Energy: ${filters.energyMin}-${filters.energyMax}`);
    if (filters.view) appliedFilters.push(`View: ${filters.view}`);

    const insightsHTML = `
        <div id="insights-popup" style="font-family: 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', monospace; color: white; width: 280px; background: rgba(8, 8, 12, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; position: relative; cursor: move; backdrop-filter: blur(10px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);">
            <div id="insights-header" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); cursor: move; user-select: none; background: rgba(255, 255, 255, 0.02);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 6px; height: 6px; background: #60a5fa; border-radius: 50%;"></div>
                    <div style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></div>
                    <div style="width: 6px; height: 6px; background: #f59e0b; border-radius: 50%;"></div>
                    <h3 style="margin: 0 0 0 8px; color: #f8fafc; font-size: 14px; font-weight: 600;">Filter Analysis</h3>
                </div>
                <button onclick="closeInsightsPopup()" style="background: transparent; color: #94a3b8; border: none; font-size: 14px; cursor: pointer; padding: 4px; width: 24px; height: 24px; border-radius: 4px;">x</button>
            </div>
            <div style="padding: 16px;">
                <div style="background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(59, 130, 246, 0.05)); padding: 12px; border-radius: 6px; margin-bottom: 16px; border: 1px solid rgba(96, 165, 250, 0.2);">
                    <div style="font-size: 13px; font-weight: 600; color: #e2e8f0; margin-bottom: 6px;">Results Summary</div>
                    <div style="font-size: 24px; font-weight: 700; color: #60a5fa; margin-bottom: 4px;">${totalFiltered.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #94a3b8;">${percentage}% of ${totalOriginal.toLocaleString()} total buildings</div>
                    ${appliedFilters.length > 0 ? `<div style="font-size: 10px; margin-top: 8px; color: #64748b; padding: 4px 8px; background: rgba(0,0,0,0.3); border-radius: 3px;">${escapeHtml(appliedFilters.join(' | '))}</div>` : ''}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Energy Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${avgEnergy !== 'N/A' && avgEnergy < 50 ? '#ef4444' : avgEnergy !== 'N/A' && avgEnergy > 75 ? '#10b981' : '#f59e0b'}">${avgEnergy}</div>
                        <div style="font-size: 9px; color: #64748b;">average</div>
                    </div>
                    <div style="background: rgba(15, 23, 42, 0.6); padding: 12px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08);">
                        <div style="font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Retrofit Score</div>
                        <div style="font-size: 20px; font-weight: 700; color: ${avgRetrofit !== 'N/A' && avgRetrofit > 60 ? '#ef4444' : avgRetrofit !== 'N/A' && avgRetrofit < 30 ? '#10b981' : '#f59e0b'}">${avgRetrofit}</div>
                        <div style="font-size: 9px; color: #64748b;">average</div>
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Priority Distribution</div>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
                        ${priorities.map((priority) => `
                            <div style="text-align: center; padding: 8px 4px; background: rgba(15, 23, 42, 0.4); border-radius: 4px; border: 1px solid ${COLORS[priority]}20;">
                                <div style="color: ${COLORS[priority]}; font-weight: 700; font-size: 14px; margin-bottom: 2px;">${priorityCount[priority]}</div>
                                <div style="color: #64748b; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;">${priority.substring(0, 4)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${topTypes.length > 0 ? `
                    <div>
                        <div style="font-size: 11px; font-weight: 600; color: #cbd5e1; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Top Property Types</div>
                        <div style="background: rgba(15, 23, 42, 0.4); border-radius: 6px; padding: 8px;">
                            ${topTypes.map(([type, count], index) => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; ${index < topTypes.length - 1 ? 'border-bottom: 1px solid rgba(255,255,255,0.05);' : ''}">
                                    <span style="font-size: 11px; color: #e2e8f0;">${escapeHtml(type.length > 18 ? `${type.substring(0, 18)}...` : type)}</span>
                                    <span style="font-weight: 700; color: #60a5fa; font-size: 12px; background: rgba(96, 165, 250, 0.15); padding: 2px 6px; border-radius: 3px;">${count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    if (window.currentInsightsPopup) {
        window.currentInsightsPopup.remove();
        window.currentInsightsPopup = null;
    }

    const overlay = document.createElement('div');
    overlay.innerHTML = insightsHTML;
    overlay.style.position = 'absolute';
    overlay.style.top = '50%';
    overlay.style.left = window.innerWidth <= 768 ? '50%' : '35%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'auto';
    overlay.style.maxWidth = 'calc(100vw - 24px)';

    mapContainer.appendChild(overlay);

    window.currentInsightsPopup = {
        remove: () => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        },
        isOpen: () => overlay && overlay.parentNode
    };

    setTimeout(makePopupDraggable, 200);
    setTimeout(() => {
        if (window.currentInsightsPopup && window.currentInsightsPopup.isOpen()) {
            window.currentInsightsPopup.remove();
        }
    }, 15000);
}

function closeInsightsPopup() {
    if (window.currentInsightsPopup) {
        window.currentInsightsPopup.remove();
        window.currentInsightsPopup = null;
    }
}

window.closeInsightsPopup = closeInsightsPopup;

function makePopupDraggable() {
    const popup = document.getElementById('insights-popup');
    const header = document.getElementById('insights-header');
    if (!popup || !header) return;

    const overlay = popup.parentElement;
    if (!overlay) return;

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let elementStartX = 0;
    let elementStartY = 0;

    const handleDrag = (event) => {
        if (!isDragging) return;

        event.preventDefault();
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;
        const mapRect = mapContainer.getBoundingClientRect();
        const popupWidth = overlay.offsetWidth;
        const popupHeight = overlay.offsetHeight;
        const padding = 10;
        const newLeft = Math.max(mapRect.left + padding, Math.min(elementStartX + deltaX, mapRect.right - popupWidth - padding));
        const newTop = Math.max(mapRect.top + padding, Math.min(elementStartY + deltaY, mapRect.bottom - popupHeight - padding));

        overlay.style.left = `${newLeft}px`;
        overlay.style.top = `${newTop}px`;
    };

    const stopDrag = () => {
        isDragging = false;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
        header.style.cursor = 'move';
    };

    header.addEventListener('mousedown', (event) => {
        isDragging = true;
        const rect = overlay.getBoundingClientRect();
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        elementStartX = rect.left;
        elementStartY = rect.top;
        overlay.style.transform = 'none';
        overlay.style.left = `${elementStartX}px`;
        overlay.style.top = `${elementStartY}px`;
        header.style.cursor = 'grabbing';
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', stopDrag);
        event.preventDefault();
    });
}
