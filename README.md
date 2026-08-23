# Glyphbound

An incremental (idle-clicker) game prototype about learning an ancient language.

## Concept

You've found a trail of ancient tablets. Each one is written in a lost tongue
and only fully translates once you've learned the vocabulary it uses. Learn
enough words and the tablet reveals its **directions** — where to go next.

- **Study** to earn Knowledge (manual clicks, plus passive generation).
- **Learn words** by spending Knowledge. Every learned word keeps generating
  Knowledge passively forever after (an idle-game "generator"), and also
  permanently decodes that word wherever it appears on tablets.
- **Decipher the tablet**: unlearned words show as ancient runes (a real
  letter-by-letter substitution cipher), learned words show in English.
  Common grammar words ("the", "a", "is"...) are always readable — only
  the thematic vocabulary is locked behind learning.
- **Upgrades**: boost click power, global Knowledge multiplier, or flat
  passive income.
- **Chapters**: 3 locations (Trailhead → Hollow Cave → Mountain Temple),
  each with its own 10-word vocabulary and tablet. Finishing one reveals
  the directions to the next.
- **Ascend (prestige)**: after finishing all 3 chapters, reset your run for
  a permanent Scholar Point multiplier and start over with slightly higher
  costs — the classic incremental "go again, but faster" loop.

## Running it

It's a single self-contained file, no build step or server required:

```
open index.html
```

(or just double-click it / drag it into a browser tab). Progress autosaves
to `localStorage`.

## What this prototype is testing

- Does tying vocabulary learning to a cipher-decoding mechanic feel good as
  the core hook of an incremental game?
- Is the pacing of word costs vs. passive/click income reasonable across a
  10-word chapter?
- Does the chapter → directions → next chapter narrative loop motivate
  progress the way dungeon/floor progression does in other incrementals?
- Does the prestige (Ascend) loop feel worth doing once the first playthrough
  is done?

Everything here (word costs, rates, chapter count, upgrade costs, prestige
formula) is a first-pass balance guess, tunable in the `CHAPTERS` and
`UPGRADES` data structures at the top of the `<script>` in `index.html`.
