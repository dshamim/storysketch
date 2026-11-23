// Props: School - outside (school building, school bus, bus stop, zebra crossing, crossing-patrol sign, flagpole, bell). Storybook scale (docs/PROP-STYLE-GUIDE.md):
// the school door is 340 high (a child or an adult fits), the building is 880 wide, the bus 760 x 360. Floor props: origin = bottom centre (stands on y = 0).
// The bus faces right; press H to flip it.
(() => {
  const PACK = 'School props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const sheet = (hatch, a = 0.45, hg = 8, ha = 90) => ({ fill: 'paper', hatch, hg, halpha: a, ha });

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'school-building', name: 'School building', cat: 'Buildings', tags: ['school', 'classroom building', 'front of school', 'entrance', 'building'],
      colors: { line: '#8a5a33', brick: '#c2674a', roof: '#6f6f6f', glass: '#4fc3f7', door: '#1e88e5', light: '#fbc02d', sign: '#43a047' },
      params: [{ key: 'open', label: 'Doors open', type: 'toggle', def: false }, { key: 'lights', label: 'Lights on', type: 'toggle', def: false }, { key: 'clock', label: 'Clock in the gable', type: 'toggle', def: true }],
      draw(p, P) {
        const win = (cx, top) => { p.rect(cx - 45, top, 90, 96, { ...o, w: 3.5, fill: P.lights ? 'light' : 'paper', hatch: P.lights ? 'light' : 'glass', hg: P.lights ? 4 : 6, halpha: P.lights ? 0.6 : 0.35, ha: 55 }); p.line([[cx, top], [cx, top + 96]], f); p.line([[cx - 45, top + 48], [cx + 45, top + 48]], f); p.rect(cx - 52, top + 96, 104, 10, { ...f, fill: 'paper' }); };
        p.rect(-440, -400, 880, 400, { ...o, ...sheet('brick', 0.5, 8, 0) });                                   // the two wings
        p.rect(-450, -420, 900, 22, { ...o, fill: 'paper' });                                                    // roof edge
        p.rect(-170, -470, 340, 470, { ...o, ...sheet('brick', 0.5, 8, 0) });                                    // the middle block
        p.poly([[-190, -470], [0, -560], [190, -470]], { ...o, ...sheet('roof', 0.5, 7, -45) });                 // gable
        if (P.clock) { p.circ(0, -500, 30, { ...o, w: 3.5, fill: 'paper' }); p.line([[0, -500], [0, -520]], d); p.line([[0, -500], [14, -494]], d); }
        for (const sx of [-1, 1]) for (const k of [0, 1, 2]) { const cx = sx * (230 + k * 0) + (k === 0 ? 0 : sx * k * 0); }
        for (const cx of [-390, -290, -190, 190, 290, 390]) { if (Math.abs(cx) > 170 + 45) { win(cx, -340); win(cx, -210); } }
        p.rect(-100, -340, 200, 28, { ...d, stroke: 'sign', w: 3.5, fill: 'paper', hatch: 'sign', hg: 5, halpha: 0.45 });                                 // the name board (no words, so it never mirrors)
        for (const dx of [-90, 0]) {                                                                              // double doors, 340 high
          p.rect(dx, -300, 90, 300, { ...o, fill: P.open ? 'paper' : 'paper', hatch: P.open ? 'glass' : 'door', hg: 7, halpha: P.open ? 0.2 : 0.4, ha: 90 });
        }
        if (P.open) { p.poly([[-90, -300], [-140, -284], [-140, -10], [-90, 0]], { ...d, ...sheet('door', 0.4, 7) }); p.poly([[90, -300], [140, -284], [140, -10], [90, 0]], { ...d, ...sheet('door', 0.4, 7) }); p.rect(-86, -296, 172, 292, { ...f, fill: 'paper', hatch: 'glass', hg: 10, halpha: 0.2, ha: 60 }); }
        else { for (const dx of [-90, 0]) { p.rect(dx + 12, -280, 66, 110, { ...f, stroke: 'door' }); p.rect(dx + 12, -156, 66, 140, { ...f, stroke: 'door' }); } p.circ(-12, -150, 5, { ...d, fill: 'paper' }); p.circ(12, -150, 5, { ...d, fill: 'paper' }); }
        p.rect(-130, -16, 260, 16, { ...d, fill: 'paper' }); p.rect(-110, -32, 220, 16, { ...d, fill: 'paper' });                                                    // steps
      } },
    { type: 'prop', id: 'school-bus', name: 'School bus', cat: 'Vehicles', tags: ['bus', 'yellow bus', 'coach', 'transport', 'travel to school', 'vehicle'],
      colors: { line: '#6f6f6f', body: '#fbc02d', glass: '#4fc3f7', tyre: '#455a64', inside: '#a1887f', light: '#fff176', stripe: '#e53935' },
      params: [{ key: 'open', label: 'Door open', type: 'toggle', def: false }, { key: 'lights', label: 'Lights on', type: 'toggle', def: false }],
      draw(p, P) {
        p.poly([[-376, -50], [-376, -334], [-344, -360], [290, -360], [346, -306], [376, -250], [376, -50]], { ...o, fill: 'paper', hatch: 'body', hg: 6, halpha: 0.6, ha: 0 });   // the body
        p.line([[-376, -140], [376, -140]], { stroke: 'line', w: 6 }); p.line([[-376, -118], [376, -118]], { stroke: 'stripe', w: 4 });                                       // stripes
        for (let i = 0; i < 6; i++) { const x = -340 + i * 86; p.rect(x, -320, 74, 90, { ...d, fill: 'paper', hatch: 'glass', hg: 6, halpha: 0.35, ha: 55 }); }                       // six windows, empty
        p.poly([[262, -320], [310, -320], [348, -266], [262, -266]], { ...d, fill: 'paper', hatch: 'glass', hg: 6, halpha: 0.35, ha: 55 });                                     // windscreen
        p.rect(264, -262, 74, 206, { ...o, w: 3.5, fill: 'paper', hatch: P.open ? 'inside' : 'glass', hg: P.open ? 4 : 8, halpha: P.open ? 0.6 : 0.3, ha: 80 });                  // door opening
        if (P.open) { for (const y of [-92, -66]) p.line([[266, y], [336, y]], d); p.poly([[264, -262], [226, -250], [226, -62], [264, -56]], { ...d, ...sheet('glass', 0.35, 6) }); }
        else p.line([[301, -262], [301, -56]], f);
        p.rect(-390, -64, 780, 18, { ...d, fill: 'paper' });                                                                                                                      // bumper
        for (const x of [-230, 200]) { p.arc(x, -48, 62, 62, 180, 360, { stroke: 'line', w: 3 }); p.circ(x, -48, 46, { ...o, stroke: 'tyre', fill: 'paper', hatch: 'tyre', hg: 5, halpha: 0.5 }); p.circ(x, -48, 18, { ...d, fill: 'paper' }); p.circ(x, -48, 5, { ...f, fill: 'paper' }); }
        p.circ(366, -112, 14, { ...d, fill: P.lights ? 'light' : 'paper', hatch: P.lights ? 'light' : 'line', hg: 3, halpha: P.lights ? 0.8 : 0.2 });
        p.rect(-372, -358, 80, 12, { ...f, stroke: 'stripe', fill: 'paper', hatch: 'stripe', hg: 3, halpha: 0.6 });                                                                // a roof light
      } },
    { type: 'prop', id: 'school-busstop', name: 'Bus stop', cat: 'Signs', tags: ['bus sign', 'bus shelter', 'stop', 'waiting', 'transport'],
      colors: { line: '#6f6f6f', sign: '#e53935', glass: '#4fc3f7', roof: '#1e88e5' },
      params: [{ key: 'shelter', label: 'Shelter', type: 'toggle', def: true }],
      draw(p, P) {
        const px = P.shelter ? -100 : 0; p.line([[px, 0], [px, -300]], { stroke: 'line', w: 6 }); p.circ(px, -300, 36, { ...o, stroke: 'sign', fill: 'paper', hatch: 'sign', hg: 4, halpha: 0.6 }); p.rect(px - 22, -308, 44, 16, { ...d, fill: 'paper' });
        if (P.shelter) { p.line([[0, 0], [0, -230]], o); p.line([[170, 0], [170, -230]], o); p.poly([[-14, -230], [184, -230], [170, -262], [0, -262]], { ...o, ...sheet('roof', 0.55, 6, 60) }); p.rect(6, -226, 158, 170, { ...f, fill: 'paper', hatch: 'glass', hg: 9, halpha: 0.25, ha: 55 });
          p.rect(24, -80, 122, 12, { ...d, fill: 'paper' }); p.line([[40, -68], [40, 0]], d); p.line([[130, -68], [130, 0]], d); }
      } },
    { type: 'prop', id: 'school-crossing', name: 'Zebra crossing', cat: 'Signs', tags: ['road crossing', 'pedestrian crossing', 'road', 'stripes', 'cross the road'],
      colors: { line: '#6f6f6f', road: '#78909c', paint: '#bdbdbd' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 200, max: 700, step: 20, def: 360 }],
      draw(p, P) {
        const W = P.width / 2; p.rect(-W, -64, W * 2, 64, { stroke: false, fill: 'paper', hatch: 'road', hg: 10, ha: 12, halpha: 0.5 });
        p.line([[-W, -64], [W, -64]], d); p.line([[-W, 0], [W, 0]], d);
        for (let x = -W + 16; x < W - 30; x += 56) p.rect(x, -54, 32, 44, { stroke: 'paint', w: 2.5, fill: 'paper', hatch: 'paint', hg: 4, halpha: 0.7, ha: 90 });
      } },
    { type: 'prop', id: 'school-lollipop', name: 'Crossing patrol sign', cat: 'Signs', tags: ['stop sign', 'lollipop', 'crossing guard', 'lollipop lady', 'road safety'],
      colors: { line: '#6f6f6f', sign: '#e53935' },
      params: [{ key: 'flip', label: 'Held up', type: 'toggle', def: true }],
      draw(p, P) {
        p.line([[0, 0], [0, -250]], { stroke: 'line', w: 6 });
        p.circ(0, -300, 56, { ...o, stroke: 'sign', fill: 'paper', hatch: 'sign', hg: 4, halpha: P.flip ? 0.7 : 0.25 }); p.circ(0, -300, 42, { stroke: 'sign', w: 2.5 }); p.rect(-30, -310, 60, 20, { ...d, stroke: 'sign', fill: 'paper' });
      } },
    { type: 'prop', id: 'school-gate', name: 'School gate', cat: 'Buildings', tags: ['entrance', 'gates', 'fence', 'playground gate', 'school entrance'],
      colors: { line: '#6f6f6f', gate: '#1e88e5', brick: '#c2674a' },
      params: [{ key: 'open', label: 'Gates open', type: 'toggle', def: false }],
      draw(p, P) {
        for (const x of [-170, 170]) { p.rect(x - 18, -210, 36, 210, { ...o, ...sheet('brick', 0.5, 8, 0) }); p.rect(x - 24, -228, 48, 20, { ...d, fill: 'paper' }); }
        if (P.open) for (const s of [-1, 1]) p.poly([[s * 152, -170], [s * 196, -158], [s * 196, -10], [s * 152, -2]], { ...d, stroke: 'gate', ...sheet('gate', 0.4, 6) });
        else for (const s of [-1, 1]) { p.rect(s === -1 ? -152 : 2, -170, 150, 164, { ...o, w: 3.5, stroke: 'gate', fill: 'paper' }); for (let x = 12; x < 148; x += 24) p.line([[s * x, -170], [s * x, -6]], { stroke: 'gate', w: 2.5 }); p.line([[s === -1 ? -152 : 2, -90], [s === -1 ? -2 : 152, -90]], { stroke: 'gate', w: 3 }); }
      } },
    { type: 'prop', id: 'school-flagpole', name: 'Flagpole', cat: 'School', tags: ['flag', 'pole', 'playground', 'banner'],
      colors: { line: '#6f6f6f', flag: '#e53935', stripe: '#fbc02d' },
      params: [{ key: 'waving', label: 'Flag waving', type: 'toggle', def: true }],
      draw(p, P) {
        const X = -68; p.line([[X, 0], [X, -480]], { stroke: 'line', w: 6 }); p.circ(X, -488, 8, { ...d, fill: 'paper' }); p.rect(X - 18, -10, 36, 10, { ...d, fill: 'paper' });
        const w = P.waving ? [[6, -460], [60, -450], [112, -470], [150, -456], [146, -386], [108, -400], [56, -380], [6, -392]] : [[6, -460], [56, -460], [106, -460], [150, -460], [150, -390], [106, -390], [56, -390], [6, -390]];
        p.poly(w.map(([x, y]) => [x + X, y]), { ...o, stroke: 'flag', fill: 'paper', hatch: 'flag', hg: 5, halpha: 0.6, ha: 60 }); p.line([[X + 6, -425], [X + 148, -425]], { stroke: 'stripe', w: 5 });
      } },
    { type: 'prop', id: 'school-bell', name: 'School bell', cat: 'School', tags: ['handbell', 'ring', 'hand bell', 'playtime', 'break'],
      colors: { line: '#6f6f6f', bell: '#fbc02d', handle: '#8a5a33' },
      params: [{ key: 'ringing', label: 'Ringing', type: 'toggle', def: false }],
      draw(p, P) {
        p.poly([[-34, -4], [-30, -34], [-16, -62], [16, -62], [30, -34], [34, -4]], { ...o, stroke: 'bell', fill: 'paper', hatch: 'bell', hg: 4, halpha: 0.6, ha: 60, smooth: true });
        p.rect(-8, -118, 16, 56, { ...o, stroke: 'handle', fill: 'paper', hatch: 'handle', hg: 5, halpha: 0.4 }); p.circ(0, 0, 6, { ...d, fill: 'paper' });
        if (P.ringing) for (const s of [-1, 1]) { p.curve([[s * 48, -40], [s * 58, -26], [s * 48, -12]], { stroke: 'line', w: 3 }); p.curve([[s * 62, -50], [s * 78, -26], [s * 62, -2]], { stroke: 'line', w: 3 }); }
      } },
  ] });
})();
