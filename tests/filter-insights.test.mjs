import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toNumber, escapeHtml, buildingStats } from '../assets/js/map-data.mjs';

test('Filter Analysis includes valid zero retrofit scores in its displayed average', async () => {
  const source = await readFile(new URL('../assets/js/chicago-retrofit-main.js', import.meta.url), 'utf8');
  const renderer = source.slice(source.indexOf('function showFilterInsights('), source.indexOf('function closeInsightsPopup('));
  const rows = [{ retrofit_priority: 'Minimal', retrofit_score: 0, energy_star_score: 50 }, { retrofit_priority: 'Low', retrofit_score: 20, energy_star_score: 90 }];
  let displayed = '';
  // Minimal DOM fixture captures the real generated popup, without a browser or
  // a mocked arithmetic implementation.
  const document = { createElement: () => ({ innerHTML: '', style: {} }) };
  const mapContainer = { appendChild: element => { displayed = element.innerHTML; } };
  const render = new Function('buildingsData', 'toNumber', 'escapeHtml', 'COLORS', 'window', 'document', 'mapContainer', 'setTimeout', 'makePopupDraggable', 'buildingStats', `${renderer}; return showFilterInsights;`)(rows, toNumber, escapeHtml, {}, { innerWidth: 1280 }, document, mapContainer, () => {}, () => {}, buildingStats);
  render(rows, {});
  assert.match(displayed, /Retrofit Score<\/div>\s*<div[^>]*>10\.0<\/div>/);
});
