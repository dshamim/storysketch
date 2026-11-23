// Text: the Text tool (press T, click or drag a box), the presets in the left rail, in-place editing with a drawn caret,
// and setting a text item's properties. The engine (layout, wrapping, caret maths, drawing) is TXT in src/core/text.js.
// Typing goes into a hidden text field (so keyboards, IME and phones work); what you see is always the real drawing.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- text ----------
const isText = (it) => !!it && it.type === 'text';

// ---- creating ----
// a new text is added without an undo step of its own: it becomes one when editing ends (and is dropped if it stays empty)
function addTextItem(it) { it.id = it.id || U.uid(); pg().items.push(it); app.sel = [it.id]; renderStage(); renderLayers(); startEdit(it.id, { all: true, fresh: true }); return it; }
function addText(preset = {}, at) {
  const [x, y] = at || nextSpot(); return addTextItem(TXT.make(preset, x, y));
}
// a new, empty text whose top-left corner is at (left, top); w > 0 makes a wrapping box of that width
function addTextBox(left, top, w = 0) {
  const it = TXT.make({ text: '', size: 48, align: 'left', w }); const b = TXT.box(it);
  it.x = Math.round(left + b.w / 2); it.y = Math.round(top + b.h / 2);
  return addTextItem(it);
}
function setTool(tool) {
  app.tool = tool || null;
  $('#stage').classList.toggle('tool-text', app.tool === 'text'); $('#stage').classList.toggle('tool-draw', isDrawTool(app.tool));
  const b = $('#add-textbox'); if (b) b.setAttribute('aria-pressed', String(app.tool === 'text'));
  for (const t of $$('[data-shape-add]')) t.setAttribute('aria-pressed', String(t.dataset.shapeAdd === app.tool));
  if (app.tool === 'text') toast('Click on the page to type, or drag to draw a box. Esc to cancel.');
  else if (isDrawTool(app.tool)) toast(`Drag on the page to draw a ${(SHP.KINDS[app.tool] || SHP.LINES[app.tool]).name.toLowerCase()}, or just click to drop one. Esc to cancel.`);
}

// ---- properties ----
// the anchor (top edge; left, middle or right by alignment) stays where it is on the page while the box grows or shrinks
function anchorPage(it) { const L = TXT.layout(it); return toPageXY(it, [it.align === 'right' ? L.x0 + L.W : it.align === 'center' ? 0 : L.x0, L.y0]); }
function pinAnchor(it, change) { const a = anchorPage(it); change(); const b = anchorPage(it); it.x = Math.round(it.x + a[0] - b[0]); it.y = Math.round(it.y + a[1] - b[1]); }
const NUMERIC = ['size', 'w', 'lineHeight', 'letterSpacing'];
function setTextProp(it, key, val) {
  if (!isText(it) || it.locked) return;
  if (NUMERIC.includes(key)) { val = +val; if (!Number.isFinite(val)) return; if (key === 'w' && val <= 0) val = 0; else val = key === 'size' || key === 'w' ? Math.round(TXT.clampTo(key, val)) : +TXT.clampTo(key, val).toFixed(2); }
  if (key === 'align') it.align = val; else pinAnchor(it, () => { it[key] = val; });
  scheduleRender(); commit(false); renderOverlay();
}
// controls carry data-text="key" (inputs), data-text-set="key=value", data-text-toggle="weight|underline" or data-text-step="size:4"
function onTextInput(t) {
  const it = itemById(app.sel[0]); if (!isText(it)) return; const k = t.dataset.text;
  if (k === 'w' && t.dataset.auto !== undefined) setTextProp(it, 'w', t.checked ? 0 : Math.round(TXT.box(it).w)); // "fit the box to the text" on / off
  else if (t.type === 'checkbox') setTextProp(it, k, k === 'weight' ? (t.checked ? 'bold' : 'normal') : t.checked);
  else if (NUMERIC.includes(k) && (t.value === '' || isNaN(+t.value))) return;
  else setTextProp(it, k, t.value);
  const out = t.closest('label')?.querySelector('output'); if (out) out.textContent = t.value;
  if (t.closest('#right') && k !== 'text') renderRibbon(); // a change made in Details shows in the ribbon (not while a ribbon popover is being used)
  if (k === 'text' && app.edit && document.activeElement !== $('#text-input')) $('#text-input').value = it.text;
}
function onTextClick(b) {
  const it = itemById(app.sel[0]); if (!isText(it)) return false;
  if (b.dataset.textSet) { const [k, v] = b.dataset.textSet.split('='); setTextProp(it, k, v); }
  else if (b.dataset.textToggle) { const k = b.dataset.textToggle; setTextProp(it, k, k === 'weight' ? (it.weight === 'bold' ? 'normal' : 'bold') : !it[k]); }
  else if (b.dataset.textStep) { const [k, d] = b.dataset.textStep.split(':'); const step = k === 'size' && it.size >= 100 ? 2 * +d : +d; setTextProp(it, k, (+it[k] || TXT.DEFAULTS[k]) + step); }
  else if (b.dataset.textColor) setTextProp(it, 'color', b.dataset.textColor);
  else return false;
  renderInspector(); return true;
}

