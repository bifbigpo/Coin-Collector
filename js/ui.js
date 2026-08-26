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
  renderUpgrades();
  renderTray();
  renderGradingTray();
  renderCollection();
  flushToasts();
}

// tick() drives renderAll() up to a few times a second while anything is
// identifying, grading, or cooling down -- and renderAll() rebuilds every
// button from scratch each time. If that lands between a button's
// mousedown and its mouseup, the button is torn down and replaced mid-
// press, the browser never dispatches the click event, and the press is
// silently lost -- more often the faster you click. Routing tick's own
// renders through requestRender() instead of calling renderAll() directly
// defers them until the mouse button is back up, so a render can never
// land mid-press.
var mouseIsDown = false;
var renderPending = false;

function requestRender() {
  if (mouseIsDown) {
    renderPending = true;
    return;
  }
  renderAll();
}

function setMouseDown(isDown) {
  mouseIsDown = isDown;
  if (isDown || !renderPending) return;
  // The matching click, if any, fires immediately after mouseup and runs
  // its own renderAll() -- wait one tick past that before catching up, so
  // this deferred render can't replace the button out from under it.
  setTimeout(function () {
    if (renderPending) {
      renderPending = false;
      renderAll();
    }
  }, 0);
}

function renderHeader() {
  document.getElementById("cash-display").textContent = formatMoney(state.cash);
  var groups = claimedGroupCount();
  var totalGroups = COIN_GROUPS.length;
  var owned = Object.keys(state.collection).length;
  var skillLevel = gradingSkillLevel();
  var xp = state.gradingXp || 0;
  var nextTier = SKILL_TIERS[skillLevel + 1];
  var skillPart = " · grading skill " + (skillLevel + 1) + "/" + SKILL_TIERS.length +
    (nextTier ? " (" + xp + "/" + nextTier.xp + " XP)" : " (max)");
  document.getElementById("stat-line").textContent =
    owned + " / " + COINS.length + " coins collected · " + groups + " / " + totalGroups + " sets complete · " +
    "collection value " + formatMoney(totalCollectionValue()) + " · " +
    "sale value " + Math.round(sellMultiplier() * 100) + "%" + skillPart;
}

function renderShop() {
  var container = document.getElementById("lot-list");
  container.innerHTML = "";
  LOTS.forEach(function (lot) {
    var card = document.createElement("div");
    card.className = "card lot-card" + (state.selectedLot === lot.id ? " selected" : "");

    var cost = lotCost(lot);
    var count = lotCoinCount(lot);
    var full = state.tray.length + count > MAX_TRAY;
    var cooldownRemaining = lot.cooldownMs ? lotCooldownRemaining(lot.id) : 0;
    var buyLabel = cooldownRemaining > 0
      ? "Available in " + Math.ceil(cooldownRemaining / 1000) + "s"
      : "Buy for " + (lot.isFree ? "Free" : formatMoney(cost));
    var buyDisabled = cooldownRemaining > 0 || full || state.cash < cost;

    // The free "Check Your Change" refill has nothing to compare against
    // other lots on, so it skips the select toggle other lots use.
    var selectButton = lot.isFree ? "" :
      '<button class="btn" data-action="select-lot" data-id="' + lot.id + '">' +
      (state.selectedLot === lot.id ? "Selected" : "Select") + "</button>";

    card.innerHTML =
      '<div class="card-title">' + lot.name + "</div>" +
      '<div class="card-blurb">' + lot.blurb + "</div>" +
      '<div class="card-meta">' + count + " coins</div>" +
      '<div class="card-actions">' +
      selectButton +
      '<button class="btn btn-primary" data-action="buy-lot" data-id="' + lot.id + '"' +
      (buyDisabled ? " disabled" : "") + ">" + buyLabel + "</button>" +
      "</div>";
    container.appendChild(card);
  });
}

