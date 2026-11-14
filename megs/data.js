// MEGS data: rarities, cosmetics, rivals, quests and the simulated player pool.
(function(){
"use strict";
var MG = window.MG = window.MG || {};
MG.RAR = [{n: "Common", c: "#9aa0b8"}, {n: "Rare", c: "#4f8dff"}, {n: "Epic", c: "#b266ff"}, {n: "Legendary", c: "#ffb938"}, {n: "Mythic", c: "#ff4f7a"}, {n: "Secret", c: "#5ee6a8"}];
MG.PRICE = [150, 400, 900, 2200];
MG.DUPE = [25, 70, 160, 400, 900, 0];
MG.PACKS = [
  {id: "street", n: "Street Pack", cost: 300, odds: [58, 28, 10, 3.5, 0.5], pity: 30},
  {id: "pro", n: "Pro Pack", cost: 800, odds: [0, 52, 32, 13, 3], pity: 10}
];
MG.TIERS = [{n: "Bronze", c: "#c98f62", min: 0}, {n: "Silver", c: "#c9d2e6", min: 1000}, {n: "Gold", c: "#ffd23b", min: 1200}, {n: "Platinum", c: "#5ee6d6", min: 1400}, {n: "Diamond", c: "#7fb0ff", min: 1600}, {n: "Master", c: "#b266ff", min: 1800}, {n: "Legend", c: "#ff4f7a", min: 2000}];
MG.tier = function(elo){ var i = MG.TIERS.length - 1; while (i > 0 && elo < MG.TIERS[i].min) i--; return i; };
MG.lvlFor = function(elo){ return MG.clamp((elo - 700) / 170, 0, 10); };
MG.xpNeed = function(l){ return 200 + 60 * l; };
MG.SKIN = ["#f6d3b3", "#e8b98f", "#c98f62", "#a5673f", "#6f4226"];
MG.HAIR = ["#1b1b1f", "#4a2f1b", "#c98f2e", "#d9d9e0", "#b83a2e", "#3b6ef5", "#ff7ab8"];

// ---- cosmetics. t: kit / ball / trail / fx / court, r: rarity, how + need: earned, never found in packs or the shop ----
var I = MG.ITEMS = [], BY = MG.ITEM = {};
function add(t, id, n, r, o){ o = o || {}; o.t = t; o.id = id; o.n = n; o.r = r; I.push(o); BY[id] = o; }
// kits. p: pattern, c: [main, second, shorts], f: aura effect
add("kit", "home", "Home Blue", 0, {p: "solid", c: ["#3b6ef5", "#f2f2f7", "#1f2a55"]});
add("kit", "away", "Away White", 0, {p: "solid", c: ["#f2f2f7", "#3b6ef5", "#22243f"]});
add("kit", "tang", "Tangerine", 0, {p: "solid", c: ["#ff8a3d", "#2a1a10", "#2a1a10"]});
add("kit", "mint", "Mint", 0, {p: "solid", c: ["#5ee6a8", "#0f3d2a", "#0f3d2a"]});
add("kit", "bubble", "Bubblegum", 0, {p: "solid", c: ["#ff7ab8", "#ffffff", "#5a1f3d"]});
add("kit", "slate", "Concrete", 0, {p: "solid", c: ["#8a8ca8", "#22243f", "#22243f"]});
add("kit", "candy", "Candy Stripe", 1, {p: "stripes", c: ["#e6394a", "#ffffff", "#7a1420"]});
add("kit", "hoops", "Harbor Hoops", 1, {p: "hoops", c: ["#1f3a8a", "#7fd0ff", "#12204d"]});
add("kit", "sash", "The Sash", 1, {p: "sash", c: ["#ffffff", "#e6394a", "#22243f"]});
add("kit", "split", "Bumblebee", 1, {p: "halves", c: ["#ffd23b", "#17171c", "#17171c"]});
add("kit", "check", "Checkered", 1, {p: "checker", c: ["#e6394a", "#ffffff", "#22243f"]});
add("kit", "dusk", "Dusk", 1, {p: "fade", c: ["#ff7a3d", "#b266ff", "#3d1f5a"]});
add("kit", "argyle", "Argyle", 2, {p: "argyle", c: ["#1f5a3d", "#ffd23b", "#12331f"]});
add("kit", "tiger", "Tiger", 2, {p: "tiger", c: ["#ff8a1f", "#17171c", "#17171c"]});
add("kit", "camo", "Night Camo", 2, {p: "camo", c: ["#3d4a5a", "#232b36", "#151a22"]});
add("kit", "pixel", "8-Bit", 2, {p: "pixel", c: ["#5ee6a8", "#3b6ef5", "#22243f"]});
add("kit", "tiedye", "Tie-Dye", 2, {p: "tiedye", c: ["#ff4f7a", "#ffd23b", "#3b6ef5"]});
add("kit", "neon", "Neon Grid", 2, {p: "neon", c: ["#0d0824", "#5ee6ff", "#0d0824"]});
add("kit", "gold", "Golden Boot", 3, {p: "gold", c: ["#ffd766", "#b8860b", "#3d2c05"], f: "spark"});
add("kit", "lava", "Magma", 3, {p: "lava", c: ["#2a0a05", "#ff5a1f", "#1a0603"], f: "ember"});
add("kit", "frost", "Glacier", 3, {p: "frost", c: ["#bfe9ff", "#5aa9e6", "#1f3a5a"], f: "frost"});
add("kit", "galaxy", "Stardust", 3, {p: "galaxy", c: ["#1a1040", "#b266ff", "#0d0824"], f: "star"});
add("kit", "holo", "Hologram", 3, {p: "holo", c: ["#7fd0ff", "#ff7ab8", "#22243f"]});
add("kit", "glitch", "Glitch", 4, {p: "glitch", c: ["#17171c", "#5ee6ff", "#ff4f7a"], f: "glitch"});
add("kit", "void", "Void Walker", 4, {p: "void", c: ["#0a0612", "#8a3dff", "#0a0612"], f: "void"});
add("kit", "nova", "Supernova", 4, {p: "nova", c: ["#fff6d6", "#ff8a1f", "#3d1a05"], f: "spark"});
add("kit", "megl", "Meg Lord", 2, {p: "hoops", c: ["#8a3dff", "#5ee6a8", "#1a0d33"], how: "Land 100 megs", need: ["megs", 100]});
add("kit", "cupw", "Cup Winner", 3, {p: "crown", c: ["#f2f2f7", "#ffb938", "#22243f"], how: "Win 3 cups", need: ["cups", 3]});
add("kit", "wknd", "Weekender", 3, {p: "fade", c: ["#ffd23b", "#ff4f7a", "#3b1f5a"], f: "star", how: "Win the Weekend Cup", need: ["wknd", 1]});
add("kit", "ladder", "Ladder Legend", 3, {p: "crown", c: ["#17171c", "#ffb938", "#17171c"], f: "spark", how: "Beat all 20 rivals on the Ladder", need: ["ladder", 20]});
add("kit", "apex", "Apex", 4, {p: "chevron", c: ["#17171c", "#ff4f7a", "#17171c"], f: "ember", how: "Reach Legend rank", need: ["peak", 2000]});
add("kit", "one", "Number One", 4, {p: "crown", c: ["#ffffff", "#ffd766", "#b8860b"], f: "spark", how: "Sit on top of the ranked board", need: ["first", 1]});
add("kit", "s67", "Six Seven", 5, {p: "n67", c: ["#3d1f8a", "#ffd23b", "#1a0d33"], f: "star", how: "Hidden somewhere on this site", need: ["s67", 1]});
add("kit", "custom", "Custom Kit", 3, {p: "custom", c: ["#3b6ef5", "#f2f2f7", "#1f2a55"], how: "Win a cup to open the Kit Maker", need: ["cups", 1]});
// balls. c: [base, marks...], s: mark style, g: glow
add("ball", "classic", "Classic", 0, {c: ["#f7f7fa", "#17171c"], s: 0});
add("ball", "street", "Street", 0, {c: ["#ff8a3d", "#17171c"], s: 0});
add("ball", "lime", "Volt", 0, {c: ["#d6ff3b", "#1f2a55"], s: 0});
add("ball", "beach", "Beach Ball", 1, {c: ["#ffffff", "#e6394a", "#3b6ef5", "#ffd23b"], s: 1});
add("ball", "star", "All-Star", 1, {c: ["#3b6ef5", "#ffffff"], s: 2});
add("ball", "mono", "Blackout", 1, {c: ["#17171c", "#8a8ca8"], s: 0});
add("ball", "argb", "Argyle Ball", 2, {c: ["#1f5a3d", "#ffd23b"], s: 3});
add("ball", "pixb", "Bit Ball", 2, {c: ["#5ee6a8", "#17171c"], s: 5});
add("ball", "tennis", "Fuzz", 2, {c: ["#d6ff3b", "#ffffff"], s: 4});
add("ball", "disco", "Disco", 2, {c: ["#cfd6e6", "#ffffff"], s: 6});
add("ball", "fire", "Fireball", 3, {c: ["#ff5a1f", "#ffd23b"], s: 0, g: "#ff5a1f"});
add("ball", "snow", "Snowball", 3, {c: ["#eaf6ff", "#9fd0ff"], s: 4, g: "#bfe9ff"});
add("ball", "goldb", "Golden Ball", 3, {c: ["#ffd766", "#b8860b"], s: 0, g: "#ffd766"});
add("ball", "plasma", "Plasma", 3, {c: ["#8a3dff", "#5ee6ff"], s: 4, g: "#8a3dff"});
add("ball", "hole", "Black Hole", 4, {c: ["#0a0612", "#8a3dff"], s: 4, g: "#8a3dff"});
add("ball", "moon", "Moon Ball", 2, {c: ["#d9d9e0", "#9a9aa8"], s: 5, how: "Win 5 Moon Ball games", need: ["moon", 5]});
add("ball", "trophy", "Champion's Ball", 3, {c: ["#ffffff", "#ffb938"], s: 2, g: "#ffb938", how: "Win a cup", need: ["cups", 1]});
// ball trails
add("trail", "t_none", "No Trail", 0, {k: "none"});
add("trail", "t_dust", "Dust", 0, {k: "dust"});
add("trail", "t_line", "Streak", 0, {k: "line"});
add("trail", "t_spark", "Sparks", 1, {k: "spark"});
add("trail", "t_pixel", "Pixels", 1, {k: "pixel"});
add("trail", "t_rain", "Rainbow", 2, {k: "rainbow"});
add("trail", "t_flame", "Flame", 2, {k: "flame"});
add("trail", "t_ice", "Frostbite", 2, {k: "ice"});
add("trail", "t_bolt", "Lightning", 3, {k: "bolt"});
add("trail", "t_star", "Stardust", 3, {k: "star"});
add("trail", "t_void", "Void", 4, {k: "void"});
// goal celebrations
add("fx", "f_conf", "Confetti", 0, {k: "confetti"});
add("fx", "f_shock", "Shockwave", 0, {k: "shock"});
add("fx", "f_ink", "Paint Splash", 1, {k: "ink"});
add("fx", "f_fire", "Fireworks", 2, {k: "firework"});
add("fx", "f_pix", "Pixel Burst", 2, {k: "pixel"});
add("fx", "f_bolt", "Thunder", 3, {k: "bolt"});
add("fx", "f_gold", "Coin Shower", 3, {k: "gold"});
add("fx", "f_hole", "Implosion", 4, {k: "hole"});
// cages
add("court", "c_street", "Blacktop", 0, {});
add("court", "c_turf", "Turf Cage", 1, {});
add("court", "c_neon", "Neon Night", 2, {});
add("court", "c_sunset", "Rooftop Sunset", 3, {});

// titles are earned, never bought
MG.TITLES = [
  ["Rookie", "Everyone starts here", "w", 0], ["Cage Rat", "Win 10 matches", "w", 10], ["Meg Merchant", "Land 25 megs", "megs", 25], ["Top Bins", "Score 20 in the top corners", "top", 20],
  ["Sniper", "Score 40 from long range", "twos", 40], ["Ankle Taker", "Break ankles 25 times", "ankles", 25], ["Brick Wall", "Block or save 60 shots", "blocks", 60], ["Green Machine", "Hit 100 perfect releases", "perfect", 100],
  ["Untouchable", "Win 8 in a row", "best", 8], ["Cup Collector", "Win 5 cups", "cups", 5], ["Ladder Legend", "Beat all 20 rivals", "ladder", 20], ["Apex", "Reach Legend rank", "peak", 2000]
];

// ---- the Ladder: twenty rivals. [name, level, [pace, shot, ctrl, power, tackle, block], kit, ball, line] ----
MG.RIVALS = [
  ["Benchwarmer Ben", 0.3, [4, 3, 3, 4, 3, 3], "slate", "classic", "Still working out which way he is shooting."],
  ["Tippy Tap Tia", 0.9, [5, 3, 4, 3, 3, 3], "bubble", "classic", "Loves a touch. Loves ten touches."],
  ["Longshot Lola", 1.5, [4, 5, 3, 6, 3, 3], "tang", "street", "Shoots on sight. Any sight."],
  ["The Fridge", 2.1, [3, 4, 4, 5, 5, 6], "away", "mono", "Hard to get around. Harder to move."],
  ["Cage Rat Carlos", 2.8, [5, 5, 5, 5, 5, 5], "candy", "street", "Lives here. Has never once gone home."],
  ["Stepover Steph", 3.3, [6, 4, 7, 4, 4, 4], "hoops", "lime", "Eight stepovers before breakfast."],
  ["Quick Nic", 3.8, [8, 4, 5, 4, 4, 4], "mint", "lime", "Blink and the ball is gone."],
  ["Megs McGee", 4.3, [6, 5, 8, 4, 4, 3], "sash", "star", "Keep your legs closed."],
  ["Slide Rule Sandra", 4.8, [6, 5, 5, 5, 8, 5], "check", "mono", "Measures twice, tackles once."],
  ["Top Bins Tina", 5.4, [6, 8, 6, 7, 5, 5], "argyle", "argb", "Only aims where the spiders live."],
  ["Iron Ivan", 5.9, [5, 6, 5, 7, 7, 8], "camo", "mono", "The human roadblock."],
  ["Zigzag Zoe", 6.3, [8, 6, 8, 5, 5, 5], "tiedye", "beach", "Never met a straight line she liked."],
  ["Cannon Kofi", 6.8, [6, 7, 6, 9, 6, 6], "tiger", "fire", "The net files a complaint after every game."],
  ["The Professor", 7.2, [6, 8, 8, 6, 7, 6], "pixel", "pixb", "Has already solved you."],
  ["Night Shift Nia", 7.8, [8, 8, 7, 7, 7, 7], "neon", "plasma", "Only plays under the lights."],
  ["Silky Sami", 8.2, [8, 8, 9, 7, 6, 6], "holo", "disco", "Smooth is fast."],
  ["Double Lock Dee", 8.6, [7, 7, 7, 7, 9, 9], "frost", "snow", "Nothing gets past twice."],
  ["Captain Clutch", 9, [8, 9, 8, 8, 8, 7], "gold", "goldb", "Wants the ball when it matters."],
  ["La Sombra", 9.5, [9, 8, 9, 8, 8, 8], "void", "hole", "You will not see her coming."],
  ["The King of the Cage", 10, [9, 9, 9, 9, 9, 9], "ladder", "trophy", "Twenty came for the crown. Nineteen went home."]
];
MG.STATS = [["pace", "Pace"], ["shot", "Shooting"], ["ctrl", "Control"], ["power", "Power"], ["tackle", "Tackling"], ["block", "Blocking"]];
MG.ARCH = [
  ["Poacher", "Lives near goal. Wide green up close.", [5, 8, 5, 5, 4, 4]],
  ["Speedster", "A first step nobody can match.", [8, 5, 6, 4, 4, 4]],
  ["Cannon", "Hits it like it owes money.", [5, 6, 4, 8, 4, 4]],
  ["Trickster", "Cuts, megs and broken ankles.", [6, 5, 8, 4, 4, 4]],
  ["Stopper", "Wins the ball and keeps the door shut.", [5, 4, 4, 4, 8, 6]],
  ["All-Rounder", "Good at everything, great at nothing.", [5, 5, 5, 5, 6, 5]]
];
MG.MODES = {
  ranked: {n: "Ranked 1v1", d: "First to 5. Long range counts double. Elo on the line.", cfg: {}},
  quick: {n: "Quick Match", d: "First to 3 against a rival as tough as you like.", cfg: {target: 3}},
  panna: {n: "Panna KO", d: "First to 3, but a nutmeg ends it on the spot.", cfg: {target: 3, panna: true}, arc: 1},
  golden: {n: "Golden Goal", d: "One goal. That is the whole game.", cfg: {target: 1, golden: true}, arc: 1},
  far: {n: "Long Shots", d: "Only goals from outside the arc count, and they count double. First to 6.", cfg: {target: 6, far: true}, arc: 1},
  moon: {n: "Moon Ball", d: "Low gravity and big bounces. First to 5.", cfg: {grav: 0.38, boun: 1.3}, arc: 1},
  blitz: {n: "Blitz 90", d: "Ninety seconds. Most goals wins.", cfg: {target: 0, clock: 90, sc: 8}, arc: 1},
  practice: {n: "Free Kickabout", d: "No clock, no score. A training dummy shadows you.", cfg: {target: 0, sc: 0}}
};
// daily quests: [id, text, counter, target, coins]
MG.QUESTS = [
  ["g5", "Score 5 goals", "goals", 5, 60], ["two3", "Score 3 from long range", "twos", 3, 80], ["megs2", "Land 2 megs", "megs", 2, 80], ["perf4", "Hit 4 perfect releases", "perfect", 4, 70],
  ["win2", "Win 2 matches", "wins", 2, 90], ["rank1", "Win a ranked match", "rwins", 1, 70], ["blk3", "Block or save 3 shots", "blocks", 3, 60], ["tk3", "Win the ball back 3 times", "tackles", 3, 60],
  ["ank1", "Break some ankles", "ankles", 1, 70], ["arc1", "Win an arcade game", "awins", 1, 60]
];
MG.CHAT = ["gg", "one more?", "that was filthy", "megs incoming", "no way that went in", "top bins only", "who has next", "run it back", "close one", "nice shot", "the post hates me", "I call next", "warming up", "let's go", "back in 2, water", "that crossbar though", "first to 5?", "wow", "unlucky", "clean"];

// ---- simulated players: the same 160 rivals for everyone, drifting a little every day ----
var FIRST = "Leo Mia Kai Zoe Nico Ava Tariq Luca Noor Jude Ines Mateo Yuki Omar Sana Diego Ravi Lena Theo Maya Enzo Aria Jamal Sofia Kofi Nia Anders Priya Marco Elif Bruno Hana Felix Amara Soren Lucia Dante Mina Rafa Tess".split(" ");
var PRE = "Top No El La Big Lil Sir King Neon Turbo Silky Icy Sly Rapid Lucky Mighty Shadow Golden Street Cage Wavy Zen Sneaky Mega Ultra Nitro Cosmic Salty Jolly Fuzzy".split(" ");
var CORE = "Megs Panna Tekkers Rabona Nutmeg Volley Curler Chip Rocket Bins Sombrero Elastico Roulette Stepover Toepoke Banger Screamer Dribbla Baller Striker Poacher Nine Ten Wizard Magnet Laces Studs Backheel Tiki Taka".split(" ");
var SUF = ["", "", "", "", "7", "9", "10", "11", "99", "_fc", "x", "HD", "_jr", "07", "23"];
var CLAN = ["CAGE", "MEG", "TEK", "BINS", "FC67", "PNA", "TOP", "SZN", "NXT", "ARG"];
MG.world = function(day){
  var r = MG.rng(6741), out = [], pool = {}, seen = {}, i, e, f, n, g, wr;
  function one(a){ return a[Math.floor(r() * a.length)]; }
  function pick(t, elo){ var q = Math.min(4, Math.floor(Math.pow(r(), 2.3 - (elo - 800) / 1000) * 5)); while (!pool[t + q]) q--; return one(pool[t + q]); }
  I.forEach(function(it){ var k = it.t + Math.min(it.r, 4); if (it.id !== "custom" && it.id !== "s67" && it.id !== "one") (pool[k] = pool[k] || []).push(it.id); });
  for (i = 0; i < 160; i++) {
    e = i < 3 ? 2380 - i * 45 : MG.clamp(1130 + (r() + r() + r() + r() - 2) * 485, 720, 2280);
    f = r(); n = f < 0.4 ? one(FIRST) + one(CORE) : f < 0.75 ? one(PRE) + one(CORE) : (one(FIRST) + "_" + one(CORE)).toLowerCase();
    n += one(SUF); while (seen[n]) n += Math.floor(r() * 10); seen[n] = 1;
    g = Math.floor(40 + r() * 620); wr = MG.clamp(0.5 + (e - 1150) / 2600, 0.2, 0.86);
    out.push({id: i, n: n, clan: r() < 0.55 ? one(CLAN) : "", elo: Math.round(e + 55 * Math.sin(day * 0.9 + i * 1.7) + 30 * Math.sin(day * 0.23 + i)), w: Math.round(g * wr), l: Math.round(g * (1 - wr)),
      megs: Math.floor(g * (0.1 + r() * 0.5) * e / 1500), cups: Math.floor(r() * r() * g / 45 * e / 1400), strk: 2 + Math.floor(r() * r() * 9 + Math.max(0, e - 1000) / 160),
      kit: pick("kit", e), ball: pick("ball", e), trail: pick("trail", e), fx: pick("fx", e), skin: Math.floor(r() * 5), hair: Math.floor(r() * 4), hc: Math.floor(r() * 7), num: 1 + Math.floor(r() * 99),
      title: MG.TITLES[Math.floor(r() * Math.min(MG.TITLES.length, 2 + Math.max(0, e - 800) / 130))][0]});
  }
  out[0].kit = "one";
  out.sort(function(a, b){ return b.elo - a.elo; });
  return out;
};
})();
