// Search everything (Ctrl+K) and the shortcut sheet (?): opening from anywhere, the combobox pattern, results, recent items, focus, touch, reduced motion.
// The shortcut table is checked line by line: every key it lists is pressed and must do what the line says.
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


const LANDSCAPE = { viewport: { width: 1180, height: 820 }, hasTouch: true, deviceScaleFactor: 1 }, PORTRAIT = { viewport: { width: 820, height: 1180 }, hasTouch: true, deviceScaleFactor: 1 };
async function open(setup = `app.P = STORE.fresh('blank'); renderAll();`, ctx = { viewport: { width: 1440, height: 900 } }) {
  const context = await browser.newContext(ctx); const page = await context.newPage(); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate(() => { hideStart(); localStorage.clear(); }); await page.evaluate(setup); await page.waitForTimeout(150);
  return { page, errs, context };
}
const CLASSROOM = `restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll(); commit();`;
const shown = (page, id) => page.evaluate((id) => !document.querySelector(id).hidden, id);
const options = (page) => page.evaluate(() => [...document.querySelectorAll('#pal-list [role=option]')].map((o) => o.textContent.trim()));
const search = async (page, q) => { await page.keyboard.press('Control+k'); await page.keyboard.type(q); await page.waitForTimeout(60); };

test('Ctrl+K opens search from anywhere (the page, a ribbon field, the designer) and closes it; Esc and the button too; focus goes back', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); await page.evaluate(() => select([pg().items.find((i) => i.cast === 'teacher').id]));
  await page.keyboard.press('Control+k'); assert.equal(await shown(page, '#palette'), true); assert.equal(await page.evaluate(() => document.activeElement.id), 'pal-input'); assert.equal(await page.evaluate(() => !!document.querySelector('dialog:modal')), false, 'not a modal <dialog>');
  await page.keyboard.press('Control+k'); assert.equal(await shown(page, '#palette'), false, 'Ctrl+K again closes it');
  await page.focus('#ribbon-sel [data-rot]'); await page.keyboard.press('Control+k'); assert.equal(await shown(page, '#palette'), true, 'works while typing in a ribbon field'); await page.keyboard.press('Escape'); assert.equal(await shown(page, '#palette'), false); assert.equal(await page.evaluate(() => document.activeElement.matches('[data-rot]')), true, 'Esc gives the focus back to the field');
  await page.click('#ribbon-sel [data-act="design"]'); await page.focus('#d-cast .tile'); await page.keyboard.press('Control+k'); assert.equal(await shown(page, '#palette'), true, 'works inside the designer'); await page.keyboard.press('Escape'); await page.click('#d-close');
  await page.click('#open-palette'); assert.equal(await shown(page, '#palette'), true, 'the button'); await page.keyboard.press('Escape');
  await page.click('#btn-help'); await page.click('[data-act="palette"]'); assert.equal(await shown(page, '#palette'), true, 'the Help menu'); await page.keyboard.press('Escape');
  // a tap outside closes it; keys typed in it do not reach the page
  await page.keyboard.press('Control+k'); await page.keyboard.type('rrr'); assert.equal(await page.evaluate(() => app.tool), null, 'typing letters in the box arms no tool'); await page.mouse.click(1380, 850); assert.equal(await shown(page, '#palette'), false);
  assert.deepEqual(errs, []); await context.close();
});

