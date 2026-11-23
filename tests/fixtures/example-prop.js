// The worked example from docs/PROP-STYLE-GUIDE.md: a park bench. Copy this file, change the id, name and drawing.
// Floor prop: origin = bottom centre, standing on y = 0 (y goes DOWN, so everything above the floor is negative).
(() => {
  CP.register({ api: 1, version: '1.0.0', type: 'prop', id: 'example-bench', name: 'Bench', pack: 'Example props', cat: 'Furniture',
    tags: ['seat', 'park bench', 'garden'],                         // words people might search for
    colors: { line: '#8a5a33', cushion: '#1e88e5' },                // "line" is required; every other name you use must be declared here
    params: [{ key: 'cushion', label: 'Cushion', type: 'toggle', def: false }],
    draw(p, P, item) {
      const o = { stroke: 'line', w: 4.5 };                         // main outline 4.5
      const d = { stroke: 'line', w: 3 };                           // secondary 3, details 2-2.5, fine 1.5
      for (const s of [-1, 1]) { p.line([[s * 105, -74], [s * 112, 0]], o); p.line([[s * 105, -170], [s * 105, -74]], o); } // legs and back posts
      p.poly([[-130, -74], [124, -74], [112, -88], [-118, -88]], { ...o, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.35, ha: -40 }); // the seat: fill 'paper' hides what is behind it
      for (let i = 0; i < 3; i++) p.rect(-118, -164 + i * 26, 236, 20, { ...d, fill: 'paper' }); // back slats (they hide the posts behind them)
      const rng = U.rng(U.hash(item.id));                           // the only allowed randomness: seeded by the item, so every redraw and export matches
      for (let i = 0; i < 3; i++) { const x = -90 + i * 90 + (rng() - 0.5) * 10; p.line([[x, -154 + i * 26], [x + 30, -154 + i * 26]], { stroke: 'line', w: 1.5 }); } // a little wood grain on each slat
      if (P.cushion) p.poly([[-100, -88], [100, -88], [94, -102], [-94, -102]], { stroke: 'cushion', w: 3, fill: 'paper', hatch: 'cushion', hg: 6, halpha: 0.5 });
    } });
})();
