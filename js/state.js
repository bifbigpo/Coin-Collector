var SAVE_KEY = "coin_collector_save_v12";

// A plain weighted pick with no rarity-luck multiplier -- used only for
// the starting tray, which is built before `state` (and so any upgrades)
// exists yet.
function weightedPickPlain(pool) {
  var entries = Object.keys(pool);
  var total = entries.reduce(function (s, id) { return s + pool[id]; }, 0);
  var r = Math.random() * total;
  for (var i = 0; i < entries.length; i++) {
    r -= pool[entries[i]];
    if (r <= 0) return entries[i];
  }
  return entries[entries.length - 1];
}

// The game opens with the player going through a deceased family member's
// house and finding a jar of 100 pennies -- free, one-time, already
// sitting in the tray waiting to be sorted.
function buildStartingTray() {
  var pool = buildLotPool(STARTING_ESTATE);
  var guarantee = STARTING_ESTATE.guaranteed;
  var guaranteedPool = guarantee ? buildLotPool(STARTING_ESTATE, guarantee.minRarity) : null;
  var tray = [];
  for (var i = 0; i < 100; i++) {
    var useGuaranteed = guarantee && i < guarantee.count && guaranteedPool && Object.keys(guaranteedPool).length;
    tray.push({
      uid: i + 1,
      coinId: weightedPickPlain(useGuaranteed ? guaranteedPool : pool),
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
      gradeCap: STARTING_ESTATE.gradeCap || null
    });
  }
  return tray;
}

function defaultState() {
  var startingTray = buildStartingTray();
  return {
    cash: 100, // pence -- enough for one more £1 charity bag on top of the free estate find
    selectedLot: "decimal_bag",
    upgradeLevels: {}, // id -> level (leveled) or true (toggle)
    collection: {}, // coinId -> { trueGrade, graded }
    tray: startingTray, // { uid, coinId, identified, identifying, remainingMs, totalMs, grading, gradeRemainingMs, graded, trueGrade, gradeCap }
    nextUid: startingTray.length + 1,
    passiveAccrued: 0, // fractional pence carried between ticks
    lotCooldowns: {}, // lotId -> ms remaining
    gradingXp: 0, // experience toward the grading skill (SKILL_TIERS in engine.js)
    stats: {
      lotsBought: 0,
      coinsSorted: 0,
      coinsGraded: 0,
      coinsKept: 0,
      coinsSold: 0,
      cashEarnedFromSelling: 0
    },
    groupBonusesClaimed: {}, // groupId -> true
    fullCollectionBonusClaimed: false,
    collectionQualityBonusClaimed: {} // groupId -> highest GRADE_INDEX tier already paid out for that type
  };
}

var state = loadState();

function loadState() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    var loaded = JSON.parse(raw);
    var fresh = defaultState();
    // shallow-merge so new fields introduced later don't break old saves
    for (var k in fresh) {
      if (loaded[k] === undefined) loaded[k] = fresh[k];
    }
    return loaded;
  } catch (e) {
    console.warn("Failed to load save, starting fresh.", e);
    return defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save.", e);
  }
}

function resetState() {
  if (!confirm("Reset all progress? This cannot be undone.")) return;
  localStorage.removeItem(SAVE_KEY);
  state = defaultState();
  saveState();
  renderAll();
}
