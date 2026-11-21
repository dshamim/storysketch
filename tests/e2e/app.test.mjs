// Browser smoke test: loads the real page in headless Chromium (via playwright-core + a Chromium already on the
// machine) from a static server, builds a small scene, and renders/exports it in every style.
// Skipped automatically if no browser is available.  Run:  npm run test:e2e
import test from 'node:test'; import assert from 'node:assert/strict'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { ROOT } from '../helpers/sandbox.mjs';

let chromium; try { ({ chromium } = await import('playwright-core')); } catch { /* not installed */ }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;
let browser; try { browser = chromium && await chromium.launch({ args: ['--no-sandbox'] }); } catch { /* no browser */ }
const skip = browser ? false : 'no Chromium available (install playwright-core and a browser)';

test('page loads with no console errors and no plugin problems', { skip }, async () => {
  const page = await browser.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  assert.deepEqual(errs, []);
  assert.deepEqual(await page.evaluate(() => [...CP.warnings]), []);
  assert.equal(await page.evaluate(() => document.title), 'StorySketch');
  await page.close();
});
test('every style renders a scene and exports SVG', { skip }, async () => {
  const page = await browser.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  const out = await page.evaluate(() => {
    app.P = STORE.fresh('blank'); addProp('table'); addFigure(CP.characters[0].id); select([]);
    const res = {};
    for (const st of RENDER.styleList().map((s) => s.id)) { // order: crayon, marker, ink, chalk
      setStyle(st); setPreview(true);
      const items = pg().items; res[st] = buildSVG(items, { x: 0, y: 0, w: 1000, h: 750 }, { style: st, bg: true, scale: 1 }).svg.length;
    }
    res.order = RENDER.styleList().map((s) => s.id); res.paper = app.P.settings.paper; return res;
  });
  assert.deepEqual(errs, []);
  for (const st of ['crayon', 'marker', 'ink', 'chalk']) assert.ok(out[st] > 2000, `${st} export too small`);
  assert.deepEqual(out.order, ['crayon', 'marker', 'ink', 'chalk']);
  assert.notEqual(out.paper, '#ffffff', 'chalk (the last style) should have switched the page to a dark colour');
  await page.close();
});
test('the style picker and export Look list show every style', { skip }, async () => {
  const page = await browser.newPage(); await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  const opts = await page.evaluate(() => [[...document.querySelectorAll('#style-sel option')].map((o) => o.value), [...document.querySelectorAll('#ex-look option')].map((o) => o.value)]);
  assert.deepEqual(opts[0], ['crayon', 'marker', 'ink', 'chalk']); assert.ok(opts[1].includes('clean') && opts[1].length === 5);
  await page.close();
});
test('selecting a figure shows its rig handles; dragging a hand handle really poses it', { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  await page.evaluate(() => { app.P = STORE.fresh('blank'); addFigure(CP.characters[0].id); renderStage(); });
  assert.equal(await page.locator('#overlay [data-h^="ik:"], #overlay [data-h^="up:"], #overlay [data-h="torso"], #overlay [data-h="head"]').count(), 10);
  const before = await page.evaluate(() => JSON.stringify(pg().items[0].pose.armR));
  const box = await page.locator('#overlay [data-h="ik:armR"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y - 90, { steps: 6 }); await page.mouse.up();
  const after = await page.evaluate(() => JSON.stringify(pg().items[0].pose.armR));
  assert.notEqual(before, after, 'dragging the hand should change the arm pose'); assert.deepEqual(errs, []);
  // the inspector lists the rig's limbs for bend-flipping and layering
  await page.click('#details-toggle'); await page.click('#dtab-pose');
  assert.equal(await page.locator('[data-flip]').count(), 4); assert.equal(await page.locator('[data-detach]').count(), 4);
  await page.close();
});
test('a dog: add from template, 13 handles, its own poses and limbs, designer hides hair/clothes, switching skeleton resets poses', { skip }, async () => {
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  await page.evaluate(() => { app.P = STORE.fresh('blank'); newFromTemplate('t-dog'); const c = app.P.cast.at(-1); addFigure(c.id); renderStage(); });
  assert.equal(await page.locator('#overlay [data-h]:not([data-h="scale"]):not([data-h="rot"])').count(), 13);
  await page.click('#details-toggle'); await page.click('#dtab-pose');
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.poses .tile')].map((b) => b.dataset.pose)), ['stand', 'walk', 'run', 'sit', 'lie', 'beg', 'bark', 'sniff', 'wag']);
  assert.equal(await page.locator('[data-detach]').count(), 4); assert.equal(await page.locator('[data-act="feet"]').count(), 0);
  // drag a paw
  const box = await page.locator('#overlay [data-h="ik:frontNear"]').boundingBox();
  const before = await page.evaluate(() => JSON.stringify(pg().items[0].pose.frontNear));
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 40, box.y - 40, { steps: 5 }); await page.mouse.up();
  assert.notEqual(before, await page.evaluate(() => JSON.stringify(pg().items[0].pose.frontNear)));
  // designer: no hair/clothes sections for an animal; going back to a person brings them back and resets the placed pose
  await page.evaluate(() => { app.designerCast = app.P.cast.at(-1).id; renderDesigner(); });
  assert.equal(await page.locator('#d-form [data-d="hair"], #d-form [data-d="body"]').count(), 0);
  await page.evaluate(() => { const c = castById(app.designerCast); changeRig(c, 'biped'); });
  assert.equal(await page.locator('#d-form [data-d="hair"]').count(), 1);
  assert.ok(await page.evaluate(() => 'armL' in pg().items[0].pose && !('frontNear' in pg().items[0].pose)));
  assert.deepEqual(errs, []); await page.close();
});
test('New project offers a blank page and every sample project', { skip }, async () => {
  const page = await browser.newPage(); await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  await page.click('#btn-file'); await page.click('[data-act="new"]');
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#start-cards [data-start]')].map((b) => b.dataset.start)), ['blank', 'project:sample-airport', 'project:sample-animals', 'project:sample-chalkboard', 'project:sample-classroom']);
  await page.click('#start-cards [data-start="project:sample-animals"]');
  await page.waitForFunction(() => app.P.pages.length === 3 && app.P.settings.style === 'marker'); await page.close();
});
test('every sample page keeps all its items inside the page and renders in every style without errors', { skip }, async () => {
  const page = await browser.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P); await page.evaluate(() => hideStart()); // the first-run start screen is tested in shell.test.mjs
  const bad = await page.evaluate(() => {
    const out = [];
    for (const sp of CP.projects) {
      restore(STORE.fresh('project:' + sp.id)); const { pageW: W, pageH: H } = app.P.settings;
      app.P.pages.forEach((pgx, i) => {
        app.page = i; if (!pgx.items.length) out.push(`${sp.id} p${i + 1}: empty`);
        for (const it of pgx.items) { const b = pageBBox([it]); if (b.x < 0 || b.y < 0 || b.x + b.w > W || b.y + b.h > H) out.push(`${sp.id} p${i + 1} ${it.cast || it.kind} is outside the page`); }
        for (const st of RENDER.styleList().map((x) => x.id)) { setStyle(st); setPreview(true); renderAll(); }
      });
    }
    return out;
  });
  assert.deepEqual(bad, []); assert.deepEqual(errs, []); assert.deepEqual(await page.evaluate(() => [...CP.warnings]), []); await page.close();
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
