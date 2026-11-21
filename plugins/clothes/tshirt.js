// Clothes: T-shirt. See ../README.md for the clothes context (c.J, c.style, c.skirtHull(), c.bodice(), …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'tshirt', name: 'T-shirt', legSpread: 7, armOffset: 8,
  draw(pen, c) {
    const { J, k, down } = c;
    const top = U.add(J.neck, U.mul(down, 2 * k)), bot = U.add(J.hip, U.mul(down, 3 * k));
    pen.poly([U.add(top, U.mul(J.p, -11 * k)), U.add(top, U.mul(J.p, 11 * k)), U.add(bot, U.mul(J.p, 12 * k)), U.add(bot, U.mul(J.p, -12 * k))], { ...c.style, fill: 'paper' });
  },
});
