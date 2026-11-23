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

// ---- gestures: several fingers, long-press, palm, hand tool ----
const touchEvt = (cdp, type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id })) });
const CLASSROOM = () => { restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll(); commit(); };
const tableSpot = async (page) => page.evaluate(() => { const it = pg().items.find((i) => i.kind === 'table'); const b = document.querySelector(`#items [data-id="${it.id}"]`).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2 - 40, it.id]; }); // on the tabletop line
const view = (page) => page.evaluate(() => ({ z: app.view.z, cx: app.view.cx, cy: app.view.cy }));
const same = async (page, before) => assert.equal(JSON.stringify(await items(page)), before, 'the page is untouched');

test('two fingers pinch and pan the page; they never move, change or select anything', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); const sel0 = await page.evaluate(() => app.sel.length);
  // both fingers land on empty page (left of the shelf) and move apart: zoom in around the middle
  await touchEvt(cdp, 'touchStart', [[500, 250, 1]]); await touchEvt(cdp, 'touchStart', [[500, 250, 1], [700, 250, 2]]);
  const P0 = await page.evaluate(() => toPage({ clientX: 600, clientY: 250 }));
  for (let i = 1; i <= 8; i++) await touchEvt(cdp, 'touchMove', [[500 - 12 * i, 250, 1], [700 + 12 * i, 250, 2]]);
  const P1 = await page.evaluate(() => toPage({ clientX: 600, clientY: 250 })); const v1 = await view(page);
  assert.ok(v1.z > 1.8, 'zoomed in: ' + v1.z); assert.ok(Math.abs(P0[0] - P1[0]) < 3 && Math.abs(P0[1] - P1[1]) < 3, 'the page point between the fingers stayed under them');
  // both fingers drag right: the page follows (two-finger pan)
  for (let i = 1; i <= 6; i++) await touchEvt(cdp, 'touchMove', [[404 + 20 * i, 250, 1], [796 + 20 * i, 250, 2]]);
  const v2 = await view(page); assert.ok(v2.cx < v1.cx - 20, 'the page moved with the fingers: ' + v1.cx + ' -> ' + v2.cx); await touchEvt(cdp, 'touchEnd', []);
  await page.waitForTimeout(100); await same(page, before); assert.equal(await page.evaluate(() => app.sel.length), sel0); assert.equal(await page.evaluate(() => !!app.drag), false);
  // pinch back in: not smaller than the whole page
  await touchEvt(cdp, 'touchStart', [[600, 400, 1]]); await touchEvt(cdp, 'touchStart', [[600, 400, 1], [900, 400, 2]]);
  for (let i = 1; i <= 5; i++) await touchEvt(cdp, 'touchMove', [[600 + 28 * i, 400, 1], [900 - 28 * i, 400, 2]]); await touchEvt(cdp, 'touchEnd', []); // fingers end 20 px apart: a very small pinch
  assert.ok((await view(page)).z >= 1 && (await view(page)).z < v1.z, 'zoomed out, never below the whole page');
  // one finger left down after the pinch must not turn into a tap or a drag when it lifts
  await touchEvt(cdp, 'touchStart', [[500, 300, 1]]); await touchEvt(cdp, 'touchStart', [[500, 300, 1], [600, 300, 2]]); await touchEvt(cdp, 'touchEnd', [[600, 300, 2]]); await touchEvt(cdp, 'touchMove', [[620, 340, 2]]); await touchEvt(cdp, 'touchEnd', []);
  await page.waitForTimeout(100); await same(page, before); assert.equal(await page.evaluate(() => !!app.drag), false);
  assert.deepEqual(errs, []); await context.close();
});

test('a second finger lands mid-drag: the drag is undone, not committed, and the second finger can not drive it', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); const [x, y] = await tableSpot(page); await page.evaluate(() => setDirty(false));
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); for (let i = 1; i <= 5; i++) await touchEvt(cdp, 'touchMove', [[x + 14 * i, y + 4 * i, 1]]);
  assert.notEqual(JSON.stringify(await items(page)), before, 'the table follows the finger'); assert.equal(await page.evaluate(() => !!app.drag), true);
  await touchEvt(cdp, 'touchStart', [[x + 70, y + 20, 1], [560, 650, 2]]); await page.waitForTimeout(60);
  await same(page, before); assert.equal(await page.evaluate(() => !!app.drag), false, 'the half-made drag is gone');
  for (let i = 1; i <= 4; i++) await touchEvt(cdp, 'touchMove', [[x + 70 + 5 * i, y + 20, 1], [560 + 30 * i, 650, 2]]); // the second finger moves: only zoom / pan, nothing is dragged
  await touchEvt(cdp, 'touchEnd', []); await page.waitForTimeout(100); await same(page, before);
  assert.equal(await page.evaluate(() => app.dirty), false, 'nothing was committed: the project is not marked unsaved');
  assert.deepEqual(errs, []); await context.close();
});

test('a touch that the browser cancels undoes the drag too (a pose, a move, a handle)', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); const [x, y] = await tableSpot(page);
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); for (let i = 1; i <= 5; i++) await touchEvt(cdp, 'touchMove', [[x + 10 * i, y, 1]]); assert.notEqual(JSON.stringify(await items(page)), before);
  await touchEvt(cdp, 'touchCancel', []); await page.waitForTimeout(100); await same(page, before); assert.equal(await page.evaluate(() => !!app.drag), false);
  assert.deepEqual(errs, []); await context.close();
});

