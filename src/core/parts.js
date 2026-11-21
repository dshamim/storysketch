// Shared character parts: face, hair, clothes and accessories. These draw onto a rig's joints, so any rig that provides
// the head/neck/hip frame (see plugins/README.md → Rigs) gets expressions, hair, clothes and accessory slots for free.
// Plugins (hair/*.js, clothes/*.js, accessories/*.js) receive the contexts built here.

const PARTS = (() => {
  // clothes plugins decide leg spacing (legSpread) and shoulder width for the arms (armOffset)
  const clothesDef = (cast) => CP.clothes[cast.body] || CP.clothes.stick;

  // face frame: x right, y down, in head-radius units
  function faceFrame(J, mirror = false) {
    const R = J.d.head, C = J.headC, uv = U.dir(J.headA), rv = U.dir(J.headA + 90);
    const F = (x, y) => { if (mirror) x = -x; return [C[0] + rv[0] * x * R - uv[0] * y * R, C[1] + rv[1] * x * R - uv[1] * y * R]; };
    const arcPts = (a0, a1, r, n = 16, cx = 0, cy = 0) => { const out = []; for (let i = 0; i <= n; i++) { const a = U.rad(U.lerp(a0, a1, i / n)); out.push(F(cx + r * Math.cos(a), cy + r * Math.sin(a))); } return out; };
    const circ = (cx, cy, r, n = 18) => { const out = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; out.push(F(cx + r * Math.cos(a), cy + r * Math.sin(a))); } return out; };
    return { R, C, F, arcPts, circ };
  }

  // loopy curls along a path (face units -> local)
  function loopy(F, base, loopR, wl, step = 0.035) {
    const dense = U.densify(base, false, step); const out = []; let s = 0;
    for (let i = 0; i < dense.length; i++) {
      if (i) s += U.len(U.sub(dense[i], dense[i - 1]));
      const a = (s / wl) * Math.PI * 2;
      out.push(F(dense[i][0] + loopR * Math.cos(a), dense[i][1] + loopR * Math.sin(a)));
    }
    return out;
  }

  // ---- contexts handed to plugins (see plugins/README.md) ----
  function hairCtx(J, cast, layer, mirror) {
    const ff = faceFrame(J, mirror); const W = J.d.w * 0.8; const color = cast.hairColor || cast.color;
    const style = { stroke: color, w: W, hatch: color, hg: 4, halpha: 0.75, ha: 60 };
    const cap = (outer = 1.1, inner = 0.74, a0 = -178, a1 = -2, zig = true) => {
      const pts = ff.arcPts(a0, a1, outer, 18);
      const n = 10; for (let i = 0; i <= n; i++) { const a = U.lerp(a1, a0, i / n); const r = zig ? (i % 2 ? inner - 0.06 : inner + 0.06) : inner; pts.push(ff.F(r * Math.cos(U.rad(a)), r * Math.sin(U.rad(a)) * 0.95 - (zig ? 0 : 0.05))); }
      return pts;
    };
    return { layer, back: layer === 'back', front: layer === 'front', F: ff.F, arcPts: ff.arcPts, circ: ff.circ, R: ff.R, W, color, style, cap,
      loopy: (base, loopR, wl, step) => loopy(ff.F, base, loopR, wl, step), J, cast, k: J.d.k, mirror };
  }
  function drawHair(pen, J, cast, layer, mirror) {
    const def = CP.hair[cast.hair || 'none']; if (!def) return;
    try { def.draw(pen, hairCtx(J, cast, layer, mirror)); } catch (e) { CP.runtimeError(def, e); }
  }

  function face(pen, J, cast, inst) {
    const { F, R } = faceFrame(J); const c = cast.color; const W = J.d.w * 0.75; const look = (inst.look || 0) * 0.2;
    const ex = inst.expr || 'happy';
    const eyeY = -0.08;
    for (const s of [-1, 1]) {
      if (ex === 'sleepy') pen.line([F(s * 0.33 + look - 0.1, eyeY), F(s * 0.33 + look + 0.1, eyeY)], { stroke: c, w: W });
      else pen.circ(...F(s * 0.33 + look, eyeY), R * (ex === 'surprised' ? 0.12 : 0.1), { stroke: c, w: 1, fill: c });
    }
    if (ex === 'sad' || ex === 'worried') for (const s of [-1, 1]) pen.line([F(s * 0.5 + look, -0.3), F(s * 0.18 + look, -0.42)], { stroke: c, w: W * 0.8 });
    if (ex === 'surprised') for (const s of [-1, 1]) pen.curve([F(s * 0.48 + look, -0.38), F(s * 0.33 + look, -0.48), F(s * 0.18 + look, -0.4)], { stroke: c, w: W * 0.8 });
    const nd = look < 0 ? -1 : 1; // nose points the way the eyes look
    if (cast.nose !== false) pen.curve([F(look * 1.6 + 0.02 * nd, 0.06), F(look * 1.6 + 0.1 * nd, 0.16), F(look * 1.6 - 0.02 * nd, 0.22)], { stroke: c, w: W * 0.7 });
    const mx = look * 0.8;
    switch (ex) {
      case 'happy': pen.curve([F(mx - 0.32, 0.32), F(mx, 0.55), F(mx + 0.32, 0.32)], { stroke: c, w: W }); break;
      case 'grin': pen.poly([F(mx - 0.38, 0.3), F(mx + 0.38, 0.3), F(mx + 0.22, 0.56), F(mx, 0.64), F(mx - 0.22, 0.56)], { stroke: c, w: W, fill: 'paper', smooth: true }); break;
      case 'neutral': case 'sleepy': pen.line([F(mx - 0.2, 0.44), F(mx + 0.2, 0.44)], { stroke: c, w: W }); break;
      case 'sad': pen.curve([F(mx - 0.3, 0.56), F(mx, 0.4), F(mx + 0.3, 0.56)], { stroke: c, w: W }); break;
      case 'worried': pen.curve([F(mx - 0.3, 0.5), F(mx - 0.1, 0.42), F(mx + 0.1, 0.52), F(mx + 0.3, 0.44)], { stroke: c, w: W }); break;
      case 'surprised': pen.ell(...F(mx, 0.46), R * 0.12, R * 0.15, { stroke: c, w: W, fill: 'paper' }); break;
      case 'talk': pen.ell(...F(mx, 0.44), R * 0.2, R * 0.14, { stroke: c, w: W, fill: 'paper' }); break;
    }
  }

  // Dresses = bodice (neck -> waist) + skirt that follows the thighs.
  // The skirt is the convex hull of the waist, points along each thigh and the cloth hanging below them,
  // so standing gives an A-line and sitting drapes over the lap with the legs coming out under the hem.
  function waistPts(J) { const w = 18 * J.d.k; return [U.add(J.hip, U.mul(J.p, -w)), U.add(J.hip, U.mul(J.p, w))]; }
  function skirtHull(J, len) {
    const pts = [...waistPts(J)];
    const flare = 13 * J.d.k;
    for (const lg of [J.legL, J.legR]) {
      const thighDir = U.dir(lg.up); const n = [-thighDir[1], thighDir[0]];
      const at = U.add(lg.S, U.mul(thighDir, J.d.th * len));
      const outward = U.sub(lg.S, J.hip); const sgn = (n[0] * outward[0] + n[1] * outward[1]) >= 0 ? 1 : -1;
      const horiz = Math.abs(thighDir[0]); // 0 standing, 1 sitting
      const side1 = U.add(at, U.mul(n, flare * sgn * (1 - horiz * 0.6))), side2 = U.add(at, U.mul(n, -flare * 0.4 * sgn));
      const hang = horiz * 26 * J.d.k * Math.min(1, len + 0.2); // cloth hangs over the knees when sitting
      pts.push(lg.S, side1, side2, U.add(side1, [0, hang]), U.add(side2, [0, hang * 0.7]));
    }
    return U.hull(pts);
  }
  function bodice(pen, J, col, W, hatch) {
    const k = J.d.k; const [wl, wr] = waistPts(J);
    const nl = U.add(J.neck, U.mul(J.p, -4 * k)), nr = U.add(J.neck, U.mul(J.p, 4 * k));
    const sl = U.add(J.shoulder, U.mul(J.p, -7 * k)), sr = U.add(J.shoulder, U.mul(J.p, 7 * k));
    const dn = U.mul(J.t, -W * 1.4); // extend the fill just past the waist so the skirt's top edge never shows as a seam
    pen.poly([nl, nr, sr, wr, U.add(wr, dn), U.add(wl, dn), wl, sl], { stroke: false, fill: 'paper', ...hatch });
    pen.line([nl, sl, wl], { stroke: col, w: W }); pen.line([nr, sr, wr], { stroke: col, w: W }); pen.line([nl, nr], { stroke: col, w: W });
  }

  function clothesCtx(pen, J, cast, def) {
    const W = J.d.w; const color = cast.clothesColor || def.color || cast.color; const k = J.d.k;
    const hatch = cast.hatchBody !== false ? { hatch: color, hg: 6, halpha: 0.35, ha: -50 } : {};
    const skirtLen = cast.skirt ?? def.skirt ?? 0.45;
    return { J, cast, color, W, k, hatch, style: { stroke: color, w: W, ...hatch }, skirtLen, down: U.mul(J.t, -1), waist: waistPts(J),
      skirtHull: (len = skirtLen) => skirtHull(J, len), bodice: () => bodice(pen, J, color, W, hatch) };
  }
  function drawClothes(pen, J, cast) {
    const def = clothesDef(cast);
    try { def.draw(pen, clothesCtx(pen, J, cast, def)); } catch (e) { CP.runtimeError(def, e); }
  }
  function accCtx(J, cast, inst, def, opts, mirror) {
    const ff = faceFrame(J, false); const sideMirror = def.sided ? mirror : false;
    return { ...ff, J, cast, inst, color: (opts && opts.color) || def.color || cast.color, castColor: cast.color, W: J.d.w, k: J.d.k,
      mirror: sideMirror, side: sideMirror ? -1 : 1, look: (inst.look || 0) * 0.2, eyeY: -0.08, eyeDX: 0.33, down: U.mul(J.t, -1) };
  }
  // an accessory may list the rigs it was drawn for (`rigs: ['biped']`); with no list it fits any skeleton
  const fits = (def, cast) => !def.rigs || def.rigs.includes(cast.rig || 'biped');
  // accessories worn by a character, in drawing order for one slot
  function accessoriesIn(cast, slot) {
    const on = cast.accessories || {};
    return Object.keys(on).map((id) => [CP.accessories[id], on[id] || {}]).filter(([d]) => d && d.slot === slot && fits(d, cast)).sort((a, b) => (a[0].order || 0) - (b[0].order || 0));
  }
  function drawSlot(pen, J, cast, inst, slot, mirror) {
    for (const [def, opts] of accessoriesIn(cast, slot)) { try { def.draw(pen, accCtx(J, cast, inst, def, opts, mirror)); } catch (e) { CP.runtimeError(def, e); } }
  }
  // ids of hair / clothes / accessories this character uses that aren't installed
  function missingParts(cast) {
    const m = [];
    if (cast.hair && !CP.hair[cast.hair]) m.push(`hair "${cast.hair}"`);
    if (cast.body && !CP.clothes[cast.body]) m.push(`clothes "${cast.body}"`);
    for (const id of Object.keys(cast.accessories || {})) if (!CP.accessories[id]) m.push(`accessory "${id}"`);
    return m;
  }
  const sidedAccessories = (cast) => Object.keys(cast.accessories || {}).map((id) => CP.accessories[id]).filter((d) => d && d.sided);

  return { fits, faceFrame, loopy, drawHair, face, drawClothes, drawSlot, clothesDef, missingParts, sidedAccessories, waistPts, skirtHull };
})();
