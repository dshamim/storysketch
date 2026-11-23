// Props: Home - bathroom (bath, basin with mirror, slippers). Floor props: origin = bottom centre (stands on y = 0). The bath rim is 110 high.
(() => {
  const PACK = 'Home props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const white = { fill: 'paper', hatch: 'body', hg: 8, halpha: 0.45, ha: 90 };

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'home-bath', name: 'Bath', cat: 'Bathroom', tags: ['bathtub', 'tub', 'wash', 'bubbles', 'bathroom'],
      colors: { line: '#6f6f6f', body: '#90a4ae', water: '#4fc3f7', bubble: '#80deea' },
      params: [{ key: 'water', label: 'Water in the bath', type: 'toggle', def: true }, { key: 'bubbles', label: 'Bubbles', type: 'toggle', def: true }],
      draw(p, P) {
        for (const x of [-110, 110]) p.rect(x - 10, -14, 20, 14, { ...d, fill: 'paper' });
        p.poly([[-140, -110], [140, -110], [136, -52], [112, -16], [-112, -16], [-136, -52]], { ...o, ...white, smooth: false });
        p.line([[-140, -98], [140, -98]], { stroke: 'line', w: 3 });
        if (P.water) p.poly([[-126, -84], [-110, -88], [-60, -82], [-10, -88], [50, -82], [100, -88], [126, -84], [118, -56], [100, -30], [-100, -30], [-118, -56]], { stroke: 'water', w: 3, fill: 'paper', hatch: 'water', hg: 5, halpha: 0.5, ha: 8 });
        p.line([[-128, -110], [-128, -146]], { stroke: 'line', w: 5 }); p.curve([[-128, -146], [-110, -158], [-96, -148]], { stroke: 'line', w: 5 }); p.circ(-146, -128, 6, { ...d, fill: 'paper' });
        if (P.bubbles) for (const [x, y, r] of [[-60, -112, 18], [-30, -122, 24], [6, -114, 20], [40, -124, 16], [70, -112, 22], [-84, -126, 12], [96, -122, 11], [24, -142, 9]]) p.circ(x, y, r, { stroke: 'bubble', w: 2.5, fill: 'paper', hatch: 'bubble', hg: 5, halpha: 0.3 });
      } },
    { type: 'prop', id: 'home-basin', name: 'Basin and mirror', cat: 'Bathroom', tags: ['sink', 'wash basin', 'mirror', 'tap', 'bathroom', 'brush teeth'],
      colors: { line: '#6f6f6f', body: '#90a4ae', glass: '#4fc3f7', frame: '#8a5a33' },
      params: [{ key: 'mirror', label: 'Mirror', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-14, -80, 28, 80, { ...o, ...white }); p.poly([[-34, 0], [-26, -14], [26, -14], [34, 0]], { ...d, fill: 'paper' });
        p.poly([[-52, -100], [52, -100], [46, -76], [-46, -76]], { ...o, ...white, smooth: true });
        p.line([[0, -100], [0, -122]], { stroke: 'line', w: 5 }); p.curve([[0, -122], [14, -128], [24, -116]], { stroke: 'line', w: 5 });
        if (P.mirror) { p.ell(0, -230, 56, 76, { stroke: 'frame', w: 4.5, fill: 'paper', hatch: 'glass', hg: 7, halpha: 0.3, ha: 55 }); p.line([[-24, -270], [-6, -296]], { stroke: 'glass', w: 2.5 }); p.line([[-34, -250], [-20, -266]], { stroke: 'glass', w: 2.5 }); }
      } },
    { type: 'prop', id: 'home-slippers', name: 'Slippers', cat: 'Bedroom', tags: ['shoes', 'indoor shoes', 'feet', 'pair'],
      colors: { line: '#8a5a33', fluff: '#e53935' },
      params: [{ key: 'pair', label: 'Pair', type: 'toggle', def: true }],
      draw(p, P) {
        const slipper = (x) => { p.poly([[x - 28, 0], [x - 28, -10], [x - 12, -22], [x + 14, -20], [x + 32, -8], [x + 30, 0]], { ...o, w: 3.5, fill: 'paper', hatch: 'fluff', hg: 4, halpha: 0.55, ha: 70, smooth: true }); p.line([[x - 8, -21], [x + 12, -19]], { stroke: 'line', w: 2.5 }); };
        slipper(P.pair ? -36 : 0); if (P.pair) slipper(40);
      } },
  ] });
})();
