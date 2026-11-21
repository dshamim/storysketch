// Hair style: Ponytail. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'ponytail', name: 'Ponytail',
  draw(pen, h) {
    if (!h.front) return;
    const F = h.F;
    pen.poly(h.cap(1.1, 0.74, -178, -2, false), h.style);
    pen.poly([F(0.85, -0.62), F(1.4, -0.75), F(1.78, -0.25), F(1.72, 0.45), F(1.45, 0.95), F(1.28, 0.4), F(1.12, -0.15)], { ...h.style, smooth: true });
    pen.line([F(0.9, -0.75), F(1.05, -0.5)], { stroke: h.color, w: h.W * 1.4 });
  },
});
