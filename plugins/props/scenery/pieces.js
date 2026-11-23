// Props: Scenery pieces (fence, stepping stones, clouds, window). Small shared pieces for Home, School and Park scenes.
// Style guide: docs/PROP-STYLE-GUIDE.md.
(() => {
  const PACK = 'Scenery', CAT = 'Scenery';
  const rngOf = (item, k) => U.rng(U.hash(item.id + ':' + k));
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    // ---------- picket fence ----------
    { type: 'prop', id: 'scenery-fence', name: 'Picket fence', cat: CAT, tags: ['garden', 'gate', 'wooden fence', 'railing'],
      colors: { line: '#8a5a33', board: '#a0724a' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 120, max: 1000, step: 20, def: 600 }, { key: 'height', label: 'Height', type: 'range', min: 60, max: 160, step: 10, def: 100 }],
      draw(p, P, item) {
        const W = P.width / 2, H = P.height, r = rngOf(item, 'f'); const n = Math.max(3, Math.round(P.width / 36)), step = P.width / n;
        p.line([[-W, -H * 0.72], [W, -H * 0.72]], { stroke: 'line', w: 4.5 }); p.line([[-W, -H * 0.28], [W, -H * 0.28]], { stroke: 'line', w: 4.5 });
        for (let i = 0; i < n; i++) { const x = -W + step * (i + 0.5), h = H - r() * 6, w = step * 0.36; p.poly([[x - w, 0], [x - w, -h + 14], [x, -h], [x + w, -h + 14], [x + w, 0]], { stroke: 'line', w: 3, fill: 'paper', hatch: 'board', hg: 6, halpha: 0.3, ha: 90 }); }
      } },
    // ---------- stepping stones ----------
    { type: 'prop', id: 'scenery-stones', name: 'Stepping stones', cat: CAT, tags: ['path', 'garden path', 'stones', 'rocks', 'pebbles'],
      colors: { line: '#6f6f6f', stone: '#9e9e9e' },
      params: [{ key: 'count', label: 'Stones', type: 'range', min: 3, max: 9, step: 1, def: 6 }],
      draw(p, P, item) { const r = rngOf(item, 'st'); const n = Math.round(P.count), gap = 84;
        for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * gap, y = -18 - (i % 2 ? 6 : 0) - r() * 6; p.ell(x, y, 34 + r() * 5, 15 + r() * 3, { stroke: 'line', w: 3.5, fill: 'paper', hatch: 'stone', hg: 5, halpha: 0.5 }); } } },
    // ---------- clouds ----------
    { type: 'prop', id: 'scenery-clouds', name: 'Clouds', cat: CAT, floating: true, tags: ['sky', 'weather', 'cloud group'],
      colors: { line: '#64b5f6' },
      params: [{ key: 'count', label: 'Clouds', type: 'range', min: 1, max: 4, step: 1, def: 3 }],
      draw(p, P, item) { const r = rngOf(item, 'c'); const n = Math.round(P.count);
        for (let i = 0; i < n; i++) { const cx = (i - (n - 1) / 2) * 150 + (r() - 0.5) * 30, cy = ((i % 2) ? 22 : -22) + (r() - 0.5) * 14, s = 0.85 + r() * 0.4;
          const pts = [[-70, 22], [-84, 4], [-68, -14], [-44, -18], [-34, -42], [-6, -52], [20, -40], [30, -22], [54, -26], [80, -6], [74, 18], [60, 24]].map(([x, y]) => [cx + x * s, cy + y * s]);
          p.poly(pts, { stroke: 'line', w: 4.5, fill: 'paper', smooth: true, hatch: 'line', hg: 7, halpha: 0.25, ha: -35 }); } } },
    // ---------- window with a picture ----------
    { type: 'prop', id: 'scenery-window', name: 'Window', cat: CAT, floating: true, tags: ['view', 'glass', 'frame', 'curtains', 'wall window'],
      colors: { line: '#8a5a33', glass: '#4fc3f7', curtain: '#e53935' },
      params: [{ key: 'curtains', label: 'Curtains', type: 'toggle', def: false }, { key: 'cross', label: 'Window bars', type: 'toggle', def: true }],
      slots: [{ key: 'view', label: 'View outside', kind: 'picture', def: 'none', box: [-76, -100, 152, 200] }],
      draw(p, P, item, x) {
        p.rect(-90, -112, 180, 224, { stroke: 'line', w: 4.5, fill: 'paper', hatch: 'glass', hg: 7, halpha: 0.3, ha: 55 });
        x.slot('view'); // whatever picture is chosen (sun, tree, night sky...) shows through the glass
        p.rect(-76, -100, 152, 200, { stroke: 'line', w: 3, fill: false });
        if (P.cross) { p.line([[0, -100], [0, 100]], { stroke: 'line', w: 3 }); p.line([[-76, 0], [76, 0]], { stroke: 'line', w: 3 }); }
        p.rect(-102, 112, 204, 12, { stroke: 'line', w: 3.5, fill: 'paper' }); // sill
        if (P.curtains) for (const s of [-1, 1]) p.poly([[s * 92, -118], [s * 30, -118], [s * 44, -30], [s * 36, 60], [s * 92, 108]], { stroke: 'curtain', w: 3.5, fill: 'paper', hatch: 'curtain', hg: 6, halpha: 0.5, ha: 88 });
      } },
  ] });
})();
