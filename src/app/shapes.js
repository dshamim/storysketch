// Shapes, lines and arrows (the editor side): the Shapes tab, drawing with the mouse (press R O Y L A, then drag), resize and end handles,
// the ribbon and Details controls, and words inside a shape. The engine (outlines, dashes, arrowheads, drag maths) is SHP in src/core/shapes.js.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- shapes ----------
const isShape = (it) => !!it && it.type === 'shape';
const isLine = (it) => !!it && it.type === 'line';
const isDrawTool = (t) => !!t && !!(SHP.KINDS[t] || SHP.LINES[t]);
const hasWords = (it) => isText(it) || isShape(it); // things you can type into
const DRAW_KEYS = { r: 'box', o: 'circle', y: 'triangle', l: 'line', a: 'arrow' }; // Shift+A = double arrow
const TOOL_KEY = { box: 'R', circle: 'O', triangle: 'Y', line: 'L', arrow: 'A', double: 'Shift+A' };
const SHAPE_ICON = { box: 'box', circle: 'circle', triangle: 'triangle', line: 'line', arrow: 'arrow', double: 'double-arrow' };

// ---- the Shapes tab ----
function renderShapeTiles() {
  const tile = (kind, name) => {
    const it = SHP.make(kind, 0, 0, kind === 'box' ? { w: 160, h: 110 } : kind === 'circle' ? { w: 120, h: 120 } : kind === 'triangle' ? { w: 130, h: 115 } : { pts: [[-70, 0], [70, 0]] });
    return `<button class="tile shape-tile" data-shape-add="${kind}" aria-pressed="false" title="Add a ${U.esc(name.toLowerCase())} (key ${TOOL_KEY[kind]}, then drag on the page)">${RENDER.thumb(SHP.prims(it), { pad: 10 })}<span>${U.esc(name)}</span></button>`;
  };
  $('#shape-grid').innerHTML = Object.entries(SHP.KINDS).map(([k, v]) => tile(k, v.name)).join('');
  $('#line-grid').innerHTML = Object.entries(SHP.LINES).map(([k, v]) => tile(k, v.name)).join('');
}
function addShape(kind) { const [x, y] = nextSpot(); setTool(null); const it = SHP.make(kind, x, y); addItem(it); return it; }

// ---- drawing with the mouse: pick a tool (R O Y L A), then drag on the page; a plain click drops a default-sized one ----
function startDraw(P0, e) { return { kind: 'draw', tool: app.tool, P0, c0: [e.clientX, e.clientY], moved: false, it: null }; }
function drawMove(d, P, e) {
  if (!d.it) {
    if (U.len([e.clientX - d.c0[0], e.clientY - d.c0[1]]) < 5) return; // a click, not yet a drag
    d.it = SHP.make(d.tool, d.P0[0], d.P0[1]); d.it.id = U.uid(); pg().items.push(d.it); // no undo step until the mouse is released
  }
  if (isLine(d.it)) SHP.setEnds(d.it, d.P0, e.shiftKey ? SHP.snapAngle(d.P0, P) : P); else Object.assign(d.it, SHP.fromDrag(d.P0, P, e.shiftKey));
  scheduleRender();
}
function drawEnd(d) {
  let it = d.it; if (!it) { it = SHP.make(d.tool, d.P0[0], d.P0[1]); it.id = U.uid(); pg().items.push(it); }
  setTool(null); app.sel = [it.id]; renderStage(); renderLayers(); renderInspector(); commit();
}
// dragging a handle: resize a shape from a side or corner ('sh-se'), or move one end of a line ('le-0' / 'le-1')
function startShapeHandle(d, it, kind) {
  if (kind.startsWith('sh-')) d.f = U.clone(it);
  else { const idx = +kind.slice(3); d.idx = idx; d.fixed = SHP.ends(it)[1 - idx]; }
}
function dragShapeHandle(d, P, e) {
  const it = d.it;
  if (d.kind.startsWith('sh-')) Object.assign(it, SHP.resize(d.f, d.kind.slice(3), P, e.shiftKey));
  else { const Q = e.shiftKey ? SHP.snapAngle(d.fixed, P) : P; if (d.idx === 0) SHP.setEnds(it, Q, d.fixed); else SHP.setEnds(it, d.fixed, Q); }
}
// the handles of a selected shape or line, in the item's own frame (k = 1 / on-screen scale)
function shapeHandles(it, k) {
  if (isLine(it)) {
    const [a, b] = SHP.normLine(it).pts; const r = 7 * k;
    return [a, b].map((p, i) => `<circle data-h="le-${i}" cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#fff" stroke="#2563eb" stroke-width="${1.6 * k}" class="h-end"/>`).join('');
  }
  const t = SHP.normShape(it); const hx = t.w / 2, hy = t.h / 2; const hs = 10 * k; let s = '';
  for (const [id, x, y] of [['nw', -hx, -hy], ['ne', hx, -hy], ['se', hx, hy], ['sw', -hx, hy]]) s += `<rect data-h="sh-${id}" x="${x - hs / 2}" y="${y - hs / 2}" width="${hs}" height="${hs}" fill="#fff" stroke="#2563eb" stroke-width="${1.6 * k}" class="h-corner h-${id}"/>`;
  const long = 22 * k, thin = 9 * k;
  for (const [id, x, y, w, h] of [['n', 0, -hy, long, thin], ['s', 0, hy, long, thin], ['w', -hx, 0, thin, long], ['e', hx, 0, thin, long]]) s += `<rect data-h="sh-${id}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="${3 * k}" fill="#fff" stroke="#2563eb" stroke-width="${1.5 * k}" class="h-side h-${id}"/>`;
  return s;
}

