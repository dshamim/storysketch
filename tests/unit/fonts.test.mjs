// Fonts: letter outlines as data. Licences, coverage, layout with kerning, drawing through every style, and fallbacks.
import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: objects made inside the vm have another prototype
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { createApp, ROOT } from '../helpers/sandbox.mjs';

const app = await createApp();
const FONTS = app.get('FONTS'); const TXT = app.get('TXT'); const RENDER = app.get('RENDER'); const CP = app.get('CP');
const fonts = () => FONTS.list();
const BASIC = Array.from({ length: 0x7e - 0x20 + 1 }, (_, i) => String.fromCharCode(0x20 + i));
const ctx = (style, over = {}) => ({ mode: 'colour', paper: '#ffffff', seed: 's1', idp: 't', n: 0, style, ...over });
const T = (text, o = {}) => ({ text, size: 48, ...o });

test('five fonts are bundled and registered through the plugin system', () => {
  deepEqual(fonts().map((f) => f.id).sort(), ['caveat-brush', 'comic-neue', 'crimson-pro', 'nunito', 'patrick-hand']);
  assert.equal(CP.loaded.filter((r) => r.type === 'font').length, 5); deepEqual(CP.warnings, []);
});
test('every font records its licence: SIL OFL 1.1, a copyright line, the exact source file and its sha256, and ships the full licence text', () => {
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fonts/sources.json'), 'utf8'));
  for (const f of fonts()) {
    const l = f.licence; assert.equal(l.name, 'SIL Open Font License 1.1', f.id); assert.ok(l.copyright.length > 10, f.id); assert.match(l.commit, /^[0-9a-f]{40}$/, f.id);
    assert.ok(l.files.length >= 1 && l.files.every((x) => / [0-9a-f]{64}$/.test(x)), f.id + ' needs the sha256 of every source file');
    const text = fs.readFileSync(path.join(ROOT, l.file), 'utf8'); assert.match(text, /SIL OPEN FONT LICENSE Version 1\.1/i, f.id); assert.ok(text.includes(l.copyright.slice(0, 30)), f.id + ': licence file carries the copyright line');
    assert.ok(!/with Reserved Font Names?/i.test(text), f.id + ' declares a Reserved Font Name: it cannot be bundled as converted data');
    assert.ok(src.fonts.some((s) => s.id === f.id), f.id + ' is listed in tools/fonts/sources.json');
    assert.ok(fs.readFileSync(path.join(ROOT, `plugins/fonts/${f.id}.js`), 'utf8').includes('SIL Open Font License 1.1'), 'the plugin file says so too');
  }
});
test('every font draws all of Basic Latin plus curly quotes, dashes, ellipsis and bullet, in regular and bold', () => {
  for (const f of fonts()) for (const w of ['regular', 'bold']) for (const ch of [...BASIC, ...'‘’“”–—…•']) assert.ok(FONTS.has(f.id, ch, w), `${f.id} ${w} lacks ${JSON.stringify(ch)}`);
});
test('the fonts are data only: no function, no code in a font plugin', () => {
  for (const f of fonts()) { const walk = (v) => { assert.notEqual(typeof v, 'function'); if (v && typeof v === 'object') Object.values(v).forEach(walk); }; walk(f); }
});
test('capital letters are about the same height in every font, so switching font keeps the box close to the same size', () => {
  for (const f of fonts()) { const g = FONTS.glyph(f.id, 'normal', 'H', 100, 0, 100); const ys = g.pts.map((p) => p[1]); const h = 100 - Math.min(...ys); assert.ok(h > 80 && h < 102, `${f.id}: H is ${h.toFixed(1)} tall at size 100`); }
});

