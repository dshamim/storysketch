// Hair style: Headscarf. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'headscarf', name: 'Headscarf',
  draw(pen, h) {
    const F = h.F;
    const outer = [F(-1.55, 1.95), F(-1.22, 0.9), F(-1.17, -0.2), F(-0.92, -0.95), F(0, -1.2), F(0.92, -0.95), F(1.17, -0.2), F(1.22, 0.9), F(1.55, 1.95), F(0, 2.1)];
    const face = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; face.push(F(0.86 * Math.cos(a), 0.9 * Math.sin(a) + 0.05)); }
    if (h.back) pen.poly(outer, { ...h.style, smooth: true });
    else {
      pen.poly(outer, { ...h.style, smooth: true, hole: face, fill: 'paper' });
      pen.path(face, { closed: true, smooth: true, stroke: h.color, w: h.W * 0.8 });
      pen.curve([F(-0.8, 1.05), F(0, 1.45), F(0.8, 1.05)], { stroke: h.color, w: h.W * 0.7 });
    }
  },
});
