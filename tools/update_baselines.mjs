// Regenerates the visual baselines (tests/e2e/baselines/*.png) from the current UI. Review the changed images before committing:
// only do this for an intended change to how the editor looks.
//   npm run update:baselines
import { spawnSync } from 'node:child_process'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync(process.execPath, ['--test', 'tests/e2e/visual.test.mjs'], { cwd: root, stdio: 'inherit', env: { ...process.env, UPDATE_BASELINES: '1' } });
process.exit(r.status ?? 1);
