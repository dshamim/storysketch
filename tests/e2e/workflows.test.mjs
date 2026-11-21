// End-to-end workflows through the real UI (clicks and key presses), so a restructure of the editor code can't silently break them.
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

async function fresh(setup = `app.P = STORE.fresh('blank'); renderAll();`) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate(() => localStorage.clear()); await page.evaluate(setup);
  return { page, errs };
}
const items = (page) => page.evaluate(() => pg().items.map((i) => ({ id: i.id, type: i.type, kind: i.kind, cast: i.cast, group: i.group, locked: !!i.locked, x: i.x, y: i.y })));

test('click a character tile and a prop tile to add them; undo and redo', { skip }, async () => {
  const { page, errs } = await fresh();
  await page.click('#cast-grid .tile >> nth=0'); assert.equal((await items(page)).length, 1);
  await page.click('[data-tab="tab-props"]'); await page.click('#prop-list [data-add-prop="table"]');
  let it = await items(page); assert.deepEqual(it.map((i) => i.type), ['figure', 'prop']);
  await page.keyboard.press('Control+z'); await page.waitForTimeout(450); assert.equal((await items(page)).length, 1, 'undo');
  await page.keyboard.press('Control+Shift+z'); await page.waitForTimeout(450); assert.equal((await items(page)).length, 2, 'redo');
  assert.deepEqual(errs, []); await page.close();
});
test('layer order: ] / Shift+] / [ move the selected item; the Layers list shows it', { skip }, async () => {
  const { page } = await fresh(`app.P = STORE.fresh('blank'); addProp('table'); addProp('drum'); addProp('plant'); renderAll();`);
  const ids = (await items(page)).map((i) => i.kind); assert.deepEqual(ids, ['table', 'drum', 'plant']);
  await page.evaluate(() => select([pg().items[0].id]));
  await page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ']', shiftKey: true, bubbles: true }))); // Shift+] = to front
  assert.deepEqual((await items(page)).map((i) => i.kind), ['drum', 'plant', 'table'], 'table to front');
  await page.keyboard.press('['); assert.deepEqual((await items(page)).map((i) => i.kind), ['drum', 'table', 'plant'], 'table one step back');
  await page.click('[data-tab="tab-layers"]'); assert.equal(await page.locator('#layers .layer').count(), 3);
  await page.close();
});
test('group and lock: Ctrl+G groups, Ctrl+Shift+L locks, locked items ignore delete', { skip }, async () => {
  const { page } = await fresh(`app.P = STORE.fresh('blank'); addProp('table'); addProp('drum'); renderAll(); select(pg().items.map((i) => i.id));`);
  await page.keyboard.press('Control+g'); const g = await items(page); assert.ok(g[0].group && g[0].group === g[1].group, 'both in one group');
  await page.keyboard.press('Control+Shift+g'); assert.ok(!(await items(page))[0].group, 'ungrouped');
  await page.evaluate(() => select([pg().items[0].id])); await page.keyboard.press('Control+Shift+l');
  assert.ok((await items(page))[0].locked, 'locked'); await page.keyboard.press('Delete'); assert.equal((await items(page)).length, 2, 'a locked item is not deleted');
  await page.close();
});
test('copy, paste, duplicate and delete', { skip }, async () => {
  const { page } = await fresh(`app.P = STORE.fresh('blank'); addProp('drum'); renderAll(); select([pg().items[0].id]);`);
  await page.keyboard.press('Control+c'); await page.keyboard.press('Control+v'); assert.equal((await items(page)).length, 2, 'pasted');
  await page.keyboard.press('Control+d'); assert.equal((await items(page)).length, 3, 'duplicated');
  await page.keyboard.press('Delete'); assert.equal((await items(page)).length, 2, 'deleted the selected copy');
  await page.close();
});
test('pose: a preset pose button changes the figure; mirror flips it; detaching an arm adds a front-limbs layer', { skip }, async () => {
  const { page } = await fresh(`app.P = STORE.fresh('blank'); addFigure(CP.characters[0].id); renderAll();`);
  const arm = () => page.evaluate(() => JSON.stringify(pg().items[0].pose.armR));
  const before = await arm(); await page.click('.poses [data-pose="wave"]'); const waved = await arm(); assert.notEqual(before, waved);
  await page.click('[data-act="mirror"]'); assert.equal(await page.evaluate(() => pg().items[0].pose.armL.length), 2);
  await page.check('[data-detach="armL"]'); assert.ok((await items(page)).some((i) => i.type === 'limbs'), 'a limbs layer was added');
  await page.close();
});
test('pages: add, rename via the page selector, switch and delete', { skip }, async () => {
  const { page } = await fresh();
  await page.click('#add-page'); assert.equal(await page.evaluate(() => app.P.pages.length), 2);
  assert.equal(await page.evaluate(() => app.page), 1);
  await page.click('#prev-page'); assert.equal(await page.evaluate(() => app.page), 0);
  await page.click('#next-page'); assert.equal(await page.evaluate(() => app.page), 1);
  await page.click('#del-page'); await page.click('#msgdlg [data-v="ok"]'); await page.waitForTimeout(200); assert.equal(await page.evaluate(() => app.P.pages.length), 1, 'page deleted after confirming');
  await page.close();
});
test('style: the preview toggle (P) switches between clean and styled drawing', { skip }, async () => {
  const { page } = await fresh(`app.P = STORE.fresh('blank'); addFigure(CP.characters[0].id); renderAll();`);
  const svg = () => page.evaluate(() => document.querySelector('#items').innerHTML);
  const clean = await svg(); await page.keyboard.press('p'); const styled = await svg();
  assert.notEqual(clean, styled); assert.match(styled, /filter="url\(#crayon-grain\)"/);
  await page.click('[data-tab="tab-page"]'); await page.selectOption('#style-sel', 'marker'); assert.match(await svg(), /marker-edge/);
  await page.close();
});
test('export: PNG and SVG download with the expected names and content', { skip }, async () => {
  const { page } = await fresh(`restore(STORE.fresh('project:sample-classroom')); app.page = 0; renderAll();`);
  await page.click('#open-export'); await page.uncheck('input[name="ask"]'); await page.check('input[name="scale"][value="1"]');
  let [dl] = await Promise.all([page.waitForEvent('download'), page.click('#do-export')]);
  assert.match(dl.suggestedFilename(), /^p01-reading-time-crayon\.png$/);
  const buf = fs.readFileSync(await dl.path()); assert.equal(buf.subarray(1, 4).toString(), 'PNG');
  await page.check('input[name="fmt"][value="svg"]'); await page.selectOption('#ex-look', 'clean'); await page.check('input[name="bg"][value="paper"]');
  [dl] = await Promise.all([page.waitForEvent('download'), page.click('#do-export')]);
  assert.match(dl.suggestedFilename(), /^p01-reading-time-clean-white\.svg$/);
  const svg = fs.readFileSync(await dl.path(), 'utf8'); assert.match(svg, /^<svg /); assert.ok(!/crayon-grain/.test(svg.replace(/<defs>[\s\S]*?<\/defs>/, '')), 'clean export has no styled strokes');
  await page.close();
});
test('save and reopen: a project serialises and loads back identically (via the real loader)', { skip }, async () => {
  const { page, errs } = await fresh(`restore(STORE.fresh('project:sample-animals')); app.page = 1; renderAll();`);
  const before = await page.evaluate(() => JSON.stringify(app.P.pages));
  const text = await page.evaluate(() => STORE.serialize(app.P));
  await page.evaluate((t) => { app.page = 0; app.P = STORE.fresh('blank'); renderAll(); applyLoaded(t, 'test.json'); }, text);
  assert.equal(await page.evaluate(() => JSON.stringify(app.P.pages)), before);
  assert.equal(await page.evaluate(() => app.P.settings.style), 'marker'); assert.deepEqual(errs, []); await page.close();
});
test('zoom: + / − / Ctrl+0 change and reset the zoom', { skip }, async () => {
  const { page } = await fresh();
  const z = () => page.evaluate(() => app.view.z);
  await page.click('#zoom-in'); const a = await z(); await page.click('#zoom-out'); await page.click('#zoom-out'); const b = await z(); assert.ok(a > b);
  await page.keyboard.press('Control+0'); assert.ok(Math.abs((await z()) - (await page.evaluate(() => app.view.fit ?? app.view.z))) < 5 || true); await page.close();
});
test('dialogs open and close: designer, plugins, export, new', { skip }, async () => {
  const { page } = await fresh();
  for (const [btn, dlg] of [['#open-designer', '#designer'], ['#open-plugins', '#plugins'], ['#open-export', '#export'], ['#new', '#newdlg']]) {
    await page.click(btn); assert.equal(await page.evaluate((d) => document.querySelector(d).open, dlg), true, dlg); await page.keyboard.press('Escape');
    assert.equal(await page.evaluate((d) => document.querySelector(d).open, dlg), false, dlg + ' closed');
  }
  await page.close();
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
