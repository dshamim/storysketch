// Loads StorySketch's core scripts (and, optionally, the real plugin set) into a Node `vm` sandbox with a stubbed
// browser, so core logic can be tested without a browser. The scripts are classic <script> files that share globals;
// a vm context reproduces that (top-level const/class are shared between scripts run in the same context).
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// same order as index.html
export const CORE = ['version', 'legacy', 'util', 'draw', 'files', 'storage', 'registry', 'parts', 'rigs/biped', 'figure', 'presets', 'props-core', 'store'].map((n) => `src/core/${n}.js`);

/** @param {{core?: string[], plugins?: boolean, storage?: Record<string,string>}} opts */
export async function createApp({ core = CORE, plugins = true, storage = {} } = {}) {
  const ls = new Map(Object.entries(storage));
  const errors = [];
  const sandbox = {
    console, setTimeout, clearTimeout, URL, Blob, structuredClone,
    localStorage: {
      getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: (k) => ls.delete(k),
      key: (i) => [...ls.keys()][i] ?? null, get length() { return ls.size; },
    },
    addEventListener() {}, removeEventListener() {},
    document: {
      createElement: (tag) => ({ tagName: tag }), addEventListener() {},
      head: {
        // <script src="plugins/…"> → read the file from disk and run it, like the browser would
        appendChild(el) {
          const file = path.join(ROOT, el.src);
          try { vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file }); } catch (e) { errors.push(`${el.src}: ${e.message}`); }
          queueMicrotask(() => el.onload && el.onload());
        },
      },
    },
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  for (const f of core) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  const get = (expr) => vm.runInContext(expr, ctx);
  if (plugins) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'plugins/manifest.js'), 'utf8'), ctx, { filename: 'plugins/manifest.js' });
    await get('CP.load()');
  }
  const api = get('({ CP, U, RENDER, Pen, FIG, STORE, APP, FILES, STORAGE })');
  return { ...api, ctx, get, errors, localStorage: sandbox.localStorage, run: (code, filename = 'inline.js') => vm.runInContext(code, ctx, { filename }) };
}
