import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: objects made inside the vm have another prototype
import { createApp } from '../helpers/sandbox.mjs';

const app = await createApp({ plugins: true });
const SHP = app.get('SHP'); const U = app.get('U'); const RENDER = app.get('RENDER'); const TXT = app.get('TXT');
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);
const nearPt = (p, q, eps = 1e-6) => { near(p[0], q[0], eps); near(p[1], q[1], eps); };
const pathLen = (pts) => pts.reduce((n, p, i) => (i ? n + U.len(U.sub(p, pts[i - 1])) : 0), 0);
const finite = (prims) => prims.every((p) => p.pts.length && p.pts.every((q) => Number.isFinite(q[0]) && Number.isFinite(q[1])) && Number.isFinite(p.w));

test('a new shape or line has everything an editor item needs, and kinds are told apart', () => {
  for (const k of ['box', 'circle', 'triangle']) { const it = SHP.make(k, 300, 200); assert.equal(it.type, 'shape'); assert.equal(it.shape, k); deepEqual([it.x, it.y, it.s, it.rot, it.flip, it.mode], [300, 200, 1, 0, false, 'auto']); }
  const a = SHP.make('arrow'), d = SHP.make('double'), l = SHP.make('line');
  assert.equal(a.type, 'line'); deepEqual([l.start, l.end], ['none', 'none']); deepEqual([a.start, a.end], ['none', 'arrow']); deepEqual([d.start, d.end], ['arrow', 'arrow']);
  deepEqual([l, a, d].map(SHP.name), ['Line', 'Arrow', 'Double arrow']); assert.equal(SHP.name(SHP.make('circle')), 'Circle');
  assert.equal(SHP.name(SHP.make('box', 0, 0, { text: 'Hello there' })), 'Box “Hello there”');
});

test('the box around a shape is centred on the origin and grows with the outline thickness; lines get a thin box along them', () => {
  const b = SHP.box(SHP.make('box', 0, 0, { w: 200, h: 100, width: 10 })); near(b.w, 200 + 2 * (5 + 2)); near(b.h, 100 + 2 * (5 + 2)); near(b.x0, -b.x1);
  const ln = SHP.make('line', 0, 0, { pts: [[-100, 0], [100, 0]], width: 6 }); const lb = SHP.box(ln); assert.ok(lb.w > 200 && lb.w < 215, lb.w); assert.ok(lb.h < 14, 'thin: ' + lb.h);
});

test('every shape draws in every style with finite numbers, and the same item draws the same twice', () => {
  const styles = RENDER.styleList().map((s) => s.id); assert.ok(styles.length >= 4, 'crayon marker ink chalk');
  const items = [];
  for (const k of ['box', 'circle', 'triangle']) for (const fill of ['none', 'colour', 'hatch', 'solid']) for (const dash of ['none', 'dashed', 'dotted']) items.push(SHP.make(k, 100, 100, { fill, dash, radius: k === 'box' ? 30 : 0, text: 'Hi' }));
  for (const k of ['line', 'arrow', 'double']) for (const dash of ['none', 'dashed', 'dotted']) items.push(SHP.make(k, 100, 100, { dash }));
  items.push(SHP.make('box', 0, 0, { width: 0 }), SHP.make('arrow', 0, 0, { pts: [[0, 0], [0, 0]] }), SHP.make('line', 0, 0, { pts: [[0, 0], [0.01, 0]], dash: 'dotted' }));
  for (const it of items) {
    const p = SHP.prims(it); assert.ok(finite(p), JSON.stringify(it)); deepEqual(JSON.parse(JSON.stringify(p)), JSON.parse(JSON.stringify(SHP.prims(it))), 'deterministic');
    for (const st of [null, ...styles]) { const svg = RENDER.render(p, { mode: 'auto', paper: '#fff', seed: 'a', idp: 'x', n: 0, style: st }); assert.ok(!/NaN|undefined|Infinity/.test(svg), `${st}: ${it.type}/${it.shape || it.end}/${it.fill}/${it.dash}`); }
  }
});

