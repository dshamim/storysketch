import test from 'node:test'; import assert from 'node:assert/strict';
import { deepEqual } from 'node:assert'; // loose: objects made inside the vm have another prototype
import { createApp } from '../helpers/sandbox.mjs';

const app = await createApp({ plugins: false });
const ARR = app.get('ARR');
const B = (x, y, w, h) => ({ x, y, w, h });
const moved = (boxes, d) => boxes.map((b, i) => B(b.x + d[i].dx, b.y + d[i].dy, b.w, b.h));

test('align: each edge and centre mode lines the boxes up with the box around all of them', () => {
  const boxes = [B(10, 10, 20, 40), B(100, 50, 60, 20), B(40, 200, 10, 10)];
  const u = ARR.union(boxes); deepEqual({ ...u }, { x: 10, y: 10, w: 150, h: 200 });
  const left = moved(boxes, ARR.align(boxes, 'left')); assert.ok(left.every((b) => b.x === 10));
  const right = moved(boxes, ARR.align(boxes, 'right')); assert.ok(right.every((b) => b.x + b.w === 160));
  const hc = moved(boxes, ARR.align(boxes, 'hcenter')); assert.ok(hc.every((b) => b.x + b.w / 2 === 85));
  const top = moved(boxes, ARR.align(boxes, 'top')); assert.ok(top.every((b) => b.y === 10));
  const bottom = moved(boxes, ARR.align(boxes, 'bottom')); assert.ok(bottom.every((b) => b.y + b.h === 210));
  const vm = moved(boxes, ARR.align(boxes, 'vmiddle')); assert.ok(vm.every((b) => b.y + b.h / 2 === 110));
  // aligning along one axis never moves the other
  assert.ok(ARR.align(boxes, 'left').every((d) => d.dy === 0)); assert.ok(ARR.align(boxes, 'top').every((d) => d.dx === 0));
});
test('align to the page: a single box can be centred on a reference box', () => {
  const page = B(0, 0, 1000, 750); const d = ARR.align([B(10, 10, 100, 200)], 'hcenter', page)[0];
  assert.equal(10 + d.dx + 50, 500); assert.equal(d.dy, 0);
  assert.throws(() => ARR.align([B(0, 0, 1, 1)], 'sideways'));
  deepEqual(ARR.align([], 'left'), []);
});
test('distribute: equal gaps, outer boxes stay, order does not matter, fewer than three do nothing', () => {
  const boxes = [B(300, 0, 50, 10), B(0, 0, 100, 10), B(120, 0, 20, 10)]; // out of order on purpose
  const d = ARR.distribute(boxes, 'h'); const r = moved(boxes, d).sort((a, b) => a.x - b.x);
  assert.equal(r[0].x, 0); assert.equal(r[2].x + r[2].w, 350);
  assert.equal(r[1].x - (r[0].x + r[0].w), r[2].x - (r[1].x + r[1].w), 'the two gaps are equal');
  deepEqual(d.map((x) => x.dy), [0, 0, 0]);
  const v = ARR.distribute([B(0, 0, 10, 10), B(0, 20, 10, 10), B(0, 100, 10, 10), B(0, 400, 10, 50)], 'v');
  const rv = moved([B(0, 0, 10, 10), B(0, 20, 10, 10), B(0, 100, 10, 10), B(0, 400, 10, 50)], v);
  const gaps = rv.slice(1).map((b, i) => b.y - (rv[i].y + rv[i].h)); assert.ok(gaps.every((g) => Math.abs(g - gaps[0]) < 1e-9), JSON.stringify(gaps));
  deepEqual(ARR.distribute([B(0, 0, 1, 1), B(5, 0, 1, 1)], 'h'), [{ dx: 0, dy: 0 }, { dx: 0, dy: 0 }]);
});
test('snap: pulls onto the nearest line within the threshold, per axis, and reports guides', () => {
  const page = B(0, 0, 1000, 750); const other = B(400, 300, 100, 100);
  // left edge 4 away from the page's left edge, top 3 away from the other box's top
  const r = ARR.snap(B(4, 297, 50, 50), [page, other], 6);
  assert.equal(r.dx, -4); assert.equal(r.dy, 3);
  assert.ok(r.guides.some((g) => g.axis === 'x' && g.pos === 0), 'vertical guide on the page edge');
  assert.ok(r.guides.some((g) => g.axis === 'y' && g.pos === 300), 'horizontal guide on the other box');
  // centre lines snap too
  const c = ARR.snap(B(473, 10, 50, 50), [page], 6); assert.equal(c.dx, 2); assert.equal(c.dy, 0);
  // too far = no move, no guides
  const far = ARR.snap(B(40, 40, 50, 50), [page, other], 6); deepEqual({ dx: far.dx, dy: far.dy, n: far.guides.length }, { dx: 0, dy: 0, n: 0 });
  // the closest of several candidates wins
  const two = ARR.snap(B(96, 0, 50, 50), [B(100, 500, 10, 10), B(98, 600, 10, 10)], 6); assert.equal(two.dx, 2);
  // a guide spans the moving box and the target it matched
  const g = ARR.snap(B(0, 0, 10, 10), [B(0, 200, 10, 10)], 6).guides.find((x) => x.axis === 'x');
  deepEqual({ from: g.from, to: g.to }, { from: 0, to: 210 });
});
