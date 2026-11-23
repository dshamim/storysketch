// tools/check_props.mjs: the guide's worked example passes, and each rule it enforces actually catches the mistake it is for.
import test from 'node:test'; import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process'; import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { ROOT } from '../helpers/sandbox.mjs';

const EXAMPLE = path.join(ROOT, 'tests/fixtures/example-prop.js'); const SRC = fs.readFileSync(EXAMPLE, 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'propcheck-')); let n = 0;
const check = (file) => spawnSync('node', [path.join(ROOT, 'tools/check_props.mjs'), '--file', file], { encoding: 'utf8', cwd: ROOT });
const variant = (from, to) => { assert.ok(SRC.includes(from), 'fixture changed: ' + from); const f = path.join(tmp, `v${n++}.js`); fs.writeFileSync(f, SRC.replace(from, to)); return check(f); };
const fails = (r, re) => { assert.equal(r.status, 1, r.stdout + r.stderr); assert.match(r.stdout, re); };

test('the worked example from the guide passes the checker (so the guide cannot go stale)', () => { const r = check(EXAMPLE); assert.equal(r.status, 0, r.stdout + r.stderr); assert.match(r.stdout, /0 problem/); });
test('the older airport and classroom props pass the basic checks', () => { const r = spawnSync('node', [path.join(ROOT, 'tools/check_props.mjs')], { encoding: 'utf8', cwd: ROOT }); assert.equal(r.status, 0, r.stdout); });
test('a misspelt colour slot is caught (it would silently draw nothing)', () => fails(variant("stroke: 'cushion', w: 3", "stroke: 'cushon', w: 3"), /cushon.*not a declared slot/));
test('randomness other than the seeded one is refused, even when it is only in the code', () => fails(variant('const rng = U.rng(U.hash(item.id));', 'const rng = () => Math.random();'), /Math\.random/));
test('a prop that draws differently each time is caught', () => fails(variant('const rng = U.rng(U.hash(item.id));', 'globalThis.__n = (globalThis.__n || 0) + 1; const rng = () => globalThis.__n * 0.01;'), /differently each time/));
test('an id without a prefix, missing tags, a missing line slot and an unknown category are caught', () => {
  fails(variant("id: 'example-bench'", "id: 'bench'"), /must be lowercase-kebab with a prefix`?|prefix/);
  fails(variant("tags: ['seat', 'park bench', 'garden'],", ''), /needs tags/);
  fails(variant("colors: { line: '#8a5a33', cushion: '#1e88e5' }", "colors: { wood: '#8a5a33', cushion: '#1e88e5' }"), /"line" slot/);
  fails(variant("cat: 'Furniture'", "cat: 'Stuff'"), /not one of/);
});
test('a floor prop that does not stand on y=0, one that is too big for the page, and one with NaN are caught', () => {
  fails(variant("p.line([[s * 105, -74], [s * 112, 0]], o)", "p.line([[s * 105, -74], [s * 112, 80]], o)"), /stands on y=0/);
  fails(variant("const d = { stroke: 'line', w: 3 };", "const d = { stroke: 'line', w: 3 }; p.line([[-700, -10], [700, -10]], d);"), /must fit a 1000 x 750 page/);
  fails(variant("const d = { stroke: 'line', w: 3 };", "const d = { stroke: 'line', w: 3 }; p.line([[0, NaN], [10, -10]], d);"), /NaN/);
});
test('line widths, shape counts and forbidden names are enforced', () => {
  fails(variant("const d = { stroke: 'line', w: 3 };", "const d = { stroke: 'line', w: 30 };"), /line width 30/);
  fails(variant("const d = { stroke: 'line', w: 3 };", "const d = { stroke: 'line', w: 3 }; for (let i = 0; i < 100; i++) p.line([[0, -i], [5, -i]], d);"), /shapes with/);
  fails(variant("const d = { stroke: 'line', w: 3 };", "const d = { stroke: 'line', w: 3 }; fetch('x');"), /"fetch"/);
});
test('a param without a default and a slot with nothing to hold are caught; the word "window" in a comment is fine', () => {
  fails(variant("{ key: 'cushion', label: 'Cushion', type: 'toggle', def: false }", "{ key: 'cushion', label: 'Cushion', type: 'toggle' }"), /no def/);
  fails(variant("params: [", "slots: [{ key: 'art', label: 'Picture', kind: 'nothing-like-this', def: 'none', box: [-10, -10, 20, 20] }], params: ["), /no add-on has that kind/);
  const r = variant('// the seat:', '// a window and fetch in a comment are fine\n      // the seat:'); assert.equal(r.status, 0, r.stdout);
});
test('--sheet writes one contact sheet per drawing style', () => {
  const dir = path.join(tmp, 'sheet'); const r = spawnSync('node', [path.join(ROOT, 'tools/check_props.mjs'), '--file', EXAMPLE, '--sheet', dir], { encoding: 'utf8', cwd: ROOT }); assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['props-chalk.svg', 'props-clean.svg', 'props-crayon.svg', 'props-ink.svg', 'props-marker.svg']); assert.ok(fs.readFileSync(path.join(dir, 'props-crayon.svg'), 'utf8').includes('example-bench'));
});
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