test('a wobbly tap is a tap: 5 px of finger jitter selects but does not move or commit; a real drag still moves', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); const [x, y, id] = await tableSpot(page); const rev0 = await page.evaluate(() => app.rev);
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); await touchEvt(cdp, 'touchMove', [[x + 3, y + 2, 1]]); await touchEvt(cdp, 'touchMove', [[x + 5, y + 1, 1]]); await touchEvt(cdp, 'touchEnd', []); await page.waitForTimeout(120);
  await same(page, before); assert.deepEqual(await page.evaluate(() => app.sel), [id], 'selected'); assert.equal(await page.evaluate(() => app.rev), rev0, 'no commit');
  await dragTouch(cdp, [x, y], [x + 60, y + 30]); await page.waitForTimeout(100); assert.notEqual(JSON.stringify(await items(page)), before, 'a real drag moves it'); assert.ok(await page.evaluate(() => app.rev) > rev0);
  assert.deepEqual(errs, []); await context.close();
});

test('long-press on something selects it and opens its More menu; it does not move it and the finger lifting does nothing more', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); const [x, y, id] = await tableSpot(page);
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); await page.waitForTimeout(800);
  assert.equal(await page.locator('#menu-more').isVisible(), true, 'the More menu opened'); assert.deepEqual(await page.evaluate(() => app.sel), [id]); await touchEvt(cdp, 'touchEnd', []); await page.waitForTimeout(100);
  assert.equal(await page.locator('#menu-more').isVisible(), true, 'and stays open after the finger lifts'); await same(page, before);
  // a long-press on empty page does nothing; moving cancels the press
  await page.keyboard.press('Escape'); const [ex, ey] = await screenOf(page, 100, 100); await touchEvt(cdp, 'touchStart', [[ex, ey, 1]]); await page.waitForTimeout(800); await touchEvt(cdp, 'touchEnd', []);
  assert.equal(await page.locator('#menu-more').isVisible(), false);
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); await touchEvt(cdp, 'touchMove', [[x + 30, y, 1]]); await page.waitForTimeout(800); await touchEvt(cdp, 'touchEnd', []); assert.equal(await page.locator('#menu-more').isVisible(), false, 'moving first makes it a drag, not a press');
  assert.deepEqual(errs, []); await context.close();
});

test('palm rejection: while a pen is down (and for a moment after) finger touches on the page are ignored', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); await page.evaluate(() => select([])); const [x, y, id] = await tableSpot(page); const before = JSON.stringify(await items(page));
  const [px, py] = await screenOf(page, 100, 120);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen' });
  await page.touchscreen.tap(x, y); await page.waitForTimeout(80); assert.deepEqual(await page.evaluate(() => app.sel), [], 'a palm on the table while the pen is down does nothing');
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px, y: py, button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen' });
  await page.touchscreen.tap(x, y); await page.waitForTimeout(80); assert.deepEqual(await page.evaluate(() => app.sel), [], 'still ignored for a moment after the pen lifts');
  await page.waitForTimeout(800); await page.touchscreen.tap(x, y); await page.waitForTimeout(80); assert.deepEqual(await page.evaluate(() => app.sel), [id], 'a finger works again after the quiet moment');
  await same(page, before); assert.deepEqual(errs, []); await context.close();
});

test('the hand tool pans with one finger; V (select) puts it away; Select several adds to the selection with plain taps', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); await page.evaluate(() => zoomTo(2.5));
  await page.evaluate(() => setTool('hand')); const v0 = await view(page); await dragTouch(cdp, [500, 400], [400, 340]); await page.waitForTimeout(100);
  const v1 = await view(page); assert.ok(v1.cx > v0.cx + 10 && v1.cy > v0.cy + 5, 'the page moved with the finger'); await same(page, before); assert.equal(await page.evaluate(() => app.tool), 'hand');
  await page.keyboard.press('v'); assert.equal(await page.evaluate(() => app.tool), null, 'V selects again');
  await page.evaluate(() => { zoomTo(1); select([]); app.addMode = true; }); const [x, y, id] = await tableSpot(page); const lily = await page.evaluate(() => { const it = pg().items.find((i) => i.cast === 'teacher'); const b = document.querySelector(`#items [data-id="${it.id}"]`).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2 - 60, it.id]; }); // (the teacher: a stick figure is thin, so on her body)
  await tapAt(page, x, y); await tapAt(page, lily[0], lily[1]); assert.ok((await page.evaluate(() => app.sel)).includes(id) && (await page.evaluate(() => app.sel.length)) >= 2, 'two taps = two things selected');
  assert.deepEqual(errs, []); await context.close();
});

test('finger drawing: a line that is nearly level / 45 degrees snaps, a shape that is nearly square becomes square; a clearly different one is left alone (no Shift on a tablet)', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(() => { app.P = STORE.fresh('blank'); renderAll(); });
  const [sx, sy] = await screenOf(page, 200, 200);
  const draw = async (tool, to) => { await page.evaluate((t) => setTool(t), tool); await dragTouch(cdp, [sx, sy], [sx + to[0], sy + to[1]]); await page.waitForTimeout(120); return (await items(page)).at(-1); };
  const l1 = await draw('line', [200, 8]); assert.equal(l1.rot, 0, 'within 4 degrees of level: level'); const l2 = await draw('line', [150, 150]); assert.equal(Math.round(l2.rot), 45, '45 degrees'); const l3 = await draw('line', [200, 40]); assert.notEqual(Math.round(l3.rot), 0, 'a clearly slanted line stays slanted');
  const b1 = await draw('box', [200, 208]); assert.equal(b1.w, b1.h, 'nearly square becomes square'); const b2 = await draw('box', [200, 120]); assert.notEqual(b2.w, b2.h);
  assert.deepEqual(errs, []); await context.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
