// Accessory: wheelchair (base slot — drawn behind everything, attached at the hip).
// Also registers an empty wheelchair prop. One file can register several things.
(() => {
  function drawChair(pen, color, k = 1) {
    const o = { stroke: color, w: 4.5 };
    pen.line([[-30 * k, -64 * k], [-44 * k, -61 * k]], { ...o, w: 6 }); // handle
    pen.line([[-30 * k, -64 * k], [-26 * k, 6 * k], [32 * k, 6 * k]], o); // back + seat
    pen.line([[30 * k, 6 * k], [38 * k, 50 * k], [58 * k, 50 * k]], o); // footrest
    pen.line([[38 * k, 50 * k], [38 * k, 58 * k]], o);
    pen.circ(38 * k, 63 * k, 7 * k, { ...o, w: 3.5 });
    pen.circ(-4 * k, 34 * k, 36 * k, { ...o, w: 5 });
    pen.circ(-4 * k, 34 * k, 29 * k, { ...o, w: 2.5 });
    for (let i = 0; i < 4; i++) { const a = U.rad(i * 45 + 20); pen.line([[-4 * k + Math.cos(a) * 29 * k, 34 * k + Math.sin(a) * 29 * k], [-4 * k - Math.cos(a) * 29 * k, 34 * k - Math.sin(a) * 29 * k]], { ...o, w: 2 }); }
    pen.circ(-4 * k, 34 * k, 4 * k, { ...o, w: 2, fill: color });
  }
  CP.register({
    api: 1, version: '1.0.0',
    type: 'accessory', id: 'wheelchair', name: 'Wheelchair', slot: 'base', rigs: ['biped'], color: '#5f6368', suggestPose: 'sit', drawChair,
    draw(pen, a) { drawChair(pen, a.color, a.k); },
  });
})();
