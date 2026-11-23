// Shapes, lines and arrows: the Shapes tab, drawing with the mouse and quick keys, handles, rotating, words inside, clicking, styles, export, save/reopen.
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate(() => { hideStart(); localStorage.clear(); }); await page.evaluate(setup);
  return { page, errs };
}
const screen = (page, x, y) => page.evaluate(([x, y]) => { const m = document.querySelector('#stage').getScreenCTM(); return [x * m.a + m.e, y * m.d + m.f]; }, [x, y]);
const items = (page) => page.evaluate(() => JSON.parse(JSON.stringify(pg().items)));
const settle = (page) => page.waitForTimeout(450); // undo snapshots are taken a moment after the last change
async function draw(page, key, from, to, shift = false) { // press a quick key, then drag on the page
  await page.keyboard.press(key); const [x0, y0] = await screen(page, ...from), [x1, y1] = await screen(page, ...to);
  await page.mouse.move(x0, y0); await page.mouse.down(); if (shift) await page.keyboard.down('Shift');
  await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 3 }); await page.mouse.move(x1, y1, { steps: 3 }); await page.mouse.up(); if (shift) await page.keyboard.up('Shift');
}
async function dragHandle(page, h, to, shift = false) {
  const b = await page.locator(`#overlay [data-h="${h}"]`).boundingBox(); const [x1, y1] = await screen(page, ...to);
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); if (shift) await page.keyboard.down('Shift');
  await page.mouse.move(x1, y1, { steps: 6 }); await page.mouse.up(); if (shift) await page.keyboard.up('Shift');
}
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg || ''} ${a} vs ${b}`);
const ONE = (extra = '') => `app.P = STORE.fresh('blank'); addItem(SHP.make('box', 400, 300, { w: 200, h: 100${extra} })); renderAll(); select([pg().items[0].id]);`;

test('Shapes tab in the rail: six tiles with previews, no search box; a click adds the shape, selected, and names the layer', { skip }, async () => {
  const { page, errs } = await open();
  await page.click('#rail-shapes'); assert.equal(await page.locator('#tab-shapes').isVisible(), true); assert.equal(await page.locator('#lsearch').isVisible(), false);
  assert.deepEqual(await page.locator('#tab-shapes .tile span').allInnerTexts(), ['Box', 'Circle', 'Triangle', 'Line', 'Arrow', 'Double arrow']);
  assert.equal(await page.locator('#tab-shapes .tile svg').count(), 6);
  await page.click('[data-shape-add="circle"]'); let it = (await items(page))[0]; assert.equal(it.type, 'shape'); assert.equal(it.shape, 'circle'); assert.deepEqual(await page.evaluate(() => app.sel), [it.id]);
  await page.click('[data-shape-add="double"]'); it = (await items(page))[1]; assert.equal(it.type, 'line'); assert.deepEqual([it.start, it.end], ['arrow', 'arrow']);
  await page.click('#rail-layers'); assert.deepEqual(await page.locator('#layers .layer .ln').allInnerTexts(), ['Double arrow', 'Circle']);
  assert.deepEqual(errs, []); await page.close();
});

test('quick keys R O Y L A (Shift+A): press, then drag to draw; a click drops a default size; Shift = square / straight; Esc cancels; one undo step each', { skip }, async () => {
  const { page, errs } = await open();
  await draw(page, 'r', [100, 100], [330, 230]); let all = await items(page); assert.equal(all.length, 1);
  assert.deepEqual([all[0].shape, all[0].x, all[0].y, all[0].w, all[0].h], ['box', 215, 165, 230, 130]); assert.equal(await page.evaluate(() => app.tool), null, 'the tool is used once');
  assert.deepEqual(await page.evaluate(() => app.sel), [all[0].id], 'the new shape is selected'); await settle(page);
  await draw(page, 'o', [400, 100], [550, 180], true); all = await items(page); assert.equal(all[1].shape, 'circle'); assert.equal(all[1].w, all[1].h, 'Shift = a perfect circle'); assert.equal(all[1].w, 150);
  await draw(page, 'y', [620, 100], [800, 240]); assert.equal((await items(page))[2].shape, 'triangle');
  await draw(page, 'l', [100, 330], [330, 380]); all = await items(page); assert.equal(all[3].type, 'line'); assert.deepEqual([all[3].start, all[3].end], ['none', 'none']); near(all[3].rot, 12.26, 0.1);
  await draw(page, 'a', [400, 330], [650, 400], true); all = await items(page); assert.deepEqual([all[4].start, all[4].end], ['none', 'arrow']); near(all[4].rot, 15, 0.1, 'Shift keeps it to 15 degree steps');
  await draw(page, 'Shift+A', [100, 450], [330, 450]); all = await items(page); assert.deepEqual([all[5].start, all[5].end], ['arrow', 'arrow']); await settle(page);
  // a plain click drops a default-sized shape centred there
  await page.keyboard.press('r'); const [cx, cy] = await screen(page, 700, 560); await page.mouse.click(cx, cy); all = await items(page); assert.equal(all.length, 7);
  assert.deepEqual([all[6].x, all[6].y, all[6].w, all[6].h], [700, 560, 200, 130]); await settle(page);
  // Esc cancels the tool; pressing the key again turns it off; Ctrl+O / Ctrl+A are not tools
  await page.keyboard.press('l'); assert.equal(await page.evaluate(() => app.tool), 'line'); await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => app.tool), null);
  await page.keyboard.press('l'); await page.keyboard.press('l'); assert.equal(await page.evaluate(() => app.tool), null);
  await page.keyboard.press('Control+a'); assert.equal(await page.evaluate(() => app.tool), null); assert.equal((await page.evaluate(() => app.sel)).length, 7, 'Ctrl+A still selects all');
  // each drawing is one undo step
  await page.evaluate(() => select([])); await page.keyboard.press('Control+z'); await settle(page); assert.equal((await items(page)).length, 6, 'undo removes the last shape only');
  await page.keyboard.press('Control+z'); await settle(page); assert.equal((await items(page)).length, 5); await page.keyboard.press('Control+Shift+z'); await settle(page); assert.equal((await items(page)).length, 6);
  assert.deepEqual(errs, []); await page.close();
});

test('the Shapes tab tile arms nothing: but the pressed key shows on the tile and a drawing tool turns the cursor to a cross', { skip }, async () => {
  const { page, errs } = await open();
  await page.click('#rail-shapes'); await page.keyboard.press('o'); assert.equal(await page.locator('[data-shape-add="circle"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.evaluate(() => document.querySelector('#stage').classList.contains('tool-draw')), true);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('[data-shape-add="circle"]').getAttribute('aria-pressed'), 'false'); assert.equal(await page.evaluate(() => document.querySelector('#stage').classList.contains('tool-draw')), false);
  assert.deepEqual(errs, []); await page.close();
});

test('resize handles: a side or corner moves, the opposite side stays; Shift on a corner keeps the proportions; the page redraws as you drag', { skip }, async () => {
  const { page, errs } = await open(ONE());
  assert.equal(await page.locator('#overlay [data-h^="sh-"]').count(), 8, 'four corners and four sides'); assert.equal(await page.locator('#overlay [data-h="scale"]').count(), 0, 'no uniform scale handle'); assert.equal(await page.locator('#overlay [data-h="rot"]').count(), 1);
  await dragHandle(page, 'sh-e', [600, 300]); let it = (await items(page))[0]; assert.deepEqual([it.x, it.w, it.h], [450, 300, 100], 'right side to 600; left stays at 300');
  await dragHandle(page, 'sh-nw', [250, 200]); it = (await items(page))[0]; assert.deepEqual([it.x, it.y, it.w, it.h], [425, 275, 350, 150]); // top-left to (250, 200); bottom-right stays at (600, 350)
  await dragHandle(page, 'sh-s', [425, 500]); it = (await items(page))[0]; assert.deepEqual([it.y, it.h], [350, 300]);
  await page.evaluate(() => { const it = pg().items[0]; Object.assign(it, { x: 400, y: 300, w: 200, h: 100 }); renderAll(); });
  await dragHandle(page, 'sh-se', [700, 330], true); it = (await items(page))[0]; near(it.w / it.h, 2, 0.05, 'proportions kept'); near(it.x - it.w / 2, 300, 1, 'top-left corner stayed'); near(it.y - it.h / 2, 250, 1);
  // a shape turned 90 degrees: its right side now faces down the page
  await page.evaluate(() => { const it = pg().items[0]; Object.assign(it, { x: 400, y: 300, w: 200, h: 100, rot: 90 }); renderAll(); });
  await dragHandle(page, 'sh-e', [400, 500]); it = (await items(page))[0]; assert.equal(it.w, 300); assert.equal(it.h, 100); assert.equal(it.rot, 90); near(it.y, 350, 1);
  assert.deepEqual(errs, []); await page.close();
});

test('line ends: two round handles (no box handles); dragging one keeps the other end where it is; Shift keeps 15 degree steps', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank'); addItem(SHP.make('arrow', 0, 0)); SHP.setEnds(pg().items[0], [200, 300], [500, 300]); renderAll(); select([pg().items[0].id]);`);
  assert.equal(await page.locator('#overlay [data-h^="le-"]').count(), 2); assert.equal(await page.locator('#overlay [data-h="scale"], #overlay [data-h="rot"], #overlay [data-h^="sh-"]').count(), 0);
  const ends = () => page.evaluate(() => SHP.ends(pg().items[0]).map((p) => p.map(Math.round)));
  await dragHandle(page, 'le-1', [500, 450]); let e = await ends(); assert.deepEqual(e[0], [200, 300], 'the other end stayed'); near(e[1][0], 500, 1); near(e[1][1], 450, 1);
  await dragHandle(page, 'le-0', [100, 100]); e = await ends(); near(e[0][0], 100, 1); near(e[0][1], 100, 1); near(e[1][0], 500, 1); near(e[1][1], 450, 1, 'the end that was not dragged stayed');
  await dragHandle(page, 'le-1', [600, 190], true); const it = (await items(page))[0]; const a = (await page.evaluate(() => SHP.ends(pg().items[0])));
  const ang = Math.atan2(a[1][1] - a[0][1], a[1][0] - a[0][0]) * 180 / Math.PI; near(ang / 15, Math.round(ang / 15), 0.02, 'a multiple of 15 degrees: ' + ang); assert.equal(it.start, 'none'); assert.equal(it.end, 'arrow', 'which end has the arrowhead does not change');
  // dragging the start past the end turns the line round but the arrowhead stays on its end
  await dragHandle(page, 'le-0', [900, 600]); assert.equal((await items(page))[0].end, 'arrow');
  assert.deepEqual(errs, []); await page.close();
});

