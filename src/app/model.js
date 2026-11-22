// App state and model helpers: the `app` object, lookups by id, groups, drawing-style and pose helpers, item helpers.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const MARGIN = 110;

const app = { tool: null, edit: null, handMode: 'reach', tab: 'tab-cast', dtab: 'look', snap: true, guides: null, filters: {}, P: null, page: 0, sel: [], preview: false, drag: null, raf: 0, designerCast: null, designerPose: 'stand', designerCrayon: true, addCount: 0 };

// ---------- model helpers ----------
const castById = (id) => app.P.cast.find((c) => c.id === id);
const pg = () => app.P.pages[app.page];
const itemById = (id) => pg().items.find((i) => i.id === id);
const ownerOf = (it) => (it && it.type === 'limbs' ? itemById(it.of) : it);
const limbsOf = (fig) => pg().items.find((i) => i.type === 'limbs' && i.of === fig.id);

// ---------- groups ----------
// A group is a tag on the items (`group: 'g…'`), never on detached limbs (they follow their figure). Names live in
// page.groups = { [gid]: { name } }. Members are kept next to each other in the layer order.
const gOf = (it) => (ownerOf(it) || it || {}).group || null;
const groupMembers = (g, page = pg()) => page.items.filter((i) => i.type !== 'limbs' && i.group === g);
const groupName = (g, page = pg()) => page.groups?.[g]?.name || 'Group';
// clicking one member picks up the group (its locked or hidden members stay put)
const expandGroup = (it) => (it.group ? groupMembers(it.group).filter((i) => !i.locked && !i.hidden).map((i) => i.id) : [it.id]);
function selGroup() { // the group id when the selection is exactly one whole group
  if (app.sel.length < 2) return null; const g = itemById(app.sel[0])?.group; if (!g) return null;
  const m = groupMembers(g); return m.length === app.sel.length && m.every((i) => app.sel.includes(i.id)) ? g : null;
}
function newGroup(page, name) {
  const g = 'g' + U.uid(); page.groups = page.groups || {};
  page.groups[g] = { name: name || `Group ${Object.keys(page.groups).length + 1}` }; return g;
}
// layer order as units, bottom → top: a group (with its figures' detached limbs) is one unit, placed at its frontmost member
function zUnits(items) {
  const byId = new Map(items.map((i) => [i.id, i])); const out = []; const seen = new Map();
  for (let k = items.length - 1; k >= 0; k--) {
    const it = items[k]; const own = it.type === 'limbs' ? byId.get(it.of) : it; const g = own && own.group;
    if (!g) { out.push([it]); continue; }
    if (seen.has(g)) seen.get(g).unshift(it); else { const u = [it]; seen.set(g, u); out.push(u); }
  }
  return out.reverse();
}
// drop groups left with fewer than 2 members, forget unused names, keep members together in the layer order
function tidyGroups(page = pg()) {
  const n = {}; for (const i of page.items) if (i.type !== 'limbs' && i.group) n[i.group] = (n[i.group] || 0) + 1;
  for (const i of page.items) if (i.group && !(n[i.group] >= 2)) delete i.group;
  if (page.groups) { for (const g of Object.keys(page.groups)) if (!(n[g] >= 2)) delete page.groups[g]; if (!Object.keys(page.groups).length) delete page.groups; }
  const flat = zUnits(page.items).flat(); page.items.splice(0, page.items.length, ...flat);
}

function itemPrims(it) {
  if (it.type === 'text') return TXT.prims(it);
  if (it.type === 'figure') { const c = castById(it.cast); return c ? FIG.prims(c, it, 'main') : []; }
  if (it.type === 'limbs') { const o = itemById(it.of); const c = o && castById(o.cast); return c ? FIG.prims(c, o, 'limbs') : []; }
  return propPrims(it);
}
function xform(it) { const t = ownerOf(it) || it; return `translate(${t.x} ${t.y}) rotate(${t.rot || 0}) scale(${(t.flip ? -1 : 1) * t.s} ${t.s})`; }
function itemName(it) {
  if (it.type === 'text') { const t = String(it.text || '').replace(/\s+/g, ' ').trim(); return t ? `“${t.length > 28 ? t.slice(0, 27) + '…' : t}”` : '(empty text)'; }
  if (it.type === 'figure') return castById(it.cast)?.name || '(missing character)';
  if (it.type === 'limbs') { const o = itemById(it.of); return `${o ? castById(o.cast)?.name : '?'} · front limbs`; }
  return PROP_BY_ID[it.kind]?.name || it.kind;
}
// ---- drawing style (project setting; the editor shows clean lines until Preview is on) ----
// Falls back to Crayon, then to clean lines, if the project's style plugin isn't installed.
const curStyle = () => { const id = app.P.settings.style; return RENDER.styles[id] ? id : RENDER.styles.crayon ? 'crayon' : (RENDER.styleList()[0] || {}).id || null; };
// ---- poses belong to a rig (a four-legged character has its own presets) ----
const posesFor = (c) => FIG.posesFor(c);
const poseOf = (c, id) => { const ps = posesFor(c); return ps.find((p) => p.id === id) || ps.find((p) => p.id === c.defaultPose) || ps[0]; };
// hit = on the editing canvas: text also gets an invisible box, so a click between the letters still picks it up
function itemSVG(it, style, idp, hit) {
  const owner = ownerOf(it) || it;
  const ctx = { mode: owner.mode || 'auto', paper: app.P.settings.paper, seed: it.type === 'limbs' ? it.of + ':limbs' : it.id, idp, n: 0, style: style || null };
  const prims = itemPrims(it);
  const cls = owner.locked ? ' class="locked"' : '';
  const area = hit && it.type === 'text' ? (() => { const b = TXT.box(it); return `<rect x="${b.x0}" y="${b.y0}" width="${b.w}" height="${b.h}" fill="#000" fill-opacity="0"/>`; })() : '';
  return `<g data-id="${it.id}"${cls} transform="${xform(it)}">${area}${RENDER.render(prims, ctx)}</g>`;
}
function toLocal(it, P) {
  const d = [P[0] - it.x, P[1] - it.y]; const a = U.rad(-(it.rot || 0));
  let x = (d[0] * Math.cos(a) - d[1] * Math.sin(a)) / it.s; const y = (d[0] * Math.sin(a) + d[1] * Math.cos(a)) / it.s;
  if (it.flip) x = -x; return [x, y];
}
function toPageXY(it, L) {
  const x = (it.flip ? -L[0] : L[0]) * it.s, y = L[1] * it.s; const a = U.rad(it.rot || 0);
  return [it.x + x * Math.cos(a) - y * Math.sin(a), it.y + x * Math.sin(a) + y * Math.cos(a)];
}
// the box around an item in its own units: the layout box for text, otherwise the outline of its drawing
const itemBox = (it) => (it.type === 'text' ? TXT.box(it) : RENDER.primsBBox(itemPrims(it)));
function localBBox(it) {
  if (it.type === 'text') return TXT.box(it);
  let prims = itemPrims(it);
  if (it.type === 'figure') { const c = castById(it.cast); if (c) prims = prims.concat(FIG.prims(c, it, 'limbs')); }
  return RENDER.primsBBox(prims);
}
function pageBBox(items) {
  const pts = [];
  for (const it of items) { const o = ownerOf(it) || it; const b = itemBox(it); for (const c of [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]]) pts.push(toPageXY(o, c)); }
  const b = U.bbox(pts); return { x: b.x0, y: b.y0, w: b.w, h: b.h };
}
