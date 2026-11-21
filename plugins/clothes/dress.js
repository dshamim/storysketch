// Clothes: Dress (A-line). See ../README.md for the clothes context (c.J, c.style, c.skirtHull(), c.bodice(), …).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'dress', name: 'Dress (A-line)', legSpread: 9, skirt: 0.45,
  // skirt follows the thighs (A-line standing, drapes over the lap sitting) + bodice on top
  draw(pen, c) {
    pen.poly(c.skirtHull(), { ...c.style, fill: 'paper' });
    c.bodice();
  },
});
