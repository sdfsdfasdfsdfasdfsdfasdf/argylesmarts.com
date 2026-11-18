// MEGS season systems: the season pass, weekly challenges, the weekly shop, the campaign, loadout presets and stickers.
// Real-money items are shown as "buyable soon": nothing here takes payment.
(function(){
"use strict";
var MG = window.MG;
function S(){ return MG.S; }
function nw(t, id, n, r, src, o){ o = o || {}; o.t = t; o.id = id; o.n = n; o.r = r; o.src = src; MG.ITEMS.push(o); MG.ITEM[id] = o; return o; }
MG.ONLINE = false;   // online play is coming soon: every match is against computer teams for now
MG.PREMIUM = false;  // the premium pass track unlocks when payments arrive

// ---- the campaign: six chapters of 5-a-side on the big pitch ----
var CLUB = ["Northgate Rovers", "Millbrook Athletic", "Saltmarsh United", "Kestrel Park", "Oakvale Wanderers", "Harbour Lane",
  "Ironbridge Town", "Copperfield FC", "Westmoor City", "Blackwater Albion", "Ridgeway Rangers", "Thornbury Villa",
  "Lakeside Dynamo", "Granite Hill", "Silverton Sporting", "Redcliffe Orient", "Ashford Borough", "Kingsmead",
  "Port Ellis", "Valemount", "Stormhaven", "Crown Street", "Eastfield Rovers", "Highgarden",
  "Northern Lights FC", "Sunset Strikers", "Real Galaxia", "Atletico Nova", "Inter Meridian", "Dynamo Polaris",
  "The Untouchables", "Midnight XI", "Celestial United", "Olympus FC", "Eternal Athletic", "The Immortals"];
var CH = [["Sunday League", "Muddy pitches and half-time oranges. Learn to pass and shoot."], ["County Cup", "Proper kits, proper nets. Teams start to press."],
  ["Regional League", "Faster wingers and keepers who come off their line."], ["National Series", "Every team can pass you to pieces. Keep the ball."],
  ["Continental Tour", "The best clubs on the continent. Chances are rare."], ["The Galaxy Cup", "Legends only. Win this and the season is yours."]];
var BOSS = [["k_sunday", "Sunday Best", 2, {p: "hoops", c: ["#1f8a5b", "#f2f2f7", "#0f4f3a"]}], ["k_county", "County Champion", 3, {p: "sash", c: ["#14254f", "#ffd23b", "#0a1226"], f: "spark"}],
  ["k_region", "Regional Crown", 4, {p: "chevron", c: ["#5a0f22", "#e6c48a", "#2a0610"], f: "spark"}], ["k_nation", "National Hero", 5, {p: "prism", c: ["#f4f6ff", "#3b6ef5", "#14254f"], f: "star", gl: "#7fb0ff"}],
  ["k_conti", "Continental", 6, {p: "chrome", c: ["#dfe6f2", "#38e1ff", "#2a2f3d"], f: "chrome", gl: "#38e1ff"}], ["k_galaxy", "Galaxy Cup Winner", 7, {p: "galaxy", c: ["#0a1238", "#ffd766", "#060a22"], f: "corona", gl: "#ffd766"}]];
BOSS.forEach(function(b, c){ var o = b[3]; o.how = "Win chapter " + (c + 1) + " of the campaign"; o.need = ["camp", c + 1]; nw("kit", b[0], b[1], b[2], "earn", o); });
MG.CAMP = CH.map(function(ch, c){
  return {n: ch[0], d: ch[1], reward: BOSS[c][0], m: [0, 1, 2, 3, 4, 5].map(function(i){
    var k = c * 6 + i, pal = MG.PAL[(k * 11 + 4) % MG.PAL.length], pats = ["stripes", "hoops", "halves", "sash", "quarters", "chevron", "pinstripe", "fade"];
    return {id: "c" + k, ch: c, i: i, club: CLUB[k], lv: Math.min(10, 0.2 + c * 1.6 + i * 0.25 + (i === 5 ? 0.5 : 0)), boss: i === 5, coins: 90 + 35 * c + (i === 5 ? 150 : 0),
      kit: {id: "club" + k, t: "kit", r: 1, p: pats[k % pats.length], c: [pal[1], pal[2], pal[3]]}};
  })};
});
MG.camp = function(){ var s = S(); if (!s.camp) s.camp = {}; return s.camp; };
MG.campOpen = function(c, i){ var cp = MG.camp(); if (c === 0 && i === 0) return true; if (i > 0) return !!cp["c" + (c * 6 + i - 1)]; return !!cp["c" + (c * 6 - 1)]; };
MG.campStars = function(){ var cp = MG.camp(), n = 0, k; for (k in cp) n += cp[k]; return n; };
// stars: 1 for a win, 2 for winning by two or more, 3 for a win without conceding
MG.campDone = function(match, res){
  var cp = MG.camp(), st = !res.win ? 0 : 1 + (res.sc[0] - res.sc[1] >= 2 ? 1 : 0) + (res.sc[1] === 0 ? 1 : 0), old = cp[match.id] || 0, out = {stars: st, first: 0, coins: 0, items: []};
  if (st > old) { cp[match.id] = st; MG.weekAdd({stars: st - old}); }
  if (res.win && !old) { out.first = 1; out.pass = match.coins * 4; MG.passAdd(match.coins * 4); if (match.boss) { S().n.camp = Math.max(S().n.camp || 0, match.ch + 1); } }
  out.items = MG.unlocks(); MG.save(); return out;
};
MG.club = function(match){ var k = +match.id.slice(1); return {name: match.club, lv: match.lv, kit: match.kit, names: ["Keeper", "Back", "Back", "Wing", "Striker"].map(function(r, i){ return ["Ade", "Bruno", "Cole", "Dario", "Eli", "Femi", "Gus", "Hugo", "Ivo", "Jonas", "Kai", "Luca"][(k * 5 + i) % 12]; })}; };

// ---- the season pass: 50 tiers, a free track and a premium track ----
MG.PASS_XP = 1000; MG.PASS_N = 50;
function bySrc(src){ return MG.ITEMS.filter(function(it){ return it.src === src; }).sort(function(a, b){ return a.r - b.r || (a.id < b.id ? -1 : 1); }); }
MG.passTiers = function(){
  if (MG._pt) return MG._pt;
  var fr = bySrc("pass"), pr = bySrc("season"), n = MG.PASS_N, out = [], k, a, b;
  for (k = 0; k < n; k++) {
    // the free track: items on every other tier, coins on every fourth, and the rest left empty
    var slot = k % 2 === 0 ? k / 2 : -1, ns = Math.ceil(n / 2);
    a = slot >= 0 ? fr.slice(Math.floor(slot * fr.length / ns), Math.floor((slot + 1) * fr.length / ns)) : [];
    b = pr.slice(Math.floor(k * pr.length / n), Math.floor((k + 1) * pr.length / n));
    out.push({k: k, free: a, coins: !a.length && (k % 4 === 3 || slot >= 0) ? 120 + k * 8 : 0, prem: b, pcoins: b.length ? 0 : 250 + k * 8});
  }
  return MG._pt = out;
};
MG.pass = function(){ var s = S(); if (!s.pass || s.pass.s !== MG.SEASON.n) s.pass = {s: MG.SEASON.n, xp: 0, got: {}}; return s.pass; };
MG.passTier = function(){ return Math.min(MG.PASS_N, Math.floor(MG.pass().xp / MG.PASS_XP)); };
MG.passAdd = function(x){ var b = MG.passTier(); MG.pass().xp += x; return MG.passTier() - b; };
// after tier 50 every further 1000 pass XP is a bonus tier worth a few coins
MG.BONUS = 150;
MG.passBonus = function(){ var p = MG.pass(), n = Math.max(0, Math.floor(p.xp / MG.PASS_XP) - MG.PASS_N); return n - (p.bon || 0); };
MG.passBonusClaim = function(){ var p = MG.pass(), n = MG.passBonus(); if (n <= 0) return 0; p.bon = (p.bon || 0) + n; S().coins += n * MG.BONUS; MG.save(); return n * MG.BONUS; };
MG.passReady = function(){ var p = MG.pass(), t = MG.passTier(), n = 0, k; for (k = 0; k < t; k++) if (!p.got[k]) n++; return n; };
MG.passClaim = function(k){
  var p = MG.pass(), t = MG.passTiers()[k], s = S(), got = [], back = 0;
  if (!t || p.got[k] || MG.passTier() <= k) return null;
  p.got[k] = 1;
  t.free.forEach(function(it){ if (s.inv[it.id]) back += MG.DUPE[it.r]; else { s.inv[it.id] = 1; got.push(it); } });
  s.coins += t.coins + back; MG.save(); return {items: got, coins: t.coins + back};
};

// ---- weekly challenges ----
MG.WEEKLY = [["wg", "Score 15 goals", "goals", 15, 2500], ["ww", "Win 8 matches", "wins", 8, 2500], ["wt", "Win 3 team matches", "twins", 3, 3000], ["wc", "Earn 6 campaign stars", "stars", 6, 3000],
  ["wm", "Nutmeg 10 players", "megs", 10, 2000], ["wk", "Win the ball back 25 times", "tackles", 25, 2000], ["wp", "Complete 60 passes in team matches", "pok", 60, 2500],
  ["wr", "Win 3 ranked matches", "rwins", 3, 2500], ["wl", "Score 5 long-range goals", "twos", 5, 2000], ["wa", "Play 10 matches", "games", 10, 2000], ["ws", "Make 12 saves or blocks", "blocks", 12, 2000]];
MG.week = function(){ return Math.floor((MG.day() + 3) / 7); };
MG.weekly = function(){
  var s = S(), w = MG.week(), r, pool, i;
  if (!s.wk || s.wk.w !== w) { r = MG.rng(w * 977 + 5); pool = MG.WEEKLY.slice(); s.wk = {w: w, list: []}; for (i = 0; i < 4; i++) s.wk.list.push({id: pool.splice(Math.floor(r() * pool.length), 1)[0][0], p: 0, c: 0}); }
  return s.wk.list.map(function(q){ var d = MG.WEEKLY.filter(function(x){ return x[0] === q.id; })[0]; return {q: q, text: d[1], key: d[2], need: d[3], xp: d[4], done: q.p >= d[3]}; });
};
MG.weekAdd = function(cnt){ MG.weekly().forEach(function(x){ if (!x.q.c) x.q.p = Math.min(x.need, x.q.p + (cnt[x.key] || 0)); }); };
MG.weekClaim = function(id){ var x = MG.weekly().filter(function(y){ return y.q.id === id; })[0]; if (!x || !x.done || x.q.c) return 0; x.q.c = 1; MG.passAdd(x.xp); MG.save(); return x.xp; };
MG.daysLeft = function(){ return null; };   // no countdown: a season ends when the next one is released

// every match feeds the pass and the weekly challenges
var fin0 = MG.finish;
MG.finish = function(res){
  var out = fin0(res), st = res.me || {}, px;
  if (res.party || res.practice) return out;
  if (res.team) { out.pxb = (out.pxb || 0) + 60 + 10 * (st.goals || 0); out.lv += MG.addXp(120); out.xp += 120; }
  // coins only come from the season pass now: what a match used to pay in coins goes into pass XP instead
  px = Math.round(out.xp * (res.team ? 2 : 1.5)) + (out.pxb || 0); out.pass = px; out.tiers = MG.passAdd(px);
  MG.weekAdd({goals: st.goals, wins: res.win ? 1 : 0, twins: res.win && res.team ? 1 : 0, megs: st.megs, tackles: st.tackles, pok: res.team ? st.pok : 0, rwins: res.win && res.ranked ? 1 : 0, twos: st.twos, games: 1, blocks: st.blocks});
  MG.save(); return out;
};
var claim0 = MG.claim;
MG.claim = function(id){ var g = claim0(id); if (g) { MG.passAdd(300); MG.save(); } return g; };

// ---- the weekly shop: ten guaranteed items, one Mythic and two Legendary every week ----
MG.SHOPP = [400, 700, 1200, 2400, 5000, 10000, 16000, 25000];
var SLOTS = [5, 4, 4, 3, 3, 3, 2, 2, 1, 1], WS = {w: -1, list: []};
MG.weekShop = function(){
  var w = MG.week(), r, pool, used = {}, out = [];
  if (WS.w === w) return WS.list;
  r = MG.rng(w * 7919 + 13); pool = MG.ITEMS.filter(function(it){ return it.src === "shop" && it.t !== "stadium"; });   // stadiums have their own shelf
  SLOTS.forEach(function(q){
    var d, c;
    for (d = 0; d < 8; d++) {
      c = pool.filter(function(it){ return !used[it.id] && (it.r === q - d || it.r === q + d); });
      if (c.length) { c = c[Math.floor(r() * c.length)]; used[c.id] = 1; out.push(c); return; }
    }
  });
  WS = {w: w, list: out}; return out;
};
MG.shopPrice = function(it){ return MG.SHOPP[it.r] || 400; };
MG.shopBuy = function(id){
  var s = S(), it = MG.ITEM[id];
  if (!it || s.inv[id] || MG.weekShop().indexOf(it) < 0 || s.coins < MG.shopPrice(it)) return false;
  s.coins -= MG.shopPrice(it); s.inv[id] = 1; MG.save(); return true;
};
MG.BUNDLES = [["Season 1 Premium Pass", "Unlocks the premium track: every Season 1 signature kit, wrap, emote and banner."], ["Kickoff Bundle", "The premium pass plus 10 tiers skipped straight away."], ["Coin Chest", "A big pile of coins for packs and the weekly shop."]];

// ---- loadout presets ----
MG.presets = function(){ var s = S(); if (!s.pre) s.pre = []; return s.pre; };
MG.preSave = function(i, n){ var s = S(), p = MG.presets(); p[i] = {n: n || "Loadout " + (i + 1), eq: JSON.parse(JSON.stringify(s.eq)), look: JSON.parse(JSON.stringify(s.look))}; MG.save(); };
MG.preUse = function(i){ var s = S(), p = MG.presets()[i], k; if (!p) return false; for (k in p.eq) if (k === "stk" || s.inv[p.eq[k]]) s.eq[k] = p.eq[k]; s.look = JSON.parse(JSON.stringify(p.look)); MG.save(); return true; };

// ---- stickers: four slots ----
var equip0 = MG.equip;
MG.equip = function(id, slot){
  var s = S(), it = MG.ITEM[id];
  if (it && it.t === "sticker") { if (!s.inv[id]) return false; var k = s.eq.stk.indexOf(id); if (k >= 0) return true; s.eq.stk[slot == null ? 3 : slot] = id; if (slot == null) s.eq.stk = [id].concat(s.eq.stk.slice(0, 3)); MG.save(); return true; }
  return equip0(id);
};
})();
