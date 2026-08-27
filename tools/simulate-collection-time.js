#!/usr/bin/env node
// Monte Carlo simulation: how many coins must be identified (the game's
// fixed, unupgradeable 1-coin/sec bottleneck -- see maxIdentifySlots() in
// engine.js) to complete the entire penny collection under a near-optimal
// buying strategy?
//
// Loads js/coins.js and js/lots.js directly (real COINS catalog, real
// buildLotPool weighting) so results track the actual game data -- no
// separate data file to keep in sync.
//
// Usage: node tools/simulate-collection-time.js [trials] [--exclude-rarity=Rarity,...]
//   trials defaults to 500.
//   --exclude-rarity drops matching coins from the completion target
//   entirely (they're still drawable and sellable, just not required) --
//   e.g. --exclude-rarity=Legendary to ask "how long without the 3
//   near-impossible key dates?"

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const JS_DIR = path.join(__dirname, "..", "js");
const sandbox = {};
vm.createContext(sandbox);
["coins.js", "lots.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(JS_DIR, file), "utf8"), sandbox, { filename: file });
});

const { COINS, LOTS, STARTING_ESTATE, buildLotPool } = sandbox;
const COINS_BY_ID = {};
COINS.forEach((c) => (COINS_BY_ID[c.id] = c));

function parseExcludeRarity(argv) {
  const flag = argv.find((a) => a.startsWith("--exclude-rarity="));
  if (!flag) return [];
  return flag.slice("--exclude-rarity=".length).split(",").filter(Boolean);
}
const EXCLUDED_RARITIES = parseExcludeRarity(process.argv.slice(2));
const TARGET_COIN_IDS = COINS.filter((c) => EXCLUDED_RARITIES.indexOf(c.rarity) === -1).map((c) => c.id);

function weightedPick(pool) {
  const entries = Object.keys(pool);
  const total = entries.reduce((s, id) => s + pool[id], 0);
  let r = Math.random() * total;
  for (let i = 0; i < entries.length; i++) {
    r -= pool[entries[i]];
    if (r <= 0) return entries[i];
  }
  return entries[entries.length - 1];
}

// Pools depend only on the fixed catalog, so build each lot's once.
const lotPools = {};
LOTS.forEach((lot) => {
  const pool = buildLotPool(lot);
  const guaranteedPool = lot.guaranteed ? buildLotPool(lot, lot.guaranteed.minRarity, lot.guaranteed.groups) : null;
  lotPools[lot.id] = {
    pool,
    guaranteedPool,
    total: Object.values(pool).reduce((a, b) => a + b, 0),
    gTotal: guaranteedPool ? Object.values(guaranteedPool).reduce((a, b) => a + b, 0) : 0,
    gCount: lot.guaranteed ? Math.min(lot.guaranteed.count, lot.coinsPerLot) : 0,
  };
});

// Expected fraction of this lot's draws that will land on a coin still
// missing from the target set -- used to pick which lot to buy next (see
// chooseLot below). Cheap to compute per decision: only iterates the
// (shrinking) missing set, not the whole catalog.
function expectedNewFractionPerDraw(lot, missingSet) {
  const { pool, guaranteedPool, total, gTotal, gCount } = lotPools[lot.id];
  const normalCount = lot.coinsPerLot - gCount;
  let sumNormal = 0;
  let sumGuaranteed = 0;
  missingSet.forEach((id) => {
    if (pool[id]) sumNormal += pool[id] / total;
    if (guaranteedPool && guaranteedPool[id]) sumGuaranteed += guaranteedPool[id] / gTotal;
  });
  return (normalCount * sumNormal + gCount * sumGuaranteed) / lot.coinsPerLot;
}

// Greedily buys whichever affordable lot yields the most still-needed
// coins per coin drawn -- since identify time (1/coin, fixed) is what
// actually costs real time, this minimizes expected time far better than
// a single fixed lot choice, and automatically adapts as the target set
// changes (e.g. --exclude-rarity) or as groups get filled in and the
// remaining gaps shift to a different lot's sweet spot (a handful of
// stragglers in the thin decimal runs favor Check Your Change or Decimal
// Charity Bag late-game even though Estate Sale Hoard dominates early).
function chooseLot(cash, missingSet) {
  let best = null;
  let bestYield = -1;
  LOTS.forEach((lot) => {
    if (cash < lot.baseCost) return;
    const y = expectedNewFractionPerDraw(lot, missingSet);
    if (y > bestYield) {
      bestYield = y;
      best = lot;
    }
  });
  return best;
}

function drawCoinsFromLot(lot) {
  const { pool, guaranteedPool } = lotPools[lot.id];
  const gCount = lot.guaranteed ? Math.min(lot.guaranteed.count, lot.coinsPerLot) : 0;
  const out = [];
  for (let i = 0; i < lot.coinsPerLot; i++) {
    const useGuaranteed = i < gCount && guaranteedPool && Object.keys(guaranteedPool).length;
    out.push(weightedPick(useGuaranteed ? guaranteedPool : pool));
  }
  return out;
}

