// Plugin registry + loader.
//
// Everything a book is drawn from — hair styles, clothes, accessories, props, characters, poses and
// character templates — is a plugin in plugins/<type>/. See plugins/README.md.
//
// A web page opened from disk can't list a folder, so plugins/manifest.js is an index of the plugin
// files (JSON files are embedded in it). It is rebuilt by "Rescan plugins" in the tool or by
// `python3 tools/build_plugins.py`.

const CP = (() => {
  // Plugin API version. Bump ONLY for breaking changes to what plugins receive or must provide.
  // Every plugin / data file declares `api`; files made for another API are skipped, never converted.
  // If a future API stays compatible with older plugins, list the old number in SUPPORTED_APIS too.
  const API = 1;
  const SUPPORTED_APIS = [1];
  const hair = {}, clothes = {}, accessories = {}, props = {}, addons = {}, rigs = {};
  const propList = [], poses = [], templates = [], characters = [], projects = [];
  const SLOTS = ['base', 'back', 'body', 'face', 'head'];
  const FOLDERS = { styles: 'style', rigs: 'rig', projects: 'project', hair: 'hair', clothes: 'clothes', accessories: 'accessory', addons: 'addon', props: 'prop', poses: 'pose', templates: 'template', characters: 'character' };
  const ORDER = ['styles', 'rigs', 'projects', 'hair', 'clothes', 'accessories', 'addons', 'props', 'poses', 'templates', 'characters'];
  const warnings = []; const loaded = []; const reported = new Set();
  let currentFile = null; let manifest = null;

  const warn = (msg) => { warnings.push(msg); console.warn('[plugins]', msg); };
  const need = (def, keys) => { for (const k of keys) if (def[k] == null) throw new Error(`missing "${k}"`); };
  const upsert = (arr, def) => { const i = arr.findIndex((x) => x.id === def.id); if (i >= 0) arr[i] = def; else arr.push(def); };

  const skipped = []; let calls = 0;
  function checkApi(def) {
    const api = def.api;
    if (api == null) throw new Error(`no "api" version — add  api: ${API}  (see plugins/README.md)`);
    if (!SUPPORTED_APIS.includes(api)) throw new Error(api < API
      ? `made for plugin API ${api}; this version of the tool needs API ${API}. Not loaded — update the plugin.`
      : `made for plugin API ${api}, newer than this tool (API ${API}). Not loaded — update StorySketch.`);
  }

  // Later registrations with the same id replace earlier ones (so a plugin can override a built-in).
  // Accepts one definition, an array of definitions, or { api, type?, pack?, items: [...] } (items inherit api/type/version/pack).
  function register(def) {
    if (Array.isArray(def)) { def.forEach(register); return; }
    calls++;
    if (def && Array.isArray(def.items)) { for (const it of def.items) register({ type: def.type, api: def.api, version: def.version, ...(def.pack ? { pack: def.pack } : {}), ...(def.rig ? { rig: def.rig } : {}), ...it }); return; }
    try {
      need(def, ['type', 'id']);
      try { checkApi(def); } catch (e) { skipped.push({ type: def.type, id: def.id, file: currentFile || '(core)', reason: e.message }); throw e; }
      const file = currentFile || def.file || '(core)'; const d = { ...def, file };
      switch (def.type) {
        case 'hair': need(def, ['draw']); hair[def.id] = d; break;
        case 'clothes': need(def, ['draw']); clothes[def.id] = d; break;
        case 'accessory':
          need(def, ['draw', 'slot']); if (!SLOTS.includes(def.slot)) throw new Error(`slot must be one of: ${SLOTS.join(', ')}`);
          accessories[def.id] = d; break;
        // add-on = content that fills a prop's slot (a picture in a frame, a flower on a plant, a chart on a poster)
        case 'addon': need(def, ['draw', 'kind']); addons[def.id] = d; break;
        case 'prop': {
          need(def, ['draw']); const p = { pack: 'Other props', cat: 'Other', colors: {}, ...d };
          if (props[p.id]) propList.splice(propList.findIndex((x) => x.id === p.id), 1);
          props[p.id] = p; propList.push(p); break;
        }
        // style = how the clean drawing is finished for preview/export (crayon, marker, ink, chalk…)
        case 'style': need(def, ['render', 'name']); RENDER.registerStyle(d); break;
        // rig = a skeleton: dims, joints, posing, presets, handles and drawing (see src/core/rigs/biped.js)
        case 'rig': need(def, ['name', 'dims', 'joints', 'prims', 'fromPreset', 'mirror', 'handles', 'edit', 'bendOf', 'flipBend', 'limbs']); rigs[def.id] = d; break;
        // a pose belongs to one rig; the same id may exist for several rigs ("stand" for a person and for a dog)
        // project = a sample project offered by New project (cast, settings, pages with notes and placed items)
        case 'project': need(def, ['name', 'pages']); upsert(projects, d); break;
        case 'pose': { const i = poses.findIndex((x) => x.id === d.id && (x.rig || 'biped') === (d.rig || 'biped')); if (i >= 0) poses[i] = d; else poses.push(d); break; }
        case 'template': need(def, ['look']); upsert(templates, d); break;
        case 'character': need(def, ['name']); upsert(characters, d); break;
        default: throw new Error(`unknown type "${def.type}"`);
      }
      const i = loaded.findIndex((x) => x.type === def.type && x.id === def.id);
      const rec = { type: def.type, id: def.id, name: def.name || def.id, file, api: def.api, version: def.version || '' };
      if (i >= 0) loaded[i] = rec; else loaded.push(rec);
    } catch (e) { warn(`${currentFile || def?.id || '?'}: ${e.message}`); }
  }

  // a plugin's draw() threw while rendering — report once per plugin, keep drawing the rest
  function runtimeError(def, e) {
    const key = def.type + ':' + def.id; if (reported.has(key)) return; reported.add(key);
    warn(`${def.file}: "${def.id}" failed to draw — ${e.message}`);
  }

  // ---- minimal core fallbacks so the tool still works if the manifest is missing ----
  register({ api: API, type: 'hair', id: 'none', name: 'None', draw() {} });
  register({ api: API, type: 'clothes', id: 'stick', name: 'Stick', legSpread: 0, draw(pen, c) { pen.line([c.J.neck, c.J.hip], { stroke: c.cast.color, w: c.W }); } });
  register({ api: API, type: 'pose', id: 'stand', name: 'Stand', hL: [-0.35, 0.92, 1], hR: [0.35, 0.92, -1], fL: [-0.15, 0.99, 1], fR: [0.15, 0.99, -1] });

  // ---- loading ----
  function setManifest(m) { manifest = m; }
  const typeFromPath = (path) => FOLDERS[path.split('/')[0]];
  function loadScript(src) {
    return new Promise((res) => {
      const s = document.createElement('script'); s.src = src;
      s.onload = () => res(true); s.onerror = () => { warn(`could not load ${src} (file missing? run Rescan plugins)`); res(false); };
      document.head.appendChild(s);
    });
  }
  // ---- asset sources: where plugins come from ----
  // A source lists plugin files and can load them: { id, label, list() -> [{ path, text? }], script(path) -> Promise<boolean> }.
  //   - `path` starts with a type folder ("hair/bob.js", "characters/mia.json") so the type is known without opening it.
  //   - an entry with `text` is JSON data (characters, poses, templates…); one without is a script that calls CP.register().
  //   - `script(path)` runs that script and resolves true/false.
  // The built-in "local" source reads plugins/manifest.js. A hosted edition adds a source for gallery/account assets.
  const sources = [];
  function addSource(src) { const i = sources.findIndex((x) => x.id === src.id); if (i >= 0) sources[i] = src; else sources.push(src); return src; }
  const localSource = (base = 'plugins/') => ({
    id: 'local', label: 'This folder',
    list: async () => (manifest ? manifest.files : null),
    script: (path) => loadScript(base + path),
  });
  async function load(base = 'plugins/') {
    if (!sources.some((x) => x.id === 'local')) addSource(localSource(base)); else if (base !== 'plugins/') addSource(localSource(base));
    const onErr = (e) => { if (currentFile && e.filename && e.filename.includes(currentFile)) warn(`${currentFile}: ${e.message} (line ${e.lineno})`); };
    window.addEventListener('error', onErr);
    for (const src of sources) {
      let files; try { files = await src.list(); } catch (e) { warn(`source "${src.id}": ${e.message}`); continue; }
      if (!files) { if (src.id === 'local') warn('plugins/manifest.js not found — only core fallbacks are available. Use "Rescan plugins".'); continue; }
      for (const f of files) {
        currentFile = f.path;
        if (f.text != null) {
          try {
            const data = JSON.parse(f.text); const t = typeFromPath(f.path);
            if (Array.isArray(data)) throw new Error(`a list needs a wrapper: { "api": ${API}, "items": [ … ] }`);
            register({ type: t, ...data });
          }
          catch (e) { warn(`${f.path}: ${e.message}`); }
        } else {
          const before = calls;
          const ok = await src.script(f.path);
          // Chrome hides error details for scripts opened from disk, so a file that registered nothing
          // (usually a typo / syntax error) is reported here instead.
          if (ok && calls === before) warn(`${f.path}: loaded but registered nothing — probably a typo or syntax error (open the browser console, F12, for the exact line)`);
        }
        currentFile = null;
      }
    }
    window.removeEventListener('error', onErr);
  }

  // ---- rebuilding the manifest from the plugins folder (in the browser) ----
  const rank = (path) => { const i = ORDER.indexOf(path.split('/')[0]); return i < 0 ? 99 : i; };
  const sortFiles = (files) => files.sort((a, b) => rank(a.path) - rank(b.path) || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  function manifestText(files) {
    return '// Generated by "Rescan plugins" / tools/build_plugins.py — do not edit by hand.\n' +
      `CP.setManifest(${JSON.stringify({ files: sortFiles(files) }, null, 1)});\n`;
  }
  async function walk(dir, prefix, out) {
    for await (const [name, h] of dir.entries()) {
      if (name.startsWith('.')) continue;
      if (h.kind === 'directory') await walk(h, prefix + name + '/', out);
      else if (!prefix) continue; // only files inside a type folder
      else if (/\.js$/i.test(name)) out.push({ path: prefix + name });
      else if (/\.json$/i.test(name)) out.push({ path: prefix + name, text: await (await h.getFile()).text() });
    }
  }
  async function rescan() {
    let dir = await FILES.idbGet('pluginsDir');
    if (dir) { const o = { mode: 'readwrite' }; if ((await dir.queryPermission(o)) !== 'granted' && (await dir.requestPermission(o)) !== 'granted') dir = null; }
    if (!dir) {
      try { dir = await showDirectoryPicker({ id: 'storysketch-plugins', mode: 'readwrite' }); } catch (e) { if (e.name === 'AbortError') return null; throw e; }
      let looksRight = false; for await (const [n] of dir.entries()) if (n === 'manifest.js' || FOLDERS[n]) looksRight = true;
      if (!looksRight) throw new Error(`"${dir.name}" doesn't look like the plugins folder. Pick the plugins folder.`);
      await FILES.idbPut('pluginsDir', dir);
    }
    const files = []; await walk(dir, '', files);
    const fh = await dir.getFileHandle('manifest.js', { create: true }); const w = await fh.createWritable(); await w.write(manifestText(files)); await w.close();
    return files.length;
  }

  return {
    API, SUPPORTED_APIS, skipped, register, runtimeError, setManifest, addSource, sources, load, rescan, manifestText, SLOTS,
    hair, clothes, accessories, props, propList, addons, rigs,
    // preset poses written for one rig (a pose with no `rig` is for the biped)
    posesFor: (rigId) => poses.filter((p) => (p.rig || 'biped') === rigId),
    addonsOfKind: (kind) => Object.values(addons).filter((a) => a.kind === kind).sort((a, b) => (a.order ?? 50) - (b.order ?? 50) || String(a.name).localeCompare(b.name)), poses, templates, characters, projects, warnings, loaded,
    get manifest() { return manifest; },
  };
})();

// short aliases used around the editor (same live objects, filled as plugins load)
const POSES = CP.poses, TEMPLATES = CP.templates, PROPS = CP.propList, PROP_BY_ID = CP.props;
