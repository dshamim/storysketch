// Builds scenes.json: clean primitive lists (a hand-made shape set + real figures/props from the plugin set).
// Primitives don't depend on the style, so this is generated from the current code and reused for any style.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { createApp } from '../helpers/sandbox.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const { CP, FIG, Pen, get } = await createApp();
const shapes = new Pen({});
shapes.line([[0, 0], [80, 10], [160, -5]], { stroke: '#333333', w: 4.5 });
shapes.curve([[0, 40], [40, 20], [90, 60], [150, 30]], { stroke: '#2f6fd6', w: 5 });
shapes.rect(10, 80, 120, 60, { stroke: '#d6402f', w: 4.5, fill: '#fbc02d' });
shapes.circ(200, 110, 30, { stroke: '#43a047', w: 4, hatch: '#43a047', hg: 6, ha: -40, halpha: 0.6 });
shapes.poly([[20, 160], [120, 160], [120, 220], [20, 220]], { stroke: '#555555', w: 4, fill: 'paper' });
shapes.poly([[40, 170], [100, 170], [100, 210], [40, 210]], { stroke: '#8e24aa', w: 3, hole: [[55, 180], [85, 180], [85, 200], [55, 200]], fill: '#8e24aa', op: 0.5 });
shapes.line([[0, 250], [200, 250]], { stroke: '#000000', w: 3 }); // lone horizontal line (filter-region edge case)
const scenes = { shapes: { seed: 'shapes', prims: shapes.o } };
const chars = CP.characters.slice(0, 3);
chars.forEach((c, i) => {
  const cast = get('STORE.normalizeCast')(JSON.parse(JSON.stringify(c)));
  const pr = CP.posesFor('biped').find((p) => p.id === 'wave') || CP.posesFor('biped')[0];
  const inst = { pose: FIG.fromPreset(cast, pr), expr: 'happy', look: 0, detach: {} };
  scenes[`figure-${c.id}`] = { seed: `fig-${c.id}`, prims: FIG.prims(cast, inst, 'main') };
});
for (const id of ['table', 'drum', 'bookopen']) {
  const item = { id: 'it-' + id, kind: id };
  scenes[`prop-${id}`] = { seed: item.id, prims: get('propPrims')(item) };
}
fs.writeFileSync(path.join(here, 'scenes.json'), JSON.stringify(scenes));
console.log('wrote scenes.json', Object.keys(scenes));
