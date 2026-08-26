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

var RARITY_ORDER = ["Common", "Uncommon", "Rare", "VeryRare", "Legendary"];

// Builds the weighted draw pool for a lot. Pass minRarity to instead build
// the *guaranteed* sub-pool for lot.guaranteed -- e.g. "Rare" restricts to
// coins of Rare quality or better, still weighted by RARITY_POOL_MULTIPLIER
// among themselves so a guaranteed pick still favors Rare over Legendary.
// Pass groupIds to further restrict a guaranteed pick to specific penny
// types regardless of rarity -- e.g. STARTING_ESTATE.guaranteed, which
// steers toward a type rather than a rarity tier.
function buildLotPool(lot, minRarity, groupIds) {
  var minIdx = minRarity ? RARITY_ORDER.indexOf(minRarity) : -1;
  var pool = {};
  Object.keys(lot.typeWeights).forEach(function (typeId) {
    if (groupIds && groupIds.indexOf(typeId) === -1) return;
    var spec = lot.typeWeights[typeId];
    var weight = typeof spec === "number" ? spec : spec.weight;
    var yearMin = typeof spec === "object" ? spec.yearMin : undefined;
    var yearMax = typeof spec === "object" ? spec.yearMax : undefined;
    COINS.filter(function (c) {
      if (c.group !== typeId) return false;
      if (yearMin !== undefined && c.year < yearMin) return false;
      if (yearMax !== undefined && c.year > yearMax) return false;
      if (minIdx >= 0 && RARITY_ORDER.indexOf(c.rarity) < minIdx) return false;
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
// older pieces turning up in a drawer somewhere. Guarantees one coin from
// one of the three easiest full runs to complete -- Bronze, New Penny, or
// Pre-Decimal, all short, cheap-to-fill sets with no punishing key dates --
// so every player starts with a real shot at their first completion bonus,
// rather than the guarantee occasionally burning itself on an unreachable
// George V/VI jackpot coin.
var STARTING_ESTATE = {
  id: "family_estate",
  gradeCap: BEGINNER_GRADES,
  guaranteed: { count: 1, groups: ["eii_decimal_bronze", "eii_decimal_new", "eii_predecimal"] },
  typeWeights: {
    victoria_bun: 2, victoria_veiled: 3, edward_vii: 4,
    george_v: 8, george_vi: 14, eii_predecimal: 18,
    eii_decimal_new: 10, eii_decimal_bronze: 8, eii_decimal_steel: 3
  }
};

// Lots are priced at roughly 85% of the expected raw value of what they
// contain (excluding the vanishingly-rare Legendary jackpot, which is left
// as pure upside rather than priced in), so flipping a lot straight back to
// a dealer is always a small loss -- the real return comes from keeping
// what you need. Pricier lots trade a wider draw for a `guaranteed` pick or
// two from a rarity-filtered sub-pool, so the escalating cost buys a more
// curated, less random outcome rather than just more coins.
var LOTS = [
  {
    id: "check_change",
    name: "Check Your Change",
    blurb: "Rifle through your own pocket change for modern coins. Free, five coins at a time.",
    isFree: true,
    baseCost: 0,
    coinsPerLot: 5,
    cooldownMs: 3000,
    typeWeights: {
      eii_decimal_steel: 70, charles_iii: 30
    }
  },
  {
    id: "decimal_bag",
    name: "Decimal Charity Bag",
    blurb: "A tin of early decimal pennies from the local charity shop -- nothing newer than 1990.",
    baseCost: 100,
    coinsPerLot: 60,
    gradeCap: BEGINNER_GRADES,
    typeWeights: {
      eii_decimal_new: 60,
      eii_decimal_bronze: { weight: 40, yearMax: 1990 }
    }
  },
  {
    id: "predecimal_bag",
    name: "Purchase pre-decimal bag from charity shop",
    blurb: "The same charity shop's other tin -- pre-decimal pennies that reach back well before 1971.",
    baseCost: 500,
    coinsPerLot: 20,
    typeWeights: {
      eii_predecimal: 55, george_vi: 30, george_v: 10, edward_vii: 3, victoria_veiled: 2
    }
  },
  {
    id: "ebay_bag",
    name: "eBay Bulk Bag",
    blurb: "\"100 x mixed pennies, unsearched!\" -- a bulk bag bought off eBay, with a few old survivors mixed in.",
    baseCost: 1000,
    coinsPerLot: 100,
    typeWeights: {
      eii_decimal_steel: 25, eii_decimal_bronze: 18, eii_decimal_new: 8, charles_iii: 8,
      eii_predecimal: 14, george_vi: 8, george_v: 1
    }
  },
  {
    id: "car_boot",
    name: "Car Boot Sale Box",
    blurb: "A shoebox of odds and ends bought off a folding table for a fiver -- worth a proper look through.",
    baseCost: 2000,
    coinsPerLot: 20,
    guaranteed: { count: 1, minRarity: "Uncommon" },
    typeWeights: {
      eii_decimal_steel: 6, eii_decimal_bronze: 5, eii_decimal_new: 3, charles_iii: 2,
      eii_predecimal: 16, george_vi: 16, george_v: 10, edward_vii: 5, victoria_veiled: 3
    }
  },
  {
    id: "antique_lot",
    name: "Antique Dealer's Lot",
    blurb: "A dealer's tray of pre-decimal coppers, curated enough that at least one is worth having.",
    baseCost: 4000,
    coinsPerLot: 12,
    guaranteed: { count: 1, minRarity: "Rare" },
    typeWeights: {
      george_vi: 10, george_v: 10, edward_vii: 9, victoria_veiled: 9, victoria_bun: 8, eii_predecimal: 4
    }
  },
  {
    id: "estate_hoard",
    name: "Estate Sale Hoard",
    blurb: "An entire collection, inherited and sold off in one lot -- vetted by someone who knew what they had.",
    baseCost: 6000,
    coinsPerLot: 10,
    guaranteed: { count: 2, minRarity: "Rare" },
    typeWeights: {
      victoria_bun: 6, victoria_veiled: 6, edward_vii: 6, george_v: 7, george_vi: 7,
      eii_predecimal: 5, eii_decimal_steel: 2, eii_decimal_bronze: 2, eii_decimal_new: 2, charles_iii: 1.5
    }
  },
  {
    // Priced at ~85% of this bag's own expected raw value, same principle
    // as the rest of the shop (see the pricing note above) -- 30 coins at
    // an ~£3.31 expected value each is ~£99.16 raw, so £85 here. No
    // guaranteed pick yet; the oldest, priciest common-value coins in the
    // game (commonValue 250/200p) already give it the highest expected
    // value of any lot without needing one.
    id: "victorian_bag",
    name: "Victorian Penny Bag",
    blurb: "A dedicated bag of Victorian coppers -- Bun Head and Veiled Head pennies, nothing past 1901.",
    baseCost: 8500,
    coinsPerLot: 30,
    typeWeights: {
      victoria_bun: 70, victoria_veiled: 30
    }
  }
];

var LOTS_BY_ID = {};
LOTS.forEach(function (l) { LOTS_BY_ID[l.id] = l; });
