# StorySketch plugins

Everything you can put on a page comes from this folder: drawing styles, skeletons (rigs), hair styles, clothes, accessories, props,
prop add-ons (pictures, flowers, charts…), characters, poses, character templates and sample projects. The built-in ones are plugins too, so you can copy any
of them as a starting point.

```
plugins/
  styles/        drawing styles: crayon, marker, ink, chalk… (.js)
  rigs/          skeletons: the Person rig is built in; animals etc. live here (.js)
  projects/      sample projects offered by New project (.json)
  hair/          one .js file per hair style
  clothes/       one .js file per outfit
  accessories/   glasses, hats, capes, wheelchair… (.js)
  addons/        content that goes inside props: pictures, flowers, charts… (.js)
  props/         .js — one file can hold one prop or many
  characters/    one .json file per character
  poses/         .json — lists of poses
  templates/     .json — starting looks for the Character designer
  manifest.js    the index the tool reads (generated, don't edit)
```

## Adding something (3 steps)

1. **Copy** a similar file in the right folder (for example `hair/braids.js` or `characters/maya.json`).
2. **Change** its `id` (unique, lowercase, no spaces) and `name`, then edit the drawing or the values.
3. **Rescan**: in the tool click **Add-ons → Rescan plugins folder** (left rail) (the first time, pick this
   `plugins` folder; Chrome remembers it). The tool rebuilds `manifest.js` and reloads.
   No-dialog alternative: `python3 tools/build_plugins.py`, then refresh the page.

Why the rescan? A page opened from your disk isn't allowed to list a folder, so the tool reads the
index in `manifest.js`. You need a rescan when you **add, remove or rename** a file, or **edit a
`.json` file** (JSON is copied into the index). Edits to an existing **`.js`** file only need a refresh.

Problems (a typo, a missing field, the wrong version) show in **Add-ons** (left rail) with the file name.
The rest of the plugins still load.

## Versions — `api` and `version`

Every plugin and data file **must** say which plugin API it was written for:

```js
CP.register({ api: 1, version: '1.0.0', type: 'hair', id: 'braids', … })
```
```json
{ "api": 1, "version": "1.0.0", "id": "maya", "name": "Maya", … }
```

- `api` is the plugin interface version (currently **1**). It changes only for **breaking**
  changes. The tool loads only plugins whose `api` it supports. Older, newer or missing `api` means
  **not loaded** and listed in Add-ons with the reason. Nothing is converted automatically.
- `version` is your own version of the plugin (free text, shown in the Plugins list).
- Same `id` as an existing plugin = **replaces it** (files load in folder/alphabetical order). Use a
  new id unless you mean to override a built-in.

Your book's project file has its own separate format number and is upgraded when you open it in a
newer tool. That is different from plugins, which are never converted.

---

## Drawing basics (all `.js` plugins)

`draw(pen, ctx)` adds clean shapes to `pen`. The tool turns them into crayon (wobble, hatching, wax
grain), grey/faded colour modes, flips and export by itself, so **draw only clean shapes**.

| pen call | draws |
|---|---|
| `pen.line(points, o)` | open line through `[[x,y], …]` |
| `pen.curve(points, o)` | smooth open curve |
| `pen.poly(points, o)` | closed shape (`smooth: true` for rounded) |
| `pen.rect(x, y, w, h, o)` · `pen.circ(cx, cy, r, o)` · `pen.ell(cx, cy, rx, ry, o)` | basic shapes |
| `pen.arc(cx, cy, rx, ry, fromDeg, toDeg, o)` | part of an ellipse |
| `pen.text('Hello 3x5', cx, top, height, o)` | crayon handwriting: `A-Z a-z 0-9 x + = - ? ! . , ' : / ( )`; `o.align` 'left'/'right', `o.strokes` = a colour per letter |
| `pen.textWidth(str, height)` | how wide that text will be |

Options `o`:
- `stroke` (colour or slot name, `false` = no outline) and `w` (line width).
- `fill`: `'paper'` = opaque paper colour, so it **hides what is behind** (use this for layering); or a colour = solid crayon fill.
- `hatch` (colour) with `hg` (gap), `ha` (angle), `halpha` (strength) = scribble shading.
- `smooth`; `hole: points` (cut-out, as in the headscarf).