test('fill options: none = no fill; colour and shading use the fill colour; solid first lays down the page colour so what is behind is hidden', () => {
  const kinds = (fill) => SHP.prims(SHP.make('box', 0, 0, { fill, fillColor: '#abcdef' })).map((p) => [p.fill || '', p.hatch ? 'hatch' : '', p.stroke ? 'stroke' : '']);
  deepEqual(kinds('none'), [['', '', 'stroke']]); deepEqual(kinds('colour'), [['#abcdef', '', 'stroke']]); deepEqual(kinds('hatch'), [['', 'hatch', 'stroke']]);
  deepEqual(kinds('solid'), [['paper', '', ''], ['#abcdef', '', 'stroke']]);
  assert.equal(SHP.prims(SHP.make('box', 0, 0, { fill: 'hatch', fillColor: '#abcdef' }))[0].hatch.color, '#abcdef');
});

test('outlines: box corners, rounded corners, triangle points up, circle stays smooth (and is cut into points for dashes)', () => {
  assert.equal(SHP.outline(SHP.make('box', 0, 0, { w: 100, h: 60 })).pts.length, 4);
  const r = SHP.outline(SHP.make('box', 0, 0, { w: 100, h: 60, radius: 20 })).pts; assert.equal(r.length, 36); assert.ok(r.every(([x, y]) => Math.abs(x) <= 50 + 1e-9 && Math.abs(y) <= 30 + 1e-9));
  assert.ok(SHP.outline(SHP.make('box', 0, 0, { w: 100, h: 60, radius: 500 })).pts.every(([x, y]) => Math.abs(x) <= 50 + 1e-9 && Math.abs(y) <= 30 + 1e-9), 'a huge radius is capped');
  const t = SHP.outline(SHP.make('triangle', 0, 0, { w: 100, h: 80 })).pts; deepEqual(t.map((p) => p.map((n) => +n.toFixed(6))), [[0, -40], [50, 40], [-50, 40]]);
  const c = SHP.outline(SHP.make('circle', 0, 0, { w: 100, h: 60 })); assert.equal(c.smooth, true);
  for (const [x, y] of c.pts) near((x / 50) ** 2 + (y / 30) ** 2, 1, 1e-9);
  assert.equal(SHP.outline(SHP.make('circle'), true).smooth, false); assert.ok(SHP.outline(SHP.make('circle'), true).pts.length > 64);
});

test('dashes: pieces are short, spaced by the gap, never longer than the path, and a closed outline gets whole dashes', () => {
  const sq = [[0, 0], [403, 0], [403, 207], [0, 207]]; const total = 1220;
  const d = SHP.dashes(sq, true, 'dashed', 5); assert.ok(d.length > 20);
  const lens = d.map(pathLen); assert.ok(lens.every((n) => n > 5 && n < 40), lens.slice(0, 3).join()); near(Math.max(...lens), Math.min(...lens) + (Math.max(...lens) - Math.min(...lens)), 1e-9);
  const gaps = d.map((p, i) => U.len(U.sub(d[(i + 1) % d.length][0], p[p.length - 1]))); assert.ok(gaps.every((g) => g > 5), 'gaps between dashes');
  near(lens.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0), total, 8); // dashes + gaps add up to the whole outline (a gap across a corner is measured straight, so a little short)
  assert.ok(d.some((p) => p.length > 2), 'a dash can bend round a corner');
  const open = SHP.dashes([[0, 0], [300, 0]], false, 'dashed', 5); nearPt(open[0][0], [0, 0]); nearPt(open[open.length - 1].at(-1), [300, 0]); // starts and ends on a dash
  const dots = SHP.dashes([[0, 0], [300, 0]], false, 'dotted', 6); assert.ok(dots.length > 15); assert.ok(dots.every((p) => pathLen(p) > 0 && pathLen(p) < 1.5), 'dots are tiny pieces (round caps make them dots)');
  assert.equal(SHP.dashes([[0, 0], [4, 0]], false, 'dashed', 5).length, 1, 'too short to cut');
  assert.ok(SHP.dashes([[0, 0], [300, 0]], false, 'dashed', 12).length < SHP.dashes([[0, 0], [300, 0]], false, 'dashed', 3).length, 'thicker lines get longer dashes');
});

