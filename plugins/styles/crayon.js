// Style: Crayon — wobbly doubled strokes, scribble hatching and wax grain. (The original StorySketch look.)
// Style plugins turn the clean primitives into the final picture; see plugins/README.md → Styles.
(() => {
  const { f, dPoly, dFill, paperOf, arcLens, colour } = RENDER.helpers;

  function crayonStroke(p, seed, ctx) {
    const col = colour(p.stroke, ctx);
    let pts = p.smooth ? U.spline(p.pts, p.closed, 3) : U.densify(p.pts, p.closed, 3);
    if (pts.length < 2) return '';
    if (p.closed) { const extra = Math.max(2, Math.round(pts.length * 0.1)); pts = pts.concat(pts.slice(0, extra)); }
    const al = arcLens(pts); const L = al[al.length - 1];
    const r = U.rng(seed);
    const wob = ctx.wobble ?? 1;
    const amp = Math.min(p.w * 0.32 + 0.7, L * 0.025 + 0.25) * wob;
    let out = '';
    for (let pass = 0; pass < 2; pass++) {
      const n1 = U.noise1(seed + pass * 7919); const wl = 22 + r() * 16; const ph = r() * 40;
      const a = amp * (pass ? 1.6 : 1);
      // overshoot / undershoot ends a touch, like a real crayon stroke
      const q = pts.map((pt, k) => {
        const prev = pts[Math.max(0, k - 1)], next = pts[Math.min(pts.length - 1, k + 1)];
        const t = U.sub(next, prev); const l = U.len(t) || 1; const nrm = [-t[1] / l, t[0] / l];
        const off = n1(al[k] / wl + ph) * a; return [pt[0] + nrm[0] * off, pt[1] + nrm[1] * off];
      });
      const w = pass ? p.w * 0.5 : p.w * 0.95;
      out += `<path d="${dPoly(q, false)}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-opacity="${pass ? 0.5 : 0.92}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return out;
  }

  function crayonHatch(p, seed, ctx) {
    const id = `${ctx.idp}h${ctx.n++}`;
    const col = colour(p.hatch.color, ctx);
    const bb = U.bbox(p.pts); const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2; const R = Math.hypot(bb.w, bb.h) / 2 + 4;
    const ang = U.rad(p.hatch.angle ?? -40), ca = Math.cos(ang), sa = Math.sin(ang);
    const gap = p.hatch.gap ?? 6; const r = U.rng(seed);
    const pts = []; let flip = false;
    for (let y = -R; y <= R; y += gap * (0.75 + r() * 0.5)) {
      const row = flip ? [[R, y], [-R, y + gap * 0.3]] : [[-R, y], [R, y + gap * 0.3]];
      pts.push(...row); flip = !flip;
    }
    const q = pts.map(([x, y]) => [cx + x * ca - y * sa + (r() - 0.5) * 1.5, cy + x * sa + y * ca + (r() - 0.5) * 1.5]);
    const alpha = U.clamp((p.hatch.alpha ?? 0.6) * 1.25, 0.15, 1);
    return `<clipPath id="${id}"><path d="${dFill(p)}"${(p.hole || p.more) ? ' clip-rule="evenodd"' : ''}/></clipPath>` +
      `<path clip-path="url(#${id})" d="${dPoly(q, false)}" fill="none" stroke="${col}" stroke-width="${f(Math.max(1.8, gap * 0.42))}" stroke-opacity="${alpha}" stroke-linejoin="round"/>`;
  }

  function render(prims, ctx) {
    let s = '', run = '', box = null;
    const grow = (pts, pad) => { const b = U.bbox(pts); if (!box) box = { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad }; else { box.x0 = Math.min(box.x0, b.x0 - pad); box.y0 = Math.min(box.y0, b.y0 - pad); box.x1 = Math.max(box.x1, b.x1 + pad); box.y1 = Math.max(box.y1, b.y1 + pad); } };
    const flush = () => {
      if (!run) return;
      // invisible rect guarantees a non-degenerate filter region (e.g. a lone horizontal line)
      s += `<g filter="url(#crayon-grain)"><rect x="${f(box.x0)}" y="${f(box.y0)}" width="${f(box.x1 - box.x0)}" height="${f(box.y1 - box.y0)}" fill="none"/>${run}</g>`;
      run = ''; box = null;
    };
    prims.forEach((p, i) => {
      const seed = U.hash(ctx.seed + ':' + i);
      const fr = (p.hole || p.more) ? ' fill-rule="evenodd"' : '';
      if (p.fill === 'paper') { flush(); s += `<path d="${dFill(p)}" fill="${paperOf(ctx)}"${fr}/>`; }
      else if (p.fill) { run += `<path d="${dFill(p)}" fill="${colour(p.fill, ctx)}" fill-opacity="0.9"${fr}/>`; grow(p.pts, 12); }
      if (p.hatch) { run += crayonHatch(p, seed, ctx); grow(p.pts, 12); }
      if (p.stroke && p.w > 0) { run += crayonStroke(p, seed, ctx); grow(p.pts, p.w * 2 + 12); }
    });
    flush();
    return s;
  }

  const DEFS = `<filter id="crayon-grain" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="7" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 2.05" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in" result="g"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="3" result="w"/>
  <feDisplacementMap in="g" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

  CP.register({ api: 1, version: '1.0.0', type: 'style', id: 'crayon', name: 'Crayon', order: 10, defs: DEFS, render });
})();
