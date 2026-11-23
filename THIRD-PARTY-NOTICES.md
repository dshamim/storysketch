# Third-party notices

StorySketch itself is MIT licensed (see `LICENSE`). It includes these third-party works:

## Lucide icons — ISC License
The interface icons in `vendor/lucide/` (and the generated `src/ui/icons.js`) are from [Lucide](https://lucide.dev) (`lucide-static`).
Copyright (c) 2026 Lucide Icons and Contributors. The full licence text is in `vendor/lucide/LICENSE`.
To add or change icons see `tools/build_icons.py`.

## Fonts — SIL Open Font License 1.1
`plugins/fonts/` holds the letter outlines of five fonts, converted to data by `tools/build_fonts.py` (no font program is included, and the page never needs the fonts installed). The full licence text of each is next to it (`plugins/fonts/<id>-OFL.txt`); the exact source files (pinned commit and sha256) are listed in `tools/fonts/sources.json`. None of them declares a Reserved Font Name.

| Font | Copyright |
|---|---|
| Patrick Hand | Copyright (c) 2010-2012 Patrick Wagesreiter (mail@patrickwagesreiter.at) |
| Comic Neue | Copyright 2014 The Comic Neue Project Authors (https://github.com/crozynski/comicneue) |
| Nunito | Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito) |
| Crimson Pro | Copyright 2018 The Crimson Pro Project Authors (https://github.com/Fonthausen/CrimsonPro) |
| Caveat Brush | Copyright 2015 Google Inc. All Rights Reserved. |

The OFL lets the fonts be bundled and the letters they draw be used in your pictures and books without any condition. The converted outlines are a modified version of each font, and are distributed under the same licence. For fonts with only one weight, the Bold is made by thickening the outline.
