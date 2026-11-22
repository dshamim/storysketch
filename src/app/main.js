// Keyboard shortcuts, start-up (`init`) and the DOMContentLoaded hook.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- misc ----------
function toast(msg) { UI.toast(msg, { ms: 2600 }); }
function setPreview(on) { app.preview = on; $('#preview-sw').checked = on; $('#menu-preview').setAttribute('aria-checked', String(on)); renderStage(); }
function goPage(i) { endEdit(); app.page = U.clamp(i, 0, app.P.pages.length - 1); app.sel = []; renderAll(); }
function renderAll() { renderFilmstrip(); renderPageTab(); renderLibrary(); renderStage(); renderLayers(); renderInspector(); }

function onKey(e) {
  const ctrl = e.ctrlKey || e.metaKey; const k = e.key;
  if (ctrl && k.toLowerCase() === 's') { e.preventDefault(); saveProject(e.shiftKey); return; }
  if (e.target.closest('input, textarea, select') || $('dialog[open]')) return;
  if (e.target.closest('[role=menu], .ui-popover')) return; // menus and popovers use these keys themselves
  if (e.target.closest('[role=tablist], .ui-film') && (k.startsWith('Arrow') || k === 'Home' || k === 'End')) return; // so do the rail and the page strip
  if ((k === ' ' || k === 'Enter') && e.target.closest('button, [role=menuitem], [role=tab], summary')) return; // Space/Enter press the focused button
  if (k.startsWith('Arrow') && e.target.closest('#topbar, #ribbon, #filmbar, #rail')) return;
  if (!$('#start').hidden) return;
  if (k === 'Alt') { e.preventDefault(); return; }
  if (k === ' ') { e.preventDefault(); if (!app.space) { app.space = true; $('#stage').classList.add('canpan'); } return; }
  if (ctrl && (k === '=' || k === '+')) { e.preventDefault(); zoomTo(app.view.z * 1.25); return; }
  if (ctrl && (k === '-' || k === '_')) { e.preventDefault(); zoomTo(app.view.z / 1.25); return; }
  if (ctrl && k === '0') { e.preventDefault(); zoomFit(); return; }
  if (e.shiftKey && e.code === 'Digit1') { zoomFit(); return; }
  if (e.shiftKey && e.code === 'Digit2') { zoomSel(); return; }
  if (ctrl && k.toLowerCase() === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSel(); else groupSel(); return; }
  if (ctrl && e.shiftKey && k.toLowerCase() === 'l') { e.preventDefault(); toggleLockSel(); return; }
  if (ctrl && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); }
  else if (ctrl && k.toLowerCase() === 'y') { e.preventDefault(); doRedo(); }
  else if (ctrl && k.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); }
  else if (ctrl && k.toLowerCase() === 'c') { e.preventDefault(); copySel(false); }
  else if (ctrl && k.toLowerCase() === 'x') { e.preventDefault(); copySel(true); }
  else if (ctrl && k.toLowerCase() === 'v') { e.preventDefault(); pasteInto(); }
  else if (ctrl && k.toLowerCase() === 's') { e.preventDefault(); saveProject(e.shiftKey); }
  else if (ctrl && k.toLowerCase() === 'o') { e.preventDefault(); openProject(); }
  else if (ctrl && k.toLowerCase() === 'a') { e.preventDefault(); selectAll(); }
  else if (k === 'Delete' || k === 'Backspace') deleteSel();
  else if (k === '[') moveZ(app.sel, e.shiftKey ? 'back' : 'down');
  else if (k === ']') moveZ(app.sel, e.shiftKey ? 'front' : 'up');
  else if (k === 'p' || k === 'P') setPreview(!app.preview);
  else if (k === 'h' || k === 'H') { for (const it of movable(app.sel.map(itemById))) it.flip = !it.flip; renderStage(); commit(); }
  else if (k === 'Escape') { if (app.tool) setTool(null); else select([]); }
  else if ((k === 't' || k === 'T') && !ctrl) setTool(app.tool === 'text' ? null : 'text')
  else if (k === 'Enter' && app.sel.length === 1 && isText(itemById(app.sel[0]))) { e.preventDefault(); startEdit(app.sel[0]); }
  else if (k === '/') { e.preventDefault(); showFlyout(); $('#lsearch').focus(); }
  else if (k === 'PageUp') { e.preventDefault(); goPage(app.page - 1); }
  else if (k === 'PageDown') { e.preventDefault(); goPage(app.page + 1); }
  else if (k.startsWith('Arrow') && app.sel.length) { e.preventDefault(); const st = e.shiftKey ? 10 : 1; for (const it of movable(app.sel.map(itemById))) { if (k === 'ArrowLeft') it.x -= st; if (k === 'ArrowRight') it.x += st; if (k === 'ArrowUp') it.y -= st; if (k === 'ArrowDown') it.y += st; } scheduleRender(); commit(false); }
}

function init() {
  let firstRun = true; try { firstRun = !localStorage.getItem('storysketch/project'); } catch (e) { /* ignore */ }
  app.P = STORE.load(); STORE.snapshot(app.P);
  initShell(); initText();
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
  });
  // folding a prop pack open/shut is remembered (toggle doesn't bubble, so listen in the capture phase)
  $('#prop-list').addEventListener('toggle', (e) => { const d = e.target; if (d.matches?.('details.pack')) rememberPack(d.dataset.pack, d.open); }, true);
  $('#lsearch').addEventListener('input', onSearch);
  $('#lsearch').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); if (e.target.value) { e.target.value = ''; onSearch(); } else e.target.blur(); } });
  $('#plug-close').onclick = () => $('#plugins').close(); $('#plug-rescan').onclick = rescanPlugins;
  updatePluginBadge();
  $('#open-designer').onclick = () => openDesigner(app.sel.length === 1 && itemById(app.sel[0])?.type === 'figure' ? itemById(app.sel[0]).cast : null);
  $('#designer').addEventListener('input', onDesignerInput);
  $('#designer').addEventListener('click', onDesignerClick);
  $('#d-close').onclick = () => { $('#designer').close(); commit(); };
  $('#designer').addEventListener('close', () => { renderInspector(); commit(); });
  $('#page-name').oninput = (e) => { pg().name = e.target.value; updateFilmLabel(); commit(false); };
  $('#page-notes').oninput = (e) => { pg().notes = e.target.value; commit(false); };
  $('#page-size').onchange = (e) => { const [w, h] = e.target.value.split('x').map(Number); app.P.settings.pageW = w; app.P.settings.pageH = h; renderStage(); scheduleFilm(true); commit(); };
  $('#style-sel').onchange = (e) => setStyle(e.target.value);
  $('#paper-col').oninput = (e) => { app.P.settings.paper = e.target.value; renderStage(); renderLibrary(); scheduleFilm(true); commit(false); };
  renderAll();
  if (firstRun) showStart(true);
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
