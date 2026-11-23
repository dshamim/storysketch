// Touch and tablet (phase 6): everything here uses finger input only (taps and touch drags through the browser's touch emulation).
// Native <select> menus and typing letters are the two things headless touch cannot do, so those use Playwright's own helpers; everything else is a real touch.
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

const LANDSCAPE = { viewport: { width: 1180, height: 820 }, hasTouch: true, deviceScaleFactor: 1 }; // a tablet held sideways
const PORTRAIT = { viewport: { width: 820, height: 1180 }, hasTouch: true, deviceScaleFactor: 1 };
async function openTouch(opts = LANDSCAPE, { start = false } = {}) {
  const context = await browser.newContext({ ...opts, acceptDownloads: true }); const page = await context.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  if (!start) await page.evaluate(() => { hideStart(); localStorage.clear(); });
  const cdp = await context.newCDPSession(page);
  return { page, cdp, errs, context };
}
const centre = async (page, sel) => { const l = page.locator(sel).first(); await l.waitFor({ state: 'visible', timeout: 5000 }); const b = await l.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const tap = async (page, sel) => { const [x, y] = await centre(page, sel); await page.touchscreen.tap(x, y); await page.waitForTimeout(60); };
const showTab = async (page, tab) => { const shown = await page.evaluate((t) => app.tab === t && !document.querySelector('#left').hidden, 'tab-' + tab); if (!shown) await tap(page, '#rail-' + tab); }; // tapping the open tab again folds the panel
const tapAt = async (page, x, y) => { await page.touchscreen.tap(x, y); await page.waitForTimeout(60); };
const dragTouch = async (cdp, [x0, y0], [x1, y1], steps = 8) => { // one finger
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= steps; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const dragHandle = async (page, cdp, sel, dx, dy) => { const [x, y] = await centre(page, sel); await dragTouch(cdp, [x, y], [x + dx, y + dy]); await page.waitForTimeout(500); }; // headless Chrome sends no click for a tap that comes within ~0.4 s of a drag; real fingers do, so this only paces the test
const screenOf = (page, x, y) => page.evaluate(([x, y]) => { const m = document.querySelector('#stage').getScreenCTM(); return [x * m.a + m.e, y * m.d + m.f]; }, [x, y]);
const items = (page) => page.evaluate(() => JSON.parse(JSON.stringify(pg().items)));

test('first-run task with a finger only (tablet, landscape): open a sample, add and pose a character, add and turn a text label, draw an arrow, switch to marker, export a PNG', { skip }, async () => {
  const { page, cdp, errs, context } = await openTouch(LANDSCAPE, { start: true });
  // 1. the start screen: tap a sample
  assert.equal(await page.locator('#start').isVisible(), true); await tap(page, '#start-cards [data-start="project:sample-classroom"]');
  assert.equal(await page.locator('#start').isVisible(), false, 'the sample opened'); const n0 = (await items(page)).length; assert.ok(n0 > 3);
  // 2. add a character, then pose it by dragging a hand
  await showTab(page, 'cast'); await tap(page, '#cast-grid [data-add-cast="ahmed"]');
  const mine = () => page.evaluate(() => { const id = app.sel[0]; const it = itemById(id); return it && it.type === 'figure' ? JSON.stringify(it.pose) : null; });
  assert.ok(await mine(), 'the new character is selected'); const pose0 = await mine();
  await dragHandle(page, cdp, '#overlay [data-h^="ik:"]', 50, -60); assert.notEqual(await mine(), pose0, 'dragging a hand with a finger poses it');
  // 3. a text label: tap Text, tap Add a text box, tap the page, type, tap outside to finish; tap it to select; turn it with the round handle
  await showTab(page, 'text'); await tap(page, '#add-textbox'); const [px, py] = await screenOf(page, 140, 80); await tapAt(page, px, py);
  assert.equal(await page.evaluate(() => !!app.edit), true, 'tapping the page with the text tool starts typing'); await page.keyboard.type('Hello');
  const [ox, oy] = await screenOf(page, 140, 700); await tapAt(page, ox, oy); assert.equal(await page.evaluate(() => !!app.edit), false, 'tapping away finishes typing');
  const t = (await items(page)).find((i) => i.type === 'text'); assert.equal(t.text, 'Hello');
  const [tx, ty] = await screenOf(page, t.x, t.y); await tapAt(page, tx, ty); assert.equal(await page.evaluate(() => itemById(app.sel[0])?.type), 'text', 'tap selects the text');
  await dragHandle(page, cdp, '#overlay [data-h="rot"]', 90, 30); assert.notEqual((await items(page)).find((i) => i.type === 'text').rot, 0, 'the round handle turns it');
  // 4. an arrow: Shapes, tap Arrow, drag its end
  await showTab(page, 'shapes'); await tap(page, '[data-shape-add="arrow"]'); const a0 = (await items(page)).find((i) => i.type === 'line');
  assert.ok(a0, 'the arrow is on the page'); await dragHandle(page, cdp, '#overlay [data-h="le-1"]', 70, 90); const a1 = (await items(page)).find((i) => i.type === 'line'); assert.notEqual(a1.rot, a0.rot, 'the end moved with a finger');
  // 5. marker style: tap an empty part of the page first so the page settings show, then the Style menu (a native menu: chosen with the helper)
  const [ex, ey] = await screenOf(page, 700, 60); await tapAt(page, ex, ey); await tap(page, '#style-sel'); await page.selectOption('#style-sel', 'marker'); assert.equal(await page.evaluate(() => app.P.settings.style), 'marker');
  // 6. export a PNG
  await tap(page, '#open-export'); await tap(page, '#ask-row'); const [dl] = await Promise.all([page.waitForEvent('download'), tap(page, '#do-export')]);
  assert.match(dl.suggestedFilename(), /\.png$/);
  assert.deepEqual(errs, []); await context.close();
});

// every control a finger has to hit, measured on screen (a hidden check box is measured by its label)
const SMALL = (page, scope) => page.evaluate((scope) => {
  const out = []; const sel = 'button, select, textarea, summary, input:not([type=hidden]), [role=tab], [role=menuitem], [role=menuitemcheckbox], [role=radio]';
  for (const root of document.querySelectorAll(scope)) for (const el of root.querySelectorAll(sel)) {
    let t = el; if (el.matches('input[type=checkbox], input[type=radio]')) t = el.closest('label') || el; // a check box is hit through its label
    const cs = getComputedStyle(t); if (cs.visibility === 'hidden' || cs.display === 'none') continue; const r = t.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if (t.closest('[hidden]')) continue; if (Math.min(r.width, r.height) < 43.5) out.push(`${scope} ${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || el.dataset.shape || el.dataset.d || '').trim().slice(0, 18)}"`);
  } return out;
}, scope);

test('touch mode: on by itself with a finger, off with a mouse; View ▸ Touch-friendly sizes switches it and it is remembered', { skip }, async () => {
  const mouse = await browser.newPage({ viewport: { width: 1180, height: 820 } }); await mouse.goto(url); await mouse.waitForFunction(() => typeof app !== 'undefined' && app.P);
  assert.equal(await mouse.evaluate(() => document.documentElement.classList.contains('touch')), false, 'a mouse does not get touch sizes'); assert.equal(await mouse.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-control-h').trim()), '32px');
  await mouse.close();
  const { page, context } = await openTouch(); assert.equal(await page.evaluate(() => document.documentElement.classList.contains('touch')), true, 'a finger does');
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-control-h').trim()), '48px');
  await tap(page, '#btn-view'); assert.equal(await page.locator('#menu-touch').getAttribute('aria-checked'), 'true'); await tap(page, '#menu-touch');
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('touch')), false, 'the switch turns it off'); await page.reload(); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('touch')), false, 'and it is remembered');
  await context.close();
  // a mouse user on a touch laptop can switch it on
  const m2 = await browser.newContext({ viewport: { width: 1180, height: 820 } }); const p2 = await m2.newPage(); await p2.goto(url); await p2.waitForFunction(() => typeof app !== 'undefined' && app.P); await p2.evaluate(() => hideStart());
  await p2.click('#btn-view'); await p2.click('#menu-touch'); assert.equal(await p2.evaluate(() => document.documentElement.classList.contains('touch')), true); await m2.close();
});

