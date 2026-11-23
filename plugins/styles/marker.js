// Style: Marker — bold, even felt-tip strokes that darken where they overlap, streaky flat fills, a nib dot where
// the pen lands. No paper grain.
(() => {
  const { f, dPoly, dFill, colour, runs, hatchLines, wobblePath } = RENDER.helpers;

  function stroke(p, seed, ctx) {
    const wp = wobblePath(p, seed, Math.min(p.w * 0.1 + 0.3, 1.1), 34);
    if (!wp) return '';
    const col = colour(p.stroke, ctx), w = Math.max(2.2, p.w * 1.22);
    let out = `<path d="${dPoly(wp.q, false)}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-opacity="0.78" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (!p.closed) { // the nib rests a moment where it lands and lifts: a slightly darker blot at each end
      for (const e of [wp.q[0], wp.q[wp.q.length - 1]]) out += `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="${f(w * 0.5)}" fill="${col}" fill-opacity="0.3"/>`;
    }
    return out;
  }

  function render(prims, ctx) {
    return runs(prims, ctx, 'marker-edge', (p, seed) => {
      let out = '';
      if (p.glyph) return `<path d="${dFill(p)}" fill="${colour(p.fill, ctx)}" fill-opacity="0.82" fill-rule="evenodd"/>`; // a letter of a font: even felt-tip ink, no streaks (they would blur small letters)
      if (p.fill && p.fill !== 'paper') {
        const col = colour(p.fill, ctx);
        out += `<path d="${dFill(p)}" fill="${col}" fill-opacity="0.55"${(p.hole || p.more) ? ' fill-rule="evenodd"' : ''}/>`;
        // the streaks left by going back and forth with the pen: overlapping bands darken a little
        out += hatchLines(p, seed, ctx, { color: col, angle: -35 + (seed % 20), gap: 7, width: 9, alpha: 0.3, jitter: 1, vary: 0.25 });
      }
      if (p.hatch) {
        const a = Math.min(1, (p.hatch.alpha ?? 0.6) * 1.15);
        out += hatchLines(p, seed + 1, ctx, { color: colour(p.hatch.color, ctx), angle: p.hatch.angle ?? -40, gap: Math.max(5, (p.hatch.gap ?? 6) * 1.1), width: Math.max(2.6, (p.hatch.gap ?? 6) * 0.55), alpha: a * 0.65, jitter: 1.2, vary: 0.4 });
      }
      if (p.stroke && p.w > 0) out += stroke(p, seed, ctx);
      return out;
    });
  }

  // a little edge irregularity so lines don't look like perfect vectors
  const DEFS = `<filter id="marker-edge" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="w"/>
  <feDisplacementMap in="SourceGraphic" in2="w" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

  CP.register({ api: 1, version: '1.0.0', type: 'style', id: 'marker', name: 'Marker (felt-tip)', order: 20, defs: DEFS, render });
})();