Helpers: `U.add/sub/mul/lerp2/dir/rad`, and `CP.helpers` for props (`PAL` colours, `heartPts`,
`starPts`, `bumpy`, `paintingOn`). If you declare variables at the top of a file, wrap the file in
`(() => { … })();` so names don't clash with other plugins.

### Coordinates
- **Face units** (hair, face/head accessories): `ctx.F(x, y)` → point. The head is radius 1 and
  0,0 is its centre; x goes right, y goes down (top of head = `(0, -1)`, chin = `(0, 1)`). `F`
  follows head tilt, size, flips and the "Hair side" switch for you. `ctx.R` = head radius in drawing
  units.
- **Body** (clothes, back/body accessories): skeleton `ctx.J`:
  - `neck`, `shoulder`, `hip`, `headC`
  - `t` = up the spine, `p` = sideways
  - `legL/legR/armL/armR` each `{ S: start, E: knee/elbow, H: ankle/hand, up: upper angle }`
  - `J.d` = sizes (`head`, `torso`, `th` thigh…)

  `ctx.k` scales with the character's height, so multiply your lengths by `k`.

---

## Hair — `hair/*.js`
```js
CP.register({ api: 1, version: '1.0.0', type: 'hair', id: 'braids', name: 'Two braids',
  draw(pen, h) { if (!h.front) return; pen.poly(h.cap(1.1, 0.74), h.style); … } });
```
Called twice per figure:
- `h.layer === 'back'`: behind the head and body (long hair, hood).
- `'front'`: over the face edge (fringe, ponytail).

Context:
- shapes: `F`, `arcPts(a0, a1, r)`, `circ`, `R`
- `cap(outer, inner, a0, a1, zigzag)` = fringe cap
- `loopy(basePoints, loopR, wavelength)` = curls
- `color` (hair colour), `W` (line width), `style` (standard hair stroke + hatch), `mirror`

## Clothes — `clothes/*.js`
```js
CP.register({ api: 1, version: '1.0.0', type: 'clothes', id: 'dress', name: 'Dress',
  legSpread: 9, armOffset: 0, skirt: 0.45, color: '#3f6fb5' /* optional default */,
  draw(pen, c) { pen.poly(c.skirtHull(), { ...c.style, fill: 'paper' }); c.bodice(); } });
```
- `legSpread`: gap between the legs at the hip. `armOffset`: shoulder width for the arms.
- `skirt`: default skirt length. Shows the **Skirt length** slider in the designer.
- Context:
  - `J`, `k`, `W`, `down`, `cast`
  - `color` = clothes colour; `style` = stroke + optional shading
  - `skirtHull(len)` = skirt shape that follows the thighs (drapes when sitting); `bodice()` = top half of a dress; `waist` = 2 points
- Drawn after the legs and before the head and arms. Use `fill: 'paper'` so clothes cover the stick body.

## Accessories — `accessories/*.js`
```js
CP.register({ api: 1, version: '1.0.0', type: 'accessory', id: 'hat', name: 'Sun hat',
  slot: 'head', color: '#d9a03a', draw(pen, a) { … } });
```
`slot` = where it is drawn, back to front:

| slot | drawn | e.g. |
|---|---|---|
| `base` | behind everything | wheelchair |
| `back` | behind the body | cape, backpack |
| `body` | over clothes, under head and arms | scarf, necklace, belt |
| `face` | on the face | glasses, mask |
| `head` | on top of the hair | hat, crown, bow |

Options:
- `color`: default colour; characters can override it per accessory.
- `order`: drawing order inside a slot.
- `sided: true`: the figure panel's **side** button and Mirror pose flip it; use `a.side` (±1).
- `suggestPose: 'sit'`: ticking it sets the character's default pose.
- `rigs: ['biped']`: the skeletons this accessory was drawn for (see **Rigs**). Leave it out if it only uses the head and body frame (`F`, `hip`, `neck`…); list it if it reads limbs such as `J.legL`. Characters whose rig isn't listed don't get it offered.

Context:
- `F`, `R`, `J`, `k`, `W`, `down`
- `color`, `castColor`
- `look` (eye offset), `eyeY`, `eyeDX`
- `side`, `mirror`

