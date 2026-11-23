// The shell: start screen, menus, rail + flyout, filmstrip, notes drawer, export popover, and the keyboard walk-through.
// Also the "every old control is still reachable" checklist from docs/UI-REVAMP-PLAN.md §4.10.
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

// open the app; `start` = leave the first-run start screen showing, otherwise dismiss it and run `setup`
async function open({ start = false, setup = `app.P = STORE.fresh('blank'); renderAll();` } = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  if (!start) { await page.evaluate(() => hideStart()); await page.evaluate(() => localStorage.clear()); await page.evaluate(setup); }
  return { page, errs };
}
const items = (page) => page.evaluate(() => pg().items.map((i) => ({ id: i.id, kind: i.kind, x: i.x, y: i.y })));

test('first run shows the start screen over the editor; Escape closes it', { skip }, async () => {
  const { page, errs } = await open({ start: true });
  assert.equal(await page.locator('#start').isVisible(), true);
  assert.equal(await page.evaluate(() => document.querySelector('#workspace').inert), true, 'the editor behind it is not reachable');
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('#start-cards [data-start]')].map((b) => b.dataset.start)),
    ['blank', 'project:sample-airport', 'project:sample-animals', 'project:sample-chalkboard', 'project:sample-classroom']);
  assert.ok(await page.locator('#start-cards .start-thumb svg').count() >= 4, 'samples show previews');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#start').isVisible(), false);
  assert.equal(await page.evaluate(() => document.querySelector('#workspace').inert), false);
  assert.deepEqual(errs, []); await page.close();
});
test('File > New opens the start screen; a sample card opens that sample; unsaved changes ask first', { skip }, async () => {
  const { page, errs } = await open();
  await page.click('#btn-file'); await page.click('[data-act="new"]'); assert.equal(await page.locator('#start').isVisible(), true);
  await page.click('#start-cards [data-start="project:sample-animals"]');
  await page.waitForFunction(() => app.P.pages.length === 3 && app.P.settings.style === 'marker' && !document.querySelector('#start:not([hidden])'));
  // now there is work in the project: starting another asks first, and Cancel keeps the work
  await page.evaluate(() => { addProp('table'); });
  await page.click('#btn-file'); await page.click('[data-act="new"]'); await page.click('#start-cards [data-start="blank"]');
  await page.click('#msgdlg [data-v="cancel"]'); assert.equal(await page.evaluate(() => app.P.pages.length), 3, 'cancelled: nothing changed');
  await page.click('#start-cards [data-start="blank"]'); await page.click('#msgdlg [data-v="ok"]');
  await page.waitForFunction(() => app.P.pages.length === 1 && !app.P.pages[0].items.length); assert.equal(await page.locator('#start').isVisible(), false);
  assert.equal(await page.locator('#empty-hint').isVisible(), true, 'an empty page shows the hint');
  assert.deepEqual(errs, []); await page.close();
});

test('menus: File, Edit and View open, list their actions, and the actions work', { skip }, async () => {
  const { page, errs } = await open({ setup: `app.P = STORE.fresh('blank'); addProp('table'); addProp('drum'); renderAll(); select([pg().items[0].id]);` });
  await page.click('#btn-file'); assert.deepEqual(await page.locator('#menu-file [role=menuitem]').allInnerTexts().then((a) => a.map((t) => t.split('\n')[0].trim())), ['New…', 'Open…', 'Save', 'Save as…', 'Export…', 'Add-ons…']);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#menu-file').isVisible(), false);
  await page.click('#btn-edit'); await page.click('#menu-edit [data-act="duplicate"]'); assert.equal((await items(page)).length, 3, 'Duplicate');
  await page.click('#btn-edit'); await page.click('#menu-edit [data-act="delete"]'); assert.equal((await items(page)).length, 2, 'Delete');
  await page.click('#btn-edit'); assert.equal(await page.locator('#menu-edit [data-act="group"]').isDisabled(), true, 'Group needs two or more things');
  await page.click('#menu-edit [data-act="selectall"]'); await page.click('#btn-edit'); assert.equal(await page.locator('#menu-edit [data-act="group"]').isDisabled(), false);
  await page.click('#menu-edit [data-act="group"]'); assert.ok((await page.evaluate(() => pg().items.every((i) => i.group))), 'Group');
  await page.click('#btn-edit'); await page.click('#menu-edit [data-act="undo"]'); await page.waitForTimeout(50);
  await page.click('#btn-view'); assert.equal(await page.getAttribute('#menu-preview', 'aria-checked'), 'false'); await page.click('#menu-preview');
  assert.equal(await page.evaluate(() => app.preview), true); assert.equal(await page.isChecked('#preview-sw'), true, 'the ribbon switch follows');
  await page.click('#btn-view'); assert.equal(await page.getAttribute('#menu-preview', 'aria-checked'), 'true');
  assert.deepEqual(errs, []); await page.close();
});
test('moving through a menu with the arrow keys does not nudge the selected item; Space presses a focused button', { skip }, async () => {
  const { page } = await open({ setup: `app.P = STORE.fresh('blank'); addProp('table'); renderAll(); select([pg().items[0].id]);` });
  const before = JSON.stringify(await items(page));
  await page.focus('#btn-file'); await page.keyboard.press('ArrowDown'); // opens the menu with the first item focused
  assert.equal(await page.locator('#menu-file').isVisible(), true);
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Delete');
  assert.equal(JSON.stringify(await items(page)), before, 'arrows and Delete inside the menu leave the canvas alone');
  await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-file', 'focus goes back to the File button');
  await page.focus('#toggle-notes'); await page.keyboard.press('Space');
  assert.equal(await page.getAttribute('#toggle-notes', 'aria-expanded'), 'true', 'Space activates the focused button');
  assert.equal(await page.evaluate(() => app.space || false), false, 'and does not start panning');
  await page.keyboard.press('Enter'); assert.equal(await page.getAttribute('#toggle-notes', 'aria-expanded'), 'false', 'Enter does too');
  await page.close();
});

