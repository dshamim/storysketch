// Arranging the selection: line up, space evenly, layer order. The maths is in src/core/arrange.js (ARR).
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- arrange ----------
const ARRANGE_ACTS = [...ARR.MODES.map((m) => 'align-' + m), ...ARR.MODES.map((m) => 'align-page-' + m), 'dist-h', 'dist-v'];
const boxOfItems = (items) => pageBBox(withLimbs(items)); // a character's front limbs count as part of it
// what moves: one unit per picked item, or the whole group as one unit when exactly a group is picked (locked items stay put)
function arrangeUnits() {
  const ed = movable(selItems()).filter((it) => it.type !== 'limbs');
  if (selGroup()) return ed.length ? [{ items: ed, box: boxOfItems(ed) }] : [];
  return ed.map((it) => ({ items: [it], box: boxOfItems([it]) }));
}
function moveUnits(units, deltas) {
  units.forEach((u, i) => { const { dx, dy } = deltas[i]; if (!dx && !dy) return; for (const it of u.items) { it.x = Math.round(it.x + dx); it.y = Math.round(it.y + dy); } });
  renderStage(); renderInspector(); commit();
}
function alignSel(mode, toPage) {
  const units = arrangeUnits(); if (!units.length) return toast(app.sel.length ? '🔒 Locked — unlock first' : 'Select something first');
  if (!toPage && units.length < 2) return toast('Select two or more things to line them up with each other');
  const { pageW: W, pageH: H } = app.P.settings;
  moveUnits(units, ARR.align(units.map((u) => u.box), mode, toPage ? { x: 0, y: 0, w: W, h: H } : undefined));
}
function distributeSel(axis) {
  const units = arrangeUnits(); if (units.length < 3) return toast('Select three or more things to space them evenly');
  moveUnits(units, ARR.distribute(units.map((u) => u.box), axis));
}
// 'align-left', 'align-page-hcenter', 'dist-h' … → true when it was one of these
function arrangeAction(a) {
  if (!ARRANGE_ACTS.includes(a)) return false;
  if (a.startsWith('dist-')) distributeSel(a.slice(5)); else if (a.startsWith('align-page-')) alignSel(a.slice(11), true); else alignSel(a.slice(6), false);
  return true;
}
