// Prop: hand puppet (glove puppet) — the kind a child wears on a hand. Origin = centre.
// Options: which puppet, mouth open (talking). Pair it with a figure and detach the arm so the hand sits inside.
CP.register({
  api: 1, version: '1.0.0',
  type: 'prop', id: 'puppet', name: 'Hand puppet', pack: 'Classroom props', cat: 'Arts',
  colors: { body: '#e53935', head: '#f4c27a', accent: '#6d4c41' },
  params: [
    { key: 'style', label: 'Puppet', type: 'select', def: 'kid', options: { kid: 'Person', dog: 'Dog', frog: 'Frog', monster: 'Monster' } },
    { key: 'talk', label: 'Mouth open (talking)', type: 'toggle', def: false },
  ],
  draw(p, P) {
    const st = P.style, talk = P.talk === true || P.talk === 'true';
    const head = st === 'frog' ? '#7cb342' : st === 'monster' ? '#8e24aa' : 'head';
    // glove body (sleeve) + little arms
    p.poly([[-30, 75], [30, 75], [36, 0], [26, -12], [-26, -12], [-36, 0]], { stroke: 'body', w: 4, fill: 'paper', hatch: 'body', hg: 5, halpha: 0.6, smooth: true });
    for (const s of [-1, 1]) p.poly([[s * 30, 4], [s * 52, -8], [s * 58, 4], [s * 36, 20]], { stroke: 'body', w: 3.5, fill: 'paper', hatch: 'body', hg: 4, halpha: 0.6, smooth: true });
    p.line([[-30, 62], [30, 62]], { stroke: 'body', w: 2.5 }); // cuff
    // ears / hair behind the head
    if (st === 'dog') for (const s of [-1, 1]) p.poly([[s * 22, -64], [s * 42, -60], [s * 44, -24], [s * 30, -30]], { stroke: 'accent', w: 3, fill: 'accent', smooth: true });
    if (st === 'monster') for (let i = -2; i <= 2; i++) p.poly([[i * 12 - 6, -66], [i * 12, -84 - (i % 2 ? 0 : 6)], [i * 12 + 6, -66]], { stroke: '#8e24aa', w: 2.5, fill: '#8e24aa' });
    // head
    if (st === 'frog') p.ell(0, -40, 40, 28, { stroke: head, w: 4, fill: 'paper', hatch: head, hg: 4, halpha: 0.6 });
    else p.circ(0, -44, 30, { stroke: st === 'kid' || st === 'dog' ? 'accent' : head, w: 4, fill: 'paper', hatch: head, hg: 4, halpha: st === 'kid' || st === 'dog' ? 0.35 : 0.6 });
    // eyes
    if (st === 'frog') for (const s of [-1, 1]) { p.circ(s * 18, -66, 11, { stroke: head, w: 3, fill: 'paper' }); p.circ(s * 18, -66, 4.5, { stroke: false, fill: '#222' }); }
    else if (st === 'monster') { p.circ(0, -52, 11, { stroke: '#222', w: 2.5, fill: 'paper' }); p.circ(0, -52, 4.5, { stroke: false, fill: '#222' }); }
    else for (const s of [-1, 1]) p.circ(s * 11, -50, 3.6, { stroke: false, fill: '#222' });
    if (st === 'dog') p.ell(0, -40, 7, 5, { stroke: '#222', w: 2, fill: '#222' });
    if (st === 'kid') p.poly([[-26, -54], [-22, -72], [-6, -76], [10, -76], [24, -68], [28, -54], [14, -64], [-4, -66]], { stroke: 'accent', w: 3, hatch: 'accent', hg: 3, halpha: 0.8, smooth: true }); // hair
    // mouth
    const my = st === 'frog' ? -34 : -30, mw = st === 'frog' ? 26 : 13;
    if (talk) p.ell(0, my + 2, mw * 0.8, 8, { stroke: '#7b1f1f', w: 2.5, fill: '#c62828' });
    else p.curve([[-mw, my], [0, my + 8], [mw, my]], { stroke: '#7b1f1f', w: 2.5 });
  },
});