test('the combobox pattern: roles, expanded, controls, an active option that always exists, headings are not options, arrows wrap, Enter does it', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); await page.keyboard.press('Control+k');
  const a = await page.evaluate(() => { const i = document.querySelector('#pal-input'); return [i.getAttribute('role'), i.getAttribute('aria-expanded'), i.getAttribute('aria-controls'), document.querySelector('#pal-list').getAttribute('role'), document.querySelector('#palette [role=dialog]').getAttribute('aria-modal')]; });
  assert.deepEqual(a, ['combobox', 'true', 'pal-list', 'listbox', 'true']);
  const check = async (why) => assert.equal(await page.evaluate(() => { const i = document.querySelector('#pal-input'); const id = i.getAttribute('aria-activedescendant'); const o = id && document.getElementById(id); return !!o && o.getAttribute('role') === 'option' && o.getAttribute('aria-selected') === 'true' && document.querySelectorAll('#pal-list [aria-selected="true"]').length === 1; }), true, why);
  await check('nothing typed'); assert.ok((await options(page)).length >= 3, 'suggestions when empty'); assert.equal(await page.evaluate(() => document.querySelectorAll('#pal-list .pal-group[role=option]').length), 0, 'group headings are not options');
  await page.keyboard.type('add'); await check('after typing'); const n = (await options(page)).length; assert.ok(n > 10);
  await page.keyboard.press('ArrowUp'); await check('wrapped to the end'); assert.equal(await page.evaluate(() => document.querySelector('#pal-input').getAttribute('aria-activedescendant')), 'pal-o-' + (n - 1));
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await check('moved down'); assert.equal(await page.evaluate(() => document.querySelector('#pal-input').getAttribute('aria-activedescendant')), 'pal-o-1');
  await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'pal-input', 'Tab keeps the focus in the box');
  await page.fill('#pal-input', 'zzzzqq'); await page.waitForTimeout(60); assert.equal(await page.evaluate(() => document.querySelector('#pal-input').hasAttribute('aria-activedescendant')), false, 'no active option when nothing matches'); assert.match(await page.locator('#pal-list').innerText(), /Nothing matches/); assert.equal(await page.locator('#pal-status').innerText(), 'No results');
  await page.fill('#pal-input', 'text'); await page.waitForTimeout(60); assert.match(await page.locator('#pal-status').innerText(), /\d+ results?/);
  assert.deepEqual(errs, []); await context.close();
});

test('it finds and does things: styles, characters, props, text, shapes, samples, pages, tools, panels, menu actions', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); const run = async (q, first) => { await search(page, q); const o = await options(page); assert.ok(o.length && (!first || new RegExp(first, 'i').test(o[0])), `"${q}" -> ${o[0]}`); await page.keyboard.press('Enter'); await page.waitForTimeout(80); };
  await run('marker', 'Marker'); assert.equal(await page.evaluate(() => app.P.settings.style), 'marker');
  await run('add character ahmed', 'Ahmed'); assert.equal(await page.evaluate(() => pg().items.some((i) => i.cast === 'ahmed')), true);
  await run('add prop table', 'table'); assert.equal(await page.evaluate(() => pg().items.filter((i) => i.kind === 'table').length), 2);
  await run('add text title', 'Title'); assert.equal(await page.evaluate(() => pg().items.some((i) => i.type === 'text' && i.text === 'Title')), true); await page.keyboard.press('Escape');
  await run('add a circle', 'circle'); assert.equal(await page.evaluate(() => pg().items.some((i) => i.type === 'shape' && i.shape === 'circle')), true);
  await run('draw an arrow', 'arrow'); assert.equal(await page.evaluate(() => app.tool), 'arrow'); await page.evaluate(() => setTool(null));
  await run('open layers', 'Layers'); assert.equal(await page.evaluate(() => app.tab), 'tab-layers');
  await run('styled view', 'Styled view'); assert.equal(await page.evaluate(() => !!app.preview), true);
  await run('go to page 2', 'page 2'); assert.equal(await page.evaluate(() => app.page), 1);
  await run('pets', 'sample'); await page.waitForTimeout(150); // opening a sample may ask about unsaved changes
  if (await page.evaluate(() => !!document.querySelector('dialog:modal'))) { await page.click('#msg-buttons button.primary'); await page.waitForTimeout(200); }
  assert.equal(await page.evaluate(() => app.P.cast.some((c) => c.id === 'rex')), true, 'a sample opened');
  assert.deepEqual(errs, []); await context.close();
});

