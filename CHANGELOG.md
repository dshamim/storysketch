# Changelog — StorySketch

Versioning: `MAJOR.MINOR.PATCH` in `src/core/version.js`.
- PATCH: fixes and tweaks. MINOR: new features/props/poses. MAJOR: breaking change to the project file.
- The project file has its own `schema` number; when it changes, a migration is added in `src/core/store.js`, so old saved projects still open.
- Each release is a git tag (`v0.1.0`, …). To get an old version back: `git checkout v0.1.0 -- .`.

## Unreleased — the School kit
- **20 School props** (pack "School props"): school building (flag-free front with clock gable, doors open or shut, lights on or off), school gate, school bus (door open, lights on), bus stop with shelter, zebra crossing, crossing-patrol sign, flagpole, hand bell; lockers (2 to 6 doors, one open), classroom door, assembly stage with curtain and microphone, canteen table with benches, lunch tray; football goal, ball (football, basketball, tennis), running track, trophy; backpack and lunchbox.
- **New sample project "A day at school"** (5 pages): the bus and bus stop, the school front, the corridor, the canteen with the stage, and sports day.
- Not built because the Home kit already has them: a wall clock (use **Home props > Wall clock**).

## Unreleased — the Home kit
- **26 Home props** (pack "Home props"): house, front door, garden gate, letterbox; sofa (2 or 3 seats), armchair, coffee table, TV on a cabinet, wall clock (set the hour and minutes), fireplace; dining table with chairs, fridge, cooker, sink and cupboard, kettle, plates and cup; bed, bunk bed, cot, bedside table with lamp, toy box, teddy bear, slippers; bath, basin and mirror; child's bicycle. Each has story states (door open, lights on, fire lit, tap running, pot on the cooker, water and bubbles in the bath…) and search words.
- **Scale:** every seat is 80 high (a child or adult in the Sit pose fits on any of them), counters and the dining table 128, the bed mattress 80.
- **New sample project "A day at home"** (5 pages: living room, kitchen, bedroom, bathroom, outside), built only from the scenery pieces and the Home props, with people sitting on the furniture.
- `tools/check_props.mjs --sheet` now draws every value of every option, labelled, so one sheet shows all the states of a prop.
- Small things (teddy, kettle, plates and cup) are drawn at their natural size, so they come out right at scale 1; the sample project uses scale 1 for every Home prop except the house on the last page (85 percent, to leave room for the garden). The toy box lid is a short propped panel.
- Tests: every sample project is checked for unknown props, characters, poses, option values and pictures (this found an invalid value in the classroom sample, drawn the same as before).

## Unreleased — first props of the new kits
- **Scenery (8 props, pack "Scenery"):** ground (grass, sandy path, road, wooden floor), sky (day, sunset, night), hills, room wall (plain, stripes or dots; window and door), picket fence, stepping stones, clouds, and a window that can show any picture.
- **Home: the house** (`home-house`): front view with a 340-high door (an adult fits through it), open or shut door, lights on or off, chimney.
- **Backdrops land in the right place with one click.** Sky, ground, hills and the room wall have a `place` hint: they appear filling the page (also on other page sizes), in the right spot (the sky ends where the ground begins) and **behind everything else**, in order (sky, wall, hills, ground), wherever you add them from. Props can use `place: { x, y, rank, fit }`; the checker requires it for anything over 800 wide.
- The room wall's window follows the wall's height; the night sky is lighter hatching; the road is clearer.
- A new sample scene (`scene-home-day`) is in the screenshot tests.
- **Fixed:** library thumbnails used up the same counter as item ids, so adding props changed the ids, and with them the crayon wobble, of everything added afterwards. They now have their own counter, so new props no longer move other pictures.

## Unreleased — props plan and style guide
- **Props style guide for agents and contributors** (`docs/PROP-STYLE-GUIDE.md`): scale (child 250, adult 320 at scale 1; door 340; storybook scale for buildings, bus, playground), origin, point of view, line widths, colour slots, hatching, detail budget, states, ids with prefixes, tags, content and licence, a worked example and a checklist. `AGENTS.md` points agents to it.
- **Plan for the first three kits** (`docs/PROPS-PLAN.md`): shared scenery pieces, Home, School (building and bus) and Park, about 70 props; generic, no local kit.
- **`tools/check_props.mjs`** (`npm run check:props`, also in `test:all`): checks a prop against the guide (fields, id prefix, tags, every param value and an empty slot draw finite and identical twice in every style, size, floor line, line widths, shape and point limits, undeclared colour names, forbidden names) and writes contact sheets per style (`--sheet DIR`). The new kits are checked strictly, the airport and classroom props only for the basics. It is a lint, not a security sandbox.
- **Props can have `tags`** (synonyms such as couch for sofa) that the Props search and Ctrl+K match.

## Unreleased — fonts (revamp phase 8)
- **Five real fonts for text**, next to the hand-drawn letters: **Patrick Hand** (neat handwriting), **Comic Neue** (friendly), **Nunito** (rounded), **Crimson Pro** (book serif) and **Caveat Brush** (marker). Pick one from the new **Font** menu in the text ribbon (each option is a drawing of its own name), from **Details ▸ Font**, or with Ctrl+K (*Font: Nunito*, when a text is picked). Bold is a real Bold where the font has one (Comic Neue, Nunito, Crimson Pro), and a thickened outline for the other two.
- **Nothing to install, ever.** The letters are stored as outlines inside StorySketch and drawn as ordinary shapes, so every drawing style (crayon, marker, ink, chalk) finishes them, a page looks the same on every computer, and exported SVG and PNG never need the font. All five are free OFL fonts; the licence of each is kept next to it (`plugins/fonts/*-OFL.txt`, `THIRD-PARTY-NOTICES.md`).
- **Kerning and sizes:** pairs such as "AV" and "To" are tightened the way the font intends, and every font is scaled so its capital letters match the hand-drawn ones, so switching font keeps a text box about the same size. Letter spacing, line spacing, wrapping, rainbow and per-line colours, underline and in-place editing all work with every font.
- **Old files are safe.** `font` was already part of a text item ("hand"); saved files list the fonts they use like any plugin, and a file whose font is not installed opens, shows the words in the hand-drawn letters, and says so in the "opened a file" card (the file keeps the font name, so installing it later fixes it).
- **For makers:** a new plugin type `font` (purely declarative: outlines, spacing and licence, no drawing code, so a gallery could later accept one as plain data) and `tools/build_fonts.py` (downloads the pinned source files, checks their sha256 and licence, removes overlapping outlines, subsets to English text, works out kerning with HarfBuzz and writes `plugins/fonts/<id>.js`). `npm run check:plugins` fails if a font plugin has no licence record or licence text.
- The text box now covers every letter's ink (tall letters, long tails, brackets), so the selection frame, click area, Export ▸ Selection and Line up are right for every font; letters get more curve detail as the text is enlarged, so big exports (up to 4×) stay smooth.
- Styles: a font letter is a filled shape with several outlines (`more`, drawn with the even-odd rule so holes and dots work) flagged `glyph`; marker, ink and chalk draw it solid so small text stays readable. Third-party styles that ignore `more` draw only each letter's main outline.

