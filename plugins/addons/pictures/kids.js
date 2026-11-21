// Picture add-ons: the kind of drawings a 6–7 year old (Year 1–2) makes — plant, pets, butterfly, fish, car, rocket,
// boat, snowman, ice cream, balloons, rain, "me", dinosaur, shapes, ABC 123 — plus "Lots of little drawings" (several on one sheet).
// Fit any prop with a "picture" slot (easel, frame, paper, the drawing sheet on the floor…).
// Each drawing uses a square in the middle of the box (u, v = 0..1, y down); ground / sea lines run the full width.
(() => {
  const PAL = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
  const GREEN = '#43a047', DKGREEN = '#2e7d32', BROWN = '#8a5a2b', YEL = '#fbc02d', ORANGE = '#fb8c00', RED = '#e53935',
    BLUE = '#1e88e5', SKY = '#64b5f6', PINK = '#ec407a', PURPLE = '#8e24aa', BLACK = '#424242', SKIN = '#8d6e63';
  const fillc = (c, a = 0.8, g = 3, ha) => ({ hatch: c, hg: g, halpha: a, ...(ha != null ? { ha } : {}) }); // coloured in with crayon

  function frame(b, pad = 0.04) {
    const s = Math.min(b.w, b.h) * (1 - 2 * pad);
    const x0 = b.x + (b.w - s) / 2, y0 = b.y + (b.h - s) / 2;
    const P = (u, v) => [x0 + u * s, y0 + v * s];
    return { s, P, Px: (pts) => pts.map(([u, v]) => P(u, v)), w: Math.max(1.8, Math.min(4, s * 0.022)), b };
  }
  // full-width line at height v (ground, sea)
  const across = (m, v, n, f) => { const y = m.P(0, v)[1], x0 = m.b.x + m.b.w * 0.03, x1 = m.b.x + m.b.w * 0.97; const pts = []; for (let i = 0; i <= n; i++) pts.push([U.lerp(x0, x1, i / n), y + f(i)]); return pts; };

  function grass(pen, m, v, r) {
    pen.line(across(m, v, 1, () => 0), { stroke: GREEN, w: m.w });
    const y = m.P(0, v)[1], x0 = m.b.x + m.b.w * 0.05, x1 = m.b.x + m.b.w * 0.95, n = Math.max(4, Math.round((x1 - x0) / (m.s * 0.07)));
    for (let i = 0; i < n; i++) { const gx = U.lerp(x0, x1, (i + 0.5) / n); pen.line([[gx - m.s * 0.014, y], [gx, y - m.s * (0.03 + r() * 0.03)], [gx + m.s * 0.014, y]], { stroke: GREEN, w: m.w * 0.7 }); }
  }
  function sea(pen, m, v, r) {
    const amp = m.s * 0.02, B = m.b, y = m.P(0, v)[1];
    pen.rect(B.x + B.w * 0.03, y, B.w * 0.94, B.y + B.h * 0.97 - y, { stroke: false, ...fillc(SKY, 0.4, 4.5) });
    pen.curve(across(m, v, Math.max(6, Math.round(B.w / (m.s * 0.08))), (i) => (i % 2 ? -amp : amp) * (0.7 + r() * 0.5)), { stroke: BLUE, w: m.w });
  }
  function sun(pen, m, u, v, rr, face = true) {
    const [cx, cy] = m.P(u, v), R = m.s * rr;
    pen.circ(cx, cy, R, { stroke: ORANGE, w: m.w, fill: 'paper', ...fillc(YEL, 0.9) });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pen.line([[cx + Math.cos(a) * R * 1.3, cy + Math.sin(a) * R * 1.3], [cx + Math.cos(a) * R * 1.8, cy + Math.sin(a) * R * 1.8]], { stroke: YEL, w: m.w }); }
    if (face) {
      for (const s of [-1, 1]) pen.circ(cx + s * R * 0.35, cy - R * 0.18, Math.max(1, R * 0.1), { stroke: ORANGE, w: 1.5, fill: ORANGE });
      pen.arc(cx, cy + R * 0.05, R * 0.45, R * 0.4, 25, 155, { stroke: ORANGE, w: m.w * 0.7 });
    }
  }
  function cloud(pen, m, u, v, rx, ry) { const [cx, cy] = m.P(u, v); pen.poly(CP.helpers.bumpy(cx, cy, m.s * rx, m.s * ry, 6, 0.22), { stroke: '#78909c', w: m.w, fill: 'paper', smooth: true, ...fillc('#b0bec5', 0.45) }); }
  function leaf(pen, [x, y], ang, len, wid, c, w) {
    const a = U.rad(ang), dx = Math.cos(a), dy = Math.sin(a);
    const Q = (t, k) => [x + dx * len * t - dy * wid * k, y + dy * len * t + dx * wid * k];
    pen.poly([Q(0, 0), Q(0.45, 1), Q(1, 0), Q(0.45, -1)], { stroke: c, w, smooth: true, fill: 'paper', ...fillc(c, 0.75) });
    pen.line([Q(0.08, 0), Q(0.85, 0)], { stroke: DKGREEN, w: w * 0.55 });
  }
  function flowerHead(pen, cx, cy, pr, c, w, n = 6) {
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pen.circ(cx + Math.cos(a) * pr * 1.4, cy + Math.sin(a) * pr * 1.4, pr, { stroke: c, w, fill: 'paper', ...fillc(c, 0.7) }); }
    pen.circ(cx, cy, pr * 0.95, { stroke: ORANGE, w, fill: 'paper', ...fillc(YEL, 0.9) });
  }
  function pot(pen, m, cu, v0, pw, ph) {
    const c = '#c8693a';
    pen.poly(m.Px([[cu - pw / 2, v0 + ph * 0.18], [cu + pw / 2, v0 + ph * 0.18], [cu + pw * 0.38, v0 + ph], [cu - pw * 0.38, v0 + ph]]), { stroke: c, w: m.w, fill: 'paper', ...fillc(c, 0.7) });
    pen.poly(m.Px([[cu - pw * 0.56, v0], [cu + pw * 0.56, v0], [cu + pw * 0.56, v0 + ph * 0.2], [cu - pw * 0.56, v0 + ph * 0.2]]), { stroke: c, w: m.w, fill: 'paper', ...fillc(c, 0.9) });
  }
  const eye = (pen, x, y, r) => pen.circ(x, y, Math.max(1.2, r), { stroke: BLACK, w: 1.5, fill: BLACK });

  // ---------------------------------------------------------------- the drawings
  function plant(pen, b, r, P) {
    const m = frame(b), L = m.s, w = m.w, style = P.style || 'pot';
    if (style === 'flower') {
      sun(pen, m, 0.14, 0.14, 0.07);
      grass(pen, m, 0.92, r);
      pen.curve(m.Px([[0.5, 0.92], [0.47, 0.65], [0.5, 0.36]]), { stroke: DKGREEN, w: w * 1.2 });
      leaf(pen, m.P(0.49, 0.76), -150, L * 0.2, L * 0.06, GREEN, w);
      leaf(pen, m.P(0.48, 0.62), -30, L * 0.2, L * 0.06, GREEN, w);
      flowerHead(pen, ...m.P(0.5, 0.28), L * 0.07, PINK, w);
      for (const [u, c] of [[0.17, PURPLE], [0.83, RED]]) { pen.line(m.Px([[u, 0.92], [u, 0.75]]), { stroke: DKGREEN, w }); flowerHead(pen, ...m.P(u, 0.72), L * 0.03, c, w * 0.8, 5); }
      return;
    }
    if (style === 'cactus') {
      sun(pen, m, 0.85, 0.14, 0.07);
      pot(pen, m, 0.5, 0.68, 0.36, 0.28);
      const o = { stroke: DKGREEN, w, smooth: true, fill: 'paper', ...fillc(GREEN, 0.75) };
      pen.poly(m.Px([[0.43, 0.52], [0.31, 0.52], [0.27, 0.46], [0.27, 0.33], [0.3, 0.3], [0.33, 0.33], [0.34, 0.45], [0.43, 0.45]]), o);
      pen.poly(m.Px([[0.57, 0.43], [0.65, 0.43], [0.66, 0.28], [0.69, 0.25], [0.72, 0.28], [0.72, 0.45], [0.68, 0.5], [0.57, 0.5]]), o);
      pen.poly(m.Px([[0.42, 0.68], [0.41, 0.3], [0.44, 0.2], [0.5, 0.17], [0.56, 0.2], [0.59, 0.3], [0.58, 0.68]]), o);
      for (let i = 0; i < 10; i++) { const u = 0.44 + r() * 0.12, v = 0.25 + r() * 0.38; pen.line(m.Px([[u, v], [u + 0.018, v - 0.018]]), { stroke: BLACK, w: 1.3 }); }
      flowerHead(pen, ...m.P(0.5, 0.15), L * 0.025, PINK, w * 0.7, 5);
      return;
    }
    if (style === 'sprout') { // the class science experiment: a bean growing in a clear cup
      sun(pen, m, 0.84, 0.15, 0.07);
      pen.poly(m.Px([[0.335, 0.62], [0.665, 0.62], [0.635, 0.92], [0.365, 0.92]]), { stroke: false, ...fillc(BROWN, 0.85) });
      pen.ell(...m.P(0.45, 0.8), L * 0.04, L * 0.025, { stroke: '#6d4c41', w: w * 0.7, fill: '#d7ccc8' });
      pen.curve(m.Px([[0.45, 0.82], [0.43, 0.87], [0.45, 0.9]]), { stroke: '#d7ccc8', w: w * 0.6 });
      pen.poly(m.Px([[0.3, 0.52], [0.7, 0.52], [0.64, 0.93], [0.36, 0.93]]), { stroke: '#90a4ae', w });
      pen.curve(m.Px([[0.46, 0.78], [0.5, 0.6], [0.49, 0.48], [0.5, 0.38]]), { stroke: DKGREEN, w: w * 1.1 });
      leaf(pen, m.P(0.5, 0.39), -155, L * 0.14, L * 0.065, GREEN, w);
      leaf(pen, m.P(0.5, 0.39), -25, L * 0.14, L * 0.065, GREEN, w);
      return;
    }
    // pot plant
    pot(pen, m, 0.5, 0.66, 0.4, 0.3);
    pen.curve(m.Px([[0.5, 0.67], [0.52, 0.45], [0.5, 0.2]]), { stroke: DKGREEN, w: w * 1.2 });
    [[0.6, -150], [0.6, -30], [0.47, -155], [0.47, -25], [0.34, -145], [0.34, -35]].forEach(([v, ang], i) => leaf(pen, m.P(0.5, v), ang, L * (0.21 - i * 0.015), L * 0.06, i % 2 ? GREEN : '#66bb6a', w));
    leaf(pen, m.P(0.5, 0.22), -90, L * 0.12, L * 0.045, GREEN, w);
  }

  function cat(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, c = ORANGE;
    grass(pen, m, 0.93, r);
    pen.curve(m.Px([[0.64, 0.86], [0.8, 0.83], [0.85, 0.67], [0.78, 0.55]]), { stroke: c, w: w * 1.8 });
    pen.ell(...m.P(0.5, 0.7), L * 0.19, L * 0.22, { stroke: c, w, fill: 'paper', ...fillc(c, 0.6) });
    for (const u of [0.42, 0.58]) pen.ell(...m.P(u, 0.9), L * 0.055, L * 0.03, { stroke: c, w, fill: 'paper' });
    const [hx, hy] = m.P(0.5, 0.37), hr = L * 0.15;
    for (const s of [-1, 1]) pen.poly([[hx + s * hr * 0.92, hy - hr * 0.35], [hx + s * hr * 0.75, hy - hr * 1.35], [hx + s * hr * 0.2, hy - hr * 0.9]], { stroke: c, w, fill: 'paper', ...fillc(c, 0.8) });
    pen.circ(hx, hy, hr, { stroke: c, w, fill: 'paper', ...fillc(c, 0.55) });
    for (const s of [-1, 1]) eye(pen, hx + s * hr * 0.38, hy - hr * 0.1, hr * 0.12);
    pen.poly([[hx - hr * 0.11, hy + hr * 0.16], [hx + hr * 0.11, hy + hr * 0.16], [hx, hy + hr * 0.3]], { stroke: PINK, w: 2, fill: PINK });
    pen.line([[hx - hr * 0.22, hy + hr * 0.5], [hx, hy + hr * 0.32], [hx + hr * 0.22, hy + hr * 0.5]], { stroke: BLACK, w: w * 0.6 });
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) pen.line([[hx + s * hr * 0.28, hy + hr * 0.3], [hx + s * hr * 1.3, hy + hr * (0.22 + k * 0.2)]], { stroke: BLACK, w: w * 0.45 });
  }

  function dog(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, c = SKIN, dk = '#5d4037';
    grass(pen, m, 0.88, r);
    for (const u of [0.31, 0.39, 0.59, 0.67]) pen.line(m.Px([[u, 0.6], [u, 0.86]]), { stroke: c, w: w * 1.7 });
    pen.curve(m.Px([[0.25, 0.52], [0.16, 0.43], [0.15, 0.3]]), { stroke: c, w: w * 1.4 });
    pen.ell(...m.P(0.48, 0.56), L * 0.25, L * 0.12, { stroke: c, w, fill: 'paper', ...fillc(c, 0.55) });
    pen.circ(...m.P(0.4, 0.54), L * 0.05, { stroke: dk, w: w * 0.7, ...fillc(dk, 0.85) });
    const [hx, hy] = m.P(0.76, 0.38), hr = L * 0.12;
    pen.circ(hx, hy, hr, { stroke: c, w, fill: 'paper', ...fillc(c, 0.55) });
    pen.ell(hx + hr * 0.85, hy + hr * 0.3, hr * 0.48, hr * 0.33, { stroke: c, w, fill: 'paper' });
    pen.ell(hx + hr * 0.85, hy + hr * 0.75, hr * 0.13, hr * 0.2, { stroke: PINK, w: 2, fill: PINK });
    pen.circ(hx + hr * 1.28, hy + hr * 0.2, hr * 0.14, { stroke: BLACK, w: 2, fill: BLACK });
    pen.ell(hx - hr * 0.35, hy + hr * 0.25, hr * 0.3, hr * 0.62, { stroke: dk, w, fill: 'paper', ...fillc(dk, 0.85) });
    eye(pen, hx + hr * 0.25, hy - hr * 0.22, hr * 0.12);
    pen.circ(...m.P(0.9, 0.81), L * 0.05, { stroke: RED, w, fill: 'paper', ...fillc(RED, 0.8) }); // ball
  }

  function butterfly(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w; const [cx, cy] = m.P(0.5, 0.45);
    const i = Math.floor(r() * 8), c1 = PAL[i], c2 = PAL[(i + 3) % 8];
    grass(pen, m, 0.94, r);
    for (const [u, c] of [[0.15, RED], [0.86, PURPLE]]) { pen.line(m.Px([[u, 0.94], [u, 0.8]]), { stroke: DKGREEN, w }); flowerHead(pen, ...m.P(u, 0.77), L * 0.025, c, w * 0.8, 5); }
    for (const s of [-1, 1]) {
      pen.ell(cx + s * L * 0.17, cy - L * 0.1, L * 0.16, L * 0.14, { stroke: c1, w, fill: 'paper', ...fillc(c1, 0.7) });
      pen.ell(cx + s * L * 0.13, cy + L * 0.12, L * 0.11, L * 0.1, { stroke: c2, w, fill: 'paper', ...fillc(c2, 0.7) });
      pen.circ(cx + s * L * 0.19, cy - L * 0.12, L * 0.045, { stroke: c2, w, fill: c2 });
      pen.circ(cx + s * L * 0.13, cy + L * 0.13, L * 0.03, { stroke: c1, w, fill: c1 });
      pen.curve([[cx + s * L * 0.01, cy - L * 0.24], [cx + s * L * 0.05, cy - L * 0.33], [cx + s * L * 0.1, cy - L * 0.36]], { stroke: BLACK, w: w * 0.7 });
      pen.circ(cx + s * L * 0.1, cy - L * 0.36, L * 0.015, { stroke: BLACK, w: 1.5, fill: BLACK });
    }
    pen.ell(cx, cy, L * 0.03, L * 0.19, { stroke: BLACK, w, fill: BLACK });
    pen.circ(cx, cy - L * 0.22, L * 0.04, { stroke: BLACK, w, fill: BLACK });
  }

  function fishShape(pen, cx, cy, rx, ry, c, w, dir = 1, stripes = true) {
    pen.poly([[cx - dir * rx * 0.8, cy], [cx - dir * rx * 1.55, cy - ry * 0.95], [cx - dir * rx * 1.55, cy + ry * 0.95]], { stroke: c, w, fill: 'paper', ...fillc(c, 0.8) });
    pen.poly([[cx - dir * rx * 0.3, cy - ry * 0.85], [cx + dir * rx * 0.05, cy - ry * 1.55], [cx + dir * rx * 0.35, cy - ry * 0.85]], { stroke: c, w, fill: 'paper', ...fillc(c, 0.8) });
    pen.ell(cx, cy, rx, ry, { stroke: c, w, fill: 'paper', ...fillc(c, 0.55) });
    if (stripes) for (const k of [-0.3, 0.05]) pen.curve([[cx + dir * rx * k, cy - ry * 0.85], [cx + dir * rx * (k - 0.06), cy], [cx + dir * rx * k, cy + ry * 0.85]], { stroke: RED, w: w * 0.8 });
    eye(pen, cx + dir * rx * 0.55, cy - ry * 0.2, ry * 0.15);
    pen.arc(cx + dir * rx * 0.68, cy + ry * 0.25, rx * 0.15, ry * 0.15, 20, 160, { stroke: BLACK, w: w * 0.5 });
  }
  function fish(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w;
    sea(pen, m, 0.16, r);
    for (const u of [0.1, 0.84, 0.92]) pen.curve(m.Px([[u, 0.97], [u + 0.03, 0.86], [u - 0.02, 0.76], [u + 0.02, 0.66]]), { stroke: GREEN, w: w * 1.2 });
    fishShape(pen, ...m.P(0.45, 0.52), L * 0.19, L * 0.12, ORANGE, w);
    fishShape(pen, ...m.P(0.72, 0.8), L * 0.08, L * 0.05, PURPLE, w * 0.8, -1, false);
    [[0.67, 0.45, 0.015], [0.7, 0.37, 0.02], [0.74, 0.28, 0.026]].forEach(([u, v, rr]) => pen.circ(...m.P(u, v), L * rr, { stroke: BLUE, w: w * 0.7, fill: 'paper' }));
  }

  function car(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, c = PAL[[0, 4, 3, 5][Math.floor(r() * 4)]];
    sun(pen, m, 0.85, 0.14, 0.07);
    pen.line(across(m, 0.79, 1, () => 0), { stroke: '#757575', w: w * 1.2 });
    pen.poly(m.Px([[0.29, 0.5], [0.36, 0.31], [0.64, 0.31], [0.73, 0.5]]), { stroke: c, w, fill: 'paper', ...fillc(c, 0.5) });
    for (const q of [[[0.34, 0.49], [0.39, 0.35], [0.49, 0.35], [0.49, 0.49]], [[0.52, 0.49], [0.52, 0.35], [0.62, 0.35], [0.68, 0.49]]]) pen.poly(m.Px(q), { stroke: BLUE, w: w * 0.8, fill: 'paper', ...fillc(SKY, 0.45) });
    pen.poly(m.Px([[0.12, 0.5], [0.88, 0.5], [0.9, 0.68], [0.1, 0.68]]), { stroke: c, w, fill: 'paper', ...fillc(c, 0.85) });
    pen.circ(...m.P(0.86, 0.56), L * 0.022, { stroke: ORANGE, w: 1.5, fill: YEL });
    for (const u of [0.3, 0.7]) { pen.circ(...m.P(u, 0.7), L * 0.085, { stroke: BLACK, w, fill: 'paper', ...fillc(BLACK, 0.9) }); pen.circ(...m.P(u, 0.7), L * 0.03, { stroke: '#9e9e9e', w: w * 0.7, fill: 'paper' }); }
  }

  function rocket(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, star = CP.helpers.starPts;
    for (let i = 0; i < 7; i++) { const u = i % 2 ? 0.05 + r() * 0.25 : 0.7 + r() * 0.25, v = 0.06 + r() * 0.6; pen.poly(star(...m.P(u, v), L * 0.035, L * 0.015), { stroke: YEL, w: 1.5, fill: YEL }); }
    pen.circ(...m.P(0.17, 0.8), L * 0.08, { stroke: PURPLE, w, fill: 'paper', ...fillc(PURPLE, 0.7) });
    pen.ell(...m.P(0.17, 0.8), L * 0.14, L * 0.03, { stroke: ORANGE, w });
    pen.poly(m.Px([[0.42, 0.72], [0.5, 0.96], [0.58, 0.72]]), { stroke: ORANGE, w, fill: 'paper', ...fillc(YEL, 0.85) });
    pen.poly(m.Px([[0.46, 0.72], [0.5, 0.86], [0.54, 0.72]]), { stroke: RED, w: w * 0.8, fill: 'paper', ...fillc(RED, 0.85) });
    for (const s of [-1, 1]) pen.poly(m.Px([[0.5 + s * 0.1, 0.52], [0.5 + s * 0.2, 0.74], [0.5 + s * 0.1, 0.72]]), { stroke: RED, w, fill: 'paper', ...fillc(RED, 0.8) });
    pen.poly(m.Px([[0.42, 0.22], [0.58, 0.22], [0.6, 0.35], [0.6, 0.72], [0.4, 0.72], [0.4, 0.35]]), { stroke: BLUE, w, fill: 'paper', ...fillc('#90a4ae', 0.4) });
    pen.poly(m.Px([[0.5, 0.07], [0.58, 0.22], [0.42, 0.22]]), { stroke: RED, w, fill: 'paper', ...fillc(RED, 0.85) });
    pen.circ(...m.P(0.5, 0.38), L * 0.06, { stroke: BLUE, w, fill: 'paper', ...fillc(SKY, 0.6) });
  }

  function boat(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w;
    sun(pen, m, 0.15, 0.15, 0.07);
    for (const [u, v] of [[0.66, 0.16], [0.8, 0.24]]) { const [x, y] = m.P(u, v), s = L * 0.035; for (const k of [-1, 1]) pen.arc(x + k * s, y, s, s * 0.7, 200, 340, { stroke: BLACK, w: w * 0.7 }); }
    pen.poly(m.Px([[0.5, 0.2], [0.5, 0.6], [0.76, 0.6]]), { stroke: ORANGE, w, fill: 'paper', ...fillc(YEL, 0.8) });
    pen.poly(m.Px([[0.48, 0.28], [0.48, 0.6], [0.3, 0.6]]), { stroke: RED, w, fill: 'paper', ...fillc(RED, 0.7) });
    pen.line(m.Px([[0.49, 0.14], [0.49, 0.65]]), { stroke: BROWN, w: w * 1.1 });
    pen.poly(m.Px([[0.49, 0.14], [0.58, 0.17], [0.49, 0.2]]), { stroke: BLUE, w: w * 0.8, fill: BLUE });
    pen.poly(m.Px([[0.2, 0.64], [0.82, 0.64], [0.71, 0.77], [0.3, 0.77]]), { stroke: BROWN, w, fill: 'paper', ...fillc(BROWN, 0.85) });
    sea(pen, m, 0.74, r);
  }

  function snowman(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w;
    for (let i = 0; i < 16; i++) pen.circ(...m.P(0.04 + r() * 0.92, 0.04 + r() * 0.82), L * 0.012, { stroke: SKY, w: 1.5, fill: SKY });
    pen.curve(across(m, 0.9, 4, (i) => (i % 2 ? -1 : 1) * L * 0.015), { stroke: SKY, w });
    pen.circ(...m.P(0.5, 0.68), L * 0.2, { stroke: SKY, w, fill: 'paper' });
    pen.circ(...m.P(0.5, 0.34), L * 0.13, { stroke: SKY, w, fill: 'paper' });
    pen.rect(...m.P(0.35, 0.19), L * 0.3, L * 0.035, { stroke: BLACK, w, fill: BLACK });
    pen.rect(...m.P(0.41, 0.05), L * 0.18, L * 0.15, { stroke: BLACK, w, fill: 'paper', ...fillc(BLACK, 0.9) });
    for (const u of [0.45, 0.55]) eye(pen, ...m.P(u, 0.31), L * 0.015);
    pen.poly(m.Px([[0.5, 0.34], [0.61, 0.365], [0.5, 0.385]]), { stroke: ORANGE, w: w * 0.8, fill: ORANGE });
    for (let i = 0; i < 5; i++) { const a = U.rad(30 + i * 30); pen.circ(...m.P(0.5 + Math.cos(a) * 0.07, 0.37 + Math.sin(a) * 0.04), L * 0.008, { stroke: BLACK, w: 1.2, fill: BLACK }); }
    pen.poly(m.Px([[0.39, 0.45], [0.61, 0.45], [0.61, 0.5], [0.39, 0.5]]), { stroke: RED, w, fill: 'paper', ...fillc(RED, 0.85) });
    pen.poly(m.Px([[0.55, 0.49], [0.6, 0.49], [0.63, 0.61], [0.58, 0.61]]), { stroke: RED, w, fill: 'paper', ...fillc(RED, 0.85) });
    for (const v of [0.6, 0.68, 0.76]) eye(pen, ...m.P(0.5, v), L * 0.016);
    for (const s of [-1, 1]) { pen.line(m.Px([[0.5 + s * 0.17, 0.6], [0.5 + s * 0.33, 0.47]]), { stroke: BROWN, w }); pen.line(m.Px([[0.5 + s * 0.28, 0.51], [0.5 + s * 0.31, 0.56]]), { stroke: BROWN, w: w * 0.8 }); }
  }

  function icecream(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, tan = '#c68642';
    const A = [0.36, 0.5], B2 = [0.64, 0.5], T = [0.5, 0.93];
    pen.poly(m.Px([A, B2, T]), { stroke: tan, w, fill: 'paper', ...fillc('#e0a96d', 0.6) });
    const Le = (t) => [U.lerp(A[0], T[0], t), U.lerp(A[1], T[1], t)], Ri = (t) => [U.lerp(B2[0], T[0], t), U.lerp(B2[1], T[1], t)];
    for (const t of [0.3, 0.55, 0.8]) { pen.line(m.Px([Le(t), Ri(Math.max(0, t - 0.35))]), { stroke: tan, w: w * 0.6 }); pen.line(m.Px([Ri(t), Le(Math.max(0, t - 0.35))]), { stroke: tan, w: w * 0.6 }); }
    pen.circ(...m.P(0.5, 0.42), L * 0.15, { stroke: PINK, w, fill: 'paper', ...fillc(PINK, 0.75) });
    pen.circ(...m.P(0.5, 0.24), L * 0.13, { stroke: '#6d4c41', w, fill: 'paper', ...fillc(SKIN, 0.8) });
    pen.curve(m.Px([[0.5, 0.09], [0.53, 0.05], [0.57, 0.04]]), { stroke: DKGREEN, w: w * 0.7 });
    pen.circ(...m.P(0.5, 0.09), L * 0.04, { stroke: RED, w, fill: RED });
    for (let i = 0; i < 10; i++) { const u = 0.4 + r() * 0.2, v = 0.2 + r() * 0.28, a = r() * Math.PI; pen.line(m.Px([[u, v], [u + Math.cos(a) * 0.025, v + Math.sin(a) * 0.025]]), { stroke: PAL[i % 8], w: w * 0.8 }); }
  }

  function balloons(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, tie = m.P(0.5, 0.93);
    const B = [[0.3, 0.34], [0.5, 0.2], [0.7, 0.34], [0.5, 0.5]];
    const off = Math.floor(r() * 8);
    B.forEach(([u, v]) => { const [x, y] = m.P(u, v + 0.12); pen.curve([[x, y], [U.lerp(x, tie[0], 0.5) + L * 0.03, U.lerp(y, tie[1], 0.5)], tie], { stroke: BLACK, w: w * 0.5 }); });
    B.forEach(([u, v], i) => {
      const c = PAL[(off + i * 2) % 8], [x, y] = m.P(u, v);
      pen.ell(x, y, L * 0.09, L * 0.11, { stroke: c, w, fill: 'paper', ...fillc(c, 0.75) });
      pen.poly([[x, y + L * 0.11], [x - L * 0.015, y + L * 0.13], [x + L * 0.015, y + L * 0.13]], { stroke: c, w: w * 0.7, fill: c });
    });
    for (const s of [-1, 1]) pen.poly([tie, [tie[0] + s * L * 0.05, tie[1] - L * 0.025], [tie[0] + s * L * 0.05, tie[1] + L * 0.025]], { stroke: RED, w: w * 0.7, fill: RED });
  }

  function rain(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w;
    cloud(pen, m, 0.5, 0.24, 0.27, 0.12);
    for (let i = 0; i < 12; i++) {
      const [x, y] = m.P(0.27 + (i % 6) * 0.09 + r() * 0.03, 0.47 + Math.floor(i / 6) * 0.16 + r() * 0.05), s = L * 0.02;
      pen.poly([[x, y - s * 1.9], [x + s, y], [x, y + s], [x - s, y]], { stroke: BLUE, w: w * 0.7, smooth: true, fill: SKY });
    }
    pen.ell(...m.P(0.5, 0.9), L * 0.32, L * 0.05, { stroke: BLUE, w, fill: 'paper', ...fillc(SKY, 0.6) });
  }

  function me(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, line = '#6d4c41', c = PAL[[5, 6, 0, 4][Math.floor(r() * 4)]];
    sun(pen, m, 0.85, 0.14, 0.075);
    cloud(pen, m, 0.18, 0.14, 0.12, 0.05);
    grass(pen, m, 0.92, r);
    const [hx, hy] = m.P(0.5, 0.29), hr = L * 0.12;
    for (let i = 0; i < 9; i++) { const a = U.rad(U.lerp(195, 345, i / 8)); pen.line([[hx + Math.cos(a) * hr * 0.9, hy + Math.sin(a) * hr * 0.9], [hx + Math.cos(a) * hr * 1.4, hy + Math.sin(a) * hr * (1.3 + r() * 0.2)]], { stroke: BROWN, w }); }
    pen.circ(hx, hy, hr, { stroke: line, w, fill: 'paper' });
    for (const s of [-1, 1]) { eye(pen, hx + s * hr * 0.38, hy - hr * 0.15, hr * 0.1); pen.circ(hx + s * hr * 0.6, hy + hr * 0.25, hr * 0.13, { stroke: false, ...fillc(PINK, 0.6, 2) }); }
    pen.arc(hx, hy + hr * 0.1, hr * 0.5, hr * 0.45, 20, 160, { stroke: RED, w: w * 0.8 });
    pen.poly(m.Px([[0.5, 0.41], [0.36, 0.72], [0.64, 0.72]]), { stroke: c, w, fill: 'paper', ...fillc(c, 0.75) });
    for (const s of [-1, 1]) {
      const [ex, ey] = m.P(0.5 + s * 0.25, 0.42);
      pen.line(m.Px([[0.5 + s * 0.05, 0.5], [0.5 + s * 0.25, 0.42]]), { stroke: line, w });
      for (const k of [-1, 0, 1]) pen.line([[ex, ey], [ex + s * L * 0.035 * Math.cos(U.rad(k * 40 - 20)), ey + L * 0.035 * Math.sin(U.rad(k * 40 - 20))]], { stroke: line, w: w * 0.7 });
      pen.line(m.Px([[0.5 + s * 0.05, 0.72], [0.5 + s * 0.06, 0.9], [0.5 + s * 0.11, 0.9]]), { stroke: line, w });
    }
  }

  function dino(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w;
    sun(pen, m, 0.14, 0.14, 0.065);
    grass(pen, m, 0.9, r);
    for (const u of [0.35, 0.44, 0.6, 0.68]) pen.line(m.Px([[u, 0.62], [u, 0.89]]), { stroke: DKGREEN, w: w * 3 });
    for (let i = 0; i < 5; i++) { const u = 0.3 + i * 0.075, v = 0.5 - Math.sin((i + 0.5) / 5 * Math.PI) * 0.055; pen.poly(m.Px([[u - 0.03, v + 0.02], [u, v - 0.06], [u + 0.03, v + 0.02]]), { stroke: ORANGE, w: w * 0.8, fill: 'paper', ...fillc(ORANGE, 0.85) }); }
    pen.poly(m.Px([[0.05, 0.71], [0.2, 0.62], [0.35, 0.48], [0.52, 0.44], [0.66, 0.47], [0.72, 0.3], [0.78, 0.17], [0.88, 0.15], [0.91, 0.21], [0.83, 0.25], [0.79, 0.35], [0.76, 0.53], [0.68, 0.66], [0.5, 0.69], [0.33, 0.67], [0.2, 0.67]]), { stroke: DKGREEN, w, smooth: true, fill: 'paper', ...fillc(GREEN, 0.7) });
    eye(pen, ...m.P(0.85, 0.185), L * 0.015);
    pen.arc(...m.P(0.87, 0.21), L * 0.025, L * 0.012, 20, 160, { stroke: BLACK, w: w * 0.6 });
    for (const [u, v] of [[0.45, 0.55], [0.56, 0.58], [0.36, 0.6]]) pen.circ(...m.P(u, v), L * 0.025, { stroke: DKGREEN, w: w * 0.7, fill: DKGREEN });
  }

  function shapes(pen, b, r) {
    const m = frame(b), L = m.s, w = m.w, ha = () => -70 + r() * 140;
    pen.circ(...m.P(0.28, 0.29), L * 0.15, { stroke: RED, w, ...fillc(RED, 0.8, 3, ha()) });
    pen.poly(m.Px([[0.58, 0.15], [0.86, 0.16], [0.85, 0.43], [0.58, 0.42]]), { stroke: BLUE, w, ...fillc(BLUE, 0.8, 3, ha()) });
    pen.poly(m.Px([[0.28, 0.56], [0.11, 0.87], [0.45, 0.86]]), { stroke: GREEN, w, ...fillc(GREEN, 0.8, 3, ha()) });
    pen.poly(CP.helpers.starPts(...m.P(0.72, 0.72), L * 0.17, L * 0.075), { stroke: ORANGE, w, ...fillc(YEL, 0.85, 3, ha()) });
  }

  function abc(pen, b, r) {
    const m = frame(b), L = m.s, off = Math.floor(r() * 8);
    ['A', 'B', 'C'].forEach((ch, i) => pen.text(ch, ...m.P(0.2 + i * 0.27, 0.08), L * 0.3, { stroke: PAL[(off + i * 3) % 8], w: Math.max(2.5, L * 0.035) }));
    ['1', '2', '3'].forEach((ch, i) => pen.text(ch, ...m.P(0.2 + i * 0.27, 0.54), L * 0.3, { stroke: PAL[(off + i * 3 + 1) % 8], w: Math.max(2.5, L * 0.035) }));
    pen.poly(CP.helpers.starPts(...m.P(0.9, 0.08), L * 0.07, L * 0.03), { stroke: ORANGE, w: 1.5, fill: YEL }); // teacher's star sticker
  }

  // ---------------------------------------------------------------- several little drawings on one sheet
  const MINE = { plant, cat, dog, butterfly, fish, car, rocket, boat, snowman, icecream, balloons, rain, me, dino, shapes };
  const OLD = ['tree', 'heart', 'rainbow', 'sun', 'house'];
  const SCRIBBLES = ['loops', 'zigzag', 'round', 'colourin', 'rainbow'];
  function doodles(pen, b, a) {
    const P = a.params || {}, n = Math.max(2, Math.min(6, +P.count || 4));
    const r = U.rng(U.hash(a.seed + ':doodles:' + (P.shuffle || 1)));
    const pool = [...Object.keys(MINE), ...OLD];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const picks = pool.slice(0, n);
    if (P.scribbles !== false && n >= 3) picks[Math.floor(r() * n)] = 'scribble';
    const cols = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * b.w / b.h)))), rows = Math.ceil(n / cols);
    const cw = b.w / cols, ch = b.h / rows;
    picks.forEach((id, i) => {
      const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols), col = i % cols;
      const k = 0.82 + r() * 0.16, bw = cw * k, bh = ch * k;
      const x = b.x + (b.w - inRow * cw) / 2 + col * cw + (cw - bw) * r(), y = b.y + row * ch + (ch - bh) * r();
      const box = { x, y, w: bw, h: bh, cx: x + bw / 2, cy: y + bh / 2 };
      if (MINE[id]) MINE[id](pen, box, r, { style: ['pot', 'flower', 'cactus', 'sprout'][Math.floor(r() * 4)] });
      else if (id === 'scribble') { const ad = CP.addons.scribble; if (ad) ad.draw(pen, box, { seed: a.seed + i, rng: r, params: { style: SCRIBBLES[Math.floor(r() * SCRIBBLES.length)] } }); }
      else if (id === 'house') { const ad = CP.addons.house; if (ad) ad.draw(pen, box, { seed: a.seed + i, rng: r, params: {} }); }
      else CP.helpers.paintingOn(pen, id, box.x, box.y, box.w, box.h, a.seed + i);
    });
  }

  const PIC = (id, name, fn, order, params) => ({ type: 'addon', kind: 'picture', id, name, order, ...(params ? { params } : {}), draw(pen, b, a) { fn(pen, b, a.rng, a.params || {}); } });
  CP.register({ api: 1, version: '1.0.0', items: [
    { type: 'addon', kind: 'picture', id: 'picdoodles', name: 'Lots of little drawings', order: 7, draw: doodles, params: [
      { key: 'count', label: 'How many drawings', type: 'range', min: 2, max: 6, step: 1, def: 4 },
      { key: 'scribbles', label: 'One of them a scribble', type: 'toggle', def: true },
      { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 },
    ] },
    PIC('picplant', 'Plant', plant, 20, [{ key: 'style', label: 'Plant', type: 'select', def: 'pot', options: { pot: 'Plant in a pot', flower: 'Flower in the grass', cactus: 'Cactus', sprout: 'Bean sprout in a cup' } }]),
    PIC('piccat', 'Cat', cat, 21), PIC('picdog', 'Dog', dog, 22), PIC('picbutterfly', 'Butterfly', butterfly, 23),
    PIC('picfish', 'Fish in the sea', fish, 24), PIC('piccar', 'Car', car, 25), PIC('picrocket', 'Rocket in space', rocket, 26),
    PIC('picboat', 'Boat on the sea', boat, 27), PIC('picsnowman', 'Snowman', snowman, 28), PIC('picicecream', 'Ice cream', icecream, 29),
    PIC('picballoons', 'Balloons', balloons, 30), PIC('picrain', 'Rain cloud', rain, 31), PIC('picme', 'Me (self-portrait)', me, 32),
    PIC('picdino', 'Dinosaur', dino, 33), PIC('picshapes', 'Shapes', shapes, 34), PIC('picabc', 'ABC and 123', abc, 35),
  ] });
})();