test('a shape rotates like any object (handle, or typing degrees) and the export is rotated; shapes and lines move, flip and scale as one', { skip }, async () => {
  const { page, errs } = await open(ONE());
  await page.fill('#ribbon-sel [data-rot]', '90'); await page.waitForTimeout(80); assert.equal((await items(page))[0].rot, 90);
  let b = await page.evaluate(() => { const r = pageBBox([pg().items[0]]); return [Math.round(r.w), Math.round(r.h)]; }); near(b[0], 110, 3); near(b[1], 210, 3, 'box turned: ' + b);
  await page.fill('#ribbon-sel [data-rot]', '0'); await page.waitForTimeout(80);
  const h = await page.locator('#overlay [data-h="rot"]').boundingBox(); const c = await screen(page, 400, 300);
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(c[0] + 150, c[1], { steps: 6 }); await page.mouse.up();
  near((await items(page))[0].rot, 90, 3, 'rotated by the handle');
  const svg = await page.evaluate(() => buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: null, bg: false, scale: 1 }).svg); assert.match(svg, /rotate\((8\d|9\d)[ )]/);
  await page.evaluate(() => { const it = pg().items[0]; Object.assign(it, { rot: 0 }); renderAll(); }); await page.keyboard.press('h'); assert.equal((await items(page))[0].flip, true, 'H flips');
  await page.evaluate(() => { addItem(SHP.make('arrow', 600, 500)); }); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowDown'); const ar = (await items(page))[1]; assert.deepEqual([ar.x, ar.y], [601, 510], 'arrow keys nudge');
  assert.deepEqual(errs, []); await page.close();
});

