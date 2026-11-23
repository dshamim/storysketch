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

async function open(setup, ctxOpts = null) {
  const ctx = ctxOpts ? await browser.newContext({ ...ctxOpts, deviceScaleFactor: 1 }) : null;
  const page = ctx ? await ctx.newPage() : await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }); page._ctx = ctx;
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
  'palette-open': `${classroom} select([]); openPalette(); document.querySelector('#pal-input').value = 'add'; renderPalette();`,
  'shortcut-sheet': `${classroom} select([]); openShortcuts();`,
  'scene-home-day': `restore(STORE.fresh('project:sample-classroom')); app.page = 0; const P = app.P; const prop = (kind, x, y, params = {}, s = 1) => ({ id: U.uid(), type: 'prop', kind, x, y, s, rot: 0, flip: false, mode: 'auto', colors: { ...CP.props[kind].colors }, params: { ...Object.fromEntries((CP.props[kind].params || []).map((q) => [q.key, q.def])), ...params } }); const fig = (cast, x, feet) => { const c = P.cast.find((c) => c.id === cast); return { id: U.uid(), type: 'figure', cast, x, y: feet - (cast === 'teacher' ? 137 : 100), s: 1, rot: 0, flip: false, mode: 'auto', pose: FIG.fromPreset(c, CP.poses.find((p) => p.id === 'stand')), expr: 'happy', look: 0, detach: {} }; }; P.pages[0].items = [prop('scenery-sky', 500, 620, { height: 620 }), prop('scenery-clouds', 280, 130, { count: 2 }), prop('scenery-hills', 500, 620), prop('scenery-ground', 500, 750), prop('home-house', 500, 650, {}, 0.95), prop('scenery-fence', 150, 690, { width: 300 }), prop('scenery-fence', 850, 690, { width: 300 }), prop('scenery-stones', 500, 740, { count: 4 }), fig('teacher', 700, 700), fig('lily', 780, 700)]; restore(P); setPreview(true); renderAll(); select([]);`,
  'font-menu-open': `${classroom} addItem(TXT.make({ text: 'Reading is fun', font: 'nunito', size: 56, align: 'center' }, 500, 640)); renderAll(); select([pg().items.at(-1).id]); document.querySelector('[data-rb="pop-font"]').click();`,
  'fonts-in-crayon': `app.P = STORE.fresh('blank'); app.P.settings.style = 'crayon'; ['patrick-hand', 'comic-neue', 'nunito', 'crimson-pro', 'caveat-brush'].forEach((f, i) => { addItem(TXT.make({ text: 'Reading time ' + (i + 1), font: f, size: 52, align: 'left', weight: i % 2 ? 'bold' : 'normal', color: ['#2f6fd6', '#c62828', '#2e7d32', '#6a1b9a', '#e65100'][i] }, 330, 110 + i * 125)); addItem(TXT.make({ text: 'The quick brown fox, 0123', font: f, size: 24, align: 'left' }, 720, 110 + i * 125)); }); setPreview(true); renderAll(); select([]);`,
  'fonts-in-chalk': `app.P = STORE.fresh('blank'); app.P.settings.style = 'chalk'; app.P.settings.paper = '#2b3a33'; ['comic-neue', 'caveat-brush', 'crimson-pro'].forEach((f, i) => { addItem(TXT.make({ text: 'Good morning ' + (i + 1), font: f, size: 64, align: 'left', color: '#f3f0e6' }, 400, 150 + i * 200)); addItem(TXT.make({ text: 'The quick brown fox', font: f, size: 26, align: 'left', color: '#f3f0e6', weight: 'bold' }, 400, 215 + i * 200)); }); setPreview(true); renderAll(); select([]);`,
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
// tablets: finger-sized controls, the tool bar, the bottom tab bar and sheets (fingers = hasTouch, which makes the page choose touch mode by itself)
const TABLET_SIDEWAYS = { viewport: { width: 1180, height: 820 }, hasTouch: true }, TABLET_UPRIGHT = { viewport: { width: 820, height: 1180 }, hasTouch: true }, TABLET_SMALL = { viewport: { width: 1024, height: 768 }, hasTouch: true };
const teacher = `select([pg().items.find((i) => i.cast === 'teacher').id]);`;
const TOUCH_STATES = {
  'touch-sideways-selected': [TABLET_SIDEWAYS, `${classroom} ${teacher}`],
  'touch-sideways-shapes': [TABLET_SIDEWAYS, `${classroom} select([]); setTab('tab-shapes'); showFlyout();`],
  'touch-upright': [TABLET_UPRIGHT, `${classroom} select([]);`],
  'touch-upright-selected': [TABLET_UPRIGHT, `${classroom} ${teacher}`],
  'touch-upright-library-sheet': [TABLET_UPRIGHT, `${classroom} ${teacher} setTab('tab-cast'); showFlyout();`],
  'touch-upright-designer-sheet': [TABLET_UPRIGHT, `${classroom} ${teacher} openDesigner('teacher');`],
  'touch-upright-search': [TABLET_UPRIGHT, `${classroom} select([]); openPalette(); document.querySelector('#pal-input').value = 'add'; renderPalette();`],
  'touch-small-details-slideover': [TABLET_SMALL, `${classroom} ${teacher} showDetails();`],
};
for (const [name, [ctxOpts, setup]] of Object.entries(TOUCH_STATES)) {
  test(`visual: ${name}`, { skip }, async () => {
    const { page, errs } = await open(setup, ctxOpts); const r = await compare(page, name); await page._ctx.close();
    assert.deepEqual(errs, []); assert.ok(!r.missing, `no baseline for ${name} (run with UPDATE_BASELINES=1)`); assert.ok(r.ok, `${name}: ${(r.ratio * 100).toFixed(3)}% of pixels differ (see tests/e2e/__actual__/${name}.png)`);
  });
}
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
