// Prop: open book seen from BEHIND — the back of a book someone is holding up and reading.
// The covers face the viewer, angled back from the spine; page edges peek over the top.
// The front cover has a "picture" slot, so any picture add-on can be the cover art.
CP.register({
  api: 1, version: '1.0.0',
  type: 'prop', id: 'bookback', name: 'Open book (back view)', pack: 'Classroom props', cat: 'Learning',
  colors: { cover: '#2f6fd6', spine: '#1d4fa3', pages: '#b0aca4' },
  params: [{ key: 'title', label: 'Title lines on cover', type: 'toggle', def: true }],
  slots: [{ key: 'art', label: 'Cover picture', kind: 'picture', def: 'none', box: [12, -14, 40, 34] }],
  draw(p, P, it, x) {
    // page edges showing above the covers (paper fill so they hide what's behind)
    p.poly([[-58, -36], [-30, -44], [0, -36], [30, -44], [58, -36], [58, -30], [0, -26], [-58, -30]], { stroke: 'pages', w: 2.5, fill: 'paper', smooth: false });
    for (const s of [-1, 1]) for (let i = 1; i <= 2; i++) p.curve([[s * 6, -30 - i * 2], [s * 30, -38 - i * 2], [s * 54, -32 - i * 2]], { stroke: 'pages', w: 1.4 });
    // the two covers, angled back from the spine
    for (const s of [-1, 1]) p.poly([[s * 3, -28], [s * 62, -36], [s * 62, 30], [s * 3, 38]], { stroke: 'cover', w: 4, fill: 'paper', hatch: 'cover', hg: 4, halpha: 0.75, ha: s * 60 });
    // spine (nearest the viewer)
    p.poly([[-5, -29], [5, -29], [5, 39], [-5, 39]], { stroke: 'spine', w: 3, fill: 'spine' });
    if (P.title !== false) for (const [y, w] of [[-20, 30], [-12, 22]]) p.line([[-54, y], [-54 + w, y + 1]], { stroke: '#ffffff', w: 3 });
    x.slot('art');
  },
});