## Unreleased — polish: search, shortcuts, tips, accessibility (revamp phase 7)
- **Search everything (Ctrl+K, or the magnifier in the top bar).** One box that finds and does: every action in the menus (with its shortcut and its on / off tick), tools, panels, characters (add, new, edit), props, shapes, text styles, drawing styles, samples and pages. Recent things come first. It opens from anywhere, even from a text field or the designer. Arrow keys and Enter, or tap a result.
- **Keyboard shortcut sheet (?).** Every shortcut and mouse modifier on one page (also in Help). It is drawn from a single table that a test checks key by key.
- **Three one-time tips** that show when they help: drag the dots to pose, double-click a text to change it, press Ctrl+K to search. Small cards in the top-left of the page, never over a tool bar, tab bar or the page strip; they finish when you dismiss them, do the thing, or ignore them twice. **Help ▸ Show the tips again** starts over.
- **Empty states and wording.** An empty page or an empty Layers list says where to look ("from the left", or "from the bar below" on a tablet held upright). Shorter text in the Shapes, Text and Layers panels and in the page Details (the old tips list is gone: the tip cards, the shortcut sheet and search replace it). Touch wording on a tablet.
- **Motion** is short and gentle (a quarter second at most) and switched off by the operating system's "reduce motion" setting.
- **Accessibility.** Lighthouse accessibility scores 100 in 20 desktop states and 8 tablet states (it was 94 at the lowest). Section headings no longer skip a level; colour swatches, Layers buttons, sliders and small fields are at least 24 px on a desktop (44 px on touch); every icon button in the Layers list says which layer it is for; the page canvas has a name that points to the Layers list, which is the keyboard way to things on the page (pick one, then Delete, arrow keys and **F2** to edit its words work); the Export Look menu has a label. A Tab-key walk-through test checks every stop is on screen, has a visible focus mark and nothing traps the focus.
- **Fixed:** pack headers in the Props panel keep their ▼ arrow (caught by the screenshot tests while adding the 24 px rule); closing the search or shortcut sheet gives the focus back properly.
- Repeatable audit: `tools/a11y-audit.mjs` (needs `npm i --no-save lighthouse puppeteer-core`; the in-repo checks in `tests/e2e/a11y.test.mjs` always run).

## Unreleased — touch and tablets (revamp phase 6)
- **Touch mode.** With a finger as the main pointer (a tablet) every control is at least 44 px, swatches and layer rows are finger-sized, and the handles on the page are drawn larger with an invisible 44 px grab area behind each one. **View ▸ Touch-friendly sizes** switches it on or off by hand (handy on a touch laptop) and remembers the choice.
- **Gestures.** Pinch to zoom, two fingers to pan; a second finger landing in the middle of a drag cancels that drag cleanly (nothing is changed or marked unsaved); a wobbly tap is still a tap; **long-press** on something selects it and opens its More menu; **palm rejection**: touches are ignored while a pen is down, and a palm that landed first has whatever it started thrown away when the pen arrives. When two handles are close together the one nearest your fingertip is the one that moves. One finger pans with the **Hand** tool.
- **Tool bar** (touch only, floats at the bottom of the page): **Select, Hand, Text, Shapes, Several** (taps add to the selection; a finger has no Shift key). **V** now selects.
- **Finger drawing.** A line that is nearly level (or at 45 degrees) snaps straight, and a shape that is nearly square becomes square, because there is no Shift key on a tablet.
- **Tablet layouts.** Up to 1100 px wide: Details slides over the page and the library starts folded away. Up to 900 px (a tablet held upright): the rail becomes a **bottom tab bar**, the library and Details become **bottom sheets** (one at a time, the page stays visible above), and the ribbon scrolls sideways with Details always in reach. The page no longer scrolls or pulls to refresh.
- **Typing on a tablet.** The page area follows the visible height, the text you are typing is panned into view above the on-screen keyboard, and **Done typing** replaces Esc.
- **Fixed:** typing started with a tap was cancelled by the browser's late mouse event; the hint pop-ups could sit over (and catch taps meant for) the bottom bars. They now ignore touches and float at the top in touch mode.
- Not included: the pencil (so no pencil on the tool bar; a pen is just a pointer with palm rejection), Alt free-move and Alt-click cycling (no touch version), iPad Safari (not tested).

## Unreleased — designer and add-ons as panels (revamp phase 5)
- **The Character designer is a side panel**, not a pop-up. It opens in the Details column with a live preview and a pose picker on top (they stay in view while you scroll), the cast as a small strip, then Name, Main colour, **Character type**, Body, Clothes, Hair, Accessories and Face. Open it with **Edit character** in the ribbon (new), Details ▸ Look ▸ *Edit this character…*, or **New character** in the Characters panel (it now really makes a new character and has its name ready to type). **Done**, the panel's X or **Esc** close it and Details return to how they were.
- **The page stays live while you design.** Pick another figure on the page and the designer switches to its character; Undo / Redo work (every change is one step, not one big step at the end); Delete, the arrow keys, the tool keys and Ctrl+X / C / V / D / G do nothing to the page while you are in the designer (Undo and Redo still work).
- **Character type is a picker**: "Person (stick figure)" or "Four-legged animal" as two tiles, each drawn as your character. Changing it still resets placed figures to the standing pose, and one Undo puts everything back.
- **Save as template** asks for the name inside the panel (no browser pop-up).
- **Add-ons is a tab in the rail** (with its problem badge): what is installed, problems, *Refresh add-ons*, and a compact list of everything loaded.
- **About** and the "opened a file" report are a card in the corner, not a modal. Only the Open / Save steps (older file, permission, could not save) and delete confirmations still block the page.

