// Pixel-comparison "baseline" screenshots without extra dependencies (playwright-core has no toHaveScreenshot).
// A screenshot is compared with tests/e2e/baselines/<name>.png inside the browser (canvas diff).
//   UPDATE_BASELINES=1 node --test tests/e2e/visual.test.mjs     (re)writes the baselines
// Baselines depend on the OS font rendering, so they are only compared on the platform that made them (see baselines/PLATFORM).
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { ROOT } from './sandbox.mjs';

export const BASE = path.join(ROOT, 'tests/e2e/baselines');
export const ACTUAL = path.join(ROOT, 'tests/e2e/__actual__');
export const platform = () => `${os.platform()}-${os.arch()}`;
export const STILL = '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; scroll-behavior: auto !important; }';

/** Compare a viewport screenshot with its baseline. Returns { ok, ratio, missing }. */
export async function compare(page, name, { tolerance = 0.002, channel = 10 } = {}) {
  const shot = await page.screenshot({ animations: 'disabled' });
  const file = path.join(BASE, name + '.png');
  if (process.env.UPDATE_BASELINES) { fs.mkdirSync(BASE, { recursive: true }); fs.writeFileSync(file, shot); fs.writeFileSync(path.join(BASE, 'PLATFORM'), platform()); return { ok: true, ratio: 0, updated: true }; }
  if (!fs.existsSync(file)) return { ok: false, missing: true, ratio: 1 };
  const ratio = await page.evaluate(async ([a, b, channel]) => {
    const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const [A, B] = await Promise.all([load(a), load(b)]);
    if (A.width !== B.width || A.height !== B.height) return 1;
    const px = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
    const da = px(A), db = px(B); let diff = 0;
    for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) > channel || Math.abs(da[i + 1] - db[i + 1]) > channel || Math.abs(da[i + 2] - db[i + 2]) > channel) diff++;
    return diff / (da.length / 4);
  }, ['data:image/png;base64,' + fs.readFileSync(file).toString('base64'), 'data:image/png;base64,' + shot.toString('base64'), channel]);
  const ok = ratio <= tolerance;
  if (!ok) { fs.mkdirSync(ACTUAL, { recursive: true }); fs.writeFileSync(path.join(ACTUAL, name + '.png'), shot); }
  return { ok, ratio };
}
// SKIP_VISUAL=1 turns the comparison off (CI runners render fonts differently from the machine that made the baselines)
export const baselinesApply = () => !process.env.SKIP_VISUAL && (process.env.UPDATE_BASELINES || (fs.existsSync(path.join(BASE, 'PLATFORM')) && fs.readFileSync(path.join(BASE, 'PLATFORM'), 'utf8').trim() === platform()));
