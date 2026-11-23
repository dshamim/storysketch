// Lighthouse accessibility audit of many editor states (snapshot mode).
//   npm i --no-save lighthouse puppeteer-core     (kept out of package.json: it is large, and the checks in tests/e2e/a11y.test.mjs always run)
//   node tools/a11y-audit.mjs            desktop (1440 x 900)
//   node tools/a11y-audit.mjs touch      a tablet held upright (820 x 1180, finger)
// Serves the project, drives it with puppeteer, prints the accessibility score and failing audits for each state, and exits with 1 if any state scores under 95.
// Set CHROME_PATH to use another Chrome; by default Playwright's Chromium is used if it is installed.
import puppeteer from 'puppeteer-core'; import { startFlow } from 'lighthouse'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const ROOT = process.env.STORYSKETCH_ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((r) => srv.listen(0, r)); const url = `http://localhost:${srv.address().port}/index.html`;
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), '.cache/ms-playwright'); const d = fs.existsSync(base) && fs.readdirSync(base).filter((x) => x.startsWith('chromium-')).sort().pop();
  const sub = d && fs.readdirSync(path.join(base, d)).find((x) => x.startsWith('chrome-')); if (!sub) throw new Error('No Chrome found: set CHROME_PATH');
  return path.join(base, d, sub, 'chrome');
}
const exe = findChrome();
const touch = process.argv[2] === 'touch';
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox', '--disable-gpu'], defaultViewport: touch ? { width: 820, height: 1180, hasTouch: true, isMobile: false } : { width: 1440, height: 900 } });
const page = await browser.newPage();
await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => { hideStart(); localStorage.clear(); restore(STORE.fresh('project:sample-classroom')); app.page = 0; renderAll(); select([]); });
const flow = await startFlow(page, { config: { extends: 'lighthouse:default', settings: { onlyCategories: ['accessibility'], formFactor: touch ? 'mobile' : 'desktop', screenEmulation: { disabled: true } } } });
const DESKTOP = [
  ['nothing selected', `select([]);`],
  ['figure selected', `select([pg().items.find((i) => i.cast === 'teacher').id]);`],
  ['details open', `showDetails();`],
  ['pose menu', `document.querySelector('[data-rb="pose"]').click();`],
  ['designer', `UI.closePopover(false); openDesigner('teacher');`],
  ['shapes tab', `closeDesigner(); hideDetails(); setTab('tab-shapes'); showFlyout();`],
  ['text tab', `setTab('tab-text');`], ['layers tab', `setTab('tab-layers');`], ['add-ons tab', `setTab('tab-addons');`], ['props tab', `setTab('tab-props');`],
  ['file menu', `document.querySelector('#btn-file').click();`],
  ['export', `UI.closePopover(false); document.querySelector('#open-export').click();`],
  ['text selected + details', `UI.closePopover(false); addItem(TXT.make({ text: 'Hello', size: 60 }, 300, 150)); showDetails();`],
  ['shape selected + details', `addItem(SHP.make('box', 500, 300, { fill: 'colour', text: 'Words' }));`],
  ['line selected + details', `addItem(SHP.make('arrow', 500, 300));`],
  ['several selected + details', `select(pg().items.slice(0, 3).map((i) => i.id));`],
  ['a tip showing', `hideDetails(); localStorage.setItem('storysketch/hints-mode', 'on'); select([]); showHint('handles');`],
  ['search open', `closeHint(true); openPalette(); document.querySelector('#pal-input').value = 'add'; renderPalette();`],
  ['shortcut sheet', `closeOverlay('palette'); openShortcuts();`],
  ['start screen', `closeOverlay('shortcuts'); showStart(true);`],
];
const TABLET = [
  ['nothing selected', `select([]);`],
  ['figure selected + details', `select([pg().items.find((i) => i.cast === 'teacher').id]); showDetails();`],
  ['library sheet', `hideDetails(); setTab('tab-cast'); showFlyout();`], ['shapes sheet', `setTab('tab-shapes');`], ['layers sheet', `setTab('tab-layers');`],
  ['search open', `hideFlyout(); openPalette();`], ['shortcut sheet', `closeOverlay('palette'); openShortcuts();`],
  ['export', `closeOverlay('shortcuts'); document.querySelector('#open-export').click();`],
];
const STATES = touch ? TABLET : DESKTOP;
const results = [];
for (const [name, js] of STATES) {
  await page.evaluate(js); await new Promise((r) => setTimeout(r, 400));
  await flow.snapshot({ name });
}
const flowResult = await flow.createFlowResult();
let min = 1;
for (const step of flowResult.steps) {
  const lhr = step.lhr; const score = lhr.categories.accessibility.score; min = Math.min(min, score);
  const fails = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual');
  console.log(`${String(Math.round(score * 100)).padStart(3)}  ${step.name}${fails.length ? '  <- ' + fails.map((a) => a.id + '(' + ((a.details && a.details.items) || []).length + ')').join(', ') : ''}`);
  for (const a of fails) for (const it of ((a.details && a.details.items) || []).slice(0, 4)) console.log('       ', a.id, '|', (it.node && (it.node.snippet || it.node.selector) || '').slice(0, 130), '|', (it.node && it.node.explanation || '').replace(/\s+/g, ' ').slice(0, 160));
}
console.log('lowest score', Math.round(min * 100));
await browser.close(); srv.close();
if (min < 0.95) process.exit(1);
