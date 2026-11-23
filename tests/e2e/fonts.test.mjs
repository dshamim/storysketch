// Fonts in the editor: the Font menu, search, saving and reopening (with a missing font), export, and the same drawing in the browser and in Node.
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

async function open(setup = `app.P = STORE.fresh('blank'); renderAll();`, ctx = { viewport: { width: 1440, height: 900 } }) {
  const context = await browser.newContext(ctx); const page = await context.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate(() => { hideStart(); localStorage.clear(); }); await page.evaluate(setup); await page.waitForTimeout(150);
  return { page, errs, context };
}
const WORDS = `app.P = STORE.fresh('blank'); addItem(TXT.make({ text: 'Reading time', size: 70, align: 'center' }, 500, 300)); renderAll(); select([pg().items[0].id]);`;
const item = (page) => page.evaluate(() => JSON.parse(JSON.stringify(pg().items[0])));
const boxW = (page) => page.evaluate(() => TXT.box(pg().items[0]).w);

test('the Font menu: every font with a live preview, picking one changes the text, the ribbon name and Details, and undo brings the old one back', { skip }, async () => {
  const { page, errs, context } = await open(WORDS); const w0 = await boxW(page);
  assert.match(await page.locator('[data-rb="pop-font"]').innerText(), /Hand-drawn/);
  await page.click('[data-rb="pop-font"]'); assert.equal(await page.locator('#pop-font').isVisible(), true);
  const opts = page.locator('#font-list .font-opt'); assert.equal(await opts.count(), 6, 'the hand-drawn letters and five fonts');
  assert.equal(await page.locator('#font-list .font-opt svg').count(), 6, 'each one is a drawing of its own name');
  const labels = await opts.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label'))); assert.ok(labels.every((l) => l && l.includes(',')), 'a name and a kind: ' + labels);
  assert.equal(await opts.first().getAttribute('aria-pressed'), 'true', 'the current one is marked');
  await page.click('[data-text-set="font=nunito"]'); await page.evaluate(() => flushCommit());
  assert.equal(await page.locator('#pop-font').isVisible(), false, 'the menu closes'); assert.equal((await item(page)).font, 'nunito');
  assert.match(await page.locator('[data-rb="pop-font"]').innerText(), /Nunito/, 'the ribbon shows the new name');
  const w1 = await boxW(page); assert.ok(w1 > w0 * 0.5 && w1 < w0 * 1.6, `the box stays about the same size: ${w0.toFixed(0)} -> ${w1.toFixed(0)}`);
  assert.equal(await page.evaluate(() => document.querySelector('#stage').innerHTML.includes('<text')), false, 'drawn as shapes, no font needed');
  await page.evaluate(() => showDetails()); assert.equal(await page.locator('#right select[data-text="font"]').inputValue(), 'nunito');
  await page.selectOption('#right select[data-text="font"]', 'crimson-pro'); await page.evaluate(() => flushCommit()); assert.equal((await item(page)).font, 'crimson-pro'); assert.match(await page.locator('[data-rb="pop-font"]').innerText(), /Crimson Pro/);
  await page.evaluate(() => hideDetails()); await page.click('#stage', { position: { x: 20, y: 20 } }).catch(() => {}); await page.evaluate(() => select([pg().items[0].id]));
  await page.keyboard.press('Control+z'); assert.equal((await item(page)).font, 'nunito', 'undo goes back one font');
  await page.keyboard.press('Control+z'); assert.equal((await item(page)).font || 'hand', 'hand', 'and back to the hand-drawn letters');
  assert.deepEqual(errs, []); await context.close();
});