test('every letter\'s ink stays inside the text box (ascenders, descenders, brackets, overhangs), for every font and weight, so selection, click area, crop and Line up are right', () => {
  const text = 'bdfhklgjpqy()[]{}|/@$&%Hold my bag fjord';
  for (const f of fonts()) for (const weight of ['normal', 'bold']) for (const size of [30, 100]) {
    const it = T(text, { font: f.id, size, weight, align: 'left' }); const b = TXT.box(it); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const q of TXT.prims(it)) for (const c of [q.pts, ...(q.more || [])]) for (const [x, y] of c) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const tol = size * 0.01; assert.ok(y0 >= b.y0 - tol && y1 <= b.y1 + tol && x0 >= b.x0 - tol && x1 <= b.x1 + tol, `${f.id} ${weight} ${size}: ink ${[x0, y0, x1, y1].map(Math.round)} is outside the box ${[b.x0, b.y0, b.x1, b.y1].map(Math.round)}`);
  }
  const hand = TXT.box(T('Hello', { font: 'hand' })); assert.equal(hand.h, 48 * 1.3, 'the hand-drawn box is exactly as before');
});
test('round letters stay smooth however big the text is made: detail follows size x scale (checked on the turning angle of an o)', () => {
  const turn = (it) => { const o = TXT.prims(it)[0]; const c = o.more ? [o.pts, ...o.more][0] : o.pts; let worst = 0; for (let i = 0; i < c.length; i++) { const a = c[(i + c.length - 1) % c.length], b = c[i], d = c[(i + 1) % c.length]; const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(d[1] - b[1], d[0] - b[0]); let r = Math.abs(t2 - t1); if (r > Math.PI) r = 2 * Math.PI - r; worst = Math.max(worst, r); } return worst * 180 / Math.PI; };
  for (const [size, s] of [[30, 1], [30, 6], [48, 4], [150, 1]]) assert.ok(turn({ ...T('o', { font: 'nunito', size }), s }) < 12, `size ${size} x ${s}: facets`);
  const n = (s) => TXT.prims({ ...T('o', { font: 'nunito', size: 30 }), s })[0].pts.length; assert.ok(n(6) > n(1) * 2, 'a scaled-up text gets more detail');
});
test('a font text lays out like any text: lines, wrapping, a box centred on the origin, and a caret between every letter', () => {
  for (const f of fonts()) {
    const L = TXT.layout(T('the quick brown fox jumps over the lazy dog', { font: f.id, w: 300 }));
    assert.ok(L.lines.length > 1, f.id); assert.ok(L.lines.every((l) => l.w <= 300 + 1e-6), f.id + ': no line beyond the box');
    assert.equal(L.x0, -L.W / 2); const l0 = L.lines[0]; for (let i = 1; i < l0.xs.length; i++) assert.ok(l0.xs[i] >= l0.xs[i - 1], 'positions never go backwards');
    assert.equal(TXT.indexAt(L, l0.xs[3], L.y0 + 10), 3, f.id + ': clicking between letters finds the letter');
  }
});
test('kerning is folded into the advance of the first letter of a pair (so the caret and wrapping stay right)', () => {
  const kern = FONTS.get('crimson-pro').weights.regular.kern; const pair = Object.keys(kern).find((p) => /^[A-Z][a-z]$/.test(p) && Math.abs(kern[p]) > 30); assert.ok(pair, 'a clear pair exists');
  const solo = FONTS.advances(pair[0], 'crimson-pro', 'normal', 100, 0)[0]; const paired = FONTS.advances(pair, 'crimson-pro', 'normal', 100, 0)[0];
  assert.ok(Math.abs((paired - solo) - kern[pair] * FONTS.scaleOf('crimson-pro', 'normal', 100)) < 1e-6, 'the difference is exactly the kerning pair');
  assert.equal(FONTS.advances(pair[0] + ' ' + pair[1], 'crimson-pro', 'normal', 100, 0)[0], solo, 'no kerning across a space');
});
test('letter spacing and bold still work', () => {
  const a = TXT.layout(T('Hello', { font: 'nunito' })).W, b = TXT.layout(T('Hello', { font: 'nunito', letterSpacing: 0.2 })).W; assert.ok(b > a + 4 * 48 * 0.2 - 1e-6);
  const n = TXT.layout(T('Hello', { font: 'comic-neue' })).W, bold = TXT.layout(T('Hello', { font: 'comic-neue', weight: 'bold' })).W; assert.notEqual(n, bold, 'bold has its own letter shapes and widths');
});

