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

// Messages inbox is modal UI, not game state -- kept as plain module
// variables here rather than in `state` so opening/reading a letter never
// needs a save.
var messagesOpen = false;
var openMessageId = null;

function toggleMessages() {
  messagesOpen = !messagesOpen;
  if (messagesOpen && !openMessageId) {
    var inbox = getInboxMessages();
    if (inbox.length) openMessage(inbox[0].id);
  }
}

function openMessage(id) {
  openMessageId = id;
  markMessageRead(id);
}

function closeMessages() {
  messagesOpen = false;
}

// Which page of the game is showing (Coins / Collection / Upgrades). UI-only,
// like the messages modal, so it lives outside `state` and is remembered in
// its own localStorage key -- a Reset doesn't need to bounce you back.
var TAB_KEY = "coinCollectorActiveTab";
var TABS = ["coins", "collection", "upgrades"];
var activeTab = "coins";
try {
  var savedTab = localStorage.getItem(TAB_KEY);
  if (TABS.indexOf(savedTab) !== -1) activeTab = savedTab;
} catch (e) {}

// Which denomination's album the Collection tab is showing. UI-only, same
// as activeTab; falls back to the first unlocked album if the saved one
// isn't unlocked (e.g. after a Reset).
var ALBUM_KEY = "coinCollectorActiveAlbum";
var activeAlbum = "penny";
try {
  var savedAlbum = localStorage.getItem(ALBUM_KEY);
  if (savedAlbum && DENOMINATIONS_BY_ID[savedAlbum]) activeAlbum = savedAlbum;
} catch (e) {}

function currentAlbum() {
  return isDenomUnlocked(activeAlbum) ? activeAlbum : "penny";
}

function switchAlbum(id) {
  if (!isDenomUnlocked(id)) return;
  activeAlbum = id;
  try { localStorage.setItem(ALBUM_KEY, id); } catch (e) {}
}

function switchTab(id) {
  if (TABS.indexOf(id) === -1 || id === activeTab) return;
  activeTab = id;
  try { localStorage.setItem(TAB_KEY, id); } catch (e) {}
  window.scrollTo(0, 0);
}

