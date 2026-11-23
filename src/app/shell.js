// The shell around the canvas: top-bar menus, the left rail and its flyout, the page filmstrip, the notes drawer,
// the export popover and the start screen.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- shell ----------
const pops = {};
const FLY_KEY = 'storysketch/flyout';
const DET_KEY = 'storysketch/details';

// ---- menu actions: one table, so every menu item and shortcut means the same thing ----
const doUndo = () => restore((flushCommit(), STORE.undo()));
const doRedo = () => restore((flushCommit(), STORE.redo()));
function selectAll() { select(pg().items.filter((i) => i.type !== 'limbs' && !i.hidden && !i.locked).map((i) => i.id)); }
const ACTIONS = {
  new: () => showStart(), open: () => openProject(), save: () => saveProject(false), saveas: () => saveProject(true),
  export: () => pops.export.open(true), addons: () => openPlugins(), touch: () => toggleTouch(),
  undo: doUndo, redo: doRedo, cut: () => copySel(true), copy: () => copySel(false), paste: () => pasteInto(), duplicate: () => duplicateSel(), delete: () => deleteSel(),
  selectall: selectAll, group: () => groupSel(), ungroup: () => ungroupSel(), lock: () => toggleLockSel(),
  preview: () => setPreview(!app.preview), zoomin: () => zoomTo(app.view.z * 1.25), zoomout: () => zoomTo(app.view.z / 1.25), zoomfit: () => zoomFit(), zoomsel: () => zoomSel(),
  library: () => (flyoutOpen() ? hideFlyout() : showFlyout()), details: () => (detailsOpen() ? hideDetails() : showDetails()), snap: () => setSnap(!app.snap),
  about: () => showAbout(), palette: () => openPalette(), shortcuts: () => openShortcuts(), 'hints-reset': () => resetHints(),
  'page-rename': () => openNotes(true), 'page-dup': () => duplicatePage(), 'page-earlier': () => movePage(app.page, -1), 'page-later': () => movePage(app.page, 1), 'page-del': () => deletePage(),
};

for (const a of ARRANGE_ACTS) ACTIONS[a] = () => arrangeAction(a);
Object.assign(ACTIONS, { 'z-front': () => moveZ(app.sel, 'front'), 'z-up': () => moveZ(app.sel, 'up'), 'z-down': () => moveZ(app.sel, 'down'), 'z-back': () => moveZ(app.sel, 'back') });

