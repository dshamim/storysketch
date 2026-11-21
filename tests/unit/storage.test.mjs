import test from 'node:test'; import assert from 'node:assert/strict';
import { createApp } from '../helpers/sandbox.mjs';
const { STORAGE, FILES } = await createApp({ plugins: false });

test('local disk is the default adapter', () => { assert.equal(STORAGE.currentId, 'local'); assert.equal(STORAGE.current, FILES); assert.equal(STORAGE.current.label, 'This computer'); });
test('an adapter must provide save, saveAs and open', () => {
  assert.throws(() => STORAGE.register({ id: 'x', save() {} }), /missing saveAs/); assert.throws(() => STORAGE.register({}), /needs an id/);
});
test('a minimal cloud-style adapter works: optional methods get safe defaults and the editor can switch to it', async () => {
  const saved = [];
  let title = null;
  STORAGE.register({ id: 'cloud', label: 'My account', supported: true, get name() { return title; },
    async save(text, n) { saved.push([n, text]); return n; }, async saveAs(text, n) { title = n; saved.push([n, text]); return n; }, async open() { return { text: '{}', name: 'a', commit: async () => {} }; } });
  assert.equal(STORAGE.currentId, 'local', 'registering does not switch by itself');
  STORAGE.use('cloud');
  assert.equal(await STORAGE.current.permission(), 'granted'); assert.equal(await STORAGE.current.peek(), null); assert.equal(await STORAGE.current.requestWrite(), true);
  await STORAGE.current.restoreHandle(); await STORAGE.current.forget();
  await STORAGE.current.saveAs('{"p":1}', 'Book'); assert.equal(STORAGE.current.name, 'Book', 'own getters stay live'); assert.deepEqual(saved[0], ['Book', '{"p":1}']);
  assert.throws(() => STORAGE.use('nope'), /no storage adapter/);
  STORAGE.use('local');
});
