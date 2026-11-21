// The Person (biped) rig must behave exactly as the original monolithic figure code did.
// Fixture: see tests/fixtures/make-biped-golden.mjs
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { createApp, ROOT } from '../helpers/sandbox.mjs';
const { CP, FIG, STORE } = await createApp();
const golden = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures/biped-golden.json'), 'utf8'));
const sha = (v) => crypto.createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 16);
const r = (v) => JSON.parse(JSON.stringify(v), (k, x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x));
const cast = STORE.starterCast()[0];
const base = () => FIG.fromPreset(cast, CP.posesFor('biped').find((p) => p.id === 'wave'));

test('drawing: every starter character × every preset pose is unchanged', () => {
  const bad = [];
  for (const c of STORE.starterCast()) for (const pr of CP.posesFor('biped')) {
    const pose = FIG.fromPreset(c, pr);
    if (sha(FIG.prims(c, { pose, expr: pr.expr || 'happy', look: 0, detach: {} }, 'main')) !== golden.prims[`${c.id}/${pr.id}`]) bad.push(`${c.id}/${pr.id}`);
    if (sha(FIG.prims(c, { pose, expr: 'happy', look: 0, detach: { armL: true, legR: true } }, 'limbs')) !== golden.prims[`${c.id}/${pr.id}/limbs`]) bad.push(`${c.id}/${pr.id}/limbs`);
  }
  assert.deepEqual(bad, []); assert.ok(Object.keys(golden.prims).length > 500);
});
test('joints and mirrored poses are unchanged', () => {
  for (const pr of CP.posesFor('biped')) {
    const p = FIG.fromPreset(cast, pr);
    assert.equal(JSON.stringify(r({ pose: p, J: FIG.joints(cast, p) })), JSON.stringify(golden.joints[pr.id]), pr.id);
    assert.equal(JSON.stringify(r(FIG.mirror(cast, p))), JSON.stringify(golden.joints[pr.id + '/mirror']), pr.id + ' mirror');
  }
});
test('every editing operation gives the same pose as before', () => {
  const e = golden.edits; const run = (f) => { const p = base(); f(p); return JSON.stringify(r(p)); };
  assert.equal(run((p) => FIG.edit(cast, p, 'ik:armR', [40, -20], { bend: 1 })), JSON.stringify(e.ik));
  assert.equal(run((p) => FIG.edit(cast, p, 'ik:legL', [900, 900], { bend: 1 })), JSON.stringify(e.ikFar));
  assert.equal(run((p) => FIG.edit(cast, p, 'up:armL', [-30, 50])), JSON.stringify(e.upper));
  assert.equal(run((p) => FIG.edit(cast, p, 'ik:legR', [30, 120], { rotate: true })), JSON.stringify(e.lower));
  assert.equal(run((p) => FIG.flipBend(cast, p, 'armR')), JSON.stringify(e.flip));
  assert.equal(run((p) => FIG.edit(cast, p, 'torso', [30, -90])), JSON.stringify(e.torso));
  assert.equal(run((p) => FIG.edit(cast, p, 'head', [40, -150])), JSON.stringify(e.head));
  assert.equal(JSON.stringify(['armL', 'armR', 'legL', 'legR'].map((l) => FIG.bendOf(cast, FIG.joints(cast, base()), l))), JSON.stringify(e.bend));
});