// ---- editing in place ----
const textField = () => $('#text-input');
function startEdit(id, { all = false, caret = null, fresh = false } = {}) {
  const it = itemById(id); if (!hasWords(it) || it.locked) return;
  if (app.edit && app.edit.id !== id) endEdit();
  const ta = textField(); ta.value = it.text || ''; app.edit = { id, fresh };
  if (!(app.sel.length === 1 && app.sel[0] === id)) select([id]);
  ta.focus({ preventScroll: true });
  const n = ta.value.length; if (all) ta.setSelectionRange(0, n); else { const c = caret == null ? n : Math.max(0, Math.min(n, caret)); ta.setSelectionRange(c, c); }
  renderOverlay(); renderInspector();
}
function endEdit() {
  if (!app.edit) return; const { id, fresh } = app.edit; app.edit = null; textField().blur();
  const it = itemById(id);
  if (it && isText(it) && !String(it.text).trim()) { pg().items = pg().items.filter((i) => i.id !== id); tidyGroups(); app.sel = app.sel.filter((s) => s !== id); renderStage(); renderLayers(); renderInspector(); if (!fresh) commit(); return; }
  flushCommit(); commit(); renderOverlay(); renderInspector();
}
// a click or drag inside the text being edited moves the caret / selects letters
function textCaretAt(e) {
  const it = itemById(app.edit.id); const L = toLocal(it, toPage(e)); const v = editView(it); return TXT.indexAt(TXT.layout(v.item), L[0], L[1] - v.dy);
}
function overTextBeingEdited(e) {
  if (!app.edit) return false; const it = itemById(app.edit.id); if (!it) return false;
  const L = toLocal(it, toPage(e)); const b = isShape(it) ? SHP.box(it) : TXT.box(it); const pad = 10 / (zoom() * it.s);
  return L[0] >= b.x0 - pad && L[0] <= b.x1 + pad && L[1] >= b.y0 - pad && L[1] <= b.y1 + pad;
}
// the caret and the selection, drawn in the text's own coordinates (inside the item's transform)
function textEditOverlay(it, k) {
  const v = editView(it); const L = TXT.layout(v.item); const ta = textField(); const a = ta.selectionStart, b = ta.selectionEnd; let s = '';
  if (a !== b) {
    for (const l of L.lines) {
      const from = Math.max(a, l.i0), to = Math.min(b, l.i1); if (to <= from && !(a <= l.i1 && b > l.i1 && l.i0 === l.i1)) continue;
      const x0 = l.xs[from - l.i0], x1 = l.xs[Math.max(from, to) - l.i0] + (b > l.i1 ? L.size * 0.25 : 0); // a selected line break shows a little extra
      s += `<rect x="${x0}" y="${l.y}" width="${Math.max(x1 - x0, 2 * k)}" height="${L.size * 1.25}" fill="#5b3df5" fill-opacity="0.28" pointer-events="none"/>`;
    }
  } else { const c = TXT.caret(L, b); s += `<line class="caret" x1="${c.x}" y1="${c.y0}" x2="${c.x}" y2="${c.y1}" stroke="#5b3df5" stroke-width="${3 * k}" pointer-events="none"/>`; }
  return v.dy ? `<g transform="translate(0 ${v.dy})">${s}</g>` : s;
}

function initText() {
  const ta = textField();
  const refresh = () => { if (app.edit) renderOverlay(); };
  ta.addEventListener('input', () => {
    const it = itemById(app.edit?.id); if (!it) return;
    if (isText(it)) pinAnchor(it, () => { it.text = ta.value; }); else it.text = ta.value; scheduleRender(); commit(false); renderOverlay(); renderLayers(); if (detailsOpen()) renderDetails();
  });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); endEdit(); return; }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); endEdit(); return; }
    if (e.key === 'Tab') { e.preventDefault(); return; }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { // the wrapped lines are ours, not the field's, so move by drawn line
      e.preventDefault(); const it = itemById(app.edit.id); const L = TXT.layout(it); const to = TXT.moveLine(L, ta.selectionDirection === 'backward' ? ta.selectionStart : ta.selectionEnd, e.key === 'ArrowUp' ? -1 : 1);
      if (e.shiftKey) { const anchor = ta.selectionDirection === 'backward' ? ta.selectionEnd : ta.selectionStart; ta.setSelectionRange(Math.min(anchor, to), Math.max(anchor, to), to < anchor ? 'backward' : 'forward'); } else ta.setSelectionRange(to, to);
      refresh();
    }
  });
  for (const ev of ['keyup', 'mouseup', 'select']) ta.addEventListener(ev, refresh);
  document.addEventListener('selectionchange', () => { if (document.activeElement === ta) refresh(); });
  ta.addEventListener('blur', () => setTimeout(() => { if (app.edit && document.activeElement !== ta) endEdit(); }, 0));
  $('#add-textbox').onclick = () => setTool(app.tool === 'text' ? null : 'text');
  renderTextPresets();
  $('#text-presets').addEventListener('click', (e) => { const b = e.target.closest('[data-text-preset]'); if (b) { setTool(null); addText(TXT.PRESETS.find((p) => p.id === b.dataset.textPreset)); } });
}
function renderTextPresets() {
  $('#text-presets').innerHTML = TXT.PRESETS.map((p) => `<button class="tile text-preset" data-text-preset="${p.id}" title="Add “${U.esc(p.text)}”">${RENDER.thumb(TXT.prims(TXT.make(p)), {})}<span>${U.esc(p.name)}</span></button>`).join('');
}
