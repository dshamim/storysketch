// Regenerates crayon-golden.json from a checkout of the ORIGINAL crayon renderer (Crayon Poser v0.20.0).
// The golden file pins the Crayon style's exact output, so refactors can't silently change the look.
//   node tests/fixtures/make-crayon-golden.mjs /path/to/crayon-poser-v0.20.0
// (needs tests/fixtures/scenes.json, produced by `node tests/fixtures/make-scenes.mjs`)
import vm from 'node:vm'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const old = process.argv[2]; if (!old) throw new Error('usage: make-crayon-golden.mjs <old crayon-poser dir>');
const ctx = vm.createContext({ console, window: {} });
for (const f of ['js/util.js', 'js/draw.js']) vm.runInContext(fs.readFileSync(path.join(old, f), 'utf8'), ctx, { filename: f });
const scenes = JSON.parse(fs.readFileSync(path.join(here, 'scenes.json'), 'utf8'));
const out = {};
for (const [name, sc] of Object.entries(scenes)) {
  out[name] = {};
  for (const mode of ['colour', 'grey']) {
    ctx.__in = { prims: sc.prims, c: { mode, paper: '#ffffff', seed: sc.seed, idp: 'g', n: 0 } };
    out[name][mode] = vm.runInContext('RENDER.crayon(__in.prims, __in.c)', ctx);
  }
}
out.__defs = vm.runInContext('RENDER.DEFS', ctx);
fs.writeFileSync(path.join(here, 'crayon-golden.json'), JSON.stringify(out));
console.log('wrote crayon-golden.json', Object.keys(out).length - 1, 'scenes');
