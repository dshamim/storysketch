// Keyboard shortcuts, start-up (`init`) and the DOMContentLoaded hook.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- misc ----------
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); }
function setPreview(on) { app.preview = on; $('#preview').classList.toggle('on', on); $('#preview').textContent = on ? '✏️ Preview: ON' : '✏️ Preview: off'; renderStage(); }
function goPage(i) { app.page = U.clamp(i, 0, app.P.pages.length - 1); app.sel = []; renderAll(); }
function renderAll() { renderPageSelect(); renderPageList(); renderPageTab(); renderLibrary(); renderStage(); renderLayers(); renderInspector(); }

function onKey(e) {
  const ctrl = e.ctrlKey || e.metaKey; const k = e.key;
  if (ctrl && k.toLowerCase() === 's') { e.preventDefault(); saveProject(e.shiftKey); return; }
  if (e.target.closest('input, textarea, select') || $('dialog[open]')) return;
  if (k === 'Alt') { e.preventDefault(); return; }
  if (k === ' ') { e.preventDefault(); if (!app.space) { app.space = true; $('#stage').classList.add('canpan'); } return; }
  if (ctrl && (k === '=' || k === '+')) { e.preventDefault(); zoomTo(app.view.z * 1.25); return; }
  if (ctrl && (k === '-' || k === '_')) { e.preventDefault(); zoomTo(app.view.z / 1.25); return; }
  if (ctrl && k === '0') { e.preventDefault(); zoomFit(); return; }
  if (e.shiftKey && e.code === 'Digit1') { zoomFit(); return; }
  if (e.shiftKey && e.code === 'Digit2') { zoomSel(); return; }
  if (ctrl && k.toLowerCase() === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSel(); else groupSel(); return; }
  if (ctrl && e.shiftKey && k.toLowerCase() === 'l') { e.preventDefault(); toggleLockSel(); return; }
  if (ctrl && k.toLowerCase() === 'z') { e.preventDefault(); restore(e.shiftKey ? (flushCommit(), STORE.redo()) : (flushCommit(), STORE.undo())); }
  else if (ctrl && k.toLowerCase() === 'y') { e.preventDefault(); restore((flushCommit(), STORE.redo())); }
  else if (ctrl && k.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); }
  else if (ctrl && k.toLowerCase() === 'c') { e.preventDefault(); copySel(false); }
  else if (ctrl && k.toLowerCase() === 'x') { e.preventDefault(); copySel(true); }
  else if (ctrl && k.toLowerCase() === 'v') { e.preventDefault(); pasteInto(); }
  else if (ctrl && k.toLowerCase() === 's') { e.preventDefault(); saveProject(e.shiftKey); }
  else if (ctrl && k.toLowerCase() === 'o') { e.preventDefault(); openProject(); }
  else if (ctrl && k.toLowerCase() === 'a') { e.preventDefault(); select(pg().items.filter((i) => i.type !== 'limbs' && !i.hidden && !i.locked).map((i) => i.id)); }
  else if (k === 'Delete' || k === 'Backspace') deleteSel();
  else if (k === '[') moveZ(app.sel, e.shiftKey ? 'back' : 'down');
  else if (k === ']') moveZ(app.sel, e.shiftKey ? 'front' : 'up');
  else if (k === 'p' || k === 'P') setPreview(!app.preview);
  else if (k === 'h' || k === 'H') { for (const it of movable(app.sel.map(itemById))) it.flip = !it.flip; renderStage(); commit(); }
  else if (k === 'Escape') select([]);
  else if (k === '/') { e.preventDefault(); $('#lsearch').focus(); }
  else if (k.startsWith('Arrow') && app.sel.length) { e.preventDefault(); const st = e.shiftKey ? 10 : 1; for (const it of movable(app.sel.map(itemById))) { if (k === 'ArrowLeft') it.x -= st; if (k === 'ArrowRight') it.x += st; if (k === 'ArrowUp') it.y -= st; if (k === 'ArrowDown') it.y += st; } scheduleRender(); commit(false); }
}

