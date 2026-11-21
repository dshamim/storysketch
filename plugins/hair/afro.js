// Hair style: Afro puff. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'afro', name: 'Afro puff',
  draw(pen, h) {
    const F = h.F;
    if (h.back) {
      const base = []; for (let i = 0; i <= 26; i++) { const a = U.rad(U.lerp(150, 390, i / 26)); base.push([1.38 * Math.cos(a), 1.3 * Math.sin(a) - 0.2]); }
      pen.poly([F(-1.2, 0.5), ...base.map((p) => F(p[0], p[1])), F(1.2, 0.5)], { ...h.style, stroke: false, smooth: true });
      pen.curve(h.loopy(base, 0.16, 0.36), { stroke: h.color, w: h.W * 0.9 });
    } else pen.poly(h.cap(1.08, 0.8, -178, -2, false), { ...h.style, stroke: false });
  },
});
