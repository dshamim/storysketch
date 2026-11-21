// Rig: Person — the two-armed, two-legged stick figure (the original StorySketch skeleton).
// A rig owns everything about a skeleton: its dimensions, joints, posing (FK + 2-bone IK), presets, mirroring,
// drag handles and drawing. Characters pick one with `rig:` (default 'biped'). Built into the core so there is always
// a working rig; other rigs (e.g. a four-legged animal) are plugins in plugins/rigs/. See plugins/README.md → Rigs.
// Local coords: origin = hip, y down. Angles in degrees, 0 = right, 90 = down, -90 = up.
// Pose: { torso, head, armL:[upperRelTorso, lowerRelUpper], armR, legL:[upperAbs, lowerRelUpper], legR, feet:'out'|'right'|'left' }
// L / R = screen left / screen right.

(() => {
  const { clothesDef, faceFrame, face, drawHair, drawClothes, drawSlot } = PARTS;
  const BUILDS = {
    child: { torso: 80, head: 30, ua: 40, fa: 38, th: 46, sh: 44, sdrop: 12, w: 5 },
    adult: { torso: 112, head: 31, ua: 54, fa: 50, th: 66, sh: 62, sdrop: 16, w: 5 },
  };

  const EXPRESSIONS = { happy: 'Happy', grin: 'Big grin', neutral: 'Neutral', sad: 'Sad', worried: 'Worried', surprised: 'Surprised', talk: 'Talking / singing', sleepy: 'Bored' };

  function dims(cast) {
    const b = BUILDS[cast.build] || BUILDS.child; const k = cast.height || 1; const o = {};
    for (const key in b) o[key] = key === 'w' ? b.w * (cast.weight || 1) : b[key] * k;
    o.k = k; return o;
  }

  function joints(cast, pose) {
    const d = dims(cast); const T = pose.torso; const t = U.dir(T); const p = U.dir(T + 90);
    const hip = [0, 0]; const neck = U.mul(t, d.torso);
    const headA = T + (pose.head || 0); const headC = U.add(neck, U.mul(U.dir(headA), d.head + 1));
    const shoulder = U.sub(neck, U.mul(t, d.sdrop));
    const cd = clothesDef(cast);
    const armRoot = (side) => U.add(shoulder, U.mul(p, side * (cd.armOffset || 0) * d.k));
    const arm = (side, a) => { const S = armRoot(side); const up = T + a[0]; const E = U.add(S, U.mul(U.dir(up), d.ua)); const lo = up + a[1]; const H = U.add(E, U.mul(U.dir(lo), d.fa)); return { S, E, H, up, lo }; };
    const spread = (cd.legSpread || 0) * d.k;
    const leg = (side, l) => { const S = U.add(hip, U.mul(p, side * spread)); const up = l[0]; const E = U.add(S, U.mul(U.dir(up), d.th)); const lo = up + l[1]; const H = U.add(E, U.mul(U.dir(lo), d.sh)); return { S, E, H, up, lo }; };
    return { d, T, t, p, hip, neck, headA, headC, shoulder, armL: arm(-1, pose.armL), armR: arm(1, pose.armR), legL: leg(-1, pose.legL), legR: leg(1, pose.legR) };
  }

  const isArm = (limb) => limb === 'armL' || limb === 'armR';
  const lens = (d, limb) => isArm(limb) ? [d.ua, d.fa] : [d.th, d.sh];

  const solve2 = U.solve2;
  function bendOf(J, limb) { const L = J[limb]; const e = U.sub(L.E, L.S), h = U.sub(L.H, L.S); return (e[0] * h[1] - e[1] * h[0]) < 0 ? 1 : -1; }

  // ---- pose editing ----
  function setByIK(cast, pose, limb, target, bend) {
    const J = joints(cast, pose); const [a, b] = lens(J.d, limb);
    const bd = bend ?? bendOf(J, limb);
    const [up, lo] = solve2(J[limb].S, target, a, b, bd);
    pose[limb] = isArm(limb) ? [U.normA(up - pose.torso), U.normA(lo - up)] : [U.normA(up), U.normA(lo - up)];
  }
  function setUpper(cast, pose, limb, target) {
    const J = joints(cast, pose); const ang = U.angleOf(U.sub(target, J[limb].S));
    pose[limb][0] = U.normA(isArm(limb) ? ang - pose.torso : ang);
  }
  // rotate only the forearm / shin around the elbow / knee (any angle, either bend direction)
  function setLower(cast, pose, limb, target) {
    const J = joints(cast, pose); const L = J[limb];
    pose[limb][1] = U.normA(U.angleOf(U.sub(target, L.E)) - L.up);
  }
  // keep the hand/foot where it is but bend the elbow/knee the other way
  function flipBend(cast, pose, limb) {
    const J = joints(cast, pose); setByIK(cast, pose, limb, J[limb].H, -bendOf(J, limb));
  }
  function setTorso(cast, pose, target) { pose.torso = U.normA(U.angleOf(target)); }
  function setHead(cast, pose, target) { const J = joints(cast, pose); pose.head = U.normA(U.angleOf(U.sub(target, J.neck)) - pose.torso); }
  function mirror(pose) {
    const m = U.clone(pose);
    m.torso = U.normA(180 - pose.torso); m.head = -(pose.head || 0);
    m.armL = [-pose.armR[0], -pose.armR[1]]; m.armR = [-pose.armL[0], -pose.armL[1]];
    m.legL = [U.normA(180 - pose.legR[0]), -pose.legR[1]]; m.legR = [U.normA(180 - pose.legL[0]), -pose.legL[1]];
    m.feet = pose.feet === 'right' ? 'left' : pose.feet === 'left' ? 'right' : pose.feet;
    return m;
  }
  // presets are written as hand/foot targets (in limb-length units from shoulder/hip) and solved per character
  function fromPreset(cast, pr) {
    const pose = { torso: pr.torso ?? -90, head: pr.head ?? 0, armL: [210, 0], armR: [150, 0], legL: [100, 0], legR: [80, 0], feet: pr.feet || 'out' };
    const d = dims(cast);
    for (const [limb, key] of [['armL', 'hL'], ['armR', 'hR'], ['legL', 'fL'], ['legR', 'fR']]) {
      const tg = pr[key]; if (!tg) continue;
      const J = joints(cast, pose); const [a, b] = lens(d, limb); const S = J[limb].S;
      setByIK(cast, pose, limb, U.add(S, [tg[0] * (a + b), tg[1] * (a + b)]), tg[2]);
    }
    return pose;
  }

  function limb(pen, J, cast, name, feetMode) {
    const L = J[name]; const c = cast.color; const W = J.d.w; const k = J.d.k;
    const sleeve = cast.limbColor || c;
    pen.line([L.S, L.E, L.H], { stroke: sleeve, w: W });
    if (isArm(name)) pen.circ(L.H[0], L.H[1], 4.6 * k, { stroke: c, w: W * 0.8, fill: 'paper' });
    else {
      const side = name === 'legL' ? -1 : 1;
      const fd = feetMode === 'right' ? 1 : feetMode === 'left' ? -1 : side;
      const sc = cast.shoeColor || c;
      pen.ell(L.H[0] + fd * 6 * k, L.H[1] + 1.5 * k, 9 * k, 4.6 * k, { stroke: sc, w: W * 0.7, fill: sc });
    }
  }

  // parts: 'main' = everything except detached limbs, 'limbs' = only detached limbs
  function prims(cast, inst, parts = 'main') {
    const pen = new Pen({}); const J = joints(cast, inst.pose); const det = inst.detach || {};
    const feet = inst.pose.feet || 'out';
    if (parts === 'limbs') { for (const n of ['legL', 'legR', 'armL', 'armR']) if (det[n]) limb(pen, J, cast, n, feet); return pen.o; }
    const hm = !!cast.hairFlip !== !!inst.hairFlip; // hair side: character default, toggled per placement
    const cm = !!cast.capeFlip !== !!inst.capeFlip; // side of "sided" accessories (cape…), independent of the hair
    drawSlot(pen, J, cast, inst, 'base', cm);
    drawSlot(pen, J, cast, inst, 'back', cm);
    drawHair(pen, J, cast, 'back', hm);
    for (const n of ['legL', 'legR']) if (!det[n]) limb(pen, J, cast, n, feet);
    drawClothes(pen, J, cast);
    drawSlot(pen, J, cast, inst, 'body', cm);
    // head
    pen.circ(J.headC[0], J.headC[1], J.d.head, { stroke: cast.color, w: J.d.w, fill: 'paper' });
    if (cast.faceTint) pen.circ(J.headC[0], J.headC[1], J.d.head * 0.97, { stroke: false, fill: cast.faceTint, op: 0.22 });
    face(pen, J, cast, inst);
    drawSlot(pen, J, cast, inst, 'face', cm);
    drawHair(pen, J, cast, 'front', hm);
    drawSlot(pen, J, cast, inst, 'head', cm);
    for (const n of ['armL', 'armR']) if (!det[n]) limb(pen, J, cast, n, feet);
    return pen.o;
  }

  // ---- editing handles (shown on the selected figure) and what dragging them does ----
  // id: 'torso' / 'head' / 'up:<limb>' (elbow, knee) / 'ik:<limb>' (hand, foot)
  function handles(cast, pose) {
    const J = joints(cast, pose); const hs = [
      { id: 'torso', p: J.neck, color: '#16a34a' },
      { id: 'head', p: U.add(J.headC, U.mul(U.dir(J.headA), J.d.head * 0.6)), color: '#16a34a' },
    ];
    for (const L of LIMBS) hs.push({ id: 'up:' + L.id, p: J[L.id].E, color: '#2563eb' }, { id: 'ik:' + L.id, p: J[L.id].H, color: '#ea580c' });
    return hs;
  }
  // target = pointer position in the figure's local coords; o = { rotate: only turn the forearm/shin, bend: ±1 }
  function edit(cast, pose, id, target, o = {}) {
    if (id === 'torso') setTorso(cast, pose, target);
    else if (id === 'head') setHead(cast, pose, target);
    else if (id.startsWith('up:')) setUpper(cast, pose, id.slice(3), target);
    else if (id.startsWith('ik:')) { if (o.rotate) setLower(cast, pose, id.slice(3), target); else setByIK(cast, pose, id.slice(3), target, o.bend); }
  }
  const LIMBS = [
    { id: 'armL', label: 'Left arm', joint: 'L elbow' }, { id: 'armR', label: 'Right arm', joint: 'R elbow' },
    { id: 'legL', label: 'Left leg', joint: 'L knee' }, { id: 'legR', label: 'Right leg', joint: 'R knee' },
  ];

  CP.register({
    api: 1, version: '1.0.0', type: 'rig', id: 'biped', name: 'Person (stick figure)',
    expressions: EXPRESSIONS, limbs: LIMBS, builds: BUILDS, defaultBuild: 'child', buildNames: { child: 'Child', adult: 'Grown-up' },
    // which shared parts this rig can wear
    supports: { face: true, hair: true, clothes: true, accessories: true, feet: true },
    dims, joints, handles, edit, fromPreset, mirror, prims, bendOf: (cast, J, limb) => bendOf(J, limb), flipBend,
  });
})();
