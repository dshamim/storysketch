// Left panel: characters and props library, search, pages tab and the Layers list.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- left panel ----------
function figureThumb(c, presetId = c.defaultPose || 'stand', styled = false, expr) {
  const pr = poseOf(c, presetId);
  const inst = { pose: FIG.fromPreset(c, pr), expr: expr || pr.expr || 'happy', look: 0, detach: {} };
  return RENDER.thumb(FIG.prims(c, inst, 'main'), { style: styled ? curStyle() : null, seed: c.id, paper: app.P.settings.paper });
}
// quick-search: every word typed must appear somewhere in the item's text
const matches = (tab, ...texts) => { const q = (app.filters[tab] || '').trim().toLowerCase(); if (!q) return true; const hay = texts.join(' ').toLowerCase(); return q.split(/\s+/).every((w) => hay.includes(w)); };
const noMatch = (tab) => `<p class="nomatch">No matches for “${U.esc(app.filters[tab])}”.</p>`;
// which prop packs are folded shut in the Props tab (remembered in this browser)
const PACKS_KEY = 'storysketch/collapsed-packs';
function collapsedPacks() { try { return JSON.parse(localStorage.getItem(PACKS_KEY) || '[]'); } catch (e) { return []; } }
function rememberPack(pack, open) {
  if ((app.filters['tab-props'] || '').trim()) return; // searching opens everything; don't save that
  const set = new Set(collapsedPacks()); if (open) set.delete(pack); else set.add(pack);
  try { localStorage.setItem(PACKS_KEY, JSON.stringify([...set])); } catch (e) { /* ignore */ }
}
function renderLibrary() {
  const cast = app.P.cast.filter((c) => matches('tab-cast', c.name, c.hair, c.body));
  $('#cast-grid').innerHTML = cast.map((c) => `<button class="tile" data-add-cast="${c.id}" title="Add ${U.esc(c.name)} to page">${figureThumb(c)}<span>${U.esc(c.name)}</span></button>`).join('');
  // characters installed as plugins but not in this book yet
  const have = new Set(app.P.cast.map((c) => c.id));
  const lib = CP.characters.filter((c) => !have.has(c.id) && matches('tab-cast', c.name, c.hair, c.body));
  $('#lib-section').innerHTML = (lib.length ? `<h3 class="sh">Library <small class="muted">(not in this book yet — click to add)</small></h3><div class="grid">` + lib.map((c) => { const n = STORE.normalizeCast(U.clone(c)); return `<button class="tile" data-add-lib="${c.id}" title="Add ${U.esc(c.name)} to this book and page">${figureThumb(n)}<span>${U.esc(c.name)}</span></button>`; }).join('') + '</div>' : '') +
    (!cast.length && !lib.length ? noMatch('tab-cast') : '');
  let props = '';
  const searching = !!(app.filters['tab-props'] || '').trim();
  for (const pack of propPacks()) {
    let inner = '', n = 0;
    for (const cat of propCats(pack)) {
      const list = PROPS.filter((d) => d.pack === pack && d.cat === cat && d.id !== 'numbers' && matches('tab-props', d.name, d.id, d.cat, d.pack)); if (!list.length) continue;
      n += list.length;
      inner += `<h3 class="sh">${U.esc(cat)}</h3><div class="grid">` + list.map((d) => {
        const fake = { id: 'thumb-' + d.id, kind: d.id, ...propDefaults(d) };
        return `<button class="tile" data-add-prop="${d.id}" title="Add ${U.esc(d.name)} (${U.esc(pack)} › ${U.esc(cat)})">${RENDER.thumb(propPrims(fake))}<span>${U.esc(d.name)}</span></button>`;
      }).join('') + '</div>';
    }
    if (!n) continue;
    const open = searching || !collapsedPacks().includes(pack);
    props += `<details class="pack" data-pack="${U.esc(pack)}" ${open ? 'open' : ''}><summary>${U.esc(pack)} <small class="muted">${n}</small></summary>${inner}</details>`;
  }
  $('#prop-list').innerHTML = props || noMatch('tab-props');
}
function addFromLibrary(id) {
  const src = CP.characters.find((c) => c.id === id); if (!src) return;
  if (!castById(id)) app.P.cast.push(STORE.normalizeCast(U.clone(src)));
  renderLibrary(); addFigure(id); toast(`${src.name} added to this book`);
}
const TAB_INFO = { 'tab-cast': ['Characters', 'Search characters…'], 'tab-props': ['Props', 'Search props…'], 'tab-shapes': ['Shapes', ''], 'tab-text': ['Text', ''], 'tab-layers': ['Layers', 'Search layers…'], 'tab-addons': ['Add-ons', ''] };
function setTab(tab) {
  if (!TAB_INFO[tab]) tab = 'tab-cast';
  app.tab = tab;
  $$('#rail [data-tab]').forEach((x) => { const on = x.dataset.tab === tab; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
  $$('#left .tabpane').forEach((p) => p.hidden = p.id !== tab);
  const [title, ph] = TAB_INFO[tab];
  $('#fly-title').textContent = title;
  const box = $('#lsearch'); box.placeholder = ph; box.value = app.filters[tab] || ''; box.hidden = tab === 'tab-text' || tab === 'tab-shapes' || tab === 'tab-addons';
  if (tab === 'tab-addons') renderPlugins();
  syncToolbar();
}
function onSearch() {
  app.filters[app.tab] = $('#lsearch').value;
  if (app.tab === 'tab-cast' || app.tab === 'tab-props') renderLibrary(); else renderLayers();
}
// style pickers: project setting (Page tab) + export "Look" (Clean + every style)
function renderStyleControls() {
  const opts = RENDER.styleList().map((st) => `<option value="${U.esc(st.id)}">${U.esc(st.name || st.id)}</option>`).join('');
  $('#style-sel').innerHTML = opts;
  $('#ex-look').innerHTML = `${opts}<option value="clean">Clean lines (sharp vectors, e.g. for AI tools)</option>`;
  syncStyleControls();
}
function syncStyleControls() { const id = curStyle(); if (id) { $('#style-sel').value = id; $('#ex-look').value = id; } }
function setStyle(id) {
  const s = app.P.settings; const was = RENDER.styles[curStyle()]; const now = RENDER.styles[id]; if (!now) return;
  s.style = id;
  // a style can suggest a page colour (chalk → blackboard); only change it if the page still has the old style's own colour
  const base = (st) => (st && st.defaultPaper) || '#ffffff';
  if (s.paper.toLowerCase() === base(was).toLowerCase() && base(now).toLowerCase() !== s.paper.toLowerCase()) { s.paper = base(now); $('#paper-col').value = s.paper; toast(`Page colour changed to suit ${now.name || id}`); }
  syncStyleControls(); renderStage(); renderLibrary(); commit(false);
}
// the page-level controls (ribbon) and the name/notes drawer follow the current page
function renderPageTab() {
  const p = pg(); const st = app.P.settings;
  $('#page-name').value = p.name; $('#page-notes').value = p.notes || '';
  $('#page-size').value = `${st.pageW}x${st.pageH}`; $('#paper-col').value = st.paper; syncStyleControls();
}
function addPage(after = app.page) {
  const p = { id: 'p' + U.uid(), name: `Page ${app.P.pages.length + 1}`, notes: '', items: [] };
  app.P.pages.splice(after + 1, 0, p); goPage(after + 1); commit(); toast('Page added');
}
async function deletePage(i = app.page) {
  const p = app.P.pages[i]; const n = p.items.filter((it) => it.type !== 'limbs').length;
  if (app.P.pages.length === 1) { if (n && await uiConfirm('Only one page', `This is the only page. Clear its ${n} item${n === 1 ? '' : 's'} instead?`, 'Clear page')) { p.items = []; renderAll(); commit(); } return; }
  const msg = `Delete page ${i + 1} "${p.name || 'Untitled'}"?` + (n ? ` It has ${n} item${n === 1 ? '' : 's'} on it.` : '') + ` (Ctrl+Z can undo this.)`;
  if (!await uiConfirm('Delete page', msg, 'Delete page')) return;
  app.P.pages.splice(i, 1); goPage(Math.min(i, app.P.pages.length - 1)); commit(); toast('Page deleted — Ctrl+Z to undo');
}
function duplicatePage(i = app.page) {
  const src = app.P.pages[i]; const cp = U.clone(src); cp.id = 'p' + U.uid(); cp.name = (src.name || 'Page') + ' (copy)';
  const map = {}; for (const it of cp.items) { const nid = U.uid(); map[it.id] = nid; it.id = nid; }
  for (const it of cp.items) if (it.type === 'limbs') it.of = map[it.of];
  app.P.pages.splice(i + 1, 0, cp); goPage(i + 1); commit(); toast('Page duplicated');
}
function movePage(i, d) {
  const j = i + d; if (j < 0 || j >= app.P.pages.length) return;
  const [p] = app.P.pages.splice(i, 1); app.P.pages.splice(j, 0, p);
  if (app.page === i) app.page = j; else if (app.page === j) app.page = i;
  renderAll(); commit();
}
// ---------- layers ----------
function renderLayers() {
  const items = pg().items; const sg = selGroup();
  const row = (it, inGroup) => {
    const own = ownerOf(it) || it; const sel = app.sel.includes(own.id); const nm = U.esc(itemName(it)); // every icon button says WHICH layer it is for
    return `<div class="layer ${sel && !sg ? 'sel' : ''} ${sel && sg ? 'gsel' : ''} ${it.type === 'limbs' ? 'sub' : ''} ${inGroup ? 'ingrp' : ''} ${own.locked ? 'islocked' : ''}" data-layer="${it.id}">
      <button data-vis="${it.id}" title="Show / hide" aria-label="${it.hidden ? 'Show' : 'Hide'} ${nm}">${it.hidden ? '◌' : '●'}</button>
      <button data-lock="${it.id}" title="${own.locked ? 'Locked — click to unlock' : 'Lock (stops it being selected or moved on the page)'}" aria-label="${own.locked ? 'Unlock' : 'Lock'} ${nm}">${own.locked ? '🔒' : '·'}</button>
      <button type="button" class="ln" aria-current="${sel}">${nm}</button>
      <button data-z="up" data-zid="${it.id}" title="${inGroup ? 'Forward (inside the group)' : 'Bring forward'}" aria-label="Bring ${nm} forward">▲</button><button data-z="down" data-zid="${it.id}" title="${inGroup ? 'Backward (inside the group)' : 'Send backward'}" aria-label="Send ${nm} backward">▼</button></div>`;
  };
  const out = [];
  for (const u of zUnits(items).reverse()) {
    const g = gOf(u[0]); const rows = [...u].reverse().filter((it) => matches('tab-layers', itemName(it), it.type, it.kind || '', g ? groupName(g) : ''));
    if (!g) { out.push(...rows.map((it) => row(it, false))); continue; }
    if (!rows.length) continue;
    const m = groupMembers(g); const hid = m.every((i) => i.hidden), lk = m.every((i) => i.locked);
    out.push(`<div class="layer grp ${sg === g ? 'sel' : ''}" data-group="${g}">
      <button data-gvis="${g}" title="Show / hide the group" aria-label="${hid ? 'Show' : 'Hide'} the group ${U.esc(groupName(g))}">${hid ? '◌' : '●'}</button>
      <button data-glock="${g}" title="${lk ? 'Unlock the group' : 'Lock the whole group'}" aria-label="${lk ? 'Unlock' : 'Lock'} the group ${U.esc(groupName(g))}">${lk ? '🔒' : '·'}</button>
      <button type="button" class="ln" aria-current="${sg === g}">▣ ${U.esc(groupName(g))} <small class="muted">${m.length} items</small></button>
      <button data-gz="up" data-gid="${g}" title="Bring the group forward" aria-label="Bring the group ${U.esc(groupName(g))} forward">▲</button><button data-gz="down" data-gid="${g}" title="Send the group backward" aria-label="Send the group ${U.esc(groupName(g))} backward">▼</button></div>`);
    out.push(...rows.map((it) => row(it, true)));
  }
  $('#layers').innerHTML = !items.length ? '<p class="muted">Nothing on this page yet. Add a character, a prop or a shape <span class="where-left">from the left</span><span class="where-below">from the bar below</span>.</p>' : !out.length ? noMatch('tab-layers') : out.join('');
}