## Unreleased — shapes and arrows (revamp phase 4b)
- **Shapes tab** in the rail: **Box, Circle, Triangle** and **Line, Arrow, Double arrow**. Click a tile to add one to the page, or use the quick keys **R** (box), **O** (circle), **Y** (triangle), **L** (line), **A** (arrow), **Shift+A** (double arrow), then **drag** on the page to draw it. A plain click drops a default size. **Shift** gives a perfect square or circle, or keeps a line on 15 degree steps. **Esc** cancels. One undo step per drawing.
- **Handles that fit the thing.** A shape has eight resize handles (sides and corners; the opposite side stays put; Shift on a corner keeps the proportions) and the round turn handle. A line has two round end handles. Both still move, scale, rotate, flip, group, lock, line up, copy and undo like any other object.
- **Look.** Ribbon: fill, fill colour, outline colour, thickness, line style (solid, dashed, dotted). Details ▸ Look adds colour swatches, rounded corners (box), see-through, width and height, arrowheads for lines. Fills: none, colour, shading lines, solid (hides what is behind).
- **Words inside a shape.** Double-click a shape (or press Enter) and type; the words stay centred, turn with the shape and are drawn in the current style.
- **Every style.** Crayon, marker, ink, chalk and clean all draw shapes, dashes and arrowheads; exports look the same as the page and the same project always exports the same pixels.
- Not included: the freehand pencil, curved or bent arrows, other arrowhead shapes (the head is a "V").

## Unreleased — text (revamp phase 4)
- **Text tool.** Press **T** (or rail ▸ **Text** ▸ *Add a text box*), then **click** on the page to type or **drag** a box that wraps. The Text panel also has one-click styles: **Title, Heading, Body text, Caption, Number line**. Esc cancels the tool; it is one-shot.
- **Edit in place.** Double-click a text (or press Enter on it) and type. You see the real drawing with a caret and a highlighted selection, so what you edit is what you get; click or drag in the text to move the caret or select letters, Up / Down move by drawn line, Esc or Ctrl+Enter finish. A text left empty disappears, and a whole edit is a single undo step.
- **A normal object.** Text moves, **scales, rotates (round handle, or type degrees in the ribbon), flips**, groups, locks, lines up, copies, undoes and exports like a character or prop. Rotation turns the whole wrapped block and it stays editable. Drag the **side handles** to change the width: it re-wraps and the top corner stays put.
- **Look.** Ribbon: size (− / + / type), **bold**, underline, colour, left / centre / right, **spacing** (line and letter). Details ▸ Look adds the text box, colour swatches, *Fit the box to the text* or a fixed width, and **letter colours** (one colour, a different colour per line, or rainbow). All four drawing styles draw it; Clean shows crisp lines; dark pages get chalk-white text in the Chalk style.
- **Exports as drawing.** Text is turned into strokes, so exported PNG / SVG look the same on any computer (no font needed). Hand-drawn wobble is seeded by the item, so the same project always exports the same pixels.
- **Alphabet.** New symbols `; _ < > [ ] | \ ~ # % & $`, letter spacing, and per-letter positions for the caret. Accented letters are not included (English only for now). The old digits / maths / A B C spacing is unchanged.
- The old *Numbers & words* prop is hidden from the Props list (the Text tool replaces it); projects that use it still draw it.
- Text is saved as an item of type `text` (`text`, `font`, `size`, `color`, `weight`, `align`, `w`, `lineHeight`, `letterSpacing`, `underline`, `colors`, plus the usual `x y s rot flip mode`); no file-format change.
- Tests: `tests/unit/text.test.mjs` (wrapping, long words, newlines, alignment, spacing, caret and click mapping, every character draws, determinism) and `tests/e2e/text.test.mjs` (create / type / edit, caret clicks, rotate by handle and by angle with the export checked, width handles, properties, all styles, undo / redo, group, lock, save and reopen); baselines grew from 25 to 28. Found on the way: the first spacing-slider change closed its own popover.

## Unreleased — selection tools (revamp phase 3)
The controls for what you have selected move out of the always-open right-hand panel into a ribbon, a small floating bar and an on-demand Details panel. Drawings, poses and files are unchanged.
- **Ribbon** (under the top bar) follows the selection. *Nothing selected:* page settings (style, page colour, page size, styled view). *A character:* Expression, **Pose** (a picture grid), Mirror, Colour (full / faded / grey), **Position**, and a Turn box in degrees. *A prop:* its first choice (if it has one), Colour, Flip, Position, Turn. *Several:* **Line up**, **Space evenly**, Group / Ungroup, Lock, Colour, Position.
- **Position** menu: bring to front / forward, send backward / to back, and **line up with the page** (left, centre, right, top, middle, bottom).
- **Line up** and **Space evenly** for several things (spacing needs three). Locked items stay where they are; a character's front arms and legs count as part of it; a selected group moves as one.
- **Mini bar** under the selection: Duplicate, Lock, Delete and More (copy, cut, group, ungroup, zoom to it, details). It sits below the selection so it never covers the turn handle, hides while you drag, and shows only Unlock on a locked item.
- **Details panel** on the right, hidden until you want it (ribbon **Details**, double-click something on the page, mini bar ▸ More, or View ▸ Details panel). Tabs follow the selection: **Look · Pose · Arrange** for a character, **Look · Arrange** for a prop or several things; with nothing selected it shows the tips. **Arrange** has size, turn, flip, order, line up, duplicate, lock, copy to page.
- **Snapping and guides**: while you drag, things snap to the page's edges and centre and to the edges and centres of other items, with pink guide lines. Hold **Alt** to move freely; **View ▸ Snapping** turns it off (remembered).
- **Plainer words**: *Reach (elbow follows)* → **Move whole arm**, *Rotate forearm / shin* → **Turn lower arm**, *Flip bend* → **Flip elbow / knee**, *Layering* → **Put arms / legs in front**, *Colour (normal)* → **Full colour**, *Rescan plugins folder* → **Refresh add-ons**, *Skeleton* → **Character type**, *template* → **starting look**.
- Fixed: pressing Esc with a ribbon menu open (and every item greyed out) used to deselect everything.
- Tests: `tests/unit/arrange.test.mjs` (align, distribute and snap maths), `tests/e2e/selection.test.mjs` (ribbon, mini bar, Details, arrange, snapping, locks, keyboard), the pose tests now go through Details ▸ Pose, and the screenshot baselines grew from 19 to 25 (ribbon, menus, Details tabs).

