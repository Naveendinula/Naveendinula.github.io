import { escapeHtml, geometryBounds, prepareBoundaries } from '../assets/js/map-data.mjs';
import { createMapEnvironment, addContextBuildings, fetchJson, showNotice, hideNotice, setupPanelToggle, mapPadding } from '../assets/js/map-runtime.mjs?v=20261003-ui3';
import { DATA_FILES, loadPermitData } from './data.js';
import {
  computeCumulativeRetrofitSeries,
  computeDataQualityMetrics,
  computeOverviewStats,
  computeProcessingLeaderboard,
  computeProcessingTimeline,
  computeProcessingTrend,
  computeProvenance,
  computeRetrofitPulseSeries,
  computeSummaryLeaders,
  detectProcessingOutliers,
  runSanityChecks
} from './analytics.js';
import {
  initCumulativeRetrofitsChart,
  initProcessingLeaderboardChart,
  initProcessingTimeTrendChart,
  initProcessingTimelineChart,
  initRetrofitPulseChart,
  initWardProcessingLeaderboardChart
} from './charts.js?v=20261003-ui3';

const GEOJSON_FILES = {
  ward: './assets/data/retrofit-v2/ward_boundaries.geojson',
  community: './assets/data/retrofit-v2/community_boundaries.geojson'
};


const state = {
  data: null,
  analytics: null,
  summaryHtml: {
    ward: '',
    community: ''
  },
  highlightKeys: {
    ward: [],
    community: []
  },
  currentTab: 'overview',
  isDrawerOpen: false,
  isResizing: false,
  startY: 0,
  startHeight: 0,
  map: null,
  environment: null,
  threeDEnabled: false,
  boundaryMode: 'ward',
  boundaryData: {
    ward: null,
    community: null
  },
  localPopup: null,
  selectedBoundary: null,
  selectedRegionKey: '42',
  hoveredBoundary: null,
  lib: null,
  dataError: null,
  hoverTooltip: null,
  pulsingAnimations: {
    ward: null,
    community: null
  }
};

const elements = {
  summaryWindow: document.getElementById('summary-window'),
  summaryHeader: document.getElementById('summary-header'),
  summaryTitle: document.getElementById('summary-title'),
  summaryContent: document.getElementById('summary-content'),
  summaryClose: document.querySelector('[data-action="summary-close"]'),
  wardToggle: document.getElementById('ward-toggle'),
  communityToggle: document.getElementById('community-toggle'),
  drawer: document.getElementById('bottom-drawer'),
  drawerHandle: document.getElementById('drawer-handle'),
  openDrawerButton: document.querySelector('[data-drawer-open]'),
  closeDrawerButton: document.querySelector('[data-drawer-close]'),
  tabButtons: Array.from(document.querySelectorAll('.tab-button')),
  tabContent: document.getElementById('tab-content'),
  featureCount: document.getElementById('feature-count'),
  loadingScreen: document.getElementById('loading'),
  projectTooltip: document.getElementById('project-tooltip'),
  projectTooltipCloseButtons: Array.from(document.querySelectorAll('[data-tooltip-close]'))
};

function formatNumber(value) {
  return Number.isFinite(value) ? value.toLocaleString() : '0';
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '0.0%';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function formatMonth(date) {
  if (!date) {
    return 'N/A';
  }
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

function formatRange(range) {
  if (!range) {
    return 'N/A';
  }
  return `${formatMonth(range.start)} - ${formatMonth(range.end)}`;
}

function initChartTooltips() {
  const infoIcons = document.querySelectorAll('.chart-info-icon');
  infoIcons.forEach((icon) => {
    icon.addEventListener('click', (event) => {
      event.stopPropagation();
      const tooltipId = `tooltip-${icon.dataset.tooltip}`;
      const tooltip = document.getElementById(tooltipId);
      if (tooltip) {
        // Close all other tooltips first
        document.querySelectorAll('.chart-tooltip.visible').forEach((t) => {
          if (t.id !== tooltipId) {
            t.classList.remove('visible');
          }
        });
        // Toggle this tooltip
        tooltip.classList.toggle('visible');
      }
    });
  });

  // Close tooltips when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.chart-info-icon') && !event.target.closest('.chart-tooltip')) {
      document.querySelectorAll('.chart-tooltip.visible').forEach((t) => {
        t.classList.remove('visible');
      });
    }
  });
}

function renderProvenanceBlock(provenance, warnings) {
  const sources = Object.values(DATA_FILES).join(', ');
  const warningMarkup = warnings.length
    ? `<div class="provenance-warning">
        <strong>⚠ Analytics checks (${warnings.length}):</strong>
        <ul style="margin: 4px 0 0 16px; padding: 0; list-style: disc;">${warnings.map((w) => `<li style="margin-bottom: 2px;">${w}</li>`).join('')}</ul>
       </div>`
    : '';

  return `
    <details class="provenance-card">
      <summary class="provenance-title">Data sources &amp; quality checks</summary>
      <div class="provenance-grid">
        <div class="provenance-item"><span>Sources</span><span>${sources}</span></div>
        <div class="provenance-item"><span>Records loaded</span><span>Wards: ${provenance.wardCount} | Communities: ${provenance.communityCount} | Weeks: ${provenance.weeklyCount} | Months: ${provenance.monthlyCount}</span></div>
        <div class="provenance-item"><span>Weekly range</span><span>${formatRange(provenance.weeklyRange)}</span></div>
        <div class="provenance-item"><span>Monthly range</span><span>${formatRange(provenance.monthlyRange)}</span></div>
      </div>
      ${warningMarkup}
    </details>
  `;
}

function buildLeaderRow(prefix, leader, showRate) {
  const percentOfPermits = leader.permits > 0 ? leader.retrofitLikely / leader.permits : 0;
  const rateText = showRate
    ? `${formatPercent(leader.retrofitRate)} (${formatNumber(leader.retrofitLikely)} / ${formatNumber(leader.permits)})`
    : `${formatNumber(leader.retrofitLikely)} hits (${formatPercent(percentOfPermits)} of ${formatNumber(leader.permits)} permits)`;
  const topCategory = leader.topCategory && leader.topCategory.label ? leader.topCategory.label : 'None';

  return `
    <div class="summary-item">
      <strong>${prefix} ${leader.key}:</strong> ${rateText} - top cat: <span class="category">${topCategory}</span>
    </div>
  `;
}

