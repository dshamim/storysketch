// Props: Furniture. Part of the Classroom props pack. One file may register many props. See ../../README.md.
// Floor props: origin = bottom centre (stands on y=0). Floating props: origin = centre.
(() => {
  const { PAL, heartPts, starPts, bumpy, paintingOn } = CP.helpers;
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
  { type: 'prop', id: 'table', name: 'Table / desk', cat: 'Furniture', colors: { line: '#6f6f6f' }, params: [{ key: 'style', label: 'Style', type: 'select', options: { table: 'Table (legs show)', desk: 'Desk (front panel hides legs)' }, def: 'table' }, { key: 'width', label: 'Width', type: 'range', min: 160, max: 520, def: 320 }],
    draw(p, P) {
      const W = P.width / 2, o = { stroke: 'line', w: 4.5 };
      p.line([[-W + 25, -112], [-W + 25, -14]], o); p.line([[W + 2, -122], [W + 2, -14]], o);
      p.poly([[-W + 15, -128], [W + 10, -128], [W - 10, -110], [-W, -110]], { ...o, fill: 'paper' });
      p.poly([[-W, -110], [W - 10, -110], [W - 10, -98], [-W, -98]], { ...o, fill: 'paper' });
      if (P.style === 'desk') p.poly([[-W, -98], [W - 10, -98], [W - 10, 0], [-W, 0]], { ...o, fill: 'paper' });
      else { p.line([[-W + 8, -98], [-W + 8, 0]], o); p.line([[W - 18, -98], [W - 18, 0]], o); }
    } },
  { type: 'prop', id: 'stool', name: 'Stool', cat: 'Furniture', colors: { line: '#6f6f6f' },
    draw(p) { const o = { stroke: 'line', w: 4.5 }; p.line([[-30, -76], [-38, 0]], o); p.line([[30, -76], [38, 0]], o); p.line([[0, -72], [0, -6]], o); p.line([[-34, -30], [34, -30]], o); p.ell(0, -80, 40, 10, { ...o, fill: 'paper' }); } },
  { type: 'prop', id: 'chair', name: 'Chair', cat: 'Furniture', colors: { line: '#8a5a33' },
    draw(p) { const o = { stroke: 'line', w: 4.5 }; p.line([[-34, -74], [-34, 0]], o); p.line([[32, -74], [32, 0]], o); p.poly([[-42, -190], [-30, -190], [-28, -80], [-40, -80]], { ...o, fill: 'paper' }); p.poly([[-40, -84], [38, -84], [38, -72], [-40, -72]], { ...o, fill: 'paper' }); } },
  { type: 'prop', id: 'easel', name: 'Easel + painting', cat: 'Furniture', colors: { line: '#7a4e2d', canvas: '#7a7a7a' },
    // the painting is a slot: any "picture" add-on can go in it
    slots: [{ key: 'art', label: 'Painting', kind: 'picture', def: 'tree', box: [-75, -285, 150, 163] }],
    draw(p, P, it, x) { const o = { stroke: 'line', w: 5 }; p.line([[0, -270], [32, 4]], o); p.line([[-62, 0], [-6, -300]], o); p.line([[62, 0], [6, -300]], o);
      p.rect(-80, -122, 160, 10, { ...o, fill: 'paper' }); p.rect(-75, -285, 150, 163, { stroke: 'canvas', w: 3.5, fill: 'paper' }); x.slot('art'); } },
  { type: 'prop', id: 'bookshelf', name: 'Bookshelf', cat: 'Furniture', colors: { line: '#6f6f6f' },
    draw(p, P, it) { const o = { stroke: 'line', w: 4.5 }; const r = U.rng(U.hash(it.id)); p.rect(-100, -230, 200, 230, { ...o, fill: 'paper' });
      for (const sy of [-155, -80]) p.line([[-100, sy], [100, sy]], o);
      for (const [y0, y1] of [[-226, -155], [-151, -80]]) { let x = -92; while (x < 80) { const w = 13 + r() * 9, h = (y1 - y0) * (0.65 + r() * 0.3); const c = PAL[Math.floor(r() * PAL.length)]; if (x + w > 94) break; p.rect(x, y1 - h, w, h, { stroke: c, w: 3, hatch: c, hg: 4, halpha: 0.6, ha: 80 }); x += w + 3 + r() * 4; } }
      for (let i = 0; i < 3; i++) { const c = PAL[i * 2]; p.rect(-80 + i * 55, -70, 40, 60, { stroke: c, w: 3, fill: 'paper' }); p.ell(-60 + i * 55, -70, 20, 5, { stroke: c, w: 3, hatch: c, hg: 3 }); } } },
  { type: 'prop', id: 'curtain', name: 'Stage curtains', cat: 'Furniture', colors: { line: '#e53935' },
    params: [{ key: 'open', label: 'Curtains open', type: 'toggle', def: true }],
    draw(p, P) { const o = { stroke: 'line', w: 4.5, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.5, ha: 88 };
      if (P.open === false) { // closed: two drapes meeting in the middle
        for (const s of [-1, 1]) { p.poly([[s * 225, -350], [s * 2, -350], [s * 6, -180], [s * 2, 0], [s * 225, 0]], { ...o, smooth: false }); for (const fx of [40, 90, 140, 190]) p.curve([[s * fx, -345], [s * (fx - 8), -200], [s * (fx + 4), -60], [s * (fx + 2), -6]], { stroke: 'line', w: 2.5 }); }
      } else {
      p.poly([[-225, -350], [-120, -350], [-150, -230], [-175, -130], [-182, -70], [-200, 0], [-225, 0]], { ...o, smooth: false });
      p.poly([[225, -350], [120, -350], [150, -230], [175, -130], [182, -70], [200, 0], [225, 0]], { ...o, smooth: false });
      for (const s of [-1, 1]) { for (const fx of [205, 185, 165]) p.curve([[s * fx, -345], [s * (fx - 10), -200], [s * (fx + 2), -60], [s * (fx + 6), -6]], { stroke: 'line', w: 2.5 }); p.line([[s * 165, -80], [s * 210, -95]], { stroke: '#f2b705', w: 4 }); }
      }
      const sc = [[-232, -400], [232, -400], [232, -352]]; for (let x = 232; x >= -232; x -= 29) { sc.push([x - 14.5, -330], [x - 29, -352]); }
      p.poly(sc, { ...o, ha: -10, smooth: false }); p.line([[-240, -402], [240, -402]], { stroke: '#7a4e2d', w: 6 }); } },
  { type: 'prop', id: 'rug', name: 'Rug', cat: 'Furniture', colors: { line: '#1e88e5' },
    draw(p) { p.poly([[-195, -42], [175, -42], [210, 0], [-165, 0]], { stroke: 'line', w: 3.5, hatch: 'line', hg: 5, halpha: 0.45, ha: 8 }); for (let i = 0; i < 8; i++) { p.line([[-197 + i * 4.3, -40 + i * 5.2], [-212 + i * 4.3, -40 + i * 5.2]], { stroke: 'line', w: 2.5 }); p.line([[178 + i * 4.3, -40 + i * 5.2], [193 + i * 4.3, -40 + i * 5.2]], { stroke: 'line', w: 2.5 }); } } },
  { type: 'prop', id: 'box', name: 'Cardboard box', cat: 'Furniture', colors: { line: '#8d6236', tint: '#c49a6c' },
    params: [{ key: 'open', label: 'Box open', type: 'toggle', def: true }],
    draw(p, P) { const o = { stroke: 'line', w: 4 };
      if (P.open === false) { // closed + taped
        p.poly([[-80, -95], [80, -95], [70, -128], [-70, -128]], { ...o, fill: 'paper', hatch: 'tint', hg: 7, halpha: 0.5 });
        p.poly([[-80, -95], [80, -95], [80, 0], [-80, 0]], { ...o, fill: 'paper', hatch: 'tint', hg: 6, halpha: 0.55 });
        p.line([[0, -128], [0, -95], [0, -70]], { stroke: '#d9c49a', w: 9 }); p.line([[-30, -60], [30, -60]], { stroke: 'line', w: 3 }); return;
      }
 p.poly([[-75, -95], [-60, -140], [70, -140], [80, -95]], { ...o, fill: 'paper', hatch: 'tint', hg: 7, halpha: 0.5 }); p.poly([[-80, -95], [80, -95], [80, 0], [-80, 0]], { ...o, fill: 'paper', hatch: 'tint', hg: 6, halpha: 0.55 }); p.poly([[-80, -95], [-115, -130], [-75, -132], [-40, -95]], { ...o, fill: 'paper', hatch: 'tint', hg: 7, halpha: 0.4 }); p.poly([[80, -95], [118, -126], [78, -132], [42, -95]], { ...o, fill: 'paper', hatch: 'tint', hg: 7, halpha: 0.4 }); p.line([[-30, -60], [30, -60]], { stroke: 'line', w: 3 }); } },
  { type: 'prop', id: 'lamp', name: 'Desk lamp', cat: 'Furniture', colors: { line: '#5a5a5a', shade: '#e53935', light: '#fbc02d' },
    params: [{ key: 'on', label: 'Light on', type: 'toggle', def: true }],
    draw(p, P) {
      const on = P.on !== false;
      if (on) p.poly([[34, -112], [92, -112], [150, 0], [-30, 0]], { stroke: false, hatch: 'light', hg: 7, halpha: 0.28, ha: 75 }); // light cone
      p.ell(0, -6, 42, 9, { stroke: 'line', w: 4, fill: 'paper' });
      p.line([[0, -10], [-18, -90], [40, -130]], { stroke: 'line', w: 5 }); p.circ(-18, -90, 5, { stroke: 'line', w: 3, fill: 'paper' });
      p.circ(63, -112, 10, { stroke: on ? 'light' : 'line', w: 3, fill: on ? 'light' : 'paper' }); // bulb
      p.poly([[22, -150], [58, -150], [100, -112], [26, -112]], { stroke: 'shade', w: 4, fill: 'paper', hatch: 'shade', hg: 5, halpha: 0.6 });
      if (on) for (const a of [40, 70, 100, 130]) { const d = U.dir(a); p.line([[63 + d[0] * 22, -112 + d[1] * 22], [63 + d[0] * 36, -112 + d[1] * 36]], { stroke: 'light', w: 3.5 }); }
    } },
  { type: 'prop', id: 'wheelchair', name: 'Wheelchair (empty)', cat: 'Furniture', colors: { line: '#5f6368' },
    draw(p, P, it) { const q = new Pen({}); const acc = CP.accessories.wheelchair; if (!acc) return; acc.drawChair(q, p.col('line')); for (const pr of q.o) { pr.pts = pr.pts.map(([x, y]) => [x, y - 70]); p.o.push(pr); } } },
  { type: 'prop', id: 'mural', name: 'Mural paper (big)', cat: 'Furniture', colors: { line: '#8a8a8a', tape: '#f2c94c' },
    slots: [{ key: 'art', label: 'Picture on the mural', kind: 'picture', def: 'none', box: [-280, -320, 560, 300] }],
    draw(p, P, it, x) { p.rect(-300, -340, 600, 340, { stroke: 'line', w: 3, fill: 'paper' }); x.slot('art'); for (const [x, y, a] of [[-300, -340, -30], [300, -340, 30], [-300, 0, 30], [300, 0, -30]]) { const c = Math.cos(U.rad(a)), s = Math.sin(U.rad(a)); const R = (u, v) => [x + u * c - v * s, y + u * s + v * c]; p.poly([R(-22, -8), R(22, -8), R(22, 8), R(-22, 8)], { stroke: 'tape', w: 2, hatch: 'tape', hg: 3, halpha: 0.7 }); } } },
  ] });
})();