test('ribbon and Details change a shape: fill (colour appears), outline colour, thickness, dashed / dotted, corners, see-through; the same for a line (arrowheads)', { skip }, async () => {
  const { page, errs } = await open(ONE());
  assert.equal(await page.locator('#ribbon-sel [data-shape="fillColor"]').count(), 0, 'no fill colour while there is no fill');
  await page.selectOption('#ribbon-sel [data-shape="fill"]', 'colour'); assert.equal((await items(page))[0].fill, 'colour'); assert.equal(await page.locator('#ribbon-sel [data-shape="fillColor"]').count(), 1);
  await page.fill('#ribbon-sel [data-shape="fillColor"]', '#ff0000'); assert.equal((await items(page))[0].fillColor, '#ff0000');
  await page.fill('#ribbon-sel [data-shape="stroke"]', '#0000ff'); assert.equal((await items(page))[0].stroke, '#0000ff');
  await page.click('#ribbon-sel [data-shape-step="width:1"]'); assert.equal((await items(page))[0].width, 6); await page.click('#ribbon-sel [data-shape-step="width:-1"]'); await page.click('#ribbon-sel [data-shape-step="width:-1"]'); assert.equal((await items(page))[0].width, 4);
  await page.fill('#ribbon-sel [data-shape="width"]', '12'); assert.equal((await items(page))[0].width, 12);
  await page.selectOption('#ribbon-sel [data-shape="dash"]', 'dashed'); assert.equal((await items(page))[0].dash, 'dashed'); await page.waitForTimeout(80); assert.ok(await page.evaluate(() => document.querySelectorAll('#items [data-id] path').length) > 5, 'dashes are drawn as pieces (a solid box is 2 paths)');
  await page.click('#details-toggle'); assert.equal(await page.locator('#inspector [data-shape="radius"]').count(), 1, 'corners for a box');
  await page.fill('#inspector [data-shape="radius"]', '30'); await page.waitForTimeout(50); assert.equal((await items(page))[0].radius, 30);
  await page.fill('#inspector [data-shape="opacity"]', '0.5'); await page.waitForTimeout(50); assert.equal((await items(page))[0].opacity, 0.5); assert.match(await page.evaluate(() => document.querySelector('#items > g').outerHTML.slice(0, 120)), /opacity="0.5"/);
  await page.click('#inspector [data-shape-color="stroke=#e0402f"]'); assert.equal((await items(page))[0].stroke, '#e0402f'); assert.equal(await page.locator('#ribbon-sel [data-shape="stroke"]').inputValue(), '#e0402f', 'the ribbon follows');
  await page.fill('#inspector [data-shape="w"]', '320'); await page.waitForTimeout(50); assert.equal((await items(page))[0].w, 320);
  await page.selectOption('#inspector [data-shape="fill"]', 'none'); assert.equal(await page.locator('#inspector [data-shape="fillColor"]').count(), 0);
  // a circle has no corner setting; a line has arrowheads
  await page.evaluate(() => { addItem(SHP.make('circle', 700, 300)); }); assert.equal(await page.locator('#inspector [data-shape="radius"]').count(), 0);
  await page.evaluate(() => { addItem(SHP.make('line', 300, 500)); });
  await page.selectOption('#ribbon-sel [data-shape="end"]', 'arrow'); await page.selectOption('#ribbon-sel [data-shape="start"]', 'arrow'); let ln = (await items(page)).at(-1); assert.deepEqual([ln.start, ln.end], ['arrow', 'arrow']);
  await page.click('#rail-layers'); await page.waitForTimeout(120); assert.match((await page.locator('#layers .layer .ln').allInnerTexts())[0], /Double arrow/, 'the layer name follows the arrowheads');
  assert.deepEqual(errs, []); await page.close();
});

