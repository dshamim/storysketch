// Visual baselines of the editor's key states. They protect the UI while the code behind it is restructured:
// the pixels must not change unless a change is intended (then regenerate with UPDATE_BASELINES=1 and review the diff).
import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { ROOT } from '../helpers/sandbox.mjs';
import { compare, baselinesApply, STILL, platform } from '../helpers/visual.mjs';

let chromium; try { ({ chromium } = await import('playwright-core')); } catch { /* not installed */ }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;
let browser; try { browser = chromium && await chromium.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] }); } catch { /* no browser */ }
const skip = !browser ? 'no Chromium available' : !baselinesApply() ? `baselines were made on another platform (this is ${platform()}); regenerate with UPDATE_BASELINES=1` : false;

async function open(setup) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.addStyleTag({ content: STILL });
  // item ids seed the hand-drawn wobble, so they must be the same on every run
  await page.evaluate(() => { localStorage.clear(); let n = 0; U.uid = () => 'u' + (++n).toString(36); });
  await page.evaluate(setup); await page.waitForTimeout(350);
  return { page, errs };
}
const classroom = `restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll();`;
const STATES = {
  'classroom-figure-selected': `${classroom} select([pg().items.find((i) => i.cast === 'teacher').id]);`,
  'classroom-prop-selected': `${classroom} select([pg().items.find((i) => i.kind === 'table').id]);`,
  'classroom-several-selected': `${classroom} select(pg().items.filter((i) => ['table', 'bookopen'].includes(i.kind) || i.cast === 'lily').map((i) => i.id));`,
  'classroom-nothing-selected': `${classroom} select([]);`,
  'tab-props': `${classroom} select([]); document.querySelector('[data-tab="tab-props"]').click();`,
  'tab-pages': `${classroom} select([]); document.querySelector('[data-tab="tab-page"]').click();`,
  'tab-layers': `${classroom} select([pg().items[3].id]); document.querySelector('[data-tab="tab-layers"]').click();`,
  'chalk-styled': `restore(STORE.fresh('project:sample-chalkboard')); app.page = 0; setPreview(true); renderAll(); select([]);`,
  'animals-dog-selected': `restore(STORE.fresh('project:sample-animals')); app.page = 0; setPreview(true); renderAll(); select([pg().items.find((i) => i.cast === 'rex').id]);`,
  'dialog-designer': `${classroom} select([]); document.querySelector('#open-designer').click();`,
  'dialog-export': `${classroom} select([]); document.querySelector('#open-export').click();`,
  'dialog-plugins': `${classroom} select([]); document.querySelector('#open-plugins').click();`,
  'dialog-new': `${classroom} select([]); document.querySelector('#new').click();`,
};
for (const [name, setup] of Object.entries(STATES)) {
  test(`visual: ${name}`, { skip }, async () => {
    const { page, errs } = await open(setup);
    const r = await compare(page, name);
    await page.close();
    assert.deepEqual(errs, []);
    assert.ok(!r.missing, `no baseline for ${name} (run with UPDATE_BASELINES=1)`);
    assert.ok(r.ok, `${name}: ${(r.ratio * 100).toFixed(3)}% of pixels differ (see tests/e2e/__actual__/${name}.png)`);
  });
}
test('visual: ui-kit page (all components, tokens and icons)', { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url.replace('index.html', 'docs/ui-kit.html')); await page.waitForFunction(() => document.getElementById('ui-sprite')); await page.addStyleTag({ content: STILL }); await page.waitForTimeout(300);
  const r = await compare(page, 'ui-kit', { fullPage: true }); await page.close();
  assert.deepEqual(errs, []); assert.ok(!r.missing, 'no baseline for ui-kit (run npm run update:baselines)'); assert.ok(r.ok, `ui-kit: ${(r.ratio * 100).toFixed(3)}% of pixels differ`);
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