test('touch sizes: every control in the top bar, ribbon, rail, panels and mini bar is at least 44 px (landscape tablet)', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(() => { restore(STORE.fresh('project:sample-classroom')); app.page = 0; renderAll(); });
  const bad = [];
  for (const scope of ['#topbar', '#rail', '#left', '#filmbar']) bad.push(...await SMALL(page, scope));
  await tap(page, '#cast-grid [data-add-cast="ahmed"]'); await page.waitForTimeout(100); await tap(page, '#details-toggle');
  for (const scope of ['#ribbon', '#minibar', '#right']) bad.push(...await SMALL(page, scope));
  await tap(page, '#ribbon-sel [data-act="design"]'); bad.push(...await SMALL(page, '#right'));        // the designer panel
  await tap(page, '#d-close'); await showTab(page, 'shapes'); await tap(page, '[data-shape-add="box"]'); await page.waitForTimeout(100); bad.push(...await SMALL(page, '#right'), ...await SMALL(page, '#ribbon'));
  await showTab(page, 'text'); bad.push(...await SMALL(page, '#left')); await showTab(page, 'layers'); bad.push(...await SMALL(page, '#left')); await showTab(page, 'addons'); bad.push(...await SMALL(page, '#left'));
  const total = await page.evaluate(() => ['#topbar', '#rail', '#left', '#filmbar', '#ribbon', '#minibar', '#right'].reduce((n, sc) => n + document.querySelectorAll(sc + ' button, ' + sc + ' select, ' + sc + ' input').length, 0)); assert.ok(total > 60, 'the audit looked at ' + total + ' controls');
  assert.deepEqual([...new Set(bad)], [], 'controls smaller than 44 px'); assert.deepEqual(errs, []); await context.close();
});

