// EXAMPLE accessory — sun hat. slot 'head' = drawn on top of the hair.
// Accessories get the same face frame as hair (a.F) plus the skeleton (a.J) and a colour (a.color).
CP.register({
  api: 1, version: '1.0.0',
  type: 'accessory', id: 'hat', name: 'Sun hat', slot: 'head', color: '#d9a03a',
  draw(pen, a) {
    const F = a.F;
    const dome = [F(-0.86, -0.78), F(-0.82, -1.3), F(-0.4, -1.62), F(0.4, -1.62), F(0.82, -1.3), F(0.86, -0.78)];
    pen.poly(dome, { stroke: a.color, w: a.W * 0.8, fill: 'paper', hatch: a.color, hg: 4, halpha: 0.55, smooth: true });
    const brim = []; for (let i = 0; i < 24; i++) { const t = i / 24 * Math.PI * 2; brim.push(F(1.5 * Math.cos(t), -0.8 + 0.2 * Math.sin(t))); }
    pen.poly(brim, { stroke: a.color, w: a.W * 0.8, fill: 'paper', hatch: a.color, hg: 4, halpha: 0.55, smooth: true });
    pen.curve([F(-0.84, -0.98), F(0, -1.05), F(0.84, -0.98)], { stroke: '#e53935', w: a.W * 1.1 }); // ribbon
  },
});
