// MEGS batch 2 items: rewards for reaching each rank, and more skins for the weekly shop.
// Loaded before the game starts so equipped items are known when your save loads.
(function(){
"use strict";
var MG = window.MG, I = MG.ITEMS, BY = MG.ITEM;
function add(t, id, n, r, src, o){ o = o || {}; o.t = t; o.id = id; o.n = n; o.r = r; o.src = src; I.push(o); BY[id] = o; return o; }

// ---- rank rewards: reach a rank and its skin, boots, banner and background are yours for good ----
// [tier, name, colours: main, second, dark, glow, kit pattern, banner motif, rarity]
MG.RANK_ITEMS = {};
[[1, "Silver", "#c9d2e6", "#7d8aa8", "#2a3042", "#e6ecff", "chrome", "rings", 2],
 [2, "Gold", "#ffd23b", "#b8860b", "#2a1d04", "#fff1a8", "gold", "rays", 3],
 [3, "Platinum", "#5ee6d6", "#1f8a80", "#06302c", "#c8fff8", "prism", "hex", 4],
 [4, "Diamond", "#7fb0ff", "#2f5fd0", "#0a1a44", "#e0ecff", "frost", "diamond", 5],
 [5, "Master", "#b266ff", "#5a1fa8", "#1a0836", "#f0d6ff", "nova", "galaxy", 6],
 [6, "Legend", "#ff4f7a", "#ffd23b", "#2a0612", "#ffe0e8", "crown", "aurora", 6]].forEach(function(x){
  var k = x[0], how = "Reach " + x[1] + " in Ranked", o = {rk: k, how: how}, ids = [];
  ids.push(add("kit", "rk_kit" + k, x[1] + " Rank", x[8], "rank", Object.assign({p: x[6], c: [x[2], x[3], x[4]], f: k >= 4 ? "star" : k >= 2 ? "spark" : "", gl: k >= 3 ? x[5] : ""}, o)).id);
  ids.push(add("boot", "rk_boot" + k, x[1] + " Rank Boots", x[8], "rank", Object.assign({c: [x[2], x[3], x[5]], k: k % 3, g: k >= 3 ? x[2] : ""}, o)).id);
  ids.push(add("banner", "rk_bn" + k, x[1] + " Rank", x[8], "rank", Object.assign({mo: x[7], c: [x[2], x[4], x[3]]}, o)).id);
  ids.push(add("scene", "rk_sc" + k, x[1] + " Rank", x[8], "rank", Object.assign({k: "rk" + k}, o)).id);
  MG.RANK_ITEMS[k] = ids;
});
// the rewards for every rank you have reached (guests keep them on this device; accounts get them from the server)
MG.rankGrant = function(){
  var s = MG.S, k, got = []; if (!s) return got;
  for (k = 1; k <= MG.tier(Math.max(s.elo || 0, s.peak || 0)); k++) (MG.RANK_ITEMS[k] || []).forEach(function(id){ if (!s.inv[id]) { s.inv[id] = 1; got.push(BY[id]); } });
  return got;
};

// ---- more skins for the weekly shop ----
[["sh_ember", "Ember Stripe", 1, "stripes", ["#ff6a2b", "#2a0f06", "#1a0904"]],
 ["sh_mint", "Mint Hoops", 1, "hoops", ["#7ff0c4", "#0f3d30", "#0b2a22"]],
 ["sh_dusk", "Dusk Fade", 1, "fade", ["#ff8ad1", "#3b2a7a", "#1a1236"]],
 ["sh_royal", "Royal Sash", 2, "sash", ["#2b3fd6", "#ffd23b", "#0e1440"]],
 ["sh_lime", "Lime Zigzag", 2, "zigzag", ["#c6ff3b", "#18220a", "#11180a"]],
 ["sh_storm", "Storm Halves", 2, "halves", ["#4a5568", "#9ab6ff", "#1a2030"]],
 ["sh_coral", "Coral Wave", 2, "wave", ["#ff7a6a", "#fff1e0", "#3a1610"]],
 ["sh_circuit", "Circuit Board", 3, "circuit", ["#0f3d2a", "#3dff7a", "#06180f"]],
 ["sh_checker", "Checkmate", 3, "checker", ["#f2f2f7", "#14163a", "#14163a"]],
 ["sh_glitch", "Glitch", 3, "glitch", ["#1a1a2e", "#ff2fb3", "#0a0a14"], "spark"],
 ["sh_tiger", "Night Tiger", 4, "tiger", ["#ff9a1f", "#14100a", "#14100a"], "spark"],
 ["sh_scales", "Dragon Scales", 4, "scales", ["#1f8a5b", "#ffd23b", "#0b2a1c"], "star"]].forEach(function(x){
  add("kit", x[0], x[1], x[2], "shop", {p: x[3], c: x[4], f: x[5] || ""});
});
})();
