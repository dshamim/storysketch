import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: arrays made inside the vm have another Array prototype
import fs from 'node:fs'; import path from 'node:path';
import { createApp, ROOT } from '../helpers/sandbox.mjs';
const { RENDER, CP, U } = await createApp();
const scenes = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/scenes.json'), 'utf8'));
const ctx = (style, over = {}) => ({ mode: 'colour', paper: '#ffffff', seed: 's1', idp: 't', n: 0, style, ...over });
const STYLE_IDS = ['crayon', 'marker', 'ink', 'chalk'];

test('the four built-in styles are registered through the plugin system', () => {
  deepEqual(RENDER.styleList().map((s) => s.id).sort(), [...STYLE_IDS].sort());
  assert.equal(CP.loaded.filter((r) => r.type === 'style').length, 4);
  for (const s of RENDER.styleList()) { assert.ok(s.name); assert.equal(typeof s.render, 'function'); }
});
test('styles are listed in a fixed order with Crayon (the default) first', () => {
  deepEqual(RENDER.styleList().map((s) => s.id), ['crayon', 'marker', 'ink', 'chalk']);
});
test('style filter ids are unique across all styles', () => {
  const ids = [...RENDER.defs().matchAll(/<filter id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length); assert.ok(ids.length >= 3);
});
for (const id of STYLE_IDS) {
  test(`${id}: renders every fixture scene to well-formed, finite SVG`, () => {
    for (const [name, sc] of Object.entries(scenes)) {
      const svg = RENDER.render(sc.prims, ctx(id, { seed: sc.seed }));
      assert.ok(svg.length > 100, `${name} is empty`);
      assert.ok(!/NaN|undefined|Infinity/.test(svg), `${name} has a bad number`);
      // balanced tags (every <g> closed)
      assert.equal((svg.match(/<g[ >]/g) || []).length, (svg.match(/<\/g>/g) || []).length, `${name}: unbalanced <g>`);
    }
  });
  test(`${id}: same seed gives identical output, different seed differs`, () => {
    const p = scenes.shapes.prims;
    assert.equal(RENDER.render(p, ctx(id)), RENDER.render(p, ctx(id)));
    if (id !== 'ink' || true) assert.notEqual(RENDER.render(p, ctx(id, { seed: 'a' })), RENDER.render(p, ctx(id, { seed: 'b' })));
  });
  test(`${id}: paper fills stay crisp (layering still hides what is behind)`, () => {
    const prims = [{ pts: [[0, 0], [50, 0], [50, 50], [0, 50]], closed: true, smooth: false, stroke: '#000000', w: 4, fill: 'paper' }];
    assert.match(RENDER.render(prims, ctx(id, { paper: '#fafaf0' })), /fill="#fafaf0"/);
  });
  test(`${id}: grey mode produces no saturated colours`, () => {
    const prims = [{ pts: [[0, 0], [80, 40]], closed: false, smooth: false, stroke: '#e53935', w: 5, fill: null }];
    const svg = RENDER.render(prims, ctx(id, { mode: 'grey' }));
    assert.ok(!/#e53935/i.test(svg));
  });
}
test('an unknown or missing style falls back to clean vectors', () => {
  const p = scenes.shapes.prims;
  assert.equal(RENDER.render(p, ctx(null)), RENDER.clean(p, ctx(null)));
  assert.equal(RENDER.render(p, ctx('does-not-exist')), RENDER.clean(p, ctx(null)));
});
test('styles are visibly different from each other', () => {
  const outs = STYLE_IDS.map((id) => RENDER.render(scenes.shapes.prims, ctx(id)));
  assert.equal(new Set(outs).size, 4);
});
test('on a dark page dark line colours are drawn chalk-white (all styles), light page unchanged', () => {
  const prims = [{ pts: [[0, 0], [80, 40]], closed: false, smooth: false, stroke: '#222222', w: 5, fill: null }];
  for (const id of ['clean', ...STYLE_IDS]) {
    const dark = RENDER.render(prims, ctx(id === 'clean' ? null : id, { paper: '#2b3a35' }));
    assert.ok(!/#222222/i.test(dark), `${id}: dark line kept on dark page`);
    if (id === 'ink') continue; // ink pulls colours towards ink-blue on light pages only
    const light = RENDER.render(prims, ctx(id === 'clean' ? null : id));
    assert.ok(/#222222/i.test(light) || id === 'ink', `${id}: line colour should survive on a white page`);
  }
});
test('chalk suggests a dark page colour; others do not', () => {
  assert.ok(U.lum(RENDER.styles.chalk.defaultPaper) < 0.35);
  for (const id of ['crayon', 'marker', 'ink']) assert.equal(RENDER.styles[id].defaultPaper, undefined);
});
test('thumb() takes a style id and still accepts the old crayon:true spelling', () => {
  const p = scenes.shapes.prims;
  assert.match(RENDER.thumb(p, { style: 'marker' }), /<svg[^>]*>.*marker-edge/s);
  assert.equal(RENDER.thumb(p, { crayon: true, seed: 'x' }).replace(/t[a-z0-9]+h\d+/g, 'H'), RENDER.thumb(p, { style: 'crayon', seed: 'x' }).replace(/t[a-z0-9]+h\d+/g, 'H'));
  assert.ok(!/<defs>/.test(RENDER.thumb(p, {})));
});
