// Where projects are saved and opened. The editor talks to STORAGE.current only; the built-in adapter is the local
// disk (File System Access API, with a download fallback: src/core/files.js). A hosted edition registers another
// adapter (cloud projects for a signed-in account) and selects it, without touching the editor.
//
// An adapter provides:
//   supported            true if it can write in place (false = the editor falls back to downloads / file input)
//   name                 current project's file/title, or null
//   save(text, name)     overwrite the current project           -> name written
//   saveAs(text, name)   save as a new project                   -> name written, or null if cancelled
//   open()               choose a project                        -> { text, name, commit() } or null if cancelled
//   restoreHandle()      re-find the last project after a reload
//   forget()             start a new, unsaved project
// Optional (defaults below, for adapters with no permission prompts / file handles):
//   permission(), requestWrite(), peek(), pickExportFile(), pickExportDir(), writeBlob(), writeInDir(), lastExport()

const STORAGE = (() => {
  const adapters = {}; let currentId = null;
  const DEFAULTS = {
    supported: false, name: null,
    permission: async () => 'granted', requestWrite: async () => true, peek: async () => null,
    restoreHandle: async () => null, forget: async () => {}, lastExport: async () => null,
    pickExportFile: async () => null, pickExportDir: async () => null,
  };
  const REQUIRED = ['save', 'saveAs', 'open'];
  function register(adapter) {
    if (!adapter || !adapter.id) throw new Error('storage adapter needs an id');
    for (const k of REQUIRED) if (typeof adapter[k] !== 'function') throw new Error(`storage adapter "${adapter.id}" is missing ${k}()`);
    Object.setPrototypeOf(adapter, DEFAULTS); // keeps the adapter's own getters (e.g. `name`) live
    adapters[adapter.id] = adapter; if (!currentId) currentId = adapter.id;
    return adapter;
  }
  function use(id) { if (!adapters[id]) throw new Error(`no storage adapter "${id}"`); currentId = id; }
  return { register, use, adapters, get current() { return adapters[currentId]; }, get currentId() { return currentId; } };
})();

STORAGE.register(Object.assign(FILES, { id: 'local', label: 'This computer' }));
