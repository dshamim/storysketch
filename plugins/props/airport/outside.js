// Props: Airport — outside (aircraft, control tower, terminal building, runway, windsock).
// Floor props: origin = bottom centre (stands on y = 0). Aircraft face right; press H to face left.
// Scale: an adult character is about 310 tall, so a real-size aircraft would be huge — these are drawn
// small enough to sit in the background behind a window or across the tarmac.
(() => {
  const PACK = 'Airport props', CAT = 'Airport – outside';

  // ---------- aircraft ----------
  function aircraft(p, P) {
    const L = +P.length || 800; const prop = P.style === 'prop';
    const h = L * (prop ? 0.13 : 0.11);                 // fuselage height
    const gear = P.gear !== false;
    const yb = -L * (prop ? 0.075 : 0.085), yt = yb - h;  // fuselage bottom / top
    const N = L / 2, T = -L / 2;                        // nose x / tail x
    const line = { stroke: 'line', w: 4 };
    // wing on the far side (behind the body)
    if (!prop) p.poly([[-L * 0.02, yb - h * 0.3], [L * 0.1, yb - h * 0.3], [-L * 0.12, yb + h * 0.18], [-L * 0.2, yb + h * 0.18]], { ...line, w: 3, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.3 });
    // tail fin + tailplane
    p.poly([[T + L * 0.03, yt + h * 0.2], [T + L * 0.035, yt - h * (prop ? 1.1 : 1.5)], [T + L * 0.11, yt - h * (prop ? 1.1 : 1.5)], [T + L * 0.2, yt + h * 0.05]], { ...line, fill: 'paper', hatch: 'tail', hg: 4, halpha: 0.8 });
    // body
    const body = prop
      ? [[T, yt + h * 0.1], [N - h * 1.0, yt], [N - h * 0.35, yt + h * 0.2], [N - h * 0.05, yt + h * 0.55], [N - h * 0.3, yb], [T + L * 0.3, yb], [T + L * 0.03, yt + h * 0.45]]
      : [[T, yt + h * 0.12], [N - h * 1.4, yt], [N - h * 0.5, yt + h * 0.12], [N - h * 0.08, yt + h * 0.45], [N, yt + h * 0.7], [N - h * 0.25, yb - h * 0.05], [N - h * 0.8, yb], [T + L * 0.22, yb], [T + L * 0.02, yt + h * 0.38]];
    p.poly(body, { ...line, w: 4.5, fill: 'paper', hatch: 'body', hg: 7, halpha: 0.25, ha: 0 });
    // livery stripe along the body
    p.line([[T + L * 0.06, yt + h * 0.66], [N - h * 0.35, yt + h * 0.66]], { stroke: 'livery', w: Math.max(4, h * 0.12) });
    // tailplane on this side
    p.poly([[T + L * 0.02, yt + h * 0.35], [T + L * 0.12, yt + h * 0.3], [T + L * 0.13, yt + h * 0.45], [T + L * 0.04, yt + h * 0.48]], { ...line, w: 3, fill: 'paper', hatch: 'tail', hg: 4, halpha: 0.6 });
    // windows
    const wy = yt + h * 0.36, wr = Math.max(2.5, h * 0.07);
    const x0 = T + L * (prop ? 0.38 : 0.26), x1 = N - h * (prop ? 1.5 : 2.2); const gap = Math.max(wr * 3.2, L * (prop ? 0.05 : 0.024));
    for (let x = x0; x < x1; x += gap) p.ell(x, wy, wr * 0.85, wr * 1.1, { stroke: 'line', w: 2, fill: 'window' });
    // cockpit
    p.poly([[N - h * 1.0, yt + h * 0.2], [N - h * 0.55, yt + h * 0.2], [N - h * 0.3, yt + h * 0.38], [N - h * 0.95, yt + h * 0.38]], { stroke: 'line', w: 2.5, fill: 'window', smooth: false });
    // door (+ stairs)
    const dx = N - h * (prop ? 1.25 : 1.95), dw = h * (prop ? 0.38 : 0.32), dTop = yt + h * 0.12, dBot = yb - h * 0.12;
    if (P.door) p.rect(dx - dw / 2, dTop, dw, dBot - dTop, { stroke: 'line', w: 3, fill: '#5d4037', hatch: '#3e2723', hg: 3, halpha: 0.6 });
    else p.rect(dx - dw / 2, dTop, dw, dBot - dTop, { stroke: 'line', w: 2.5, smooth: true });
    if (prop) { // high wing on top with a strut, propeller on the nose
      p.poly([[-L * 0.12, yt - h * 0.05], [L * 0.16, yt - h * 0.05], [L * 0.16, yt - h * 0.22], [-L * 0.1, yt - h * 0.22]], { ...line, fill: 'paper', hatch: 'livery', hg: 5, halpha: 0.5 });
      p.line([[L * 0.02, yt - h * 0.05], [-L * 0.04, yb - h * 0.1]], { stroke: 'line', w: 3 });
      p.ell(N + h * 0.02, yt + h * 0.55, h * 0.12, h * 0.16, { ...line, w: 3, fill: 'tail' });
      p.ell(N + h * 0.12, yt + h * 0.55, h * 0.06, h * 0.9, { stroke: 'line', w: 2, hatch: 'line', hg: 3, halpha: 0.3 });
    } else { // engine under the wing
      p.poly([[-L * 0.02, yb - h * 0.05], [L * 0.12, yb - h * 0.02], [L * 0.13, yb + h * 0.5], [-L * 0.02, yb + h * 0.5]], { ...line, fill: 'paper', hatch: 'line', hg: 5, halpha: 0.35, smooth: true });
      p.ell(L * 0.125, yb + h * 0.24, h * 0.06, h * 0.26, { stroke: 'line', w: 2.5, fill: '#cfd8dc' });
      p.line([[L * 0.02, yb - h * 0.02], [L * 0.07, yb - h * 0.25]], { stroke: 'line', w: 3 }); // pylon
    }
    if (gear) {
      const r = Math.max(5, L * 0.012);
      const leg = (x, n) => { p.line([[x, yb], [x, -r]], { stroke: 'line', w: 3.5 }); for (let i = 0; i < n; i++) p.circ(x + (i - (n - 1) / 2) * r * 2.1, -r, r, { stroke: 'line', w: 3, fill: '#424242' }); };
      leg(N - h * (prop ? 0.7 : 1.1), 1); leg(prop ? -L * 0.05 : -L * 0.08, prop ? 1 : 2);
    }
    if (P.stairs && gear) { // boarding stairs on a little truck, up to the door
      const top = dBot, sx1 = dx - dw / 2 - 2, run = Math.abs(top) * 1.1, sx0 = sx1 - run; const s = { stroke: 'stairs', w: 3 };
      p.poly([[sx0, 0], [sx1, top], [sx1 + 6, top], [sx1 + 6, -14], [sx0 + 20, -14], [sx0 + 20, 0]], { ...s, fill: 'paper', hatch: 'stairs', hg: 5, halpha: 0.4 });
      const n = Math.max(4, Math.round(Math.abs(top) / 14)); for (let i = 1; i < n; i++) { const t = i / n; p.line([[U.lerp(sx0, sx1, t), U.lerp(0, top, t)], [U.lerp(sx0, sx1, t) + 12, U.lerp(0, top, t)]], { ...s, w: 2 }); }
      p.line([[sx0 + 4, -26], [sx1 - 2, top - 26], [sx1 - 2, top]], s); // hand rail
      for (const wx of [sx0 + 12, sx1 - 10]) p.circ(wx, -6, 6, { stroke: 'line', w: 2.5, fill: '#424242' });
    }
  }

  // ---------- control tower ----------
  function tower(p, P) {
    const H = +P.height || 460; const s = { stroke: 'line', w: 4 };
    const cabY = -H + 70;
    p.poly([[-26, 0], [-18, cabY + 30], [18, cabY + 30], [26, 0]], { ...s, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.3 });
    p.rect(-55, -16, 110, 16, { ...s, fill: 'paper', hatch: 'line', hg: 5, halpha: 0.3 }); // base building
    p.poly([[-40, cabY + 30], [40, cabY + 30], [50, cabY + 10], [-50, cabY + 10]], { ...s, fill: 'paper' });
    p.poly([[-50, cabY + 10], [50, cabY + 10], [60, cabY - 30], [-60, cabY - 30]], { ...s, fill: 'glass', hatch: 'line', hg: 6, halpha: 0.15 }); // glass cab
    for (let x = -36; x <= 36; x += 24) p.line([[x, cabY + 10], [x * 1.18, cabY - 30]], { stroke: 'line', w: 2.5 });
    p.poly([[-66, cabY - 30], [66, cabY - 30], [46, cabY - 44], [-46, cabY - 44]], { ...s, fill: 'paper', hatch: 'line', hg: 5, halpha: 0.5 });
    p.line([[0, cabY - 44], [0, -H]], { stroke: 'line', w: 3 }); p.circ(0, -H, 5, { stroke: 'light', w: 2, fill: 'light' });
  }

  // ---------- terminal building, seen from outside ----------
  function terminal(p, P) {
    const W = +P.width || 700, H = W * 0.24; const s = { stroke: 'line', w: 4 };
    p.rect(-W / 2, -H, W, H, { ...s, fill: 'paper', hatch: 'line', hg: 8, halpha: 0.2, ha: 0 });
    p.poly([[-W / 2 - 20, -H], [W / 2 + 20, -H], [W / 2, -H - 24], [-W / 2, -H - 24]], { ...s, fill: 'paper', hatch: 'roof', hg: 5, halpha: 0.6 }); // roof edge
    const gy0 = -H + 30, gy1 = -14; // glass front
    p.rect(-W / 2 + 20, gy0, W - 40, gy1 - gy0, { stroke: 'line', w: 3, fill: 'glass', hatch: 'line', hg: 7, halpha: 0.12 });
    for (let x = -W / 2 + 20 + 44; x < W / 2 - 20; x += 44) p.line([[x, gy0], [x, gy1]], { stroke: 'line', w: 2 });
    // sign with a little aircraft
    p.rect(-60, -H - 10, 120, 30, { stroke: 'sign', w: 3, fill: 'paper', hatch: 'sign', hg: 3, halpha: 0.7 });
    planeIcon(p, 0, -H + 5, 22, '#ffffff');
    if (P.jetbridge) { // a covered walkway reaching out from the right-hand end
      const y0 = -H + 34; p.poly([[W / 2, y0], [W / 2 + W * 0.3, y0 + 8], [W / 2 + W * 0.3, y0 + 46], [W / 2, y0 + 46]], { ...s, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.3 });
      p.line([[W / 2 + W * 0.25, y0 + 46], [W / 2 + W * 0.25, 0]], { stroke: 'line', w: 4 }); p.circ(W / 2 + W * 0.25, -6, 6, { stroke: 'line', w: 2.5, fill: '#424242' });
    }
  }

  // a simple aircraft symbol (top view), used on signs; centre (x, y), size s
  function planeIcon(p, x, y, s, c) {
    const P = (u, v) => [x + u * s, y + v * s];
    p.poly([P(0.5, 0), P(0.35, -0.08), P(0.1, -0.08), P(-0.1, -0.5), P(-0.22, -0.5), P(-0.12, -0.08), P(-0.38, -0.08), P(-0.48, -0.24), P(-0.55, -0.24), P(-0.5, 0),
      P(-0.55, 0.24), P(-0.48, 0.24), P(-0.38, 0.08), P(-0.12, 0.08), P(-0.22, 0.5), P(-0.1, 0.5), P(0.1, 0.08), P(0.35, 0.08)], { stroke: c, w: 2, fill: c, smooth: false });
  }
  CP.helpers.planeIcon = planeIcon;

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'aircraft', name: 'Aircraft', cat: CAT,
      colors: { line: '#546e7a', body: '#90a4ae', livery: '#1e88e5', tail: '#e53935', window: '#bbdefb', stairs: '#757575' },
      params: [
        { key: 'style', label: 'Aircraft', type: 'select', def: 'jet', options: { jet: 'Passenger jet', prop: 'Small propeller plane' } },
        { key: 'length', label: 'Size', type: 'range', min: 200, max: 1600, step: 20, def: 800 },
        { key: 'gear', label: 'Wheels down', type: 'toggle', def: true },
        { key: 'door', label: 'Door open', type: 'toggle', def: false },
        { key: 'stairs', label: 'Boarding stairs', type: 'toggle', def: false, when: { gear: true } },
      ],
      draw(p, P) { aircraft(p, P); } },
    { type: 'prop', id: 'ctower', name: 'Control tower', cat: CAT,
      colors: { line: '#607d8b', glass: '#b3e5fc', light: '#e53935' },
      params: [{ key: 'height', label: 'Height', type: 'range', min: 200, max: 700, step: 10, def: 420 }],
      draw(p, P) { tower(p, P); } },
    { type: 'prop', id: 'terminalbldg', name: 'Terminal building (outside)', cat: CAT,
      colors: { line: '#78909c', roof: '#546e7a', glass: '#b3e5fc', sign: '#1e88e5' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 300, max: 1200, step: 20, def: 700 }, { key: 'jetbridge', label: 'Boarding bridge', type: 'toggle', def: true }],
      draw(p, P) { terminal(p, P); } },
    { type: 'prop', id: 'runway', name: 'Runway / tarmac', cat: CAT,
      colors: { line: '#757575', paint: '#fbc02d', lights: '#43a047' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 300, max: 1400, step: 20, def: 1000 }, { key: 'depth', label: 'Depth', type: 'range', min: 30, max: 260, step: 10, def: 90 }, { key: 'lights', label: 'Edge lights', type: 'toggle', def: true }],
      draw(p, P) {
        const W = +P.width || 1000, D = +P.depth || 90;
        p.poly([[-W / 2, 0], [W / 2, 0], [W / 2 - D * 0.3, -D], [-W / 2 + D * 0.3, -D]], { stroke: 'line', w: 3, fill: 'paper', hatch: 'line', hg: 6, halpha: 0.3, ha: 0 });
        for (let x = -W / 2 + 30; x < W / 2 - 50; x += 90) p.line([[x, -D / 2], [x + 50, -D / 2]], { stroke: 'paint', w: 5 });
        if (P.lights !== false) for (let x = -W / 2 + 20; x < W / 2; x += 70) { p.circ(x, -3, 4, { stroke: 'lights', w: 2, fill: 'lights' }); p.circ(x * (1 - D * 0.3 / W * 2) , -D + 3, 3, { stroke: 'lights', w: 2, fill: 'lights' }); }
      } },
    { type: 'prop', id: 'windsock', name: 'Windsock', cat: CAT,
      colors: { line: '#616161', sock: '#fb8c00' },
      params: [{ key: 'wind', label: 'Wind', type: 'select', def: 'breeze', options: { calm: 'Calm (hangs down)', breeze: 'Breezy', strong: 'Strong' } }],
      draw(p, P) {
        p.line([[0, 0], [0, -200]], { stroke: 'line', w: 5 }); p.circ(0, -200, 4, { stroke: 'line', w: 2, fill: 'line' });
        const a = P.wind === 'calm' ? 75 : P.wind === 'strong' ? 5 : 30; const L = 90; const d = U.dir(a), n = [-d[1], d[0]];
        const pt = (t, r) => [d[0] * L * t + n[0] * r, -195 + d[1] * L * t + n[1] * r];
        for (let i = 0; i < 4; i++) { const t0 = i / 4, t1 = (i + 1) / 4, r0 = 16 - t0 * 8, r1 = 16 - t1 * 8; p.poly([pt(t0, -r0), pt(t1, -r1), pt(t1, r1), pt(t0, r0)], { stroke: 'sock', w: 3, fill: i % 2 ? 'paper' : 'sock', hatch: 'sock', hg: 3, halpha: 0.6, smooth: false }); }
      } },
  ] });
})();
