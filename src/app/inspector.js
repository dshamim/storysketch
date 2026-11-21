// Details panel (right, on demand): Look, Pose and Arrange for the selected item(s); the page tips when nothing is selected.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- inspector ----------
const field = (label, html) => `<label class="f"><span>${label}</span>${html}</label>`;
const opts = (obj, v) => Object.entries(obj).map(([k, l]) => `<option value="${k}" ${String(k) === String(v) ? 'selected' : ''}>${U.esc(l)}</option>`).join('');
// ---------- several selected: show what they have in common, change all at once ----------
const MODE_OPTS = { auto: 'Full colour', faded: 'Faded', grey: 'Grey pencil' };
const allSame = (vals) => vals.every((v) => JSON.stringify(v) === JSON.stringify(vals[0]));
// one control for a value that may differ between the selected items (then it says "mixed")
function mixedField(pr, attrs, vals) {
  const mixed = !allSame(vals); const v = vals[0]; const tag = mixed ? ' <small class="mixed">mixed</small>' : ''; const lab = U.esc(pr.label);
  if (pr.type === 'toggle') return `<label class="chk tog"><input type="checkbox" ${attrs} data-ptype="toggle" ${mixed ? 'data-mixed="1"' : ''} ${!mixed && v !== false && v !== 'false' ? 'checked' : ''}> ${lab}${tag}</label>`;
  if (pr.type === 'select') return field(lab + tag, `<select ${attrs}>${mixed ? '<option value="" selected disabled>— mixed —</option>' : ''}${opts(pr.options, mixed ? null : v)}</select>`);
  if (pr.type === 'range') return field(`${lab} <output>${mixed ? 'mixed' : v}</output>`, `<input type="range" min="${pr.min}" max="${pr.max}" step="${pr.step || 1}" value="${v}" ${attrs}>`);
  if (pr.type === 'color') return field(lab + tag, `<input type="color" value="${v}" ${attrs}>`);
  return field(lab + tag, `<input type="text" value="${mixed ? '' : U.esc(v)}" placeholder="${mixed ? 'mixed' : ''}" ${attrs}>`);
}
const propVals = (it) => ({ ...propDefaults(PROP_BY_ID[it.kind]).params, ...(it.params || {}) });
const sameControl = (a, b) => a.key === b.key && a.type === b.type && JSON.stringify(a.options || null) === JSON.stringify(b.options || null);
function commonPanel(items) {
  const ed = movable(items); if (!ed.length) return '';
  let h = `<h4>Change all ${ed.length} together</h4>` + (ed.length < items.length ? '<p class="muted small">Locked items are left as they are.</p>' : '');
  h += mixedField({ type: 'select', label: 'Colour', options: MODE_OPTS }, 'data-mk="mode"', ed.map((i) => i.mode || 'auto'));
  h += mixedField({ type: 'range', label: 'Size (makes them all the same)', min: 0.15, max: 4, step: 0.01 }, 'data-mk="s"', ed.map((i) => +(+i.s).toFixed(2)));
  const figs = ed.filter((i) => i.type === 'figure' && castById(i.cast));
  const props = ed.filter((i) => i.type === 'prop' && PROP_BY_ID[i.kind]);
  if (figs.length) {
    if (figs.length < ed.length) h += `<h4>The ${figs.length} character${figs.length === 1 ? '' : 's'}</h4>`;
    h += mixedField({ type: 'select', label: 'Expression', options: FIG.expressions(castById(figs[0].cast)) }, 'data-mk="expr"', figs.map((i) => i.expr));
    if (figs.every((i) => FIG.rigOf(castById(i.cast)).supports?.face)) h += mixedField({ type: 'select', label: 'Eyes look', options: { '-1': 'Left', 0: 'Centre', 1: 'Right' } }, 'data-mk="look"', figs.map((i) => String(i.look || 0)));
    const c = castById(figs[0].cast);
    h += `<p class="muted small">Pose for ${figs.length === 1 ? 'the character' : `all ${figs.length} characters`}:</p><div class="poses">${posesFor(c).map((p) => `<button class="tile sm" data-mpose="${p.id}" title="${U.esc(p.name)}">${figureThumb(c, p.id, false, p.expr)}<span>${U.esc(p.name)}</span></button>`).join('')}</div>`;
  }
  if (props.length) {
    const defs = props.map((i) => PROP_BY_ID[i.kind]); const sameKind = defs.every((d) => d === defs[0]); const vals = props.map(propVals);
    h += `<h4>${sameKind ? `${U.esc(defs[0].name)} ×${props.length}` : `The ${props.length} prop${props.length === 1 ? '' : 's'}`}</h4>`;
    // options every selected prop has (same name and kind of control)
    const shared = (defs[0].params || []).filter((pr) => defs.every((d) => (d.params || []).some((q) => sameControl(q, pr))) && vals.some((v) => whenOk(pr, v)));
    h += shared.map((pr) => mixedField(pr, `data-mparam="${pr.key}"`, vals.map((v) => v[pr.key] ?? pr.def))).join('');
    // same kind of prop: their slots too (and the add-on's own options when they all hold the same add-on)
    if (sameKind) for (const sl of defs[0].slots || []) {
      if (!vals.some((v) => whenOk(sl, v))) continue;
      const curs = vals.map((v) => (EMPTY_SLOT.has(v[sl.key]) ? 'none' : String(v[sl.key]))); const cur = allSame(curs) ? curs[0] : null;
      const tile = (id, name, svg) => `<button class="tile sm ${cur === id ? 'on' : ''}" data-mslot="${sl.key}" data-addon="${id}" title="${U.esc(name)}">${svg}<span>${U.esc(name)}</span></button>`;
      h += `<p class="muted small">${U.esc(sl.label || sl.key)}${cur ? '' : ' <small class="mixed">mixed</small>'}</p><div class="slotpick">` + tile('none', 'None', '<svg viewBox="0 0 100 70"><rect x="4" y="4" width="92" height="62" fill="none" stroke="#ccc" stroke-dasharray="5 4"/></svg>') + CP.addonsOfKind(sl.kind).map((ad) => tile(ad.id, ad.name || ad.id, addonThumb(ad))).join('') + '</div>';
      const ad = cur && CP.addons[cur];
      if (ad && ad.params) { const av = vals.map((v) => addonParams(ad, sl.key, v)); h += ad.params.filter((pr) => av.some((x) => whenOk(pr, x))).map((pr) => mixedField(pr, `data-mparam="${sl.key}.${pr.key}"`, av.map((x) => x[pr.key]))).join(''); }
    }
    // colours by name: every prop that has a "wood" colour gets the new wood colour
    const keys = [...new Set(defs.flatMap((d) => Object.keys(d.colors || {})))];
    if (keys.length) {
      h += `<div class="colors">${keys.map((k) => {
        const has = props.filter((i) => k in (PROP_BY_ID[i.kind].colors || {})); const cv = has.map((i) => i.colors?.[k] || PROP_BY_ID[i.kind].colors[k]);
        return `<label title="${has.length < props.length ? `${has.length} of the ${props.length} props have this colour` : ''}">${U.esc(k)}${has.length < props.length ? ` (${has.length})` : ''}${allSame(cv) ? '' : ' <small class="mixed">mixed</small>'}<input type="color" value="${cv[0]}" data-mcolor="${U.esc(k)}"></label>`;
      }).join('')}<button data-act="mresetcol">Reset</button></div>`;
    }
  }
  return h;
}
function onMultiInput(t) {
  const ed = movable(selItems()); const out = t.closest('label')?.querySelector('output');
  if (t.dataset.mk) {
    const k = t.dataset.mk; const v = k === 's' || k === 'look' ? +t.value : t.value;
    for (const it of ed) if (k === 'mode' || k === 's' || it.type === 'figure') it[k] = v;
    if (out) out.textContent = k === 's' ? v.toFixed(2) : v;
  } else if (t.dataset.mparam) {
    const v = t.dataset.ptype === 'toggle' ? t.checked : t.value;
    for (const it of ed) if (it.type === 'prop') it.params = { ...(it.params || {}), [t.dataset.mparam]: v };
    if (out) out.textContent = v;
  } else if (t.dataset.mcolor) {
    const k = t.dataset.mcolor; for (const it of ed) if (it.type === 'prop' && k in (PROP_BY_ID[it.kind]?.colors || {})) it.colors = { ...(it.colors || {}), [k]: t.value };
  }
  scheduleRender(); commit(false);
  // choices and tick boxes can show/hide other options, and "mixed" goes away
  if (t.tagName === 'SELECT' || t.dataset.ptype === 'toggle') renderInspector();
}
// ---------- Details panel: Look · Pose · Arrange ----------
// Opens on demand (ribbon "Details", double-click an item, or the mini bar). The ribbon covers the common choices; everything else lives here.
const DTABS = { look: 'Look', pose: 'Pose', arrange: 'Arrange' };
const ico = (n) => UI.icon(n);
const copyToField = (many) => `<select data-copyto title="Copy ${many ? 'the selection' : 'it'} to another page (same size and position)"><option value="">Copy to page…</option>${app.P.pages.map((p, i) => i === app.page ? '' : `<option value="${i}">${i + 1}. ${U.esc(p.name)}</option>`).join('')}</select>`;
const orderRow = () => `<div class="row"><button data-act="front">To front</button><button data-act="up">Forward</button><button data-act="down">Backward</button><button data-act="back">To back</button></div>`;
const ALIGN_BTNS = [['left', 'align-left', 'Left'], ['hcenter', 'align-hcenter', 'Centre'], ['right', 'align-right', 'Right'], ['top', 'align-top', 'Top'], ['vmiddle', 'align-vmiddle', 'Middle'], ['bottom', 'align-bottom', 'Bottom']];
const alignRow = (prefix, label) => `<p class="muted small">${label}</p><div class="iconrow">${ALIGN_BTNS.map(([m, ic, nm]) => `<button class="ui-iconbtn" data-act="${prefix}-${m}" data-tip="${nm}" aria-label="${label}: ${nm}">${ico(ic)}</button>`).join('')}</div>`;
const distRow = () => `<p class="muted small">Space evenly (3 or more)</p><div class="iconrow"><button class="ui-iconbtn" data-act="dist-h" data-tip="Across" aria-label="Space evenly across">${ico('distribute-h')}</button><button class="ui-iconbtn" data-act="dist-v" data-tip="Down" aria-label="Space evenly down">${ico('distribute-v')}</button></div>`;