test('rail: choosing a tab opens the flyout, choosing it again folds it away; View > Library panel does the same', { skip }, async () => {
  const { page } = await open();
  const shown = () => page.locator('#left').isVisible(); const tab = () => page.evaluate(() => app.tab);
  assert.equal(await shown(), true); assert.equal(await tab(), 'tab-cast');
  await page.click('#rail-props'); assert.equal(await tab(), 'tab-props'); assert.equal(await shown(), true); assert.equal(await page.locator('#tab-props').isVisible(), true);
  assert.equal(await page.locator('#tab-cast').isVisible(), false, 'one pane at a time');
  await page.click('#rail-props'); assert.equal(await shown(), false, 'same tab again folds the flyout');
  await page.click('#rail-layers'); assert.equal(await shown(), true); assert.equal(await tab(), 'tab-layers');
  await page.click('#fly-close'); assert.equal(await shown(), false); await page.click('#fly-open'); assert.equal(await shown(), true);
  await page.click('#btn-view'); await page.click('#menu-library'); assert.equal(await shown(), false);
  await page.keyboard.press('/'); assert.equal(await shown(), true, '/ opens the panel and goes to search'); assert.equal(await page.evaluate(() => document.activeElement.id), 'lsearch');
  // roving tabindex: one tab stop in the rail, arrow keys move between tabs
  await page.focus('#rail [aria-selected=true]'); await page.keyboard.press('ArrowDown'); assert.notEqual(await tab(), 'tab-layers');
  assert.equal(await page.locator('#rail [role=tab][tabindex="0"]').count(), 1);
  await page.close();
});

test('filmstrip: one thumbnail per page, follows edits, switches pages, keeps ids unique', { skip }, async () => {
  const { page, errs } = await open({ setup: `restore(STORE.fresh('project:sample-animals')); app.page = 0; setPreview(true); renderAll();` });
  const thumbs = page.locator('#film [data-page]'); assert.equal(await thumbs.count(), 3);
  assert.equal(await page.getAttribute('#film [data-page="0"]', 'aria-current'), 'true');
  assert.match(await page.getAttribute('#film [data-page="1"]', 'aria-label'), /^Page 2: /);
  await page.click('#film [data-page="1"]'); assert.equal(await page.evaluate(() => app.page), 1); assert.equal(await page.getAttribute('#film [data-page="1"]', 'aria-current'), 'true');
  // adding something updates this page's thumbnail (after a short delay, not on every drag frame)
  const html = () => page.locator('#film [data-page="1"] .ui-film-thumb').innerHTML();
  const before = await html(); await page.evaluate(() => { addProp('table'); }); await page.waitForTimeout(600); assert.notEqual(await html(), before, 'thumbnail redrawn');
  // ids inside thumbnails never clash with the canvas or each other (styled gradients/clips would break otherwise)
  const dupes = await page.evaluate(() => { const seen = {}; for (const el of document.querySelectorAll('[id]')) seen[el.id] = (seen[el.id] || 0) + 1; return Object.entries(seen).filter(([, n]) => n > 1).map(([id]) => id); });
  assert.deepEqual(dupes, []);
  // arrow keys move focus along the strip; Enter opens the page
  await page.focus('#film [aria-current]'); await page.keyboard.press('ArrowLeft'); assert.equal(await page.evaluate(() => document.activeElement.dataset.page), '0');
  await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => app.page), 0);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.page), '0', 'focus stays on the strip after the page changes');
  await page.keyboard.press('PageDown'); assert.equal(await page.evaluate(() => app.page), 1);
  assert.deepEqual(errs, []); await page.close();
});
test('page options: rename and notes in the drawer, duplicate, move, delete (with confirmation)', { skip }, async () => {
  const { page } = await open({ setup: `app.P = STORE.fresh('blank'); addProp('table'); renderAll();` });
  await page.click('#add-page'); assert.equal(await page.evaluate(() => app.page), 1);
  await page.click('#page-menu-btn'); await page.click('[data-act="page-rename"]'); assert.equal(await page.locator('#notes-drawer').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'page-name');
  await page.keyboard.type('Rainy day'); await page.fill('#page-notes', 'It rains.');
  assert.equal(await page.evaluate(() => [pg().name, pg().notes]).then((a) => a.join('|')), 'Rainy day|It rains.');
  assert.match(await page.getAttribute('#film [aria-current]', 'aria-label'), /Rainy day$/, 'the strip shows the new name');
  await page.click('#page-menu-btn'); assert.equal(await page.locator('#menu-page [data-act="page-later"]').isDisabled(), true, 'last page cannot move later');
  await page.click('[data-act="page-earlier"]'); assert.equal(await page.evaluate(() => app.P.pages.map((p) => p.name).join(',')), 'Rainy day,Page 1');
  await page.click('#page-menu-btn'); await page.click('[data-act="page-dup"]'); assert.equal(await page.evaluate(() => app.P.pages.length), 3);
  await page.click('#page-menu-btn'); await page.click('#del-page'); await page.click('#msgdlg [data-v="cancel"]'); assert.equal(await page.evaluate(() => app.P.pages.length), 3, 'cancel keeps it');
  await page.click('#page-menu-btn'); await page.click('#del-page'); await page.click('#msgdlg [data-v="ok"]'); await page.waitForTimeout(100); assert.equal(await page.evaluate(() => app.P.pages.length), 2);
  await page.click('#toggle-notes'); assert.equal(await page.locator('#notes-drawer').isVisible(), false);
  await page.close();
});

