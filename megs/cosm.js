// MEGS cosmetics: the season catalogue (kits, wraps, boots, emotes, stickers, banners), where each item comes from,
// and how they are drawn: boots, wraps over the shirt, animated materials and auras for the top rarities, stickers and banners.
(function(){
"use strict";
var MG = window.MG, R = MG.R, I = MG.ITEMS, BY = MG.ITEM, PI = Math.PI, TAU = PI * 2, clamp = MG.clamp, lerp = MG.lerp;

// ---- where items come from ----
// pack: packs only. shop: the weekly shop only. pass: the free season pass track. season: the premium track (buyable soon).
// earn: earned by playing. free: everyone starts with it. Items from before this season are pack items unless earned or free.
MG.SRC = {pack: "Packs", shop: "Weekly shop", pass: "Season pass", season: "Season pass premium", earn: "Earned", free: "Starter"};
// seasons have no end date: a season runs until the next one is released by hand. To start one, raise n and set its name
// (the pass then starts again from tier 1 for everyone).
MG.SEASON = {n: 1, name: "Kickoff"};
function add(t, id, n, r, src, o){ o = o || {}; o.t = t; o.id = id; o.n = n; o.r = r; o.src = src; I.push(o); BY[id] = o; return o; }
I.forEach(function(it){ if (!it.src) it.src = it.need || it.how ? "earn" : "pack"; });
["home", "away", "classic", "t_none", "f_conf", "c_street", "e_wave"].forEach(function(k){ if (BY[k]) BY[k].src = "free"; });

var PAL = [
  ["Crimson", "#b3202e", "#ffffff", "#2a0a10"], ["Cobalt", "#1f4fd1", "#ffffff", "#0d1a4a"], ["Emerald", "#0f8a52", "#f2f2f7", "#06301d"], ["Sunset", "#ff7a3d", "#5a1f6b", "#2a0f33"],
  ["Ice", "#dff1ff", "#5aa9e6", "#27507a"], ["Volt", "#d6ff3b", "#17171c", "#17171c"], ["Royal", "#3b1f8a", "#ffd766", "#1a0d3d"], ["Coral", "#ff6f61", "#fff1e6", "#5a1f1a"],
  ["Mint", "#7fffd4", "#0f5a3d", "#0f3d2a"], ["Sand", "#e6d2a6", "#6b4a2a", "#3d2a14"], ["Midnight", "#101633", "#7fb0ff", "#070a1c"], ["Blaze", "#ff5a1f", "#ffd23b", "#3d0a05"],
  ["Lilac", "#c9a6ff", "#3d1f6b", "#2a1440"], ["Teal", "#0e9aa7", "#f2f2f7", "#06363b"], ["Ruby", "#8a0f2e", "#ffb3c6", "#3d0614"], ["Gold", "#d9a93a", "#1a1408", "#3d2c05"],
  ["Charcoal", "#2b2d36", "#ff4f7a", "#14151a"], ["Forest", "#1f4d2b", "#e6d2a6", "#0e2414"], ["Bubblegum", "#ff8ad1", "#ffffff", "#7a2a5a"], ["Ocean", "#0e5a8a", "#7fe0ff", "#062a40"],
  ["Cherry", "#d61f3d", "#17171c", "#17171c"], ["Lime", "#7ed321", "#ffffff", "#2a4a0a"], ["Steel", "#7a8499", "#e9ecf5", "#2a2f3d"], ["Plum", "#5a1f4d", "#ff9ad5", "#2a0a22"],
  ["Copper", "#b8642a", "#ffe0c2", "#3d1f0a"], ["Arctic", "#f4f6ff", "#1f4fd1", "#c9d2e6"], ["Neon", "#ff2fb3", "#2ff3ff", "#14051f"], ["Navy", "#14254f", "#ff5a5a", "#0a1226"],
  ["Tangerine", "#ff9a1f", "#14254f", "#14254f"], ["Jade", "#2faa7a", "#0c2a1f", "#0c2a1f"], ["Slate", "#4a5468", "#9fe870", "#242a36"], ["Rose", "#f2a6b8", "#7a1f3d", "#4a1426"],
  ["Amber", "#ffb938", "#3d2405", "#2a1a05"], ["Indigo", "#3f3fbf", "#c9c9ff", "#1a1a5a"], ["Bone", "#ece6d6", "#2b2d36", "#2b2d36"], ["Graphite", "#1b1c22", "#d9dce8", "#0e0e12"],
  ["Sky", "#7fc4ff", "#0e2a5a", "#0e2a5a"], ["Wine", "#5a0f22", "#e6c48a", "#2a0610"], ["Moss", "#6b7a2a", "#f2ecc9", "#2f3612"], ["Flame", "#ff3d1f", "#ffe66b", "#2a0805"]];
MG.PAL = PAL;

// ---- 70 new kits: 60 cut from the pattern book in season colourways, and the 10 Season 1 signature kits ----
var KP = [["stripes", "Stripes", 1], ["hoops", "Hoops", 1], ["sash", "Sash", 1], ["halves", "Halves", 1], ["quarters", "Quarters", 1], ["pinstripe", "Pinstripe", 1], ["chevron", "Chevron", 1], ["fade", "Fade", 1],
  ["dots", "Dots", 2], ["zigzag", "Zigzag", 2], ["wave", "Wave", 2], ["plaid", "Plaid", 2], ["brush", "Brushwork", 2], ["hex", "Hex", 2], ["carbon", "Carbon", 2],
  ["camo", "Camo", 3], ["digi", "Digital", 3], ["leopard", "Leopard", 3], ["tiger", "Tiger", 3], ["topo", "Contour", 3], ["marble", "Marble", 3], ["circuit", "Circuit", 3], ["scales", "Scales", 3],
  ["flames", "Flames", 4], ["tiedye", "Tie-Dye", 4], ["pixel", "Pixel", 4], ["argyle", "Argyle", 4], ["lava", "Magma", 4]];
var KSRC = ["shop", "shop", "pack", "pack", "shop", "pass", "pack", "shop", "pack", "season"];
(function(){
  var k, p, c;
  for (k = 0; k < 60; k++) {
    p = KP[(k * 11) % KP.length]; c = PAL[(k * 7 + 3) % PAL.length];
    add("kit", "g" + k, c[0] + " " + p[1], p[2], KSRC[k % 10], {p: p[0], c: [c[1], c[2], c[3]], f: p[2] >= 4 ? ["spark", "ember", "star", "frost"][k % 4] : undefined});
  }
})();
add("kit", "s1_flood", "Floodlight", 4, "pass", {p: "fade", c: ["#101633", "#fff1c9", "#070a1c"], f: "spark"});
add("kit", "s1_derby", "Derby Day", 3, "pass", {p: "halves", c: ["#b3202e", "#1f4fd1", "#17171c"]});
add("kit", "s1_hat", "Hat Trick", 4, "season", {p: "chevron", c: ["#17171c", "#ffd23b", "#17171c"], f: "spark"});
add("kit", "s1_boot", "Golden Boot", 5, "season", {p: "gold", c: ["#d9a93a", "#fff3b0", "#3d2c05"], f: "spark", gl: "#ffd766"});
add("kit", "s1_night", "Night Match", 5, "pass", {p: "galaxy", c: ["#0a1238", "#5ee6ff", "#060a22"], f: "star", gl: "#5ee6ff"});
add("kit", "s1_gola", "Golazo", 6, "season", {p: "flames", c: ["#2a0805", "#ffd23b", "#1a0603"], f: "ember", gl: "#ff8a1f"});
add("kit", "s1_trophy", "Trophy Lift", 6, "season", {p: "chrome", c: ["#e6c48a", "#fff6d6", "#5a4410"], f: "corona", gl: "#ffe6a8"});
add("kit", "s1_final", "Final Whistle", 6, "pass", {p: "holo", c: ["#dfe6f2", "#b266ff", "#2a2f3d"], f: "star", gl: "#b266ff"});
add("kit", "s1_champ", "Champion", 7, "season", {p: "crown", c: ["#3b1f8a", "#ffd766", "#1a0d3d"], f: "corona", gl: "#ffd766"});
add("kit", "s1_kick", "Kickoff Supernova", 7, "season", {p: "nova", c: ["#fff1a8", "#ff5a1f", "#3d0a05"], f: "corona", gl: "#ffb938"});

// ---- wraps: a finish laid over whatever shirt you wear ----
add("wrap", "w_none", "No wrap", 0, "free", {});
var WR = [
  ["galaxy", "Galaxy", 5, ["#0a1238", "#b266ff", "#060a22"], "Rose Galaxy", ["#2a0a22", "#ff7ab8", "#14050f"]],
  ["camo", "Woodland Camo", 2, ["#3a4a2a", "#6b7a3a", "#1f2a14"], "Arctic Camo", ["#e9ecf5", "#9aa3b8", "#5a6478"]],
  ["carbon", "Carbon Fibre", 2, ["#14151a", "#3a3d4a", "#0a0a0e"], "Red Carbon", ["#3d0a10", "#b3202e", "#14050a"]],
  ["marble", "White Marble", 3, ["#f2f0ea", "#8a8a96", "#c9c4b8"], "Black Marble", ["#16171c", "#d9d9e6", "#5a5a66"]],
  ["topo", "Contour Map", 2, ["#e6d2a6", "#6b4a2a", "#3d2a14"], "Night Contour", ["#0d1f3d", "#5ee6a8", "#06101f"]],
  ["hex", "Honeycomb", 2, ["#ffb938", "#7a4a05", "#3d2405"], "Cyber Hex", ["#06101f", "#5ee6ff", "#0e2a40"]],
  ["digi", "Digital Desert", 2, ["#d9b98a", "#8a6a3a", "#5a4a2a"], "Digital Urban", ["#5a6070", "#2a2d36", "#9aa0b0"]],
  ["lava", "Molten", 4, ["#1a0d0a", "#ff5a1f", "#0c0605"], "Blue Magma", ["#050a1a", "#3b9bff", "#03060f"]],
  ["wave", "Aurora", 4, ["#0d1f3d", "#5ee6a8", "#b266ff"], "Sunset Tide", ["#3d0f2a", "#ffb938", "#ff4f7a"]],
  ["holo", "Hologram", 5, ["#dfe6f2", "#5ee6ff", "#2a2f3d"], "Iridescent", ["#f4f6ff", "#ff7ab8", "#c9d2e6"]],
  ["chrome", "Liquid Chrome", 6, ["#dfe6f2", "#7a8499", "#2a2f3d"], "Rose Gold", ["#e6b8a6", "#fff1e6", "#7a4a3d"]],
  ["tiedye", "Tie-Dye", 3, ["#ffffff", "#ff4f7a", "#5ee6ff"], "Lagoon Dye", ["#e6fff8", "#3fcf8e", "#3b6ef5"]],
  ["tiger", "Tiger", 3, ["#ff9a1f", "#17171c", "#17171c"], "Snow Tiger", ["#f4f6ff", "#17171c", "#27507a"]],
  ["leopard", "Leopard", 3, ["#e0a94a", "#2a1a0a", "#2a1a0a"], "Pink Leopard", ["#ffb3d9", "#3d0a2a", "#3d0a2a"]],
  ["scales", "Dragon Scale", 4, ["#0f3d2a", "#ff5a1f", "#06170f"], "Serpent", ["#1a2a05", "#d6ff3b", "#0a1402"]],
  ["circuit", "Motherboard", 3, ["#062a1c", "#5ee6a8", "#031710"], "Overclock", ["#1a0612", "#ff4f7a", "#0a0308"]],
  ["pixel", "8-Bit", 3, ["#14254f", "#ffd23b", "#0a1226"], "Arcade", ["#17171c", "#ff2fb3", "#2ff3ff"]],
  ["nova", "Supernova", 7, ["#fff1a8", "#ff5a1f", "#3d0a05"], "Blue Giant", ["#e6f4ff", "#3b9bff", "#05102a"]],
  ["void", "Event Horizon", 6, ["#050308", "#8a3dff", "#050308"], "Black Hole Sun", ["#050308", "#ffb938", "#050308"]],
  ["frost", "Frostbite", 4, ["#dff6ff", "#5aa9e6", "#27507a"], "Glacier", ["#bfe9ff", "#ffffff", "#0e5a8a"]],
  ["sakura", "Sakura", 5, ["#ffd6e6", "#ff7ab8", "#5a1f3d"], "Moon Blossom", ["#1a1033", "#e6d6ff", "#0a0618"]],
  ["toxic", "Biohazard", 5, ["#0c1408", "#a6ff3b", "#0c1408"], "Acid Rain", ["#08101a", "#38e1ff", "#04080d"]],
  ["flames", "Inferno", 4, ["#17171c", "#ff8a1f", "#17171c"], "Ghost Fire", ["#0a0f1a", "#5ee6ff", "#05080d"]],
  ["prism", "Prism", 6, ["#ffffff", "#ff4f7a", "#22243f"], "Dark Prism", ["#0a0a12", "#b266ff", "#000000"]],
  ["glitch", "Glitch", 5, ["#101425", "#ff2fb3", "#2ff3ff"], "Corrupted", ["#000000", "#a6ff3b", "#ff3d1f"]]];
var WSRC = ["pack", "shop", "pass", "shop", "pack"];
WR.forEach(function(w, k){
  add("wrap", "w_" + w[0], w[1], w[2], WSRC[k % 5], {p: w[0], c: w[3]});
  add("wrap", "w_" + w[0] + "2", w[4], Math.min(7, w[2] + (k % 3 === 0 ? 1 : 0)), WSRC[(k + 2) % 5], {p: w[0], c: w[5]});
});
BY.w_nova2.src = "season"; BY.w_void.src = "season"; BY.w_galaxy.src = "pass";

// ---- boots ----
var BM = ["Strike", "Sprint", "Velocity", "Phantom", "Pulse", "Volt", "Edge", "Rapid", "Apex", "Blade"];
add("boot", "bt_std", "Standard Black", 0, "free", {c: ["#1b1b22", "#e9ebf5", "#e9ebf5"], k: 0});
(function(){
  var k, c, r, src;
  for (k = 0; k < 49; k++) {
    c = PAL[(k * 13 + 5) % PAL.length]; r = [1, 1, 2, 1, 2, 3, 1, 2, 3, 4, 2, 3, 5, 1, 2, 4, 6, 3, 2, 7][k % 20];
    src = ["shop", "pack", "pack", "pass", "shop", "pack", "season"][k % 7];
    add("boot", "bt" + k, c[0] + " " + BM[k % 10], r, src, {c: [c[1], c[2], r >= 5 ? c[2] : "#e9ebf5"], k: r >= 5 ? 3 : k % 3, g: r >= 4 ? c[2] : ""});
  }
})();

// ---- emotes: 41 new moves built from an upper-body action and a footwork pattern ----
var UP = {
  wave: function(q, t){ q.uR = 2.5; q.oR = 0.9 + 0.35 * Math.sin(t * 9); q.eR = 0.6; },
  clap: function(q, t){ q.uL = q.uR = 1.3; q.oL = q.oR = 0.05 + 0.35 * Math.abs(Math.sin(t * 6)); q.eL = q.eR = 0.9; },
  point: function(q, t){ q.uR = 2.1; q.eR = 0.05; q.oR = 0.25; q.uL = 0.1; },
  pump: function(q, t){ q.uR = 1.9 + 0.7 * Math.abs(Math.sin(t * 7)); q.eR = 1.8; q.oR = 0.4; },
  shrug: function(q, t){ var w = Math.abs(Math.sin(t * 3)); q.uL = q.uR = 0.5; q.eL = q.eR = 1.6; q.oL = q.oR = 1.1 + 0.3 * w; q.nod = 0.3 * w; },
  cross: function(q, t){ q.uL = q.uR = 1.2; q.eL = q.eR = 2.4; q.oL = q.oR = -0.25; q.lean = -0.06; },
  head: function(q, t){ q.uL = q.uR = 2.6; q.eL = q.eR = 2.6; q.oL = q.oR = 1.1; },
  roof: function(q, t){ var w = Math.abs(Math.sin(t * 6)); q.uL = q.uR = 2.4 + 0.5 * w; q.eL = q.eR = 1.6 - 1.4 * w; q.oL = q.oR = 0.5; },
  swim: function(q, t){ q.uL = (t * 6) % TAU; q.uR = (t * 6 + PI) % TAU; q.eL = q.eR = 0.25; q.oL = q.oR = 0.25; },
  dab: function(q, t){ var w = Math.min(1, (t * 1.2) % 2); q.uL = 2.2 * w; q.oL = 0.35; q.eL = 0.1; q.uR = 1.5 * w; q.oR = -0.35; q.eR = 2.6 * w; q.nod = 0.6 * w; },
  baton: function(q, t){ q.uR = 1.6 + 0.6 * Math.sin(t * 5); q.eR = 0.8 + 0.7 * Math.cos(t * 5); q.oR = 0.5; q.uL = 1.2; q.eL = 1.4; },
  drum: function(q, t){ q.uL = 1.0 + 0.45 * Math.sin(t * 13); q.uR = 1.0 - 0.45 * Math.sin(t * 13); q.eL = q.eR = 1.2; q.oL = q.oR = 0.3; },
  halo: function(q, t){ q.uL = q.uR = 2.95; q.eL = q.eR = 1.5; q.oL = q.oR = 0.9; },
  tpose: function(q, t){ q.uL = q.uR = 0; q.oL = q.oR = 1.57; q.eL = q.eR = 0; },
  box: function(q, t){ q.uL = q.uR = 1.5; q.oL = q.oR = 0.2; q.eL = 0.2 + 1.8 * Math.max(0, Math.sin(t * 8)); q.eR = 0.2 + 1.8 * Math.max(0, -Math.sin(t * 8)); },
  guitar: function(q, t){ q.uL = 1.2; q.eL = 1.0; q.oL = 0.3; q.uR = 0.9; q.eR = 1.3 + 0.5 * Math.sin(t * 14); q.oR = 0.2; },
  salute: function(q, t){ q.uR = 2.2; q.oR = 0.9; q.eR = 2.3; q.uL = 0.05; q.eL = 0.05; },
  flex: function(q, t){ q.uL = q.uR = 1.6; q.oL = q.oR = 1.2; q.eL = q.eR = 2 + 0.25 * Math.sin(t * 5); }
};
var LO = {
  still: function(q, t, x){},
  hop: function(q, t, x){ var w = Math.abs(Math.sin(t * 5)); q.z = 0.24 * w; q.bL = q.bR = 0.35 * (1 - w); },
  bounce: function(q, t, x){ q.bL = q.bR = 0.35 + 0.35 * Math.abs(Math.sin(t * 6)); q.aL = q.aR = 0.25; q.lean = 0.12; },
  side: function(q, t, x){ var w = Math.sin(t * 3); x.x = 0.3 * w; q.sL = 0.08 + 0.2 * Math.max(0, w); q.sR = 0.08 + 0.2 * Math.max(0, -w); },
  spin: function(q, t, x){ x.turn = t * 5; },
  kneel: function(q, t, x){ q.z = -0.34; q.bL = q.bR = 2; q.aL = q.aR = -0.5; q.lean = -0.1; },
  march: function(q, t, x){ var w = Math.sin(t * 5); q.aL = 1.0 * Math.max(0, w); q.aR = 1.0 * Math.max(0, -w); q.bL = 1.3 * Math.max(0, w); q.bR = 1.3 * Math.max(0, -w); },
  squat: function(q, t, x){ var w = Math.sin(t * 3); q.bL = q.bR = 1.2 + 0.3 * w; q.aL = q.aR = 0.75 + 0.15 * w; q.lean = 0.25; q.z = -0.2 - 0.06 * w; q.sL = q.sR = 0.25; },
  lean: function(q, t, x){ q.lean = -0.28 + 0.1 * Math.sin(t * 2); q.bL = q.bR = 0.4; },
  twist: function(q, t, x){ q.roll = 0.3 * Math.sin(t * 6); x.turn = 0.35 * Math.sin(t * 3); q.bL = q.bR = 0.3; },
  kick: function(q, t, x){ var w = Math.max(0, Math.sin(t * 4)); q.aR = 1.5 * w; q.bR = 0.3 * (1 - w); q.lean = -0.12 * w; },
  sway: function(q, t, x){ q.roll = 0.16 * Math.sin(t * 3); x.x = 0.12 * Math.sin(t * 3); }
};
var EM = [["wave", "hop", "Wave and Hop", 1], ["clap", "bounce", "Clap Along", 1], ["point", "still", "Point to the Crowd", 1], ["pump", "hop", "Fist Pump", 1], ["shrug", "sway", "Shrug It Off", 1],
  ["cross", "lean", "Unbothered", 1], ["head", "still", "Hands on Head", 1], ["roof", "bounce", "Raise the Roof", 2], ["swim", "sway", "Victory Swim", 2], ["dab", "still", "Dab", 2],
  ["baton", "sway", "Conductor", 2], ["drum", "bounce", "Drum Roll", 2], ["halo", "spin", "Halo Spin", 3], ["tpose", "spin", "Helicopter", 3], ["box", "side", "Shadow Boxing", 2],
  ["guitar", "lean", "Air Guitar", 3], ["clap", "spin", "Spin and Clap", 2], ["pump", "march", "Marching Band", 2], ["roof", "squat", "Squat Pump", 3], ["guitar", "kneel", "Rock Star Slide", 4],
  ["wave", "twist", "Twist and Wave", 1], ["point", "kick", "Pointed Kick", 2], ["wave", "sway", "Sway and Wave", 1], ["point", "kneel", "Knee and Point", 3], ["clap", "side", "Side Step Clap", 1],
  ["dab", "bounce", "Bounce Dab", 3], ["roof", "spin", "Tornado", 4], ["box", "hop", "Prize Fighter", 3], ["salute", "march", "On Parade", 2], ["flex", "squat", "Gym Rat", 3],
  ["flex", "spin", "Show Off", 4], ["halo", "kneel", "Blessed", 4], ["shrug", "side", "Not Bothered", 2], ["swim", "kneel", "Belly Flop", 3], ["drum", "march", "Drumline", 3],
  ["baton", "spin", "Maestro", 5], ["tpose", "hop", "Airplane Mode", 2], ["head", "twist", "Disbelief", 2], ["cross", "kick", "Too Cool", 3], ["pump", "spin", "Spinning Pump", 4], ["guitar", "spin", "Guitar Solo", 5]];
EM.forEach(function(e, k){
  var key = "g" + k;
  R.EMOTE[key] = function(q, t){ var x = {}; LO[e[1]](q, t, x); UP[e[0]](q, t); return x; };
  add("emote", "e_g" + k, e[2], e[3], ["pack", "shop", "pass", "pack", "shop", "season"][k % 6], {k: key});
});

// ---- stickers: quick chat in matches (number keys 1 to 4) and on your result screen ----
var EYES = ["dot", "happy", "wink", "star", "shades", "angry", "cry", "dizzy", "sleepy", "wide"], MOUTH = ["smile", "grin", "o", "frown", "tongue", "flat", "teeth", "smirk"];
var ST = [
  ["text", "GG", ["#3b6ef5", "#ffffff"], "GG", 0], ["text", "NICE", ["#1f9d62", "#ffffff"], "Nice", 0], ["text", "WOW", ["#b266ff", "#ffffff"], "Wow", 0], ["text", "OOPS", ["#e6705e", "#ffffff"], "Oops", 0],
  ["text", "GOAL", ["#ffd23b", "#17171c"], "Goal", 1], ["text", "SAVED", ["#0e9aa7", "#ffffff"], "Saved", 1], ["text", "SORRY", ["#4a5468", "#ffffff"], "Sorry", 1], ["text", "THANKS", ["#ff7ab8", "#ffffff"], "Thanks", 1],
  ["text", "CLOSE", ["#ff9a1f", "#17171c"], "Close one", 1], ["text", "GLHF", ["#14254f", "#7fe0ff"], "GLHF", 1], ["text", "LOL", ["#d6ff3b", "#17171c"], "LOL", 2], ["text", "WHAT", ["#ff3d1f", "#ffffff"], "What a save", 2],
  ["text", "REMATCH", ["#8a0f2e", "#ffd766"], "Rematch", 2], ["text", "CALM", ["#7fc4ff", "#0e2a5a"], "Calm down", 2], ["text", "HOW", ["#5a1f4d", "#ff9ad5"], "How", 3], ["text", "LEGEND", ["#3b1f8a", "#ffd766"], "Legend", 4],
  ["face", "#ffd23b", "happy", "smile", "Happy", 0], ["face", "#ffd23b", "dot", "grin", "Grin", 1], ["face", "#ffd23b", "wink", "tongue", "Cheeky", 1], ["face", "#ffd23b", "star", "o", "Starstruck", 2],
  ["face", "#ffd23b", "shades", "smirk", "Too Cool", 2], ["face", "#ff6b4a", "angry", "frown", "Fuming", 1], ["face", "#7fc4ff", "cry", "frown", "Gutted", 1], ["face", "#ffd23b", "dizzy", "o", "Dizzy", 2],
  ["face", "#ffd23b", "sleepy", "flat", "Snoozing", 1], ["face", "#ffd23b", "wide", "o", "Shocked", 1], ["face", "#5ee6a8", "dot", "teeth", "Nervous", 2], ["face", "#b266ff", "star", "grin", "Superstar", 3],
  ["face", "#ffd23b", "cry", "grin", "Tears of Joy", 2], ["face", "#ff8ad1", "happy", "o", "Aww", 2], ["face", "#9aa0b8", "dot", "flat", "Unimpressed", 1], ["face", "#ffd23b", "wink", "smirk", "Wink", 1],
  ["face", "#d6ff3b", "dizzy", "tongue", "Wobbly", 3], ["face", "#3b6ef5", "shades", "grin", "Ice Cold", 4], ["face", "#ff3d1f", "angry", "teeth", "Raging", 3], ["face", "#f4f6ff", "wide", "frown", "Ghosted", 3],
  ["icon", "ball", "#ffffff", "Ball", 0], ["icon", "trophy", "#ffd23b", "Trophy", 2], ["icon", "crown", "#ffd766", "Crown", 3], ["icon", "flame", "#ff8a1f", "On Fire", 2], ["icon", "bolt", "#ffe66b", "Lightning", 2],
  ["icon", "star", "#ffd23b", "Star Player", 1], ["icon", "boot", "#5ee6a8", "Boot", 1], ["icon", "whistle", "#c9cde6", "Whistle", 1], ["icon", "glove", "#3b9bff", "Safe Hands", 2], ["icon", "clock", "#f4f6ff", "Time Wasting", 2],
  ["icon", "medal", "#ff9a1f", "Medal", 2], ["icon", "target", "#ff4f7a", "Top Bins", 3], ["icon", "net", "#ffffff", "Back of the Net", 3], ["icon", "goat", "#e6d2a6", "Greatest", 5]];
ST.forEach(function(s, k){
  var o = s[0] === "face" ? {k: "face", fc: s[1], e: s[2], m: s[3]} : s[0] === "icon" ? {k: "icon", i: s[1], fc: s[2]} : {k: "text", s: s[1], cc: s[2]};
  add("sticker", "st" + k, s[0] === "text" ? s[3] : s[s.length - 2], s[s.length - 1], k < 4 ? "free" : ["pack", "shop", "pass", "pack", "season"][k % 5], o);
});

// ---- banners: the card behind your name ----
var BMOT = ["stripes", "chevron", "waves", "stars", "hex", "rings", "grid", "rays", "peaks", "city", "flames", "bolt", "confetti", "checker", "topo", "galaxy", "circuit", "dots", "diamond", "aurora"];
var BN = [["Street", 0], ["Kickoff", 1], ["Floodlights", 1], ["Terrace", 1], ["Derby", 1], ["Sunday League", 1], ["Rooftop", 2], ["Harbour", 2], ["Night Shift", 2], ["Golden Hour", 3],
  ["Thunder Road", 3], ["Neon Alley", 3], ["Frontline", 2], ["Overtime", 2], ["Penalty Box", 1], ["Cup Run", 3], ["Hall of Fame", 4], ["Wildfire", 4], ["Deep Space", 5], ["Starlight", 5],
  ["Monsoon", 2], ["Dune Sea", 2], ["Glacier", 3], ["Volcano", 4], ["Jungle", 2], ["Arcade", 3], ["Synthwave", 4], ["Blueprint", 2], ["Chalkboard", 1], ["Graffiti", 3],
  ["Crown Jewels", 5], ["Eclipse", 6], ["Aurora", 6], ["Prism", 6], ["Nebula", 7], ["Big Bang", 7], ["Champions", 5], ["Captain", 3], ["Wonderkid", 2], ["Veteran", 2],
  ["Midnight Oil", 3], ["Matchday", 1], ["Cold Snap", 2], ["Heatwave", 3], ["Riverside", 2], ["Skyline", 3], ["Moonlit", 4], ["Comet", 5], ["Supernova", 7], ["Infinity", 6]];
BN.forEach(function(b, k){
  var c = PAL[(k * 9 + 2) % PAL.length];
  add("banner", "bn" + k, b[0], b[1], k === 0 ? "free" : ["shop", "pack", "pass", "shop", "pack", "season"][k % 6], {mo: BMOT[k % BMOT.length], c: [c[1], c[3], c[2]]});
});
BY.bn0.src = "free";

// a few hand-picked season pass rewards
["s1_flood", "s1_derby", "s1_night", "s1_final", "w_galaxy", "bt3", "bn2", "bn9", "st7", "e_g2"].forEach(function(k){ if (BY[k]) BY[k].src = "pass"; });
["s1_hat", "s1_boot", "s1_gola", "s1_trophy", "s1_champ", "s1_kick", "w_nova2", "w_void", "bn49", "bn35", "e_g40", "e_g35"].forEach(function(k){ if (BY[k]) BY[k].src = "season"; });

// ---- drawing ----
function hexA(c, a){ var n = parseInt(c.slice(1), 16); return "rgba(" + (n >> 16) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")"; }
MG.hexA = hexA;

// boots, wraps and top-tier flair are filled into the side the renderer builds
R.dress = function(sd, s){
  var bt = BY[s.boot] || BY.bt_std, wr = BY[s.wrap], it = sd.it, num, m;
  if (s.calm) sd.tier = Math.min(sd.tier || 0, 4);   // team-mates wear your kit without the full light show
  sd.bootc = bt.c; sd.bootk = bt.k; sd.bootr = bt.r; sd.bootg = bt.g || ""; sd.boot = bt.c[0];
  sd.fc = it.gl || (it.c && it.c[1]) || "#ffffff";
  if (wr && wr.p && !sd.hd) {
    num = it.num || (s.look && s.look.num) || 7;
    m = BY["~" + wr.id + "~" + it.id] || {id: "~" + wr.id + "~" + it.id, p: wr.p, c: [wr.c[0], wr.c[1], sd.col[2]], t: "kit", r: wr.r};
    sd.tex = [R.kitTex(m, 0, num), R.kitTex(m, 1, num)]; sd.wrap = R.wrapTex(m, num); sd.col = m.c; sd.p = wr.p; sd.mat = wr.p;
    sd.tier = s.calm ? Math.min(4, wr.r) : Math.max(sd.tier || 0, wr.r); sd.fc = wr.c[1];
    if (wr.r >= 4) sd.aura = sd.aura || ({galaxy: "star", nova: "corona", void: "void", lava: "ember", flames: "ember", frost: "frost", toxic: "toxic", sakura: "petal", chrome: "chrome", prism: "star", holo: "star", glitch: "bolt", wave: "star", scales: "ember"})[wr.p] || "spark";
  }
};

R.boot = function(g, a, b, s, sd, t){
  var c = sd.bootc || [sd.boot, "#e9ebf5", "#e9ebf5"], k = sd.bootk || 0, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, w = 0.13 * s, glow = sd.bootr >= 4 && sd.bootg;
  if (glow) { g.save(); g.shadowColor = sd.bootg; g.shadowBlur = Math.max(4, s * (0.08 + 0.05 * Math.sin(t * 4))); }
  R.limb(g, a, b, w, c[0]);
  if (glow) g.restore();
  g.lineCap = "round";
  if (k === 1) { g.lineWidth = Math.max(1, w * 0.32); g.strokeStyle = c[1]; g.beginPath(); g.moveTo(lerp(a.x, b.x, 0.15), lerp(a.y, b.y, 0.15)); g.lineTo(lerp(a.x, b.x, 0.85), lerp(a.y, b.y, 0.85)); g.stroke(); }
  else if (k === 2) { g.lineWidth = w * 0.9; g.strokeStyle = c[1]; g.beginPath(); g.moveTo(lerp(a.x, b.x, 0.62), lerp(a.y, b.y, 0.62)); g.lineTo(b.x, b.y); g.stroke(); }
  else if (k === 3) {
    g.lineWidth = Math.max(1, w * 0.28); g.strokeStyle = c[1]; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.globalAlpha = 1;
    if (sd.bootr >= 5) { g.fillStyle = c[1]; R.star(g, mx + Math.cos(t * 3) * w, my + Math.sin(t * 5) * w * 0.6, Math.max(1.5, w * (0.35 + 0.25 * Math.sin(t * 7))), 4, t); g.fill(); }
  }
  else { g.lineWidth = Math.max(1, w * 0.25); g.strokeStyle = c[2]; g.beginPath(); g.moveTo(lerp(a.x, b.x, 0.1), lerp(a.y, b.y, 0.1) + w * 0.42); g.lineTo(lerp(a.x, b.x, 0.95), lerp(a.y, b.y, 0.95) + w * 0.42); g.stroke(); }
};

// ---- living materials: drawn over the shirt texture (80 by 100 units) for Mythic and above ----
var MC = {};
function seeded(key, n){ var r, a, i; if (MC[key]) return MC[key]; r = MG.rng(key.length * 977 + n); a = []; for (i = 0; i < n; i++) a.push([r(), r(), r(), r()]); return MC[key] = a; }
R.mat = function(g, sd, t){
  var m = sd.mat, c = sd.col, f = sd.fc, i, p, a, x, y, u, gr, tier = sd.tier;
  g.save();
  if (m === "galaxy" || m === "void" || m === "cons") {
    p = seeded("gal", 40);
    for (i = 0; i < 3; i++) { a = t * 0.15 + i * 2.1; x = 40 + Math.cos(a) * 22; y = 50 + Math.sin(a * 1.3) * 30; gr = g.createRadialGradient(x, y, 1, x, y, 30); gr.addColorStop(0, hexA(i === 1 ? "#ff7ab8" : f, 0.45)); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 80, 100); }
    g.fillStyle = "#ffffff";
    for (i = 0; i < p.length; i++) { u = p[i]; x = (u[0] * 80 + t * (2 + u[2] * 5)) % 80; y = u[1] * 100; g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (1 + u[3] * 3) + i)); g.fillRect(x, y, 1.1 + u[2] * 1.4, 1.1 + u[2] * 1.4); }
    if (m === "void") { g.globalAlpha = 0.6; g.strokeStyle = f; g.lineWidth = 1.4; for (i = 0; i < 3; i++) { g.beginPath(); g.arc(40, 50, 8 + i * 9, t * (1.5 - i * 0.3), t * (1.5 - i * 0.3) + 2.2); g.stroke(); } gr = g.createRadialGradient(40, 50, 0, 40, 50, 12); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(20, 30, 40, 40); }
  }
  else if (m === "nova" || m === "corona" || m === "crown" || m === "gold") {
    a = 0.5 + 0.5 * Math.sin(t * 3); gr = g.createRadialGradient(40, 46, 2, 40, 46, 34 + 8 * a); gr.addColorStop(0, "rgba(255,255,240," + (0.55 + 0.3 * a) + ")"); gr.addColorStop(0.4, hexA(f, 0.35)); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 80, 100);
    g.globalAlpha = 0.28; g.fillStyle = "#fffbe6"; for (i = 0; i < 10; i++) { a = t * 0.4 + i * TAU / 10; g.beginPath(); g.moveTo(40, 46); g.lineTo(40 + Math.cos(a - 0.06) * 70, 46 + Math.sin(a - 0.06) * 70); g.lineTo(40 + Math.cos(a + 0.06) * 70, 46 + Math.sin(a + 0.06) * 70); g.fill(); }
  }
  else if (m === "lava" || m === "flames" || m === "scales") {
    p = seeded("lava", 7); g.lineCap = "round";
    for (i = 0; i < p.length; i++) { u = p[i]; g.strokeStyle = i & 1 ? "#ffd23b" : f; g.lineWidth = 1.5 + u[2] * 2; g.globalAlpha = 0.35 + 0.55 * Math.max(0, Math.sin(t * 2.5 + i * 1.7)); g.shadowColor = f; g.shadowBlur = 6; g.beginPath(); x = u[0] * 80; y = u[1] * 100; g.moveTo(x, y); g.lineTo(x + (u[2] - 0.5) * 24, y + 12); g.lineTo(x + (u[3] - 0.5) * 30, y + 26); g.stroke(); }
    g.shadowBlur = 0; p = seeded("ember", 12); g.fillStyle = "#ffd23b";
    for (i = 0; i < p.length; i++) { u = p[i]; y = 100 - ((t * (12 + u[2] * 18) + u[1] * 100) % 110); g.globalAlpha = clamp(y / 60, 0, 1) * 0.9; g.fillRect(u[0] * 80 + Math.sin(t * 3 + i) * 3, y, 1.8, 1.8); }
  }
  else if (m === "holo" || m === "prism" || m === "chrome") {
    x = ((t * 45) % 200) - 60; gr = g.createLinearGradient(x, 0, x + 50, 100);
    ["rgba(255,79,122,0)", "rgba(255,79,122,.45)", "rgba(255,210,59,.45)", "rgba(94,230,168,.45)", "rgba(94,230,255,.45)", "rgba(178,102,255,.45)", "rgba(178,102,255,0)"].forEach(function(s, n){ gr.addColorStop(n / 6, s); });
    g.fillStyle = gr; g.fillRect(0, 0, 80, 100);
    g.globalAlpha = 0.5; g.fillStyle = "#ffffff"; x = ((t * 70) % 240) - 80; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 8, 0); g.lineTo(x - 22, 100); g.lineTo(x - 30, 100); g.fill();
  }
  else if (m === "frost") { p = seeded("frost", 18); g.fillStyle = "#ffffff"; for (i = 0; i < p.length; i++) { u = p[i]; a = Math.max(0, Math.sin(t * (2 + u[2] * 2) + i * 2.3)); if (a > 0.2) { g.globalAlpha = a; R.star(g, u[0] * 80, u[1] * 100, 1.5 + a * 2.5, 4, 0); g.fill(); } } }
  else if (m === "glitch") { p = seeded("gl" + Math.floor(t * 8), 5); for (i = 0; i < p.length; i++) { u = p[i]; g.globalAlpha = 0.7; g.fillStyle = [c[1], "#2ff3ff", "#ff2fb3"][i % 3]; g.fillRect((u[0] - 0.5) * 20, u[1] * 100, 80, 2 + u[2] * 6); } }
  else if (m === "toxic") { p = seeded("tox", 14); g.strokeStyle = f; g.lineWidth = 1; for (i = 0; i < p.length; i++) { u = p[i]; y = 100 - ((t * (8 + u[2] * 14) + u[1] * 100) % 110); g.globalAlpha = 0.8; g.beginPath(); g.arc(u[0] * 80 + Math.sin(t * 2 + i) * 2, y, 1.5 + u[3] * 3, 0, TAU); g.stroke(); } }
  else if (m === "sakura") { p = seeded("sak", 12); g.fillStyle = f; for (i = 0; i < p.length; i++) { u = p[i]; y = (t * (6 + u[2] * 8) + u[1] * 100) % 110 - 5; x = u[0] * 80 + Math.sin(t * 1.5 + i) * 6; g.globalAlpha = 0.85; g.beginPath(); g.ellipse(x, y, 3.5, 1.8, t * 2 + i, 0, TAU); g.fill(); } }
  else if (m === "wave" || m === "aurora") { for (i = 0; i < 3; i++) { g.globalAlpha = 0.32; g.fillStyle = [f, c[2], "#5ee6ff"][i]; g.beginPath(); g.moveTo(0, 100); for (x = 0; x <= 80; x += 8) g.lineTo(x, 30 + i * 18 + 8 * Math.sin(x * 0.09 + t * (1.2 + i * 0.4) + i)); g.lineTo(80, 100); g.fill(); } }
  else if (m === "bolt" || m === "plate" || m === "circuit") { if ((t * 3) % 2 < 0.35) { g.strokeStyle = "#eaf6ff"; g.lineWidth = 1.6; g.shadowColor = f; g.shadowBlur = 8; g.globalAlpha = 0.9; g.beginPath(); x = 20 + ((Math.floor(t * 3) * 37) % 40); g.moveTo(x, 0); for (y = 0; y <= 100; y += 14) g.lineTo(x + Math.sin(y * 7 + Math.floor(t * 3)) * 8, y); g.stroke(); } }
  else {   // any other pattern at this rarity gets a slow sheen and a pulse of its accent colour
    a = 0.5 + 0.5 * Math.sin(t * 2.4); g.globalAlpha = 0.22 * a; g.fillStyle = f; g.fillRect(0, 0, 80, 100);
    x = ((t * 40) % 220) - 70; g.globalAlpha = 0.35; g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 12, 0); g.lineTo(x - 18, 100); g.lineTo(x - 30, 100); g.fill();
  }
  g.restore();
};

