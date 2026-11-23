// Search everything (Ctrl/Cmd+K) and the keyboard shortcut sheet (?).
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- shortcut sheet ----------
// One table: the sheet is drawn from it, and tests/e2e/palette.test.mjs presses the keys marked with `test` to prove each line is true.
// Mouse and touch ways are listed too, because a shortcut is only one way of doing a thing.
const SHORTCUTS = [
  { title: 'Add things', rows: [
    ['T', 'Text: click the page to type, or drag a box'], ['R', 'Box'], ['O', 'Circle'], ['Y', 'Triangle'], ['L', 'Line'], ['A', 'Arrow'], ['Shift+A', 'Double arrow'],
    ['Esc', 'Stop drawing'], ['/', 'Search the library panel'], ['Ctrl+K', 'Search everything: actions, characters, props, styles, samples'],
  ] },
  { title: 'Pick and move', rows: [
    ['V', 'Select (put the drawing tool away)'], ['Click', 'Pick one thing'], ['Shift+Click · Ctrl+Click', 'Add to / remove from the picked things'], ['Drag on empty page', 'Pick everything inside a box'],
    ['Ctrl+A', 'Pick everything'], ['Alt+Click', 'Pick through things stacked on top of each other'], ['Esc', 'Pick nothing'],
    ['Arrow keys', 'Move 1 pixel (Shift: 10)'], ['Alt+Drag', 'Move without snapping'], ['Shift+Drag a handle', 'Keep the shape (square, straight line, same proportions)'],
  ] },
  { title: 'Change things', rows: [
    ['Double-click · Enter · F2', 'Type inside a text or a shape'], ['H', 'Flip'], ['Ctrl+D', 'Duplicate'], ['Ctrl+C / Ctrl+X / Ctrl+V', 'Copy, cut, paste'], ['Delete · Backspace', 'Delete'],
    ['[  ]', 'Send back / bring forward (Shift: all the way)'], ['Ctrl+G · Ctrl+Shift+G', 'Group · ungroup'], ['Ctrl+Shift+L', 'Lock / unlock'], ['Double-press an elbow or knee dot', 'Bend it the other way'],
  ] },
  { title: 'Undo and the page', rows: [
    ['Ctrl+Z', 'Undo'], ['Ctrl+Y · Ctrl+Shift+Z', 'Redo'], ['Page Up · Page Down', 'Previous · next page'], ['P', 'Show or hide the drawing style'],
    ['Ctrl+= · Ctrl+−', 'Zoom in · out'], ['Ctrl+0 · Shift+1', 'Fit the whole page'], ['Shift+2', 'Zoom to what is picked'], ['Space+Drag', 'Move the page around'],
  ] },
  { title: 'Files', rows: [['Ctrl+S', 'Save'], ['Ctrl+Shift+S', 'Save as'], ['Ctrl+O', 'Open'], ['?', 'This list']] },
  { title: 'On a tablet', rows: [
    ['Pinch · two fingers', 'Zoom and move the page'], ['Long-press', 'Open the menu of what you pressed'], ['Tool bar', 'Select, Hand, Text, Shapes, Several (pick more than one)'], ['Double-tap', 'Type inside a text or a shape'],
  ] },
];
// "Ctrl+Shift+Z" -> three key caps; words like "Click" or "Drag" stay plain text; " · " and " / " separate alternatives
const PLAIN = /^(Click|Drag|Double|Pinch|Long|Tool|two|Arrow keys)/;
const keyCaps = (keys) => keys.split(/( · | \/ )/).map((part) => /^( · | \/ )$/.test(part) ? `<span class="muted">${part.trim()}</span>` : `<span class="${part.split('+').some((k) => PLAIN.test(k.trim())) ? '' : 'kk'}">${part.split('+').map((k) => PLAIN.test(k.trim()) ? U.esc(k.trim()) : `<kbd class="ui-kbd">${U.esc(k.trim())}</kbd>`).join('+')}</span>`).join(' ');
function renderShortcuts() {
  $('#shortcuts-body').innerHTML = SHORTCUTS.map((g) => `<section><h3 class="sh">${U.esc(g.title)}</h3><dl>${g.rows.map(([k, d]) => `<div class="sc-row"><dt>${keyCaps(k)}</dt><dd>${U.esc(d)}</dd></div>`).join('')}</dl></section>`).join('');
}

