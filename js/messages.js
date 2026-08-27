// In-game letters/notices delivered to the player's inbox to explain
// mechanics or mark story beats. Each entry's `trigger(state)` is checked
// by checkMessageTriggers() (engine.js) until it returns true once, at
// which point the message is delivered and stays in the inbox forever.
// `body` is an array of paragraphs, rendered as separate lines so a letter
// can read like a letter.
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
  }
];

var MESSAGES_BY_ID = {};
MESSAGES.forEach(function (m) { MESSAGES_BY_ID[m.id] = m; });
