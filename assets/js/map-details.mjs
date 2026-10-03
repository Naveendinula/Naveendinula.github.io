import { toNumber, escapeHtml, buildingStats } from './map-data.mjs';

export const PRIORITY_COLORS = { Critical: '#b64742', High: '#a56821', Medium: '#487e72', Low: '#718099', Minimal: '#91a393', default: '#78878a' };

const metric = (value, digits = 0) => {
  const number = toNumber(value);
  return number === null ? 'N/A' : number.toLocaleString('en-US', { maximumFractionDigits: digits });
};

export function renderBuildingDetail(building, year = new Date().getFullYear()) {
  const built = toNumber(building.year_built);
  const rows = [
    ['Property type', building.primary_property_type || 'N/A'],
    ['Community', building.community_area || 'N/A'],
    ['Building age', built ? `${year - built} years` : 'N/A'],
    ['Chicago Energy Rating', metric(building.chicago_energy_rating)],
    ['Site EUI', `${metric(building.site_eui_kbtu_sq_ft, 1)} kBtu/sq ft`],
    ['GHG intensity', `${metric(building.ghg_intensity_kg_co2e_sq_ft, 2)} kg/sq ft`]
  ];
  return `<div class="detail-header"><span class="eyebrow">Selected building</span><button type="button" class="icon-button" data-popup-close aria-label="Close building details">×</button></div>
    <span class="priority-badge" style="--priority-color:${PRIORITY_COLORS[building.retrofit_priority] || PRIORITY_COLORS.default}">${escapeHtml(building.retrofit_priority || 'Unknown')} priority</span>
    <h2>${escapeHtml(building.property_name || 'Building')}</h2><p class="address">${escapeHtml(building.address || 'Address unavailable')}</p>
    <div class="metric-pair"><div><strong>${metric(building.retrofit_score)}</strong><span>Retrofit score / 100</span></div><div><strong>${metric(building.energy_star_score)}</strong><span>ENERGY STAR / 100</span></div></div>
    ${building.needs_retrofit ? '<p class="small muted">Flagged for retrofit in the source data.</p>' : ''}
    <details><summary>Building details</summary><dl class="stat-list">${rows.map(([name, value]) => `<div><dt>${name}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl></details>`;
}

export function renderFilterInsights(rows, total) {
  const stats = buildingStats(rows);
  const types = new Map();
  rows.forEach(row => { const type = row.primary_property_type || 'Unknown'; types.set(type, (types.get(type) || 0) + 1); });
  const topTypes = [...types].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const priorities = ['Critical', 'High', 'Medium', 'Low', 'Minimal'];
  return `<p>${total ? (rows.length / total * 100).toFixed(1) : '0.0'}% of ${total.toLocaleString()} buildings in this selection.</p>
    <div class="insight-metrics"><div>Avg. retrofit score<strong>${stats.averageRetrofit === null ? 'N/A' : stats.averageRetrofit.toFixed(1)}</strong></div><div>Avg. ENERGY STAR<strong>${stats.averageEnergy === null ? 'N/A' : stats.averageEnergy.toFixed(1)}</strong></div></div>
    <dl class="stat-list">${priorities.map(priority => `<div><dt>${priority}</dt><dd>${rows.filter(row => row.retrofit_priority === priority).length.toLocaleString()}</dd></div>`).join('')}</dl>
    ${topTypes.length ? `<ul class="insight-types">${topTypes.map(([type, count]) => `<li>${escapeHtml(type)} · ${count.toLocaleString()}</li>`).join('')}</ul>` : '<p>No buildings match these filters.</p>'}`;
}
