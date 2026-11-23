// One-time tips: three small, dismissible cards that show once, at the moment they help (no tour, nothing modal).
//   handles : the first time a figure, shape or text is picked  -> "Drag the dots / round handle ..."
//   text    : the first time a text is picked                   -> "Double-click it to change it"
//   search  : after a little while of working                   -> "Press Ctrl+K to search for anything"
// A tip is finished when it is dismissed, when the person does the thing, or after it has been shown twice. Help ▸ Show the tips again starts over.
// The card is small, sits top-left of the page (never over the tool bar, tab bar or page strip) and only the card itself takes taps.
// (Part of the editor; plain <script> files share globals and load in the order listed in index.html.)
const HINTS_KEY = 'storysketch/hints';           // progress: JSON { id: 1 (finished) | 'shown1' (shown once) }
const HINTS_MODE_KEY = 'storysketch/hints-mode'; // 'on' / 'off': a switch for tests and support. Automated browsers get no tips unless it says 'on'.
const HINT_MS = 14000, HINT_DELAY = 700;
let hintTimer = null, hintCommits = 0, hintShowing = null;
function hintStore() { try { return JSON.parse(localStorage.getItem(HINTS_KEY) || '{}') || {}; } catch (e) { return {}; } }
function hintSave(o) { try { localStorage.setItem(HINTS_KEY, JSON.stringify(o)); } catch (e) { /* ignore */ } }
function hintsEnabled() { let v = null; try { v = localStorage.getItem(HINTS_MODE_KEY); } catch (e) { /* ignore */ } return v === 'off' ? false : v === 'on' ? true : !navigator.webdriver; }
const HINT_TEXT = {
  handles: () => 'Drag the coloured dots to pose a figure. The round handle turns it, the square one resizes.',
  text: () => touchUI() ? 'Double-tap a text to change what it says.' : 'Double-click a text to change what it says.',
  search: () => touchUI() ? 'Tap the magnifier at the top to search for anything.' : 'Press Ctrl+K to search for anything.',
};
function hintBusy() { return !!(app.edit || app.drag || overlayOpen() || !$('#start').hidden || document.querySelector('dialog:modal') || hintShowing); }
function showHint(id) {
  if (!hintsEnabled() || hintBusy()) return; const st = hintStore(); if (st[id] === 1) return;
  const card = $('#hint'); if (!card) return; hintShowing = id; $('#hint-text').textContent = HINT_TEXT[id](); card.dataset.hint = id; card.hidden = false;
  clearTimeout(hintTimer); hintTimer = setTimeout(() => closeHint(false), HINT_MS);
}
function closeHint(done) {
  const id = hintShowing; if (!id) return; hintShowing = null; clearTimeout(hintTimer); $('#hint').hidden = true;
  const st = hintStore(); st[id] = done || st[id] === 'shown1' ? 1 : 'shown1'; hintSave(st); // a tip that timed out twice is finished too
}
/** The person did the thing the tip was about (or the tip is no longer needed): finish it for good. */
function hintDone(id) { if (hintShowing === id) closeHint(true); const st = hintStore(); if (st[id] === 1) return; st[id] = 1; hintSave(st); }
function resetHints() { try { localStorage.removeItem(HINTS_KEY); } catch (e) { /* ignore */ } toast('The tips will show again as you work'); }
/** Called after a selection change: pick the tip that fits what was picked. */
function hintForSelection() {
  const it = app.sel.length === 1 ? itemById(app.sel[0]) : null; if (!it) return;
  const id = it.type === 'text' ? 'text' : it.type === 'figure' ? 'handles' : null; if (!id) return; // (the pose tip is about a figure's dots: a box or a line has none, and must not use the tip up)
  const pick = app.sel[0]; setTimeout(() => { if (app.sel.length === 1 && app.sel[0] === pick) showHint(id); }, HINT_DELAY);
}
/** Called after every committed change: after a while of working, mention search once. */
function hintTick() { hintCommits++; if (hintCommits === 8) setTimeout(() => showHint('search'), HINT_DELAY); }
function initHints() { $('#hint-ok').addEventListener('click', () => closeHint(true)); }