test('on / off state shows in the results; recent things come first next time; things that no longer exist are dropped', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); await search(page, 'styled view'); assert.equal(await page.locator('#pal-list [role=option] >> nth=0').locator('.pal-tick svg').count(), 0, 'off: no tick'); await page.keyboard.press('Enter');
  await search(page, 'styled view'); assert.equal(await page.locator('#pal-list [role=option] >> nth=0').locator('.pal-tick svg').count(), 1, 'on: a tick'); await page.keyboard.press('Escape');
  await search(page, 'add character lily'); await page.keyboard.press('Enter'); await page.keyboard.press('Control+k'); const rec = await options(page); assert.match(rec[0], /Lily/, 'the last thing done is first: ' + rec[0]); assert.equal(await page.evaluate(() => document.querySelector('#pal-list .pal-group').textContent), 'Recent'); await page.keyboard.press('Escape');
  const recent = () => page.evaluate(() => { const out = []; let on = false; for (const li of document.querySelectorAll('#pal-list li')) { if (li.classList.contains('pal-group')) on = li.textContent === 'Recent'; else if (on) out.push(li.textContent.trim()); } return out; });
  await page.keyboard.press('Control+k'); assert.ok((await recent()).some((t) => /Lily/.test(t)), 'Lily is among the recent'); await page.keyboard.press('Escape');
  await page.evaluate(() => { pg().items = pg().items.filter((i) => i.cast !== 'lily'); app.P.cast = app.P.cast.filter((c) => c.id !== 'lily'); renderAll(); }); // Lily is deleted from the book
  await page.keyboard.press('Control+k'); const r2 = await recent(); assert.ok(!r2.some((t) => /Lily/.test(t)), 'a deleted character is no longer recent: ' + r2); assert.ok(r2.some((t) => /Styled view/.test(t)), 'the rest still is');
  assert.deepEqual(errs, []); await context.close();
});

test('the shortcut sheet: ? opens it, Esc / Close close it, focus returns, keys inside it do nothing, Help menu and search open it too', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM);
  await page.keyboard.press('?'); assert.equal(await shown(page, '#shortcuts'), true); assert.equal(await page.evaluate(() => document.activeElement.id), 'shortcuts-close'); assert.ok((await page.locator('#shortcuts-body section').count()) >= 5); assert.equal(await page.locator('#shortcuts-title').innerText(), 'Keyboard shortcuts');
  for (const k of ['r', 'o', 't', 'Delete', 'Control+a']) await page.keyboard.press(k); assert.equal(await page.evaluate(() => [app.tool, app.sel.length].join()), ',0', 'nothing happens behind it');
  await page.keyboard.press('Escape'); assert.equal(await shown(page, '#shortcuts'), false); await page.click('#btn-help'); await page.click('[data-act="shortcuts"]'); assert.equal(await shown(page, '#shortcuts'), true); await page.click('#shortcuts-close'); assert.equal(await shown(page, '#shortcuts'), false);
  await search(page, 'keyboard shortcuts'); await page.keyboard.press('Enter'); assert.equal(await shown(page, '#shortcuts'), true); await page.keyboard.press('Control+k'); assert.equal(await shown(page, '#shortcuts'), false, 'Ctrl+K swaps it for the search'); assert.equal(await shown(page, '#palette'), true);
  assert.deepEqual(errs, []); await context.close();
});

