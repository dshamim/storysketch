import test from 'node:test'; import assert from 'node:assert/strict';
import { createApp } from '../helpers/sandbox.mjs';
const { CP, FIG, STORE, Pen } = await createApp();
const close = (a, b, eps = 0.5) => Math.hypot(a[0] - b[0], a[1] - b[1]) < eps;
const cast = (over = {}) => STORE.normalizeCast({ id: 'c', name: 'C', body: 'stick', ...over });
const pose = (c, id = 'stand') => FIG.fromPreset(c, CP.posesFor('biped').find((p) => p.id === id));

for (const build of ['child', 'adult']) {
  test(`${build}: bones keep their length in every preset pose`, () => {
    const c = cast({ build });
    for (const pr of CP.posesFor('biped')) {
      const J = FIG.joints(c, FIG.fromPreset(c, pr)); const d = J.d;
      for (const [limb, a, b] of [['armL', d.ua, d.fa], ['armR', d.ua, d.fa], ['legL', d.th, d.sh], ['legR', d.th, d.sh]]) {
        assert.ok(Math.abs(Math.hypot(J[limb].E[0] - J[limb].S[0], J[limb].E[1] - J[limb].S[1]) - a) < 1e-6, `${pr.id} ${limb} upper`);
        assert.ok(Math.abs(Math.hypot(J[limb].H[0] - J[limb].E[0], J[limb].H[1] - J[limb].E[1]) - b) < 1e-6, `${pr.id} ${limb} lower`);
      }
    }
  });
}
test('IK puts the hand on a reachable target, and the bend side can be chosen', () => {
  const c = cast(); const p = pose(c); const J0 = FIG.joints(c, p);
  const target = [J0.armR.S[0] + 45, J0.armR.S[1] - 20];
  FIG.edit(c, p, 'ik:armR', target, { bend: 1 }); const a = FIG.joints(c, p); assert.ok(close(a.armR.H, target));
  FIG.edit(c, p, 'ik:armR', target, { bend: -1 }); const b = FIG.joints(c, p); assert.ok(close(b.armR.H, target));
  assert.ok(!close(a.armR.E, b.armR.E, 1), 'elbow should flip to the other side');
});
test('IK clamps an unreachable target to full extension instead of producing NaN', () => {
  const c = cast(); const p = pose(c); const J = FIG.joints(c, p);
  FIG.edit(c, p, 'ik:legL', [J.legL.S[0] + 5000, J.legL.S[1] + 5000], { bend: 1 });
  const L = FIG.joints(c, p).legL; assert.ok(L.H.every(Number.isFinite)); assert.ok(L.E.every(Number.isFinite));
});
test('flipBend keeps the hand where it was', () => {
  const c = cast(); const p = pose(c, 'wave'); const before = FIG.joints(c, p).armR.H;
  FIG.flipBend(c, p, 'armR'); assert.ok(close(FIG.joints(c, p).armR.H, before));
});
test('mirroring twice gives the original pose back', () => {
  const c = cast(); for (const pr of CP.posesFor('biped')) {
    const p = FIG.fromPreset(c, pr); const mm = FIG.mirror(c, FIG.mirror(c, p));
    for (const k of ['torso', 'head']) assert.ok(Math.abs(mm[k] - p[k]) < 1e-6 || Math.abs(Math.abs(mm[k] - p[k]) - 360) < 1e-6, `${pr.id} ${k}`);
    for (const k of ['armL', 'armR', 'legL', 'legR']) p[k].forEach((v, i) => assert.ok(Math.abs(((mm[k][i] - v + 540) % 360) - 180) < 1e-6, `${pr.id} ${k}`));
  }
});
test('mirroring swaps the hands left ↔ right', () => {
  const c = cast(); const p = pose(c, 'wave'); const J = FIG.joints(c, p), M = FIG.joints(c, FIG.mirror(c, p));
  assert.ok(close([-J.armR.H[0], J.armR.H[1]], M.armL.H, 1e-6)); assert.ok(close([-J.armL.H[0], J.armL.H[1]], M.armR.H, 1e-6));
});
test('height scales every bone', () => {
  const a = FIG.dims(cast({ height: 1 })), b = FIG.dims(cast({ height: 1.5 }));
  assert.ok(Math.abs(b.th / a.th - 1.5) < 1e-9); assert.ok(Math.abs(b.torso / a.torso - 1.5) < 1e-9);
});
test('detached limbs are drawn only in the "limbs" part, never twice', () => {
  const c = cast(); const inst = { pose: pose(c), expr: 'happy', look: 0, detach: { armL: true } };
  const main = FIG.prims(c, inst, 'main'), limbs = FIG.prims(c, inst, 'limbs');
  assert.ok(limbs.length > 0 && limbs.length < main.length);
  assert.equal(FIG.prims(c, { ...inst, detach: {} }, 'main').length, main.length + limbs.length);
});
test('figure drawing is deterministic', () => {
  const c = cast({ hair: 'curly' }); const inst = { pose: pose(c), expr: 'happy', look: 0, detach: {} };
  assert.equal(JSON.stringify(FIG.prims(c, inst)), JSON.stringify(FIG.prims(c, inst)));
});

