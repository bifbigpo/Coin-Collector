// Coin catalog: British coins by denomination -- the penny, Victoria to
// date, and the farthing, 1860 to its last issue in 1956 -- generated
// year-by-year from a small set of type definitions so "collect every
// year" is possible without hand-listing every entry. Every type/date range and the key dates
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
// Each denomination is its own album: its own types, lots, set bonuses and
// a one-off album bonus for completing every coin in it. A denomination
// with `unlockUpgrade` stays hidden (no lots, no album page) until that
// upgrade is bought -- see isDenomUnlocked() in engine.js. Adding a new
// denomination means adding an entry here, a <DENOM>_TYPES list tagged in
// COIN_TYPES below, its lots in lots.js and its unlock in upgrades.js.
var DENOMINATIONS = [
  {
    id: "penny",
    label: "Pennies",
    coinName: "Penny",
    albumBonus: 100000, // £1000, plus the +15% sale bonus in sellMultiplier()
    unlockUpgrade: null
  },
  {
    id: "farthing",
    label: "Farthings",
    coinName: "Farthing",
    albumBonus: 25000, // £250
    unlockUpgrade: "farthing_album"
  }
];
var DENOMINATIONS_BY_ID = {};
DENOMINATIONS.forEach(function (d) { DENOMINATIONS_BY_ID[d.id] = d; });

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

// The bronze farthing, a quarter of a penny, from the 1860 switch to bronze
// (matching where the penny run starts) to the last issue in 1956; it was
// demonetised at the end of 1960. Far fewer key dates than the penny --
// predecimal.com's key-date list names only 1863 and the 1895 Bun Head
// among bronze farthings, plus the never-issued 1937 Edward VIII pattern
// -- so it plays as a quicker, gentler second album. Ordinary-year values
// are game estimates scaled below the matching penny types; `artGroup`
// borrows the same monarch's penny portrait in pixelcoin.js. Set bonuses
// follow the same commonValue-ranked idea as the pennies, but kept well
// below them: with so few key dates, every common farthing set fills in
// minutes (tools/simulate-collection-time.js --denom=farthing puts the
// whole album, bar the Edward VIII pattern, at ~8 minutes of identifying).
var FARTHING_TYPES = [
  {
    id: "farthing_victoria_bun",
    artGroup: "victoria_bun",
    label: "Victoria — Bun Head Farthing (1860–1895)",
    subtitle: "Victoria, Bun Head",
    yearStart: 1860,
    // The Bun Head was still struck in 1895 alongside the new Veiled Head,
    // so 1895 appears in both runs as two different coins.
    yearEnd: 1895,
    commonValue: 150,
    firstCompleteBonus: 3000, // £30
    keyDates: {
      1863: { rarity: "Rare", value: 4000, name: "1863 Farthing", note: "key date" },
      1895: { rarity: "Rare", value: 2500, name: "1895 Bun Head Farthing", note: "last year of the Bun Head" }
    }
  },
  {
    id: "farthing_victoria_veiled",
    artGroup: "victoria_veiled",
    label: "Victoria — Veiled Head Farthing (1895–1901)",
    subtitle: "Victoria, Veiled Head",
    yearStart: 1895,
    yearEnd: 1901,
    commonValue: 100,
    firstCompleteBonus: 2000 // £20
  },
  {
    id: "farthing_edward_vii",
    artGroup: "edward_vii",
    label: "Edward VII Farthing (1902–1910)",
    subtitle: "Edward VII",
    yearStart: 1902,
    yearEnd: 1910,
    commonValue: 80,
    firstCompleteBonus: 1500 // £15
  },
  {
    id: "farthing_george_v",
    artGroup: "george_v",
    label: "George V Farthing (1911–1936)",
    subtitle: "George V",
    yearStart: 1911,
    yearEnd: 1936, // the last Britannia reverse
    commonValue: 40,
    firstCompleteBonus: 1000 // £10
  },
  {
    // A single never-issued coin: the wren reverse was designed for
    // Edward VIII, but he abdicated before any of his coinage was
    // released, so his farthing exists only as an excessively rare pattern.
    id: "farthing_edward_viii",
    label: "Edward VIII Pattern Farthing (1937)",
    subtitle: "Edward VIII",
    yearStart: 1937,
    yearEnd: 1937,
    commonValue: 40,
    firstCompleteBonus: 5000, // £50 -- a one-coin set, but that coin is Legendary
    keyDates: {
      1937: { rarity: "Legendary", value: 1500000, name: "1937 Edward VIII Farthing", note: "pattern, never issued" }
    }
  },
  {
    id: "farthing_george_vi",
    artGroup: "george_vi",
    label: "George VI Farthing (1937–1952)",
    subtitle: "George VI, wren reverse",
    yearStart: 1937, // the wren replaces Britannia on the reverse
    yearEnd: 1952,
    commonValue: 25,
    firstCompleteBonus: 500 // £5
  },
  {
    id: "farthing_eii",
    artGroup: "eii_predecimal",
    label: "Elizabeth II Farthing (1953–1956)",
    subtitle: "Elizabeth II, wren reverse",
    yearStart: 1953,
    yearEnd: 1956, // the last farthing ever struck
    commonValue: 20,
    firstCompleteBonus: 200 // £2 -- shortest, most common run
  }
];

// Every type, tagged with its denomination. Coin ids are just type id +
// year, so farthing type ids carry a "farthing_" prefix to stay distinct
// from the penny type of the same monarch (and penny ids never change,
// which keeps old saves valid).
function tagTypes(types, denomId) {
  types.forEach(function (t) { t.denom = denomId; });
  return types;
}
var COIN_TYPES = tagTypes(PENNY_TYPES, "penny").concat(tagTypes(FARTHING_TYPES, "farthing"));

var COINS = [];
COIN_TYPES.forEach(function (type) {
  var denomCoinName = DENOMINATIONS_BY_ID[type.denom].coinName;
  for (var y = type.yearStart; y <= type.yearEnd; y++) {
    var kd = type.keyDates && type.keyDates[y];
    COINS.push({
      id: type.id + "_" + y,
      year: y,
      name: (kd && kd.name) ? kd.name : (y + " " + (type.coinName || denomCoinName)),
      subtitle: (kd && kd.note) ? type.subtitle + " — " + kd.note : type.subtitle,
      group: type.id,
      artGroup: type.artGroup || type.id,
      denom: type.denom,
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
        artGroup: type.artGroup || type.id,
        denom: type.denom,
        rarity: ec.rarity,
        value: ec.value
      });
    });
  }
});

var COINS_BY_ID = {};
COINS.forEach(function (c) { COINS_BY_ID[c.id] = c; });

var COIN_GROUPS = COIN_TYPES.map(function (t) {
  return { id: t.id, label: t.label, denom: t.denom, firstCompleteBonus: t.firstCompleteBonus };
});

function coinsInDenom(denomId) {
  return COINS.filter(function (c) { return c.denom === denomId; });
}

function groupsInDenom(denomId) {
  return COIN_GROUPS.filter(function (g) { return g.denom === denomId; });
}
