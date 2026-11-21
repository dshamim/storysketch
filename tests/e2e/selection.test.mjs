// Selection UX: the contextual ribbon, the mini bar, the Details panel, Position / Line up / Space evenly, and snapping.
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

async function open(setup = `app.P = STORE.fresh('blank'); renderAll();`) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate(() => { hideStart(); localStorage.clear(); }); await page.evaluate(setup);
  return { page, errs };
}
const items = (page) => page.evaluate(() => pg().items.map((i) => ({ id: i.id, type: i.type, kind: i.kind, x: i.x, y: i.y, rot: i.rot, mode: i.mode })));
const boxes = (page) => page.evaluate(() => pg().items.filter((i) => i.type !== 'limbs').map((i) => { const b = boxOfItems([i]); return { x: b.x, y: b.y, w: b.w, h: b.h }; }));
const THREE = `app.P = STORE.fresh('blank'); addProp('table'); addProp('drum'); addProp('plant'); pg().items[0].x = 200; pg().items[0].y = 300; pg().items[1].x = 500; pg().items[1].y = 450; pg().items[2].x = 800; pg().items[2].y = 350; renderAll();`;

test('the ribbon follows the selection: page settings, then character, prop and several-items controls', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank'); addFigure(CP.characters[0].id); addProp('table'); renderAll(); select([]);`);
  assert.equal(await page.locator('#ribbon-page').isVisible(), true); assert.equal(await page.locator('#ribbon-sel').isVisible(), false);
  await page.evaluate(() => select([pg().items[0].id]));
  assert.equal(await page.locator('#ribbon-page').isVisible(), false);
  for (const sel of ['#ribbon-sel [data-k="expr"]', '#ribbon-sel [data-rb="pose"]', '#ribbon-sel [data-act="mirror"]', '#ribbon-sel [data-k="mode"]', '#ribbon-sel [data-rb="menu-position"]', '#ribbon-sel [data-rot]']) assert.equal(await page.locator(sel).isVisible(), true, sel);
  await page.evaluate(() => select([pg().items[1].id]));
  assert.equal(await page.locator('#ribbon-sel [data-act="mirror"]').count(), 0, 'a prop has no mirror pose'); assert.equal(await page.locator('#ribbon-sel [data-rb="menu-position"]').isVisible(), true);
  await page.evaluate(() => select(pg().items.map((i) => i.id)));
  for (const sel of ['[data-rb="menu-align"]', '[data-rb="menu-distribute"]', '[data-act="group"]', '[data-act="lock"]']) assert.equal(await page.locator('#ribbon-sel ' + sel).isVisible(), true, sel);
  await page.evaluate(() => select([])); assert.equal(await page.locator('#ribbon-page').isVisible(), true, 'page settings come back');
  assert.deepEqual(errs, []); await page.close();
});

test('first-run task: add a character, pose it from the ribbon, turn it, line up, duplicate and delete — without opening a menu bar', { skip }, async () => {
  const { page, errs } = await open();
  await page.click('#cast-grid .tile >> nth=0');
  const arm = () => page.evaluate(() => JSON.stringify(pg().items[0].pose.armR));
  const before = await arm(); await page.click('#ribbon-sel [data-rb="pose"]'); assert.equal(await page.locator('#pop-pose').isVisible(), true);
  await page.click('#pop-pose [data-pose="wave"]'); assert.notEqual(await arm(), before, 'the pose changed'); assert.equal(await page.locator('#pop-pose').isVisible(), false, 'the pose picker closes');
  await page.selectOption('#ribbon-sel [data-k="expr"]', 'surprised'); assert.equal(await page.evaluate(() => pg().items[0].expr), 'surprised');
  await page.fill('#ribbon-sel [data-rot]', '30'); assert.equal((await items(page))[0].rot, 30);
  await page.click('#ribbon-sel [data-rb="menu-position"]'); await page.click('#menu-position [data-act="align-page-hcenter"]');
  const [b] = await boxes(page); assert.ok(Math.abs(b.x + b.w / 2 - 500) <= 1, `centred on the page (${b.x + b.w / 2})`);
  await page.click('#minibar [data-act="dup"]'); assert.equal((await items(page)).length, 2, 'duplicate from the mini bar');
  await page.click('#minibar [data-act="del"]'); assert.equal((await items(page)).length, 1, 'delete from the mini bar');
  assert.deepEqual(errs, []); await page.close();
});

test('Position menu: layer order and align to the page; keyboard: arrows move, Esc closes and returns focus', { skip }, async () => {
  const { page } = await open(THREE);
  await page.evaluate(() => select([pg().items[0].id]));
  await page.click('[data-rb="menu-position"]'); await page.click('#menu-position [data-act="z-front"]');
  assert.deepEqual((await items(page)).map((i) => i.kind), ['drum', 'plant', 'table'], 'table to the front');
  await page.focus('[data-rb="menu-position"]'); await page.keyboard.press('Enter'); assert.equal(await page.locator('#menu-position').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'z-front', 'first item focused');
  await page.keyboard.press('ArrowDown'); assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'z-up');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#menu-position').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.rb), 'menu-position', 'focus is back on the button');
  await page.click('[data-rb="menu-position"]'); await page.click('#menu-position [data-act="align-page-top"]'); assert.ok(Math.abs((await boxes(page)).at(-1).y) <= 1, 'top of the page');
  await page.close();
});

