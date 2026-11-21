import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: arrays made inside the vm have another Array prototype

import { createApp } from '../helpers/sandbox.mjs';
const { U } = await createApp({ plugins: false });

test('rng is deterministic per seed and differs between seeds', () => {
  const a = U.rng(42), b = U.rng(42), c = U.rng(43);
  const xs = [a(), a(), a()], ys = [b(), b(), b()];
  deepEqual(xs, ys);
  assert.notEqual(JSON.stringify(xs), JSON.stringify([c(), c(), c()]));
  assert.ok(xs.every((v) => v >= 0 && v < 1));
});
test('hash is stable', () => { assert.equal(U.hash('abc'), U.hash('abc')); assert.notEqual(U.hash('abc'), U.hash('abd')); });
test('noise1 stays within [-1, 1] and is smooth', () => {
  const n = U.noise1(7); let prev = n(0);
  for (let x = 0.05; x < 40; x += 0.05) { const v = n(x); assert.ok(Math.abs(v) <= 1); assert.ok(Math.abs(v - prev) < 0.3); prev = v; }
});
test('vector helpers', () => {
  deepEqual(U.add([1, 2], [3, 4]), [4, 6]);
  assert.equal(U.len([3, 4]), 5);
  assert.equal(U.clamp(9, 0, 5), 5);
  const d = U.dir(90); assert.ok(Math.abs(d[0]) < 1e-9 && Math.abs(d[1] - 1) < 1e-9); // 90° = down (y grows downward)
});
test('colour helpers', () => {
  assert.equal(U.mix('#000000', '#ffffff', 0.5), '#808080');
  assert.ok(U.lum('#ffffff') > 0.99 && U.lum('#000000') < 0.01);
});
test('grey mode turns a colour into a grey, colour mode leaves it', () => {
  assert.equal(U.tone('#d6402f', 'colour'), '#d6402f');
  const g = U.tone('#d6402f', 'grey'); const [r, gg, b] = U.hex2rgb(g);
  assert.ok(Math.abs(r - gg) <= 3 && Math.abs(gg - b) <= 6);
});
test('spline and densify keep end points', () => {
  const pts = [[0, 0], [50, 30], [100, 0]];
  const s = U.spline(pts, false, 3); deepEqual(s[0], pts[0]); assert.ok(U.len(U.sub(s.at(-1), pts[2])) < 1e-6);
  assert.ok(U.densify([[0, 0], [30, 0]], false, 3).length >= 10);
});