// ---- words inside a shape: the text engine, laid out centred in the shape ----
// Both a text item and a shape can be edited in place; this gives the text-like item to lay out and how far down it sits.
const editView = (it) => (isShape(it) ? SHP.textView(it) : { item: it, dy: 0 });

// ---- properties ----
const SHAPE_NUM = ['w', 'h', 'width', 'radius', 'opacity', 'textSize'];
function setShapeProp(it, key, val) {
  if (!isFlat(it) || (ownerOf(it) || it).locked) return;
  if (SHAPE_NUM.includes(key)) { val = +val; if (!Number.isFinite(val)) return; val = key === 'opacity' ? +SHP.clampTo(key, val).toFixed(2) : Math.round(SHP.clampTo(key, val)); }
  it[key] = val; scheduleRender(); commit(false); renderOverlay(); if (key === 'start' || key === 'end') renderLayers(); // the layer name follows the arrowheads
}
const isFlat = (it) => isShape(it) || isLine(it);
// controls carry data-shape="key"; buttons data-shape-step="width:1" / data-shape-set="key=value" / data-shape-color="key=#rrggbb"
function onShapeInput(t) {
  const it = itemById(app.sel[0]); if (!isFlat(it)) return; const k = t.dataset.shape;
  if (SHAPE_NUM.includes(k) && (t.value === '' || isNaN(+t.value))) return;
  setShapeProp(it, k, t.value);
  const out = t.closest('label')?.querySelector('output'); if (out) out.textContent = t.value;
  if (k === 'text' && app.edit && document.activeElement !== textField()) textField().value = it.text;
  if (k === 'fill' || (t.closest('#right') && k !== 'text')) renderRibbon(); // a change made in Details shows in the ribbon (not while a ribbon popover is being used)
  if (k === 'fill' && detailsOpen()) renderDetails();
}
function onShapeClick(b) {
  const it = itemById(app.sel[0]); if (!isFlat(it)) return false;
  if (b.dataset.shapeStep) { const [k, d] = b.dataset.shapeStep.split(':'); setShapeProp(it, k, (+it[k] || 0) + +d); }
  else if (b.dataset.shapeSet) { const [k, v] = b.dataset.shapeSet.split('='); setShapeProp(it, k, v); }
  else if (b.dataset.shapeColor) { const [k, v] = b.dataset.shapeColor.split('='); setShapeProp(it, k, v); }
  else return false;
  renderInspector(); return true;
}

