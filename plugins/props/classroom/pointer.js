// Prop: teacher's pointer stick. Hand-held prop: origin = where the hand grips it, the stick points right.
// Put the origin on a character's hand, then rotate: the stick swings around the hand.
CP.register({
  api: 1, version: '1.0.0',
  type: 'prop', id: 'pointer', name: "Teacher's pointer stick", pack: 'Classroom props', cat: 'Learning',
  colors: { stick: '#8d6e4f', tip: '#c62828' },
  params: [
    { key: 'style', label: 'Style', type: 'select', def: 'wood', options: { wood: 'Wooden stick', metal: 'Telescopic (metal)', star: 'Star wand', hand: 'Pointing hand' } },
    { key: 'length', label: 'Length', type: 'range', min: 90, max: 340, step: 5, def: 190 },
  ],
  draw(p, P) {
    const L = +P.length || 190; const st = { stroke: 'stick', w: 3 };
    // tapered shaft from the handle end (x = -20) to the tip (x = L); the grip is centred on the origin
    const shaft = (x0, x1, w0, w1, o = {}) => p.poly([[x0, -w0 / 2], [x1, -w1 / 2], [x1, w1 / 2], [x0, w0 / 2]], { ...st, fill: 'paper', smooth: false, ...o });
    if (P.style === 'metal') { // three sliding sections, a ring at each joint, a little ball at the end
      p.rect(-20, -6, 44, 12, { stroke: '#444', w: 3, fill: 'paper', hatch: '#444', hg: 3, halpha: 0.6 });
      const seg = (L - 24) / 3; let x = 24, w = 8;
      for (let i = 0; i < 3; i++) { shaft(x, x + seg, w, w - 1.5, { stroke: '#7d8590', hatch: '#9aa3ad', hg: 4, halpha: 0.35, ha: 0 }); p.rect(x - 1.5, -w / 2 - 1.5, 4, w + 3, { stroke: '#555', w: 2, fill: '#888' }); x += seg; w -= 2; }
      p.circ(L + 4, 0, 5.5, { stroke: 'tip', w: 2.5, fill: 'tip' });
      return;
    }
    // wood (also the shaft of the star wand and the hand pointer)
    shaft(-20, L, 10, 4.5, { hatch: 'stick', hg: 4, halpha: 0.45, ha: 2 });
    p.rect(-20, -6, 34, 12, { stroke: 'stick', w: 3, fill: 'stick' }); // handle grip
    p.line([[-20, 0], [-24, 0]], { stroke: 'stick', w: 6 });
    if (P.style === 'star') { p.poly(CP.helpers.starPts(L + 14, 0, 20, 9).map(([x, y]) => [x, y]), { stroke: '#f2b705', w: 3, fill: '#fbc02d', hatch: '#f2b705', hg: 3, halpha: 0.7 }); return; }
    if (P.style === 'hand') { // a little glove pointing its finger
      const x = L - 4; const g = { stroke: 'tip', w: 3, fill: 'paper', hatch: 'tip', hg: 4, halpha: 0.45 };
      p.rect(x + 13, -11, 30, 8, { ...g, smooth: true }); // pointing finger
      p.poly([[x, -9], [x + 8, -13], [x + 18, -12], [x + 21, -4], [x + 20, 9], [x + 12, 13], [x + 2, 11], [x - 2, 4]], { ...g, smooth: true }); // fist
      p.curve([[x + 8, -1], [x + 15, 1], [x + 18, 6]], { stroke: 'tip', w: 2 }); // curled fingers
      p.rect(x - 6, -7, 6, 14, { stroke: 'tip', w: 2.5, fill: 'tip' }); // cuff
      return;
    }
    p.ell(L + 2, 0, 5, 3.5, { stroke: 'tip', w: 2.5, fill: 'tip' }); // rubber tip
  },
});
