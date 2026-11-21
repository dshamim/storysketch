// Chart add-on: Writing — any words, in crayon / marker handwriting. For the whiteboard, the poster, anything with a "chart" slot.
// Type the text; "|" starts a new line, and long lines wrap by themselves. The letters shrink to fit the board.
// Colours 'a', 'b', 'c' come from the prop's colour slots (the whiteboard's red / blue / green markers) when it has them.
(() => {
  const FALLBACK = { a: '#e53935', b: '#1e88e5', c: '#43a047' };
  const RAINBOW = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa'];
  function wrap(pen, lines, h, maxW) {
    const out = [];
    for (const line of lines) {
      const words = line.split(/\s+/).filter(Boolean); let cur = '';
      if (!words.length) { out.push(''); continue; }
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && pen.textWidth(t, h) > maxW) { out.push(cur); cur = w; } else cur = t; }
      out.push(cur);
    }
    return out;
  }
  CP.register({
    api: 1, version: '1.0.0',
    type: 'addon', kind: 'chart', id: 'writing', name: 'Writing (type any text)', order: 0,
    params: [
      { key: 'text', label: 'Text (| = new line)', type: 'text', def: 'Art Day!|Today we will paint, draw and make.' },
      { key: 'size', label: 'Letter size (biggest)', type: 'range', min: 12, max: 120, step: 2, def: 48 },
      { key: 'colour', label: 'Colours', type: 'select', def: 'lines', options: { one: 'One colour (blue)', black: 'Black', lines: 'A colour for each line', rainbow: 'Rainbow letters' } },
      { key: 'align', label: 'Line up', type: 'select', def: 'centre', options: { centre: 'In the middle', left: 'On the left' } },
      { key: 'title', label: 'Underline the first line', type: 'toggle', def: true },
      { key: 'ruled', label: 'Handwriting lines', type: 'toggle', def: false },
    ],
    draw(pen, b, a) {
      const P = a.params || {}, col = (k) => (pen.c && pen.c[k] ? k : FALLBACK[k]);
      const raw = String(P.text ?? '').split('|').map((s) => s.trim());
      const pad = Math.min(b.w, b.h) * 0.04, W = b.w - 2 * pad, H = b.h - 2 * pad;
      let h = +P.size || 48, lines = raw;
      for (let i = 0; i < 40; i++) { // shrink until it fits
        lines = wrap(pen, raw, h, W);
        const tall = lines.length * h * 1.5 - h * 0.2, wide = Math.max(0, ...lines.map((l) => pen.textWidth(l, h)));
        if ((tall <= H && wide <= W) || h < 8) break;
        h *= 0.92;
      }
      const block = lines.length * h * 1.5 - h * 0.2, y0 = b.y + pad + Math.max(0, (H - block) / 2);
      const left = P.align === 'left', x = left ? b.x + pad : b.cx;
      const lineCols = [col('b'), col('a'), col('c')];
      const w = Math.max(2.2, h * 0.085);
      lines.forEach((ln, i) => {
        const y = y0 + i * h * 1.5;
        if (P.ruled) pen.line([[b.x + pad, y + h], [b.x + b.w - pad, y + h]], { stroke: '#b0bec5', w: 1.5 });
        const o = { w, align: left ? 'left' : 'centre' };
        if (P.colour === 'rainbow') o.strokes = RAINBOW; else o.stroke = P.colour === 'black' ? '#37474f' : P.colour === 'one' ? col('b') : lineCols[i % 3];
        pen.text(ln, x, y, h, o);
        if (i === 0 && P.title !== false && ln) {
          const tw = pen.textWidth(ln, h), x0 = left ? x : x - tw / 2;
          pen.curve([[x0, y + h * 1.18], [x0 + tw * 0.5, y + h * 1.13], [x0 + tw, y + h * 1.2]], { stroke: P.colour === 'rainbow' ? RAINBOW[0] : o.stroke, w: w * 0.8 });
        }
      });
    },
  });
})();
