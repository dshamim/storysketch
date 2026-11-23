# Prop style guide (for AI agents and contributors)

Read this before you draw a prop for StorySketch. Every rule comes from the props already in the tool, or from the checker that enforces it.
When this guide and `node tools/check_props.mjs` disagree, the checker is right and the guide has a bug: tell a maintainer.

A **prop** is one thing on a page that is not a person: a sofa, a bus, a slide, a tree. It is one `.js` file (or several props in one file) in `plugins/props/<kit>/`.
The full plugin format is in [`plugins/README.md`](../plugins/README.md) (section "Props"). This guide is about how props should **look**.

## 0. The job in six steps
1. Read the rules below and look at the worked example (section 12; the file is [`tests/fixtures/example-prop.js`](../tests/fixtures/example-prop.js)).
2. Copy the example. Change the `id`, `name`, `tags` and the drawing.
3. Run `node tools/check_props.mjs --file your-file.js`. Fix every `FAIL` line.
4. Run `node tools/check_props.mjs --file your-file.js --sheet /tmp/sheet` and **look** at `props-crayon.svg`, `props-marker.svg`, `props-ink.svg`, `props-chalk.svg` and `props-clean.svg` in a browser. Does it read as the thing, in every style, at about 130 px wide? If not, simplify.
5. In the tool, open the Props tab and drop it next to a person (section 2). Is it in proportion?
6. Open a pull request with the file, the contact sheet images and one sentence on what the prop is for.

## 1. What a prop is made of
- You draw with `p` (the pen) inside `draw(p, P, item, x)`. You only ever add **clean shapes**: `p.line`, `p.curve`, `p.poly`, `p.rect`, `p.ell`, `p.circ`, `p.arc`, `p.text`. The tool turns them into crayon, marker, ink or chalk by itself. **Never draw wobble, grain, texture, shadows or gradients yourself.**
- Coordinates are page units on a **1000 x 750 page**. **y goes down.** So things above the floor have **negative** y.
- A prop must be **drawn at scale 1**. People place it at scale 1 by default, and a new person is also added at scale 1, so what you draw next to a person at scale 1 is what the user sees.

## 2. Scale (the most important rule)
At scale 1: **a child is about 250 units tall and an adult about 320.** (Measured on the sample characters.)

| Thing | Size at scale 1 | Where it comes from |
|---|---|---|
| Chair | seat 80 high, back 194 | existing classroom chair |
| Table / desk | 128 high | existing classroom table |
| Bookshelf | 234 high, 208 wide | existing |
| Wardrobe | 351 high | existing |
| Suitcase | 139 high | existing |
| Plant | 147 high | existing |

Furniture and small things are **human scale**: draw them in proportion to the 250 / 320 people above.

**Buildings, vehicles, boats and big playground things are storybook scale.** They cannot be true size on a 750-high page, and children's books draw people large against buildings. So:

| Thing | Size limit at scale 1 |
|---|---|
| Door of a house or school | **340 high, 100 wide** (an adult fits through it) |
| Window | sill about 150 up, about 120 high |
| House (whole) | at most **800 wide x 620 high** |
| School building | at most **940 wide x 560 high** |
| School bus | **760 long x 360 high**, door opening about 280 high |
| Slide, climbing frame | platform about 220 high, whole thing at most 340 high |
| Swing frame | about 330 high, seat 80 from the ground |
| Tree | 450 to 650 high |
| Bench | seat 70 high, back 170 high, about 260 wide |

Do **not** shrink a building so that a person looks right next to it. Keep the numbers above. The checker only enforces that a prop fits the page; you must check the proportions by eye, so do step 5.

## 3. Origin
- **Floor props** (anything that stands on the ground): the origin is the **bottom centre**. The lowest point is at **y = 0** (within 12) and the middle is at **x = 0**. The checker enforces this.
- **Floating props** (sun, cloud, balloon, kite, bird): put `floating: true` on the prop and centre it on (0, 0).
- **Page-wide scenery** (ground strips, sky, walls) may be up to 1000 wide. Make them stretchable with a `range` param, or draw them exactly 1000 wide.

## 4. Point of view
Draw objects from the **front, with a slight look-down**: a table top is a thin slanted parallelogram, a stool top is a flat ellipse (see the classroom table and stool). **No vanishing-point perspective, no isometric.** Buildings and vehicles are drawn from the side or front, flat.

