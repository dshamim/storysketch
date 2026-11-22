// Pointer interaction: selecting, moving, scaling, rotating and posing by dragging.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- pointer interaction ----------
function toPage(e) { const svg = $('#stage'); const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; }

function onDown(e) {
  // pan: middle button, or hold Space and drag
  if (e.button === 1 || (e.button === 0 && app.space)) {
    e.preventDefault(); app.drag = { kind: 'pan', c0: [e.clientX, e.clientY], v0: [app.view.cx, app.view.cy], k: zoom() };
    $('#stage').setPointerCapture(e.pointerId); $('#stage').classList.add('panning'); return;
  }
  if (e.button !== 0) return;
  // editing a text: a click or drag inside it moves the caret / selects letters; a click elsewhere finishes editing
  if (app.edit) {
    if (overTextBeingEdited(e) && !e.target.closest('[data-h]')) {
      e.preventDefault(); const ta = textField(); const i = textCaretAt(e); ta.focus({ preventScroll: true });
      if (e.shiftKey) { const a = ta.selectionDirection === 'backward' ? ta.selectionEnd : ta.selectionStart; ta.setSelectionRange(Math.min(a, i), Math.max(a, i)); } else ta.setSelectionRange(i, i);
      app.drag = { kind: 'textsel', from: e.shiftKey ? ta.selectionStart : i, moved: false }; $('#stage').setPointerCapture(e.pointerId); renderOverlay(); return;
    }
    endEdit();
  }
  // Text tool: click for a text that grows as you type, drag for a box that wraps; clicking existing text edits it
  if (app.tool === 'text' && !app.space) {
    const P0 = toPage(e); const g = e.target.closest('#items [data-id]'); const hit = g && itemById(g.dataset.id);
    if (isText(hit) && !hit.locked) { setTool(null); select([hit.id]); startEdit(hit.id, { caret: TXT.indexAt(TXT.layout(hit), ...toLocal(hit, P0)) }); return; }
    app.drag = { kind: 'textbox', P0, moved: false }; $('#stage').setPointerCapture(e.pointerId); return;
  }
  const P = toPage(e); const h = e.target.closest('[data-h]');
  const add = e.shiftKey || e.ctrlKey || e.metaKey;
  // Alt+click cycles through stacked items (but Alt on a pose dot still means its usual thing)
  if (e.altKey && !add && !(h && app.sel.length === 1 && !h.dataset.h.startsWith('g') && !['scale', 'rot'].includes(h.dataset.h))) {
    const it = cyclePick(P); app.lastClick = null;
    if (it && !it.locked) { app.drag = { kind: 'move', P0: P, starts: [[it, it.x, it.y]], moved: false }; $('#stage').setPointerCapture(e.pointerId); }
    return;
  }
  if (h && (h.dataset.h === 'gscale' || h.dataset.h === 'grot') && app.sel.length > 1) {
    const items = selItems(); const gb = pageBBox(withLimbs(items));
    app.drag = { kind: h.dataset.h, P0: P, anchor: [gb.x, gb.y], center: [gb.x + gb.w / 2, gb.y + gb.h / 2], starts: movable(items).map((it) => [it, it.x, it.y, it.s, it.rot || 0]), moved: false };
  } else if (h && app.sel.length === 1) {
    const it = itemById(app.sel[0]); const kind = h.dataset.h;
    // double-press an elbow/knee = bend it the other way (pointer capture swallows real dblclick events)
    const now = Date.now();
    if (kind.startsWith('up:') && app.lastPress && app.lastPress.kind === kind && now - app.lastPress.t < 400) {
      app.lastPress = null; FIG.flipBend(castById(it.cast), it.pose, kind.slice(3)); renderStage(); commit(); return;
    }
    app.lastPress = { kind, t: now };
    app.drag = { kind, it, P0: P, s0: it.s, rot0: it.rot || 0, moved: false };
    if (kind.startsWith('tw-')) { // dragging a side of a text box: the opposite top corner stays where it is
      const L = TXT.layout(it); const dir = kind === 'tw-r' ? 1 : -1; const flip = it.flip ? -1 : 1; const a = U.rad(it.rot || 0);
      app.drag.A = toPageXY(it, [dir > 0 ? L.x0 : L.x0 + L.W, L.y0]); app.drag.axis = [Math.cos(a) * flip * dir, Math.sin(a) * flip * dir];
    }
    if (kind.startsWith('ik:')) { const c = castById(it.cast); const J = FIG.joints(c, it.pose); app.drag.bend = FIG.bendOf(c, J, kind.slice(3)); }
  } else {
    const g = e.target.closest('#items [data-id]');
    if (g) {
      let it = itemById(g.dataset.id); it = ownerOf(it) || it;
      if (it.locked) { select([]); return; }
      // a group member picks up the whole group; double-click (see onUp) or click another member while one is picked = just that item
      const inside = !!it.group && app.sel.length === 1 && itemById(app.sel[0])?.group === it.group;
      const target = inside ? [it.id] : expandGroup(it);
      const has = target.every((id) => app.sel.includes(id));
      if (add) { select(has ? app.sel.filter((x) => !target.includes(x)) : [...new Set([...app.sel, ...target])]); if (has) return; }
      else if (inside || !has) select(target);
      app.drag = { kind: 'move', P0: P, starts: movable(app.sel.map(itemById)).map((x) => [x, x.x, x.y]), moved: false, hit: it.id };
    } else {
      // empty space: drag-select (Ctrl/Shift adds to the selection)
      const base = add ? [...app.sel] : []; if (!add) select([]);
      app.drag = { kind: 'marquee', P0: P, base, moved: false };
    }
  }
  if (app.drag) $('#stage').setPointerCapture(e.pointerId);
}
function onMove(e) {
  const d = app.drag; if (!d) return;
  if (d.kind === 'pan') { app.view.cx = d.v0[0] - (e.clientX - d.c0[0]) / d.k; app.view.cy = d.v0[1] - (e.clientY - d.c0[1]) / d.k; applyView(); return; }
  const P = toPage(e); d.moved = true;
  if (d.kind === 'textsel') { const i = textCaretAt(e); const ta = textField(); ta.setSelectionRange(Math.min(d.from, i), Math.max(d.from, i), i < d.from ? 'backward' : 'forward'); renderOverlay(); return; }
  if (d.kind === 'textbox') {
    const r = { x: Math.min(P[0], d.P0[0]), y: Math.min(P[1], d.P0[1]), w: Math.abs(P[0] - d.P0[0]), h: Math.abs(P[1] - d.P0[1]) };
    d.last = r; const m = $('#marquee'); for (const k of ['x', 'y']) m.setAttribute(k, r[k]); m.setAttribute('width', r.w); m.setAttribute('height', r.h); m.setAttribute('visibility', 'visible'); m.setAttribute('stroke-width', 1.2 / zoom()); return;
  }
  if (d.kind.startsWith('tw-')) { // new width = distance along the box's own direction; the box re-wraps as it changes
    const it = d.it; const v = [P[0] - d.A[0], P[1] - d.A[1]]; const w = Math.round(TXT.clampTo('w', (v[0] * d.axis[0] + v[1] * d.axis[1]) / it.s));
    it.w = w; const L = TXT.layout(it); const down = [-Math.sin(U.rad(it.rot || 0)), Math.cos(U.rad(it.rot || 0))];
    it.x = Math.round(d.A[0] + d.axis[0] * w * it.s / 2 + down[0] * L.H * it.s / 2); it.y = Math.round(d.A[1] + d.axis[1] * w * it.s / 2 + down[1] * L.H * it.s / 2); scheduleRender(); return;
  }
  if (d.kind === 'marquee') {
    const r = { x: Math.min(P[0], d.P0[0]), y: Math.min(P[1], d.P0[1]), w: Math.abs(P[0] - d.P0[0]), h: Math.abs(P[1] - d.P0[1]) };
    const m = $('#marquee'); for (const k of ['x', 'y']) m.setAttribute(k, r[k]); m.setAttribute('width', r.w); m.setAttribute('height', r.h); m.setAttribute('visibility', 'visible');
    m.setAttribute('stroke-width', 1.2 / zoom());
    app.sel = [...new Set([...d.base, ...marqueeHits(r)])]; renderOverlay(); return;
  }
  if (d.kind === 'gscale') {
    const [ax, ay] = d.anchor; const k = U.clamp(U.len([P[0] - ax, P[1] - ay]) / Math.max(1, U.len([d.P0[0] - ax, d.P0[1] - ay])), 0.05, 20);
    for (const [it, x0, y0, s0] of d.starts) { it.x = Math.round(ax + (x0 - ax) * k); it.y = Math.round(ay + (y0 - ay) * k); it.s = U.clamp(+(s0 * k).toFixed(3), 0.05, 12); }
  } else if (d.kind === 'grot') {
    const c = d.center; let da = U.angleOf(U.sub(P, c)) - U.angleOf(U.sub(d.P0, c)); if (e.shiftKey) da = Math.round(da / 15) * 15;
    const ca = Math.cos(U.rad(da)), sa = Math.sin(U.rad(da));
    for (const [it, x0, y0, , r0] of d.starts) { const dx = x0 - c[0], dy = y0 - c[1]; it.x = Math.round(c[0] + dx * ca - dy * sa); it.y = Math.round(c[1] + dx * sa + dy * ca); it.rot = Math.round(U.normA(r0 + da)); }
  } else if (d.kind === 'move') {
    let dx = P[0] - d.P0[0], dy = P[1] - d.P0[1];
    const sn = app.snap && !e.altKey && d.starts.length ? snapMove(d, dx, dy) : null; // hold Alt to move freely
    if (sn) { dx += sn.dx; dy += sn.dy; } app.guides = sn && sn.guides.length ? sn.guides : null;
    for (const [it, x0, y0] of d.starts) { it.x = Math.round(x0 + dx); it.y = Math.round(y0 + dy); }
  }
  else if (d.kind === 'scale') { const it = d.it; const r0 = U.len([d.P0[0] - it.x, d.P0[1] - it.y]), r1 = U.len([P[0] - it.x, P[1] - it.y]); it.s = U.clamp(+(d.s0 * r1 / Math.max(r0, 1)).toFixed(3), 0.1, 8); }
  else if (d.kind === 'rot') { const it = d.it; const box = localBBox(it); const c = toPageXY(it, [(box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2]); let a = d.rot0 + U.angleOf(U.sub(P, c)) - U.angleOf(U.sub(d.P0, c)); if (e.shiftKey) a = Math.round(a / 15) * 15; it.rot = Math.round(U.normA(a)); }
  else {
    const it = d.it; const c = castById(it.cast); const L = toLocal(it, P);
    const rotate = (app.handMode === 'rotate') !== e.shiftKey; // Shift temporarily switches mode
    FIG.edit(c, it.pose, d.kind, L, { rotate, bend: e.altKey ? -d.bend : d.bend });
  }
  scheduleRender();
}
function onUp() {
  const d = app.drag; app.drag = null; if (!d) return;
  if (app.guides) { app.guides = null; renderOverlay(); }
  if (d.kind === 'pan') { $('#stage').classList.remove('panning'); return; }
  if (d.kind === 'textsel') return;
  if (d.kind === 'textbox') {
    $('#marquee')?.setAttribute('visibility', 'hidden'); const P = d.P1 || d.P0; setTool(null);
    const r = d.last || { x: d.P0[0], y: d.P0[1], w: 0 }; addTextBox(r.x, r.y, r.w > 24 ? Math.round(r.w) : 0); return;
  }
  if (d.kind === 'marquee') { $('#marquee')?.setAttribute('visibility', 'hidden'); select(app.sel); return; }
  if (d.moved) { commit(); renderInspector(); app.lastClick = null; return; }
  // double-click on a group member (two clicks without dragging) = pick just that item
  if (d.kind === 'move' && d.hit) {
    const now = Date.now(); const it = itemById(d.hit);
    if (it?.group && app.lastClick?.id === d.hit && now - app.lastClick.t < 450) { app.lastClick = null; select([d.hit]); return; }
    // double-click anything else = open its details
    if (!it?.group && app.lastClick?.id === d.hit && now - app.lastClick.t < 450) { app.lastClick = null; if (isText(it)) startEdit(it.id, { caret: TXT.indexAt(TXT.layout(it), ...toLocal(it, d.P0)) }); else showDetails(); return; }
    app.lastClick = { id: d.hit, t: now };
  }
}

// Snapping: while moving, the selection's edges and centre are pulled onto the page's and the other items' edges and centres (6 screen pixels away at most).
function snapMove(d, dx, dy) {
  if (!d.box0) {
    const moving = new Set(d.starts.map((s) => s[0].id)); d.box0 = boxOfItems(d.starts.map((s) => s[0]));
    const { pageW: W, pageH: H } = app.P.settings;
    d.targets = [{ x: 0, y: 0, w: W, h: H }, ...pg().items.filter((it) => it.type !== 'limbs' && !it.hidden && !moving.has(it.id)).map((it) => boxOfItems([it]))];
  }
  const b = d.box0;
  return ARR.snap({ x: b.x + dx, y: b.y + dy, w: b.w, h: b.h }, d.targets, 6 / zoom());
}
