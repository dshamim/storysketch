// Text engine: handwriting text as an ordinary item (type "text"). Pure functions, no DOM.
//   TXT.layout(item)  -> where every line and letter goes (word wrap, newlines, alignment, letter spacing)
//   TXT.prims(item)   -> drawing primitives (so every style can draw it, and export keeps it as outlines)
//   TXT.box(item)     -> the box around the text, in the item's own units, centred on the item's origin
//   TXT.caret / TXT.indexAt -> between-letter positions for the editing caret and for clicking into the text
// The letters come from the single-stroke alphabet (GLYPH in draw.js) when `font` is "hand", or from a font plugin's outlines (FONTS in fonts.js) when `font` is its id;
// a font drawn from outlines gives filled letters (so every style can finish them), a character the font lacks is drawn in the handwriting letter, and an unknown font id is "hand".
const TXT = (() => {
  const DEFAULTS = { text: '', font: 'hand', size: 48, color: '#2a2a2a', weight: 'normal', align: 'left', w: 0, lineHeight: 1.5, letterSpacing: 0, underline: false, colors: 'one' };
  const PALETTE = ['#e0402f', '#ef7d10', '#b88a00', '#2e9e44', '#2f6fd6', '#7b3fbf']; // "rainbow" / "each line"
  const LIMITS = { size: [8, 400], lineHeight: [1, 3], letterSpacing: [-0.1, 1], w: [20, 4000] };
  const PRESETS = [
    { id: 'title', name: 'Title', text: 'Title', size: 96, weight: 'bold', align: 'center' },
    { id: 'heading', name: 'Heading', text: 'Heading', size: 64, weight: 'bold', align: 'center' },
    { id: 'body', name: 'Body text', text: 'Body text', size: 40, align: 'left' },
    { id: 'caption', name: 'Caption', text: 'Caption', size: 28, align: 'left' },
    { id: 'numbers', name: 'Number line', text: '1 2 3 4 5 6 7 8 9 10', size: 56, align: 'center', colors: 'rainbow' },
  ];
  const norm = (it) => ({ ...DEFAULTS, ...it });
  const clampTo = (k, v) => { const [a, b] = LIMITS[k]; return Math.min(b, Math.max(a, +v)); };
  const BOLD = 1.7; // line weight of bold text
  /** The font plugin that draws this item, or null for the handwriting alphabet ("hand", or a font that is not installed). */
  const fontOf = (it) => (it.font && it.font !== 'hand' && FONTS.get(it.font)) || null;
  const lineWeight = (it) => Math.max(3, it.size * 0.09 * (it.weight === 'bold' ? BOLD : 1));

  /** Lay the text out. Local units; the box is centred on (0, 0). */
  function layout(item) {
    const it = norm(item); const size = Math.max(4, +it.size || 48); const sp = +it.letterSpacing || 0; const maxW = it.w > 0 ? +it.w : Infinity;
    const pitch = size * (+it.lineHeight || 1.5); const lines = []; let ps = 0; // ps = index of the paragraph's first letter in the whole text
    const str = String(it.text);
    for (const para of str.split('\n')) {
      const font = fontOf(it); const wd = font ? false : GLYPH.wordyOf(para);
      const adv = font ? FONTS.advances(para, font.id, it.weight, size, sp, (ch) => GLYPH.advances(ch, size, sp, false)[0]) : GLYPH.advances(para, size, sp, wd);
      const push = (a, b) => { // letters a..b of this paragraph
        const lineAdv = adv.slice(a, b); let trail = 0; for (let j = b - 1; j >= a && para[j] === ' '; j--) trail += adv[j];
        lines.push({ i0: ps + a, i1: ps + b, adv: lineAdv, w: lineAdv.reduce((n, v) => n + v, 0) - trail, wd, para: ps + para.length });
      };
      if (!para.length) push(0, 0);
      else {
        let ls = 0, acc = 0, trail = 0, lastBreak = -1;
        for (let i = 0; i < para.length; i++) {
          const ch = para[i];
          acc += adv[i]; trail = ch === ' ' ? trail + adv[i] : 0;
          if (ch === ' ') { lastBreak = i + 1; continue; }
          if (acc - trail > maxW && i > ls) { // too wide: break after the last space, or in the middle of a long word
            const at = lastBreak > ls ? lastBreak : i; push(ls, at); ls = at; lastBreak = -1;
            acc = 0; trail = 0; for (let j = ls; j <= i; j++) { acc += adv[j]; trail = para[j] === ' ' ? trail + adv[j] : 0; }
          }
        }
        push(ls, para.length);
      }
      ps += para.length + 1;
    }
    const natural = Math.max(...lines.map((l) => l.w), 0);
    const W = Number.isFinite(maxW) ? maxW : Math.max(natural, size * 0.4); const H = (lines.length - 1) * pitch + size * 1.3;
    const x0 = -W / 2, y0 = -H / 2;
    lines.forEach((l, k) => {
      l.y = y0 + k * pitch; l.x = it.align === 'right' ? x0 + W - l.w : it.align === 'center' ? -l.w / 2 : x0;
      l.xs = [l.x]; for (const a of l.adv) l.xs.push(Math.min(l.x + l.w, l.xs[l.xs.length - 1] + a)); // x of every gap between letters (spaces hanging off the end stay put)
    });
    return { lines, W, H, x0, y0, pitch, size, text: str };
  }
  const box = (item) => { const L = layout(item); return { x0: L.x0, y0: L.y0, x1: L.x0 + L.W, y1: L.y0 + L.H, w: L.W, h: L.H }; };

  /** Drawing primitives for the text. */
  function prims(item) {
    const it = norm(item); const L = layout(it); const pen = new Pen({}); const w = lineWeight(it); const sp = +it.letterSpacing || 0; const font = fontOf(it);
    L.lines.forEach((l, k) => {
      const stroke = it.colors === 'lines' ? PALETTE[k % PALETTE.length] : it.color;
      const text = L.text.slice(l.i0, l.i1);
      if (font) { // outlines: one filled shape per letter, standing on the baseline; letters the font lacks are drawn in the handwriting alphabet
        const base = l.y + L.size; let n = 0;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i], nc = FONTS.norm(ch); if (nc === ' ' || nc === '') continue; const x = l.xs[i], fill = it.colors === 'rainbow' ? PALETTE[n++ % PALETTE.length] : stroke;
          const g = FONTS.glyph(font.id, it.weight, ch, L.size, x, base);
          if (g) pen.path(g.pts, { closed: true, stroke: false, w: 0, fill, more: g.more, glyph: true });
          else pen.text(ch, x, l.y, L.size, { align: 'left', stroke: fill, w, spacing: 0, wordy: false });
        }
      } else if (text.trim()) pen.text(text, l.x, l.y, L.size, { align: 'left', stroke, strokes: it.colors === 'rainbow' ? PALETTE : null, w, spacing: sp, wordy: l.wd });
      if (it.underline && l.w > 0) pen.line([[l.x, l.y + L.size * (font ? 1.2 : 1.12)], [l.x + l.w, l.y + L.size * (font ? 1.2 : 1.12)]], { stroke, w: font ? Math.max(2, L.size * 0.06) : w * 0.8 });
    });
    return pen.o;
  }

  /** Where the caret sits for letter index `i` (0 = before the first letter). */
  function caret(L, i) {
    i = Math.max(0, Math.min(L.text.length, i)); let k = 0;
    for (let j = 0; j < L.lines.length; j++) if (i >= L.lines[j].i0 && i <= L.lines[j].i1) k = j; // at a wrap point: the start of the next line
    const l = L.lines[k]; return { line: k, x: l.xs[Math.min(l.xs.length - 1, i - l.i0)], y0: l.y, y1: l.y + L.size * 1.25 };
  }
  /** The letter index nearest to a point (local units). */
  function indexAt(L, x, y) {
    const k = Math.max(0, Math.min(L.lines.length - 1, Math.floor((y - L.y0 + L.pitch * 0.15) / L.pitch))); const l = L.lines[k];
    const wrapped = k < L.lines.length - 1 && L.lines[k + 1].i0 === l.i1; // this line continues on the next one: its end is not a place to click
    let max = l.xs.length - 1; if (wrapped) while (max > 0 && L.text[l.i0 + max - 1] === ' ') max--;
    let best = 0; for (let j = 0; j <= max; j++) if (Math.abs(l.xs[j] - x) < Math.abs(l.xs[best] - x)) best = j;
    return l.i0 + best;
  }
  /** Move the caret one visual line up (-1) or down (1), keeping its x as close as possible. */
  function moveLine(L, i, dir) {
    const c = caret(L, i); const k = c.line + dir; if (k < 0) return 0; if (k >= L.lines.length) return L.text.length;
    return indexAt(L, c.x, L.lines[k].y + L.size * 0.5);
  }

  /** A new text item from a preset (or plain options), centred on (x, y). */
  function make(opts = {}, x = 500, y = 375) { const { id, name, ...rest } = opts; return { type: 'text', x, y, s: 1, rot: 0, flip: false, mode: 'auto', ...DEFAULTS, ...rest }; }

  return { DEFAULTS, PALETTE, PRESETS, LIMITS, norm, clampTo, layout, box, prims, caret, indexAt, moveLine, make, lineWeight, fontOf };
})();
