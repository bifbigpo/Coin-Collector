// Bulk coin lots you can purchase. Each lot has an explicit weighted pool
// of coin ids so early lots stay mundane (modern loose change) and later,
// pricier lots dig further back into pre-decimal and Victorian pennies.

var LOTS = [
  {
    id: "jar",
    name: "Loose Change Jar",
    blurb: "The coppers rattling around in everyone's kitchen drawer. Mostly modern.",
    unlockCost: 0,
    baseCost: 1500,
    coinsPerLot: 4,
    pool: {
      eii_dec_one_penny_steel: 40, eii_dec_one_penny_bronze: 20, eii_dec_new_penny: 8,
      ciii_penny: 10,
      eii_pre_common: 3, geo6_common: 1
    }
  },
  {
    id: "bank_bag",
    name: "Bank Coin Bag",
    blurb: "A sealed bag straight from the bank, with a few old survivors mixed in.",
    unlockCost: 10000,
    baseCost: 6000,
    coinsPerLot: 6,
    pool: {
      eii_dec_one_penny_steel: 25, eii_dec_one_penny_bronze: 20, eii_dec_new_penny: 10,
      ciii_penny: 8,
      eii_pre_common: 10, geo6_common: 5, geo5_common: 1
    }
  },
  {
    id: "car_boot",
    name: "Car Boot Sale Box",
    blurb: "A shoebox of odds and ends bought off a folding table for a fiver.",
    unlockCost: 40000,
    baseCost: 22000,
    coinsPerLot: 8,
    pool: {
      eii_dec_one_penny_steel: 8, eii_dec_one_penny_bronze: 8, eii_dec_new_penny: 5, ciii_penny: 3,
      eii_pre_common: 15, eii_pre_1954: 0.02,
      geo6_common: 12, geo6_1950: 0.6, geo6_1951: 0.3,
      geo5_common: 8, geo5_1918h: 0.3, geo5_1919kn: 0.15, geo5_1933: 0.005,
      edw7_common: 4, vic_veil_common: 2
    }
  },
  {
    id: "antique_lot",
    name: "Antique Dealer's Lot",
    blurb: "A dealer's tray of pre-decimal coppers, some of it genuinely old.",
    unlockCost: 120000,
    baseCost: 75000,
    coinsPerLot: 6,
    pool: {
      geo6_common: 6, geo6_1950: 1.5, geo6_1951: 1, geo6_1952: 0.01,
      geo5_common: 6, geo5_1918h: 1, geo5_1919kn: 0.6, geo5_1933: 0.02,
      edw7_common: 5, edw7_1902_lowtide: 0.8,
      vic_veil_common: 5, vic_veil_1897_hightide: 0.6,
      vic_bun_common: 4, vic_bun_1869: 0.4,
      eii_pre_common: 3, eii_pre_1954: 0.03
    }
  },
  {
    id: "estate_hoard",
    name: "Estate Sale Hoard",
    blurb: "An entire collection, inherited and sold off in one lot. Anything could be in here.",
    unlockCost: 400000,
    baseCost: 250000,
    coinsPerLot: 10,
    pool: {
      vic_bun_common: 3, vic_bun_1869: 1,
      vic_veil_common: 3, vic_veil_1897_hightide: 1.2,
      edw7_common: 3, edw7_1902_lowtide: 1.2,
      geo5_common: 3, geo5_1918h: 1.5, geo5_1919kn: 1, geo5_1933: 0.08,
      geo6_common: 3, geo6_1950: 2, geo6_1951: 1.5, geo6_1952: 0.05,
      eii_pre_common: 3, eii_pre_1954: 0.15,
      eii_dec_new_penny: 1, eii_dec_one_penny_bronze: 1, eii_dec_one_penny_steel: 1, ciii_penny: 0.8
    }
  }
];

var LOTS_BY_ID = {};
LOTS.forEach(function (l) { LOTS_BY_ID[l.id] = l; });
