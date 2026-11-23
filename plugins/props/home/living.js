// Props: Home - living room (sofa, armchair, coffee table, TV, wall clock, fireplace). Human scale: every seat is 80 high (see docs/PROP-STYLE-GUIDE.md).
// Floor props: origin = bottom centre (stands on y = 0). The clock hangs on a wall: floating, centred on 0,0.
(() => {
  const PACK = 'Home props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const cloth = { fill: 'paper', hatch: 'fabric', hg: 6, halpha: 0.45, ha: -40 };
  const wood = { fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, ha: 90 };

  // a soft seat: back, arms, base and cushions. `half` = half the width.
  function sofa(p, P, half, armH) {
    const hw = half, ar = 38;
    p.rect(-hw + 26, -164, hw * 2 - 52, 90, { ...o, ...cloth });                                                 // back
    p.rect(-hw, -armH, ar, armH - 8, { ...o, ...cloth }); p.rect(hw - ar, -armH, ar, armH - 8, { ...o, ...cloth });  // arms
    p.ell(-hw + ar / 2, -armH, ar / 2, 11, { ...d, fill: 'paper', hatch: 'fabric', hg: 5, halpha: 0.35 }); p.ell(hw - ar / 2, -armH, ar / 2, 11, { ...d, fill: 'paper', hatch: 'fabric', hg: 5, halpha: 0.35 });
    p.rect(-hw + ar, -46, hw * 2 - ar * 2, 38, { ...o, ...cloth });                                              // base
    const n = Math.max(1, Math.round((hw * 2 - ar * 2) / 108)), cw = (hw * 2 - ar * 2) / n;
    for (let i = 0; i < n; i++) p.rect(-hw + ar + i * cw + 2, -80, cw - 4, 36, { ...d, ...cloth });             // seat cushions: top at 80
    for (const x of [-hw + 10, hw - 22]) p.rect(x, -8, 12, 8, { ...d, fill: 'paper' });                           // feet
    if (P.cushion) { p.poly([[-hw + ar + 8, -86], [-hw + ar + 52, -90], [-hw + ar + 56, -134], [-hw + ar + 12, -130]], { stroke: 'accent', w: 3, fill: 'paper', hatch: 'accent', hg: 5, halpha: 0.5 }); }
  }

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'home-sofa', name: 'Sofa', cat: 'Furniture', tags: ['couch', 'settee', 'living room', 'seat'],
      colors: { line: '#8a5a33', fabric: '#3f8ae0', accent: '#e53935' },
      params: [{ key: 'seats', label: 'Size', type: 'select', options: { 2: '2 seats', 3: '3 seats' }, def: '2' }, { key: 'cushion', label: 'Cushion', type: 'toggle', def: true }],
      draw(p, P) { sofa(p, P, P.seats === '3' ? 170 : 150, 120); } },
    { type: 'prop', id: 'home-armchair', name: 'Armchair', cat: 'Furniture', tags: ['chair', 'easy chair', 'living room', 'seat'],
      colors: { line: '#8a5a33', fabric: '#3f8ae0', accent: '#e53935' },
      params: [{ key: 'cushion', label: 'Cushion', type: 'toggle', def: false }],
      draw(p, P) { sofa(p, P, 80, 120); } },
    { type: 'prop', id: 'home-coffeetable', name: 'Coffee table', cat: 'Furniture', tags: ['low table', 'living room', 'table'],
      colors: { line: '#8a5a33', accent: '#e53935', leaf: '#43a047' },
      params: [{ key: 'on', label: 'On the table', type: 'select', options: { none: 'Nothing', book: 'A book', flowers: 'Flowers' }, def: 'none' }],
      draw(p, P) {
        for (const x of [-72, 66]) p.line([[x, -58], [x + (x < 0 ? -4 : 4), 0]], o);
        p.line([[-58, -52], [-62, -4]], f); p.line([[56, -52], [60, -4]], f);
        p.poly([[-88, -68], [80, -68], [92, -56], [-76, -56]], { ...o, ...wood });
        p.rect(-76, -56, 168, 8, { ...d, fill: 'paper' });
        if (P.on === 'book') { p.poly([[-30, -72], [20, -72], [26, -80], [-24, -80]], { ...d, fill: 'paper', hatch: 'accent', hg: 4, halpha: 0.5 }); p.rect(-30, -72, 50, 6, { ...f, stroke: 'accent', fill: 'paper' }); }
        if (P.on === 'flowers') { p.poly([[-8, -70], [14, -70], [10, -96], [-4, -96]], { ...d, fill: 'paper', hatch: 'accent', hg: 4, halpha: 0.4 }); for (const [x, y] of [[-12, -128], [3, -136], [18, -126]]) { p.line([[3, -96], [x + 3, y + 8]], { stroke: 'leaf', w: 2.5 }); p.circ(x + 3, y, 9, { stroke: 'accent', w: 2.5, fill: 'paper', hatch: 'accent', hg: 3, halpha: 0.6 }); } }
      } },
    { type: 'prop', id: 'home-tv', name: 'TV on a cabinet', cat: 'Furniture', tags: ['television', 'screen', 'living room'],
      colors: { line: '#8a5a33', screen: '#26c6da', frame: '#6f6f6f', sun: '#fbc02d', hill: '#43a047' },
      params: [{ key: 'on', label: 'Switched on', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-100, -68, 200, 68, { ...o, ...wood }); p.line([[0, -68], [0, 0]], d); p.circ(-14, -34, 4, { ...f, fill: 'paper' }); p.circ(14, -34, 4, { ...f, fill: 'paper' });
        p.rect(-92, -156, 184, 88, { stroke: 'frame', w: 4.5, fill: 'paper' });                                   // the TV
        p.rect(-82, -148, 164, 70, P.on ? { stroke: 'frame', w: 2.5, fill: 'paper', hatch: 'screen', hg: 4, halpha: 0.6, ha: 50 } : { stroke: 'frame', w: 2.5, fill: 'paper', hatch: 'frame', hg: 8, halpha: 0.25, ha: 50 });
        if (P.on) { p.circ(-38, -122, 12, { stroke: 'sun', w: 3, fill: 'paper', hatch: 'sun', hg: 3, halpha: 0.7 }); p.poly([[-82, -78], [-30, -112], [10, -90], [50, -118], [82, -96], [82, -78]], { stroke: 'hill', w: 3, fill: 'paper', hatch: 'hill', hg: 5, halpha: 0.5 }); }
        p.line([[-14, -156], [-30, -178]], d); p.line([[14, -156], [30, -178]], d);                                // aerial
      } },
    { type: 'prop', id: 'home-clock', name: 'Wall clock', cat: 'Furniture', floating: true, tags: ['time', 'hours', 'wall clock'],
      colors: { line: '#8a5a33', hand: '#6f6f6f', accent: '#e53935' },
      params: [{ key: 'hour', label: 'Hour', type: 'range', min: 1, max: 12, step: 1, def: 3 }, { key: 'minute', label: 'Minutes', type: 'range', min: 0, max: 55, step: 5, def: 0 }],
      draw(p, P) {
        p.circ(0, 0, 52, { ...o, fill: 'paper', hatch: 'line', hg: 8, halpha: 0.15 }); p.circ(0, 0, 44, { stroke: 'line', w: 2.2 });
        for (let i = 0; i < 12; i++) { const a = U.rad(i * 30 - 90), r1 = i % 3 ? 36 : 32; p.line([[Math.cos(a) * r1, Math.sin(a) * r1], [Math.cos(a) * 42, Math.sin(a) * 42]], { stroke: 'line', w: i % 3 ? 2.2 : 3.5 }); }
        const ha = U.rad(((P.hour % 12) + P.minute / 60) * 30 - 90), ma = U.rad(P.minute * 6 - 90);
        p.line([[0, 0], [Math.cos(ha) * 22, Math.sin(ha) * 22]], { stroke: 'hand', w: 4.5 }); p.line([[0, 0], [Math.cos(ma) * 33, Math.sin(ma) * 33]], { stroke: 'hand', w: 3 }); p.circ(0, 0, 4, { stroke: 'accent', w: 2.5, fill: 'paper' });
      } },
    { type: 'prop', id: 'home-fireplace', name: 'Fireplace', cat: 'Furniture', tags: ['fire', 'chimney', 'hearth', 'living room', 'warm'],
      colors: { line: '#8a5a33', brick: '#c2674a', flame: '#fb8c00', flame2: '#e53935', ash: '#9e9e9e' },
      params: [{ key: 'fire', label: 'Fire lit', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-120, -214, 240, 214, { ...o, fill: 'paper', hatch: 'brick', hg: 8, halpha: 0.4, ha: 0 });          // brick surround
        for (let y = -190; y < -10; y += 24) p.line([[-120, y], [-72, y]], { stroke: 'brick', w: 1.5 }), p.line([[72, y], [120, y]], { stroke: 'brick', w: 1.5 });
        p.rect(-140, -236, 280, 24, { ...o, fill: 'paper' });                                                       // mantel shelf
        p.rect(-68, -150, 136, 150, { ...o, fill: 'paper', hatch: 'ash', hg: 5, halpha: 0.5, ha: 60 });            // the opening (mid-grey hatching, never solid dark)
        if (P.fire) { p.line([[-44, -14], [40, -22]], { stroke: 'line', w: 6 }); p.line([[-36, -24], [46, -12]], { stroke: 'line', w: 6 }); p.poly([[-34, -26], [-22, -74], [-8, -50], [4, -104], [18, -56], [30, -78], [40, -26]], { stroke: 'flame2', w: 3.5, fill: 'paper', hatch: 'flame2', hg: 4, halpha: 0.7, ha: 80 }); p.poly([[-14, -26], [-4, -56], [6, -44], [12, -66], [22, -26]], { stroke: 'flame', w: 2.5, fill: 'paper', hatch: 'flame', hg: 3, halpha: 0.8, ha: 80 }); }
        p.rect(-134, -8, 268, 8, { ...d, fill: 'paper' });                                                          // hearth
      } },
  ] });
})();
