# Contributing

Thanks for helping! The easiest contributions are **plugins** (a hair style, a prop, a pose set, a drawing style, a skeleton) — see
[`plugins/README.md`](plugins/README.md). Copy a similar file, change the `id`, and open a pull request.

## Setup
No build step. Open `index.html`, or `python3 -m http.server 8765`. Node 20+ for the tests.
```bash
npm install                # playwright-core, only for the browser tests
npm test                   # unit tests: fast, no browser
npm run test:e2e           # needs a Chromium that playwright-core can launch
npm run test:visual        # pixel comparison of 13 UI states against tests/e2e/baselines (only on the platform that made them)
npm run update:baselines   # regenerate them — only for an intended visual change; review the images
npm run check:icons        # src/ui/icons.js is up to date; add an icon in tools/build_icons.py then `npm run build:icons`
npm run check:plugins      # fails if plugins/manifest.js is stale — run `npm run build:plugins` after adding/removing plugin files
npm run check:props        # props follow docs/PROP-STYLE-GUIDE.md (new kits strictly; options are listed at the top of the file)
npm run check:fonts        # (needs `uv` and the internet) the font plugins match their pinned source files; `npm run build:fonts` rewrites them
```

## Rules of the road
- **Add a test with a change.** Plugin tests are automatic (every plugin is drawn and checked); core changes need a unit test in `tests/unit/`.
- **Golden fixtures** (`tests/fixtures/*-golden.json`) pin the exact output of the Crayon style and the Person rig so refactors can't change them by accident.
  Regenerate one only for an *intended* change, and say so in the PR (the generators are next to the fixtures).
- **Classic scripts, no build, no modules.** Core files are plain `<script>`s that share globals so the tool keeps working from `file://`.
  Keep core files free of DOM access at load time (tests run them in Node via `tests/helpers/sandbox.mjs`).
- **Plugin API stability.** `api: 1` plugins must keep loading. Additions are fine; a breaking change bumps `api` (see `plugins/README.md`).
- **Project files stay readable.** A change to the saved format bumps `schema` and adds a migration in `src/core/store.js` with a test.
- Deterministic drawing: anything random must be seeded (`U.rng(seed)`), so exports are repeatable.

## Layout
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Accessibility checks
- `npm run test:e2e` always runs `tests/e2e/a11y.test.mjs`: every control has a name, headings keep their order, controls are at least 24 px, the Tab key reaches everything with a visible focus mark. When you add a panel or an overlay, add it to the `STATES` list at the top of that file.
- For the Lighthouse score as well (optional, heavy): `npm i --no-save lighthouse puppeteer-core`, then `node tools/a11y-audit.mjs` (desktop) and `node tools/a11y-audit.mjs touch` (a tablet held upright). It exits with 1 if any state scores under 95.
- New menu items show up in search by themselves; new shortcuts need a line in `SHORTCUTS` in `src/app/palette.js` and a key check in `tests/e2e/palette.test.mjs`.
