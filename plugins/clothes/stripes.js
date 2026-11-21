// Clothes: Striped shirt. See ../README.md for the clothes context (c.J, c.style, c.skirtHull(), c.bodice(), …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'stripes', name: 'Striped shirt', legSpread: 7, armOffset: 8,
  draw(pen, c) {
    const { J, k, down } = c;
    const top = U.add(J.neck, U.mul(down, 2 * k)), bot = U.add(J.hip, U.mul(down, 3 * k));
    const pts = [U.add(top, U.mul(J.p, -11 * k)), U.add(top, U.mul(J.p, 11 * k)), U.add(bot, U.mul(J.p, 12 * k)), U.add(bot, U.mul(J.p, -12 * k))];
    pen.poly(pts, { ...c.style, fill: 'paper' });
    for (let i = 1; i <= 4; i++) { const t = i / 5; pen.line([U.lerp2(pts[0], pts[3], t), U.lerp2(pts[1], pts[2], t)], { stroke: c.color, w: c.W * 0.7 }); }
  },
});