test('every key the shortcut sheet lists does what its line says', { skip }, async () => {
  const { page, errs, context } = await open(`${CLASSROOM} addItem(TXT.make({ text: 'Words', size: 60 }, 300, 140)); select([]);`);
  const sc = await page.evaluate(() => SHORTCUTS.flatMap((g) => g.rows.map((r) => r[0]))); const has = (k) => assert.ok(sc.some((s) => s.includes(k)), 'the sheet lists ' + k);
  for (const k of ['T', 'R', 'O', 'Y', 'L', 'A', 'Shift+A', 'V', 'H', 'P', 'Ctrl+A', 'Ctrl+D', 'Delete', 'Ctrl+G', 'Ctrl+Shift+L', 'Ctrl+Z', 'Ctrl+Y', 'Page Up', 'Ctrl+0', 'Shift+1', 'Shift+2', 'Space+Drag', 'Ctrl+S', 'Ctrl+O', 'Ctrl+K', '?', 'F2', 'Esc']) has(k);
  const tool = () => page.evaluate(() => app.tool); for (const [key, t] of [['t', 'text'], ['r', 'box'], ['o', 'circle'], ['y', 'triangle'], ['l', 'line'], ['a', 'arrow'], ['Shift+A', 'double']]) { await page.keyboard.press(key); assert.equal(await tool(), t, key); await page.keyboard.press('Escape'); assert.equal(await tool(), null, 'Esc stops drawing'); }
  await page.keyboard.press('r'); await page.keyboard.press('v'); assert.equal(await tool(), null, 'V = select');
  const teacher = await page.evaluate(() => pg().items.find((i) => i.cast === 'teacher').id); const it = () => page.evaluate((id) => JSON.parse(JSON.stringify(itemById(id))), teacher); const n = () => page.evaluate(() => pg().items.length);
  await page.evaluate((id) => select([id]), teacher); const x0 = (await it()).x; await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowRight'); assert.equal((await it()).x, x0 + 11, 'arrows move 1, with Shift 10');
  await page.keyboard.press('h'); assert.equal((await it()).flip, true, 'H flips'); await page.keyboard.press('h');
  const n0 = await n(); await page.keyboard.press('Control+d'); assert.equal(await n(), n0 + 1, 'Ctrl+D duplicates'); await page.keyboard.press('Delete'); assert.equal(await n(), n0, 'Delete deletes the picked (the copy)');
  await page.keyboard.press('Control+a'); assert.ok(await page.evaluate(() => app.sel.length) > 3, 'Ctrl+A picks everything'); await page.keyboard.press('Control+g'); assert.equal(await page.evaluate(() => new Set(pg().items.filter((i) => app.sel.includes(i.id)).map((i) => i.group)).size), 1, 'Ctrl+G groups'); await page.keyboard.press('Control+Shift+g'); assert.equal(await page.evaluate(() => pg().items.filter((i) => i.group).length), 0, 'Ctrl+Shift+G ungroups');
  await page.evaluate((id) => select([id]), teacher); await page.keyboard.press('Control+Shift+l'); assert.equal((await it()).locked, true, 'Ctrl+Shift+L locks'); await page.keyboard.press('Control+Shift+l'); assert.notEqual((await it()).locked, true);
  const z = () => page.evaluate((id) => pg().items.findIndex((i) => i.id === id), teacher); const z0 = await z(); await page.keyboard.press(']'); assert.equal(await z(), z0 + 1, ']'); await page.keyboard.press('['); assert.equal(await z(), z0, '['); await page.keyboard.press('Shift+['); assert.equal(await z(), 0, 'Shift+[ to the back');
  await page.keyboard.press('Control+z'); assert.equal(await z(), z0, 'Ctrl+Z undoes'); await page.keyboard.press('Control+y'); assert.equal(await z(), 0, 'Ctrl+Y redoes'); await page.keyboard.press('Control+z'); await page.keyboard.press('Control+Shift+z'); assert.equal(await z(), 0, 'Ctrl+Shift+Z redoes too');
  const pv = await page.evaluate(() => !!app.preview); await page.keyboard.press('p'); assert.equal(await page.evaluate(() => !!app.preview), !pv, 'P'); await page.keyboard.press('p');
  const z1 = (await page.evaluate(() => app.view.z)); await page.keyboard.press('Control+='); assert.ok((await page.evaluate(() => app.view.z)) > z1, 'Ctrl+= zooms in'); await page.keyboard.press('Control+0'); assert.equal(await page.evaluate(() => app.view.z), 1, 'Ctrl+0 fits'); await page.evaluate(() => zoomTo(2)); await page.keyboard.press('Shift+1'); assert.equal(await page.evaluate(() => app.view.z), 1, 'Shift+1 fits');
  await page.evaluate((id) => select([id]), teacher); await page.keyboard.press('Shift+2'); assert.ok((await page.evaluate(() => app.view.z)) > 1, 'Shift+2 zooms to the picked'); await page.keyboard.press('Control+0');
  await page.keyboard.press('PageDown'); assert.equal(await page.evaluate(() => app.page), 1, 'Page Down'); await page.keyboard.press('PageUp'); assert.equal(await page.evaluate(() => app.page), 0, 'Page Up');
  const txt = await page.evaluate(() => pg().items.find((i) => i.type === 'text').id); for (const key of ['Enter', 'F2']) { await page.evaluate((id) => select([id]), txt); await page.keyboard.press(key); assert.equal(await page.evaluate(() => !!app.edit), true, key + ' edits the words'); await page.keyboard.press('Escape'); }
  await page.keyboard.press('/'); assert.equal(await page.evaluate(() => document.activeElement.id), 'lsearch', '/ searches the library'); await page.keyboard.press('Escape');
  await page.evaluate(() => select([])); await page.keyboard.down('Space'); assert.equal(await page.evaluate(() => !!app.space), true, 'Space readies the page-moving hand'); await page.keyboard.up('Space');
  await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => app.sel.length), 0, 'Esc picks nothing');
  assert.deepEqual(errs, []); await context.close();
});