// ---------- the two overlays ----------
let overlayFrom = null;
function openOverlay(el, focusEl) {
  if (el.id === 'palette') closeOverlay('shortcuts'); else closeOverlay('palette');
  overlayFrom = document.activeElement; el.hidden = false; UI.closePopover(false); (focusEl || el).focus();
}
function closeOverlay(which) {
  const el = $('#' + which); if (!el || el.hidden) return; if (el.contains(document.activeElement)) document.activeElement.blur(); el.hidden = true; // (a hidden element can keep the focus for a moment, so let go of it explicitly)
  const back = overlayFrom; overlayFrom = null; return back;
}
const overlayOpen = () => !$('#palette').hidden || !$('#shortcuts').hidden;
function giveFocusBack(back) { if (back && document.contains(back) && (document.activeElement === document.body || !document.activeElement)) back.focus({ preventScroll: true }); }

function openShortcuts() { renderShortcuts(); openOverlay($('#shortcuts'), $('#shortcuts-close')); hintDone('search'); }
function closeShortcuts() { giveFocusBack(closeOverlay('shortcuts')); }

// ---------- search everything ----------
const RECENT_KEY = 'storysketch/recent';
const recentIds = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; } };
function rememberCommand(id) { try { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...recentIds().filter((x) => x !== id)].slice(0, 8))); } catch (e) { /* ignore */ } }