## 5. Lines
- **Main outline: 4.5.** Secondary lines and inner shapes: **3 to 3.5**. Details (a handle, slats, a button): **2 to 2.5**. Fine marks (wood grain, stitches): **1.5**.
- The checker rejects anything under 1 or over 12. Do not use odd widths such as 3.37.
- Use `stroke: 'line'` (the prop's main colour slot) for outlines. Round joins are automatic.

## 6. Colour
- Declare **named colour slots** in `colors`. **`line` is required** (the main outline colour). Add a slot for each part people may want to recolour (`cushion`, `roof`, `door`). Use the slot **name** in `stroke`, `fill` and `hatch`. Anything else must be a `#hex` colour. A misspelt slot name silently draws nothing; the checker catches it.
- **Objects use calm outline colours:** wood `#8a5a33`, grey metal and stone `#6f6f6f`. Use a hue from the shared palette (`CP.helpers.PAL`: `#e53935 #fb8c00 #fbc02d #43a047 #1e88e5 #8e24aa #d81b60 #00897b`) for toys, signs and accents, not for whole pieces of furniture.
- **Solid surfaces need `fill: 'paper'`.** It paints the page colour, so a thing in front hides what is behind it. Without it, layered props show through each other.
- **Shade with hatching, not with solid colour.** `hatch: 'slotname'` with `hg` (gap, 6 to 7), `halpha` (0.35 to 0.5) and `ha` (angle, default -40). Keep solid colour fills small (a cushion, a flag).
- **Never use a big solid dark fill** (a night sky, a dark wall): in chalk it turns into grey dust. Use dense hatching instead (`hatch: 'night', hg: 5, halpha: 0.8` on a `paper` fill). Dark colours (very dark browns, navy) are drawn chalk-white on a dark page, so keep them mid-tone if they must stay visible there.
- **Backdrops** (sky, ground, hills, wall) are page-wide: users send them to the back and lock them. Draw them up to 1000 wide and let `width` / `height` range params shrink them.
- Do not use black or white as a colour; people can switch the page to chalk-on-dark and light colours or very dark colours must still read. Test it in the chalk sheet.

## 7. How much detail
- Median prop in the tool: **9 shapes**. A quarter have 14 or more; the most detailed have about 70.
- **Simple props: under 25 shapes. Hero props (house, bus, school): under 60.** The checker refuses more than **90 shapes** or **1500 points**.
- The test for "enough detail": at **130 px wide** in the crayon sheet, can you tell what it is? If yes, stop. Extra detail turns to mush in crayon and chalk.
- Prefer a few bold shapes to many small ones. No tiny text. Windows, planks and tiles can be 3 to 5 repeats, not 20.

## 8. States and slots (props that tell a story)
- Use `params` for story states: door open or shut, lights on or off, day or night, season, full or empty, colour. **Every param needs a `key`, a `label` and a `def`** (the default). A `toggle` is on or off, a `select` has `options: { value: 'Label' }`, a `range` has `min`, `max`, `step`. The checker draws **every value** of every param.
- Use a `slots` entry with `kind: 'picture'` for a window or a frame that can show a picture (sun, tree, night sky…). Every slot needs `kind`, `box: [x, y, w, h]` and `def`; the kind must exist among the installed add-ons. Draw the prop so it **also looks right when the slot is empty** (`none`); the checker draws that too.
- Do not invent a new slot `kind` unless you also add add-ons for it.

## 9. Randomness
Props must draw the **same picture every time** (re-exports must match). If you need variety (book colours, leaves), take it only from `const rng = U.rng(U.hash(item.id))` and call `rng()`. **Never** use `Math.random`, `Date`, counters or anything that changes between calls. The checker draws twice and compares.

## 10. Names and ids
- `id`: lowercase letters, digits and hyphens. **A later registration with the same id silently replaces the earlier prop**, so every id needs a prefix:
  - built-in kits use `scenery-`, `home-`, `school-`, `park-` (for example `home-sofa`, `school-bus`);
  - **community props use your own prefix** (for example `mysticgarden-bench`). Pick one that is yours and keep it.
- `name`: what a child would call it (**Sofa**, **School bus**). English, no accented letters, 1 to 3 words.
- `pack`: the group in the Props tab (**Home props**, **School props**, **Park props**). `cat`: one of **Furniture, Decoration, Nature, Buildings, Vehicles, Playground, Kitchen, Bedroom, Bathroom, Garden, Sports, Learning, Arts, Food, Toys, Signs, Scenery, School, Weather**.
- `tags`: **3 to 6 words people might search for**, including other names (`couch`, `settee` for a sofa; `lorry` for a truck; `slide` also `chute`). Both the Props search and Ctrl+K look at them.
- `version: '1.0.0'` and `api: 1` on every prop.

## 11. Words, content and licence
- Words on a prop only through `p.text` (the hand-drawn letters: `A-Z a-z 0-9 x + = - ? ! . , ' : / ( )`). Keep them short. If people may flip the prop, avoid words, because flipping mirrors the whole prop.
- **Original work only.** Do not trace or imitate clip art, other apps' assets, characters, logos or brands. No brand names on buses, shops or food.
- **Suitable for young children:** no weapons, no violence, no scary or adult content, no real people.
- You must be able to release the file under the project's **MIT licence**. Say so in the pull request.

## 12. Worked example
The whole file is [`tests/fixtures/example-prop.js`](../tests/fixtures/example-prop.js) and a unit test runs it through the checker, so it is always correct. In short:

```js
(() => {
  CP.register({ api: 1, version: '1.0.0', type: 'prop', id: 'example-bench', name: 'Bench', pack: 'Example props', cat: 'Furniture',
    tags: ['seat', 'park bench', 'garden'],
    colors: { line: '#8a5a33', cushion: '#1e88e5' },
    params: [{ key: 'cushion', label: 'Cushion', type: 'toggle', def: false }],
    draw(p, P, item) {
      const o = { stroke: 'line', w: 4.5 }; const d = { stroke: 'line', w: 3 };
      for (const s of [-1, 1]) { p.line([[s * 105, -74], [s * 112, 0]], o); p.line([[s * 105, -170], [s * 105, -74]], o); }   // legs and back posts
      p.poly([[-130, -74], [124, -74], [112, -88], [-118, -88]], { ...o, fill: 'paper', hatch: 'line', hg: 7, halpha: 0.35 }); // seat
      for (let i = 0; i < 3; i++) p.rect(-118, -164 + i * 26, 236, 20, { ...d, fill: 'paper' });                                 // back slats
      if (P.cushion) p.poly([[-100, -88], [100, -88], [94, -102], [-94, -102]], { stroke: 'cushion', w: 3, fill: 'paper', hatch: 'cushion', hg: 6, halpha: 0.5 });
    } });
})();
```
Things to notice: everything stands on y = 0 and is centred on x = 0; outlines are 4.5 and 3; every surface is `fill: 'paper'`; the shading is hatching; the one colour that is not `line` is a declared slot (`cushion`); the param has a default; it is about 8 shapes.

## 13. Checklist before you open a pull request
- [ ] `node tools/check_props.mjs --file <your file>` prints `0 problem(s)`.
- [ ] I looked at the contact sheet in **all five** styles and it still reads as the thing.
- [ ] I placed it next to a child and an adult in the tool and the size looks right (section 2).
- [ ] Every param value and the empty slot look right.
- [ ] The id has a prefix, there are 3 to 6 tags, the name is plain English.
- [ ] It is my own work and can be MIT licensed; nothing branded, nothing unsuitable for young children.
- [ ] `npm run check:plugins` is clean after running `python3 tools/build_plugins.py` (new files must be in `plugins/manifest.js`).

## 14. What the checker does and does not do
**It checks:** required fields, id prefix, tags, category, a `line` slot; every param value and an empty slot draw without errors, with finite numbers, identically twice, in every style; size fits the page; floor props stand on y = 0; line widths; shape and point limits; every colour is a declared slot or a hex colour; forbidden names in the code (`document`, `fetch`, `eval`, timers, storage, `Math.random`, `Date`).

**It does not check:** whether it looks good, whether it is in proportion, whether it is original, or whether it is safe. And it is **not a security sandbox**: a prop's `draw` is JavaScript that runs in the page, so **every community prop needs a human to read the code before it is accepted.** For uploads in a hosted edition, props will have to run sandboxed or be written in a declarative format; see [`HOSTED-EDITION.md`](HOSTED-EDITION.md). Until then, props arrive as pull requests.
