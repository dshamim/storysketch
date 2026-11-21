// Hair style: Pigtails. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'pigtails', name: 'Pigtails',
  draw(pen, h) {
    if (!h.front) return;
    const F = h.F;
    pen.poly(h.cap(1.1, 0.74, -178, -2, false), h.style);
    for (const s of [-1, 1]) {
      pen.poly([F(s * 0.95, -0.35), F(s * 1.45, -0.55), F(s * 1.75, -0.1), F(s * 1.62, 0.45), F(s * 1.25, 0.35), F(s * 1.05, 0.0)], { ...h.style, smooth: true });
      pen.circ(...F(s * 1.0, -0.32), h.R * 0.1, { stroke: h.color, w: h.W, fill: h.color });
    }
  },
});
