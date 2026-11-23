# StorySketch — UI revamp plan

**Status:** in progress. Phase 0 (safety net + `app.js` split), Phase 1 (foundations: tokens, icons, components, `docs/ui-kit.html`) and Phase 2 (shell) and Phase 3 (ribbon, mini bar, Details panel, arrange, snapping) and Phase 4 (text tool) and Phase 4b (shapes and arrows) and Phase 5 (dialogs become panels) and Phase 6 (touch and tablet, tested by emulation only) and Phase 7 (polish: search, shortcut sheet, tips, accessibility) and Phase 8 (fonts) are done. The revamp plan is complete; what is left is the real first-run test with a new person. Written 2026-11-21 against v0.21.0 and updated with the owner's decisions (below).
Goal: an interface that is as simple as **Canva's**: clear logical groups, graphical icons, controls shown only when relevant, a first-class **text tool**
and a small set of **shape / arrow / pencil** tools.

## Decisions (owner, 2026-11-21)
| # | Decision |
|---|---|
| D1 | **Look and feel: like Canva** — deliberately simple, light, friendly. **Light mode only** (decided). Colours still go through tokens so a dark theme stays possible later, but nothing is built for it. |
| D2 | **Basic drawing tools: yes, kept basic** — box (rectangle), circle/ellipse, triangle, line, arrow, double arrow; nothing fancy. A freehand pencil is optional and last in the queue. |
| D3 | **Language: English only** for now (no RTL/complex-script work; text on a curve is not planned). |
| D4 | **Open-source download: Windows only (Chrome/Edge)**; Mac later (nobody here has a Mac to test on). **The hosted edition must run on tablets** — no tablet is available, so it is tested with browser touch emulation, a Windows touch laptop and a phone (§7). Phones: not in v1. |
| D5 | **Left rail categories accepted** (Characters, Props, Shapes, Text, Layers, Add-ons); refine as we go. A **contextual ribbon under the top bar** is added (§4.2). |
| D6 | **Vocabulary: consistent, non-technical.** Proposal in §4.9 ("Character type", not "Body type" / "Skeleton"). |

---

## 1. Principles
1. **Canvas first.** Chrome shrinks; the page is the hero. Panels can collapse.
2. **Tools, library, properties are three different things** and live in three different places (today they are mixed).
3. **Contextual, not permanent.** The few most-used controls float next to the selection; everything else sits in a grouped panel; rarely used things hide behind "More".
4. **Icons first, words on hover** (tooltip with the shortcut). Words stay where an icon would be ambiguous.
5. **Same object model for everything.** Characters, props and **text** all rotate, scale, flip, layer, group, lock, copy the same way.
6. **Keep what makes it special:** works from a file, no server, plugin-driven, pose handles on the canvas.
7. **Plain-language labels.** "Elbow flip", "Skeleton", "Detach limbs" become things a teacher or parent understands.

## 2. Audit of today's interface (from screenshots of v0.21.0)
| # | Problem | Evidence |
|---|---|---|
| A1 | **Top bar is overloaded:** ~16 controls of 4 unrelated kinds (page navigation ×6, preview, undo/redo, tools launchers, file ×5, export) | header: ◀ select ▶ + Page ✎ 🗑 Preview ↶ ↷ Designer Plugins Export Save Save as Open New |
| A2 | **Emoji as icons** (✏️ 👤 🧩 ⬇ 🗑 🔒 🔍): inconsistent size/weight, OS-dependent, look amateur | whole UI |
| A3 | **Left panel mixes unrelated things:** libraries (Characters, Props) with document structure (Pages, Layers) in one tab strip | tabs: Characters · Props · Pages · Layers |
| A4 | **Pages are a dropdown** in the top bar; no thumbnails; page notes are a truncated strip over the canvas | header select; "Page 1 · Reading time …" strip |
| A5 | **Right panel is one long scrolling form** with explanatory paragraphs, native `<select>`s and 4-up pose tiles clipped mid-row; no sections you can collapse; the most-used actions (rotate, duplicate, delete, order) are not at hand | Teacher selected: ~10 groups, "Layering" text paragraph, checkboxes below the fold |
| A6 | **No contextual toolbar** on the canvas; everything is in the far-right panel, away from the pointer | — |
| A7 | **No tool palette** (Select / Pan / Text / …); tools are implicit | — |
| A8 | **No text tool.** Text exists only inside certain props (Whiteboard "Writing", "Numbers & words", Poster) | no `text` item type |
| A9 | **Modal dialogs for big jobs** (Character designer, Plugins, Export, New) hide the page you are working on | 4 `<dialog>`s |
| A10 | **No start screen / empty state:** a new user lands on a blank page with no guidance; samples are buried in the New dialog | — |
| A11 | **Missing editor basics:** I found no align/distribute, snapping or smart guides, no shortcut cheat-sheet, no command search | grep of `app.js` |
| A12 | **Jargon and long help text inline** ("Dragging hands & feet", "Flip bend", "Layering — Tick limbs to put them on their own layer…") | right panel |
| A13 | **Accessibility gaps:** one `aria-` attribute in the app, default focus styles, small hit targets, colour-only cues (handle dots), no dark mode | `index.html`, `app.js` |
| A14 | **No visual system:** colours, radii, spacing, type sizes are ad-hoc in one 123-line CSS file; no tokens | `src/css/app.css` |
| A15 | `app.js` is one 1,300-line file mixing state, rendering and DOM; a UI revamp is risky without splitting it | structure |

## 3. Research — what the tools we want to resemble do
(Findings are from the sources linked in §10; where a source was thin I say so.)
- **Canva.** Light-themed, *floating* object panel on the left with tabs such as Templates, Elements, Uploads, Photos; tabs adapt to the design type; the panel collapses to leave a clutter-free canvas. Selecting text opens a toolbar above the editor (font, size, colour, spacing, more). Text has presets (Title / Subtitle / Heading / Subheading / Body). A paint-roller copies style between elements. Selecting an element also shows a small floating toolbar with Duplicate and Delete, and **Position** (layer order) sits in the toolbar above the editor. *Critiques:* frequent layout changes make users feel lost; options move. → **Keep the structure stable; collapse, don't rearrange.**
- **Miro.** Four toolbars: board bar top-left, **creation bar on the left**, collaboration top-right. Select and Templates are pinned by default; users can pin and reorder tools. *Critique (community):* the floating editing toolbar can cover content and can't be moved/hidden. → **Contextual toolbar must offset itself from the selection and be dismissible.**
- **Figma UI3.** Floating panels, a header row in the properties panel with actions for the selected object, properties grouped by workflow, labels added so users no longer hover to learn what a control does. *Critiques:* can't reposition floating panels, bottom toolbar uses space, section grouping not always logical. → **Group by task, label things, don't over-float.**
- **tldraw / Excalidraw.** tldraw moved its toolbar from the left to the **bottom** and reworked menus; its SDK hides toolbar items when space runs out. Excalidraw edits via select-then-properties and is described as busy by some users. → **A small bottom tool palette works; overflow must degrade gracefully.** (Penpot: sources were too thin to say anything.)
- **Editor patterns (UX Planet, Unity, CE.SDK, Qt, Salesforce).** Header for modes/views; a compact **contextual bar for the most-used properties** of the current selection ("inspector bar" above the canvas); the rest in a docked/on-demand panel; tabs to split a properties panel; labels sometimes beside inputs in dense panels.
- **Progressive disclosure (NN/g).** Show primary options; defer secondary ones to a subsidiary place; group advanced items into meaningful categories so the hidden layer isn't a junk drawer.
- **Empty states.** For editors the *template gallery is the empty state*: first-run shows examples to react to rather than a tutorial. → **Our four samples become the start screen.**
- **Command palette.** Ctrl/⌘+K overlay combining search and actions, shows shortcuts beside each action (teaches them), recent items when empty, full keyboard operation, accessible dialog semantics.
- **Icons.** Lucide (ISC ≈ MIT, ~1.5k icons, clean general set), Tabler (MIT, ~5–6k icons, consistent 2px stroke on 24×24), Phosphor (MIT, six weights incl. duotone). All tree-shake; the licence notice must stay in source. → **Lucide** as the base (calm, consistent), Tabler for gaps.
- **Tokens.** CSS custom properties; primitives → semantic aliases; light/dark via `light-dark()` or a `data-theme` attribute; 4 px spacing base. (Sources disagree on 4 vs 8 px; we use a 4 px scale with 8 px as the common step.)

