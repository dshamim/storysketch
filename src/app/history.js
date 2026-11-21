// Commit / history: marking changes, autosave and undo/redo snapshots.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- commit / history ----------
let commitTimer = 0, commitPending = null;
function commit(now = true) {
  const go = () => { commitPending = null; app.rev = (app.rev || 0) + 1; STORE.snapshot(app.P); STORE.autosave(app.P); setDirty(true); scheduleFilm(); };
  clearTimeout(commitTimer); if (now) go(); else { commitPending = go; commitTimer = setTimeout(go, 350); }
}
// run a delayed commit now (so Save writes the latest edit and it can't mark the book unsaved again afterwards)
function flushCommit() { if (commitPending) { clearTimeout(commitTimer); commitPending(); } }
function restore(P) { if (!P) return; app.rev = (app.rev || 0) + 1; app.P = P; app.page = Math.min(app.page, P.pages.length - 1); app.sel = app.sel.filter((id) => itemById(id)); STORE.autosave(app.P); setDirty(true); renderAll(); }
function setDirty(on) {
  app.dirty = on; try { localStorage.setItem('storysketch/dirty', on ? '1' : ''); } catch (e) { /* ignore */ }
  const el = $('#file-name'); if (!el) return;
  const nm = STORAGE.current.name; const st = $('#save-state');
  el.textContent = nm || 'Untitled';
  if (saveRun) return; // "Saving…" is showing; setSaveButtons puts this back when the save ends
  const [txt, cls] = nm ? (on ? ['Unsaved ●', 'warning'] : ['Saved ✓', 'success']) : (on ? ['Not saved yet ●', 'warning'] : ['', '']);
  st.textContent = txt; st.className = 'ui-badge ' + cls; st.hidden = !txt;
  const fi = app.fileInfo; const info = fi ? `\nSaved by v${fi.appVersion || '?'} · format ${fi.schema}${fi.plugins != null ? ` · uses ${fi.plugins} plugins` : ''}${fi.savedAt ? ` · ${new Date(fi.savedAt).toLocaleString()}` : ''}${app.upgradePending ? '\nOlder format — the next Save will ask before upgrading the file' : ''}` : '';
  const status = $('#project-status');
  status.title = (nm ? (on ? 'Unsaved changes — Ctrl+S saves to this file' : 'All changes saved to this file') : on ? 'Changes are kept in this browser. Use File > Save as… to choose where to save' : 'Use File > Save as… to choose where to save') + info;
  status.classList.toggle('dirty', on);
}
