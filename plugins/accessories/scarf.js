// EXAMPLE accessory — scarf. slot 'body' = over the clothes, under the head and arms.
// "sided": the figure panel's side button (and Mirror pose) flips which side the tail hangs.
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'scarf', name: 'Scarf', slot: 'body', color: '#e53935', sided: true,
  draw(pen, a) {
    const { J, k, down, side } = a; const at = (pt, sx, dy) => U.add(U.add(pt, U.mul(J.p, sx * k)), U.mul(down, dy * k));
    const style = { stroke: a.color, w: a.W * 0.8, fill: 'paper', hatch: a.color, hg: 4, halpha: 0.6 };
    pen.poly([at(J.neck, -10, -1), at(J.neck, 10, -1), at(J.neck, 11, 8), at(J.neck, -11, 8)], { ...style, smooth: true });
    pen.poly([at(J.neck, side * 3, 6), at(J.neck, side * 10, 6), at(J.neck, side * 13, 34), at(J.neck, side * 5, 36)], style);
    for (const dy of [26, 31]) pen.line([at(J.neck, side * 6, dy), at(J.neck, side * 12.5, dy - 1)], { stroke: a.color, w: a.W * 0.5 }); // fringe stripes
  },
});