Any accessory works on any character. The character designer lists every installed accessory.

## Props — `props/*.js`
```js
CP.register({ api: 1, version: '1.0.0', type: 'prop', id: 'lamp', name: 'Desk lamp', pack: 'Classroom props', cat: 'Furniture',
  colors: { line: '#5a5a5a', shade: '#e53935', light: '#fbc02d' },
  params: [{ key: 'on', label: 'Light on', type: 'toggle', def: true }],                 // a state
  slots:  [{ key: 'art', label: 'Picture', kind: 'picture', def: 'tree', box: [-60, -90, 120, 80] }], // content from add-ons
  draw(p, P, item, x) {
    if (P.on) p.poly(…, { hatch: 'light' });   // read states from P
    x.slot('art');                              // draw the chosen add-on into the slot's box (or x.slot('art', [x, y, w, h]))
  } });
```
- `pack`: the group at the top of the Props tab, e.g. `'Classroom props'`. Props without one go under **Other props**. A file that registers several props can set it once for all of them: `CP.register({ api: 1, pack: 'Classroom props', items: [ … ] })`.
- `cat`: the section inside the pack (Arts, Learning, Furniture, Decoration…).
- Packs are folders by convention: the classroom props live in `props/classroom/`. To start a new pack, make a folder (say `props/playground/`), give its props `pack: 'Playground props'`, and Rescan. The folder is just for tidiness; `pack` is what groups them.
- `colors`: named slots, editable per placement. Use the slot name as a colour.
- Origin: floor items = **bottom centre** standing on y=0; floating items = centre.
- Several props in one file: `CP.register({ api: 1, items: [ {type:'prop', …}, … ] })`.

### States (`params`)
A prop's own options, shown under **Options** in the right panel. Values arrive in `P`.

| type | control | extra fields |
|---|---|---|
| `toggle` | on/off checkbox (lamp on, curtains open) | `def: true/false` |
| `select` | dropdown | `options: { value: 'Label' }` |
| `range` | slider | `min`, `max`, `step` |
| `text` | text box | |
| `color` | colour picker | |

Add `when: { otherKey: value }` (or a list of values) to show an option only while another option
or slot has that value.

### Slots and add-ons
A **slot** is a place inside a prop that holds swappable content: the picture in a frame, the
painting on an easel, flowers on a plant, the chart on a poster.
- `key`: where the choice is stored (`P[key]` = chosen add-on id, or `'none'`).
- `kind`: which add-ons fit. Every installed add-on of that kind appears in the prop's picker, so new pictures show up in **every** prop with a `picture` slot.
- `def`: default add-on id or `'none'`.
- `box: [x, y, w, h]`: the area in prop coordinates.

Kinds in use:
- `picture`: easel, picture frame, drawing on paper, mural
- `flower`: potted plant
- `chart`: wall poster, whiteboard
- `garment`: clothes rack / wardrobe hangers (the top edge of the box is the rail)
- `hat`: on top of the clothes rack post or the wardrobe (the bottom edge of the box is where the hat sits)

You can invent new kinds: a prop with `kind: 'sticker'` plus add-ons with `kind: 'sticker'`.

## Add-ons — `addons/<anything>/*.js`
```js
CP.register({ api: 1, version: '1.0.0', type: 'addon', kind: 'picture', id: 'house', name: 'House',
  order: 10,                                          // position in the picker
  params: [{ key: 'text', label: 'Caption', type: 'text', def: '' }], // optional own options
  draw(pen, box, a) { … } });
```
- `box`: `{ x, y, w, h, cx, cy }`, the area to fill. Size everything from `box.w`/`box.h` so it fits any prop.
- `a.params`: the add-on's own option values. They're stored per slot, as `"<slot>.<key>"`.
- `a.propParams`: the prop's options. `a.item`, `a.seed`.
- `a.rng()`: a random number that stays the same every time for this item.
- Colour names such as `'a'`, `'b'`, `'c'` use the prop's colour slots when the prop has them.
- Sub-folders under `addons/` are just for tidiness (`pictures/`, `flowers/`, `charts/`, `garments/`, `hats/`).
- One file can register several add-ons: `CP.register({ api: 1, items: [ … ] })` (see `garments/garments.js`, which shares a hanger drawing helper between all its garments).

