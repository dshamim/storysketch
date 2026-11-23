// Accessibility (phase 7): every control has a name, headings keep their order, targets are big enough, the keyboard reaches what is on the page.
// (Lighthouse is run separately with tools/a11y-audit.mjs; these checks are the part that always runs.)
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
const CLASSROOM = `restore(STORE.fresh('project:sample-classroom')); app.page = 0; setPreview(false); renderAll(); commit();`;
const TEACHER = `select([pg().items.find((i) => i.cast === 'teacher').id]);`;

// The states to look at. Each is [name, js to get there]. (Add new panels and overlays here as they appear.)
const STATES = [
  ['nothing selected', `select([]);`],
  ['figure selected, Details open', `${TEACHER} showDetails();`],
  ['text selected, Details open', `addItem(TXT.make({ text: 'Hello', size: 60 }, 300, 150)); showDetails();`],
  ['shape selected, Details open', `addItem(SHP.make('box', 500, 300, { fill: 'colour', text: 'Words' })); showDetails();`],
  ['line selected, Details open', `addItem(SHP.make('arrow', 500, 300)); showDetails();`],
  ['several selected, Details open', `select(pg().items.slice(0, 3).map((i) => i.id)); showDetails();`],
  ['designer', `${TEACHER} openDesigner('teacher');`],
  ['shapes tab', `select([]); setTab('tab-shapes'); showFlyout();`],
  ['text tab', `select([]); setTab('tab-text'); showFlyout();`],
  ['layers tab', `select([]); setTab('tab-layers'); showFlyout();`],
  ['props tab', `select([]); setTab('tab-props'); showFlyout();`],
  ['add-ons tab', `select([]); setTab('tab-addons'); showFlyout();`],
  ['export popover', `select([]); document.querySelector('#open-export').click();`],
  ['file menu', `select([]); document.querySelector('#btn-file').click();`],
  ['About card', `select([]); showAbout();`],
];

// the accessible name of every control the user can reach, computed the way a screen reader would (roughly)
const UNNAMED = (page) => page.evaluate(() => {
  const name = (el) => {
    const lab = el.getAttribute('aria-labelledby'); if (lab) { const t = lab.split(/\s+/).map((id) => (document.getElementById(id) || {}).textContent || '').join(' ').trim(); if (t) return t; }
    const al = el.getAttribute('aria-label'); if (al && al.trim()) return al.trim();
    if (el.labels && el.labels.length) { const t = [...el.labels].map((l) => l.textContent).join(' ').trim(); if (t) return t; }
    const lw = el.closest('label'); if (lw && lw.textContent.trim()) return lw.textContent.trim();
    if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) { const t = (el.innerText || el.textContent || '').trim(); if (t) return t; }
    const ti = el.getAttribute('title'); if (ti && ti.trim()) return ti.trim();
    const im = el.querySelector && el.querySelector('img[alt]'); if (im && im.alt.trim()) return im.alt.trim();
    return '';
  };
  const out = [];
  for (const el of document.querySelectorAll('button, a[href], select, textarea, input:not([type=hidden]), summary, [role=button], [role=tab], [role=menuitem], [role=menuitemcheckbox], [role=radio], [role=option], [role=switch], [tabindex]:not([tabindex="-1"])')) {
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const hiddenInput = el.matches('input[type=checkbox], input[type=radio]') && cs.opacity === '0';
    if (el.closest('[hidden], [inert]') || (cs.visibility === 'hidden' && !hiddenInput) || cs.display === 'none' || (!r.width && !r.height && !hiddenInput)) continue;
    if (!name(el)) out.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '') + ' ' + (el.outerHTML.slice(0, 90)));
  }
  return out;
});
const HEADINGS = (page) => page.evaluate(() => {
  const hs = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => { const cs = getComputedStyle(h); return !h.closest('[hidden]') && cs.display !== 'none' && cs.visibility !== 'hidden' && h.getBoundingClientRect().height > 0; });
  const bad = []; let prev = 0; for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) bad.push(`${h.tagName} "${h.textContent.trim().slice(0, 30)}" after h${prev}`); prev = l; } return { n: hs.length, bad };
});
const SMALL24 = (page) => page.evaluate(() => {
  const out = []; for (const el of document.querySelectorAll('button, select, textarea, summary, input:not([type=hidden]), [role=tab], [role=menuitem], [role=menuitemcheckbox], [role=radio]')) {
    if (el.id === 'text-input') continue; /* the off-screen typing field */ let t = el; if (el.matches('input[type=checkbox], input[type=radio]')) t = el.closest('label') || el; const cs = getComputedStyle(t); if (cs.visibility === 'hidden' || cs.display === 'none' || t.closest('[hidden]')) continue;
    const r = t.getBoundingClientRect(); if (!r.width || !r.height) continue; if (Math.min(r.width, r.height) < 23.5) out.push(`${el.tagName.toLowerCase()}${el.type ? '[' + el.type + ']' : ''}${el.id ? '#' + el.id : ''} ${Math.round(r.width)}x${Math.round(r.height)} ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}`);
  } return out;
});