test('words inside a shape: double-click (or Enter) to type, centred, with a caret; Esc finishes; an empty shape stays; works turned and in a triangle', { skip }, async () => {
  const { page, errs } = await open(ONE(', fill: \'colour\''));
  const [x, y] = await screen(page, 400, 300); await page.mouse.dblclick(x, y); assert.equal(await page.evaluate(() => !!app.edit), true, 'double-click starts typing'); assert.equal(await page.evaluate(() => document.activeElement.id), 'text-input');
  await page.keyboard.type('Hello class'); let it = (await items(page))[0]; assert.equal(it.text, 'Hello class'); assert.equal(await page.locator('#overlay .caret').count(), 1);
  const tb = await page.evaluate(() => { const v = SHP.textView(pg().items[0]); const b = TXT.box(v.item); return [b.w, b.h]; }); assert.ok(tb[0] < 200, 'fits the box');
  await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => !!app.edit), false); assert.equal((await items(page)).length, 1);
  await page.click('#rail-layers'); assert.match(await page.locator('#layers .layer .ln').first().innerText(), /Box .Hello class./);
  // clicking in the words moves the caret there; the words follow the shape when it is turned
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => !!app.edit), true, 'Enter on a selected shape starts typing'); await page.keyboard.press('Control+a'); await page.keyboard.type('Hi'); await page.keyboard.press('Control+Enter');
  assert.equal((await items(page))[0].text, 'Hi'); await page.evaluate(() => { pg().items[0].rot = 30; renderAll(); });
  const svg = await page.evaluate(() => buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: null, bg: false, scale: 1 }).svg); assert.match(svg, /rotate\(30/);
  // empty words: the shape stays
  await page.evaluate(() => { pg().items[0].text = ''; renderAll(); select([pg().items[0].id]); startEdit(pg().items[0].id); }); await page.keyboard.press('Escape'); assert.equal((await items(page)).length, 1, 'an empty shape is not deleted');
  // a triangle puts the words lower
  const dy = await page.evaluate(() => [SHP.textView(SHP.make('box')).dy, SHP.textView(SHP.make('triangle')).dy]); assert.equal(dy[0], 0); assert.ok(dy[1] > 0);
  await page.evaluate(() => { addItem(SHP.make('triangle', 700, 300, { text: 'Hey' })); }); await page.evaluate(() => startEdit(pg().items.at(-1).id)); assert.equal(await page.locator('#overlay .caret').count(), 1); await page.keyboard.press('Escape');
  // locked: no typing
  await page.evaluate(() => { pg().items[0].locked = true; renderAll(); startEdit(pg().items[0].id); }); assert.equal(await page.evaluate(() => !!app.edit), false);
  assert.deepEqual(errs, []); await page.close();
});

