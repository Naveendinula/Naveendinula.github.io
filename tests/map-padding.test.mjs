import test from 'node:test';
import assert from 'node:assert/strict';
import * as runtime from '../assets/js/map-runtime.mjs';

const map = { left: 0, right: 1200, top: 64, bottom: 800, width: 1200, height: 736 };

test('a floating left inspector reserves camera space on the left, not the right', () => {
  assert.equal(typeof runtime.calculateMapPadding, 'function');
  const padding = runtime.calculateMapPadding(map, [{ edge: 'left', rect: { left: 24, right: 310, top: 88, bottom: 460 } }]);
  assert.ok(padding.left >= 326);
  assert.ok(padding.right < padding.left);
});

test('a docked inspector outside the map does not shrink its camera area', () => {
  assert.equal(typeof runtime.calculateMapPadding, 'function');
  const rect = { ...map, left: 300, width: 900 };
  assert.deepEqual(runtime.calculateMapPadding(rect, [{ edge: 'left', rect: { left: 0, right: 300, top: 64, bottom: 800 } }]), runtime.calculateMapPadding(rect, []));
});

test('mobile sheets and drawers leave a usable camera area even on short screens', () => {
  assert.equal(typeof runtime.calculateMapPadding, 'function');
  const rect = { left: 0, right: 390, top: 64, bottom: 640, width: 390, height: 576 };
  const padding = runtime.calculateMapPadding(rect, [{ edge: 'bottom', rect: { left: 12, right: 378, top: 210, bottom: 580 } }]);
  assert.ok(padding.bottom >= 300);
  assert.ok(rect.height - padding.top - padding.bottom >= 100);
  assert.ok(rect.width - padding.left - padding.right >= 120);
});
