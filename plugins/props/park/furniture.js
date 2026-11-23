// Props: Park - fittings (bench, fountain, lamppost, bin, signpost, railing, winding path). Seats are 80 high. Floor props: origin = bottom centre.
(() => {
  const PACK = 'Park props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    // ---------- bench ----------
    { type: 'prop', id: 'park-bench', name: 'Park bench', cat: 'Furniture', tags: ['seat', 'garden bench', 'sit', 'wooden bench', 'rest'],
      colors: { line: '#6f6f6f', wood: '#a0724a' },
      params: [{ key: 'back', label: 'Backrest', type: 'toggle', def: true }],
      draw(p, P) {
        for (const s of [-1, 1]) { p.line([[s * 112, -80], [s * 112, 0]], o); p.line([[s * 112, -80], [s * 126, -118]], d); if (P.back) p.line([[s * 112, -80], [s * 116, -168]], o); }
        for (let i = 0; i < 3; i++) p.rect(-130, -90 + i * 0 - 0, 260, 12, { ...d, stroke: 'wood', fill: 'paper', hatch: 'wood', hg: 6, halpha: 0.4, ha: 0 });
        if (P.back) for (let i = 0; i < 3; i++) p.rect(-124, -168 + i * 28, 248, 20, { ...d, stroke: 'wood', fill: 'paper', hatch: 'wood', hg: 6, halpha: 0.4, ha: 0 });
        p.line([[-112, -60], [112, -60]], f);
      } },
    // ---------- fountain ----------
    { type: 'prop', id: 'park-fountain', name: 'Fountain', cat: 'Garden', tags: ['water', 'splash', 'square', 'town', 'spray'],
      colors: { line: '#6f6f6f', water: '#4fc3f7' },
      params: [{ key: 'water', label: 'Water on', type: 'toggle', def: true }],
      draw(p, P) {
        p.poly([[-150, -50], [-140, 0], [140, 0], [150, -50]], { ...o, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, ha: 90 });
        p.ell(0, -50, 150, 28, { ...o, fill: 'paper', hatch: 'water', hg: 6, halpha: P.water ? 0.5 : 0.1, ha: 0 });
        p.poly([[-18, -50], [-12, -150], [12, -150], [18, -50]], { ...o, fill: 'paper' });
        p.poly([[-72, -176], [-60, -150], [60, -150], [72, -176]], { ...o, smooth: false, fill: 'paper' });
        p.ell(0, -176, 72, 14, { ...d, fill: 'paper', hatch: 'water', hg: 6, halpha: P.water ? 0.5 : 0.1, ha: 0 });
        p.line([[0, -176], [0, -214]], d); p.circ(0, -222, 12, { ...d, fill: 'paper' });
        if (P.water) { p.curve([[0, -214], [-44, -240], [-84, -196], [-72, -178]], { stroke: 'water', w: 3 }); p.curve([[0, -214], [44, -240], [84, -196], [72, -178]], { stroke: 'water', w: 3 }); p.line([[0, -214], [0, -262]], { stroke: 'water', w: 3 }); p.curve([[-36, -146], [-70, -100], [-110, -62]], { stroke: 'water', w: 2.5 }); p.curve([[36, -146], [70, -100], [110, -62]], { stroke: 'water', w: 2.5 }); }
      } },
    // ---------- lamppost ----------
    { type: 'prop', id: 'park-lamppost', name: 'Lamppost', cat: 'Decoration', tags: ['street lamp', 'light', 'lantern', 'night', 'path'],
      colors: { line: '#6f6f6f', glow: '#fbc02d' },
      params: [{ key: 'light', label: 'Light on', type: 'toggle', def: false }],
      draw(p, P) {
        p.poly([[-26, 0], [-18, -30], [18, -30], [26, 0]], { ...o, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.3 });
        p.line([[0, -30], [0, -380]], { ...o, w: 6 }); p.rect(-9, -340, 18, 10, { ...f, fill: 'paper' });
        p.poly([[-26, -380], [26, -380], [32, -440], [-32, -440]], { ...o, fill: P.light ? 'glow' : 'paper', hatch: P.light ? 'glow' : 'line', hg: 4, halpha: P.light ? 0.6 : 0.15 });
        p.poly([[-40, -440], [40, -440], [0, -470]], { ...d, fill: 'paper' }); p.line([[0, -470], [0, -482]], d);
        if (P.light) for (const [a, b, c, e] of [[-44, -410, -72, -418], [44, -410, 72, -418], [-34, -452, -54, -480], [34, -452, 54, -480]]) p.line([[a, b], [c, e]], { stroke: 'glow', w: 3 });
      } },
    // ---------- bin ----------
    { type: 'prop', id: 'park-bin', name: 'Litter bin', cat: 'Furniture', tags: ['rubbish', 'trash', 'waste', 'garbage', 'clean'],
      colors: { line: '#6f6f6f', bin: '#43a047', litter: '#fbc02d' },
      params: [{ key: 'full', label: 'Overflowing', type: 'toggle', def: false }],
      draw(p, P) {
        p.poly([[-36, 0], [-42, -96], [42, -96], [36, 0]], { ...o, stroke: 'line', fill: 'paper', hatch: 'bin', hg: 5, halpha: 0.45, ha: 90 });
        p.ell(0, -98, 46, 10, { ...d, fill: 'paper' });
        for (const x of [-18, 0, 18]) p.line([[x, -86], [x * 0.9, -12]], f);
        p.line([[-30, -40], [30, -40]], f);
        if (P.full) { p.poly([[-20, -104], [-6, -128], [8, -110], [16, -124], [26, -102]], { stroke: 'litter', w: 3, fill: 'paper', hatch: 'litter', hg: 4, halpha: 0.6 }); p.circ(30, -8, 8, { stroke: 'litter', w: 3, fill: 'paper' }); }
      } },
    // ---------- signpost ----------
    { type: 'prop', id: 'park-sign', name: 'Park sign', cat: 'Signs', tags: ['signpost', 'direction', 'arrow', 'welcome', 'notice'],
      colors: { line: '#8a5a33', board: '#43a047', ink: '#6f6f6f' },
      params: [{ key: 'word', label: 'Says', type: 'select', options: { PARK: 'Park', PLAY: 'Play area', POND: 'Pond', PICNIC: 'Picnic', EXIT: 'Exit' }, def: 'PARK' }, { key: 'arrow', label: 'Arrow', type: 'select', options: { none: 'None', left: 'Points left', right: 'Points right' }, def: 'right' }],
      draw(p, P) {
        p.rect(-8, -230, 16, 230, { ...o, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.3, ha: 90 });
        const L = P.arrow === 'left', R = P.arrow === 'right';
        p.poly([[L ? -110 : -90, -222], [R ? 100 : 90, -222], ...(R ? [[126, -190]] : []), [R ? 100 : 90, -158], [L ? -110 : -90, -158], ...(L ? [[-136, -190]] : [])].filter((pt) => pt), { ...o, stroke: 'board', fill: 'paper', hatch: 'board', hg: 5, halpha: 0.45 });
        p.text(P.word, 0, -190, 30, { stroke: 'ink', w: 3 });
      } },
    // ---------- railing ----------
    { type: 'prop', id: 'park-fence', name: 'Railing', cat: 'Garden', tags: ['fence', 'iron fence', 'barrier', 'bars', 'park gate'],
      colors: { line: '#6f6f6f' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 160, max: 800, step: 20, def: 480 }],
      draw(p, P) {
        const W = P.width / 2, n = Math.max(4, Math.round(P.width / 36)), st = P.width / n;
        p.line([[-W, -26], [W, -26]], d); p.line([[-W, -74], [W, -74]], { ...o, w: 4 });
        for (let i = 0; i <= n; i++) { const x = -W + i * st; p.line([[x, 0], [x, -92]], d); p.circ(x, -98, 6, { ...f, fill: 'paper' }); }
      } },
    // ---------- winding path ----------
    { type: 'prop', id: 'park-path', name: 'Winding path', cat: 'Garden', tags: ['trail', 'walkway', 'footpath', 'way', 'track', 'road to'],
      colors: { line: '#b08d57', sand: '#e0c48a' },
      params: [{ key: 'length', label: 'Length', type: 'range', min: 100, max: 300, step: 20, def: 200 }, { key: 'width', label: 'Width', type: 'range', min: 80, max: 240, step: 20, def: 150 }],
      draw(p, P) {
        const L = P.length, Wd = P.width, left = [], right = [];
        for (let i = 0; i <= 10; i++) { const t = i / 10, cx = Math.sin(t * Math.PI * 1.4) * Wd * 0.4 * t, hw = (Wd / 2) * (1 - t * 0.68), y = -L * Math.pow(t, 0.85); left.push([cx - hw, y]); right.push([cx + hw, y]); }
        p.poly([...left, ...right.reverse()], { ...o, w: 3.5, smooth: true, fill: 'paper', hatch: 'sand', hg: 6, halpha: 0.55, ha: 0 });
        for (const [x, y] of [[-Wd * 0.1, -L * 0.12], [Wd * 0.14, -L * 0.3], [Wd * 0.5, -L * 0.5]]) p.ell(x, y, 8, 4, { stroke: 'line', w: 2, fill: 'paper' });
      } },
  ] });
})();