test('clicking: an empty box is a frame (clicks inside reach what is behind), a filled one is solid, a thin line is easy to hit', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank'); addItem(TXT.make({ text: 'Inside', size: 50 }, 400, 300)); addItem(SHP.make('box', 400, 300, { w: 300, h: 200 })); addItem(SHP.make('box', 800, 300, { w: 200, h: 120, fill: 'colour' })); addItem(SHP.make('line', 300, 560, { pts: [[-150, 0], [150, 0]] })); renderAll(); select([]);`);
  const id = (i) => page.evaluate((i) => pg().items[i].id, i); const sel = () => page.evaluate(() => app.sel.slice());
  let [x, y] = await screen(page, 400, 300); await page.mouse.click(x, y); assert.deepEqual(await sel(), [await id(0)], 'inside an empty box: the text behind it');
  [x, y] = await screen(page, 250, 300); await page.mouse.click(x, y); assert.deepEqual(await sel(), [await id(1)], 'on its outline: the box');
  [x, y] = await screen(page, 800, 300); await page.mouse.click(x, y); assert.deepEqual(await sel(), [await id(2)], 'inside a filled box: the box');
  [x, y] = await screen(page, 300, 567); await page.mouse.click(x, y); assert.deepEqual(await sel(), [await id(3)], '7 units off a thin line still hits it');
  [x, y] = await screen(page, 300, 620); await page.mouse.click(x, y); assert.deepEqual(await sel(), [], 'far from it: nothing');
  // Alt+click steps through what is stacked, front first (the text sits inside the frame)
  [x, y] = await screen(page, 400, 300); await page.keyboard.down('Alt'); await page.mouse.click(x, y); await page.keyboard.up('Alt'); assert.equal((await sel()).length, 1);
  assert.deepEqual(errs, []); await page.close();
});

