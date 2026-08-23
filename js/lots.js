// Bulk coin lots you can purchase. Each lot has an explicit weighted pool
// of coin ids so early lots stay mundane and later lots open up the good stuff.

var LOTS = [
  {
    id: "jar",
    name: "Loose Change Jar",
    blurb: "The coppers and silvers rattling around in everyone's kitchen drawer.",
    unlockCost: 0,
    baseCost: 1500,
    coinsPerLot: 4,
    pool: {
      p1_eii: 30, p2_eii: 25, p5_eii: 20, p10_eii: 15, p20_eii: 8, p50_eii: 4,
      pound1_eii: 2, pound2_eii: 0.5,
      p1_ciii: 3, p2_ciii: 2, p5_ciii: 1
    }
  },
  {
    id: "bank_bag",
    name: "Bank Coin Bag",
    blurb: "A sealed bag straight from the bank, mostly circulation coin.",
    unlockCost: 10000,
    baseCost: 6000,
    coinsPerLot: 6,
    pool: {
      p1_eii: 20, p2_eii: 20, p5_eii: 18, p10_eii: 15, p20_eii: 12, p50_eii: 8,
      pound1_eii: 6, pound2_eii: 2,
      p1_ciii: 8, p2_ciii: 8, p5_ciii: 7, p10_ciii: 5, p20_ciii: 4, p50_ciii: 2,
      pound1_ciii: 1, pound2_ciii: 0.5
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
      p1_eii: 10, p2_eii: 10, p5_eii: 10, p10_eii: 9, p20_eii: 8, p50_eii: 8,
      pound1_eii: 6, pound2_eii: 3,
      p1_ciii: 6, p2_ciii: 6, p5_ciii: 6, p10_ciii: 5, p20_ciii: 5, p50_ciii: 4,
      pound1_ciii: 3, pound2_ciii: 1,
      kew_gardens: 0.05, football_50p: 1, beatrix_potter_50p: 2, brexit_50p: 2.5, wwf_50p: 0.8
    }
  },
  {
    id: "antique_lot",
    name: "Antique Dealer's Lot",
    blurb: "A dealer's tray of curiosities, some of it genuinely old.",
    unlockCost: 120000,
    baseCost: 75000,
    coinsPerLot: 6,
    pool: {
      p1_eii: 3, p2_eii: 3, p5_eii: 3, p10_eii: 3, p20_eii: 3, p50_eii: 3,
      pound1_eii: 3, pound2_eii: 2,
      p1_ciii: 2, p2_ciii: 2, p5_ciii: 2, p10_ciii: 2, p20_ciii: 2, p50_ciii: 2,
      pound1_ciii: 2, pound2_ciii: 1.5,
      kew_gardens: 0.1, football_50p: 2, beatrix_potter_50p: 3, brexit_50p: 3, wwf_50p: 1.5,
      victorian_penny: 2, victorian_farthing: 2, edward_sixpence: 1.5,
      george5_shilling: 2, george6_florin: 1.5, eliz_crown: 1
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
      p1_eii: 1, p2_eii: 1, p5_eii: 1, p10_eii: 1, p20_eii: 1, p50_eii: 1,
      pound1_eii: 1, pound2_eii: 1,
      p1_ciii: 1, p2_ciii: 1, p5_ciii: 1, p10_ciii: 1, p20_ciii: 1, p50_ciii: 1,
      pound1_ciii: 1, pound2_ciii: 1,
      kew_gardens: 0.3, football_50p: 4, beatrix_potter_50p: 5, brexit_50p: 5, wwf_50p: 3,
      victorian_penny: 4, victorian_farthing: 4, edward_sixpence: 3,
      george5_shilling: 4, george6_florin: 3, eliz_crown: 2.5
    }
  }
];

var LOTS_BY_ID = {};
LOTS.forEach(function (l) { LOTS_BY_ID[l.id] = l; });
