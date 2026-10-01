import test from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../assets/js/map-data.mjs';
const { toNumber } = data;

test('missing metrics remain missing instead of becoming zero', () => {
  for (const value of [null, undefined, '', ' ', false, true, NaN, Infinity]) {
    assert.equal(toNumber(value), null, `unexpected conversion of ${String(value)}`);
  }
  assert.equal(toNumber('0'), 0);
  assert.equal(toNumber('42.5'), 42.5);
});

const records = [
  { id: 'a', latitude: 41.9, longitude: -87.7, retrofit_priority: 'Critical', needs_retrofit: 1, energy_star_score: null, retrofit_score: 90, primary_property_type: 'Office' },
  { id: 'b', latitude: '41.8', longitude: '-87.6', retrofit_priority: 'High', needs_retrofit: 'true', energy_star_score: 40, retrofit_score: 65, primary_property_type: 'School' },
  { id: 'c', latitude: null, longitude: null, retrofit_priority: 'Low', needs_retrofit: '0', energy_star_score: 80, retrofit_score: 20, primary_property_type: 'Office' },
  { id: 'd', latitude: 999, longitude: -87.6, retrofit_priority: 'Minimal', needs_retrofit: false, energy_star_score: null, retrofit_score: 0 }
];

test('normalizes numeric and string retrofit flags without treating false strings as true', () => {
  const normalized = data.normalizeBuildings(records);
  assert.deepEqual(normalized.map(row => row.needs_retrofit), [true, true, false, false]);
  assert.equal(normalized[1].latitude, 41.8);
  assert.equal(normalized[0].energy_star_score, null);
});

test('invalid or missing coordinates never create a marker at zero', () => {
  const features = data.buildFeatureCollection(data.normalizeBuildings(records)).features;
  assert.deepEqual(features.map(feature => feature.id), ['a', 'b']);
  assert.deepEqual(features[1].geometry.coordinates, [-87.6, 41.8]);
  assert.equal(data.validCoordinates({ latitude: '', longitude: '' }), false);
  assert.equal(data.validCoordinates({ latitude: 41.8, longitude: -181 }), false);
});

test('missing energy scores remain visible until a score filter is applied', () => {
  const rows = data.normalizeBuildings(records);
  assert.equal(data.filterBuildings(rows, {}).length, 4);
  assert.deepEqual(data.filterBuildings(rows, { energyMin: 1, energyMax: 100 }).map(row => row.id), ['b', 'c']);
  assert.deepEqual(data.filterBuildings(rows, { priority: 'Critical' }).map(row => row.id), ['a']);
});

test('candidate and property filters combine and an empty result stays empty', () => {
  const rows = data.normalizeBuildings(records);
  assert.deepEqual(data.filterBuildings(rows, { candidates: true, propertyType: 'School' }).map(row => row.id), ['b']);
  assert.deepEqual(data.filterBuildings(rows, { candidates: true, priority: 'Low' }), []);
});

test('statistics use the filtered selection and exclude missing scores', () => {
  const rows = data.normalizeBuildings(records);
  assert.deepEqual(data.buildingStats(rows.slice(0, 2)), { total: 2, mapped: 2, critical: 1, high: 1, needsRetrofit: 2, averageEnergy: 40, averageRetrofit: 77.5 });
  assert.equal(data.buildingStats([rows[0]]).averageEnergy, null);
  assert.equal(data.buildingStats([]).total, 0);
  assert.equal(data.buildingStats([]).averageEnergy, null);
});

test('feature data stays compact and keeps the stable ID and priority', () => {
  const row = { ...data.normalizeBuildings(records)[0], raw_data: 'large original record' };
  const feature = data.buildFeatureCollection([row]).features[0];
  assert.equal(feature.properties.id, 'a');
  assert.equal(feature.properties.retrofit_priority, 'Critical');
  assert.equal(feature.properties.raw_data, undefined);
});

test('bounds include all polygon rings and handle empty selections', () => {
  assert.deepEqual(data.geometryBounds({ type: 'Polygon', coordinates: [[[1, 2], [3, 4], [1, 2]]] }), [[1, 2], [3, 4]]);
  assert.equal(data.geometryBounds({ type: 'FeatureCollection', features: [] }), null);
});

test('boundary IDs join numeric summary keys and preserve community labels', () => {
  const collection = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { area_numbe: '01', community: 'ROGERS PARK' }, geometry: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [1, 2]]] } }] };
  const prepared = data.prepareBoundaries(collection, 'community', new Map([['1', { retrofit_likely: 12 }]]));
  assert.equal(prepared.features[0].id, 'community-1');
  assert.equal(prepared.features[0].properties._key, '1');
  assert.equal(prepared.features[0].properties._label, 'ROGERS PARK');
  assert.equal(prepared.features[0].properties._retrofit, 12);
});