test('every control has an accessible name, in every panel, menu and overlay', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM);
  for (const [name, js] of STATES) { await page.evaluate(() => { UI.closePopover(false); if (app.designer) closeDesigner(); }); await page.evaluate(js); await page.waitForTimeout(120); assert.deepEqual(await UNNAMED(page), [], `controls without a name: ${name}`); }
  assert.deepEqual(errs, []); await context.close();
});

test('headings never skip a level, in every panel and overlay', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); let total = 0;
  for (const [name, js] of STATES) { await page.evaluate(() => { UI.closePopover(false); if (app.designer) closeDesigner(); }); await page.evaluate(js); await page.waitForTimeout(120); const h = await HEADINGS(page); total += h.n; assert.deepEqual(h.bad, [], `heading order: ${name}`); }
  assert.ok(total > 15, 'the check looked at ' + total + ' headings'); assert.deepEqual(errs, []); await context.close();
});

test('controls are at least 24 px on a desktop screen (WCAG 2.2), in every panel and overlay', { skip }, async () => {
  const { page, errs, context } = await open(CLASSROOM); const bad = [];
  for (const [name, js] of STATES) { await page.evaluate(() => { UI.closePopover(false); if (app.designer) closeDesigner(); }); await page.evaluate(js); await page.waitForTimeout(120); for (const b of await SMALL24(page)) bad.push(`${name}: ${b}`); }
  assert.deepEqual([...new Set(bad)], [], 'controls smaller than 24 px'); assert.deepEqual(errs, []); await context.close();
});

test('the Layers list is the keyboard way to the page: pick a thing, then Delete, the arrow keys and F2 work on it', { skip }, async () => {
  const { page, errs, context } = await open(`${CLASSROOM} addItem(TXT.make({ text: 'Label', size: 60 }, 300, 150)); select([]); setTab('tab-layers'); showFlyout();`);
  assert.match(await page.locator('#stage').getAttribute('aria-label'), /Layers/, 'the canvas says where the keyboard way is');
  const id = await page.evaluate(() => pg().items.find((i) => i.type === 'text').id);
  await page.focus(`#layers [data-layer="${id}"] .ln`); await page.keyboard.press('Enter'); assert.deepEqual(await page.evaluate(() => app.sel), [id], 'Enter on a row picks it'); assert.equal(await page.locator(`#layers [data-layer="${id}"] .ln`).getAttribute('aria-current'), 'true');
  const x0 = await page.evaluate((id) => itemById(id).x, id); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Shift+ArrowDown'); assert.equal(await page.evaluate((id) => itemById(id).x, id), x0 + 2, 'arrow keys move it');
  await page.keyboard.press('F2'); assert.equal(await page.evaluate(() => !!app.edit), true, 'F2 edits its words'); await page.keyboard.press('Escape'); await page.focus(`#layers [data-layer="${id}"] .ln`);
  await page.keyboard.press('Delete'); assert.equal(await page.evaluate((id) => !!itemById(id), id), false, 'Delete removes it');
  // the icon buttons in a row say which layer they are for
  const lab = await page.locator('#layers [data-layer] [data-vis]').first().getAttribute('aria-label'); assert.match(lab, /^(Hide|Show) .+/, lab);
  assert.deepEqual(errs, []); await context.close();
});

test.after(async () => { if (browser) await browser.close(); server.close(); });