/** Everything the palette can do, built fresh each time it opens (so new characters, pages and styles are always there). */
function paletteCommands() {
  // the menus only refresh their greyed-out items and ticks when they OPEN, so refresh them now, or the list would show how they were last time
  for (const m of ['#menu-file', '#menu-edit', '#menu-view', '#menu-page', '#menu-position', '#menu-help']) $(m)?.dispatchEvent(new CustomEvent('ui-open', { detail: {} }));
  const cmds = [];
  const add = (group, id, label, run, o = {}) => cmds.push({ group, id, label, run, kbd: o.kbd || '', words: o.words || '', checked: o.checked ?? null, enabled: o.enabled !== false });
  // the menus are the list of actions (so a new menu item shows up here by itself, with its shortcut and its on / off state)
  const hasSel = app.sel.length > 0;
  for (const [menu, group] of [['#menu-file', 'File'], ['#menu-edit', 'Edit'], ['#menu-view', 'View'], ['#menu-page', 'Page'], ['#menu-position', 'Arrange'], ['#menu-help', 'Help']]) {
    for (const b of $$('[data-act]', $(menu))) {
      const act = b.dataset.act; if (!ACTIONS[act] || b.hidden || act === 'palette') continue; if (group === 'Arrange' && !hasSel) continue; // ('palette' = this very box)
      const label = ($('.grow', b) || b).textContent.trim(); const kbd = ($('kbd', b) || {}).textContent || '';
      add(group, 'act:' + act, label.replace(/…$/, ''), () => ACTIONS[act](), { kbd, checked: b.getAttribute('role') === 'menuitemcheckbox' ? b.getAttribute('aria-checked') === 'true' : null, enabled: !b.disabled && b.getAttribute('aria-disabled') !== 'true', words: group });
    }
  }
  const tool = (id, label, kbd, t) => add('Tools', 'tool:' + id, label, () => setTool(t), { kbd, words: 'draw tool' });
  tool('select', 'Select', 'V', null); tool('text', 'Text tool', 'T', 'text'); tool('box', 'Draw a box', 'R', 'box'); tool('circle', 'Draw a circle', 'O', 'circle'); tool('triangle', 'Draw a triangle', 'Y', 'triangle');
  tool('line', 'Draw a line', 'L', 'line'); tool('arrow', 'Draw an arrow', 'A', 'arrow'); tool('double', 'Draw a double arrow', 'Shift+A', 'double'); tool('hand', 'Hand tool (move the page around)', '', 'hand');
  for (const [tab, name] of [['tab-cast', 'Characters'], ['tab-props', 'Props'], ['tab-shapes', 'Shapes'], ['tab-text', 'Text'], ['tab-layers', 'Layers'], ['tab-addons', 'Add-ons']]) add('Panels', 'panel:' + tab, 'Open ' + name, () => { setTab(tab); showFlyout(); }, { words: 'panel library' });
  const fig = app.sel.length === 1 && itemById(app.sel[0])?.type === 'figure' ? itemById(app.sel[0]) : null;
  if (fig) add('Characters', 'edit-character', 'Edit this character', () => openDesigner(fig.cast), { words: 'designer look hair clothes colour' });
  add('Characters', 'new-character', 'New character', () => newCharacter(), { words: 'create designer' });
  for (const c of app.P.cast) add('Characters', 'cast:' + c.id, 'Add character: ' + c.name, () => addFigure(c.id), { words: 'person animal figure' });
  for (const c of CP.characters.filter((x) => !castById(x.id))) add('Characters', 'lib:' + c.id, 'Add character: ' + c.name, () => addFromLibrary(c.id), { words: 'library person animal figure' });
  for (const p of PROPS) add('Props', 'prop:' + p.id, 'Add prop: ' + (p.name || p.id), () => addProp(p.id), { words: (p.pack || '') + ' picture object ' + (p.tags || []).join(' ') });
  for (const k of Object.keys(SHP.KINDS)) add('Shapes', 'shape:' + k, 'Add a ' + SHP.KINDS[k].name.toLowerCase(), () => addShape(k), { words: 'shape drop' });
  for (const k of Object.keys(SHP.LINES)) add('Shapes', 'shape:' + k, 'Add a ' + SHP.LINES[k].name.toLowerCase(), () => addShape(k), { words: 'shape line arrow drop' });
  const txt = app.sel.length === 1 && isText(itemById(app.sel[0])) ? itemById(app.sel[0]) : null;
  if (txt) for (const f of fontChoices()) add('Text', 'font:' + f.id, 'Font: ' + f.name, () => { setTextProp(txt, 'font', f.id); renderInspector(); renderRibbon(); }, { checked: (txt.font || 'hand') === f.id, words: 'typeface letters writing ' + (f.kind || '') });
  for (const t of TXT.PRESETS) add('Text', 'text:' + t.id, 'Add text: ' + t.name, () => addText(t), { words: 'words label' });
  for (const s of RENDER.styleList()) add('Style', 'style:' + s.id, 'Drawing style: ' + (s.name || s.id), () => { setStyle(s.id); syncStyleControls(); }, { checked: curStyle() === s.id, words: 'look' });
  for (const p of CP.projects) add('Samples', 'sample:' + p.id, 'Open sample: ' + p.name, () => startProject('project:' + p.id), { words: p.description || '' });
  app.P.pages.forEach((p, i) => add('Pages', 'page:' + p.id, `Go to page ${i + 1}${p.name ? ': ' + p.name : ''}`, () => goPage(i), { words: 'page' }));
  return cmds;
}
/** How well a command matches the words typed: 0 = not at all. Every word must match somewhere. */
function paletteScore(cmd, words) {
  const label = cmd.label.toLowerCase(); const hay = (cmd.label + ' ' + cmd.words + ' ' + cmd.group).toLowerCase(); let total = 0;
  for (const w of words) {
    let s = 0; const at = label.indexOf(w);
    if (label.startsWith(w)) s = 100; else if (at > 0 && /[\s:(-]/.test(label[at - 1])) s = 80; else if (at >= 0) s = 60; else if (hay.includes(w)) s = 40;
    else { let i = 0; for (const ch of label) if (ch === w[i]) i++; if (i === w.length && w.length > 2) s = 20; }
    if (!s) return 0; total += s;
  }
  return total - label.length * 0.01;
}
let pal = { all: [], shown: [], active: 0 };
function paletteResults(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) { // nothing typed: what you used last, then a few good starting points
    const byId = new Map(pal.all.map((c) => [c.id, c])); const recent = recentIds().map((id) => byId.get(id)).filter(Boolean).map((c) => ({ ...c, group: 'Recent' }));
    const start = ['act:undo', 'act:export', 'tool:text', 'act:preview', 'act:shortcuts'].map((id) => byId.get(id)).filter((c) => c && !recent.some((r) => r.id === c.id)).map((c) => ({ ...c, group: recent.length ? 'Suggestions' : 'Try' }));
    return [...recent, ...start];
  }
  return pal.all.map((c) => [c, paletteScore(c, words)]).filter(([, s]) => s > 0).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([c]) => c);
}
function renderPalette() {
  const q = $('#pal-input').value; pal.shown = paletteResults(q); pal.active = Math.min(pal.active, Math.max(0, pal.shown.length - 1));
  let html = '', last = '';
  pal.shown.forEach((c, i) => {
    if (c.group !== last) { html += `<li role="presentation" class="pal-group">${U.esc(c.group)}</li>`; last = c.group; }
    html += `<li role="option" id="pal-o-${i}" class="pal-opt${i === pal.active ? ' on' : ''}${c.enabled ? '' : ' off'}" aria-selected="${i === pal.active}" aria-disabled="${!c.enabled}" data-i="${i}">` +
      `<span class="pal-tick">${c.checked === null ? '' : c.checked ? UI.icon('check', 'sm') : ''}</span><span class="pal-label">${U.esc(c.label)}</span>` + (c.kbd ? `<span class="pal-kbd">${keyCaps(c.kbd)}</span>` : '') + '</li>';
  });
  $('#pal-list').innerHTML = pal.shown.length ? html : '<li role="presentation" class="pal-none">Nothing matches. Try another word: a character, a prop, a style, or something to do.</li>';
  const input = $('#pal-input'); if (pal.shown.length) input.setAttribute('aria-activedescendant', 'pal-o-' + pal.active); else input.removeAttribute('aria-activedescendant');
  $('#pal-status').textContent = pal.shown.length ? `${pal.shown.length} result${pal.shown.length === 1 ? '' : 's'}` : 'No results';
  $('#pal-list .on')?.scrollIntoView({ block: 'nearest' });
}
function openPalette() {
  pal.all = paletteCommands(); pal.active = 0; $('#pal-input').value = ''; openOverlay($('#palette'), $('#pal-input')); renderPalette(); hintDone('search');
}
function closePalette() { giveFocusBack(closeOverlay('palette')); }
function runPalette(i) {
  const c = pal.shown[i]; if (!c || !c.enabled) return; const back = closeOverlay('palette'); rememberCommand(c.id);
  try { c.run(); } catch (e) { toast('That did not work: ' + e.message, { kind: 'error' }); }
  giveFocusBack(back); // unless the command put the focus somewhere itself (a panel, a text box)
}
function onPaletteKey(e) {
  const n = pal.shown.length; const k = e.key;
  if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closePalette(); }
  else if (k === 'ArrowDown') { e.preventDefault(); if (n) { pal.active = (pal.active + 1) % n; renderPalette(); } }
  else if (k === 'ArrowUp') { e.preventDefault(); if (n) { pal.active = (pal.active - 1 + n) % n; renderPalette(); } }
  else if (k === 'Home' && e.ctrlKey) { e.preventDefault(); pal.active = 0; renderPalette(); }
  else if (k === 'End' && e.ctrlKey) { e.preventDefault(); pal.active = Math.max(0, n - 1); renderPalette(); }
  else if (k === 'Enter') { e.preventDefault(); runPalette(pal.active); }
  else if (k === 'Tab') e.preventDefault(); // the box is the only thing to reach: focus stays put
}
function initPalette() {
  $('#pal-input').addEventListener('input', () => { pal.active = 0; renderPalette(); });
  $('#pal-input').addEventListener('keydown', onPaletteKey);
  $('#pal-list').addEventListener('click', (e) => { const o = e.target.closest('[data-i]'); if (o) runPalette(+o.dataset.i); });
  $('#pal-list').addEventListener('pointermove', (e) => { const o = e.target.closest('[data-i]'); if (o && +o.dataset.i !== pal.active) { pal.active = +o.dataset.i; $('#pal-list .on')?.classList.remove('on'); o.classList.add('on'); for (const x of $$('#pal-list [role=option]')) x.setAttribute('aria-selected', String(x === o)); $('#pal-input').setAttribute('aria-activedescendant', o.id); } });
  $('#palette').addEventListener('pointerdown', (e) => { if (e.target === $('#palette')) closePalette(); }); // a tap outside the box
  $('#shortcuts').addEventListener('pointerdown', (e) => { if (e.target === $('#shortcuts')) closeShortcuts(); });
  $('#shortcuts').addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeShortcuts(); } else if (e.key === 'Tab') e.preventDefault(); });
  $('#shortcuts-close').addEventListener('click', closeShortcuts);
  $('#open-palette').addEventListener('click', () => ($('#palette').hidden ? openPalette() : closePalette()));
}
