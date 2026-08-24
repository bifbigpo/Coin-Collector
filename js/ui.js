var toastQueue = [];

function queueToast(message) {
  toastQueue.push(message);
}

function flushToasts() {
  if (!toastQueue.length) return;
  var container = document.getElementById("toasts");
  toastQueue.forEach(function (msg) {
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add("toast-out");
      setTimeout(function () { el.remove(); }, 400);
    }, 4200);
  });
  toastQueue = [];
}

function renderAll() {
  renderHeader();
  renderShop();
  renderCheckChange();
  renderUpgrades();
  renderTray();
  renderGradingTray();
  renderCollection();
  flushToasts();
}

function renderHeader() {
  document.getElementById("cash-display").textContent = formatMoney(state.cash);
  var groups = claimedGroupCount();
  var totalGroups = COIN_GROUPS.length;
  var owned = Object.keys(state.collection).length;
  var passive = passiveIncomePerSecond();
  var passivePart = passive > 0 ? " · " + formatMoney(passive) + "/sec passive" : "";
  var skillLevel = gradingSkillLevel();
  var xp = state.gradingXp || 0;
  var nextTier = SKILL_TIERS[skillLevel + 1];
  var skillPart = " · grading skill " + (skillLevel + 1) + "/" + SKILL_TIERS.length +
    (nextTier ? " (" + xp + "/" + nextTier.xp + " XP)" : " (max)");
  document.getElementById("stat-line").textContent =
    owned + " / " + COINS.length + " coins collected · " + groups + " / " + totalGroups + " sets complete · " +
    "sale value " + Math.round(sellMultiplier() * 100) + "%" + skillPart + passivePart;
}

function renderShop() {
  var container = document.getElementById("lot-list");
  container.innerHTML = "";
  LOTS.filter(function (lot) { return !lot.isFree; }).forEach(function (lot) {
    var card = document.createElement("div");
    card.className = "card lot-card" + (state.selectedLot === lot.id ? " selected" : "");

    var cost = lotCost(lot);
    var count = lotCoinCount(lot);
    card.innerHTML =
      '<div class="card-title">' + lot.name + "</div>" +
      '<div class="card-blurb">' + lot.blurb + "</div>" +
      '<div class="card-meta">' + count + " coins</div>" +
      '<div class="card-actions">' +
      '<button class="btn" data-action="select-lot" data-id="' + lot.id + '">' +
      (state.selectedLot === lot.id ? "Selected" : "Select") + "</button>" +
      '<button class="btn btn-primary" data-action="buy-lot" data-id="' + lot.id + '"' +
      (state.cash < cost ? " disabled" : "") + ">Buy for " + formatMoney(cost) + "</button>" +
      "</div>";
    container.appendChild(card);
  });
}

function renderCheckChange() {
  var btn = document.getElementById("check-change-btn");
  if (!btn) return;
  var lot = LOTS_BY_ID["check_change"];
  var remaining = lotCooldownRemaining("check_change");
  if (remaining > 0) {
    btn.textContent = "Check Your Change (" + Math.ceil(remaining / 1000) + "s)";
    btn.disabled = true;
  } else {
    var full = state.tray.length + lotCoinCount(lot) > MAX_TRAY;
    btn.textContent = "Check Your Change (Free)";
    btn.disabled = full;
  }
}

function renderUpgrades() {
  var container = document.getElementById("upgrade-list");
  container.innerHTML = "";
  UPGRADES.forEach(function (def) {
    var card = document.createElement("div");
    card.className = "card upgrade-card";

    if (def.type === "toggle") {
      var owned = isOwned(def.id);
      card.innerHTML =
        '<div class="card-title">' + def.name + (owned ? " ✓" : "") + "</div>" +
        '<div class="card-blurb">' + def.blurb + "</div>" +
        (owned
          ? '<div class="card-meta">Owned</div>'
          : '<button class="btn" data-action="buy-upgrade" data-id="' + def.id + '"' +
            (state.cash < def.baseCost ? " disabled" : "") + ">Buy for " + formatMoney(def.baseCost) + "</button>");
    } else {
      var level = getLevel(def.id);
      var maxed = level >= def.maxLevel;
      var cost = upgradeCost(def, level);
      card.innerHTML =
        '<div class="card-title">' + def.name + '<span class="level-badge">Lv ' + level + "/" + def.maxLevel + "</span></div>" +
        '<div class="card-blurb">' + def.blurb + "</div>" +
        (maxed
          ? '<div class="card-meta">Maxed out</div>'
          : '<button class="btn" data-action="buy-upgrade" data-id="' + def.id + '"' +
            (state.cash < cost ? " disabled" : "") + ">Upgrade for " + formatMoney(cost) + "</button>");
    }
    container.appendChild(card);
  });
}

