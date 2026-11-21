// The Crayon style must look exactly like it did before it became a plugin (Crayon Poser v0.20.0).
// Fixtures: see tests/fixtures/make-crayon-golden.mjs.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path';
import { createApp, ROOT } from '../helpers/sandbox.mjs';
const { RENDER } = await createApp();
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/fixtures', f), 'utf8'));
const scenes = read('scenes.json'), golden = read('crayon-golden.json');

test('crayon filter definition is byte-identical to v0.20.0', () => {
  assert.ok(RENDER.defs().includes(golden.__defs));
});
for (const [name, sc] of Object.entries(scenes)) {
  for (const mode of ['colour', 'grey']) {
    test(`crayon output is byte-identical to v0.20.0: ${name} (${mode})`, () => {
      const out = RENDER.render(sc.prims, { mode, paper: '#ffffff', seed: sc.seed, idp: 'g', n: 0, style: 'crayon' });
      assert.equal(out, golden[name][mode]);
    });
  }
}
