// Hair style: Cap. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'cap', name: 'Cap',
  draw(pen, h) {
    if (!h.front) return;
    const F = h.F;
    pen.poly([...h.arcPts(-180, 0, 1.1, 16), F(0.9, -0.42), F(-0.95, -0.42)], { ...h.style, stroke: h.color, smooth: false });
    pen.poly([F(0.85, -0.5), F(1.75, -0.42), F(1.7, -0.3), F(0.85, -0.3)], { ...h.style });
  },
});