function init() {
  app.P = STORE.load(); STORE.snapshot(app.P);
  $('#ver').textContent = 'v' + APP.version;
  $('#defs-holder').innerHTML = `<defs>${RENDER.defs()}</defs>`;
  renderStyleControls();
  const stage = $('#stage');
  stage.addEventListener('pointerdown', onDown); stage.addEventListener('pointermove', onMove); stage.addEventListener('pointerup', onUp); stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('wheel', onWheel, { passive: false }); // not passive, so Ctrl+wheel zooms the page instead of Chrome
  stage.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault(); }); // no auto-scroll on middle-drag
  const endSpace = () => { app.space = false; $('#stage').classList.remove('canpan'); };
  document.addEventListener('keyup', (e) => { if (e.key === ' ') endSpace(); if (e.key === 'Alt' && !e.target.closest('input, textarea, select')) e.preventDefault(); }); window.addEventListener('blur', endSpace);
  $('#zoom-in').onclick = () => zoomTo(app.view.z * 1.25); $('#zoom-out').onclick = () => zoomTo(app.view.z / 1.25);
  $('#zoom-pct').onclick = zoomFit; $('#zoom-sel').onclick = zoomSel;
  window.addEventListener('resize', () => renderOverlay());
  document.addEventListener('keydown', onKey);
  $('#inspector').addEventListener('input', onInspectorInput); $('#inspector').addEventListener('click', onInspectorClick);
  $('#layers').addEventListener('click', (e) => {
    const b = e.target.closest('button'); const row = e.target.closest('[data-layer]'); if (!row && !e.target.closest('[data-group]')) return;
    if (b?.dataset.vis) { const it = itemById(b.dataset.vis); it.hidden = !it.hidden; renderStage(); renderLayers(); commit(); return; }
    if (b?.dataset.lock) { const own = ownerOf(itemById(b.dataset.lock)); setLocked([own], !own.locked); return; }
    if (b?.dataset.z) { const it = itemById(b.dataset.zid); moveZ([it.id], b.dataset.z); return; }
    const grow = e.target.closest('[data-group]');
    if (grow) {
      const g = grow.dataset.group; const m = groupMembers(g);
      if (b?.dataset.gvis) { const hide = !m.every((i) => i.hidden); for (const i of m) i.hidden = hide; renderStage(); renderLayers(); commit(); return; }
      if (b?.dataset.glock) { setLocked(m, !m.every((i) => i.locked)); return; }
      if (b?.dataset.gz) { moveZ(m.map((i) => i.id), b.dataset.gz); return; }
      select(m.map((i) => i.id)); return;
    }
    const it = itemById(row.dataset.layer); const own = ownerOf(it) || it; const add = e.shiftKey || e.ctrlKey || e.metaKey; select(add ? (app.sel.includes(own.id) ? app.sel.filter((x) => x !== own.id) : [...app.sel, own.id]) : [own.id]);
  });
  $('#left').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.addCast) addFigure(b.dataset.addCast); if (b.dataset.addProp) addProp(b.dataset.addProp); if (b.dataset.addLib) addFromLibrary(b.dataset.addLib);
    if (b.dataset.tab) setTab(b.dataset.tab);
  });
  // folding a prop pack open/shut is remembered (toggle doesn't bubble, so listen in the capture phase)
  $('#prop-list').addEventListener('toggle', (e) => { const d = e.target; if (d.matches?.('details.pack')) rememberPack(d.dataset.pack, d.open); }, true);
  $('#lsearch').addEventListener('input', onSearch);
  $('#lsearch').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (e.target.value) { e.target.value = ''; onSearch(); } else e.target.blur(); } });
  $('#open-plugins').onclick = openPlugins; $('#plug-close').onclick = () => $('#plugins').close(); $('#plug-rescan').onclick = rescanPlugins;
  updatePluginBadge();
  $('#open-designer').onclick = () => openDesigner(app.sel.length === 1 && itemById(app.sel[0])?.type === 'figure' ? itemById(app.sel[0]).cast : null);
  $('#designer').addEventListener('input', onDesignerInput);
  $('#designer').addEventListener('click', onDesignerClick);
  $('#d-close').onclick = () => { $('#designer').close(); commit(); };
  $('#designer').addEventListener('close', () => { renderInspector(); commit(); });
  $('#page-sel').onchange = (e) => goPage(+e.target.value);
  $('#prev-page').onclick = () => goPage(app.page - 1); $('#next-page').onclick = () => goPage(app.page + 1);
  $('#page-name').oninput = (e) => { pg().name = e.target.value; renderPageSelect(); renderPageList(); $('#page-strip b').textContent = `Page ${app.page + 1} · ${e.target.value}`; commit(false); };
  $('#page-notes').oninput = (e) => { pg().notes = e.target.value; $('#page-strip span').textContent = e.target.value; commit(false); };
  $('#add-page').onclick = () => addPage(); $('#add-page2').onclick = () => addPage(app.P.pages.length - 1);
  $('#del-page').onclick = () => deletePage(); $('#rename-page').onclick = () => showPagesTab(true);
  $('#page-strip').ondblclick = () => showPagesTab(true);
  $('#page-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b?.dataset.pmove) return movePage(+b.dataset.pi, +b.dataset.pmove);
    if (b?.dataset.pdup) return duplicatePage(+b.dataset.pdup);
    if (b?.dataset.pdel) return deletePage(+b.dataset.pdel);
    const row = e.target.closest('[data-goto]'); if (row) goPage(+row.dataset.goto);
  });
  $('#page-size').onchange = (e) => { const [w, h] = e.target.value.split('x').map(Number); app.P.settings.pageW = w; app.P.settings.pageH = h; renderStage(); commit(); };
  $('#style-sel').onchange = (e) => setStyle(e.target.value);
  $('#paper-col').oninput = (e) => { app.P.settings.paper = e.target.value; renderStage(); renderLibrary(); commit(false); };
  $('#preview').onclick = () => setPreview(!app.preview);
  $('#undo').onclick = () => restore((flushCommit(), STORE.undo())); $('#redo').onclick = () => restore((flushCommit(), STORE.redo()));
  $('#save').onclick = () => saveProject(false); $('#saveas').onclick = () => saveProject(true); $('#load').onclick = openProject;
  $('#load-file').onchange = (e) => { if (e.target.files[0]) loadProject(e.target.files[0]); e.target.value = ''; };
  $('#new').onclick = () => {
    // one button per sample project (plugins/projects/*.json) plus a blank page
    $('#new-choices').innerHTML = `<button value="blank" class="primary">One blank page</button>` +
      (CP.projects.length ? '<p class="muted small" style="flex-basis:100%;margin:6px 0 0">Or open a sample to explore:</p>' : '') +
      CP.projects.map((p) => `<button value="project:${U.esc(p.id)}" title="${U.esc(p.description || '')}">${U.esc(p.name)}</button>`).join('') + `<button value="cancel">Cancel</button>`;
    $('#newdlg').returnValue = ''; $('#newdlg').showModal();
  };
  $('#newdlg').addEventListener('close', async () => {
    const kind = $('#newdlg').returnValue; if (kind !== 'blank' && !kind.startsWith('project:')) return;
    setFileInfo(null, false);
    app.page = 0; app.sel = []; await STORAGE.current.forget(); restore(STORE.fresh(kind)); STORE.snapshot(app.P); setDirty(false);
  });
  $('#open-export').onclick = () => { $('#export-status').textContent = ''; $('#export').showModal(); };
  if (!STORAGE.current.supported) $('#ask-row').hidden = true;
  $('#do-export').onclick = (e) => { e.preventDefault(); doExport(); };
  $('#x-close').onclick = () => $('#export').close();
  renderAll();
  let wasDirty = false; try { wasDirty = !!localStorage.getItem('storysketch/dirty'); } catch (e) { /* ignore */ }
  try { const s = JSON.parse(localStorage.getItem('storysketch/fileinfo') || 'null'); if (s) { app.fileInfo = s.fi; app.upgradePending = s.upgradePending; } } catch (e) { /* ignore */ }
  setDirty(wasDirty);
  STORAGE.current.restoreHandle().then(() => {
    // the autosave was upgraded this session and a file is remembered: that file on disk is still the old format
    if (STORAGE.current.name && STORE.lastLoad.fromSchema < APP.schema) setFileInfo({ appVersion: STORE.lastLoad.appVersion || app.fileInfo?.appVersion || '?', schema: STORE.lastLoad.fromSchema, savedAt: app.fileInfo?.savedAt || '', plugins: app.fileInfo?.plugins ?? null }, true);
    setDirty(app.dirty);
  });
  window.addEventListener('beforeunload', () => { try { localStorage.setItem('storysketch/project', JSON.stringify(app.P)); } catch (e) { /* ignore */ } });
}
// plugins (listed in plugins/manifest.js) must finish loading before the editor starts
document.addEventListener('DOMContentLoaded', async () => { await CP.load(); init(); });
