// Bulk coin lots. Rather than hand-listing odds for every individual year
// (there are 160+ of them now), each lot names which penny *types* it draws
// from and how heavily, and the pool is built from that at purchase time --
// ordinary years in a type share its weight evenly, key dates get a small
// slice scaled by how rare they really are.
//
// A typeWeights entry can be a plain number (the whole type, unrestricted)
// or { weight, yearMin, yearMax } to draw only part of a type's year range
// -- used by the decimal starter bag, which stops at 1990.

var RARITY_POOL_MULTIPLIER = {
  Common: 1,
  Uncommon: 0.6,
  Rare: 0.08,
  VeryRare: 0.025,
  Legendary: 0.0007
};

function buildLotPool(lot) {
  var pool = {};
  Object.keys(lot.typeWeights).forEach(function (typeId) {
    var spec = lot.typeWeights[typeId];
    var weight = typeof spec === "number" ? spec : spec.weight;
    var yearMin = typeof spec === "object" ? spec.yearMin : undefined;
    var yearMax = typeof spec === "object" ? spec.yearMax : undefined;
    COINS.filter(function (c) {
      if (c.group !== typeId) return false;
      if (yearMin !== undefined && c.year < yearMin) return false;
      if (yearMax !== undefined && c.year > yearMax) return false;
      return true;
    }).forEach(function (c) {
      var mult = RARITY_POOL_MULTIPLIER[c.rarity] || 1;
      pool[c.id] = (pool[c.id] || 0) + weight * mult;
    });
  });
  return pool;
}

// Beginner bags only ever turn up well-worn coin -- the bottom of the
// grading scale -- until you're buying from someone who sorts stock.
var BEGINNER_GRADES = ["poor", "fair", "good", "vgood"];

// Not a purchasable lot -- this seeds the very first tray for free, as if
// the player is going through a deceased family member's house. Weighted
// toward the decades a long life would have spanned, with a handful of
// older pieces turning up in a drawer somewhere.
var STARTING_ESTATE = {
  id: "family_estate",
  gradeCap: BEGINNER_GRADES,
  typeWeights: {
    victoria_bun: 2, victoria_veiled: 3, edward_vii: 4,
    george_v: 8, george_vi: 14, eii_predecimal: 18,
    eii_decimal_new: 10, eii_decimal_bronze: 8, eii_decimal_steel: 3
  }
};

var LOTS = [
  {
    id: "decimal_bag",
    name: "Decimal Charity Bag",
    blurb: "A tin of early decimal pennies from the local charity shop -- nothing newer than 1990.",
    unlockCost: 0,
    baseCost: 100,
    coinsPerLot: 50,
    gradeCap: BEGINNER_GRADES,
    typeWeights: {
      eii_decimal_new: 60,
      eii_decimal_bronze: { weight: 40, yearMax: 1990 }
    }
  },
  {
    id: "check_change",
    name: "Check Your Change",
    blurb: "Rifle through your own pocket change for modern coins. Free, but only one at a time.",
    isFree: true,
    unlockCost: 0,
    baseCost: 0,
    coinsPerLot: 1,
    cooldownMs: 3000,
    typeWeights: {
      eii_decimal_steel: 70, charles_iii: 30
    }
  },
  {
    id: "ebay_bag",
    name: "eBay Bulk Bag",
    blurb: "\"100 x mixed pennies, unsearched!\" -- a bulk bag bought off eBay, with a few old survivors mixed in.",
    unlockCost: 400,
    baseCost: 500,
    coinsPerLot: 100,
    typeWeights: {
      eii_decimal_steel: 25, eii_decimal_bronze: 18, eii_decimal_new: 8, charles_iii: 8,
      eii_predecimal: 14, george_vi: 8, george_v: 1
    }
  },
  {
    id: "car_boot",
    name: "Car Boot Sale Box",
    blurb: "A shoebox of odds and ends bought off a folding table for a fiver.",
    unlockCost: 2000,
    baseCost: 2500,
    coinsPerLot: 20,
    typeWeights: {
      eii_decimal_steel: 6, eii_decimal_bronze: 5, eii_decimal_new: 3, charles_iii: 2,
      eii_predecimal: 16, george_vi: 16, george_v: 10, edward_vii: 5, victoria_veiled: 3
    }
  },
  {
    id: "antique_lot",
    name: "Antique Dealer's Lot",
    blurb: "A dealer's tray of pre-decimal coppers, some of it genuinely old.",
    unlockCost: 12000,
    baseCost: 15000,
    coinsPerLot: 12,
    typeWeights: {
      george_vi: 10, george_v: 10, edward_vii: 9, victoria_veiled: 9, victoria_bun: 8, eii_predecimal: 4
    }
  },
  {
    id: "estate_hoard",
    name: "Estate Sale Hoard",
    blurb: "An entire collection, inherited and sold off in one lot. Anything could be in here.",
    unlockCost: 60000,
    baseCost: 100000,
    coinsPerLot: 10,
    typeWeights: {
      victoria_bun: 6, victoria_veiled: 6, edward_vii: 6, george_v: 7, george_vi: 7,
      eii_predecimal: 5, eii_decimal_steel: 2, eii_decimal_bronze: 2, eii_decimal_new: 2, charles_iii: 1.5
    }
  }
];

var LOTS_BY_ID = {};
LOTS.forEach(function (l) { LOTS_BY_ID[l.id] = l; });