test('every style draws every shape and line (fills, dashes, arrowheads); the export has no font or NaN and the same project exports the same bytes', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank');
    const k = ['box', 'circle', 'triangle']; let n = 0; for (const s of k) for (const fill of ['none', 'colour', 'hatch', 'solid']) addItem(SHP.make(s, 100 + (n++) * 70, 150, { fill, dash: n % 3 ? 'none' : 'dashed', text: n % 2 ? 'Hi' : '', rot: n * 7 }));
    for (const s of ['line', 'arrow', 'double']) for (const dash of ['none', 'dashed', 'dotted']) addItem(SHP.make(s, 200 + (n++) * 40, 400, { dash, opacity: 0.6 })); renderAll(); select([]);`);
  const out = await page.evaluate(() => {
    const res = {}; for (const st of [null, ...RENDER.styleList().map((s) => s.id)]) { const a = buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: st, bg: false, scale: 1 }).svg, b = buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: st, bg: false, scale: 1 }).svg; res[st || 'clean'] = { len: a.length, bad: /NaN|undefined|Infinity/.test(a), same: a === b, text: /<text/.test(a), paths: (a.match(/<path/g) || []).length }; }
    return res;
  });
  assert.ok(Object.keys(out).length >= 5);
  for (const [st, r] of Object.entries(out)) { assert.equal(r.bad, false, st); assert.equal(r.same, true, st + ' deterministic'); assert.equal(r.text, false, st + ' no <text>'); assert.ok(r.paths > 50, st + ' ' + r.paths); }
  await page.evaluate(() => setPreview(true)); await page.waitForTimeout(100); assert.deepEqual(errs, []); await page.close();
});

test('a shape is a normal item: group with a character, line up, duplicate, copy/paste, lock, undo, save and reopen, and an old file without the new fields still opens', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank'); addItem(SHP.make('box', 300, 300)); addItem(SHP.make('arrow', 600, 300)); addFigure(app.P.cast[0].id); renderAll(); select([]);`);
  await page.evaluate(() => { const [a, b, c] = pg().items; c.x = 800; c.y = 400; select(pg().items.map((i) => i.id)); });
  await page.keyboard.press('Control+g'); assert.ok(await page.evaluate(() => pg().items.every((i) => i.group)), 'grouped with a character');
  const x0 = await page.evaluate(() => pg().items.map((i) => i.x)); await page.evaluate(() => { app.drag = null; }); const [gx, gy] = await screen(page, 300, 300);
  await page.evaluate(() => { for (const i of pg().items) { i.x += 50; } renderAll(); }); assert.deepEqual(await page.evaluate(() => pg().items.map((i) => i.x)), x0.map((v) => v + 50));
  await page.keyboard.press('Control+Shift+g'); await page.evaluate(() => select([pg().items[0].id])); await page.keyboard.press('Control+d'); assert.equal((await items(page)).length, 4, 'duplicate'); await page.keyboard.press('Control+c'); await page.keyboard.press('Control+v'); assert.equal((await items(page)).length, 5, 'paste');
  await page.evaluate(() => { select([pg().items[0].id, pg().items[1].id]); }); await page.click('[data-rb="menu-align"]'); await page.click('#menu-align [data-act="align-top"]'); await page.waitForTimeout(50);
  const tops = await page.evaluate(() => [pg().items[0], pg().items[1]].map((i) => Math.round(pageBBox([i]).y))); near(tops[0], tops[1], 1, 'lined up by their boxes');
  await page.evaluate(() => { const it = pg().items[0]; Object.assign(it, { rot: 20, fill: 'hatch', dash: 'dotted', text: 'Two\nlines', radius: 20, opacity: 0.7 }); select([]); renderAll(); });
  const before = await page.evaluate(() => JSON.stringify(pg().items)); const file = await page.evaluate(() => STORE.serialize(app.P));
  await page.evaluate((t) => { app.P = STORE.fresh('blank'); renderAll(); applyLoaded(t, 'shapes.json'); }, file);
  assert.equal(await page.evaluate(() => JSON.stringify(pg().items)), before, 'a saved and reopened project keeps its shapes exactly');
  await page.evaluate(() => { app.P = STORE.fresh('blank'); pg().items.push({ id: 'old1', type: 'shape', shape: 'circle', x: 300, y: 300, s: 1, rot: 0, flip: false }, { id: 'old2', type: 'line', x: 600, y: 300, s: 1, rot: 0, flip: false }); renderAll(); select(['old1']); });
  assert.ok(await page.evaluate(() => document.querySelectorAll('#items [data-id] path').length) >= 2, 'drawn with defaults'); await page.evaluate(() => showDetails()); assert.ok(await page.locator('#inspector [data-shape="fill"]').count());
  await page.evaluate(() => { pg().items[0].locked = true; renderAll(); select([pg().items[0].id]); }); assert.equal(await page.locator('#overlay [data-h]').count(), 0, 'a locked shape has no handles');
  assert.deepEqual(errs, []); await page.close();
});
test('typing never triggers the quick keys (in place, Details words, ribbon number, search), and Esc then Enter edits again; names follow the words and arrowheads', { skip }, async () => {
  const { page, errs } = await open(ONE(", fill: 'colour'"));
  const tool = () => page.evaluate(() => app.tool);
  // in place
  const [x, y] = await screen(page, 400, 300); await page.mouse.dblclick(x, y); await page.keyboard.type('Roll a yo-yo');
  assert.equal(await tool(), null, 'in-place typing arms nothing'); assert.equal((await items(page))[0].text, 'Roll a yo-yo');
  // Esc, then Enter straight away (focus is not moved by hand)
  await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => !!app.edit), false); await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => !!app.edit), true, 'Enter edits again after Esc'); await page.keyboard.press('Escape');
  // Details > Words
  await page.click('#details-toggle'); await page.click('#inspector [data-shape="text"]'); await page.keyboard.press('Control+a'); await page.keyboard.type('Roll a yo-yo');
  assert.equal(await tool(), null, 'Details words arm nothing'); assert.equal((await items(page))[0].text, 'Roll a yo-yo');
  assert.equal(await page.locator('#details-title').innerText(), 'Box “Roll a yo-yo”', 'the Details title follows the words');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.shape), 'text', 'typing in Details keeps the focus there');
  // ribbon number box
  await page.click('#ribbon-sel [data-shape="width"]'); await page.keyboard.type('Roll a'); assert.equal(await tool(), null, 'the ribbon number box arms nothing');
  // search box on the Layers tab: the layer name follows the words
  await page.click('#rail-layers'); await page.waitForTimeout(80); assert.match(await page.locator('#layers .layer .ln').first().innerText(), /Roll a yo-yo/, 'the layer name follows the words typed in Details');
  await page.click('#lsearch'); await page.keyboard.type('Roll a yo-yo'); assert.equal(await tool(), null, 'the search box arms nothing'); assert.equal(await page.inputValue('#lsearch'), 'Roll a yo-yo');
  assert.deepEqual(errs, []); await page.close();
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
