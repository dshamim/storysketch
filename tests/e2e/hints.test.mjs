// One-time tips: off in automated browsers unless asked, show once at the right moment, never block anything, finish when the thing is done.
// (Every test helper in the suite leaves tips alone; the three first-run tasks switch them ON, so a tip that got in the way would fail them.)
import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { ROOT } from '../helpers/sandbox.mjs';

let chromium; try { ({ chromium } = await import('playwright-core')); } catch { /* not installed */ }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;
let browser; try { browser = chromium && await chromium.launch({ args: ['--no-sandbox'] }); } catch { /* no browser */ }
const skip = browser ? false : 'no Chromium available';



const LANDSCAPE = { viewport: { width: 1180, height: 820 }, hasTouch: true, deviceScaleFactor: 1 }, PORTRAIT = { viewport: { width: 820, height: 1180 }, hasTouch: true, deviceScaleFactor: 1 };
async function open(setup = CLASSROOM, ctx = { viewport: { width: 1440, height: 900 } }, hints = 'on') {
  const context = await browser.newContext(ctx); const page = await context.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate((h) => { hideStart(); localStorage.clear(); if (h) localStorage.setItem('storysketch/hints-mode', h); }, hints); await page.evaluate(setup); await page.waitForTimeout(150);
  return { page, errs, context };
}
const CLASSROOM = `restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll(); commit();`;
const teacher = (page) => page.evaluate(() => pg().items.find((i) => i.cast === 'teacher').id);
const visible = (page) => page.evaluate(() => !document.querySelector('#hint').hidden);
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('storysketch/hints') || '{}'));
const pick = async (page, id) => { await page.evaluate((id) => select([id]), id); await page.waitForTimeout(900); };

test('an automated browser gets no tips by default (so no other test is disturbed)', { skip }, async () => {
  const { page, context, errs } = await open(CLASSROOM, undefined, null); await pick(page, await teacher(page)); assert.equal(await visible(page), false); assert.equal(await page.evaluate(() => hintsEnabled()), false);
  await page.evaluate(() => localStorage.setItem('storysketch/hints-mode', 'on')); assert.equal(await page.evaluate(() => hintsEnabled()), true, "unless asked: 'on'"); assert.deepEqual(errs, []); await context.close();
});

test('the first time a figure is picked a small tip shows; Got it finishes it for good (even after a reload)', { skip }, async () => {
  const { page, context, errs } = await open(); const id = await teacher(page); await page.evaluate(() => select([])); await pick(page, id);
  assert.equal(await visible(page), true); assert.match(await page.locator('#hint-text').innerText(), /Drag the coloured dots/); assert.equal(await page.locator('#hint').getAttribute('role'), 'status');
  await page.click('#hint-ok'); assert.equal(await visible(page), false); assert.equal((await store(page)).handles, 1);
  await page.evaluate(() => select([])); await pick(page, id); assert.equal(await visible(page), false, 'not again');
  await page.reload(); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); await page.evaluate(() => select([pg().items.find((i) => i.cast === 'teacher').id])); await page.waitForTimeout(900); assert.equal(await visible(page), false, 'not after a reload either');
  assert.deepEqual(errs, []); await context.close();
});

test('doing the thing finishes the tip: dragging a handle, double-clicking a text; opening search finishes the search tip', { skip }, async () => {
  const { page, context, errs } = await open(`${CLASSROOM} addItem(TXT.make({ text: 'Hello', size: 70 }, 250, 140)); select([]);`); const id = await teacher(page);
  await pick(page, id); assert.equal(await visible(page), true); const h = await page.locator('#overlay [data-h="rot"]').boundingBox(); await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(h.x + 60, h.y + 20, { steps: 4 }); await page.mouse.up();
  assert.equal(await visible(page), false, 'the tip goes when a handle is dragged'); assert.equal((await store(page)).handles, 1);
  const t = await page.evaluate(() => pg().items.find((i) => i.type === 'text').id); await page.evaluate(() => select([])); await pick(page, t); assert.equal(await visible(page), true); assert.match(await page.locator('#hint-text').innerText(), /Double-click a text/);
  await page.evaluate((id) => startEdit(id), t); assert.equal(await visible(page), false, 'editing the text finishes its tip'); assert.equal((await store(page)).text, 1); await page.keyboard.press('Escape');
  await page.evaluate(() => { for (let i = 0; i < 8; i++) commit(); }); await page.waitForTimeout(900); assert.equal(await visible(page), true, 'after a while of working: the search tip'); assert.match(await page.locator('#hint-text').innerText(), /Ctrl\+K/);
  await page.keyboard.press('Control+k'); assert.equal(await visible(page), false); assert.equal((await store(page)).search, 1, 'opening search finishes it'); await page.keyboard.press('Escape');
  assert.deepEqual(errs, []); await context.close();
});

