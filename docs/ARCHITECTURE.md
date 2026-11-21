# Architecture

Plain JavaScript, no build step, no dependencies at runtime. Core files are classic `<script>`s that share globals (so the tool works
from `file://`); `index.html` lists them in load order.

```
index.html             page + script order
src/core/              no DOM access at load time → runs in Node for the tests
  version.js             APP name / version / project-file schema
  legacy.js              one-time copy of settings saved under the tool's former name
  util.js                math, seeded random (rng, noise), colour, 2-bone IK (solve2)
  draw.js                Pen (clean primitives) + RENDER: clean editing view, style registry, helpers for styles
  files.js               local-disk file access (File System Access API, download fallback)
  storage.js             STORAGE: adapter registry for where projects live (local disk now; a cloud adapter later)
  registry.js            CP: plugin registry + loader, asset sources, API versioning
  parts.js               PARTS: shared character parts (face, hair, clothes, accessories) drawn onto any rig's joints
  rigs/biped.js          built-in "Person" skeleton
  figure.js              FIG: dispatches every call to the character's rig
  presets.js             character defaults
  props-core.js          prop helpers + propPrims()
  store.js               STORE: project file, migrations, autosave, undo
src/app/               the editor UI (DOM), split by job; plain <script>s that share globals, loaded in this order:
  model.js               `app` state, lookups, groups, style/pose helpers
  history.js             commit, autosave, undo/redo snapshots
  stage.js               page SVG rendering, zoom/pan, selection overlay
  pointer.js             selecting, moving, scaling, rotating, posing by dragging
  items.js               add / delete / duplicate / group / lock / layer order / clipboard
  library.js             left panel: characters, props, pages tab, layers list
  inspector.js           right panel for the selection
  designer.js            character designer dialog
  export.js              SVG / PNG / SVG-file export
  project.js             project files, in-app dialogs, Save / Open
  plugins-panel.js       plugins dialog
  main.js                shortcuts, init, DOMContentLoaded
src/css/app.css
plugins/               everything that can be added without touching the core (see plugins/README.md)
  styles/ rigs/ projects/ (samples) hair/ clothes/ accessories/ props/ addons/ characters/ poses/ templates/
  manifest.js            generated index (tools/build_plugins.py or "Rescan plugins" in the app)
tests/
  unit/                  node --test: no browser needed
  e2e/                   headless Chromium: workflows (add, pose, layer, group, copy, export, save…), samples, rigs, and
                         visual baselines (tests/e2e/baselines/*.png, compared pixel by pixel; `npm run update:baselines`)
  fixtures/              golden files + the scripts that generate them
  helpers/sandbox.mjs    runs the core scripts + real plugins in a Node vm with a stubbed browser
tools/build_plugins.py   rebuilds / checks plugins/manifest.js
```

## How a picture is made
1. Everything on a page is an **item** (`figure`, `prop`, or a figure's detached `limbs`) with position, scale, rotation, flip, colour mode.
2. `itemPrims(item)` → a list of **clean primitives** (`{ pts, closed, smooth, stroke, w, fill, hatch, hole, op }`), from `FIG.prims` (a figure,
   through its rig and the shared parts) or `propPrims` (a prop plugin's `draw`).
3. `RENDER.render(prims, ctx)` finishes them. `ctx.style` selects a **style** plugin (crayon, marker, ink, chalk) or the built-in clean view.
   `fill: 'paper'` is drawn crisp in every style, which is what lets layering hide things.
4. The editor shows clean lines (fast, precise); *Preview* and export use the project's style. Randomness is seeded from the item id,
   so the same scene always exports the same picture.

## Extension points (all plugin types)
| Type | Provides | Core contract |
|---|---|---|
| `style` | a drawing look | `render(prims, ctx)`, `defs` |
| `rig` | a skeleton | `dims, joints, handles, edit, prims, fromPreset, mirror, …` (see `plugins/README.md`) |
| `hair` `clothes` `accessory` | character parts | `draw(pen, ctx)`; accessories may restrict `rigs` |
| `prop`, `addon` | things in the scene, content for prop slots | `draw(pen, params, item, x)` |
| `character` `pose` `template` `project` (sample) | data | JSON |

Two seams are for the hosted edition: **`STORAGE`** (where projects are saved/opened) and **asset sources** (`CP.addSource`, where plugins come from).
See [HOSTED-EDITION.md](HOSTED-EDITION.md).

## Compatibility rules
- **Plugin API** (`api`, currently 1): additive changes only; a breaking change bumps it and old plugins are *not* loaded (never silently converted).
- **Project file** (`schema`, currently 2): older files are migrated step by step on open; newer files are refused. New optional fields
  (`settings.style`, `cast[].rig`) default sensibly, so they need no bump. Files from before the rename (`app: "Crayon Poser"`) still open.