test('several items: Line up, Space evenly (needs 3), Group, Lock, all from the ribbon', { skip }, async () => {
  const { page } = await open(THREE);
  await page.evaluate(() => select(pg().items.map((i) => i.id)));
  await page.click('[data-rb="menu-align"]'); await page.click('#menu-align [data-act="align-left"]');
  const left = (await boxes(page)).map((b) => Math.round(b.x)); assert.equal(new Set(left).size, 1, 'same left edge: ' + left);
  await page.evaluate(() => { const it = pg().items; it[0].x = 200; it[1].x = 330; it[2].x = 800; renderAll(); select(it.map((i) => i.id)); });
  await page.click('[data-rb="menu-distribute"]'); await page.click('#menu-distribute [data-act="dist-h"]');
  const bs = (await boxes(page)).sort((a, b) => a.x - b.x); const g1 = bs[1].x - (bs[0].x + bs[0].w), g2 = bs[2].x - (bs[1].x + bs[1].w);
  assert.ok(Math.abs(g1 - g2) <= 2, `equal gaps ${g1} / ${g2}`);
  await page.evaluate(() => select(pg().items.slice(0, 2).map((i) => i.id)));
  await page.click('[data-rb="menu-distribute"]'); assert.equal(await page.locator('#menu-distribute [data-act="dist-h"]').isDisabled(), true, 'two items cannot be spaced evenly'); await page.keyboard.press('Escape');
  await page.click('#ribbon-sel [data-act="group"]'); assert.ok((await page.evaluate(() => pg().items.slice(0, 2).every((i) => i.group))));
  await page.close();
});

