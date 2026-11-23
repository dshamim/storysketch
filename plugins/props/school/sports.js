// Props: School - sports (goal, ball, running track, trophy, backpack, lunchbox). Floor props: origin = bottom centre (stands on y = 0).
(() => {
  const PACK = 'School props';
  const o = { stroke: 'line', w: 4.5 }, d = { stroke: 'line', w: 3 }, f = { stroke: 'line', w: 2.2 };
  const sheet = (hatch, a = 0.4, hg = 7, ha = 90) => ({ fill: 'paper', hatch, hg, halpha: a, ha });
  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'school-goal', name: 'Football goal', cat: 'Sports', tags: ['soccer', 'goalpost', 'net', 'pitch', 'football', 'playground'],
      colors: { line: '#6f6f6f', net: '#9e9e9e' },
      params: [{ key: 'net', label: 'Net', type: 'toggle', def: true }],
      draw(p, P) {
        p.poly([[-150, 0], [-150, -190], [150, -190], [150, 0]], { ...o, w: 6, fill: false, stroke: 'line' });
        if (P.net) { for (let x = -140; x <= 140; x += 28) p.line([[x, -190], [x * 1.1, -6]], { stroke: 'net', w: 1.5 }); for (let y = -160; y < 0; y += 30) p.line([[-160, y], [160, y]], { stroke: 'net', w: 1.5 }); }
        p.poly([[-150, 0], [-150, -190], [150, -190], [150, 0]], { ...o, w: 6, fill: false });
      } },
    { type: 'prop', id: 'school-ball', name: 'Ball', cat: 'Sports', tags: ['football', 'soccer ball', 'basketball', 'tennis ball', 'play', 'toy'],
      colors: { line: '#6f6f6f', ball: '#e53935', stripe: '#6f6f6f' },
      params: [{ key: 'kind', label: 'Ball', type: 'select', options: { football: 'Football', basketball: 'Basketball', tennis: 'Tennis ball' }, def: 'football' }],
      draw(p, P) {
        const r = P.kind === 'tennis' ? 16 : P.kind === 'basketball' ? 34 : 30; const y = -r;
        p.circ(0, y, r, { ...o, w: 3.5, stroke: P.kind === 'football' ? 'line' : 'ball', fill: 'paper', hatch: P.kind === 'football' ? 'line' : 'ball', hg: 4, halpha: P.kind === 'football' ? 0.12 : 0.55 });
        if (P.kind === 'football') { p.poly([[0, y - 10], [10, y - 3], [6, y + 9], [-6, y + 9], [-10, y - 3]], { ...d, stroke: 'stripe', fill: 'stripe' }); p.line([[0, y - 10], [0, y - r + 3]], f); p.line([[10, y - 3], [r - 4, y - 8]], f); p.line([[-10, y - 3], [-r + 4, y - 8]], f); p.line([[6, y + 9], [10, y + r - 6]], f); p.line([[-6, y + 9], [-10, y + r - 6]], f); }
        if (P.kind === 'basketball') { p.line([[-r, y], [r, y]], { stroke: 'stripe', w: 2.5 }); p.line([[0, y - r], [0, y + r]], { stroke: 'stripe', w: 2.5 }); p.curve([[-r * 0.7, y - r * 0.7], [-r * 0.25, y], [-r * 0.7, y + r * 0.7]], { stroke: 'stripe', w: 2.5 }); p.curve([[r * 0.7, y - r * 0.7], [r * 0.25, y], [r * 0.7, y + r * 0.7]], { stroke: 'stripe', w: 2.5 }); }
        if (P.kind === 'tennis') p.curve([[-r * 0.8, y - r * 0.5], [0, y - 2], [r * 0.8, y - r * 0.5]], { stroke: 'line', w: 2 });
      } },
    { type: 'prop', id: 'school-track', name: 'Running track', cat: 'Sports', tags: ['race', 'lanes', 'sports day', 'athletics', 'running', 'field'],
      colors: { line: '#6f6f6f', track: '#e57373', paint: '#bdbdbd' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 300, max: 800, step: 20, def: 700 }, { key: 'lanes', label: 'Lanes', type: 'range', min: 2, max: 4, step: 1, def: 3 }],
      draw(p, P) {
        const W = P.width / 2, D = 40 * P.lanes; p.rect(-W, -D, W * 2, D, { stroke: false, fill: 'paper', hatch: 'track', hg: 7, ha: 0, halpha: 0.45 });
        for (let i = 0; i <= P.lanes; i++) p.line([[-W, -D + i * 40], [W, -D + i * 40]], { stroke: 'paint', w: i % P.lanes === 0 ? 5 : 3 });
        p.line([[-W + 30, -D], [-W + 30, 0]], { stroke: 'paint', w: 6 }); p.line([[W - 30, -D], [W - 30, 0]], { stroke: 'line', w: 6 });
      } },
    { type: 'prop', id: 'school-trophy', name: 'Trophy', cat: 'School', tags: ['cup', 'prize', 'winner', 'award', 'medal', 'sports day'],
      colors: { line: '#b8860b', gold: '#fbc02d', base: '#8a5a33' },
      params: [{ key: 'shine', label: 'Sparkle', type: 'toggle', def: true }],
      draw(p, P) {
        p.rect(-34, -22, 68, 22, { ...o, stroke: 'base', ...sheet('base', 0.4, 5) }); p.rect(-10, -48, 20, 26, { ...d, fill: 'paper' });
        p.poly([[-44, -140], [44, -140], [36, -90], [16, -66], [-16, -66], [-36, -90]], { ...o, ...sheet('gold', 0.6, 4, 70) });
        p.curve([[-44, -128], [-70, -126], [-64, -96], [-36, -92]], { stroke: 'line', w: 4 }); p.curve([[44, -128], [70, -126], [64, -96], [36, -92]], { stroke: 'line', w: 4 });
        if (P.shine) for (const [x, y] of [[-70, -150], [66, -160], [0, -176]]) { p.line([[x - 8, y], [x + 8, y]], { stroke: 'gold', w: 3 }); p.line([[x, y - 8], [x, y + 8]], { stroke: 'gold', w: 3 }); }
      } },
    { type: 'prop', id: 'school-backpack', name: 'Backpack', cat: 'School', tags: ['school bag', 'rucksack', 'bag', 'books', 'pack'],
      colors: { line: '#6f6f6f', bag: '#e53935', strap: '#6f6f6f', zip: '#fbc02d' },
      params: [{ key: 'pocket', label: 'Front pocket', type: 'toggle', def: true }],
      draw(p, P) {
        p.poly([[-44, 0], [-50, -80], [-34, -108], [34, -108], [50, -80], [44, 0]], { ...o, stroke: 'bag', ...sheet('bag', 0.5, 5, 60), smooth: true }); p.curve([[-18, -108], [-14, -128], [14, -128], [18, -108]], { stroke: 'strap', w: 4.5 });
        if (P.pocket) { p.poly([[-34, -4], [-38, -52], [38, -52], [34, -4]], { ...d, stroke: 'bag', fill: 'paper', hatch: 'bag', hg: 4, halpha: 0.35 }); p.line([[-28, -44], [28, -44]], { stroke: 'zip', w: 3 }); }
        p.line([[-50, -70], [-60, -30]], { stroke: 'strap', w: 5 }); p.line([[50, -70], [60, -30]], { stroke: 'strap', w: 5 });
      } },
    { type: 'prop', id: 'school-lunchbox', name: 'Lunchbox', cat: 'Food', tags: ['lunch box', 'packed lunch', 'sandwich', 'food', 'snack'],
      colors: { line: '#6f6f6f', box: '#43a047', bread: '#fbc02d', apple: '#e53935' },
      params: [{ key: 'open', label: 'Open', type: 'toggle', def: false }],
      draw(p, P) {
        p.rect(-50, -48, 100, 48, { ...o, stroke: 'box', ...sheet('box', 0.5, 5, 60) }); p.rect(-6, -34, 12, 14, { ...f, fill: 'paper' });
        if (P.open) { p.poly([[-50, -48], [50, -48], [44, -110], [-44, -110]], { ...d, stroke: 'box', fill: 'paper', hatch: 'box', hg: 6, halpha: 0.3 }); p.poly([[-30, -48], [14, -48], [10, -70], [-26, -70]], { stroke: 'bread', w: 3, fill: 'paper', hatch: 'bread', hg: 4, halpha: 0.6 }); p.circ(32, -58, 12, { stroke: 'apple', w: 3, fill: 'paper', hatch: 'apple', hg: 4, halpha: 0.7 }); }
        else p.curve([[-22, -48], [-22, -66], [22, -66], [22, -48]], { stroke: 'line', w: 4 });
      } },
  ] });
})();
