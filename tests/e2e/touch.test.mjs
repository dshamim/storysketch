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
// (a finger would scroll a list to the thing first, so the helper does too)
const centre = async (page, sel) => { const l = page.locator(sel).first(); await l.waitFor({ state: 'visible', timeout: 5000 }); await l.scrollIntoViewIfNeeded(); const b = await l.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
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

async function firstRunTask(viewport) {
  const { page, cdp, errs, context } = await openTouch(viewport, { start: true });
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
}
test('first-run task with a finger only (tablet held sideways): open a sample, add and pose a character, add and turn a text label, draw an arrow, switch to marker, export a PNG', { skip }, () => firstRunTask(LANDSCAPE));
test('the same first-run task with a finger only on a tablet held upright (bottom tab bar and sheets)', { skip }, () => firstRunTask(PORTRAIT));

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
  await touchEvt(cdp, 'touchStart', [[x + 70, y + 20, 1], [520, 160, 2]]); await page.waitForTimeout(60);
  await same(page, before); assert.equal(await page.evaluate(() => !!app.drag), false, 'the half-made drag is gone');
  for (let i = 1; i <= 4; i++) await touchEvt(cdp, 'touchMove', [[x + 70 + 5 * i, y + 20, 1], [520 + 30 * i, 160, 2]]); // the second finger moves: only zoom / pan, nothing is dragged
  await touchEvt(cdp, 'touchEnd', []); await page.waitForTimeout(100); await same(page, before);
  assert.equal(await page.evaluate(() => app.dirty), false, 'nothing was committed: the project is not marked unsaved');
  assert.deepEqual(errs, []); await context.close();
});

test('a touch that the browser cancels undoes the drag too', { skip }, async () => {
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

// ---- layout ----
const rect = (page, sel) => page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right }; }, sel);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.body.scrollWidth <= document.documentElement.clientWidth);

test('a tablet held upright: tab bar at the bottom, the library and Details are bottom sheets (one at a time), the page stays visible above, the ribbon scrolls sideways', { skip }, async () => {
  const { page, context, errs } = await openTouch(PORTRAIT); await page.evaluate(CLASSROOM); await page.evaluate(() => select([])); const vh = 1180;
  const tab = await rect(page, '.railwrap'); assert.ok(Math.abs(tab.b - vh) < 1 && tab.w === 820 && tab.h >= 60, 'the rail is a tab bar along the bottom: ' + JSON.stringify(tab));
  assert.equal(await page.evaluate(() => document.querySelector('#left').hidden), true, 'the library starts folded away'); assert.equal(await noSideways(page), true, 'no sideways scrolling');
  // tap a tab: a sheet comes up above the tab bar; the page is still fully visible above it
  await tap(page, '#rail-cast'); const sh = await rect(page, '#left'); assert.ok(sh.w === 820 && Math.abs(sh.b - (vh - tab.h)) < 2 && sh.h > 300, 'the library is a sheet above the tab bar: ' + JSON.stringify(sh));
  const st = await rect(page, '#stage-wrap'); assert.ok(st.b <= sh.y + 1, 'the page area ends where the sheet starts'); assert.ok(st.h > 300, 'and is still big enough to work in');
  assert.equal(await page.evaluate(() => document.querySelector('#workspace').classList.contains('sheet-open')), true);
  // Details opens as a sheet too, and takes the library's place
  await tap(page, '#cast-grid [data-add-cast="ahmed"]'); await page.waitForTimeout(100); await tap(page, '#details-toggle');
  assert.equal(await page.evaluate(() => [document.querySelector('#left').hidden, document.querySelector('#right').hidden]).then((a) => a.join()), 'true,false', 'only one sheet is open'); const dt = await rect(page, '#right'); assert.ok(dt.w === 820 && Math.abs(dt.b - (vh - tab.h)) < 2);
  // closing it gives the whole page back
  await tap(page, '#details-close'); assert.equal(await page.evaluate(() => document.querySelector('#workspace').classList.contains('sheet-open')), false); assert.ok((await rect(page, '#stage-wrap')).h > st.h + 200, 'the page area grows back');
  // the ribbon scrolls sideways instead of wrapping or overflowing the page, and its menus open inside the screen
  const rb = await page.evaluate(() => { const r = document.querySelector('#ribbon'); return [r.scrollWidth, r.clientWidth, getComputedStyle(r).overflowX]; }); assert.ok(rb[0] > rb[1] && rb[2] === 'auto', 'the ribbon scrolls: ' + rb);
  await tap(page, '#ribbon-sel [data-rb="pose"]'); const pp = await rect(page, '#pop-pose'); assert.ok(pp.x >= 0 && pp.r <= 820 && pp.y >= 0 && pp.b <= vh, 'the pose menu is inside the screen: ' + JSON.stringify(pp));
  await tap(page, '#pop-pose [data-pose="wave"]'); assert.equal(await noSideways(page), true);
  assert.deepEqual(errs, []); await context.close();
});