## Unreleased — new shell (revamp phase 2)
The first visible part of the interface revamp: the outer frame of the app is rebuilt with the new design system. Nothing about how drawings, poses or files work has changed.
- **Top bar**: **File** (New…, Open…, Save, Save as…, Export…, Add-ons…), **Edit** (undo/redo, cut/copy/paste, duplicate, delete, select all, group, ungroup, lock — greyed out when they don't apply), **View** (styled view, zoom, library panel), project name with a **Saved ✓ / Unsaved ●** badge, Undo and Redo icons, **Export** and **Help** (About, with the version).
- **Export** is now a small panel under the Export button instead of a window; Esc closes it.
- **Left rail** with **Characters · Props · Layers** and **Add-ons** (it shows a warning count when an add-on has a problem). Choosing a tab opens its panel; choosing the open tab again, or the arrow button, folds the panel away to give the page more room (remembered). `/` opens the panel and jumps to search.
- **Page strip** along the bottom: a thumbnail of every page (it follows your edits), click to open, **+** to add. **⋯** has rename / notes, duplicate, move earlier/later and delete. **Notes** opens a drawer for the page name and notes. Page Up / Page Down change page. Zoom controls moved to the bottom right.
- **Start screen** on first run and from **File ▸ New**: a blank page or one of the four samples, each with a preview. Starting a new project when there are unsaved changes asks first.
- **Page settings** (drawing style, page colour, page size, Styled view) are in a strip under the top bar. In the next phase this strip becomes the contextual ribbon for whatever is selected.
- Keyboard: arrow keys, Home/End, Space and Enter now work inside menus, the rail and the page strip without also moving the selected item or panning the page (Space used to be swallowed, so a focused button could not be pressed with it).
- Fixes found on the way: the popover helper never closed a menu after a checkbox item (View ▸ Styled view), and a form popover closed when you pressed Tab.
- Wording: *Plugins → Add-ons*, *Paper colour → Page colour*, *Preview → Styled view*.
- Tests: new `shell.test.mjs` (start screen, menus, rail, page strip, notes, export panel, keyboard walk-through, and a checklist that every old control is still reachable), the page / new-project / dialog tests now drive the new controls, and 19 screenshot baselines were regenerated.

## Unreleased — interface foundations (revamp phase 1; nothing changes on screen yet)
- New design system in `src/ui/`: **tokens** (colour, 4 px spacing, type, radii, shadows, control sizes that grow to 44 px on touch screens), **components** (buttons, icon buttons, fields, switch, checkbox, segmented control, tabs, left rail, swatches, popover and menu, tooltip, collapsible section, tile, filmstrip, badge, empty state, top bar, ribbon, mini bar, dialog, toast) and **behaviour** (`ui.js`): keyboard-operable tooltips with shortcuts, popovers and menus, tabs with arrow keys, sections, toasts.
- **99 icons** from Lucide (ISC) as one generated file that works from disk; `docs/ui-kit.html` shows every token, icon and component with live examples. Light theme only.
- The app now loads these files but does not use them yet: the 13 screenshot baselines are byte-identical.
- Tests: contrast of 23 colour pairs (WCAG 4.5:1 text, 3:1 controls), icon integrity, and 11 browser tests for accessibility and keyboard behaviour. They caught two real problems before release: input borders too faint on grey (2.89:1 → 3.4:1) and tooltips vanishing when keyboard focus scrolled the page.

## 0.21.0 — StorySketch: styles, skeletons, tests, open source
The tool is renamed **StorySketch** (it was "Crayon Poser"): crayon is now one of several styles. Existing project files open as before, and your browser autosave and remembered file are carried over.
- **Drawing styles are plugins.** New: **Marker (felt-tip)**, **Ink pen** and **Chalk (blackboard)** next to Crayon, which looks exactly the same as before (checked byte for byte). Pick the style under *Page → Drawing style*; export uses it (or *Clean lines*). Chalk draws dark lines in chalk-white and offers a blackboard page colour. Dark pages work in every style.
- **Skeletons are plugins ("rigs").** The two-armed Person skeleton is now one rig; a new **Four-legged animal** rig adds a **Dog**, **Cat** and **Dinosaur** (long neck and tail, back plates) with their own poses (Stand, Walk, Run, Sit, Lie down, Beg, Bark/roar, Sniff, Happy) and expressions. Add them from *Character designer → New character from template…*; switch any character's skeleton under *Body → Skeleton* (placed figures go back to the standing pose). The editor's handles, drag, bend flip and layering come from the rig, so a new skeleton is one file.
- Accessories can say which skeletons they fit (`rigs`); the apron, wheelchair and moustaches/beards are for people only.
- **Sample projects.** *New project* offers one blank page (the default) or four ready-made samples (2–3 pages each, built from the plugins): a busy classroom (crayon), pets and a dinosaur (marker), a chalkboard lesson (chalk), an airport (ink). They are plugins too (`plugins/projects/*.json`), written in a short readable form (preset pose names, a `floor` line for figures); tests check that nothing is dropped and everything stays on the page. The old 12-page book plan is not part of StorySketch.
- **For a hosted edition**: storage adapters (`STORAGE`) and asset sources (`CP.addSource`) are in the core. See `docs/HOSTED-EDITION.md`.
- **Tests and structure.** Code moved to `src/core`, `src/app`, `src/css`. 100+ unit tests (Node's built-in runner) and headless-browser tests; the Crayon style and the Person rig are pinned against the old output, and every plugin is drawn and checked. CI, MIT license, contributing guide.
- Docs screenshots converted to WebP (15 MB → 3 MB).
- **Editor code split** (`src/app/app.js` → 12 files by job, code moved verbatim) as the first step of the planned interface revamp (`docs/UI-REVAMP-PLAN.md`). Added a safety net first: 13 pixel-compared screenshots of the main UI states and 11 end-to-end workflow tests (add, undo/redo, layer order, group/lock, copy/paste, pose, pages, style, export, save/reopen).

## 0.20.0 — symmetry spider web (maths through art)
- New picture **Symmetry spider web (maths)**, for any picture slot (easel, floor sheet, paper, book pages, artwork line…). It shows a child learning mirror symmetry through art.
  - A spider web with a dashed red **line of symmetry**. The sections coloured on one side are matched on the other side, and the spider's legs mirror too.
  - **Drawing**: *Finished* shows both halves. *Half done* shows the left half finished and the right half as a faint dotted guide still to complete, like a worksheet.
  - **Line of symmetry**: one line (up and down), two lines (also across, with all four quarters matching when there are 8 or 12 spokes), or not drawn.
  - Options: **Spokes** (6, 8 or 12); **Rings** (2–7); coloured-in sections (lots of colours, two colours, or none); spider on or off; and **Write "line of symmetry"** under the web in crayon letters.
- Sample: `docs/symmetry-web.webp`.

## 0.19.0 — crayon / pencil to hold
- New prop **Crayon / pencil (to hold)** (Classroom props → Arts). One drawing tool, made for putting in a character's hand.
  - **What**: crayon, pencil (grey lead, with a rubber on the end), coloured pencil, felt-tip pen, whiteboard marker, chalk, or a thin paintbrush. The colour can be changed.
  - Its origin is the grip, the place the fingers hold it. Drop it on the hand, then turn it with **Pointing**. **Held at** slides the grip between the tip and the end.
  - Options: **Length**; **Worn down** (stubby crayon, chalk or pencil); and **Drawing a line at the tip**, which adds a short wavy line it has just drawn.
  - To show the fingers over it, tick the arm under the figure's *Layering* option, then bring the arm in front of the crayon.
- Sample: `docs/drawtools.webp`.

## 0.18.0 — writing on the whiteboard + open book lying flat
- The crayon handwriting now has the **whole alphabet**: capitals A–Z, small letters a–z (with proper tails on g, j, p, q, y), and **. , ! ' " : / ( )**. Each letter takes its own width, so words space naturally.
  - Pages you already made look the same: text that only uses numbers, maths signs and A B C keeps the old spacing.
  - Changed: a capital **X** is now the letter X. It used to be a times sign. Use a small **x** for times, as in 3x5.
- **Whiteboard**:
  - New **On the board** choice, **Writing (type any text)**. Type any words, and use `|` to start a new line. Long lines wrap by themselves, and the letters shrink to fit.
  - Options: biggest letter size; colours (one blue, black, a colour for each line, or rainbow letters); line up in the middle or on the left; underline the first line as a title; and handwriting lines.
  - It also works on the **Poster**.
- New whiteboard option **Title at the top**: a heading written above whatever is on the board (shapes, times tables, A B C…).
- The **Numbers** prop is now **Numbers & words (crayon)** and takes letters as well.
- New prop **Open book (lying flat)** (Classroom props → Learning): an open book lying on the floor or a table, in perspective, with the pages curving up to the spine.
  - Each page can show words, a picture, a picture with words, or nothing. Any picture can go on either page.
  - Options: size, **Seen from** (low to high), thickness, a page turning over, and a ribbon bookmark.
  - It is placed by the middle of its near edge, so it sits on a table top or the floor.
- Plugin API: `pen.textWidth(str, height)`, `o.align: 'right'`, and `o.strokes` (a colour per letter) for `pen.text`.
- Samples: `docs/whiteboard-writing.webp`, `book-flat.webp`.

## 0.17.0 — children's drawings + the art corner
- New **pictures** for any prop with a picture slot: the floor drawing sheet, easel, *Drawing on paper*, frames, and so on.
  - The kind of drawings a Year 1–2 child makes: **Plant** (a plant in a pot, a flower in the grass, a cactus, or a bean sprout in a cup), **Cat**, **Dog**, **Butterfly**, **Fish in the sea**, **Car**, **Rocket in space**, **Boat on the sea**, **Snowman**, **Ice cream**, **Balloons**, **Rain cloud**, **Me (self-portrait)**, **Dinosaur**, **Shapes**, and **ABC and 123**.
  - **Lots of little drawings**: 2–6 small drawings on one sheet, one of which can be a scribble. **Shuffle** picks different drawings.
  - **Stamp prints**: rows of stars, hearts, flowers, potato prints, handprints or leaf prints, in one colour or lots of colours.
  - **Scribble** now has styles: Messy (the old one, still the default), Loopy loops, Zigzags, Round and round, Coloured-in patches, and Lots of colours.
- New **art-corner props** (Classroom props → Arts):
  - **Arts & crafts table**: low (children's) or tall. **Table top seen from** goes from side-on to looking down, so things on the table can be seen. It can be covered with a plastic sheet or newspaper, and can have paint splats. A sheet of paper lies on the table (any picture can go on it; the default is stamp prints). Things you can put on the table: paint pots, brushes in a jar, a crayon tub, stamps with an ink pad, a lump of clay, and a clay pot. Anything that doesn't fit on the table is left off; make the table wider to fit more.
  - **Stamps + ink pad**: an ink pad with 1–4 stamps, the ink pad on its own, one stamp to hold (star, heart, flower or leaf), or a potato stamp cut in half. The ink colour can be changed.
  - **Stamped paper**: paper covered in stamp prints, upright or lying flat.
  - **Clay pot**: a pot, vase, bowl, mug or little pinch pot. It can be wet clay, baked terracotta, or painted with stripes, dots or zigzags. Options: a bit wonky (hand-made), and 1–4 pots in a row.
  - **Clay / play-dough**: in clay or in bright play-dough colours. Choose a big lump; snakes, balls and a little pot; a rolling pin and cutter; or all of these.
  - **Pottery wheel**, with a lump of clay, a pot, a bowl or a vase on it, and spin lines when it is spinning.
  - **Brushes in a water jar**: the water can be clean, muddy, or swirly with colours.
  - **Glue + glitter**: a glue stick, a glue bottle and a glitter shaker, with spilt glitter.
  - **Paint splats**: on the floor or upright, in one colour or many.
  - **Artwork pegged on a line**: 1–6 pictures pegged on a string. Choose what is on the first three; the others are filled in automatically.
- New accessory **Art apron (painty)** (Character designer → accessories, *Body*): a smock with a pocket and paint spots.
- Samples: `docs/artroom-scene.webp`, `artroom-props.webp`, `kids-drawings.webp`, `scribbles-doodles.webp`.

## 0.16.0 — airport props + moustaches & beards
- New prop pack **Airport props**, in two groups:
  - **Airport – outside**:
    - **Aircraft**: a passenger jet or a small propeller plane. Options: size, wheels down (off for flying), door open, and boarding stairs.
    - **Control tower**, **Terminal building (outside)** with an optional boarding bridge, **Runway / tarmac** with edge lights, and **Windsock** (calm, breezy or strong).
  - **Airport – inside**:
    - **Big window (terminal glass)**: see-through, so an aircraft or tower placed behind it (send it backward) shows as the view outside.
    - **Departures board**: hanging, 2–8 flights with times, gates and on-time or delayed lights; **Shuffle** changes them.
    - **Check-in desk**: desk number, computer screen, and bag belt with scale.
    - **Waiting seats (row)**: 1–8 seats, optionally with a bag left on one.
    - **Suitcase / bag**: wheelie case, hard case, soft case or duffel bag, in three sizes, with pull handle, stickers and luggage tag options.
    - **Luggage trolley** with 0–3 bags, **Gate / direction sign** (gate A/B/C plus a number, an arrow, hung from the ceiling, on a stand or on a wall), **Security scanner** (walk-through arch with a green or red light, plus a bag x-ray belt), **Baggage belt (arrivals)**, and **Passport & boarding pass** (hand-held).
- New accessories, **moustaches and beards** (Character designer → accessories, *Face*): Moustache, Moustache – thin, Moustache – handlebar, Moustache – big bushy, Stubble, Goatee, Beard – short, Beard – full, Beard – long, and Beard – no moustache. They use the character's hair colour unless you pick another colour. The beard keeps the mouth visible, so expressions still show.
- Samples: `docs/airport-scene.webp`, `airport-props.webp`, `facialhair.webp`.

## 0.15.0 — drawing sheet on the floor + loose crayons
- New prop **Drawing sheet (on the floor)** (Classroom props → Arts): paper lying flat on the floor, drawn in perspective, for the *Floor drawing* pose. Paper: a single sheet, a big sheet taped down, or a paper roll that's been rolled out. You can set the **Width**, set **Seen from** (low to high, for how flat the sheet looks), and turn the curled-up corner on or off. Any picture add-on (rainbow, house, family…) can go on the sheet, and it gets laid flat with the paper.
- **Colours on the floor** around the sheet: crayons, coloured pencils, paint pots and a brush, or a bit of everything. You can set **How many** and **Shuffle**.
- New prop **Crayons on the floor (loose)**: the same crayons, pencils and paints without a sheet, with an optional open crayon box. Use it to put colours near a child's hand or anywhere else on the floor.
- To show a child's hands on top of the sheet, tick both arms under the figure's *Layering* option, then bring the arms in front of the sheet. Sample: `docs/floorsheet.webp`.

## 0.14.0 — teacher's pointer stick
- New prop **Teacher's pointer stick** (Classroom props → Learning). Styles: wooden stick with a rubber tip, telescopic metal pointer, star wand, or pointing hand. **Length** goes from 90 to 340. Colours: *stick* and *tip*.
- It's a hand-held prop: its centre point is the grip. Drag it onto a character's hand, then rotate it, and the stick swings around the hand. Sample: `docs/pointer.webp`.

## 0.13.0 — shelves & cupboards
- New prop **Shelves & cupboards** (Classroom props → Furniture). Sample sheet: `docs/shelves.webp`.
  - **Style**: bookcase, tall bookcase, low shelf, cupboard (open shelves over doors, which open or close), cube storage (3 × 2), wall shelves.
  - **What's on the shelves**: full of books, a few books (emptier), books and boxes, boxes of books, or empty. There are no jars.
  - **Box type**: cardboard boxes or coloured fabric bins.
  - **Arrangement** (1–20) shuffles the books and boxes into a different layout. Copies of the same shelf also differ on their own.
  - Colours: *frame* and *box*.
- The old **Bookshelf** (with jars) is unchanged, so existing pages look the same.

## 0.12.0 — change several things at once
- With several things selected, the right panel gets **Change all … together**. It shows what they have in common and changes them all at once. Where they differ it says **mixed**; changing it makes them all the same.
  - **Everything**: colour style (Colour / Faded / Grey pencil) and size.
  - **Characters**: expression, eyes, and **pose presets** (one click and the whole class cheers).
  - **Props**: colours by name (every selected prop with a *wood* colour gets the new wood colour; "(2)" means only 2 of them have it) and the options they share.
  - **Props of the same kind** (e.g. three easels or two wardrobes): their slots too, such as the picture or the garments, plus the chosen add-on's own options when they all hold the same one.
  - Locked items are left as they are.
- Fix: Undo right after dragging a slider or picking a colour no longer skips back past that change.

## 0.11.0 — Alt+click through stacked items
- **Alt+click** picks the front-most thing under the pointer; each further Alt+click picks the next one behind it, round to the front again. A note says which one you have ("2 of 3 here: Lily").
- It counts everything whose outline box covers the spot, so you don't have to hit a crayon line, and it picks single items even inside a group.
- Hold Alt and drag to move the item you picked. Locked and hidden things are skipped. Alt on a pose dot still works as before.

## 0.10.0 — groups, locking, canvas zoom
- **Groups**: select two or more things and press **Ctrl+G** (or **▣ Group** in the right panel). Clicking any member then picks up the whole group to move, resize or rotate it.
  - **Double-click** a member to pick just that item; clicking another member then picks that one.
  - **Ctrl+Shift+G** or **Ungroup** splits the group; **Take out of group** removes one item.
  - Groups can be renamed in the right panel. In Layers they show as **▣ Group** with their items indented, and the header row's eye, 🔒 and ▲▼ act on the whole group.
  - A group's items stay together in the layer order. ▲▼ on one item moves it inside the group.
  - Duplicate and copy/paste make a new group. Older versions open these files fine and simply ignore the grouping.
- **Lock**: **Ctrl+Shift+L** or the **🔒 Lock** button in the right panel (one item, a selection or a whole group). Locked things can't be selected on the page, moved, posed, changed or deleted, and clicks go straight through to whatever is behind them, which helps when picking things in a crowded scene.
  - Unlock from the 🔒 in the Layers tab, the **Unlock** button, or **Unlock all on this page** (shown when nothing is selected).
  - Arrow keys, H (flip), Delete and group resize/rotate now skip locked items.
  - Locking a figure's front-limbs layer locks the figure.
- **Canvas zoom**: **Ctrl + mouse wheel** or a trackpad pinch zooms in where the pointer is (up to 800%). The **− 100% +** buttons at the bottom right also zoom; click the % to fit the page again.
  - **🔍 Selection** zooms to what's selected.
  - While zoomed, the mouse wheel scrolls, and **Space + drag** or middle-button drag moves around.
  - Keys: **Ctrl+=**, **Ctrl+−**, **Ctrl+0** (fit), **Shift+1** (fit), **Shift+2** (selection).
  - Zoom is only the view: it is not saved and doesn't affect export.
- Fix: "To front" / "To back" on several items no longer reverses their order among themselves.

## 0.9.2 — fix Save hanging after a refresh
- Cause: after a refresh, Chrome restores the remembered file but never answers the "may I still edit it?" check. This was seen with the tool opened from a `\\wsl$` path, and the check just hangs, so Save waited forever ("checking permission to edit the file").
- Every permission check now has a time limit (1.5 s). If Chrome doesn't answer, Save asks you to **choose the file once more**. The Save window opens with the same file name: click Save, then Yes to replace. Every save after that goes straight to the file.

## 0.9.1 — Save always shows what happened
- The Save button shows **Saving…** while it works, then **Saved ✓**. Clicking again while a save is running does nothing extra.
- If a step takes longer than 4 seconds, a notice names it (checking permission, reading the file, writing the file) and offers **Save as** or **Keep waiting**.
- Errors appear in the tool's own dialog, with the reason and a **Save as** button, instead of a Chrome alert. Chrome can be set to block alerts, and then they silently show nothing. Delete page, delete character and "open with unsaved changes" now ask in the tool's own dialogs too.
- An edit made just before Save is included in the file and can no longer mark the book unsaved again right after saving.
- The unsaved mark ● now comes before the file name, so it still shows when a long name is cut off.
- Reading the file to check its format gives up after a few seconds instead of holding up the save.
- Every save step is logged in the browser console (F12) as `[save] …`.

## 0.9.0 — prop packs
- The Props tab is grouped by **pack**, then category: all current props are in **Classroom props** (Arts, Learning, Decoration, Furniture).
- Each pack folds open/shut by clicking its name; the tool remembers which are shut. Searching opens every pack and also matches the pack name (e.g. "classroom").
- Plugins: new optional `pack` field on props (or once per file: `CP.register({ api: 1, pack: '…', items: [ … ] })`). Props without one go under **Other props**. Classroom prop files moved to `plugins/props/classroom/`.

## 0.8.0 — clothes rack / wardrobe prop
- New prop **Clothes rack / wardrobe** (Furniture). Styles: rolling *Clothes rack* (wheels on/off) or *Wardrobe* (doors open/closed).
- Three hanger slots (left, right, middle in front) take any **garment** add-on; a **hat** slot sits on the rack post or on top of the wardrobe.
- New add-on kinds: `garment` (long robe, dress, T-shirt, coat, superhero cape, trousers, art smock) and `hat` (wizard hat, crown, top hat, party hat, cap). Each has its own colour per slot.

## 0.7.1 — 2026-11-03
- Fix: after refreshing the page, **Save** could do nothing. Chrome forgets its permission to edit the remembered file on reload, and asking again in the background could fail silently. Save now shows a small "Allow saving to this file again?" dialog; **Allow & save** triggers Chrome's prompt directly. If Chrome refuses, you're told and offered *Save as a new file…*. Saves after that in the same session go straight through.

## 0.7.0 — 2026-11-03
- New prop **Open book (back view)** (`plugins/props/bookback.js`): the back of a book someone is holding up to read. Covers face the viewer, page edges show over the top, and the spine is in the middle. Options: title lines on/off; a *cover picture* slot (any picture add-on); cover, spine and page colours.
- New prop **Hand puppet** (`plugins/props/puppet.js`): options for Person / Dog / Frog / Monster and mouth open (talking); body, head and accent colours.

## 0.6.1 — 2026-11-03
Project files stay format 2 (one optional field added), so older files keep opening.

- **Older files are never overwritten without asking.** The first Save of a file in an older format asks: *Save as a new file (recommended)* or *Upgrade this file*. Save also checks the file on disk, so an old file is caught even if the tool didn't open it this session.
- **Saved files record the plugins the book uses** (`plugins: [{type, id, name, version}]`: hair, clothes, accessories, props, add-ons). On open, plugins that are missing or a different version are listed.
- Opening an older-format file explains what was upgraded and that the file is untouched until you save.
- Hover over the file name: which version saved it, its format, how many plugins it uses, when it was saved, and whether an upgrade is pending.

## 0.6.0 — 2026-11-03
Plugin API stays **1** (additions only) and the project format is unchanged, so 0.5 plugins and projects work as-is.

- **Prop states**: props can have on/off options (`toggle`) and colour options, alongside dropdowns, sliders and text. An option can depend on another (`when`).
  - Desk lamp (new): light on/off. Stage curtains: open/closed. Cardboard box: open/closed (taped).
- **Prop slots + add-ons** (new plugin type `addon`, in `plugins/addons/`): a prop declares a slot of some *kind*, and every installed add-on of that kind appears in its picker, with thumbnails in the right panel. Add-ons can have their own options.
  - `picture`: Tree, Heart, Rainbow, Sun, Family, Scribble, **House**, **Night sky**. Used by the easel, **Picture frame** (was "Rainbow picture"), drawing on paper and the mural.
  - `flower`: Daisies, Tulips, Sunflower, for the potted plant.
  - `chart`: Times tables (editable lines), A B C, Shapes, Weather. Used by the **Wall poster** (was "Times-table poster") and the new **Whiteboard**.
- Crayon letters A, B, C added to the drawn character set.
- Existing pages keep their look. The one exception is the picture frame, which now uses the shared Rainbow picture. Old posters keep their custom text.
- plugins/README.md: states, `when`, slots, add-ons.

## 0.5.0 — 2026-11-03
**Project file format changed (schema 2).** Older projects and the browser autosave are upgraded automatically when opened; the untouched old autosave is kept as a backup (`project/backup-schema1` in browser storage). Projects saved by 0.5 won't open in 0.4.x — use the git tags to go back.

- **Plugins**: hair styles, clothes, accessories, props, characters, poses and templates now live in `plugins/<type>/` as separate files (the built-ins too). Drop new files into the same folders.
  - Any accessory or outfit works on any character (they're drawn against the character's skeleton/face, so they follow size, pose, flips and colour modes).
  - Accessories have slots: base / back / body / face / head. Characters store `accessories: { id: { color } }`.
  - **Plugin API versioning**: every plugin/data file declares `api` (now 1) and optionally its own `version`. Files made for another API (older, newer or missing) are **not loaded and not converted**; they're listed with the reason.
  - **🧩 Plugins** panel: counts, everything loaded (with versions/files), problems, **Rescan plugins folder** (rebuilds `plugins/manifest.js` and reloads). CLI alternative: `python3 tools/build_plugins.py`.
  - Problems in one plugin (missing fields, bad JSON, syntax errors, draw errors) are reported and skipped; everything else keeps working. Missing parts show as warnings in the designer / placeholders on the page.
  - `plugins/README.md`: how to write each plugin type. Examples: Two braids (hair), Overalls (clothes), Sun hat + Scarf (accessories), Guitar (prop), Maya (character, library-only), Hands on hips + Hold out (poses).
  - Characters marked `"starter": false` appear under **Library** in the Characters tab instead of being added to every new book.
- **Left panel**: sticky tabs + quick search for Characters, Props, Pages and **Layers** (Layers moved here from the right; the right panel is now just the inspector). `/` focuses the search; Escape clears it.
- Character designer lists every installed hair style, outfit and accessory; per-accessory colours.
- Rendering of existing characters/props is unchanged (verified against v0.4.1 output).

## 0.4.1 — 2026-11-03
- **Cape side** is now its own switch, separate from the hair: *⇆ Cape side* in the figure panel (shown when the character has a cape), plus *Cape on the other side (default)* in the Character designer. *⇋ Mirror pose* flips both hair and cape.

## 0.4.0 — 2026-11-03
- **Copy / Cut / Paste across pages** (Ctrl+C / Ctrl+X / Ctrl+V, or the buttons in the right panel):
  - Pasted items keep the same size, position, rotation, layer order, pose and detached limbs as on the source page.
  - Pasting back onto the same page nudges the copy 20px so you can see it.
  - The clipboard survives page switches and reloads; characters copied from another project are added to this one.
- **Copy to page…** dropdown copies the selection straight onto another page.
- With nothing selected, the right panel shows a *Paste* button when something is copied.

## 0.3.3 — 2026-11-03
- **Export opens a save dialog** (Chrome/Edge) that starts in the last export folder:
  - Whole page / Selection → file dialog with a suggested name.
  - Every layer → pick a folder once; all files are written into it.
  - Exports remember their own folder, separate from project files (Save as… / Open… keep remembering the projects folder).
  - Untick "Choose where to save" in the Export dialog to go back to plain downloads.

## 0.3.2 — 2026-11-03
- Fix: **⇋ Mirror pose** now also mirrors the hair (ponytail etc.), cape and eye direction, so a mirrored figure matches. (Before, only the body flipped.)
- The nose now points the way the eyes look.

## 0.3.1 — 2026-11-03
- **Hair side**: mirror only the hair (ponytail, side fringe, curls, pigtail ties) and the cape, without flipping the pose or face.
  - Per placement: *⇆ Hair side* button in the figure panel.
  - Per character default: *Hair on the other side* in the Character designer.

## 0.3.0 — 2026-11-03
- **Pages are no longer fixed at 12**:
  - *+ Page* (top bar) adds a page after the current one and puts the cursor in its name.
  - 🗑 deletes the current page, after a warning that says how many items are on it (Ctrl+Z undoes). The last page can't be deleted, only cleared.
  - ✎, or double-clicking the page title strip, opens the page's name and notes.
- **Pages tab**: list of all pages with item counts, click to open, move up/down, duplicate (characters, props and detached limbs are copied), delete.
- **New** asks: start from the 12-page book plan, or one blank page.
- Saved projects from earlier versions open unchanged (no format change).

## 0.2.0 — 2026-11-03
- **Save / Save as… / Open…** with real files (Chrome/Edge):
  - *Save* (Ctrl+S) overwrites the file you last saved or opened, no dialog. The first save of a new project asks where to put it.
  - *Save as…* (Ctrl+Shift+S) writes a copy to a new file via the file dialog and makes that the current file.
  - *Open…* (Ctrl+O) remembers the file, so the next Save updates it. The current file is remembered across reloads (Chrome may ask once to allow editing it again).
  - Header shows the current file name; `•` = unsaved changes.
- **Multi-select**: Ctrl/Shift-click (canvas or Layers list), drag a box on empty space, Ctrl+A for all.
- **Group transform**: drag to move together; purple corner handle resizes the group (positions and sizes scale together); purple circle rotates the group (Shift snaps to 15°). "Flip each" for the selection.

## 0.1.2 — 2026-11-03
- Elbows/knees are no longer locked to one bend direction:
  - **Shift-drag** a hand/foot (or pick *Rotate forearm / shin* in the figure panel) turns only the forearm/shin around the elbow/knee — any angle, either way.
  - **Double-click** an elbow/knee dot, or use the *Flip bend* buttons, to bend it the other way while the hand/foot stays put.

## 0.1.1 — 2026-11-03
- Dresses are now a bodice + a skirt that follows the thighs: an A-line triangle when standing, and draped over the lap with the legs coming out under the hem when sitting (no more slanted "tent").
- Long hair sits closer to the head (no helmet look); headscarf hugs the head and drapes over the shoulders.
- Fixed prop count in notes (36).

## 0.1.0 — 2026-11-03
- Editor: 12 pages from the page plan with notes, layers (show/hide, lock, reorder), undo/redo, autosave, save/load project JSON.
- Clean vector editing + **crayon preview** (P) using the same crayon pass as export (wobbly doubled strokes, scribble hatching, wax grain; seeded so re-exports match).
- Figures: drag hands/feet (IK), elbows/knees, lean, head tilt; flip, mirror pose, eye direction, 8 expressions.
- **Detach limbs** to their own layer (hands on top of a drum/book/table while the body stays behind).
- Props have paper fill so layering hides what is behind (e.g. a desk hides legs).
- **Character designer**: mix-and-match body (stick, dress, long dress, T-shirt, striped, tunic) + 13 hair styles + glasses / mask / crown / cape / wheelchair / face tint; colours; height; line weight; skirt length. Dresses follow the legs, so they drape over the lap when sitting.
- Presets: 12 cast members, 10 character templates (+ save your own), 27 poses, 36 props.
- Per-item colour mode: colour / faded / grey pencil.
- Export: whole page / selection / every layer; crayon or clean; transparent or paper; 1–4×; PNG or SVG.
