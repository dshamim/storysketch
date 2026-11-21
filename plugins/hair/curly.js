// Hair style: Curly. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'curly', name: 'Curly',
  draw(pen, h) {
    if (!h.front) return;
    pen.poly(h.cap(1.12, 0.76, -178, -2, false), { ...h.style, stroke: false });
    const base = []; for (let i = 0; i <= 20; i++) { const a = U.rad(U.lerp(-185, 5, i / 20)); base.push([1.0 * Math.cos(a), 1.0 * Math.sin(a)]); }
    pen.curve(h.loopy(base, 0.2, 0.42), { stroke: h.color, w: h.W });
  },
});
