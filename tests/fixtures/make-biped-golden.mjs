// Pins the biped skeleton's exact behaviour: every starter character × every preset pose (hash of the drawn
// primitives), plus joints and IK / mirror / flip results. First generated from the monolithic pre-rig figure.js
// (then ported to the rig API and confirmed byte-identical), so moving the biped into a rig can't change anything.
// Regenerate ONLY for an intended change:   node tests/fixtures/make-biped-golden.mjs [out.json]
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { createApp } from '../helpers/sandbox.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const { CP, FIG, STORE } = await createApp();
const sha = (v) => crypto.createHash('sha1').update(JSON.stringify(v)).digest('hex').slice(0, 16);
const r = (v) => JSON.parse(JSON.stringify(v), (k, x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x));
const out = { prims: {}, joints: {}, edits: {} };
for (const c of STORE.starterCast()) for (const pr of CP.posesFor('biped')) {
  const pose = FIG.fromPreset(c, pr);
  out.prims[`${c.id}/${pr.id}`] = sha(FIG.prims(c, { pose, expr: pr.expr || 'happy', look: 0, detach: {} }, 'main'));
  out.prims[`${c.id}/${pr.id}/limbs`] = sha(FIG.prims(c, { pose, expr: 'happy', look: 0, detach: { armL: true, legR: true } }, 'limbs'));
}
const c = STORE.starterCast()[0];
for (const pr of CP.posesFor('biped')) { const p = FIG.fromPreset(c, pr); out.joints[pr.id] = { pose: r(p), J: r(FIG.joints(c, p)) }; out.joints[pr.id + '/mirror'] = r(FIG.mirror(c, p)); }
const base = () => FIG.fromPreset(c, CP.posesFor('biped').find((p) => p.id === 'wave'));
let p = base(); FIG.edit(c, p, 'ik:armR', [40, -20], { bend: 1 }); out.edits.ik = r(p);
p = base(); FIG.edit(c, p, 'ik:legL', [900, 900], { bend: 1 }); out.edits.ikFar = r(p);
p = base(); FIG.edit(c, p, 'up:armL', [-30, 50]); out.edits.upper = r(p);
p = base(); FIG.edit(c, p, 'ik:legR', [30, 120], { rotate: true }); out.edits.lower = r(p);
p = base(); FIG.flipBend(c, p, 'armR'); out.edits.flip = r(p);
p = base(); FIG.edit(c, p, 'torso', [30, -90]); out.edits.torso = r(p);
p = base(); FIG.edit(c, p, 'head', [40, -150]); out.edits.head = r(p);
out.edits.bend = ['armL', 'armR', 'legL', 'legR'].map((l) => FIG.bendOf(c, FIG.joints(c, base()), l));
fs.writeFileSync(process.argv[2] || path.join(here, 'biped-golden.json'), JSON.stringify(out));
console.log('wrote biped-golden.json', Object.keys(out.prims).length, 'prim hashes');
