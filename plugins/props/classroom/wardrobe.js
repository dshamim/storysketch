// Prop: clothes rack / wardrobe. Origin = floor, centre.
// Style "Clothes rack": a rolling rail with three hangers. Style "Wardrobe": a cabinet whose doors open or close.
// Each hanger is a "garment" slot and the top has a "hat" slot, so any garment / hat add-on can go there.
CP.register({
  api: 1, version: '1.0.0',
  type: 'prop', id: 'wardrobe', name: 'Clothes rack / wardrobe', pack: 'Classroom props', cat: 'Furniture',
  colors: { frame: '#7a7a7a', wood: '#8d6e4f' },
  params: [
    { key: 'style', label: 'Style', type: 'select', def: 'rack', options: { rack: 'Clothes rack', wardrobe: 'Wardrobe' } },
    { key: 'wheels', label: 'Wheels', type: 'toggle', def: true, when: { style: 'rack' } },
    { key: 'open', label: 'Doors open', type: 'toggle', def: true, when: { style: 'wardrobe' } },
  ],
  slots: [
    { key: 'left', label: 'Left hanger', kind: 'garment', def: 'none', box: [-140, -320, 130, 280] },
    { key: 'right', label: 'Right hanger', kind: 'garment', def: 'none', box: [10, -320, 130, 280] },
    { key: 'mid', label: 'Middle hanger (front)', kind: 'garment', def: 'robe', box: [-65, -320, 130, 280] },
    { key: 'hat', label: 'Hat', kind: 'hat', def: 'wizard', box: [92, -420, 90, 100] },
  ],
  draw(p, P, it, x) {
    const on = (v) => v === true || v === 'true';
    if (P.style === 'wardrobe') {
      const o = { stroke: 'wood', w: 4 };
      if (on(P.open)) {
        p.rect(-150, -380, 300, 372, { ...o, fill: 'paper' }); // back wall
        p.rect(-138, -368, 276, 348, { stroke: 'wood', w: 2, hatch: 'wood', hg: 9, halpha: 0.3 }); // shadowy inside
        p.line([[-138, -340], [138, -340]], { stroke: 'frame', w: 5 }); // rail
        for (const k of ['left', 'right', 'mid']) { x.slot(k, [{ left: -140, mid: -65, right: 10 }[k], -340, 130, 300]); }
        for (const s of [-1, 1]) { // doors swung open
          p.poly([[s * 150, -380], [s * 222, -398], [s * 222, 10], [s * 150, -8]], { ...o, fill: 'paper', hatch: 'wood', hg: 7, halpha: 0.35, ha: s * 50 });
          p.circ(s * 210, -190, 5, { stroke: 'wood', fill: 'wood' });
        }
      } else {
        p.rect(-150, -380, 300, 372, { ...o, fill: 'paper', hatch: 'wood', hg: 8, halpha: 0.35 });
        p.line([[0, -380], [0, -8]], o);
        for (const s of [-1, 1]) { p.rect(s * 24 - (s > 0 ? 0 : 100), -340, 100, 140, { stroke: 'wood', w: 2.5 }); p.rect(s * 24 - (s > 0 ? 0 : 100), -180, 100, 150, { stroke: 'wood', w: 2.5 }); p.circ(s * 12, -200, 5, { stroke: 'wood', fill: 'wood' }); }
      }
      p.rect(-160, -392, 320, 14, { ...o, fill: 'paper' }); // top
      for (const s of [-1, 1]) p.rect(s * 130 - 10, -8, 20, 8, { ...o, fill: 'wood' }); // feet
      x.slot('hat', [40, -492, 90, 100]); // hat sits on top of the wardrobe
      return;
    }
    // clothes rack
    const f = { stroke: 'frame', w: 4.5 };
    const wh = on(P.wheels), base = wh ? -24 : -6;
    for (const s of [-1, 1]) { p.line([[s * 135, base], [s * 135, -338]], f); p.circ(s * 135, -342, 5, { stroke: 'frame', fill: 'frame' }); }
    p.line([[-135, -320], [135, -320]], f); // rail
    p.line([[-155, base], [155, base]], f); // base bar
    if (wh) for (const s of [-1, 1]) for (const d of [-14, 14]) p.circ(s * 135 + d, -11, 9, { stroke: 'frame', w: 3, fill: 'paper' });
    x.slot('left'); x.slot('right'); x.slot('mid'); x.slot('hat');
  },
});