## Characters — `characters/*.json`
```json
{ "api": 1, "version": "1.0.0", "id": "maya", "name": "Maya", "color": "#00897b",
  "body": "overalls", "hair": "braids",
  "accessories": { "hat": {}, "scarf": { "color": "#fbc02d" } },
  "order": 20, "starter": false }
```
- Only list what differs from the defaults:
  - `build` (`child`/`adult`), `height`, `weight` (line weight)
  - `hairColor`, `clothesColor`, `skirt`, `hatchBody`
  - `hairFlip`, `capeFlip`, `faceTint`, `nose`, `defaultPose`
- `starter: false` = not put into new books automatically; it appears under **Library** in the Characters tab.
- `order` sorts the starter cast.
- A book keeps its own copy of each character, so edits in the designer don't change the file.

## Poses — `poses/*.json`
```json
{ "api": 1, "version": "1.0.0", "items": [
  { "id": "hips", "name": "Hands on hips", "hL": [-0.12, 0.78, 1], "hR": [0.12, 0.78, -1],
    "fL": [-0.2, 0.98, 1], "fR": [0.2, 0.98, -1] } ] }
```
- `hL`/`hR` = where each hand goes and `fL`/`fR` = each foot, as `[x, y, bend]`:
  - hands are measured in arm-lengths from the shoulder; feet in leg-lengths from the hip
  - x is right, y is down; `bend` ±1 picks which way the elbow or knee bends
- Optional: `torso` (angle, -90 = upright), `head` (tilt), `feet` (`out`/`right`/`left`), `expr` (expression).
- L/R mean screen-left and screen-right.
- **Poses belong to a rig.** The format above is for the Person rig (the default). A pose for another rig sets `"rig": "<id>"`
  (on the file, applying to all its `items`, or on one item) and uses whatever fields that rig documents; the same `id` may exist
  for different rigs ("stand" for a person and for a dog). The four-legged rig's poses are plain angles, see `poses/animals.json`.

## Templates — `templates/*.json`
`{ "api": 1, "items": [ { "id": "t-hero", "name": "Superhero kid", "look": { "body": "stripes", "hair": "spiky", "accessories": { "mask": {}, "cape": {} } } } ] }`
They appear under **New character from template…** in the designer.

## Styles — `styles/*.js`
A style turns the clean drawing into the finished look (preview and export). Crayon, marker, ink and chalk are plugins, so
new ones (pencil, watercolour…) are one file.
```js
CP.register({ api: 1, version: '1.0.0', type: 'style', id: 'pencil', name: 'Pencil', order: 25,
  defs: '<filter id="pencil-tooth">…</filter>',   // SVG <defs> content (or a function returning it); ids must be unique
  defaultPaper: '#ffffff',                        // optional: page colour this style suggests (chalk → blackboard)
  render(prims, ctx) { … return svgString; } });
```
- `prims` is the clean primitive list (`{ pts, closed, smooth, stroke, w, fill, hatch, hole, op }`; `fill: 'paper'` hides what is behind).
- `ctx` = `{ mode: 'colour'|'grey'|…, paper, seed, idp, n }`. **Same `seed` must always give the same picture**, so re-exports match.
- Helpers on `RENDER.helpers`: `colour(c, ctx)` (applies grey mode and chalk-white on dark pages), `runs(prims, ctx, filterId, fn)`
  (paper fills stay crisp, everything else is grouped under one SVG filter), `hatchLines`, `wobblePath`, `dPoly`/`dFill`, `paperOf`.
  Read `styles/marker.js` (short) as a model.
- `order` puts it in the style list (lower first; Crayon, the default, is 10).

