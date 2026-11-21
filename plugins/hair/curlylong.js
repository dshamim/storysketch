// Hair style: Curly long. See ../README.md for the hair context (h.F, h.cap, h.style, …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'hair', id: 'curlylong', name: 'Curly long',
  draw(pen, h) {
    const F = h.F;
    const base = [[-1.08, 1.25], [-1.12, 0.6]]; for (let i = 0; i <= 20; i++) { const a = U.rad(U.lerp(170, 370, i / 20)); base.push([1.08 * Math.cos(a), 1.08 * Math.sin(a)]); } base.push([1.12, 0.6], [1.08, 1.25]);
    if (h.back) pen.poly([F(-1.3, 1.35), F(-1.35, 0), F(-1.05, -0.95), F(0, -1.3), F(1.05, -0.95), F(1.35, 0), F(1.3, 1.35), F(0.9, 1.2), F(-0.9, 1.2)], { ...h.style, stroke: false, smooth: true });
    else { pen.poly(h.cap(1.12, 0.78, -178, -2, false), { ...h.style, stroke: false }); pen.curve(h.loopy(base, 0.2, 0.44), { stroke: h.color, w: h.W }); }
  },
});
