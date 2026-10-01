import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import * as runtime from '../assets/js/map-runtime.mjs';

test('late project data can install after style.load while tiles are still pending', () => {
  const map = new EventEmitter();
  map.isStyleLoaded = () => false;
  let data = [];
  let displayed = [];
  const lifecycle = runtime.createLayerLifecycle(map, () => { displayed = [...data]; });
  map.emit('style.load');
  data = ['ward-12'];
  lifecycle.refresh();
  assert.deepEqual(displayed, ['ward-12']);
  lifecycle.loading();
  data = ['ward-13'];
  lifecycle.refresh();
  assert.deepEqual(displayed, ['ward-12']);
  map.emit('style.load');
  assert.deepEqual(displayed, ['ward-13']);
});

test('pending sprites or TileJSON are not considered a ready basemap', () => {
  const map = { isStyleLoaded: () => false, areTilesLoaded: () => true };
  assert.equal(runtime.isBasemapReady(map), false);
  map.isStyleLoaded = () => true;
  assert.equal(runtime.isBasemapReady(map), true);
});
