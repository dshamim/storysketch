// Project state, versioned save/load, migrations, autosave and undo.
//
// Project file shape (schema 2):
// { app:'StorySketch', appVersion, schema, savedAt, settings:{pageW,pageH,paper,style?},
//   cast:[character...], templates:[user templates...], pages:[{id,name,notes,items:[...],groups?:{gid:{name}}}],
//   plugins:[{type,id,name,version}...] }   <- what the book uses, recorded on save (optional; informational)
// `schema` = file format number (bumped only when the layout changes; older files are upgraded step by step,
// newer ones refused). `appVersion` = the tool version that saved it.
// Item: { id, type:'figure'|'prop'|'limbs', x, y, s, rot, flip, mode, hidden, locked, group?, ... }
// (`group` and page `groups` were added in 0.10.0 without a schema bump: older versions just ignore them.)

const STORE = (() => {
  const KEY = 'storysketch/project';
  // Old (schema 1) characters had accessory booleans + separate colour fields; schema 2 uses
  // accessories: { id: { color } } so any accessory plugin can be worn by any character.
  const OLD_ACC = [['glasses', ''], ['mask', 'maskColor'], ['crown', 'crownColor'], ['cape', 'capeColor'], ['wheelchair', 'chairColor']];
  function normalizeCast(c) {
    const out = { ...c }; const acc = { ...(c.accessories || {}) };
    for (const [k, ck] of OLD_ACC) {
      if (k in out && typeof out[k] === 'boolean') { if (out[k]) acc[k] = { color: ck ? (out[ck] || '') : '' }; delete out[k]; }
      if (ck && ck in out) delete out[ck];
    }
    for (const id of Object.keys(acc)) acc[id] = { ...(acc[id] || {}) };
    delete out.type; delete out.file; delete out.order; delete out.api; delete out.version; // plugin-file fields, not part of a character
    return { ...LOOK_DEFAULTS, ...out, accessories: acc };
  }
  const MIGRATIONS = {
    // n: (project) => project   upgrades schema n -> n+1. Add one each time APP.schema is bumped.
    1: (p) => ({ ...p, cast: (p.cast || []).map(normalizeCast), templates: (p.templates || []).map((t) => ({ ...t, look: stripLook(normalizeCast(t.look || {})) })) }),
  };
  // templates keep only what differs from the defaults
  function stripLook(c) { const o = {}; for (const [k, v] of Object.entries(c)) if (JSON.stringify(v) !== JSON.stringify(LOOK_DEFAULTS[k])) o[k] = v; delete o.id; return o; }
  function starterCast() {
    return CP.characters.filter((c) => c.starter !== false).sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(b.name)).map((c) => normalizeCast(U.clone(c)));
  }

  // ---- sample projects (plugins/projects/*.json) ----
  // { name, settings?: { style, paper, pageW, pageH }, cast?: [ 'characterId' | { template, id, name?, ...overrides } ],
  //   pages: [ { name, notes?, items?: [ item ] } ] }
  // An item is written in a readable short form and turned into a real item here:
  //   figure: { type:'figure', cast, x, y | floor, s?, rot?, flip?, pose:'wave' (a preset id), expr?, look?, mode?, detach? }
  //           (`floor` = the y of the ground line under the figure; it sets y for you)
  //   prop:   { type:'prop', kind, x, y, s?, rot?, flip?, params?, colors?, mode? }   (params/colors override the prop's defaults)
  // Items are listed back to front (the first one is at the back). Anything unknown is skipped, never an error.
  function starterCastFor(sp) {
    if (!Array.isArray(sp.cast)) return starterCast();
    const out = [];
    for (const e of sp.cast) {
      if (typeof e === 'string') { const c = CP.characters.find((x) => x.id === e); if (c) out.push(normalizeCast(U.clone(c))); continue; }
      const t = e && e.template && CP.templates.find((x) => x.id === e.template);
      if (t) { const { template, ...over } = e; out.push(normalizeCast({ ...U.clone(t.look), ...over, id: e.id || U.uid(), name: e.name || t.name })); }
    }
    return out;
  }
  function makeItem(spec, castList) {
    const base = { id: U.uid(), x: 0, y: 0, s: 1, rot: 0, flip: false, mode: 'auto', ...spec };
    if (spec.type === 'figure') {
      const c = castList.find((x) => x.id === spec.cast); if (!c) return null;
      const poses = FIG.posesFor(c); const pr = poses.find((x) => x.id === (spec.pose || c.defaultPose)) || poses[0];
      const it = { ...base, pose: FIG.fromPreset(c, pr), expr: spec.expr || pr.expr || 'happy', look: spec.look || 0, detach: spec.detach || {} };
      // `floor`: put the figure's lowest point (a foot, a seat…) on this line, whatever its pose or size
      if (spec.floor != null) { delete it.floor; const b = RENDER.primsBBox(FIG.prims(c, it, 'main')); it.y = Math.round(spec.floor - (b.y1 - 2) * it.s); }
      return it;
    }
    if (spec.type === 'prop') {
      const def = CP.props[spec.kind]; if (!def) return null; const d = propDefaults(def);
      return { ...base, colors: { ...d.colors, ...(spec.colors || {}) }, params: { ...d.params, ...(spec.params || {}) } };
    }
    return null;
  }
  // kind: 'blank' (one empty page) or 'project:<id>' (a sample project plugin)
  function fresh(kind = 'blank') {
    const sp = kind.startsWith('project:') && CP.projects.find((p) => p.id === kind.slice(8));
    const cast = sp ? starterCastFor(sp) : starterCast();
    const pages = sp ? sp.pages.map(({ name, notes, items }) => ({ id: 'p' + U.uid(), name: name || 'Page', notes: notes || '', items: (items || []).map((it) => makeItem(it, cast)).filter(Boolean) }))
      : [{ id: 'p' + U.uid(), name: 'Page 1', notes: '', items: [] }];
    return {
      app: APP.name, appVersion: APP.version, schema: APP.schema,
      settings: { pageW: 1000, pageH: 750, paper: '#ffffff', style: 'crayon', ...((sp && sp.settings) || {}) },
      cast, templates: [],
      pages,
    };
  }

  function migrate(p) {
    if (!p || typeof p !== 'object' || !Array.isArray(p.pages) || (p.app && !['StorySketch', 'Crayon Poser'].includes(p.app))) throw new Error('Not a StorySketch project file'); // 'Crayon Poser' = files made before the rename
    let v = p.schema || 1;
    if (v > APP.schema) throw new Error(`This project was saved by a newer version (schema ${v}). Update the tool first.`);
    while (v < APP.schema) { const m = MIGRATIONS[v]; if (!m) throw new Error('No migration from schema ' + v); p = m(p); v++; p.schema = v; }
    // fill gaps so older files keep working
    p.settings = { pageW: 1000, pageH: 750, paper: '#ffffff', style: 'crayon', ...(p.settings || {}) };
    p.cast = (p.cast || []).map(normalizeCast);
    p.templates = p.templates || [];
    return p;
  }

  const lastLoad = { fromSchema: APP.schema, appVersion: '' }; // what the autosave was before upgrading
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        // keep the untouched old autosave before upgrading it, in case a migration goes wrong
        lastLoad.fromSchema = data.schema || 1; lastLoad.appVersion = data.appVersion || '';
        if ((data.schema || 1) < APP.schema) try { localStorage.setItem(`${KEY}/backup-schema${data.schema || 1}`, raw); } catch (e) { /* ignore */ }
        return migrate(data);
      }
    } catch (e) { console.warn('autosave unreadable, starting fresh', e); }
    return fresh();
  }
  let saveTimer = null;
  function autosave(project) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(project)); } catch (e) { console.warn('autosave failed', e); } }, 300);
  }
  function serialize(project, extra = {}) {
    return JSON.stringify({ ...project, ...extra, app: APP.name, appVersion: APP.version, schema: APP.schema, savedAt: new Date().toISOString() }, null, 1);
  }

  // undo history: snapshots of the whole project
  const hist = { past: [], future: [], last: null };
  function snapshot(project) {
    const s = JSON.stringify(project);
    if (s === hist.last) return;
    if (hist.last) hist.past.push(hist.last);
    if (hist.past.length > 150) hist.past.shift();
    hist.last = s; hist.future = [];
  }
  function undo() { if (!hist.past.length) return null; hist.future.push(hist.last); hist.last = hist.past.pop(); return JSON.parse(hist.last); }
  function redo() { if (!hist.future.length) return null; hist.past.push(hist.last); hist.last = hist.future.pop(); return JSON.parse(hist.last); }

  /** The project as it was at the last snapshot (to throw away a half-finished drag without touching the undo history). */
  function revert() { return hist.last ? JSON.parse(hist.last) : null; }

  return { lastLoad, normalizeCast, starterCast, fresh, migrate, load, autosave, serialize, snapshot, undo, redo, revert };
})();
