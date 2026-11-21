// Picture add-on: Symmetry spider web — maths through art. A web whose two halves mirror each other across a dashed
// line of symmetry: the coloured sections on one side are matched on the other, and the spider in the middle is symmetrical too.
// "Half done" shows the left half finished and the right half still to do (faint dotted guide), like a worksheet.
(() => {
  const PAL = ['#e53935', '#fb8c00', '#fbc02d', '#43a047', '#1e88e5', '#8e24aa', '#d81b60', '#00897b'];
  const WEB = '#546e7a', AXIS = '#e53935';
  function dashed(pen, [x0, y0], [x1, y1], o, dash = 7, gap = 5) {
    const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.floor(L / (dash + gap)));
    for (let i = 0; i <= n; i++) { const t0 = i * (dash + gap) / L, t1 = Math.min(1, t0 + dash / L); if (t0 >= 1) break; pen.line([[U.lerp(x0, x1, t0), U.lerp(y0, y1, t0)], [U.lerp(x0, x1, t1), U.lerp(y0, y1, t1)]], o); }
  }
  // dotted version of a polyline (for the half still to be drawn)
  function dotted(pen, pts, o, step = 6) {
    for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / step)); for (let k = 0; k < n; k += 2) pen.line([[U.lerp(ax, bx, k / n), U.lerp(ay, by, k / n)], [U.lerp(ax, bx, (k + 1) / n), U.lerp(ay, by, (k + 1) / n)]], o); }
  }

  function draw(pen, b, a) {
    const P = a.params || {}, r = a.rng || U.rng(U.hash(a.seed));
    const n = +P.spokes || 8, k = +P.rings || 4, half = P.mode === 'half', axes = P.axes || 'one';
    const label = P.label === true;
    const R = Math.min(b.w, b.h * (label ? 0.82 : 1)) * 0.42, cx = b.cx, cy = b.y + (label ? b.h * 0.44 : b.h / 2);
    const s = 360 / n, ang = (i) => U.rad(-90 + i * s);
    const at = (i, rr) => [cx + Math.cos(ang(i)) * rr, cy + Math.sin(ang(i)) * rr];
    const mid = (i, rr) => [cx + Math.cos(U.rad(-90 + (i + 0.5) * s)) * rr, cy + Math.sin(U.rad(-90 + (i + 0.5) * s)) * rr];
    const sag = 0.86; // threads between spokes sag inwards
    const ringR = (j) => R * (j / k) * (0.92 + 0.08 * j / k);
    const right = (i) => Math.cos(U.rad(-90 + (i + 0.5) * s)) > 1e-6; // which half a section is on
    const w = Math.max(1.6, R * 0.025);

    // coloured sections, picked on the left half and mirrored onto the right (and top/bottom when there are two lines)
    const mirV = (i) => ((n - 1 - i) % n + n) % n, mirH = (i) => ((n / 2 - 1 - i) % n + n) % n;
    const cells = new Map();
    if (P.colours !== 'none') {
      const two = [PAL[Math.floor(r() * 8)]]; two.push(PAL[(PAL.indexOf(two[0]) + 4) % 8]);
      for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) {
        if (right(i) || r() > 0.42) continue;
        const key = i + ':' + j; if (cells.has(key)) continue;
        const c = P.colours === 'two' ? two[(i + j) % 2] : PAL[Math.floor(r() * 8)];
        const group = [i, mirV(i)]; if (axes === 'both' && n % 4 === 0) group.push(mirH(i), mirH(mirV(i)));
        for (const g of group) cells.set(g + ':' + j, c);
      }
    }
    for (const [key, c] of cells) {
      const [i, j] = key.split(':').map(Number);
      if (half && right(i)) continue;
      const r0 = ringR(j), r1 = ringR(j + 1);
      const pts = j === 0 ? [[cx, cy], at(i, r1), mid(i, r1 * sag), at(i + 1, r1)] : [at(i, r0), mid(i, r0 * sag), at(i + 1, r0), at(i + 1, r1), mid(i, r1 * sag), at(i, r1)];
      pen.poly(pts, { stroke: false, fill: 'paper', hatch: c, hg: 3, halpha: 0.8, ha: right(i) ? 40 : -40, smooth: false });
    }
    // spokes + ring threads
    for (let i = 0; i < n; i++) {
      const sp = [[cx, cy], at(i, R * 1.04)], isRight = Math.cos(ang(i)) > 1e-6;
      if (half && isRight) dotted(pen, sp, { stroke: '#b0bec5', w: w * 0.8 }); else pen.line(sp, { stroke: WEB, w });
      for (let j = 1; j <= k; j++) {
        const rr = ringR(j), seg = [at(i, rr), mid(i, rr * sag), at(i + 1, rr)];
        if (half && right(i)) dotted(pen, [seg[0], seg[1], seg[2]], { stroke: '#b0bec5', w: w * 0.7 });
        else pen.curve(seg, { stroke: WEB, w: w * 0.85 });
      }
    }
    // the spider in the middle: legs mirrored left / right
    if (P.spider !== false) {
      const sr = R * 0.09, sc = '#37474f';
      for (const sx of [-1, 1]) {
        if (half && sx > 0) { for (let l = 0; l < 4; l++) { const a0 = U.rad(-60 + l * 35); dotted(pen, [[cx + sx * sr * 0.6, cy + sr * 0.2], [cx + sx * Math.cos(a0) * sr * 2.2, cy + Math.sin(a0) * sr * 1.6 - sr * 0.3], [cx + sx * Math.cos(a0) * sr * 3, cy + Math.sin(a0) * sr * 2.4 + sr * 0.6]], { stroke: '#b0bec5', w: w * 0.7 }, 3); } continue; }
        for (let l = 0; l < 4; l++) { const a0 = U.rad(-60 + l * 35); pen.line([[cx + sx * sr * 0.6, cy + sr * 0.2], [cx + sx * Math.cos(a0) * sr * 2.2, cy + Math.sin(a0) * sr * 1.6 - sr * 0.3], [cx + sx * Math.cos(a0) * sr * 3, cy + Math.sin(a0) * sr * 2.4 + sr * 0.6]], { stroke: sc, w: w * 0.9 }); }
      }
      pen.ell(cx, cy + sr * 0.4, sr * 0.8, sr, { stroke: sc, w, fill: sc });
      pen.circ(cx, cy - sr * 0.8, sr * 0.55, { stroke: sc, w, fill: sc });
      for (const sx of [-1, 1]) pen.circ(cx + sx * sr * 0.22, cy - sr * 0.85, Math.max(1.2, sr * 0.15), { stroke: 'paper', w: 1, fill: 'paper' });
    }
    // line(s) of symmetry
    if (axes !== 'none') {
      const o = { stroke: AXIS, w: Math.max(2.5, w * 1.4) }, ext = R * 1.15, dash = Math.max(6, R * 0.1);
      dashed(pen, [cx, cy - ext], [cx, cy + ext], o, dash, dash * 0.7);
      if (axes === 'both') dashed(pen, [cx - ext, cy], [cx + ext, cy], o, dash, dash * 0.7);
    }
    if (label) { const h = Math.min(b.h * 0.075, b.w / 11); pen.text('line of symmetry', cx, b.y + b.h - h * 1.25, h, { stroke: AXIS, w: Math.max(1.5, h * 0.09) }); }
  }

  CP.register({
    api: 1, version: '1.0.0',
    type: 'addon', kind: 'picture', id: 'picsymweb', name: 'Symmetry spider web (maths)', order: 9,
    params: [
      { key: 'mode', label: 'Drawing', type: 'select', def: 'done', options: { done: 'Finished (both halves)', half: 'Half done (finish the other side)' } },
      { key: 'axes', label: 'Line of symmetry', type: 'select', def: 'one', options: { one: 'One (up and down)', both: 'Two (up/down + across)', none: 'Not drawn' } },
      { key: 'spokes', label: 'Spokes', type: 'select', def: '8', options: { 6: '6', 8: '8', 12: '12' } },
      { key: 'rings', label: 'Rings', type: 'range', min: 2, max: 7, step: 1, def: 4 },
      { key: 'colours', label: 'Coloured-in sections', type: 'select', def: 'rainbow', options: { rainbow: 'Lots of colours', two: 'Two colours', none: 'None (just the web)' } },
      { key: 'spider', label: 'Spider in the middle', type: 'toggle', def: true },
      { key: 'label', label: 'Write "line of symmetry"', type: 'toggle', def: false },
    ],
    draw,
  });
})();
