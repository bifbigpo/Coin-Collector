var MAX_TRAY = 250;
var TICK_MS = 300;
var BASE_IDENTIFY_MS = 1000;
var BASE_GRADE_DURATION_MS = 5000;
var MIN_GRADE_DURATION_MS = 1000;
var BASE_GRADING_TRAY_CAPACITY = 5;

// Standard numismatic grading scale, roughest to finest. Each tier gets a
// rainbow color, red (Poor) through violet (Mint), for the grade labels.
var GRADES = [
  { id: "poor", label: "Poor", mult: 0.2, weight: 22, colorClass: "grade-poor" },
  { id: "fair", label: "Fair", mult: 0.3, weight: 18, colorClass: "grade-fair" },
  { id: "good", label: "Good", mult: 0.4, weight: 16, colorClass: "grade-good" },
  { id: "vgood", label: "Very Good", mult: 0.55, weight: 14, colorClass: "grade-vgood" },
  { id: "fine", label: "Fine", mult: 0.75, weight: 12, colorClass: "grade-fine" },
  { id: "vfine", label: "Very Fine", mult: 1.0, weight: 9, colorClass: "grade-vfine" },
  { id: "efine", label: "Extremely Fine", mult: 1.5, weight: 5, colorClass: "grade-efine" },
  { id: "unc", label: "Uncirculated", mult: 2.2, weight: 3, colorClass: "grade-unc" },
  { id: "mint", label: "Mint", mult: 3.5, weight: 1, colorClass: "grade-mint" }
];
var GRADES_BY_ID = {};
GRADES.forEach(function (g) { GRADES_BY_ID[g.id] = g; });
var GRADE_INDEX = {};
GRADES.forEach(function (g, i) { GRADE_INDEX[g.id] = i; });

// The player's grading skill, learned by grading coins themselves and by
// buying reference books -- not bought outright. At skill 0 a coin's true
// grade could be anywhere in a window of 3 tiers either side, and only
// Poor coins are obvious enough to skip grading entirely. Each tier of
// experience narrows that window and adds one more grade, from the bottom
// up, that's obvious at a glance -- so less and less needs a manual check.
var SKILL_TIERS = [
  { xp: 0, radius: 3, autoSpotCount: 1 },
  { xp: 25, radius: 2, autoSpotCount: 2 },
  { xp: 75, radius: 1, autoSpotCount: 3 },
  { xp: 200, radius: 0, autoSpotCount: 4 }
];
var XP_PER_MANUAL_GRADE = 1;

function gradingSkillLevel() {
  var xp = state.gradingXp || 0;
  var level = 0;
  for (var i = 0; i < SKILL_TIERS.length; i++) {
    if (xp >= SKILL_TIERS[i].xp) level = i;
  }
  return level;
}

function gradingPrecisionRadius() {
  return SKILL_TIERS[gradingSkillLevel()].radius;
}

function autoSpotCount() {
  return SKILL_TIERS[gradingSkillLevel()].autoSpotCount;
}

// Grades obvious enough, at the player's current skill, to need no formal
// grading at all -- always re-evaluated live against current skill.
function isAutoSpotted(entry) {
  return GRADE_INDEX[entry.trueGrade] < autoSpotCount();
}

// A coin is "graded" -- known well enough to keep or replace with -- once
// it's either been examined by hand or is obviously within a grade band
// the player can now recognise on sight.
function isCoinGraded(entry) {
  return entry.graded || isAutoSpotted(entry);
}

function getLevel(upgradeId) {
  var v = state.upgradeLevels[upgradeId];
  return typeof v === "number" ? v : 0;
}

function isOwned(upgradeId) {
  return !!state.upgradeLevels[upgradeId];
}