function renderSummaryHtml(typeLabel, leaders) {
  const activityRows = leaders.activityLeaders.map((leader) => buildLeaderRow(typeLabel, leader, false)).join('');
  const rateRows = leaders.rateLeaders.map((leader) => buildLeaderRow(typeLabel, leader, true)).join('');

  return `
    <div class="summary-section">
      <h4>Leaders by retrofit activity (count):</h4>
      ${activityRows || '<div class="summary-item">No activity data available.</div>'}
    </div>
    <div class="summary-section">
      <h4>Leaders by retrofit rate (min 50 permits):</h4>
      ${rateRows || '<div class="summary-item">No rate data available.</div>'}
    </div>
  `;
}
function typewriterEffect(element, htmlContent, speed = 30) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  element.innerHTML = '';
  const textSegments = [];

  function processNode(node, parentElement) {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (text.trim()) {
          const textNode = document.createTextNode('');
          parentElement.appendChild(textNode);
          textSegments.push({
            textNode,
            fullText: text,
            currentIndex: 0
          });
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const clonedElement = child.cloneNode(false);
        parentElement.appendChild(clonedElement);
        processNode(child, clonedElement);
      }
    });
  }

  processNode(tempDiv, element);

  let segmentIndex = 0;

  function typeNextChar() {
    if (segmentIndex >= textSegments.length) {
      return;
    }

    const currentSegment = textSegments[segmentIndex];
    const char = currentSegment.fullText[currentSegment.currentIndex];

    if (currentSegment.currentIndex < currentSegment.fullText.length) {
      currentSegment.textNode.textContent += char;
      currentSegment.currentIndex += 1;
      setTimeout(typeNextChar, speed);
    } else {
      segmentIndex += 1;
      setTimeout(typeNextChar, speed);
    }
  }

  typeNextChar();
}

function showSummaryWindow(type) {
  if (!elements.summaryWindow) {
    return;
  }

  const summaryHtml = state.summaryHtml[type];
  elements.summaryTitle.textContent = type === 'ward' ? 'Ward Summary' : 'Community Summary';
  elements.summaryWindow.classList.add('visible');
  elements.summaryContent.innerHTML = summaryHtml || 'Permit summaries are unavailable until analytics load.';
}

function closeSummaryWindow() {
  if (elements.summaryWindow) {
    elements.summaryWindow.classList.remove('visible');
  }
}

function showProjectTooltip() {
  if (!elements.projectTooltip) {
    return;
  }
  elements.projectTooltip.classList.add('visible');
}

function hideProjectTooltip() {
  if (!elements.projectTooltip) {
    return;
  }
  elements.projectTooltip.classList.remove('visible');
}

function initSummaryWindowDrag() {
  if (!elements.summaryWindow || !elements.summaryHeader) {
    return;
  }

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const handleDrag = (event) => {
    if (!isDragging) {
      return;
    }

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    const newLeft = Math.max(0, Math.min(window.innerWidth - elements.summaryWindow.offsetWidth, startLeft + deltaX));
    const newTop = Math.max(0, Math.min(window.innerHeight - elements.summaryWindow.offsetHeight, startTop + deltaY));

    elements.summaryWindow.style.left = `${newLeft}px`;
    elements.summaryWindow.style.top = `${newTop}px`;
  };

  const stopDrag = () => {
    isDragging = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  };

  elements.summaryHeader.addEventListener('mousedown', (event) => {
    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;

    const rect = elements.summaryWindow.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    elements.summaryWindow.style.transform = 'none';
    elements.summaryWindow.style.left = `${startLeft}px`;
    elements.summaryWindow.style.top = `${startTop}px`;

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);

    event.preventDefault();
  });
}

function getAnalyticsData(feature, boundaryType) {
  if (!state.data) {
    return { error: 'Analytics data not loaded.' };
  }

  const props = feature.properties || {};
  let key = '';
  let data = null;

  if (boundaryType === 'Ward') {
    key = props._key || props.WARD || props.ward_num || props.ward || props.WARD_NUM || props.name || props.AREA_SHORT;
    data = state.data.wardSummary.get(String(key));
  } else {
    key = props._key || props.area_numbe || props.area_num_1 || props.AREA_SHORT || props.AREA_S_CD ||
      props.community || props.COMMUNITY_AREA || props.name || props.OBJECTID;
    data = state.data.communitySummary.get(String(key));
  }

  if (!data) {
    return {
      error: `No data found for ${boundaryType} ${key}`,
      key
    };
  }

  return {
    key,
    permits: data.permits || 0,
    scoreSum: data.score_sum || 0,
    retrofitLikely: data.retrofit_likely || 0,
    heatPump: data.heat_pump || 0,
    insulation: data.insulation || 0,
    blower: data.blower || 0,
    ductwork: data.ductwork || 0,
    elecUpgrade: data.elec_upg || 0,
    hvac: data.hvac || 0,
    lighting: data.lighting || 0,
    envelope: data.envelope || 0
  };
}

