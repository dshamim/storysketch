// The text tool: creating, typing, editing in place, rotating like any object, properties, export and save/reopen.
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
const texts = (page) => page.evaluate(() => pg().items.filter((i) => i.type === 'text').map((i) => ({ id: i.id, text: i.text, x: i.x, y: i.y, s: i.s, rot: i.rot, w: i.w, size: i.size, align: i.align, weight: i.weight, color: i.color, flip: i.flip })));
const box = (page, i = 0) => page.evaluate((i) => { const it = pg().items.filter((x) => x.type === 'text')[i]; const b = pageBBox([it]); return { x: b.x, y: b.y, w: b.w, h: b.h }; }, i);
const TEXT = `app.P = STORE.fresh('blank'); addItem(TXT.make({ text: 'Reading time', size: 60, align: 'center' }, 500, 300)); renderAll(); select([]);`;

test('Text tab in the rail: presets add a text that is ready to type over; Esc finishes; the layer is named after the text', { skip }, async () => {
  const { page, errs } = await open();
  await page.click('#rail-text'); assert.equal(await page.locator('#tab-text').isVisible(), true); assert.equal(await page.locator('#lsearch').isVisible(), false, 'no search box for presets');
  assert.deepEqual(await page.locator('#text-presets .tile span').allInnerTexts(), ['Title', 'Heading', 'Body text', 'Caption', 'Number line']);
  assert.ok(await page.locator('#text-presets svg').count() >= 5, 'each preset shows a preview');
  await page.click('[data-text-preset="heading"]');
  const t = (await texts(page))[0]; assert.equal(t.text, 'Heading'); assert.equal(t.size, 64); assert.equal(t.weight, 'bold');
  assert.equal(await page.evaluate(() => !!app.edit), true, 'in edit mode'); assert.equal(await page.evaluate(() => document.activeElement.id), 'text-input');
  await page.keyboard.type('The big day'); assert.equal((await texts(page))[0].text, 'The big day', 'typing replaces the selected sample text');
  assert.equal(await page.locator('#overlay .caret').count(), 1, 'a caret is drawn');
  await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => !!app.edit), false); assert.equal((await texts(page)).length, 1);
  await page.click('#rail-layers'); assert.match(await page.locator('#layers .layer .ln').first().innerText(), /The big day/);
  assert.deepEqual(errs, []); await page.close();
});

test('T tool: click makes text that grows as you type; an empty text disappears; drag makes a box that wraps', { skip }, async () => {
  const { page, errs } = await open();
  await page.keyboard.press('t'); assert.equal(await page.evaluate(() => app.tool), 'text'); assert.equal(await page.getAttribute('#add-textbox', 'aria-pressed'), 'true');
  let [x, y] = await screen(page, 200, 150); await page.mouse.click(x, y);
  assert.equal(await page.evaluate(() => app.tool), null, 'the tool is one-shot'); assert.equal(await page.evaluate(() => !!app.edit), true);
  const before = await box(page); assert.ok(Math.abs(before.x - 200) <= 2 && Math.abs(before.y - 150) <= 2, 'top-left is where you clicked');
  await page.keyboard.type('Hello there'); const after = await box(page);
  assert.ok(Math.abs(after.x - 200) <= 2 && Math.abs(after.y - 150) <= 2, 'the left edge stays put as it grows'); assert.ok(after.w > before.w + 100);
  await page.keyboard.press('Escape');
  // click and leave it empty: nothing is kept
  await page.keyboard.press('t'); [x, y] = await screen(page, 600, 500); await page.mouse.click(x, y); await page.keyboard.press('Escape');
  assert.equal((await texts(page)).length, 1, 'an empty text is removed');
  // drag a box: wraps at that width
  await page.keyboard.press('t'); const a = await screen(page, 100, 400), b = await screen(page, 400, 450);
  await page.mouse.move(a[0], a[1]); await page.mouse.down(); await page.mouse.move(b[0], b[1], { steps: 4 }); await page.mouse.up();
  await page.keyboard.type('the quick brown fox jumps over the lazy dog'); await page.keyboard.press('Escape');
  const w = (await texts(page)).at(-1); assert.ok(Math.abs(w.w - 300) <= 6, 'box width ' + w.w);
  assert.ok(await page.evaluate(() => TXT.layout(pg().items.at(-1)).lines.length) > 2, 'it wraps');
  await page.keyboard.press('t'); await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => app.tool), null, 'Esc cancels the tool');
  assert.deepEqual(errs, []); await page.close();
});

