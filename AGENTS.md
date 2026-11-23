# Instructions for AI agents working on StorySketch

StorySketch is a picture-book posing tool: plain browser JavaScript (classic `<script>` files, shared globals, **no build step**, must work from `file://`), MIT licensed. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first.

## Hard rules
- No bundler, no ES modules in `src/` or `plugins/`, no network access at run time, no new runtime dependencies.
- English only (no accented letters in names or text). Light theme only.
- Do not put anyone's real email address or name in files or commit history.
- Never edit `plugins/manifest.js` by hand: run `python3 tools/build_plugins.py` after adding or removing plugin files.
- Keep the existing tests passing; add tests for what you add. Do not regenerate pixel baselines unless a visual change is intended, and then update only the baselines that changed.

## Commands
```
npm test                      # unit tests (fast)
npm run test:e2e              # browser tests (needs playwright-core and a Chromium)
npm run check:plugins         # manifest and font licences up to date
node tools/check_props.mjs    # props against the style guide
```

## If you are asked to draw a prop (or any plugin that draws)
Follow [`docs/PROP-STYLE-GUIDE.md`](docs/PROP-STYLE-GUIDE.md) exactly (scale, origin, line widths, colour slots, ids, tags, detail budget) and finish with `node tools/check_props.mjs --file <your file>` and a look at the contact sheet (`--sheet DIR`). The plan for the current set of props is [`docs/PROPS-PLAN.md`](docs/PROPS-PLAN.md).
A plugin's `draw` function is code that runs in the page: do not use the DOM, network, storage, timers, `eval`, `Math.random` or `Date`.
