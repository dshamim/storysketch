// Touch and tablet support: touch mode (bigger targets, bigger handles), and — added in later steps — gestures, the bottom tool bar and keyboard-aware typing.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- touch mode ----------
// `html.touch` is on when the main pointer is a finger (coarse) or when the user switches it on (View ▸ Touch-friendly sizes, handy on a touch laptop).
const TOUCH_KEY = 'storysketch/touch'; // 'on' | 'off'; nothing stored = follow the device
const coarseQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : { matches: false };
function touchPref() { try { return localStorage.getItem(TOUCH_KEY) || 'auto'; } catch (e) { return 'auto'; } }
const touchUI = () => document.documentElement.classList.contains('touch');
function applyTouch() {
  const p = touchPref(); const on = p === 'on' || (p === 'auto' && coarseQuery.matches);
  const was = touchUI(); document.documentElement.classList.toggle('touch', on); if (was !== on && typeof onViewport === 'function') onViewport();
  const m = $('#menu-touch'); if (m) m.setAttribute('aria-checked', String(on));
  if (was !== on && app.P) { renderOverlay(); positionMiniBar(); }
}
function toggleTouch() { try { localStorage.setItem(TOUCH_KEY, touchUI() ? 'off' : 'on'); } catch (e) { /* ignore */ } applyTouch(); }

// A finger can not hit an 11 px handle. In touch mode every handle gets an invisible 44 px round "halo" behind it
// (same data-h, so it works exactly like the handle; data-halo marks it so tests and code can tell them apart).
const HALO_R = 22; // screen pixels
const SVGNS = 'http://www.w3.org/2000/svg';
function makeHalo(el, k) {
  const b = el.getBBox(); const halo = document.createElementNS(SVGNS, 'circle');
  halo.setAttribute('data-h', el.dataset.h); halo.setAttribute('data-halo', '1'); halo.setAttribute('class', el.getAttribute('class') || '');
  halo.setAttribute('cx', b.x + b.width / 2); halo.setAttribute('cy', b.y + b.height / 2); halo.setAttribute('r', HALO_R * k);
  halo.setAttribute('fill', '#fff'); halo.setAttribute('fill-opacity', '0.001');
  return halo;
}
// Two joints closer than 44 px have overlapping halos. For a finger or pen, the handle whose CENTRE is nearest to the touch wins, not the one drawn last.
function nearestHandle(e) {
  let best = null, bd = HALO_R * 1.05;
  for (const el of $$('#overlay [data-h]:not([data-halo])')) { const r = el.getBoundingClientRect(); const d = Math.hypot(e.clientX - (r.x + r.width / 2), e.clientY - (r.y + r.height / 2)); if (d < bd) { bd = d; best = el; } }
  return best;
}
function handleAt(e) { const t = e.target.closest ? e.target.closest('[data-h]') : null; if (!t || e.pointerType === 'mouse') return t; return nearestHandle(e) || t; }
function addHalos(ov) {
  if (!touchUI()) return;
  for (const g of $$('g', ov)) {
    const handles = [...g.children].filter((el) => el.dataset && el.dataset.h); if (!handles.length) continue;
    const k = +(g.dataset.k || 1 / zoom()); const first = handles[0];
    for (const el of handles) g.insertBefore(makeHalo(el, k), first); // all halos sit below every visible handle, so a halo never covers a neighbouring handle's centre
  }
  const direct = [...ov.children].filter((el) => el.dataset && el.dataset.h && !el.dataset.halo); // the handles of a multi-selection sit directly in the overlay
  if (direct.length) { const first = direct[0]; for (const el of direct) ov.insertBefore(makeHalo(el, 1 / zoom()), first); }
}
// ---------- layout: narrow windows and tablets ----------
//  up to 1100 px wide: Details slides over the page and the library starts folded away;
//  up to 900 px wide (a tablet held upright): the rail becomes a bottom tab bar and the library and Details are bottom sheets (only one open at a time).
const narrowQuery = window.matchMedia ? window.matchMedia('(max-width: 1100px)') : { matches: false };
const sheetQuery = window.matchMedia ? window.matchMedia('(max-width: 900px)') : { matches: false };
const narrowWindow = () => narrowQuery.matches;
const sheetLayout = () => sheetQuery.matches;
function syncSheets() { const w = $('#workspace'); if (w) w.classList.toggle('sheet-open', sheetLayout() && (flyoutOpen() || detailsOpen())); }
function onLayoutChange() {
  if (sheetLayout()) { if (flyoutOpen()) hideFlyout(false); if (detailsOpen()) hideDetails(false); }
  else { let f = null; try { f = localStorage.getItem(FLY_KEY); } catch (e) { /* ignore */ } if (f !== 'closed' && !(narrowWindow() && !f) && !flyoutOpen()) showFlyout(false); }
  syncSheets(); requestAnimationFrame(() => { renderOverlay(); positionMiniBar(); });
}

