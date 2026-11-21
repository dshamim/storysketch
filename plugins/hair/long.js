// Hair style: Long wavy. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'long', name: 'Long wavy',
  draw(pen, h) {
    const F = h.F;
    if (h.back) pen.poly([F(-1.04, -0.45), F(-1.14, 0.4), F(-1.3, 1.5), F(-0.95, 1.65), F(-0.72, 1.25), F(0.72, 1.25), F(0.95, 1.65), F(1.3, 1.5), F(1.14, 0.4), F(1.04, -0.45), F(0.66, -0.96), F(0, -1.1), F(-0.66, -0.96)], { ...h.style, smooth: true });
    else {
      pen.poly([...h.arcPts(-188, 8, 1.1, 18), F(0.95, -0.25), F(0.6, -0.68), F(0.1, -0.74), F(-0.15, -0.6), F(-0.6, -0.76), F(-0.97, -0.25)], { ...h.style, smooth: true });
      for (const s of [-1, 1]) pen.curve([F(s * 1.06, -0.1), F(s * 1.14, 0.45), F(s * 1.08, 0.95), F(s * 1.22, 1.45)], { stroke: h.color, w: h.W * 0.7 });
    }
  },
});