function renderTray() {
  var container = document.getElementById("tray-list");
  container.innerHTML = "";
  var count = document.getElementById("tray-count");
  count.textContent = state.tray.length + " / " + MAX_TRAY;

  if (!state.tray.length) {
    container.innerHTML = '<div class="empty-hint">Buy a lot to get coins to sort through.</div>';
  }

  // Coins currently sitting in the grade tray have their own panel --
  // they're not shown here until grading finishes.
  var trayFull = gradingTrayFull();
  state.tray.filter(function (entry) { return !entry.grading; }).forEach(function (entry) {
    var el = document.createElement("div");
    if (entry.identifying) {
      var pct = Math.max(0, Math.min(100, Math.round(100 * (1 - entry.remainingMs / entry.totalMs))));
      var secsLeft = Math.max(0, Math.ceil(entry.remainingMs / 1000));
      el.className = "coin-slot identifying";
      el.innerHTML =
        '<div class="coin-face">🔍</div>' +
        '<div class="coin-label">Identifying… ' + secsLeft + 's</div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
    } else if (!entry.identified) {
      el.className = "coin-slot unidentified queued";
      el.innerHTML = '<div class="coin-face">?</div><div class="coin-label">Queued</div>';
    } else {
      var coin = COINS_BY_ID[entry.coinId];
      var owned = !!state.collection[coin.id];
      var graded = isCoinGraded(entry);
      var isUpgrade = owned && graded && coinIsUpgrade(entry);
      var sellValue = coinSellValue(entry);
      var suggestedValue = coinSuggestedValue(entry);
      var gradeCheckbox = !graded
        ? '<label class="grade-check' + (trayFull ? " disabled" : "") + '">' +
          '<input type="checkbox" data-action="start-grading" data-uid="' + entry.uid + '"' + (trayFull ? " disabled" : "") + '> Send to grade tray' +
          '</label>'
        : "";
      el.className = "coin-slot identified rarity-" + coin.rarity;
      el.innerHTML =
        '<div class="coin-face">' + pixelCoinImgHTML(coin, graded ? entry.trueGrade : null, "pixel-coin-lg") + '</div>' +
        '<div class="coin-name">' + coin.name + '</div>' +
        '<div class="coin-label">' + coin.subtitle + '</div>' +
        '<div class="coin-rarity">' + RARITY[coin.rarity].label + (owned ? " · Duplicate" : " · Needed") + '</div>' +
        '<div class="coin-grade' + (graded ? "" : " coin-grade-unknown") + '">' + gradeDisplayHTML(entry) + '</div>' +
        gradeCheckbox +
        '<div class="coin-actions">' +
        (!owned && graded ? '<button class="btn btn-small" data-action="keep-coin" data-uid="' + entry.uid + '">Keep</button>' : "") +
        (isUpgrade ? '<button class="btn btn-small btn-primary" data-action="replace-coin" data-uid="' + entry.uid + '">Replace</button>' : "") +
        '<button class="btn btn-small btn-outline" data-action="sell-coin" data-uid="' + entry.uid + '">Sell ' + formatMoney(sellValue) + '</button>' +
        '</div>' +
        (sellValue < suggestedValue ? '<div class="coin-suggested">Suggested ' + formatMoney(suggestedValue) + '</div>' : "");
    }
    container.appendChild(el);
  });
}

