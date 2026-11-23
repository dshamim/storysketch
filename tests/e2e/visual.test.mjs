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
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs await page.addStyleTag({ content: STILL });
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
  'page-notes-open': `${classroom} select([]); document.querySelector('#toggle-notes').click();`,
  'tab-layers': `${classroom} select([pg().items[3].id]); document.querySelector('[data-tab="tab-layers"]').click();`,
  'details-look-figure': `${classroom} select([pg().items.find((i) => i.cast === 'teacher').id]); showDetails();`,
  'details-pose-figure': `${classroom} select([pg().items.find((i) => i.cast === 'teacher').id]); showDetails(); document.querySelector('#dtab-pose').click();`,
  'details-arrange-several': `${classroom} select(pg().items.filter((i) => ['table', 'bookopen'].includes(i.kind) || i.cast === 'lily').map((i) => i.id)); showDetails(); document.querySelector('#dtab-arrange').click();`,
  'ribbon-pose-popover': `${classroom} select([pg().items.find((i) => i.cast === 'teacher').id]); document.querySelector('[data-rb="pose"]').click();`,
  'ribbon-line-up-menu': `${classroom} select(pg().items.filter((i) => ['table', 'bookopen'].includes(i.kind) || i.cast === 'lily').map((i) => i.id)); document.querySelector('[data-rb="menu-align"]').click();`,
  'ribbon-position-menu': `${classroom} select([pg().items.find((i) => i.kind === 'table').id]); document.querySelector('[data-rb="menu-position"]').click();`,
  'text-tab': `${classroom} select([]); document.querySelector('#rail-text').click();`,
  'text-editing': `${classroom} select([]); document.querySelector('#rail-text').click(); addText(TXT.PRESETS[1]); document.querySelector('#text-input').value = 'Welcome back, class!'; document.querySelector('#text-input').dispatchEvent(new Event('input')); document.querySelector('#text-input').setSelectionRange(8, 8); renderOverlay();`,
  'text-rotated-styled': `${classroom} addItem(TXT.make({ text: 'Let us read\\nthe story', size: 56, align: 'center', color: '#2f6fd6', colors: 'lines', w: 420 }, 500, 640)); pg().items.at(-1).rot = -8; setPreview(true); renderAll(); select([pg().items.at(-1).id]);`,
  'details-look-text': `${classroom} addItem(TXT.make({ text: 'Reading is fun', size: 56, align: 'center' }, 500, 640)); renderAll(); select([pg().items.at(-1).id]); showDetails();`,
  'shapes-tab': `${classroom} select([]); document.querySelector('#rail-shapes').click();`,
  'shapes-styled': `${classroom} addItem(SHP.make('box', 260, 640, { w: 260, h: 120, fill: 'colour', fillColor: '#ffd966', text: 'Our class', textSize: 44 })); addItem(SHP.make('circle', 560, 640, { w: 130, h: 130, fill: 'hatch', fillColor: '#2f6fd6', dash: 'dashed' })); addItem(SHP.make('triangle', 760, 640, { fill: 'solid', fillColor: '#e0402f' })); addItem(SHP.make('double', 500, 520, { pts: [[-180, 0], [180, 0]], dash: 'dotted' })); pg().items.at(-1).rot = -6; setPreview(true); renderAll(); select([]);`,
  'details-look-shape': `${classroom} addItem(SHP.make('box', 500, 640, { fill: 'colour', text: 'Hello' })); renderAll(); select([pg().items.at(-1).id]); showDetails();`,
  'chalk-styled': `restore(STORE.fresh('project:sample-chalkboard')); app.page = 0; setPreview(true); renderAll(); select([]);`,
  'animals-dog-selected': `restore(STORE.fresh('project:sample-animals')); app.page = 0; setPreview(true); renderAll(); select([pg().items.find((i) => i.cast === 'rex').id]);`,
  'designer-panel': `${classroom} select([]); openDesigner('teacher');`,
  'popover-export': `${classroom} select([]); document.querySelector('#open-export').click();`,
  'menu-file': `${classroom} select([]); document.querySelector('#btn-file').click();`,
  'menu-edit-selection': `${classroom} select([pg().items[3].id]); document.querySelector('#btn-edit').click();`,
  'flyout-collapsed': `${classroom} select([]); document.querySelector('#rail-cast').click();`,
  'page-menu': `${classroom} select([]); document.querySelector('#page-menu-btn').click();`,
  'tab-addons': `${classroom} select([]); document.querySelector('#rail-addons').click();`,
  'start-screen': `${classroom} select([]); showStart(true);`,
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