## Rigs — `rigs/*.js`
A rig is a skeleton: its dimensions, joints, posing, presets, mirroring, drag handles and drawing. The two-armed Person rig is
built in (`src/core/rigs/biped.js`); `rigs/quadruped.js` is a four-legged animal (dog, cat, dinosaur) and a good model for a new one
(a bird, a fish, a robot…). A character picks its skeleton with `"rig": "<id>"`; with none it is a Person.
```js
CP.register({ api: 1, version: '1.0.0', type: 'rig', id: 'bird', name: 'Bird',
  expressions: { happy: 'Happy' },                         // shown in the inspector
  builds: { robin: {…} }, buildNames: { robin: 'Robin' }, defaultBuild: 'robin',
  limbs: [{ id: 'wingL', label: 'Left wing', joint: 'L wing joint' }],   // can be flipped and put on their own layer
  supports: { face: false, hair: false, clothes: false, accessories: true, feet: false },
  dims(cast), joints(cast, pose), fromPreset(cast, preset), mirror(pose), prims(cast, inst, parts),
  handles(cast, pose) /* → [{ id, p:[x,y], color }] */, edit(cast, pose, handleId, target, { rotate, bend }),
  bendOf(cast, J, limbId), flipBend(cast, pose, limbId) });
```
- `prims(cast, inst, parts)` returns clean primitives; `parts` is `'main'` (everything except detached limbs) or `'limbs'` (only them).
- `joints()` must include the **head frame** the shared parts need: `hip`, `neck`, `t` (up the spine), `p` (sideways), `headC`, `headA`, and `d.head`, `d.w`, `d.k`.
  Then face-frame accessories (hats, glasses…) work with no extra code: call `PARTS.drawSlot(pen, J, cast, inst, slot, mirror)` for each slot.
- Handle ids `up:<limb>` (middle joint: double-press flips the bend) and `ik:<limb>` (end of the limb: IK reach, or rotate with Shift) get the editor's
  built-in behaviour; any other id is yours (`spine`, `tail:0`…). `edit()` must never produce NaN, whatever the target.
- Poses for the rig are `poses/*.json` items with `"rig": "<id>"`.
- Accessories that read limbs (`J.legL`…) list the rigs they work with (`rigs: ['biped']`) and are then hidden for other rigs.
- `tests/unit/rigs.test.mjs` runs every registered rig through the same checks (handles, edits, mirroring, drawing, presets), so a new rig is tested by adding it.

## Sample projects — `projects/*.json`
Offered by **New project** next to "One blank page". A sample can carry the cast, the project's style and page colour, and placed items.
```json
{ "api": 1, "version": "1.0.0", "id": "sample-park", "name": "Sample — A walk in the park", "description": "…",
  "settings": { "style": "marker", "paper": "#ffffff" },
  "cast": [ "lily", { "template": "t-dog", "id": "rex", "name": "Rex" } ],
  "pages": [ { "name": "Park", "notes": "Shown beside the canvas.",
    "items": [
      { "type": "prop",   "kind": "sun", "x": 850, "y": 120, "s": 0.9 },
      { "type": "figure", "cast": "lily", "x": 300, "floor": 650, "pose": "walk" },
      { "type": "figure", "cast": "rex",  "x": 560, "floor": 650, "pose": "run" } ] } ] }
```
- `cast`: a character plugin id, or `{ "template": "<template id>", "id": "…", "name": "…", …overrides }` (that is how a sample gets a dog).
  Leave `cast` out to use the normal starter cast.
- Items are listed **back to front**. Figures use a **preset pose name** (`"pose": "walk"`), so the file stays readable and still works if a rig changes.
  `floor` is the y of the ground line: the figure's lowest point is put there whatever its pose or size (use `y` to place the hip yourself).
  Props take `params` and `colors` that override their defaults (`"params": { "width": 480 }`).
- An item that names something not installed is skipped. The test suite checks that none of the bundled samples loses an item or leaves the page.
- Page size is 1000 × 750; keep everything inside it (the browser tests check this).

## Where plugins come from (asset sources)
By default the tool reads this folder through `manifest.js`. Internally that is just one **asset source**:
`CP.addSource({ id, label, list() → [{ path, text? }], script(path) → Promise<boolean> })` before `CP.load()`. A source lists plugin
files (JSON entries carry their `text`; scripts are run by `script(path)`) and can be anywhere: another folder, a server, a gallery.
Optional metadata on any plugin (`author`, `license`, `tags`) is shown and searched by sources that want it. See `docs/HOSTED-EDITION.md`.