// The grade tray: a fixed number of slots (GRADING_TRAY_CAPACITY) that
// grade whatever coins are ticked into them, 3 seconds each, with no
// further input needed.
function renderGradingTray() {
  var container = document.getElementById("grading-tray-list");
  if (!container) return;
  container.innerHTML = "";
  var count = document.getElementById("grading-tray-count");
  var grading = state.tray.filter(function (entry) { return entry.grading; });
  count.textContent = grading.length + " / " + GRADING_TRAY_CAPACITY;

  for (var i = 0; i < GRADING_TRAY_CAPACITY; i++) {
    var el = document.createElement("div");
    var entry = grading[i];
    if (!entry) {
      el.className = "coin-slot grading-slot empty";
      el.innerHTML = '<div class="coin-face">–</div><div class="coin-label">Empty slot</div>';
    } else {
      var coin = COINS_BY_ID[entry.coinId];
      var gpct = Math.max(0, Math.min(100, Math.round(100 * (1 - entry.gradeRemainingMs / GRADE_DURATION_MS))));
      var gsecs = Math.max(0, Math.ceil(entry.gradeRemainingMs / 1000));
      el.className = "coin-slot grading-slot rarity-" + coin.rarity;
      el.innerHTML =
        '<div class="coin-face">' + pixelCoinImgHTML(coin, null, "pixel-coin-lg") + '</div>' +
        '<div class="coin-name">' + coin.name + '</div>' +
        '<div class="coin-grade coin-grade-unknown">Grading… ' + gsecs + 's</div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + gpct + '%"></div></div>' +
        '<button class="btn btn-small btn-outline" data-action="cancel-grading" data-uid="' + entry.uid + '">Cancel</button>';
    }
    container.appendChild(el);
  }
}

// Builds the "quality: <grade> · next tier +£X" line for one penny type's
// section header -- that type's collection is only as good as its worst
// coin, and each type ratchets its own bonus independently.
function groupQualityHTML(groupId) {
  var idx = collectionQualityIndexForGroup(groupId);
  if (idx < 0) return "";
  var html = " · quality " + gradeSpan(GRADES[idx]);
  if (idx < GRADES.length - 1) {
    var next = GRADES[idx + 1];
    var reward = COLLECTION_QUALITY_BONUS[idx + 1];
    html += ' (replace worst for ' + gradeSpan(next) + " +" + formatMoney(reward) + ")";
  }
  return html;
}

function renderCollection() {
  var container = document.getElementById("collection-groups");
  container.innerHTML = "";
  COIN_GROUPS.forEach(function (group) {
    var coinsInGroup = COINS.filter(function (c) { return c.group === group.id; })
      .slice()
      .sort(function (a, b) { return a.year - b.year; });
    var ownedCount = coinsInGroup.filter(function (c) { return state.collection[c.id]; }).length;
    var section = document.createElement("div");
    section.className = "collection-group";
    var complete = ownedCount === coinsInGroup.length;
    section.innerHTML = '<div class="group-title">' + group.label + " (" + ownedCount + "/" + coinsInGroup.length + ")" +
      (complete ? ' <span class="complete-badge">Complete</span>' : "") +
      groupQualityHTML(group.id) + "</div>";
    var grid = document.createElement("div");
    grid.className = "collection-grid";
    coinsInGroup.forEach(function (coin) {
      var owned = !!state.collection[coin.id];
      var slot = document.createElement("div");
      slot.className = "collection-slot" + (owned ? " owned rarity-" + coin.rarity : " unknown");
      slot.title = owned ? coin.name + " - " + coin.subtitle : "Not yet found";
      slot.innerHTML = owned
        ? '<div class="coin-face">' + pixelCoinImgHTML(coin, state.collection[coin.id].trueGrade, "pixel-coin-sm") + '</div>' +
          '<div class="coin-label">' + coin.subtitle + '</div>' +
          '<div class="collection-grade">' + gradeDisplayHTML(state.collection[coin.id]) + '</div>'
        : '<div class="coin-face">?</div>';
      grid.appendChild(slot);
    });
    section.appendChild(grid);
    container.appendChild(section);
  });
}