function createPopupContent(feature, boundaryType) {
  const data = getAnalyticsData(feature, boundaryType);
  const props = feature.properties || {};
  const name = props._label || props.name || props.AREA_NAME || props.ward_name ||
    props.community_name || `${boundaryType} ${data.key}`;

  let content = `<h3>${escapeHtml(name)}</h3>`;

  if (data.error) {
    content += `<div class="loading">${escapeHtml(data.error)}</div>`;
    return content;
  }

  const safePercent = (num, den) => den > 0 ? Math.round((num / den) * 100) : 0;
  const retrofitRate = safePercent(data.retrofitLikely, data.permits);

  content += '<div class="stat-grid">';
  [
    { label: 'Permits', value: formatNumber(data.permits) },
    { label: 'Retrofit Likely', value: formatNumber(data.retrofitLikely) },
    { label: 'Retrofit Rate', value: `${retrofitRate}%` },
    { label: 'Score Sum', value: formatNumber(data.scoreSum) },
    { label: 'Per-Permit Score', value: data.permits > 0 ? (data.scoreSum / data.permits).toFixed(1) : '0' }
  ].forEach((metric) => {
    content += `<div class="stat-card"><div class="stat-label">${metric.label}</div><div class="stat-value">${metric.value}</div></div>`;
  });
  content += '</div>';

  content += `
    <div class="progress-wrapper">
      <div class="progress-head"><span>Retrofit Rate</span><span class="progress-head-val">${retrofitRate}%</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${retrofitRate}%;"></div></div>
    </div>
  `;

  const categories = [
    { label: 'Heat Pump', value: data.heatPump },
    { label: 'Insulation', value: data.insulation },
    { label: 'HVAC', value: data.hvac },
    { label: 'Elec Upgrade', value: data.elecUpgrade },
    { label: 'Ductwork', value: data.ductwork },
    { label: 'Lighting', value: data.lighting },
    { label: 'Envelope', value: data.envelope }
  ];

  const nonZeroCats = categories.filter((category) => category.value > 0).sort((a, b) => b.value - a.value);
  content += '<hr class="divider" />';
  content += `
    <details class="popup-details">
      <summary>
        <div class="summary-label"><span class="section-title">Activity Categories</span></div>
        <div class="summary-chevron">&#x25BE;</div>
      </summary>
      <div class="popup-details-content">
  `;

  if (nonZeroCats.length === 0) {
    content += '<div class="empty-msg">No category activity recorded.</div>';
  } else {
    content += '<div class="category-chips">';
    nonZeroCats.slice(0, 7).forEach((category) => {
      content += `<div class="chip"><span>${category.label}</span><span class="chip-count">${formatNumber(category.value)}</span></div>`;
    });
    content += '</div>';
  }

  const totalCat = nonZeroCats.reduce((acc, category) => acc + category.value, 0);
  content += '<div style="margin-top:8px;">';
  content += '<div class="section-title" style="margin-top:4px;">Category Distribution</div>';
  if (totalCat === 0) {
    content += '<div class="empty-msg">No distribution to display.</div>';
  } else {
    content += '<div class="mini-bars">';
    nonZeroCats.forEach((category) => {
      const pct = safePercent(category.value, totalCat);
      content += `
        <div class="mini-row">
          <span class="mini-label">${category.label}</span>
          <div class="mini-bar"><div class="mini-fill" style="width:${pct}%;"></div></div>
          <span class="mini-val">${pct}%</span>
        </div>`;
    });
    content += '</div>';
  }
  content += '</div></div></details>';

  return content;
}
function updateBoundaryVisibility() {
  if (!state.map) return;
  for (const type of ['ward', 'community']) {
    for (const suffix of ['fill', 'outline', 'leaders']) {
      const id = `${type}-${suffix}`;
      if (state.map.getLayer(id)) state.map.setLayoutProperty(id, 'visibility', state.boundaryMode === type ? 'visible' : 'none');
    }
  }
}

function showBoundaryType(type) {
  state.boundaryMode = type;
  for (const [name, toggle] of [['ward', elements.wardToggle], ['community', elements.communityToggle]]) {
    toggle?.classList.toggle('active', name === type);
    toggle?.setAttribute('aria-pressed', String(name === type));
  }
  state.localPopup?.remove();
  state.hoverTooltip?.remove();
  stopPulsingAnimation(type === 'ward' ? 'community' : 'ward');
  updateBoundaryVisibility();
  showSummaryWindow(type);
  state.selectedRegionKey = type === 'ward' ? '42' : '32';
  selectRegion(state.selectedRegionKey, false);
  fitBoundaryData();
}

function hideBoundaryType(type) {
  if (state.boundaryMode === type) state.boundaryMode = null;
  const toggle = type === 'ward' ? elements.wardToggle : elements.communityToggle;
  toggle?.classList.remove('active');
  toggle?.setAttribute('aria-pressed', 'false');
  state.localPopup?.remove();
  state.hoverTooltip?.remove();
  updateBoundaryVisibility();
  closeSummaryWindow();
  stopPulsingAnimation(type);
}

function updateHighlightLayer(type) {
  if (state.map?.getLayer(`${type}-leaders`)) state.map.setFilter(`${type}-leaders`, ['in', ['get', '_key'], ['literal', (state.highlightKeys[type] || []).map(String)]]);
}

function startPulsingAnimation(type) {
  // Keep geographic highlights steady in Civic Atlas.
  stopPulsingAnimation(type);
}

function stopPulsingAnimation(type) {
  if (state.pulsingAnimations[type]) cancelAnimationFrame(state.pulsingAnimations[type]);
  state.pulsingAnimations[type] = null;
}

