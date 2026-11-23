# Plan: props for stories

**Status:** steps 0 to 2 done: scale rules, checker, style guide; the shared scenery pieces; and the whole Home kit (26 props) with the sample project "A day at home". The School kit (20 props, sample "A day at school") and the Park kit (22 props, sample "A day at the park") are done. The first round of kits is complete. Written 2026-11-23.

## Why
Today the tool ships **73 props: 15 for an airport and 58 for a classroom** (26 of those are art supplies). A story needs places. The first round gives stories a **home, a school (building and bus) and a park**, generic and not tied to any country.
Later kits (beach and sea, town and street, farm and camping, party and food, fantasy) wait until these three are good.

## How props are built (so every kit looks like one set)
All rules are in [`PROP-STYLE-GUIDE.md`](PROP-STYLE-GUIDE.md) and are checked by `node tools/check_props.mjs`. In short: one scale sheet (child 250, adult 320, doors 340, storybook scale for buildings and vehicles), one line-weight scheme (4.5 / 3 / 2 / 1.5), named colour slots with calm outline colours, `fill: 'paper'` for layering, hatching for shading, states for story (door open or shut, lights on or off, day or night, season), prefixed ids, searchable `tags`, and a detail budget (simple props under 25 shapes, hero props under 60).

## Steps
| Step | What | Done when |
|---|---|---|
| **0. Rules and checker** | scale sheet, style guide, `tools/check_props.mjs`, `tags` searchable in the Props tab and Ctrl+K | **done** (this commit) |
| **1. Shared pieces** | the few pieces all three kits need: ground (grass, path, road, floor), sky (day, dusk, night), hills, a wall with a window and a door | **drawn**; checker clean; contact sheet and a day and a night scene reviewed by the owner |
| **2. Home** | see below | **done**: checker clean; five room pages in the sample project "A day at home" reviewed by the owner |
| **3. School and bus** | see below | **done**: checker clean; sample project "A day at school" |
| **4. Park** | see below | **done**: checker clean; six pages in the sample project "A day at the park" |

Each kit is one commit and one contact sheet (all five drawing styles) for the owner to approve before the next kit starts.
Order inside a kit: the big anchor props first (house, bus, slide), then furniture and fittings, then small things.

## Shared pieces (step 1)
These are not a separate kit; they are what makes a page look like a place, so the three kits need them. About 8 props.
- `scenery-ground` (grass, sand-coloured path, road, floor: a `select`), `scenery-sky` (day, dusk, night: a `select`, with sun or moon and stars), `scenery-hills`, `scenery-wall` (a room wall with an optional window and door), `scenery-fence`, `scenery-path` (stepping stones), `scenery-clouds`, `scenery-window` (a window with a `picture` slot, day or night).

## Home (step 2), about 22 props, pack "Home props"
| Category | Props |
|---|---|
| Buildings | `home-house` (front view; door open or shut; lights on or off; day or night), `home-frontdoor`, `home-gate`, `home-letterbox` |
| Furniture | `home-sofa`, `home-armchair`, `home-coffeetable`, `home-dining-table` (with chairs), `home-tv`, `home-clock`, `home-fireplace` |
| Bedroom | `home-bed` (blanket colour), `home-bunkbed`, `home-cot`, `home-nightstand` (lamp on or off), `home-toybox` |
| Kitchen | `home-fridge`, `home-cooker`, `home-sink`, `home-kettle`, `home-plates` |
| Bathroom | `home-bath`, `home-basin-mirror` |
| Small things | `home-teddy`, `home-bicycle`, `home-slippers` |
Existing props reused: bookshelf, lamp, rug, curtain, wardrobe, plant, picture frame (easel), shelves.

## School and bus (step 3), about 20 props, pack "School props"
| Category | Props |
|---|---|
| Buildings | `school-building` (flag; doors open or shut; a sign with the school name as a text option), `school-gate`, `school-flagpole`, `school-bell` |
| Vehicle | `school-bus` (side view; door open or shut; windows empty), `school-busstop` (sign and shelter), `school-crossing` (zebra crossing strip), `school-lollipop` (stop sign) |
| Inside | `school-lockers`, `school-corridor-door`, `school-stage` (assembly), `school-canteen-table`, `school-tray`, `school-clock` |
| Sports | `school-goal`, `school-ball` (football, basketball, a `select`), `school-track` (running lanes), `school-trophy` |
| Small things | `school-backpack`, `school-lunchbox` |
Existing classroom props stay as they are (table, chair, whiteboard, books, art supplies).

## Park and playground (step 4), about 22 props, pack "Park props"
| Category | Props |
|---|---|
| Playground | `park-slide`, `park-swing`, `park-seesaw`, `park-roundabout`, `park-climbingframe`, `park-sandpit` (bucket and spade) |
| Nature | `park-tree` (spring, summer, autumn, winter, a `select`), `park-bush`, `park-pond` (ducks or empty), `park-flowerbed`, `park-hill` |
| Furniture | `park-bench`, `park-fountain`, `park-lamppost`, `park-bin`, `park-sign`, `park-fence`, `park-path` |
| Picnic and play | `park-blanket` (basket on or off), `park-kite`, `park-ball`, `park-scooter` |

## What is not in this plan (and why)
- **Characters' clothes** (school uniform, backpack worn, swimsuit, sun hat, raincoat) and **more creatures** (cat, bird, rabbit, fish): a park story wants them. They are accessories, clothes and rigs, not props. They are a separate plan.
- **Holding a prop:** a figure cannot hold a ball or a kite; it is placed next to the hand. Attaching a prop to a hand is a separate feature.
- **Local or cultural kits:** the owner chose generic.

## Community uploads
Props are JavaScript (`draw` runs in the page), so today a community prop arrives as a **pull request that a person reads and runs through the checker and the contact sheet**. Uploads in a hosted edition need a sandbox or a declarative prop format first ([`HOSTED-EDITION.md`](HOSTED-EDITION.md)); that is the reason the guide asks for prefixed ids, tags and a licence statement now, so submissions are already in the shape a gallery needs.

## Risks
- **Quality of drawn props** (a bus and a school are hard in a few strokes). Mitigation: contact sheets in all five styles at small size, the shape budget, approval per kit.
- **Scale mistakes** (a door that does not fit a person). Mitigation: the size table in the guide, and each kit's sample project has people at scale 1 next to its props.
- **Page weight:** each `.js` file loads with the page; about 60 small props add well under 200 KB.
