#!/usr/bin/env node
// Checks props against docs/PROP-STYLE-GUIDE.md and tells you what to fix.
//   node tools/check_props.mjs                  every prop (the new kits strictly, the older airport and classroom props only for the basics)
//   node tools/check_props.mjs home-            only props whose id or file path contains this text
//   node tools/check_props.mjs --sheet DIR      also write one SVG contact sheet per drawing style into DIR (open them in a browser)
//   node tools/check_props.mjs --file path.js   check one file (used by the tests and by the guide's example)
// Exit code 1 if anything fails. This is a lint, NOT a security sandbox: a prop's draw() is code and still needs a human to read it.
import fs from 'node:fs'; import path from 'node:path';
import { createApp, ROOT } from '../tests/helpers/sandbox.mjs';

const args = process.argv.slice(2); const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const sheetDir = flag('--sheet'); const only = flag('--file'); const filter = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--sheet' && args[i - 1] !== '--file') || '';
const STRICT_KITS = ['scenery', 'home', 'school', 'park']; // folders under plugins/props/ whose props follow every rule
const LIMITS = { page: [1000, 750], maxPrims: 90, maxPoints: 1500, slack: 12, strokeMin: 1, strokeMax: 12, floorTol: 12 };
const FORBIDDEN = /(?<![.\w$])(document|window|globalThis|self|fetch|XMLHttpRequest|eval|Function|setTimeout|setInterval|localStorage|sessionStorage|indexedDB|import|require|Date|performance)\b|\bMath\.random\b/; // a property called .window is fine; the global is not
const CATS = ['Furniture', 'Decoration', 'Nature', 'Buildings', 'Vehicles', 'Playground', 'Kitchen', 'Bedroom', 'Bathroom', 'Garden', 'Sports', 'Learning', 'Arts', 'Food', 'Toys', 'Signs', 'Scenery', 'School', 'Weather'];

const app = await createApp(); const { CP, RENDER, Pen } = app;
const before = new Map(Object.entries(CP.props));
if (only) app.run(fs.readFileSync(path.resolve(only), 'utf8'), path.resolve(only));
const problems = []; const bad = (d, m, strict = true) => problems.push({ id: d.id, file: d.file, m, strict });
const fileOf = (d) => String(d.file || '');
const strictFor = (d) => !!only || STRICT_KITS.some((k) => fileOf(d).includes(`props/${k}/`));

const props = Object.values(CP.props).filter((d) => (only ? before.get(d.id) !== d : (!filter || d.id.includes(filter) || fileOf(d).includes(filter))));
if (only && !props.length) { console.log(`FAIL  ${only} registered no prop`); process.exit(1); }
const finite = (svg) => !/NaN|undefined|Infinity/.test(svg);
const combos = (d) => { // every value of every select / toggle (one at a time, the others at their default), plus the defaults
  const base = {}; for (const p of d.params || []) base[p.key] = p.def; const out = [base];
  for (const p of d.params || []) { const vals = p.type === 'toggle' ? [true, false] : p.type === 'select' ? Object.keys(p.options || {}) : p.type === 'range' ? [p.min, p.max] : []; for (const v of vals) out.push({ ...base, [p.key]: v }); }
  return out;
};
const slotSetups = (d) => { const sets = [{ none: false }]; if ((d.slots || []).length) sets.push({ none: true }); return sets; };
const sheets = {}; // style -> [{ id, svg, w, h }]