*Not verified:* I could not open Canva/Miro/Figma themselves from here, so layout claims come from their help pages and articles. Before building, take 10 minutes to screenshot the real editors for the three things we copy (left rail + flyout, floating selection toolbar, properties panel) and check §4 against them.

## 4. Proposed layout (Canva-simple)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ ▣ StorySketch   File ▾  Edit ▾  View ▾        Untitled · Saved ✓        ↶  ↷    [⬇ Export] │  top bar
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ RIBBON (changes with the selection)                                                      │
│  nothing selected: Style ▾ · Page colour · Page size       text: Font ▾ − 48 + B  ● ≡ ⟳  │
├────┬────────────────┬──────────────────────────────────────────────────┬────────────────┤
│ 👤 │ Characters     │          ┌─ mini bar ─┐                           │ DETAILS        │
│ ▢  │ [search…]      │          │ ⟳ ⧉ 🔒 🗑 ⋯ │                           │ (on demand,    │
│ ◇  │ ┌──┐┌──┐┌──┐   │          └────────────┘                           │  pinnable)     │
│ T  │ │  ││  ││  │   │              page / canvas                        │ Look │ Pose    │
│ ☰  │ └──┘└──┘└──┘   │                                                   │ Arrange        │
│ 🧩 │ Library…       │                                                   │ ▾ sections     │
├────┴────────────────┴──────────────────────────────────────────────────┴────────────────┤
│ ▢ 1 Reading time  ▢ 2 Art corner  ▢ ＋       Notes ▸              −  100%  +  ⤢  ?       │  filmstrip + zoom
└─────────────────────────────────────────────────────────────────────────────────────────┘
```
Like Canva: a **simple top bar**, a **left rail with a flyout** for things to add, a **ribbon** with the controls for whatever is selected,
a small **floating mini bar** on the selection, and **no permanent properties panel** — the **Details** panel opens on demand (button in the ribbon, or pinned) for everything that doesn't fit the ribbon.

### 4.1 Top bar (answer to "do we need basic tools at the top?" — yes, but only these)
`Logo` · **File ▾** (New, Open…, Save, Save as…, Export…) · **Edit ▾** (Undo, Redo, Cut/Copy/Paste, Duplicate, Select all, Group/Ungroup, Lock) · **View ▾** (Zoom, Fit, Clean/Styled view, Grid & snapping) ·
project name + **save status** (“Saved ✓ / Unsaved ●”) · **Undo / Redo** icons · **Export** (primary) · **Help ?** (shortcuts, tour, About + version).
Nothing else: no page controls, no tool launchers.

### 4.2 Ribbon (context strip)
One fixed strip under the top bar; its content follows the selection; the most-used controls only (everything is also in Details).
| Selection | Ribbon contents |
|---|---|
| Nothing | **Style ▾** (Crayon / Marker / Ink / Chalk, with previews) · Page colour · Page size · Edit view (Clean ↔ Styled) |
| Character | Expression ▾ · **Pose ▾** (opens the pose grid) · Mirror · Colour · Position ▾ · ⟳ Rotate (angle field) · More ▸ |
| Prop | its main option(s) (width, style…) · Colour · Position ▾ · ⟳ · More ▸ |
| **Text** | Font ▾ · Size − 48 + · **B** · Colour · Align ▾ · Spacing ▾ · Position ▾ · ⟳ · More ▸ |
| **Shape** | Fill · Outline colour · Thickness · Dashes ▾ · Rounded corners (box) · Position ▾ · ⟳ · More ▸ |
| **Line / arrow** | Colour · Thickness · Dashes ▾ · Start/End arrowheads ▾ · Position ▾ · More ▸ |
| **Pencil** | Colour · Thickness · Smoothing · Position ▾ |
| Several | Align ▾ · Distribute ▾ · Group · Position ▾ · More ▸ |
**Position ▾** = Forward / Backward / To front / To back + Align to page (the Canva "Position"). On narrow windows the ribbon scrolls sideways.

### 4.3 Mini bar on the selection
Small floating pill above (or below if no room) the selection: **Duplicate · Lock · Delete · ⋯**; the rotate handle stays on the object. It never covers the rotate handle, hides while dragging, Esc dismisses (Miro's users complain when this bar covers work and can't be moved). Canva's own floating bar carries Duplicate and Delete.

### 4.4 Left rail + flyout (things you add)
**Characters · Props · Shapes · Text · Layers · Add-ons**, each an icon with a label underneath; click opens the flyout, click again or ⟨ collapses it.
- **Characters:** search, your cast, library, ＋ New character (opens the designer, §4.6).
- **Props:** search + packs as today (Classroom, Airport…), recently used on top.
- **Shapes:** *Shapes* (**box**, **circle**, **triangle**), *Lines & arrows* (**line**, **arrow**, **double arrow**; dashed is a property, not a separate item), and later *Draw* (pencil). The existing Speech / Thought bubble props stay in Props.
- **Text:** presets **Title · Heading · Body · Caption · Number line** (click or drag onto the page).
- **Layers:** today's Layers list (the escape hatch for buried objects, and the accessible object tree).
- **Add-ons:** installed plugins, rescan, import (today's Plugins dialog).
Pages are **not** in the rail: they live in the bottom filmstrip.

### 4.5 Details panel (on demand, right, pinnable)
Opened by **More ▸** in the ribbon, double-click on a character, or a pin. Tabs: **Look** (colours, expression, prop options, grouped, collapsible sections) · **Pose** (presets grid, mirror, “how dragging works”, put arms/legs in front) · **Arrange** (position, size, rotation angle, layer order, align/distribute, group, lock). Replaces today's always-open right panel; the ribbon covers the 80% case.

### 4.6 Character designer
Becomes a **side editor** inside the Details panel (live preview on top, sections below: Character type, Colour, Hair, Clothes, Accessories, Face), not a modal. Entry points: Characters ▸ ＋ New / ✎ Edit, ribbon “More ▸”.

### 4.7 Quick tools and shortcuts
One-shot tools from the keyboard, also reachable from the rail: **V** select · **H** hand (or hold Space) · **T** text · **R** box · **O** circle · **Y** triangle · **L** line · **A** arrow · **P** pencil (later). Shift constrains (square/circle, 15° lines). Esc returns to Select. A **?** sheet lists them all; **Ctrl/⌘+K** searches every action.
On tablets a compact **tool bar** (Select · Hand · Text · Shape · Pencil) sits at the bottom, because there is no keyboard (§7).

### 4.8 Start screen
With no project (and **File ▸ New**), a gallery: **Blank page** + the four samples as cards with previews, **Open file…**, recent project names. The canvas shows a one-line hint until the first item exists.

### 4.9 Vocabulary (consistent, non-technical) — my recommendation
I'd **not** use "Body type": it reads as body *shape* (slim, tall, curvy), which is the Height/Line-weight area. For the Person ↔ animal choice I recommend **Character type**, shown as one visual picker with thumbnails, grouped:
**People:** Child · Grown-up   **Animals:** Dog · Cat · Dinosaur   (under the hood this sets the skeleton "rig" + "build"; users never see those words).
| Today | New wording |
|---|---|
| Skeleton / Build | **Character type** (one picker) |
| Plugins | **Add-ons** |
| Drawing style / Preview | **Style** / **Styled view ↔ Clean view** |
| Paper colour | **Page colour** |
| Reach (elbow follows) / Rotate forearm | **Move whole arm** / **Turn lower arm** |
| Flip bend (L elbow …) | **Flip elbow / knee** |
| Detach limbs / "front limbs" layer | **Put arms / legs in front** |
| Mode: auto / colour / faded / grey | **Colour: Full · Faded · Grey** |
| Rescan plugins folder | **Refresh add-ons** |
| Template | **Starting look** |
| Props pack / category | unchanged (Classroom › Arts) |

### 4.10 Where every current control goes
| Today | New home |
|---|---|
| Brand + version | top bar; version in Help ▸ About |
| New / Open… / Save / Save as… | **File** menu (+ shortcuts); autosave status beside the project name |
| Undo / Redo | top bar icons |
| Preview on/off (P), Drawing style | ribbon (nothing selected) + **View** menu; `P` toggles Styled/Clean |
| Export | top-bar button → **Export popover** (what / format / size / background) |
| Designer | rail ▸ Characters ▸ ✎ (side editor, §4.6) |
| Plugins | rail ▸ **Add-ons** |
| ◀ page ▶, + Page, rename, delete | **filmstrip** (thumbnails, drag to reorder, ＋, ⋯ for rename / duplicate / delete); notes in a drawer |
| Layers tab | rail ▸ **Layers** |
| Page size, paper colour | ribbon (nothing selected) |
| Zoom − 100% + / "Selection" | bottom-right zoom bar (+ Fit page, Fit selection) |
| Right panel (character / prop / several) | ribbon + **Details** panel (Look · Pose · Arrange) |
| Alt+click, group, lock, order | Position ▾, Edit menu, mini bar; shortcuts in the cheat sheet |

## 5. The text tool (new, first-class)

### 5.1 Behaviour
- **Create:** press **T** (or rail ▸ Text), then **click** for auto-width text or **drag** a box for wrapping text. Rail ▸ Text also offers presets — **Title · Heading · Body · Caption · Number line** — click or drag onto the page (Canva-style).
- **Edit in place:** double-click enters edit mode (an overlay text field aligned to the text, committing on blur/Esc/Ctrl+Enter); the shown result is the real drawing in the current style, the field only captures typing.
- **A normal object:** moves, **scales, rotates (rotate handle, any angle, Shift = 15° steps), flips**, layers, groups, locks, copies, undo/redo, exports — through the same code path as figures and props (`rot`, `s`, `flip`, `x`, `y`). Rotation is applied to the item, so wrapped text rotates as one block and stays editable (text is never "baked").
- **Properties** (ribbon + Details): text · font · size · colour (the project palette + custom) · bold · align (left/centre/right) · line spacing · letter spacing · box width (drag side handles; auto-fit toggle) · optional **underline** / highlight swash · opacity. Matches today's whiteboard writing options (letter colours: one / per line / rainbow) as presets.
- **Text in speech/thought bubbles:** the bubble props gain a text slot using the same text engine; "Add text to bubble" = double-click it.
- **Styles apply:** because text is turned into drawing primitives, crayon / marker / ink / chalk all render it, and Clean shows crisp lines. Dark pages get chalk-white text automatically (existing rule).
- **Export:** text is outlines, so it prints identically everywhere (no font needed on the other machine).

### 5.2 Engine (phased)
1. **Phase T1 — handwriting glyphs (reuse what exists).** The crayon alphabet (`GLYPH`: A–Z, a–z, digits, `. , ! ' " : / ( ) + - = ?`) already powers `pen.text`. Add a pure `layoutText(str, {size, width, align, lineHeight, letterSpacing})` (word-wrap, multi-line, per-line align, measure) and a `text` item type that calls it. Add accented Latin letters and a few symbols. Single-stroke glyphs = a distinctive hand-drawn look in every style.
2. **Phase T2 — real fonts (optional, later).** Bundle a few **OFL-licensed** fonts (handwriting, rounded sans, serif, marker) and convert glyphs to outline paths in the browser with a font parser (opentype.js is the usual choice; its current API must be checked) so text becomes ordinary filled shapes the styles can hatch/outline. Needs: per-font licence files in the repo, a font picker with live previews, kerning. *Not solved by opentype.js:* complex scripts (Arabic/Urdu joining, Indic) need a shaper such as HarfBuzz; if right-to-left languages matter, that is a bigger task — see question Q5.
3. The two engines sit behind one `font` property (`"font": "hand"` | `"fonts/patrick-hand"`) so projects don't change shape when T2 lands.

