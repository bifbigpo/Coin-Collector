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

// Every real penny carries a monarch's portrait, so every pixel coin shares
// one profile bust (head + neck + shoulders, facing right) as its base --
// that's what reads as "a coin" rather than an abstract disc. Computed once.
var bustCache = null;
function bustSilhouette() {
  if (bustCache) return bustCache;
  var pts = {};
  var hx = 8.8, hy = 6.6, rx = 2.5, ry = 2.8;
  for (var y = 2; y <= 12; y++) {
    for (var x = 4; x <= 14; x++) {
      var dx = (x - hx) / rx, dy = (y - hy) / ry;
      if (dx * dx + dy * dy <= 1) pts[x + "," + y] = true;
    }
  }
  pts["12,7"] = true; // nose, in profile
  pts["12,8"] = true;
  for (var y2 = 10; y2 <= 14; y2++) {
    var half = 1.5 + (y2 - 10) * 1.1;
    var lo = Math.round(8 - half), hi = Math.round(8 + half);
    for (var x2 = lo; x2 <= hi; x2++) {
      if (x2 >= 1 && x2 <= 14) pts[x2 + "," + y2] = true;
    }
  }
  bustCache = pts;
  return pts;
}

// What actually varies between real penny types is the headwear -- Victoria
// alone has a "Bun Head" and a "Veiled Head" -- so that's what distinguishes
// the pixel portraits too: one hand-drawn crown/veil/wreath silhouette per
// PENNY_TYPES group, layered onto the shared bust.
var HEADWEAR_BY_GROUP = {
  victoria_bun:       [[5,5],[6,5],[5,6],[6,6]],
  victoria_veiled:    [[7,2],[8,2],[9,2],[6,3],[10,3],[5,4],[5,5],[5,6],[5,7]],
  edward_vii:         [[8,1],[8,2],[7,3],[9,3],[6,4],[10,4]],
  george_v:           [[6,2],[8,1],[10,2],[6,3],[8,3],[10,3],[5,4],[11,4]],
  george_vi:          [[6,3],[7,2],[8,2],[9,2],[10,3]],
  eii_predecimal:     [[7,2],[8,1],[9,2],[6,3],[10,3]],
  eii_decimal_new:    [[6,3],[7,2],[8,2],[9,2],[10,2],[11,3]],
  eii_decimal_bronze: [[6,2],[7,1],[8,1],[9,1],[10,1],[11,2]],
  eii_decimal_steel:  [[6,3],[7,3],[8,2],[9,3],[10,3]],
  charles_iii:        [[5,4],[4,5],[5,6],[10,3],[11,4]]
};
var HEADWEAR_FALLBACK_LIST = Object.keys(HEADWEAR_BY_GROUP).map(function (k) { return HEADWEAR_BY_GROUP[k]; });

// Falls back to a deterministic pick from the curated set above for any
// group not in the hand-drawn list, so new PENNY_TYPES entries still render.
function headwearPixels(groupId) {
  if (HEADWEAR_BY_GROUP[groupId]) return HEADWEAR_BY_GROUP[groupId];
  return HEADWEAR_FALLBACK_LIST[hashString(groupId) % HEADWEAR_FALLBACK_LIST.length];
}

// Two layers so headwear can be colored differently from the bust it sits
// on -- otherwise a 4-9 pixel crown is invisible against an identically
// shaded silhouette. headwear pixels win where the two overlap.
function groupDetailPixels(groupId) {
  if (groupDetailCache[groupId]) return groupDetailCache[groupId];
  var headwear = {};
  headwearPixels(groupId).forEach(function (p) { headwear[p[0] + "," + p[1]] = true; });
  var layers = { bust: bustSilhouette(), headwear: headwear };
  groupDetailCache[groupId] = layers;
  return layers;
}

// The alloy switched from bronze to copper-plated steel in 1992 -- reuse
// that real cutoff so the pixel color matches the coin's actual material.
// It's still a steel core, but what you actually see is the copper plating,
// so post-1992 coins get their own (brighter, pinker) copper tone rather
// than the grey/silver a bare steel coin would have.
function coinMaterial(coin) {
  return coin.year >= 1992 ? "copper_plated" : "bronze";
}

