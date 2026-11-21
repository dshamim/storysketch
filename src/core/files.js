// Project files on disk: Save (overwrite the current file), Save as (new file via dialog), Open.
// Uses the File System Access API (Chrome/Edge). The current file handle is kept in IndexedDB so
// "Save" still targets the same file after a reload (Chrome re-asks for write permission once).
// Without the API it falls back to downloads.

const FILES = (() => {
  const supported = typeof window.showSaveFilePicker === 'function';
  const TYPES = [{ description: 'StorySketch project', accept: { 'application/json': ['.json'] } }];
  const PICKER_ID = 'storysketch-projects'; // Chrome remembers the last folder per id
  let handle = null;
  // Some setups (seen with the tool opened from a \\wsl$ path) restore the remembered file after a refresh, but
  // Chrome never answers questions about it: queryPermission() just hangs. Every check gets a time limit; once
  // one times out the handle is "stale" and Save asks you to pick the file again (a fresh handle works normally).
  let stale = false;
  const TIMEOUT = Symbol('timeout');
  const within = (pr, ms) => Promise.race([pr, new Promise((r) => setTimeout(() => r(TIMEOUT), ms))]);

  const openDb = (name) => new Promise((res, rej) => {
    const r = indexedDB.open(name, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  // The tool was called "Crayon Poser" before: copy the remembered file/folder handles over once.
  let legacyDone = false;
  async function carryOverLegacy(d) {
    if (legacyDone) return; legacyDone = true;
    try {
      if (indexedDB.databases && !(await indexedDB.databases()).some((x) => x.name === 'crayon-poser')) return;
      const old = await openDb('crayon-poser');
      if (!old.objectStoreNames.contains('kv')) { old.close(); return; }
      const keys = await new Promise((res, rej) => { const q = old.transaction('kv').objectStore('kv').getAllKeys(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
      for (const k of keys) {
        const has = await new Promise((res) => { const q = d.transaction('kv').objectStore('kv').count(k); q.onsuccess = () => res(q.result > 0); q.onerror = () => res(true); });
        if (has) continue;
        const v = await new Promise((res, rej) => { const q = old.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
        await new Promise((res) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = res; });
      }
      old.close();
    } catch (e) { console.warn('could not carry over old settings', e); }
  }
  const db = async () => { const d = await openDb('storysketch'); await carryOverLegacy(d); return d; };
  async function idbPut(k, v) {
    try { const d = await db(); await new Promise((res, rej) => { const tx = d.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { console.warn('could not remember file', e); }
  }
  async function idbGet(k) {
    try { const d = await db(); return await new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch (e) { return null; }
  }

  async function setHandle(h) { handle = h || null; stale = false; await idbPut('handle', handle); }
  async function restoreHandle() { if (!supported) return null; const h = await idbGet('handle'); handle = h || null; return handle; }
  async function write(h, text) { const w = await h.createWritable(); await w.write(text); await w.close(); }
  function downloadText(text, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  // returns the file name written, or null if the user cancelled
  async function saveAs(text, suggestedName) {
    if (!supported) { downloadText(text, suggestedName); return suggestedName; }
    try {
      // a stale handle can't be trusted as a starting folder; the picker id still reopens the last folder used
      const h = await showSaveFilePicker({ suggestedName, types: TYPES, id: PICKER_ID, ...(handle && !stale ? { startIn: handle } : {}) });
      await write(h, text); await setHandle(h); return h.name;
    } catch (e) { if (e.name === 'AbortError') return null; throw e; }
  }
  async function save(text, suggestedName) {
    if (!supported || !handle) return saveAs(text, suggestedName);
    const pm = await permission();
    if (pm === 'stale') throw Object.assign(new Error('Chrome is not answering about ' + handle.name + '. Use "Save as…" and pick the same file.'), { name: 'StaleFileError' });
    if (pm !== 'granted' && !(await requestWrite())) throw new Error('Chrome did not allow writing to ' + handle.name + '. Use "Save as…".');
    await write(handle, text); return handle.name;
  }
  // Chrome forgets "allowed to edit this file" when the page reloads. permission() checks without prompting;
  // requestWrite() must be called straight from a click so Chrome actually shows its prompt.
  // returns 'granted' | 'prompt' | 'denied' | 'stale' (Chrome didn't answer) | 'none' (no file)
  async function permission() {
    if (!supported || !handle) return 'none'; if (stale) return 'stale';
    try {
      const r = await within(handle.queryPermission({ mode: 'readwrite' }), 1500);
      if (r === TIMEOUT) { stale = true; console.warn('[save] Chrome did not answer the permission check for ' + handle.name + ' — will ask to pick the file again'); return 'stale'; }
      return r;
    } catch (e) { return 'denied'; }
  }
  async function requestWrite() {
    if (!handle || stale) return false;
    try {
      const r = await within(handle.requestPermission({ mode: 'readwrite' }), 30000);
      if (r === TIMEOUT) { stale = true; console.warn('[save] Chrome did not answer the permission request'); return false; }
      return r === 'granted';
    } catch (e) { console.warn('requestPermission failed', e); return false; }
  }
  // read the format of the file Save would overwrite (null if unknown / not readable). Never prompts.
  async function peek() {
    if (!supported || !handle) return null;
    // optional check: give up after a few seconds rather than hold up Save (slow or network folders)
    const slow = (pr) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error('timed out')), 2500))]);
    try { if ((await permission()) !== 'granted') return null; const d = JSON.parse(await slow(slow(handle.getFile()).then((f) => f.text()))); return { schema: d.schema || 1, appVersion: d.appVersion || '' }; }
    catch (e) { console.warn('[save] could not read the file to check its format:', e.message); return null; }
  }
  // returns { text, name } or null if cancelled; remembers the file for later "Save"
  async function open() {
    try {
      const [h] = await showOpenFilePicker({ types: TYPES, id: PICKER_ID, multiple: false });
      const text = await (await h.getFile()).text();
      return { text, name: h.name, commit: () => setHandle(h) };
    } catch (e) { if (e.name === 'AbortError') return null; throw e; }
  }

  // ---- exports: own remembered folder, separate from project files ----
  const EXPORT_ID = 'storysketch-exports';
  const IMG_TYPES = { png: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }], svg: [{ description: 'SVG image', accept: { 'image/svg+xml': ['.svg'] } }] };
  async function lastExport() { return (await idbGet('lastExport')) || null; }
  // one file: returns a handle (or null if cancelled)
  async function pickExportFile(suggestedName, fmt) {
    try {
      const last = await lastExport();
      const h = await showSaveFilePicker({ suggestedName, types: IMG_TYPES[fmt], id: EXPORT_ID, ...(last ? { startIn: last } : {}) });
      await idbPut('lastExport', h); return h;
    } catch (e) { if (e.name === 'AbortError') return null; throw e; }
  }
  // several files: pick a folder (returns a directory handle or null)
  async function pickExportDir() {
    try {
      const last = await lastExport();
      const d = await showDirectoryPicker({ id: EXPORT_ID, mode: 'readwrite', ...(last ? { startIn: last } : {}) });
      await idbPut('lastExport', d); return d;
    } catch (e) { if (e.name === 'AbortError') return null; throw e; }
  }
  async function writeBlob(h, blob) { const w = await h.createWritable(); await w.write(blob); await w.close(); }
  async function writeInDir(dir, name, blob) { const h = await dir.getFileHandle(name, { create: true }); await writeBlob(h, blob); }

  return { supported, idbGet, idbPut, permission, requestWrite, peek, save, saveAs, open, restoreHandle, pickExportFile, pickExportDir, writeBlob, writeInDir, forget: () => setHandle(null), get name() { return handle ? handle.name : ''; }, get stale() { return stale; } };
})();
