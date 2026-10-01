export function toNumber(value) {
  if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);
}

export function normalizeBuildings(records) {
  if (!Array.isArray(records)) throw new Error('Building data must be an array.');
  return records.map(row => ({
    ...row,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    energy_star_score: toNumber(row.energy_star_score),
    retrofit_score: toNumber(row.retrofit_score),
    needs_retrofit: row.needs_retrofit === true || row.needs_retrofit === 1 || row.needs_retrofit === '1' || row.needs_retrofit === 'true'
  }));
}

export function validCoordinates(row) {
  const latitude = toNumber(row.latitude);
  const longitude = toNumber(row.longitude);
  return latitude !== null && longitude !== null && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}

export function filterBuildings(rows, filters = {}) {
  const minimum = toNumber(filters.energyMin);
  const maximum = toNumber(filters.energyMax);
  return rows.filter(row => {
    if (filters.candidates && !['Critical', 'High'].includes(row.retrofit_priority)) return false;
    if (filters.priority && row.retrofit_priority !== filters.priority) return false;
    if (filters.propertyType && row.primary_property_type !== filters.propertyType) return false;
    const score = toNumber(row.energy_star_score);
    if (minimum !== null && (score === null || score < minimum)) return false;
    if (maximum !== null && (score === null || score > maximum)) return false;
    return true;
  });
}

export function buildingStats(rows) {
  const average = field => {
    const values = rows.map(row => toNumber(row[field])).filter(value => value !== null);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  return {
    total: rows.length,
    mapped: rows.filter(validCoordinates).length,
    critical: rows.filter(row => row.retrofit_priority === 'Critical').length,
    high: rows.filter(row => row.retrofit_priority === 'High').length,
    needsRetrofit: rows.filter(row => row.needs_retrofit === true).length,
    averageEnergy: average('energy_star_score'),
    averageRetrofit: average('retrofit_score')
  };
}

export function buildFeatureCollection(rows) {
  return {
    type: 'FeatureCollection',
    features: rows.filter(validCoordinates).map(row => ({
      type: 'Feature', id: String(row.id),
      geometry: { type: 'Point', coordinates: [row.longitude, row.latitude] },
      properties: { id: String(row.id), retrofit_priority: row.retrofit_priority || 'Unknown' }
    }))
  };
}

export function geometryBounds(input) {
  let minimumX = Infinity, minimumY = Infinity, maximumX = -Infinity, maximumY = -Infinity;
  const walk = node => {
    if (!node) return;
    if (Array.isArray(node)) {
      if (typeof node[0] === 'number' && typeof node[1] === 'number') {
        if (!Number.isFinite(node[0]) || !Number.isFinite(node[1])) return;
        minimumX = Math.min(minimumX, node[0]); maximumX = Math.max(maximumX, node[0]);
        minimumY = Math.min(minimumY, node[1]); maximumY = Math.max(maximumY, node[1]);
      } else node.forEach(walk);
    } else if (node.features) node.features.forEach(walk);
    else if (node.geometry) walk(node.geometry);
    else if (node.geometries) node.geometries.forEach(walk);
    else if (node.coordinates) walk(node.coordinates);
  };
  walk(input);
  return Number.isFinite(minimumX) ? [[minimumX, minimumY], [maximumX, maximumY]] : null;
}

export function prepareBoundaries(collection, type, summary = new Map()) {
  return {
    type: 'FeatureCollection',
    features: (collection.features || []).map(feature => {
      const properties = feature.properties || {};
      const rawKey = type === 'ward' ? properties.ward ?? properties.WARD : properties.area_numbe ?? properties.area_num_1 ?? properties.COMMUNITY_AREA;
      const key = String(toNumber(rawKey) ?? rawKey ?? '');
      return {
        ...feature, id: `${type}-${key}`,
        properties: { ...properties, _key: key, _label: type === 'ward' ? `Ward ${key}` : properties.community || `Community ${key}`, _retrofit: summary.get(key)?.retrofit_likely ?? 0 }
      };
    })
  };
}
