// Hair style: Spiky. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'spiky', name: 'Spiky',
  draw(pen, h) {
    if (!h.front) return;
    const pts = []; const n = 12;
    for (let i = 0; i <= n; i++) { const a = U.rad(U.lerp(-176, -4, i / n)); const r = i % 2 ? 1.42 : 1.04; pts.push(h.F(r * Math.cos(a), r * Math.sin(a))); }
    for (let i = 0; i <= 8; i++) { const a = U.rad(U.lerp(-4, -176, i / 8)); pts.push(h.F(0.78 * Math.cos(a), 0.78 * Math.sin(a))); }
    pen.poly(pts, h.style);
  },
});
