// Style: Chalk — soft, dusty, broken strokes with a bit of glow, for chalkboards. Dark lines are drawn chalk-white,
// and picking this style suggests a dark board colour for the page.
(() => {
  const { f, dPoly, dFill, colour, runs, hatchLines, wobblePath } = RENDER.helpers;

  function stroke(p, seed, ctx) {
    const col = colour(p.stroke, ctx); let out = '';
    const amp = Math.min(p.w * 0.3 + 0.6, 2.2);
    [[1.05, 0.85, 1], [0.6, 0.5, 1.7], [0.38, 0.38, 2.4]].forEach(([wf, op, af], pass) => {
      const wp = wobblePath(p, seed + pass * 131, amp * af, 26 + pass * 7); if (!wp) return;
      out += `<path d="${dPoly(wp.q, false)}" fill="none" stroke="${col}" stroke-width="${f(Math.max(1.6, p.w * wf))}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    return out;
  }

  function render(prims, ctx) {
    return runs(prims, ctx, 'chalk-dust', (p, seed) => {
      let out = '';
      if (p.glyph) return `<path d="${dFill(p)}" fill="${colour(p.fill, ctx)}" fill-opacity="0.8" fill-rule="evenodd"/>`; // a letter of a font: dusty but readable
      if (p.fill && p.fill !== 'paper') {
        const col = colour(p.fill, ctx);
        out += `<path d="${dFill(p)}" fill="${col}" fill-opacity="0.42"${(p.hole || p.more) ? ' fill-rule="evenodd"' : ''}/>`; // a smudged rub of chalk
        out += hatchLines(p, seed, ctx, { color: col, angle: -50 + (seed % 25), gap: 5, width: 4.5, alpha: 0.22, jitter: 2, vary: 0.6 });
      }
      if (p.hatch) out += hatchLines(p, seed + 1, ctx, { color: colour(p.hatch.color, ctx), angle: p.hatch.angle ?? -40, gap: Math.max(4, (p.hatch.gap ?? 6) * 0.95), width: Math.max(2, (p.hatch.gap ?? 6) * 0.5), alpha: Math.min(1, (p.hatch.alpha ?? 0.6) * 0.95), jitter: 2, vary: 0.6 });
      if (p.stroke && p.w > 0) out += stroke(p, seed, ctx);
      return out;
    });
  }

  // chalk dust: lots of gaps, soft edges, slight wander
  const DEFS = `<filter id="chalk-dust" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3.4 0 0 0 2.55" result="m"/>
  <feComposite in="SourceGraphic" in2="m" operator="in" result="g"/>
  <feGaussianBlur in="g" stdDeviation="0.45" result="b"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="1" seed="9" result="w"/>
  <feDisplacementMap in="b" in2="w" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

  CP.register({ api: 1, version: '1.0.0', type: 'style', id: 'chalk', name: 'Chalk (blackboard)', order: 40, defs: DEFS, render, defaultPaper: '#2b3a35' });
})();
