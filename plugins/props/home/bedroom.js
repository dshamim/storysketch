// Props: Home - bedroom (bed, bunk bed, cot, nightstand with lamp, toy box, teddy). Mattress tops are 70 to 90 high, so a child can sit on the edge.
// Floor props: origin = bottom centre (stands on y = 0). Colours: wood line, fabric blue, accent red, soft yellow (docs/PROP-STYLE-GUIDE.md).
(() => {
  const PACK = 'Home props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const cloth = { fill: 'paper', hatch: 'fabric', hg: 6, halpha: 0.45, ha: -40 };
  const wood = { fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, ha: 90 };
  // draw a small thing at a smaller size than it was designed on: shapes shrink, line widths and hatching stay the same (so the line weights still match the rest)
  const small = (p, k, fn) => { const q = new Pen(p.c); fn(q); const m = (c) => c.map(([x, y]) => [x * k, y * k]); for (const s of q.o) { s.pts = m(s.pts); if (s.hole) s.hole = m(s.hole); if (s.more) s.more = s.more.map(m); p.o.push(s); } };
  const blanket = (p, x0, x1, top, bot) => p.poly([[x0, top], [x1, top], [x1 + 6, bot], [x1 - 40, bot - 8], [x1 - 80, bot], [x0 + 40, bot - 8], [x0, bot]], { stroke: 'accent', w: 3.5, fill: 'paper', hatch: 'accent', hg: 6, halpha: 0.5, ha: 60 });

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'home-bed', name: 'Bed', cat: 'Bedroom', tags: ['sleep', 'bedroom', 'mattress', 'pillow', 'blanket'],
      colors: { line: '#8a5a33', fabric: '#3f8ae0', accent: '#e53935', soft: '#fbc02d' },
      params: [{ key: 'blanket', label: 'Blanket', type: 'toggle', def: true }, { key: 'pillow', label: 'Pillow', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-150, -44, 300, 22, { ...o, ...wood }); for (const x of [-142, 130]) p.rect(x, -22, 12, 22, { ...d, fill: 'paper' });
        p.poly([[-162, 0], [-162, -170], [-146, -176], [-146, 0]], { ...o, ...wood }); p.poly([[158, 0], [158, -108], [146, -108], [146, 0]], { ...o, ...wood }); // headboard (170) and footboard (108)
        p.rect(-146, -80, 292, 36, { ...o, ...cloth });
        if (P.pillow) p.poly([[-136, -82], [-62, -82], [-56, -110], [-130, -110]], { ...d, fill: 'paper', hatch: 'soft', hg: 5, halpha: 0.5, smooth: true });
        if (P.blanket) blanket(p, -40, 146, -86, -34);
      } },
    { type: 'prop', id: 'home-bunkbed', name: 'Bunk bed', cat: 'Bedroom', tags: ['bunk', 'two beds', 'bedroom', 'kids bed', 'ladder'],
      colors: { line: '#8a5a33', fabric: '#3f8ae0', accent: '#e53935' },
      params: [{ key: 'blanket', label: 'Blankets', type: 'toggle', def: true }],
      draw(p, P) {
        for (const x of [-146, 146]) p.rect(x - 7, -320, 14, 320, { ...o, ...wood });
        p.rect(-146, -70, 292, 16, { ...d, fill: 'paper' }); p.rect(-140, -118, 280, 48, { ...o, ...cloth });           // lower mattress top at 70
        p.rect(-146, -220, 292, 16, { ...d, fill: 'paper' }); p.rect(-140, -268, 280, 48, { ...o, ...cloth });           // upper mattress top at 220
        p.line([[-140, -320], [140, -320]], o); p.line([[-140, -296], [140, -296]], d); for (const x of [-100, -40, 20, 80]) p.line([[x, -320], [x, -268]], f);   // guard rail
        for (let y = -40; y > -280; y -= 40) p.line([[158, y], [190, y]], { stroke: 'line', w: 4 }); p.line([[158, -280], [158, 0]], d); p.line([[190, -280], [190, 0]], d);   // ladder
        if (P.blanket) { blanket(p, -20, 140, -122, -86); blanket(p, -20, 140, -272, -236); }
      } },
    { type: 'prop', id: 'home-cot', name: 'Cot', cat: 'Bedroom', tags: ['crib', 'baby bed', 'bedroom', 'nursery'],
      colors: { line: '#8a5a33', fabric: '#3f8ae0', soft: '#fbc02d' },
      params: [{ key: 'mobile', label: 'Hanging toys', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-96, -64, 192, 44, { ...o, ...cloth });
        for (const x of [-100, 100]) p.rect(x - 6, -140, 12, 140, { ...o, ...wood });
        p.line([[-100, -134], [100, -134]], o); p.line([[-100, -70], [100, -70]], d);
        for (let x = -84; x < 90; x += 21) p.line([[x, -134], [x, -70]], f);
        if (P.mobile) { p.line([[-60, -250], [60, -250]], d); p.line([[0, -250], [0, -140]], f); for (const [x, y] of [[-60, -200], [0, -176], [60, -204]]) { p.line([[x, -250], [x, y + 12]], f); p.circ(x, y, 12, { stroke: 'soft', w: 2.5, fill: 'paper', hatch: 'soft', hg: 3, halpha: 0.6 }); } }
      } },
    { type: 'prop', id: 'home-nightstand', name: 'Bedside table with lamp', cat: 'Bedroom', tags: ['nightstand', 'bedside', 'lamp', 'light', 'night light', 'bedroom'],
      colors: { line: '#8a5a33', shade: '#e53935', light: '#fbc02d' },
      params: [{ key: 'on', label: 'Lamp on', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-45, -100, 90, 100, { ...o, ...wood }); p.line([[-45, -56], [45, -56]], d); p.circ(0, -78, 4, { ...f, fill: 'paper' }); p.circ(0, -34, 4, { ...f, fill: 'paper' });
        p.ell(0, -104, 24, 5, { ...d, fill: 'paper' }); p.line([[0, -108], [0, -146]], { stroke: 'line', w: 5 });
        p.poly([[-26, -148], [26, -148], [40, -192], [-40, -192]], { stroke: 'shade', w: 3.5, fill: 'paper', hatch: P.on ? 'light' : 'shade', hg: P.on ? 3 : 5, halpha: P.on ? 0.75 : 0.45, ha: 90 });
        if (P.on) for (const a of [-60, -30, 0, 30, 60]) { const r = U.rad(a - 90); p.line([[Math.cos(r) * 56, -170 + Math.sin(r) * 56], [Math.cos(r) * 74, -170 + Math.sin(r) * 74]], { stroke: 'light', w: 3 }); }
      } },
    { type: 'prop', id: 'home-toybox', name: 'Toy box', cat: 'Bedroom', tags: ['toys', 'chest', 'playroom', 'storage', 'box'],
      colors: { line: '#8a5a33', paint: '#e53935', block: '#1e88e5', ball: '#43a047', soft: '#fbc02d' },
      params: [{ key: 'open', label: 'Lid open', type: 'toggle', def: true }],
      draw(p, P) {
        if (P.open) p.poly([[-68, -84], [68, -84], [60, -134], [-60, -134]], { ...d, fill: 'paper', hatch: 'line', hg: 8, halpha: 0.25, ha: 90, smooth: false }); // the lid, propped open behind (a short, leaning panel, so it does not look like a cabinet door)
        if (P.open) { p.rect(-30, -112, 22, 26, { stroke: 'block', w: 3, fill: 'paper', hatch: 'block', hg: 4, halpha: 0.5 }); p.circ(30, -104, 16, { stroke: 'ball', w: 3, fill: 'paper', hatch: 'ball', hg: 4, halpha: 0.5 }); p.rect(-4, -118, 20, 20, { stroke: 'soft', w: 3, fill: 'paper', hatch: 'soft', hg: 4, halpha: 0.5 }); }
        p.rect(-70, -80, 140, 80, { ...o, ...wood }); p.line([[-70, -56], [70, -56]], d);
        for (const x of [-46, 0, 46]) p.circ(x, -34, 7, { stroke: 'paint', w: 2.5, fill: 'paper', hatch: 'paint', hg: 4, halpha: 0.5 });
        if (!P.open) p.rect(-74, -92, 148, 14, { ...o, ...wood });
      } },
    { type: 'prop', id: 'home-teddy', name: 'Teddy bear', cat: 'Toys', tags: ['bear', 'soft toy', 'cuddly', 'toy', 'plush'],
      colors: { line: '#a1693a', fur: '#c68642', bow: '#e53935' },
      params: [{ key: 'bow', label: 'Bow', type: 'toggle', def: true }],
      draw(p, P) { small(p, 0.72, (p) => {
        const fur = { fill: 'paper', hatch: 'fur', hg: 5, halpha: 0.5, ha: 50 };
        p.ell(-26, -14, 20, 13, { ...o, ...fur }); p.ell(26, -14, 20, 13, { ...o, ...fur });
        p.ell(0, -48, 34, 38, { ...o, ...fur }); p.ell(0, -42, 18, 22, { ...d, fill: 'paper' });
        p.ell(-40, -62, 12, 24, { ...o, ...fur, ha: 120 }); p.ell(40, -62, 12, 24, { ...o, ...fur, ha: 120 });
        p.circ(-20, -104, 12, { ...o, ...fur }); p.circ(20, -104, 12, { ...o, ...fur }); p.circ(0, -92, 30, { ...o, ...fur });
        p.circ(-11, -97, 3, { stroke: 'line', w: 3, fill: 'line' }); p.circ(11, -97, 3, { stroke: 'line', w: 3, fill: 'line' });
        p.ell(0, -84, 11, 8, { ...d, fill: 'paper' }); p.poly([[-4, -88], [4, -88], [0, -83]], { ...f, fill: 'line' }); p.curve([[-6, -78], [0, -75], [6, -78]], f);
        if (P.bow) { p.poly([[0, -60], [-18, -70], [-18, -50]], { stroke: 'bow', w: 3, fill: 'paper', hatch: 'bow', hg: 3, halpha: 0.6 }); p.poly([[0, -60], [18, -70], [18, -50]], { stroke: 'bow', w: 3, fill: 'paper', hatch: 'bow', hg: 3, halpha: 0.6 }); }
      }); } },
  ] });
})();
