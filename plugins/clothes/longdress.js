// Clothes: Long dress. See ../README.md for the clothes context (c.J, c.style, c.skirtHull(), c.bodice(), …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'longdress', name: 'Long dress', legSpread: 9, skirt: 0.95,
  draw(pen, c) {
    pen.poly(c.skirtHull(), { ...c.style, fill: 'paper' });
    c.bodice();
  },
});
