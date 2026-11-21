// Accessory: glasses (face slot). Drawn before the mask (order 1).
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'glasses', name: 'Glasses', slot: 'face', order: 1,
  draw(pen, a) {
    const { F, R } = a; const w = a.W * 0.75 * 0.85;
    for (const s of [-1, 1]) pen.circ(...F(s * 0.36 + a.look, a.eyeY), R * 0.26, { stroke: a.color, w });
    pen.line([F(-0.1 + a.look, a.eyeY - 0.04), F(0.1 + a.look, a.eyeY - 0.04)], { stroke: a.color, w });
  },
});
