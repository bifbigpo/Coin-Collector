function handleClick(e) {
  var btn = e.target.closest("[data-action]");
  if (!btn) return;
  var action = btn.getAttribute("data-action");
  var id = btn.getAttribute("data-id");
  var uid = btn.getAttribute("data-uid") ? Number(btn.getAttribute("data-uid")) : null;

  switch (action) {
    case "buy-lot": buyLot(id); break;
    case "select-lot": state.selectedLot = id; saveState(); break;
    case "buy-upgrade": buyUpgrade(id); break;
    case "keep-coin": keepCoin(uid); break;
    case "replace-coin": replaceCoin(uid); break;
    case "grade-coin": gradeCoin(uid); break;
    case "sell-coin": sellCoin(uid); break;
    case "sell-duplicates": sellAllDuplicates(); break;
    case "keep-needed": keepAllNeeded(); break;
    case "reset-save": resetState(); return;
  }
  renderAll();
}

document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("click", handleClick);
  renderAll();
  setInterval(tick, TICK_MS);
});
