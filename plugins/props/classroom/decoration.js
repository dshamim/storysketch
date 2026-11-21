// Props: Decoration. Part of the Classroom props pack. One file may register many props. See ../../README.md.
// Floor props: origin = bottom centre (stands on y=0). Floating props: origin = centre.
(() => {
  const { PAL, heartPts, starPts, bumpy, paintingOn } = CP.helpers;
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
  { type: 'prop', id: 'sun', name: 'Sun', cat: 'Decoration', colors: { line: '#f9c80e' },
    draw(p) { p.circ(0, 0, 55, { stroke: 'line', w: 5, hatch: 'line', hg: 4, halpha: 0.85 }); for (let i = 0; i < 12; i++) { const a = U.rad(i * 30 + 8); const r2 = i % 2 ? 98 : 112; p.line([[Math.cos(a) * 72, Math.sin(a) * 72], [Math.cos(a) * r2, Math.sin(a) * r2]], { stroke: 'line', w: 6 }); } } },
  { type: 'prop', id: 'rainbowframe', name: 'Picture frame', cat: 'Decoration', colors: { frame: '#1e88e5' },
    slots: [{ key: 'art', label: 'Picture', kind: 'picture', def: 'rainbow', box: [-64, -47, 128, 94] }],
    draw(p, P, it, x) { p.rect(-75, -58, 150, 116, { stroke: 'frame', w: 5, fill: 'paper' }); p.rect(-64, -47, 128, 94, { stroke: 'frame', w: 2 }); x.slot('art'); } },
  { type: 'prop', id: 'plant', name: 'Potted plant', cat: 'Decoration', colors: { leaf: '#43a047', pot: '#c56a3a' },
    slots: [{ key: 'bloom', label: 'Flowers', kind: 'flower', def: 'none', box: [-50, -190, 100, 70] }],
    draw(p, P, it, x) { [-62, -38, -14, 10, 34, 58].forEach((a, i) => { const L = 70 + (i % 2) * 18; const d = U.dir(a - 90), n = [-d[1], d[0]]; const b = [0, -56]; const tip = U.add(b, U.mul(d, L)); const mid = U.add(b, U.mul(d, L * 0.5)); p.poly([b, U.add(mid, U.mul(n, 11)), tip, U.add(mid, U.mul(n, -11))], { stroke: 'leaf', w: 3.5, hatch: 'leaf', hg: 4, halpha: 0.7, smooth: true }); p.line([b, U.lerp2(b, tip, 0.85)], { stroke: 'leaf', w: 2 }); });
      x.slot('bloom');
      p.poly([[-30, -52], [30, -52], [22, 0], [-22, 0]], { stroke: 'pot', w: 4, fill: 'paper', hatch: 'pot', hg: 5, halpha: 0.55 }); p.rect(-35, -62, 70, 12, { stroke: 'pot', w: 4, fill: 'paper', hatch: 'pot', hg: 4, halpha: 0.6 }); } },
  { type: 'prop', id: 'star', name: 'Star', cat: 'Decoration', colors: { line: '#f2b705' },
    draw(p) { p.poly(starPts(0, 0, 45, 20), { stroke: 'line', w: 4, hatch: 'line', hg: 4, halpha: 0.8 }); } },
  { type: 'prop', id: 'heart', name: 'Heart', cat: 'Decoration', colors: { line: '#e53935' },
    draw(p) { p.poly(heartPts(0, 0, 50), { stroke: 'line', w: 4, hatch: 'line', hg: 4, halpha: 0.85, smooth: true }); } },
  { type: 'prop', id: 'cloud', name: 'Cloud', cat: 'Decoration', colors: { line: '#64b5f6' },
    draw(p) { p.poly(bumpy(0, 0, 90, 42, 7, 0.22), { stroke: 'line', w: 4, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, smooth: true }); } },
  { type: 'prop', id: 'splash', name: 'Paint splash', cat: 'Decoration', colors: { line: '#e53935' },
    draw(p, P, it) { const r = U.rng(U.hash(it.id)); const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const rr = (i % 2 ? 38 : 52) + r() * 16; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.85]); } p.poly(pts, { stroke: 'line', w: 3.5, hatch: 'line', hg: 3.5, halpha: 0.9, smooth: true });
      for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2, d = 75 + r() * 30; p.circ(Math.cos(a) * d, Math.sin(a) * d * 0.85, 4 + r() * 6, { stroke: 'line', w: 2.5, fill: 'line' }); } } },
  { type: 'prop', id: 'sparkle', name: 'Sparkles', cat: 'Decoration', colors: { line: '#f2b705' },
    draw(p) { [[0, 0, 22], [40, -30, 12], [-36, 26, 10]].forEach(([x, y, s]) => { p.line([[x - s, y], [x + s, y]], { stroke: 'line', w: 3.5 }); p.line([[x, y - s], [x, y + s]], { stroke: 'line', w: 3.5 }); p.line([[x - s * 0.5, y - s * 0.5], [x + s * 0.5, y + s * 0.5]], { stroke: 'line', w: 2.5 }); p.line([[x + s * 0.5, y - s * 0.5], [x - s * 0.5, y + s * 0.5]], { stroke: 'line', w: 2.5 }); }); } },
  ] });
})();