// ---- the ribbon and Details ----
const colorWell = (key, label, v) => `<label class="rb" data-tip="${label}"><input type="color" class="rb-color" data-shape="${key}" value="${v}" aria-label="${label}"></label>`;
const widthStepper = (t) => `<span class="rb-size" data-tip="Line thickness"><button class="ui-iconbtn sm" data-shape-step="width:-1" aria-label="Thinner">${UI.icon('remove')}</button><input class="ui-input num" type="number" data-shape="width" min="0" max="40" step="1" value="${t.width}" aria-label="Line thickness"><button class="ui-iconbtn sm" data-shape-step="width:1" aria-label="Thicker">${UI.icon('add')}</button></span>`;
function shapeRibbon(it) {
  const t = SHP.normShape(it);
  return rbSelect('data-shape="fill"', 'Fill', opts(SHP.FILLS, t.fill)) + (t.fill !== 'none' ? colorWell('fillColor', 'Fill colour', t.fillColor) : '') + rbSep +
    colorWell('stroke', 'Outline colour', t.stroke) + widthStepper(t) + rbSelect('data-shape="dash"', 'Line style', opts(SHP.DASHES, t.dash));
}
function lineRibbon(it) {
  const t = SHP.normLine(it); const ends = { none: 'No arrowhead', arrow: 'Arrowhead' };
  return colorWell('stroke', 'Line colour', t.stroke) + widthStepper(t) + rbSelect('data-shape="dash"', 'Line style', opts(SHP.DASHES, t.dash)) + rbSep +
    rbSelect('data-shape="start"', 'Start of the line', opts(ends, t.start)) + rbSelect('data-shape="end"', 'End of the line', opts(ends, t.end));
}
const swatchField = (label, key, v) => field(label, `<span class="cf"><input type="color" data-shape="${key}" value="${v}"><span class="sw">${SWATCHES.map((c) => `<button style="background:${c}" data-shape-color="${key}=${c}" title="${c}" aria-label="${c}"></button>`).join('')}</span></span>`);
const rangeField = (label, key, v, min, max, step = 1) => field(`${label} <output>${v}</output>`, `<input type="range" min="${min}" max="${max}" step="${step}" data-shape="${key}" value="${Math.min(max, v)}">`);
function shapeLook(it) {
  const t = SHP.normShape(it);
  return field('Fill', `<select data-shape="fill">${opts(SHP.FILLS, t.fill)}</select>`) +
    (t.fill !== 'none' ? swatchField('Fill colour', 'fillColor', t.fillColor) : '') + (t.fill === 'solid' ? '<p class="muted small">Solid hides whatever is behind it.</p>' : '') +
    swatchField('Outline colour', 'stroke', t.stroke) + rangeField('Outline thickness', 'width', t.width, 0, 30) +
    field('Line style', `<select data-shape="dash">${opts(SHP.DASHES, t.dash)}</select>`) +
    (t.shape === 'box' ? rangeField('Rounded corners', 'radius', t.radius, 0, 100) : '') +
    rangeField('See-through', 'opacity', t.opacity, 0.1, 1, 0.05) +
    `<h4>Size</h4>` + rangeField('Width', 'w', t.w, 12, 1000) + rangeField('Height', 'h', t.h, 12, 1000) +
    `<h4>Words inside</h4>` + field('Words', `<textarea rows="2" data-shape="text" placeholder="Double-click the shape to type in it">${U.esc(t.text)}</textarea>`) +
    swatchField('Word colour', 'textColor', t.textColor) + rangeField('Word size', 'textSize', t.textSize, 12, 200) +
    `<h4>Overall colour</h4>` + field('Colour', `<select data-k="mode">${opts(MODE_OPTS, it.mode || 'auto')}</select>`);
}
function lineLook(it) {
  const t = SHP.normLine(it); const ends = { none: 'Nothing', arrow: 'Arrowhead' };
  return swatchField('Colour', 'stroke', t.stroke) + rangeField('Thickness', 'width', t.width, 1, 30) +
    field('Line style', `<select data-shape="dash">${opts(SHP.DASHES, t.dash)}</select>`) +
    field('Start of the line', `<select data-shape="start">${opts(ends, t.start)}</select>`) + field('End of the line', `<select data-shape="end">${opts(ends, t.end)}</select>`) +
    rangeField('See-through', 'opacity', t.opacity, 0.1, 1, 0.05) +
    `<p class="muted small">Drag the round handle at either end to change its length and direction. Hold Shift to keep it straight.</p>` +
    `<h4>Overall colour</h4>` + field('Colour', `<select data-k="mode">${opts(MODE_OPTS, it.mode || 'auto')}</select>`);
}

function initShapes() {
  renderShapeTiles();
  $('#tab-shapes').addEventListener('click', (e) => { const b = e.target.closest('[data-shape-add]'); if (b) addShape(b.dataset.shapeAdd); });
}