test('the Font menu works from the keyboard and every option is a real button with a name', { skip }, async () => {
  const { page, errs, context } = await open(WORDS);
  await page.focus('[data-rb="pop-font"]'); await page.keyboard.press('Enter'); assert.equal(await page.locator('#pop-font').isVisible(), true);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#pop-font').isVisible(), false, 'Esc closes it'); assert.equal(await page.evaluate(() => document.activeElement.dataset.rb), 'pop-font', 'and the focus goes back to the button');
  await page.keyboard.press('Enter'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); const f = await page.evaluate(() => document.activeElement.closest('#font-list') ? document.activeElement.getAttribute('aria-label') : null); assert.ok(f, 'Tab walks the options: ' + f);
  await page.keyboard.press('Enter'); assert.notEqual((await item(page)).font || 'hand', 'hand', 'Enter picks one');
  assert.deepEqual(errs, []); await context.close();
});

test('every style draws a font text as filled letters (never text, never needing the font), the export is identical twice, and bold and the colour options work', { skip }, async () => {
  const { page, errs, context } = await open(WORDS);
  for (const font of ['patrick-hand', 'comic-neue', 'nunito', 'crimson-pro', 'caveat-brush']) for (const weight of ['normal', 'bold']) {
    await page.evaluate(([font, weight]) => { const it = pg().items[0]; it.font = font; it.weight = weight; renderStage(); }, [font, weight]);
    const out = await page.evaluate(() => { const r = {}; for (const st of [null, ...RENDER.styleList().map((s) => s.id)]) { const a = buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: st, bg: true, scale: 1 }).svg, b = buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: st, bg: true, scale: 1 }).svg; r[st || 'clean'] = { svg: a, same: a === b }; } return r; });
    for (const [k, o] of Object.entries(out)) { assert.ok(!/<text|font-family/.test(o.svg), `${font} ${weight} ${k}: no live text`); assert.ok(o.same, `${font} ${weight} ${k}: identical twice`); assert.ok((o.svg.match(/<path/g) || []).length >= 8, `${font} ${weight} ${k}`); assert.ok(!/NaN/.test(o.svg), k); }
  }
  await page.evaluate(() => { const it = pg().items[0]; it.colors = 'rainbow'; it.underline = true; renderStage(); }); assert.equal(await page.evaluate(() => new Set([...document.querySelectorAll('#stage path')].map((p) => p.getAttribute('fill')).filter((c) => c && c !== 'none' && c !== '#ffffff')).size >= 5), true, 'rainbow colours the letters');
  assert.deepEqual(errs, []); await context.close();
});

test('the same text draws to byte-identical SVG in the browser and in Node (a stand-in for "the same export on two machines")', { skip }, async () => {
  const { createApp } = await import('../helpers/sandbox.mjs'); const node = await createApp(); const NT = node.get('TXT'), NR = node.get('RENDER');
  const { page, errs, context } = await open(WORDS); const items = [{ text: 'Reading time, 123!', font: 'caveat-brush', size: 60, weight: 'bold', colors: 'rainbow' }, { text: 'The quick brown fox jumps over the lazy dog', font: 'crimson-pro', size: 30, w: 400, align: 'center' }, { text: 'Hello', font: 'comic-neue', size: 90, underline: true }];
  for (const [i, it] of items.entries()) for (const st of ['clean', 'crayon', 'marker', 'ink', 'chalk']) {
    const ctx = { mode: 'colour', paper: '#ffffff', seed: 's' + i, idp: 't', n: 0, style: st };
    const here = await page.evaluate(([it, ctx]) => { const p = TXT.prims(TXT.make(it)); return ctx.style === 'clean' ? RENDER.clean(p, ctx) : RENDER.render(p, ctx); }, [it, ctx]);
    const there = (() => { const p = NT.prims(NT.make(it)); return st === 'clean' ? NR.clean(p, ctx) : NR.render(p, ctx); })();
    assert.equal(here, there, `${it.font} in ${st}: the browser and Node draw different SVG`);
  }
  assert.deepEqual(errs, []); await context.close();
});