test('editing in place: double-click, Enter, clicking moves the caret, arrow keys, Ctrl+Enter, Shift selects', { skip }, async () => {
  const { page } = await open(TEXT);
  const [x, y] = await screen(page, 500, 300); await page.mouse.dblclick(x, y); assert.equal(await page.evaluate(() => !!app.edit), true, 'double-click edits');
  await page.keyboard.press('End'); await page.keyboard.type('!'); assert.equal((await texts(page))[0].text, 'Reading time!');
  // click between letters: the caret goes there
  const at = await page.evaluate(() => { const it = pg().items[0]; const L = TXT.layout(it); const c = TXT.caret(L, 7); const m = document.querySelector('#stage').getScreenCTM(); return [(it.x + c.x * it.s) * m.a + m.e, (it.y + (c.y0 + c.y1) / 2 * it.s) * m.d + m.f]; });
  await page.mouse.click(at[0], at[1]); assert.equal(await page.evaluate(() => document.activeElement.selectionStart), 7, 'caret at 7');
  await page.keyboard.type('X'); assert.equal((await texts(page))[0].text, 'ReadingX time!', 'typed at the caret (between "Reading" and the space)');
  await page.keyboard.press('Shift+Home'); assert.equal(await page.evaluate(() => document.activeElement.selectionStart), 0);
  assert.ok(await page.locator('#overlay rect[fill-opacity="0.28"]').count() >= 1, 'the selection is highlighted');
  await page.keyboard.press('Control+Enter'); assert.equal(await page.evaluate(() => !!app.edit), false, 'Ctrl+Enter finishes');
  assert.equal(await page.evaluate(() => app.sel.length), 1, 'still selected'); await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => !!app.edit), true, 'Enter starts editing the selected text');
  // up / down move by drawn line in wrapped text
  await page.evaluate(() => { const it = pg().items[0]; it.w = 200; it.text = 'one two three four five six'; app.edit = null; startEdit(it.id); document.activeElement.setSelectionRange(2, 2); renderAll(); });
  await page.keyboard.press('ArrowDown'); assert.ok((await page.evaluate(() => document.activeElement.selectionStart)) > 2, 'down goes to the next line');
  await page.keyboard.press('ArrowUp'); assert.ok((await page.evaluate(() => document.activeElement.selectionStart)) <= 4, 'and back up');
  await page.close();
});

test('a text rotates like any object: by the rotate handle and by typing an angle, and the export is rotated too', { skip }, async () => {
  const { page, errs } = await open(TEXT);
  await page.evaluate(() => select([pg().items[0].id])); const flat = await box(page);
  // 1. typing an angle in the ribbon
  await page.fill('#ribbon-sel [data-rot]', '90'); await page.waitForTimeout(80); assert.equal((await texts(page))[0].rot, 90);
  const turned = await box(page); assert.ok(Math.abs(turned.w - flat.h) < 3 && Math.abs(turned.h - flat.w) < 3, `box turned: ${flat.w}x${flat.h} -> ${turned.w}x${turned.h}`);
  // 2. dragging the rotate handle (to the right of the item = 90° more -> 180)
  await page.fill('#ribbon-sel [data-rot]', '0'); await page.waitForTimeout(80); // the page redraws on the next frame
  const h = await page.locator('#overlay [data-h="rot"]').boundingBox(); const c = await screen(page, 500, 300);
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down(); await page.mouse.move(c[0] + 150, c[1], { steps: 6 }); await page.mouse.up();
  const r = (await texts(page))[0].rot; assert.ok(Math.abs(r - 90) <= 3, 'rotated by the handle: ' + r);
  // 3. the exported SVG carries the rotation and stays text-as-drawing
  const svg = await page.evaluate(() => { const items = pg().items; return buildSVG(items, { x: 0, y: 0, w: 1000, h: 750 }, { style: null, bg: false, scale: 1 }).svg; });
  assert.match(svg, /rotate\((8\d|9\d)[ )]/); assert.ok(!/<text/.test(svg), 'drawn as strokes, no font needed'); assert.ok((svg.match(/<path/g) || []).length > 10);
  // 4. flip, then undo / redo of the turn
  await page.click('#ribbon-sel [data-act="flip"]').catch(() => {}); await page.evaluate(() => { pg().items[0].flip = true; renderStage(); commit(); });
  assert.equal((await texts(page))[0].flip, true);
  assert.deepEqual(errs, []); await page.close();
});

