var SAVE_KEY = "coin_collector_save_v3";

function defaultState() {
  return {
    cash: 200, // pence -- enough for two £1 charity shop bags
    selectedLot: "predecimal_bag",
    unlockedLots: { predecimal_bag: true, decimal_bag: true, check_change: true },
    upgradeLevels: {}, // id -> level (leveled) or true (toggle)
    collection: {}, // coinId -> true
    tray: [], // { uid, coinId, identified, identifying, remainingMs, totalMs, grade, gradeCap }
    nextUid: 1,
    passiveAccrued: 0, // fractional pence carried between ticks
    lotCooldowns: {}, // lotId -> ms remaining
    stats: {
      lotsBought: 0,
      coinsSorted: 0,
      coinsKept: 0,
      coinsSold: 0,
      cashEarnedFromSelling: 0
    },
    groupBonusesClaimed: {}, // groupId -> true
    fullCollectionBonusClaimed: false
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
