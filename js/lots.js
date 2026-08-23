// Bulk coin lots. Rather than hand-listing odds for every individual year
// (there are 160+ of them now), each lot names which penny *types* it draws
// from and how heavily, and the pool is built from that at purchase time --
// ordinary years in a type share its weight evenly, key dates get a small
// slice scaled by how rare they really are.

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
    var weight = lot.typeWeights[typeId];
    COINS.filter(function (c) { return c.group === typeId; }).forEach(function (c) {
      var mult = RARITY_POOL_MULTIPLIER[c.rarity] || 1;
      pool[c.id] = (pool[c.id] || 0) + weight * mult;
    });
  });
  return pool;
}

var LOTS = [
  {
    id: "charity_bag",
    name: "Charity Shop Bag",
    blurb: "50 assorted pennies from the local charity shop, sold by weight for a pound.",
    unlockCost: 0,
    baseCost: 100,
    coinsPerLot: 50,
    typeWeights: {
      eii_decimal_steel: 45, eii_decimal_bronze: 25, eii_decimal_new: 10, charles_iii: 12,
      eii_predecimal: 4, george_vi: 1
    }
  },
  {
    id: "bank_bag",
    name: "Bank Coin Bag",
    blurb: "A sealed bag straight from the bank, with a few old survivors mixed in.",
    unlockCost: 400,
    baseCost: 500,
    coinsPerLot: 35,
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
