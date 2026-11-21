// Prop core: shared drawing helpers for prop plugins (CP.helpers) + rendering a prop item.
// The props themselves live in plugins/props/.
// (was: Prop library.) Each prop draws clean primitives in local coords.
// Floor props: origin = bottom centre (stands on y=0). Floating props: origin = centre.
// `colors` = editable colour slots; `params` = extra options shown in the inspector.

const PAL = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];

function heartPts(cx, cy, s) {
  const pts = []; for (let i = 0; i < 32; i++) { const t = i / 32 * Math.PI * 2; pts.push([cx + s * 16 * Math.pow(Math.sin(t), 3) / 16, cy - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16]); }
  return pts;
}
function starPts(cx, cy, r1, r2, n = 5) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = U.rad(-90 + i * 180 / n); const r = i % 2 ? r2 : r1; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return pts; }
function bumpy(cx, cy, rx, ry, bumps, depth, n = 90) { const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const r = 1 + depth * Math.abs(Math.sin(bumps * a / 2)); pts.push([cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)]); } return pts; }

function paintingOn(pen, kind, x, y, w, h, seed) {
  const cx = x + w / 2, cy = y + h / 2; const r = U.rng(U.hash(seed));
  if (kind === 'tree') {
    pen.line([[cx, y + h - 8], [cx, y + h * 0.42]], { stroke: '#7a4e2d', w: 5 });
    pen.line([[cx, y + h * 0.55], [cx - w * 0.15, y + h * 0.4]], { stroke: '#7a4e2d', w: 3.5 });
    pen.line([[cx, y + h * 0.5], [cx + w * 0.16, y + h * 0.36]], { stroke: '#7a4e2d', w: 3.5 });
    for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * w * 0.3; const c = PAL[i % 6]; pen.ell(cx + Math.cos(a) * d, y + h * 0.33 + Math.sin(a) * d * 0.8, 6, 9, { stroke: c, w: 2.5, hatch: c, hg: 3, halpha: 0.8 }, 12); }
    for (let i = 0; i < 9; i++) { const gx = x + 10 + i * (w - 20) / 8; pen.line([[gx, y + h - 6], [gx + 3, y + h - 18 - r() * 6]], { stroke: '#43a047', w: 2.5 }); }
  } else if (kind === 'heart') {
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pen.line([[cx + Math.cos(a) * w * 0.25, cy + Math.sin(a) * h * 0.3], [cx + Math.cos(a) * w * 0.4, cy + Math.sin(a) * h * 0.45]], { stroke: '#fbc02d', w: 3 }); }
    pen.poly(heartPts(cx, cy, Math.min(w, h) * 0.28), { stroke: '#e53935', w: 3.5, hatch: '#e53935', hg: 3.5, halpha: 0.9, smooth: true });
  } else if (kind === 'rainbow') {
    ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5'].forEach((c, i) => pen.arc(cx, y + h * 0.8, w * 0.38 - i * 6, h * 0.55 - i * 6, 180, 360, { stroke: c, w: 5 }));
  } else if (kind === 'sun') {
    pen.circ(cx, cy, Math.min(w, h) * 0.18, { stroke: '#fbc02d', w: 3.5, hatch: '#fbc02d', hg: 3, halpha: 0.9 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, rr = Math.min(w, h); pen.line([[cx + Math.cos(a) * rr * 0.25, cy + Math.sin(a) * rr * 0.25], [cx + Math.cos(a) * rr * 0.38, cy + Math.sin(a) * rr * 0.38]], { stroke: '#fbc02d', w: 3 }); }
  } else if (kind === 'scribble') {
    const pts = []; for (let i = 0; i < 26; i++) pts.push([x + 14 + r() * (w - 28), y + 14 + r() * (h - 28)]);
    pen.curve(pts, { stroke: PAL[Math.floor(r() * 6)], w: 3 });
  } else if (kind === 'family') {
    for (let i = 0; i < 3; i++) { const fx = x + w * (0.28 + i * 0.22), c = PAL[[0, 4, 3][i]]; pen.circ(fx, y + h * 0.35, 8, { stroke: c, w: 2.5 }); pen.line([[fx, y + h * 0.42], [fx, y + h * 0.66]], { stroke: c, w: 2.5 }); pen.line([[fx - 9, y + h * 0.5], [fx + 9, y + h * 0.5]], { stroke: c, w: 2.5 }); pen.line([[fx - 7, y + h * 0.85], [fx, y + h * 0.66], [fx + 7, y + h * 0.85]], { stroke: c, w: 2.5 }); }
  }
}

