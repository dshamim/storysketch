// Props: Home - the house (front view). Storybook scale: the door is 340 high, so an adult fits through it; the whole house is 700 x 600.
// States: door open / shut, lights on / off, chimney. Floor prop: origin = bottom centre, standing on y = 0.
// Style guide: docs/PROP-STYLE-GUIDE.md.
(() => {
  CP.register({ api: 1, version: '1.0.0', pack: 'Home props', items: [
    { type: 'prop', id: 'home-house', name: 'House', cat: 'Buildings', tags: ['home', 'building', 'cottage', 'family house', 'roof'],
      colors: { line: '#8a5a33', wall: '#f4a261', roof: '#e53935', door: '#1e88e5', glass: '#4fc3f7', light: '#fbc02d', inside: '#a1887f' },
      params: [
        { key: 'open', label: 'Door open', type: 'toggle', def: false },
        { key: 'lights', label: 'Lights on', type: 'toggle', def: false },
        { key: 'chimney', label: 'Chimney', type: 'toggle', def: true }],
      draw(p, P) {
        const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
        const W = 340, wallH = 380; // half width of the walls; wall height (door 340 + a little above it)
        if (P.chimney) { p.poly([[150, -wallH - 80], [150, -wallH - 190], [210, -wallH - 190], [210, -wallH - 20]], { ...o, fill: 'paper', hatch: 'roof', hg: 7, halpha: 0.35, ha: 90 }); p.rect(142, -wallH - 204, 76, 16, { ...d, fill: 'paper' }); }
        p.poly([[-W, -wallH], [-W, 0], [W, 0], [W, -wallH]], { ...o, fill: 'paper', hatch: 'wall', hg: 8, halpha: 0.45, ha: 90 });          // walls
        for (const y of [-300, -240, -180, -120, -60]) if (y < -250 || y > -70) p.line([[-W + 6, y], [-W + 40, y]], f);                     // a few brick marks
        p.poly([[-W - 40, -wallH + 10], [0, -wallH - 220], [W + 40, -wallH + 10]], { ...o, fill: 'paper', hatch: 'roof', hg: 8, halpha: 0.55, ha: -45 }); // roof
        p.line([[-W - 10, -wallH - 20], [0, -wallH - 190]], f); p.line([[W + 10, -wallH - 20], [0, -wallH - 190]], f);
        p.rect(-W, -wallH, W * 2, 14, { ...d, fill: 'paper' });                                                                           // eaves
        // door (centre): 100 wide, 340 high
        p.rect(-50, -340, 100, 340, { ...o, fill: P.open ? 'inside' : 'paper', hatch: P.open ? 'inside' : 'door', hg: P.open ? 4 : 7, halpha: P.open ? 0.6 : 0.4, ha: 90 });
        if (P.open) { p.poly([[-50, -340], [-98, -322], [-98, -4], [-50, 0]], { ...d, fill: 'paper', hatch: 'door', hg: 7, halpha: 0.4, ha: 90 }); p.circ(-84, -170, 5, { ...f, fill: 'paper' }); }
        else { p.rect(-34, -318, 68, 130, { ...f, stroke: 'door' }); p.rect(-34, -168, 68, 150, { ...f, stroke: 'door' }); p.circ(32, -170, 6, { ...d, fill: 'paper' }); }
        p.rect(-70, -14, 140, 14, { ...d, fill: 'paper' });                                                                                   // step
        // windows
        for (const sx of [-1, 1]) {
          const cx = sx * 215, top = -280, w = 130, h = 120;
          p.rect(cx - w / 2, top, w, h, { ...o, fill: P.lights ? 'light' : 'paper', hatch: P.lights ? 'light' : 'glass', hg: P.lights ? 4 : 6, halpha: P.lights ? 0.6 : 0.35, ha: 55 });
          p.line([[cx, top], [cx, top + h]], d); p.line([[cx - w / 2, top + h / 2], [cx + w / 2, top + h / 2]], d);
          p.rect(cx - w / 2 - 10, top + h, w + 20, 12, { ...d, fill: 'paper' });                                                           // sill
        }
        p.circ(0, -wallH - 90, 30, { ...o, fill: P.lights ? 'light' : 'paper', hatch: P.lights ? 'light' : 'glass', hg: 4, halpha: 0.5 }); // attic window
        p.line([[-30, -wallH - 90], [30, -wallH - 90]], d); p.line([[0, -wallH - 120], [0, -wallH - 60]], d);
      } },
  ] });
})();