test('saving records the font like any plugin; a file whose font is missing opens, draws in the hand-drawn letters and says so', { skip }, async () => {
  const { page, errs, context } = await open(WORDS);
  await page.evaluate(() => { pg().items[0].font = 'nunito'; });
  const saved = await page.evaluate(() => { const plugins = pluginsUsed(app.P); return STORE.serialize(app.P, { plugins }); }); const j = JSON.parse(saved);
  assert.ok(j.plugins.some((p) => p.type === 'font' && p.id === 'nunito' && p.name === 'Nunito'), 'the font is in the plugin list'); assert.equal(j.pages[0].items[0].font, 'nunito');
  await page.evaluate((t) => applyLoaded(t, 'a.json'), saved); await page.evaluate(() => select([pg().items[0].id])); assert.equal((await item(page)).font, 'nunito', 'reopened keeps the font'); assert.equal(await page.locator('#bookinfo').isVisible(), false, 'no report: nothing is missing');
  j.pages[0].items[0].font = 'gone-font'; j.plugins = [{ type: 'font', id: 'gone-font', name: 'Gone Font', version: '1.0.0' }];
  await page.evaluate((t) => applyLoaded(t, 'b.json'), JSON.stringify(j)); await page.waitForTimeout(200);
  assert.equal(await page.locator('#bookinfo').isVisible(), true); const rep = await page.locator('#bookinfo').innerText(); assert.match(rep, /Font Gone Font/); assert.match(rep, /not installed/); assert.match(rep, /hand-drawn/);
  await page.evaluate(() => select([pg().items[0].id])); assert.equal((await item(page)).font, 'gone-font', 'the file keeps what it said (so installing the font later fixes it)');
  assert.match(await page.locator('[data-rb="pop-font"]').innerText(), /gone-font \(not installed\)/); assert.equal(await page.evaluate(() => TXT.prims(pg().items[0]).every((p) => !p.glyph)), true, 'drawn in the hand-drawn letters');
  assert.match(await page.evaluate(() => { showDetails(); return document.querySelector('#right select[data-text="font"]').selectedOptions[0].textContent; }), /not installed/);
  assert.deepEqual(errs, []); await context.close();
});

test('search finds fonts when a text is picked ("font nunito"), and only then', { skip }, async () => {
  const { page, errs, context } = await open(WORDS);
  await page.keyboard.press('Control+k'); await page.fill('#pal-input', 'nunito'); assert.match(await page.locator('#pal-list [role=option]').first().innerText(), /Font: Nunito/);
  await page.keyboard.press('Enter'); assert.equal((await item(page)).font, 'nunito'); assert.equal(await page.locator('#palette').isVisible(), false);
  await page.evaluate(() => select([])); await page.keyboard.press('Control+k'); await page.fill('#pal-input', 'nunito'); assert.equal(await page.locator('#pal-list [role=option]').count(), 0, 'nothing picked: no font commands'); await page.keyboard.press('Escape');
  assert.deepEqual(errs, []); await context.close();
});

test('the font menu on a tablet: options are finger sized and the menu fits on screen', { skip }, async () => {
  const { page, errs, context } = await open(WORDS, { viewport: { width: 1180, height: 820 }, hasTouch: true, reducedMotion: 'reduce' });
  await page.tap('[data-rb="pop-font"]'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => { const b = document.querySelector('#pop-font').getBoundingClientRect(); return { box: [b.left, b.top, b.right, b.bottom], opts: [...document.querySelectorAll('#font-list .font-opt')].map((o) => Math.min(o.getBoundingClientRect().width, o.getBoundingClientRect().height)) }; });
  assert.ok(r.opts.every((s) => s >= 43.5), 'options are 44 px: ' + r.opts); assert.ok(r.box[0] >= 0 && r.box[2] <= 1180 && r.box[3] <= 820, 'on screen: ' + r.box);
  await page.tap('[data-text-set="font=comic-neue"]'); assert.equal((await item(page)).font, 'comic-neue');
  assert.deepEqual(errs, []); await context.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