test('arrowheads: a V at the tip, wings 30 degrees either side of the line, the same size at every angle, shrinking on short lines', () => {
  for (const ang of [0, 30, 45, 90, 135, 180, -90, -160, 211]) {
    const dir = U.dir(ang); const from = [100, 100]; const tip = [100 + dir[0] * 200, 100 + dir[1] * 200]; const s = 30;
    const [w1, t, w2] = SHP.headPts(tip, from, s); nearPt(t, tip); near(U.len(U.sub(w1, tip)), s); near(U.len(U.sub(w2, tip)), s);
    for (const w of [w1, w2]) near(Math.abs(U.normA(U.angleOf(U.sub(w, tip)) - (ang + 180))), 30, 1e-6); // each wing points back along the line, 30 degrees off
    nearPt([(w1[0] + w2[0]) / 2, (w1[1] + w2[1]) / 2], [tip[0] - dir[0] * s * Math.cos(U.rad(30)), tip[1] - dir[1] * s * Math.cos(U.rad(30))], 1e-6); // symmetric about the line
  }
  nearPt(SHP.headPts([5, 5], [5, 5], 10)[1], [5, 5]); assert.ok(finite([{ pts: SHP.headPts([5, 5], [5, 5], 10), w: 1 }]), 'a zero-length line still gives a head');
  assert.ok(SHP.headSize(5, 400) >= 18 && SHP.headSize(5, 400) < SHP.headSize(20, 400), 'bigger for thicker lines'); assert.ok(SHP.headSize(5, 20) <= 9 + 1e-9, 'small on a short line'); assert.ok(SHP.headSize(40, 4000) <= 90);
  const arrow = SHP.linePrims(SHP.make('arrow', 0, 0, { pts: [[-100, 0], [100, 0]] })); assert.equal(arrow.length, 2); assert.equal(SHP.linePrims(SHP.make('double')).length, 3); assert.equal(SHP.linePrims(SHP.make('line')).length, 1);
  nearPt(arrow[1].pts[1], [100, 0]); // the head's tip is the end of the line
});

test('a line is pointed with its two ends: midpoint origin, turn, and length in its own units; turning and flipping keep the ends', () => {
  const it = SHP.make('arrow', 0, 0); SHP.setEnds(it, [100, 100], [300, 200]);
  deepEqual([it.x, it.y], [200, 150]); near(it.rot, Math.atan2(100, 200) * 180 / Math.PI, 0.01); near(it.pts[1][0] * 2, Math.hypot(200, 100), 1e-9);
  const [a, b] = SHP.ends(it); nearPt(a, [100, 100], 0.6); nearPt(b, [300, 200], 0.6);
  const sc = SHP.make('line', 0, 0, { s: 2 }); SHP.setEnds(sc, [0, 0], [200, 0]); const [c, e] = SHP.ends(sc); nearPt(c, [0, 0], 0.6); nearPt(e, [200, 0], 0.6); // scaled item
  const z = SHP.setEnds(SHP.make('line'), [50, 50], [50, 50]); assert.ok(Number.isFinite(z.rot) && z.pts[1][0] > 0, 'zero length stays usable');
  const f = SHP.make('line', 0, 0, { flip: true }); SHP.setEnds(f, [0, 0], [100, 0]); assert.equal(f.flip, false);
});

test('Shift snaps a line to every 15 degrees and keeps its length', () => {
  for (const [to, want] of [[[100, 4], 0], [[100, 30], 15 * Math.round(Math.atan2(30, 100) * 180 / Math.PI / 15)], [[0, 100], 90], [[-100, -3], 180]]) {
    const s = SHP.snapAngle([0, 0], to); near(U.len(s), U.len(to), 1e-9); const a = U.angleOf(s); assert.ok(Math.abs(U.normA(a - want)) < 1e-9, `${a} vs ${want}`);
  }
  nearPt(SHP.snapAngle([10, 10], [10, 10]), [10, 10]);
});