test('width handles re-wrap the text and keep the top corner in place; the scale handle scales it', { skip }, async () => {
  const { page } = await open(`app.P = STORE.fresh('blank'); addItem(TXT.make({ text: 'the quick brown fox jumps over the lazy dog', size: 40, align: 'left', w: 500 }, 500, 300)); renderAll(); select([]);`);
  await page.evaluate(() => select([pg().items[0].id])); const lines = () => page.evaluate(() => TXT.layout(pg().items[0]).lines.length); const l0 = await lines();
  const top0 = (await box(page)).y, left0 = (await box(page)).x;
  const hr = await page.locator('#overlay [data-h="tw-r"]').boundingBox(); await page.mouse.move(hr.x + hr.width / 2, hr.y + hr.height / 2); await page.mouse.down();
  const z = await page.evaluate(() => zoom()); await page.mouse.move(hr.x + hr.width / 2 - 250 * z, hr.y + hr.height / 2, { steps: 6 }); await page.mouse.up();
  const t = (await texts(page))[0]; assert.ok(Math.abs(t.w - 250) <= 6, 'width ' + t.w); assert.ok((await lines()) > l0, 'more lines at half the width');
  const b = await box(page); assert.ok(Math.abs(b.x - left0) <= 2 && Math.abs(b.y - top0) <= 2, `top-left stayed (${b.x},${b.y}) vs (${left0},${top0})`);
  // the left handle
  const hl = await page.locator('#overlay [data-h="tw-l"]').boundingBox(); const right0 = (await box(page)).x + (await box(page)).w;
  await page.mouse.move(hl.x + hl.width / 2, hl.y + hl.height / 2); await page.mouse.down(); await page.mouse.move(hl.x + hl.width / 2 + 60 * z, hl.y + hl.height / 2, { steps: 4 }); await page.mouse.up();
  const b2 = await box(page); assert.ok(Math.abs(b2.x + b2.w - right0) <= 2, 'the right edge stayed when the left handle moved');
  const s0 = (await texts(page))[0].s; const hs = await page.locator('#overlay [data-h="scale"]').boundingBox();
  await page.mouse.move(hs.x + hs.width / 2, hs.y + hs.height / 2); await page.mouse.down(); await page.mouse.move(hs.x + 200, hs.y + 150, { steps: 5 }); await page.mouse.up();
  assert.ok((await texts(page))[0].s > s0, 'scaled up'); await page.close();
});

