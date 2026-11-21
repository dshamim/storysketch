// Accessory: art smock / apron with paint splats. slot 'body' = over the clothes, under the head and arms.
// Bib from the neck to the waist, then a short skirt over the top of the legs (works standing and sitting).
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'apron', name: 'Art apron (painty)', slot: 'body', rigs: ['biped'], color: '#4fc3f7',
  draw(pen, a) {
    const { J, k, down } = a; const P = J.p;
    const at = (pt, sx, dy) => U.add(U.add(pt, U.mul(P, sx * k)), U.mul(down, dy * k));
    const thigh = (lg, f, sx) => U.add(U.add(lg.S, U.mul(U.dir(lg.up), J.d.th * f)), U.mul(P, sx * k));
    const pts = U.hull([at(J.neck, -8, 6), at(J.neck, 8, 6), at(J.hip, -16, -14), at(J.hip, 16, -14), at(J.hip, -17, 0), at(J.hip, 17, 0),
      thigh(J.legL, 0.38, -6), thigh(J.legL, 0.38, 6), thigh(J.legR, 0.38, -6), thigh(J.legR, 0.38, 6)]);
    pen.poly(pts, { stroke: a.color, w: a.W * 0.75, fill: 'paper', hatch: a.color, hg: 4, halpha: 0.5 });
    pen.line([at(J.neck, -7, 6), at(J.neck, -4, -1)], { stroke: a.color, w: a.W * 0.55 });
    pen.line([at(J.neck, 7, 6), at(J.neck, 4, -1)], { stroke: a.color, w: a.W * 0.55 });
    pen.poly([at(J.hip, -9, -8), at(J.hip, 9, -8), at(J.hip, 9, 4), at(J.hip, -9, 4)], { stroke: a.color, w: a.W * 0.5, fill: 'paper' }); // pocket
    const r = U.rng(U.hash((a.cast.id || 'x') + ':apron'));
    const splat = ['#e53935', '#fbc02d', '#43a047', '#8e24aa', '#fb8c00'];
    for (let i = 0; i < 5; i++) { const c = splat[i]; const t = 0.3 + r() * 0.5; const q = at([U.lerp(J.neck[0], J.hip[0], t), U.lerp(J.neck[1], J.hip[1], t)], (r() - 0.5) * 18, 0); pen.circ(q[0], q[1], (1.5 + r() * 2) * k, { stroke: c, w: 1.5, fill: c }); }
  },
});
