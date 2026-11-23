// Style: Ink pen — fine dark outlines that swell and taper like a nib, a faint second sketch line, and cross-hatched
// shading. Colour is kept as a light wash inside the lines.
(() => {
  const { f, dPoly, dFill, colour, darkPaper, runs, hatchLines, wobblePath } = RENDER.helpers;
  const INK = '#1d1b2a';
  // ink is dark: pull the line colour most of the way to blue-black (on a dark page it stays light)
  const inkOf = (c, ctx) => (darkPaper(ctx) || !/^#[0-9a-f]{3,6}$/i.test(c) ? c : U.mix(c, INK, 0.62));

  function stroke(p, seed, ctx) {
    const wp = wobblePath(p, seed, 0.45, 46, 2.5);
    if (!wp) return '';
    const { q, al, L } = wp; const col = inkOf(colour(p.stroke, ctx), ctx);
    const w = Math.max(1.3, p.w * 0.5); const n1 = U.noise1(seed + 17);
    const left = [], right = [];
    q.forEach((pt, k) => {
      const prev = q[Math.max(0, k - 1)], next = q[Math.min(q.length - 1, k + 1)];
      const t = U.sub(next, prev); const l = U.len(t) || 1; const nx = -t[1] / l, ny = t[0] / l;
      const u = L ? al[k] / L : 0;
      // open strokes: thin at the ends, full in the middle. closed shapes: no ends, just slow pressure drift
      const prof = (p.closed ? 1 : 0.3 + 0.7 * Math.pow(Math.sin(Math.PI * U.clamp(u, 0, 1)), 0.55)) * (1 + 0.18 * n1(al[k] / 22));
      const h = w / 2 * prof;
      left.push([pt[0] + nx * h, pt[1] + ny * h]); right.push([pt[0] - nx * h, pt[1] - ny * h]);
    });
    const d = dPoly(left, false) + 'L' + right.slice().reverse().map((pt) => `${f(pt[0])} ${f(pt[1])}`).join('L') + 'Z';
    let out = `<path d="${d}" fill="${col}" stroke="${col}" stroke-width="0.35" stroke-linejoin="round"/>`;
    if (p.w >= 3) { // a loose second pass, as if the line was gone over lightly
      const w2 = wobblePath(p, seed + 53, 1.1, 30, 3);
      if (w2) out += `<path d="${dPoly(w2.q, false)}" fill="none" stroke="${col}" stroke-width="${f(Math.max(0.6, w * 0.42))}" stroke-opacity="0.32" stroke-linecap="round"/>`;
    }
    return out;
  }

  function render(prims, ctx) {
    return runs(prims, ctx, null, (p, seed) => {
      let out = '';
      if (p.glyph) return `<path d="${dFill(p)}" fill="${inkOf(colour(p.fill, ctx), ctx)}" fill-opacity="0.94" fill-rule="evenodd"/>`; // a letter of a font: solid ink, kept legible
      if (p.fill && p.fill !== 'paper') out += `<path d="${dFill(p)}" fill="${colour(p.fill, ctx)}" fill-opacity="0.28"${(p.hole || p.more) ? ' fill-rule="evenodd"' : ''}/>`;
      if (p.hatch) {
        const col = inkOf(colour(p.hatch.color, ctx), ctx), a = p.hatch.alpha ?? 0.6, gap = Math.max(3.2, (p.hatch.gap ?? 6) * 0.8);
        out += hatchLines(p, seed, ctx, { color: col, angle: p.hatch.angle ?? -40, gap, width: 0.9, alpha: Math.min(1, a * 1.15), jitter: 0.8, vary: 0.25 });
        if (a >= 0.5) out += hatchLines(p, seed + 3, ctx, { color: col, angle: (p.hatch.angle ?? -40) + 78, gap: gap * 1.5, width: 0.8, alpha: a * 0.7, jitter: 0.8, vary: 0.3 }); // cross-hatch
      }
      if (p.stroke && p.w > 0) out += stroke(p, seed, ctx);
      return out;
    });
  }

  CP.register({ api: 1, version: '1.0.0', type: 'style', id: 'ink', name: 'Ink pen', order: 30, defs: '', render });
})();
