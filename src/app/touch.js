// Touch and tablet support: touch mode (bigger targets, bigger handles), and — added in later steps — gestures, the bottom tool bar and keyboard-aware typing.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
// ---------- touch mode ----------
// `html.touch` is on when the main pointer is a finger (coarse) or when the user switches it on (View ▸ Touch-friendly sizes, handy on a touch laptop).
const TOUCH_KEY = 'storysketch/touch'; // 'on' | 'off'; nothing stored = follow the device
const coarseQuery = window.matchMedia ? window.matchMedia('(pointer: coarse)') : { matches: false };
function touchPref() { try { return localStorage.getItem(TOUCH_KEY) || 'auto'; } catch (e) { return 'auto'; } }
const touchUI = () => document.documentElement.classList.contains('touch');
function applyTouch() {
  const p = touchPref(); const on = p === 'on' || (p === 'auto' && coarseQuery.matches);
  const was = touchUI(); document.documentElement.classList.toggle('touch', on);
  const m = $('#menu-touch'); if (m) m.setAttribute('aria-checked', String(on));
  if (was !== on && app.P) { renderOverlay(); positionMiniBar(); }
}
function toggleTouch() { try { localStorage.setItem(TOUCH_KEY, touchUI() ? 'off' : 'on'); } catch (e) { /* ignore */ } applyTouch(); }

// A finger can not hit an 11 px handle. In touch mode every handle gets an invisible 44 px round "halo" behind it
// (same data-h, so it works exactly like the handle; data-halo marks it so tests and code can tell them apart).
const HALO_R = 22; // screen pixels
const SVGNS = 'http://www.w3.org/2000/svg';
function makeHalo(el, k) {
  const b = el.getBBox(); const halo = document.createElementNS(SVGNS, 'circle');
  halo.setAttribute('data-h', el.dataset.h); halo.setAttribute('data-halo', '1'); halo.setAttribute('class', el.getAttribute('class') || '');
  halo.setAttribute('cx', b.x + b.width / 2); halo.setAttribute('cy', b.y + b.height / 2); halo.setAttribute('r', HALO_R * k);
  halo.setAttribute('fill', '#fff'); halo.setAttribute('fill-opacity', '0.001');
  return halo;
}
function addHalos(ov) {
  if (!touchUI()) return;
  for (const g of $$('g', ov)) {
    const handles = [...g.children].filter((el) => el.dataset && el.dataset.h); if (!handles.length) continue;
    const k = +(g.dataset.k || 1 / zoom()); const first = handles[0];
    for (const el of handles) g.insertBefore(makeHalo(el, k), first); // all halos sit below every visible handle, so a halo never covers a neighbouring handle's centre
  }
  const direct = [...ov.children].filter((el) => el.dataset && el.dataset.h && !el.dataset.halo); // the handles of a multi-selection sit directly in the overlay
  if (direct.length) { const first = direct[0]; for (const el of direct) ov.insertBefore(makeHalo(el, 1 / zoom()), first); }
}
function initTouch() {
  if (coarseQuery.addEventListener) coarseQuery.addEventListener('change', applyTouch);
  applyTouch();
}