for (const d of props) {
  const strict = strictFor(d); const here = (m, s = strict) => bad(d, m, s);
  // ---- fields ----
  if (!d.name) here('has no name', true); if (!d.pack) here('has no pack', strict); if (!d.cat) here('has no cat', strict);
  if (strict) {
    if (!/^(scenery|home|school|park)-[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id) && !only) here(`id "${d.id}" must be lowercase-kebab and start with its kit: scenery- home- school- park-`);
    if (only && !/^[a-z0-9]+(-[a-z0-9]+)+$/.test(d.id)) here(`id "${d.id}" must be lowercase-kebab with a prefix (for example "mysticgarden-bench")`);
    if (!Array.isArray(d.tags) || !d.tags.length) here('needs tags: a few words people might search for (couch for sofa)');
    if (d.cat && !CATS.includes(d.cat)) here(`cat "${d.cat}" is not one of: ${CATS.join(', ')}`);
    if (!d.colors || !d.colors.line) here('colors must declare a "line" slot');
    if (!d.version) here('needs a version');
    const src = d.draw.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""'); const hit = src.match(FORBIDDEN); if (hit) here(`draw() uses "${hit[0]}", which props may not use (randomness: U.rng(U.hash(item.id)))`);
    for (const p of d.params || []) { if (!('def' in p)) here(`param "${p.key}" has no def`); if (!p.label) here(`param "${p.key}" has no label`); }
    for (const sl of d.slots || []) if (!sl.kind || !sl.box || !('def' in sl)) here(`slot "${sl.key}" needs kind, box and def`);
  }
  const slotKinds = new Set(Object.values(CP.addons).map((a) => a.kind));
  for (const sl of d.slots || []) if (!slotKinds.has(sl.kind)) here(`slot "${sl.key}" asks for kind "${sl.kind}" but no add-on has that kind`, strict);
  // ---- drawing ----
  const declared = new Set(Object.keys(d.colors || {}));
  const all = combos(d);
  for (const P of all) for (const setup of slotSetups(d)) {
    const label = JSON.stringify(P) + (setup.none ? ' with empty slots' : '');
    const run = () => { const pen = new Pen(d.colors || {}); const full = { ...P }; if (setup.none) for (const sl of d.slots || []) full[sl.key] = 'none'; d.draw(pen, full, { id: 'check-1', kind: d.id }, { slot() {} }); return pen.o; };
    let a, b; try { a = run(); b = run(); } catch (e) { here(`draw() throws with ${label}: ${e.message}`, true); continue; }
    if (JSON.stringify(a) !== JSON.stringify(b)) here(`draws differently each time with ${label} (use U.rng(U.hash(item.id)) for randomness)`, true);
    const svg = RENDER.clean(a, { mode: 'colour', paper: '#fff' }); if (!finite(svg)) here(`draws NaN / undefined with ${label}`, true);
    for (const st of RENDER.styleList()) { const s2 = RENDER.render(a, { mode: 'colour', paper: '#fff', seed: 'c', idp: 'c', n: 0, style: st.id }); if (!finite(s2)) here(`style ${st.id} draws NaN / undefined with ${label}`, true); }
    if (!strict) continue;
    if (!a.length) here(`draws nothing with ${label}`);
    if (a.length > LIMITS.maxPrims) here(`${a.length} shapes with ${label}; keep it under ${LIMITS.maxPrims} (simple props: under 25)`);
    const pts = a.reduce((n, q) => n + q.pts.length + (q.more || []).reduce((m, c) => m + c.length, 0), 0); if (pts > LIMITS.maxPoints) here(`${pts} points with ${label}; keep it under ${LIMITS.maxPoints}`);
    const bb = RENDER.primsBBox(a); const w = bb.x1 - bb.x0, h = bb.y1 - bb.y0;
    if (w > LIMITS.page[0] + LIMITS.slack || h > LIMITS.page[1] + LIMITS.slack) here(`is ${Math.round(w)} x ${Math.round(h)} with ${label}; it must fit a 1000 x 750 page at scale 1`);
    if (strict && P === all[0] && !setup.none && w > 800 && !d.place && !d.floating) here('is page-wide (over 800 wide with its default settings) so it needs a place hint: place: { x: 0.5, y: 1, rank: 10, fit: { width: 1 } } (see the guide, section 3)');
    const floor = !(d.floating || /floating|sky|cloud|sun|moon|star|bird|kite|balloon/i.test(d.cat + ' ' + d.id + ' ' + (d.tags || []).join(' ')));
    if (floor && Math.abs(bb.y1) > LIMITS.floorTol && !d.floating) here(`bottom is at y=${Math.round(bb.y1)} with ${label}; a floor prop stands on y=0 with its bottom centre at x=0 (set floating: true for things that float, centred on 0,0)`);
    if (floor && Math.abs((bb.x0 + bb.x1) / 2) > Math.max(60, w * 0.35) && w < 600) here(`is not centred on x=0 (centre ${Math.round((bb.x0 + bb.x1) / 2)}) with ${label}`);
    for (const q of a) {
      if (q.stroke && !/^#[0-9a-f]{3,8}$/i.test(q.stroke) && q.stroke !== 'paper') here(`colour "${q.stroke}" is not a declared slot and not a #hex colour (declared: ${[...declared].join(', ') || 'none'}); a typo here silently draws nothing`);
      if (q.fill && q.fill !== 'paper' && !/^#[0-9a-f]{3,8}$/i.test(q.fill)) here(`fill "${q.fill}" is not a declared slot and not a #hex colour`);
      if (q.stroke && (q.w < LIMITS.strokeMin || q.w > LIMITS.strokeMax)) here(`line width ${q.w} is outside ${LIMITS.strokeMin}-${LIMITS.strokeMax} (outline 4.5, secondary 3-3.5, detail 2-2.5, fine 1.5)`);
      if (q.hatch && !/^#[0-9a-f]{3,8}$/i.test(q.hatch.color)) here(`hatch colour "${q.hatch.color}" is not a declared slot and not a #hex colour`);
    }
  }
  if (sheetDir) { const pen = new Pen(d.colors || {}); const P = {}; for (const p of d.params || []) P[p.key] = p.def; try { d.draw(pen, P, { id: 'sheet-' + d.id }, { slot() {} }); const bb = RENDER.primsBBox(pen.o); for (const st of ['clean', ...RENDER.styleList().map((s) => s.id)]) (sheets[st] ||= []).push({ id: d.id, prims: pen.o, bb }); } catch (e) { /* reported above */ } }
}

if (sheetDir) {
  fs.mkdirSync(sheetDir, { recursive: true }); const cell = 260, cols = 5;
  for (const [st, list] of Object.entries(sheets)) {
    const rows = Math.ceil(list.length / cols); let body = '';
    list.forEach((it, i) => {
      const cx = (i % cols) * cell + cell / 2, cy = Math.floor(i / cols) * cell; const w = it.bb.x1 - it.bb.x0, h = it.bb.y1 - it.bb.y0; const k = Math.min(1, (cell - 40) / Math.max(w, h, 1));
      const tx = cx - ((it.bb.x0 + it.bb.x1) / 2) * k, ty = cy + cell - 46 - it.bb.y1 * k; const ctx = { mode: 'colour', paper: '#ffffff', seed: 'sheet:' + it.id, idp: 's' + i + '_', n: 0, style: st === 'clean' ? undefined : st };
      const inner = st === 'clean' ? RENDER.clean(it.prims, ctx) : RENDER.render(it.prims, ctx);
      body += `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(3)})">${inner}</g><text x="${cx}" y="${cy + cell - 14}" font-family="sans-serif" font-size="14" text-anchor="middle" fill="#555">${it.id}</text>`;
    });
    fs.writeFileSync(path.join(sheetDir, `props-${st}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${cell * cols}" height="${cell * rows}" viewBox="0 0 ${cell * cols} ${cell * rows}"><defs>${RENDER.defs()}</defs><rect width="100%" height="100%" fill="${st === 'chalk' ? '#2b3a33' : '#fff'}"/>${body}</svg>`);
  }
  console.log(`contact sheets written to ${sheetDir}`);
}
// the same mistake for several param values is reported once, with how many times it happened
const group = (list) => { const seen = new Map(); for (const p of list) { const k = p.id + '|' + p.m.replace(/ with \{.*$/, '').replace(/ with empty slots$/, ''); const e = seen.get(k); if (e) e.n++; else seen.set(k, { ...p, n: 1 }); } return [...seen.values()]; };
const strictFails = group(problems.filter((p) => p.strict)), soft = group(problems.filter((p) => !p.strict));
for (const p of strictFails) console.log(`FAIL  ${p.id}  ${p.m}${p.n > 1 ? `  (and ${p.n - 1} more like it)` : ''}`);
for (const p of soft) console.log(`note  ${p.id}  ${p.m}  (older prop, not required)`);
const nStrict = props.filter(strictFor).length;
console.log(`${props.length} props checked (${nStrict} strictly, ${props.length - nStrict} basics only): ${strictFails.length} problem(s)`);
process.exit(strictFails.length ? 1 : 0);
