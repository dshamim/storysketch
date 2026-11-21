// Hair style: Short. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'short', name: 'Short',
  draw(pen, h) {
    if (h.front) pen.poly(h.cap(1.1, 0.72), h.style);
  },
});