function detailTabs(sel) {
  if (!sel.length) return [];
  if (sel.length > 1) return movable(sel).length ? ['look', 'arrange'] : ['arrange'];
  const it = sel[0]; if ((ownerOf(it) || it).locked || it.type === 'limbs') return ['arrange'];
  if (it.type === 'figure') return castById(it.cast) ? ['look', 'pose', 'arrange'] : ['arrange'];
  return PROP_BY_ID[it.kind] ? ['look', 'arrange'] : ['look'];
}
function detailsTitle(sel) {
  if (!sel.length) return 'Page';
  if (sel.length > 1) { const sg = selGroup(); return sg ? `▣ ${groupName(sg)}` : `${sel.length} items`; }
  return (((ownerOf(sel[0]) || sel[0]).locked ? '🔒 ' : '') + itemName(sel[0]));
}
function renderDetails() {
  if ($('#right').hidden) return; // built when opened
  const el = $('#inspector'); const sel = selItems(); const tabs = detailTabs(sel);
  if (tabs.length && !tabs.includes(app.dtab)) app.dtab = tabs[0];
  $('#details-title').textContent = detailsTitle(sel);
  const bar = tabs.length > 1 ? `<div class="ui-tabs" role="tablist" aria-label="Details">${tabs.map((t) => `<button class="ui-tab" role="tab" id="dtab-${t}" data-dtab="${t}" aria-selected="${t === app.dtab}" tabindex="${t === app.dtab ? 0 : -1}">${DTABS[t]}</button>`).join('')}</div>` : '';
  el.innerHTML = bar + `<div class="dpanel" ${tabs.length > 1 ? `role="tabpanel" aria-labelledby="dtab-${app.dtab}"` : ''}>${!sel.length ? pageDetails() : sel.length > 1 ? multiDetails(sel, app.dtab) : oneDetails(sel[0], app.dtab)}</div>`;
  for (const c of $$('[data-mixed]', el)) c.indeterminate = true; // a tick box whose items differ
}
function pageDetails() {
  const c = getClip(); const n = c ? c.items.filter((i) => i.type !== 'limbs').length : 0; const nl = pg().items.filter((i) => i.locked).length;
  return (n ? `<div class="row"><button data-act="paste" class="primary">Paste ${n} copied item${n === 1 ? '' : 's'} (Ctrl+V)</button></div>` : '') +
    (nl ? `<div class="row"><button data-act="unlockall" title="Locked items can't be clicked on the page — this unlocks every one on this page">🔓 Unlock all on this page (${nl})</button></div>` : '') +
    '<p class="muted">Select something on the page to see its details here.<br><br><b>Tips</b><br>• Drag orange dots = hands/feet, blue = elbows/knees, green = lean/head.<br>• <b>Shift</b>-drag a hand/foot = turn just the lower arm/leg (or switch under Pose ▸ When dragging).<br>• <b>Double-click</b> an elbow/knee = bend it the other way.<br>• <kbd>Ctrl+C</kbd> / <kbd>Ctrl+V</kbd> copy to another page — same size and position.<br>• Select several: <b>Ctrl/Shift-click</b>, or drag a box on empty space. <kbd>Ctrl+A</kbd> selects all.<br>• <kbd>[</kbd> <kbd>]</kbd> layer order, <kbd>P</kbd> styled view, <kbd>H</kbd> flip, <kbd>Ctrl+D</kbd> duplicate.<br>• <kbd>Ctrl+G</kbd> group the selection, <kbd>Ctrl+Shift+G</kbd> ungroup. Click a member = whole group, double-click = just that item.<br>• <kbd>Ctrl+Shift+L</kbd> lock / unlock. Locked things can\'t be clicked on the page (clicks go through to what\'s behind) — unlock them from the Layers panel.<br>• Things snap to the page and to each other while you drag; hold <kbd>Alt</kbd> to move freely (View ▸ Snapping turns it off).<br>• Zoom: <kbd>Ctrl</kbd>+mouse wheel or pinch, or the − + buttons at the bottom right. Wheel or <b>Space</b>-drag (or middle-drag) moves around. <kbd>Ctrl+0</kbd> fits the page.<br>• <b>Alt+click</b> steps through everything stacked under the pointer, front to back — for things buried under other things.</p>';
}

