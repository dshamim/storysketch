// The ribbon (controls for whatever is selected, under the top bar) and the floating mini bar next to the selection.
// With nothing selected the ribbon shows the page settings (static markup in index.html); the buttons here reuse the Details panel's
// click handling (data-act="…"), so a ribbon button and its Details twin always do the same thing.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- ribbon ----------
const rbIconBtn = (act, icon, tip, kbd) => `<button class="ui-iconbtn" data-act="${act}" data-tip="${tip}"${kbd ? ` data-kbd="${kbd}"` : ''} aria-label="${tip}">${UI.icon(icon)}</button>`;
const rbBtn = (act, icon, label, tip) => `<button class="ui-btn ghost sm" data-act="${act}"${tip ? ` data-tip="${tip}"` : ''}>${UI.icon(icon)}${label}</button>`;
const rbMenuBtn = (menu, icon, label) => `<button class="ui-btn ghost sm" data-rb="${menu}" aria-haspopup="menu" aria-expanded="false">${UI.icon(icon)}${label}${UI.icon('chevron-down', 'sm')}</button>`;
const rbSelect = (attrs, label, optionsHtml) => `<label class="rb"><span class="ui-sr">${label}</span><span class="ui-select"><select ${attrs} aria-label="${label}">${optionsHtml}</select>${UI.icon('chevron-down')}</span></label>`;
const rbSep = '<span class="ui-divider-v"></span>';
const rbRotate = (it) => `<label class="rb rot" data-tip="Turn (degrees)">${UI.icon('rotate')}<input class="ui-input num" type="number" data-rot min="-180" max="180" step="1" value="${it.rot || 0}" aria-label="Turn, in degrees"><span>°</span></label>`;

function ribbonFor(sel) {
  const position = rbMenuBtn('menu-position', 'forward', 'Position');
  if (sel.length > 1) {
    const ed = movable(sel); const lk = !ed.length; const sg = selGroup();
    return (lk ? '<span class="ui-badge warning">Locked</span>' + rbBtn('lock', 'unlock', 'Unlock') :
      rbMenuBtn('menu-align', 'align-left', 'Line up') + rbMenuBtn('menu-distribute', 'distribute-h', 'Space evenly') + rbSep +
      (sg ? rbBtn('ungroup', 'ungroup', 'Ungroup') : rbBtn('group', 'group', 'Group') + (sel.some((i) => i.group) ? rbBtn('ungroup', 'ungroup', 'Ungroup') : '')) +
      rbBtn('lock', 'lock', 'Lock') + rbSep +
      rbSelect('data-mk="mode"', 'Colour', (allSame(ed.map((i) => i.mode || 'auto')) ? '' : '<option value="" selected disabled>Colour: mixed</option>') + opts(MODE_OPTS, allSame(ed.map((i) => i.mode || 'auto')) ? ed[0].mode || 'auto' : null))) + rbSep + position;
  }
  const it = sel[0]; const own = ownerOf(it) || it;
  if (own.locked) return '<span class="ui-badge warning">Locked</span>' + rbBtn('unlock', 'unlock', 'Unlock', 'Ctrl+Shift+L') + rbSep + position;
  if (it.type === 'limbs') return `<span class="ui-muted">Front arms and legs of ${U.esc(itemName(ownerOf(it) || it))}</span>` + rbSep + position;
  const mode = rbSelect('data-k="mode"', 'Colour', opts(MODE_OPTS, it.mode || 'auto'));
  if (it.type === 'figure') {
    const c = castById(it.cast); if (!c) return '<span class="ui-muted">Missing character</span>' + rbSep + position;
    return rbSelect('data-k="expr"', 'Expression', opts(FIG.expressions(c), it.expr)) + rbMenuBtn('pose', 'pose', 'Pose') + rbIconBtn('mirror', 'flip-h', 'Mirror pose') + rbSep + mode + rbSep + position + rbRotate(it);
  }
  const def = PROP_BY_ID[it.kind]; if (!def) return '<span class="ui-muted">Add-on not installed</span>' + rbSep + position;
  const P = { ...propDefaults(def).params, ...(it.params || {}) };
  const main = (def.params || []).find((pr) => pr.type === 'select' && whenOk(pr, P)); // the prop's first choice, if it has one
  return (main ? rbSelect(`data-param="${main.key}"`, main.label, opts(main.options, P[main.key] ?? main.def)) + rbSep : '') + mode + rbIconBtn('flip', 'flip-h', 'Flip') + rbSep + position + rbRotate(it);
}
function renderRibbon() {
  const page = $('#ribbon-page'), el = $('#ribbon-sel'); if (!page || !el) return;
  UI.closePopover(false);
  const sel = selItems(); page.hidden = !!sel.length; el.hidden = !sel.length;
  $('#ribbon').setAttribute('aria-label', sel.length ? 'Selection' : 'Page settings');
  el.innerHTML = sel.length ? ribbonFor(sel) : '';
}
// the Details panel changed a value the ribbon shows
function syncRibbon() { const it = itemById(app.sel[0]); const r = $('#ribbon-sel [data-rot]'); if (r && it && document.activeElement !== r) r.value = it.rot || 0; }

