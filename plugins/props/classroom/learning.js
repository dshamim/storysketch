// Props: Learning. Part of the Classroom props pack. One file may register many props. See ../../README.md.
// Floor props: origin = bottom centre (stands on y=0). Floating props: origin = centre.
(() => {
  const { PAL, heartPts, starPts, bumpy, paintingOn } = CP.helpers;
  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
  { type: 'prop', id: 'bookopen', name: 'Open book', cat: 'Learning', colors: { cover: '#2f6fd6', text: '#9a9a9a' },
    draw(p) { p.poly([[-64, -30], [0, -22], [64, -30], [64, 34], [0, 40], [-64, 34]], { stroke: 'cover', w: 4, fill: 'paper', hatch: 'cover', hg: 4, halpha: 0.7 });
      p.poly([[0, -24], [-28, -34], [-58, -32], [-58, 26], [-28, 24], [0, 32]], { stroke: 'cover', w: 3, fill: 'paper', smooth: false }); p.poly([[0, -24], [28, -34], [58, -32], [58, 26], [28, 24], [0, 32]], { stroke: 'cover', w: 3, fill: 'paper', smooth: false });
      for (let i = 0; i < 4; i++) { const y = -20 + i * 11; p.line([[-50, y], [-10, y + 3]], { stroke: 'text', w: 2.2 }); p.line([[10, y + 3], [50, y]], { stroke: 'text', w: 2.2 }); } } },
  { type: 'prop', id: 'books', name: 'Book stack', cat: 'Learning', colors: { a: '#e53935', b: '#1e88e5', c: '#43a047' },
    draw(p) { [['a', -60, -22, 120, 22], ['b', -50, -42, 108, 20], ['c', -56, -60, 100, 18]].forEach(([k, x, y, w, h]) => { p.rect(x, y, w, h, { stroke: k, w: 3.5, fill: 'paper', hatch: k, hg: 4, halpha: 0.6, ha: 0 }); p.line([[x + w - 12, y + 4], [x + w - 12, y + h - 4]], { stroke: k, w: 2.5 }); }); } },
  { type: 'prop', id: 'poster', name: 'Wall poster', cat: 'Learning', colors: { line: '#8a8a8a', a: '#e53935', b: '#1e88e5', c: '#43a047' },
    slots: [{ key: 'chart', label: 'Poster content', kind: 'chart', def: 'times', box: null }],
    draw(p, P, it, x) {
      // times tables: the poster grows with the number of lines; other charts use a fixed size
      const lines = P.chart === 'times' ? String(P['chart.text'] ?? P.text ?? '2x4|3x5|4x6').split('|').slice(0, 5) : [];
      const h = P.chart === 'times' ? Math.max(150, lines.length * 50 + 30) : 190;
      p.rect(-75, -h / 2, 150, h, { stroke: 'line', w: 3, fill: 'paper' }); p.circ(-64, -h / 2 + 10, 4, { stroke: '#444', w: 2, fill: '#444' }); p.circ(64, -h / 2 + 10, 4, { stroke: '#444', w: 2, fill: '#444' });
      x.slot('chart', [-67, -h / 2 + 14, 134, h - 24]);
    } },
  { type: 'prop', id: 'whiteboard', name: 'Whiteboard', cat: 'Learning', colors: { frame: '#9aa0a6', a: '#e53935', b: '#1e88e5', c: '#43a047' },
    params: [{ key: 'title', label: 'Title at the top (optional)', type: 'text', def: '' }],
    slots: [{ key: 'chart', label: 'On the board', kind: 'chart', def: 'shapes', box: [-150, -100, 300, 180] }],
    draw(p, P, it, x) {
      p.rect(-165, -112, 330, 205, { stroke: 'frame', w: 6, fill: 'paper' });
      const title = String(P.title || '').trim();
      if (title) { // written along the top; whatever is on the board moves down under it
        const h = Math.min(30, 290 / Math.max(1, p.textWidth(title, 1))), tw = p.textWidth(title, h);
        p.text(title, 0, -100, h, { stroke: 'b', w: Math.max(2.5, h * 0.09) });
        p.curve([[-tw / 2, -100 + h * 1.18], [0, -100 + h * 1.12], [tw / 2, -100 + h * 1.2]], { stroke: 'a', w: 2.5 });
      }
      p.rect(-120, 93, 240, 10, { stroke: 'frame', w: 4, fill: 'paper' });
      p.line([[-90, 96], [-60, 96]], { stroke: '#e53935', w: 6 }); p.line([[-45, 96], [-15, 96]], { stroke: '#1e88e5', w: 6 }); // markers
      if (title) { const top = -100 + Math.min(30, 290 / Math.max(1, p.textWidth(title, 1))) * 1.45; x.slot('chart', [-150, top, 300, 80 - top]); }
      else x.slot('chart');
    } },
  { type: 'prop', id: 'numbers', name: 'Numbers & words (crayon)', cat: 'Learning', colors: { ink: '#7a7a7a' }, params: [{ key: 'text', label: 'Text (letters, numbers, + - = ? ! . ,)', type: 'text', def: '1 2 3 4 5' }, { key: 'size', label: 'Size', type: 'range', min: 24, max: 160, def: 70 }],
    draw(p, P) { p.text(P.text, 0, -P.size / 2, +P.size, { stroke: 'ink' }); } },
  { type: 'prop', id: 'notice', name: 'Notice paper', cat: 'Learning', colors: { line: '#7a7a7a', pin: '#e53935' },
    draw(p) { p.poly([[-80, -100], [52, -100], [80, -72], [80, 100], [-80, 100]], { stroke: 'line', w: 3, fill: 'paper' }); p.poly([[52, -100], [52, -72], [80, -72]], { stroke: 'line', w: 2.5, fill: 'paper' });
      for (let i = 0; i < 7; i++) { const y = -60 + i * 22; const pts = []; for (let x = -62; x <= (i === 6 ? 10 : 60); x += 8) pts.push([x, y + Math.sin(x * 0.4 + i) * 2]); p.curve(pts, { stroke: 'line', w: 2.2 }); } p.circ(0, -90, 6, { stroke: 'pin', w: 2, fill: 'pin' }); } },
  { type: 'prop', id: 'thought', name: 'Thought bubble', cat: 'Learning', colors: { line: '#5a5a5a' }, params: [{ key: 'side', label: 'Tail', type: 'select', options: { left: 'Bottom left', right: 'Bottom right' }, def: 'left' }],
    draw(p, P) { const s = P.side === 'right' ? 1 : -1; p.poly(bumpy(0, 0, 105, 70, 10, 0.12), { stroke: 'line', w: 3.5, fill: 'paper', smooth: true }); p.circ(s * 70, 92, 15, { stroke: 'line', w: 3, fill: 'paper' }); p.circ(s * 98, 122, 9, { stroke: 'line', w: 3, fill: 'paper' }); } },
  { type: 'prop', id: 'speech', name: 'Speech bubble', cat: 'Learning', colors: { line: '#5a5a5a' }, params: [{ key: 'side', label: 'Tail', type: 'select', options: { left: 'Bottom left', right: 'Bottom right' }, def: 'left' }],
    draw(p, P) { const s = P.side === 'right' ? 1 : -1; p.ell(0, 0, 110, 66, { stroke: 'line', w: 3.5, fill: 'paper' }); p.poly([[s * 30, 58], [s * 80, 110], [s * 62, 50]], { stroke: false, fill: 'paper' }); p.line([[s * 30, 60], [s * 80, 110], [s * 62, 52]], { stroke: 'line', w: 3.5 }); } },
  ] });
})();