// ---- several selected ----
function multiDetails(all, tab) {
  if (tab === 'look') return commonPanel(all);
  const sg = selGroup(); const lk = all.length && all.every((i) => i.locked);
  const head = sg ? field(`Group name <small class="muted">· ${app.sel.length} items</small>`, `<input type="text" data-gname="${sg}" value="${U.esc(groupName(sg))}">`) + `<div class="row"><button data-act="ungroup" title="Ctrl+Shift+G">Ungroup</button><button data-act="lock" title="Ctrl+Shift+L">${lk ? '🔓 Unlock group' : '🔒 Lock group'}</button><button data-act="zoomsel" title="Zoom in on the group">🔍 Zoom to</button></div>`
    : `<div class="row"><button data-act="group" class="primary" title="Ctrl+G — then one click picks them all up">▣ Group</button>${all.some((i) => i.group) ? '<button data-act="ungroup" title="Ctrl+Shift+G">Ungroup</button>' : ''}<button data-act="lock" title="Ctrl+Shift+L">${lk ? '🔓 Unlock' : '🔒 Lock'}</button><button data-act="zoomsel">🔍 Zoom to</button></div>`;
  return head + (lk ? '<p class="warn">🔒 Locked — these can\'t be moved, changed or deleted until unlocked.</p>' : '') +
    `<h4>Line up</h4>${alignRow('align', 'Line up with each other')}${distRow()}${alignRow('align-page', 'Line up with the page')}` +
    `<h4>Order</h4>${orderRow()}` +
    `<h4>Actions</h4><div class="row"><button data-act="dup">Duplicate</button><button data-act="del" class="danger">Delete</button><button data-act="flipall">⇆ Flip each</button></div><div class="row"><button data-act="copy" title="Ctrl+C">Copy</button><button data-act="cut" title="Ctrl+X">Cut</button>${copyToField(true)}</div>` +
    '<p class="muted">Drag any of them to move the group. Purple corner = resize the group, purple circle = rotate it (Shift snaps to 15°).<br>Export → "Selection" saves these together as one PNG.</p>';
}

