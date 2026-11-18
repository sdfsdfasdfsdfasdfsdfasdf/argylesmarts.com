// MEGS meta: save data, coins and XP, Elo, quests, packs, the Ladder, cups and the simulated league. No DOM in here.
(function(){
"use strict";
var MG = window.MG, KEY = "megs.save.v1", S = null, mem = {}, wc = null, FREE = {home: 1, away: 1, classic: 1, t_none: 1, f_conf: 1, c_street: 1, e_wave: 1, bt_std: 1, w_none: 1, bn0: 1, st0: 1, st1: 1, st2: 1, st3: 1, h_crop: 1, h_curly: 1, h_long: 1, h_mohawk: 1, h_buzz: 1, h_bald: 1, sc_night: 1, sc_street: 1};
function ls(k, v){
  try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); }
  catch (e) { if (v === undefined) return mem[k] == null ? null : mem[k]; mem[k] = v; }
  return null;
}
function hash(s){ var h = 2166136261, i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function merge(a, b){ var o = {}, k; b = b || {}; for (k in a) o[k] = a[k] && typeof a[k] === "object" ? merge(a[k], b[k]) : b[k] == null ? a[k] : b[k]; return o; }

// every setting, with its default
MG.SET0 = {music: 0.35, vol: 0.7, sfx: 1, crowd: 0.6, mute: 0, shake: 1, flash: 1, fx: 1, names: 1, rings: 1, meter: 1, aim: 1, pops: 1, zoom: 0, pan: 1, cb: 0, net: 1, trail: 1, aura: 1, slow: 1, banner: 1, hints: 1, hud: 1, fps: 0,
  auto: 1, tsize: 1, top: 0.8, lefty: 0, buzz: 1, pad: 1, target: 5, two: 1, take: 1, sc: 12, clock: 0, diff: 1, dtap: 0,
  kv: 3,
  // k1: you against the computer. kp and k2: the two players in a party game on one keyboard
  k1: {up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", sh: "KeyJ", a: "KeyK", b: "KeyL", c: "KeyI", d: "KeyO"},
  kp: {up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", sh: "KeyR", a: "KeyT", b: "KeyY", c: "KeyF", d: "KeyG"},
  k2: {up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", sh: "KeyJ", a: "KeyK", b: "KeyL", c: "KeyI", d: "KeyO"}};
MG.LEVELS = ["Beginner", "Rookie", "Easy", "Casual", "Decent", "Solid", "Tough", "Hard", "Elite", "Brutal", "Unfair"];

function fresh(){
  return {v: 1, name: "", look: {skin: 0, hair: 0, hc: 0, num: 10}, arch: 5, al: {}, xp: 0, lvl: 1, coins: 500, elo: 1000, peak: 1000, games: 0, streak: 0, ladder: 0,
    inv: {home: 1, away: 1, classic: 1, t_none: 1, f_conf: 1, c_street: 1, e_wave: 1}, eq: {kit: "home", ball: "classic", trail: "t_none", fx: "f_conf", court: "c_street", emote: "e_wave"},
    cus: {p: "stripes", c: ["#3b6ef5", "#f2f2f7", "#1f2a55"]}, title: "Rookie", n: {}, pity: {street: 0, pro: 0}, q: {day: -1, list: [], bonus: 0}, hist: [], eh: [1000], cup: null, win1: -1, last: -1, set: {}};
}
MG.load = function(){
  var d = fresh(), o = null, k;
  try { o = JSON.parse(ls(KEY) || "null"); } catch (e) { o = null; }
  if (o && o.v === 1) for (k in o) d[k] = o[k];
  S = MG.S = d; S.set = merge(MG.SET0, S.set);
  if (!S.eq.emote) { S.eq.emote = "e_wave"; S.inv.e_wave = 1; }
  // season 1 slots: boots, wrap, banner and four stickers
  ["bt_std", "w_none", "bn0", "st0", "st1", "st2", "st3", "h_crop", "h_curly", "h_long", "h_mohawk", "h_buzz", "h_bald", "sc_night", "sc_street"].forEach(function(k){ S.inv[k] = 1; });
  if (!S.eq.hair) S.eq.hair = MG.HFREE ? MG.HFREE[(S.look.hair || 0) % 4] : "h_crop"; if (!S.eq.scene) S.eq.scene = "sc_night";
  if (!S.eq.boot) S.eq.boot = "bt_std"; if (!S.eq.wrap) S.eq.wrap = "w_none"; if (!S.eq.banner) S.eq.banner = "bn0"; if (!S.eq.stk) S.eq.stk = ["st0", "st1", "st2", "st3"];
  for (k in S.eq) if (typeof S.eq[k] === "string" && k !== "scene" && !MG.ITEM[S.eq[k]]) { if (fresh().eq[k]) S.eq[k] = fresh().eq[k]; else delete S.eq[k]; }
  if (!o || !o.set || o.set.kv !== 3) { ["k1", "kp", "k2"].forEach(function(k){ S.set[k] = JSON.parse(JSON.stringify(MG.SET0[k])); }); S.set.kv = 3; }   // the key layout changed: start everyone on the new one
  // a blank or missing key would leave the player unable to move: put the default back
  ["k1", "kp", "k2"].forEach(function(m){ var d0 = MG.SET0[m], kk = S.set[m] = S.set[m] || {}, k; for (k in d0) if (typeof kk[k] !== "string" || !kk[k]) kk[k] = d0[k]; });
  MG.quests(); MG.unlocks();
  return S;
};
MG.save = function(){ ls(KEY, JSON.stringify(S)); };
MG.reset = function(){ var st = S.set; S = MG.S = fresh(); S.set = st; MG.quests(); MG.save(); return S; };
MG.exportSave = function(){ return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); };
MG.importSave = function(str){
  var o;
  try { o = JSON.parse(decodeURIComponent(escape(atob(String(str).trim())))); } catch (e) { return false; }
  if (!o || o.v !== 1 || !o.inv || !o.eq) return false;
  ls(KEY, JSON.stringify(o)); MG.load(); return true;
};
MG.day = function(){ var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
MG.weekend = function(){ var d = new Date().getDay(); return d === 0 || d === 6; };

// ---- my player ----
MG.stat = function(k){ return k === "peak" ? S.peak : k === "ladder" ? S.ladder : S.n[k] || 0; };
MG.myStats = function(){ var b = MG.ARCH[S.arch][2], o = {}; MG.STATS.forEach(function(s, i){ o[s[0]] = Math.min(10, b[i] + (S.al[s[0]] || 0)); }); return o; };
MG.points = function(){ var u = 0, k; for (k in S.al) u += S.al[k]; return S.lvl - 1 - u; };
MG.spend = function(k){ if (MG.points() < 1 || MG.myStats()[k] >= 10) return false; S.al[k] = (S.al[k] || 0) + 1; MG.save(); return true; };
MG.respec = function(a){ if (a != null) S.arch = a; S.al = {}; MG.save(); };
MG.me = function(){ return {kit: S.eq.kit, cus: S.cus, look: S.look, trail: S.eq.trail, fx: S.eq.fx, emote: S.eq.emote, boot: S.eq.boot, wrap: S.eq.wrap, hair: S.eq.hair, banner: S.eq.banner, name: S.name || "You", ring: "#3b6ef5", human: true}; };
MG.equip = function(id){ var it = MG.ITEM[id]; if (!it || !S.inv[id]) return false; S.eq[it.t] = id; MG.save(); return true; };
MG.addXp = function(x){ var up = 0; S.xp += x; while (S.xp >= MG.xpNeed(S.lvl)) { S.xp -= MG.xpNeed(S.lvl); S.lvl++; up++; } return up; };
// hand out anything that has just been earned; returns the new items
MG.unlocks = function(){
  var got = [];
  if (ls("argyle.secret67") === "1") S.n.s67 = 1;
  MG.ITEMS.forEach(function(it){ if (it.need && !S.inv[it.id] && MG.stat(it.need[0]) >= it.need[1]) { S.inv[it.id] = 1; got.push(it); } });
  return got;
};
MG.titles = function(){ return MG.TITLES.filter(function(t){ return MG.stat(t[2]) >= t[3]; }); };

// ---- rivals ----
function stFor(lv, r){ var o = {}; MG.STATS.forEach(function(s){ o[s[0]] = MG.clamp(Math.round(3.6 + lv * 0.52 + (r() - 0.5) * 2.4), 2, 10); }); return o; }
MG.league = function(){ var d = MG.day(); if (!wc || wc.d !== d) wc = {d: d, w: MG.world(d)}; return wc.w; };
MG.sim = function(id){ var w = MG.league(), i; for (i = 0; i < w.length; i++) if (w[i].id === id) return w[i]; return w[0]; };
// a simulated league player as an opponent
MG.foe = function(p){
  var lv = MG.lvlFor(p.elo);
  return {id: p.id, name: p.n, elo: p.elo, lv: lv, st: stFor(lv, MG.rng(p.id * 97 + 5)), ball: p.ball, title: p.title, clan: p.clan,
    side: {kit: p.kit, look: {skin: p.skin, hair: p.hair, hc: p.hc, num: p.num}, trail: p.trail, fx: p.fx, name: p.n, ring: "#ff5d5d"}};
};
// one of the twenty Ladder rivals
MG.rival = function(i){
  var v = MG.RIVALS[i], r = MG.rng(hash(v[0])), st = {};
  MG.STATS.forEach(function(s, k){ st[s[0]] = v[2][k]; });
  return {id: -1 - i, name: v[0], elo: 0, lv: v[1] * 0.85, st: st, ball: v[4], line: v[5],
    side: {kit: v[3], look: {skin: Math.floor(r() * 5), hair: Math.floor(r() * 22), hc: Math.floor(r() * 7), num: 1 + Math.floor(r() * 99)}, trail: i > 11 ? "t_flame" : i > 5 ? "t_line" : "t_none", fx: i > 14 ? "f_bolt" : i > 7 ? "f_shock" : "f_conf", name: v[0], ring: "#ff5d5d"}};
};
// a CPU at a chosen level, for quick matches and party seats
MG.bot = function(lv, seed){
  var r = MG.rng(seed || 1), w = MG.league(), f = MG.foe(w[Math.floor(r() * w.length)]);
  f.lv = lv; f.st = stFor(lv, r); f.elo = 0; return f;
};
// the ranked board: 160 simulated players plus me
MG.board = function(key){
  var a = MG.league().map(function(p){ return {n: p.n, clan: p.clan, elo: p.elo, w: p.w, megs: p.megs, cups: p.cups, strk: p.strk, gaunt: p.gaunt, title: p.title, p: p}; });
  a.push({n: S.name || "You", clan: "", elo: S.elo, w: S.n.w || 0, megs: S.n.megs || 0, cups: S.n.cups || 0, strk: S.n.best || 0, gaunt: S.n.gaunt || 0, title: S.title, me: 1});
  a.sort(function(x, y){ return y[key] - x[key] || (x.me ? -1 : 1); });
  return a;
};
MG.rank = function(){ var b = MG.board("elo"), i; for (i = 0; i < b.length; i++) if (b[i].me) return i + 1; return b.length; };
// ranked matchmaking: someone close to my rating, and not the rival I just played
MG.match = function(){
  var w = MG.league(), c = [], band = 90;
  while (c.length < 4 && band < 3000) { c = w.filter(function(p){ return Math.abs(p.elo - S.elo) <= band && p.id !== S.last; }); band *= 1.6; }
  return MG.foe(c[Math.floor(Math.random() * c.length)]);
};
MG.eloD = function(opp, win){ var k = S.games < 10 ? 44 : 30, e = 1 / (1 + Math.pow(10, (opp - S.elo) / 400)), d = Math.round(k * ((win ? 1 : 0) - e)); return win ? Math.max(5, d) : Math.min(-3, d); };
MG.lobby = function(){ return 38 + Math.round(22 * (1 + Math.sin(Date.now() / 5.4e6))); };

// ---- after a match ----
// res: {mode, win, me: stats, sc: [mine, theirs], opp: {id, name, elo}, top, ranked, arcade, ladder, party, practice}
MG.finish = function(res){
  var st = res.me, n = S.n, out = {coins: 0, xp: 0, elo: 0, lv: 0, items: [], quests: [], first: 0, ladder: 0}, cnt;
  function add(k, v){ n[k] = (n[k] || 0) + (v || 0); }
  if (res.party || res.practice) return out;
  S.games++; add(res.win ? "w" : "l", 1); add("goals", st.goals); add("twos", st.twos); add("megs", st.megs); add("ankles", st.ankles); add("tackles", st.tackles); add("blocks", st.blocks); add("perfect", st.perfect); add("shots", st.shots); add("top", res.top);
  S.streak = res.win ? S.streak + 1 : 0; n.best = Math.max(n.best || 0, S.streak);
  out.coins = (res.win ? 60 : 25) + st.goals * 6 + st.megs * 12 + st.perfect * 4 + st.ankles * 8 + st.blocks * 3;
  out.xp = (res.win ? 90 : 40) + st.goals * 8 + st.megs * 10 + st.perfect * 3;
  if (res.ranked) {
    out.coins = Math.round(out.coins * 1.25); out.elo = MG.eloD(res.opp.elo, res.win);
    S.elo = Math.max(600, S.elo + out.elo); S.peak = Math.max(S.peak, S.elo); S.eh.push(S.elo); if (S.eh.length > 40) S.eh.shift();
    S.last = res.opp.id; if (MG.rank() === 1) n.first = 1;
  }
  if (res.win && res.mode === "moon") add("moon", 1);
  if (res.win && res.mode === "field") add("fieldw", 1);
  if (res.win && res.ladder != null && res.ladder === S.ladder) { S.ladder++; out.ladder = 1; out.coins += 80 + 20 * res.ladder; out.xp += 100 + 10 * res.ladder; }
  if (res.win && S.win1 !== MG.day()) { S.win1 = MG.day(); out.first = 1; out.coins += 100; }
  cnt = {goals: st.goals, twos: st.twos, megs: st.megs, perfect: st.perfect, wins: res.win ? 1 : 0, rwins: res.win && res.ranked ? 1 : 0, blocks: st.blocks, tackles: st.tackles, ankles: st.ankles, awins: res.win && res.arcade ? 1 : 0, fwins: res.win && res.mode === "field" ? 1 : 0};
  MG.quests().forEach(function(x){ if (!x.done) { x.q.p = Math.min(x.need, x.q.p + (cnt[x.key] || 0)); if (x.q.p >= x.need) out.quests.push(x.text); } });
  out.pxb = out.coins; out.coins = 0; out.lv = MG.addXp(out.xp);   // coins come from the season pass: this becomes pass XP
  S.hist.unshift({m: res.mode, w: res.win ? 1 : 0, s: res.sc.join("-"), o: res.opp.name, d: out.elo}); if (S.hist.length > 14) S.hist.pop();
  out.items = MG.unlocks(); MG.save();
  return out;
};

// ---- daily quests ----
MG.quests = function(){
  var d = MG.day(), r, pool, i;
  if (S.q.day !== d) { r = MG.rng(d * 31 + 7); pool = MG.QUESTS.slice(); S.q = {day: d, list: [], bonus: 0}; for (i = 0; i < 3; i++) S.q.list.push({id: pool.splice(Math.floor(r() * pool.length), 1)[0][0], p: 0, c: 0}); }
  return S.q.list.map(function(q){ var def = MG.QUESTS.filter(function(x){ return x[0] === q.id; })[0]; return {q: q, text: def[1], key: def[2], need: def[3], coins: def[4], done: q.p >= def[3]}; });
};
MG.claim = function(id){
  var got = 0;
  MG.quests().forEach(function(x){ if (x.q.id === id && x.done && !x.q.c) { x.q.c = 1; got = x.coins; } });
  if (got && !S.q.bonus && S.q.list.every(function(q){ return q.c; })) { S.q.bonus = 1; got += 150; }
  if (got && MG.passAdd) MG.passAdd(got * 5); MG.save(); return got * 5;
};

// ---- packs and the shop ----
MG.KINDS = [["", "Mixed"], ["kit", "Kits"], ["ball", "Balls"], ["trail", "Trails"], ["fx", "Celebrations"], ["emote", "Emotes"], ["court", "Cages"]];
MG.packCost = function(pk, kind){ return Math.round(pk.cost * (kind ? 1.25 : 1) / 10) * 10; };   // choosing what is inside costs a little more
MG.roll = function(pk, force, kind){
  var r = Math.random() * 100, a = 0, q = 7, i, pool = [];
  for (i = 0; i < 8; i++) { a += pk.odds[i]; if (r < a) { q = i; break; } }
  if (force && q < MG.LEG) q = MG.LEG;
  function of(k){ return MG.ITEMS.filter(function(it){ return it.r === k && it.src === "pack" && !FREE[it.id] && (!kind || it.t === kind); }); }
  while (!(pool = of(q)).length && q > 0) q--;
  while (!pool.length && q < 8) pool = of(++q);
  return pool[Math.floor(Math.random() * pool.length)];
};
// three items a pack; a duplicate pays coins back; the pity counter guarantees a Legendary or better
MG.openPack = function(id, kind){
  var pk = MG.PACKS.filter(function(p){ return p.id === id; })[0], out = [], hit = false, i, it, d;
  if (!pk || S.coins < MG.packCost(pk, kind)) return null;
  S.coins -= MG.packCost(pk, kind); S.pity[id] = (S.pity[id] || 0) + 1; S.n.packs = (S.n.packs || 0) + 1;
  for (i = 0; i < 3; i++) {
    it = MG.roll(pk, i === 2 && !hit && S.pity[id] >= pk.pity, kind); if (it.r >= MG.LEG) hit = true;
    d = !!S.inv[it.id]; if (d) S.coins += MG.DUPE[it.r]; else S.inv[it.id] = 1;
    out.push({it: it, dupe: d, back: d ? MG.DUPE[it.r] : 0});
  }
  if (hit) S.pity[id] = 0;
  MG.save(); return out;
};
MG.featured = function(){
  var r = MG.rng(MG.day() * 7919 + 13), pool = MG.ITEMS.filter(function(it){ return !it.need && it.r <= MG.LEG && !FREE[it.id]; }), out = [], i;
  for (i = 0; i < 4; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
};
MG.buy = function(id){ var it = MG.ITEM[id], p = it ? MG.PRICE[it.r] : 0; if (!it || it.need || it.r > MG.LEG || S.inv[id] || S.coins < p) return false; S.coins -= p; S.inv[id] = 1; MG.save(); return true; };
// one free item and a few coins, once a day
MG.freeReady = function(){ return S.free !== MG.day(); };
MG.freePack = function(){
  var it, d;
  if (!MG.freeReady()) return null;
  S.free = MG.day(); it = MG.roll(MG.PACKS[0]); d = !!S.inv[it.id];
  if (d) S.coins += MG.DUPE[it.r]; else S.inv[it.id] = 1;
  MG.save(); return [{it: it, dupe: d, back: d ? MG.DUPE[it.r] : 0}];
};

// ---- the Gauntlet: rivals one after another, each tougher, until you lose ----
MG.gauntLv = function(k){ return Math.min(10, 0.5 + k * 0.75); };
MG.gauntFoe = function(k){ return MG.bot(MG.gauntLv(k), 7001 + k * 131 + (S.n.gruns || 0) * 17); };
MG.gauntDone = function(win){
  var k = S.run ? S.run.k : 0, out = {k: k, coins: 0, end: !win};
  if (win) { out.coins = 0; out.xp = 150 + 50 * k; if (MG.passAdd) MG.passAdd(out.xp); S.run = {k: k + 1}; S.n.gaunt = Math.max(S.n.gaunt || 0, k + 1); }
  else { S.run = null; S.n.gruns = (S.n.gruns || 0) + 1; }
  out.items = MG.unlocks(); MG.save(); return out;
};

// ---- cups: eight players, three rounds ----
MG.cupStart = function(kind){
  var f = [{me: 1}], near, i;
  if (S.cup) return true;
  if (kind === "wknd" && !MG.weekend()) return false;
  near = MG.league().slice().sort(function(a, b){ return Math.abs(a.elo - S.elo) - Math.abs(b.elo - S.elo); }).slice(0, 26);
  for (i = 0; i < 7; i++) f.push({id: near.splice(Math.floor(Math.random() * near.length), 1)[0].id});
  S.cup = {kind: kind, round: 0, f: f, alive: [0, 1, 2, 3, 4, 5, 6, 7], log: []}; MG.save(); return true;
};
MG.cupFoe = function(){ return MG.foe(MG.sim(S.cup.f[S.cup.alive[1]].id)); };
MG.cupName = function(f, i){ return f[i].me ? S.name || "You" : MG.sim(f[i].id).n; };
// record my result, play out the rest of the round, then move on or go home
MG.cupDone = function(win, a, b){
  var c = S.cup, al = c.alive, T = c.round === 2 ? 5 : 3, next = [win ? al[0] : al[1]], row = [[al[0], al[1], a, b]], out = {prize: 0, end: false, champ: false, round: c.round, kind: c.kind}, i, x, y, w;
  for (i = 2; i < al.length; i += 2) {
    x = MG.sim(c.f[al[i]].id); y = MG.sim(c.f[al[i + 1]].id); w = Math.random() < 1 / (1 + Math.pow(10, (y.elo - x.elo) / 400));
    row.push([al[i], al[i + 1], w ? T : Math.floor(Math.random() * T), w ? Math.floor(Math.random() * T) : T]); next.push(w ? al[i] : al[i + 1]);
  }
  c.log.push(row);
  if (!win) { out.end = true; out.prize = [0, 240, 600][c.round]; }
  else if (c.round === 2) { out.end = out.champ = true; out.prize = c.kind === "wknd" ? 1400 : 2000; S.n.cups = (S.n.cups || 0) + 1; if (c.kind === "wknd") S.n.wknd = (S.n.wknd || 0) + 1; }
  else { c.round++; c.alive = next; }
  if (out.prize && MG.passAdd) MG.passAdd(out.prize); out.log = c.log; out.f = c.f;
  if (out.end) S.cup = null;
  out.items = MG.unlocks(); MG.save();
  return out;
};
})();
