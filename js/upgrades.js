// Upgrades: some are leveled (repeatable, scaling cost), some are one-time toggles.
// A toggle may declare `requires: <id>` to stay locked until that other
// upgrade is owned.

var UPGRADES = [
  {
    id: "grade_tray_size",
    name: "Bigger Grading Tray",
    blurb: "A larger tray with more room to work. Grade one more coin at a time per level.",
    type: "leveled",
    maxLevel: 5,
    baseCost: 100,
    costMult: 2
  },
  {
    id: "grade_speed",
    name: "Practiced Hands",
    blurb: "Years at the bench pay off. Each level speeds up how long a coin takes to grade -- maxed out, a coin grades in 1 second flat.",
    type: "leveled",
    maxLevel: 8,
    baseCost: 200,
    costStep: 200
  },
  {
    id: "fair_market_appraisal",
    name: "Fair Market Appraisal",
    blurb: "Stop leaving money on the table. Sell coins for 85% of their true value instead of a dealer's usual 60% cut.",
    type: "toggle",
    baseCost: 20000
  },
  {
    id: "master_appraiser",
    name: "Master Appraiser",
    blurb: "Your reputation alone gets top dollar. Sell every coin for 100% of its full retail value.",
    type: "toggle",
    baseCost: 75000,
    requires: "fair_market_appraisal"
  }
];

var UPGRADES_BY_ID = {};
UPGRADES.forEach(function (u) { UPGRADES_BY_ID[u.id] = u; });

function upgradeCost(def, currentLevel) {
  if (def.type === "toggle") return def.baseCost;
  // costStep grows the price by a flat amount each level (e.g. Practiced
  // Hands: £2, £4, £6, ...); costMult grows it geometrically instead.
  if (def.costStep !== undefined) return def.baseCost + def.costStep * currentLevel;
  return Math.round(def.baseCost * Math.pow(def.costMult, currentLevel));
}