// ---- auras for the top rarities, drawn around the figure. phase 0 is behind the body, 1 in front ----
// P(forward, right, up) projects a point in the player's own frame; d is its depth (bigger is further away)
R.flair = function(g, P, J, HD, hip, s, sd, c, sg, t, phase){
  var tier = sd.tier, f = sd.fc || "#ffffff", ctr = P(0, 0, hip + 0.3), i, a, p, q, u, k, n, h;
  g.save(); g.lineCap = "round";
  function front(pt){ return pt.d < ctr.d; }
  // Mythic: a pulsing ring of light at the feet and sparks rising round the body
  if (phase === 0) {
    a = 0.5 + 0.5 * Math.sin(t * 3); g.globalAlpha = 0.35 + 0.25 * a; g.strokeStyle = f; g.lineWidth = Math.max(1.5, s * 0.035); g.beginPath(); for (i = 0; i <= 24; i++) { p = P(Math.cos(i * TAU / 24) * (0.42 + 0.06 * a), Math.sin(i * TAU / 24) * (0.42 + 0.06 * a), 0.01); g.lineTo(p.x, p.y); } g.stroke();
  }
  n = tier >= 7 ? 10 : 7;
  for (i = 0; i < n; i++) {
    u = (t * 0.55 + i / n) % 1; a = i * 2.4 + t * 0.6; p = P(Math.cos(a) * 0.38, Math.sin(a) * 0.38, 0.15 + u * 2.1);
    if (front(p) !== !!phase) continue;
    g.globalAlpha = Math.sin(u * PI) * 0.9; g.fillStyle = i & 1 ? "#ffffff" : f; R.star(g, p.x, p.y, Math.max(1.4, s * 0.035), 4, t + i); g.fill();
  }
  // Exotic: two ribbons of energy wrapping round the body
  if (tier >= 6) {
    g.lineWidth = Math.max(1.5, s * 0.03);
    for (k = 0; k < 2; k++) {
      for (i = 0; i < 28; i++) {
        a = t * (k ? -2.1 : 1.7) + i * 0.16; h = hip + 0.15 + k * 0.5 + 0.22 * Math.sin(a * 1.5 + k);
        p = P(Math.cos(a) * 0.5, Math.sin(a) * 0.5, h); q = P(Math.cos(a + 0.16) * 0.5, Math.sin(a + 0.16) * 0.5, hip + 0.15 + k * 0.5 + 0.22 * Math.sin((a + 0.16) * 1.5 + k));
        if (front(p) !== !!phase) continue;
        g.globalAlpha = (i / 28) * 0.85; g.strokeStyle = k ? "#ffffff" : f; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      }
    }
  }
  // Celestial: a halo and stars in orbit (no rays behind: they were too big and too slow)
  if (tier >= 7) {
    g.lineWidth = Math.max(1.5, s * 0.03); g.strokeStyle = "#ffe9a8";
    for (i = 0; i < (sd.halo === false ? 0 : 20); i++) {   // only skins that have a halo get one
      p = P(Math.cos(i * TAU / 20) * 0.2, Math.sin(i * TAU / 20) * 0.2, hip + 1.32 + 0.03 * Math.sin(t * 2)); q = P(Math.cos((i + 1) * TAU / 20) * 0.2, Math.sin((i + 1) * TAU / 20) * 0.2, hip + 1.32 + 0.03 * Math.sin(t * 2));
      if (front(p) !== !!phase) continue;
      g.globalAlpha = 0.25; g.lineWidth = Math.max(3, s * 0.08); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
      g.globalAlpha = 0.95; g.lineWidth = Math.max(1.5, s * 0.03); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
    }
    for (i = 0; i < 3; i++) {
      a = t * 1.3 + i * TAU / 3; p = P(Math.cos(a) * 0.72, Math.sin(a) * 0.72, hip + 0.4 + 0.35 * Math.sin(a * 2 + i));
      if (front(p) !== !!phase) continue;
      g.globalAlpha = 1; g.fillStyle = "#ffffff"; R.star(g, p.x, p.y, Math.max(2.5, s * 0.07), 4, t * 2 + i); g.fill();
    }
  }
  g.restore();
};

