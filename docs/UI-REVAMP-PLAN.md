# StorySketch — UI revamp plan

**Status:** in progress. Phase 0 (safety net + `app.js` split), Phase 1 (foundations: tokens, icons, components, `docs/ui-kit.html`) and Phase 2 (shell) are done; next is Phase 3 (ribbon, mini bar, Details panel). Written 2026-11-21 against v0.21.0 and updated with the owner's decisions (below).
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