test('the designer works as a bottom sheet: its preview stays on top while the form scrolls, Done closes the sheet', { skip }, async () => {
  const { page, context, errs } = await openTouch(PORTRAIT); await page.evaluate(CLASSROOM); await page.evaluate(() => select([pg().items.find((i) => i.cast === 'teacher').id]));
  await tap(page, '#ribbon-sel [data-act="design"]'); assert.equal(await page.locator('#designer').isVisible(), true); const sh = await rect(page, '#right'); assert.ok(sh.w === 820 && sh.h > 300);
  const pv0 = await rect(page, '#d-preview'); await page.evaluate(() => { document.querySelector('#right').scrollTop = 400; }); await page.waitForTimeout(100); const pv1 = await rect(page, '#d-preview');
  assert.ok(pv1.y >= sh.y - 1 && pv1.b <= sh.b && pv1.h > 100, 'the preview stays in view (pinned at the top of the sheet) while the form scrolls: ' + pv0.y + ' -> ' + pv1.y);
  await tap(page, '#d-close'); assert.equal(await page.evaluate(() => document.querySelector('#workspace').classList.contains('sheet-open')), false, 'the sheet closes with the designer');
  assert.deepEqual(errs, []); await context.close();
});

test('a tablet at 1024 px: the library starts folded away, Details slides over the page without squeezing it; and it all fits', { skip }, async () => {
  const { page, context, errs } = await openTouch({ viewport: { width: 1024, height: 768 }, hasTouch: true }); await page.evaluate(CLASSROOM); await page.evaluate(() => select([pg().items.find((i) => i.cast === 'teacher').id]));
  assert.equal(await page.evaluate(() => document.querySelector('#left').hidden), true, 'folded away at first'); const w0 = (await rect(page, '#center')).w;
  await tap(page, '#details-toggle'); const dt = await rect(page, '#right'); assert.ok(dt.x > 600 && dt.r >= 1023, 'Details is on the right'); assert.equal((await rect(page, '#center')).w, w0, 'and does not squeeze the page');
  await tap(page, '#details-close'); await tap(page, '#rail-cast'); const lf = await rect(page, '#left'); assert.ok(lf.w >= 250 && lf.w <= 270, 'a narrower library: ' + lf.w); assert.equal(await noSideways(page), true);
  assert.deepEqual(errs, []); await context.close();
  // the choice is not remembered from a narrow window: a wide window later still starts with the library open
  const wide = await openTouch(LANDSCAPE); assert.equal(await wide.page.evaluate(() => document.querySelector('#left').hidden), false, 'a wide window starts with the library open'); await wide.context.close();
});

test('turning the tablet: upright folds the panels into sheets, sideways brings the library back', { skip }, async () => {
  const { page, context, errs } = await openTouch(LANDSCAPE); await page.evaluate(CLASSROOM);
  assert.equal(await page.evaluate(() => !document.querySelector('#left').hidden), true); await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => document.querySelector('#left').hidden), true, 'folded away upright'); assert.equal((await rect(page, '.railwrap')).w, 820, 'the rail is a tab bar');
  await tap(page, '#rail-props'); assert.equal(await page.evaluate(() => !document.querySelector('#left').hidden), true); await page.setViewportSize({ width: 1180, height: 820 }); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => !document.querySelector('#left').hidden), true, 'back to a side library'); assert.ok((await rect(page, '.railwrap')).w < 100, 'and a side rail'); assert.equal(await noSideways(page), true);
  assert.deepEqual(errs, []); await context.close();
});