test('on a tablet: the search button, a result list with 44 px options near the top of the screen, no sideways overflow; the sheet fits the screen', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM, PORTRAIT); const tap = async (sel) => { const b = await page.locator(sel).boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(120); };
  const sb = await page.locator('#open-palette').boundingBox(); assert.ok(sb.width >= 44 && sb.height >= 44, 'the search button is finger-sized'); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'the top bar fits at 820 px');
  await tap('#open-palette'); assert.equal(await shown(page, '#palette'), true); await page.keyboard.type('add'); await page.waitForTimeout(80);
  const g = await page.evaluate(() => { const c = document.querySelector('#palette .overlay-card').getBoundingClientRect(); const o = [...document.querySelectorAll('#pal-list [role=option]')].map((e) => e.getBoundingClientRect().height); return { top: c.top, bottom: c.bottom, w: c.width, minOpt: Math.min(...o), vh: innerHeight }; });
  assert.ok(g.top < 120 && g.bottom <= g.vh && g.minOpt >= 44, 'near the top, options 44 px: ' + JSON.stringify(g));
  await page.setViewportSize({ width: 820, height: 560 }); await page.waitForTimeout(200); const g2 = await page.evaluate(() => { const c = document.querySelector('#palette .overlay-card').getBoundingClientRect(); return [c.top, c.bottom, innerHeight]; }); assert.ok(g2[1] <= g2[2], 'still above a (stand-in) keyboard: ' + g2); await page.setViewportSize({ width: 820, height: 1180 });
  const first = await options(page); await page.locator('#pal-list [role=option]').first().tap(); await page.waitForTimeout(150); assert.equal(await shown(page, '#palette'), false, 'a tap does the first result'); assert.ok(first.length > 3);
  await page.evaluate(() => openShortcuts()); const sc = await page.evaluate(() => { const c = document.querySelector('#shortcuts .overlay-card').getBoundingClientRect(); return [c.left, c.right, c.bottom, innerWidth, innerHeight]; }); assert.ok(sc[0] >= 0 && sc[1] <= sc[3] && sc[2] <= sc[4], 'the sheet fits the screen: ' + sc);
  assert.deepEqual(errs, []); await context.close();
});

test('reduced motion: the overlays do not animate', { skip }, async () => {
  const { page, context } = await open(CLASSROOM, { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }); await page.keyboard.press('Control+k');
  const d = await page.evaluate(() => [getComputedStyle(document.querySelector('#palette')).animationDuration, getComputedStyle(document.querySelector('#palette .overlay-card')).animationDuration]); assert.deepEqual(d, ['0s', '0s'], 'no animation with reduced motion'); await context.close();
  const n = await open(CLASSROOM); await n.page.keyboard.press('Control+k'); const d2 = await n.page.evaluate(() => getComputedStyle(document.querySelector('#palette .overlay-card')).animationDuration); assert.notEqual(d2, '0s', 'but it does animate otherwise'); await n.context.close();
});