test('drawing a shape by dragging: from corner to corner in any direction; Shift makes it square; never tiny', () => {
  deepEqual(SHP.fromDrag([100, 100], [300, 220]), { x: 200, y: 160, w: 200, h: 120 }); deepEqual(SHP.fromDrag([300, 220], [100, 100]), { x: 200, y: 160, w: 200, h: 120 });
  deepEqual(SHP.fromDrag([100, 100], [300, 140], true), { x: 200, y: 200, w: 200, h: 200 }, 'square takes the longer side'); deepEqual(SHP.fromDrag([100, 100], [40, 20], true), { x: 60, y: 60, w: 80, h: 80 }, 'toward the up-left');
  assert.equal(SHP.fromDrag([5, 5], [6, 6]).w, SHP.MIN);
});

test('resizing by a handle: the opposite side stays put, also for a turned and scaled shape; Shift keeps the proportions; never below the minimum', () => {
  const it = SHP.make('box', 400, 300, { w: 200, h: 100 });
  deepEqual(SHP.resize(it, 'e', [600, 300]), { x: 450, y: 300, w: 300, h: 100 }, 'right side to x=600, left stays at 300');
  deepEqual(SHP.resize(it, 'nw', [250, 200]), { x: 375, y: 275, w: 250, h: 150 }, 'top-left corner moves, bottom-right stays at (500, 350)');
  const kept = SHP.resize(it, 'se', [700, 320], true); near(kept.w / kept.h, 2, 0.05); assert.ok(Math.abs(kept.x - kept.w / 2 - 300) < 1 && Math.abs(kept.y - kept.h / 2 - 250) < 1, 'top-left corner stayed');
  assert.equal(SHP.resize(it, 'e', [0, 300]).w, SHP.MIN, 'cannot be dragged inside out');
  // a shape turned 90 degrees: its local "east" side faces down the page
  const t = SHP.make('box', 400, 300, { w: 200, h: 100, rot: 90 }); const r = SHP.resize(t, 'e', [400, 500]);
  assert.equal(r.w, 300); assert.equal(r.h, 100); nearPt([r.x, r.y], [400, 350], 1);
  const fixed = SHP.toPage({ ...t, ...r }, [-r.w / 2, 0]); nearPt(fixed, SHP.toPage(t, [-100, 0]), 1.5); // the west side did not move on the page
  // scaled and flipped
  const g = SHP.make('box', 400, 300, { w: 200, h: 100, s: 2, flip: true }); const q = SHP.resize(g, 'e', [200, 300]);
  nearPt(SHP.toPage({ ...g, ...q }, [-q.w / 2, 0]), SHP.toPage(g, [-100, 0]), 1.5);
});

test('words inside a shape are laid out centred in the shape, narrower in a circle or triangle, and a triangle shifts them down', () => {
  const box = SHP.textView(SHP.make('box', 0, 0, { w: 300, h: 120, text: 'Hello' })), circ = SHP.textView(SHP.make('circle', 0, 0, { w: 300, h: 300, text: 'Hello' })), tri = SHP.textView(SHP.make('triangle', 0, 0, { w: 300, h: 240, text: 'Hello' }));
  assert.ok(box.item.w > circ.item.w && circ.item.w > tri.item.w); assert.equal(box.item.align, 'center'); assert.equal(box.dy, 0); assert.ok(tri.dy > 0);
  const p = SHP.prims(SHP.make('box', 0, 0, { w: 300, h: 120, text: 'Hello' })); const tb = RENDER.primsBBox(p.slice(1)); near((tb.x0 + tb.x1) / 2, 0, 2); near((tb.y0 + tb.y1) / 2, 0, 12);
  assert.equal(SHP.prims(SHP.make('box', 0, 0, { text: '   ' })).length, 1, 'blank words draw nothing');
});

test('an old project without the new fields still draws (defaults fill in)', () => {
  assert.ok(SHP.prims({ type: 'shape', shape: 'circle', x: 1, y: 1, s: 1 }).length); assert.ok(SHP.prims({ type: 'line', x: 1, y: 1, s: 1 }).length);
});