test('the tool bar (touch only): Select, Hand, Text, Shapes, Several do what they say, and show which is on', { skip }, async () => {
  const mouse = await browser.newPage({ viewport: { width: 1180, height: 820 } }); await mouse.goto(url); await mouse.waitForFunction(() => typeof app !== 'undefined' && app.P); assert.equal(await mouse.locator('#toolbar').isVisible(), false, 'a mouse does not get it'); await mouse.close();
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); await page.evaluate(() => select([])); const pressed = () => page.evaluate(() => [...document.querySelectorAll('#toolbar [aria-pressed="true"]')].map((b) => b.dataset.tool).join());
  assert.equal(await page.locator('#toolbar').isVisible(), true); assert.equal(await pressed(), 'select');
  await tap(page, '#toolbar [data-tool="hand"]'); assert.equal(await pressed(), 'hand'); assert.equal(await page.evaluate(() => app.tool), 'hand'); await page.evaluate(() => zoomTo(2.5)); const v0 = await view(page); await dragTouch(cdp, [600, 400], [500, 340]); await page.waitForTimeout(500);
  assert.ok((await view(page)).cx > v0.cx + 10, 'one finger pans with the hand tool'); await tap(page, '#toolbar [data-tool="select"]'); assert.equal(await pressed(), 'select'); assert.equal(await page.evaluate(() => app.tool), null);
  await tap(page, '#toolbar [data-tool="text"]'); assert.equal(await pressed(), 'text'); assert.equal(await page.evaluate(() => app.tool), 'text'); await tap(page, '#toolbar [data-tool="text"]'); assert.equal(await page.evaluate(() => app.tool), null, 'tap again to put it away');
  await page.evaluate(() => zoomTo(1)); await tap(page, '#toolbar [data-tool="shapes"]'); assert.equal(await page.evaluate(() => app.tab), 'tab-shapes'); assert.equal(await page.locator('#tab-shapes').isVisible(), true); assert.equal(await pressed(), 'shapes'); await tap(page, '#toolbar [data-tool="shapes"]'); assert.equal(await page.evaluate(() => document.querySelector('#left').hidden), true, 'tap again folds it');
  await tap(page, '#toolbar [data-tool="several"]'); assert.equal(await pressed(), 'several'); const [x, y, id] = await tableSpot(page); await tapAt(page, x, y);
  const t = await page.evaluate(() => { const it = pg().items.find((i) => i.cast === 'teacher'); const b = document.querySelector(`#items [data-id="${it.id}"]`).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2 - 60]; }); await tapAt(page, t[0], t[1]);
  assert.ok((await page.evaluate(() => app.sel.length)) >= 2, 'taps add to the selection'); await tap(page, '#toolbar [data-tool="select"]'); assert.equal(await page.evaluate(() => app.addMode), false, 'Select turns it off');
  assert.deepEqual(errs, []); await context.close();
});

test('touch sizes in portrait: the tab bar, tool bar and every open sheet have 44 px controls; a toast never covers the bars', { skip }, async () => {
  const { page, context, errs } = await openTouch(PORTRAIT); await page.evaluate(CLASSROOM); const bad = [];
  for (const scope of ['#topbar', '.railwrap', '#toolbar', '#filmbar']) bad.push(...await SMALL(page, scope));
  for (const tab of ['cast', 'props', 'shapes', 'text', 'layers', 'addons']) { await showTab(page, tab); await page.waitForTimeout(80); bad.push(...await SMALL(page, '#left')); }
  await tap(page, '#cast-grid [data-add-cast="ahmed"]').catch(() => {}); await showTab(page, 'cast'); await tap(page, '#cast-grid [data-add-cast="ahmed"]'); await page.waitForTimeout(100); bad.push(...await SMALL(page, '#ribbon'), ...await SMALL(page, '#minibar'));
  await tap(page, '#details-toggle'); bad.push(...await SMALL(page, '#right'));
  assert.deepEqual([...new Set(bad)], [], 'controls smaller than 44 px');
  await page.evaluate(() => toast('A hint that must not catch taps')); const tb = await rect(page, '.ui-toast'); const ba = await rect(page, '.railwrap'); assert.ok(tb.b < ba.y, 'the toast is above the tab bar'); assert.equal(await page.evaluate(([x, y]) => getComputedStyle(document.elementFromPoint(x, y) || document.body).pointerEvents !== 'none' || !document.elementFromPoint(x, y).closest('.ui-toast'), [tb.x + tb.w / 2, tb.y + tb.h / 2]), true, 'taps go through it');
  assert.deepEqual(errs, []); await context.close();
});