function openRibbonMenu(btn) {
  const m = btn.dataset.rb;
  if (m === 'pose') {
    const it = itemById(app.sel[0]); const c = it && castById(it.cast); if (!c) return;
    $('#pose-grid').innerHTML = posesFor(c).map((p) => `<button class="tile sm" data-pose="${p.id}" title="${U.esc(p.name)}">${figureThumb(c, p.id, false, p.expr)}<span>${U.esc(p.name)}</span></button>`).join('');
    UI.showPopover(btn, $('#pop-pose'), { placement: 'bottom-start', focus: true });
  } else if (m === 'menu-distribute') {
    setItemEnabledIn('#menu-distribute', arrangeUnits().length > 2); UI.showPopover(btn, $('#menu-distribute'));
  } else UI.showPopover(btn, $('#' + m));
}
const setItemEnabledIn = (menu, on) => { for (const b of $$('[data-act]', $(menu))) b.disabled = !on; };

// ---------- mini bar ----------
// A small bar under the selection: Duplicate, Lock, Delete, More. It hides while you drag, sits below (so it never covers the rotate handle)
// and moves above the selection when there is no room below.
function miniBarHTML(key) {
  if (key === 'locked') return rbIconBtn('unlock', 'unlock', 'Unlock', 'Ctrl+Shift+L');
  return rbIconBtn('dup', 'copy', 'Duplicate', 'Ctrl+D') + rbIconBtn('lock', 'lock', 'Lock', 'Ctrl+Shift+L') + rbIconBtn('del', 'delete', 'Delete', 'Del').replace('class="ui-iconbtn"', 'class="ui-iconbtn danger"') +
    `<button class="ui-iconbtn" data-mb="more" data-tip="More" aria-label="More" aria-haspopup="menu" aria-expanded="false">${UI.icon('more')}</button>`;
}
function positionMiniBar() {
  const bar = $('#minibar'); if (!bar) return;
  const sel = selItems();
  if (!sel.length || (app.drag && app.drag.moved) || !$('#start').hidden) { bar.hidden = true; return; }
  const key = sel.length === 1 && (ownerOf(sel[0]) || sel[0]).locked ? 'locked' : sel.length === 1 && sel[0].type === 'limbs' ? 'limbs' : 'normal';
  if (bar.dataset.key !== key) { bar.innerHTML = key === 'limbs' ? '' : miniBarHTML(key); bar.dataset.key = key; }
  if (key === 'limbs') { bar.hidden = true; return; }
  bar.hidden = false;
  const m = $('#stage').getScreenCTM(); if (!m) return;
  const b = boxOfItems(sel); const wrap = $('#stage-wrap').getBoundingClientRect();
  const left = b.x * m.a + m.e - wrap.left, right = (b.x + b.w) * m.a + m.e - wrap.left, top = b.y * m.d + m.f - wrap.top, bottom = (b.y + b.h) * m.d + m.f - wrap.top;
  const w = bar.offsetWidth, h = bar.offsetHeight;
  let y = bottom + 18; if (y + h > wrap.height - 4) y = Math.max(4, top - 54 - h); // no room below: above the rotate handle
  bar.style.left = Math.round(U.clamp((left + right) / 2 - w / 2, 4, Math.max(4, wrap.width - w - 4))) + 'px'; bar.style.top = Math.round(y) + 'px';
}

function initRibbon() {
  const rb = $('#ribbon-sel');
  rb.addEventListener('click', (e) => { const m = e.target.closest('[data-rb]'); if (m) openRibbonMenu(m); else onInspectorClick(e); });
  rb.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-rot]')) { // turning by number: ignore half-typed values, keep the angle in -180…180
      const it = itemById(app.sel[0]); if (!it || (ownerOf(it) || it).locked || t.value === '' || isNaN(+t.value)) return;
      it.rot = Math.round(U.normA(+t.value)); scheduleRender(); commit(false); if (detailsOpen()) renderDetails(); return;
    }
    onInspectorInput(e); if (detailsOpen()) renderDetails();
  });
  $('#pop-pose').addEventListener('click', (e) => { if (e.target.closest('[data-pose]')) { onInspectorClick(e); UI.closePopover(false); } });
  $('#menu-distribute').addEventListener('ui-open', () => setItemEnabledIn('#menu-distribute', arrangeUnits().length > 2));
  const bar = $('#minibar');
  bar.addEventListener('click', (e) => { const m = e.target.closest('[data-mb]'); if (m) UI.showPopover(m, $('#menu-more'), { placement: 'bottom-start' }); else onInspectorClick(e); });
}
