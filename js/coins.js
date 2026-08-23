// Coin catalog: the British penny, Victoria to date.
// Every entry is a real, documented type or variety. Values are in pence
// (integers) and are ballpark real-world collector prices for a coin in
// circulated, well-worn condition -- the kind that turns up in bulk lots,
// not a graded/slabbed example. Sources: standard British numismatic
// references (Spink, the Royal Mint's own history notes) for mintages,
// design changes, and the well-known key dates.

var RARITY = {
  Common:    { label: "Common",    weightMult: 1 },
  Uncommon:  { label: "Uncommon",  weightMult: 1 },
  Rare:      { label: "Rare",      weightMult: 1 },
  VeryRare:  { label: "Very Rare", weightMult: 1 },
  Legendary: { label: "Legendary", weightMult: 1 }
};

var COIN_GROUPS = [
  { id: "victoria_bun", label: "Victoria — Bun Head (1860–1894)" },
  { id: "victoria_veiled", label: "Victoria — Veiled Head (1895–1901)" },
  { id: "edward_vii", label: "Edward VII (1902–1910)" },
  { id: "george_v", label: "George V (1911–1936)" },
  { id: "george_vi", label: "George VI (1937–1952)" },
  { id: "eii_predecimal", label: "Elizabeth II — Pre-Decimal (1953–1967)" },
  { id: "eii_decimal", label: "Elizabeth II — Decimal (1971–2022)" },
  { id: "charles_iii", label: "Charles III (2023–present)" }
];

var COINS = [
  // --- Victoria, Bun Head bronze penny (1860-1894) ---
  // The first bronze penny, replacing the old copper penny. "Bun Head" for
  // Victoria's tied-back hairstyle on the obverse.
  { id: "vic_bun_common", name: "Penny", subtitle: "Victoria, Bun Head", group: "victoria_bun", rarity: "Common", value: 250 },
  { id: "vic_bun_1869", name: "1869 Penny", subtitle: "Victoria, Bun Head — key date", group: "victoria_bun", rarity: "Rare", value: 35000 },

  // --- Victoria, Veiled/Old Head (1895-1901) ---
  { id: "vic_veil_common", name: "Penny", subtitle: "Victoria, Veiled Head", group: "victoria_veiled", rarity: "Common", value: 200 },
  // 1897 exists with two reverse varieties depending on how high the sea
  // sits behind Britannia -- "High Tide" and "Low Tide". High Tide is scarcer.
  { id: "vic_veil_1897_hightide", name: "1897 Penny", subtitle: "Victoria — \"High Tide\" variety", group: "victoria_veiled", rarity: "Uncommon", value: 1500 },

  // --- Edward VII (1902-1910) ---
  { id: "edw7_common", name: "Penny", subtitle: "Edward VII", group: "edward_vii", rarity: "Common", value: 200 },
  // The 1902 reverse briefly used a "Low Tide" design (the sea sits too
  // low, exposing rocks around Britannia's feet) before being corrected.
  { id: "edw7_1902_lowtide", name: "1902 Penny", subtitle: "Edward VII — \"Low Tide\" variety", group: "edward_vii", rarity: "Uncommon", value: 2000 },

  // --- George V (1911-1936) ---
  { id: "geo5_common", name: "Penny", subtitle: "George V", group: "george_v", rarity: "Common", value: 150 },
  // WWI forced the Royal Mint to outsource striking to private mints in
  // 1918-1919. Their coins carry a small mintmark: H (Heaton, Birmingham)
  // and KN (King's Norton Metal Co.) -- both genuinely scarce today.
  { id: "geo5_1918h", name: "1918H Penny", subtitle: "George V — Heaton Mint", group: "george_v", rarity: "Rare", value: 4500 },
  { id: "geo5_1919kn", name: "1919KN Penny", subtitle: "George V — King's Norton Mint", group: "george_v", rarity: "VeryRare", value: 9000 },
  // The single most famous British coin rarity: only 7 were struck in
  // 1933, none for circulation (a foundation-stone ceremony took one).
  // Auction records run well into six figures.
  { id: "geo5_1933", name: "1933 Penny", subtitle: "George V — only 7 ever struck", group: "george_v", rarity: "Legendary", value: 12000000 },

  // --- George VI (1937-1952) ---
  { id: "geo6_common", name: "Penny", subtitle: "George VI", group: "george_vi", rarity: "Common", value: 80 },
  // 1950 and 1951 had tiny mintages (240,000 and 120,000), struck mostly
  // for colonial circulation rather than the home market.
  { id: "geo6_1950", name: "1950 Penny", subtitle: "George VI — low mintage", group: "george_vi", rarity: "Rare", value: 3500 },
  { id: "geo6_1951", name: "1951 Penny", subtitle: "George VI — low mintage", group: "george_vi", rarity: "VeryRare", value: 5500 },
  // George VI died in Feb 1952 before any 1952-dated pennies entered
  // production; only a handful of pattern/proof pieces are known to exist.
  { id: "geo6_1952", name: "1952 Penny", subtitle: "George VI — essentially unique", group: "george_vi", rarity: "Legendary", value: 8000000 },

  // --- Elizabeth II, pre-decimal (1953-1967; none struck 1968-1970) ---
  { id: "eii_pre_common", name: "Penny", subtitle: "Elizabeth II, pre-decimal", group: "eii_predecimal", rarity: "Common", value: 50 },
  // No pennies were struck for UK circulation in 1954 -- genuine
  // specimens are exceptionally rare and hotly disputed when they surface.
  { id: "eii_pre_1954", name: "1954 Penny", subtitle: "Elizabeth II — no official issue", group: "eii_predecimal", rarity: "Legendary", value: 2500000 },

  // --- Elizabeth II, decimal (1971-2022) ---
  // Decimalisation Day, 15 Feb 1971. Early coins are inscribed "NEW PENNY";
  // from 1982 the wording changed to "ONE PENNY". The alloy also changed
  // in 1992 from bronze to copper-plated steel (a magnet sticks to these).
  { id: "eii_dec_new_penny", name: "New Penny", subtitle: "Elizabeth II, 1971–1981", group: "eii_decimal", rarity: "Common", value: 3 },
  { id: "eii_dec_one_penny_bronze", name: "One Penny", subtitle: "Elizabeth II, 1982–1991 (bronze)", group: "eii_decimal", rarity: "Common", value: 2 },
  { id: "eii_dec_one_penny_steel", name: "One Penny", subtitle: "Elizabeth II, 1992–2022 (copper-plated steel)", group: "eii_decimal", rarity: "Common", value: 1 },

  // --- Charles III (2023-present) ---
  { id: "ciii_penny", name: "One Penny", subtitle: "Charles III", group: "charles_iii", rarity: "Uncommon", value: 5 }
];

var COINS_BY_ID = {};
COINS.forEach(function (c) { COINS_BY_ID[c.id] = c; });