function initShell() {
  // menus (File, Edit, View, Help, page options) and the export popover
  pops.file = UI.popover($('#btn-file'), $('#menu-file'));
  pops.edit = UI.popover($('#btn-edit'), $('#menu-edit'));
  pops.view = UI.popover($('#btn-view'), $('#menu-view'));
  pops.help = UI.popover($('#btn-help'), $('#menu-help'), { placement: 'bottom-end' });
  pops.page = UI.popover($('#page-menu-btn'), $('#menu-page'), { placement: 'top-end' });
  pops.export = UI.popover($('#open-export'), $('#export'), { placement: 'bottom-end', focus: true });
  document.addEventListener('click', (e) => { const b = e.target.closest('.ui-menu [data-act]'); if (b && ACTIONS[b.dataset.act]) ACTIONS[b.dataset.act](); });
  // like a desktop menu bar: with one menu open, pointing at another opens that one instead
  for (const [btn, key] of [['#btn-file', 'file'], ['#btn-edit', 'edit'], ['#btn-view', 'view']]) {
    $(btn).addEventListener('pointerenter', () => { if (['file', 'edit', 'view'].some((k) => pops[k].isOpen) && !pops[key].isOpen) pops[key].open(); });
  }
  $('#menu-edit').addEventListener('ui-open', syncEditMenu);
  $('#menu-view').addEventListener('ui-open', syncViewMenu);
  $('#menu-page').addEventListener('ui-open', () => {
    setItemEnabled('page-earlier', app.page > 0); setItemEnabled('page-later', app.page < app.P.pages.length - 1);
  });
  $('#export').addEventListener('ui-open', () => { $('#export-status').textContent = ''; });
  $('#export-form').addEventListener('submit', (e) => e.preventDefault());
  $('#x-close').onclick = () => pops.export.close();
  $('#do-export').onclick = (e) => { e.preventDefault(); doExport(); };
  if (!STORAGE.current.supported) $('#ask-row').hidden = true;
  $('#undo').onclick = doUndo; $('#redo').onclick = doRedo;
  $('#preview-sw').onchange = (e) => setPreview(e.target.checked);
  $('#load-file').onchange = (e) => { if (e.target.files[0]) loadProject(e.target.files[0]); e.target.value = ''; };

  initRibbon();
  try { app.snap = localStorage.getItem('storysketch/snap') !== 'off'; } catch (e) { /* ignore */ }

  // left rail + flyout: choosing a tab opens the flyout, choosing the open one again folds it away
  UI.tabs($('#rail'));
  let wasOpen = false;
  $('#rail').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); wasOpen = !!b && b.dataset.tab === app.tab && flyoutOpen(); }, true); // before the tabs helper changes the tab
  $('#rail').addEventListener('ui-change', (e) => setTab(e.detail.el.dataset.tab));
  $('#rail').addEventListener('click', (e) => { if (e.target.closest('[data-tab]')) (wasOpen ? hideFlyout() : showFlyout()); });
  $('#fly-close').onclick = hideFlyout; $('#fly-open').onclick = showFlyout;
  try { const f = localStorage.getItem(FLY_KEY); if (f === 'closed') hideFlyout(false); else if (!f && narrowWindow()) hideFlyout(false); } catch (e) { /* ignore */ }
  if (sheetLayout()) hideFlyout(false); // a bottom sheet starts folded away
  setTab(app.tab);
  // details panel (right)
  $('#details-toggle').onclick = () => (detailsOpen() ? hideDetails() : showDetails());
  $('#details-close').onclick = hideDetails;
  $('#inspector').addEventListener('keydown', (e) => {
    const t = e.target.closest('[role=tab]'); if (!t || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = $$('#inspector [role=tab]'); const i = tabs.indexOf(t); e.preventDefault();
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : tabs.length - 1; tabs[(n + tabs.length) % tabs.length].click();
  });
  try { if (localStorage.getItem(DET_KEY) === 'open' && !sheetLayout()) showDetails(false); else hideDetails(false); } catch (e) { hideDetails(false); }

  // filmstrip + notes drawer
  $('#film').addEventListener('click', (e) => {
    if (e.target.closest('#add-page')) return addPage(); const b = e.target.closest('[data-page]'); if (b) goPage(+b.dataset.page);
  });
  $('#film').addEventListener('dblclick', (e) => { if (e.target.closest('[data-page]')) openNotes(true); });
  $('#film').addEventListener('keydown', (e) => {
    const items = $$('#film button'); const i = items.indexOf(document.activeElement); if (i < 0) return;
    const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1;
    if (to >= 0) { e.preventDefault(); items[U.clamp(to, 0, items.length - 1)].focus(); }
  });
  $('#toggle-notes').onclick = () => (notesOpen() ? closeNotes() : openNotes(false));

  // start screen
  $('#start-open').onclick = () => { hideStart(); openProject(); };
  $('#start-close').onclick = hideStart;
  $('#start-cards').addEventListener('click', (e) => { const b = e.target.closest('[data-start]'); if (b) startProject(b.dataset.start); });
  $('#start').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); hideStart(); } });
}

// ---- menus that reflect the selection ----
function setItemEnabled(act, on) { const b = $(`.ui-menu [data-act="${act}"]`); if (b) b.disabled = !on; }
function syncEditMenu() {
  const n = selItems().length;
  for (const a of ['cut', 'copy', 'duplicate', 'delete', 'lock']) setItemEnabled(a, n > 0);
  setItemEnabled('group', n > 1); setItemEnabled('ungroup', selItems().some((i) => i.group)); setItemEnabled('paste', !!getClip());
}
function setSnap(on) { app.snap = on; try { localStorage.setItem('storysketch/snap', on ? 'on' : 'off'); } catch (e) { /* ignore */ } syncViewMenu(); toast(on ? 'Snapping on — hold Alt to move freely' : 'Snapping off'); }
function syncViewMenu() { $('#menu-touch')?.setAttribute('aria-checked', String(touchUI())); $('#menu-snap').setAttribute('aria-checked', String(app.snap)); $('#menu-details')?.setAttribute('aria-checked', String(detailsOpen()));  $('#menu-preview').setAttribute('aria-checked', String(!!app.preview)); $('#menu-library').setAttribute('aria-checked', String(flyoutOpen())); }