// ---- plugin smoke tests: every plugin draws without errors and with finite coordinates ----
const finite = (prims, what) => { for (const p of prims) for (const pt of p.pts) assert.ok(pt.every(Number.isFinite), `${what}: non-finite point`); };
test('every hair style draws (front and back, mirrored or not)', () => {
  for (const id of Object.keys(CP.hair)) for (const mirror of [false, true]) {
    const c = cast({ hair: id }); finite(FIG.prims(c, { pose: pose(c), expr: 'happy', look: 0, detach: {}, hairFlip: mirror }), `hair ${id}`);
  }
  assert.deepEqual([...CP.warnings], []);
});
test('every clothes plugin draws in a standing and a sitting pose', () => {
  for (const id of Object.keys(CP.clothes)) for (const po of ['stand', 'sit']) {
    const c = cast({ body: id }); const pr = CP.posesFor('biped').find((p) => p.id === po) || CP.posesFor('biped')[0]; finite(FIG.prims(c, { pose: FIG.fromPreset(c, pr), expr: 'happy', look: 0, detach: {} }), `clothes ${id}`);
  }
  assert.deepEqual([...CP.warnings], []);
});
test('every accessory draws, with and without the side flip', () => {
  for (const id of Object.keys(CP.accessories)) for (const flip of [false, true]) {
    const c = cast({ accessories: { [id]: {} }, capeFlip: flip }); finite(FIG.prims(c, { pose: pose(c), expr: 'happy', look: 0, detach: {} }), `accessory ${id}`);
  }
  assert.deepEqual([...CP.warnings], []);
});
test('every expression draws', () => {
  for (const ex of Object.keys(FIG.expressions(cast()))) { const c = cast(); finite(FIG.prims(c, { pose: pose(c), expr: ex, look: 1, detach: {} }), `expr ${ex}`); }
});
test('every character in the starter cast draws in every preset pose', () => {
  for (const ch of STORE.starterCast()) for (const pr of CP.posesFor('biped')) finite(FIG.prims(ch, { pose: FIG.fromPreset(ch, pr), expr: pr.expr || 'happy', look: 0, detach: {} }), `${ch.id}/${pr.id}`);
  assert.deepEqual([...CP.warnings], []);
});
test('every prop draws with its default options', async () => {
  const app = await createApp(); const propPrims = app.get('propPrims');
  for (const d of app.CP.propList) { const prims = propPrims({ id: 'i-' + d.id, kind: d.id }); assert.ok(prims.length > 0, `${d.id} drew nothing`); finite(prims, `prop ${d.id}`); }
  assert.deepEqual([...app.CP.warnings], []);
});
test('every prop add-on (picture, flower, chart…) draws', async () => {
  const app = await createApp(); const { Pen, CP } = app;
  for (const ad of Object.values(CP.addons)) {
    const pen = new Pen({}); const box = { x: 0, y: 0, w: 100, h: 70, cx: 50, cy: 35 }; const params = {}; for (const pr of ad.params || []) params[pr.key] = pr.def;
    ad.draw(pen, box, { item: { id: 'x' }, seed: 'x', rng: app.U.rng(1), params, propParams: {}, slot: 's' }); finite(pen.o, `addon ${ad.id}`);
  }
});
