// Props: Home - kitchen and dining (dining table with chairs, fridge, cooker, sink, kettle, plates). Counters and the table are 128 high; seats 80.
// Floor props: origin = bottom centre (stands on y = 0). Appliances use the metal line colour, furniture the wood one (docs/PROP-STYLE-GUIDE.md).
(() => {
  const PACK = 'Home props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const white = { fill: 'paper', hatch: 'body', hg: 8, halpha: 0.55, ha: 90 };
  const wood = { fill: 'paper', hatch: 'wood', hg: 7, halpha: 0.3, ha: 90 };
  const steam = (p, x, y, col) => { for (const dx of [-12, 2, 16]) p.curve([[x + dx, y], [x + dx - 8, y - 16], [x + dx + 6, y - 30], [x + dx - 4, y - 46]], { stroke: col, w: 2.5 }); };

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'home-dining-table', name: 'Dining table', cat: 'Kitchen', tags: ['kitchen table', 'dinner table', 'table', 'chairs', 'eating'],
      colors: { line: '#8a5a33', wood: '#8a5a33', cloth: '#e53935' },
      params: [{ key: 'chairs', label: 'Chairs', type: 'toggle', def: true }, { key: 'cloth', label: 'Tablecloth', type: 'toggle', def: false }],
      draw(p, P) {
        const chair = (s) => { // a side-view chair; s = -1 left (faces right), 1 right (faces left)
          const x = s * 168; p.line([[x - s * 22, -80], [x - s * 22, 0]], o); p.line([[x + s * 22, -80], [x + s * 22, 0]], d);
          p.poly([[x + s * 26, -176], [x + s * 14, -176], [x + s * 14, -82], [x + s * 26, -82]], { ...o, ...wood });
          p.poly([[x - s * 26, -84], [x + s * 26, -84], [x + s * 26, -74], [x - s * 26, -74]], { ...o, ...wood });
        };
        if (P.chairs) { chair(-1); chair(1); }
        p.line([[-96, -112], [-96, -8]], o); p.line([[98, -120], [98, -8]], o); p.line([[-76, -98], [-76, -6]], f);
        p.poly([[-114, -128], [118, -128], [102, -110], [-122, -110]], { ...o, ...wood }); p.rect(-122, -110, 224, 12, { ...d, fill: 'paper' });
        if (P.cloth) { p.poly([[-122, -128], [118, -128], [128, -112], [138, -70], [124, -92], [108, -60], [90, -92], [60, -64], [30, -92], [-10, -62], [-40, -92], [-70, -64], [-102, -92], [-128, -70], [-132, -110]], { stroke: 'cloth', w: 3.5, fill: 'paper', hatch: 'cloth', hg: 6, halpha: 0.45, ha: 90 }); }
      } },
    { type: 'prop', id: 'home-fridge', name: 'Fridge', cat: 'Kitchen', tags: ['refrigerator', 'freezer', 'kitchen', 'cold'],
      colors: { line: '#6f6f6f', body: '#90a4ae', magnet: '#e53935', inside: '#80cbc4' },
      params: [{ key: 'open', label: 'Door open', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-60, -300, 120, 300, { ...o, ...white });
        if (P.open) {
          p.rect(-50, -190, 100, 180, { ...d, fill: 'paper', hatch: 'inside', hg: 6, halpha: 0.45, ha: 60 });                       // inside, light and mid-tone
          for (const y of [-150, -110, -70]) p.line([[-50, y], [50, y]], d);
          p.rect(-30, -140, 24, 30, { ...f, stroke: 'magnet', fill: 'paper', hatch: 'magnet', hg: 4, halpha: 0.5 }); p.circ(22, -34, 14, { stroke: 'magnet', w: 2.5, fill: 'paper', hatch: 'magnet', hg: 4, halpha: 0.5 });
          p.poly([[-60, -190], [-112, -204], [-112, -22], [-60, -10]], { ...o, ...white }); p.line([[-100, -150], [-100, -90]], { stroke: 'line', w: 4.5 });
        } else {
          p.line([[-60, -200], [60, -200]], o); p.line([[-46, -270], [-46, -224]], { stroke: 'line', w: 6 }); p.line([[-46, -180], [-46, -100]], { stroke: 'line', w: 6 });
          p.rect(18, -150, 24, 30, { ...f, stroke: 'magnet', fill: 'paper', hatch: 'magnet', hg: 4, halpha: 0.5 }); p.circ(30, -84, 11, { stroke: 'magnet', w: 2.5, fill: 'paper', hatch: 'magnet', hg: 4, halpha: 0.5 });
        }
        for (const x of [-48, 48]) p.rect(x - 6, -6, 12, 6, { ...f, fill: 'paper' });
      } },
    { type: 'prop', id: 'home-cooker', name: 'Cooker', cat: 'Kitchen', tags: ['stove', 'oven', 'hob', 'kitchen', 'cooking'],
      colors: { line: '#6f6f6f', body: '#90a4ae', glass: '#4fc3f7', pot: '#e53935', steam: '#90a4ae' },
      params: [{ key: 'pot', label: 'Pot on the hob', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-65, -126, 130, 126, { ...o, ...white });
        p.poly([[-70, -128], [70, -128], [64, -140], [-64, -140]], { ...o, fill: 'paper', hatch: 'line', hg: 5, halpha: 0.3 });  // the top (hob)
        for (const x of [-34, 34]) p.ell(x, -134, 22, 4.5, { stroke: 'line', w: 2.2 });
        p.rect(-52, -96, 104, 70, { ...d, fill: 'paper', hatch: 'glass', hg: 6, halpha: 0.3, ha: 55 }); p.line([[-40, -108], [40, -108]], { stroke: 'line', w: 5 }); // oven door, handle
        for (const x of [-42, -14, 14, 42]) p.circ(x, -116, 5, { ...f, fill: 'paper' });
        if (P.pot) { p.poly([[-58, -140], [-10, -140], [-12, -186], [-56, -186]], { stroke: 'pot', w: 3.5, fill: 'paper', hatch: 'pot', hg: 5, halpha: 0.45, ha: 90 }); p.line([[-60, -176], [-68, -176]], { stroke: 'pot', w: 3 }); p.line([[-6, -176], [2, -176]], { stroke: 'pot', w: 3 }); steam(p, -34, -192, 'steam'); }
      } },
    { type: 'prop', id: 'home-sink', name: 'Sink and cupboard', cat: 'Kitchen', tags: ['kitchen sink', 'tap', 'basin', 'counter', 'worktop', 'washing up'],
      colors: { line: '#8a5a33', wood: '#8a5a33', metal: '#6f6f6f', water: '#4fc3f7' },
      params: [{ key: 'water', label: 'Tap running', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-100, -126, 200, 126, { ...o, ...wood }); p.line([[0, -126], [0, 0]], d); p.circ(-12, -62, 4, { ...f, fill: 'paper' }); p.circ(12, -62, 4, { ...f, fill: 'paper' });
        p.rect(-108, -138, 216, 14, { stroke: 'metal', w: 4.5, fill: 'paper', hatch: 'metal', hg: 6, halpha: 0.25 });          // worktop
        p.poly([[-58, -138], [58, -138], [50, -156], [-50, -156]], { stroke: 'metal', w: 3.5, fill: 'paper', hatch: 'water', hg: 6, halpha: 0.3 }); // basin
        p.curve([[-10, -156], [-10, -204], [16, -214], [26, -190]], { stroke: 'metal', w: 5 }); p.line([[-10, -156], [-10, -166]], { stroke: 'metal', w: 5 });
        if (P.water) for (const dy of [0, 12, 24]) p.line([[26, -184 + dy], [26, -176 + dy]], { stroke: 'water', w: 3 });
      } },
    { type: 'prop', id: 'home-kettle', name: 'Kettle', cat: 'Kitchen', tags: ['tea', 'boil', 'teapot', 'kitchen'],
      colors: { line: '#6f6f6f', body: '#e53935', steam: '#90a4ae' },
      params: [{ key: 'steam', label: 'Steaming', type: 'toggle', def: false }],
      draw(p, P) {
        p.poly([[-30, 0], [-34, -34], [-20, -58], [20, -58], [34, -34], [30, 0]], { ...o, fill: 'paper', hatch: 'body', hg: 5, halpha: 0.5, ha: 90, smooth: true });
        p.poly([[30, -26], [54, -48], [58, -44], [34, -14]], { ...d, fill: 'paper' }); p.curve([[-32, -40], [-54, -44], [-52, -14], [-32, -12]], { stroke: 'line', w: 4.5 });
        p.circ(0, -64, 6, { ...d, fill: 'paper' }); if (P.steam) steam(p, 56, -50, 'steam');
      } },
    { type: 'prop', id: 'home-plates', name: 'Plates and cup', cat: 'Kitchen', tags: ['dishes', 'crockery', 'tableware', 'dinner', 'cup', 'mug'],
      colors: { line: '#6f6f6f', rim: '#1e88e5', cup: '#fbc02d' },
      params: [{ key: 'count', label: 'Plates', type: 'range', min: 1, max: 4, step: 1, def: 3 }],
      draw(p, P) {
        const n = Math.round(P.count);
        for (let i = 0; i < n; i++) { const y = -8 - i * 9; p.ell(-26, y, 48, 10, { ...o, w: 3.5, fill: 'paper' }); p.ell(-26, y, 32, 6, { stroke: 'rim', w: 2.2 }); }
        p.poly([[40, -2], [44, -40], [76, -40], [80, -2]], { ...d, stroke: 'line', fill: 'paper', hatch: 'cup', hg: 5, halpha: 0.5, ha: 90, smooth: false }); p.ell(60, -40, 18, 5, { ...f, fill: 'paper' }); p.curve([[80, -32], [96, -30], [94, -10], [78, -10]], { stroke: 'line', w: 3 });
      } },
  ] });
})();
