// Character designer as a side panel (phase 5): opens from the ribbon and Characters, nothing modal, keys and Undo behave, Character type picker, inline template name, deleting.
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

const CLASSROOM = `restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll(); commit();`; // commit: Undo has this state to come back to
async function open(setup = CLASSROOM) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text())); page.on('dialog', (d) => { errs.push('native dialog: ' + d.message()); d.dismiss(); });
  await page.goto(url); await page.waitForFunction(() => typeof app !== 'undefined' && app.P);
  await page.evaluate(() => { hideStart(); localStorage.clear(); }); await page.evaluate(setup); await page.waitForTimeout(450);
  return { page, errs };
}
const settle = (page) => page.waitForTimeout(450); // undo snapshots are taken a moment after the last change
const teacherId = (page) => page.evaluate(() => pg().items.find((i) => i.cast === 'teacher').id);
const selectTeacher = async (page) => { const id = await teacherId(page); await page.evaluate((i) => select([i]), id); };
const modal = (page) => page.evaluate(() => !!document.querySelector('dialog:modal'));
const designerOn = (page) => page.evaluate(() => !!app.designer && !document.querySelector('#designer').hidden);

test('opens from the ribbon as a side panel: nothing modal, the page stays usable, the Details panel comes back as it was', { skip }, async () => {
  const { page, errs } = await open(); await selectTeacher(page);
  assert.equal(await page.evaluate(() => $('#right').hidden), true, 'Details was closed');
  await page.click('#ribbon-sel [data-act="design"]');
  assert.equal(await designerOn(page), true); assert.equal(await modal(page), false, 'no modal dialog'); assert.equal(await page.locator('#inspector').isVisible(), false);
  assert.equal(await page.locator('#details-title').innerText(), 'Character designer'); assert.equal(await page.inputValue('#d-form [data-d="name"]'), 'Teacher');
  assert.equal(await page.locator('#d-preview svg').count(), 1, 'live preview on top'); assert.ok(await page.locator('#d-cast .tile').count() >= 5, 'the cast to pick from');
  assert.equal(await page.evaluate(() => document.querySelector('dialog[open]') === null), true, 'no dialog of any kind is open');
  // the page still takes clicks: choose Lily (designer follows), then really click the teacher on the page
  const lilyId = await page.evaluate(() => pg().items.find((i) => i.cast === 'lily').id); await page.evaluate((id) => select([id]), lilyId); assert.equal(await page.inputValue('#d-form [data-d="name"]'), 'Lily', 'choosing a figure edits its character');
  const tc = await page.evaluate((i) => { const b = document.querySelector(`#items [data-id="${i}"]`).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2 - 60]; }, await teacherId(page)); // on her body (a stick figure is thin)
  await page.mouse.click(tc[0], tc[1]); assert.equal(await page.inputValue('#d-form [data-d="name"]'), 'Teacher', 'a real click on a figure on the page switches the designer to it');
  // a row in the Layers panel does the same
  await page.click('#rail-layers'); await page.click(`#layers [data-layer="${lilyId}"] .ln`); assert.equal(await page.inputValue('#d-form [data-d="name"]'), 'Lily', 'a Layers row too'); await page.click('#rail-cast'); await selectTeacher(page);
  // Done puts Details back to closed
  await page.click('#d-close'); assert.equal(await designerOn(page), false); assert.equal(await page.evaluate(() => $('#right').hidden), true, 'Details closes again, as it was');
  // with Details open before, it stays open
  await page.click('#details-toggle'); await page.click('#ribbon-sel [data-act="design"]'); await page.click('#d-close');
  assert.equal(await page.evaluate(() => !$('#right').hidden), true); assert.equal(await page.locator('#inspector').isVisible(), true, 'the normal Details are back');
  // the panel's X and Esc also finish; Esc does not deselect the figure
  await page.click('#ribbon-sel [data-act="design"]'); await page.click('#details-close'); assert.equal(await designerOn(page), false, 'X finishes the designer');
  await page.click('#ribbon-sel [data-act="design"]'); await page.focus('#d-cast .tile'); await page.keyboard.press('Escape');
  assert.equal(await designerOn(page), false, 'Esc finishes'); assert.equal(await page.evaluate(() => app.sel.length), 1, 'and keeps the selection');
  assert.deepEqual(errs, []); await page.close();
});

