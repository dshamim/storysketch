// Props: Park - nature (tree with seasons, bush, pond, flowerbed, grassy hill). Trees are 450 to 650 high. Floor props: origin = bottom centre.
(() => {
  const PACK = 'Park props', CAT = 'Nature';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const rngOf = (item, k) => U.rng(U.hash(item.id + ':' + k));
  const blob = (cx, cy, rx, ry, n, bump, ph = 0) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 + ph, k = 1 + bump * Math.sin(a * 5 + 1); return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; });
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    // ---------- tree ----------
    { type: 'prop', id: 'park-tree', name: 'Tree', cat: CAT, tags: ['oak', 'leaves', 'autumn', 'winter', 'spring', 'summer', 'season', 'blossom', 'woods'],
      colors: { line: '#8a5a33', leaf: '#43a047', blossom: '#f06292', autumn: '#fb8c00', snow: '#64b5f6' },
      params: [{ key: 'season', label: 'Season', type: 'select', options: { summer: 'Summer', spring: 'Spring', autumn: 'Autumn', winter: 'Winter' }, def: 'summer' }, { key: 'height', label: 'Height', type: 'range', min: 450, max: 650, step: 20, def: 540 }],
      draw(p, P, item) {
        const r = rngOf(item, 't'), H = P.height, k = H / 540, ty = -250 * k, S = P.season;
        p.poly([[-26, 0], [-18, ty], [18, ty], [28, 0]], { ...o, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.4, ha: 85 });
        p.line([[-30, 0], [-52, 2]], d); p.line([[34, 0], [58, 2]], d); p.curve([[-6, -60], [0, -80], [6, -64]], f);
        if (S === 'winter') {
          for (const [a, b, c, e] of [[-8, ty, -80, ty - 90 * k], [8, ty, 84, ty - 80 * k], [0, ty, -6, ty - 150 * k], [-40, ty - 60 * k, -120, ty - 100 * k], [44, ty - 70 * k, 122, ty - 110 * k]]) p.line([[a, b], [c, e]], d);
          p.line([[-6, ty - 150 * k], [-40, ty - 190 * k]], f); p.line([[-6, ty - 150 * k], [30, ty - 196 * k]], f); p.line([[-80, ty - 90 * k], [-110, ty - 150 * k]], f); p.line([[84, ty - 80 * k], [112, ty - 140 * k]], f);
          for (const [x, y] of [[-80, ty - 94 * k], [84, ty - 84 * k], [-120, ty - 104 * k], [122, ty - 114 * k]]) p.line([[x - 14, y - 4], [x + 14, y - 4]], { stroke: 'snow', w: 4 });
          p.ell(0, -14, 130, 12, { stroke: 'snow', w: 3, fill: 'paper', hatch: 'snow', hg: 6, halpha: 0.3, ha: 0 });
          return;
        }
        const col = S === 'spring' ? 'blossom' : S === 'autumn' ? 'autumn' : 'leaf', cy = ty - 140 * k;
        p.poly(blob(0, cy, 165, 135 * k, 20, 0.07), { ...o, smooth: true, fill: 'paper', hatch: col, hg: 6, halpha: S === 'summer' ? 0.5 : 0.55, ha: -40 });
        p.curve([[-90, cy + 30 * k], [-40, cy + 10 * k], [-10, cy + 40 * k]], { stroke: col, w: 3 }); p.curve([[20, cy - 40 * k], [64, cy - 20 * k], [90, cy - 56 * k]], { stroke: col, w: 3 });
        if (S === 'summer') for (let i = 0; i < 4; i++) p.circ(-70 + i * 46 + (r() - 0.5) * 16, cy + (r() - 0.5) * 120 * k, 7, { stroke: 'autumn', w: 3, fill: 'paper', hatch: 'autumn', hg: 3, halpha: 0.7 });
        if (S === 'spring') for (let i = 0; i < 6; i++) p.circ(-80 + i * 32 + (r() - 0.5) * 18, cy + (r() - 0.5) * 130 * k, 6, { stroke: 'line', w: 2, fill: 'paper' });
        if (S === 'autumn') for (const [x, y] of [[-110, -30], [-70, -14], [90, -26], [50, -8]]) p.poly([[x, y], [x + 10, y - 8], [x + 20, y], [x + 10, y + 7]], { stroke: 'autumn', w: 2.5, fill: 'paper', hatch: 'autumn', hg: 3, halpha: 0.7 });
      } },
    // ---------- bush ----------
    { type: 'prop', id: 'park-bush', name: 'Bush', cat: CAT, tags: ['hedge', 'shrub', 'berries', 'garden', 'green'],
      colors: { line: '#43a047', berry: '#e53935' },
      params: [{ key: 'berries', label: 'Berries', type: 'toggle', def: false }, { key: 'width', label: 'Width', type: 'range', min: 120, max: 360, step: 20, def: 200 }],
      draw(p, P, item) {
        const r = rngOf(item, 'b'), W = P.width / 2;
        p.poly(blob(0, -44, W, 52, 20, 0.07).map(([x, y]) => [x, Math.min(y, -2)]), { ...o, smooth: true, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.45, ha: -40 });
        p.curve([[-W * 0.5, -30], [-W * 0.2, -60], [0, -34]], { stroke: 'line', w: 3 }); p.curve([[W * 0.1, -54], [W * 0.4, -40], [W * 0.6, -66]], { stroke: 'line', w: 3 });
        if (P.berries) for (let i = 0; i < 7; i++) p.circ(-W * 0.7 + i * (W * 1.4 / 6) + (r() - 0.5) * 10, -30 - r() * 44, 6, { stroke: 'berry', w: 3, fill: 'paper', hatch: 'berry', hg: 3, halpha: 0.8 });
      } },
    // ---------- pond ----------
    { type: 'prop', id: 'park-pond', name: 'Pond', cat: CAT, tags: ['lake', 'water', 'ducks', 'duck pond', 'puddle', 'lily pad'],
      colors: { line: '#6f6f6f', water: '#4fc3f7', duck: '#fbc02d', lily: '#43a047' },
      params: [{ key: 'ducks', label: 'Ducks', type: 'toggle', def: true }, { key: 'lilies', label: 'Lily pads', type: 'toggle', def: true }, { key: 'width', label: 'Width', type: 'range', min: 240, max: 600, step: 20, def: 420 }],
      draw(p, P, item) {
        const W = P.width / 2;
        p.ell(0, -36, W, 36, { ...o, stroke: 'line', fill: 'paper', hatch: 'water', hg: 6, halpha: 0.55, ha: 0 });
        for (let i = 0; i < 9; i++) { const a = U.rad(200 + i * 17); p.ell(Math.cos(a) * (W + 6), -36 + Math.sin(a) * 42, 17, 8, { ...d, fill: 'paper', hatch: 'line', hg: 5, halpha: 0.3 }); }
        p.curve([[-W * 0.5, -40], [-W * 0.35, -46], [-W * 0.2, -40]], { stroke: 'water', w: 2.5 }); p.curve([[W * 0.3, -26], [W * 0.45, -32], [W * 0.6, -26]], { stroke: 'water', w: 2.5 });
        if (P.lilies) for (const [x, y] of [[-W * 0.55, -30], [W * 0.5, -44]]) { p.ell(x, y, 24, 8, { stroke: 'lily', w: 3, fill: 'paper', hatch: 'lily', hg: 4, halpha: 0.6 }); p.line([[x, y], [x + 14, y - 3]], { stroke: 'water', w: 2 }); }
        if (P.ducks) for (const [x, s] of [[-W * 0.1, 1], [W * 0.18, -0.8]]) { const sc = Math.abs(s); const ox = x, oy = -40;
          p.ell(ox, oy, 28 * sc, 13 * sc, { stroke: 'duck', w: 3.5, fill: 'paper', hatch: 'duck', hg: 4, halpha: 0.6 }); p.circ(ox + 22 * s, oy - 18 * sc, 10 * sc, { stroke: 'duck', w: 3.5, fill: 'paper' });
          p.poly([[ox + 30 * s, oy - 18 * sc], [ox + 40 * s, oy - 14 * sc], [ox + 30 * s, oy - 12 * sc]], { stroke: '#fb8c00', w: 2.5, fill: '#fb8c00' }); p.circ(ox + 25 * s, oy - 20 * sc, 1.5, { stroke: 'line', w: 1.5, fill: 'line' }); p.curve([[ox - 20 * sc, oy + 8], [ox, oy + 14], [ox + 20 * sc, oy + 8]], { stroke: 'water', w: 2 }); }
        for (const x of [-W + 6, W - 8]) for (let i = 0; i < 3; i++) p.line([[x + i * 7 - 7, -34], [x + i * 9 - 9, -34 - 46 - i * 8]], { stroke: 'lily', w: 3 });
      } },
    // ---------- flowerbed ----------
    { type: 'prop', id: 'park-flowerbed', name: 'Flowerbed', cat: CAT, tags: ['flowers', 'garden', 'tulips', 'daisies', 'petals', 'plants'],
      colors: { line: '#8a5a33', stem: '#43a047', petal1: '#e53935', petal2: '#fbc02d', petal3: '#8e24aa' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 160, max: 520, step: 20, def: 320 }],
      draw(p, P, item) {
        const r = rngOf(item, 'fl'), W = P.width / 2, n = Math.round(P.width / 46);
        p.poly([[-W, 0], [-W + 10, -24], [W - 10, -24], [W, 0]], { ...o, fill: 'paper', hatch: 'line', hg: 5, halpha: 0.5, ha: 0 });
        for (let i = 0; i < n; i++) { const x = -W + 24 + i * ((W * 2 - 48) / Math.max(1, n - 1)), h = 52 + r() * 50, c = ['petal1', 'petal2', 'petal3'][i % 3];
          p.line([[x, -24], [x + (r() - 0.5) * 8, -24 - h]], { stroke: 'stem', w: 3 }); p.line([[x, -24 - h * 0.4], [x + 14, -24 - h * 0.55]], { stroke: 'stem', w: 2.5 });
          const cx = x, cy = -24 - h; p.circ(cx, cy, 13, { stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 3, halpha: 0.7 }); p.circ(cx, cy, 4, { stroke: 'line', w: 2, fill: 'paper' }); }
      } },
    // ---------- grassy hill ----------
    { type: 'prop', id: 'park-hill', name: 'Grassy hill', cat: CAT, tags: ['mound', 'slope', 'grass', 'bank', 'roll down'],
      colors: { line: '#43a047', path: '#c9a66b' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 300, max: 800, step: 20, def: 560 }, { key: 'height', label: 'Height', type: 'range', min: 90, max: 300, step: 10, def: 180 }, { key: 'path', label: 'Path up the hill', type: 'toggle', def: false }],
      draw(p, P) {
        const W = P.width / 2, H = P.height;
        p.poly([[-W, 0], [-W * 0.7, -H * 0.45], [-W * 0.35, -H * 0.88], [0, -H], [W * 0.38, -H * 0.86], [W * 0.72, -H * 0.42], [W, 0]], { ...o, smooth: true, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.4, ha: -40 });
        for (const [x, y] of [[-W * 0.4, -H * 0.3], [W * 0.3, -H * 0.4], [W * 0.62, -H * 0.15]]) { p.line([[x - 8, y], [x - 12, y - 14]], { stroke: 'line', w: 2.5 }); p.line([[x, y], [x, y - 18]], { stroke: 'line', w: 2.5 }); p.line([[x + 8, y], [x + 12, y - 14]], { stroke: 'line', w: 2.5 }); }
        if (P.path) p.poly([[-26, 0], [6, -H * 0.3], [-8, -H * 0.62], [14, -H * 0.96], [30, -H * 0.9], [20, -H * 0.62], [34, -H * 0.3], [50, 0]], { stroke: 'path', w: 3.5, smooth: true, fill: 'paper', hatch: 'path', hg: 5, halpha: 0.5 });
      } },
  ] });
})();