function renderUpgrades() {
  var container = document.getElementById("upgrade-list");
  container.innerHTML = "";
  UPGRADES.forEach(function (def) {
    var card = document.createElement("div");
    card.className = "card upgrade-card";

    if (def.type === "toggle") {
      var owned = isOwned(def.id);
      var locked = def.requires && !isOwned(def.requires);
      var action;
      if (owned) {
        action = '<div class="card-meta">Owned</div>';
      } else if (locked) {
        action = '<div class="card-meta">Requires ' + UPGRADES_BY_ID[def.requires].name + '</div>';
      } else {
        action = '<button class="btn" data-action="buy-upgrade" data-id="' + def.id + '"' +
          (state.cash < def.baseCost ? " disabled" : "") + ">Buy for " + formatMoney(def.baseCost) + "</button>";
      }
      card.innerHTML =
        '<div class="card-title">' + def.name + (owned ? " ✓" : "") + "</div>" +
        '<div class="card-blurb">' + def.blurb + "</div>" +
        action;
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

  document.querySelectorAll('[data-action="sort-tray"]').forEach(function (btn) {
    btn.classList.toggle("btn-primary", btn.getAttribute("data-id") === state.traySortMode);
  });

  if (!state.tray.length) {
    container.innerHTML = '<div class="empty-hint">Buy a lot to get coins to sort through.</div>';
  }

  // Coins currently sitting in the grade tray -- selected-but-not-sent
  // coins stay put with the rest, but they're checked and locked in.
  var space = gradingTraySpaceRemaining();
  var selectedCount = selectedForGradingCount();
  var canSelectMore = selectedCount < space;
  var visibleEntries = state.tray.filter(function (entry) { return !entry.inGradeTray; });
  visibleEntries.forEach(function (entry) {
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
      var checkboxDisabled = !entry.selected && !canSelectMore;
      var gradeCheckbox = !graded
        ? '<label class="grade-check' + (checkboxDisabled ? " disabled" : "") + '">' +
          '<input type="checkbox" data-action="toggle-select-grading" data-uid="' + entry.uid + '"' +
          (entry.selected ? " checked" : "") + (checkboxDisabled ? " disabled" : "") + '> Select for grading' +
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

  var sendBtn = document.getElementById("send-to-grading-btn");
  if (sendBtn) {
    sendBtn.textContent = "Send to Grade Tray (" + selectedCount + ")";
    sendBtn.disabled = selectedCount === 0;
  }
}

// The grade tray: a number of slots set by the Bigger Grading Tray upgrade,
// but only one coin grades at a time -- the rest wait their turn queued in
// their slot. A finished coin sits put -- graded, but not returned to the
// inspection tray -- until kept, replaced, or sold right from here.
function renderGradingTray() {
  var container = document.getElementById("grading-tray-list");
  if (!container) return;
  container.innerHTML = "";
  var count = document.getElementById("grading-tray-count");
  var occupants = state.tray.filter(function (entry) { return entry.inGradeTray; });
  var capacity = gradingTrayCapacity();
  count.textContent = occupants.length + " / " + capacity;

  for (var i = 0; i < capacity; i++) {
    var el = document.createElement("div");
    var entry = occupants[i];
    if (!entry) {
      el.className = "coin-slot grading-slot empty";
      el.innerHTML = '<div class="coin-face">–</div><div class="coin-label">Empty slot</div>';
    } else if (entry.grading) {
      var coin = COINS_BY_ID[entry.coinId];
      var gradeTotalMs = entry.gradeTotalMs || BASE_GRADE_DURATION_MS;
      var gpct = Math.max(0, Math.min(100, Math.round(100 * (1 - entry.gradeRemainingMs / gradeTotalMs))));
      var gsecs = Math.max(0, Math.ceil(entry.gradeRemainingMs / 1000));
      el.className = "coin-slot grading-slot rarity-" + coin.rarity;
      el.innerHTML =
        '<div class="coin-face">' + pixelCoinImgHTML(coin, null, "pixel-coin-lg") + '</div>' +
        '<div class="coin-name">' + coin.name + '</div>' +
        '<div class="coin-grade coin-grade-unknown">Grading… ' + gsecs + 's</div>' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + gpct + '%"></div></div>' +
        '<button class="btn btn-small btn-outline" data-action="cancel-grading" data-uid="' + entry.uid + '">Cancel</button>';
    } else if (!entry.graded) {
      var qcoin = COINS_BY_ID[entry.coinId];
      el.className = "coin-slot grading-slot queued rarity-" + qcoin.rarity;
      el.innerHTML =
        '<div class="coin-face">' + pixelCoinImgHTML(qcoin, null, "pixel-coin-lg") + '</div>' +
        '<div class="coin-name">' + qcoin.name + '</div>' +
        '<div class="coin-grade coin-grade-unknown">Waiting to grade…</div>' +
        '<button class="btn btn-small btn-outline" data-action="cancel-grading" data-uid="' + entry.uid + '">Cancel</button>';
    } else {
      // Finished grading -- resolved right here, same actions as the
      // inspection tray, but the coin never leaves the grade tray slot.
      var coin2 = COINS_BY_ID[entry.coinId];
      var owned = !!state.collection[coin2.id];
      var isUpgrade = owned && coinIsUpgrade(entry);
      var sellValue = coinSellValue(entry);
      var suggestedValue = coinSuggestedValue(entry);
      el.className = "coin-slot rarity-" + coin2.rarity;
      el.innerHTML =
        '<div class="coin-face">' + pixelCoinImgHTML(coin2, entry.trueGrade, "pixel-coin-lg") + '</div>' +
        '<div class="coin-name">' + coin2.name + '</div>' +
        '<div class="coin-label">' + coin2.subtitle + '</div>' +
        '<div class="coin-rarity">' + RARITY[coin2.rarity].label + (owned ? " · Duplicate" : " · Needed") + '</div>' +
        '<div class="coin-grade">' + gradeDisplayHTML(entry) + '</div>' +
        '<div class="coin-actions">' +
        (!owned ? '<button class="btn btn-small" data-action="keep-coin" data-uid="' + entry.uid + '">Keep</button>' : "") +
        (isUpgrade ? '<button class="btn btn-small btn-primary" data-action="replace-coin" data-uid="' + entry.uid + '">Replace</button>' : "") +
        '<button class="btn btn-small btn-outline" data-action="sell-coin" data-uid="' + entry.uid + '">Sell ' + formatMoney(sellValue) + '</button>' +
        '</div>' +
        (sellValue < suggestedValue ? '<div class="coin-suggested">Suggested ' + formatMoney(suggestedValue) + '</div>' : "");
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
      " · value " + formatMoney(collectionValueForGroup(group.id)) +
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