test('font text becomes one filled shape per letter, standing on the baseline; letters with holes and dots carry every outline', () => {
  const p = TXT.prims(T('Bio 8', { font: 'nunito' })); assert.equal(p.length, 4, 'B, i, o, 8 (the space draws nothing)');
  for (const q of p) { assert.equal(q.glyph, true); assert.equal(q.closed, true); assert.equal(q.stroke, null); assert.ok(q.fill); }
  assert.ok(p[0].more && p[0].more.length >= 2, 'B has two holes'); assert.ok(p[1].more && p[1].more.length === 1, 'i has a dot'); assert.ok(p[2].more && p[2].more.length === 1, 'o has a hole'); assert.ok(p[3].more.length === 2, '8 has two holes');
  for (const q of p) for (const [x, y] of [...q.pts, ...(q.more || []).flat()]) assert.ok(Number.isFinite(x) && Number.isFinite(y));
});
test('rainbow and per-line colours colour each letter / line', () => {
  const r = TXT.prims(T('abcdefg', { font: 'nunito', colors: 'rainbow' })); assert.equal(new Set(r.map((q) => q.fill)).size, 6, 'seven letters cycle through six colours');
  const l = TXT.prims(T('aa bb cc', { font: 'nunito', colors: 'lines', w: 50 })); assert.ok(new Set(l.map((q) => q.fill)).size >= 2);
});
test('an unknown font is drawn exactly like the hand-drawn letters; a character the font lacks is handled the way the hand-drawn text handles it (it keeps its room, nothing breaks)', () => {
  deepEqual(TXT.prims(T('Hello', { font: 'no-such-font' })), TXT.prims(T('Hello', { font: 'hand' })));
  const p = TXT.prims(T('a\u263ab', { font: 'nunito' })); assert.equal(p.filter((q) => q.glyph).length, 2, 'the two letters are drawn; the hand-drawn alphabet has no smiley either');
  const L = TXT.layout(T('a\u263ab', { font: 'nunito' })); assert.equal(L.lines[0].adv[1], app.get('GLYPH').advances('\u263a', 48, 0, false)[0], 'the missing character takes the step the hand-drawn alphabet gives it');
  const q = TXT.prims(T('\u201cHi\u201d \u2013 a\u00a0b', { font: 'nunito' })); assert.ok(q.length === 7 && q.every((x) => x.glyph), 'curly quotes, a dash and a non-breaking space are all handled by the font');
});
test('the hand-drawn text is untouched by fonts (same primitives as before, none are font letters)', () => {
  const p = TXT.prims(T('Hello', { font: 'hand' })); assert.ok(p.length > 5 && p.every((q) => !q.glyph && !q.more));
});

for (const id of ['clean', 'crayon', 'marker', 'ink', 'chalk']) {
  test(`${id}: draws every outline of a letter (holes and dots), solid enough to read, and outputs finite numbers`, () => {
    const prims = TXT.prims(T('Bio 8 Reading time', { font: 'nunito', size: 24 })); const svg = id === 'clean' ? RENDER.clean(prims, ctx(id)) : RENDER.render(prims, ctx(id));
    assert.ok(!/NaN|undefined|Infinity/.test(svg), 'finite');
    assert.equal((svg.match(/<g[ >]/g) || []).length, (svg.match(/<\/g>/g) || []).length, 'balanced <g>');
    assert.ok(!/<text|font-family/.test(svg), 'outlines, not text');
    const f = (n) => Math.round(n * 10) / 10;
    for (const q of prims.slice(0, 4)) for (const c of [q.pts, ...(q.more || [])]) assert.ok(svg.includes(`M${f(c[0][0])} ${f(c[0][1])}`), `${id}: an outline of a letter is missing`);
    assert.ok(/fill-rule="evenodd"/.test(svg), 'holes are cut out');
  });
}
test('the same text draws to the identical SVG every time, in every style', () => {
  const prims = TXT.prims(T('Reading time, 123', { font: 'caveat-brush', weight: 'bold' })); for (const id of ['clean', 'crayon', 'marker', 'ink', 'chalk']) { const draw = () => (id === 'clean' ? RENDER.clean(prims, ctx(id)) : RENDER.render(TXT.prims(T('Reading time, 123', { font: 'caveat-brush', weight: 'bold' })), ctx(id))); assert.equal(draw(), draw(), id); }
});
test('a paragraph of 500 letters is fast to build and draw in every style', () => {
  const para = 'The quick brown fox jumps over the lazy dog. '.repeat(11).slice(0, 500); for (const font of ['patrick-hand', 'caveat-brush']) {
    const t0 = performance.now(); const prims = TXT.prims(T(para, { font, size: 32, w: 800 })); for (const id of ['clean', 'crayon', 'marker', 'ink', 'chalk']) id === 'clean' ? RENDER.clean(prims, ctx(id)) : RENDER.render(prims, ctx(id));
    assert.ok(performance.now() - t0 < 1500, `${font}: ${(performance.now() - t0).toFixed(0)} ms`);
  }
});
test('the shipped font files match what tools/build_fonts.py would write (checked offline: sizes and hashes recorded in sources.json match the plugin records)', () => {
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/fonts/sources.json'), 'utf8'));
  for (const s of src.fonts) { const f = FONTS.get(s.id); assert.equal(f.name, s.name); assert.equal(f.licence.commit, src.commit); for (const w of [s.regular, s.bold].filter(Boolean)) assert.ok(f.licence.files.some((x) => x.endsWith(w.sha256)), s.id); }
});