// ---- typing with the on-screen keyboard ----
// A real keyboard can not be emulated in headless Chrome. Making the window shorter is the stand-in: that is what the page sees when a keyboard rises (the visible height shrinks).
test('typing on a tablet: the text being typed is brought into view, stays above a (stand-in) keyboard, and Done typing replaces Esc', { skip }, async () => {
  const { page, context, errs } = await openTouch(PORTRAIT); await page.evaluate(() => { app.P = STORE.fresh('blank'); renderAll(); });
  const id = await page.evaluate(() => { const it = TXT.make({ text: 'Typing down here', size: 60, w: 400 }, 700, 680); addItem(it); return it.id; });
  await page.evaluate(() => { zoomTo(2); app.view.cx = 300; app.view.cy = 200; applyView(); renderOverlay(); }); // zoomed in on the top left: the text is far off screen
  const inView = () => page.evaluate((id) => { const a = document.querySelector('#stage').getBoundingClientRect(); const r = document.querySelector(`#items [data-id="${id}"]`).getBoundingClientRect(); return r.top >= a.top - 1 && r.bottom <= a.bottom + 1 && r.left >= a.left - 1 && r.right <= a.right + 1; }, id);
  assert.equal(await inView(), false, 'it starts out of sight'); assert.equal(await page.locator('#edit-done').isVisible(), false);
  await page.evaluate((id) => startEdit(id), id); await page.waitForTimeout(150);
  assert.equal(await inView(), true, 'starting to type brings the text into view'); assert.equal(await page.locator('#edit-done').isVisible(), true, 'a Done button shows while typing');
  await page.keyboard.type('!'); // the keyboard rises: the visible height shrinks by about half
  await page.setViewportSize({ width: 820, height: 640 }); await page.waitForTimeout(300);
  assert.equal(await inView(), true, 'the text is still in view above the keyboard'); const tb = await rect(page, '.railwrap'); assert.ok(tb.b <= 640 + 1, 'the tab bar sits above the keyboard: ' + tb.b);
  assert.equal(await page.evaluate(() => Math.abs(document.body.getBoundingClientRect().height - visualViewport.height) < 2), true, 'the page is as tall as the visible height');
  await tap(page, '#edit-done'); assert.equal(await page.evaluate(() => !!app.edit), false, 'Done typing ends the typing'); assert.equal(await page.locator('#edit-done').isVisible(), false); assert.match((await items(page))[0].text, /!$/, 'what was typed is kept');
  await page.setViewportSize({ width: 820, height: 1180 }); await page.waitForTimeout(250); assert.equal(await page.evaluate(() => Math.abs(document.body.getBoundingClientRect().height - innerHeight) < 2), true, 'and the page grows back when the keyboard goes');
  assert.deepEqual(errs, []); await context.close();
  // a mouse user never sees the Done button
  const mp = await browser.newPage({ viewport: { width: 1180, height: 820 } }); await mp.goto(url); await mp.waitForFunction(() => typeof app !== 'undefined' && app.P); await mp.evaluate(() => { hideStart(); app.P = STORE.fresh('blank'); const it = TXT.make({ text: 'Hi' }, 500, 300); addItem(it); startEdit(it.id); });
  assert.equal(await mp.locator('#edit-done').isVisible(), false); await mp.close();
});

