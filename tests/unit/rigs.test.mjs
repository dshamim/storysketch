// Rigs are plugins: a character picks a skeleton with `rig`, and the editor talks to it only through the rig API.
import test from 'node:test'; import assert from 'node:assert/strict';
import { createApp } from '../helpers/sandbox.mjs';
const app = await createApp(); const { CP, FIG, STORE } = app;

test('the Person rig is built in and is the default for every character', () => {
  assert.ok(CP.rigs.biped); assert.equal(CP.rigs.biped.id, 'biped');
  assert.equal(STORE.normalizeCast({ id: 'x', name: 'X' }).rig, 'biped');
  assert.equal(FIG.rigOf({ rig: 'does-not-exist' }), CP.rigs.biped, 'unknown rig falls back to the Person rig');
  assert.equal(FIG.rigOf(null), CP.rigs.biped);
});
test('a rig provides the whole API the editor needs', () => {
  for (const rig of Object.values(CP.rigs)) {
    for (const k of ['dims', 'joints', 'prims', 'fromPreset', 'mirror', 'handles', 'edit', 'bendOf', 'flipBend']) assert.equal(typeof rig[k], 'function', `${rig.id}.${k}`);
    assert.ok(Array.isArray(rig.limbs) && rig.limbs.length > 0); assert.ok(rig.limbs.every((l) => l.id && l.label));
    assert.ok(rig.expressions && Object.keys(rig.expressions).length > 0);
    assert.ok(CP.posesFor(rig.id).length > 0, `${rig.id} has no preset poses`);
  }
});
test('handles: every handle has an id, a finite position and a colour, and ids are unique', () => {
  for (const rig of Object.values(CP.rigs)) {
    const c = STORE.normalizeCast({ id: 'c', name: 'C', rig: rig.id, body: 'stick' }); const pose = FIG.fromPreset(c, CP.posesFor(rig.id)[0]);
    const hs = FIG.handles(c, pose); assert.ok(hs.length >= 5);
    assert.equal(new Set(hs.map((h) => h.id)).size, hs.length);
    for (const h of hs) { assert.ok(h.id && h.color); assert.ok(h.p.length === 2 && h.p.every(Number.isFinite)); }
  }
});
test('dragging any handle to any target never produces NaN (all rigs)', () => {
  for (const rig of Object.values(CP.rigs)) {
    const c = STORE.normalizeCast({ id: 'c', name: 'C', rig: rig.id, body: 'stick' }); const pose = FIG.fromPreset(c, CP.posesFor(rig.id)[0]);
    for (const h of FIG.handles(c, pose)) for (const t of [[0, 0], [60, -40], [-300, 200], [4000, -4000]]) for (const o of [{}, { rotate: true }, { bend: -1 }]) {
      const p = JSON.parse(JSON.stringify(pose)); FIG.edit(c, p, h.id, t, o);
      assert.ok(JSON.stringify(p).indexOf('null') < 0 && FIG.handles(c, p).every((x) => x.p.every(Number.isFinite)), `${rig.id} ${h.id} → ${t}`);
    }
  }
});
test('mirroring is its own inverse on handle positions (all rigs)', () => {
  for (const rig of Object.values(CP.rigs)) for (const pr of CP.posesFor(rig.id)) {
    const c = STORE.normalizeCast({ id: 'c', name: 'C', rig: rig.id, body: 'stick' }); const p = FIG.fromPreset(c, pr);
    const a = FIG.handles(c, p), b = FIG.handles(c, FIG.mirror(c, FIG.mirror(c, p)));
    a.forEach((h, i) => assert.ok(Math.hypot(h.p[0] - b[i].p[0], h.p[1] - b[i].p[1]) < 1e-6, `${rig.id}/${pr.id} ${h.id}`));
  }
});
test('poses belong to a rig: a pose with no `rig` is a Person pose', () => {
  assert.ok(CP.posesFor('biped').length === CP.poses.filter((p) => !p.rig || p.rig === 'biped').length);
  assert.equal(CP.posesFor('no-such-rig').length, 0);
});
test('a plugin rig can be registered, used by a character, and is validated', () => {
  const before = Object.keys(CP.rigs).length;
  CP.register({ api: 1, type: 'rig', id: 'broken', name: 'Broken' }); // missing the required API
  assert.equal(Object.keys(CP.rigs).length, before); assert.ok(CP.warnings.some((w) => /missing "dims"/.test(w)));
  CP.warnings.length = 0;
  // a minimal valid rig: delegates to the Person rig under another id
  const b = CP.rigs.biped; CP.register({ ...b, id: 'twin', name: 'Twin', file: undefined });
  assert.ok(CP.rigs.twin); const c = STORE.normalizeCast({ id: 'c', name: 'C', rig: 'twin', body: 'stick' });
  assert.equal(FIG.rigOf(c).id, 'twin'); assert.ok(FIG.prims(c, { pose: FIG.fromPreset(c, CP.poses[0]), expr: 'happy', look: 0, detach: {} }).length > 0);
  delete CP.rigs.twin;
});
test('the same pose id can exist for different rigs without one replacing the other', () => {
  const ids = (rig) => CP.posesFor(rig).map((p) => p.id);
  for (const id of ['stand', 'walk', 'run', 'sit']) { assert.ok(ids('biped').includes(id), `biped lost "${id}"`); assert.ok(ids('quadruped').includes(id), `quadruped has no "${id}"`); }
  assert.ok(FIG.posesFor({ rig: 'quadruped' }).every((p) => p.rig === 'quadruped'));
  assert.ok(FIG.posesFor({ rig: 'biped' }).every((p) => !p.rig || p.rig === 'biped'));
});

