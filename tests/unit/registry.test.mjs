import test from 'node:test'; import assert from 'node:assert/strict';
import { createApp } from '../helpers/sandbox.mjs';

test('loads the whole plugin set through the real manifest with no problems', async () => {
  const { CP, errors } = await createApp();
  assert.deepEqual(errors, []); assert.deepEqual([...CP.warnings], []); assert.deepEqual([...CP.skipped], []);
  const by = {}; for (const r of CP.loaded) by[r.type] = (by[r.type] || 0) + 1;
  for (const t of ['style', 'hair', 'clothes', 'accessory', 'addon', 'prop', 'pose', 'template', 'character']) assert.ok(by[t] > 0, `no ${t} plugins loaded`);
});
test('every loaded plugin declares api and a version', async () => {
  const { CP } = await createApp();
  for (const r of CP.loaded) { assert.equal(r.api, 1, `${r.type}:${r.id}`); assert.ok(r.version, `${r.type}:${r.id} has no version`); }
});
test('plugins for another API version are skipped with a reason, never converted', async () => {
  const { CP } = await createApp({ plugins: false });
  CP.register({ api: 2, type: 'hair', id: 'future', name: 'Future', draw() {} });
  CP.register({ type: 'hair', id: 'noapi', name: 'No api', draw() {} });
  assert.ok(!CP.hair.future && !CP.hair.noapi);
  assert.equal(CP.skipped.length, 2); assert.match(CP.skipped[0].reason, /newer than this tool/); assert.match(CP.skipped[1].reason, /no "api"/);
});
test('a plugin with the same id replaces the earlier one', async () => {
  const { CP } = await createApp({ plugins: false });
  CP.register({ api: 1, type: 'hair', id: 'x', name: 'First', draw() {} });
  CP.register({ api: 1, type: 'hair', id: 'x', name: 'Second', draw() {} });
  assert.equal(CP.hair.x.name, 'Second'); assert.equal(CP.loaded.filter((r) => r.id === 'x').length, 1);
});
test('a malformed plugin is reported and the rest still load', async () => {
  const { CP } = await createApp({ plugins: false });
  CP.register({ api: 1, type: 'accessory', id: 'bad', name: 'Bad', slot: 'nowhere', draw() {} });
  CP.register({ api: 1, type: 'style', id: 'nostyle', name: 'No render' });
  CP.register({ api: 1, type: 'hair', id: 'ok', name: 'Ok', draw() {} });
  assert.equal(CP.warnings.length, 2); assert.ok(CP.hair.ok); assert.ok(!CP.accessories.bad);
});
test('a plugin that throws while drawing is reported once and does not break drawing', async () => {
  const { CP, FIG, STORE } = await createApp();
  CP.register({ api: 1, type: 'hair', id: 'boom', name: 'Boom', draw() { throw new Error('nope'); } });
  const cast = STORE.normalizeCast({ id: 'c', name: 'C', hair: 'boom' });
  const inst = { pose: FIG.fromPreset(cast, CP.poses[0]), expr: 'happy', look: 0, detach: {} };
  assert.ok(FIG.prims(cast, inst).length > 0); FIG.prims(cast, inst);
  assert.equal(CP.warnings.filter((w) => /boom/.test(w)).length, 1);
});

// ---- asset sources: where plugins come from ----
test('a custom asset source can supply plugins (data and scripts) next to the local folder', async () => {
  const { CP } = await createApp({ plugins: false }); CP.setManifest({ files: [] });
  CP.addSource({
    id: 'gallery', label: 'Community gallery',
    list: async () => [{ path: 'characters/zed.json', text: JSON.stringify({ api: 1, version: '1.0.0', id: 'zed', name: 'Zed' }) }, { path: 'hair/zig.js' }],
    script: async (path) => { CP.register({ api: 1, version: '1.0.0', type: 'hair', id: 'zig', name: 'Zigzag', draw() {} }); return true; },
  });
  await CP.load();
  assert.ok(CP.characters.some((c) => c.id === 'zed')); assert.ok(CP.hair.zig); assert.deepEqual([...CP.warnings], []);
  assert.equal(JSON.stringify(CP.sources.map((s) => s.id)), '["gallery","local"]');
});
test('a source that fails is reported and does not stop the others', async () => {
  const { CP } = await createApp({ plugins: false });
  CP.addSource({ id: 'down', label: 'Offline', list: async () => { throw new Error('network down'); }, script: async () => false });
  CP.addSource({ id: 'ok', label: 'Ok', list: async () => [{ path: 'characters/q.json', text: '{"api":1,"id":"q","name":"Q"}' }], script: async () => true });
  await CP.load(); assert.ok(CP.characters.some((c) => c.id === 'q')); assert.ok(CP.warnings.some((w) => /network down/.test(w)));
});
test('a data file with an invalid api or bad JSON is reported with its path', async () => {
  const { CP } = await createApp({ plugins: false });
  CP.addSource({ id: 's', label: 'S', list: async () => [{ path: 'characters/bad.json', text: '{nope' }, { path: 'poses/list.json', text: '[]' }], script: async () => true });
  await CP.load(); assert.equal(CP.warnings.filter((w) => /bad\.json|list\.json/.test(w)).length, 2);
});
