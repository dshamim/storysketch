// Character designer: a side editor inside the Details panel (preview on top, sections below).
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- character designer ----------
const SWATCHES = ['#e0402f', '#ef7d10', '#b88a00', '#2e9e44', '#14998f', '#2f6fd6', '#3949ab', '#7b3fbf', '#d6408f', '#8a5a2b', '#555555'];
// ---- opening and closing: the designer takes over the Details panel; Done (or Esc, or the panel's X) puts it back ----
function openDesigner(castId) {
  const c = castById(castId) || app.P.cast[0]; if (!c) return;
  if (!app.designer) { app.designer = true; app.designerWasOpen = detailsOpen(); }
  app.designerCast = c.id; app.designerTpl = false; showDetails(); syncDesignerShell(); renderDesigner();
}
function closeDesigner() {
  if (!app.designer) return; flushCommit(); app.designer = false; app.designerTpl = false; syncDesignerShell();
  if (!app.designerWasOpen) hideDetails(); else renderInspector();
  requestAnimationFrame(renderOverlay);
}
function syncDesignerShell() { const on = !!app.designer; $('#designer').hidden = !on; $('#inspector').hidden = on; $('#details-title').textContent = on ? 'Character designer' : detailsTitle(selItems()); }
// choosing a figure on the page while the designer is open edits that figure's character
function designerFollow(ids) { const it = ids.length === 1 ? itemById(ids[0]) : null; const f = it && (it.type === 'figure' ? it : null); if (f && castById(f.cast)) { app.designerCast = f.cast; app.designerTpl = false; } }
// the button in Characters: a new character from the first starting look, ready to edit
function newCharacter() {
  const t = TEMPLATES.find((x) => !x.look.rig) || TEMPLATES[0]; if (!t) return openDesigner();
  newFromTemplate(t.id); openDesigner(app.designerCast);
  requestAnimationFrame(() => { const n = $('#d-form [data-d="name"]'); if (n) { n.focus(); n.select(); } });
}
function onDesignerKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); if (app.designerTpl) { app.designerTpl = false; renderDesigner(); } else closeDesigner(); }
  else if (e.key === 'Enter' && e.target.id === 'd-tplname') { e.preventDefault(); saveTemplate(e.target.value); }
}
function saveTemplate(name) {
  const c = castById(app.designerCast); name = String(name || '').trim(); if (!c || !name) return;
  const { id, name: _n, ...look } = U.clone(c); app.P.templates.push({ id: 'u-' + U.uid(), name, look }); app.designerTpl = false; toast('Saved template "' + name + '"'); designerChanged(true);
}
// the Character type picker: each type drawn as this character, standing
function typeThumb(c, r) {
  try { const same = FIG.rigOf(c).id === r.id; const look = { ...c, rig: r.id, build: same ? c.build : (r.defaultBuild || Object.keys(r.builds || {})[0] || c.build), accessories: same ? c.accessories : {} }; return figureThumb(look, 'stand'); } catch (e) { return ''; }
}
function renderDesigner() {
  if (!castById(app.designerCast)) app.designerCast = app.P.cast[0]?.id; // after Undo, Open or a delete the character may be gone
  const c = castById(app.designerCast); if (!c) { if (app.designer) closeDesigner(); return; }
  const used = app.P.pages.reduce((n, p) => n + p.items.filter((i) => i.type === 'figure' && i.cast === c.id).length, 0);
  $('#d-cast').innerHTML = app.P.cast.map((x) => `<button class="tile ${x.id === c.id ? 'on' : ''}" data-dcast="${x.id}">${figureThumb(x)}<span>${U.esc(x.name)}</span></button>`).join('');
  $('#d-templates').innerHTML = '<option value="">+ New character from a starting look…</option>' + TEMPLATES.map((t) => `<option value="${t.id}">${U.esc(t.name)}</option>`).join('') + (app.P.templates.length ? '<optgroup label="My templates">' + app.P.templates.map((t) => `<option value="${t.id}">${U.esc(t.name)}</option>`).join('') + '</optgroup>' : '');
  $('#d-preview').innerHTML = figureThumb(c, app.designerPose, app.designerCrayon);
  $('#d-pose').innerHTML = opts(Object.fromEntries(posesFor(castById(app.designerCast)).map((p) => [p.id, p.name])), app.designerPose);
  $('#d-crayon').checked = app.designerCrayon;
  const rig = FIG.rigOf(c); const sup = rig.supports || {}; // what this skeleton can wear / show
  const outfitCol = CP.clothes[c.body]?.color; // some outfits (e.g. overalls) have their own default colour
  const colorField = (key, label, allowSame = true) => { const dflt = key === 'clothesColor' && outfitCol ? outfitCol : c.color; return field(label, `<span class="cf"><input type="color" data-d="${key}" value="${c[key] || dflt}">${allowSame ? `<label class="same"><input type="checkbox" data-dsame="${key}" ${c[key] ? '' : 'checked'}> ${key === 'clothesColor' && outfitCol ? 'outfit default' : 'same as main'}</label>` : ''}</span>`); };
  const cd = CP.clothes[c.body]; const skirtable = !!(cd && cd.skirt != null); const skirtDef = cd?.skirt ?? 0.45;
  const named = (reg, cur) => { const o = Object.fromEntries(Object.values(reg).map((d) => [d.id, d.name || d.id])); if (cur && !reg[cur]) o[cur] = `⚠ ${cur} (plugin missing)`; return o; };
  const missing = FIG.missingParts(c);
  const SLOT_NAMES = { head: 'Head', face: 'Face', body: 'Body', back: 'Back', base: 'Base' };
  const accRows = Object.values(CP.accessories).filter((d) => FIG.accessoryFits(d, c)).sort((a, b) => CP.SLOTS.indexOf(b.slot) - CP.SLOTS.indexOf(a.slot) || String(a.name).localeCompare(b.name)).map((d) => {
    const on = c.accessories?.[d.id]; const col = on?.color || d.color || c.color;
    return `<div class="acc"><label><input type="checkbox" data-acc="${d.id}" ${on ? 'checked' : ''}> ${U.esc(d.name || d.id)} <small class="muted">${SLOT_NAMES[d.slot] || d.slot}</small></label>` +
      (on ? `<input type="color" data-acccol="${d.id}" value="${col}" title="Colour">` + (d.sided ? `<label class="same"><input type="checkbox" data-dchk="capeFlip" ${c.capeFlip ? 'checked' : ''}> other side</label>` : '') : '') + '</div>';
  }).join('');
  $('#d-form').innerHTML =
    field('Name', `<input type="text" data-d="name" value="${U.esc(c.name)}">`) +
    field('Main colour', `<span class="cf"><input type="color" data-d="color" value="${c.color}"><span class="sw">${SWATCHES.map((s) => `<button style="background:${s}" data-swatch="${s}" title="${s}"></button>`).join('')}</span></span>`) +
    (FIG.rigs().length > 1 ? `<h3 class="sh" id="d-type-h">Character type</h3><div class="typepick" role="radiogroup" aria-labelledby="d-type-h">${FIG.rigs().map((r) => `<button type="button" role="radio" aria-checked="${r.id === rig.id}" class="tile typetile ${r.id === rig.id ? 'on' : ''}" data-dtype="${r.id}">${typeThumb(c, r)}<span>${U.esc(r.name)}</span></button>`).join('')}</div>` : '') +
    `<h3 class="sh">Body</h3>` +
    field('Build', `<select data-d="build">${opts(rig.buildNames || { [c.build]: c.build }, c.build)}</select>`) +
    field(`Height <output>${(+c.height).toFixed(2)}</output>`, `<input type="range" min="0.7" max="1.4" step="0.01" data-d="height" value="${c.height}">`) +
    field(`Line weight <output>${(+c.weight).toFixed(2)}</output>`, `<input type="range" min="0.6" max="1.8" step="0.05" data-d="weight" value="${c.weight}">`) +
    (missing.length ? `<p class="warn">⚠ Missing plugin: ${U.esc(missing.join(', '))}. Add the file to plugins and rescan, or pick another.</p>` : '') +
    (sup.clothes ? (
    field('Clothes', `<select data-d="body">${opts(named(CP.clothes, c.body), c.body)}</select>`) +
    (skirtable ? field(`Skirt length <output>${(+(c.skirt ?? skirtDef)).toFixed(2)}</output>`, `<input type="range" min="0.15" max="1.1" step="0.01" data-d="skirt" value="${c.skirt ?? skirtDef}">`) + '<p class="muted small">The skirt follows the legs, so it drapes over the lap automatically when sitting.</p>' : '') +
    colorField('clothesColor', 'Clothes colour') +
    `<label class="chk"><input type="checkbox" data-dchk="hatchBody" ${c.hatchBody !== false ? 'checked' : ''}> Light shading on clothes</label>`
    ) : '') +
    (sup.hair ? (
    `<h3 class="sh">Hair</h3>` +
    field('Hair style', `<select data-d="hair">${opts(named(CP.hair, c.hair), c.hair)}</select>`) +
    colorField('hairColor', 'Hair colour') +
    `<label class="chk"><input type="checkbox" data-dchk="hairFlip" ${c.hairFlip ? 'checked' : ''}> Hair on the other side (default for this character)</label>`
    ) : '') +
    `<h3 class="sh">Accessories</h3><div class="accs">${accRows}</div>` +
    (sup.face ? `<label class="chk"><input type="checkbox" data-dchk="nose" ${c.nose !== false ? 'checked' : ''}> Nose</label>` : '') +
    field('Face tint', `<span class="cf"><input type="color" data-d="faceTint" value="${c.faceTint || '#c68642'}"><label class="same"><input type="checkbox" data-dnone="faceTint" ${c.faceTint ? '' : 'checked'}> none</label></span>`) +
    field('Default pose', `<select data-d="defaultPose">${opts(Object.fromEntries(posesFor(c).map((p) => [p.id, p.name])), c.defaultPose)}</select>`) +
    `<div class="row"><button data-dact="add" class="primary">+ Add to page</button><button data-dact="dup">Duplicate</button><button data-dact="tpl">Save as template</button><button data-dact="del" class="danger">Delete</button></div>` +
    (app.designerTpl ? `<div class="row d-tpl"><input type="text" id="d-tplname" aria-label="Template name" value="${U.esc(c.name + ' style')}"><button data-dact="tplok" class="primary">Save</button><button data-dact="tplcancel">Cancel</button></div>` : '') +
    `<p class="muted small">Used ${used}× in the book. Changes apply everywhere ${U.esc(c.name)} appears.</p>`;
}
// switching a character to another skeleton: placed figures can't keep their old pose, so they start from the standing pose
function changeRig(c, rigId) {
  const rig = CP.rigs[rigId]; if (!rig) return;
  c.rig = rigId; c.build = rig.defaultBuild || Object.keys(rig.builds || {})[0] || c.build; c.defaultPose = 'stand'; app.designerPose = 'stand';
  let n = 0;
  for (const pgx of app.P.pages) {
    const mine = new Set(pgx.items.filter((i) => i.type === 'figure' && i.cast === c.id).map((i) => i.id));
    for (const it of pgx.items) if (mine.has(it.id)) { it.pose = FIG.fromPreset(c, poseOf(c, 'stand')); it.detach = {}; n++; }
    pgx.items = pgx.items.filter((i) => !(i.type === 'limbs' && mine.has(i.of))); // detached-limb layers belong to the old skeleton
  }
  if (n) toast(`${n} placed figure${n === 1 ? '' : 's'} reset to the standing pose`);
  designerChanged(true); commit();
}
function designerChanged(full) { commit(false); renderStage(); renderLibrary(); if (full) renderDesigner(); else { const c = castById(app.designerCast); $('#d-preview').innerHTML = figureThumb(c, app.designerPose, app.designerCrayon); $('#d-cast .on').innerHTML = `${figureThumb(c)}<span>${U.esc(c.name)}</span>`; } commit(false); }
function onDesignerInput(e) {
  const t = e.target; const c = castById(app.designerCast); if (!c) return;
  if (t.id === 'd-pose') { app.designerPose = t.value; return designerChanged(false); }
  if (t.id === 'd-crayon') { app.designerCrayon = t.checked; return designerChanged(false); }
  if (t.id === 'd-templates') { if (t.value) newFromTemplate(t.value); return; }
  if (t.dataset.d) {
    const k = t.dataset.d; let v = t.value; if (['height', 'weight', 'skirt'].includes(k)) v = +v; c[k] = v;
    const out = t.closest('label')?.querySelector('output'); if (out) out.textContent = (+v).toFixed(2);
    const same = $(`[data-dsame="${k}"]`); if (same) same.checked = false; const none = $(`[data-dnone="${k}"]`); if (none) none.checked = false;
    return designerChanged(k === 'body' || k === 'build');
  }
  if (t.dataset.dsame) { c[t.dataset.dsame] = t.checked ? '' : $(`[data-d="${t.dataset.dsame}"]`).value; return designerChanged(false); }
  if (t.dataset.dnone) { c[t.dataset.dnone] = t.checked ? '' : $(`[data-d="${t.dataset.dnone}"]`).value; return designerChanged(false); }
  if (t.dataset.dchk) { c[t.dataset.dchk] = t.checked; return designerChanged(true); }
  if (t.dataset.acc) {
    const id = t.dataset.acc; const def = CP.accessories[id]; c.accessories = { ...(c.accessories || {}) };
    if (t.checked) { c.accessories[id] = {}; if (def?.suggestPose) c.defaultPose = def.suggestPose; } else delete c.accessories[id];
    return designerChanged(true);
  }
  if (t.dataset.acccol) { c.accessories = { ...(c.accessories || {}), [t.dataset.acccol]: { ...(c.accessories?.[t.dataset.acccol] || {}), color: t.value } }; return designerChanged(false); }
}
async function onDesignerClick(e) {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.dcast) { app.designerCast = b.dataset.dcast; app.designerTpl = false; return renderDesigner(); }
  if (b.dataset.dtype) { const c0 = castById(app.designerCast); if (c0 && FIG.rigOf(c0).id !== b.dataset.dtype) changeRig(c0, b.dataset.dtype); return; }
  if (b.dataset.swatch) { const c = castById(app.designerCast); c.color = b.dataset.swatch; return designerChanged(true); }
  const a = b.dataset.dact; const c = castById(app.designerCast);
  if (a === 'dup') { const cp = { ...U.clone(c), id: U.uid(), name: c.name + ' copy' }; app.P.cast.push(cp); app.designerCast = cp.id; designerChanged(true); }
  if (a === 'tpl') { app.designerTpl = true; renderDesigner(); const n = $('#d-tplname'); if (n) { n.focus(); n.select(); } return; }
  if (a === 'tplcancel') { app.designerTpl = false; return renderDesigner(); }
  if (a === 'tplok') return saveTemplate($('#d-tplname')?.value);
  if (a === 'del') {
    const uses = app.P.pages.flatMap((p) => p.items.filter((i) => i.type === 'figure' && i.cast === c.id));
    if (!await uiConfirm('Delete character', uses.length ? `${c.name} is used ${uses.length}× in the book. Delete the character AND those figures?` : `Delete ${c.name}?`, 'Delete')) return;
    for (const p of app.P.pages) { const dead = new Set(p.items.filter((i) => i.type === 'figure' && i.cast === c.id).map((i) => i.id)); p.items = p.items.filter((i) => !dead.has(i.id) && !(i.type === 'limbs' && dead.has(i.of))); }
    app.P.cast = app.P.cast.filter((x) => x.id !== c.id); app.designerCast = app.P.cast[0]?.id; app.sel = []; renderAll(); renderDesigner(); commit();
  }
  if (a === 'add') addFigure(c.id); // the designer stays open: the new figure is selected and it is the same character
}
function newFromTemplate(tid) {
  const t = TEMPLATES.find((x) => x.id === tid) || app.P.templates.find((x) => x.id === tid); if (!t) return;
  const usedCols = new Set(app.P.cast.map((c) => c.color)); const color = t.look.color || SWATCHES.find((s) => !usedCols.has(s)) || SWATCHES[0];
  const c = STORE.normalizeCast({ ...U.clone(t.look), color, id: U.uid(), name: 'New ' + (t.name.split('–')[0].trim()) });
  app.P.cast.push(c); app.designerCast = c.id; designerChanged(true);
}
