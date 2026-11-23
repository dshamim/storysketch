// Props: School - inside (lockers, corridor door, assembly stage, canteen table with benches, lunch tray). Human scale: seats 80, tables 128 (docs/PROP-STYLE-GUIDE.md).
// Floor props: origin = bottom centre (stands on y = 0).
(() => {
  const PACK = 'School props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const sheet = (hatch, a = 0.4, hg = 7, ha = 90) => ({ fill: 'paper', hatch, hg, halpha: a, ha });
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'school-lockers', name: 'Lockers', cat: 'School', tags: ['locker', 'cupboards', 'corridor', 'storage', 'coats'],
      colors: { line: '#6f6f6f', metal: '#1e88e5', plate: '#fbc02d' },
      params: [{ key: 'count', label: 'Doors', type: 'range', min: 2, max: 6, step: 1, def: 4 }, { key: 'open', label: 'One door open', type: 'toggle', def: true }],
      draw(p, P) {
        const n = Math.round(P.count), w = 76, W = n * w;
        for (let i = 0; i < n; i++) { const x = -W / 2 + i * w; p.rect(x, -300, w, 300, { ...o, w: 3.5, ...sheet('metal', 0.4, 7, 90) });
          if (P.open && i === 1) { p.rect(x + 4, -296, w - 8, 292, { ...f, fill: 'paper', hatch: 'line', hg: 9, halpha: 0.2 }); p.line([[x + 4, -200], [x + w - 4, -200]], f); p.poly([[x + w, -300], [x + w + 38, -288], [x + w + 38, -12], [x + w, 0]], { ...d, ...sheet('metal', 0.45, 6) }); }
          else { for (let k = 0; k < 4; k++) p.line([[x + 16, -270 + k * 8], [x + w - 16, -270 + k * 8]], f); p.rect(x + w / 2 - 12, -236, 24, 14, { ...f, stroke: 'plate', fill: 'paper' }); p.line([[x + w - 14, -150], [x + w - 14, -110]], { stroke: 'line', w: 5 }); } }
      } },
    { type: 'prop', id: 'school-door', name: 'Classroom door', cat: 'School', tags: ['door', 'corridor door', 'entrance', 'doorway', 'classroom'],
      colors: { line: '#8a5a33', door: '#43a047', glass: '#4fc3f7', inside: '#a1887f' },
      params: [{ key: 'open', label: 'Door open', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-66, -356, 132, 356, { ...o, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3, ha: 90 });
        p.rect(-50, -340, 100, 340, { ...o, ...sheet(P.open ? 'inside' : 'door', P.open ? 0.6 : 0.45, P.open ? 4 : 7) });
        if (P.open) p.poly([[-50, -340], [-100, -322], [-100, -4], [-50, 0]], { ...d, ...sheet('door', 0.45, 7) });
        else { p.rect(-26, -300, 52, 72, { ...d, fill: 'paper', hatch: 'glass', hg: 6, halpha: 0.35, ha: 55 }); p.circ(32, -170, 6, { ...d, fill: 'paper' }); }
      } },
    { type: 'prop', id: 'school-stage', name: 'Assembly stage', cat: 'School', tags: ['hall', 'platform', 'performance', 'assembly', 'theatre', 'show'],
      colors: { line: '#8a5a33', wood: '#a0724a', curtain: '#e53935', mic: '#6f6f6f' },
      params: [{ key: 'curtain', label: 'Curtain behind', type: 'toggle', def: true }, { key: 'mic', label: 'Microphone', type: 'toggle', def: true }],
      draw(p, P) {
        if (P.curtain) { p.rect(-190, -310, 380, 210, { ...o, w: 3.5, stroke: 'curtain', fill: 'paper', hatch: 'curtain', hg: 6, halpha: 0.5, ha: 88 }); for (const x of [-120, -60, 0, 60, 120]) p.line([[x, -306], [x - 6, -104]], { stroke: 'curtain', w: 2.5 }); }
        p.rect(-200, -100, 400, 100, { ...o, ...sheet('wood', 0.35, 8, 90) }); p.line([[-200, -88], [200, -88]], d);
        for (let i = 0; i < 3; i++) p.rect(-264 + i * 20, -34 - i * 0, 70 - i * 20 + 0, 34, { ...d, fill: 'paper' });
        if (P.mic) { p.line([[110, -100], [110, -190]], { stroke: 'mic', w: 4 }); p.ell(110, -200, 8, 12, { ...d, stroke: 'mic', fill: 'paper' }); p.rect(98, -102, 24, 6, { ...d, stroke: 'mic', fill: 'paper' }); }
      } },
    { type: 'prop', id: 'school-canteen-table', name: 'Canteen table and benches', cat: 'School', tags: ['dining hall', 'lunch table', 'cafeteria', 'bench', 'lunch', 'table'],
      colors: { line: '#8a5a33', top: '#a0724a' },
      params: [{ key: 'benches', label: 'Benches', type: 'toggle', def: true }],
      draw(p, P) {
        p.line([[-140, -112], [-148, 0]], o); p.line([[150, -120], [158, 0]], o); p.line([[-100, -100], [-104, -6]], f);
        p.poly([[-170, -128], [176, -128], [160, -110], [-186, -110]], { ...o, ...sheet('top', 0.3, 7, 90) }); p.rect(-186, -110, 346, 12, { ...d, fill: 'paper' });
        if (P.benches) for (const s of [-1, 1]) { p.rect(s * 110 - 70, -80, 140, 12, { ...o, w: 3.5, ...sheet('top', 0.3, 7, 90) }); p.line([[s * 110 - 56, -68], [s * 110 - 60, 0]], d); p.line([[s * 110 + 56, -68], [s * 110 + 60, 0]], d); }
      } },
    { type: 'prop', id: 'school-tray', name: 'Lunch tray', cat: 'Food', tags: ['canteen tray', 'dinner', 'food', 'apple', 'sandwich', 'school lunch', 'juice'],
      colors: { line: '#6f6f6f', tray: '#90a4ae', apple: '#e53935', bread: '#fbc02d', juice: '#fb8c00' },
      params: [{ key: 'food', label: 'Food on the tray', type: 'toggle', def: true }],
      draw(p, P) {
        p.poly([[-70, -4], [-76, -16], [76, -16], [70, -4]], { ...o, ...sheet('tray', 0.5, 5, 0) }); p.line([[-76, -16], [-66, -22]], d); p.line([[76, -16], [66, -22]], d);
        if (P.food) { p.circ(-40, -34, 14, { stroke: 'apple', w: 3, fill: 'paper', hatch: 'apple', hg: 4, halpha: 0.7 }); p.line([[-40, -48], [-36, -56]], { stroke: 'line', w: 2.5 }); p.poly([[-8, -18], [34, -18], [30, -42], [-4, -42]], { stroke: 'bread', w: 3, fill: 'paper', hatch: 'bread', hg: 4, halpha: 0.6 }); p.poly([[46, -18], [66, -18], [64, -52], [48, -52]], { stroke: 'juice', w: 3, fill: 'paper', hatch: 'juice', hg: 4, halpha: 0.6 }); }
      } },
  ] });
})();