// ---- flyout ----
const flyoutOpen = () => !$('#left').hidden;
function showFlyout(persist = !sheetLayout()) { if (sheetLayout() && detailsOpen()) hideDetails(false); $('#left').hidden = false; $('#fly-open').hidden = true; $('#workspace').classList.remove('fly-closed'); if (persist) try { localStorage.setItem(FLY_KEY, 'open'); } catch (e) { /* ignore */ } syncSheets(); requestAnimationFrame(renderOverlay); }
function hideFlyout(persist = !sheetLayout()) { $('#left').hidden = true; $('#fly-open').hidden = false; $('#workspace').classList.add('fly-closed'); if (persist) try { localStorage.setItem(FLY_KEY, 'closed'); } catch (e) { /* ignore */ } syncSheets(); requestAnimationFrame(renderOverlay); }

// ---- details panel ----
const detailsOpen = () => !$('#right').hidden;
function showDetails(persist = !sheetLayout()) { if (sheetLayout() && flyoutOpen()) hideFlyout(false); $('#right').hidden = false; $('#workspace').classList.remove('details-closed'); $('#details-toggle').setAttribute('aria-pressed', 'true'); if (persist) try { localStorage.setItem(DET_KEY, 'open'); } catch (e) { /* ignore */ } renderDetails(); syncSheets(); requestAnimationFrame(renderOverlay); }
function hideDetails(persist = !sheetLayout()) { if (app.designer) return closeDesigner(); $('#right').hidden = true; $('#workspace').classList.add('details-closed'); $('#details-toggle').setAttribute('aria-pressed', 'false'); if (persist) try { localStorage.setItem(DET_KEY, 'closed'); } catch (e) { /* ignore */ } syncSheets(); requestAnimationFrame(renderOverlay); }

// ---- filmstrip ----
// A page's thumbnail is drawn in clean lines with its own id prefix (so gradient / clip ids never clash with the canvas).
function pageThumb(i, prefix = 'f') {
  const keep = app.page; app.page = i; // item helpers look things up on the current page
  try {
    const { pageW: W, pageH: H, paper } = app.P.settings; const p = app.P.pages[i];
    const body = p.items.filter((it) => !it.hidden && !(ownerOf(it) || {}).hidden).map((it, k) => itemSVG(it, null, `${prefix}${i}_${k}_`)).join('');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><rect width="${W}" height="${H}" fill="${paper}"/>${body}</svg>`;
  } finally { app.page = keep; }
}
function renderFilmstrip() {
  const f = $('#film'); const hadFocus = f.contains(document.activeElement);
  f.innerHTML = app.P.pages.map((p, i) => {
    const nm = p.name || 'Untitled'; const cur = i === app.page;
    return `<button class="ui-film-item" data-page="${i}" ${cur ? 'aria-current="true" tabindex="0"' : 'tabindex="-1"'} aria-label="Page ${i + 1}: ${U.esc(nm)}" data-tip="${U.esc(nm)}"><span class="ui-film-thumb">${pageThumb(i)}</span><span class="ui-film-num">${i + 1}</span></button>`;
  }).join('') + `<button class="ui-film-item ui-film-add" id="add-page" tabindex="-1" data-tip="Add a page after this one" aria-label="Add a page"><span data-icon="add"></span></button>`;
  UI.fillIcons(f);
  const cur = f.querySelector('[aria-current]');
  if (cur) { f.scrollLeft = Math.max(0, cur.offsetLeft - (f.clientWidth - cur.offsetWidth) / 2); if (hadFocus) cur.focus({ preventScroll: true }); }
  $('#empty-hint').hidden = pg().items.length > 0;
}
let filmTimer = 0, filmAll = false;
// after edits: redraw the current page's thumbnail (or all of them), not on every drag frame
function scheduleFilm(all = false) {
  filmAll = filmAll || all; clearTimeout(filmTimer);
  filmTimer = setTimeout(() => {
    const everything = filmAll; filmAll = false;
    if (everything || $$('#film [data-page]').length !== app.P.pages.length) return renderFilmstrip();
    const b = $(`#film [data-page="${app.page}"] .ui-film-thumb`); if (b) b.innerHTML = pageThumb(app.page);
    $('#empty-hint').hidden = pg().items.length > 0;
  }, 400);
}
function updateFilmLabel() {
  const b = $('#film [aria-current]'); if (!b) return; const nm = pg().name || 'Untitled';
  b.setAttribute('aria-label', `Page ${app.page + 1}: ${nm}`); b.dataset.tip = nm;
}