// ---------- the tool bar (touch mode): Select, Hand, Text, Shapes, Several ----------
function syncToolbar() {
  const bar = $('#toolbar'); if (!bar) return;
  const shapes = isDrawTool(app.tool) || (flyoutOpen() && app.tab === 'tab-shapes');
  const on = { select: !app.tool && !app.addMode && !shapes, hand: app.tool === 'hand', text: app.tool === 'text', shapes, several: !!app.addMode };
  for (const b of $$('[data-tool]', bar)) b.setAttribute('aria-pressed', String(!!on[b.dataset.tool]));
}
function onToolbar(e) {
  const b = e.target.closest('[data-tool]'); if (!b) return; const k = b.dataset.tool;
  if (k === 'select') { setTool(null); app.addMode = false; }
  else if (k === 'hand') setTool(app.tool === 'hand' ? null : 'hand');
  else if (k === 'text') setTool(app.tool === 'text' ? null : 'text');
  else if (k === 'several') { app.addMode = !app.addMode; toast(app.addMode ? 'Tap things to add them to the selection. Tap Select to stop.' : 'Selecting one thing at a time again'); }
  else if (k === 'shapes') { if (flyoutOpen() && app.tab === 'tab-shapes') hideFlyout(); else { setTab('tab-shapes'); showFlyout(); } }
  syncToolbar();
}
// ---------- typing with an on-screen keyboard ----------
// The keyboard covers the bottom of the screen. The page area is sized to the VISIBLE height (so the tab bar and tool bar stay above the keyboard),
// and the text being typed is panned into view whenever it would be hidden. A "Done typing" button replaces Esc.
function syncEditDone() { const b = $('#edit-done'); if (b) b.hidden = !(app.edit && touchUI()); }
function ensureEditVisible() {
  if (!app.edit) return; const it = itemById(app.edit.id); const g = it && document.querySelector(`#items [data-id="${it.id}"]`); if (!g) return;
  const area = $('#stage').getBoundingClientRect(); const r = g.getBoundingClientRect(); const pad = 16; const top = area.top + pad + (touchUI() ? 40 : 0), bottom = area.bottom - pad;
  let dy = 0, dx = 0;
  if (r.bottom > bottom) dy = Math.min(r.bottom - bottom, r.top - top); else if (r.top < top) dy = r.top - top; // a tall text: its top wins
  if (r.right > area.right - pad) dx = Math.min(r.right - (area.right - pad), r.left - (area.left + pad)); else if (r.left < area.left + pad) dx = r.left - (area.left + pad);
  if (!dx && !dy) return;
  app.view.cx += dx / zoom(); app.view.cy += dy / zoom(); applyView(); renderOverlay();
}
function onViewport() {
  const vv = window.visualViewport; const root = document.documentElement;
  if (vv && touchUI()) root.style.setProperty('--app-h', vv.height + 'px'); else root.style.removeProperty('--app-h');
  requestAnimationFrame(() => { renderOverlay(); positionMiniBar(); ensureEditVisible(); });
}
function initTouch() {
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', onViewport); window.visualViewport.addEventListener('scroll', onViewport); }
  if (coarseQuery.addEventListener) coarseQuery.addEventListener('change', applyTouch);
  if (sheetQuery.addEventListener) sheetQuery.addEventListener('change', onLayoutChange);
  if (narrowQuery.addEventListener) narrowQuery.addEventListener('change', onLayoutChange);
  applyTouch(); const bar = $('#toolbar'); if (bar) bar.addEventListener('click', onToolbar);
}

