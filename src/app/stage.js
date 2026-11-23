// Stage rendering: the page SVG, canvas zoom and pan, and the selection overlay (handles).
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- stage rendering ----------
// screen pixels per page unit
function zoom() { const m = $('#stage').getScreenCTM(); return m ? m.a : 1; }
// ---------- canvas zoom & pan (view only: never saved, never in undo) ----------
const ZMAX = 8;
app.view = { z: 1, cx: 0, cy: 0 };
function viewBox() {
  const { pageW: W, pageH: H } = app.P.settings; const v = app.view;
  v.z = U.clamp(v.z, 1, ZMAX); if (v.z === 1) { v.cx = W / 2; v.cy = H / 2; }
  v.cx = U.clamp(v.cx, 0, W); v.cy = U.clamp(v.cy, 0, H); // the page can't be pushed out of sight
  const w = (W + 2 * MARGIN) / v.z, h = (H + 2 * MARGIN) / v.z; return [v.cx - w / 2, v.cy - h / 2, w, h];
}
function applyView() {
  $('#stage').setAttribute('viewBox', viewBox().map((n) => +n.toFixed(2)).join(' '));
  const pct = $('#zoom-pct'); if (pct) pct.textContent = Math.round(app.view.z * 100) + '%';
  $('#stage-wrap')?.classList.toggle('zoomed', app.view.z > 1);
  positionMiniBar();
}
// zoom to z; with a pointer position, the spot under the pointer stays put
function zoomTo(z, at) {
  const before = at ? toPage(at) : null;
  app.view.z = U.clamp(z, 1, ZMAX); applyView();
  if (before) { const after = toPage(at); app.view.cx += before[0] - after[0]; app.view.cy += before[1] - after[1]; applyView(); }
  renderOverlay();
}
const zoomFit = () => zoomTo(1);
function zoomSel() {
  const items = selItems(); if (!items.length) { toast('Select something first, then zoom to it'); return; }
  const b = pageBBox(withLimbs(items)); const { pageW: W, pageH: H } = app.P.settings;
  app.view.z = U.clamp(Math.min((W + 2 * MARGIN) / (b.w * 1.3 + 40), (H + 2 * MARGIN) / (b.h * 1.3 + 40)), 1, ZMAX);
  app.view.cx = b.x + b.w / 2; app.view.cy = b.y + b.h / 2; applyView(); renderOverlay();
}
function onWheel(e) {
  // Ctrl+wheel (and a trackpad pinch, which Chrome reports as Ctrl+wheel) zooms; the wheel alone pans while zoomed in
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomTo(app.view.z * Math.exp(-U.clamp(e.deltaY, -100, 100) * 0.0025), e); return; }
  if (app.view.z <= 1) return;
  e.preventDefault(); const k = zoom();
  app.view.cx += (e.shiftKey ? e.deltaY : e.deltaX) / k; app.view.cy += (e.shiftKey ? 0 : e.deltaY) / k; applyView();
}
function renderStage() {
  const { pageW: W, pageH: H, paper } = app.P.settings; const svg = $('#stage');
  applyView();
  const hint = $('#empty-hint'); if (hint) hint.hidden = pg().items.length > 0;
  const items = pg().items.filter((it) => !it.hidden && !(ownerOf(it) || {}).hidden).map((it, i) => itemSVG(it, app.preview ? curStyle() : null, 's' + i + '_', true)).join('');
  const M = 20000; // shade everything off the page, however far you zoom or pan
  svg.innerHTML = `<rect x="0" y="0" width="${W}" height="${H}" fill="${paper}" class="page"/>` +
    `<g id="items">${items}</g>` +
    `<path d="M${-M} ${-M}H${W + M}V${H + M}H${-M}Z M0 0V${H}H${W}V0Z" fill-rule="evenodd" fill="#eceef2" fill-opacity="0.8" pointer-events="none"/>` +
    `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#c5cbd4" stroke-width="2" pointer-events="none"/>` +
    `<g id="overlay"></g><rect id="marquee" fill="rgba(37,99,235,0.08)" stroke="#2563eb" stroke-dasharray="5 4" visibility="hidden" pointer-events="none"/>`;
  renderOverlay();
}
function renderOverlay() {
  const ov = $('#overlay'); if (!ov) return; let s = '';
  const z = zoom();
  for (const id of app.sel) {
    const it = itemById(id); if (!it || it.hidden) continue;
    const b = localBBox(it); const k = 1 / (z * it.s);
    s += `<g transform="${xform(it)}" data-k="${k}"><rect x="${b.x0}" y="${b.y0}" width="${b.w}" height="${b.h}" fill="none" stroke="${it.locked ? '#9a948c' : '#2563eb'}" stroke-dasharray="${6 * k} ${4 * k}" stroke-width="${1.4 * k}"/>`;
    const editing = hasWords(it) && app.edit && app.edit.id === it.id;
    if (editing) s += textEditOverlay(it, k);
    if (app.sel.length === 1 && !it.locked && !editing) {
      const hs = 11 * k;
      if (isText(it)) { const my = (b.y0 + b.y1) / 2, tw = 9 * k, th = 22 * k; for (const [h, x] of [['tw-l', b.x0], ['tw-r', b.x1]]) s += `<rect data-h="${h}" x="${x - tw / 2}" y="${my - th / 2}" width="${tw}" height="${th}" rx="${3 * k}" fill="#fff" stroke="#2563eb" stroke-width="${1.5 * k}" class="h-width"/>`; }
      if (isFlat(it)) s += shapeHandles(it, k); // a shape resizes by its sides and corners, a line by its two ends
      if (!isFlat(it)) s += `<rect data-h="scale" x="${b.x1 - hs / 2}" y="${b.y1 - hs / 2}" width="${hs}" height="${hs}" fill="#fff" stroke="#2563eb" stroke-width="${1.6 * k}" class="h-scale"/>`;
      const cx = (b.x0 + b.x1) / 2, ty = b.y0 - 34 * k;
      if (!isLine(it)) s += `<line x1="${cx}" y1="${b.y0}" x2="${cx}" y2="${ty}" stroke="#2563eb" stroke-width="${1.2 * k}"/><circle data-h="rot" cx="${cx}" cy="${ty}" r="${7 * k}" fill="#fff" stroke="#2563eb" stroke-width="${1.6 * k}" class="h-rot"/>`;
      if (it.type === 'figure') {
        const c = castById(it.cast); if (c) {
          const r = 7 * k; // the rig says where its handles are and what colour they get
          for (const h of FIG.handles(c, it.pose)) s += `<circle data-h="${h.id}" cx="${h.p[0]}" cy="${h.p[1]}" r="${r}" fill="${h.color}" fill-opacity="0.85" stroke="#fff" stroke-width="${1.5 * k}" class="h-joint"/>`;
        }
      }
    }
    s += '</g>';
    if (it.locked) { const c = toPageXY(it, [b.x0, b.y0]); s += `<text x="${c[0]}" y="${c[1] - 6 / z}" font-size="${15 / z}" pointer-events="none">🔒</text>`; }
  }
  const group = selItems(); const k = 1 / z;
  // one item picked inside a group: show the rest of its group faintly
  if (group.length === 1 && group[0].group) {
    const m = groupMembers(group[0].group).filter((i) => !i.hidden);
    if (m.length > 1) { const gb = pageBBox(withLimbs(m)); s += `<rect x="${gb.x}" y="${gb.y}" width="${gb.w}" height="${gb.h}" fill="none" stroke="#7c3aed" stroke-opacity="0.45" stroke-dasharray="${3 * k} ${5 * k}" stroke-width="${1.3 * k}" pointer-events="none"/>`; }
  }
  if (group.length > 1) {
    const gb = pageBBox(withLimbs(group)); const hs = 12 * k; const cx = gb.x + gb.w / 2, ty = gb.y - 36 * k;
    s += `<rect x="${gb.x}" y="${gb.y}" width="${gb.w}" height="${gb.h}" fill="none" stroke="#7c3aed" stroke-width="${1.6 * k}"${selGroup() ? '' : ` stroke-dasharray="${8 * k} ${4 * k}"`}/>`;
    if (group.some((i) => !i.locked)) s += `<rect data-h="gscale" x="${gb.x + gb.w - hs / 2}" y="${gb.y + gb.h - hs / 2}" width="${hs}" height="${hs}" fill="#fff" stroke="#7c3aed" stroke-width="${1.8 * k}" class="h-scale"/>` +
      `<line x1="${cx}" y1="${gb.y}" x2="${cx}" y2="${ty}" stroke="#7c3aed" stroke-width="${1.3 * k}"/><circle data-h="grot" cx="${cx}" cy="${ty}" r="${7.5 * k}" fill="#fff" stroke="#7c3aed" stroke-width="${1.8 * k}" class="h-rot"/>`;
  }
  for (const g of app.guides || []) { const k1 = 1 / z; s += g.axis === 'x' ? `<line x1="${g.pos}" y1="${g.from - 12 * k1}" x2="${g.pos}" y2="${g.to + 12 * k1}" stroke="#e5389a" stroke-width="${1.3 * k1}" pointer-events="none"/>` : `<line x1="${g.from - 12 * k1}" y1="${g.pos}" x2="${g.to + 12 * k1}" y2="${g.pos}" stroke="#e5389a" stroke-width="${1.3 * k1}" pointer-events="none"/>`; }
  ov.innerHTML = s; addHalos(ov); positionMiniBar();
}
const movable = (items) => items.filter((it) => it && !it.locked);
const selItems = () => app.sel.map(itemById).filter((it) => it && !it.hidden);
function withLimbs(items) { const out = [...items]; for (const it of items) if (it.type === 'figure') { const l = limbsOf(it); if (l && !l.hidden) out.push(l); } return out; }
// everything whose outline box is under page point P, front first (hidden and locked things are skipped)
function itemsAt(P) {
  const items = pg().items; const top = {};
  items.forEach((it, i) => { const own = ownerOf(it) || it; top[own.id] = Math.max(top[own.id] ?? -1, i); });
  return items.filter((it) => {
    if (it.type === 'limbs' || it.hidden || it.locked) return false;
    const b = localBBox(it); const L = toLocal(it, P); const pad = 4 / it.s;
    return L[0] >= b.x0 - pad && L[0] <= b.x1 + pad && L[1] >= b.y0 - pad && L[1] <= b.y1 + pad;
  }).sort((a, b) => top[b.id] - top[a.id]);
}
// Alt+click: step through the things stacked under the pointer, front to back (ignores groups, like a double-click)
function cyclePick(P) {
  const hits = itemsAt(P); if (!hits.length) { select([]); return null; }
  const cur = app.sel.length === 1 ? hits.findIndex((i) => i.id === app.sel[0]) : -1;
  const it = hits[(cur + 1) % hits.length]; select([it.id]);
  toast(hits.length > 1 ? `${(cur + 1) % hits.length + 1} of ${hits.length} here: ${itemName(it)} — Alt+click again for the next one` : `${itemName(it)} (nothing else here)`);
  return it;
}
function marqueeHits(r) {
  const out = [];
  for (const it of pg().items) {
    if (it.type === 'limbs' || it.hidden || it.locked) continue;
    const b = pageBBox(withLimbs([it]));
    if (b.x < r.x + r.w && b.x + b.w > r.x && b.y < r.y + r.h && b.y + b.h > r.y) out.push(...expandGroup(it));
  }
  return [...new Set(out)];
}
function scheduleRender() { if (app.raf) return; app.raf = requestAnimationFrame(() => { app.raf = 0; renderStage(); }); }