var MATERIAL_COLORS = {
  bronze:        { face: [178, 98, 40], rim: [110, 58, 22], shade: [90, 46, 16], accent: [222, 176, 96], shine: [232, 175, 110] },
  copper_plated: { face: [200, 112, 58], rim: [130, 70, 30], shade: [100, 54, 24], accent: [236, 160, 96], shine: [250, 190, 130] }
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

// Experiment: a Poor-grade coin from before 1970 gets a spot of green
// patina worked into its portrait -- oxidised copper toning that collects
// in the engraved detail of old, heavily-worn coins.
var PATINA_COLOR = [90, 133, 96];
function applyPatina(color) {
  return [
    Math.round(color[0] * 0.35 + PATINA_COLOR[0] * 0.65),
    Math.round(color[1] * 0.35 + PATINA_COLOR[1] * 0.65),
    Math.round(color[2] * 0.35 + PATINA_COLOR[2] * 0.65)
  ];
}

function pixelCoinDataUrl(coin, gradeId) {
  var key = coin.group + "|" + coin.year + "|" + (gradeId || "u") + "|" + coin.rarity;
  var cached = pixelCoinCache[key];
  if (cached) return cached;

  var canvas = document.createElement("canvas");
  canvas.width = PIXEL_GRID;
  canvas.height = PIXEL_GRID;
  var ctx = canvas.getContext("2d");

  var mat = MATERIAL_COLORS[coinMaterial(coin)];
  var layers = groupDetailPixels(coin.group);
  var bust = layers.bust, headwear = layers.headwear;
  var quality = gradeQuality01(gradeId);
  var wearRand = mulberry32(hashString(coin.id + "|" + (gradeId || "u")));
  var ringColor = RARITY_RING[coin.rarity];
  var wearChance = quality < 0.5 ? 0.35 * (0.5 - quality) * 2 : 0;
  // Below Uncirculated, only a light random luster fleck (vfine/efine still
  // have most of their original shine); Uncirculated and Mint get a
  // deliberate glint sweep instead, drawn after this pass.
  var isShiny = gradeId === "unc" || gradeId === "mint";
  var flickChance = !isShiny && quality > 0.55 ? 0.25 * (quality - 0.55) / 0.45 : 0;
  var hasPatina = gradeId === "poor" && coin.year < 1970;

  COIN_MASK.forEach(function (px) {
    var x = px.x, y = px.y;
    var key = x + "," + y;
    var isDetail = bust[key] || headwear[key];
    var color;
    if (ringColor && px.rim) {
      color = ringColor;
    } else if (px.rim) {
      color = mat.rim;
    } else if (headwear[key]) {
      color = mat.accent;
    } else if (bust[key]) {
      color = mat.shade;
    } else {
      color = mat.face;
    }

    if (hasPatina && isDetail && !px.rim) color = applyPatina(color);
    if (!px.rim && !isDetail && wearChance && wearRand() < wearChance) color = mat.shade;
    if (!px.rim && !isDetail && x < 8 && y < 7 && flickChance && wearRand() < flickChance) color = mat.shine;

    ctx.fillStyle = rgb(color);
    ctx.fillRect(x, y, 1, 1);
  });

  if (isShiny) {
    // A diagonal glint sweeping across the face -- the classic "new coin"
    // highlight -- brightest in the middle, fading at each end.
    var band = [[3, 2, 0.5], [4, 3, 0.85], [5, 4, 1], [6, 5, 0.85], [7, 6, 0.5]];
    band.forEach(function (p) {
      ctx.fillStyle = "rgba(" + mat.shine[0] + "," + mat.shine[1] + "," + mat.shine[2] + "," + p[2] + ")";
      ctx.fillRect(p[0], p[1], 1, 1);
    });
  }

  if (gradeId === "mint") {
    // Mint adds a couple of bright twinkles on top of the glint sweep --
    // the "fresh from the mint" sparkle.
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(4, 3, 1, 1);
    ctx.fillRect(10, 9, 1, 1);
  }

  var url = canvas.toDataURL("image/png");
  pixelCoinCache[key] = url;
  return url;
}

function pixelCoinImgHTML(coin, gradeId, sizeClass) {
  var url = pixelCoinDataUrl(coin, gradeId);
  return '<img class="pixel-coin ' + (sizeClass || "") + '" src="' + url + '" width="' + PIXEL_GRID + '" height="' + PIXEL_GRID + '" alt="">';
}
