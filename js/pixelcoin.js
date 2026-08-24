// Procedural pixel-art coin faces. Every coin is drawn on a tiny 16x16
// canvas from the coin's own data (group, year, rarity, grade) rather than
// from hand-authored art, so new PENNY_TYPES entries get a face for free.
// Results are cached by their inputs since the same coin/grade combination
// always renders identically.

var PIXEL_GRID = 16;
var pixelCoinCache = {};
var groupDetailCache = {};

function hashString(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Circular disc mask, precomputed once: which of the 16x16 cells fall
// inside the coin, and which of those form the outer rim ring.
var COIN_MASK = (function () {
  var cells = [];
  var center = (PIXEL_GRID - 1) / 2;
  var radius = PIXEL_GRID / 2 - 0.6;
  for (var y = 0; y < PIXEL_GRID; y++) {
    for (var x = 0; x < PIXEL_GRID; x++) {
      var dx = x - center, dy = y - center;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d <= radius) cells.push({ x: x, y: y, rim: d > radius - 1.4 });
    }
  }
  return cells;
})();

// A "portrait" blob unique to each penny type, mirrored left/right so it
// reads as a medallion rather than noise. Seeded by group id, so it's the
// same every time a coin from that type is drawn.
function groupDetailPixels(groupId) {
  if (groupDetailCache[groupId]) return groupDetailCache[groupId];
  var rand = mulberry32(hashString(groupId));
  var center = (PIXEL_GRID - 1) / 2;
  var pts = {};
  for (var y = 2; y < PIXEL_GRID - 2; y++) {
    for (var x = 2; x <= center; x++) {
      var dx = x - center, dy = y - center;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > PIXEL_GRID / 2 - 1.8) continue;
      var falloff = 1 - d / (PIXEL_GRID / 2);
      if (rand() < 0.3 * falloff + 0.05) {
        pts[x + "," + y] = true;
        pts[(PIXEL_GRID - 1 - x) + "," + y] = true;
      }
    }
  }
  groupDetailCache[groupId] = pts;
  return pts;
}

// The alloy switched from bronze to copper-plated steel in 1992 -- reuse
// that real cutoff so the pixel color matches the coin's actual material.
function coinMaterial(coin) {
  return coin.year >= 1992 ? "steel" : "bronze";
}

var MATERIAL_COLORS = {
  bronze: { face: [178, 98, 40], rim: [110, 58, 22], shade: [90, 46, 16], shine: [232, 175, 110] },
  steel:  { face: [176, 182, 190], rim: [110, 116, 124], shade: [86, 90, 98], shine: [225, 230, 236] }
};

var RARITY_RING = {
  Common: null,
  Uncommon: [76, 175, 114],
  Rare: [74, 144, 217],
  VeryRare: [164, 99, 217],
  Legendary: [212, 175, 55]
};

var GRADE_ORDER = ["poor", "fair", "good", "vgood", "fine", "vfine", "efine", "unc", "mint"];

function gradeQuality01(gradeId) {
  var idx = GRADE_ORDER.indexOf(gradeId);
  if (idx < 0) return 0.45; // ungraded: draw a neutral, lightly-worn coin
  return idx / (GRADE_ORDER.length - 1);
}

function rgb(c) { return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")"; }

function pixelCoinDataUrl(coin, gradeId) {
  var key = coin.group + "|" + coin.year + "|" + (gradeId || "u") + "|" + coin.rarity;
  var cached = pixelCoinCache[key];
  if (cached) return cached;

  var canvas = document.createElement("canvas");
  canvas.width = PIXEL_GRID;
  canvas.height = PIXEL_GRID;
  var ctx = canvas.getContext("2d");

  var mat = MATERIAL_COLORS[coinMaterial(coin)];
  var detail = groupDetailPixels(coin.group);
  var quality = gradeQuality01(gradeId);
  var wearRand = mulberry32(hashString(coin.id + "|" + (gradeId || "u")));
  var ringColor = RARITY_RING[coin.rarity];
  var wearChance = quality < 0.5 ? 0.35 * (0.5 - quality) * 2 : 0;
  var shineChance = quality > 0.55 ? 0.25 * (quality - 0.55) / 0.45 : 0;

  COIN_MASK.forEach(function (px) {
    var x = px.x, y = px.y;
    var color;
    if (ringColor && px.rim) {
      color = ringColor;
    } else if (px.rim) {
      color = mat.rim;
    } else if (detail[x + "," + y]) {
      color = mat.shade;
    } else {
      color = mat.face;
    }

    if (!px.rim && wearChance && wearRand() < wearChance) color = mat.shade;
    if (!px.rim && x < 8 && y < 7 && shineChance && wearRand() < shineChance) color = mat.shine;

    ctx.fillStyle = rgb(color);
    ctx.fillRect(x, y, 1, 1);
  });

  if (gradeId === "mint") {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(4, 4, 1, 1);
  }

  var url = canvas.toDataURL("image/png");
  pixelCoinCache[key] = url;
  return url;
}

function pixelCoinImgHTML(coin, gradeId, sizeClass) {
  var url = pixelCoinDataUrl(coin, gradeId);
  return '<img class="pixel-coin ' + (sizeClass || "") + '" src="' + url + '" width="' + PIXEL_GRID + '" height="' + PIXEL_GRID + '" alt="">';
}
