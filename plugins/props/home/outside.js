// Props: Home - outside the house (front door, garden gate, letterbox, child's bicycle). Storybook scale: the door is 340 high. Floor props: origin = bottom centre.
(() => {
  const PACK = 'Home props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const wood = { fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, ha: 90 };

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'home-frontdoor', name: 'Front door', cat: 'Buildings', tags: ['door', 'entrance', 'doorway', 'home'],
      colors: { line: '#8a5a33', door: '#1e88e5', inside: '#a1887f', light: '#fbc02d' },
      params: [{ key: 'open', label: 'Door open', type: 'toggle', def: false }, { key: 'light', label: 'Porch light on', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-66, -356, 132, 356, { ...o, ...wood });
        p.rect(-50, -340, 100, 340, { ...o, fill: P.open ? 'inside' : 'paper', hatch: P.open ? 'inside' : 'door', hg: P.open ? 4 : 7, halpha: P.open ? 0.6 : 0.4, ha: 90 });
        if (P.open) { p.poly([[-50, -340], [-100, -322], [-100, -4], [-50, 0]], { ...d, fill: 'paper', hatch: 'door', hg: 7, halpha: 0.4, ha: 90 }); p.circ(-86, -170, 5, { ...f, fill: 'paper' }); }
        else { p.rect(-34, -318, 68, 130, { ...f, stroke: 'door' }); p.rect(-34, -168, 68, 150, { ...f, stroke: 'door' }); p.circ(32, -170, 6, { ...d, fill: 'paper' }); }
        p.rect(-80, -14, 160, 14, { ...d, fill: 'paper' });
        p.line([[0, -356], [0, -376]], f); p.poly([[-14, -376], [14, -376], [10, -400], [-10, -400]], { stroke: 'line', w: 3, fill: P.light ? 'light' : 'paper', hatch: P.light ? 'light' : 'line', hg: 3, halpha: P.light ? 0.7 : 0.2 });
      } },
    { type: 'prop', id: 'home-gate', name: 'Garden gate', cat: 'Garden', tags: ['gate', 'fence', 'entrance', 'garden', 'door'],
      colors: { line: '#8a5a33', board: '#a0724a' },
      params: [{ key: 'open', label: 'Gate open', type: 'toggle', def: false }],
      draw(p, P) {
        for (const x of [-84, 84]) { p.rect(x - 8, -124, 16, 124, { ...o, ...wood }); p.poly([[x - 10, -124], [x, -138], [x + 10, -124]], { ...d, fill: 'paper' }); }
        if (P.open) { p.poly([[-76, -100], [-76, -4], [-120, -22], [-120, -90]], { ...o, fill: 'paper', hatch: 'board', hg: 6, halpha: 0.3, ha: 90 }); for (const x of [-96]) p.line([[x - 8, -92], [x - 8, -18]], f); }
        else { p.rect(-76, -100, 152, 96, { ...o, fill: 'paper', hatch: 'board', hg: 6, halpha: 0.3, ha: 90 }); for (let x = -60; x < 70; x += 20) p.line([[x, -100], [x, -4]], f); p.line([[-76, -76], [76, -76]], d); p.line([[-76, -28], [76, -28]], d); p.circ(60, -56, 5, { ...d, fill: 'paper' }); }
      } },
    { type: 'prop', id: 'home-letterbox', name: 'Letterbox', cat: 'Garden', tags: ['mailbox', 'post box', 'post', 'letters', 'mail'],
      colors: { line: '#6f6f6f', box: '#e53935', wood: '#8a5a33' },
      params: [{ key: 'flag', label: 'Flag up (letters inside)', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-7, -110, 14, 110, { stroke: 'wood', w: 4.5, fill: 'paper', hatch: 'wood', hg: 6, halpha: 0.3, ha: 90 });
        p.poly([[-38, -110], [38, -110], [38, -156], [20, -172], [-20, -172], [-38, -156]], { stroke: 'line', w: 4.5, fill: 'paper', hatch: 'box', hg: 6, halpha: 0.55, ha: 90 });
        p.line([[-24, -138], [24, -138]], { stroke: 'line', w: 3 });
        if (P.flag) { p.line([[38, -130], [38, -190]], { stroke: 'line', w: 4 }); p.poly([[38, -190], [64, -182], [38, -172]], { stroke: 'box', w: 3, fill: 'paper', hatch: 'box', hg: 4, halpha: 0.7 }); } else p.line([[38, -130], [58, -126]], { stroke: 'line', w: 4 });
      } },
    { type: 'prop', id: 'home-bicycle', name: "Child's bicycle", cat: 'Toys', tags: ['bike', 'cycle', 'wheels', 'ride', 'outdoor toy'],
      colors: { line: '#6f6f6f', frame: '#e53935', tyre: '#455a64', soft: '#fbc02d' },
      params: [{ key: 'basket', label: 'Basket', type: 'toggle', def: true }],
      draw(p, P) {
        for (const x of [-66, 66]) { p.circ(x, -46, 44, { stroke: 'tyre', w: 5, fill: false }); p.circ(x, -46, 5, { ...d, fill: 'paper' }); for (let a = 0; a < 6; a++) { const r = U.rad(a * 60); p.line([[x, -46], [x + Math.cos(r) * 40, -46 + Math.sin(r) * 40]], { stroke: 'line', w: 1.5 }); } }
        p.line([[-66, -46], [-10, -52]], { stroke: 'frame', w: 5 }); p.line([[-10, -52], [24, -108]], { stroke: 'frame', w: 5 }); p.line([[-66, -46], [-30, -104]], { stroke: 'frame', w: 5 }); p.line([[-30, -104], [24, -108]], { stroke: 'frame', w: 5 }); p.line([[-10, -52], [66, -46]], { stroke: 'frame', w: 5 });
        p.line([[-30, -104], [-34, -118]], d); p.poly([[-52, -118], [-14, -118], [-18, -128], [-48, -128]], { ...d, fill: 'soft' });
        p.line([[24, -108], [58, -124]], { stroke: 'line', w: 4.5 }); p.line([[44, -122], [70, -118]], { stroke: 'line', w: 4.5 }); p.line([[66, -46], [58, -118]], { stroke: 'frame', w: 4.5 });
        if (P.basket) { p.poly([[58, -126], [90, -126], [84, -98], [64, -98]], { stroke: 'soft', w: 3, fill: 'paper', hatch: 'soft', hg: 4, halpha: 0.6, ha: 45 }); }
      } },
  ] });
})();
