// Selection and item operations: add, delete, duplicate, group, lock, layer order, clipboard.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- selection & item ops ----------
function select(ids) { if (app.edit && !(ids.length === 1 && ids[0] === app.edit.id)) endEdit(); app.sel = ids; renderOverlay(); renderInspector(); renderLayers(); }
function addItem(it) {
  const items = pg().items; it.id = it.id || U.uid(); items.push(it); select([it.id]); renderStage(); commit();
}
function nextSpot() { const { pageW: W, pageH: H } = app.P.settings; const n = app.addCount++ % 6; return [W / 2 + (n - 2.5) * 40, H / 2 + (n % 3) * 20]; }
function addFigure(castId) {
  const c = castById(castId); const pr = poseOf(c, c.defaultPose || 'stand');
  const [x, y] = nextSpot();
  addItem({ type: 'figure', cast: castId, x, y: y + 20, s: 1, rot: 0, flip: false, mode: 'auto', pose: FIG.fromPreset(c, pr), expr: pr.expr || 'happy', look: 0, detach: {} });
}
function addProp(kind) {
  const def = PROP_BY_ID[kind]; const [x, y] = nextSpot(); const d = propDefaults(def);
  addItem({ type: 'prop', kind, x, y: y + 60, s: 1, rot: 0, flip: false, mode: 'auto', colors: d.colors, params: d.params });
}
function deleteSel() {
  if (!app.sel.length) return;
  const ids = app.sel.filter((id) => !itemById(id)?.locked);
  if (!ids.length) { toast('🔒 Locked — unlock it first to delete it'); return; }
  const kill = new Set(ids);
  for (const id of ids) { const it = itemById(id); if (it && it.type === 'figure') { const l = limbsOf(it); if (l) kill.add(l.id); } }
  pg().items = pg().items.filter((i) => !kill.has(i.id)); tidyGroups(); select([]); renderStage(); commit();
  if (ids.length < app.sel.length) toast('Locked items were kept');
}
function duplicateSel() {
  const page = pg(); const items = page.items; const newIds = [];
  // duplicating a whole group makes a new group; duplicating one member adds the copy to the same group
  const gmap = {}; const whole = (g) => groupMembers(g).every((i) => app.sel.includes(i.id));
  for (const id of app.sel) {
    const it = itemById(id); if (!it) continue; const cp = U.clone(it); cp.id = U.uid(); cp.x += 30; cp.y += 30; delete cp.locked;
    if (cp.group && whole(cp.group)) cp.group = gmap[cp.group] || (gmap[cp.group] = newGroup(page, groupName(it.group) + ' copy'));
    items.splice(items.indexOf(it) + 1, 0, cp); newIds.push(cp.id);
    if (it.type === 'figure') { const l = limbsOf(it); if (l) { const lc = { ...U.clone(l), id: U.uid(), of: cp.id }; items.splice(items.indexOf(l) + 1, 0, lc); } }
  }
  tidyGroups(); select(newIds); renderStage(); commit();
}
// ---------- group / lock ----------
function groupSel() {
  const items = movable(selItems()); if (items.length < 2) { toast('Select two or more things to group them'); return; }
  const page = pg(); const g = newGroup(page);
  for (const it of items) it.group = g; // grouping members of other groups merges them into this one
  tidyGroups(); select(items.map((i) => i.id)); renderStage(); commit();
  toast(`Grouped ${items.length} items — click any of them to pick up the group, double-click to pick just one`);
}
function ungroupSel() {
  const gs = new Set(selItems().map((i) => i.group).filter(Boolean)); if (!gs.size) { toast('Nothing grouped is selected'); return; }
  for (const it of pg().items) if (gs.has(it.group)) delete it.group;
  tidyGroups(); select(app.sel); commit(); toast(gs.size > 1 ? `Ungrouped ${gs.size} groups` : 'Ungrouped');
}
function leaveGroup(it) { delete it.group; tidyGroups(); select([it.id]); renderStage(); commit(); }
// locked = can't be selected on the page, moved, posed, changed or deleted; clicks go through it to what's behind.
// It stays selected after locking so you can see it worked; reach it again from the Layers tab.
function setLocked(items, on) {
  items = items.filter(Boolean); if (!items.length) return;
  for (const it of items) { const own = ownerOf(it) || it; if (on) own.locked = true; else delete own.locked; }
  renderAll(); commit();
}
function toggleLockSel() {
  const items = selItems(); if (!items.length) { toast('Select something to lock'); return; }
  const on = items.some((i) => !i.locked); setLocked(items, on);
  toast(on ? `🔒 Locked ${items.length === 1 ? itemName(items[0]) : items.length + ' items'} — unlock from the Layers tab` : '🔓 Unlocked');
}
function unlockAll() { const l = pg().items.filter((i) => i.locked); setLocked(l, false); toast(`🔓 Unlocked ${l.length} item${l.length === 1 ? '' : 's'} on this page`); }
// ---------- clipboard (works across pages and survives reloads) ----------
const CLIP_KEY = 'storysketch/clipboard';
function getClip() { if (app.clip) return app.clip; try { const c = JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); if (c && c.items) app.clip = c; } catch (e) { /* ignore */ } return app.clip; }
function copySel(cut = false) {
  const chosen = selItems(); if (!chosen.length) { toast('Select something to copy'); return; }
  const ids = new Set(withLimbs(chosen).map((i) => i.id));
  const items = pg().items.filter((i) => ids.has(i.id)); // keep layer order
  const castIds = new Set(items.filter((i) => i.type === 'figure').map((i) => i.cast));
  const groups = {}; for (const i of items) if (i.group) groups[i.group] = { name: groupName(i.group) };
  app.clip = { items: U.clone(items), cast: U.clone(app.P.cast.filter((c) => castIds.has(c.id))), groups, fromPage: pg().id, pastes: 0 };
  try { localStorage.setItem(CLIP_KEY, JSON.stringify(app.clip)); } catch (e) { /* ignore */ }
  const n = chosen.length; toast(`${cut ? 'Cut' : 'Copied'} ${n} item${n === 1 ? '' : 's'} — go to any page and press Ctrl+V`);
  if (cut) deleteSel(); else renderInspector();
}
function pasteInto(pageIdx = app.page, { quiet = false } = {}) {
  const clip = getClip(); if (!clip || !clip.items.length) { toast('Nothing copied yet — select items and press Ctrl+C'); return; }
  const page = app.P.pages[pageIdx];
  // characters copied from another project get added to this one
  for (const c of clip.cast || []) if (!castById(c.id)) app.P.cast.push(STORE.normalizeCast(U.clone(c)));
  // same size & position as the source; nudge only when pasting back onto the page it came from
  const same = clip.fromPage === page.id; const off = same ? 20 * (++clip.pastes) : 0;
  const map = {}; const fresh = U.clone(clip.items);
  for (const it of fresh) { map[it.id] = U.uid(); it.id = map[it.id]; if (it.type !== 'limbs') { it.x += off; it.y += off; } }
  for (const it of fresh) if (it.type === 'limbs') it.of = map[it.of];
  // pasted groups are new groups (a lone member pasted on its own is just an item)
  const gmap = {}; for (const it of fresh) if (it.group) it.group = gmap[it.group] || (gmap[it.group] = newGroup(page, clip.groups?.[it.group]?.name));
  page.items.push(...fresh); tidyGroups(page);
  try { localStorage.setItem(CLIP_KEY, JSON.stringify(clip)); } catch (e) { /* ignore */ }
  const owners = fresh.filter((i) => i.type !== 'limbs').map((i) => i.id);
  if (pageIdx === app.page) { app.sel = owners; renderAll(); } else renderFilmstrip();
  commit();
  if (!quiet) toast(pageIdx === app.page ? `Pasted ${owners.length} item${owners.length === 1 ? '' : 's'}` : `Copied ${owners.length} item${owners.length === 1 ? '' : 's'} to page ${pageIdx + 1}`);
}
function copyToPage(idx) { copySel(false); if (app.clip) pasteInto(idx); }