test('a palm that lands BEFORE the pen: what it started is thrown away and its later moves do nothing', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); const before = JSON.stringify(await items(page)); const [x, y] = await tableSpot(page); const [px, py] = await screenOf(page, 100, 120);
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); for (let i = 1; i <= 4; i++) await touchEvt(cdp, 'touchMove', [[x + 15 * i, y + 5 * i, 1]]); assert.notEqual(JSON.stringify(await items(page)), before, 'the palm is moving the table');
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen' });
  await same(page, before); for (let i = 5; i <= 8; i++) await touchEvt(cdp, 'touchMove', [[x + 15 * i, y + 5 * i, 1]]); await same(page, before); // the palm keeps moving: nothing follows
  await touchEvt(cdp, 'touchEnd', []); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px, y: py, button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen' }); await page.waitForTimeout(100); await same(page, before);
  assert.deepEqual(errs, []); await context.close();
});

test('Several works in the Layers list too (taps add to the selection)', { skip }, async () => {
  const { page, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); await page.evaluate(() => select([])); await showTab(page, 'layers');
  const ids = await page.evaluate(() => pg().items.filter((i) => i.type !== 'limbs').slice(0, 3).map((i) => i.id)); await tap(page, `#layers [data-layer="${ids[0]}"] .ln`); assert.deepEqual(await page.evaluate(() => app.sel), [ids[0]]);
  await tap(page, `#layers [data-layer="${ids[1]}"] .ln`); assert.deepEqual(await page.evaluate(() => app.sel), [ids[1]], 'without Several a tap picks just that one');
  await tap(page, '#toolbar [data-tool="several"]'); await tap(page, `#layers [data-layer="${ids[2]}"] .ln`); assert.deepEqual(await page.evaluate(() => [...app.sel].sort()), [ids[1], ids[2]].sort(), 'with Several the tap adds');
  assert.deepEqual(errs, []); await context.close();
});

test('double-tap starts typing in a text and in a shape, and shows Done typing', { skip }, async () => {
  const { page, context, errs } = await openTouch(); await page.evaluate(() => { app.P = STORE.fresh('blank'); addItem(TXT.make({ text: 'Hello', size: 70 }, 300, 200)); addItem(SHP.make('box', 650, 450, { w: 260, h: 160, fill: 'colour' })); select([]); renderAll(); });
  const [tx, ty] = await screenOf(page, 300, 200); await page.touchscreen.tap(tx, ty); await page.waitForTimeout(80); await page.touchscreen.tap(tx, ty); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => app.edit && itemById(app.edit.id).type), 'text', 'double-tap on a text edits it'); assert.equal(await page.locator('#edit-done').isVisible(), true); await tap(page, '#edit-done'); assert.equal(await page.evaluate(() => !!app.edit), false);
  const [sx, sy] = await screenOf(page, 650, 450); await page.touchscreen.tap(sx, sy); await page.waitForTimeout(80); await page.touchscreen.tap(sx, sy); await page.waitForTimeout(150);
  assert.equal(await page.evaluate(() => app.edit && itemById(app.edit.id).type), 'shape', 'double-tap on a shape types inside it'); assert.equal(await page.locator('#edit-done').isVisible(), true);
  assert.deepEqual(errs, []); await context.close();
});

test('a finger the page lost track of (lifted over the ribbon during a pinch) does not turn the next tap into a pinch', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); await page.evaluate(() => select([])); const [x, y, id] = await tableSpot(page);
  await touchEvt(cdp, 'touchStart', [[x, y, 1]]); await touchEvt(cdp, 'touchStart', [[x, y, 1], [x + 120, y, 2]]); // a pinch starts
  await touchEvt(cdp, 'touchMove', [[300, 70, 1], [500, 70, 2]]); await touchEvt(cdp, 'touchEnd', []); await page.waitForTimeout(150); // both fingers lift over the ribbon: the page never sees them go
  await page.evaluate(() => { zoomTo(1); select([]); }); const [x2, y2] = await tableSpot(page); const z0 = (await view(page)).z; await page.touchscreen.tap(x2, y2); await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => app.sel), [id], 'a single tap selects, it does not start a pinch'); assert.equal((await view(page)).z, z0, 'and the zoom does not change');
  assert.deepEqual(errs, []); await context.close();
});

