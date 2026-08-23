// Upgrades: some are leveled (repeatable, scaling cost), some are one-time toggles.

var UPGRADES = [
  {
    id: "loupe",
    name: "Magnifying Loupe",
    blurb: "A jeweller's loupe makes it easier to spot the coins worth keeping. Improves odds of rare finds.",
    type: "leveled",
    maxLevel: 10,
    baseCost: 2000,
    costMult: 1.6
  },
  {
    id: "bigger_lots",
    name: "Bulk Buyer's Permit",
    blurb: "Dealers let you buy in bigger volumes. +8% coins per lot.",
    type: "leveled",
    maxLevel: 5,
    baseCost: 5000,
    costMult: 2.2
  },
  {
    id: "quick_sort",
    name: "Quick Fingers",
    blurb: "Years of practice sorting change. Coins are identified faster.",
    type: "leveled",
    maxLevel: 8,
    baseCost: 1500,
    costMult: 1.5
  },
  {
    id: "sorting_slots",
    name: "Sorting Tray",
    blurb: "A proper tray with room to work. Identify one more coin at a time per level.",
    type: "leveled",
    maxLevel: 6,
    baseCost: 6000,
    costMult: 1.8
  },
  {
    id: "grading_books",
    name: "Grading Reference Books",
    blurb: "Standard references on assessing condition. Studying one gives your eye a head start -- though nothing replaces grading coins yourself.",
    type: "leveled",
    maxLevel: 6,
    baseCost: 3000,
    costMult: 2.0
  },
  {
    id: "appraiser",
    name: "Appraiser's Eye",
    blurb: "A sharper sense for what a coin is really worth. Increases sale value.",
    type: "leveled",
    maxLevel: 10,
    baseCost: 3000,
    costMult: 1.7
  },
  {
    id: "haggler",
    name: "Haggler's Discount",
    blurb: "You've built a rapport with the sellers. Reduces lot prices.",
    type: "leveled",
    maxLevel: 8,
    baseCost: 4000,
    costMult: 1.8
  },
  {
    id: "display_case",
    name: "Display Cabinet",
    blurb: "A glass cabinet for your collection. Visitors chip in to see it -- passive income that scales with coins collected.",
    type: "leveled",
    maxLevel: 10,
    baseCost: 10000,
    costMult: 1.9
  },
  {
    id: "auto_curator",
    name: "Curator's Ledger",
    blurb: "A running record of what you need. Automatically keeps coins missing from your collection and sells the rest once they're identified.",
    type: "toggle",
    baseCost: 25000
  },
  {
    id: "auto_buy",
    name: "Standing Order",
    blurb: "Automatically buys your selected lot whenever you can afford it.",
    type: "toggle",
    baseCost: 60000
  }
];

var UPGRADES_BY_ID = {};
UPGRADES.forEach(function (u) { UPGRADES_BY_ID[u.id] = u; });

function upgradeCost(def, currentLevel) {
  if (def.type === "toggle") return def.baseCost;
  return Math.round(def.baseCost * Math.pow(def.costMult, currentLevel));
}