test('keys pressed in the designer never touch the page: Delete, Backspace, arrows and tool keys do nothing to the figure', { skip }, async () => {
  const { page, errs } = await open(); await selectTeacher(page); await page.click('#ribbon-sel [data-act="design"]');
  const before = await page.evaluate(() => JSON.stringify(pg().items)); const n = await page.evaluate(() => pg().items.length);
  for (const where of ['#d-cast .tile', '#d-form [data-swatch]', '#d-form [data-dtype]', '#d-close']) {
    await page.focus(where); for (const k of ['Delete', 'Backspace', 'ArrowRight', 'ArrowUp', 'r', 'o', 'l', 'a', 't', 'y', 'Control+x', 'Control+c', 'Control+v', 'Control+d', 'Control+g', 'Control+Shift+l', 'Control+a']) await page.keyboard.press(k);
    assert.equal(await page.evaluate(() => app.tool), null, `no tool armed from ${where}`); assert.equal(await page.evaluate(() => pg().items.length), n, `nothing deleted from ${where}`);
    if (!(await designerOn(page))) await page.click('#ribbon-sel [data-act="design"]'); // Enter / Space on Done would close it; not pressed here, but be safe
  }
  assert.equal(await page.evaluate(() => JSON.stringify(pg().items)), before, 'the page is exactly as it was');
  // typing a name with these letters is fine too
  await page.fill('#d-form [data-d="name"]', ''); await page.type('#d-form [data-d="name"]', 'Roll a yo-yo'); assert.equal(await page.evaluate(() => castById('teacher').name), 'Roll a yo-yo'); assert.equal(await page.evaluate(() => app.tool), null);
  assert.deepEqual(errs, []); await page.close();
});

test('Undo and Redo work while designing: a colour, and a change of Character type with its placed figures', { skip }, async () => {
  const { page, errs } = await open(); await selectTeacher(page); await page.click('#ribbon-sel [data-act="design"]');
  const col0 = await page.evaluate(() => castById('teacher').color);
  await page.click('#d-form [data-swatch="#2e9e44"]'); await settle(page);
  assert.equal(await page.evaluate(() => castById('teacher').color), '#2e9e44');
  await page.click('#undo'); assert.equal(await page.evaluate(() => castById('teacher').color), col0, 'Undo brings the colour back'); assert.equal(await designerOn(page), true, 'the designer stays open');
  assert.equal(await page.inputValue('#d-form [data-d="color"]'), col0, 'and shows the old colour'); await page.click('#redo'); assert.equal(await page.evaluate(() => castById('teacher').color), '#2e9e44'); assert.equal(await page.inputValue('#d-form [data-d="color"]'), '#2e9e44');
  await page.click('#undo');
  // Character type: one click changes the type and resets placed figures; one Undo puts it all back
  const pose0 = await page.evaluate(() => JSON.stringify(pg().items.find((i) => i.cast === 'teacher').pose));
  assert.equal(await page.locator('#d-form [data-dtype]').count(), 2, 'person and animal'); assert.equal(await page.locator('#d-form [data-dtype="biped"][aria-checked="true"]').count(), 1);
  assert.ok(await page.locator('#d-form [data-dtype="quadruped"] svg').count() === 1, 'each type is drawn');
  await page.click('#d-form [data-dtype="quadruped"]'); await settle(page);
  assert.equal(await page.evaluate(() => FIG.rigOf(castById('teacher')).id), 'quadruped'); assert.equal(await page.locator('#d-form [data-d="hair"]').count(), 0, 'no hair for an animal'); assert.equal(await page.locator('#d-form [data-dtype="quadruped"][aria-checked="true"]').count(), 1);
  assert.notEqual(await page.evaluate(() => JSON.stringify(pg().items.find((i) => i.cast === 'teacher').pose)), pose0);
  await page.click('#undo');
  assert.equal(await page.evaluate(() => FIG.rigOf(castById('teacher')).id), 'biped'); assert.equal(await page.evaluate(() => JSON.stringify(pg().items.find((i) => i.cast === 'teacher').pose)), pose0, 'placed figures get their old pose back');
  assert.equal(await page.locator('#d-form [data-d="hair"]').count(), 1, 'hair is back'); assert.equal(await page.locator('#d-form [data-dtype="biped"][aria-checked="true"]').count(), 1);
  assert.deepEqual(errs, []); await page.close();
});

test('New character makes one and opens it for editing (name selected); Undo removes it without breaking the open designer; Add to page keeps the designer open', { skip }, async () => {
  const { page, errs } = await open(); const n0 = await page.evaluate(() => app.P.cast.length);
  await page.click('#open-designer'); assert.equal(await page.evaluate(() => app.P.cast.length), n0 + 1); assert.equal(await designerOn(page), true); assert.equal(await modal(page), false);
  assert.equal(await page.evaluate(() => document.activeElement.dataset.d), 'name', 'the name is ready to type'); assert.equal(await page.evaluate(() => document.activeElement.selectionEnd - document.activeElement.selectionStart > 0), true, 'and its text is selected');
  await settle(page); await page.click('[data-dact="add"]'); assert.equal(await designerOn(page), true, 'still open after Add to page'); assert.equal(await page.evaluate(() => pg().items.some((i) => i.cast === app.designerCast)), true);
  await settle(page); await page.click('#undo'); await page.click('#undo'); await settle(page);
  assert.equal(await page.evaluate(() => app.P.cast.length), n0, 'the new character is gone'); assert.equal(await designerOn(page), true, 'the designer moved to a character that still exists'); assert.ok(await page.evaluate(() => !!castById(app.designerCast)));
  assert.deepEqual(errs, []); await page.close();
});

