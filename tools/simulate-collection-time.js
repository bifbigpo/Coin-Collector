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
// Usage: node tools/simulate-collection-time.js [trials]
//   trials defaults to 500.

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const JS_DIR = path.join(__dirname, "..", "js");
const sandbox = {};
vm.createContext(sandbox);
["coins.js", "lots.js"].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(JS_DIR, file), "utf8"), sandbox, { filename: file });
});

const { COINS, LOTS, LOTS_BY_ID, STARTING_ESTATE, buildLotPool } = sandbox;
const ALL_COIN_IDS = COINS.map((c) => c.id);
const COINS_BY_ID = {};
COINS.forEach((c) => (COINS_BY_ID[c.id] = c));

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
  lotPools[lot.id] = {
    pool: buildLotPool(lot),
    guaranteedPool: lot.guaranteed ? buildLotPool(lot, lot.guaranteed.minRarity, lot.guaranteed.groups) : null,
  };
});

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

// Strategy: take the free starting tray, bootstrap on Decimal Charity Bag
// until Estate Sale Hoard is affordable, then buy Estate Sale Hoard
// exclusively -- it's the only lot whose typeWeights span every penny
// group, and (per its guaranteed Rare+ slot) gives the best odds of any
// lot at each of the three Legendary key dates that gate completion.
// Duplicates are sold immediately at the base 60% dealer cut to fund the
// next buy; cash is never actually the constraint once Estate Hoard is
// reachable (see README note below).
const BOOTSTRAP_LOT = "decimal_bag";
const MAIN_LOT = "estate_hoard";

function simulateOneRun() {
  let cash = 100; // pence, matches defaultState() in state.js
  const collection = new Set();
  let coinsDrawn = 0;
  let lotsBought = 0;

  const startPool = buildLotPool(STARTING_ESTATE);
  for (let i = 0; i < 100; i++) {
    collection.add(weightedPick(startPool));
    coinsDrawn++;
  }

  while (collection.size < ALL_COIN_IDS.length) {
    let lotId;
    if (cash >= LOTS_BY_ID[MAIN_LOT].baseCost) lotId = MAIN_LOT;
    else if (cash >= LOTS_BY_ID[BOOTSTRAP_LOT].baseCost) lotId = BOOTSTRAP_LOT;
    else lotId = "check_change"; // free; ignores its 3s cooldown, negligible next to identify time

    const lot = LOTS_BY_ID[lotId];
    cash -= lot.baseCost;
    lotsBought++;
    drawCoinsFromLot(lot).forEach((coinId) => {
      coinsDrawn++;
      if (!collection.has(coinId)) {
        collection.add(coinId);
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
  const nTrials = process.argv[2] ? parseInt(process.argv[2], 10) : 500;
  const results = [];
  for (let i = 0; i < nTrials; i++) results.push(simulateOneRun());

  const draws = results.map((r) => r.coinsDrawn).sort((a, b) => a - b);
  const mean = draws.reduce((a, b) => a + b, 0) / draws.length;

  console.log(`Trials: ${nTrials}`);
  console.log(`Catalog size: ${ALL_COIN_IDS.length} coins`);
  console.log(`\nCoins identified to complete the full collection (1/sec bottleneck):`);
  console.log(`  min=${draws[0]}  p10=${percentile(draws, 0.1)}  median=${percentile(draws, 0.5)}  ` +
    `mean=${mean.toFixed(0)}  p90=${percentile(draws, 0.9)}  max=${draws[draws.length - 1]}`);

  console.log(`\nEquivalent continuous play time (tab open, ticking -- no offline progress in state.js):`);
  console.log(`  min=${formatTime(draws[0])}  p10=${formatTime(percentile(draws, 0.1))}  ` +
    `median=${formatTime(percentile(draws, 0.5))}`);
  console.log(`  mean=${formatTime(mean)}  p90=${formatTime(percentile(draws, 0.9))}  ` +
    `max=${formatTime(draws[draws.length - 1])}`);
}

main();
