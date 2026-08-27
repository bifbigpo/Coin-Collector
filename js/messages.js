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
    trigger: function () { return hasSeenCoin("george_v_1933"); },
    body: [
      "You've turned up one of the rarest coins in British history. Only six or seven genuine 1933 pennies are known to exist anywhere in the world -- and none of them were ever meant to be spent.",
      "By 1932, banks were so overstocked with pennies that the Royal Mint stopped striking them for circulation entirely. Officially, 1933 should have no pennies at all.",
      "But tradition called for a full set of that year's coins to be sealed beneath the foundation stone of any building going up, so the Mint struck a tiny batch for that purpose only. No official record survives of exactly how many -- the Royal Mint's own museum puts the number at six or seven.",
      "One buried set didn't stay buried. In August 1970, thieves posing as workmen dug a set out from under a church foundation stone in Middleton, near Leeds. It has never resurfaced. A second set was dug up on purpose soon after and sold at Sotheby's in 1972, rather than risk the same fate.",
      "The rest live in the Royal Mint Museum, the British Museum, and a small handful of private collections. The last genuine example to sell at public auction made $165,000 in 2016 -- a record for any bronze or copper coin, British or otherwise.",
      "Whichever one this is, it's one of the great survivors of British coinage."
    ]
  }
];

var MESSAGES_BY_ID = {};
MESSAGES.forEach(function (m) { MESSAGES_BY_ID[m.id] = m; });
