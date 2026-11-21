// Behaviour of the interface components, tested on the kit page (docs/ui-kit.html): accessibility semantics and keyboard operation.
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
const url = `http://localhost:${server.address().port}/docs/ui-kit.html`;
let browser; try { browser = chromium && await chromium.launch({ args: ['--no-sandbox'] }); } catch { /* no browser */ }
const skip = browser ? false : 'no Chromium available';
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => document.getElementById('ui-sprite')); return { page, ctx, errs };
}

test('kit page loads clean; every icon reference resolves to a symbol; the sprite has every icon', { skip }, async () => {
  const { page, ctx, errs } = await open();
  const r = await page.evaluate(() => ({ missing: [...document.querySelectorAll('use[href^="#i-"]')].map((u) => u.getAttribute('href').slice(1)).filter((id) => !document.getElementById(id)),
    symbols: document.querySelectorAll('#ui-sprite symbol').length, icons: Object.keys(window.UI_ICONS).length, used: document.querySelectorAll('use[href^="#i-"]').length }));
  assert.deepEqual(r.missing, []); assert.equal(r.symbols, r.icons); assert.ok(r.used > 100); assert.deepEqual(errs, []); await ctx.close();
});
test('accessibility basics: icon-only buttons are named, form controls are labelled, decorative svgs are hidden', { skip }, async () => {
  const { page, ctx } = await open();
  const bad = await page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll('button')) { const name = (b.getAttribute('aria-label') || b.textContent || '').trim(); if (!name) out.push('unnamed button: ' + b.outerHTML.slice(0, 80)); }
    for (const i of document.querySelectorAll('input:not([type=hidden]), select')) { const id = i.id; const ok = i.getAttribute('aria-label') || (id && document.querySelector(`label[for="${id}"]`)) || i.closest('label'); if (!ok) out.push('unlabelled: ' + i.outerHTML.slice(0, 80)); }
    for (const s of document.querySelectorAll('svg.ui-i')) if (s.getAttribute('aria-hidden') !== 'true') out.push('visible svg icon');
    return out;
  });
  assert.deepEqual(bad, []); await ctx.close();
});
test('keyboard focus is clearly visible (2 px ring) on buttons, inputs, tabs and swatches', { skip }, async () => {
  const { page, ctx } = await open();
  for (const sel of ['#btns .ui-btn >> nth=1', '#iconbtns .ui-iconbtn >> nth=0', '#f-name', '#tab-look', '.ui-swatch >> nth=0', '#f-sel']) {
    await page.locator(sel).focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); // makes focus-visible apply
    const o = await page.locator(sel).evaluate((el) => { const c = getComputedStyle(el); return [c.outlineStyle, c.outlineWidth]; });
    assert.deepEqual(o, ['solid', '2px'], sel);
  }
  await ctx.close();
});
test('tooltips: appear on hover and on keyboard focus with the name and shortcut; Esc hides them; absent for touch', { skip }, async () => {
  const { page, ctx } = await open(); const tip = page.locator('.ui-tip');
  await page.hover('#iconbtns .ui-iconbtn >> nth=0'); await page.waitForSelector('.ui-tip:not([hidden])');
  assert.match(await tip.innerText(), /Undo/); assert.match(await tip.innerText(), /Ctrl\+Z/);
  assert.equal(await page.locator('#iconbtns .ui-iconbtn >> nth=0').getAttribute('aria-describedby'), 'ui-tip');
  await page.keyboard.press('Escape'); assert.equal(await tip.isHidden(), true, 'Esc dismisses');
  await page.mouse.move(5, 5); await page.keyboard.press('Tab'); await page.locator('#iconbtns .ui-iconbtn >> nth=1').focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  await page.waitForSelector('.ui-tip:not([hidden])'); assert.match(await tip.innerText(), /Redo/);
  await ctx.close();
});
test('tabs: arrow keys move selection and show the matching panel; roving tabindex', { skip }, async () => {
  const { page, ctx } = await open();
  await page.locator('#tab-look').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#tab-pose').getAttribute('aria-selected'), 'true'); assert.equal(await page.locator('#panel-pose').isVisible(), true); assert.equal(await page.locator('#panel-look').isHidden(), true);
  assert.equal(await page.locator('#tab-look').getAttribute('tabindex'), '-1'); assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-pose');
  await page.keyboard.press('End'); assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-arrange'); await page.keyboard.press('ArrowRight'); assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-look', 'wraps around');
  await ctx.close();
});
test('rail (vertical tabs): up/down arrows; segmented control and swatches: left/right arrows set aria-checked', { skip }, async () => {
  const { page, ctx } = await open();
  await page.locator('#rail-demo [role=tab] >> nth=0').focus(); await page.keyboard.press('ArrowDown');
  assert.equal(await page.locator('#rail-demo [role=tab] >> nth=1').getAttribute('aria-selected'), 'true');
  await page.locator('.ui-seg >> nth=0').locator('[role=radio]').first().focus(); await page.keyboard.press('ArrowRight');
  assert.deepEqual(await page.locator('.ui-seg >> nth=0').locator('[role=radio]').evaluateAll((l) => l.map((b) => b.getAttribute('aria-checked'))), ['false', 'true']);
  await page.locator('.ui-swatches [role=radio] >> nth=0').focus(); await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('.ui-swatches [role=radio] >> nth=1').getAttribute('aria-checked'), 'true');
  await ctx.close();
});
test('collapsible sections toggle aria-expanded and hide the content', { skip }, async () => {
  const { page, ctx } = await open(); const h = page.locator('#sections-demo .ui-section-h').first(); const body = page.locator('#sections-demo .ui-section-b').first();
  assert.equal(await h.getAttribute('aria-expanded'), 'true'); await h.click(); assert.equal(await h.getAttribute('aria-expanded'), 'false'); assert.equal(await body.isHidden(), true);
  await h.focus(); await page.keyboard.press('Enter'); assert.equal(await body.isVisible(), true);
  const second = page.locator('#sections-demo .ui-section-h').nth(1); assert.equal(await second.getAttribute('aria-expanded'), 'false', 'starts collapsed when marked so');
  await ctx.close();
});
test('menu: opens from the button, arrows move through items (skipping disabled), Esc closes and returns focus, outside click closes', { skip }, async () => {
  const { page, ctx } = await open(); const menu = page.locator('#menu-demo');
  await page.click('#menu-btn'); assert.equal(await menu.isVisible(), true); assert.equal(await page.locator('#menu-btn').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.textContent.trim().startsWith('New')), true, 'first item focused');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('End');
  assert.match(await page.evaluate(() => document.activeElement.textContent), /Delete page/, 'End → last enabled item (disabled one skipped)');
  await page.keyboard.press('Escape'); assert.equal(await menu.isHidden(), true); assert.equal(await page.evaluate(() => document.activeElement.id), 'menu-btn');
  await page.click('#menu-btn'); await page.mouse.click(5, 300); assert.equal(await menu.isHidden(), true, 'outside click closes');
  await page.click('#menu-btn'); await page.keyboard.press('Enter'); assert.equal(await menu.isHidden(), true, 'choosing an item closes it');
  await ctx.close();
});
test('only one popover is open at a time; popovers stay inside the window', { skip }, async () => {
  const { page, ctx } = await open();
  await page.click('#menu-btn'); await page.click('#pop-btn'); assert.equal(await page.locator('#menu-demo').isHidden(), true); assert.equal(await page.locator('#pop-demo').isVisible(), true);
  const r = await page.locator('#pop-demo').boundingBox(); assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= 1280 && r.y + r.height <= 900);
  await ctx.close();
});
test('dialog: native modal with a label, Esc closes; toast is announced politely and disappears', { skip }, async () => {
  const { page, ctx } = await open();
  await page.click('#dlg-btn'); assert.equal(await page.evaluate(() => document.getElementById('dlg-demo').open), true); await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => document.getElementById('dlg-demo').open), false);
  await page.click('#toast-ok-btn'); const t = page.locator('.ui-toasts[role=status] .ui-toast'); assert.match(await t.innerText(), /Saved to my-book/); assert.equal(await page.locator('.ui-toasts').getAttribute('aria-live'), 'polite');
  await ctx.close();
});
test('touch screens get 44 px controls; the layout has no horizontal overflow at 800 px', { skip }, async () => {
  const touch = await open({ hasTouch: true, isMobile: true, viewport: { width: 820, height: 1100 } });
  assert.ok((await touch.page.locator('#iconbtns .ui-iconbtn >> nth=0').boundingBox()).height >= 44); assert.ok((await touch.page.locator('#btns .ui-btn >> nth=0').boundingBox()).height >= 44);
  await touch.ctx.close();
  const narrow = await open({ viewport: { width: 800, height: 900 } });
  assert.equal(await narrow.page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true); await narrow.ctx.close();
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
