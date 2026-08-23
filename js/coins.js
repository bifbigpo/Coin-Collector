// Coin catalog for the British Coins collection.
// Values are in pence to keep all math in integers.

var RARITY = {
  Common:    { label: "Common",    weightMult: 1 },
  Uncommon:  { label: "Uncommon",  weightMult: 1 },
  Rare:      { label: "Rare",      weightMult: 1 },
  VeryRare:  { label: "Very Rare", weightMult: 1 },
  Legendary: { label: "Legendary", weightMult: 1 }
};

var COIN_GROUPS = [
  { id: "eii_decimal", label: "Elizabeth II Decimal" },
  { id: "ciii_decimal", label: "Charles III Decimal" },
  { id: "commemorative", label: "Commemorative 50p" },
  { id: "predecimal", label: "Pre-Decimal Classics" }
];

var COINS = [
  // --- Elizabeth II decimal (common circulation) ---
  { id: "p1_eii", name: "1p", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Common", value: 1 },
  { id: "p2_eii", name: "2p", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Common", value: 2 },
  { id: "p5_eii", name: "5p", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Common", value: 5 },
  { id: "p10_eii", name: "10p", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Common", value: 10 },
  { id: "p20_eii", name: "20p", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Common", value: 20 },
  { id: "p50_eii", name: "50p", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Uncommon", value: 50 },
  { id: "pound1_eii", name: "£1", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Uncommon", value: 100 },
  { id: "pound2_eii", name: "£2", subtitle: "Elizabeth II", group: "eii_decimal", rarity: "Rare", value: 200 },

  // --- Charles III decimal (newer, scarcer, small collector premium) ---
  { id: "p1_ciii", name: "1p", subtitle: "Charles III", group: "ciii_decimal", rarity: "Uncommon", value: 3 },
  { id: "p2_ciii", name: "2p", subtitle: "Charles III", group: "ciii_decimal", rarity: "Uncommon", value: 6 },
  { id: "p5_ciii", name: "5p", subtitle: "Charles III", group: "ciii_decimal", rarity: "Uncommon", value: 15 },
  { id: "p10_ciii", name: "10p", subtitle: "Charles III", group: "ciii_decimal", rarity: "Rare", value: 30 },
  { id: "p20_ciii", name: "20p", subtitle: "Charles III", group: "ciii_decimal", rarity: "Rare", value: 60 },
  { id: "p50_ciii", name: "50p", subtitle: "Charles III", group: "ciii_decimal", rarity: "Rare", value: 150 },
  { id: "pound1_ciii", name: "£1", subtitle: "Charles III", group: "ciii_decimal", rarity: "VeryRare", value: 300 },
  { id: "pound2_ciii", name: "£2", subtitle: "Charles III", group: "ciii_decimal", rarity: "VeryRare", value: 500 },

  // --- Commemorative 50p ---
  { id: "kew_gardens", name: "Kew Gardens 50p", subtitle: "2009", group: "commemorative", rarity: "Legendary", value: 12000 },
  { id: "football_50p", name: "Olympic Football 50p", subtitle: "2011", group: "commemorative", rarity: "VeryRare", value: 800 },
  { id: "beatrix_potter_50p", name: "Peter Rabbit 50p", subtitle: "2018", group: "commemorative", rarity: "Rare", value: 350 },
  { id: "brexit_50p", name: "Brexit 50p", subtitle: "2020", group: "commemorative", rarity: "Rare", value: 300 },
  { id: "wwf_50p", name: "WWF 50p", subtitle: "1994", group: "commemorative", rarity: "VeryRare", value: 1500 },

  // --- Pre-decimal classics ---
  { id: "victorian_penny", name: "Penny", subtitle: "Victoria", group: "predecimal", rarity: "Rare", value: 400 },
  { id: "victorian_farthing", name: "Farthing", subtitle: "Victoria", group: "predecimal", rarity: "Rare", value: 250 },
  { id: "edward_sixpence", name: "Sixpence", subtitle: "Edward VII", group: "predecimal", rarity: "VeryRare", value: 600 },
  { id: "george5_shilling", name: "Shilling", subtitle: "George V", group: "predecimal", rarity: "Rare", value: 350 },
  { id: "george6_florin", name: "Florin", subtitle: "George VI", group: "predecimal", rarity: "VeryRare", value: 450 },
  { id: "eliz_crown", name: "Crown", subtitle: "Elizabeth II (Pre-Decimal)", group: "predecimal", rarity: "VeryRare", value: 1000 }
];

var COINS_BY_ID = {};
COINS.forEach(function (c) { COINS_BY_ID[c.id] = c; });
