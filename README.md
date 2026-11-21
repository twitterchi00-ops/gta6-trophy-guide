[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/twitterchi00-ops/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/twitterchi00-ops/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — GTA VI (PS5)

Entry for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01) ("GTA 6 trophy guide", $250 USDC top-50, free entry, deadline 21 Nov 2026 14:30 Tehran).

A complete, checkable guide to all 55 GTA VI PlayStation trophies: what each one asks, how to earn it, the order to do them in, and which four are provisionally missable. It is a static page — it works from `file://` and from any static host, with no build step and no network.

## What it is

- **Checklist** — all 55 trophies with grade, kind, tracked count, and a tick box. Progress is stored in the browser only (`localStorage`); nothing is uploaded.
- **Guide panel** — click any trophy for its full guide: numbered steps, sources, roadmap stage, and a missable warning where it applies.
- **Roadmap** — the 55 trophies in 8 stages, in play order, with per-stage progress and a box calling out the 4 provisional missables.
- **Spoiler control** — story guides can be hidden until you ask for them.
- **Filters** — search, grade, kind, missable-only, earned-only, hide-earned.

## Trophy data

Every trophy name, description and grade is the official PlayStation trophy list, matched exactly to the bounty kit (1 platinum, 2 gold, 6 silver, 46 bronze). The guides are original, written from those official descriptions. Where a description is cryptic, or a trigger is not yet confirmed in-game, the guide says so instead of inventing a step. Sources per trophy are listed in the guide panel: the PlayStation descriptions, PSNProfiles trophy listings, and the in-game menus (stats, activities, challenges, collection, vehicle, property, business, gang-activity) that show the counts the game itself tracks.

The four provisional missables — flagged from the trophy descriptions, not from a confirmed in-game test — are **Hot Together**, **Retail Therapy**, **Actions Speak Louder** and **Bad Luck, I Guess**. The guide says to do them the first time the chance appears.

## Run it

```sh
node serve.ts            # http://localhost:8080
# or open app/index.html directly (file:// works: data is embedded in app/data.js)
```

## Build the dossier

```sh
node tools/gen-data.mjs  # regenerate app/data.js from app/data/trophies.json
node tools/shots.mjs     # take the 4 graded screenshots (1280x720 JPEG)
MAKEFUN_OUTPUT_DIR=out node main.ts   # copy app/ + screenshots/, write out/dossier.json
```

`main.ts` copies `app/` and `screenshots/` into the output directory and calls `buildDossier` from the kit's vendor library (`vendor/makefun-frontend.ts`) with the bounty gate's caps (dossier text ≤ 163,840 bytes; 3–4 screenshots, each ≤ 256 KiB; app/ ≤ 993 files and 48 MiB). Running it twice on the same repo produces a byte-identical `dossier.json`.

## Layout

```
main.ts                 entrypoint: copy app/ + screenshots/ -> output, write dossier.json
serve.ts                static server for local testing and screenshots
vendor/makefun-frontend.ts   kit library (buildDossier) — copied byte-identical from the kit
app/
  index.html            page shell (classic scripts only)
  style.css             dark + Vice City pink/cyan styling, no external assets
  app.js                checklist, filters, guide panel, roadmap, progress, hash routing
  data.js               trophy data embedded as a classic script (generated, file:// safe)
  data/trophies.json    the 55 trophies: official name/description/grade + original guides
shots.json              the 4 screenshot specs (cover, guide, roadmap, missable filter)
tools/
  gen-data.mjs          regenerate app/data.js from app/data/trophies.json
  shots.mjs             Playwright driver for the 4 screenshots
screenshots/           1-checklist.jpg, 2-guide.jpg, 3-roadmap.jpg, 4-missable.jpg
```

## License

MIT — see `LICENSE`.
