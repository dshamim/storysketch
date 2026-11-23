// Props: Park - picnic and play (blanket with basket, kite, ball, scooter). Floor props: origin = bottom centre; the kite floats.
(() => {
  const PACK = 'Park props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    // ---------- picnic blanket ----------
    { type: 'prop', id: 'park-blanket', name: 'Picnic blanket', cat: 'Food', tags: ['picnic', 'rug', 'mat', 'basket', 'lunch', 'gingham'],
      colors: { line: '#e53935', check: '#e53935', basket: '#a0724a', apple: '#43a047', bread: '#fbc02d' },
      params: [{ key: 'basket', label: 'Basket', type: 'toggle', def: true }, { key: 'food', label: 'Food', type: 'toggle', def: true }],
      draw(p, P) {
        const F = 170, B = 130, Y = 64; // front half-width, back half-width, depth
        p.poly([[-F, 0], [F, 0], [B, -Y], [-B, -Y]], { ...o, fill: 'paper', hatch: 'check', hg: 8, halpha: 0.3, ha: 90 });
        for (let i = 1; i < 6; i++) { const t = i / 6; p.line([[-F + 2 * F * t, 0], [-B + 2 * B * t, -Y]], { stroke: 'check', w: 2 }); }
        for (let i = 1; i < 3; i++) { const y = -Y * i / 3, e = F + (B - F) * i / 3; p.line([[-e, y], [e, y]], { stroke: 'check', w: 2 }); }
        if (P.basket) { p.poly([[-96, -18], [-100, -62], [-40, -62], [-44, -18]], { stroke: 'basket', w: 3.5, fill: 'paper', hatch: 'basket', hg: 4, halpha: 0.55, ha: 70 }); p.curve([[-98, -62], [-70, -108], [-42, -62]], { stroke: 'basket', w: 3.5 }); }
        if (P.food) { p.circ(40, -34, 12, { stroke: 'apple', w: 3, fill: 'paper', hatch: 'apple', hg: 3, halpha: 0.7 }); p.poly([[70, -26], [112, -26], [104, -44], [78, -44]], { stroke: 'bread', w: 3, fill: 'paper', hatch: 'bread', hg: 4, halpha: 0.6 }); }
      } },
    // ---------- kite ----------
    { type: 'prop', id: 'park-kite', name: 'Kite', cat: 'Toys', floating: true, tags: ['fly', 'wind', 'string', 'sky', 'windy day'],
      colors: { line: '#8a5a33', kite: '#e53935', tail: '#1e88e5', sky: '#6f6f6f' },
      params: [{ key: 'string', label: 'String', type: 'range', min: 60, max: 300, step: 20, def: 200 }],
      draw(p, P) {
        p.poly([[0, -80], [48, -4], [0, 96], [-48, -4]], { ...o, stroke: 'kite', fill: 'paper', hatch: 'kite', hg: 5, halpha: 0.5, ha: 45 });
        p.line([[0, -80], [0, 96]], d); p.line([[-48, -4], [48, -4]], d);
        p.curve([[0, 96], [-26, 130], [18, 160], [-16, 196]], { stroke: 'tail', w: 3 });
        for (const [x, y] of [[-20, 128], [10, 156], [-10, 186]]) p.poly([[x - 8, y - 6], [x + 8, y - 6], [x, y + 4]], { stroke: 'tail', w: 2.5, fill: 'tail' });
        p.curve([[0, 96], [-30, 96 + P.string * 0.4], [-90, 96 + P.string * 0.8], [-140, 96 + P.string]], { stroke: 'sky', w: 1.5 });
      } },
    // ---------- ball ----------
    { type: 'prop', id: 'park-ball', name: 'Beach ball', cat: 'Toys', tags: ['bouncy ball', 'play', 'rubber ball', 'toy', 'striped ball', 'summer'],
      colors: { line: '#6f6f6f', a: '#e53935', b: '#fbc02d', c: '#1e88e5' },
      params: [{ key: 'size', label: 'Size', type: 'select', options: { small: 'Small', big: 'Big' }, def: 'big' }],
      draw(p, P) {
        const r = P.size === 'small' ? 28 : 46, y = -r;
        p.circ(0, y, r, { ...o, w: 3.5, fill: 'paper' });
        p.arc(0, y, r * 0.55, r, -90, 90, { stroke: 'a', w: 3 }); p.arc(0, y, r * 0.55, r, 90, 270, { stroke: 'b', w: 3 }); p.arc(0, y, r * 0.9, r * 0.9, 215, 325, { stroke: 'c', w: 3 });
        p.circ(0, y, 5, { stroke: 'line', w: 2.5, fill: 'paper' });
        p.arc(0, y, r * 0.8, r * 0.3, 20, 160, { stroke: 'a', w: 4 });
      } },
    // ---------- scooter ----------
    { type: 'prop', id: 'park-scooter', name: 'Scooter', cat: 'Toys', tags: ['kick scooter', 'ride', 'wheels', 'handlebar', 'toy', 'outdoor toy'],
      colors: { line: '#6f6f6f', frame: '#1e88e5', stream: '#e53935', tyre: '#455a64' },
      params: [{ key: 'streamers', label: 'Streamers', type: 'toggle', def: true }],
      draw(p, P) {
        for (const x of [-72, 78]) { p.circ(x, -26, 26, { stroke: 'tyre', w: 5, fill: false }); p.circ(x, -26, 5, { ...d, fill: 'paper' }); }
        p.rect(-72, -42, 150, 14, { ...o, stroke: 'frame', fill: 'paper', hatch: 'frame', hg: 4, halpha: 0.5 });
        p.line([[78, -26], [66, -190]], { stroke: 'frame', w: 5 }); p.line([[40, -192], [92, -192]], { stroke: 'line', w: 5 });
        p.line([[-72, -26], [-58, -38]], d);
        p.circ(40, -192, 6, { ...d, fill: 'paper' }); p.circ(92, -192, 6, { ...d, fill: 'paper' });
        if (P.streamers) for (const [x, s] of [[40, -1], [92, 1]]) { p.curve([[x, -192], [x + s * 16, -170], [x + s * 10, -150]], { stroke: 'stream', w: 3 }); p.curve([[x, -192], [x + s * 24, -178], [x + s * 22, -160]], { stroke: 'frame', w: 3 }); }
      } },
  ] });
})();
