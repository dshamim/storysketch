// Props: Arts. Part of the Classroom props pack. One file may register many props. See ../../README.md.
// Floor props: origin = bottom centre (stands on y=0). Floating props: origin = centre.
(() => {
  const { PAL, heartPts, starPts, bumpy, paintingOn } = CP.helpers;
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
  { type: 'prop', id: 'drum', name: 'Drum', cat: 'Arts', anchor: 'floor', colors: { line: '#5a5a5a', shell: '#9aa0a6', lace: '#5a5a5a' },
    draw(p) { const body = [[-55, -88]]; for (let i = 0; i <= 16; i++) { const a = U.rad(180 - i * 180 / 16); body.push([55 * Math.cos(a), -12 + 14 * Math.sin(a)]); } body.push([55, -88]);
      p.poly(body, { stroke: 'line', w: 4.5, fill: 'paper', hatch: 'shell', hg: 7, halpha: 0.35, ha: 80 });
      const zig = []; for (let i = 0; i <= 8; i++) { const x = -50 + i * 12.5; const cy = Math.sqrt(1 - Math.pow(x / 55, 2)); zig.push([x, (i % 2 ? -22 : -74) + cy * 12]); } p.line(zig, { stroke: 'lace', w: 3.5 });
      p.arc(0, -78, 55, 13, 0, 180, { stroke: 'line', w: 3 }); p.ell(0, -88, 55, 14, { stroke: 'line', w: 4.5, fill: 'paper' }); } },
  { type: 'prop', id: 'drumsticks', name: 'Drumstick', cat: 'Arts', colors: { line: '#8a5a33' },
    draw(p) { p.line([[-45, 18], [40, -14]], { stroke: 'line', w: 5 }); p.circ(42, -15, 6, { stroke: 'line', w: 3, fill: 'line' }); } },
  { type: 'prop', id: 'paintpots', name: 'Paint pots', cat: 'Arts', colors: { a: '#e53935', b: '#fbc02d', c: '#1e88e5' },
    draw(p) { ['a', 'b', 'c'].forEach((k, i) => { const x = -52 + i * 52; p.rect(x - 20, -46, 40, 46, { stroke: k, w: 3.5, fill: 'paper', hatch: k, hg: 4, halpha: 0.75 }); p.ell(x, -48, 21, 6, { stroke: k, w: 3.5, fill: 'paper' }); p.line([[x - 12, -30], [x - 12, -10]], { stroke: '#ffffff', w: 3 }); }); } },
  { type: 'prop', id: 'crayoncup', name: 'Crayon cup', cat: 'Arts', colors: { cup: '#43a047' },
    draw(p) { [['#e53935', -16, -112], ['#fbc02d', -6, -120], ['#1e88e5', 4, -116], ['#8e24aa', 14, -110], ['#fb8c00', 22, -104]].forEach(([c, x, top], i) => { const dx = (i - 2) * 5; p.line([[x, -50], [x + dx, top + 10]], { stroke: c, w: 7 }); p.poly([[x + dx - 3.5, top + 10], [x + dx + 3.5, top + 10], [x + dx, top]], { stroke: c, w: 2, fill: c }); });
      p.poly([[-32, -72], [32, -72], [26, 0], [-26, 0]], { stroke: 'cup', w: 4, fill: 'paper', hatch: 'cup', hg: 5, halpha: 0.6 }); } },
  { type: 'prop', id: 'brush', name: 'Paintbrush', cat: 'Arts', colors: { handle: '#8a5a33', paint: '#e53935' },
    draw(p) { p.line([[-62, 26], [28, -12]], { stroke: 'handle', w: 6 }); p.line([[28, -12], [40, -17]], { stroke: '#8a8a8a', w: 8 }); p.poly([[40, -23], [64, -27], [70, -24], [48, -10]], { stroke: 'paint', w: 3, hatch: 'paint', hg: 3, halpha: 0.9, smooth: true }); } },
  { type: 'prop', id: 'palette', name: 'Palette', cat: 'Arts', colors: { line: '#8a5a33' },
    draw(p) { p.poly([[-72, 0], [-62, -34], [-10, -46], [52, -36], [76, 0], [56, 38], [0, 46], [-40, 36], [-30, 16], [-50, 12]], { stroke: 'line', w: 4, fill: 'paper', hatch: 'line', hg: 9, halpha: 0.2, smooth: true }); p.ell(-46, 0, 9, 7, { stroke: 'line', w: 3, fill: 'paper' });
      [[-30, -24], [5, -30], [38, -20], [52, 8], [26, 26], [-6, 20]].forEach(([x, y], i) => p.circ(x, y, 9, { stroke: PAL[i], w: 2.5, hatch: PAL[i], hg: 2.5, halpha: 0.95 })); } },
  { type: 'prop', id: 'paper', name: 'Drawing on paper', cat: 'Arts', colors: { line: '#9a9a9a' },
    slots: [{ key: 'art', label: 'Drawing', kind: 'picture', def: 'heart', box: [-80, -60, 160, 120] }],
    draw(p, P, it, x) { p.rect(-80, -60, 160, 120, { stroke: 'line', w: 3, fill: 'paper' }); x.slot('art'); } },
  { type: 'prop', id: 'scissors', name: 'Scissors', cat: 'Arts', colors: { handle: '#1e88e5', blade: '#7a7a7a' },
    draw(p) { p.line([[-22, -8], [48, 8]], { stroke: 'blade', w: 4 }); p.line([[-22, 8], [48, -8]], { stroke: 'blade', w: 4 }); p.ell(-36, -13, 14, 10, { stroke: 'handle', w: 4 }); p.ell(-36, 13, 14, 10, { stroke: 'handle', w: 4 }); p.circ(4, 0, 3, { stroke: 'blade', w: 2, fill: 'blade' }); } },
  { type: 'prop', id: 'crown', name: 'Crown', cat: 'Arts', colors: { line: '#f2b705' },
    draw(p) { p.poly([[-40, 20], [-44, -18], [-22, 2], [0, -28], [22, 2], [44, -18], [40, 20]], { stroke: 'line', w: 4, hatch: 'line', hg: 3.5, halpha: 0.8 }); [[-20, 12, '#e53935'], [0, 10, '#1e88e5'], [20, 12, '#43a047']].forEach(([x, y, c]) => p.circ(x, y, 4, { stroke: c, w: 2, fill: c })); } },
  { type: 'prop', id: 'sword', name: 'Play sword', cat: 'Arts', colors: { blade: '#8a8a8a', hilt: '#7a4e2d' },
    draw(p) { p.poly([[-6, -40], [0, -120], [6, -40]], { stroke: 'blade', w: 3.5, fill: 'paper', hatch: 'blade', hg: 4, halpha: 0.4 }); p.line([[-20, -40], [20, -40]], { stroke: 'hilt', w: 6 }); p.line([[0, -40], [0, -5]], { stroke: 'hilt', w: 6 }); } },
  { type: 'prop', id: 'notes', name: 'Music notes', cat: 'Arts', colors: { line: '#3a3a3a' }, params: [{ key: 'kind', label: 'Notes', type: 'select', options: { single: '♪ single', double: '♫ double', both: 'Both' }, def: 'single' }],
    draw(p, P) { const note = (x, y) => { const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; const ex = 11 * Math.cos(a), ey = 7.5 * Math.sin(a); const r = U.rad(-25); pts.push([x + ex * Math.cos(r) - ey * Math.sin(r), y + ex * Math.sin(r) + ey * Math.cos(r)]); } p.poly(pts, { stroke: 'line', w: 3, fill: 'line', smooth: true }); };
      const single = (x, y) => { note(x, y); p.line([[x + 9, y - 3], [x + 9, y - 62]], { stroke: 'line', w: 4 }); p.curve([[x + 9, y - 62], [x + 26, y - 44], [x + 22, y - 26]], { stroke: 'line', w: 4 }); };
      const dbl = (x, y) => { note(x - 20, y + 6); note(x + 20, y - 4); p.line([[x - 11, y + 3], [x - 11, y - 56]], { stroke: 'line', w: 4 }); p.line([[x + 29, y - 7], [x + 29, y - 66]], { stroke: 'line', w: 4 }); p.line([[x - 11, y - 56], [x + 29, y - 66]], { stroke: 'line', w: 8 }); };
      if (P.kind === 'single') single(0, 30); else if (P.kind === 'double') dbl(0, 30); else { single(-45, 40); dbl(40, 10); } } },
  ] });
})();