function restoreBoundaryLayers(map) {
  addContextBuildings(map, state.threeDEnabled);
  for (const type of ['ward', 'community']) {
    const data = state.boundaryData[type];
    if (!data || map.getSource(`${type}-boundaries`)) continue;
    const color = '#2c6096';
    const before = map.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
    map.addSource(`${type}-boundaries`, { type: 'geojson', data });
    map.addLayer({ id: `${type}-fill`, type: 'fill', source: `${type}-boundaries`, paint: { 'fill-color': ['interpolate', ['linear'], ['get', '_retrofit'], 0, '#dde8f2', 350, '#a2bed6', 1400, color], 'fill-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.8, ['boolean', ['feature-state', 'hover'], false], 0.65, 0.45] } }, before);
    map.addLayer({ id: `${type}-outline`, type: 'line', source: `${type}-boundaries`, paint: { 'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], color, '#8ba7bf'], 'line-opacity': 0.85, 'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.5, ['boolean', ['feature-state', 'hover'], false], 2, 0.7] } }, before);
    map.addLayer({ id: `${type}-leaders`, type: 'line', source: `${type}-boundaries`, filter: ['in', ['get', '_key'], ['literal', (state.highlightKeys[type] || []).map(String)]], paint: { 'line-color': color, 'line-width': 1.1, 'line-opacity': 0.5 } });
  }
  if (state.selectedBoundary && map.getSource(`${state.selectedBoundary.type}-boundaries`)) map.setFeatureState({ source: `${state.selectedBoundary.type}-boundaries`, id: state.selectedBoundary.id }, { selected: true });
  updateBoundaryVisibility();
  if (state.boundaryMode) startPulsingAnimation(state.boundaryMode);
}

function updateRegionInspector() {
  const type = state.boundaryMode || 'ward';
  const summary = type === 'ward' ? state.data?.wardSummary : state.data?.communitySummary;
  const features = state.boundaryData[type]?.features || [];
  const labels = new Map(features.map(feature => [feature.properties._key, feature.properties._label]));
  const select = document.getElementById('region-select');
  const keys = summary ? [...summary.keys()].filter(key => Number(key) > 0) : [...labels.keys()];
  keys.sort((a, b) => type === 'ward' ? Number(a) - Number(b) : (labels.get(a) || a).localeCompare(labels.get(b) || b));
  select.replaceChildren(new Option('Citywide overview', ''));
  keys.forEach(key => select.add(new Option(labels.get(key) || `${type === 'ward' ? 'Ward' : 'Community'} ${key}`, key)));
  select.value = state.selectedRegionKey;
  const selected = summary?.get(state.selectedRegionKey);
  const values = summary && !state.selectedRegionKey ? [...summary.values()] : selected ? [selected] : null;
  const permits = values?.reduce((sum, row) => sum + row.permits, 0);
  const retrofits = values?.reduce((sum, row) => sum + row.retrofit_likely, 0);
  const name = state.selectedRegionKey ? labels.get(state.selectedRegionKey) || `${type === 'ward' ? 'Ward' : 'Community'} ${state.selectedRegionKey}` : 'Chicago';
  document.getElementById('region-label').textContent = `${name} · permits`;
  document.getElementById('region-permits').textContent = values ? formatNumber(permits) : '—';
  document.getElementById('region-retrofits').textContent = values ? formatNumber(retrofits) : '—';
  document.getElementById('region-rate').textContent = values ? formatPercent(permits ? retrofits / permits : 0) : '—';
  document.getElementById('permit-total').textContent = state.analytics ? formatNumber(state.analytics.overview.totalPermits) : '—';
  const leaders = summary ? computeSummaryLeaders(summary).activityLeaders.slice(0, 3) : [];
  const max = Math.max(1, ...leaders.map(row => row.retrofitLikely));
  document.getElementById('region-leaders').innerHTML = leaders.map(row => `<div class="leader-row"><button type="button" data-select-region="${escapeHtml(row.key)}">${escapeHtml(labels.get(String(row.key)) || `${type === 'ward' ? 'Ward' : 'Community'} ${row.key}`)}</button><div class="leader-track"><i style="width:${row.retrofitLikely / max * 100}%"></i></div><span class="leader-count">${formatNumber(row.retrofitLikely)}</span></div>`).join('');
}

function selectRegion(key, fit = true, popupCoordinate) {
  const type = state.boundaryMode || 'ward';
  state.selectedRegionKey = String(key);
  state.localPopup?.remove();
  const previous = state.selectedBoundary;
  if (previous && state.map?.getSource(`${previous.type}-boundaries`)) state.map.setFeatureState({ source: `${previous.type}-boundaries`, id: previous.id }, { selected: false });
  const feature = state.boundaryData[type]?.features.find(item => item.properties._key === state.selectedRegionKey);
  state.selectedBoundary = feature ? { type, id: feature.id } : null;
  if (feature && state.map?.getSource(`${type}-boundaries`)) state.map.setFeatureState({ source: `${type}-boundaries`, id: feature.id }, { selected: true });
  updateRegionInspector();
  if (!fit || !state.map) return;
  if (!feature) { fitBoundaryData(); return; }
  const bounds = geometryBounds(feature);
  if (bounds) state.map.fitBounds(bounds, { padding: mapPadding(document.querySelector('.map-layer-panel'), elements.drawer), maxZoom: 14, duration: 600 });
  if (popupCoordinate) state.localPopup = new state.lib.Popup({ offset: 12, maxWidth: '340px', className: 'region-popup' }).setLngLat(popupCoordinate).setHTML(createPopupContent(feature, type === 'ward' ? 'Ward' : 'Community')).addTo(state.map);
}

function fitBoundaryData(camera = {}) {
  const data = state.boundaryData[state.boundaryMode || 'ward'];
  const bounds = geometryBounds(data);
  if (bounds && state.map) state.map.fitBounds(bounds, { padding: mapPadding(document.querySelector('.map-layer-panel'), elements.drawer), maxZoom: 12, duration: 0, ...camera });
}

async function loadBoundaryData() {
  try {
    const [ward, community] = await Promise.all([fetchJson(GEOJSON_FILES.ward), fetchJson(GEOJSON_FILES.community)]);
    if (!geometryBounds(ward) || !geometryBounds(community)) throw new Error('Boundary data contains no usable coordinates.');
    state.boundaryData.ward = prepareBoundaries(ward, 'ward', state.data?.wardSummary);
    state.boundaryData.community = prepareBoundaries(community, 'community', state.data?.communitySummary);
    selectRegion(state.selectedRegionKey, false);
    state.environment?.refreshLayers();
    if (state.map) fitBoundaryData();
    hideNotice('boundary-notice');
  } catch (error) {
    showNotice('boundary-notice', `${error.message} Permit analytics remain accessible.`, loadBoundaryData);
  }
}

async function initMap() {
  if (state.map) return;
  try {
    const environment = await createMapEnvironment({ restoreLayers: restoreBoundaryLayers });
    state.environment = environment;
    state.map = environment.map;
    state.lib = environment.lib;
    const map = state.map;
    fitBoundaryData();
    const clearHover = () => {
      if (state.hoveredBoundary && map.getSource(`${state.hoveredBoundary.type}-boundaries`)) map.setFeatureState({ source: `${state.hoveredBoundary.type}-boundaries`, id: state.hoveredBoundary.id }, { hover: false });
      state.hoveredBoundary = null;
      state.hoverTooltip?.remove();
      state.hoverTooltip = null;
      map.getCanvas().style.cursor = '';
    };
    for (const type of ['ward', 'community']) {
      map.on('mousemove', `${type}-fill`, event => {
        const feature = event.features?.[0];
        if (!feature) return;
        if (state.hoveredBoundary?.id !== feature.id) {
          clearHover();
          state.hoveredBoundary = { type, id: feature.id };
          map.setFeatureState({ source: `${type}-boundaries`, id: feature.id }, { hover: true });
          state.hoverTooltip = new state.lib.Popup({ closeButton: false, closeOnClick: false, className: 'map-hover-label', offset: 12 }).setText(feature.properties._label).setLngLat(event.lngLat).addTo(map);
        } else state.hoverTooltip?.setLngLat(event.lngLat);
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', `${type}-fill`, clearHover);
      map.on('click', `${type}-fill`, event => {
        const feature = event.features?.[0];
        if (!feature) return;
        clearHover();
        selectRegion(feature.properties._key, true, event.lngLat);
      });
    }
    map.once('load', () => fitBoundaryData());
    hideNotice('map-initialization-notice');
  } catch (error) {
    showNotice('map-initialization-notice', `${error.message} Open the Analytics Panel to explore the data.`, initMap);
  }
}

function initDrawerResize() {
  if (!elements.drawer || !elements.drawerHandle) {
    return;
  }

  elements.drawerHandle.addEventListener('mousedown', (event) => {
    const clickStartTime = Date.now();
    const clickStartY = event.clientY;

    state.isResizing = true;
    state.startY = event.clientY;
    state.startHeight = elements.drawer.offsetHeight;

    const handleResize = (moveEvent) => {
      if (!state.isResizing) {
        return;
      }

      const deltaY = state.startY - moveEvent.clientY;
      const newHeight = state.startHeight + deltaY;
      const minHeight = 200;
      const maxHeight = window.innerHeight * 0.8;
      const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      elements.drawer.style.height = `${constrainedHeight}px`;

      if (state.isDrawerOpen && state.currentTab === 'overview') {
        setTimeout(() => {
          const pulseChart = echarts.getInstanceByDom(document.getElementById('retrofit-pulse-chart'));
          const leaderboardChart = echarts.getInstanceByDom(document.getElementById('processing-leaderboard-chart'));
          if (pulseChart) pulseChart.resize();
          if (leaderboardChart) leaderboardChart.resize();
        }, 50);
      }
    };

    const stopResize = (upEvent) => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);

      const clickDuration = Date.now() - clickStartTime;
      const clickMovement = Math.abs(upEvent.clientY - clickStartY);

      if (clickDuration < 200 && clickMovement < 5) {
        toggleDrawer();
      }

      state.isResizing = false;
    };

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    event.preventDefault();
  });
}

function toggleDrawer() {
  if (!elements.drawer) {
    return;
  }

  state.isDrawerOpen = !state.isDrawerOpen;
  if (state.isDrawerOpen) {
    elements.drawer.classList.add('open');
    updateDrawerContent();
  } else {
    elements.drawer.classList.remove('open');
  }
  updateMapControlOffset();
}

function openDrawer() {
  if (!elements.drawer || state.isDrawerOpen) {
    return;
  }

  elements.drawer.classList.add('open');
  state.isDrawerOpen = true;
  updateMapControlOffset();
  updateDrawerContent();
}

function closeDrawer() {
  if (!elements.drawer) {
    return;
  }

  elements.drawer.classList.remove('open');
  state.isDrawerOpen = false;
  updateMapControlOffset();
}

function updateMapControlOffset() {
  elements.drawer.inert = !state.isDrawerOpen;
  elements.openDrawerButton.setAttribute('aria-expanded', String(state.isDrawerOpen));
  document.body.style.setProperty('--analytics-height', state.isDrawerOpen ? `${elements.drawer.offsetHeight}px` : '0px');
}

function switchTab(tabId) {
  elements.tabButtons.forEach((button) => {
    button.classList.remove('active');
    button.removeAttribute('aria-current');
    button.classList.remove('border-blue-400', 'bg-blue-500/10', 'text-blue-300');
    button.classList.add('border-transparent');
  });

  const activeTab = elements.tabButtons.find((button) => button.dataset.tab === tabId);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-current', 'page');
    activeTab.classList.remove('border-transparent');
    activeTab.classList.add('border-blue-400', 'bg-blue-500/10', 'text-blue-300');
  }

  state.currentTab = tabId;
  updateDrawerContent();
}

function generateOverviewContent() {
  const { overview, provenance, warnings } = state.analytics;

  return `
    ${renderProvenanceBlock(provenance, warnings)}
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Permits</div>
        <div class="kpi-value">${formatNumber(overview.totalPermits)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ward Areas</div>
        <div class="kpi-value">${overview.totalWards}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Communities</div>
        <div class="kpi-value">${overview.totalCommunities}</div>
      </div>
    </div>
    <div class="charts-grid two-column" style="margin-bottom: 24px;">
      <div class="chart-container">
        <div class="chart-title">
          Retrofit Activity Pulse (Last 12 Months)
          <span class="chart-info-icon" data-tooltip="retrofit-pulse">ⓘ</span>
        </div>
        <div class="chart-tooltip" id="tooltip-retrofit-pulse">
          <strong>Analysis Insight:</strong> This stacked area chart visualizes weekly retrofit permit activity across six energy efficiency categories. The dark rolling average line smooths out weekly volatility to reveal underlying trends. <em>Look for:</em> seasonal patterns (often peaks in spring/fall), category dominance shifts, and whether the rolling average is trending up or down—indicating momentum in retrofit adoption across Chicago.
        </div>
        <div class="chart-content" id="retrofit-pulse-chart" style="height: 300px;"></div>
      </div>
      <div class="chart-container">
        <div class="chart-title">
          Permit Processing Time - Leaderboard by Ward
          <span class="chart-info-icon" data-tooltip="processing-leaderboard">ⓘ</span>
        </div>
        <div class="chart-tooltip" id="tooltip-processing-leaderboard">
          <strong>Analysis Insight:</strong> This bar chart ranks wards by median permit processing time. Green bars indicate wards faster than the city median; red bars are slower. Scatter points show permit volume—larger dots mean higher activity. <em>Key takeaway:</em> High-volume wards with fast processing indicate efficient permit offices, while slow high-volume wards may signal resource constraints or bottlenecks worth investigating.
        </div>
        <div class="chart-content" id="processing-leaderboard-chart" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

function generateTrendsContent() {
  const { provenance, warnings } = state.analytics;

  return `
    ${renderProvenanceBlock(provenance, warnings)}
    <div class="charts-grid two-column">
      <div class="chart-container">
        <div class="chart-title">
          Cumulative Retrofits Over Time
          <span class="chart-info-icon" data-tooltip="cumulative-retrofits">ⓘ</span>
        </div>
        <div class="chart-tooltip" id="tooltip-cumulative-retrofits">
          <strong>Analysis Insight:</strong> This line chart shows the cumulative growth of retrofit permits by category over time. Steeper slopes indicate periods of accelerated adoption. <em>Look for:</em> which categories are growing fastest (steepest lines), inflection points where growth accelerated or slowed, and relative market share between categories. Categories with flattening curves may indicate market saturation or policy changes.
        </div>
        <div class="chart-content" id="cumulative-retrofits-chart" style="height: 300px;"></div>
      </div>
      <div class="chart-container">
        <div class="chart-title">
          Median Permit Processing Time Over Time
          <span class="chart-info-icon" data-tooltip="processing-trend">ⓘ</span>
        </div>
        <div class="chart-tooltip" id="tooltip-processing-trend">
          <strong>Analysis Insight:</strong> This chart tracks citywide permit processing efficiency over time. The blue line shows city median, while dashed lines show fastest and slowest ward averages. <em>Key insights:</em> A narrowing gap between fast and slow wards suggests improving consistency; widening gaps indicate growing inequity. Upward trends may signal capacity issues, while downward trends reflect process improvements.
        </div>
        <div class="chart-content" id="processing-time-trend-chart" style="height: 300px;"></div>
      </div>
    </div>
  `;
}

function generateProcessingContent() {
  const { provenance, warnings } = state.analytics;

  return `
    ${renderProvenanceBlock(provenance, warnings)}
    <div class="charts-grid two-column">
      <div class="chart-container">
        <div class="chart-title">
          Ward Processing Leaderboard
          <span class="chart-info-icon" data-tooltip="ward-leaderboard">ⓘ</span>
        </div>
        <div class="chart-subtitle">Median permit processing time by ward (fastest - slowest)</div>
        <div class="chart-tooltip" id="tooltip-ward-leaderboard">
          <strong>Analysis Insight:</strong> This horizontal bar chart ranks all wards from fastest to slowest median processing time. The gradient coloring (green→red) highlights performance variance. The dashed blue line marks the city median. <em>Actionable insight:</em> Wards far below the median can serve as models for best practices; those significantly above may need additional resources or process review.
        </div>
        <div class="chart-content" id="ward-processing-leaderboard-chart" style="height: 400px;"></div>
      </div>
      <div class="chart-container">
        <div class="chart-title">
          Processing Time Timeline
          <span class="chart-info-icon" data-tooltip="processing-timeline">ⓘ</span>
        </div>
        <div class="chart-subtitle">Citywide median processing time trends with category breakdown</div>
        <div class="chart-tooltip" id="tooltip-processing-timeline">
          <strong>Analysis Insight:</strong> This multi-line chart shows how processing times vary by retrofit category over time. The bold blue line is the city median; dashed lines represent specific categories (Heat Pump, Insulation, etc.). <em>Look for:</em> categories consistently above the median may face more complex review processes; categories below the median may have streamlined approval paths. Diverging trends suggest category-specific bottlenecks.
        </div>
        <div class="chart-content" id="processing-timeline-chart" style="height: 400px;"></div>
      </div>
    </div>
  `;
}

function generateMethodologyContent() {
  const { dataQuality: dq, processingOutliers, provenance, warnings } = state.analytics;

  const outlierRows = processingOutliers.length
    ? processingOutliers.map((o) =>
      `<tr><td>${o.month}</td><td>${o.category}</td><td>${o.value} days</td></tr>`
    ).join('')
    : '<tr><td colspan="3">No outliers detected.</td></tr>';

  const warningList = warnings.length
    ? warnings.map((w) => `<li>${w}</li>`).join('')
    : '<li>No warnings.</li>';

  return `
    <div class="methodology-section">
      <h3 class="methodology-heading">Methodology &amp; Limitations</h3>
      <p class="methodology-text">
        This dashboard analyzes Chicago building permit records to identify energy retrofit activity.
        Permits are classified using a keyword-matching taxonomy applied to the <code>WORK_DESCRIPTION</code>
        field of each permit record. The analysis surfaces patterns in retrofit adoption, geographic
        distribution, and municipal processing efficiency.
      </p>

      <h4 class="methodology-subheading">Classification Approach</h4>
      <p class="methodology-text">
        Each permit's work description is matched against a curated taxonomy of
        <strong>13 retrofit categories</strong> containing 100+ industry-specific phrases (e.g., "mini-split",
        "aeroseal", "blower door", "VRF"). A permit is flagged <code>RETROFIT_LIKELY = True</code> if it
        matches any energy efficiency keyword.
      </p>
      <p class="methodology-text methodology-caveat">
        <strong>⚠ Negation limitation:</strong> The keyword classifier does not perform negation detection.
        Permit descriptions containing phrases like "NO HVAC WORK" may still be flagged as HVAC_GENERAL.
        This introduces false positives. A validation sample has not yet been conducted, so precision and
        recall metrics are unavailable. Interpret category counts as upper-bound estimates.
      </p>
      <p class="methodology-text methodology-caveat">
        <strong>⚠ New construction included:</strong> The permit dataset includes all permit types, including
        <code>PERMIT - NEW CONSTRUCTION</code>. These may inflate retrofit counts where new buildings include
        energy efficiency features. A future iteration should filter or segment by permit type.
      </p>

      <h4 class="methodology-subheading">Category Weights</h4>
      <p class="methodology-text">
        Each category is assigned a weight used to compute aggregate <code>score_sum</code> values per ward.
        Weights reflect the estimated energy-savings significance of each category based on typical
        building science impact:
      </p>
      <table class="methodology-table">
        <thead><tr><th>Category</th><th>Weight</th><th>Rationale</th></tr></thead>
        <tbody>
          <tr><td>Heat Pump</td><td>6</td><td>Highest decarbonization potential; full electrification of heating</td></tr>
          <tr><td>HP Water Heater</td><td>6</td><td>Major end-use electrification; high savings vs electric resistance</td></tr>
          <tr><td>Insulation</td><td>5</td><td>Envelope improvement directly reduces heating/cooling load</td></tr>
          <tr><td>Envelope</td><td>4</td><td>Windows, doors, weatherization reduce infiltration and conduction</td></tr>
          <tr><td>Blower Door</td><td>4</td><td>Diagnostic testing indicates comprehensive retrofit scope</td></tr>
          <tr><td>Controls/VFD</td><td>4</td><td>BAS and variable speed drives optimize existing systems</td></tr>
          <tr><td>HVAC General</td><td>3</td><td>Broad category; includes routine replacements alongside upgrades</td></tr>
          <tr><td>Ductwork</td><td>3</td><td>Duct sealing reduces distribution losses</td></tr>
          <tr><td>Duct Testing</td><td>3</td><td>Diagnostic testing, indicates performance verification</td></tr>
          <tr><td>Electrical Upgrade</td><td>3</td><td>Panel upgrades often prerequisite for electrification</td></tr>
          <tr><td>Lighting Retrofit</td><td>3</td><td>LED conversions; common but lower per-unit impact</td></tr>
        </tbody>
      </table>

      <h4 class="methodology-subheading">Electrification Analysis — November 2022 Cutoff</h4>
      <p class="methodology-text">
        The Electrification tab uses <strong>November 2022</strong> as a before/after comparison date.
        This aligns with the initial availability of <strong>Inflation Reduction Act (IRA)</strong> tax credits
        (signed August 2022, guidance issued late 2022) and Chicago's expanded energy efficiency incentive
        programs. This is an observational comparison, not a causal analysis — the increase may reflect
        multiple concurrent factors including market trends, supply chain recovery, and seasonal patterns.
        No statistical significance test is applied.
      </p>

      <h4 class="methodology-subheading">Processing Time Outliers</h4>
      <p class="methodology-text">
        Category-specific median processing times exceeding <strong>${formatNumber(180)} days</strong> are
        capped in timeline charts to prevent visual distortion from small-sample extremes.
        These outliers typically occur when a category has very few permits in a given month (1–2 records),
        making the "median" unreliable.
      </p>
      ${processingOutliers.length > 0 ? `
      <table class="methodology-table">
        <thead><tr><th>Month</th><th>Category</th><th>Raw Median</th></tr></thead>
        <tbody>${outlierRows}</tbody>
      </table>` : ''}

      <h4 class="methodology-subheading">Ward Normalization</h4>
      <p class="methodology-text">
        ${dq ? `Ward ${dq.maxWardKey} contains <strong>${formatNumber(dq.maxWardPermits)}</strong> permits — 
        <strong>${dq.dominanceRatio}x</strong> the ward average of ${formatNumber(dq.avgWardPermits)}.
        ` : ''}
        Raw permit counts should not be compared across wards without normalization.
        The <strong>retrofit rate</strong> (retrofit_likely / total permits) provides a volume-adjusted
        comparison. Leader rankings use a minimum threshold of 50 permits to avoid small-sample bias.
      </p>

      <h4 class="methodology-subheading">Data Quality Checks</h4>
      <ul class="methodology-list">
        ${warningList}
      </ul>

      <h4 class="methodology-subheading">Data Sources</h4>
      <p class="methodology-text">
        Permit records sourced from the <strong>City of Chicago Data Portal</strong> building permits dataset.
        Weekly and monthly aggregations are pre-computed from individual permit records.
        Geographic boundaries use official City of Chicago ward and community area shapefiles.
        ${provenance ? `Coverage: ${formatRange(provenance.weeklyRange)} (weekly), ${formatRange(provenance.monthlyRange)} (monthly).` : ''}
      </p>

      <h4 class="methodology-subheading">Known Limitations</h4>
      <ul class="methodology-list">
        <li>No negation handling in keyword classifier — false positive rate unknown</li>
        <li>New construction permits are not excluded from retrofit analysis</li>
        <li>Category weights are expert-estimated, not empirically validated</li>
        <li>No linkage to building-level energy outcomes (EUI, GHG intensity)</li>
        <li>Co-occurrence analysis does not control for project scope/size</li>
        <li>Processing time analysis covers Feb 2024–present; earlier data unavailable</li>
        <li>No per-capita or per-building normalization across wards</li>
      </ul>
    </div>
  `;
}

function updateDrawerContent() {
  if (!elements.tabContent) {
    return;
  }

  if (!state.analytics) {
    elements.tabContent.innerHTML = `<div class="loading">${state.dataError ? escapeHtml(state.dataError) + ' Use Retry above to reload analytics.' : 'Loading analytics...'}</div>`;
    return;
  }

  if (elements.featureCount) {
    elements.featureCount.textContent = `${formatNumber(state.analytics.overview.totalPermits)} permits`;
  }

  switch (state.currentTab) {
    case 'trends':
      elements.tabContent.innerHTML = generateTrendsContent();
      setTimeout(() => {
        initChartTooltips();
        initCumulativeRetrofitsChart(
          document.getElementById('cumulative-retrofits-chart'),
          state.analytics.cumulativeSeries
        );
        initProcessingTimeTrendChart(
          document.getElementById('processing-time-trend-chart'),
          state.analytics.processingTrend
        );
      }, 200);
      break;
    case 'processing':
      elements.tabContent.innerHTML = generateProcessingContent();
      setTimeout(() => {
        initChartTooltips();
        initWardProcessingLeaderboardChart(
          document.getElementById('ward-processing-leaderboard-chart'),
          state.analytics.processingLeaderboard
        );
        initProcessingTimelineChart(
          document.getElementById('processing-timeline-chart'),
          state.analytics.processingTimeline
        );
      }, 200);
      break;
    case 'methodology':
      elements.tabContent.innerHTML = generateMethodologyContent();
      break;
    case 'overview':
    default:
      elements.tabContent.innerHTML = generateOverviewContent();
      setTimeout(() => {
        initChartTooltips();
        initRetrofitPulseChart(
          document.getElementById('retrofit-pulse-chart'),
          state.analytics.retrofitPulse
        );
        initProcessingLeaderboardChart(
          document.getElementById('processing-leaderboard-chart'),
          state.analytics.processingLeaderboard
        );
      }, 200);
      break;
  }
}

function initEventHandlers() {
  if (elements.summaryClose) {
    elements.summaryClose.addEventListener('click', closeSummaryWindow);
  }

  if (elements.projectTooltipCloseButtons.length > 0) {
    elements.projectTooltipCloseButtons.forEach((button) => {
      button.addEventListener('click', hideProjectTooltip);
    });
  }

  if (elements.openDrawerButton) {
    elements.openDrawerButton.addEventListener('click', openDrawer);
  }

  if (elements.closeDrawerButton) {
    elements.closeDrawerButton.addEventListener('click', closeDrawer);
  }

  elements.tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      switchTab(button.dataset.tab);
    });
  });

  if (elements.wardToggle) {
    elements.wardToggle.addEventListener('click', () => {
      showBoundaryType('ward');
    });
  }

  if (elements.communityToggle) {
    elements.communityToggle.addEventListener('click', () => {
      showBoundaryType('community');
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideProjectTooltip();
    }
  });
}

async function loadData() {
  state.dataError = null;
  const data = await loadPermitData();
  const overview = computeOverviewStats(data.wardSummary, data.communitySummary);
  const wardLeaders = computeSummaryLeaders(data.wardSummary);
  const communityLeaders = computeSummaryLeaders(data.communitySummary);
  const dataQuality = computeDataQualityMetrics(data.wardSummary, data.communitySummary);
  const processingOutliers = detectProcessingOutliers(data.processingMonthly);

  const analytics = {
    overview,
    dataQuality,
    processingOutliers,
    retrofitPulse: computeRetrofitPulseSeries(data.retrofitWeekly),
    cumulativeSeries: computeCumulativeRetrofitSeries(data.retrofitWeekly),
    processingLeaderboard: computeProcessingLeaderboard(data.processingByWard, data.wardSummary),
    processingTrend: computeProcessingTrend(data.processingMonthly),
    processingTimeline: computeProcessingTimeline(data.processingMonthly),
    provenance: computeProvenance(data, overview)
  };

  analytics.warnings = runSanityChecks(data, analytics);

  state.data = data;
  hideNotice('analytics-notice');
  state.analytics = analytics;
  state.summaryHtml.ward = renderSummaryHtml('Ward', wardLeaders);
  state.summaryHtml.community = renderSummaryHtml('Community', communityLeaders);
  state.highlightKeys.ward = wardLeaders.highlightKeys;
  state.highlightKeys.community = communityLeaders.highlightKeys;
  for (const type of ['ward', 'community']) {
    if (!state.boundaryData[type]) continue;
    state.boundaryData[type] = prepareBoundaries(state.boundaryData[type], type, type === 'ward' ? data.wardSummary : data.communitySummary);
    state.map?.getSource(`${type}-boundaries`)?.setData(state.boundaryData[type]);
  }
  updateRegionInspector();

  updateHighlightLayer('ward');
  updateHighlightLayer('community');
  if (state.boundaryMode) showSummaryWindow(state.boundaryMode);

  if (state.isDrawerOpen) {
    updateDrawerContent();
  } else if (elements.featureCount) {
    elements.featureCount.textContent = `${formatNumber(overview.totalPermits)} permits`;
  }
}

async function reloadAnalytics() {
  try { await loadData(); }
  catch (error) {
    state.dataError = error.message;
    showNotice('analytics-notice', `${error.message} Analytics could not load.`, reloadAnalytics);
    if (elements.featureCount) elements.featureCount.textContent = 'Analytics unavailable';
    if (state.isDrawerOpen) updateDrawerContent();
  } finally {
    if (elements.loadingScreen) elements.loadingScreen.style.display = 'none';
  }
}

async function init() {
  setupPanelToggle(document.querySelector('.map-layer-panel'), document.getElementById('controls-toggle'));
  document.getElementById('toggle-3d').addEventListener('click', event => {
    state.threeDEnabled = !state.threeDEnabled;
    event.currentTarget.textContent = '3D buildings';
    event.currentTarget.setAttribute('aria-pressed', String(state.threeDEnabled));
    state.map?.easeTo({ pitch: state.threeDEnabled ? 45 : 0, bearing: 0 });
    if (state.map?.getLayer('context-buildings')) state.map.setLayoutProperty('context-buildings', 'visibility', state.threeDEnabled ? 'visible' : 'none');
  });
  document.getElementById('reset-view').addEventListener('click', () => {
    state.localPopup?.remove();
    fitBoundaryData({ pitch: state.threeDEnabled ? 30 : 0, bearing: 0, duration: 600 });
  });
  document.getElementById('region-select').addEventListener('change', event => selectRegion(event.target.value));
  document.getElementById('region-leaders').addEventListener('click', event => {
    const button = event.target.closest('[data-select-region]');
    if (button) selectRegion(button.dataset.selectRegion);
  });
  initDrawerResize();
  initEventHandlers();
  new ResizeObserver(() => {
    updateMapControlOffset();
    state.map?.resize();
    document.querySelectorAll('#tab-content [id$="-chart"]').forEach(element => {
      if (window.echarts) echarts.getInstanceByDom(element)?.resize();
    });
  }).observe(elements.drawer);
  void initMap();
  void loadBoundaryData();
  await reloadAnalytics();
}

init();