function formatMoney(pence) {
  var pounds = pence / 100;
  return "£" + pounds.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lotCost(lot) {
  return lot.baseCost;
}

function lotCoinCount(lot) {
  return lot.coinsPerLot;
}

function claimedGroupCount() {
  return Object.keys(state.groupBonusesClaimed).length;
}

function sellMultiplier() {
  // Selling one coin at a time to a dealer only ever gets you a cut of what
  // it's really worth -- 60% with no upgrades, 85% with Fair Market
  // Appraisal, and the full retail value once Master Appraiser is bought.
  var appraiserFraction = 0.6;
  if (isOwned("master_appraiser")) appraiserFraction = 1.0;
  else if (isOwned("fair_market_appraisal")) appraiserFraction = 0.85;
  var groupMult = 1 + 0.05 * claimedGroupCount();
  var fullMult = state.fullCollectionBonusClaimed ? 1.15 : 1;
  return appraiserFraction * groupMult * fullMult;
}

function rollGrade(allowedGradeIds) {
  var pool = allowedGradeIds
    ? GRADES.filter(function (g) { return allowedGradeIds.indexOf(g.id) !== -1; })
    : GRADES;
  var total = pool.reduce(function (s, g) { return s + g.weight; }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < pool.length; i++) {
    r -= pool[i].weight;
    if (r <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

// The window of grades a coin could plausibly be, given the player's
// current grading skill -- recomputed live, so leveling up skill
// immediately sharpens the estimate for coins already sitting in the tray.
function estimateRange(entry) {
  var radius = gradingPrecisionRadius();
  var idx = GRADE_INDEX[entry.trueGrade];
  return {
    idx: idx,
    lo: Math.max(0, idx - radius),
    hi: Math.min(GRADES.length - 1, idx + radius)
  };
}

// Until a coin is graded, price it at the bottom of its estimated range --
// a cautious default rather than assuming the best.
function entryGradeMult(entry) {
  if (isCoinGraded(entry)) return GRADES_BY_ID[entry.trueGrade].mult;
  return GRADES[estimateRange(entry).lo].mult;
}

// The "suggested value" -- what the coin is really worth at its (assumed
// or true) grade, before the dealer's cut for selling it one at a time.
function coinSuggestedValue(entry) {
  var coin = COINS_BY_ID[entry.coinId];
  return Math.round(coin.value * entryGradeMult(entry));
}

function coinSellValue(entry) {
  return Math.max(1, Math.round(coinSuggestedValue(entry) * sellMultiplier()));
}

// What the player sees for a coin's condition: the exact grade once
// graded (manually, or obvious at a glance at the player's skill),
// otherwise the skill-based estimate window.
function gradeDisplayLabel(entry) {
  if (isCoinGraded(entry)) return GRADES_BY_ID[entry.trueGrade].label;
  var range = estimateRange(entry);
  if (range.lo === range.hi) return GRADES[range.idx].label;
  return GRADES[range.lo].label + " – " + GRADES[range.hi].label;
}

function gradeSpan(grade) {
  return '<span class="' + grade.colorClass + '">' + grade.label + '</span>';
}

// Same as gradeDisplayLabel, but with each grade word colored along a
// red-to-violet scale (Poor red, Mint violet) for the tray display.
function gradeDisplayHTML(entry) {
  if (isCoinGraded(entry)) return gradeSpan(GRADES_BY_ID[entry.trueGrade]);
  var range = estimateRange(entry);
  if (range.lo === range.hi) return gradeSpan(GRADES[range.idx]);
  return gradeSpan(GRADES[range.lo]) + " – " + gradeSpan(GRADES[range.hi]);
}

function gradingTrayCapacity() {
  return BASE_GRADING_TRAY_CAPACITY + getLevel("grade_tray_size");
}

// Decay rate chosen so the top Practiced Hands level (8) lands exactly on
// the 1-second floor: BASE_GRADE_DURATION_MS * 0.8178^8 rounds to 1000ms.
var GRADE_SPEED_DECAY = 0.8178;

function gradeDurationMs() {
  var level = getLevel("grade_speed");
  var duration = BASE_GRADE_DURATION_MS * Math.pow(GRADE_SPEED_DECAY, level);
  return Math.max(MIN_GRADE_DURATION_MS, Math.round(duration));
}

// How many of the grade tray's slots are currently taken -- by a coin
// still being graded, or one that's already graded and sitting there
// waiting for the player to keep or sell it. Either way, the slot's held.
function gradingTrayOccupiedCount() {
  return state.tray.filter(function (e) { return e.inGradeTray; }).length;
}

function gradingTraySpaceRemaining() {
  return gradingTrayCapacity() - gradingTrayOccupiedCount();
}

function selectedForGradingCount() {
  return state.tray.filter(function (e) { return e.selected; }).length;
}

// Ticking a coin's checkbox in the inspection tray only marks it selected
// -- it doesn't move yet. Selection is capped at however many grade tray
// slots are actually free right now.
function toggleSelectForGrading(uid) {
  var entry = findTrayEntry(uid);
  if (!entry || !entry.identified || isCoinGraded(entry) || entry.inGradeTray) return;
  if (entry.selected) {
    entry.selected = false;
  } else {
    if (selectedForGradingCount() >= gradingTraySpaceRemaining()) return;
    entry.selected = true;
  }
  saveState();
}

// Moves every selected coin into the grade tray at once, filling its
// slots -- but the tray only grades one coin at a time. The rest sit
// queued in their slot until it's their turn.
function sendSelectedToGrading() {
  var space = gradingTraySpaceRemaining();
  var moved = false;
  state.tray.forEach(function (e) {
    if (!e.selected) return;
    if (space > 0) {
      e.inGradeTray = true;
      space--;
      moved = true;
    }
    e.selected = false;
  });
  if (moved) startNextGrading();
  if (moved) saveState();
  return moved;
}

// If nothing is actively being graded, starts the next queued coin (the
// one that's been sitting in the grade tray longest). Grading then takes
// gradeDurationMs(), no further clicks required.
function startNextGrading() {
  if (state.tray.some(function (e) { return e.grading; })) return false;
  var next = state.tray.find(function (e) { return e.inGradeTray && !e.grading && !e.graded; });
  if (!next) return false;
  next.grading = true;
  next.gradeTotalMs = gradeDurationMs();
  next.gradeRemainingMs = next.gradeTotalMs;
  return true;
}

// Pulls a coin out of the grade tray before it's graded -- whether it's
// the one actively counting down or still queued behind it -- freeing its
// slot and returning it to the inspection tray to be selected again
// later. Coins that have already finished grading aren't cancelled this
// way; they're resolved with Keep/Replace/Sell instead.
function cancelGrading(uid) {
  var entry = findTrayEntry(uid);
  if (!entry || !entry.inGradeTray || entry.graded) return;
  var wasActive = entry.grading;
  entry.grading = false;
  entry.inGradeTray = false;
  entry.gradeRemainingMs = 0;
  if (wasActive) startNextGrading();
  saveState();
}

// Advances whichever coin is actively being graded, then starts the next
// queued one the moment a slot frees up. Finished coins stay put in the
// grade tray -- graded, but still occupying their slot -- until the
// player keeps, replaces, or sells them.
function processGradingTray() {
  var didWork = false;
  var active = state.tray.filter(function (e) { return e.grading; })[0];
  if (active) {
    active.gradeRemainingMs -= TICK_MS;
    didWork = true;
    if (active.gradeRemainingMs <= 0) {
      active.grading = false;
      active.graded = true;
      state.gradingXp = (state.gradingXp || 0) + XP_PER_MANUAL_GRADE;
      state.stats.coinsGraded++;
    }
  }
  if (startNextGrading()) didWork = true;
  return didWork;
}

function weightedPick(pool) {
  var entries = Object.keys(pool);
  var total = entries.reduce(function (s, id) { return s + pool[id]; }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < entries.length; i++) {
    r -= pool[entries[i]];
    if (r <= 0) return entries[i];
  }
  return entries[entries.length - 1];
}

function lotCooldownRemaining(lotId) {
  return Math.max(0, state.lotCooldowns[lotId] || 0);
}

function buyLot(lotId) {
  var lot = LOTS_BY_ID[lotId];
  if (!lot) return false;
  if (lot.cooldownMs && lotCooldownRemaining(lotId) > 0) return false;
  var cost = lotCost(lot);
  var count = lotCoinCount(lot);
  if (state.cash < cost) return false;
  if (state.tray.length + count > MAX_TRAY) return false;

  var pool = buildLotPool(lot);
  // A lot's guaranteed count is always drawn from the rarity-filtered
  // sub-pool first, so pricier lots deliver a more curated, less random
  // outcome instead of just more coins. Falls back to the normal pool if
  // that count ever shrinks below the guaranteed floor.
  var guaranteedCount = 0;
  var guaranteedPool = null;
  if (lot.guaranteed) {
    guaranteedPool = buildLotPool(lot, lot.guaranteed.minRarity, lot.guaranteed.groups);
    guaranteedCount = Math.min(lot.guaranteed.count, count);
  }
  state.cash -= cost;
  for (var i = 0; i < count; i++) {
    var useGuaranteed = i < guaranteedCount && guaranteedPool && Object.keys(guaranteedPool).length;
    var coinId = weightedPick(useGuaranteed ? guaranteedPool : pool);
    state.tray.push({
      uid: state.nextUid++,
      coinId: coinId,
      identified: false,
      identifying: false,
      remainingMs: 0,
      totalMs: 0,
      selected: false,
      inGradeTray: false,
      grading: false,
      gradeRemainingMs: 0,
      graded: false,
      trueGrade: null,
      gradeCap: gradeCapForIndex(lot, i)
    });
  }
  state.stats.lotsBought++;
  if (lot.cooldownMs) state.lotCooldowns[lotId] = lot.cooldownMs;
  saveState();
  return true;
}

// Identified coins sort highest suggested value first; not-yet-identified
// coins have no visible value, so they sink to the bottom.
function trayValueSortKey(entry) {
  return entry.identified ? coinSuggestedValue(entry) : -1;
}

// Ranked by grade -- graded coins by their true grade, ungraded-but-
// identified coins by the bottom of their estimate (same cautious default
// used for pricing), unidentified coins sink to the bottom.
function trayGradeSortKey(entry) {
  if (!entry.identified) return -1;
  if (isCoinGraded(entry)) return GRADE_INDEX[entry.trueGrade];
  return estimateRange(entry).lo;
}

// Tiebreaker for trayGradeSortKey: the top of the estimate. At low grading
// skill the estimate radius is wide enough that most coins' bottom bound
// clamps to the same floor (Poor), so sorting on the floor alone barely
// moves anything -- breaking ties on the ceiling still favors coins that
// could plausibly grade higher.
function trayGradeSortKeyHi(entry) {
  if (!entry.identified) return -1;
  if (isCoinGraded(entry)) return GRADE_INDEX[entry.trueGrade];
  return estimateRange(entry).hi;
}

// Coins still needed for the collection sort above duplicates; unidentified
// coins sink to the bottom same as the other modes.
function trayNeededSortKey(entry) {
  if (!entry.identified) return -1;
  return state.collection[entry.coinId] ? 0 : 1;
}

// The tray's sort modes: each is one or more key functions, most important
// first -- entries are ranked by the first, ties broken by the next, and so
// on. Selecting a mode from the toolbar re-sorts once and remembers the
// choice (see sortTrayByMode) so its button stays highlighted.
var TRAY_SORT_MODES = {
  value:  { label: "Value",  keyFns: [trayValueSortKey] },
  grade:  { label: "Grade",  keyFns: [trayGradeSortKey, trayGradeSortKeyHi] },
  needed: { label: "Needed", keyFns: [trayNeededSortKey, trayValueSortKey] }
};

// Builds a descending comparator from key functions applied in order --
// ties on one are broken by the next.
function byKeysDesc(keyFns) {
  return function (a, b) {
    for (var i = 0; i < keyFns.length; i++) {
      var diff = keyFns[i](b) - keyFns[i](a);
      if (diff !== 0) return diff;
    }
    return 0;
  };
}

// Reorders only the coins still sitting in the inspection tray (never the
// ones already committed to the grade tray -- reordering those would change
// which one grades next), highest key first. A one-off snapshot sort, not a
// live-maintained order: it doesn't move again until sorted once more.
function sortTray(compareFn) {
  var indices = [];
  var movable = [];
  state.tray.forEach(function (e, i) {
    if (!e.inGradeTray) {
      indices.push(i);
      movable.push(e);
    }
  });
  movable.sort(compareFn);
  indices.forEach(function (idx, i) { state.tray[idx] = movable[i]; });
}

function sortTrayByMode(mode) {
  var def = TRAY_SORT_MODES[mode];
  if (!def) return;
  sortTray(byKeysDesc(def.keyFns));
  state.traySortMode = mode;
  saveState();
}

// The appraised value of everything currently banked for one penny type --
// what the album is "worth", not what a dealer would pay for it.
function collectionValueForGroup(groupId) {
  return COINS.filter(function (c) { return c.group === groupId && state.collection[c.id]; })
    .reduce(function (sum, c) {
      var owned = state.collection[c.id];
      return sum + coinSuggestedValue({ coinId: c.id, trueGrade: owned.trueGrade, graded: owned.graded });
    }, 0);
}

function totalCollectionValue() {
  return COIN_GROUPS.reduce(function (sum, g) { return sum + collectionValueForGroup(g.id); }, 0);
}

function findTrayEntry(uid) {
  for (var i = 0; i < state.tray.length; i++) {
    if (state.tray[i].uid === uid) return state.tray[i];
  }
  return null;
}

function removeTrayEntry(uid) {
  state.tray = state.tray.filter(function (e) { return e.uid !== uid; });
}

function keepCoin(uid) {
  var entry = findTrayEntry(uid);
  if (!entry || !entry.identified || !isCoinGraded(entry)) return;
  if (!state.collection[entry.coinId]) {
    state.collection[entry.coinId] = { trueGrade: entry.trueGrade, graded: entry.graded };
    state.stats.coinsKept++;
    checkCollectionBonuses();
    checkCollectionQualityBonus();
  }
  removeTrayEntry(uid);
  saveState();
}

// True when this tray coin's true grade beats the one currently banked in
// the collection for the same coin -- worth swapping in.
function coinIsUpgrade(entry) {
  var owned = state.collection[entry.coinId];
  if (!owned) return false;
  return GRADE_INDEX[entry.trueGrade] > GRADE_INDEX[owned.trueGrade];
}

// Swaps a better-graded tray coin into the collection in place of the one
// already there, automatically selling the coin it replaces.
function replaceCoin(uid) {
  var entry = findTrayEntry(uid);
  if (!entry || !entry.identified || !isCoinGraded(entry) || !coinIsUpgrade(entry)) return;
  var owned = state.collection[entry.coinId];
  var oldValue = coinSellValue({ coinId: entry.coinId, trueGrade: owned.trueGrade, graded: owned.graded });
  state.cash += oldValue;
  state.stats.coinsSold++;
  state.stats.cashEarnedFromSelling += oldValue;
  state.collection[entry.coinId] = { trueGrade: entry.trueGrade, graded: entry.graded };
  checkCollectionQualityBonus();
  removeTrayEntry(uid);
  saveState();
}

function sellCoin(uid) {
  var entry = findTrayEntry(uid);
  if (!entry || !entry.identified) return;
  var value = coinSellValue(entry);
  state.cash += value;
  state.stats.coinsSold++;
  state.stats.cashEarnedFromSelling += value;
  removeTrayEntry(uid);
  saveState();
}

// Only sells duplicates that are actually graded -- an ungraded coin is
// still priced at the cautious bottom of its estimate, so selling it sight
// unseen risks giving away a coin that would've graded (and sold) higher.
function sellAllDuplicates() {
  var toSell = state.tray.filter(function (e) {
    return e.identified && isCoinGraded(e) && state.collection[e.coinId];
  });
  toSell.forEach(function (e) { sellCoin(e.uid); });
}

// Keeps every graded coin still needed for the collection, and also
// replaces any owned coin with a graded tray coin that beats it -- so one
// click both fills gaps and upgrades the album.
function keepAllNeeded() {
  var toProcess = state.tray.filter(function (e) {
    return e.identified && isCoinGraded(e) && (!state.collection[e.coinId] || coinIsUpgrade(e));
  });
  toProcess.forEach(function (e) {
    if (state.collection[e.coinId]) replaceCoin(e.uid);
    else keepCoin(e.uid);
  });
}

// One-off cash bonuses for raising the *floor* of each individual penny-type
// collection -- i.e. upgrading the worst coin you own within that type, not
// just adding new ones. Indexed to GRADES: Poor 1, Fair 2, Good 3,
// Very Good 4, Fine 5, Very Fine 5, Extremely Fine 10, Uncirculated 50,
// Mint 500 (pounds). Each of the penny types tracks its own ratchet, so
// e.g. maxing out your Victorian bun head coins pays out separately from
// maxing out your George V coins.
var COLLECTION_QUALITY_BONUS = [100, 200, 300, 400, 500, 500, 1000, 5000, 50000];

// A single type-collection's quality is only as good as its worst coin --
// and only counts once every coin of that type is owned, so a lone Mint
// coin in an otherwise-empty set doesn't look "high quality." Returns a
// GRADE_INDEX, or -1 if the set isn't complete yet.
function collectionQualityIndexForGroup(groupId) {
  var coinsInGroup = COINS.filter(function (c) { return c.group === groupId; });
  var complete = coinsInGroup.every(function (c) { return state.collection[c.id]; });
  if (!complete) return -1;
  var min = GRADES.length - 1;
  coinsInGroup.forEach(function (c) {
    var idx = GRADE_INDEX[state.collection[c.id].trueGrade];
    if (idx < min) min = idx;
  });
  return min;
}

// One-time ratchet per penny type: pays out the bonus for every quality
// tier newly reached as that type's worst coin improves (via Keep or
// Replace).
function checkCollectionQualityBonus() {
  COIN_GROUPS.forEach(function (group) {
    var idx = collectionQualityIndexForGroup(group.id);
    if (idx < 0) return;
    var claimed = state.collectionQualityBonusClaimed[group.id];
    if (claimed === undefined) claimed = -1;
    if (idx <= claimed) return;
    var reward = 0;
    for (var i = claimed + 1; i <= idx; i++) {
      reward += COLLECTION_QUALITY_BONUS[i];
    }
    state.collectionQualityBonusClaimed[group.id] = idx;
    state.cash += reward;
    queueToast(group.label + " quality now " + GRADES[idx].label + "! +" + formatMoney(reward) + " bonus.");
  });
}

function checkCollectionBonuses() {
  COIN_GROUPS.forEach(function (group) {
    if (state.groupBonusesClaimed[group.id]) return;
    var coinsInGroup = COINS.filter(function (c) { return c.group === group.id; });
    var complete = coinsInGroup.every(function (c) { return state.collection[c.id]; });
    if (complete) {
      state.groupBonusesClaimed[group.id] = true;
      var reward = group.firstCompleteBonus;
      state.cash += reward;
      queueToast(group.label + " collection complete! +" + formatMoney(reward) + " and a permanent +5% sale bonus.");
    }
  });

  if (!state.fullCollectionBonusClaimed && COINS.every(function (c) { return state.collection[c.id]; })) {
    state.fullCollectionBonusClaimed = true;
    state.cash += 100000;
    queueToast("Penny album complete! +£1000.00 bonus, +15% sale bonus. More denominations coming soon...");
  }
}

function isMessageDelivered(id) {
  return state.deliveredMessages.indexOf(id) !== -1;
}

function deliverMessage(id) {
  if (isMessageDelivered(id)) return;
  state.deliveredMessages.push(id);
  queueToast("New message: \"" + MESSAGES_BY_ID[id].subject + "\"");
}

// Delivers any not-yet-delivered message whose trigger condition is now
// true. Cheap to call often -- already-delivered messages are skipped.
function checkMessageTriggers() {
  MESSAGES.forEach(function (m) {
    if (!isMessageDelivered(m.id) && m.trigger(state)) deliverMessage(m.id);
  });
}

function unreadMessageCount() {
  return state.deliveredMessages.filter(function (id) { return !state.readMessages[id]; }).length;
}

function markMessageRead(id) {
  if (!isMessageDelivered(id) || state.readMessages[id]) return;
  state.readMessages[id] = true;
  saveState();
}

// Newest-first, for the inbox list.
function getInboxMessages() {
  return state.deliveredMessages
    .map(function (id) { return MESSAGES_BY_ID[id]; })
    .filter(Boolean)
    .slice()
    .reverse();
}

function buyUpgrade(id) {
  var def = UPGRADES_BY_ID[id];
  if (!def) return false;
  if (def.requires && !isOwned(def.requires)) return false;
  if (def.type === "toggle") {
    if (isOwned(id)) return false;
    if (state.cash < def.baseCost) return false;
    state.cash -= def.baseCost;
    state.upgradeLevels[id] = true;
  } else {
    var level = getLevel(id);
    if (level >= def.maxLevel) return false;
    var cost = upgradeCost(def, level);
    if (state.cash < cost) return false;
    state.cash -= cost;
    state.upgradeLevels[id] = level + 1;
  }
  saveState();
  return true;
}

function identifyDurationMs() {
  return BASE_IDENTIFY_MS;
}

function maxIdentifySlots() {
  return 1;
}

// Advances in-progress identifications and fills any free slots from the
// queue (FIFO). Returns true if anything changed, so the caller knows
// whether a re-render is worth doing.
function processIdentification() {
  var didWork = false;

  state.tray.forEach(function (e) {
    if (e.identifying) {
      e.remainingMs -= TICK_MS;
      didWork = true;
      if (e.remainingMs <= 0) {
        e.identifying = false;
        e.identified = true;
        e.trueGrade = rollGrade(e.gradeCap);
        state.stats.coinsSorted++;
      }
    }
  });

  var slotsUsed = state.tray.filter(function (e) { return e.identifying; }).length;
  var maxSlots = maxIdentifySlots();
  if (slotsUsed < maxSlots) {
    for (var i = 0; i < state.tray.length && slotsUsed < maxSlots; i++) {
      var e = state.tray[i];
      if (!e.identified && !e.identifying) {
        e.identifying = true;
        e.totalMs = identifyDurationMs();
        e.remainingMs = e.totalMs;
        slotsUsed++;
        didWork = true;
      }
    }
  }

  return didWork;
}

function tick() {
  var changed = false;

  Object.keys(state.lotCooldowns).forEach(function (id) {
    if (state.lotCooldowns[id] > 0) {
      state.lotCooldowns[id] = Math.max(0, state.lotCooldowns[id] - TICK_MS);
      changed = true;
    }
  });

  if (processIdentification()) changed = true;
  if (processGradingTray()) changed = true;

  var messageCountBefore = state.deliveredMessages.length;
  checkMessageTriggers();
  if (state.deliveredMessages.length !== messageCountBefore) changed = true;

  if (changed) {
    saveState();
    requestRender();
  }
}