test('a tip that is ignored twice is finished; a tip never shows while something else is going on; Help ▸ Show the tips again starts over', { skip }, async () => {
  const { page, context, errs } = await open(); const id = await teacher(page);
  await pick(page, id); await page.evaluate(() => closeHint(false)); assert.equal((await store(page)).handles, 'shown1'); await page.evaluate(() => select([])); await pick(page, id); assert.equal(await visible(page), true, 'once more'); await page.evaluate(() => closeHint(false)); assert.equal((await store(page)).handles, 1, 'then it is finished');
  await page.click('#btn-help'); await page.click('[data-act="hints-reset"]'); assert.deepEqual(await store(page), {}, 'reset'); assert.equal(await page.evaluate(() => localStorage.getItem('storysketch/hints-mode')), 'on', 'but the test switch is untouched');
  await page.evaluate(() => select([])); await page.keyboard.press('Control+k'); await page.evaluate((id) => select([id]), id); await page.waitForTimeout(900); assert.equal(await visible(page), false, 'not while search is open'); await page.keyboard.press('Escape');
  await page.evaluate(() => { select([]); const t = TXT.make({ text: 'x' }, 100, 100); addItem(t); startEdit(t.id); showHint('handles'); }); assert.equal(await visible(page), false, 'not while typing');
  assert.deepEqual(errs, []); await context.close();
});

test('a tip never covers the tool bar, the tab bar or the page strip, and only the card takes taps (tablet, both ways up)', { skip }, async () => {
  for (const vp of [LANDSCAPE, PORTRAIT]) {
    const { page, context, errs } = await open(CLASSROOM, vp); const id = await teacher(page); await page.evaluate(() => select([])); await pick(page, id); assert.equal(await visible(page), true);
    const r = await page.evaluate(() => { const box = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? [b.left, b.top, b.right, b.bottom] : null; }; return { hint: box('#hint'), others: ['#toolbar', '.railwrap', '#filmbar', '#topbar', '#ribbon', '#edit-done'].map((s) => [s, box(s)]) }; });
    const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; for (const [s, b] of r.others) if (b) assert.equal(hit(r.hint, b), false, `${vp.viewport.width}: the tip covers ${s}`);
    // a tap beside the card reaches the page; the card itself takes only its own button
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#hint')).pointerEvents), 'auto'); const near = await page.evaluate(() => { const b = document.querySelector('#hint').getBoundingClientRect(); return document.elementFromPoint(b.right + 20, b.top + 10)?.id || document.elementFromPoint(b.right + 20, b.top + 10)?.tagName; }); assert.notEqual(near, 'hint-text');
    // the tip is finger sized too
    const small = await page.evaluate(() => [...document.querySelectorAll('#hint button')].map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); })); assert.ok(small.every((s) => s >= 43.5), 'Got it is 44 px: ' + small);
    assert.deepEqual(errs, []); await context.close();
  }
});