### 5.3 Data model (additive, no schema bump needed)
```json
{ "id": "…", "type": "text", "x": 500, "y": 200, "s": 1, "rot": 0, "flip": false, "mode": "auto",
  "text": "Reading time", "font": "hand", "size": 48, "color": "#1e88e5", "weight": "normal",
  "align": "center", "w": 0, "lineHeight": 1.15, "letterSpacing": 0, "underline": false,
  "colors": "one" }
```
Older versions of the tool skip unknown item types, so older files stay safe; the project file records the font used (plugins list) so a missing font is reported like any missing plugin.

### 5.4 Interactions with the rest
- Layers list shows the text content as the layer name. Lock/hide/group work as for any object.
- `numbers` prop ("Numbers & words") and whiteboard "Writing" stay for compatibility; the Props library hides `numbers` once Text exists (the Text tool supersedes it).
- Alt+click, marquee, copy/paste, align/distribute, "Fit selection" all include text with no special cases (bounding box from `layoutText`).

### 5.5 Tests (written with the feature)
Unit: `layoutText` (wrap at word boundaries, long word, explicit newlines, align, empty string, size scaling, determinism); drawing finite for every glyph; golden hashes for a sample paragraph per style. E2E: press T → click → type → item appears; drag-resize box re-wraps; **rotate by dragging the rotate handle and by typing an angle, then export and confirm the text bbox rotated**; flip; undo/redo; save → reopen keeps text and rotation; text renders in all four styles.

