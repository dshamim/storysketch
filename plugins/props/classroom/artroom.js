// Props for the art corner: arts & crafts table, stamps + ink pad, stamped paper, clay pots, clay / play-dough,
// pottery wheel, brush jar, glue + glitter, paint splats, and a line of artwork pegged up to dry.
// Floor / table props: origin = bottom centre (they stand on y = 0). Splats: origin = centre.
(() => {
  const PAL = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
  const WOOD = '#8a5a33', WOODL = '#d7a86e', GLASS = '#90a4ae', BLACK = '#424242';
  const fillc = (c, a = 0.8, g = 3, ha) => ({ hatch: c, hg: g, halpha: a, ...(ha != null ? { ha } : {}) });
  const rngOf = (it, P, extra = '') => U.rng(U.hash(it.id + ':' + (P.shuffle || 1) + extra));
  const shuffled = (r) => { const c = PAL.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };

  // ---------------------------------------------------------------- little things (stand at x, y; s = scale)
  function paintPots(p, x, y, s) {
    ['#e53935', '#1e88e5', '#fbc02d'].forEach((c, i) => { const cx = x + (i - 1) * 22 * s; p.rect(cx - 9 * s, y - 18 * s, 18 * s, 18 * s, { stroke: c, w: 2.5, fill: 'paper', ...fillc(c, 0.5, 3.5) }); p.ell(cx, y - 18 * s, 9.5 * s, 3.5 * s, { stroke: c, w: 2.5, fill: c }); });
  }
  function brushJar(p, x, y, s, r, n = 3, water = 'murky') {
    const wc = { clean: '#81d4fa', murky: '#8d8fa8', rainbow: '#ab8fc0' }[water] || '#8d8fa8';
    for (let i = 0; i < n; i++) {
      const a = -90 + (i - (n - 1) / 2) * 13 + (r() - 0.5) * 6, d = U.dir(a), bx = x + (i - (n - 1) / 2) * 5 * s, by = y - 8 * s;
      const at = (k) => [bx + d[0] * k * s, by + d[1] * k * s];
      p.line([at(0), at(44)], { stroke: WOOD, w: Math.max(2, 3.2 * s) });
      p.line([at(44), at(51)], { stroke: '#8a8a8a', w: Math.max(2.5, 4.5 * s) });
      const c = PAL[(i * 3 + 1) % 8]; p.poly([at(51), [at(57)[0] - 3 * s, at(57)[1]], at(64), [at(57)[0] + 3 * s, at(57)[1]]], { stroke: c, w: 2, fill: c, smooth: true });
    }
    p.rect(x - 14 * s, y - 20 * s, 28 * s, 20 * s, { stroke: false, ...fillc(wc, 0.55, 3) });
    if (water === 'rainbow') for (let i = 0; i < 3; i++) p.curve([[x - 11 * s, y - (5 + i * 5) * s], [x, y - (7 + i * 5) * s], [x + 11 * s, y - (4 + i * 5) * s]], { stroke: PAL[i * 2], w: 1.5 });
    p.rect(x - 14 * s, y - 32 * s, 28 * s, 32 * s, { stroke: GLASS, w: 2.5 });
    p.ell(x, y - 32 * s, 14 * s, 3.5 * s, { stroke: GLASS, w: 2 });
    p.line([[x - 9 * s, y - 27 * s], [x - 9 * s, y - 8 * s]], { stroke: '#cfd8dc', w: 2 }); // shine
  }
  function crayonTub(p, x, y, s, r) {
    const cols = shuffled(r);
    for (let i = 0; i < 5; i++) { const c = cols[i], cx = x - 10 * s + i * 5 * s, h = (26 + r() * 10) * s; p.rect(cx - 2.5 * s, y - h, 5 * s, h, { stroke: c, w: 2, fill: c }); p.poly([[cx - 2.5 * s, y - h], [cx, y - h - 5 * s], [cx + 2.5 * s, y - h]], { stroke: c, w: 1.5, fill: c }); }
    p.poly([[x - 15 * s, y - 22 * s], [x + 15 * s, y - 22 * s], [x + 12 * s, y], [x - 12 * s, y]], { stroke: '#1e88e5', w: 2.5, fill: 'paper', ...fillc('#1e88e5', 0.5, 3.5) });
  }
  function stamp(p, x, y, s, hc, ink, face) {
    p.rect(x - 13 * s, y - 3 * s, 26 * s, 3 * s, { stroke: ink, w: 1.5, fill: ink });
    p.rect(x - 15 * s, y - 13 * s, 30 * s, 10 * s, { stroke: WOOD, w: 2.2, fill: 'paper', ...fillc(WOODL, 0.8, 3) });
    if (face && CP.helpers.stampShape) CP.helpers.stampShape(p, face, x, y - 8 * s, 3.6 * s, ink, 0, () => 0.5);
    p.rect(x - 4 * s, y - 24 * s, 8 * s, 11 * s, { stroke: WOOD, w: 2, fill: 'paper', ...fillc(WOODL, 0.8, 3) });
    p.circ(x, y - 29 * s, 7 * s, { stroke: hc, w: 2.2, fill: 'paper', ...fillc(hc, 0.85, 2.5) });
  }
  function inkPad(p, x, y, s, ink, lid = true) {
    if (lid) p.poly([[x - 30 * s, y - 14 * s], [x + 30 * s, y - 14 * s], [x + 34 * s, y - 34 * s], [x - 26 * s, y - 34 * s]], { stroke: BLACK, w: 2, fill: 'paper', ...fillc('#9e9e9e', 0.3, 5) });
    p.rect(x - 32 * s, y - 12 * s, 64 * s, 12 * s, { stroke: BLACK, w: 2.5, fill: 'paper', ...fillc('#616161', 0.8, 3) });
    p.poly([[x - 28 * s, y - 12 * s], [x + 28 * s, y - 12 * s], [x + 25 * s, y - 17 * s], [x - 25 * s, y - 17 * s]], { stroke: ink, w: 2, fill: ink });
  }
  function stampSet(p, x, y, s, r, ink, n = 2) {
    const faces = ['star', 'heart', 'flower', 'leaf'];
    inkPad(p, x - (n * 17) * s, y, s, ink);
    for (let i = 0; i < n; i++) stamp(p, x + (20 + i * 34 - n * 17 + 18) * s, y, s, PAL[(i * 3 + 4) % 8], ink, faces[i % 4]);
  }
  function clayLump(p, x, y, s, c, r) {
    p.poly(CP.helpers.bumpy(x, y - 13 * s, 21 * s, 14 * s, 5, 0.1, 40), { stroke: shade(c), w: 2.5, fill: 'paper', smooth: true, ...fillc(c, 0.75, 3) });
    for (let i = 0; i < 3; i++) p.arc(x - 10 * s + i * 9 * s + r() * 3, y - 14 * s - r() * 4, 3 * s, 2 * s, 200, 340, { stroke: shade(c), w: 1.5 });
  }
  const shade = (c) => ({ '#a1887f': '#6d4c41' }[c] || c);

  // ---------------------------------------------------------------- clay pots
  const PROFILE = {
    pot: { h: 1, r: [[0, 0.55], [0.2, 0.85], [0.45, 0.95], [0.7, 0.8], [0.88, 0.6], [1, 0.68]] },
    vase: { h: 1.15, r: [[0, 0.42], [0.3, 0.72], [0.55, 0.55], [0.78, 0.3], [1, 0.46]] },
    bowl: { h: 0.5, r: [[0, 0.55], [0.35, 0.88], [0.7, 1.0], [1, 1.05]] },
    mug: { h: 0.85, r: [[0, 0.6], [0.5, 0.62], [1, 0.62]] },
    pinch: { h: 0.65, r: [[0, 0.62], [0.4, 0.88], [0.8, 0.86], [1, 0.78]] },
  };
  const radiusAt = (prof, t) => { const R = prof.r; for (let i = 1; i < R.length; i++) if (t <= R[i][0]) { const [t0, a] = R[i - 1], [t1, b] = R[i]; return U.lerp(a, b, (t - t0) / (t1 - t0)); } return R[R.length - 1][1]; };
  const FINISH = {
    wet: { line: '#6d4c41', fill: '#a1887f', a: 0.7 },
    fired: { line: '#a0522d', fill: '#d2774a', a: 0.75 },
    painted: { line: '#5d4037', fill: null, a: 0.35 },
  };
  function clayPot(p, x, y, size, shape = 'pot', finish = 'fired', pattern = 'stripes', wonky = true, r = Math.random, cols) {
    const prof = PROFILE[shape] || PROFILE.pot, H = size * prof.h, k = size * 0.55, F = FINISH[finish] || FINISH.fired;
    const ph1 = r() * 6, ph2 = r() * 6, wob = wonky ? 0.07 : 0;
    const Rr = (t) => radiusAt(prof, t) * k * (1 + wob * Math.sin(t * 5 + ph1)), Rl = (t) => radiusAt(prof, t) * k * (1 + wob * Math.sin(t * 5 + ph2));
    const tilt = wonky ? (r() - 0.5) * size * 0.06 : 0;
    const N = 10, right = [], left = [];
    for (let i = 0; i <= N; i++) { const t = i / N; right.push([x + Rr(t), y - t * H - (t === 1 ? -tilt : 0)]); left.push([x - Rl(t), y - t * H - (t === 1 ? tilt : 0)]); }
    const base = cols ? cols[0] : PAL[Math.floor(r() * 8)], deco = cols ? cols[1] : PAL[(PAL.indexOf(base) + 3) % 8];
    const body = { stroke: F.line, w: Math.max(2, size * 0.03), fill: 'paper', smooth: true, ...fillc(F.fill || base, F.a, 3) };
    if (shape === 'mug') p.curve([[x + Rr(0.8) - 2, y - 0.78 * H], [x + Rr(0.5) + size * 0.28, y - 0.62 * H], [x + Rr(0.5) + size * 0.24, y - 0.32 * H], [x + Rr(0.2) - 2, y - 0.22 * H]], { stroke: F.fill ? F.line : base, w: Math.max(4, size * 0.08) });
    p.poly([...right, ...left.reverse()], body);
    if (finish === 'painted') {
      for (const [j, t] of [[0, 0.3], [1, 0.55], [2, 0.78]].filter(([, t]) => t < 0.92)) {
        if (shape === 'bowl' && j === 2) continue;
        const yy = y - t * H, cx = x + (Rr(t) - Rl(t)) / 2, hw = (Rr(t) + Rl(t)) / 2 * 0.98, sag = hw * 0.18, c = j % 2 ? deco : base;
        const along = (u) => { const a = U.rad(180 * (1 - u)); return [cx + Math.cos(a) * hw, yy + Math.sin(a) * sag]; };
        if (pattern === 'dots') for (let i = 1; i < 6; i++) p.circ(...along(i / 6), Math.max(1.5, size * 0.03), { stroke: deco, w: 1.5, fill: deco });
        else if (pattern === 'zigzag') { const pts = []; for (let i = 0; i <= 8; i++) { const q = along(i / 8); pts.push([q[0], q[1] + (i % 2 ? -1 : 1) * size * 0.035]); } p.line(pts, { stroke: c, w: Math.max(2, size * 0.035) }); }
        else p.arc(cx, yy, hw, sag, 0, 180, { stroke: c, w: Math.max(2.5, size * 0.05) });
      }
    }
    // rim: the opening, with the dark inside
    const rx = (Rr(1) + Rl(1)) / 2, cx = x + (Rr(1) - Rl(1)) / 2, cy = y - H;
    const ry = rx * (shape === 'bowl' ? 0.32 : 0.22);
    const rim = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; rim.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry - Math.cos(a) * tilt]); }
    p.poly(rim, { stroke: F.line, w: Math.max(2, size * 0.03), fill: 'paper', smooth: true, ...fillc(F.line, 0.35, 3.5) });
  }

  // ---------------------------------------------------------------- flat paper on a table (drawn flat, then laid down)
  function flatSheet(p, x, slotFn, cx, front, W, D) {
    const Hf = W * 0.7, n0 = p.o.length;
    const F = ([fx, fy]) => { const v = (fy + Hf) / Hf; return [cx + fx * U.lerp(0.88, 1, v) + (1 - v) * 6, front - D * (1 - v)]; };
    p.poly([[-W / 2, 0], [W / 2, 0], [W / 2, -Hf], [-W / 2, -Hf]], { stroke: '#9a9a9a', w: 2.5, fill: 'paper' });
    const n1 = p.o.length;
    slotFn([-W / 2 + W * 0.08, -Hf + W * 0.06, W * 0.84, Hf - W * 0.12]);
    const thin = 0.5 + Math.min(1, D / Hf) * 0.5;
    p.o.slice(n0).forEach((pr, i) => { pr.pts = pr.pts.map(F); if (i + n0 >= n1) pr.w *= thin; });
  }

  const ITEMS = [ // [key, label, width]
    ['paints', 'Paint pots', 70], ['brushjar', 'Brushes in a jar', 36], ['crayons', 'Crayon tub', 34],
    ['stamps', 'Stamps + ink pad', 112], ['clay', 'Lump of clay', 52], ['pot', 'Clay pot', 50],
  ];

  CP.register({ api: 1, version: '1.0.0', pack: 'Classroom props', items: [
    { type: 'prop', id: 'artstable', name: 'Arts & crafts table', cat: 'Arts',
      colors: { line: '#6f6f6f', top: '#ffffff', cover: '#4fc3f7', ink: '#1e88e5' },
      params: [
        { key: 'width', label: 'Width', type: 'range', min: 220, max: 700, step: 10, def: 440 },
        { key: 'height', label: 'Height', type: 'select', def: 'low', options: { low: 'Low (children\'s table)', tall: 'Tall (grown-up table)' } },
        { key: 'depth', label: 'Table top seen from (side ↔ above)', type: 'range', min: 18, max: 110, step: 2, def: 50 },
        { key: 'cover', label: 'Covered with', type: 'select', def: 'none', options: { none: 'Nothing', plastic: 'Plastic sheet', newspaper: 'Newspaper' } },
        { key: 'splats', label: 'Paint splats', type: 'toggle', def: true },
        { key: 'sheet', label: 'Paper on the table', type: 'toggle', def: true },
        ...ITEMS.map(([key, label]) => ({ key, label, type: 'toggle', def: ['paints', 'brushjar', 'stamps'].includes(key) })),
        { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      slots: [{ key: 'art', label: 'On the paper', kind: 'picture', def: 'picstamps', box: [-70, -100, 140, 100] }],
      draw(p, P, it, x) {
        const W = +P.width || 440, T = P.height === 'tall' ? -128 : -96, D = +P.depth || 50, sk = 12, r = rngOf(it, P);
        const o = { stroke: 'line', w: 4.5 };
        const L = -W / 2, R = W / 2;
        // legs (back ones first, then the top hides their tops)
        p.line([[L + 22 + sk, T - D + 6], [L + 22 + sk, T + 10 - 14]], o); p.line([[R - 4 + sk, T - D + 6], [R - 4 + sk, T + 10 - 14]], o);
        p.line([[L + 8, T + 10], [L + 8, 0]], o); p.line([[R - 18, T + 10], [R - 18, 0]], o);
        const topPts = [[L + sk, T - D], [R + sk, T - D], [R, T], [L, T]];
        p.poly(topPts, { ...o, fill: 'top' });
        p.poly([[L, T], [R, T], [R, T + 10], [L, T + 10]], { ...o, fill: 'paper' });
        const onTop = (u, v) => [U.lerp(L, R, u) + sk * (1 - v), T - D * (1 - v)]; // u across, v back(0) → front(1)
        if (P.cover === 'newspaper') {
          for (const [u0, u1, v0, v1] of [[0.04, 0.52, 0.06, 0.96], [0.46, 0.97, 0.1, 0.92]]) {
            p.poly([onTop(u0, v0), onTop(u1, v0), onTop(u1, v1), onTop(u0, v1)], { stroke: '#9e9e9e', w: 2, fill: 'paper', ...fillc('#bdbdbd', 0.25, 5) });
            for (let i = 0; i < 4; i++) { const v = U.lerp(v0, v1, (i + 0.6) / 4.5); p.line([onTop(u0 + 0.03, v), onTop(U.lerp(u0, u1, 0.45), v)], { stroke: '#9e9e9e', w: 1.5 }); p.line([onTop(U.lerp(u0, u1, 0.55), v), onTop(u1 - 0.03, v)], { stroke: '#9e9e9e', w: 1.5 }); }
          }
        }
        if (P.splats !== false) for (let i = 0; i < 7; i++) {
          const c = PAL[Math.floor(r() * 8)], [sx, sy] = onTop(0.05 + r() * 0.9, 0.15 + r() * 0.8), s = 4 + r() * 7;
          p.poly(CP.helpers.bumpy(sx, sy, s, s * Math.max(0.3, D / 110), 5, 0.3, 30), { stroke: c, w: 1.5, fill: c, smooth: true, op: 0.85 });
          if (P.cover !== 'plastic' && i < 2) { const dx = U.lerp(L + 30, R - 30, r()); p.line([[dx, T], [dx, T + 10 + r() * 14]], { stroke: c, w: 3 }); p.circ(dx, T + 14 + r() * 14, 2.5, { stroke: c, w: 1.5, fill: c }); }
        }
        if (P.cover === 'plastic') {
          const hem = []; const n = Math.max(6, Math.round(W / 40)); for (let i = 0; i <= n; i++) hem.push([U.lerp(R + 2, L - 4, i / n), T + 34 + (i % 2 ? 6 : 0)]);
          p.poly([[L - 6 + sk, T - D - 3], [R + 14, T - D - 3], [R + 2, T], ...hem, [L - 4, T]], { stroke: 'cover', w: 2.5, smooth: false, ...fillc('cover', 0.3, 5) });
        }
        // paper in the middle, things around it
        const front = T - 5, pw = Math.min(150, W * 0.3), cx0 = P.sheet !== false ? -W * 0.04 : 1e9;
        if (P.sheet !== false) flatSheet(p, x, (box) => x.slot('art', box), cx0, front, pw, Math.min(D * 0.8, pw * 0.7));
        const yI = T - D * 0.42;
        // two free stretches of table, left and right of the paper; each thing goes in the first one with room
        const free = P.sheet !== false ? [[L + 18, cx0 - pw / 2 - 8], [cx0 + pw / 2 + 8, R - 8]] : [[L + 18, R - 8]];
        for (const [key, , w] of ITEMS) {
          if (!P[key]) continue;
          const zone = free.find(([a, b]) => b - a >= w); if (!zone) continue; // no room: leave it off
          const cur = zone[0]; zone[0] += w + 6;
          const ix = cur + w / 2 + sk * 0.5;
          if (key === 'paints') paintPots(p, ix, yI, 1);
          else if (key === 'brushjar') brushJar(p, ix, yI, 1, r);
          else if (key === 'crayons') crayonTub(p, ix, yI, 1, r);
          else if (key === 'stamps') stampSet(p, ix, yI, 1, r, 'ink');
          else if (key === 'clay') clayLump(p, ix, yI, 1, '#a1887f', r);
          else if (key === 'pot') clayPot(p, ix, yI, 44, 'pot', 'painted', 'stripes', true, r);
        }
      } },

    { type: 'prop', id: 'stamps', name: 'Stamps + ink pad', cat: 'Arts',
      colors: { ink: '#1e88e5' },
      params: [
        { key: 'what', label: 'What', type: 'select', def: 'set', options: { set: 'Ink pad + stamps', pad: 'Ink pad', stamp: 'One stamp (to hold)', potato: 'Potato stamp (cut in half)' } },
        { key: 'count', label: 'How many stamps', type: 'range', min: 1, max: 4, step: 1, def: 2, when: { what: 'set' } },
        { key: 'face', label: 'Stamp shape', type: 'select', def: 'star', options: { star: 'Star', heart: 'Heart', flower: 'Flower', leaf: 'Leaf' }, when: { what: ['stamp', 'potato'] } },
        { key: 'size', label: 'Size', type: 'range', min: 0.6, max: 3, step: 0.1, def: 1.4 },
      ],
      draw(p, P, it) {
        const s = +P.size || 1.4, r = U.rng(U.hash(it.id));
        if (P.what === 'pad') inkPad(p, 0, 0, s, 'ink');
        else if (P.what === 'stamp') stamp(p, 0, 0, s, '#e53935', 'ink', P.face || 'star');
        else if (P.what === 'potato') {
          p.ell(0, -16 * s, 30 * s, 16 * s, { stroke: '#8d6e63', w: 2.5, fill: 'paper', ...fillc('#bcaaa4', 0.6, 3.5) }); // the round back
          p.ell(4 * s, -18 * s, 24 * s, 13 * s, { stroke: '#c5a572', w: 2, fill: '#fff3c4' }); // cut face
          CP.helpers.stampShape(p, P.face || 'star', 4 * s, -18 * s, 10 * s, 'ink', 0, () => 0.9);
        } else stampSet(p, 0, 0, s, r, 'ink', +P.count || 2);
      } },

    { type: 'prop', id: 'stamppaper', name: 'Stamped paper', cat: 'Arts',
      colors: { line: '#9a9a9a' },
      params: [
        { key: 'width', label: 'Width', type: 'range', min: 100, max: 460, step: 10, def: 220 },
        { key: 'flat', label: 'Lying flat (on a table / the floor)', type: 'toggle', def: false },
        { key: 'shape', label: 'Stamp', type: 'select', def: 'mixed', options: { star: 'Stars', heart: 'Hearts', flower: 'Flowers', potato: 'Potato prints', hand: 'Handprints', leaf: 'Leaf prints', mixed: 'A mix' } },
        { key: 'count', label: 'How many prints', type: 'range', min: 1, max: 24, step: 1, def: 9 },
        { key: 'mixed', label: 'Lots of colours', type: 'toggle', def: true },
        { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      draw(p, P, it) {
        const W = +P.width || 220, H = W * 0.72, n0 = p.o.length;
        p.rect(-W / 2, -H, W, H, { stroke: 'line', w: 3, fill: 'paper' });
        const m = W * 0.07;
        CP.helpers.stampPrints(p, { x: -W / 2 + m, y: -H + m, w: W - 2 * m, h: H - 2 * m }, rngOf(it, P), P);
        if (P.flat) { const D = H * 0.4; for (const pr of p.o.slice(n0)) { pr.pts = pr.pts.map(([fx, fy]) => { const v = (fy + H) / H; return [fx * U.lerp(0.86, 1, v), -D * (1 - v)]; }); pr.w *= 0.75; } }
      } },

    { type: 'prop', id: 'claypot', name: 'Clay pot', cat: 'Arts',
      colors: {},
      params: [
        { key: 'shape', label: 'Shape', type: 'select', def: 'pot', options: { pot: 'Pot', vase: 'Vase', bowl: 'Bowl', mug: 'Mug', pinch: 'Little pinch pot' } },
        { key: 'finish', label: 'Clay', type: 'select', def: 'painted', options: { wet: 'Wet clay (just made)', fired: 'Baked (terracotta)', painted: 'Painted' } },
        { key: 'pattern', label: 'Painted with', type: 'select', def: 'stripes', options: { stripes: 'Stripes', dots: 'Dots', zigzag: 'Zigzags' }, when: { finish: 'painted' } },
        { key: 'size', label: 'Size', type: 'range', min: 30, max: 220, step: 5, def: 90 },
        { key: 'count', label: 'How many', type: 'range', min: 1, max: 4, step: 1, def: 1 },
        { key: 'wonky', label: 'Hand-made (a bit wonky)', type: 'toggle', def: true },
        { key: 'shuffle', label: 'Shuffle colours', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      draw(p, P, it) {
        const r = rngOf(it, P), n = +P.count || 1, S = +P.size || 90, shapes = Object.keys(PROFILE);
        let x = 0; const sizes = [], kinds = [];
        for (let i = 0; i < n; i++) { sizes.push(i === 0 ? S : S * (0.55 + r() * 0.35)); kinds.push(i === 0 ? P.shape || 'pot' : shapes[Math.floor(r() * shapes.length)]); }
        const total = sizes.reduce((a, s, i) => a + s * (kinds[i] === 'bowl' ? 1.25 : 1.05), 0);
        x = -total / 2;
        sizes.forEach((s, i) => { const w = s * (kinds[i] === 'bowl' ? 1.25 : 1.05); const c = shuffled(r); clayPot(p, x + w / 2, 0, s, kinds[i], P.finish || 'painted', P.pattern || 'stripes', P.wonky !== false, r, c); x += w; });
      } },

    { type: 'prop', id: 'clay', name: 'Clay / play-dough', cat: 'Arts',
      colors: {},
      params: [
        { key: 'kind', label: 'Made of', type: 'select', def: 'clay', options: { clay: 'Clay', dough: 'Play-dough (bright colours)' } },
        { key: 'what', label: 'What', type: 'select', def: 'shapes', options: { lump: 'A big lump', shapes: 'Snakes, balls + a little pot', tools: 'Rolling pin + cutter', all: 'All of it' } },
        { key: 'size', label: 'Size', type: 'range', min: 0.6, max: 3, step: 0.1, def: 1.3 },
        { key: 'shuffle', label: 'Shuffle colours', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      draw(p, P, it) {
        const s = +P.size || 1.3, r = rngOf(it, P), dough = P.kind === 'dough', cols = shuffled(r);
        const col = (i) => (dough ? cols[i % 8] : '#a1887f'), ln = (i) => (dough ? cols[i % 8] : '#6d4c41');
        const what = P.what || 'shapes', parts = what === 'all' ? ['lump', 'shapes', 'tools'] : [what];
        const widths = { lump: 60, shapes: 120, tools: 110 }; let x = -parts.reduce((a, k) => a + widths[k] * s, 0) / 2;
        for (const k of parts) {
          const cx = x + widths[k] * s / 2;
          if (k === 'lump') clayLump(p, cx, 0, s * 1.2, col(0), r);
          else if (k === 'shapes') {
            const sn = []; for (let i = 0; i <= 14; i++) sn.push([cx - 50 * s + i * 5 * s, -5 * s - Math.sin(i * 0.9) * 4 * s]);
            p.curve(sn, { stroke: ln(1), w: 9 * s }); p.curve(sn, { stroke: col(1), w: 5 * s });
            [[10, 6, 2], [24, 5, 3], [17, 4.5, 4]].forEach(([dx, rr, i], j) => p.circ(cx + dx * s, -rr * s - (j === 2 ? 9 * s : 0), rr * s, { stroke: ln(i), w: 2, fill: 'paper', ...fillc(col(i), 0.8, 2.5) }));
            clayPot(p, cx + 44 * s, 0, 22 * s, 'pinch', 'wet', 'stripes', true, r);
          } else {
            p.ell(cx, -4 * s, 46 * s, 6 * s, { stroke: ln(2), w: 2, fill: 'paper', ...fillc(col(2), 0.7, 3) }); // rolled-out slab
            p.poly(CP.helpers.starPts(cx + 18 * s, -5 * s, 9 * s, 4 * s).map(([a, b]) => [a, -5 * s + (b + 5 * s) * 0.4]), { stroke: '#9e9e9e', w: 2 }); // cutter
            p.rect(cx - 36 * s, -19 * s, 50 * s, 12 * s, { stroke: WOOD, w: 2.5, fill: 'paper', ...fillc(WOODL, 0.8, 3, 90) }); // rolling pin
            for (const ex of [-36, 14]) p.rect(cx + (ex === -36 ? ex - 12 : ex) * s, -16 * s, 12 * s, 6 * s, { stroke: WOOD, w: 2.2, fill: 'paper', ...fillc(WOOD, 0.85, 3) });
          }
          x += widths[k] * s;
        }
      } },

    { type: 'prop', id: 'potterywheel', name: 'Pottery wheel', cat: 'Arts',
      colors: { line: '#5f6368', body: '#78909c' },
      params: [
        { key: 'clay', label: 'On the wheel', type: 'select', def: 'pot', options: { none: 'Nothing', lump: 'A lump of clay', pot: 'A pot', bowl: 'A bowl', vase: 'A vase' } },
        { key: 'spinning', label: 'Spinning', type: 'toggle', def: true },
      ],
      draw(p, P, it) {
        const r = U.rng(U.hash(it.id)), o = { stroke: 'line', w: 4 };
        p.poly([[-50, -52], [50, -52], [44, 0], [-44, 0]], { ...o, fill: 'paper', ...fillc('body', 0.45, 5) }); // base
        p.poly([[54, -6], [84, -6], [84, 0], [54, 0]], { stroke: 'line', w: 3, fill: 'line' }); // foot pedal
        p.poly([[-70, -66], [70, -66], [62, -50], [-62, -50]], { ...o, fill: 'paper' }); // splash tray
        p.ell(0, -66, 70, 9, { ...o, fill: 'paper', ...fillc('#a1887f', 0.35, 4) });
        p.rect(-6, -76, 12, 10, { stroke: 'line', w: 3, fill: 'paper' });
        p.ell(0, -78, 44, 7, { ...o, fill: 'paper', ...fillc('body', 0.7, 3) }); // wheel head
        if (P.clay === 'lump') clayLump(p, 0, -78, 1.2, '#a1887f', r);
        else if (P.clay && P.clay !== 'none') clayPot(p, 0, -78, P.clay === 'bowl' ? 60 : 52, P.clay, 'wet', 'stripes', true, r);
        if (P.spinning !== false) for (const s of [-1, 1]) { p.arc(0, -78, 60, 14, s > 0 ? 10 : 150, s > 0 ? 40 : 180, { stroke: '#9e9e9e', w: 2.2 }); p.arc(0, -78, 72, 18, s > 0 ? 15 : 150, s > 0 ? 35 : 170, { stroke: '#bdbdbd', w: 2 }); }
      } },

    { type: 'prop', id: 'brushjar', name: 'Brushes in a water jar', cat: 'Arts',
      colors: {},
      params: [
        { key: 'brushes', label: 'Brushes', type: 'range', min: 1, max: 6, step: 1, def: 3 },
        { key: 'water', label: 'Water', type: 'select', def: 'murky', options: { clean: 'Clean', murky: 'Muddy (used)', rainbow: 'Swirly colours' } },
        { key: 'size', label: 'Size', type: 'range', min: 0.6, max: 3, step: 0.1, def: 1.4 },
      ],
      draw(p, P, it) { brushJar(p, 0, 0, +P.size || 1.4, U.rng(U.hash(it.id)), +P.brushes || 3, P.water || 'murky'); } },

    { type: 'prop', id: 'glue', name: 'Glue + glitter', cat: 'Arts',
      colors: { glue: '#7e57c2', glitter: '#ec407a' },
      params: [
        { key: 'what', label: 'What', type: 'select', def: 'all', options: { stick: 'Glue stick', bottle: 'Glue bottle', glitter: 'Glitter shaker', all: 'All three' } },
        { key: 'spill', label: 'Glitter spilt', type: 'toggle', def: true, when: { what: ['glitter', 'all'] } },
        { key: 'size', label: 'Size', type: 'range', min: 0.6, max: 3, step: 0.1, def: 1.4 },
      ],
      draw(p, P, it) {
        const s = +P.size || 1.4, r = U.rng(U.hash(it.id)), what = P.what || 'all';
        const list = what === 'all' ? ['stick', 'bottle', 'glitter'] : [what];
        list.forEach((k, i) => {
          const x = (i - (list.length - 1) / 2) * 42 * s;
          if (k === 'stick') { p.rect(x - 7 * s, -34 * s, 14 * s, 34 * s, { stroke: 'glue', w: 2.5, fill: 'paper', ...fillc('glue', 0.6, 3) }); p.rect(x - 6 * s, -44 * s, 12 * s, 10 * s, { stroke: '#9e9e9e', w: 2, fill: 'paper' }); p.rect(x - 5 * s, -24 * s, 10 * s, 8 * s, { stroke: 'paper', w: 1, fill: 'paper' }); }
          else if (k === 'bottle') { p.poly([[x - 11 * s, 0], [x + 11 * s, 0], [x + 11 * s, -30 * s], [x + 6 * s, -36 * s], [x - 6 * s, -36 * s], [x - 11 * s, -30 * s]], { stroke: '#9e9e9e', w: 2.5, fill: 'paper' }); p.rect(x - 9 * s, -24 * s, 18 * s, 12 * s, { stroke: 'glue', w: 2, fill: 'glue' }); p.poly([[x - 5 * s, -36 * s], [x + 5 * s, -36 * s], [x + 2 * s, -46 * s], [x - 2 * s, -46 * s]], { stroke: '#ff7043', w: 2, fill: '#ff7043' }); }
          else {
            p.rect(x - 9 * s, -30 * s, 18 * s, 30 * s, { stroke: 'glitter', w: 2.5, fill: 'paper', ...fillc('glitter', 0.45, 3) });
            p.rect(x - 10 * s, -38 * s, 20 * s, 8 * s, { stroke: '#9e9e9e', w: 2, fill: 'paper' });
            for (let j = 0; j < 8; j++) p.circ(x - 6 * s + r() * 12 * s, -4 * s - r() * 22 * s, 1.2, { stroke: '#fbc02d', w: 1, fill: '#fbc02d' });
            if (P.spill !== false) for (let j = 0; j < 30; j++) { const c = j % 3 ? 'glitter' : '#fbc02d', gx = x + 14 * s + r() * 40 * s, gy = -r() * 6 * s; p.circ(gx, gy, 1.3, { stroke: c, w: 1, fill: c }); }
          }
        });
      } },

    { type: 'prop', id: 'splats', name: 'Paint splats', cat: 'Arts',
      colors: {},
      params: [
        { key: 'count', label: 'How many', type: 'range', min: 1, max: 14, step: 1, def: 5 },
        { key: 'size', label: 'Size', type: 'range', min: 10, max: 120, step: 2, def: 34 },
        { key: 'spread', label: 'Spread', type: 'range', min: 40, max: 600, step: 10, def: 220 },
        { key: 'flat', label: 'On the floor (squashed flat)', type: 'toggle', def: true },
        { key: 'one', label: 'All one colour', type: 'toggle', def: false },
        { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      draw(p, P, it) {
        const r = rngOf(it, P), n = +P.count || 5, S = +P.size || 34, sp = +P.spread || 220, sq = P.flat !== false ? 0.4 : 1, c0 = PAL[Math.floor(r() * 8)];
        for (let i = 0; i < n; i++) {
          const c = P.one ? c0 : PAL[(i * 3 + Math.floor(r() * 2)) % 8], s = S * (0.5 + r() * 0.6);
          const cx = n === 1 ? 0 : U.lerp(-sp / 2, sp / 2, (i + 0.2 + r() * 0.6) / n), cy = (r() - 0.5) * sp * 0.3 * sq;
          p.poly(CP.helpers.bumpy(cx, cy, s * 0.6, s * 0.6 * sq, 4 + Math.floor(r() * 4), 0.35, 50), { stroke: c, w: 2, fill: c, smooth: true, op: 0.85 });
          for (let j = 0; j < 4; j++) { const a = r() * Math.PI * 2, d = s * (0.85 + r() * 0.5); p.circ(cx + Math.cos(a) * d, cy + Math.sin(a) * d * sq, Math.max(1.5, s * 0.07 * (0.5 + r())), { stroke: c, w: 1.5, fill: c }); }
        }
      } },

    { type: 'prop', id: 'artline', name: 'Artwork pegged on a line', cat: 'Arts',
      colors: { line: '#8d6e63', peg: '#fbc02d' },
      params: [
        { key: 'width', label: 'Length', type: 'range', min: 240, max: 960, step: 10, def: 600 },
        { key: 'count', label: 'How many pictures', type: 'range', min: 1, max: 6, step: 1, def: 4 },
        { key: 'sag', label: 'Sag', type: 'range', min: 0, max: 60, step: 2, def: 18 },
        { key: 'size', label: 'Picture size', type: 'range', min: 60, max: 200, step: 5, def: 100 },
      ],
      slots: [
        { key: 'art1', label: 'Picture 1', kind: 'picture', def: 'picplant', box: [-50, 0, 100, 72] },
        { key: 'art2', label: 'Picture 2', kind: 'picture', def: 'picstamps', box: [-50, 0, 100, 72] },
        { key: 'art3', label: 'Picture 3', kind: 'picture', def: 'piccat', box: [-50, 0, 100, 72] },
      ],
      draw(p, P, it, x) {
        const W = +P.width || 600, n = +P.count || 4, sag = +P.sag || 0, pw = +P.size || 100, ph = pw * 0.75, r = U.rng(U.hash(it.id));
        const yAt = (xx) => sag * (1 - Math.pow(2 * xx / W, 2));
        const pts = []; for (let i = 0; i <= 16; i++) { const xx = -W / 2 + i * W / 16; pts.push([xx, yAt(xx)]); }
        p.curve(pts, { stroke: 'line', w: 2.5 });
        for (const s of [-1, 1]) p.circ(s * W / 2, 0, 4, { stroke: 'line', w: 2.5, fill: 'paper' });
        const extra = ['scribble', 'picrocket', 'rainbow'];
        for (let i = 0; i < n; i++) {
          const cx = U.lerp(-W / 2, W / 2, (i + 0.5) / n), top = yAt(cx) + 3, n0 = p.o.length;
          p.rect(cx - pw / 2, top, pw, ph, { stroke: '#9a9a9a', w: 2.5, fill: 'paper' });
          const box = [cx - pw / 2 + pw * 0.07, top + pw * 0.06, pw * 0.86, ph - pw * 0.12];
          if (i < 3) x.slot('art' + (i + 1), box);
          else { const ad = CP.addons[extra[(i - 3) % 3]]; if (ad) ad.draw(p, { x: box[0], y: box[1], w: box[2], h: box[3], cx: box[0] + box[2] / 2, cy: box[1] + box[3] / 2 }, { seed: it.id + i, rng: U.rng(U.hash(it.id + i)), params: {} }); }
          const a = U.rad((r() - 0.5) * 10), co = Math.cos(a), si = Math.sin(a), px = cx, py = top; // swing a little from the peg
          for (const pr of p.o.slice(n0)) pr.pts = pr.pts.map(([qx, qy]) => [px + (qx - px) * co - (qy - py) * si, py + (qx - px) * si + (qy - py) * co]);
          p.rect(cx - 4, top - 10, 8, 18, { stroke: 'peg', w: 2, fill: 'peg' });
        }
      } },
  ] });
})();
