import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpdater, validateManifest } from '../src/core/updater.js';

test('validates the update manifest', () => {
  assert.deepEqual(validateManifest({ version: ' B2 ' }), { version: 'B2' });
  assert.throws(() => validateManifest({}), /versión válida/);
});

test('update check does not download the bundle when current', async () => {
  const urls = [];
  const fetcher = async url => { urls.push(url); return { ok: true, text: async () => '{"version":"B1"}' }; };
  const logs = { info() {}, success() {}, warning() {} };
  const update = createUpdater({ config: { version: 'B1', prefix: 'careerEditor.', updateManifestUrl: 'manifest', updateScriptUrl: 'script' }, runtime: {}, logger: logs, errorHandler: { capture(error) { throw error; } }, getApi: () => ({}), globalObject: {}, fetcher });
  assert.deepEqual(await update(), { current: 'B1', latest: 'B1', available: false });
  assert.equal(urls.length, 1);
  assert.match(urls[0], /^manifest\?t=\d+$/);
});
