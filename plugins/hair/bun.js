// Hair style: Bun. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'bun', name: 'Bun',
  draw(pen, h) {
    if (!h.front) return;
    pen.circ(...h.F(0, -1.35), h.R * 0.4, { ...h.style });
    pen.poly(h.cap(1.08, 0.76, -178, -2, false), h.style);
  },
});