function renderTabs() {
  document.querySelectorAll(".tab-bar .tab").forEach(function (tab) {
    var on = tab.getAttribute("data-id") === activeTab;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll(".view").forEach(function (view) {
    view.hidden = view.getAttribute("data-view") !== activeTab;
  });

  var unlocked = unlockedCoins();
  var owned = unlocked.filter(function (c) { return state.collection[c.id]; }).length;
  document.getElementById("tab-collection-count").textContent = owned + "/" + unlocked.length;

  // Badge the Upgrades tab with how many upgrades you could buy right now,
  // so moving them off the main page doesn't hide that one is affordable.
  var affordable = UPGRADES.filter(function (def) {
    if (def.type === "toggle") {
      return !isOwned(def.id) && !(def.requires && !isOwned(def.requires)) && state.cash >= def.baseCost;
    }
    var level = getLevel(def.id);
    return level < def.maxLevel && state.cash >= upgradeCost(def, level);
  }).length;
  var badge = document.getElementById("tab-upgrades-badge");
  badge.hidden = affordable === 0;
  badge.textContent = affordable;
}

function renderAll() {
  renderTabs();
  renderHeader();
  renderShop();
  renderUpgrades();
  renderTray();
  renderGradingTray();
  renderCollection();
  renderMessages();
  flushToasts();
}

function renderMessages() {
  var unread = unreadMessageCount();
  var badge = document.getElementById("messages-badge");
  badge.hidden = unread === 0;
  badge.textContent = unread;

  var modal = document.getElementById("messages-modal");
  modal.hidden = !messagesOpen;
  if (!messagesOpen) return;

  var inbox = getInboxMessages();

  var listContainer = document.getElementById("messages-list");
  listContainer.innerHTML = "";
  inbox.forEach(function (m) {
    var isDiscovery = m.kind === "discovery";
    var row = document.createElement("div");
    row.className = "message-row" +
      (isDiscovery ? " message-row-discovery" : "") +
      (m.id === openMessageId ? " selected" : "") +
      (state.readMessages[m.id] ? "" : " unread");
    row.setAttribute("data-action", "read-message");
    row.setAttribute("data-id", m.id);
    row.innerHTML =
      '<div class="message-row-from">' + (isDiscovery ? m.eyebrow : m.from) + "</div>" +
      '<div class="message-row-subject">' + m.subject + "</div>";
    listContainer.appendChild(row);
  });

  var reader = document.getElementById("messages-reader");
  var openMessageDef = MESSAGES_BY_ID[openMessageId];
  if (!openMessageDef) {
    reader.innerHTML = '<div class="message-empty">No messages yet.</div>';
    return;
  }
  var openIsDiscovery = openMessageDef.kind === "discovery";
  reader.innerHTML =
    '<div class="message-subject' + (openIsDiscovery ? " message-subject-discovery" : "") + '">' + openMessageDef.subject + "</div>" +
    '<div class="message-from' + (openIsDiscovery ? " message-eyebrow-discovery" : "") + '">' +
    (openIsDiscovery ? openMessageDef.eyebrow : "From: " + openMessageDef.from) + "</div>" +
    '<div class="message-body">' +
    openMessageDef.body.map(function (p) { return "<p>" + p + "</p>"; }).join("") +
    "</div>";
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
  // Counts only cover unlocked albums, so buying a new collection book
  // grows the totals rather than showing coins you can't get yet.
  var groups = claimedGroupCount();
  var totalGroups = unlockedGroups().length;
  var unlocked = unlockedCoins();
  var owned = unlocked.filter(function (c) { return state.collection[c.id]; }).length;
  var skillLevel = gradingSkillLevel();
  var xp = state.gradingXp || 0;
  var nextTier = SKILL_TIERS[skillLevel + 1];
  // Every figure is wrapped in <b>; the grading-skill figures also get a
  // gradient fill keyed to the current tier (rarity colours, common ->
  // legendary) so the readout visibly "levels up" alongside the skill.
  var num = function (v) { return "<b>" + v + "</b>"; };
  var skillNum = function (v) {
    return '<b class="skill-num skill-tier-' + skillLevel + '">' + v + "</b>";
  };
  var skillPart = " · grading skill " + skillNum(skillLevel + 1) + "/" + skillNum(SKILL_TIERS.length) +
    (nextTier ? " (" + skillNum(xp) + "/" + skillNum(nextTier.xp) + " XP)" : " (max)");
  document.getElementById("stat-line").innerHTML =
    num(owned) + " / " + num(unlocked.length) + " coins collected · " +
    num(groups) + " / " + num(totalGroups) + " sets complete · " +
    "collection value " + num(formatMoney(totalCollectionValue())) + " · " +
    "sale value " + num(Math.round(sellMultiplier() * 100) + "%") + skillPart;
}

function renderShop() {
  var container = document.getElementById("lot-list");
  container.innerHTML = "";
  // With more than one album unlocked, lots are grouped under a heading
  // per denomination (in LOTS order, which already lists them that way).
  var showHeadings = unlockedDenoms().length > 1;
  var lastDenom = null;
  LOTS.forEach(function (lot) {
    if (!isLotAvailable(lot)) return;
    if (showHeadings && lot.denom !== lastDenom) {
      var heading = document.createElement("div");
      heading.className = "shop-heading";
      heading.textContent = DENOMINATIONS_BY_ID[lot.denom].label;
      container.appendChild(heading);
    }
    lastDenom = lot.denom;
    var card = document.createElement("div");
    card.className = "card lot-card";

    var cost = lotCost(lot);
    var count = lotCoinCount(lot);
    var full = state.tray.length + count > MAX_TRAY;
    var cooldownRemaining = lot.cooldownMs ? lotCooldownRemaining(lot.id) : 0;
    var buyLabel = cooldownRemaining > 0
      ? "Available in " + Math.ceil(cooldownRemaining / 1000) + "s"
      : lot.oneTime && lot.isFree ? "Take it"
      : "Buy for " + (lot.isFree ? "Free" : formatMoney(cost));
    var buyDisabled = cooldownRemaining > 0 || full || state.cash < cost;

    card.innerHTML =
      '<div class="card-title">' + lot.name + "</div>" +
      '<div class="card-blurb">' + lot.blurb + "</div>" +
      '<div class="card-meta">' + count + " coins</div>" +
      '<div class="card-actions">' +
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
      // Ungraded coins: the whole card is the selection toggle (clicks on
      // its own Keep/Sell buttons still hit those buttons first, since the
      // delegated handler takes the closest data-action).
      var selectable = !graded;
      var selectLocked = selectable && !entry.selected && !canSelectMore;
      var selectHint = !selectable ? ""
        : entry.selected ? '<div class="select-hint">✓ Selected for grading</div>'
        : selectLocked ? '<div class="select-hint">Grade tray full</div>'
        : '<div class="select-hint">Click to select for grading</div>';
      el.className = "coin-slot identified rarity-" + coin.rarity +
        (selectable ? " selectable" : "") +
        (entry.selected ? " selected" : "") +
        (selectLocked ? " select-locked" : "");
      if (selectable) {
        el.setAttribute("data-action", "toggle-select-grading");
        el.setAttribute("data-uid", entry.uid);
        el.setAttribute("role", "button");
        el.setAttribute("tabindex", selectLocked ? "-1" : "0");
        el.setAttribute("aria-pressed", entry.selected ? "true" : "false");
      }
      el.innerHTML =
        '<div class="coin-face">' + pixelCoinImgHTML(coin, graded ? entry.trueGrade : null, "pixel-coin-lg") + '</div>' +
        '<div class="coin-name">' + coin.name + '</div>' +
        '<div class="coin-label">' + coin.subtitle + '</div>' +
        '<div class="coin-rarity">' + RARITY[coin.rarity].label + (owned ? " · Duplicate" : " · Needed") + '</div>' +
        '<div class="coin-grade' + (graded ? "" : " coin-grade-unknown") + '">' + gradeDisplayHTML(entry) + '</div>' +
        selectHint +
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

  var autoStatus = document.getElementById("auto-grade-status");
  if (autoStatus) {
    var autoInterval = autoGradeIntervalMs();
    if (!autoInterval) autoStatus.textContent = "";
    else if (occupants.length >= capacity) autoStatus.textContent = "Bench Assistant: waiting for a free slot";
    else if (!nextAutoGradeCandidate()) autoStatus.textContent = "Bench Assistant: nothing to grade";
    else autoStatus.textContent = "Bench Assistant: next coin in " + Math.ceil((state.autoGradeRemainingMs || 0) / 1000) + "s";
  }

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
  var album = currentAlbum();

  // One sub-tab per unlocked album; hidden while pennies are the only one.
  var albumTabs = document.getElementById("album-tabs");
  var denoms = unlockedDenoms();
  albumTabs.hidden = denoms.length < 2;
  albumTabs.innerHTML = denoms.map(function (d) {
    var coins = coinsInDenom(d.id);
    var have = coins.filter(function (c) { return state.collection[c.id]; }).length;
    return '<button class="btn btn-small' + (d.id === album ? " btn-primary" : "") +
      '" data-action="switch-album" data-id="' + d.id + '">' + d.label +
      ' <span class="tab-count">' + have + "/" + coins.length + "</span></button>";
  }).join("");

  var albumCoins = coinsInDenom(album);
  var albumOwned = albumCoins.filter(function (c) { return state.collection[c.id]; }).length;
  var summary = document.createElement("div");
  summary.className = "album-summary";
  summary.innerHTML = DENOMINATIONS_BY_ID[album].label + ": " + albumOwned + " / " + albumCoins.length +
    " coins · value " + formatMoney(collectionValueForDenom(album)) +
    (state.albumBonusClaimed[album]
      ? ' <span class="complete-badge">Album complete</span>'
      : " · complete the album for +" + formatMoney(DENOMINATIONS_BY_ID[album].albumBonus));
  container.appendChild(summary);

  groupsInDenom(album).forEach(function (group) {
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
      // Hovering an owned coin surfaces what it's worth; hovering a gap in
      // the album surfaces what belongs there and how rare it is to find,
      // since the slot itself only ever shows a "?".
      if (owned) {
        var ownedEntry = state.collection[coin.id];
        slot.title = coin.name + " — " + coin.subtitle + " · " + GRADES_BY_ID[ownedEntry.trueGrade].label +
          " · Value " + formatMoney(coinSuggestedValue({ coinId: coin.id, trueGrade: ownedEntry.trueGrade, graded: ownedEntry.graded }));
      } else {
        slot.title = coin.name + " — " + coin.subtitle + " · " + RARITY[coin.rarity].label + " · Not yet found";
      }
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