test('touch handles: every handle has a 44 px grab area behind it, and a finger on the halo (not on the dot) still drags', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(() => { app.P = STORE.fresh('blank'); addItem(SHP.make('box', 500, 375, { w: 300, h: 200 })); renderAll(); });
  const n = await page.evaluate(() => document.querySelectorAll('#overlay [data-h]:not([data-halo])').length); const halos = await page.evaluate(() => [...document.querySelectorAll('#overlay [data-halo]')].map((h) => { const r = h.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }));
  assert.equal(halos.length, n, 'one halo per handle'); assert.ok(halos.every((d) => d >= 43), 'each halo is about 44 px across: ' + halos);
  // grab the rotate handle 15 px to the side of its centre: that is outside the 11 px dot but inside the halo
  const [x, y] = await centre(page, '#overlay [data-h="rot"]:not([data-halo])'); const rot0 = (await items(page))[0].rot;
  await dragTouch(cdp, [x + 15, y], [x + 15 + 80, y + 60]); await page.waitForTimeout(100); assert.notEqual((await items(page))[0].rot, rot0, 'the halo works as the handle');
  // a mouse user never gets halos
  await context.close(); const mp = await browser.newPage({ viewport: { width: 1180, height: 820 } }); await mp.goto(url); await mp.waitForFunction(() => typeof app !== 'undefined' && app.P); await mp.evaluate(() => { hideStart(); app.P = STORE.fresh('blank'); addItem(SHP.make('box', 500, 375)); renderAll(); });
  assert.equal(await mp.evaluate(() => document.querySelectorAll('#overlay [data-halo]').length), 0); await mp.close(); assert.deepEqual(errs, []);
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
