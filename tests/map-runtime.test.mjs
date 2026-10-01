import test from 'node:test';
import assert from 'node:assert/strict';

test('map requests finish with a timeout instead of leaving loading screens stuck', async () => {
  const { withTimeout } = await import('../assets/js/map-runtime.mjs');
  await assert.rejects(withTimeout(new Promise(() => {}), 10, 'Unavailable'), /Unavailable/);
  assert.equal(await withTimeout(Promise.resolve('ready'), 100), 'ready');
});

test('local JSON is parsed and malformed data reports an error', async () => {
  const { fetchJson } = await import('../assets/js/map-runtime.mjs');
  assert.deepEqual(await fetchJson('data:application/json,%7B%22ready%22%3Atrue%7D'), { ready: true });
  await assert.rejects(fetchJson('data:application/json,not-json'));
});
