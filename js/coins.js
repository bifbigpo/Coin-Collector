// Coin catalog: the British penny, Victoria to date, generated year-by-year
// from a small set of type definitions so "collect every year" is possible
// without hand-listing every entry. Every type/date range and the key dates
// called out below are real, documented facts (Spink and the Royal Mint's
// own history notes). Values are in pence, for a coin in typical circulated
// condition -- the baseline before grading is applied (see engine.js).

var RARITY = {
  Common:    { label: "Common",    weightMult: 1 },
  Uncommon:  { label: "Uncommon",  weightMult: 1 },
  Rare:      { label: "Rare",      weightMult: 1 },
  VeryRare:  { label: "Very Rare", weightMult: 1 },
  Legendary: { label: "Legendary", weightMult: 1 }
};

// One-off bonus paid the first time a type's full run is collected (see
// checkCollectionBonuses in engine.js). Flat per type rather than derived
// from coin values, and scaled to how rare the *type itself* is -- ranked
// by commonValue, an ordinary year's baseline worth -- so a jackpot key
// date landing in an otherwise-common run (New Penny, George V) doesn't
// inflate the payout. Anchored at the "New Penny" run (commonValue 3) as
// the £10 base, running down to £1 for the most common run (steel,
// commonValue 1) and up to £200 for the rarest (Bun Head, commonValue 250);
// types with equal commonValue (Veiled Head / Edward VII) share a tier.
var PENNY_TYPES = [
  {
    id: "victoria_bun",
    label: "Victoria — Bun Head (1860–1894)",
    subtitle: "Victoria, Bun Head",
    yearStart: 1860,
    yearEnd: 1894,
    commonValue: 250,
    firstCompleteBonus: 20000, // £200 -- rarest run
    keyDates: {
      // The classic Bun Head key date -- not the lowest mintage of the run
      // (2,580,480 struck) but the scarcest in survivors, having worn out
      // of circulation and been melted down disproportionately more than
      // other years of the series.
      1869: { rarity: "Rare", value: 35000, note: "key date — scarcest survivor of the type" }
    }
  },
  {
    id: "victoria_veiled",
    label: "Victoria — Veiled Head (1895–1901)",
    subtitle: "Victoria, Veiled Head",
    yearStart: 1895,
    yearEnd: 1901,
    commonValue: 200,
    firstCompleteBonus: 15000, // £150
    keyDates: {
      // 1897 exists with two reverse dies depending on how high the sea
      // sits behind Britannia. "High Tide" is the scarcer of the two.
      1897: { rarity: "Uncommon", value: 1500, name: "1897 Penny", note: "\"High Tide\" variety" }
    }
  },
  {
    id: "edward_vii",
    label: "Edward VII (1902–1910)",
    subtitle: "Edward VII",
    yearStart: 1902,
    yearEnd: 1910,
    commonValue: 200,
    firstCompleteBonus: 15000, // £150 -- tied with Veiled Head at the same commonValue
    keyDates: {
      // The first 1902 reverse dies sat the sea too low, exposing rocks
      // around Britannia's feet, before being corrected later that year.
      1902: { rarity: "Uncommon", value: 2000, name: "1902 Penny", note: "\"Low Tide\" variety" }
    }
  },
  {
    id: "george_v",
    label: "George V (1911–1936)",
    subtitle: "George V",
    yearStart: 1911,
    yearEnd: 1936,
    commonValue: 150,
    firstCompleteBonus: 10000, // £100
    keyDates: {
      // The single most famous British coin rarity: only 7 were struck,
      // none for circulation. Auction records run well into six figures.
      1933: { rarity: "Legendary", value: 12000000, note: "only 7 ever struck" }
    },
    // WWI forced the Royal Mint to outsource striking in 1918-1919. Coins
    // from the two private mints carry a small mintmark and are genuinely
    // scarce today -- distinct extra collectibles alongside the ordinary
    // London-mint 1918 and 1919 pennies.
    extraCoins: [
      { id: "george_v_1918h", year: 1918, name: "1918H Penny", subtitle: "George V — Heaton Mint", rarity: "Rare", value: 4500 },
      { id: "george_v_1918kn", year: 1918, name: "1918KN Penny", subtitle: "George V — King's Norton Mint", rarity: "VeryRare", value: 9000 },
      { id: "george_v_1919h", year: 1919, name: "1919H Penny", subtitle: "George V — Heaton Mint", rarity: "Rare", value: 3500 },
      { id: "george_v_1919kn", year: 1919, name: "1919KN Penny", subtitle: "George V — King's Norton Mint", rarity: "VeryRare", value: 8500 }
    ]
  },
  {
    id: "george_vi",
    label: "George VI (1937–1952)",
    subtitle: "George VI",
    yearStart: 1937,
    yearEnd: 1952,
    commonValue: 80,
    firstCompleteBonus: 6000, // £60
    keyDates: {
      // 1950 and 1951 had tiny mintages (240,000 and 120,000), struck
      // mostly for colonial circulation rather than the home market.
      1950: { rarity: "Rare", value: 3500, note: "low mintage" },
      1951: { rarity: "VeryRare", value: 5500, note: "low mintage" },
      // Popular belief blames George VI's death in Feb 1952, but the real
      // reason is a leftover surplus from the 1930s-40s that meant no more
      // pennies were needed that year -- the King's death was a coincidence
      // of timing, not the cause. Exactly one genuine 1952 proof penny is
      // confirmed to exist (NGC-certified), unknown to collectors until it
      // surfaced at auction in 1997.
      1952: { rarity: "Legendary", value: 8000000, note: "essentially unique" }
    }
  },
  {
    id: "eii_predecimal",
    label: "Elizabeth II — Pre-Decimal (1953–1967)",
    subtitle: "Elizabeth II, pre-decimal",
    yearStart: 1953,
    yearEnd: 1967, // no pennies struck for circulation 1968-1970, ahead of decimalisation
    commonValue: 50,
    firstCompleteBonus: 3500, // £35
    keyDates: {
      // No pennies were struck for UK circulation in 1954 -- genuine
      // specimens are exceptionally rare and hotly disputed when they surface.
      1954: { rarity: "Legendary", value: 2500000, note: "no official issue" }
    }
  },
  {
    id: "eii_decimal_new",
    label: "Elizabeth II — \"New Penny\" (1971–1981)",
    subtitle: "Elizabeth II, New Penny",
    coinName: "New Penny",
    yearStart: 1971, // Decimalisation Day, 15 Feb 1971
    yearEnd: 1981,
    commonValue: 3,
    firstCompleteBonus: 1000, // £10 -- base bonus this scale is anchored to
    keyDates: {
      // No 1p or 2p coins were struck for general circulation in 1972 --
      // there was still a surplus from the 1971 changeover. They only
      // appeared in that year's specimen/proof sets.
      1972: { rarity: "Rare", value: 1000, name: "1972 New Penny", note: "not issued for general circulation" }
    }
  },
  {
    id: "eii_decimal_bronze",
    label: "Elizabeth II — One Penny, Bronze (1982–1991)",
    subtitle: "Elizabeth II, One Penny (bronze)",
    coinName: "One Penny",
    yearStart: 1982, // wording changed from "NEW PENNY" to "ONE PENNY"
    yearEnd: 1991,
    commonValue: 2,
    firstCompleteBonus: 300 // £3
  },
  {
    id: "eii_decimal_steel",
    label: "Elizabeth II — One Penny, Copper-Plated Steel (1992–2022)",
    subtitle: "Elizabeth II, One Penny (copper-plated steel)",
    coinName: "One Penny",
    yearStart: 1992, // alloy switched from bronze to copper-plated steel -- a magnet sticks to these
    yearEnd: 2022,
    commonValue: 1,
    firstCompleteBonus: 100 // £1 -- most common run
  },
  {
    id: "charles_iii",
    label: "Charles III (2023–present)",
    subtitle: "Charles III",
    coinName: "One Penny",
    yearStart: 2023,
    yearEnd: 2025, // extend as later dates are confirmed
    commonValue: 5,
    firstCompleteBonus: 1500 // £15
  }
];

var COINS = [];
PENNY_TYPES.forEach(function (type) {
  for (var y = type.yearStart; y <= type.yearEnd; y++) {
    var kd = type.keyDates && type.keyDates[y];
    COINS.push({
      id: type.id + "_" + y,
      year: y,
      name: (kd && kd.name) ? kd.name : (y + " " + (type.coinName || "Penny")),
      subtitle: (kd && kd.note) ? type.subtitle + " — " + kd.note : type.subtitle,
      group: type.id,
      rarity: kd ? kd.rarity : "Common",
      value: kd ? kd.value : type.commonValue
    });
  }
  if (type.extraCoins) {
    type.extraCoins.forEach(function (ec) {
      COINS.push({
        id: ec.id,
        year: ec.year,
        name: ec.name,
        subtitle: ec.subtitle,
        group: type.id,
        rarity: ec.rarity,
        value: ec.value
      });
    });
  }
});

var COINS_BY_ID = {};
COINS.forEach(function (c) { COINS_BY_ID[c.id] = c; });

var COIN_GROUPS = PENNY_TYPES.map(function (t) {
  return { id: t.id, label: t.label, firstCompleteBonus: t.firstCompleteBonus };
});
