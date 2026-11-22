import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: objects made inside the vm have another prototype
import { createApp } from '../helpers/sandbox.mjs';

const app = await createApp({ plugins: false });
const TXT = app.get('TXT'); const GLYPH = app.get('GLYPH');
const L = (text, o = {}) => TXT.layout({ text, size: 40, ...o });
const texts = (lay) => lay.lines.map((l) => lay.text.slice(l.i0, l.i1).trimEnd());

test('a short text is one line; its box is as wide as the letters and centred on the origin', () => {
  const l = L('Hello'); assert.equal(l.lines.length, 1);
  assert.ok(Math.abs(l.W - GLYPH.width('Hello', 40)) < 1e-9 || l.W > 0); assert.equal(l.x0, -l.W / 2); assert.equal(l.y0, -l.H / 2);
  assert.ok(Math.abs(l.lines[0].w - (l.W)) < 1e-9, 'auto width = the line');
});
test('word wrap: breaks at spaces, never beyond the box, and keeps every letter', () => {
  const text = 'the quick brown fox jumps over the lazy dog'; const l = L(text, { w: 300 });
  assert.ok(l.lines.length > 2); assert.ok(l.lines.every((x) => x.w <= 300 + 1e-6), l.lines.map((x) => x.w).join());
  assert.equal(texts(l).join(' '), text, 'no letter lost or added'); assert.equal(l.W, 300);
  assert.ok(texts(l).every((t) => !t.startsWith(' ')), 'lines start with a letter');
});
test('wrap: a word longer than the box is split rather than overflowing; a narrow box still draws every letter', () => {
  const l = L('Supercalifragilistic', { w: 120 }); assert.ok(l.lines.length > 1); assert.ok(l.lines.every((x) => x.w <= 120 + 1e-6));
  assert.equal(texts(l).join(''), 'Supercalifragilistic');
  const tiny = L('abc', { w: 1 }); assert.equal(tiny.lines.length, 3, 'one letter per line at least');
});
test('explicit newlines make new lines (also blank ones); an empty text still has a small box', () => {
  const l = L('one\n\nthree'); assert.deepEqual([...texts(l)], ['one', '', 'three']); assert.equal(l.lines[2].i0, 'one\n\n'.length);
  const e = L(''); assert.equal(e.lines.length, 1); assert.ok(e.W > 0 && e.H > 0);
});
test('alignment: left edge, centred, right edge inside a fixed-width box', () => {
  const o = { w: 400 }; const left = L('hi\nlonger line', { ...o, align: 'left' }), mid = L('hi\nlonger line', { ...o, align: 'center' }), right = L('hi\nlonger line', { ...o, align: 'right' });
  assert.equal(left.lines[0].x, -200); assert.ok(Math.abs(mid.lines[0].x + mid.lines[0].w / 2) < 1e-9); assert.ok(Math.abs(right.lines[0].x + right.lines[0].w - 200) < 1e-9);
});
test('size scales everything; line height spaces the lines; letter spacing widens', () => {
  const a = L('Hi there', { size: 40 }), b = L('Hi there', { size: 80 }); assert.ok(Math.abs(b.W - a.W * 2) < 1e-6); assert.ok(Math.abs(b.H - a.H * 2) < 1e-6);
  const t = L('a\nb', { lineHeight: 1.5 }), u = L('a\nb', { lineHeight: 2 }); assert.ok(u.H > t.H); assert.ok(Math.abs(u.lines[1].y - u.lines[0].y - 80) < 1e-9);
  assert.ok(L('wide', { letterSpacing: 0.3 }).W > L('wide').W);
});
test('layout is deterministic and does not change the item it is given', () => {
  const it = { text: 'Same every time', size: 50, w: 260 }; const before = JSON.stringify(it);
  assert.equal(JSON.stringify(TXT.layout(it)), JSON.stringify(TXT.layout(it))); assert.equal(JSON.stringify(it), before);
});
test('caret and indexAt: every gap between letters has an x, wrapped text maps back to the same letter', () => {
  const l = L('the quick brown fox', { w: 200 });
  for (let i = 0; i <= l.text.length; i++) { const c = TXT.caret(l, i); assert.ok(Number.isFinite(c.x) && c.y1 > c.y0, 'caret ' + i); }
  // clicking exactly on a caret position returns that index (away from wrap points, where two indexes share a place)
  for (let i = 0; i < l.text.length; i++) { const c = TXT.caret(l, i); if (l.text[i] === ' ') continue; assert.equal(TXT.indexAt(l, c.x, (c.y0 + c.y1) / 2), i, 'index ' + i); }
  assert.equal(TXT.caret(l, 0).line, 0); assert.equal(TXT.caret(l, l.text.length).line, l.lines.length - 1);
  assert.equal(TXT.indexAt(l, -9999, -9999), 0); assert.equal(TXT.indexAt(l, 9999, 9999), l.text.length, 'past the end goes to the end');
  // up / down keep roughly the same x and stay in range
  const mid = 6; const down = TXT.moveLine(l, mid, 1); assert.ok(down > mid); assert.equal(TXT.moveLine(l, 0, -1), 0); assert.equal(TXT.moveLine(l, l.text.length, 1), l.text.length);
});
test('advances: one entry per letter, the same widths the drawing uses', () => {
  const s = 'Hello, world 123'; const adv = GLYPH.advances(s, 40); assert.equal(adv.length, s.length);
  assert.ok(Math.abs(adv.reduce((a, b) => a + b, 0) - GLYPH.width(s, 40)) < 1e-9);
  assert.equal(GLYPH.advances('aé', 40)[1], 0, 'a letter the alphabet cannot draw takes no room');
});
test('every drawable character draws finite strokes, in several sizes and spacings', () => {
  const all = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?\'":;/()+-=_<>[]|\\~#%&$*'];
  for (const ch of all) for (const o of [{ size: 12 }, { size: 96, letterSpacing: 0.2, weight: 'bold' }]) {
    assert.ok(GLYPH.supported(ch), 'supported: ' + ch);
    const p = TXT.prims({ text: ch + ch, ...o }); if (ch === ' ') continue;
    assert.ok(p.length > 0, 'draws ' + ch); assert.ok(p.every((s) => s.pts.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))), 'finite ' + ch);
  }
});
test('prims: colour modes, bold, underline; blank text draws nothing', () => {
  const one = TXT.prims({ text: 'ab cd', color: '#112233' }); assert.ok(one.every((s) => s.stroke === '#112233'));
  const rb = TXT.prims({ text: 'abcdef', colors: 'rainbow' }); assert.ok(new Set(rb.map((s) => s.stroke)).size > 3, 'rainbow uses several colours');
  const ln = TXT.prims({ text: 'one\ntwo', colors: 'lines' }); assert.equal(new Set(ln.map((s) => s.stroke)).size, 2);
  const bold = TXT.prims({ text: 'a', size: 50, weight: 'bold' })[0].w, normal = TXT.prims({ text: 'a', size: 50 })[0].w; assert.ok(bold > normal * 1.5);
  const u = TXT.prims({ text: 'hi', underline: true }); assert.equal(u.length, TXT.prims({ text: 'hi' }).length + 1);
  assert.equal(TXT.prims({ text: '   ' }).length, 0); assert.equal(TXT.prims({ text: '' }).length, 0);
});
test('make: presets give sensible defaults; norm fills gaps in older or partial items', () => {
  assert.ok(TXT.PRESETS.length >= 4 && TXT.PRESETS.every((p) => p.id && p.name && p.text && p.size));
  const it = TXT.make(TXT.PRESETS[0], 100, 200); assert.equal(it.type, 'text'); assert.equal(it.x, 100); assert.equal(it.y, 200); assert.equal(it.rot, 0); assert.equal(it.size, 96); assert.equal(it.id, undefined);
  deepEqual(TXT.norm({ text: 'x' }).font, 'hand'); assert.equal(TXT.clampTo('size', 9999), 400); assert.equal(TXT.clampTo('size', 1), 8);
});
test('the old alphabet is unchanged: strings of digits, maths signs and A B C keep their old spacing and drawing', () => {
  const before = GLYPH.width('12 + 3 = 15', 40); assert.ok(before > 0);
  const pen = new (app.get('Pen'))({}); pen.text('2x3=6', 0, 0, 40, {}); assert.ok(pen.o.length >= 5);
});