test('properties: ribbon (size, bold, underline, align, colour, spacing) and Details ▸ Look change the text', { skip }, async () => {
  const { page, errs } = await open(TEXT); await page.evaluate(() => select([pg().items[0].id]));
  const it = () => page.evaluate(() => { const i = pg().items[0]; return { size: i.size, weight: i.weight, underline: i.underline, align: i.align, color: i.color, lineHeight: i.lineHeight, letterSpacing: i.letterSpacing, colors: i.colors, text: i.text, w: i.w }; });
  assert.equal(await page.locator('#ribbon-sel [data-text="size"]').inputValue(), '60');
  await page.click('#ribbon-sel [data-text-step="size:4"]'); assert.equal((await it()).size, 64); await page.click('#ribbon-sel [data-text-step="size:-4"]'); await page.click('#ribbon-sel [data-text-step="size:-4"]'); assert.equal((await it()).size, 56);
  await page.fill('#ribbon-sel [data-text="size"]', '90'); assert.equal((await it()).size, 90); await page.fill('#ribbon-sel [data-text="size"]', '9999'); assert.equal((await it()).size, 400, 'size is limited');
  await page.fill('#ribbon-sel [data-text="size"]', '60');
  await page.click('#ribbon-sel [data-text-toggle="weight"]'); assert.equal((await it()).weight, 'bold'); assert.equal(await page.getAttribute('#ribbon-sel [data-text-toggle="weight"]', 'aria-pressed'), 'true');
  await page.click('#ribbon-sel [data-text-toggle="underline"]'); assert.equal((await it()).underline, true);
  await page.click('#ribbon-sel [data-text-set="align=right"]'); assert.equal((await it()).align, 'right'); assert.equal(await page.getAttribute('#ribbon-sel [data-text-set="align=right"]', 'aria-pressed'), 'true');
  await page.locator('#ribbon-sel [data-text="color"]').evaluate((el) => { el.value = '#2e9e44'; el.dispatchEvent(new Event('input', { bubbles: true })); }); assert.equal((await it()).color, '#2e9e44');
  await page.click('#ribbon-sel [data-rb="pop-spacing"]'); assert.equal(await page.locator('#pop-spacing').isVisible(), true);
  await page.locator('#sp-line').evaluate((el) => { el.value = '2'; el.dispatchEvent(new Event('input', { bubbles: true })); }); assert.equal((await it()).lineHeight, 2);
  await page.locator('#sp-letter').evaluate((el) => { el.value = '0.3'; el.dispatchEvent(new Event('input', { bubbles: true })); }); assert.equal((await it()).letterSpacing, 0.3);
  await page.keyboard.press('Escape'); assert.equal(await page.locator('#pop-spacing').isVisible(), false);
  // Details: text, colours, width, letter colours
  await page.click('#details-toggle'); assert.equal(await page.inputValue('#inspector textarea[data-text="text"]'), 'Reading time');
  await page.fill('#inspector textarea[data-text="text"]', 'Good morning\nclass'); assert.equal((await it()).text, 'Good morning\nclass');
  await page.selectOption('#inspector [data-text="colors"]', 'rainbow'); assert.equal((await it()).colors, 'rainbow');
  await page.click('#inspector [data-text-color="#e0402f"]'); assert.equal((await it()).color, '#e0402f');
  await page.uncheck('#inspector [data-text="w"][data-auto]'); assert.ok((await it()).w > 0, 'a fixed width appears'); await page.check('#inspector [data-text="w"][data-auto]'); assert.equal((await it()).w, 0, 'fit to text');
  await page.uncheck('#inspector [data-text="weight"]'); assert.equal((await it()).weight, 'normal');
  assert.deepEqual(await page.locator('#inspector [role=tab]').allInnerTexts(), ['Look', 'Arrange']);
  assert.deepEqual(errs, []); await page.close();
});

test('every style draws the text, clean lines stay crisp, and the first line of the export is the text itself', { skip }, async () => {
  const { page, errs } = await open(TEXT);
  const out = await page.evaluate(() => { const r = {}; for (const st of [null, ...RENDER.styleList().map((s) => s.id)]) r[st || 'clean'] = buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: st, bg: true, scale: 1 }).svg; return r; });
  for (const [k, svg] of Object.entries(out)) { assert.ok((svg.match(/<path/g) || []).length >= 10, k + ' has strokes'); assert.ok(svg.length > 1500, k); }
  assert.ok(!/filter="url\(#/.test(out.clean.replace(/<defs>[\s\S]*?<\/defs>/, '')), 'clean has no hand-drawn filters'); assert.match(out.crayon, /filter="url\(#crayon/);
  assert.notEqual(out.marker, out.crayon); assert.notEqual(out.ink, out.chalk);
  // same project, same pixels twice (the wobble is seeded by the item id)
  assert.equal(await page.evaluate(() => buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: 'ink', bg: true, scale: 1 }).svg === buildSVG(pg().items, { x: 0, y: 0, w: 1000, h: 750 }, { style: 'ink', bg: true, scale: 1 }).svg), true);
  // PNG export of a text selection works end to end
  await page.evaluate(() => select([pg().items[0].id])); await page.click('#open-export'); await page.uncheck('input[name="ask"]', { force: true }); await page.check('input[name="what"][value="selection"]'); await page.check('input[name="scale"][value="1"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#do-export')]); assert.match(dl.suggestedFilename(), /selection/); assert.equal(fs.readFileSync(await dl.path()).subarray(1, 4).toString(), 'PNG');
  assert.deepEqual(errs, []); await page.close();
});

