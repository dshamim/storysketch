// StorySketch interface helpers: icons, tooltips, popovers/menus, tabs, segmented controls, collapsible sections, toasts.
// Plain script (no modules, no framework) so it works from file://. Styles: tokens.css + components.css. Live examples: docs/ui-kit.html.
// Every behaviour is keyboard-operable and sets the ARIA state it needs; nothing here depends on hover alone.

const UI = (() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const emit = (el, name, detail) => el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail }));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- icons ----------
  // UI.icon('rotate') -> '<svg class="ui-i"><use href="#i-rotate"/></svg>'; the symbols are injected once by UI.init().
  const ICONS = () => window.UI_ICONS || {};
  function icon(name, cls = '') {
    if (!ICONS()[name]) console.warn(`[ui] unknown icon "${name}"`);
    return `<svg class="ui-i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-${esc(name)}"/></svg>`;
  }
  function injectSprite() {
    if ($('#ui-sprite')) return;
    const symbols = Object.entries(ICONS()).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
    const holder = document.createElement('div');
    holder.innerHTML = `<svg id="ui-sprite" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">${symbols}</svg>`;
    document.body.prepend(holder.firstChild);
  }
  // <span data-icon="rotate"></span> -> filled in (handy in static HTML)
  function fillIcons(root = document) { for (const el of $$('[data-icon]', root)) { if (!el.firstElementChild) el.innerHTML = icon(el.dataset.icon, el.dataset.iconClass || ''); } }

  // ---------- tooltips ----------
  // Any element with data-tip="Name" (and optional data-kbd="Ctrl+Z") gets one. Shown on mouse/pen hover (after a short delay) and on keyboard
  // focus; dismissed with Esc, on press, on scroll. Hoverable and dismissible (WCAG 1.4.13). Not shown for touch.
  let tip = null, tipTarget = null, tipTimer = 0, hideTimer = 0, tipSeq = 0;
  const tipEl = () => {
    if (tip) return tip;
    tip = document.createElement('div'); tip.className = 'ui-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; tip.id = 'ui-tip';
    tip.addEventListener('pointerenter', () => clearTimeout(hideTimer)); tip.addEventListener('pointerleave', () => hideTip());
    document.body.appendChild(tip); return tip;
  };
  function place(el, anchor, placement = 'top') {
    const r = anchor.getBoundingClientRect(); const w = el.offsetWidth, h = el.offsetHeight; const gap = 8, vw = innerWidth, vh = innerHeight;
    let x, y;
    if (placement.startsWith('bottom')) { y = r.bottom + gap; if (y + h > vh - 4 && r.top - gap - h > 4) y = r.top - gap - h; }
    else { y = r.top - gap - h; if (y < 4 && r.bottom + gap + h < vh - 4) y = r.bottom + gap; }
    x = placement.endsWith('start') ? r.left : placement.endsWith('end') ? r.right - w : r.left + r.width / 2 - w / 2;
    el.style.left = clamp(Math.round(x), 4, Math.max(4, vw - w - 4)) + 'px'; el.style.top = clamp(Math.round(y), 4, Math.max(4, vh - h - 4)) + 'px';
  }
  function showTip(target) {
    const text = target.dataset.tip; if (!text) return;
    const el = tipEl(); clearTimeout(hideTimer); tipTarget = target;
    el.innerHTML = `<span>${esc(text)}</span>${target.dataset.kbd ? `<kbd class="ui-kbd">${esc(target.dataset.kbd)}</kbd>` : ''}`;
    el.hidden = false; place(el, target, target.dataset.tipPlacement || 'top'); target.setAttribute('aria-describedby', 'ui-tip');
  }
  function hideTip(now = false) {
    clearTimeout(tipTimer); clearTimeout(hideTimer);
    const done = () => { if (tip) tip.hidden = true; if (tipTarget) tipTarget.removeAttribute('aria-describedby'); tipTarget = null; };
    if (now) done(); else hideTimer = setTimeout(done, 80);
  }
  function initTooltips() {
    const target = (e) => e.target.closest && e.target.closest('[data-tip]');
    document.addEventListener('pointerover', (e) => { if (e.pointerType === 'touch') return; const t = target(e); if (!t || t === tipTarget) return; clearTimeout(tipTimer); const my = ++tipSeq; tipTimer = setTimeout(() => { if (my === tipSeq) showTip(t); }, 450); });
    document.addEventListener('pointerout', (e) => { const t = target(e); if (t) { tipSeq++; hideTip(); } });
    document.addEventListener('focusin', (e) => { const t = target(e); if (t && t.matches(':focus-visible')) showTip(t); });
    document.addEventListener('focusout', (e) => { if (target(e)) hideTip(true); });
    document.addEventListener('pointerdown', () => { tipSeq++; hideTip(true); }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { tipSeq++; hideTip(true); } }, true);
    // scrolling (also the scroll a keyboard focus causes) must not remove a keyboard-focus tooltip: keep it with its control
    window.addEventListener('scroll', () => { if (tip && !tip.hidden && tipTarget) place(tip, tipTarget, tipTarget.dataset.tipPlacement || 'top'); }, true);
  }

  // ---------- popovers and menus ----------
  // UI.popover(trigger, panel, { placement }) wires aria-expanded, outside click, Esc (focus goes back to the trigger) and positioning.
  // A panel with role="menu" also gets arrow-key navigation and closes when an item is chosen.
  let openPop = null;
  function popover(trigger, panel, opts = {}) {
    const isMenu = panel.getAttribute('role') === 'menu';
    const api = {
      get isOpen() { return !panel.hidden; },
      open(viaKeyboard = false) {
        if (openPop && openPop !== api) openPop.close(false);
        panel.hidden = false; trigger.setAttribute('aria-expanded', 'true'); trigger.setAttribute('aria-haspopup', isMenu ? 'menu' : 'dialog'); openPop = api; hideTip(true);
        place(panel, trigger, opts.placement || 'bottom-start');
        const first = isMenu ? $('[role=menuitem]:not([disabled])', panel) : $('input, select, button, [tabindex]', panel);
        if (first && (isMenu || viaKeyboard || opts.focus)) first.focus();
        emit(panel, 'ui-open', {});
      },
      close(returnFocus = true) {
        if (panel.hidden) return; panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); if (openPop === api) openPop = null;
        if (returnFocus) trigger.focus(); emit(panel, 'ui-close', {});
      },
      toggle(viaKeyboard) { api.isOpen ? api.close() : api.open(viaKeyboard); },
    };
    trigger.setAttribute('aria-expanded', 'false'); if (!panel.id) panel.id = 'ui-pop-' + Math.random().toString(36).slice(2, 7); trigger.setAttribute('aria-controls', panel.id); panel.hidden = true;
    trigger.addEventListener('click', (e) => api.toggle(e.detail === 0));
    trigger.addEventListener('keydown', (e) => { if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && isMenu) { e.preventDefault(); api.open(true); } });
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); api.close(); return; }
      if (e.key === 'Tab') { api.close(false); return; }
      if (!isMenu) return;
      const items = $$('[role=menuitem]:not([disabled])', panel); const i = items.indexOf(document.activeElement);
      const go = (n) => { e.preventDefault(); items[(n + items.length) % items.length].focus(); };
      if (e.key === 'ArrowDown') go(i + 1); else if (e.key === 'ArrowUp') go(i - 1); else if (e.key === 'Home') go(0); else if (e.key === 'End') go(items.length - 1);
    });
    if (isMenu) panel.addEventListener('click', (e) => { if (e.target.closest('[role=menuitem]')) api.close(); });
    document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !panel.contains(e.target) && !trigger.contains(e.target)) api.close(false); }, true);
    window.addEventListener('resize', () => { if (!panel.hidden) place(panel, trigger, opts.placement || 'bottom-start'); });
    return api;
  }

  // ---------- tabs (also the left rail) and segmented controls ----------
  // Roving tabindex: one tab stop, arrow keys move between items, Home/End jump. Emits "ui-change" with { id }.
  function roving(root, itemSel, { selAttr, vertical, onSelect }) {
    const items = () => $$(itemSel, root);
    const select = (el, focus) => {
      for (const it of items()) { const on = it === el; it.setAttribute(selAttr, on ? 'true' : 'false'); it.tabIndex = on ? 0 : -1; }
      if (focus) el.focus(); onSelect && onSelect(el); emit(root, 'ui-change', { id: el.id || el.dataset.value || el.textContent.trim(), el });
    };
    root.addEventListener('click', (e) => { const el = e.target.closest(itemSel); if (el && root.contains(el) && !el.disabled) select(el, false); });
    root.addEventListener('keydown', (e) => {
      const list = items().filter((i) => !i.disabled); const cur = list.indexOf(document.activeElement); if (cur < 0) return;
      const next = vertical ? 'ArrowDown' : 'ArrowRight', prev = vertical ? 'ArrowUp' : 'ArrowLeft'; let n = -1;
      if (e.key === next) n = cur + 1; else if (e.key === prev) n = cur - 1; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = list.length - 1;
      if (n < 0) return; e.preventDefault(); select(list[(n + list.length) % list.length], true);
    });
    const start = items().find((i) => i.getAttribute(selAttr) === 'true') || items()[0];
    for (const it of items()) it.tabIndex = it === start ? 0 : -1;
    return { select: (el) => select(el, false), items };
  }
  function tabs(root) {
    const vertical = root.getAttribute('aria-orientation') === 'vertical';
    const api = roving(root, '[role=tab]', { selAttr: 'aria-selected', vertical, onSelect(el) {
      for (const t of $$('[role=tab]', root)) { const p = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = t !== el; }
    } });
    const cur = $('[role=tab][aria-selected=true]', root); if (cur) api.select(cur);
    return api;
  }
  const segmented = (root) => roving(root, '[role=radio]', { selAttr: 'aria-checked', vertical: false });
  const swatches = (root) => roving(root, '[role=radio]', { selAttr: 'aria-checked', vertical: false });

  // ---------- collapsible sections ----------
  function section(root) {
    const h = $('.ui-section-h', root), b = $('.ui-section-b', root); if (!h || !b) return;
    if (!b.id) b.id = 'ui-sec-' + Math.random().toString(36).slice(2, 7); h.setAttribute('aria-controls', b.id);
    const set = (open) => { h.setAttribute('aria-expanded', String(open)); b.hidden = !open; emit(root, 'ui-toggle', { open }); };
    h.addEventListener('click', () => set(h.getAttribute('aria-expanded') !== 'true'));
    set(h.getAttribute('aria-expanded') !== 'false');
  }

  // ---------- range + number ----------
  function range(root) {
    const input = $('input[type=range]', root), out = $('output', root); if (!input || !out) return;
    const show = () => { out.textContent = input.value + (root.dataset.unit || ''); }; input.addEventListener('input', show); show();
  }

  // ---------- toasts ----------
  let toasts = null;
  function toast(message, { kind = '', ms = 3500 } = {}) {
    if (!toasts) { toasts = document.createElement('div'); toasts.className = 'ui-toasts'; toasts.setAttribute('role', 'status'); toasts.setAttribute('aria-live', 'polite'); document.body.appendChild(toasts); }
    const t = document.createElement('div'); t.className = 'ui-toast ' + kind;
    t.innerHTML = (kind === 'success' ? icon('success') : kind === 'error' ? icon('error') : '') + `<span>${esc(message)}</span>`;
    toasts.appendChild(t); setTimeout(() => t.remove(), ms); return t;
  }

  // ---------- wiring for declarative markup ----------
  function enhance(root = document) {
    fillIcons(root);
    for (const el of $$('.ui-tabs, .ui-rail', root)) if (!el.dataset.uiReady) { el.dataset.uiReady = '1'; tabs(el); }
    for (const el of $$('.ui-seg', root)) if (!el.dataset.uiReady) { el.dataset.uiReady = '1'; segmented(el); }
    for (const el of $$('.ui-swatches[role=radiogroup]', root)) if (!el.dataset.uiReady) { el.dataset.uiReady = '1'; swatches(el); }
    for (const el of $$('.ui-section', root)) if (!el.dataset.uiReady) { el.dataset.uiReady = '1'; section(el); }
    for (const el of $$('.ui-range', root)) if (!el.dataset.uiReady) { el.dataset.uiReady = '1'; range(el); }
  }
  let inited = false;
  function init() { if (inited) return; inited = true; injectSprite(); initTooltips(); enhance(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  return { icon, injectSprite, fillIcons, enhance, popover, tabs, segmented, swatches, section, range, toast, place, hideTip, esc, init };
})();
