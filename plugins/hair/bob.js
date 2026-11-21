// Hair style: Bob. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'bob', name: 'Bob',
  draw(pen, h) {
    const F = h.F;
    if (h.back) pen.poly([F(-1.2, -0.4), F(-1.28, 0.55), F(-0.9, 0.7), F(0.9, 0.7), F(1.28, 0.55), F(1.2, -0.4), F(0.7, -1.12), F(0, -1.22), F(-0.7, -1.12)], { ...h.style, smooth: true });
    else pen.poly([...h.arcPts(-182, 2, 1.13, 18), F(1.0, -0.2), F(0.3, -0.42), F(-0.3, -0.42), F(-1.0, -0.2)], { ...h.style, smooth: true });
  },
});