// ---------- gestures ----------
// One input model: Pointer Events for mouse, finger and pen. This wraps the handlers in pointer.js with what touch needs:
//  - each drag belongs to the finger (or mouse) that started it, so a second finger can not drive it;
//  - a second finger means "pinch / pan the page": the first finger's half-made drag is cancelled and reverted;
//  - a finger that wobbles a little is still a tap (6 px of slop); a still finger held down for half a second is a long-press;
//  - palm rejection: while a pen is down, or was a moment ago, touches are ignored.
const SLOP = 6, LONG_PRESS_MS = 550, PEN_QUIET_MS = 600;
const touches = new Map();           // pointerId -> [x, y] of the fingers on the page
const consumed = new Set();          // fingers that were part of a gesture (or palms): ignore them until they lift
let pinch = null, press = null, penDown = false, penUntil = 0;
const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// Stop a drag that has not been committed: put the page back as it was at the last snapshot (a drag that never moved only needs dropping).
function cancelDrag() {
  const d = app.drag; if (!d) return false; app.drag = null; app.guides = [];
  $('#marquee')?.setAttribute('visibility', 'hidden'); $('#stage').classList.remove('panning');
  const edits = !['pan', 'textsel', 'marquee', 'textbox'].includes(d.kind);
  if (edits && (d.moved || d.it)) {
    const P = STORE.revert();
    if (P) { const was = app.dirty; restore(P); setDirty(was); return true; } // a cancelled drag leaves no trace: not even the "unsaved" mark
    if (d.it) pg().items = pg().items.filter((i) => i !== d.it); // a shape being drawn is on the page before the first snapshot
    renderStage();
  } else renderOverlay();
  return true;
}
function endPress() { if (press) { clearTimeout(press.timer); press = null; } }
function pinchState() { const [a, b] = pinch.ids.map((id) => touches.get(id)); return { d: Math.max(10, near(a, b)), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] }; }
function startPinch() {
  const ids = [...touches.keys()].slice(0, 2); cancelDrag(); endPress(); if (app.edit) renderOverlay();
  for (const id of ids) consumed.add(id);
  pinch = { ids, ...{ d: 0, m: [0, 0] } }; Object.assign(pinch, pinchState());
}
function pinchMove() {
  const s = pinchState(); const f = s.d / pinch.d;
  zoomTo(app.view.z * f, { clientX: pinch.m[0], clientY: pinch.m[1] });          // the spot between the fingers stays put while zooming…
  app.view.cx -= (s.m[0] - pinch.m[0]) / zoom(); app.view.cy -= (s.m[1] - pinch.m[1]) / zoom(); // …and the page follows the fingers (two-finger pan)
  applyView(); renderOverlay(); pinch.d = s.d; pinch.m = s.m;
}
function firePress() { // long-press on something: select it and open its "More" menu (the touch version of a right-click)
  const p = press; press = null; const d = app.drag; if (!p || !d || d.pid !== p.id || d.moved || d.kind !== 'move' || !d.hit) return;
  cancelDrag(); consumed.add(p.id); try { navigator.vibrate?.(12); } catch (e) { /* ignore */ }
  const more = $('#minibar [data-mb="more"]'); if (more && !$('#minibar').hidden) UI.showPopover(more, $('#menu-more'), { placement: 'bottom-start' });
}
function onPointerDown(e) {
  if (e.pointerType === 'pen') {
    penDown = true; penUntil = Date.now() + PEN_QUIET_MS;
    if (touches.size || (app.drag && app.drag.pt === 'touch')) { cancelDrag(); endPress(); pinch = null; for (const id of touches.keys()) consumed.add(id); touches.clear(); } // the palm landed first: whatever it started is not wanted
  }
  if (e.pointerType === 'touch') {
    if (penDown || Date.now() < penUntil) { e.preventDefault(); consumed.add(e.pointerId); return; } // a palm resting while the pen draws
    if (e.isPrimary) { touches.clear(); pinch = null; endPress(); } // a primary touch is the first finger of a new gesture: forget any finger we still think is down
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size === 2 && !pinch) { e.preventDefault(); startPinch(); return; }
    if (touches.size > 2 || pinch) { e.preventDefault(); consumed.add(e.pointerId); return; }
  }
  flushCommit(); // a delayed edit (a shape, a text, a designer change) must be in the snapshot before this drag, or a cancelled drag would throw it away
  onDown(e);
  if (app.drag) { app.drag.pid = e.pointerId; app.drag.s = [e.clientX, e.clientY]; app.drag.pt = e.pointerType; if (/^(ik:|up:|rot|scale|gscale|grot|sh-|le-|tw-|torso|head)/.test(app.drag.kind)) hintDone('handles'); }
  if (e.pointerType === 'touch' && app.drag && app.drag.kind === 'move' && app.drag.hit) { endPress(); press = { id: e.pointerId, timer: setTimeout(firePress, LONG_PRESS_MS) }; }
}
function onPointerMove(e) {
  if (e.pointerType === 'pen') penUntil = Date.now() + PEN_QUIET_MS;
  if (e.pointerType === 'touch') {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pinch.ids.includes(e.pointerId)) { pinchMove(); return; }
    if (consumed.has(e.pointerId)) return;
  }
  const d = app.drag; if (d && d.pid != null && d.pid !== e.pointerId) return; // somebody else's drag
  if (d && d.pt === 'touch' && !d.moved && d.s && near(d.s, [e.clientX, e.clientY]) < SLOP) return; // still a tap
  if (press && d && d.moved !== false) endPress(); if (press && d && d.s && near(d.s, [e.clientX, e.clientY]) >= SLOP) endPress();
  onMove(e);
}
function liftFinger(e) {
  if (e.pointerType === 'pen') { penDown = false; penUntil = Date.now() + PEN_QUIET_MS; }
  if (e.pointerType !== 'touch') return false;
  touches.delete(e.pointerId); if (pinch && pinch.ids.includes(e.pointerId)) pinch = null;
  if (press && press.id === e.pointerId) endPress();
  if (consumed.has(e.pointerId)) { consumed.delete(e.pointerId); return true; }
  return false;
}
function onPointerUp(e) {
  if (liftFinger(e)) return;
  const d = app.drag; if (d && d.pid != null && d.pid !== e.pointerId) return;
  onUp(e);
}
function onPointerCancel(e) { // the browser took the touch away: nothing was meant, so undo whatever the drag did instead of committing it
  const owner = app.drag && app.drag.pid === e.pointerId; liftFinger(e); if (owner) cancelDrag();
}