// ---- the four-legged rig (dog / cat / dinosaur) ----
const animal = (build, over = {}) => STORE.normalizeCast({ id: 'a', name: 'A', rig: 'quadruped', build, ...over });
test('quadruped: every build × every pose × every expression draws finite shapes', () => {
  const q = CP.rigs.quadruped;
  for (const build of Object.keys(q.builds)) for (const pr of CP.posesFor('quadruped')) for (const ex of Object.keys(q.expressions)) {
    const c = animal(build); const inst = { pose: FIG.fromPreset(c, pr), expr: ex, look: 0, detach: {} };
    const prims = FIG.prims(c, inst); assert.ok(prims.length > 10, `${build}/${pr.id}`);
    for (const p of prims) for (const pt of p.pts) assert.ok(pt.every(Number.isFinite), `${build}/${pr.id}/${ex}`);
  }
});
test('quadruped: leg and neck bones keep their length in every pose', () => {
  for (const build of Object.keys(CP.rigs.quadruped.builds)) for (const pr of CP.posesFor('quadruped')) {
    const c = animal(build, { height: 1.2 }); const J = FIG.joints(c, FIG.fromPreset(c, pr)); const d = J.d; const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    for (const l of FIG.limbs(c)) { assert.ok(Math.abs(dist(J[l.id].S, J[l.id].E) - d.up) < 1e-6); assert.ok(Math.abs(dist(J[l.id].E, J[l.id].H) - d.lo) < 1e-6); }
    assert.ok(Math.abs(dist(J.hip, J.shoulder) - d.body) < 1e-6); assert.ok(Math.abs(dist(J.shoulder, J.neckEnd) - d.neck) < 1e-6);
  }
});
test('quadruped: IK puts a paw on a reachable target; unreachable targets stay finite', () => {
  const c = animal('dog'); const pose = FIG.fromPreset(c, CP.posesFor('quadruped')[0]); const J = FIG.joints(c, pose);
  const target = [J.frontNear.S[0] + 20, J.frontNear.S[1] + 50]; FIG.edit(c, pose, 'ik:frontNear', target, { bend: 1 });
  const H = FIG.joints(c, pose).frontNear.H; assert.ok(Math.hypot(H[0] - target[0], H[1] - target[1]) < 0.5);
  FIG.edit(c, pose, 'ik:backNear', [1e5, -1e5]); assert.ok(FIG.handles(c, pose).every((h) => h.p.every(Number.isFinite)));
});
test('quadruped: detached legs are drawn only in the limbs part', () => {
  const c = animal('dog'); const inst = { pose: FIG.fromPreset(c, CP.posesFor('quadruped')[0]), expr: 'happy', look: 0, detach: { frontNear: true } };
  const main = FIG.prims(c, inst, 'main'), limbs = FIG.prims(c, inst, 'limbs'); assert.ok(limbs.length > 0);
  assert.equal(FIG.prims(c, { ...inst, detach: {} }, 'main').length, main.length + limbs.length);
});
test('quadruped: accessories (head / face / body / back slots) work on animals', () => {
  for (const id of Object.keys(CP.accessories)) {
    const c = animal('dog', { accessories: { [id]: {} } }); const prims = FIG.prims(c, { pose: FIG.fromPreset(c, CP.posesFor('quadruped')[0]), expr: 'happy', look: 0, detach: {} });
    for (const p of prims) for (const pt of p.pts) assert.ok(pt.every(Number.isFinite), `accessory ${id}`);
  }
  assert.deepEqual([...CP.warnings], []);
});
test('the three animal templates exist and use the four-legged rig', () => {
  for (const id of ['t-dog', 't-cat', 't-dino']) { const t = CP.templates.find((x) => x.id === id); assert.ok(t, id); assert.equal(t.look.rig, 'quadruped'); assert.ok(CP.rigs.quadruped.builds[t.look.build]); }
});
test('accessories that read biped limbs are hidden from other rigs and not drawn on them', () => {
  for (const id of ['apron', 'wheelchair', 'stache']) { const d = CP.accessories[id]; assert.ok(d, id); assert.equal(JSON.stringify(d.rigs), '["biped"]'); assert.equal(FIG.accessoryFits(d, { rig: 'quadruped' }), false); assert.equal(FIG.accessoryFits(d, {}), true); }
  assert.equal(FIG.accessoryFits(CP.accessories.hat, { rig: 'quadruped' }), true, 'accessories with no rigs list fit every skeleton');
  const c = animal('dog', { accessories: { apron: {}, hat: {} } });
  const withBoth = FIG.prims(c, { pose: FIG.fromPreset(c, CP.posesFor('quadruped')[0]), expr: 'happy', look: 0, detach: {} }).length;
  const hatOnly = FIG.prims(animal('dog', { accessories: { hat: {} } }), { pose: FIG.fromPreset(c, CP.posesFor('quadruped')[0]), expr: 'happy', look: 0, detach: {} }).length;
  assert.equal(withBoth, hatOnly, 'the apron must not be drawn on a dog');
});
