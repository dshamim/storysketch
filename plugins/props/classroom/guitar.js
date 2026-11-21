// EXAMPLE prop — one prop in its own file. Floating props: origin = centre; floor props: origin = bottom centre.
// colors: named colour slots (editable per placement in the right panel); draw(pen, params, item).
CP.register({
  api: 1, version: '1.0.0',
  type: 'prop', id: 'guitar', name: 'Guitar', pack: 'Classroom props', cat: 'Arts',
  colors: { body: '#c56a3a', line: '#6b3e1e' },
  params: [{ key: 'strings', label: 'Strings', type: 'range', min: 3, max: 6, def: 4 }],
  draw(p, P) {
    const body = []; // figure-of-eight body
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 2; const r = Math.sin(t) > 0 ? 38 : 28; body.push([Math.cos(t) * r * 0.95, (Math.sin(t) > 0 ? 30 : -10) + Math.sin(t) * r]); }
    p.poly(body, { stroke: 'line', w: 4, fill: 'paper', hatch: 'body', hg: 5, halpha: 0.7, smooth: true });
    p.circ(0, 18, 11, { stroke: 'line', w: 3, fill: 'line' });
    p.rect(-5, -120, 10, 92, { stroke: 'line', w: 3.5, fill: 'paper' });
    p.rect(-9, -142, 18, 24, { stroke: 'line', w: 3.5, fill: 'body' });
    const n = +P.strings; for (let i = 0; i < n; i++) { const x = -3 + (6 * i) / Math.max(1, n - 1); p.line([[x, -118], [x, 52]], { stroke: '#8a8a8a', w: 1.2 }); }
    p.line([[-14, 52], [14, 52]], { stroke: 'line', w: 4 });
  },
});