test('mini bar: below the selection, hides while dragging, Lock gives Unlock, More has the rest', { skip }, async () => {
  const { page } = await open(THREE); await page.evaluate(() => select([]));
  assert.equal(await page.locator('#minibar').isVisible(), false, 'nothing selected');
  await page.evaluate(() => select([pg().items[1].id]));
  const bar = page.locator('#minibar'); assert.equal(await bar.isVisible(), true);
  const sel = await page.evaluate(() => { const r = document.querySelector('#overlay rect[stroke-dasharray]').getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; });
  const bb = await bar.boundingBox(); assert.ok(bb.y >= sel.bottom, 'below the selection (so it never covers the rotate handle)');
  assert.ok(bb.x + bb.width / 2 > sel.left && bb.x + bb.width / 2 < sel.right, 'centred under it');
  // dragging the item hides it; letting go shows it again
  const c = await page.evaluate(() => { const r = document.querySelector('#items [data-id]:nth-child(2)').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.move(c[0], c[1]); await page.mouse.down(); await page.mouse.move(c[0] + 40, c[1] + 10, { steps: 4 }); assert.equal(await bar.isVisible(), false, 'hidden while dragging');
  await page.mouse.up(); assert.equal(await bar.isVisible(), true, 'back after dropping');
  await page.click('#minibar [data-act="lock"]'); assert.equal(await page.locator('#minibar [data-act="unlock"]').isVisible(), true); assert.equal(await page.locator('#minibar [data-act="del"]').count(), 0, 'a locked item cannot be deleted from here');
  assert.equal(await page.locator('#ribbon-sel [data-act="unlock"]').isVisible(), true);
  await page.click('#minibar [data-act="unlock"]');
  await page.click('#minibar [data-mb="more"]'); assert.deepEqual(await page.locator('#menu-more [role=menuitem]').allInnerTexts().then((a) => a.map((t) => t.split('\n')[0].trim())), ['Copy', 'Cut', 'Group', 'Ungroup', 'Zoom to it', 'Details…']);
  await page.click('#menu-more [data-act="details"]'); assert.equal(await page.locator('#right').isVisible(), true);
  await page.close();
});

test('Details panel: closed at first, opens from the ribbon and by double-click, tabs follow the selection, arrow keys move between tabs', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank'); addFigure(CP.characters[0].id); addProp('drum'); renderAll(); select([]);`);
  assert.equal(await page.locator('#right').isVisible(), false);
  await page.click('#details-toggle'); assert.equal(await page.getAttribute('#details-toggle', 'aria-pressed'), 'true');
  assert.equal(await page.locator('#details-title').innerText(), 'Page'); assert.equal(await page.locator('#inspector [role=tab]').count(), 0, 'no tabs for the page');
  await page.evaluate(() => select([pg().items[0].id]));
  assert.deepEqual(await page.locator('#inspector [role=tab]').allInnerTexts(), ['Look', 'Pose', 'Arrange']); assert.ok((await page.locator('#details-title').innerText()).length > 0);
  await page.evaluate(() => select([pg().items[1].id])); assert.deepEqual(await page.locator('#inspector [role=tab]').allInnerTexts(), ['Look', 'Arrange']);
  await page.evaluate(() => select(pg().items.map((i) => i.id))); assert.deepEqual(await page.locator('#inspector [role=tab]').allInnerTexts(), ['Look', 'Arrange']);
  await page.focus('#dtab-look'); await page.keyboard.press('ArrowRight'); assert.equal(await page.getAttribute('#dtab-arrange', 'aria-selected'), 'true'); assert.equal(await page.evaluate(() => document.activeElement.id), 'dtab-arrange');
  // the ribbon's turn box and the Details slider stay in step
  await page.evaluate(() => select([pg().items[1].id])); await page.click('#dtab-arrange');
  await page.fill('#ribbon-sel [data-rot]', '45'); assert.equal(await page.inputValue('#inspector [data-k="rot"]'), '45');
  await page.click('#details-close'); assert.equal(await page.locator('#right').isVisible(), false);
  await page.evaluate(() => select([])); // double-click a prop on the canvas opens the panel
  const c = await page.evaluate(() => { const r = document.querySelectorAll('#items [data-id]')[1].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
  await page.mouse.dblclick(c[0], c[1]); await page.waitForTimeout(50);
  assert.equal(await page.locator('#right').isVisible(), true, 'double-click opens the details');
  assert.deepEqual(errs, []); await page.close();
});

test('snapping: dragging pulls onto the page and other items, shows guides, Alt moves freely, View > Snapping turns it off', { skip }, async () => {
  const { page } = await open(`app.P = STORE.fresh('blank'); addProp('table'); addProp('drum'); pg().items[0].x = 300; pg().items[0].y = 400; pg().items[1].x = 700; pg().items[1].y = 400; renderAll(); select([]);`);
  const drag = async (alt) => {
    await page.evaluate(() => { pg().items[1].x = 700; pg().items[1].y = 520; renderAll(); select([]); });
    const c = await page.evaluate(() => { const r = document.querySelectorAll('#items [data-id]')[1].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    const top0 = (await boxes(page))[1].y; const z = await page.evaluate(() => zoom());
    // move so the drum's centre line is a few page units off the table's centre line
    const tableMid = await page.evaluate(() => { const b = boxOfItems([pg().items[0]]); return b.y + b.h / 2; }); const drumMid = (await boxes(page))[1]; const want = tableMid - (drumMid.y + drumMid.h / 2) + 3;
    if (alt) await page.keyboard.down('Alt');
    await page.mouse.move(c[0], c[1]); await page.mouse.down(); await page.mouse.move(c[0] - 20, c[1] + want * z, { steps: 5 });
    const guides = await page.evaluate(() => (app.guides || []).length); await page.mouse.up(); if (alt) await page.keyboard.up('Alt');
    const b = (await boxes(page))[1]; return { mid: b.y + b.h / 2, tableMid, guides, top0 };
  };
  const snapped = await drag(false); assert.ok(Math.abs(snapped.mid - snapped.tableMid) <= 1, `snapped onto the table's centre line (${snapped.mid} vs ${snapped.tableMid})`); assert.ok(snapped.guides > 0, 'guide shown while dragging');
  assert.equal(await page.evaluate(() => app.guides), null, 'guides clear after the drop');
  const free = await drag(true); assert.ok(Math.abs(free.mid - free.tableMid) >= 2, `Alt: no snapping (${free.mid} vs ${free.tableMid})`);
  await page.click('#btn-view'); assert.equal(await page.getAttribute('#menu-snap', 'aria-checked'), 'true'); await page.click('#menu-snap');
  assert.equal(await page.evaluate(() => app.snap), false); const off = await drag(false); assert.ok(Math.abs(off.mid - off.tableMid) >= 2, 'snapping off');
  await page.close();
});

test('arranging respects locks, and a character\'s front limbs travel with it', { skip }, async () => {
  const { page } = await open(THREE);
  await page.evaluate(() => { pg().items[0].locked = true; renderAll(); select(pg().items.map((i) => i.id)); });
  const x0 = (await items(page))[0].x; await page.click('[data-rb="menu-align"]'); await page.click('#menu-align [data-act="align-right"]');
  assert.equal((await items(page))[0].x, x0, 'the locked item stayed put');
  await page.close();
  const r = await open(`app.P = STORE.fresh('blank'); addFigure(CP.characters[0].id); const f = pg().items[0]; setDetach(f, 'armL', true); renderAll(); select([f.id]);`);
  const before = await r.page.evaluate(() => { const f = pg().items[0]; const l = pg().items.find((i) => i.type === 'limbs'); return !!l && boxOfItems([f]).w >= pageBBox([f]).w; });
  assert.ok(before, 'the box around a character counts its front limbs');
  await r.page.click('[data-rb="menu-position"]'); await r.page.click('#menu-position [data-act="align-page-left"]');
  assert.ok(Math.abs((await boxes(r.page))[0].x) <= 1, 'aligned to the page by its whole outline'); assert.deepEqual(r.errs, []); await r.page.close();
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
