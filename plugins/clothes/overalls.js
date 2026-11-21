// EXAMPLE clothes plugin — overalls (dungarees) over a T-shirt.
// Clothes are drawn after the legs and before the head/arms, using the skeleton in c.J
// (neck, shoulder, hip, legL/legR with S=hip point, E=knee, H=ankle, up=thigh angle; p = sideways unit vector).
CP.register({
  api: 1, version: '1.0.0',
  type: 'clothes', id: 'overalls', name: 'Overalls',
  legSpread: 7,  // gap between the legs at the hip
  armOffset: 8,  // shoulders this far out from the spine
  color: '#3f6fb5', // denim, unless the character sets a clothes colour
  draw(pen, c) {
    const { J, k, down } = c; const side = (pt, d) => U.add(pt, U.mul(J.p, d * k));
    const top = U.add(J.neck, U.mul(down, 2 * k)), bot = U.add(J.hip, U.mul(down, 3 * k));
    // T-shirt underneath in the character's own colour
    pen.poly([side(top, -11), side(top, 11), side(bot, 12), side(bot, -12)], { stroke: c.cast.color, w: c.W, fill: 'paper' });
    // shorts: a band down each thigh, so they bend when sitting
    for (const lg of [J.legL, J.legR]) {
      const d = U.dir(lg.up), n = [-d[1], d[0]], wd = 8 * k;
      const a = lg.S, b = U.add(lg.S, U.mul(d, J.d.th * 0.55));
      pen.poly([U.add(a, U.mul(n, wd)), U.add(b, U.mul(n, wd)), U.add(b, U.mul(n, -wd)), U.add(a, U.mul(n, -wd))], { ...c.style, fill: 'paper' });
    }
    // bib + straps + buttons
    const bibTop = U.add(J.shoulder, U.mul(down, 14 * k));
    pen.poly([side(bibTop, -8), side(bibTop, 8), side(bot, 13), side(bot, -13)], { ...c.style, fill: 'paper' });
    for (const s of [-1, 1]) {
      pen.line([side(J.shoulder, s * 9), side(bibTop, s * 6)], { stroke: c.color, w: c.W * 0.8 });
      pen.circ(...side(bibTop, s * 6), 2.2 * k, { stroke: c.color, w: 1.5, fill: c.color });
    }
    pen.rect(...side(U.add(bibTop, U.mul(down, 10 * k)), -5), 10 * k, 8 * k, { stroke: c.color, w: c.W * 0.6 }); // pocket
  },
});