// ---- notes drawer (page name and notes) ----
const notesOpen = () => !$('#notes-drawer').hidden;
function openNotes(focusName) {
  $('#notes-drawer').hidden = false; $('#toggle-notes').setAttribute('aria-expanded', 'true');
  if (focusName) { const el = $('#page-name'); el.focus(); el.select(); }
  requestAnimationFrame(renderOverlay);
}
function closeNotes() { $('#notes-drawer').hidden = true; $('#toggle-notes').setAttribute('aria-expanded', 'false'); requestAnimationFrame(renderOverlay); }

// ---- start screen ----
let sampleThumbs = {};
// the first page of a sample, drawn in the sample's own style (the project is swapped in only while drawing)
function sampleThumb(id) {
  if (sampleThumbs[id]) return sampleThumbs[id];
  const keep = { P: app.P, page: app.page };
  try {
    app.P = STORE.fresh('project:' + id); app.page = 0;
    // item ids seed the hand-drawn wobble: fixed ids keep a sample's preview identical every time
    const first = app.P.pages[0]; const ids = new Map(first.items.map((it, k) => [it.id, `${id}.${k}`]));
    for (const it of first.items) { if (it.type === 'limbs') it.of = ids.get(it.of); it.id = ids.get(it.id); }
    const { pageW: W, pageH: H, paper, style } = app.P.settings; const st = RENDER.styles[style] ? style : null;
    const body = app.P.pages[0].items.filter((it) => !it.hidden).map((it, k) => itemSVG(it, st, `t${id}_${k}_`)).join('');
    return (sampleThumbs[id] = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="${W}" height="${H}" fill="${paper}"/>${body}</svg>`);
  } finally { app.P = keep.P; app.page = keep.page; }
}
function showStart(firstRun = false) {
  const cards = [`<button class="start-card" data-start="blank"><span class="start-thumb blank"><span data-icon="add"></span></span><b>Blank page</b><small>Start from nothing</small></button>`]
    .concat(CP.projects.map((p) => `<button class="start-card" data-start="project:${U.esc(p.id)}"><span class="start-thumb">${sampleThumb(p.id)}</span><b>${U.esc(p.name)}</b><small>${U.esc(p.description || '')}</small></button>`));
  $('#start-cards').innerHTML = cards.join(''); UI.fillIcons($('#start'));
  $('#start-note').textContent = firstRun ? 'Pick a blank page, or open a sample to see how it is made. Samples are yours to change.'
    : (app.dirty ? 'Your current project has unsaved changes. Save it first (File ▸ Save) if you want to keep it.' : 'Pick a blank page, or open a sample to see how it is made.');
  setStartOpen(true); $('#start-cards button').focus();
}
function hideStart() { setStartOpen(false); }
function setStartOpen(on) { $('#start').hidden = !on; for (const s of ['#ribbon', '#workspace', '#filmbar']) $(s).inert = on; }
async function startProject(kind) {
  if (app.dirty && !await uiConfirm('Unsaved changes', 'The current project has unsaved changes. Start a new one anyway?', 'Start new project')) return;
  hideStart(); setFileInfo(null, false);
  app.page = 0; app.sel = []; await STORAGE.current.forget(); restore(STORE.fresh(kind)); STORE.snapshot(app.P); setDirty(false);
}

// ---- help ----
function showAbout() {
  showBookInfo('About StorySketch',
    `<p><b>StorySketch</b> v${U.esc(APP.version)} — a small tool for posing characters and props for picture books, slides and storyboards.</p>` +
    `<p class="muted">Free and open source (MIT licence). Drawing styles, characters, props and poses are add-ons you can write yourself — see <code>plugins/README.md</code>.</p>` +
    `<p class="muted">Icons: Lucide (ISC licence).</p>`);
}
