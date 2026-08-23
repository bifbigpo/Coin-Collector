var MAX_TRAY = 60;
var TICK_MS = 300;

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
  return lot.coinsPerLot + getLevel("bigger_lots");
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

function buyLot(lotId) {
  var lot = LOTS_BY_ID[lotId];
  if (!lot || !state.unlockedLots[lotId]) return false;
  var cost = lotCost(lot);
  var count = lotCoinCount(lot);
  if (state.cash < cost) return false;
  if (state.tray.length + count > MAX_TRAY) return false;

  state.cash -= cost;
  for (var i = 0; i < count; i++) {
    var coinId = weightedPick(lot.pool);
    state.tray.push({ uid: state.nextUid++, coinId: coinId, identified: false });
  }
  state.stats.lotsBought++;
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

function identifyCoin(uid) {
  var entry = findTrayEntry(uid);
  if (!entry || entry.identified) return;
  entry.identified = true;
  state.stats.coinsSorted++;
}

function identifyAll() {
  state.tray.forEach(function (e) {
    if (!e.identified) {
      e.identified = true;
      state.stats.coinsSorted++;
    }
  });
  saveState();
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
  var coin = COINS_BY_ID[entry.coinId];
  var value = Math.round(coin.value * sellMultiplier());
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

function tick() {
  var changed = false;

  if (isOwned("auto_sort")) {
    var quickLevel = getLevel("quick_sort");
    var perTick = 1 + Math.floor(quickLevel / 2);
    var identified = 0;
    for (var i = 0; i < state.tray.length && identified < perTick; i++) {
      if (!state.tray[i].identified) {
        state.tray[i].identified = true;
        state.stats.coinsSorted++;
        identified++;
        changed = true;
      }
    }
  }

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
