// In-game letters/notices delivered to the player's inbox to explain
// mechanics or mark story beats. Each entry's `trigger(state)` is checked
// by checkMessageTriggers() (engine.js) until it returns true once, at
// which point the message is delivered and stays in the inbox forever.
// `body` is an array of paragraphs, rendered as separate lines so a letter
// can read like a letter.
//
// A personal letter carries `from` (a name, shown as "From: <name>"). A
// standalone notice -- a rare-coin dossier with no personal narrator --
// carries `kind: "discovery"` and `eyebrow` (a short label shown instead
// of "From:") so ui.js can give it a distinct, non-letter treatment.

// TEMPORARY: forces every discovery message straight to the inbox on load,
// bypassing hasSeenCoin(), so the new rare-coin dossiers can be proofread
// without grinding for each coin. Flip back to false once they're reviewed
// -- the real per-coin trigger is still there underneath, untouched.
var PROOFREAD_ALL_DISCOVERY_MESSAGES = true;

var MESSAGES = [
  {
    id: "grandfather_letter",
    from: "Grandpa Alfred",
    subject: "The Old Coin Jar",
    trigger: function () { return true; }, // delivered immediately on a new game
    body: [
      "If you're reading this, I've finally passed the jar on to you.",
      "Sixty-odd years I spent picking pennies out of change, house clearances, and the odd boot sale, hoping to string together a run of every one minted since the old Queen's day. I never quite finished it. My eyes aren't what they were, and truth be told I was never much good at telling a Fine from a Very Fine without my loupe.",
      "So it falls to you now. Everything I've collected is in the jar -- have a proper look through it, sort the wheat from the chaff, and see what you've got. Buy more where you can afford it. Some lots are cheap and common, others dear and worth the wait.",
      "Complete a full run of a single design -- get every year -- and I've left money aside for you, plus the dealers will treat you better on everything else you sell from then on. Finish the whole album, every penny from Victoria to today, and there's a proper reward waiting, the last thing I have to give you.",
      "Mind the key dates. A few years are scarcer than the rest -- you'll know them when the price makes your eyes water. Save up for them; don't rush them.",
      "Good hunting.",
      "-- Grandpa Alfred"
    ]
  },
  {
    id: "coin_george_v_1933",
    subject: "The 1933 Penny",
    // `kind: "discovery"` marks this as a standalone rare-coin dossier
    // rather than a personal letter -- ui.js renders it with an eyebrow
    // label instead of a "from", and a gold treatment matching the
    // Legendary rarity color used everywhere else in the game.
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    // Fires the moment a 1933 penny has been identified, whether or not
    // it's been kept -- hasSeenCoin() (engine.js) checks both the tray
    // and the collection.
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_v_1933"); },
    body: [
      "You've turned up one of the rarest coins in British history. Only six or seven genuine 1933 pennies are known to exist anywhere in the world -- and none of them were ever meant to be spent.",
      "By 1932, banks were so overstocked with pennies that the Royal Mint stopped striking them for circulation entirely. Officially, 1933 should have no pennies at all.",
      "But tradition called for a full set of that year's coins to be sealed beneath the foundation stone of any building going up, so the Mint struck a tiny batch for that purpose only. No official record survives of exactly how many -- the Royal Mint's own museum puts the number at six or seven.",
      "One buried set didn't stay buried. In August 1970, thieves posing as workmen dug a set out from under a church foundation stone in Middleton, near Leeds. It has never resurfaced. A second set was dug up on purpose soon after and sold at Sotheby's in 1972, rather than risk the same fate.",
      "The rest live in the Royal Mint Museum, the British Museum, and a small handful of private collections. The last genuine example to sell at public auction made $165,000 in 2016 -- a record for any bronze or copper coin, British or otherwise.",
      "Whichever one this is, it's one of the great survivors of British coinage."
    ]
  },
  {
    id: "coin_victoria_bun_1869",
    subject: "The 1869 Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("victoria_bun_1869"); },
    body: [
      "You've found the classic key date of the entire Bun Head series (1860-1894): the 1869 penny. It isn't the rarest by raw mintage, but it's one of the hardest to actually find in a collector's hand.",
      "The Royal Mint struck 2,580,480 pennies dated 1869 -- not a tiny number on paper, and not much lower than plenty of ordinary Bun Head years.",
      "What sets it apart is survival, not production. Far more 1869 pennies than usual seem to have been worn out of existence or melted down over the following century, so today it's scarcer in the hand than years that were minted in smaller numbers to begin with.",
      "It's counted among the \"big three\" Bun Head rarities, alongside the 1864 \"Crosslet 4\" and the unmarked 1882 penny (missing the Heaton mint's usual \"H\").",
      "A well-worn example can still fetch well over £100; anything approaching Extremely Fine condition climbs into four figures.",
      "Numbers on paper only tell half the story -- this one earned its reputation the hard way."
    ]
  },
  {
    id: "coin_victoria_veiled_1897",
    subject: "The 1897 High Tide Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("victoria_veiled_1897"); },
    body: [
      "You've turned up the 1897 \"High Tide\" penny -- a die variety hiding in plain sight among otherwise ordinary Veiled Head Victorian pennies.",
      "When the Veiled Head design launched in 1895, the sea sat so low behind Britannia on the reverse that even brand-new coins looked worn down to nothing. The Royal Mint fixed it by raising the waterline on the die.",
      "For most of 1897 that corrected \"Low Tide\" die was still in use -- but a separate, scarcer \"High Tide\" die also struck coins that year, with the sea sitting noticeably higher against the folds of Britannia's robe.",
      "No mint record splits how many of each die was struck. Collectors know High Tide is scarce only from decades of population counts -- there's simply no paper trail to cite a mintage figure from.",
      "The tell is subtle: on High Tide, the sea intersects a higher fold of drapery, and the upright of the \"P\" in PENNY lines up in the gap between two rim beads rather than pointing straight at one.",
      "Two dies, one year, and only one of them is worth a second look."
    ]
  },
  {
    id: "coin_edward_vii_1902",
    subject: "The 1902 Low Tide Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("edward_vii_1902"); },
    body: [
      "You've found the 1902 \"Low Tide\" penny -- the rarer of two reverse dies used in Edward VII's first year on the coinage, and, confusingly, the opposite naming problem to 1897's Victorian pennies.",
      "The die the Royal Mint started 1902 with sat the sea too low behind Britannia, exposing rocks around her feet that were never meant to show. It was corrected partway through the year to the standard \"High Tide\" design used for the rest of the reign.",
      "Total mintage for 1902 pennies ran to roughly 27 million -- but the flawed Low Tide die only struck coins for a brief window before it was pulled. Collector estimates put genuine Low Tide survivors at a small fraction of that total, well under one in twenty.",
      "Distinguishing the two is a matter of where the waterline sits against Britannia's robe: High Tide meets a higher fold near where her legs cross; Low Tide sits a fold lower, showing more rock and shelf beneath her.",
      "It's a short-lived minting mistake that the Mint quietly fixed and moved on from -- everyone else's 1902 penny is the corrected version.",
      "Yours is the one they got wrong first."
    ]
  },
  {
    id: "coin_george_v_1918h",
    subject: "The 1918H Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_v_1918h"); },
    body: [
      "You've found an 1918H penny -- struck not by the Royal Mint itself, but under contract by Ralph Heaton & Sons in Birmingham, marked with a small \"H\" to the left of the date.",
      "By 1918 the Royal Mint was buried in wartime work -- alongside ordinary coinage, it was striking huge quantities of War and Victory medals for the returning armed forces, with staff reportedly working through bank holidays to keep up.",
      "Rather than fall behind on pennies for circulation, the Mint contracted the work out to Heaton's, a long-established private Birmingham mint that had struck colonial and Commonwealth coinage for decades.",
      "Heaton-struck pennies are scarcer than the ordinary London-struck coins of the same year, though not as scarce as their King's Norton counterpart -- the other wartime contractor, whose \"KN\" mark is the harder of the two to find.",
      "The mintmark is easy to miss if you don't know to look for it: a small \"H\" tucked beside the date, rather than anywhere on the main design.",
      "A quiet reminder that even the coins in your pocket had a war to get through."
    ]
  },
  {
    id: "coin_george_v_1918kn",
    subject: "The 1918KN Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_v_1918kn"); },
    body: [
      "You've found an 1918KN penny -- struck not at the Royal Mint, but under wartime contract by the King's Norton Metal Company of Birmingham, marked with a small \"KN\" to the left of the date.",
      "King's Norton wasn't a coin-maker by trade. It was a munitions firm, credited with pioneering solid-drawn small-arms cartridge cases -- the kind of precision metalwork that made it a natural fit when the Royal Mint needed emergency help striking pennies during the First World War.",
      "The Mint's own presses were tied up with an enormous wartime order of War and Victory medals on top of ordinary coinage, so both King's Norton and the rival Heaton's Mint were brought in to keep pennies flowing in 1918 and 1919.",
      "Between the two wartime contractors, King's Norton's coins are consistently the scarcer find -- 1918KN is harder to turn up than 1918H, and its 1919 counterpart is scarcer still.",
      "Look for the small \"KN\" beside the date rather than anywhere in the main design -- it's the only clue this coin didn't come from London at all.",
      "A cartridge-case factory's one brief detour into striking pocket change."
    ]
  },
  {
    id: "coin_george_v_1919h",
    subject: "The 1919H Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_v_1919h"); },
    body: [
      "You've found a 1919H penny -- one of the second batch of wartime pennies struck under contract by Ralph Heaton & Sons of Birmingham, rather than the Royal Mint itself.",
      "The war ended in November 1918, but the coinage backlog it created didn't clear overnight. The Royal Mint kept Heaton's contract running into 1919 to keep pennies in circulation while it worked through everything else on its plate.",
      "London's own 1919 pennies were struck in huge numbers -- well over a hundred million -- which makes the comparatively small Heaton-marked run stand out clearly against it.",
      "As with the 1918 issue, Heaton's coins are the more common of the two 1919 branch-mint pennies; the King's Norton-marked \"KN\" version from the same year is the scarcer of the pair.",
      "The tell is the small \"H\" sitting to the left of the date on the reverse -- everything else about the coin looks identical to an ordinary London penny.",
      "The last year Birmingham lent the Royal Mint a hand with pennies."
    ]
  },
  {
    id: "coin_george_v_1919kn",
    subject: "The 1919KN Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_v_1919kn"); },
    body: [
      "You've found a 1919KN penny -- the scarcest of the four wartime branch-mint pennies, struck by the King's Norton Metal Company of Birmingham rather than the Royal Mint.",
      "This was King's Norton's second and final year striking pennies under wartime contract, picking up where 1918 left off while the Royal Mint cleared its own backlog of coinage and war medals.",
      "Against London's ordinary 1919 run of well over a hundred million pennies, the King's Norton contract struck only a small fraction of that -- and collectors consistently rate it as the hardest to find of all four branch-mint issues, tougher even than its 1918KN predecessor.",
      "Look for the small \"KN\" to the left of the date on the reverse -- the only difference between this coin and an ordinary 1919 penny.",
      "After 1919, the Royal Mint never needed King's Norton's help again; the company went back to full-time munitions and metalwork.",
      "The rarest signature Birmingham ever put on British pocket change."
    ]
  },
  {
    id: "coin_george_vi_1950",
    subject: "The 1950 Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_vi_1950"); },
    body: [
      "You've found a 1950 penny -- struck in one of the smallest runs of the entire George VI series, at just 240,000 coins.",
      "By 1950, Britain already had more pennies in circulation than it needed. What the Mint struck that year wasn't really meant for the home market at all -- it was destined for Commonwealth and colonial circulation instead.",
      "Even that modest run didn't all leave the country straight away. A large share sat in storage in Britain for years afterward.",
      "In 1956, the unsold stock -- plus most of the following year's mintage -- was finally shipped out, much of it to Bermuda.",
      "So a coin with \"Britain\" stamped all over it may never have been meant to jingle in a British pocket at all.",
      "Small mintage, smaller circulation -- a coin that almost skipped the country entirely."
    ]
  },
  {
    id: "coin_george_vi_1951",
    subject: "The 1951 Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_vi_1951"); },
    body: [
      "You've found a 1951 penny -- the smallest mintage of any circulating George VI penny, at just 120,000 struck.",
      "The reasoning was the same as the year before: Britain's domestic penny stock was already oversupplied, so what little the Mint struck in 1951 was intended for colonial and Commonwealth use rather than circulation at home.",
      "It turned out to be the last penny minted in George VI's reign -- he died in February the following year, before any 1952-dated pennies were struck for circulation.",
      "Much of the 1951 run sat in storage for years. In 1956, roughly three-quarters of the entire mintage was finally shipped off, mostly to Bermuda, alongside leftover 1950 stock.",
      "That means a meaningful share of the smallest George VI mintage of all may have spent its working life thousands of miles from Britain.",
      "The final word, numismatically, on an entire reign's pennies."
    ]
  },
  {
    id: "coin_george_vi_1952",
    subject: "The 1952 Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("george_vi_1952"); },
    body: [
      "You've found a 1952 penny -- and if it's genuine, you're holding one of the single rarest coins in British numismatics. Only one confirmed example is known to exist.",
      "The popular story is that production stopped because King George VI died on 6 February 1952, before that year's pennies could be struck. It's a tidy explanation, but it isn't the real one.",
      "Britain already had a large surplus of pennies left over from the 1930s and '40s. 1952 simply didn't need any more -- the death of the King was a coincidence of timing, not the cause.",
      "One proof penny dated 1952 is known to have survived. It stayed completely unknown to collectors for 45 years, only surfacing publicly at a Baldwin's auction in October 1997. In 2020 it was certified by NGC as the only confirmed example in existence, and Spink has estimated its value at around £75,000.",
      "You'll sometimes see claims of a handful of others floating around -- none of them have ever been backed by the same kind of documented provenance as the one coin everyone agrees on.",
      "If what you're holding is real, it isn't just rare. It's one of one."
    ]
  },
  {
    id: "coin_eii_predecimal_1954",
    subject: "The 1954 Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("eii_predecimal_1954"); },
    body: [
      "You've found a 1954 penny -- a date that, officially, should not exist at all in circulation.",
      "No pennies were struck for general use in 1954; Britain's stockpile from previous years was still more than enough. The Royal Mint did prepare a die for that year, striking a handful of trial pieces purely to test it -- and every one of them was meant to be destroyed afterward.",
      "One wasn't. A single 1954 penny is known to have slipped out into circulation and turned up again in the mid-1950s, eventually passing through Spink & Son and into the hands of C.W. Peck, the numismatist whose catalogue is still the standard reference for British copper and bronze coinage.",
      "Because it's so sought after, 1954 is also one of the most commonly faked pennies in the whole series -- forgers have been caught grafting an altered digit onto other years' coins to manufacture a date that was never meant to be struck.",
      "The giveaway on a fake is almost always the portrait: the wrong die pairing for the claimed date, once you know to look.",
      "A test coin that was never supposed to leave the building."
    ]
  },
  {
    id: "coin_eii_decimal_new_1972",
    subject: "The 1972 New Penny",
    kind: "discovery",
    eyebrow: "Rare Coin Discovered",
    trigger: function () { return PROOFREAD_ALL_DISCOVERY_MESSAGES || hasSeenCoin("eii_decimal_new_1972"); },
    body: [
      "You've found a 1972 \"New Penny\" -- a coin that, like 1954's old penny, was never issued for ordinary circulation.",
      "Decimalisation hit Britain in February 1971, and the changeover left banks holding more new 1p and 2p coins than anyone knew what to do with. By 1972, there was still a surplus -- so the Royal Mint simply didn't strike any more for general use that year.",
      "The only place a genuine 1972 1p exists is inside that year's official Royal Mint proof and specimen sets, struck to a higher finish and sold directly to collectors rather than banks.",
      "Around 107,807 of those sets were issued -- which means that's roughly the entire worldwide population of genuine 1972 pennies, full stop.",
      "It's a strange kind of rarity: not because the coin is old or forgotten, but because it was deliberately kept out of everyone's pocket from the day it was struck.",
      "The year decimal Britain took a breather from making pennies."
    ]
  }
];

var MESSAGES_BY_ID = {};
MESSAGES.forEach(function (m) { MESSAGES_BY_ID[m.id] = m; });