test('empty states say where to look: "from the left" with a side panel, "from the bar below" on a tablet held upright; mouse and touch wording', { skip }, async () => {
  const blank = `app.P = STORE.fresh('blank'); renderAll(); setTab('tab-layers'); showFlyout();`;
  const d = await open(blank); const vis = (sel) => d.page.evaluate((s) => [...document.querySelectorAll(s)].some((e) => e.getBoundingClientRect().width > 0), sel);
  assert.equal(await d.page.locator('#empty-hint').isVisible(), true); assert.equal(await vis('#empty-hint .where-left'), true); assert.equal(await vis('#empty-hint .where-below'), false);
  assert.match(await d.page.locator('#layers').innerText(), /Nothing on this page yet.*from the left/); await d.page.evaluate(() => setTab('tab-shapes')); assert.equal(await vis('#tab-shapes .hint-mouse'), true); assert.equal(await vis('#tab-shapes .hint-touch'), false, 'a mouse sees the mouse wording'); assert.deepEqual(d.errs, []); await d.context.close();
  const t = await open(blank, PORTRAIT); const vis2 = (sel) => t.page.evaluate((s) => [...document.querySelectorAll(s)].some((e) => e.getBoundingClientRect().width > 0), sel);
  assert.equal(await vis2('#empty-hint .where-left'), false); assert.equal(await vis2('#empty-hint .where-below'), true); assert.match(await t.page.locator('#empty-hint').innerText(), /from the bar below/);
  await t.page.evaluate(() => setTab('tab-shapes')); assert.equal(await vis2('#tab-shapes .hint-touch'), true, 'a finger sees the touch wording'); assert.equal(await vis2('#tab-shapes .hint-mouse'), false); assert.deepEqual(t.errs, []); await t.context.close();
});

test('motion is short, and with reduced motion the sheets, tips and overlays do not animate', { skip }, async () => {
  const a = await open(CLASSROOM, { ...PORTRAIT, reducedMotion: 'reduce' }); await a.page.evaluate(() => { setTab('tab-cast'); showFlyout(); showHint('search'); });
  const dur = (page) => page.evaluate(() => [getComputedStyle(document.querySelector('#left')).animationDuration, getComputedStyle(document.querySelector('#hint')).animationDuration]);
  assert.deepEqual(await dur(a.page), ['0s', '0s'], 'reduced motion: none'); await a.context.close();
  const b = await open(CLASSROOM, PORTRAIT); await b.page.evaluate(() => { setTab('tab-cast'); showFlyout(); showHint('search'); }); const [s1, s2] = await dur(b.page); assert.ok(parseFloat(s1) > 0 && parseFloat(s1) <= 0.25 && parseFloat(s2) > 0 && parseFloat(s2) <= 0.25, 'otherwise short (a quarter second at most): ' + s1 + ' ' + s2); await b.context.close();
});

test('the tip never covers the button that brings the library back (library folded, desktop and 1024 px tablet)', { skip }, async () => {
  for (const [vp, label] of [[{ viewport: { width: 1440, height: 900 } }, 'desktop'], [{ viewport: { width: 1024, height: 768 }, hasTouch: true }, '1024 tablet']]) {
    const { page, context, errs } = await open(CLASSROOM, vp); await page.evaluate(() => { hideFlyout(); select([]); }); await pick(page, await teacher(page)); assert.equal(await visible(page), true, label);
    const r = await page.evaluate(() => { const b = (s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); return { shown: !!r.width, box: [r.left, r.top, r.right, r.bottom] }; }; return { hint: b('#hint'), fly: b('#fly-open') }; });
    assert.equal(r.fly.shown, true, 'the button is there'); const [a, c] = [r.hint.box, r.fly.box]; assert.equal(a[0] < c[2] && c[0] < a[2] && a[1] < c[3] && c[1] < a[3], false, `${label}: the tip must not cover "Show the library panel" ${JSON.stringify(r)}`);
    assert.deepEqual(errs, []); await context.close();
  }
});

test('the pose tip is for figures: picking a box first does not use it up, and a box or a line has none', { skip }, async () => {
  const { page, context, errs } = await open(`${CLASSROOM} addItem(SHP.make('box', 300, 150, { w: 160, h: 90 })); select([]);`);
  const box = await page.evaluate(() => pg().items.find((i) => i.type === 'shape').id); await pick(page, box); assert.equal(await visible(page), false, 'no pose tip for a box'); assert.deepEqual(await store(page), {});
  await page.evaluate(() => select([])); await pick(page, await teacher(page)); assert.equal(await visible(page), true, 'the figure still gets it'); assert.match(await page.locator('#hint-text').innerText(), /pose a figure/);
  assert.deepEqual(errs, []); await context.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