// ---- one selected ----
function oneDetails(it, tab) {
  const own0 = ownerOf(it) || it;
  if (own0.locked) {
    return `<p class="warn">🔒 Locked — it can't be moved, posed, changed or deleted, and clicks on the page go through it to whatever is behind.</p><div class="row"><button data-act="unlock" class="primary" title="Ctrl+Shift+L">🔓 Unlock</button><button data-act="zoomsel">🔍 Zoom to</button></div>` +
      orderRow() + `<div class="row"><button data-act="copy" title="Ctrl+C">Copy</button>${copyToField(false)}</div>`;
  }
  if (it.type === 'limbs') return `<p class="muted">Arms and legs of ${U.esc(itemName(ownerOf(it) || it))} that were put in front. Move this layer above a prop to put the hands on top. Select the character to change its pose.</p>` + orderRow();
  if (it.type === 'figure') { if (!castById(it.cast)) return `<p class="warn">⚠ This character is missing from the book.</p>` + arrangeDetails(it); return tab === 'pose' ? poseDetails(it) : tab === 'arrange' ? arrangeDetails(it) : figureLook(it); }
  if (!PROP_BY_ID[it.kind]) return `<p class="warn">⚠ Prop add-on "${U.esc(it.kind)}" is not installed. Add it to plugins/props and refresh add-ons.</p>`;
  return tab === 'arrange' ? arrangeDetails(it) : propLook(it);
}
function figureLook(it) {
  const c = castById(it.cast);
  return field('Character', `<select data-k="cast">${app.P.cast.map((x) => `<option value="${x.id}" ${x.id === it.cast ? 'selected' : ''}>${U.esc(x.name)}</option>`).join('')}</select>`) +
    `<div class="row"><button data-act="design">✎ Edit this character…</button></div>` +
    field('Expression', `<select data-k="expr">${opts(FIG.expressions(c), it.expr)}</select>`) +
    (FIG.rigOf(c).supports?.face ? field('Eyes look', `<select data-k="look">${opts({ '-1': 'Left', 0: 'Centre', 1: 'Right' }, it.look || 0)}</select>`) : '') +
    field('Colour', `<select data-k="mode">${opts(MODE_OPTS, it.mode || 'auto')}</select>`);
}
function poseDetails(it) {
  const c = castById(it.cast); const rig = FIG.rigOf(c);
  return `<h4>Poses</h4><div class="poses">${posesFor(c).map((p) => `<button class="tile sm" data-pose="${p.id}" title="${U.esc(p.name)}">${figureThumb(c, p.id, false, p.expr)}<span>${U.esc(p.name)}</span></button>`).join('')}</div>` +
    `<div class="row"><button data-act="mirror">⇋ Mirror pose</button>${rig.supports?.feet ? `<button data-act="feet">Feet: ${it.pose.feet || 'out'}</button>` : ''}${rig.supports?.hair ? `<button data-act="hairflip" title="Mirror only the hair (ponytail, parting, curls) — the pose stays the same">⇆ Hair side</button>` : ''}${FIG.sidedAccessories(c).length ? `<button data-act="capeflip" title="Mirror only the cape or other one-sided add-ons">⇆ ${U.esc(FIG.sidedAccessories(c).map((a) => a.name || a.id).join(' / '))}</button>` : ''}</div>` +
    `<h4>When dragging a hand or foot</h4><div class="row seg"><button data-act="mode-reach" class="${app.handMode === 'reach' ? 'on' : ''}" title="The hand goes where you drag; the elbow follows">Move whole arm</button><button data-act="mode-rotate" class="${app.handMode === 'rotate' ? 'on' : ''}" title="Only the lower arm or leg turns around the elbow or knee">Turn lower arm</button></div>` +
    `<div class="row"><span class="muted small">Flip elbow / knee:</span>${FIG.limbs(c).map((L) => `<button data-flip="${L.id}">${U.esc(L.joint)}</button>`).join('')}</div>` +
    `<h4>Put arms / legs in front</h4><p class="muted">Tick to put them on their own layer <i>above</i> the character — e.g. hands on top of a drum or book while the body stays behind it.</p><div class="checks">` +
    FIG.limbs(c).map((L) => `<label><input type="checkbox" data-detach="${L.id}" ${it.detach?.[L.id] ? 'checked' : ''}> ${U.esc(L.label)}</label>`).join('') + '</div>';
}
function propLook(it) {
  const def = PROP_BY_ID[it.kind]; let h = '';
  const P = { ...propDefaults(def).params, ...(it.params || {}) };
  const optionField = (pr, key, v) => {
    if (pr.type === 'toggle') return `<label class="chk tog"><input type="checkbox" data-param="${key}" data-ptype="toggle" ${v !== false && v !== 'false' ? 'checked' : ''}> ${U.esc(pr.label)}</label>`;
    if (pr.type === 'select') return field(pr.label, `<select data-param="${key}">${opts(pr.options, v)}</select>`);
    if (pr.type === 'range') return field(`${U.esc(pr.label)} <output>${v}</output>`, `<input type="range" min="${pr.min}" max="${pr.max}" step="${pr.step || 1}" value="${v}" data-param="${key}">`);
    if (pr.type === 'color') return field(pr.label, `<input type="color" value="${v}" data-param="${key}">`);
    return field(pr.label, `<input type="text" value="${U.esc(v)}" data-param="${key}">`);
  };
  const own = (def.params || []).filter((pr) => whenOk(pr, P));
  if (own.length) h += `<h4>Options</h4>` + own.map((pr) => optionField(pr, pr.key, P[pr.key] ?? pr.def)).join('');
  // slots: pick any installed add-on of the right kind (pictures, flowers, charts…)
  for (const sl of def.slots || []) {
    if (!whenOk(sl, P)) continue;
    const cur = P[sl.key]; const list = CP.addonsOfKind(sl.kind);
    const tile = (id, name, svg) => `<button class="tile sm ${String(cur) === id || (id === 'none' && EMPTY_SLOT.has(cur)) ? 'on' : ''}" data-slot="${sl.key}" data-addon="${id}" title="${U.esc(name)}">${svg}<span>${U.esc(name)}</span></button>`;
    h += `<h4>${U.esc(sl.label || sl.key)}</h4><div class="slotpick">` + tile('none', 'None', '<svg viewBox="0 0 100 70"><rect x="4" y="4" width="92" height="62" fill="none" stroke="#ccc" stroke-dasharray="5 4"/></svg>') + list.map((ad) => tile(ad.id, ad.name || ad.id, addonThumb(ad))).join('') + '</div>';
    if (!EMPTY_SLOT.has(cur) && !CP.addons[cur]) h += `<p class="warn">⚠ Add-on "${U.esc(cur)}" is not installed.</p>`;
    const ad = CP.addons[cur]; if (ad && ad.params) { const vals = addonParams(ad, sl.key, P); h += ad.params.filter((pr) => whenOk(pr, vals)).map((pr) => optionField(pr, `${sl.key}.${pr.key}`, vals[pr.key])).join(''); }
    if (!list.length) h += `<p class="muted small">No "${U.esc(sl.kind)}" add-ons installed — add some to plugins/addons.</p>`;
  }
  h += `<h4>Colours</h4><div class="colors">${Object.keys(def.colors).map((k) => `<label>${k}<input type="color" value="${it.colors?.[k] || def.colors[k]}" data-color="${k}"></label>`).join('')}<button data-act="resetcol">Reset</button></div>`;
  h += `<h4>Overall colour</h4>` + field('Colour', `<select data-k="mode">${opts(MODE_OPTS, it.mode || 'auto')}</select>`);
  return h;
}
function arrangeDetails(it) {
  let h = '';
  if (it.group) h += `<p class="muted small">Part of <b>▣ ${U.esc(groupName(it.group))}</b> — you picked just this one.</p><div class="row"><button data-act="selgroup">Select the whole group</button><button data-act="leavegroup">Take out of group</button></div>`;
  h += `<h4>Size and turn</h4>`;
  h += field(`Size <output>${(+it.s).toFixed(2)}</output>`, `<input type="range" min="0.15" max="4" step="0.01" value="${it.s}" data-k="s">`);
  h += field(`Rotate <output>${it.rot || 0}°</output>`, `<input type="range" min="-180" max="180" step="1" value="${it.rot || 0}" data-k="rot">`);
  h += `<div class="row"><button data-act="flip">⇆ Flip</button><button data-act="size1">Standard size (1.00)</button></div>`;
  h += `<h4>Order</h4>${orderRow()}`;
  h += `<h4>Line up</h4>${alignRow('align-page', 'Line up with the page')}`;
  h += `<h4>Actions</h4><div class="row"><button data-act="dup">Duplicate</button><button data-act="lock" title="Ctrl+Shift+L — stops it being selected or moved on the page">🔒 Lock</button><button data-act="zoomsel" title="Zoom in on it">🔍 Zoom to</button><button data-act="del" class="danger">Delete</button></div>`;
  h += `<div class="row"><button data-act="copy" title="Ctrl+C">Copy</button><button data-act="cut" title="Ctrl+X">Cut</button>${copyToField(false)}</div>`;
  return h;
}
function renderInspector() { renderRibbon(); renderDetails(); positionMiniBar(); }
function onInspectorInput(e) {
  const t = e.target;
  if (t.dataset.copyto !== undefined) { if (t.value !== '') copyToPage(+t.value); t.value = ''; return; }
  if (t.dataset.mk || t.dataset.mparam || t.dataset.mcolor) return onMultiInput(t);
  if (t.dataset.gname) { const page = pg(); page.groups = page.groups || {}; page.groups[t.dataset.gname] = { name: t.value }; renderLayers(); commit(false); return; }
  const it = itemById(app.sel[0]); if (!it || (ownerOf(it) || it).locked) return;
  if (t.dataset.k) {
    const k = t.dataset.k; let v = t.value;
    if (k === 's' || k === 'rot' || k === 'look') v = +v;
    if (k === 'cast') { it.cast = v; const c = castById(v); const pr = poseOf(c, c.defaultPose || 'stand'); if (pr && suggestsPose(c)) it.pose = FIG.fromPreset(c, pr); }
    it[k] = v; const out = t.closest('label')?.querySelector('output'); if (out) out.textContent = k === 's' ? (+v).toFixed(2) : v + '°';
  } else if (t.dataset.param) {
    const v = t.dataset.ptype === 'toggle' ? t.checked : t.value;
    it.params = { ...(it.params || {}), [t.dataset.param]: v };
    const out = t.closest('label')?.querySelector('output'); if (out) out.textContent = v;
    // options can depend on each other (when: …), so refresh the panel after a toggle / choice
    if (t.dataset.ptype === 'toggle' || t.tagName === 'SELECT') { scheduleRender(); commit(false); renderInspector(); return; }
  }
  else if (t.dataset.color) { it.colors = { ...(it.colors || {}), [t.dataset.color]: t.value }; }
  else if (t.dataset.detach) { setDetach(it, t.dataset.detach, t.checked); renderInspector(); return; }
  scheduleRender(); renderLayers(); commit(false);
  if (t.dataset.k === 'cast') renderInspector();
}
function onInspectorClick(e) {
  const b = e.target.closest('button'); if (!b) return; const it = itemById(app.sel[0]);
  if (b.dataset.dtab) { app.dtab = b.dataset.dtab; renderDetails(); $(`#dtab-${app.dtab}`)?.focus(); return; }
  if (b.dataset.act && arrangeAction(b.dataset.act)) return;
  if (b.dataset.mpose || b.dataset.mslot || b.dataset.act === 'mresetcol') {
    const ed = movable(selItems());
    if (b.dataset.mpose) { for (const f of ed) if (f.type === 'figure' && castById(f.cast)) { const fc = castById(f.cast); const pr = poseOf(fc, b.dataset.mpose); f.pose = FIG.fromPreset(fc, pr); f.expr = pr.expr || 'happy'; } }
    if (b.dataset.mslot) for (const p of ed) if (p.type === 'prop') p.params = { ...(p.params || {}), [b.dataset.mslot]: b.dataset.addon };
    if (b.dataset.act === 'mresetcol') for (const p of ed) if (p.type === 'prop' && PROP_BY_ID[p.kind]) p.colors = { ...PROP_BY_ID[p.kind].colors };
    renderStage(); renderInspector(); commit(); return;
  }
  if (b.dataset.slot && it) { it.params = { ...(it.params || {}), [b.dataset.slot]: b.dataset.addon }; renderStage(); renderInspector(); commit(); return; }
  if (b.dataset.pose && it) { const c = castById(it.cast); const pr = poseOf(c, b.dataset.pose); it.pose = FIG.fromPreset(c, pr); it.expr = pr.expr || 'happy'; renderStage(); renderInspector(); commit(); return; }
  if (b.dataset.flip && it) { FIG.flipBend(castById(it.cast), it.pose, b.dataset.flip); renderStage(); commit(); return; }
  const a = b.dataset.act; if (!a) return;
  if (a === 'mode-reach' || a === 'mode-rotate') { app.handMode = a.slice(5); renderInspector(); return; }
  if (a === 'del') return deleteSel();
  if (a === 'dup') return duplicateSel();
  if (a === 'copy') return copySel(false);
  if (a === 'cut') return copySel(true);
  if (a === 'paste') return pasteInto();
  if (['front', 'back', 'up', 'down'].includes(a)) return moveZ(app.sel, a);
  if (a === 'flipall') { for (const x of movable(selItems())) x.flip = !x.flip; renderStage(); commit(); return; }
  if (a === 'group') return groupSel();
  if (a === 'ungroup') return ungroupSel();
  if (a === 'lock' || a === 'unlock') return toggleLockSel();
  if (a === 'unlockall') return unlockAll();
  if (a === 'zoomsel') return zoomSel();
  if (!it) return;
  if (a === 'selgroup') return select(expandGroup(it));
  if (a === 'leavegroup') return leaveGroup(it);
  if ((ownerOf(it) || it).locked) return;
  if (a === 'flip') it.flip = !it.flip;
  if (a === 'size1') it.s = 1;
  if (a === 'mirror') { it.pose = FIG.mirror(castById(it.cast), it.pose); it.hairFlip = !it.hairFlip; it.capeFlip = !it.capeFlip; it.look = -(it.look || 0); } // hair, cape and eyes mirror with the pose
  if (a === 'capeflip') it.capeFlip = !it.capeFlip;
  if (a === 'hairflip') it.hairFlip = !it.hairFlip;
  if (a === 'feet') it.pose.feet = { out: 'right', right: 'left', left: 'out' }[it.pose.feet || 'out'];
  if (a === 'resetcol') it.colors = { ...PROP_BY_ID[it.kind].colors };
  if (a === 'design') return openDesigner(it.cast);
  renderStage(); renderInspector(); commit();
}
