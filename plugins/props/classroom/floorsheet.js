// Props: a drawing sheet lying flat on the floor, and loose crayons / pencils / paints to go with it.
// Origin = the near edge of the sheet, centre (y = 0 is the edge closest to the viewer; the sheet goes "into" the page, up the screen).
(() => {
  const { PAL } = CP.helpers;

  // one colouring thing lying on the floor at (cx, cy), pointing at angle a (degrees), squashed a little so it looks flat
  function lying(p, cx, cy, a, c, kind) {
    const k = U.rad(a), cs = Math.cos(k), sn = Math.sin(k);
    const T = (u, v) => [cx + u * cs - v * sn, cy + (u * sn + v * cs) * 0.6];
    const q = (pts) => pts.map(([u, v]) => T(u, v));
    if (kind === 'pencil') {
      p.poly(q([[-28, -3.5], [14, -3.5], [14, 3.5], [-28, 3.5]]), { stroke: c, w: 2.5, fill: c, hatch: c, hg: 3, halpha: 0.8, smooth: false });
      p.poly(q([[-28, -3.5], [-22, -3.5], [-22, 3.5], [-28, 3.5]]), { stroke: '#c2185b', w: 2, fill: '#f48fb1', smooth: false }); // rubber
      p.poly(q([[14, -3.5], [24, -1.2], [24, 1.2], [14, 3.5]]), { stroke: '#b88a4e', w: 2, fill: '#ecc894', smooth: false }); // sharpened wood
      p.poly(q([[24, -1.2], [28, 0], [24, 1.2]]), { stroke: c, w: 2, fill: c, smooth: false }); // lead
      return;
    }
    if (kind === 'pot') { // a little paint pot standing on the floor, seen from the front
      p.rect(cx - 12, cy - 16, 24, 16, { stroke: c, w: 2.5, fill: 'paper', hatch: c, hg: 3.5, halpha: 0.6 });
      p.ell(cx, cy - 16, 12.5, 4.5, { stroke: c, w: 2.5, fill: c });
      return;
    }
    if (kind === 'brush') {
      p.line(q([[-30, 0], [12, 0]]), { stroke: '#8a5a33', w: 4.5 });
      p.line(q([[12, 0], [18, 0]]), { stroke: '#8a8a8a', w: 6 });
      p.poly(q([[18, -3.5], [30, -2], [34, 0], [30, 2], [18, 3.5]]), { stroke: c, w: 2, fill: c, smooth: true });
      return;
    }
    // crayon: fat stick with a paper wrapper and a blunt cone tip
    p.poly(q([[-19, -4.5], [11, -4.5], [11, 4.5], [-19, 4.5]]), { stroke: c, w: 2.5, fill: c, hatch: c, hg: 3, halpha: 0.9, smooth: false });
    p.poly(q([[-15, -4.5], [5, -4.5], [5, 4.5], [-15, 4.5]]), { stroke: c, w: 2, fill: 'paper', hatch: c, hg: 3, halpha: 0.35, smooth: false }); // wrapper
    p.poly(q([[11, -4.5], [19, -1.5], [19, 1.5], [11, 4.5]]), { stroke: c, w: 2.5, fill: c, smooth: false });
  }

  // an open crayon box lying on the floor, a few crayons poking out
  function crayonBox(p, cx, cy, r) {
    for (let i = 0; i < 5; i++) { const c = PAL[(i * 3 + Math.floor(r() * 8)) % PAL.length]; const x = cx - 20 + i * 10; p.rect(x - 3.5, cy - 30 - r() * 6, 7, 20, { stroke: c, w: 2, fill: c }); }
    p.poly([[cx - 30, cy - 18], [cx + 30, cy - 18], [cx + 28, cy], [cx - 28, cy]], { stroke: '#f2b705', w: 3, fill: 'paper', hatch: '#fbc02d', hg: 3.5, halpha: 0.75 });
    p.line([[cx - 18, cy - 9], [cx + 18, cy - 9]], { stroke: '#e53935', w: 3 });
  }

  const KINDS = { crayons: ['crayon'], pencils: ['pencil'], paints: ['pot', 'pot', 'brush'], mixed: ['crayon', 'crayon', 'pencil', 'pencil', 'pot', 'brush'] };
  // scatter n things in the area [x0, x1] × [y0, y1], keeping clear of the gap [gx0, gx1] when given
  function scatter(p, r, n, kinds, x0, x1, y0, y1, gap) {
    const list = KINDS[kinds] || KINDS.crayons; let nPot = 0;
    const cols = PAL.slice(); for (let i = cols.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]]; } // shuffled, so neighbours differ
    for (let i = 0; i < n; i++) {
      let kind = list[i % list.length]; if (kind === 'pot' && ++nPot > 3) kind = 'brush';
      let x = U.lerp(x0, x1, (i + 0.15 + r() * 0.7) / n); const y = U.lerp(y0, y1, r());
      if (gap && x > gap[0] && x < gap[1]) x = (x - gap[0] < gap[1] - x) ? gap[0] - r() * 20 : gap[1] + r() * 20;
      lying(p, x, y, kind === 'pot' ? 0 : -50 + r() * 100 + (r() < 0.5 ? 180 : 0), cols[i % cols.length], kind);
    }
  }

  const COLOURS = { crayons: 'Crayons', pencils: 'Coloured pencils', paints: 'Paint pots + brush', mixed: 'A bit of everything' };
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
    { type: 'prop', id: 'floorsheet', name: 'Drawing sheet (on the floor)', cat: 'Arts',
      colors: { line: '#9a9a9a', tape: '#f2c94c' },
      params: [
        { key: 'size', label: 'Paper', type: 'select', def: 'sheet', options: { sheet: 'Sheet of paper', big: 'Big sheet, taped down', roll: 'Paper roll, rolled out' } },
        { key: 'width', label: 'Width', type: 'range', min: 120, max: 640, step: 10, def: 260 },
        { key: 'view', label: 'Seen from (low ↔ high)', type: 'range', min: 0.2, max: 0.8, step: 0.05, def: 0.5 },
        { key: 'curl', label: 'Corner curls up', type: 'toggle', def: true },
        { key: 'colours', label: 'Colours on the floor', type: 'select', def: 'crayons', options: { none: 'None', ...COLOURS } },
        { key: 'count', label: 'How many', type: 'range', min: 1, max: 12, step: 1, def: 5, when: { colours: ['crayons', 'pencils', 'paints', 'mixed'] } },
        { key: 'shuffle', label: 'Shuffle colours', type: 'range', min: 1, max: 20, step: 1, def: 1, when: { colours: ['crayons', 'pencils', 'paints', 'mixed'] } },
      ],
      slots: [{ key: 'art', label: 'Drawing on the sheet', kind: 'picture', def: 'rainbow', box: [-108, -158, 216, 158] }],
      draw(p, P, it, x) {
        const W = +P.width || 260, view = +P.view || 0.5;
        const aspect = P.size === 'roll' ? 0.42 : 0.68;
        const Hf = W * aspect, D = Hf * view, Wf = W * (0.84 + 0.1 * view); // far edge is a bit narrower: it's further away
        // flat sheet coordinates (x across, y from -Hf far edge to 0 near edge) → the sheet lying on the floor
        const F = ([fx, fy]) => { const v = (fy + Hf) / Hf; return [fx * U.lerp(Wf, W, v) / W, -D * (1 - v)]; };
        const corners = [[-W / 2, 0], [W / 2, 0], [W / 2, -Hf], [-W / 2, -Hf]];
        const curl = P.curl !== false;
        const edge = corners.map(F); if (curl) edge.splice(2, 1, F([W / 2, -Hf + 24]), F([W / 2 - 30, -Hf]));
        p.poly(edge, { stroke: 'line', w: 3, fill: 'paper', smooth: false });
        // the picture, drawn flat then laid down onto the sheet
        const m = W * 0.08, n0 = p.o.length;
        x.slot('art', [-W / 2 + m, -Hf + m * (P.size === 'roll' ? 1.2 : 1), W - 2 * m, Hf - 2 * m]);
        const thin = 0.55 + view * 0.5;
        for (const pr of p.o.slice(n0)) { pr.pts = pr.pts.map(F); pr.w *= thin; if (pr.hatch) pr.hatch.gap *= 0.9; }
        if (curl) { // the corner folds back over the sheet: mirror the cut-off corner across the fold line
          const a = F([W / 2, -Hf + 24]), b = F([W / 2 - 30, -Hf]), k = F([W / 2, -Hf]);
          const dx = b[0] - a[0], dy = b[1] - a[1], t = ((k[0] - a[0]) * dx + (k[1] - a[1]) * dy) / (dx * dx + dy * dy);
          const fx = a[0] + t * dx, fy = a[1] + t * dy, c = [2 * fx - k[0], 2 * fy - k[1]];
          p.poly([a, b, c], { stroke: 'line', w: 2.5, fill: 'paper', hatch: 'line', hg: 3, halpha: 0.35, smooth: false });
        }
        if (P.size === 'big') for (const [fx, fy] of [[-W / 2, 0], [W / 2, 0], [-W / 2, -Hf], [W / 2, -Hf]]) {
          if (curl && fx > 0 && fy < 0) continue;
          const [cx, cy] = F([fx, fy]); const s = fx < 0 ? 1 : -1;
          p.poly([[cx - 14, cy - 4 * s], [cx + 14, cy + 4 * s], [cx + 12, cy + 9 * s], [cx - 16, cy + 1 * s]].map(([qx, qy]) => [qx, qy - 2]), { stroke: 'tape', w: 2, hatch: 'tape', hg: 3, halpha: 0.7 });
        }
        if (P.size === 'roll') { // the rest of the roll, still rolled up along the far edge
          const [lx, ly] = F([-W / 2, -Hf]), [rx] = F([W / 2, -Hf]);
          p.rect(lx - 4, ly - 15, rx - lx + 8, 15, { stroke: 'line', w: 3, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.25, ha: 0 });
          p.ell(rx + 4, ly - 7.5, 4, 7.5, { stroke: 'line', w: 2.5, fill: 'paper' }); p.circ(rx + 4, ly - 7.5, 2, { stroke: 'line', w: 1.5, fill: 'line' });
        }
        if (P.colours && P.colours !== 'none') {
          const r = U.rng(U.hash(it.id + ':' + (P.shuffle || 1)));
          scatter(p, r, +P.count || 5, P.colours, -W / 2 - 40, W / 2 + 40, -D * 0.15, 22, [-W * 0.3, W * 0.3]);
        }
      } },

    { type: 'prop', id: 'floorcolours', name: 'Crayons on the floor (loose)', cat: 'Arts',
      colors: {},
      params: [
        { key: 'kind', label: 'What', type: 'select', def: 'crayons', options: COLOURS },
        { key: 'count', label: 'How many', type: 'range', min: 1, max: 14, step: 1, def: 5 },
        { key: 'spread', label: 'Spread', type: 'range', min: 40, max: 400, step: 10, def: 140 },
        { key: 'box', label: 'Crayon box', type: 'toggle', def: false },
        { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      draw(p, P, it) {
        const r = U.rng(U.hash(it.id + ':' + (P.shuffle || 1))); const S = +P.spread || 140;
        if (P.box) crayonBox(p, -S / 2 - 10, -8, r);
        scatter(p, r, +P.count || 5, P.kind, -S / 2 + (P.box ? 30 : 0), S / 2, -18, 4);
      } },
  ] });
})();
