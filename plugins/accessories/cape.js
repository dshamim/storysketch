// Accessory: cape (back slot — behind the body). "sided": the figure panel's side button flips it.
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'cape', name: 'Cape', slot: 'back', sided: true,
  draw(pen, a) {
    const { J, k, down, side } = a;
    const p1 = U.add(J.shoulder, U.mul(J.p, -9 * k)), p2 = U.add(J.shoulder, U.mul(J.p, 9 * k));
    const lowL = U.add(U.add(J.hip, U.mul(down, 26 * k)), U.mul(J.p, 10 * k * side));
    const lowR = U.add(U.add(J.hip, U.mul(down, 14 * k)), U.mul(J.p, 46 * k * side));
    pen.poly([p1, p2, U.lerp2(p2, lowR, 0.5), lowR, U.lerp2(lowL, lowR, 0.5), lowL], { stroke: a.color, w: a.W * 0.8, fill: 'paper', hatch: a.color, hg: 6, halpha: 0.45, smooth: false });
  },
});