test('export popover: opens from the button, Tab stays inside, Escape closes and returns focus', { skip }, async () => {
  const { page } = await open();
  await page.click('#open-export'); assert.equal(await page.locator('#export').isVisible(), true);
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); assert.equal(await page.locator('#export').isVisible(), true, 'tabbing between its fields keeps it open');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#export').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'open-export');
  await page.click('#open-export'); await page.click('#x-close'); assert.equal(await page.locator('#export').isVisible(), false);
  await page.click('#open-export'); await page.mouse.click(700, 500); assert.equal(await page.locator('#export').isVisible(), false, 'clicking the canvas closes it');
  await page.close();
});

// §4.10 of the plan: every control the old header and panels had is still there. [what, steps to reveal it, selector that must be visible and enabled]
const REACHABLE = [
  ['New project', ['#btn-file'], '[data-act="new"]'], ['Open…', ['#btn-file'], '[data-act="open"]'], ['Save', ['#btn-file'], '#save'], ['Save as…', ['#btn-file'], '#saveas'],
  ['Export', [], '#open-export'], ['Undo', [], '#undo'], ['Redo', [], '#redo'], ['Add-ons (plugins)', [], '#rail-addons'], ['Character designer', [], '#open-designer'],
  ['Styled view (preview)', [], '#preview-sw'], ['Drawing style', [], '#style-sel'], ['Page colour', [], '#paper-col'], ['Page size', [], '#page-size'],
  ['Characters', [], '#rail-cast'], ['Props', [], '#rail-props'], ['Shapes', [], '#rail-shapes'], ['Text', [], '#rail-text'], ['Layers', [], '#rail-layers'], ['Search', [], '#lsearch'],
  ['Go to a page', [], '#film [data-page]'], ['Add page', [], '#add-page'], ['Rename page / notes', ['#page-menu-btn'], '[data-act="page-rename"]'], ['Delete page', ['#page-menu-btn'], '#del-page'],
  ['Duplicate page', ['#page-menu-btn'], '[data-act="page-dup"]'], ['Zoom in', [], '#zoom-in'], ['Zoom out', [], '#zoom-out'], ['Fit page', [], '#zoom-pct'], ['Zoom to selection', [], '#zoom-sel'],
  ['Version / About', ['#btn-help'], '[data-act="about"]'], ['Group', ['#btn-edit'], '#menu-edit [data-act="group"]'], ['Lock', ['#btn-edit'], '#menu-edit [data-act="lock"]'], ['Cut/Copy/Paste', ['#btn-edit'], '#menu-edit [data-act="paste"]'],
];
for (const [what, steps, sel] of REACHABLE) {
  test(`reachable: ${what}`, { skip }, async () => {
    const { page } = await open();
    for (const s of steps) await page.click(s);
    const el = page.locator(sel).first(); assert.equal(await el.isVisible(), true, `${what}: ${sel} is visible`);
    await page.close();
  });
}
test.after(async () => { if (browser) await browser.close(); server.close(); });
