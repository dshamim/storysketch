// The design tokens must keep text readable and controls visible (WCAG 2.x contrast), and the icon set must be complete and clean.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
import { ROOT } from '../helpers/sandbox.mjs';

const css = fs.readFileSync(path.join(ROOT, 'src/ui/tokens.css'), 'utf8');
// --ui-name: value;  (values may be var(--ui-other))
const vars = {}; for (const m of css.matchAll(/--ui-([a-z0-9-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
const resolve = (name, depth = 0) => { let v = vars[name]; if (v == null) throw new Error('no token ' + name); const ref = v.match(/^var\(--ui-([a-z0-9-]+)\)$/); if (ref && depth < 5) return resolve(ref[1], depth + 1); return v; };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(resolve(a)), lum(resolve(b))].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground token, background token, minimum ratio, what it is]
const TEXT = 4.5, UI = 3;
const PAIRS = [
  ['text', 'surface', TEXT, 'body text on panels'], ['text', 'bg-app', TEXT, 'text on the canvas surround'], ['text', 'surface-hover', TEXT, 'text on hover'], ['text', 'surface-active', TEXT, 'text on pressed'],
  ['text-muted', 'surface', TEXT, 'secondary text'], ['text-muted', 'surface-2', TEXT, 'secondary text on grey'], ['text-muted', 'bg-app', TEXT, 'secondary text on canvas surround'], ['text-muted', 'surface-hover', TEXT, 'secondary text on hover'],
  ['text-on-accent', 'accent', TEXT, 'primary button label'], ['text-on-accent', 'accent-hover', TEXT, 'primary button label (hover)'],
  ['accent-weak-text', 'accent-weak', TEXT, 'selected tab / tile text'], ['accent', 'surface', TEXT, 'accent used as text'],
  ['danger', 'surface', TEXT, 'danger text'], ['danger', 'danger-weak', TEXT, 'danger badge'], ['success', 'success-weak', TEXT, 'success badge'], ['success', 'surface', TEXT, 'success text'],
  ['warning', 'warning-weak', TEXT, 'warning badge'], ['tooltip-text', 'tooltip-bg', TEXT, 'tooltip'],
  ['border-input', 'surface', UI, 'input border'], ['border-input', 'surface-2', UI, 'input border on grey'], ['focus', 'surface', UI, 'focus ring on panels'], ['focus', 'bg-app', UI, 'focus ring on the canvas surround'], ['accent', 'surface', UI, 'selected control outline'],
];
for (const [fg, bg, min, what] of PAIRS) test(`contrast ${fg} on ${bg} ≥ ${min}:1 (${what})`, () => { const r = ratio(fg, bg); assert.ok(r >= min, `${fg} on ${bg} is ${r.toFixed(2)}:1`); });

test('every token that is a colour is a 6-digit hex or a reference (so tests can read it)', () => {
  for (const [k, v] of Object.entries(vars)) if (/^(gray|violet|red|green|amber)-/.test(k) || /^(bg-app|text-on-accent|tooltip)/.test(k)) assert.match(v, /^#[0-9a-f]{6}$|^var\(--ui-/i, k);
});
test('spacing scale is on a 4 px grid', () => { for (const k of ['s-1', 's-2', 's-3', 's-4', 's-5', 's-6', 's-8', 's-10']) assert.equal(parseInt(vars[k]) % 4, 0, k); });
test('touch screens get 44 px controls (WCAG 2.5.5)', () => {
  const m = css.match(/@media \(pointer: coarse\)\s*\{[^}]*--ui-control-h:\s*(\d+)px/); assert.ok(m, 'no coarse-pointer rule'); assert.ok(+m[1] >= 44);
});
test('reduced-motion preference removes animation time', () => { assert.match(css, /prefers-reduced-motion[\s\S]*--ui-dur:\s*0ms/); });

// ---- icons ----
const ctx = vm.createContext({ window: {} }); vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/ui/icons.js'), 'utf8'), ctx);
const ICONS = ctx.window.UI_ICONS;
test('icon set: every icon is only safe SVG shapes, no scripts or event handlers', () => {
  assert.ok(Object.keys(ICONS).length >= 90);
  for (const [k, v] of Object.entries(ICONS)) { assert.match(v, /^(<(path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*\/>)+$/, k); assert.ok(!/\bon\w+=|<script|javascript:/i.test(v), k); }
});
test('icon set: every icon the plan relies on exists', () => {
  const need = ['characters', 'props', 'shapes', 'text', 'layers', 'addons', 'pages', 'select', 'hand', 'box', 'circle', 'triangle', 'line', 'arrow', 'double-arrow', 'rotate', 'copy', 'delete', 'lock', 'unlock', 'group', 'undo', 'redo', 'export', 'save', 'open', 'new', 'bold', 'text-left', 'text-center', 'text-right', 'zoom-in', 'zoom-out', 'fit', 'search', 'help', 'close', 'check', 'more', 'chevron-down', 'to-front', 'to-back', 'flip-h', 'align-left', 'distribute-h', 'dog', 'cat', 'style', 'color'];
  assert.deepEqual(need.filter((n) => !ICONS[n]), []);
});
test('Lucide licence notice is shipped with the vendored icons', () => {
  const lic = fs.readFileSync(path.join(ROOT, 'vendor/lucide/LICENSE'), 'utf8'); assert.match(lic, /ISC License/); assert.match(lic, /Lucide/);
});