test('Save as template asks for the name inside the panel (no pop-up); Esc cancels that row first; Delete asks for confirmation and the designer moves on', { skip }, async () => {
  const { page, errs } = await open(); await selectTeacher(page); await page.click('#ribbon-sel [data-act="design"]');
  await page.click('[data-dact="tpl"]'); assert.equal(await page.locator('#d-tplname').isVisible(), true); assert.equal(await page.evaluate(() => document.activeElement.id), 'd-tplname');
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#d-tplname').count(), 0, 'Esc cancels the name row'); assert.equal(await designerOn(page), true, 'and not the designer');
  const t0 = await page.evaluate(() => app.P.templates.length);
  await page.click('[data-dact="tpl"]'); await page.fill('#d-tplname', 'My teacher'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => app.P.templates.length), t0 + 1); assert.equal(await page.evaluate(() => app.P.templates.at(-1).name), 'My teacher'); assert.equal(await page.locator('#d-tplname').count(), 0);
  assert.match(await page.locator('#d-templates').innerHTML(), /My teacher/, 'it shows in the starting looks');
  await settle(page);
  // delete: a confirmation (a destructive confirm may be a dialog), then the designer moves to another character
  await page.click('[data-dact="del"]'); assert.equal(await modal(page), true, 'the confirm is a dialog'); await page.click('#msg-buttons button.primary, #msg-buttons button:has-text("Delete")');
  await page.waitForTimeout(100); assert.equal(await modal(page), false); assert.equal(await page.evaluate(() => !!castById('teacher')), false);
  assert.equal(await designerOn(page), true); assert.notEqual(await page.evaluate(() => app.designerCast), 'teacher'); assert.ok(await page.locator('#d-form [data-d="name"]').count() === 1);
  assert.deepEqual(errs, []); await page.close();
});

test('the cast strip switches character; every control still edits (name, colour, hair, accessories) and the page follows', { skip }, async () => {
  const { page, errs } = await open(); await selectTeacher(page); await page.click('#ribbon-sel [data-act="design"]');
  await page.click('#d-cast [data-dcast="lily"]'); assert.equal(await page.inputValue('#d-form [data-d="name"]'), 'Lily');
  await page.fill('#d-form [data-d="name"]', 'Lilly'); assert.equal(await page.evaluate(() => castById('lily').name), 'Lilly'); assert.match(await page.locator('#d-cast .tile.on').innerText(), /Lilly/, 'the strip follows the name');
  const hair = await page.evaluate(() => Object.keys(CP.hair).find((h) => h !== castById('lily').hair)); await page.selectOption('#d-form [data-d="hair"]', hair); assert.equal(await page.evaluate(() => castById('lily').hair), hair);
  await page.check('#d-form [data-acc="glasses"]'); assert.equal(await page.evaluate(() => !!castById('lily').accessories?.glasses), true);
  await page.selectOption('#d-pose', 'sit'); assert.equal(await page.evaluate(() => app.designerPose), 'sit');
  assert.deepEqual(errs, []); await page.close();
});

test('nothing blocks the page: About and the "opened a file" report are a corner card; only Save / Open steps and delete confirms are modal', { skip }, async () => {
  const { page, errs } = await open();
  await page.click('#btn-help'); await page.click('[data-act="about"]'); assert.equal(await page.locator('#bookinfo').isVisible(), true); assert.equal(await modal(page), false, 'About is not a modal');
  await page.keyboard.press('r'); assert.equal(await page.evaluate(() => app.tool), 'box', 'quick keys work while the card is up'); await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => app.tool), null);
  await page.click('#bookinfo button'); assert.equal(await page.locator('#bookinfo').isVisible(), false, 'Close closes it');
  await page.evaluate(() => showBookInfo('Opened sample.json', '<p>Plugins this book uses that differ here:</p>')); assert.equal(await page.locator('#bookinfo').isVisible(), true); assert.equal(await modal(page), false);
  assert.match(await page.locator('#bookinfo-title').innerText(), /Opened/);
  // the page is still clickable with the card showing
  const id = await page.evaluate(() => pg().items.find((i) => i.kind === 'table').id); const r = await page.evaluate((i) => { const b = document.querySelector(`#items [data-id="${i}"]`).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2 - 40]; }, id); // the tabletop: not under the card
  await page.evaluate(() => select([])); await page.mouse.click(r[0], r[1]); assert.ok((await page.evaluate(() => app.sel)).includes(id), 'a real click on the page still selects with the card showing');
  await page.keyboard.press('Control+a'); assert.ok(await page.evaluate(() => app.sel.length) > 1, 'Ctrl+A still selects');
  // every <dialog> that can still open modally is one of the allowed kinds
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('dialog')].map((d) => d.id).sort()), ['bookinfo', 'msgdlg', 'permdlg', 'upgradedlg']);
  assert.deepEqual(errs, []); await page.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
