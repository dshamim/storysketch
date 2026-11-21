// Props: Airport — inside the terminal (window wall, departures board, check-in desk, seats, suitcases,
// trolley, signs, security scanner, baggage belt, passport & boarding pass).
// Floor props: origin = bottom centre (stands on y = 0). Wall / hanging / hand-held props: origin = centre.
// Scale: an adult character is about 310 tall, a child about 240.
(() => {
  const PACK = 'Airport props', CAT = 'Airport – inside';
  const { PAL } = CP.helpers;
  const icon = (p, x, y, s, c) => CP.helpers.planeIcon && CP.helpers.planeIcon(p, x, y, s, c);
  const squiggle = (p, x0, x1, y, c, w = 2.5) => { const pts = []; for (let x = x0, i = 0; x <= x1; x += 6, i++) pts.push([x, y + (i % 2 ? -3 : 3)]); p.curve(pts, { stroke: c, w }); };

  // ---------- suitcase (also used on the trolley and the baggage belt) ----------
  function suitcase(p, x, y, P, c) {
    const sz = { small: 0.75, medium: 1, large: 1.3 }[P.size || 'medium'] || 1; const st = P.style || 'wheels';
    const s = { stroke: c, w: 3.5 }; const trim = p.c.trim || '#424242';
    if (st === 'duffel') {
      const w = 110 * sz, h = 50 * sz;
      p.poly([[x - w / 2, y - 8], [x - w / 2 + 6, y - h], [x + w / 2 - 6, y - h], [x + w / 2, y - 8], [x + w / 2 - 8, y], [x - w / 2 + 8, y]], { ...s, fill: 'paper', hatch: c, hg: 4, halpha: 0.55, smooth: true });
      p.line([[x - w / 2 + 14, y - h + 6], [x + w / 2 - 14, y - h + 6]], { stroke: trim, w: 2.5 });
      p.curve([[x - 22 * sz, y - h], [x, y - h - 26 * sz], [x + 22 * sz, y - h]], { stroke: trim, w: 4 });
      return;
    }
    const w = (st === 'hard' ? 70 : 60) * sz, h = (st === 'hard' ? 95 : 82) * sz, wh = st === 'wheels' ? 8 : 0;
    p.rect(x - w / 2, y - h - wh, w, h, { ...s, fill: 'paper', hatch: c, hg: 4, halpha: 0.6, smooth: st === 'soft' });
    if (st === 'hard') for (const dx of [-w / 4, 0, w / 4]) p.line([[x + dx, y - h - wh + 6], [x + dx, y - wh - 6]], { stroke: c, w: 2 });
    else { p.line([[x - w / 2 + 6, y - h * 0.55 - wh], [x + w / 2 - 6, y - h * 0.55 - wh]], { stroke: trim, w: 2.5 }); }
    if (st === 'wheels' || st === 'hard') {
      for (const dx of [-w / 2 + 8, w / 2 - 8]) p.circ(x + dx, y - 5, 5, { stroke: '#424242', w: 2.5, fill: '#424242' });
      if (P.handle !== false) { const top = y - h - wh - 45 * sz; p.line([[x - 10, y - h - wh], [x - 10, top], [x + 10, top], [x + 10, y - h - wh]], { stroke: '#616161', w: 3 }); }
      else p.rect(x - 12, y - h - wh - 7, 24, 7, { stroke: '#616161', w: 2.5 });
    } else p.curve([[x - 14, y - h], [x, y - h - 14], [x + 14, y - h]], { stroke: trim, w: 4 });
    if (P.stickers) { p.circ(x - w * 0.18, y - h * 0.3 - wh, 7 * sz, { stroke: '#fbc02d', w: 2, fill: '#fbc02d' }); p.rect(x + w * 0.05, y - h * 0.82 - wh, 16 * sz, 10 * sz, { stroke: '#43a047', w: 2, fill: '#43a047' }); }
    if (P.tag) { p.line([[x + w / 2 - 8, y - h - wh], [x + w / 2 + 4, y - h - wh + 14]], { stroke: '#616161', w: 1.5 }); p.rect(x + w / 2 - 2, y - h - wh + 14, 14, 20, { stroke: '#e53935', w: 2, fill: 'paper' }); }
  }

  // ---------- one airport seat, front view ----------
  function seat(p, x, c) {
    p.poly([[x - 28, -60], [x + 28, -60], [x + 26, -125], [x - 26, -125]], { stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 4, halpha: 0.6, smooth: true }); // back
    p.poly([[x - 32, -62], [x + 32, -62], [x + 30, -46], [x - 30, -46]], { stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 4, halpha: 0.75, smooth: true }); // seat
  }

  CP.register({ api: 1, version: '1.0.0', pack: PACK, items: [
    { type: 'prop', id: 'airportwindow', name: 'Big window (terminal glass)', cat: CAT,
      colors: { frame: '#607d8b', glass: '#b3e5fc' },
      params: [
        { key: 'width', label: 'Width', type: 'range', min: 300, max: 1200, step: 20, def: 900 },
        { key: 'height', label: 'Height', type: 'range', min: 200, max: 700, step: 10, def: 440 },
        { key: 'panes', label: 'Panes', type: 'range', min: 1, max: 10, step: 1, def: 4 },
        { key: 'sill', label: 'Low wall under the glass', type: 'toggle', def: true },
        { key: 'tint', label: 'Glass shine', type: 'toggle', def: true },
      ],
      draw(p, P) { // see-through: put an aircraft or tower BEHIND it (send it backward) to show the view
        const W = +P.width || 900, H = +P.height || 440, n = +P.panes || 4, sill = P.sill !== false ? 50 : 0; const f = { stroke: 'frame', w: 6 };
        const y0 = -H, y1 = -sill;
        if (sill) p.rect(-W / 2 - 10, -sill, W + 20, sill, { stroke: 'frame', w: 4, fill: 'paper', hatch: 'frame', hg: 7, halpha: 0.35, ha: 0 });
        p.rect(-W / 2, y0, W, y1 - y0, { ...f, w: 8 });
        for (let i = 1; i < n; i++) { const x = -W / 2 + W * i / n; p.line([[x, y0], [x, y1]], f); }
        p.line([[-W / 2, y0 + (y1 - y0) * 0.18], [W / 2, y0 + (y1 - y0) * 0.18]], { stroke: 'frame', w: 4 }); // transom
        if (P.tint !== false) for (let i = 0; i < n; i++) { const x = -W / 2 + W * (i + 0.2) / n; const pw = W / n; p.line([[x, y1 - 30], [x + pw * 0.25, y1 - (y1 - y0) * 0.45]], { stroke: 'glass', w: 5 }); p.line([[x + pw * 0.12, y1 - 20], [x + pw * 0.3, y1 - (y1 - y0) * 0.28]], { stroke: 'glass', w: 3 }); }
      } },

    { type: 'prop', id: 'departures', name: 'Departures board', cat: CAT,
      colors: { frame: '#37474f', screen: '#263238', text: '#fff59d', ok: '#66bb6a', late: '#ef5350' },
      params: [
        { key: 'rows', label: 'Flights', type: 'range', min: 2, max: 8, step: 1, def: 5 },
        { key: 'hang', label: 'Hanging from the ceiling', type: 'toggle', def: true },
        { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 },
      ],
      draw(p, P, it) {
        const n = +P.rows || 5, W = 340, rh = 30, H = 46 + n * rh + 10; const r = U.rng(U.hash(it.id + ':' + (P.shuffle || 1)));
        const x0 = -W / 2, y0 = -H / 2;
        if (P.hang !== false) for (const x of [x0 + 40, -x0 - 40]) p.line([[x, y0], [x, y0 - 120]], { stroke: 'frame', w: 3 });
        p.rect(x0, y0, W, H, { stroke: 'frame', w: 6, fill: 'screen' });
        icon(p, x0 + 26, y0 + 22, 26, p.col('text')); squiggle(p, x0 + 48, x0 + 170, y0 + 22, p.col('text'), 3); // "DEPARTURES"
        p.line([[x0 + 8, y0 + 40], [x0 + W - 8, y0 + 40]], { stroke: 'text', w: 1.5 });
        for (let i = 0; i < n; i++) {
          const y = y0 + 48 + i * rh, tc = p.col('text');
          const hh = String(7 + Math.floor(r() * 14)).padStart(2, '0'), mm = String(Math.floor(r() * 12) * 5).padStart(2, '0');
          p.text(hh, x0 + 26, y, 16, { stroke: tc, w: 2.2 }); p.circ(x0 + 43, y + 5, 1.5, { stroke: tc, w: 1, fill: tc }); p.circ(x0 + 43, y + 12, 1.5, { stroke: tc, w: 1, fill: tc }); p.text(mm, x0 + 60, y, 16, { stroke: tc, w: 2.2 });
          squiggle(p, x0 + 84, x0 + 84 + 60 + r() * 70, y + 8, tc); // destination
          p.text('ABC'[Math.floor(r() * 3)] + (1 + Math.floor(r() * 30)), x0 + 250, y, 16, { stroke: tc, w: 2.2 }); // gate
          const st = r(); p.rect(x0 + 286, y + 1, 40, 14, { stroke: st < 0.2 ? 'late' : 'ok', w: 2, fill: st < 0.2 ? 'late' : 'ok' });
        }
      } },

    { type: 'prop', id: 'checkin', name: 'Check-in desk', cat: CAT,
      colors: { desk: '#1e88e5', top: '#90a4ae', sign: '#fbc02d', belt: '#616161' },
      params: [
        { key: 'number', label: 'Desk number', type: 'range', min: 1, max: 40, step: 1, def: 12 },
        { key: 'belt', label: 'Bag belt & scale', type: 'toggle', def: true },
        { key: 'screen', label: 'Computer screen', type: 'toggle', def: true },
      ],
      draw(p, P) {
        const s = { stroke: 'desk', w: 4 };
        p.line([[-70, -150], [-70, -330]], { stroke: '#757575', w: 4 }); // sign pole
        p.rect(-112, -380, 84, 52, { stroke: 'sign', w: 3.5, fill: 'paper', hatch: 'sign', hg: 3, halpha: 0.8 });
        p.text(String(+P.number || 12), -70, -370, 32, { stroke: '#212121', w: 4 });
        p.rect(-130, -150, 200, 150, { ...s, fill: 'paper', hatch: 'desk', hg: 6, halpha: 0.45 });
        p.rect(-140, -162, 220, 14, { stroke: 'top', w: 3.5, fill: 'top' });
        p.line([[-110, -80], [50, -80]], { stroke: 'desk', w: 3 }); icon(p, -30, -112, 34, p.col('desk'));
        if (P.screen !== false) { p.rect(-10, -226, 70, 48, { stroke: '#424242', w: 3.5, fill: '#cfd8dc' }); p.line([[25, -178], [25, -162]], { stroke: '#424242', w: 4 }); }
        if (P.belt !== false) {
          p.rect(80, -62, 130, 62, { stroke: 'belt', w: 3.5, fill: 'paper', hatch: 'belt', hg: 5, halpha: 0.4 });
          p.rect(76, -72, 138, 12, { stroke: 'belt', w: 3, fill: '#424242' });
          for (let x = 90; x < 210; x += 16) p.line([[x, -71], [x, -61]], { stroke: '#9e9e9e', w: 1.5 });
          p.rect(120, -48, 50, 22, { stroke: '#212121', w: 2, fill: '#212121' }); p.text('0', 145, -45, 14, { stroke: '#66bb6a', w: 2 });
        }
      } },

    { type: 'prop', id: 'airportseats', name: 'Waiting seats (row)', cat: CAT,
      colors: { seat: '#1e88e5', frame: '#757575' },
      params: [{ key: 'count', label: 'Seats', type: 'range', min: 1, max: 8, step: 1, def: 4 }, { key: 'bag', label: 'Bag left on a seat', type: 'toggle', def: false }],
      draw(p, P) {
        const n = +P.count || 4, gap = 72, W = (n - 1) * gap; const fr = { stroke: 'frame', w: 4 };
        p.line([[-W / 2 - 40, -40], [W / 2 + 40, -40]], { stroke: 'frame', w: 6 }); // beam
        for (const x of [-W / 2 - 10, W / 2 + 10]) { p.line([[x, -40], [x - 18, 0]], fr); p.line([[x, -40], [x + 18, 0]], fr); }
        for (let i = 0; i < n; i++) seat(p, -W / 2 + i * gap, p.col('seat'));
        for (let i = 0; i <= n; i++) { const x = -W / 2 - gap / 2 + i * gap; p.line([[x, -46], [x, -80], [x + (i === 0 ? 8 : i === n ? -8 : 0), -82]], { stroke: 'frame', w: 3.5 }); } // armrests
        if (P.bag) suitcase(p, -W / 2 + Math.min(1, n - 1) * gap, -62, { style: 'duffel', size: 'small' }, '#8e24aa');
      } },

    { type: 'prop', id: 'suitcase', name: 'Suitcase / bag', cat: CAT,
      colors: { case: '#e53935', trim: '#424242' },
      params: [
        { key: 'style', label: 'Bag', type: 'select', def: 'wheels', options: { wheels: 'Wheelie case', hard: 'Hard case', soft: 'Soft case (carry handle)', duffel: 'Holdall / duffel bag' } },
        { key: 'size', label: 'Size', type: 'select', def: 'medium', options: { small: 'Small (cabin bag)', medium: 'Medium', large: 'Large' } },
        { key: 'handle', label: 'Pull handle up', type: 'toggle', def: true, when: { style: ['wheels', 'hard'] } },
        { key: 'stickers', label: 'Stickers', type: 'toggle', def: false, when: { style: ['wheels', 'hard', 'soft'] } },
        { key: 'tag', label: 'Luggage tag', type: 'toggle', def: true, when: { style: ['wheels', 'hard', 'soft'] } },
      ],
      draw(p, P) { suitcase(p, 0, 0, P, p.col('case')); } },

    { type: 'prop', id: 'trolley', name: 'Luggage trolley', cat: CAT,
      colors: { frame: '#757575' },
      params: [{ key: 'bags', label: 'Bags on it', type: 'range', min: 0, max: 3, step: 1, def: 2 }, { key: 'shuffle', label: 'Shuffle colours', type: 'range', min: 1, max: 20, step: 1, def: 1 }],
      draw(p, P, it) {
        const r = U.rng(U.hash(it.id + ':' + (P.shuffle || 1))); const f = { stroke: 'frame', w: 4 };
        p.line([[-70, -22], [70, -22]], { stroke: 'frame', w: 5 }); // base
        p.line([[60, -22], [80, -150], [100, -160]], f); p.line([[80, -150], [70, -168]], f); // handle
        for (const x of [-55, 55]) p.circ(x, -9, 9, { stroke: '#424242', w: 3, fill: '#424242' });
        const bags = +P.bags; let y = -24;
        const styles = [{ style: 'hard', size: 'large', handle: false }, { style: 'soft', size: 'medium' }, { style: 'duffel', size: 'small' }];
        for (let i = 0; i < bags; i++) { // stacked lying down: draw rotated by swapping width and height with simple boxes
          const c = PAL[Math.floor(r() * PAL.length)];
          if (i === 2) { suitcase(p, -6, y, styles[2], c); break; }
          const w = i ? 110 : 130, h = i ? 40 : 50; p.rect(-w / 2 - 8, y - h, w, h, { stroke: c, w: 3.5, fill: 'paper', hatch: c, hg: 4, halpha: 0.6 });
          p.curve([[-w / 2 - 8, y - h / 2 - 8], [-w / 2 - 18, y - h / 2], [-w / 2 - 8, y - h / 2 + 8]], { stroke: '#424242', w: 3 }); y -= h;
        }
      } },

    { type: 'prop', id: 'gatesign', name: 'Gate / direction sign', cat: CAT,
      colors: { sign: '#fbc02d', text: '#212121', post: '#757575' },
      params: [
        { key: 'gate', label: 'Gate letter', type: 'select', def: 'A', options: { A: 'A', B: 'B', C: 'C', none: 'No letter' } },
        { key: 'num', label: 'Gate number', type: 'range', min: 0, max: 40, step: 1, def: 7 },
        { key: 'arrow', label: 'Arrow', type: 'select', def: 'right', options: { right: '→ Right', left: '← Left', up: '↑ Ahead', none: 'No arrow' } },
        { key: 'mount', label: 'Hung from', type: 'select', def: 'ceiling', options: { ceiling: 'Ceiling', post: 'Stand on the floor', wall: 'Nothing (on a wall)' } },
      ],
      draw(p, P) {
        const W = 230, H = 70; const t = p.col('text');
        if (P.mount === 'ceiling') for (const x of [-W / 2 + 30, W / 2 - 30]) p.line([[x, -H / 2], [x, -H / 2 - 110]], { stroke: 'post', w: 3 });
        if (P.mount === 'post') { p.line([[0, H / 2], [0, H / 2 + 200]], { stroke: 'post', w: 6 }); p.ell(0, H / 2 + 200, 40, 8, { stroke: 'post', w: 3, fill: 'post' }); }
        p.rect(-W / 2, -H / 2, W, H, { stroke: 'text', w: 4, fill: 'sign', hatch: 'sign', hg: 3, halpha: 0.5 });
        icon(p, -W / 2 + 38, 0, 46, t);
        const label = (P.gate === 'none' ? '' : P.gate || 'A') + (+P.num ? String(+P.num) : '');
        if (label) p.text(label, 10, -22, 44, { stroke: t, w: 5 });
        const ax = W / 2 - 30, s = { stroke: t, w: 5 };
        if (P.arrow === 'right') p.line([[ax - 20, 0], [ax + 16, 0]], s), p.line([[ax + 2, -14], [ax + 16, 0], [ax + 2, 14]], s);
        if (P.arrow === 'left') p.line([[ax + 16, 0], [ax - 20, 0]], s), p.line([[ax - 6, -14], [ax - 20, 0], [ax - 6, 14]], s);
        if (P.arrow === 'up') p.line([[ax, 20], [ax, -20]], s), p.line([[ax - 14, -6], [ax, -20], [ax + 14, -6]], s);
      } },

    { type: 'prop', id: 'security', name: 'Security scanner', cat: CAT,
      colors: { frame: '#90a4ae', light: '#43a047', belt: '#616161' },
      params: [{ key: 'light', label: 'Light', type: 'select', def: 'green', options: { green: 'Green', red: 'Red (beep!)', off: 'Off' } }, { key: 'xray', label: 'Bag x-ray machine', type: 'toggle', def: true }],
      draw(p, P) {
        const f = { stroke: 'frame', w: 5, fill: 'paper', hatch: 'frame', hg: 6, halpha: 0.45 };
        p.rect(-110, -400, 24, 400, f); p.rect(86, -400, 24, 400, f); p.rect(-118, -430, 236, 34, f);
        if (P.light !== 'off') { const c = P.light === 'red' ? '#e53935' : p.col('light'); p.circ(0, -413, 9, { stroke: c, w: 3, fill: c }); for (const a of [200, 250, 290, 340]) { const d = U.dir(a); p.line([[d[0] * 15, -413 + d[1] * 15], [d[0] * 24, -413 + d[1] * 24]], { stroke: c, w: 2.5 }); } }
        if (P.xray !== false) {
          const x0 = 150; p.rect(x0, -100, 260, 30, { stroke: 'belt', w: 3.5, fill: '#424242' }); // belt
          for (let x = x0 + 8; x < x0 + 260; x += 18) p.line([[x, -98], [x, -72]], { stroke: '#9e9e9e', w: 1.5 });
          p.poly([[x0 + 70, -100], [x0 + 70, -200], [x0 + 200, -200], [x0 + 200, -100]], f); // tunnel
          for (let x = x0 + 80; x < x0 + 195; x += 12) p.line([[x, -128], [x, -100]], { stroke: 'belt', w: 2 }); // curtain strips
          for (const x of [x0 + 20, x0 + 240]) p.line([[x, -70], [x, 0]], { stroke: 'frame', w: 5 });
          p.rect(x0 + 10, -150, 46, 50, { stroke: '#8d6e63', w: 3, fill: 'paper', hatch: '#8d6e63', hg: 5, halpha: 0.4 }); // grey tray with a bag
        }
      } },

    { type: 'prop', id: 'carousel', name: 'Baggage belt (arrivals)', cat: CAT,
      colors: { frame: '#78909c', belt: '#424242' },
      params: [{ key: 'width', label: 'Width', type: 'range', min: 300, max: 1000, step: 20, def: 600 }, { key: 'bags', label: 'Bags', type: 'range', min: 0, max: 8, step: 1, def: 4 }, { key: 'shuffle', label: 'Shuffle', type: 'range', min: 1, max: 20, step: 1, def: 1 }],
      draw(p, P, it) {
        const W = +P.width || 600, n = +P.bags; const r = U.rng(U.hash(it.id + ':' + (P.shuffle || 1)));
        p.poly([[-W / 2, -60], [W / 2, -60], [W / 2 - 30, -100], [-W / 2 + 30, -100]], { stroke: 'belt', w: 3.5, fill: 'belt', hatch: '#9e9e9e', hg: 10, halpha: 0.35, ha: 70 }); // belt top
        p.rect(-W / 2, -60, W, 60, { stroke: 'frame', w: 4, fill: 'paper', hatch: 'frame', hg: 7, halpha: 0.4, ha: 0 });
        const styles = ['wheels', 'hard', 'soft', 'duffel'];
        for (let i = 0; i < n; i++) { const x = -W / 2 + 60 + (W - 120) * (n === 1 ? 0.5 : i / (n - 1)) + (r() - 0.5) * 20; suitcase(p, x, -66 - r() * 14, { style: styles[Math.floor(r() * 4)], size: r() < 0.5 ? 'small' : 'medium', handle: false, tag: true }, PAL[Math.floor(r() * PAL.length)]); }
      } },

    { type: 'prop', id: 'passport', name: 'Passport & boarding pass', cat: CAT,
      colors: { cover: '#283593', pass: '#e3f2fd', mark: '#1e88e5' },
      params: [{ key: 'what', label: 'What', type: 'select', def: 'both', options: { passport: 'Passport', pass: 'Boarding pass', both: 'Both together' } }],
      draw(p, P) { // hand-held: origin = centre, small
        const pass = (x, y) => { p.rect(x - 34, y - 15, 68, 30, { stroke: 'mark', w: 2.5, fill: 'pass' }); p.line([[x + 14, y - 15], [x + 14, y + 15]], { stroke: 'mark', w: 1.5 }); icon(p, x - 20, y - 4, 14, p.col('mark')); for (const dy of [4, 9]) p.line([[x - 28, y + dy], [x + 8, y + dy]], { stroke: 'mark', w: 1.5 }); for (let i = 0; i < 6; i++) p.line([[x + 18 + i * 2.5, y - 10], [x + 18 + i * 2.5, y + 10]], { stroke: '#212121', w: 1.2 }); };
        const book = (x, y) => { p.rect(x - 16, y - 22, 32, 44, { stroke: 'cover', w: 2.5, fill: 'cover', smooth: true }); p.circ(x, y - 4, 7, { stroke: '#fbc02d', w: 1.5 }); p.line([[x - 8, y + 12], [x + 8, y + 12]], { stroke: '#fbc02d', w: 1.5 }); };
        if (P.what === 'passport') book(0, 0); else if (P.what === 'pass') pass(0, 0); else { pass(10, -6); book(-12, 6); }
      } },
  ] });
})();
