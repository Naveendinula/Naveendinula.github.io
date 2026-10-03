import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBuildingDetail, renderFilterInsights } from '../assets/js/map-details.mjs';

test('filter insights include valid zero retrofit scores in the displayed average', () => {
  const rows = [{ retrofit_priority: 'Minimal', retrofit_score: 0, energy_star_score: 50 }, { retrofit_priority: 'Low', retrofit_score: 20, energy_star_score: 90 }];
  const html = renderFilterInsights(rows, 2);
  assert.match(html, /Avg\. retrofit score<strong>10\.0<\/strong>/);
  assert.match(html, /Avg\. ENERGY STAR<strong>70\.0<\/strong>/);
});

test('building detail preserves missing scores and escapes source text', () => {
  const html = renderBuildingDetail({ property_name: '<script>bad</script>', energy_star_score: null, retrofit_score: 0, year_built: null, chicago_energy_rating: 0 }, 2026);
  assert.match(html, /<strong>0<\/strong><span>Retrofit score/);
  assert.match(html, /<strong>N\/A<\/strong><span>ENERGY STAR/);
  assert.match(html, /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.match(html, /Chicago Energy Rating<\/dt><dd>0<\/dd>/);
});

test('empty filtered selections display no invented scores', () => {
  const html = renderFilterInsights([], 3852);
  assert.match(html, /No buildings match/);
  assert.match(html, /Avg\. retrofit score<strong>N\/A/);
});

test('selection insights retain the count for every priority, including zero counts', () => {
  const html = renderFilterInsights([{ retrofit_priority: 'Low' }, { retrofit_priority: 'Minimal' }, { retrofit_priority: 'Low' }], 3);
  assert.match(html, /Low<\/dt><dd>2<\/dd>/);
  assert.match(html, /Minimal<\/dt><dd>1<\/dd>/);
  assert.match(html, /Critical<\/dt><dd>0<\/dd>/);
});