// Simplified grade roll (real GRADES table from engine.js) -- only used
// here to price duplicates for selling; grading time itself is negligible
// next to the identify bottleneck (see README note below) so it's not
// separately simulated.
const GRADES = [
  { mult: 0.2, weight: 22 }, { mult: 0.3, weight: 18 }, { mult: 0.4, weight: 16 },
  { mult: 0.55, weight: 14 }, { mult: 0.75, weight: 12 }, { mult: 1.0, weight: 9 },
  { mult: 1.5, weight: 5 }, { mult: 2.2, weight: 3 }, { mult: 3.5, weight: 1 },
];
const GRADE_TOTAL_WEIGHT = GRADES.reduce((s, g) => s + g.weight, 0);
function rollGradeMult() {
  let r = Math.random() * GRADE_TOTAL_WEIGHT;
  for (const g of GRADES) {
    r -= g.weight;
    if (r <= 0) return g.mult;
  }
  return GRADES[GRADES.length - 1].mult;
}

// Strategy: take the free starting tray, then on each purchase greedily
// buy whichever affordable lot's expected still-needed-coins-per-draw is
// highest (chooseLot above), selling every duplicate immediately at the
// base 60% dealer cut to fund the next buy. Cash is never actually the
// binding constraint here -- see README note below -- so this reduces to
// "always draw from the lot best suited to whatever's still missing."
// Ignores lot cooldowns (Check Your Change's 3s): its 5 coins take 5s to
// identify regardless, which already exceeds the cooldown, so it's never
// actually gating.
function simulateOneRun(targetCoinIds) {
  let cash = 100; // pence, matches defaultState() in state.js
  const collection = new Set();
  const missing = new Set(targetCoinIds);
  let coinsDrawn = 0;
  let lotsBought = 0;

  const startPool = buildLotPool(STARTING_ESTATE);
  for (let i = 0; i < 100; i++) {
    const coinId = weightedPick(startPool);
    collection.add(coinId);
    missing.delete(coinId);
    coinsDrawn++;
  }

  while (missing.size > 0) {
    const lot = chooseLot(cash, missing);
    cash -= lot.baseCost;
    lotsBought++;
    drawCoinsFromLot(lot).forEach((coinId) => {
      coinsDrawn++;
      if (!collection.has(coinId)) {
        collection.add(coinId);
        missing.delete(coinId);
      } else {
        const value = COINS_BY_ID[coinId].value * rollGradeMult();
        cash += Math.max(1, Math.round(value * 0.6));
      }
    });
  }

  return { coinsDrawn, lotsBought };
}

function percentile(sortedArr, p) {
  return sortedArr[Math.floor(sortedArr.length * p)];
}

function formatTime(sec) {
  if (sec < 120) return sec.toFixed(0) + "s";
  if (sec / 60 < 120) return (sec / 60).toFixed(1) + " min";
  if (sec / 3600 < 48) return (sec / 3600).toFixed(1) + " hr";
  return (sec / 86400).toFixed(1) + " days";
}

function main() {
  const argv = process.argv.slice(2);
  const nTrials = argv[0] && !argv[0].startsWith("--") ? parseInt(argv[0], 10) : 500;
  const results = [];
  for (let i = 0; i < nTrials; i++) results.push(simulateOneRun(TARGET_COIN_IDS));

  const draws = results.map((r) => r.coinsDrawn).sort((a, b) => a - b);
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;

  console.log(`Trials: ${nTrials}`);
  console.log(`Catalog size: ${COINS.length} coins` +
    (EXCLUDED_RARITIES.length
      ? ` (target excludes ${EXCLUDED_RARITIES.join(", ")}: ${COINS.length - TARGET_COIN_IDS.length} coins dropped, ${TARGET_COIN_IDS.length} required)`
      : ` (${TARGET_COIN_IDS.length} required)`));
  console.log(`\nCoins identified to complete the target collection (1/sec bottleneck):`);
  console.log(`  min=${draws[0]}  p10=${percentile(draws, 0.1)}  median=${percentile(draws, 0.5)}  ` +
    `mean=${mean.toFixed(0)}  p90=${percentile(draws, 0.9)}  max=${draws[draws.length - 1]}`);

  console.log(`\nEquivalent continuous play time (tab open, ticking -- no offline progress in state.js):`);
  console.log(`  min=${formatTime(draws[0])}  p10=${formatTime(percentile(draws, 0.1))}  ` +
    `median=${formatTime(percentile(draws, 0.5))}`);
  console.log(`  mean=${formatTime(mean)}  p90=${formatTime(percentile(draws, 0.9))}  ` +
    `max=${formatTime(draws[draws.length - 1])}`);
}

main();
