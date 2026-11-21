# Hosted edition — design notes

**Status: not built.** This records what the open-source core already provides for it and what would be added, so the two stay compatible.

## Goal
Everything in the open-source tool, plus: accounts, projects and assets stored online, and a community gallery where people share and search
characters, props, styles, rigs and sample projects. The open-source tool stays fully usable without any server.

## What the core already provides
- **`STORAGE`** (`src/core/storage.js`): the editor saves/opens through `STORAGE.current`. A hosted adapter implements
  `save`, `saveAs`, `open` (plus `name`, `supported`, `restoreHandle`, `forget`) and calls `STORAGE.register()` / `STORAGE.use('cloud')`.
  Permission/peek/export-picker methods default to harmless no-ops.
- **Asset sources** (`CP.addSource`): `list()` returns plugin entries (`path` with its type folder, `text` for JSON), `script(path)` runs a script.
  A gallery/account source is added before `CP.load()`; local plugins keep loading beside it.
- **Project files record the plugins they use** (`type`, `id`, `version`), so a hosted loader can fetch missing assets, and the editor already
  reports plugins that are missing or at another version.
- **Plugin metadata**: optional `author`, `license`, `tags`, `pack`, `version` on any plugin — what a gallery lists and searches.
- **Stable versions**: plugin `api`, project `schema` with migrations.

## What the hosted edition would add (separate private repo, core as a dependency)
- Accounts + sign-in; projects and uploaded assets stored per user; sharing links.
- Gallery: publish an asset (+ preview image, tags, license), search by text/tag/type, versions, reports.
- A `CloudAdapter` (STORAGE) and a `GallerySource` (asset source).
- Backend: Postgres + object storage (e.g. Supabase) behind a small API; static front end on Vercel.

## The one hard problem: untrusted code
Today a plugin is **JavaScript run in the page**. That is fine for files you chose yourself. In a community gallery, running other people's
JavaScript inside a signed-in session is a security hole (it could read the account's projects or token). Options, cheapest first:
1. **Sandbox** gallery plugins: run them in a sandboxed `<iframe>` / Worker with no network or storage, and have them return primitives only
   (plugins already only call `pen.*` and read plain data, so this is a good fit).
2. **Declarative assets**: a JSON format for simple assets (a prop = shapes + parameters) that is drawn by trusted code; scripts only for reviewed/official assets.
3. **Review queue**: moderation before anything executable is public.
The `AssetSource.script(path)` boundary is where this plugs in; the core never executes a source's code except through it.

## Also decide before building
Pricing/limits, content policy and moderation, data export/deletion, licensing of uploads (require an explicit license per asset), and a
domain/brand check for the product name.
