// Accessories: moustaches and beards (face slot, drawn over the face and under the fringe).
// Face units: head radius 1, centre 0,0, chin (0, 1); y goes down. The mouth sits around y 0.3–0.6.
// Colour: the character's hair colour, unless you pick another colour for the accessory in the Character designer.
(() => {
  const col = (a) => (a.color === a.castColor && a.cast.hairColor ? a.cast.hairColor : a.color);
  const hatch = (c, g = 3.2) => ({ hatch: c, hg: g, halpha: 0.85, ha: 70 });

  // moustache between the nose (y ≈ 0.22) and the mouth (y ≈ 0.32)
  function stache(pen, a, kind = 'classic') {
    const { F } = a; const c = col(a); const W = a.W * 0.6; const m = a.look * 0.8;
    const o = { stroke: c, w: W, fill: c, smooth: true, ...hatch(c) };
    if (kind === 'thin') { pen.curve([F(m - 0.3, 0.3), F(m - 0.12, 0.25), F(m, 0.27), F(m + 0.12, 0.25), F(m + 0.3, 0.3)], { stroke: c, w: W * 1.3 }); return; }
    if (kind === 'handlebar') {
      pen.poly([F(m, 0.24), F(m + 0.2, 0.22), F(m + 0.42, 0.28), F(m + 0.5, 0.2), F(m + 0.45, 0.32), F(m + 0.2, 0.33), F(m, 0.3), F(m - 0.2, 0.33), F(m - 0.45, 0.32), F(m - 0.5, 0.2), F(m - 0.42, 0.28), F(m - 0.2, 0.22)], o);
      for (const s of [-1, 1]) pen.curve([F(m + s * 0.5, 0.2), F(m + s * 0.6, 0.12), F(m + s * 0.52, 0.06), F(m + s * 0.46, 0.1)], { stroke: c, w: W * 1.1 }); // curled tips
      return;
    }
    if (kind === 'walrus') { pen.poly([F(m - 0.42, 0.42), F(m - 0.36, 0.24), F(m - 0.12, 0.2), F(m, 0.23), F(m + 0.12, 0.2), F(m + 0.36, 0.24), F(m + 0.42, 0.42), F(m + 0.2, 0.36), F(m, 0.4), F(m - 0.2, 0.36)], o); return; }
    // classic: two soft lobes
    pen.poly([F(m - 0.36, 0.33), F(m - 0.28, 0.24), F(m - 0.08, 0.21), F(m, 0.24), F(m + 0.08, 0.21), F(m + 0.28, 0.24), F(m + 0.36, 0.33), F(m + 0.14, 0.31), F(m, 0.33), F(m - 0.14, 0.31)], o);
  }

  // beard: jaw line from ear to ear, hanging `len` below the chin, with a gap for the mouth.
  // Shaded but not filled, so the mouth still shows through.
  function beard(pen, a, len, width = 0.95, pointed = false) {
    const { F } = a; const c = col(a); const W = a.W * 0.75; const m = a.look * 0.8;
    const out = [];
    for (let i = 0; i <= 16; i++) { const t = U.rad(U.lerp(-10, 190, i / 16)); const y = Math.sin(t); out.push([Math.cos(t) * width, y < 0 ? y * 0.2 : y * (1 + len)]); }
    if (pointed) out.splice(8, 1, [m, 1 + len + 0.35]);
    // inner edge: up the cheeks and round the mouth
    const inner = [[-0.8, 0.05], [-0.62, 0.3], [m - 0.42, 0.58], [m - 0.2, 0.7], [m + 0.2, 0.7], [m + 0.42, 0.58], [0.62, 0.3], [0.8, 0.05]];
    const below = out.filter(([, y]) => y > 0.74); // under the mouth: paper first, so the neck and body don't show through
    if (below.length > 2) pen.poly([[below[0][0], 0.74], ...below, [below[below.length - 1][0], 0.74]].map(([x, y]) => F(x, y)), { stroke: false, fill: 'paper', smooth: true });
    const shape = [...out, ...inner].map(([x, y]) => F(x, y));
    pen.poly(shape, { stroke: c, w: W, smooth: true, ...hatch(c, 3) });
  }

  const ACC = (id, name, draw, order = 3) => ({ type: 'accessory', id, name, slot: 'face', order, rigs: ['biped'], draw });
  CP.register({ api: 1, version: '1.0.0', items: [
    ACC('stache', 'Moustache', (pen, a) => stache(pen, a, 'classic')),
    ACC('stachethin', 'Moustache – thin', (pen, a) => stache(pen, a, 'thin')),
    ACC('handlebar', 'Moustache – handlebar', (pen, a) => stache(pen, a, 'handlebar')),
    ACC('walrus', 'Moustache – big bushy', (pen, a) => stache(pen, a, 'walrus')),
    ACC('stubble', 'Stubble', (pen, a) => {
      const { F } = a; const c = col(a); const r = U.rng(U.hash(a.cast.id || 'x'));
      for (let i = 0; i < 70; i++) {
        const t = U.rad(U.lerp(5, 175, r())), d = 0.72 + r() * 0.24; const x = Math.cos(t) * d, y = Math.sin(t) * d;
        if (y < 0.2 || (Math.abs(x - a.look * 0.8) < 0.42 && y < 0.62)) continue; // keep the mouth clear
        pen.circ(...F(x, y), a.R * 0.025, { stroke: c, w: 1, fill: c });
      }
      for (let i = 0; i < 18; i++) { const x = a.look * 0.8 + (r() - 0.5) * 0.6, y = 0.22 + r() * 0.07; pen.circ(...F(x, y), a.R * 0.022, { stroke: c, w: 1, fill: c }); }
    }),
    ACC('goatee', 'Goatee', (pen, a) => {
      const { F } = a; const c = col(a); const m = a.look * 0.8;
      stache(pen, a, 'thin');
      pen.poly([F(m - 0.22, 0.66), F(m + 0.22, 0.66), F(m + 0.2, 0.95), F(m, 1.12), F(m - 0.2, 0.95)].map((p) => p), { stroke: c, w: a.W * 0.6, fill: c, smooth: true, ...hatch(c) });
    }),
    ACC('beardshort', 'Beard – short', (pen, a) => { beard(pen, a, 0.12); stache(pen, a, 'classic'); }),
    ACC('beardfull', 'Beard – full', (pen, a) => { beard(pen, a, 0.45, 1.0); stache(pen, a, 'classic'); }),
    ACC('beardlong', 'Beard – long', (pen, a) => { beard(pen, a, 1.1, 1.0, true); stache(pen, a, 'walrus'); }),
    ACC('beardnostache', 'Beard – no moustache', (pen, a) => beard(pen, a, 0.35, 0.98)),
  ] });
})();
