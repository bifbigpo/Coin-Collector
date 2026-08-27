# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

"Coin Collector" — a browser-based incremental/idle game about collecting British pennies (Victoria to present). Pure static HTML/CSS/vanilla JS, no build step, no package manager, no tests, no framework.

## Running it

There's no dev server or build command. Just open `index.html` in a browser (or serve the directory with any static file server, e.g. `python3 -m http.server`). All state persists to `localStorage` under the key defined by `SAVE_KEY` in `js/state.js` — bump that key whenever a save-breaking change is made to state shape, since `loadState()` only shallow-merges new top-level fields into old saves (nested/renamed fields will not migrate).

There is no lint, test, or typecheck command configured — verify changes by loading the page and exercising the UI directly.

## Simulating the economy

`tools/simulate-collection-time.js` is a Node dev tool (no deps) that Monte Carlo-simulates a near-optimal playthrough to answer balance questions like "how long to complete the full collection?" It loads `js/coins.js` and `js/lots.js` directly via `vm` (real `COINS` catalog, real `buildLotPool` weighting — no separate data file to keep in sync), so it stays accurate as those files change. Run it with `node tools/simulate-collection-time.js [trials] [--exclude-rarity=Rarity,...]` (trials defaults to 500; `--exclude-rarity=Legendary` drops the 3 near-impossible key dates from the completion target to isolate their effect).

It models: the free starting tray, then on every purchase greedily buying whichever affordable lot currently yields the most still-needed coins per coin drawn (`chooseLot`/`expectedNewFractionPerDraw`) — this adapts automatically as the target set changes and as the remaining gaps shift between lots (Estate Sale Hoard dominates early and for the three `Legendary` key dates — the 1933 George V, 1952 George VI, and 1954 pre-decimal pennies, which gate full completion far more than anything else in the catalog — but a handful of late-game stragglers in the thin decimal runs are won faster from Check Your Change or Decimal Charity Bag instead). Duplicates are sold immediately at the base 60% cut to fund the next buy. It reports results in coins-identified (the real bottleneck: `maxIdentifySlots()` is a hard-coded `1` with no upgrade, so every draw costs a fixed 1s) converted to play time, since there's no offline-progress mechanic. Reuse or extend this script rather than re-deriving pool math by hand whenever a rebalance needs "how long will this take" numbers — e.g. after changing `RARITY_POOL_MULTIPLIER`, a lot's `typeWeights`/`guaranteed`, or adding new key dates.

## Script load order matters

`index.html` loads scripts in this order, and later files depend on globals defined by earlier ones (there's no module system — everything is global `var`/`function`):

```
coins.js → lots.js → upgrades.js → state.js → engine.js → pixelcoin.js → ui.js → main.js
```

- `coins.js` — the `COINS`/`PENNY_TYPES`/`COIN_GROUPS` catalog.
- `lots.js` — purchasable `LOTS` and the weighted-pool logic (`buildLotPool`) that draws coins from them.
- `upgrades.js` — the `UPGRADES` catalog and cost curve.
- `state.js` — `defaultState()`, save/load (`loadState`/`saveState`/`resetState`), and the initial `state` global (loaded here, so this must come after coins/lots/upgrades but before engine.js).
- `engine.js` — all game logic and mutation of `state` (buying, identifying, grading, keeping/selling, bonuses, sorting, `tick()`).
- `pixelcoin.js` — procedural pixel-art coin face generation, canvas-based, cached by coin/grade key.
- `ui.js` — pure rendering: `renderAll()` and friends rebuild DOM from `state` each call.
- `main.js` — wires up the single delegated click handler and the `tick()` interval.

## Architecture

**One global mutable `state` object, no framework.** Game logic (engine.js) mutates `state` directly and calls `saveState()`; UI (ui.js) is a full re-render on every change — `renderAll()` tears down and rebuilds the DOM from `state` each time rather than diffing. There's no reactivity system.

**Click handling is fully delegated.** `main.js` attaches one `click` listener on `document.body`; every interactive element carries `data-action` (and often `data-id`/`data-uid`) attributes, dispatched through a single `switch` in `handleClick()`. To add a new interactive control: add a `data-action` in the HTML/render code, add a case in `main.js`, implement the mutation in `engine.js`.

**Render-during-mousedown is deliberately deferred.** `tick()` runs every `TICK_MS` and can trigger `renderAll()`, which would tear down/rebuild buttons mid-click and silently swallow the click event. `requestRender()` in ui.js buffers renders while `mouseIsDown` is true and flushes once on mouseup + a follow-up tick. Direct user actions call `renderAll()` immediately instead; only the tick loop should call `requestRender()`.

**Two-stage coin lifecycle: identify → grade.** A tray entry (`{uid, coinId, identified, identifying, grading, graded, trueGrade, gradeCap, inGradeTray, selected, ...}`) first gets identified (reveals which coin it is, rolls `trueGrade` via `rollGrade`, capped by `gradeCap` if the lot restricts wear), then optionally sent to the grading tray to learn its exact grade with certainty. Until formally graded, a coin's condition is only known as an estimated range (`estimateRange`), narrowed by the player's grading skill (`SKILL_TIERS`, XP-gated) — `isAutoSpotted` lets high-skill players skip grading low grades entirely since they're obvious at a glance. Pricing (`entryGradeMult`, `coinSuggestedValue`) always uses the cautious low end of the estimate until a coin is graded or auto-spotted.

**Weighted draw pools built at purchase time, not hand-listed.** `buildLotPool()` (lots.js) expands a lot's `typeWeights` (penny types + optional year range) into a per-coin weight map, scaled by `RARITY_POOL_MULTIPLIER`, at the moment a lot is bought — so the ~160+ individual year/coin entries never need per-lot enumeration. A lot can also declare a `guaranteed` sub-pool (drawn from a rarity- or group-restricted slice) to make pricier lots feel more curated. `gradeCapForIndex`/`gradeCapTiers` let a single lot mix multiple wear-tier caps across its coins.

**Coin catalog is generated, not hand-listed.** `coins.js` expands `PENNY_TYPES` (one entry per historical penny design/era) into one `COINS` entry per year in its range, splicing in real key-date rarities/values (`keyDates`) and one-off mint-variant coins (`extraCoins`, e.g. WWI branch-mint pennies). Adding a new penny type or key date means editing `PENNY_TYPES`, not `COINS` directly.

**Pixel art is procedural, not hand-authored.** `pixelcoin.js` renders each coin face on a 16x16 canvas from the coin's own data (group → headwear silhouette, year → alloy color, rarity → ring color, grade → wear/shine effects), deterministically seeded (`mulberry32`/`hashString`) so the same coin+grade always looks identical, and cached by that same key. New `PENNY_TYPES` groups render for free via `HEADWEAR_FALLBACK_LIST` even without a hand-drawn `HEADWEAR_BY_GROUP` entry.

**Economy tuning lives as commented constants near the top of engine.js/lots.js/upgrades.js** (grade multipliers/weights in `GRADES`, skill tiers in `SKILL_TIERS`, rarity pool multipliers in `lots.js`, cost curves in `upgradeCost`). When rebalancing, check the comment above each table — several encode a deliberate design rationale (e.g. lot pricing targets ~85% of expected raw value, `GRADE_SPEED_DECAY` is solved to land exactly on a 1s floor at max level).
