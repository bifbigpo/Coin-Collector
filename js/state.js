var SAVE_KEY = "coin_collector_save_v1";

function defaultState() {
  return {
    cash: 2000, // pence
    selectedLot: "jar",
    unlockedLots: { jar: true },
    upgradeLevels: {}, // id -> level (leveled) or true (toggle)
    collection: {}, // coinId -> true
    tray: [], // { uid, coinId, identified }
    nextUid: 1,
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