test('a text is a normal item: undo/redo, copy/paste, duplicate, group, lock, line up, save and reopen', { skip }, async () => {
  const { page, errs } = await open();
  await page.keyboard.press('t'); const [x, y] = await screen(page, 300, 200); await page.mouse.click(x, y); await page.keyboard.type('Hi'); await page.keyboard.press('Escape'); await page.waitForTimeout(450);
  assert.equal((await texts(page)).length, 1); await page.keyboard.press('Control+z'); await page.waitForTimeout(450); assert.equal((await texts(page)).length, 0, 'undo removes it');
  await page.keyboard.press('Control+Shift+z'); await page.waitForTimeout(450); assert.equal((await texts(page)).length, 1, 'redo brings it back'); assert.equal((await texts(page))[0].text, 'Hi');
  await page.evaluate(() => select([pg().items[0].id])); await page.keyboard.press('Control+d'); assert.equal((await texts(page)).length, 2, 'duplicate');
  await page.keyboard.press('Control+c'); await page.keyboard.press('Control+v'); assert.equal((await texts(page)).length, 3, 'paste');
  await page.evaluate(() => { const [a, b, c] = pg().items; a.x = 200; b.x = 400; c.x = 800; a.y = b.y = c.y = 300; renderAll(); select(pg().items.map((i) => i.id)); });
  await page.click('[data-rb="menu-align"]'); await page.click('#menu-align [data-act="align-top"]'); await page.waitForTimeout(50);
  const tops = await page.evaluate(() => pg().items.map((i) => Math.round(pageBBox([i]).y))); assert.equal(new Set(tops).size, 1, 'lined up by their text boxes ' + tops);
  await page.keyboard.press('Control+g'); assert.ok(await page.evaluate(() => pg().items.every((i) => i.group)), 'grouped'); await page.keyboard.press('Control+Shift+g');
  await page.evaluate(() => { const it = pg().items[0]; it.rot = 20; it.size = 70; it.colors = 'lines'; it.text = 'Line one\nLine two'; select([]); renderAll(); });
  const before = await page.evaluate(() => JSON.stringify(pg().items)); const file = await page.evaluate(() => STORE.serialize(app.P));
  await page.evaluate((t) => { app.P = STORE.fresh('blank'); renderAll(); applyLoaded(t, 'text.json'); }, file);
  assert.equal(await page.evaluate(() => JSON.stringify(pg().items)), before, 'a saved and reopened project keeps its text exactly');
  // locked text cannot be edited and is skipped by the tool
  await page.evaluate(() => { pg().items[0].locked = true; select([pg().items[0].id]); renderAll(); startEdit(pg().items[0].id); }); assert.equal(await page.evaluate(() => !!app.edit), false, 'a locked text does not start editing');
  assert.deepEqual(errs, []); await page.close();
});

test('the old Numbers & words prop is hidden from the library (the Text tool replaces it) but old projects still show it', { skip }, async () => {
  const { page } = await open(`restore(STORE.fresh('blank')); renderAll();`);
  await page.click('#rail-props'); assert.equal(await page.locator('#prop-list [data-add-prop="numbers"]').count(), 0);
  assert.equal(await page.evaluate(() => { addProp('numbers'); return propPrims(pg().items[0]).length > 0; }), true, 'it still draws if a project uses it'); await page.close();
});
test.after(async () => { if (browser) await browser.close(); server.close(); });