// ---- stickers ----
function rr(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
MG.rr = rr;
R.sticker = function(g, id, cx, cy, S, t){
  var it = BY[id], k = it && it.k, r = S / 2, gr, i, a;
  if (!it) return;
  g.save(); g.lineCap = g.lineJoin = "round";
  if (k === "text") {
    g.font = "900 " + Math.round(S * (it.s.length > 5 ? 0.24 : it.s.length > 3 ? 0.3 : 0.4)) + "px " + R.FONT; a = Math.max(S * 0.8, g.measureText(it.s).width + S * 0.3);
    g.fillStyle = "rgba(8,9,22,.55)"; rr(g, cx - a / 2 + 2, cy - S * 0.27 + 3, a, S * 0.54, S * 0.16); g.fill();
    g.fillStyle = it.cc[0]; rr(g, cx - a / 2, cy - S * 0.27, a, S * 0.54, S * 0.16); g.fill(); g.lineWidth = Math.max(1.5, S * 0.04); g.strokeStyle = "rgba(255,255,255,.85)"; g.stroke();
    g.fillStyle = it.cc[1]; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(it.s, cx, cy + S * 0.02);
  }
  else if (k === "face") {
    g.fillStyle = "rgba(8,9,22,.5)"; g.beginPath(); g.arc(cx + 2, cy + 3, r * 0.9, 0, TAU); g.fill();
    gr = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r * 0.95); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.25, it.fc); gr.addColorStop(1, MG.mix ? MG.mix(it.fc, "#000000", 0.35) : it.fc);
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r * 0.9, 0, TAU); g.fill(); g.lineWidth = Math.max(1.5, S * 0.035); g.strokeStyle = "rgba(8,9,22,.7)"; g.stroke();
    eyes(g, it.e, cx, cy - r * 0.15, r, t); mouth(g, it.m, cx, cy + r * 0.38, r, t);
  }
  else icon(g, it.i, cx, cy, r, it.fc, t);
  g.restore();
};
function eyes(g, e, cx, cy, r, t){
  var i, x, d = r * 0.3;
  g.fillStyle = g.strokeStyle = "#17171c"; g.lineWidth = Math.max(1.5, r * 0.09);
  for (i = -1; i <= 1; i += 2) {
    x = cx + i * d;
    if (e === "dot") { g.beginPath(); g.ellipse(x, cy, r * 0.08, r * 0.12, 0, 0, TAU); g.fill(); }
    else if (e === "wide") { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, cy, r * 0.16, 0, TAU); g.fill(); g.stroke(); g.fillStyle = "#17171c"; g.beginPath(); g.arc(x, cy, r * 0.06, 0, TAU); g.fill(); }
    else if (e === "happy") { g.beginPath(); g.arc(x, cy + r * 0.05, r * 0.11, PI * 1.1, PI * 1.9); g.stroke(); }
    else if (e === "wink") { if (i < 0) { g.beginPath(); g.ellipse(x, cy, r * 0.08, r * 0.12, 0, 0, TAU); g.fill(); } else { g.beginPath(); g.moveTo(x - r * 0.12, cy); g.lineTo(x + r * 0.12, cy - r * 0.03); g.stroke(); } }
    else if (e === "star") { g.fillStyle = "#ffd23b"; R.star(g, x, cy, r * 0.17, 5, t); g.fill(); g.lineWidth = Math.max(1, r * 0.04); g.stroke(); g.fillStyle = "#17171c"; g.lineWidth = Math.max(1.5, r * 0.09); }
    else if (e === "angry") { g.beginPath(); g.ellipse(x, cy + r * 0.04, r * 0.08, r * 0.1, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - r * 0.16 * i * -1, cy - r * 0.2); g.lineTo(x + r * 0.14 * i * -1, cy - r * 0.1); g.stroke(); }
    else if (e === "cry") { g.beginPath(); g.arc(x, cy + r * 0.05, r * 0.11, PI * 1.1, PI * 1.9); g.stroke(); g.fillStyle = "#5ac8ff"; g.beginPath(); g.ellipse(x + i * r * 0.05, cy + r * 0.22 + ((t * 0.8) % 1) * r * 0.25, r * 0.06, r * 0.1, 0, 0, TAU); g.fill(); g.fillStyle = "#17171c"; }
    else if (e === "dizzy") { g.beginPath(); for (var a = 0; a < 10; a++) g.lineTo(x + Math.cos(a * 0.9 + t * 4) * a * r * 0.016, cy + Math.sin(a * 0.9 + t * 4) * a * r * 0.016); g.stroke(); }
    else if (e === "sleepy") { g.beginPath(); g.moveTo(x - r * 0.12, cy + r * 0.02); g.lineTo(x + r * 0.12, cy + r * 0.02); g.stroke(); }
  }
  if (e === "shades") { g.fillStyle = "#101014"; rr(g, cx - r * 0.55, cy - r * 0.12, r * 0.48, r * 0.26, r * 0.08); g.fill(); rr(g, cx + r * 0.07, cy - r * 0.12, r * 0.48, r * 0.26, r * 0.08); g.fill(); g.fillRect(cx - r * 0.1, cy - r * 0.08, r * 0.2, r * 0.05); g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(cx - r * 0.45, cy - r * 0.08, r * 0.12, r * 0.05); }
  if (e === "sleepy") { g.font = "800 " + Math.round(r * 0.32) + "px " + R.FONT; g.fillText("z", cx + r * 0.62, cy - r * 0.5 - ((t * 10) % 6)); }
}
function mouth(g, m, cx, cy, r, t){
  g.fillStyle = g.strokeStyle = "#17171c"; g.lineWidth = Math.max(1.5, r * 0.09);
  if (m === "smile") { g.beginPath(); g.arc(cx, cy - r * 0.2, r * 0.3, PI * 0.2, PI * 0.8); g.stroke(); }
  else if (m === "grin" || m === "teeth") { g.beginPath(); g.moveTo(cx - r * 0.34, cy - r * 0.08); g.quadraticCurveTo(cx, cy + r * 0.32, cx + r * 0.34, cy - r * 0.08); g.closePath(); g.fill(); if (m === "teeth" || m === "grin") { g.fillStyle = "#ffffff"; g.fillRect(cx - r * 0.26, cy - r * 0.06, r * 0.52, r * 0.08); } }
  else if (m === "o") { g.beginPath(); g.ellipse(cx, cy, r * 0.1, r * 0.14, 0, 0, TAU); g.fill(); }
  else if (m === "frown") { g.beginPath(); g.arc(cx, cy + r * 0.22, r * 0.26, PI * 1.2, PI * 1.8); g.stroke(); }
  else if (m === "tongue") { g.beginPath(); g.arc(cx, cy - r * 0.2, r * 0.3, PI * 0.2, PI * 0.8); g.stroke(); g.fillStyle = "#ff6b8a"; g.beginPath(); g.ellipse(cx + r * 0.06, cy + r * 0.12, r * 0.11, r * 0.13, 0, 0, TAU); g.fill(); }
  else if (m === "flat") { g.beginPath(); g.moveTo(cx - r * 0.2, cy); g.lineTo(cx + r * 0.2, cy); g.stroke(); }
  else if (m === "smirk") { g.beginPath(); g.moveTo(cx - r * 0.2, cy + r * 0.02); g.quadraticCurveTo(cx + r * 0.1, cy + r * 0.08, cx + r * 0.28, cy - r * 0.1); g.stroke(); }
}
function icon(g, k, cx, cy, r, c, t){
  var i, a;
  g.lineWidth = Math.max(1.5, r * 0.08); g.strokeStyle = "rgba(8,9,22,.8)"; g.fillStyle = c;
  g.save(); g.shadowColor = "rgba(8,9,22,.55)"; g.shadowOffsetY = 3; g.shadowBlur = 0;
  if (k === "ball") { R.drawBall(g, cx, cy, r * 0.75, BY.classic, R.spin(R.ico(), 0.35, 0.2, 1, t), t, 0.3, 0.95); }
  else if (k === "trophy") { g.beginPath(); g.moveTo(cx - r * 0.5, cy - r * 0.6); g.lineTo(cx + r * 0.5, cy - r * 0.6); g.quadraticCurveTo(cx + r * 0.48, cy + r * 0.1, cx, cy + r * 0.2); g.quadraticCurveTo(cx - r * 0.48, cy + r * 0.1, cx - r * 0.5, cy - r * 0.6); g.fill(); g.stroke(); g.fillRect(cx - r * 0.08, cy + r * 0.2, r * 0.16, r * 0.3); g.fillRect(cx - r * 0.35, cy + r * 0.5, r * 0.7, r * 0.18); g.beginPath(); g.arc(cx - r * 0.55, cy - r * 0.3, r * 0.18, PI * 0.5, PI * 1.5); g.moveTo(cx + r * 0.55, cy - r * 0.48); g.arc(cx + r * 0.55, cy - r * 0.3, r * 0.18, -PI * 0.5, PI * 0.5); g.stroke(); }
  else if (k === "crown") { g.beginPath(); g.moveTo(cx - r * 0.7, cy + r * 0.4); g.lineTo(cx - r * 0.75, cy - r * 0.4); g.lineTo(cx - r * 0.35, cy - r * 0.05); g.lineTo(cx, cy - r * 0.6); g.lineTo(cx + r * 0.35, cy - r * 0.05); g.lineTo(cx + r * 0.75, cy - r * 0.4); g.lineTo(cx + r * 0.7, cy + r * 0.4); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#ff4f7a"; g.beginPath(); g.arc(cx, cy + r * 0.15, r * 0.12, 0, TAU); g.fill(); }
  else if (k === "flame") { g.beginPath(); g.moveTo(cx, cy - r * 0.8); g.quadraticCurveTo(cx + r * 0.7, cy - r * 0.1, cx + r * 0.45, cy + r * 0.5); g.quadraticCurveTo(cx, cy + r * 0.85, cx - r * 0.45, cy + r * 0.5); g.quadraticCurveTo(cx - r * 0.65, cy, cx, cy - r * 0.8); g.fill(); g.stroke(); g.fillStyle = "#ffe66b"; g.beginPath(); g.ellipse(cx, cy + r * 0.32, r * 0.2, r * 0.3 + 0.05 * r * Math.sin(t * 9), 0, 0, TAU); g.fill(); }
  else if (k === "bolt") { g.beginPath(); g.moveTo(cx + r * 0.15, cy - r * 0.8); g.lineTo(cx - r * 0.45, cy + r * 0.1); g.lineTo(cx - r * 0.02, cy + r * 0.1); g.lineTo(cx - r * 0.2, cy + r * 0.8); g.lineTo(cx + r * 0.45, cy - r * 0.15); g.lineTo(cx + r * 0.05, cy - r * 0.15); g.closePath(); g.fill(); g.stroke(); }
  else if (k === "star") { R.star(g, cx, cy, r * 0.8, 5, Math.sin(t * 2) * 0.2); g.fill(); g.stroke(); }
  else if (k === "boot") { g.beginPath(); g.moveTo(cx - r * 0.5, cy - r * 0.6); g.lineTo(cx - r * 0.1, cy - r * 0.6); g.lineTo(cx - r * 0.05, cy); g.quadraticCurveTo(cx + r * 0.7, cy + r * 0.05, cx + r * 0.7, cy + r * 0.35); g.lineTo(cx - r * 0.55, cy + r * 0.35); g.closePath(); g.fill(); g.stroke(); g.fillStyle = "#17171c"; for (i = 0; i < 4; i++) g.fillRect(cx - r * 0.45 + i * r * 0.32, cy + r * 0.35, r * 0.12, r * 0.14); }
  else if (k === "whistle") { g.beginPath(); g.arc(cx + r * 0.1, cy + r * 0.1, r * 0.45, 0, TAU); g.fill(); g.stroke(); g.fillRect(cx - r * 0.75, cy - r * 0.32, r * 0.7, r * 0.3); g.strokeRect(cx - r * 0.75, cy - r * 0.32, r * 0.7, r * 0.3); }
  else if (k === "glove") { rr(g, cx - r * 0.45, cy - r * 0.2, r * 0.9, r * 0.85, r * 0.2); g.fill(); g.stroke(); for (i = 0; i < 4; i++) { rr(g, cx - r * 0.45 + i * r * 0.23, cy - r * 0.75, r * 0.2, r * 0.6, r * 0.1); g.fill(); g.stroke(); } }
  else if (k === "clock") { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(cx, cy, r * 0.7, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(t * 2) * r * 0.5, cy + Math.sin(t * 2) * r * 0.5); g.moveTo(cx, cy); g.lineTo(cx, cy - r * 0.35); g.stroke(); }
  else if (k === "medal") { g.fillStyle = "#3b6ef5"; g.beginPath(); g.moveTo(cx - r * 0.4, cy - r * 0.8); g.lineTo(cx - r * 0.1, cy - r * 0.1); g.lineTo(cx + r * 0.1, cy - r * 0.1); g.lineTo(cx + r * 0.4, cy - r * 0.8); g.fill(); g.fillStyle = c; g.beginPath(); g.arc(cx, cy + r * 0.25, r * 0.45, 0, TAU); g.fill(); g.stroke(); }
  else if (k === "target") { [0.75, 0.5, 0.25].forEach(function(s, n){ g.fillStyle = n & 1 ? "#ffffff" : c; g.beginPath(); g.arc(cx, cy, r * s, 0, TAU); g.fill(); g.stroke(); }); }
  else if (k === "net") { g.fillStyle = "#ffffff"; g.fillRect(cx - r * 0.75, cy - r * 0.5, r * 1.5, r * 0.1); g.fillRect(cx - r * 0.75, cy - r * 0.5, r * 0.1, r * 1.1); g.fillRect(cx + r * 0.65, cy - r * 0.5, r * 0.1, r * 1.1); g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; for (i = 1; i < 6; i++) { g.beginPath(); g.moveTo(cx - r * 0.65 + i * r * 0.22, cy - r * 0.4); g.lineTo(cx - r * 0.65 + i * r * 0.22, cy + r * 0.6); g.stroke(); } R.drawBall(g, cx + r * 0.2, cy + r * 0.25, r * 0.28, BY.classic, R.spin(R.ico(), 0.35, 0.2, 1, t), t, 0.3, 0.95); }
  else if (k === "goat") { g.beginPath(); g.ellipse(cx, cy + r * 0.1, r * 0.4, r * 0.5, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = "#6b4a2a"; g.lineWidth = r * 0.12; g.beginPath(); g.arc(cx - r * 0.3, cy - r * 0.45, r * 0.25, PI, PI * 1.9); g.moveTo(cx + r * 0.55, cy - r * 0.45); g.arc(cx + r * 0.3, cy - r * 0.45, r * 0.25, 0, PI * 1.1, true); g.stroke(); g.fillStyle = "#ffd23b"; R.star(g, cx, cy - r * 0.95, r * 0.22, 5, t); g.fill(); g.fillStyle = "#17171c"; g.beginPath(); g.arc(cx - r * 0.15, cy, r * 0.06, 0, TAU); g.arc(cx + r * 0.15, cy, r * 0.06, 0, TAU); g.fill(); }
  g.restore();
}
MG.mix = function(a, b, k){ var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = Math.round(lerp(x >> 16, y >> 16, k)), gg = Math.round(lerp(x >> 8 & 255, y >> 8 & 255, k)), bb = Math.round(lerp(x & 255, y & 255, k)); return "#" + ((1 << 24) + (r << 16) + (gg << 8) + bb).toString(16).slice(1); };

// ---- banners ----
R.banner = function(cv, id, t){
  var it = BY[id] || BY.bn0, g = cv.getContext("2d"), w = cv.width, h = cv.height, c = it.c, mo = it.mo, r = MG.rng(id.length * 131 + id.charCodeAt(id.length - 1)), gr, i, j, a, x, y;
  t = t || 0; g.setTransform(1, 0, 0, 1, 0, 0); g.save();
  gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = g.strokeStyle = c[2]; g.globalAlpha = 0.35; g.lineWidth = h * 0.05;
  if (mo === "stripes") for (i = -4; i < 14; i++) { g.beginPath(); g.moveTo(i * w / 8, h); g.lineTo(i * w / 8 + h, 0); g.stroke(); }
  else if (mo === "chevron") for (i = 0; i < 6; i++) { g.beginPath(); g.moveTo(w * 0.1 + i * w * 0.16, 0); g.lineTo(w * 0.2 + i * w * 0.16, h / 2); g.lineTo(w * 0.1 + i * w * 0.16, h); g.stroke(); }
  else if (mo === "waves") for (j = 0; j < 4; j++) { g.beginPath(); for (x = 0; x <= w; x += 6) g.lineTo(x, h * (0.25 + j * 0.18) + Math.sin(x * 0.04 + j + t) * h * 0.06); g.stroke(); }
  else if (mo === "stars" || mo === "galaxy") { for (i = 0; i < 40; i++) { g.globalAlpha = 0.3 + r() * 0.7; R.star(g, r() * w, r() * h, 1 + r() * h * 0.05, 4, 0); g.fill(); } if (mo === "galaxy") { gr = g.createRadialGradient(w * 0.7, h * 0.5, 0, w * 0.7, h * 0.5, h); gr.addColorStop(0, MG.hexA(c[2], 0.6)); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, w, h); } }
  else if (mo === "hex") { g.lineWidth = 1.5; for (j = 0; j < 5; j++) for (i = 0; i < 16; i++) { x = i * 26 + (j & 1 ? 13 : 0); y = j * 22; g.beginPath(); for (a = 0; a < 6; a++) g.lineTo(x + Math.cos(a * PI / 3) * 12, y + Math.sin(a * PI / 3) * 12); g.closePath(); g.stroke(); } }
  else if (mo === "rings") for (i = 1; i < 9; i++) { g.lineWidth = 2; g.beginPath(); g.arc(w * 0.82, h * 0.5, i * h * 0.16, 0, TAU); g.stroke(); }
  else if (mo === "grid") { g.lineWidth = 1; for (x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (y = 0; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
  else if (mo === "rays") { g.globalAlpha = 0.25; for (i = 0; i < 18; i++) { a = i * TAU / 18 + t * 0.1; g.beginPath(); g.moveTo(w * 0.8, h * 0.5); g.lineTo(w * 0.8 + Math.cos(a - 0.08) * w, h * 0.5 + Math.sin(a - 0.08) * w); g.lineTo(w * 0.8 + Math.cos(a + 0.08) * w, h * 0.5 + Math.sin(a + 0.08) * w); g.fill(); } }
  else if (mo === "peaks") { g.globalAlpha = 0.45; g.beginPath(); g.moveTo(0, h); for (x = 0; x <= w; x += w / 10) g.lineTo(x, h * (0.35 + r() * 0.4)); g.lineTo(w, h); g.fill(); }
  else if (mo === "city") { g.globalAlpha = 0.5; for (x = 0; x < w; x += 14 + r() * 10) { a = h * (0.3 + r() * 0.55); g.fillRect(x, h - a, 12, a); } }
  else if (mo === "flames") { g.globalAlpha = 0.5; g.beginPath(); g.moveTo(0, h); for (x = 0; x <= w; x += 12) g.lineTo(x, h * (0.45 + (x / 12 & 1 ? 0.3 : 0)) + Math.sin(x + t * 6) * 4); g.lineTo(w, h); g.fill(); }
  else if (mo === "bolt") { g.globalAlpha = 0.6; g.lineWidth = 3; g.beginPath(); x = w * 0.7; g.moveTo(x, 0); for (y = 0; y <= h; y += h / 5) g.lineTo(x + (r() - 0.5) * 40, y); g.stroke(); }
  else if (mo === "confetti") for (i = 0; i < 45; i++) { g.globalAlpha = 0.6; g.fillStyle = ["#ff4f7a", "#ffd23b", "#5ee6a8", "#5ee6ff", c[2]][i % 5]; g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 6); g.fillRect(-3, -1.5, 6, 3); g.restore(); }
  else if (mo === "checker") for (i = 0; i < w / 16; i++) for (j = 0; j < h / 16; j++) if ((i + j) & 1) g.fillRect(i * 16, j * 16, 16, 16);
  else if (mo === "topo") { g.lineWidth = 1.2; for (i = 1; i < 10; i++) { g.beginPath(); g.ellipse(w * 0.75, h * 0.6, i * 14, i * 8, 0.3, 0, TAU); g.stroke(); } }
  else if (mo === "circuit") { g.lineWidth = 1.5; for (i = 0; i < 14; i++) { x = r() * w; y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.lineTo(x + 30, y + 10); g.stroke(); g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill(); } }
  else if (mo === "dots") for (j = 0; j < h; j += 10) for (i = 0; i < w; i += 10) { g.beginPath(); g.arc(i, j, 1 + i / w * 3, 0, TAU); g.fill(); }
  else if (mo === "diamond") for (j = 0; j < 4; j++) for (i = 0; i < 14; i++) { x = i * 30 + (j & 1 ? 15 : 0); y = j * 26; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 9, y); g.lineTo(x, y + 10); g.lineTo(x - 9, y); g.fill(); }
  else if (mo === "aurora") for (j = 0; j < 3; j++) { g.globalAlpha = 0.3; g.fillStyle = [c[2], "#5ee6a8", "#b266ff"][j]; g.beginPath(); g.moveTo(0, h); for (x = 0; x <= w; x += 8) g.lineTo(x, h * (0.3 + j * 0.15) + Math.sin(x * 0.03 + j * 2 + t * 0.8) * h * 0.12); g.lineTo(w, h); g.fill(); }
  g.globalAlpha = 1;
  if (it.r >= 5) { x = ((t * 80) % (w + 200)) - 100; gr = g.createLinearGradient(x - 60, 0, x + 60, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, "rgba(255,255,255,.28)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.45)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = MG.RAR[it.r].c; g.lineWidth = it.r >= 4 ? 4 : 2; g.strokeRect(1, 1, w - 2, h - 2);
  g.restore();
};
})();
