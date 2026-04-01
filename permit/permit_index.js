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
} from './charts.js';

const MAPBOX_TOKEN = window.MAPBOX_TOKEN;

mapboxgl.accessToken = MAPBOX_TOKEN;

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
  hoveredWardId: null,
  hoveredCommunityId: null,
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
    <div class="provenance-card">
      <div class="provenance-title">Data provenance</div>
      <div class="provenance-grid">
        <div class="provenance-item"><span>Sources</span><span>${sources}</span></div>
        <div class="provenance-item"><span>Records loaded</span><span>Wards: ${provenance.wardCount} | Communities: ${provenance.communityCount} | Weeks: ${provenance.weeklyCount} | Months: ${provenance.monthlyCount}</span></div>
        <div class="provenance-item"><span>Weekly range</span><span>${formatRange(provenance.weeklyRange)}</span></div>
        <div class="provenance-item"><span>Monthly range</span><span>${formatRange(provenance.monthlyRange)}</span></div>
      </div>
      ${warningMarkup}
    </div>
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
  typewriterEffect(elements.summaryContent, summaryHtml, 2);
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
    key = props.WARD || props.ward_num || props.ward || props.WARD_NUM || props.name || props.AREA_SHORT;
    data = state.data.wardSummary.get(String(key));
  } else {
    key = props.area_numbe || props.area_num_1 || props.AREA_SHORT || props.AREA_S_CD ||
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
  const name = props.name || props.AREA_NAME || props.ward_name ||
    props.community_name || `${boundaryType} ${data.key}`;

  let content = `<h3>${name}</h3>`;

  if (data.error) {
    content += `<div class="loading">${data.error}</div>`;
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
function updateHighlightLayer(type) {
  if (!state.map) {
    return;
  }

  const layerId = type === 'ward' ? 'highlighted-wards-line' : 'highlighted-communities-line';
  const property = type === 'ward' ? 'ward' : 'area_num_1';
  const keys = state.highlightKeys[type] || [];

  if (!state.map.getLayer(layerId)) {
    return;
  }

  state.map.setPaintProperty(layerId, 'line-opacity', [
    'case',
    ['in', ['get', property], ['literal', keys]],
    0.8,
    0
  ]);
  state.map.setPaintProperty(layerId, 'line-width', [
    'case',
    ['in', ['get', property], ['literal', keys]],
    4,
    0
  ]);
}

function startPulsingAnimation(type) {
  if (!state.map) {
    return;
  }

  const layerId = type === 'ward' ? 'highlighted-wards-line' : 'highlighted-communities-line';
  const property = type === 'ward' ? 'ward' : 'area_num_1';
  const highlightKeys = state.highlightKeys[type];

  if (!highlightKeys.length) {
    return;
  }

  let pulseDirection = 1;
  let opacity = 0.8;
  let width = 4;

  const animate = () => {
    opacity += pulseDirection * 0.03;
    if (opacity >= 1.0) {
      opacity = 1.0;
      pulseDirection = -1;
    } else if (opacity <= 0.3) {
      opacity = 0.3;
      pulseDirection = 1;
    }

    width = 3 + ((opacity - 0.3) * (6 - 3)) / (1.0 - 0.3);

    if (state.map.getLayer(layerId)) {
      state.map.setPaintProperty(layerId, 'line-opacity', [
        'case',
        ['in', ['get', property], ['literal', highlightKeys]],
        opacity,
        0
      ]);
      state.map.setPaintProperty(layerId, 'line-width', [
        'case',
        ['in', ['get', property], ['literal', highlightKeys]],
        width,
        0
      ]);
    }

    state.pulsingAnimations[type] = requestAnimationFrame(animate);
  };

  animate();
}

function stopPulsingAnimation(type) {
  if (state.pulsingAnimations[type]) {
    cancelAnimationFrame(state.pulsingAnimations[type]);
    state.pulsingAnimations[type] = null;
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
}

function openDrawer() {
  if (!elements.drawer || state.isDrawerOpen) {
    return;
  }

  elements.drawer.classList.add('open');
  state.isDrawerOpen = true;
  updateDrawerContent();
}

function closeDrawer() {
  if (!elements.drawer) {
    return;
  }

  elements.drawer.classList.remove('open');
  state.isDrawerOpen = false;
}

function switchTab(tabId) {
  elements.tabButtons.forEach((button) => {
    button.classList.remove('active');
    button.classList.remove('border-blue-400', 'bg-blue-500/10', 'text-blue-300');
    button.classList.add('border-transparent');
  });

  const activeTab = elements.tabButtons.find((button) => button.dataset.tab === tabId);
  if (activeTab) {
    activeTab.classList.add('active');
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
          <strong>Analysis Insight:</strong> This stacked area chart visualizes weekly retrofit permit activity across six energy efficiency categories. The white rolling average line smooths out weekly volatility to reveal underlying trends. <em>Look for:</em> seasonal patterns (often peaks in spring/fall), category dominance shifts, and whether the rolling average is trending up or down—indicating momentum in retrofit adoption across Chicago.
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
    elements.tabContent.innerHTML = '<div class="loading">Loading analytics...</div>';
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

function initMap(dataReady) {
  state.map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: [-87.6298, 41.8781],
    zoom: 10,
    pitch: 0,
    bearing: 0
  });

  state.map.addControl(new mapboxgl.NavigationControl());
  state.map.addControl(new mapboxgl.FullscreenControl());

  state.map.on('load', async () => {
    await dataReady;

    try {
      const testResponse = await fetch(GEOJSON_FILES.ward);
      if (!testResponse.ok) {
        console.error('Ward boundaries GeoJSON file not found or inaccessible:', testResponse.status);
      }
    } catch (error) {
      console.error('Error testing ward boundaries GeoJSON accessibility:', error);
    }

    state.map.addSource('ward-boundaries', {
      type: 'geojson',
      data: GEOJSON_FILES.ward,
      generateId: true
    });

    state.map.addLayer({
      id: 'ward-boundaries-fill',
      type: 'fill',
      source: 'ward-boundaries',
      layout: { visibility: 'visible' },
      paint: {
        'fill-color': '#088',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.8,
          0.3
        ]
      }
    });

    state.map.addLayer({
      id: 'ward-boundaries-line',
      type: 'line',
      source: 'ward-boundaries',
      layout: { visibility: 'visible' },
      paint: {
        'line-color': '#088',
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          3,
          2
        ],
        'line-opacity': 0.8
      }
    });

    state.map.addLayer({
      id: 'highlighted-wards-line',
      type: 'line',
      source: 'ward-boundaries',
      layout: { visibility: 'visible' },
      paint: {
        'line-color': '#ff6b35',
        'line-width': 4,
        'line-opacity': 0
      }
    });

    state.map.addSource('community-boundaries', {
      type: 'geojson',
      data: GEOJSON_FILES.community
    });

    state.map.addLayer({
      id: 'community-boundaries-fill',
      type: 'fill',
      source: 'community-boundaries',
      layout: { visibility: 'none' },
      paint: {
        'fill-color': '#800',
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          0.8,
          0.3
        ]
      }
    });

    state.map.addLayer({
      id: 'community-boundaries-line',
      type: 'line',
      source: 'community-boundaries',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#800',
        'line-width': [
          'case',
          ['boolean', ['feature-state', 'hover'], false],
          3,
          2
        ],
        'line-opacity': 0.8
      }
    });

    state.map.addLayer({
      id: 'highlighted-communities-line',
      type: 'line',
      source: 'community-boundaries',
      layout: { visibility: 'none' },
      paint: {
        'line-color': '#e74c3c',
        'line-width': 4,
        'line-opacity': 0
      }
    });

    updateHighlightLayer('ward');
    updateHighlightLayer('community');

    if (elements.wardToggle) {
      elements.wardToggle.classList.add('active');
    }

    setTimeout(() => {
      showSummaryWindow('ward');
      startPulsingAnimation('ward');
    }, 500);

    if (elements.loadingScreen) {
      setTimeout(() => {
        elements.loadingScreen.classList.add('fade-out');
        setTimeout(() => {
          elements.loadingScreen.style.display = 'none';
        }, 500);
      }, 1000);
    }

    const tooltipDelay = elements.loadingScreen ? 1700 : 300;
    setTimeout(() => {
      showProjectTooltip();
    }, tooltipDelay);
  });

  state.map.on('mousemove', 'ward-boundaries-fill', (event) => {
    if (event.features.length > 0) {
      if (state.hoveredWardId !== null) {
        state.map.setFeatureState({ source: 'ward-boundaries', id: state.hoveredWardId }, { hover: false });
      }
      state.hoveredWardId = event.features[0].id;
      state.map.setFeatureState({ source: 'ward-boundaries', id: state.hoveredWardId }, { hover: true });

      const feature = event.features[0];
      const wardNumber = feature.properties.WARD || feature.properties.ward_num ||
        feature.properties.ward || feature.properties.WARD_NUM ||
        feature.properties.name || feature.properties.AREA_SHORT || 'Unknown';

      if (state.hoverTooltip) {
        state.hoverTooltip.remove();
      }

      state.hoverTooltip = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'hover-tooltip'
      })
        .setLngLat(event.lngLat)
        .setHTML(`<div style="padding: 4px 8px; font-size: 12px; font-weight: bold;">Ward ${wardNumber}</div>`)
        .addTo(state.map);
    }
    state.map.getCanvas().style.cursor = 'pointer';
  });

  state.map.on('mouseleave', 'ward-boundaries-fill', () => {
    if (state.hoveredWardId !== null) {
      state.map.setFeatureState({ source: 'ward-boundaries', id: state.hoveredWardId }, { hover: false });
    }
    state.hoveredWardId = null;
    state.map.getCanvas().style.cursor = '';
    if (state.hoverTooltip) {
      state.hoverTooltip.remove();
      state.hoverTooltip = null;
    }
  });

  state.map.on('mousemove', 'community-boundaries-fill', (event) => {
    if (event.features.length > 0) {
      if (state.hoveredCommunityId !== null) {
        state.map.setFeatureState({ source: 'community-boundaries', id: state.hoveredCommunityId }, { hover: false });
      }
      state.hoveredCommunityId = event.features[0].id;
      state.map.setFeatureState({ source: 'community-boundaries', id: state.hoveredCommunityId }, { hover: true });

      const feature = event.features[0];
      const communityName = feature.properties.community || feature.properties.name || 'Community';

      if (state.hoverTooltip) {
        state.hoverTooltip.remove();
      }

      state.hoverTooltip = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'hover-tooltip'
      })
        .setLngLat(event.lngLat)
        .setHTML(`<div style="padding: 4px 8px; font-size: 12px; font-weight: bold;">${communityName}</div>`)
        .addTo(state.map);
    }
    state.map.getCanvas().style.cursor = 'pointer';
  });

  state.map.on('mouseleave', 'community-boundaries-fill', () => {
    if (state.hoveredCommunityId !== null) {
      state.map.setFeatureState({ source: 'community-boundaries', id: state.hoveredCommunityId }, { hover: false });
    }
    state.hoveredCommunityId = null;
    state.map.getCanvas().style.cursor = '';
    if (state.hoverTooltip) {
      state.hoverTooltip.remove();
      state.hoverTooltip = null;
    }
  });

  state.map.on('click', 'ward-boundaries-fill', (event) => {
    const feature = event.features[0];
    const content = createPopupContent(feature, 'Ward');

    const coordinates = feature.geometry.coordinates;
    const bounds = new mapboxgl.LngLatBounds();

    if (feature.geometry.type === 'Polygon') {
      coordinates[0].forEach((coord) => bounds.extend(coord));
    } else if (feature.geometry.type === 'MultiPolygon') {
      coordinates.forEach((polygon) => {
        polygon[0].forEach((coord) => bounds.extend(coord));
      });
    }

    state.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
      duration: 1000
    });

    setTimeout(() => {
      new mapboxgl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(content)
        .addTo(state.map);
    }, 200);
  });

  state.map.on('click', 'community-boundaries-fill', (event) => {
    const feature = event.features[0];
    const content = createPopupContent(feature, 'Community');

    const coordinates = feature.geometry.coordinates;
    const bounds = new mapboxgl.LngLatBounds();

    if (feature.geometry.type === 'Polygon') {
      coordinates[0].forEach((coord) => bounds.extend(coord));
    } else if (feature.geometry.type === 'MultiPolygon') {
      coordinates.forEach((polygon) => {
        polygon[0].forEach((coord) => bounds.extend(coord));
      });
    }

    state.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14,
      duration: 1000
    });

    setTimeout(() => {
      new mapboxgl.Popup()
        .setLngLat(event.lngLat)
        .setHTML(content)
        .addTo(state.map);
    }, 200);
  });

  state.map.on('error', (event) => {
    console.error('Map error:', event);
  });
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
      if (!state.map) {
        return;
      }
      const isActive = elements.wardToggle.classList.contains('active');
      if (isActive) {
        state.map.setLayoutProperty('ward-boundaries-fill', 'visibility', 'none');
        state.map.setLayoutProperty('ward-boundaries-line', 'visibility', 'none');
        state.map.setLayoutProperty('highlighted-wards-line', 'visibility', 'none');
        elements.wardToggle.classList.remove('active');
        closeSummaryWindow();
        stopPulsingAnimation('ward');
      } else {
        state.map.setLayoutProperty('community-boundaries-fill', 'visibility', 'none');
        state.map.setLayoutProperty('community-boundaries-line', 'visibility', 'none');
        state.map.setLayoutProperty('highlighted-communities-line', 'visibility', 'none');
        elements.communityToggle.classList.remove('active');
        stopPulsingAnimation('community');

        state.map.setLayoutProperty('ward-boundaries-fill', 'visibility', 'visible');
        state.map.setLayoutProperty('ward-boundaries-line', 'visibility', 'visible');
        state.map.setLayoutProperty('highlighted-wards-line', 'visibility', 'visible');
        elements.wardToggle.classList.add('active');

        showSummaryWindow('ward');
        startPulsingAnimation('ward');
      }
    });
  }

  if (elements.communityToggle) {
    elements.communityToggle.addEventListener('click', () => {
      if (!state.map) {
        return;
      }
      const isActive = elements.communityToggle.classList.contains('active');
      if (isActive) {
        state.map.setLayoutProperty('community-boundaries-fill', 'visibility', 'none');
        state.map.setLayoutProperty('community-boundaries-line', 'visibility', 'none');
        state.map.setLayoutProperty('highlighted-communities-line', 'visibility', 'none');
        elements.communityToggle.classList.remove('active');
        closeSummaryWindow();
        stopPulsingAnimation('community');
      } else {
        state.map.setLayoutProperty('ward-boundaries-fill', 'visibility', 'none');
        state.map.setLayoutProperty('ward-boundaries-line', 'visibility', 'none');
        state.map.setLayoutProperty('highlighted-wards-line', 'visibility', 'none');
        elements.wardToggle.classList.remove('active');
        stopPulsingAnimation('ward');

        state.map.setLayoutProperty('community-boundaries-fill', 'visibility', 'visible');
        state.map.setLayoutProperty('community-boundaries-line', 'visibility', 'visible');
        state.map.setLayoutProperty('highlighted-communities-line', 'visibility', 'visible');
        elements.communityToggle.classList.add('active');

        showSummaryWindow('community');
        startPulsingAnimation('community');
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideProjectTooltip();
    }
  });
}

async function loadData() {
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
  state.analytics = analytics;
  state.summaryHtml.ward = renderSummaryHtml('Ward', wardLeaders);
  state.summaryHtml.community = renderSummaryHtml('Community', communityLeaders);
  state.highlightKeys.ward = wardLeaders.highlightKeys;
  state.highlightKeys.community = communityLeaders.highlightKeys;

  updateHighlightLayer('ward');
  updateHighlightLayer('community');

  if (state.isDrawerOpen) {
    updateDrawerContent();
  } else if (elements.featureCount) {
    elements.featureCount.textContent = `${formatNumber(overview.totalPermits)} permits`;
  }
}

async function init() {
  const dataReady = loadData().catch((error) => {
    console.error('Error loading permit data:', error);
  });

  initSummaryWindowDrag();
  initDrawerResize();
  initEventHandlers();
  initMap(dataReady);

  await dataReady;
}

init();
