// New props from the owner's point of view: click the tiles in the Props tab (no scripts), and the page comes out right.
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

async function open(setup) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => { hideStart(); localStorage.clear(); }); await page.evaluate(setup); await page.waitForTimeout(150);
  return { page, errs };
}
const CLASSROOM = `restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll(); select([]);`;
const openProps = async (page) => { if (!(await page.locator('#lsearch').isVisible()) || (await page.locator('#rail-props').getAttribute('aria-selected')) !== 'true') await page.click('#rail-props'); }; // (a second click on the open tab would fold it)
const clickTile = async (page, id) => { await openProps(page); await page.fill('#lsearch', id); await page.waitForTimeout(100); await page.locator(`#tab-props [data-add-prop="${id}"]`).click(); await page.waitForTimeout(100); };

test('backdrops from the Props tab land in place, fill the page and go behind everything, in order, wherever they are added from', { skip }, async () => {
  const { page, errs } = await open(CLASSROOM); const before = await page.evaluate(() => pg().items.length);
  for (const id of ['scenery-ground', 'scenery-sky', 'scenery-wall', 'scenery-hills']) await clickTile(page, id); // deliberately in a "wrong" order
  const r = await page.evaluate(() => ({ kinds: pg().items.map((i) => i.kind || i.cast), items: pg().items.filter((i) => /^scenery-/.test(i.kind || '')).map((i) => ({ kind: i.kind, x: i.x, y: i.y, w: i.params.width, h: i.params.height })) }));
  assert.equal(r.kinds.length, before + 4); assert.deepEqual(r.kinds.slice(0, 4), ['scenery-sky', 'scenery-wall', 'scenery-hills', 'scenery-ground'], 'sky, wall, hills, ground are the four furthest back, in that order'); assert.ok(!r.kinds.slice(4).some((k) => /^scenery-/.test(k)), 'everything else is in front of them');
  const by = Object.fromEntries(r.items.map((i) => [i.kind, i]));
  assert.deepEqual([by['scenery-ground'].x, by['scenery-ground'].y, by['scenery-ground'].w], [500, 750, 1000], 'ground along the bottom, as wide as the page');
  assert.deepEqual([by['scenery-sky'].x, by['scenery-sky'].y, by['scenery-sky'].w, by['scenery-sky'].h], [500, 600, 1000, 600], 'sky from the top of the page down to the top of the ground');
  assert.equal(by['scenery-sky'].y - by['scenery-sky'].h, 0, 'no white band above the sky'); assert.equal(by['scenery-wall'].y - by['scenery-wall'].h, 0, 'nor above the wall');
  assert.equal(by['scenery-sky'].y, 750 - 150, 'the sky ends where the ground (150 deep) begins'); assert.equal(by['scenery-wall'].y, 600, 'the wall ends where the floor or ground begins');
  assert.equal(await page.evaluate(() => app.P.pages[0].items.length), before + 4); await page.keyboard.press('Control+z'); assert.equal(await page.evaluate(() => pg().items.length), before + 3, 'one undo step per click');
  assert.deepEqual(errs, []);
});
test('a smaller page gets backdrops that still fit it', { skip }, async () => {
  const { page, errs } = await open(`app.P = STORE.fresh('blank'); app.P.settings.pageW = 1000; app.P.settings.pageH = 563; renderAll(); select([]);`);
  for (const id of ['scenery-sky', 'scenery-ground']) await clickTile(page, id);
  const r = await page.evaluate(() => pg().items.map((i) => ({ kind: i.kind, x: i.x, y: i.y, w: i.params.width, h: i.params.height })));
  assert.equal(r[0].kind, 'scenery-sky'); assert.ok(Math.abs(r[0].y - r[0].h) <= 20, `sky reaches the top: y ${r[0].y} height ${r[0].h}`); assert.deepEqual([r[1].y, r[1].w], [563, 1000]);
  assert.deepEqual(errs, []);
});
test('ordinary props still land mid-page on top, and the house, fence and stones are in the Props tab with their search words', { skip }, async () => {
  const { page, errs } = await open(CLASSROOM);
  await clickTile(page, 'home-house'); assert.equal(await page.evaluate(() => pg().items.at(-1).kind), 'home-house', 'on top');
  await openProps(page); await page.fill('#lsearch', 'cottage'); await page.waitForTimeout(150); assert.ok(await page.locator('#tab-props .tile').count() >= 1, 'found by a search word');
  assert.deepEqual(errs, []);
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