CP.helpers = { PAL, heartPts, starPts, bumpy, paintingOn };

// props are grouped as pack (e.g. "Classroom props") -> category (Arts, Learning, ...). Packs A-Z, "Other props" last;
// categories keep the order they were first registered in.
function propPacks() { return [...new Set(CP.propList.map((d) => d.pack))].sort((a, b) => (a === 'Other props') - (b === 'Other props') || a.localeCompare(b)); }
function propCats(pack) { return [...new Set(CP.propList.filter((d) => pack == null || d.pack === pack).map((d) => d.cat))]; }
// defaults for a prop's own options and for its slots (slot value = the chosen add-on's id)
function propDefaults(def) {
  const params = {};
  for (const pr of (def && def.params) || []) params[pr.key] = pr.def;
  for (const sl of (def && def.slots) || []) params[sl.key] = sl.def ?? 'none';
  return { colors: { ...((def && def.colors) || {}) }, params };
}
// an option with `when: { key: value | [values] }` only applies while the other option/slot has that value
function whenOk(opt, params) {
  if (!opt.when) return true;
  return Object.entries(opt.when).every(([k, v]) => (Array.isArray(v) ? v : [v]).includes(params[k]));
}
const EMPTY_SLOT = new Set([undefined, null, '', 'none', 'blank']);
// options belonging to the add-on in a slot are stored as "<slot>.<option>"; a plain "<option>" is read as a fallback (older files)
function addonParams(ad, slotKey, params) {
  const own = {}; for (const pr of ad.params || []) own[pr.key] = params[`${slotKey}.${pr.key}`] ?? params[pr.key] ?? pr.def;
  return own;
}
// draw the add-on chosen for one of a prop's slots into its box ([x, y, w, h] in prop coordinates)
function drawPropSlot(pen, def, item, params, key, boxOverride) {
  const slot = (def.slots || []).find((s) => s.key === key); if (!slot) return;
  const bb = boxOverride || slot.box; const [x, y, w, h] = Array.isArray(bb) ? bb : [bb.x, bb.y, bb.w, bb.h];
  const id = params[key]; if (EMPTY_SLOT.has(id)) return;
  const ad = CP.addons[id];
  if (!ad || ad.kind !== slot.kind) { pen.text('?', x + w / 2, y + h / 2 - 15, 30, { stroke: '#c62828' }); return; } // add-on missing
  try { ad.draw(pen, { x, y, w, h, cx: x + w / 2, cy: y + h / 2 }, { item, seed: item.id, rng: U.rng(U.hash(item.id + ':' + key)), params: addonParams(ad, key, params), propParams: params, slot: key }); }
  catch (e) { CP.runtimeError(ad, e); }
}
function propPrims(item) {
  const def = CP.props[item.kind];
  if (!def) { // plugin missing: dashed placeholder so the layout is kept
    const pen = new Pen({}); pen.rect(-60, -60, 120, 120, { stroke: '#c62828', w: 3 }); pen.text('?', 0, -30, 60, { stroke: '#c62828' }); return pen.o;
  }
  const pen = new Pen({ ...def.colors, ...(item.colors || {}) });
  const params = { ...propDefaults(def).params, ...(item.params || {}) };
  const x = { slot: (key, box) => drawPropSlot(pen, def, item, params, key, box) };
  try { def.draw(pen, params, item, x); } catch (e) { CP.runtimeError(def, e); }
  return pen.o;
}