## 5b. Shapes, lines and arrows (new — kept basic)
Same object model as text: move, scale, **rotate**, flip, layer, group, lock, copy, undo, export; drawn as primitives, so **all four styles apply** (a crayon box, a chalk arrow).
- **Shapes** (`type: "shape"`): **box**, **circle / ellipse**, **triangle**. Properties: **fill** (None · Colour · Hatch · *Solid — hides what's behind*, the existing paper-fill layering rule), outline colour, thickness, **dashed / dotted**, rounded corners (box), opacity. **Double-click adds text inside** (the text engine, centred). Hold Shift for a perfect square/circle.
- **Lines & arrows** (`type: "line"`): **line**, **arrow**, **double arrow**. Properties: colour, thickness, dash, arrowhead at each end (none · arrow). Two **end handles**; Shift snaps to 15°. Thin lines get a generous hit area so they are easy to click. *(Curved and elbow arrows are deliberately left out for now.)*
- **Pencil** (`type: "draw"`, optional and last): freehand stroke from pointer events, smoothed (`U.spline` exists) and simplified so strokes stay light.
- **Creating:** pick from the rail or press R / O / Y / L / A, then click-drag; a plain click drops a default-sized shape.
- **Data (additive):**
```json
{ "type": "shape", "shape": "box", "x": 400, "y": 300, "w": 200, "h": 120, "rot": 15, "flip": false,
  "fill": "paper", "fillColor": "#fff3b0", "stroke": "#e53935", "width": 5, "dash": "none", "radius": 0, "text": "Hello" }
{ "type": "line", "pts": [[100,100],[300,160]], "start": "none", "end": "arrow", "stroke": "#1e88e5", "width": 5, "dash": "none" }
```
- **Tests:** geometry units (arrowhead placement and size at any angle, dash patterns, hit-testing of thin lines, box/circle/triangle outlines and bounding boxes under rotation), finite output in all styles, rotation of a shape containing text, e2e: draw each tool, rotate, group with a character, save/reopen, export.

## 6. Visual system
- **Tokens** (`src/css/tokens.css`): colour primitives → semantic (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-text`, `--danger`, `--focus`), 4 px spacing scale, radii (4/8/12), 3 elevation levels, type scale (12/13/14/16/20), motion (120–200 ms). **Light only** for now; every colour goes through a token so a dark theme remains possible later.
- **Look:** neutral light grey app chrome, white panels, one accent colour, pastel hover states; the page stays the only strongly coloured thing. Rounded 8 px panels, soft shadows on floating elements, hairline borders on docked ones.
- **Typography:** system UI font stack (works offline, no licence issue); 13–14 px body in panels.
- **Icons:** Lucide inlined as an SVG sprite (`<symbol>`s, ~70 icons), `currentColor`, 20 px in rails, 16 px in toolbars, 1.75 px stroke. Candidate map: person=`user`, props=`armchair`/`shapes`, text=`type`, pages=`layout-grid`, layers=`layers`, undo/redo=`undo-2`/`redo-2`, export=`download`, file=`file`, rotate=`rotate-cw`, duplicate=`copy`, delete=`trash-2`, lock=`lock`, group=`group`, align=`align-*`, mirror=`flip-horizontal`, style=`palette`, add-ons=`puzzle`, search=`search`, zoom=`zoom-in/out`, fit=`maximize`, hand=`hand`, select=`mouse-pointer-2`, speech=`message-circle`, help=`circle-help`. Keep the Lucide ISC notice in the repo.
- **Components** (small vanilla helpers in `src/app/ui/`, no framework): IconButton, ToolButton (pressed state), Tabs, Segmented control, Select (styled, searchable where long), Slider+number, Toggle, ColorField (swatches + custom), Popover/Menu, Tooltip (name + shortcut), Dialog, Toast, Section (collapsible), Tile (thumbnail), Filmstrip item, EmptyState.

## 7. Behaviour and accessibility
- **Keyboard:** every action reachable; visible `:focus-visible` ring; roving tabindex in rails/toolbars; Esc closes popovers/deselects; canvas has an accessible name and a keyboard-operable layer list (Layers panel doubles as the accessible object tree).
- **Names:** every icon button has `aria-label` + tooltip with shortcut; dialogs use `<dialog>`/`aria-modal`; live region for toasts.
- **Contrast:** text ≥ 4.5:1, UI components ≥ 3:1 (light theme now; dark theme later); don't rely on colour alone for handle meaning (shape + tooltip).
- **Hit targets:** ≥ 32 px with a mouse; 44 px minimum / 48 px primary on touch (see the tablet rules below). Pinch zoom already exists.
- **Tablets are first-class (D4); phones are not in v1.**
  - *Evidence:* Miro's phone app has a reduced toolbar and its help says editing boards in a mobile browser is a known limitation, while its tablet app supports stylus input and is the closer match to desktop; Canva's phone app uses five tabs along the bottom of the screen. I could not find a description of Canva's iPad editor layout, so check it by hand.
  - **One input model:** Pointer Events for mouse, finger and pen alike; `touch-action: none` on the canvas; **pinch to zoom, two-finger pan**, long-press = context menu; nothing important is hover-only (tooltips are a bonus, not the only label).
  - **Targets:** WCAG 2.2 minimum is 24 px; for touch use **44 px minimum, 48 px for primary buttons** (`@media (pointer: coarse)` switches sizes; handles on the canvas also grow).
  - **Layout:** landscape tablet = the desktop layout with a narrower flyout; portrait tablet = left rail becomes a **bottom tab bar**, the flyout and Details become **bottom sheets**, the ribbon scrolls sideways. The bottom **tool bar** (Select · Hand · Text · Shape · Pencil) is shown on touch devices.
  - **Text on a tablet:** on-screen keyboard aware editing (canvas scrolls the text above the keyboard), no reliance on keyboard shortcuts.
  - **Pencil:** `pointerType === "pen"` draws and finger pans (switchable); palm rejection through ignoring touch while a pen is active.
  - **Files:** the **open-source download targets Windows with Chrome or Edge**, where the file-save API works; Mac is a later task (Safari lacks that API, so a Mac/iPad version will rely on downloads or the hosted edition's cloud storage — one more reason the storage adapter exists).
  - **Testing without a tablet** (none available):
    1. **Chrome/Edge DevTools device mode** (Ctrl+Shift+M) with touch emulation and iPad / Android-tablet presets — checks layout, breakpoints, touch targets and tap/drag/pinch.
    2. **Automated:** Playwright contexts with `hasTouch` / `isMobile` and tablet viewports run the e2e suite in touch mode (tap-to-select, drag handles, pinch via CDP touch events) in CI.
    3. **A Windows touch laptop** (hybrid) for real finger and, if present, pen input — the closest real device to a tablet.
    4. **Your phone**, opened against the hosted preview (or `http://<PC-IP>:8765` on the same Wi-Fi), for a real small-screen check.
    *Not covered:* iPad Safari quirks (viewport, keyboard, gestures). They are logged as a known gap until someone with an iPad checks the hosted edition.
- **Phones (later):** a read-only viewer with pan/zoom and light edits (move, text, delete), like Miro's reduced phone mode. Layout rule < 700 px: the simplified layout only.
- **Windows < 1100 px (desktop):** Details becomes a slide-over; the flyout auto-collapses.
- **Command palette (Ctrl/⌘+K):** search every action, character, prop, sample and style; shows shortcuts; recent items when empty. **Shortcut sheet** on `?`.
- **Onboarding:** start-screen samples + three dismissible, one-time hints (drag a handle; double-click text; Ctrl+K). No modal tour.
- **Plain-language copy pass** on all labels and removal of inline explanatory paragraphs (move to tooltips / a Help drawer).

## 8. Implementation phases
Each phase ships working software with the test suite green; no big-bang rewrite. Effort: S ≈ ≤1 day, M ≈ 2–4 days, L ≈ 1–2 weeks.

| Phase | Deliverable | Size | Acceptance |
|---|---|---|---|
| **0. Safety net + split** | Split `app.js` into modules (state, canvas/overlay, library, inspector, header, dialogs, export) with **no behaviour change**; add Playwright **screenshot baselines** for 8 key states and e2e for add/pose/layer/save/export | L | All existing tests pass; baselines checked in; zero visual diff after the split |
| **1. Foundations** | `tokens.css`, `components.css`, Lucide sprite, `ui/` helpers (IconButton, Tabs, Popover, Tooltip, Section…), focus system; light theme only (all colours via tokens) | M | `docs/ui-kit.html` shows every component; contrast check passes |
| **2. Shell** | Top bar with File/Edit/View, Export popover; left rail + flyout; bottom filmstrip + zoom bar; **start screen** | L | Old header gone; every old control reachable (checklist §4.10); keyboard walk-through passes |
| **3. Selection UX** | **Ribbon**, mini bar, **Details panel** (Look/Pose/Arrange), Position ▾, align/distribute, snapping + smart guides, plain-language copy (§4.9) | L | Add a character, pose it, align, duplicate, delete — without opening a menu |
| **4. Text tool (T1)** | `text` item, `layoutText`, T tool, presets, in-place editing, **rotate/scale/flip**, bubble text | L | §5.5 tests green; text identical across save/reopen/export |
| **4b. Shapes and arrows** | `shape` (box, circle, triangle) and `line` (line, arrow, double arrow) items, rail ▸ Shapes, quick keys, handles, text in shapes; pencil only if time allows | M | §5b tests green |
| **5. Dialogs → panels** | Designer as side editor with **Character type** picker; Add-ons manager in the rail | M | No modal blocks the canvas except Open/Save and destructive confirms |
| **6. Touch & tablet** | Pointer-event audit, pinch/pan, 44/48 px targets, bottom tab bar + bottom sheets in portrait, tool bar, stylus/finger drawing, on-screen-keyboard text editing | M–L | First-run task passes in DevTools tablet emulation, in the automated touch e2e run, and on a Windows touch laptop (when available); iPad Safari listed as unverified |
| **7. Polish** | Ctrl+K palette, shortcut sheet, hints, empty states, motion, accessibility audit | M | Lighthouse accessibility ≥ 95; first-run task test passes |
| **8. Text fonts (T2)** | Bundled OFL fonts → outlines, font picker | M–L | Licences recorded; same export on two machines |
| *Later* | Mac support, dark theme (not planned), phone viewer, pencil, text on a curve (not planned) | — | — |

**First-run task test (acceptance for the whole revamp):** a person who has never seen the tool, without help, can in under 3 minutes: open a sample, add a character and pose it, add and rotate a text label, draw an arrow, change the style to marker, export a PNG — on a Windows laptop, and (hosted edition) in touch/tablet emulation.

## 9. Risks and decisions
- **Regression risk** from rebuilding UI around a 1,300-line file → Phase 0 first; screenshot baselines.
- **Stays dependency-free and works from `file://`** → no framework, no build step; if we ever add a build, it must output the same static files.
- **Floating bars can cover work** (Miro complaint) → offset logic, auto-hide while dragging, Esc to dismiss, pin option.
- **Too much moving around** (Canva complaint) → fixed locations; only collapse/expand.
- **Fonts and licences** (Phase 7) → record every font's licence; OFL allows bundling.
- **Complex scripts** need a shaper; stroke-glyph text is Latin-only.

## 10. Settled and still open
**Settled (owner, 2026-11-21):** Canva look · light mode only · basic shapes only (box, circle, triangle, line, arrow, double arrow) · English only · Windows download first, Mac later · hosted edition on tablets, tested by emulation (no tablet available).
**Still open (small, decide while building):**
- **Q-c Rail order:** Characters · Props · Shapes · Text · Layers · Add-ons — adjust after trying it.
- **Q-e Wording:** is "Character type" (People / Animals) clear to your wife and a classroom teacher? A five-minute test beats my guess.
- **Q-f Windows touch laptop:** if you can borrow or use one, we get a real touch check; otherwise emulation only.

## 11. Sources
- Canva: [Add and edit text](https://www.canva.com/help/add-and-edit-text/) · [Canva "glow up" editor announcement](https://www.canva.com/newsroom/news/glow-up/) · [2025 editor layout guide](https://lilys.ai/en/notes/design-with-canva-20251118/canva-editor-2025-update-guide) · [Sidebar and tabs](https://www.c-sharpcorner.com/article/canva-sidebar-and-its-tabs-learn-canva) · [Design critique, iOS app](https://ixd.prattsi.org/2026/02/design-critique-canva-ios-app/) · [Canva onboarding (template-first)](https://supademo.com/user-flow-examples/canva)
- Miro: [Toolbar help](https://help.miro.com/hc/articles/360017730553) · [Simplified UI](https://help.miro.com/hc/articles/20967864443410) · [Floating-toolbar request](https://community.miro.com/ideas/want-to-be-able-to-move-pin-or-hide-the-floating-editing-toolbar-15695) · [Toolbar wishes](https://community.miro.com/ideas/toolbar-wishes-29313)
- Figma: [Our approach to designing UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/) · [Navigating UI3](https://help.figma.com/hc/articles/23954856027159) · [UI3 feedback thread](https://forum.figma.com/t/ui3-feedback/77610/14)
- Open-source editors: [tldraw UI and menus](https://tldraw.dev/features/composable-primitives/ui-and-menus) · [tldraw release notes (toolbar moved to bottom)](https://tldraw.substack.com/p/release-notes-march-2nd-2023) · [Excalidraw overview](https://www.hackdesign.org/toolkit/excalidraw/)
- Editor patterns: [How to design a properties panel](https://uxplanet.org/how-to-design-properties-panel-4d562cc47da3) · [Unity contextual tooling](https://foundations.unity.com/patterns/contextual-tooling) · [CE.SDK Inspector Bar](https://img.ly/glossary/inspector-bar/) · [Salesforce canvas guidelines](https://lightningdesignsystem.com/guidelines/builder/canvas) · [Adobe XD panel UX](https://developer.adobe.com/xd/uxp/design/ux-patterns/panel-ux) · [Replit design toolbar](https://docs.replit.com/features/design/toolbar.md)
- UX principles: [NN/g progressive disclosure](https://nngroup.com/articles/progressive-disclosure/) · [NN/g training-wheels UI](https://www.nngroup.com/articles/training-wheels-user-interface/) · [Smashing: empty states in onboarding](https://smashingmagazine.com/2017/02/user-onboarding-empty-states-mobile-apps) · [Unity empty states](https://unityeditordesignsystem.unity.com/patterns/empty-states)
- Command palette: [Retool](https://retool.com/blog/designing-the-command-palette) · [Superhuman](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/) · [SaaS UI patterns](https://www.saasui.design/blog/saas-search-command-palette-ux-patterns)
- Icons: [Lucide vs Tabler vs Phosphor](https://dev.to/svgicons/lucide-vs-tabler-vs-phosphor-which-free-icon-set-fits-your-ui-4ocl) · [Icon library licences](https://dev.to/usapopopooon/what-i-didnt-know-about-icon-library-licenses-and-you-might-not-either-30of) · [SVG icon libraries for web apps](https://blog.openreplay.com/svg-icon-libraries-web-apps/)
- Tokens: [CSS design-token system](https://dev.to/137foundry/building-a-css-design-token-system-that-scales-2nnc) · [Tokens with light/dark](https://docs.typo3.org/p/sbuerk/theme-extension-development/main/en-us/Changelog/2.0/Feature-DesignTokens.html)
- Text outlines: [opentype.js](https://github.com/nodebox/opentype.js) · [text-to-svg](https://github.com/naari3/text-to-svg)
- Touch / tablet / phone: [Canva mobile app navigation](https://www.canva.com/help/navigate-canva-mobile-app/) · [Canva Apps layout guidelines](https://www.canva.dev/docs/apps/design-guidelines/layout/) · [Miro mobile & tablet troubleshooting](https://help.miro.com/hc/articles/360021113559) · [Miro tablet app](https://help.miro.com/hc/articles/360017731633) · [WCAG 2.1 target size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) · [WCAG 2.2 target size (enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced) · [Touch-target guidance (Siteimprove)](https://www.siteimprove.com/blog/motor-impairments-and-mobile-ui-the-touch-target-problem)
- Canva floating bar / Position: [Add elements](https://www.canva.com/help/add-elements/)

## 12. Phase 2 notes (what was built, and what is deliberately temporary)
Built: top bar with File / Edit / View / Help menus, save status, undo/redo and an Export panel; left rail (Characters, Props, Layers, Add-ons) with a foldable flyout; bottom page strip with thumbnails, page menu, notes drawer and zoom controls; start screen (first run and File ▸ New). Every control in §4.10 has a home; `tests/e2e/shell.test.mjs` checks each one is reachable.

Temporary, to be removed in later phases:
- **The page-settings strip** under the top bar (Style, Page colour, Page size, Styled view) is the "nothing selected" ribbon (§4.2) shown all the time. **Phase 3** makes it contextual and adds the selection controls; the Details panel then replaces the old right-hand panel (still the old inspector for now, so the right side looks older than the rest).
- **Add-ons** and **New character** still open the old dialogs; **Phase 5** turns them into panels. Shapes and Text are not in the rail yet (phases 4 and 4b); a rail button that does nothing is worse than none.
- Rail order is Characters · Props · Layers · Add-ons for now; confirm once Shapes and Text exist.

Not done from §4 yet: drag-to-reorder pages (the page menu has Move earlier / later), recent projects on the start screen, and a first-run tour. (The empty-page hint is shown until the page has something on it.)

## 13. Phase 3 notes
Built: contextual ribbon (`src/app/ribbon.js`), mini bar, Details panel with Look / Pose / Arrange tabs (`src/app/inspector.js`), Position / Line up / Space evenly (`src/app/arrange.js` over the pure maths in `src/core/arrange.js`), snapping with guides (`src/app/pointer.js`), dynamic popovers for rebuilt buttons (`UI.showPopover`).

Decisions and limits:
- **Details is not auto-hidden.** The plan said "on demand, pinnable"; it opens on demand and then stays until you close it (the choice is remembered), which is the pinned behaviour. A separate auto-closing mode can come later if people want it.
- **Prop ribbon** shows only the prop's first choice (a `select` parameter). Everything else is in Details ▸ Look. Revisit when text and shapes exist (they will have their own ribbon sections).
- **The page settings** (style, page colour, size) show only when nothing is selected; press Esc or click empty space to get back to them.
- **Snapping** applies to moving only (not resize or turn) and uses the outline box of the selection (a rotated item's box is its outer rectangle). Guides show edges and centres, not equal-spacing hints.
- **Details content** is still the old form controls with new tabs and wording; it is restyled with the rest of the dialogs in phase 5.
- Still to do from §4.5: "Character type" as one visual picker (phase 5).

## 14. Phase 4 notes (text)
Built: `src/core/text.js` (TXT: layout, caret maths, drawing), `src/app/texttool.js` (tool, presets, in-place editing, properties), text sections in the ribbon and Details, width handles, hit box, undo grouping.

Decisions and limits:
- **Engine T1 only** (the single-stroke handwriting alphabet). `font` is `"hand"`; T2 (bundled OFL fonts, outlines) is still phase 8 and plugs in behind the same property. Accented letters were left out because the tool is English only.
- **Origin at the centre.** A text item's x, y is the centre of its box, so it turns and scales about its middle. While you type or resize, the **top edge and the left / centre / right anchor stay fixed on the page** (`pinAnchor`).
- **Typing goes into a hidden text field** and the caret / selection are drawn from the layout. This keeps the caret exactly between the drawn letters and works with keyboards and phone keyboards; it means browser spell-check, right-click menus and IME composition underlines do not show on the page. Revisit when tablets are tested (phase 6).
- **One undo step per edit**: history snapshots are paused while a text is being edited and taken when editing ends; a new text that stays empty leaves no trace.
- Clicking a ribbon or Details control while typing ends the edit (the formatting applies to the whole text; there is no per-letter formatting).
- Not done: drag a style from the Text panel onto the page (click adds it), text inside speech bubbles (the bubble props still use their own text option), a highlight / opacity option, a Font picker.

## 15. Phase 4b notes (shapes, lines and arrows)
Built: `src/core/shapes.js` (SHP: outlines, dashes, arrowheads, resize maths, drawing), `src/app/shapes.js` (tool, handles, ribbon and Details), a Shapes tab, hit areas in `model.js`, unit tests (`tests/unit/shapes.test.mjs`) and browser tests (`tests/e2e/shapes.test.mjs`).

Decisions and differences from the plan:
- **Lines keep local points plus x, y, s, rot, flip** (not page-absolute points), so a line moves, scales, turns and flips with the same code as everything else. `SHP.setEnds` rewrites the two points so the line always lies along its own x axis, with its angle in `rot`.
- **Words in a shape are `shape.text`** (with `textSize`, `textColor`), not a separate grouped text item. One object means one undo step, one layer and no way to pull the words apart by accident. The words are laid out by the text engine and centred on the shape; circles and triangles use a narrower inner width.
- **A tile click adds the shape at once; the quick keys arm the draw tool.** The tiles show the pressed key on pointing, but a click does not arm anything (the plan said both would arm).
- **Dashes are geometry**: the outline is cut into short pieces, so every style (and the export) draws dashes without special cases. Dotted uses tiny pieces with round ends.
- **Arrowheads are an open "V"** (30 degree wings) sized from the thickness and limited to 45 percent of the line length.
- **Opacity is per item** (the `opacity` attribute on the item's group), not per stroke, because styles ignore `op` on primitives.
- **An unfilled box is a frame**: clicks inside it reach what is behind. A filled one is solid.
- **An empty shape is never deleted** (only empty text items are). Double-click or Enter starts typing.
- **Pencil (freehand) skipped** by decision: it needs smoothing and a different hit area and is not needed for the first release.
- Known small limits: double-click on a shape inside a group does not start typing (Enter does); Alt-click cycling through overlapping items uses the outer box; pressing keys quickly stacks several toasts.

## 16. Phase 5 notes (dialogs become panels)
Built: Add-ons as a rail tab (`#tab-addons`, `renderPlugins`), the Character designer inside the Details panel (`#designer`, "designer mode"), the About / "opened a file" card, tests in `tests/e2e/designer.test.mjs` and `workflows.test.mjs`.

Decisions and differences from the plan:
- **Designer mode takes over the Details panel** (`app.designer`): the normal inspector is hidden, the title reads "Character designer", and **Done / X / Esc** restore the panel to how it was (if Details were closed before, they close again). The existing `d-*` ids and handlers were kept; the dialog is gone.
- **What the modal used to do for free** is now done on purpose: keys pressed inside the designer (Delete, Backspace, arrows, R O Y L A T) are ignored so the selected figure is never touched; every change is a debounced `commit(false)` (one undo step per edit) instead of one commit when closing; `renderAll` / `renderDetails` refresh the designer after Undo, Open or page changes, and move it to another character (or close it) if its character is gone.
- **Following the selection:** choosing a single figure on the page switches the designer to that figure's character. Choosing anything else leaves it on the same character.
- **Character type** is two picker tiles (each drawn as the current character, in that skeleton's standing pose) instead of a dropdown. Words: "Person (stick figure)" and "Four-legged animal" (Q-e from the plan is still worth a five-minute test with the owner's wife).
- **New character** creates a character from the first person starting look and opens it (before, the button opened the designer on an existing character, which was misleading). Undo removes it.
- **Entry points:** ribbon ▸ **Edit character** (new), Details ▸ Look ▸ *Edit this character…*, Characters ▸ **New character**. There is no per-tile pencil in the Characters panel yet (a tile click adds the character to the page).
- **Save as template** uses an inline name row (no `prompt()`), Enter saves, Esc cancels the row first.
- **Rail:** Add-ons is the sixth tab (the separate bottom rail is gone).
- **Modals left:** only the Open / Save steps (older file, permission to write, could not save, taking long) and destructive confirms (unsaved changes, delete page, clear the only page, delete character). `grep showModal src/` lists only those. About and the "opened a file" report are a non-modal card in the corner. The keyboard guard in `main.js` now ignores keys only for modal dialogs (`dialog:modal`), so the card does not switch shortcuts off.
- **Keys in the designer:** only Undo / Redo (Ctrl+Z, Ctrl+Y) get through; Ctrl+X / C / V / D / G, Delete, arrows and tool keys are ignored while focus is inside the panel (a test presses them all).
- **The corner card** can sit over part of the page (bottom right); Esc does not close it yet, use its Close button.
- **Not done:** a per-character pencil on the Characters panel tiles; the designer is still the old form controls restyled lightly (the full look of the Details panel is a phase 7 polish item).

## 17. Phase 6 notes (touch and tablet)
Built: `src/app/touch.js` (touch mode, handle halos, pointer wrappers: ownership, pinch, long-press, palm rejection, cancel; breakpoints and sheets; the tool bar; keyboard-aware typing), tablet CSS at the end of `app.css`, `tests/e2e/touch.test.mjs` (20 tests) and 7 tablet screenshot baselines.

What the emulation can and cannot show (no tablet is available): headless Chrome with `hasTouch` reports a coarse pointer, delivers taps and multi-finger CDP touches as touch pointer events, and delivers pen events. It cannot open a real on-screen keyboard (a shorter window is the stand-in), cannot open native `<select>` menus by touch (Playwright's `selectOption` is used for those two, in the first-run task: Style) and sends no `click` for a tap that comes within about 0.4 s of a drag (the tests pace themselves; real fingers do not have this problem). **Unverified: iPad Safari and a real Windows touch laptop (plan Q-f).**

Decisions and differences from the plan:
- **Touch mode is a class, not a media query** (`html.touch`): automatic with `(pointer: coarse)`, plus **View ▸ Touch-friendly sizes** (remembered) for touch laptops, where the main pointer is still the mouse. Layout breakpoints (1100 and 900 px) are width queries, so a narrow desktop window gets them too.
- **Gestures depend on the kind of pointer, not on the mode**: a touch laptop with the sizes switched off still pinches.
- **Drags belong to the pointer that started them** (`pid`). A second finger cancels the first finger's drag and reverts it from the last snapshot (`STORE.revert`, after `flushCommit`), leaving no undo step and no "unsaved" mark; `pointercancel` does the same instead of committing. 6 px of slop keeps a wobbly tap a tap.
- **A finger-down on the page cancels the browser's "compatibility" mouse events** and moves the focus off any field itself; without that, the late mouse-down stole the focus from a text box we had just started and it was deleted again as empty.
- **Handles:** the visible handle is drawn 1.35 times larger by CSS; an invisible 44 px halo (same `data-h`, marked `data-halo`) is added behind each one after the overlay is drawn.
- **Long-press** reuses the mini bar's More menu. **Palm rejection** is time based: touches are ignored while a pen is down and for 0.6 s after; a palm that landed BEFORE the pen has its half-made drag cancelled when the pen arrives.
- **Overlapping halos:** for a finger or pen the handle whose centre is nearest to the touch wins (`nearestHandle`), not the one drawn last. A new primary touch makes the page forget any finger it still thinks is down (a finger lifted over the ribbon during a pinch never reports back to the page).
- **Several** also works in the Layers list; double-tap starts typing in a text or a shape; Export, menus and popovers were size-audited too (Export labels were 28 px).
- **Pencil was skipped in 4b**, so the tool bar has Select, Hand, Text, Shapes and a **Several** toggle (the missing Shift key). A pen is just a pointer.
- **Hand tool:** no key (H already flips); it is on the touch tool bar, and Space-drag still works. **V** selects.
- **No Shift on a tablet:** lines within 4 degrees of a 45 degree step snap, shapes within 6 percent of square become square (touch pointers only). Resize with proportions has no touch version.
- **Sheets:** only one is open at a time; the page area is made shorter (not covered) while one is open. Their open / closed state is not remembered from a narrow window, so a wide window later starts normally.
- **Toasts** ignore touches (they used to catch them) and float near the top in touch mode.
- **Typing:** `interactive-widget=resizes-content` in the viewport tag, plus the app height follows `visualViewport` (iOS), the typed text is panned into view, and **Done typing** replaces Esc.
- **Limits:** Alt free-move and Alt-click cycling have no touch version; no hover tooltips on touch (labels are visible instead); the ribbon scrolls sideways in portrait, so some controls need a swipe; a sheet can cover part of the page you zoomed into; the phone layout (< 700 px) is the portrait tablet layout, not a simplified one; the Text, Add-ons and Designer panels were only lightly restyled for sheets.

## 18. Phase 7 notes (polish and accessibility)
Built: `src/app/palette.js` (search everything and the shortcut sheet), `src/app/hints.js` (the three tips), accessibility fixes across the panels, `tests/e2e/a11y.test.mjs` (6), `palette.test.mjs` (8), `hints.test.mjs` (7), `tools/a11y-audit.mjs`.

**Acceptance (plan §8): Lighthouse accessibility at least 95 and the first-run task passes.** Lighthouse (12, run in snapshot mode through puppeteer so it can audit states after clicking) scores **100 in 20 desktop states and 8 tablet-upright states** (baseline before the work: 94 at the lowest; the findings were heading order, 18 px swatches, small Layers buttons and one unlabelled select). The first-run task passes by mouse and by finger (both ways up) **with the tips switched on**. Lighthouse checks only part of WCAG: **not done: a screen-reader walk-through (NVDA / VoiceOver), a contrast check of every state by hand, and a check at 200 percent browser zoom.**

Decisions and limits:
- **Order of work:** accessibility fixes first (so every later step could be measured against a clean score), then search and shortcuts, then tips / empty states / motion / wording.
- **Search is an overlay, not a modal dialog** (`role="dialog"`, `aria-modal`, a combobox with a listbox: `aria-activedescendant` always points at an existing option, group headings are not options). Ctrl/Cmd+K is handled before the input, designer and popover guards, so it opens from anywhere; `?` after the input guard. A command closes the overlay first, runs, and the focus goes back to where it was unless the command moved it.
- **The command list is built when it opens**, from the menus (so a new menu item appears by itself, with its shortcut, its on / off tick and its disabled state) plus tools, panels, characters, props, shapes, text styles, drawing styles, samples and pages. Recent ids that no longer exist (a deleted character, a removed page) are dropped. Matching is word by word: start of a word beats inside a word beats a loose letter match (three letters or more). It does not search the text written on the page or the names of the things on it (the Layers list does that).
- **The shortcut sheet and the key handler can drift apart:** the sheet comes from one table (`SHORTCUTS`); a test presses every key it lists and checks the effect. It cannot prove the table is *complete*; that was checked by hand against `onKey` (Backspace and Ctrl+Click were missing and added).
- **Tips:** progress is in `storysketch/hints`; a separate key `storysketch/hints-mode` (`on` / `off`) is a switch for tests and support. **Automated browsers (`navigator.webdriver`) get no tips unless the mode is `on`**, so no other test or screenshot is disturbed; the three first-run tasks set it `on`. The card is small, sits top-left of the page (not over the tool bar, tab bar, page strip or Done button) and only the card takes taps. A tip waits 0.7 s after the trigger, is not shown while typing, dragging or with an overlay open, and times out after 14 s (shown twice = finished).
- **Layers is the keyboard way to the page.** Each row's name is a real button (`aria-current` for the picked one) and every icon button names its layer. F2 edits the words of the picked text or shape (Enter on a button presses the button). Items on the page itself are not tab stops.
- **Target sizes:** 24 px minimum on desktop (WCAG 2.2 AA), 44 px in touch mode. A `display: flex` on `summary` had removed the disclosure triangle; the baselines caught it and it was changed to a min-height.
- **Headings:** the section headings are `h3.sh` (were `h4`), styled exactly as before (zero pixel change). Panel titles are `h2`.
- **Wording pass (small, by design):** Shapes, Text and Layers panel texts, the page Details (the long tips list is gone), the empty page and empty Layers messages. Not done: a Help drawer for the longer explanations, and a pass over every label in the designer.
- **Motion:** overlay fade/pop, sheet slide-up, tip fade, button press; all use `--ui-dur`, which is 0 under `prefers-reduced-motion`. The screenshot tests wait 350 ms, so they do not depend on animation timing.
- **Found by review after the first version and fixed:** the search read the menus' greyed-out and ticked states as they were when each menu was last opened (it now refreshes them first; a test picks two things after looking at the Edit menu with nothing picked, and groups them from the search); Help items were listed twice; the search offered itself; Ctrl+K opened the search behind a delete confirmation; the pose tip also fired for boxes and lines (and was used up on them) although it is about a figure's dots; with the library folded the tip covered the button that brings the library back (it now sits lower).
- **Not done:** recent project names on the start screen; a first-run guided tour (the tips replace it); drag to reorder pages.

## 19. Phase 8 notes (fonts)
Built: `src/core/fonts.js` (FONTS: registry, parsing, kerning, glyph contours), five font plugins in `plugins/fonts/` made by `tools/build_fonts.py` from pinned, hash-checked OFL files (`tools/fonts/sources.json`), the Font menu in the text ribbon + Details ▸ Font + search entries, `glyph` / `more` support in the clean renderer and the four styles, project records and a "not installed" report, `tests/unit/fonts.test.mjs` (20), `tests/e2e/fonts.test.mjs` (7), three new pixel baselines (font-menu-open, fonts-in-crayon, fonts-in-chalk) and a font-menu state in the accessibility audit.

**Acceptance (plan §8): licences recorded; same export on two machines.** Licences: every font is SIL OFL 1.1 with no Reserved Font Name (checked on the downloaded licence text; the build tool refuses a font that has one), the full text ships next to each plugin, the pinned commit and sha256 of each source file are in the plugin, in `sources.json` and in `THIRD-PARTY-NOTICES.md`, and `check:plugins` fails if a font plugin lacks them. "Same export on two machines" cannot be tried here with a second machine; the stand-in is a test that draws the same text through all five renderers in Chromium and in Node and requires **byte-identical SVG**, plus identical SVG twice in the same page, and no live `<text>` or `font-family` in any export (so there is nothing for a machine to substitute).

Decisions and differences from the plan:
- **No font parser at run time (the plan said opentype.js).** The outlines are converted ahead of time into plain data. Reasons: nothing to load or parse in the browser (works from `file://` with no fetch), no third-party library to ship or update, no machine-dependent behaviour, and a font plugin is declarative (it holds no drawing code; it is still a `.js` file that calls `CP.register`, so the gallery would need to accept it as plain data, for example JSON, rather than run it). The cost is that adding a font needs the build tool (`uv` + fonttools, skia-pathops, uharfbuzz), not just dropping in a file. Letting a person load their own font file in the page is not done (a later, separate feature).
- **Overlaps removed, one rule for every style.** Handwriting fonts overlap their own contours; the build tool merges them (`removeOverlaps`), so all styles can fill with the even-odd rule. A letter is one primitive with `pts` (the largest outline) and `more` (the rest); a primitive with `more` or `hole` is filled even-odd by the clean renderer and by every style (a unit test checks that each style draws every outline).
- **Legibility sheet before the picker** (every font, three sizes, regular and bold, in each style). Crayon and clean were fine as they were. Marker, ink and chalk made letters pale or streaky (they treat fills as soft colour), so a `glyph` primitive is drawn solid there (marker 0.82, ink 0.94 in ink colour, chalk 0.8 under the dust filter) and gets no hatching.
- **Size:** the capital letters are 0.92 of `size` tall in every font (the hand-drawn capitals are 1.0 and its lowercase is small), so a switch of font keeps the box within the same range (tested: between 0.5 and 1.6 of the old width).
- **Kerning** comes from shaping every pair of kept letters with HarfBuzz (ligatures and alternates off) and keeping pairs that move at least 8/1000 em. It is added to the advance of the first letter of the pair, so wrapping, the caret and clicking between letters needed no change.
- **Bold:** a real Bold file where the family has one (Comic Neue; Nunito and Crimson Pro are cut from their variable font at 800 and 700); Patrick Hand and Caveat Brush get a thickened outline (34/1000 em, stroked and merged).
- **Characters the font lacks** (only Basic Latin plus curly quotes, dashes, ellipsis and bullet are kept) take the hand-drawn alphabet's step and draw what the hand-drawn alphabet draws for them, which is nothing for symbols it has not got; so text pasted from Word shows its curly quotes and dashes, and an emoji is skipped as it already was.
- **The text box covers the ink.** A font's ascenders, long tails and brackets reach beyond the hand-drawn line box (Crimson Pro by 14 percent of the size above, Patrick Hand by 13 below). `TXT.box` now adds each font's measured reach (`FONTS.extent`), so the selection frame, click area, Export ▸ Selection crop and Line up cover every letter; the layout, caret and wrapping are unchanged and the hand-drawn box is exactly as before. A unit test checks every letter of every font and weight.
- **Smooth at any scale.** Letters are straight segments, so the number of pieces per curve follows `size x the item's scale` (`size x scale / 3`, at least 4 and at most 24; a curve gets pieces in proportion to its length, so tiny brush wiggles stay cheap), checked on the turning angle of an o at four sizes and by looking at a 6x enlargement and a 4x export. It does not know the zoom: zoom and export are drawn from the same outline, and the detail is sized for the largest export (4x).
- **Cost:** the five plugin files are about 700 KB together (Caveat Brush is the largest: a brush outline has many points) and load with the page every time. A 500-letter paragraph builds in about 7 ms and draws in about 15 ms in every style (the hand-drawn letters take 50 to 150 ms in the styled views), producing 430 to 580 KB of SVG.
- **Text inside shapes** still uses the hand-drawn letters (shapes have no font setting yet).
- **Not done:** complex scripts (Arabic, Urdu, Indic) need a shaper and a different layout and are outside "English only"; letting people add their own font file in the page; lazy loading of fonts that are not used; a font setting for words inside shapes.