// move the picked entries of arr one step / to the end, keeping their order among themselves
function shiftZ(arr, picked, how) {
  const order = arr.filter(picked); const seq = how === 'up' || how === 'back' ? order.reverse() : order;
  for (const x of seq) {
    const i = arr.indexOf(x); arr.splice(i, 1);
    arr.splice(how === 'up' ? Math.min(arr.length, i + 1) : how === 'down' ? Math.max(0, i - 1) : how === 'front' ? arr.length : 0, 0, x);
  }
}
// groups move as one block; picking some (not all) members of one group moves them inside the group
function moveZ(ids, how) {
  const page = pg(); const want = new Set(ids); const units = zUnits(page.items);
  const picked = units.filter((u) => u.some((i) => want.has(i.id)));
  const g = picked.length === 1 && gOf(picked[0][0]);
  if (g && !groupMembers(g).every((i) => want.has(i.id))) shiftZ(picked[0], (i) => want.has(i.id), how);
  else shiftZ(units, (u) => picked.includes(u), how);
  page.items.splice(0, page.items.length, ...units.flat());
  renderStage(); renderLayers(); commit();
}
function setDetach(fig, limb, on) {
  fig.detach = { ...(fig.detach || {}), [limb]: on };
  const any = Object.values(fig.detach).some(Boolean); const items = pg().items; let l = limbsOf(fig);
  if (any && !l) { l = { id: U.uid(), type: 'limbs', of: fig.id }; items.splice(items.indexOf(fig) + 1, 0, l); }
  if (!any && l) items.splice(items.indexOf(l), 1);
  renderStage(); renderLayers(); commit();
}

// small preview of an add-on drawn into a 100×70 box (cached per add-on)
const addonThumbs = {};
function addonThumb(ad) {
  if (addonThumbs[ad.id]) return addonThumbs[ad.id];
  const pen = new Pen({ a: '#e53935', b: '#1e88e5', c: '#43a047' }); pen.rect(0, 0, 100, 70, { stroke: '#d8d2c8', w: 1.5, fill: 'paper' });
  try { ad.draw(pen, { x: 6, y: 6, w: 88, h: 58, cx: 50, cy: 35 }, { item: { id: 'thumb-' + ad.id }, seed: 'thumb-' + ad.id, rng: U.rng(U.hash(ad.id)), params: addonParams(ad, '', {}), propParams: {}, slot: '' }); } catch (e) { CP.runtimeError(ad, e); }
  return (addonThumbs[ad.id] = RENDER.thumb(pen.o, { pad: 2, box: { x0: 0, y0: 0, x1: 100, y1: 70, w: 100, h: 70 } }));
}
const suggestsPose = (c) => Object.keys(c.accessories || {}).some((id) => CP.accessories[id]?.suggestPose);