test('the list is never stale: a menu closed with nothing picked does not leave its items greyed out, and ticks follow what is on now', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM);
  await page.click('#btn-edit'); await page.keyboard.press('Escape'); // the Edit menu was last looked at with nothing picked: Group is greyed out in it
  await page.evaluate(() => select(pg().items.slice(0, 2).map((i) => i.id))); await search(page, 'group'); const o = await options(page); assert.ok(o.length && /^Group/.test(o[0]), 'Group is offered: ' + o[0]); await page.keyboard.press('Enter'); await page.waitForTimeout(80);
  assert.equal(await page.evaluate(() => new Set(pg().items.filter((i) => app.sel.includes(i.id)).map((i) => i.group)).size === 1 && !!pg().items[0].group), true, 'and it groups');
  await page.evaluate(() => hideDetails()); await page.click('#details-toggle'); await search(page, 'details panel'); assert.equal(await page.locator('#pal-list [role=option] >> nth=0').locator('.pal-tick svg').count(), 1, 'Details opened from the ribbon button shows its tick'); await page.keyboard.press('Escape');
  await page.evaluate(() => hideDetails()); await search(page, 'details panel'); assert.equal(await page.locator('#pal-list [role=option] >> nth=0').locator('.pal-tick svg').count(), 0, 'and no tick when it is closed'); await page.keyboard.press('Escape');
  await page.evaluate(() => select([])); await search(page, 'duplicate'); assert.equal(await page.evaluate(() => document.querySelector('#pal-list [role=option]').getAttribute('aria-disabled')), 'true', 'Duplicate is greyed out when nothing is picked'); await page.keyboard.press('Escape');
  assert.deepEqual(errs, []); await context.close();
});

test('every thing appears once: Help items are not doubled, and the search does not offer itself', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM);
  for (const [q, n] of [['keyboard shortcuts', 1], ['show the tips', 1], ['about storysketch', 1], ['search everything', 0]]) { await search(page, q); const o = (await options(page)).filter((t) => new RegExp(q.split(' ')[0], 'i').test(t)); const same = o.filter((t) => t.replace(/\s+/g, ' ').toLowerCase().includes(q.split(' ').slice(0, 2).join(' ').toLowerCase())); assert.equal(same.length, n, `"${q}" gives ${same.length} rows: ${o}`); await page.keyboard.press('Escape'); }
  await page.keyboard.press('Control+k'); const sug = await page.evaluate(() => [...document.querySelectorAll('#pal-list [role=option]')].map((o) => o.textContent.trim())); assert.equal(sug.filter((t) => /Keyboard shortcuts/.test(t)).length, 1, 'one Keyboard shortcuts among the suggestions: ' + sug); await page.keyboard.press('Escape');
  const all = await page.evaluate(() => { const ids = paletteCommands().map((c) => c.id); return ids.length - new Set(ids).size; }); assert.equal(all, 0, 'no command id is listed twice');
  assert.deepEqual(errs, []); await context.close();
});

test('Ctrl+K does not open the search behind a confirmation', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); await page.evaluate(() => { uiConfirm('Delete page', 'Sure?', 'Delete page'); }); await page.waitForTimeout(100); assert.equal(await page.evaluate(() => !!document.querySelector('dialog:modal')), true);
  await page.keyboard.press('Control+k'); assert.equal(await shown(page, '#palette'), false, 'not behind a modal dialog'); await page.keyboard.press('Escape'); assert.deepEqual(errs, []); await context.close();
});

test('a prop\'s tags (synonyms) are found by the Props search and by Ctrl+K', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM);
  await page.evaluate(() => { CP.register({ api: 1, version: '1.0.0', type: 'prop', id: 'test-sofa', name: 'Sofa', pack: 'Test props', cat: 'Furniture', tags: ['couch', 'settee'], colors: { line: '#6f6f6f' }, draw(p) { p.rect(-60, -50, 120, 50, { stroke: 'line', w: 4.5, fill: 'paper' }); } }); setTab('tab-props'); });
  await page.fill('#lsearch', 'couch'); await page.waitForTimeout(150); assert.equal(await page.locator('#tab-props [data-prop="test-sofa"], #tab-props .tile:has-text("Sofa")').count() >= 1, true, 'the library finds it by a tag');
  await page.fill('#lsearch', ''); await search(page, 'settee'); assert.match(await page.locator('#pal-list [role=option]').first().innerText(), /Sofa/, 'Ctrl+K finds it by a tag'); await page.keyboard.press('Escape');
  assert.deepEqual(errs, []); await context.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
