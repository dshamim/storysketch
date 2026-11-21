// EXAMPLE hair plugin — two braids. Copy this file to make your own style.
// h.F(x, y) turns face units (head radius = 1, x right, y down, 0,0 = head centre) into drawing
// coordinates, following head tilt, size and the "Hair side" switch automatically.
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'braids', name: 'Two braids',
  draw(pen, h) {
    if (!h.front) return; // this style has nothing behind the head
    const F = h.F;
    pen.poly(h.cap(1.1, 0.74, -178, -2, false), h.style); // fringe cap across the top
    for (const s of [-1, 1]) {
      // a braid is a chain of little ovals hanging beside each ear
      for (let i = 0; i < 4; i++) pen.ell(...F(s * 1.1, 0.12 + i * 0.32), h.R * 0.17, h.R * 0.2, { ...h.style, hg: 3 }, 14);
      pen.circ(...F(s * 1.1, 1.38), h.R * 0.09, { stroke: '#e53935', w: h.W, fill: '#e53935' }); // hair tie
    }
  },
});
