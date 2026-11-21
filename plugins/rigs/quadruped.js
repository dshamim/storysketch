// Rig: Four-legged animal — side view, facing right (use the figure's flip to face left).
// One skeleton for a dog, a dinosaur, a cat, a horse…: a spine from hip to shoulder, a neck, a head with a snout, a
// two-bone tail and four two-bone legs. Builds (dimensions) turn it into different animals: see BUILDS.
// Local coords: origin = hip, y down. Angles in degrees, 0 = right, 90 = down, -90 = up.
// Pose: { spine, neck, head (all absolute), tail:[absolute, relative], frontFar, frontNear, backFar, backNear: [upperAbs, lowerRelUpper] }
(() => {
  const { faceFrame, drawSlot } = PARTS;
  // dims (all scaled by the character's height): body = hip→shoulder, neck, head radius, snout length (in head radii),
  // tail = [base, tip], up/lo = upper/lower leg, depth = body thickness, w = line width, ear / plates = extras
  const BUILDS = {
    dog:  { body: 96,  neck: 30, head: 24, snout: 0.9,  tail: [30, 28], up: 36, lo: 36, depth: 46, w: 5, ear: 1, plates: 0 },
    cat:  { body: 78,  neck: 24, head: 21, snout: 0.45, tail: [42, 40], up: 32, lo: 32, depth: 36, w: 5, ear: 2, plates: 0 },
    dino: { body: 120, neck: 74, head: 24, snout: 1.15, tail: [64, 56], up: 42, lo: 40, depth: 62, w: 5, ear: 0, plates: 6 },
  };
  const BUILD_NAMES = { dog: 'Dog', cat: 'Cat', dino: 'Dinosaur (long neck and tail)' };
  const EXPRESSIONS = { happy: 'Happy', panting: 'Panting', neutral: 'Neutral', sad: 'Sad', surprised: 'Surprised', sleepy: 'Sleepy' };
  const LIMBS = [
    { id: 'frontFar', label: 'Front leg (far side)', joint: 'Far front knee', far: true, front: true },
    { id: 'frontNear', label: 'Front leg (near side)', joint: 'Near front knee', front: true },
    { id: 'backFar', label: 'Back leg (far side)', joint: 'Far back knee', far: true },
    { id: 'backNear', label: 'Back leg (near side)', joint: 'Near back knee' },
  ];
  const STAND = { spine: -2, neck: -55, head: 5, tail: [205, 25], frontFar: [94, 0], frontNear: [88, 0], backFar: [66, 38], backNear: [72, 34] };

  function dims(cast) {
    const b = BUILDS[cast.build] || BUILDS.dog; const k = cast.height || 1; const o = {};
    for (const key in b) o[key] = key === 'w' ? b.w * (cast.weight || 1) : Array.isArray(b[key]) ? b[key].map((v) => v * k) : (key === 'ear' || key === 'plates') ? b[key] : b[key] * k;
    o.k = k; return o;
  }

  function joints(cast, pose) {
    const d = dims(cast); const hip = [0, 0];
    const shoulder = U.add(hip, U.mul(U.dir(pose.spine), d.body));
    const neckEnd = U.add(shoulder, U.mul(U.dir(pose.neck), d.neck));
    const headC = U.add(neckEnd, U.mul(U.dir(pose.head), d.head * 0.9));
    const t1 = U.add(hip, U.mul(U.dir(pose.tail[0]), d.tail[0])); const t2 = U.add(t1, U.mul(U.dir(pose.tail[0] + pose.tail[1]), d.tail[1]));
    const J = { d, T: pose.spine, t: [0, -1], p: [1, 0], hip, neck: shoulder, shoulder, neckEnd, headC, headA: pose.head - 90, tail: [t1, t2] };
    // legs hang from the hip (back) and just behind the shoulder (front); far-side legs are nudged forward so both show
    for (const L of LIMBS) {
      const root = L.front ? U.lerp2(hip, shoulder, 0.88) : U.lerp2(hip, shoulder, 0.1);
      const S = U.add(root, [(L.far ? 7 : -3) * d.k, 0]);
      const a = pose[L.id]; const up = a[0]; const E = U.add(S, U.mul(U.dir(up), d.up)); const lo = up + a[1]; const H = U.add(E, U.mul(U.dir(lo), d.lo));
      J[L.id] = { S, E, H, up, lo };
    }
    return J;
  }

  const bendOf = (cast, J, id) => { const L = J[id]; const e = U.sub(L.E, L.S), h = U.sub(L.H, L.S); return (e[0] * h[1] - e[1] * h[0]) < 0 ? 1 : -1; };
  function setLegIK(cast, pose, id, target, bend) {
    const J = joints(cast, pose); const [up, lo] = U.solve2(J[id].S, target, J.d.up, J.d.lo, bend ?? bendOf(cast, J, id));
    pose[id] = [U.normA(up), U.normA(lo - up)];
  }
  const flipBend = (cast, pose, id) => { const J = joints(cast, pose); setLegIK(cast, pose, id, J[id].H, -bendOf(cast, J, id)); };

  function handles(cast, pose) {
    const J = joints(cast, pose); const hs = [
      { id: 'spine', p: J.shoulder, color: '#16a34a' }, { id: 'neck', p: J.neckEnd, color: '#16a34a' },
      { id: 'head', p: U.add(J.headC, U.mul(U.dir(pose.head), J.d.head * 0.9)), color: '#16a34a' },
      { id: 'tail:0', p: J.tail[0], color: '#2563eb' }, { id: 'tail:1', p: J.tail[1], color: '#ea580c' },
    ];
    for (const L of LIMBS) hs.push({ id: 'up:' + L.id, p: J[L.id].E, color: '#2563eb' }, { id: 'ik:' + L.id, p: J[L.id].H, color: '#ea580c' });
    return hs;
  }
  // target = pointer in the figure's local coords; o = { rotate: only turn the lower leg, bend: ±1 }
  function edit(cast, pose, id, target, o = {}) {
    const J = joints(cast, pose); const ang = (from) => U.angleOf(U.sub(target, from));
    if (id === 'spine') pose.spine = U.clamp(U.normA(ang(J.hip)), -80, 80);
    else if (id === 'neck') pose.neck = U.normA(ang(J.shoulder));
    else if (id === 'head') pose.head = U.normA(ang(J.neckEnd));
    else if (id === 'tail:0') pose.tail[0] = U.normA(ang(J.hip));
    else if (id === 'tail:1') pose.tail[1] = U.normA(ang(J.tail[0]) - pose.tail[0]);
    else if (id.startsWith('up:')) { const l = id.slice(3); pose[l][0] = U.normA(ang(J[l].S)); }
    else if (id.startsWith('ik:')) { const l = id.slice(3); if (o.rotate) pose[l][1] = U.normA(ang(J[l].E) - J[l].up); else setLegIK(cast, pose, l, target, o.bend); }
  }
  function mirror(pose) {
    const m = U.clone(pose); const f = (a) => U.normA(180 - a);
    m.spine = f(pose.spine); m.neck = f(pose.neck); m.head = f(pose.head); m.tail = [f(pose.tail[0]), -pose.tail[1]];
    for (const L of LIMBS) m[L.id] = [f(pose[L.id][0]), -pose[L.id][1]];
    return m;
  }
  // presets are plain pose data (angles), merged over a standing pose
  function fromPreset(cast, pr) {
    const pose = U.clone(STAND);
    for (const k of Object.keys(STAND)) if (pr[k] != null) pose[k] = U.clone(pr[k]);
    return pose;
  }

  // ---- drawing ----
  const circPts = (c, r, n = 14) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; });
  const hullOf = (...circles) => U.hull(circles.flatMap(([c, r]) => circPts(c, r)));

  function leg(pen, J, cast, id) {
    const L = J[id]; const c = cast.color, W = J.d.w, k = J.d.k;
    pen.line([L.S, L.E, L.H], { stroke: cast.limbColor || c, w: W * 1.1 });
    pen.ell(L.H[0] + 4 * k, L.H[1] + 1.5 * k, 8 * k, 4.4 * k, { stroke: cast.shoeColor || c, w: W * 0.7, fill: 'paper' }); // paw
  }

  function head(pen, J, cast, inst) {
    const { F, R } = faceFrame(J); const c = cast.color, W = J.d.w, d = J.d; const S = d.snout;
    const tipX = 0.55 + S * 1.2; const ex = inst.expr || 'happy';
    const skull = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return F(Math.cos(a), Math.sin(a)); });
    const snout = Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return F(0.55 + S * 0.6 + S * 0.6 * Math.cos(a), 0.2 + 0.42 * Math.sin(a)); });
    pen.poly(U.hull([...skull, ...snout]), { stroke: c, w: W, fill: 'paper', smooth: true });
    if (cast.faceTint) pen.poly(U.hull([...skull, ...snout]), { stroke: false, fill: cast.faceTint, op: 0.22, smooth: true });
    // ears: floppy (dog) or pointed (cat); none for a dinosaur
    if (d.ear === 1) pen.poly([F(-0.05, -0.8), F(-0.85, -0.55), F(-1.0, 0.3), F(-0.45, 0.15)], { stroke: c, w: W, fill: 'paper', smooth: true });
    if (d.ear === 2) { pen.poly([F(-0.7, -0.5), F(-0.55, -1.5), F(0.05, -0.95)], { stroke: c, w: W, fill: 'paper' }); pen.poly([F(0.1, -0.95), F(0.55, -1.5), F(0.8, -0.5)], { stroke: c, w: W, fill: 'paper' }); }
    // eye + nose
    if (ex === 'sleepy') pen.line([F(0.2, -0.22), F(0.5, -0.22)], { stroke: c, w: W * 0.8 });
    else pen.circ(...F(0.38, -0.24), R * (ex === 'surprised' ? 0.17 : 0.11), { stroke: c, w: 1, fill: c });
    if (ex === 'sad') pen.line([F(0.15, -0.5), F(0.55, -0.42)], { stroke: c, w: W * 0.7 });
    pen.ell(...F(tipX - 0.05, 0.08), R * 0.15, R * 0.12, { stroke: c, w: 1, fill: c });
    // mouth
    const mx0 = tipX - 0.2, mx1 = 0.5; const my = 0.5;
    switch (ex) {
      case 'happy': pen.curve([F(mx0, my - 0.05), F((mx0 + mx1) / 2, my + 0.2), F(mx1, my + 0.02)], { stroke: c, w: W * 0.8 }); break;
      case 'panting': pen.poly([F(mx0, my - 0.05), F((mx0 + mx1) / 2, my + 0.3), F(mx1, my + 0.0)], { stroke: c, w: W * 0.8, fill: 'paper', smooth: true });
        pen.ell(...F((mx0 + mx1) / 2, my + 0.38), R * 0.2, R * 0.28, { stroke: '#e57373', w: W * 0.6, fill: '#ef9a9a' }); break;
      case 'sad': pen.curve([F(mx0, my + 0.12), F((mx0 + mx1) / 2, my - 0.06), F(mx1, my + 0.1)], { stroke: c, w: W * 0.8 }); break;
      case 'surprised': pen.ell(...F((mx0 + mx1) / 2, my + 0.08), R * 0.2, R * 0.2, { stroke: c, w: W * 0.8, fill: 'paper' }); break;
      default: pen.line([F(mx0, my), F(mx1, my)], { stroke: c, w: W * 0.8 });
    }
  }

  function prims(cast, inst, parts = 'main') {
    const pen = new Pen({}); const J = joints(cast, inst.pose); const det = inst.detach || {}; const c = cast.color, W = J.d.w, d = J.d;
    if (parts === 'limbs') { for (const L of LIMBS) if (det[L.id]) leg(pen, J, cast, L.id); return pen.o; }
    const cm = !!cast.capeFlip !== !!inst.capeFlip;
    drawSlot(pen, J, cast, inst, 'base', cm);
    for (const L of LIMBS) if (L.far && !det[L.id]) leg(pen, J, cast, L.id);
    // back plates (dinosaur): triangles along the spine, behind the body
    for (let i = 0; i < d.plates; i++) {
      const t = (i + 0.7) / (d.plates + 0.4); const P = U.lerp2(J.hip, J.shoulder, t); const h = d.depth * (0.42 + 0.3 * Math.sin(Math.PI * t)); const w = d.body / d.plates * 0.42;
      pen.poly([[P[0] - w, P[1] - d.depth * 0.35], [P[0], P[1] - d.depth * 0.35 - h], [P[0] + w, P[1] - d.depth * 0.35]], { stroke: cast.accentColor || c, w: W * 0.9, fill: 'paper', hatch: c, hg: 5, halpha: 0.5 });
    }
    drawSlot(pen, J, cast, inst, 'back', cm);
    pen.curve([J.hip, ...J.tail], { stroke: c, w: W * 1.25 }); // tail
    const nr = d.depth * 0.3, nr2 = d.depth * 0.2; const hatch = cast.hatchBody !== false ? { hatch: c, hg: 7, halpha: 0.25, ha: -50 } : {};
    pen.poly(hullOf([J.shoulder, nr], [J.neckEnd, nr2]), { stroke: c, w: W, fill: 'paper', smooth: true, ...hatch }); // neck
    pen.poly(hullOf([J.hip, d.depth * 0.5], [J.shoulder, d.depth * 0.55]), { stroke: c, w: W, fill: 'paper', smooth: true, ...hatch }); // body
    // erase the chest outline where the neck joins the body
    const nd = U.dir(inst.pose.neck); pen.circ(...U.add(J.shoulder, U.mul(nd, d.depth * 0.5)), nr * 0.75, { stroke: false, fill: 'paper', ...hatch });
    drawSlot(pen, J, cast, inst, 'body', cm);
    head(pen, J, cast, inst);
    drawSlot(pen, J, cast, inst, 'face', cm); drawSlot(pen, J, cast, inst, 'head', cm);
    for (const L of LIMBS) if (!L.far && !det[L.id]) leg(pen, J, cast, L.id);
    return pen.o;
  }

  CP.register({
    api: 1, version: '1.0.0', type: 'rig', id: 'quadruped', name: 'Four-legged animal', defaultBuild: 'dog', buildNames: BUILD_NAMES,
    expressions: EXPRESSIONS, limbs: LIMBS, builds: BUILDS,
    supports: { face: false, hair: false, clothes: false, accessories: true, feet: false },
    dims, joints, handles, edit, fromPreset, mirror, prims, bendOf, flipBend,
  });
})();
