// Accessory: superhero eye mask (face slot). Eye holes are punched with paper, then the eyes redrawn.
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'mask', name: 'Hero mask', slot: 'face', order: 2,
  draw(pen, a) {
    const { F, R } = a; const W = a.W * 0.75;
    pen.poly([F(-0.82, -0.28), F(0, -0.36), F(0.82, -0.28), F(0.75, 0.12), F(0.1, 0.1), F(0, 0.0), F(-0.1, 0.1), F(-0.75, 0.12)], { stroke: a.color, w: W, fill: a.color, smooth: true });
    for (const s of [-1, 1]) {
      pen.ell(...F(s * 0.36 + a.look, a.eyeY), R * 0.17, R * 0.12, { stroke: false, fill: 'paper' });
      pen.circ(...F(s * 0.36 + a.look, a.eyeY), R * 0.08, { stroke: false, fill: a.castColor });
    }
  },
});
