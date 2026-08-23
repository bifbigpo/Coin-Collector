var MAX_TRAY = 250;
var TICK_MS = 300;
var BASE_IDENTIFY_MS = 2000;
var UNGRADED_SELL_MULT = 0.6; // what an ungraded coin fetches from a dealer -- a lowball

var GRADES = [
  { id: "poor", label: "Poor", mult: 0.3, weight: 30 },
  { id: "fair", label: "Fair", mult: 0.45, weight: 25 },
  { id: "fine", label: "Fine", mult: 0.6, weight: 25 },
  { id: "vfine", label: "Very Fine", mult: 1.0, weight: 14 },
  { id: "efine", label: "Extremely Fine", mult: 1.6, weight: 5 },
  { id: "unc", label: "Uncirculated", mult: 2.5, weight: 1 }
];
var GRADES_BY_ID = {};
GRADES.forEach(function (g) { GRADES_BY_ID[g.id] = g; });

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

function rarityWeightMultiplier(rarity) {
  var loupeLevel = getLevel("loupe");
  switch (rarity) {
    case "Rare": return 1 + 0.25 * loupeLevel;
    case "VeryRare": return 1 + 0.35 * loupeLevel;
    case "Legendary": return 1 + 0.5 * loupeLevel;
    default: return 1;
  }
}

function lotCost(lot) {
  var hagglerLevel = getLevel("haggler");
  var mult = Math.max(0.6, 1 - hagglerLevel * 0.05);
  return Math.round(lot.baseCost * mult);
}

function lotCoinCount(lot) {
  var level = getLevel("bigger_lots");
  return Math.round(lot.coinsPerLot * (1 + 0.08 * level));
}

function claimedGroupCount() {
  return Object.keys(state.groupBonusesClaimed).length;
}

function sellMultiplier() {
  var appraiserLevel = getLevel("appraiser");
  var appraiserFraction = 0.8 + 0.02 * appraiserLevel; // 0.8 -> 1.0
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

function coinSellValue(entry) {
  var coin = COINS_BY_ID[entry.coinId];
  var gradeMult = isOwned("grading_kit") ? GRADES_BY_ID[entry.grade].mult : UNGRADED_SELL_MULT;
  return Math.max(1, Math.round(coin.value * gradeMult * sellMultiplier()));
}

function weightedPick(pool) {
  var entries = Object.keys(pool);
  var total = 0;
  var weights = entries.map(function (id) {
    var coin = COINS_BY_ID[id];
    var w = pool[id] * rarityWeightMultiplier(coin.rarity);
    total += w;
    return w;
  });
  var r = Math.random() * total;
  for (var i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return entries[i];
  }
  return entries[entries.length - 1];
}

function lotCooldownRemaining(lotId) {
  return Math.max(0, state.lotCooldowns[lotId] || 0);
}

function buyLot(lotId) {
  var lot = LOTS_BY_ID[lotId];
  if (!lot || !state.unlockedLots[lotId]) return false;
  if (lot.cooldownMs && lotCooldownRemaining(lotId) > 0) return false;
  var cost = lotCost(lot);
  var count = lotCoinCount(lot);
  if (state.cash < cost) return false;
  if (state.tray.length + count > MAX_TRAY) return false;

  var pool = buildLotPool(lot);
  state.cash -= cost;
  for (var i = 0; i < count; i++) {
    var coinId = weightedPick(pool);
    state.tray.push({
      uid: state.nextUid++,
      coinId: coinId,
      identified: false,
      identifying: false,
      remainingMs: 0,
      totalMs: 0,
      grade: null,
      gradeCap: lot.gradeCap || null
    });
  }
  state.stats.lotsBought++;
  if (lot.cooldownMs) state.lotCooldowns[lotId] = lot.cooldownMs;
  saveState();
  return true;
}

function unlockLot(lotId) {
  var lot = LOTS_BY_ID[lotId];
  if (!lot || state.unlockedLots[lotId]) return false;
  if (state.cash < lot.unlockCost) return false;
  state.cash -= lot.unlockCost;
  state.unlockedLots[lotId] = true;
  saveState();
  return true;
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
  if (!entry || !entry.identified) return;
  if (!state.collection[entry.coinId]) {
    state.collection[entry.coinId] = true;
    state.stats.coinsKept++;
    checkCollectionBonuses();
  }
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

function sellAllDuplicates() {
  var toSell = state.tray.filter(function (e) {
    return e.identified && state.collection[e.coinId];
  });
  toSell.forEach(function (e) { sellCoin(e.uid); });
}

function keepAllNeeded() {
  var toKeep = state.tray.filter(function (e) {
    return e.identified && !state.collection[e.coinId];
  });
  toKeep.forEach(function (e) { keepCoin(e.uid); });
}

function checkCollectionBonuses() {
  COIN_GROUPS.forEach(function (group) {
    if (state.groupBonusesClaimed[group.id]) return;
    var coinsInGroup = COINS.filter(function (c) { return c.group === group.id; });
    var complete = coinsInGroup.every(function (c) { return state.collection[c.id]; });
    if (complete) {
      state.groupBonusesClaimed[group.id] = true;
      var reward = coinsInGroup.reduce(function (sum, c) { return sum + c.value; }, 0) * 2;
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

function buyUpgrade(id) {
  var def = UPGRADES_BY_ID[id];
  if (!def) return false;
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
  var quickLevel = getLevel("quick_sort");
  var duration = BASE_IDENTIFY_MS * Math.pow(0.9, quickLevel);
  return Math.max(200, Math.round(duration));
}

function maxIdentifySlots() {
  return 1 + getLevel("sorting_slots");
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
        e.grade = rollGrade(e.gradeCap);
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

function passiveIncomePerSecond() {
  var level = getLevel("display_case");
  if (!level) return 0;
  var collected = Object.keys(state.collection).length;
  return collected * level * 0.08; // pence/sec
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

  if (isOwned("auto_curator")) {
    var resolved = state.tray.filter(function (e) { return e.identified; });
    resolved.forEach(function (e) {
      if (state.collection[e.coinId]) {
        sellCoin(e.uid);
      } else {
        keepCoin(e.uid);
      }
      changed = true;
    });
  }

  var incomePerSec = passiveIncomePerSecond();
  if (incomePerSec > 0) {
    state.passiveAccrued = (state.passiveAccrued || 0) + incomePerSec * (TICK_MS / 1000);
    var whole = Math.floor(state.passiveAccrued);
    if (whole > 0) {
      state.cash += whole;
      state.passiveAccrued -= whole;
      changed = true;
    }
  }

  if (isOwned("auto_buy")) {
    var lot = LOTS_BY_ID[state.selectedLot];
    if (lot && state.unlockedLots[lot.id]) {
      if (buyLot(lot.id)) changed = true;
    }
  }

  if (changed) {
    saveState();
    renderAll();
  }
}