test('close pose handles: the one nearest the fingertip is the one that moves (halos overlap on a small figure)', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(CLASSROOM); await page.evaluate(() => { const f = pg().items.find((i) => i.cast === 'teacher'); f.s = 0.6; select([f.id]); renderAll(); }); await page.waitForTimeout(100);
  const hs = await page.evaluate(() => [...document.querySelectorAll('#overlay [data-h]:not([data-halo])')].filter((e) => !['scale', 'rot'].includes(e.dataset.h)).map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.h, r.x + r.width / 2, r.y + r.height / 2]; }));
  let pairs = 0; // every pair of handles whose halos overlap: touch 9 px off one of them, towards the other, and the first must be the one pressed
  for (const [ka, xa, ya] of hs) for (const [kb, xb, yb] of hs) { if (ka === kb) continue; const d = Math.hypot(xb - xa, yb - ya); if (d >= 40 || d < 20) continue; pairs++; // (20 px apart or more, so a point 9 px from one is really nearer to it than to the other)
    const px = xa + (xb - xa) / d * 9, py = ya + (yb - ya) / d * 9; await page.evaluate(() => { app.lastPress = null; }); await touchEvt(cdp, 'touchStart', [[px, py, 1]]); await touchEvt(cdp, 'touchEnd', []); await page.waitForTimeout(80);
    const nearest = hs.map(([k, hx, hy]) => [k, Math.hypot(px - hx, py - hy)]).sort((u, v) => u[1] - v[1])[0][0]; assert.equal(await page.evaluate(() => app.lastPress && app.lastPress.kind), nearest, `a touch 9 px from ${ka} towards ${kb} presses the nearest handle (${nearest})`); await page.waitForTimeout(450); }
  assert.ok(pairs >= 2, 'the figure has close handles to test: ' + pairs); assert.deepEqual(errs, []); await context.close();
});

test('cancelling a shape that is being drawn: the half-drawn shape disappears when a second finger lands', { skip }, async () => {
  const { page, cdp, context, errs } = await openTouch(); await page.evaluate(() => { app.P = STORE.fresh('blank'); renderAll(); }); const before = JSON.stringify(await items(page)); const [sx, sy] = await screenOf(page, 200, 200);
  await page.evaluate(() => setTool('box')); await touchEvt(cdp, 'touchStart', [[sx, sy, 1]]); for (let i = 1; i <= 5; i++) await touchEvt(cdp, 'touchMove', [[sx + 30 * i, sy + 20 * i, 1]]); assert.equal((await items(page)).length, 1, 'a box is being drawn');
  await touchEvt(cdp, 'touchStart', [[sx + 150, sy + 100, 1], [sx + 300, sy + 300, 2]]); await page.waitForTimeout(100); assert.equal(await page.evaluate(() => JSON.stringify(pg().items)), before, 'and it is gone again'); await touchEvt(cdp, 'touchEnd', []);
  assert.deepEqual(errs, []); await context.close();
});

test('touch sizes in the menus and popovers: File menu, More menu, pose picker, Export, start screen', { skip }, async () => {
  const { page, context, errs } = await openTouch(LANDSCAPE, { start: true }); const bad = [];
  bad.push(...await SMALL(page, '#start')); await tap(page, '#start-cards [data-start="project:sample-classroom"]');
  await tap(page, '#btn-file'); bad.push(...await SMALL(page, '#menu-file')); await page.keyboard.press('Escape');
  await tap(page, '#btn-view'); bad.push(...await SMALL(page, '#menu-view')); await page.keyboard.press('Escape');
  await tap(page, '#open-export'); bad.push(...await SMALL(page, '#export')); await tap(page, '#x-close');
  const [x, y] = await tableSpot(page); await tapAt(page, x, y); await tap(page, '#minibar [data-mb="more"]'); bad.push(...await SMALL(page, '#menu-more')); await page.keyboard.press('Escape');
  await tap(page, '#ribbon-sel [data-rb="menu-position"]'); bad.push(...await SMALL(page, '#menu-position')); await page.keyboard.press('Escape');
  await tap(page, '#page-menu-btn'); bad.push(...await SMALL(page, '#menu-page')); await page.keyboard.press('Escape');
  await page.evaluate(() => select([pg().items.find((i) => i.cast === 'teacher').id])); await tap(page, '#ribbon-sel [data-rb="pose"]'); bad.push(...await SMALL(page, '#pop-pose'));
  assert.deepEqual([...new Set(bad)], [], 'controls smaller than 44 px in menus and popovers'); assert.deepEqual(errs, []); await context.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
