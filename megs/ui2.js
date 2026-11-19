// MEGS season screens: campaign, 5-a-side matches, season pass, weekly shop, the bigger locker, presets, stickers and music.
(function(){
"use strict";
var MG = window.MG, R = MG.R, U = MG.ui, VIEW = U.VIEW, ACT = U.ACT, AFTER = U.AFTER, ic = U.ic, coin = U.coin, esc = U.esc, chips = U.chips, head = U.head, go = U.go, toast = U.toast, modal = U.modal, close = U.close;
function S(){ return MG.S; }
function $(id){ return document.getElementById(id); }
function star(on){ return '<svg class="ic st' + (on ? " on" : "") + '" viewBox="0 0 24 24"><use href="#i-star"/></svg>'; }
var RAR = function(it){ return MG.RAR[it.r] || MG.RAR[0]; };

// ---- previews for the new item types ----
function bootIcon(cv, it, t){
  var g = cv.getContext("2d"), w = cv.width, h = cv.height, c = it.c, s = w / 100, gr, i;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.save(); g.translate(w / 2 - 50 * s, h / 2 - 40 * s); g.scale(s, s); g.lineJoin = "round";
  if (it.r >= 4 && it.g) { g.shadowColor = it.g; g.shadowBlur = 18; }
  g.fillStyle = c[0]; g.strokeStyle = "rgba(8,9,22,.8)"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(14, 18); g.lineTo(40, 14); g.lineTo(46, 40); g.quadraticCurveTo(70, 42, 88, 52); g.quadraticCurveTo(94, 58, 88, 64); g.lineTo(12, 64); g.quadraticCurveTo(8, 40, 14, 18); g.closePath(); g.fill(); g.shadowBlur = 0; g.stroke();
  gr = g.createLinearGradient(0, 14, 0, 64); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.25)"); g.fillStyle = gr; g.fill();
  g.strokeStyle = c[1]; g.lineWidth = it.k === 1 ? 5 : 3.5;
  if (it.k === 2) { g.fillStyle = c[1]; g.beginPath(); g.moveTo(62, 44); g.quadraticCurveTo(80, 48, 88, 54); g.quadraticCurveTo(92, 60, 88, 64); g.lineTo(62, 64); g.closePath(); g.fill(); }
  else { g.beginPath(); g.moveTo(22, 52); g.quadraticCurveTo(48, 36, 76, 54); g.stroke(); }
  g.fillStyle = c[2]; g.fillRect(12, 62, 78, 6); g.fillStyle = "#17171c"; for (i = 0; i < 6; i++) g.fillRect(18 + i * 12, 68, 6, 6);
  g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.5; for (i = 0; i < 4; i++) { g.beginPath(); g.moveTo(26 + i * 5, 22 + i * 4); g.lineTo(38 + i * 3, 21 + i * 4); g.stroke(); }
  if (it.k === 3) { g.fillStyle = "#fff"; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); R.star(g, 70, 30, 7, 4, t); g.fill(); R.star(g, 30, 8, 5, 4, -t); g.fill(); }
  g.restore();
}
MG.visX = function(it, cls){
  if (it.t === "boot") return '<canvas class="sq ' + cls + '" data-boot="' + it.id + '" width="200" height="200"></canvas>';
  if (it.t === "wrap") return it.p ? '<canvas class="' + cls + '" data-wrap="' + it.id + '" width="300" height="400"></canvas>' : '<span class="sw ' + cls + '" style="background:repeating-linear-gradient(45deg,#22264a 0 8px,#1b1e3a 8px 16px)"></span>';
  if (it.t === "sticker") return '<canvas class="sq ' + cls + '" data-stk="' + it.id + '" width="200" height="200"></canvas>';
  if (it.t === "banner") return '<canvas class="bn ' + cls + '" data-bn="' + it.id + '" width="360" height="120"></canvas>';
  return "";
};
var LIVE = [], liveOn = 0;
function liveTick(){
  var t = performance.now() / 1000;
  LIVE = LIVE.filter(function(c){ return document.contains(c); });
  LIVE.forEach(function(c){ draw(c, t); });
  if (LIVE.length) requestAnimationFrame(liveTick); else liveOn = 0;
}
function draw(c, t){
  var d = c.dataset, g;
  if (d.boot) (R.bootPreview || bootIcon)(c, MG.ITEM[d.boot], t);
  else if (d.wrap) R.portrait(c, Object.assign({}, MG.me(), {wrap: d.wrap}), t, {turn: 0.4});
  else if (d.stk) { g = c.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); R.sticker(g, d.stk, c.width / 2, c.height / 2, c.width * 0.8, t); }
  else if (d.bn) R.banner(c, d.bn, t);
}
MG.paintX = function(){
  [].forEach.call(document.querySelectorAll("canvas[data-boot],canvas[data-wrap],canvas[data-stk],canvas[data-bn],canvas[data-live]"), function(c){
    var it = MG.ITEM[c.dataset.boot || c.dataset.wrap || c.dataset.stk || c.dataset.bn || ""];
    if (c._done) return; c._done = 1;
    if (c.dataset.live) { LIVE.push(c); if (!liveOn) { liveOn = 1; requestAnimationFrame(liveTick); } return; }
    if (it && (it.r >= 5 || it.t === "sticker" || c.classList.contains("big")) && !MG.still(c)) { LIVE.push(c); if (!liveOn) { liveOn = 1; requestAnimationFrame(liveTick); } }
    else draw(c, 1.2);
  });
};

// ---- music ----
var song = null, songOn = 0;
MG.music = function(){
  var st = MG.S && MG.S.set, v;
  if (!st) return;
  v = st.mute ? 0 : (st.music == null ? 0.35 : st.music) * (st.vol == null ? 0.7 : st.vol);
  if (!song && v > 0) { try { song = new Audio("/musicmegs.mp3"); song.loop = true; song.preload = "auto"; } catch (e) { song = null; } }
  if (!song) return;
  song.volume = MG.clamp(v * (document.body.classList.contains("playing") ? 0.28 : 1), 0, 1);
  if (v > 0 && songOn && song.paused) song.play().catch(function(){});
  if (v <= 0 && !song.paused) song.pause();
};
function wake(){ songOn = 1; MG.music(); }
window.addEventListener("pointerdown", wake); window.addEventListener("keydown", wake);
var apply0 = MG.applySet; MG.applySet = function(){ apply0(); MG.music(); };
setInterval(MG.music, 1500);

// ---- home ----
var home0 = VIEW.home;
VIEW.home = function(){
  var s = S(), cs = MG.campStars(), pt = MG.passTier(), rd = MG.passReady(), h = home0(), card;
  card = '<div class="season"><button class="sbig camp" data-a="go" data-v="campaign"><span class="kick">Campaign</span><b>Road to the Galaxy Cup</b><span>' + cs + ' of 108 stars &middot; 6 chapters of 5v5</span>' + ic("trophy") + '</button>' +
    '<button class="sbig team" data-a="go" data-v="team"><span class="kick">New</span><b>5v5</b><span>A full-size pitch, four team-mates, two halves</span>' + ic("users") + '</button>' +
    '<button class="sbig pass" data-a="go" data-v="pass"><span class="kick">Season ' + MG.SEASON.n + ': ' + MG.SEASON.name + '</span><b>Season Pass</b><span>Tier ' + pt + ' of 50' + (rd ? ' &middot; <i class="hot">' + rd + ' to claim</i>' : "") + '</span><span class="bar"><i style="width:' + Math.round((MG.pass().xp % MG.PASS_XP) / MG.PASS_XP * 100) + '%"></i></span>' + ic("star") + '</button>' +
    '<button class="sbig online" data-a="online"><span class="kick">Coming soon</span><b>Online</b><span>Play real people. Pick your position now: ' + ({gk: "Keeper", def: "Defender", fwd: "Striker"}[s.pos] || "Anywhere") + '</span>' + ic("bolt") + '</button></div>';
  h = h.replace('<div class="modes">', card + '<div class="modes">').replace('1v1 cage football</span>', 'Season ' + MG.SEASON.n + ': ' + MG.SEASON.name + '</span>');
  h = h.replace('<section class="panel"><h3>Lobby', weeklyPanel() + '</div><div class="cols"><section class="panel"><h3>Lobby');
  return h;
};
AFTER.home = AFTER.home;
function weeklyPanel(){
  return '<section class="panel"><h3>Weekly challenges <small>season pass XP</small></h3>' + MG.weekly().map(function(x){
    return '<div class="quest' + (x.q.c ? " done" : "") + '"><div><b>' + x.text + '</b><span class="bar"><i style="width:' + Math.round(x.q.p / x.need * 100) + '%"></i></span></div>' +
      (x.q.c ? '<span class="mute">Claimed</span>' : x.done ? '<button class="btn gold sm" data-a="wclaim" data-id="' + x.q.id + '">Claim ' + x.xp + ' XP</button>' : '<span class="mute">' + x.q.p + ' / ' + x.need + ' &middot; ' + x.xp + ' XP</span>') + '</div>';
  }).join("") + '<p class="mute">New challenges every Monday.</p></section>';
}
ACT.wclaim = function(d){ var x = MG.weekClaim(d.id); if (x) { MG.sfx("coin"); toast("+" + x + " season pass XP"); } go(U.cur(), U.arg()); };
ACT.online = function(){ modal('<h2>Online is coming soon</h2><p>Matches against real people are on the way. Until then every match, lobby and leaderboard in Megs is played by computer players.</p><div class="row center"><button class="btn" data-a="go" data-v="team">Play 5v5</button><button class="btn ghost" data-a="close">Close</button></div>'); };

// ---- 5-a-side matches ----
MG.ITEM.gk_a = {id: "gk_a", t: "kit", r: 0, p: "fade", c: ["#ffd23b", "#17171c", "#17171c"], num: 1};
MG.ITEM.gk_b = {id: "gk_b", t: "kit", r: 0, p: "fade", c: ["#5ee6a8", "#0f3d2a", "#0f3d2a"], num: 1};
var MATES = ["Sami", "Theo", "Kofi", "Nico", "Rafa", "Leo", "Omar", "Jude", "Milo", "Tariq"];
function mySides(){
  var me = MG.me(), s = S(), out = [], i;
  for (i = 0; i < 5; i++) out.push(Object.assign({}, me, {kit: i ? me.kit : "gk_a", wrap: i ? me.wrap : "w_none", calm: i !== 3, name: i === 3 ? (s.name || "You") : MATES[(i * 3 + s.look.num) % MATES.length], look: i === 3 ? s.look : {skin: (i * 2 + 1) % 5, hair: (i * 5 + s.look.num) % 22, hc: (i * 3) % 7, num: [1, 4, 5, 9, 10][i]}}));
  return out;
}
function foeSides(f){
  MG.ITEM[f.kit.id] = f.kit;
  return [0, 1, 2, 3, 4].map(function(i){ return {kit: i ? f.kit.id : "gk_b", name: f.names[i], look: {skin: (i * 3 + f.name.length) % 5, hair: (i * 7 + f.name.length) % 22, hc: (i * 5) % 7, num: [1, 3, 6, 7, 11][i]}, trail: "t_none", fx: "f_conf", boot: "bt" + ((f.name.length + i) % 20)}; });
}
var TEAMLV = [["0.5", "Beginner"], ["2.5", "Casual"], ["4.5", "Pro"], ["6.5", "Elite"], ["8.5", "Legend"]], tset = {lv: "2.5", half: "150"};
function randClub(lv){
  var k = Math.floor(Math.random() * 36), ch = MG.CAMP[Math.floor(k / 6)].m[k % 6], f = MG.club(ch);
  f.lv = lv; return f;
}
// o: {name, sub, foe, half, mate, mode, again, back, done(res, out)}
function teamGo(o){
  var s = S(), m = {team: 1, name: o.name, sub: o.sub, first: null, ball: s.eq.ball, cfg: {half: o.half || 150, lv: [o.mate || 5.5, o.foe.lv], mate: o.mate || 5.5, human: [true, false], names: [mySides().map(function(x){ return x.name; }), o.foe.names]},
    sides: [{name: s.name || "You"}, {name: o.foe.name}], teams: [mySides(), foeSides(o.foe)], src: [{k: "k1", arrows: 1, pad: 0, touch: 1}, null], st: [], ai: [], forfeit: 0};
  m.done = function(res){
    var out = MG.finish({mode: o.mode || "team", win: res.win, me: res.me, sc: res.sc, opp: {name: o.foe.name, elo: 0, id: -1}, top: 0, team: 1}), extra = o.after ? o.after(res) : null;
    MG.sfx(res.win ? "win" : "lose"); go("tres", {o: o, res: res, out: out, extra: extra});
  };
  m.quit = function(){ go(o.back || "home"); };
  o.again = o.again || function(){ teamGo(o); };
  modal('<div class="load"><div class="spin"></div><h2>' + esc(o.name) + '</h2><p>' + esc(s.name || "You") + ' and friends v ' + esc(o.foe.name) + '</p><p class="mute">Finding players... Online play is coming soon. For now every match is against computer teams.</p></div>');
  setTimeout(function(){ close(); MG.play(m); }, 1300);
}
MG.teamGo = teamGo;
VIEW.team = function(){
  return head("5v5", "Five against five on a full-size pitch with two halves. You steer whoever is nearest the ball; your team-mates and the other side are computer players.") +
    '<div class="cols"><section class="panel"><h3>Opponent strength</h3>' + chips(TEAMLV, tset.lv, "tlv") + '<h3>Half length</h3>' + chips([["90", "1.5 min"], ["150", "2.5 min"], ["240", "4 min"], ["360", "6 min"]], tset.half, "thalf") +
    '<div class="row"><button class="btn big" data-a="teamPlay">' + ic("play") + 'Kick off</button></div></section>' + controls() + '</div>';
};
function controls(){
  var k = S().set.k1, n = MG.keyName;
  return '<section class="panel"><h3>Controls</h3><div class="keys"><p><kbd>' + n(k.up) + '</kbd><kbd>' + n(k.left) + '</kbd><kbd>' + n(k.down) + '</kbd><kbd>' + n(k.right) + '</kbd> or arrows: move</p><p><kbd>' + n(k.sh) + '</kbd> hold and release in the green: shoot</p><p><kbd>' + n(k.a) + '</kbd> pass to the best-placed team-mate (hold a direction to choose)</p><p><kbd>' + n(k.d) + '</kbd> lob pass over the top</p><p><kbd>' + n(k.b) + '</kbd> tackle</p><p><kbd>' + n(k.c) + '</kbd> switch player</p><p><kbd>1</kbd>-<kbd>4</kbd> stickers</p></div></section>';
}
ACT.tlv = function(d){ tset.lv = d.id; go("team"); };
ACT.thalf = function(d){ tset.half = d.id; go("team"); };
ACT.teamPlay = function(){ var f = randClub(+tset.lv); teamGo({name: "5v5", sub: "Two halves of " + Math.round(+tset.half / 60 * 10) / 10 + " minutes", foe: f, half: +tset.half, mate: 6.5, back: "team"}); };

// ---- the result of a team match ----
VIEW.tres = function(a){
  var res = a.res, out = a.out, me = res.me, th = res.them, x = a.extra, s = S(), w = res.win, dr = res.draw, tot = me.poss + th.poss || 1, h,
    rows = [["Shots", "shots"], ["On target", "ont"], ["Passes completed", "pok"], ["Tackles", "tackles"], ["Saves", "saves"]];
  U.resA(a);
  h = '<div class="res ' + (w ? "win" : dr ? "" : "loss") + '"><span class="kick">' + esc(a.o.name) + '</span><h2>' + (res.quit ? "Forfeit" : w ? "You win" : dr ? "A draw" : "You lose") + '</h2><div class="score"><b>' + res.sc[0] + '</b><i>-</i><b>' + res.sc[1] + '</b></div><p class="mute">against ' + esc(a.o.foe.name) + '</p><div class="rw">' +
    (out.coins ? '<span class="pill">' + coin("+" + (out.coins + (x && x.coins || 0))) + '</span>' : "") + (out.xp ? '<span class="pill">+' + out.xp + ' XP</span>' : "") + (out.pass || x && x.pass ? '<span class="pill up">+' + ((out.pass || 0) + (x && x.pass || 0)) + ' pass XP</span>' : "") + (out.tiers ? '<span class="pill up">Season pass: ' + out.tiers + (out.tiers === 1 ? " tier" : " tiers") + ' up</span>' : "") + (out.lv ? '<span class="pill up">Level ' + s.lvl + '</span>' : "") + '</div>';
  if (x && x.stars != null) h += '<p class="stars">' + [1, 2, 3].map(function(k){ return star(k <= x.stars); }).join("") + '</p><p class="mute">Win for one star, win by two for two, win without conceding for three.</p>';
  if (w) h += '<div class="center"><canvas class="emo" data-emote="' + (MG.ITEM[s.eq.emote] || {k: "wave"}).k + '" width="300" height="400"></canvas></div>';
  h += (out.items || []).concat(x && x.items || []).map(function(it){ return '<p class="got" style="--r:' + MG.RAR[it.r].c + '">Unlocked: <b>' + it.n + '</b> <small>' + MG.RAR[it.r].n + '</small></p>'; }).join("") + (out.quests || []).map(function(q){ return '<p class="got">Quest done: <b>' + q + '</b></p>'; }).join("") + (out.notes || []).map(function(q){ return '<p class="got bpn">' + q + '</p>'; }).join("");
  h += '<div class="cmp"><b>You</b><span></span><b>' + esc(a.o.foe.name) + '</b>' + rows.map(function(r){ return '<b>' + me[r[1]] + '</b><span>' + r[0] + '</span><b>' + th[r[1]] + '</b>'; }).join("") + '<b>' + Math.round(me.poss / tot * 100) + '%</b><span>Possession</span><b>' + Math.round(th.poss / tot * 100) + '%</b></div>';
  return h + '<div class="row center">' + (a.o.next ? '<button class="btn big" data-a="tnext">' + ic("play") + 'Next match</button>' : "") + '<button class="btn ' + (a.o.next ? "ghost " : "") + 'big" data-a="again">' + ic("play") + (w ? "Play again" : "Try again") + '</button>' + (w ? '<button class="btn gold big" data-a="go" data-v="pass">' + ic("star") + 'Season pass</button>' : "") + '<button class="btn ghost big" data-a="go" data-v="' + (a.o.back || "home") + '">Done</button></div></div>';
};
ACT.tnext = function(){ var o = MG.ui.lastRes && MG.ui.lastRes.o; if (o && o.next) o.next(); };
U.nav.tres = "home"; U.nav.team = "home"; U.nav.campaign = "home";

// ---- campaign ----
VIEW.campaign = function(){
  var cp = MG.camp();
  return head("Campaign", "Six chapters, thirty-six clubs, 5v5 on the big pitch. Earn up to three stars a match and a unique kit for every chapter.") + MG.CAMP.map(function(ch, c){
    var open = MG.campOpen(c, 0), rw = MG.ITEM[ch.reward], got = S().inv[ch.reward], n = 0;
    ch.m.forEach(function(x){ n += cp[x.id] || 0; });
    return '<section class="panel chap' + (open ? "" : " off") + '"><div class="chh"><div><span class="kick">Chapter ' + (c + 1) + '</span><h2>' + ch.n + '</h2><p class="mute">' + ch.d + '</p><p>' + n + ' / 18 ' + star(1) + '</p></div><div class="rwd">' + U.vis(rw, "") + '<small>' + (got ? "Won: " : "Win the chapter for: ") + '<b style="color:' + MG.RAR[rw.r].c + '">' + rw.n + '</b></small></div></div><div class="cm">' +
      ch.m.map(function(x){ var ok = MG.campOpen(c, x.i), st = cp[x.id] || 0; return '<button class="cmm' + (x.boss ? " boss" : "") + (st ? " done" : "") + '"' + (ok ? ' data-a="camp" data-id="' + x.id + '"' : " disabled") + '><span class="kick">' + (x.boss ? "Final" : "Match " + (x.i + 1)) + '</span><b>' + x.club + '</b><span>' + (ok ? [1, 2, 3].map(function(k){ return star(k <= st); }).join("") : ic("lock") + " Locked") + '</span><small>' + MG.LEVELS[Math.round(MG.clamp(x.lv, 0, 10))] + ' &middot; +' + x.coins * 4 + ' XP</small></button>'; }).join("") + '</div></section>';
  }).join("");
};
function campMatch(id){ var k = +id.slice(1); return MG.CAMP[Math.floor(k / 6)].m[k % 6]; }
ACT.camp = function(d){
  var x = campMatch(d.id), f = MG.club(x), o;
  o = {name: MG.CAMP[x.ch].n + ": " + (x.boss ? "Final" : "match " + (x.i + 1)), sub: "Against " + x.club, foe: f, half: 150, mate: Math.min(9.5, 6 + x.ch * 0.7), mode: "campaign", back: "campaign",
    after: function(res){ return MG.campDone(x, res); }};
  o.next = function(){ var k = +x.id.slice(1) + 1; if (k < 36 && MG.campOpen(Math.floor(k / 6), k % 6)) ACT.camp({id: "c" + k}); else go("campaign"); };
  teamGo(o);
};
var res0 = VIEW.tres;
VIEW.tres = function(a){ MG.ui.lastRes = a; if (a.o.next && !(a.res.win)) a.o = Object.assign({}, a.o, {next: null}); return res0(a); };

// ---- season pass ----
VIEW.pass = function(){
  var p = MG.pass(), t = MG.passTier(), tiers = MG.passTiers(), into = p.xp % MG.PASS_XP;
  return '<div class="phead"><div><span class="kick">Season ' + MG.SEASON.n + ' &middot; runs until Season ' + (MG.SEASON.n + 1) + ' is released</span><h2>' + MG.SEASON.name + ' Pass</h2><p class="mute">Earn pass XP from every match, daily quests and weekly challenges. Coins come from wins and pass tiers. The free track has 10 items; the premium track has the rest, including every Mythic and Exotic. Tier ' + t + ' of 50.</p>' +
    '<div class="pbar"><i style="width:' + (t >= 50 ? 100 : Math.round(into / MG.PASS_XP * 100)) + '%"></i><span>' + (t >= 50 ? "Complete" : into + " / " + MG.PASS_XP + " XP to tier " + (t + 1)) + '</span></div></div>' +
    '<div class="prem"><b>Premium track</b><p class="mute">Every Mythic and Exotic item, the banners and the scenes.</p><button class="btn gold" disabled>Buyable soon</button></div></div>' +
    (MG.passReady() ? '<div class="row"><button class="btn gold" data-a="pclaimall">Claim all (' + MG.passReady() + ')</button></div>' : "") +
    (t >= 50 ? '<section class="panel"><h3>Bonus tiers</h3><p class="mute">Every 1000 pass XP after tier 50 is a bonus tier worth ' + coin(MG.BONUS) + '.</p>' + (MG.passBonus() ? '<button class="btn gold" data-a="pbonus">Claim ' + MG.passBonus() + ' bonus ' + (MG.passBonus() === 1 ? "tier" : "tiers") + '</button>' : '<span class="mute">Next bonus tier in ' + (MG.PASS_XP - into) + ' XP</span>') + '</section>' : "") +
    '<div class="tiers">' + tiers.map(function(x){
      var open = t > x.k, got = p.got[x.k];
      function rew(list, coins, prem){
        if (list.length) return list.map(function(it){ return '<button class="tr" style="--r:' + RAR(it).c + '" data-a="pitem" data-id="' + it.id + '">' + U.vis(it, "") + '<span>' + it.n + '</span></button>'; }).join("");
        return coins ? '<div class="tr coin">' + coin(coins) + '</div>' : '<div class="tr blank"></div>';
      }
      return '<div class="tier' + (open ? " open" : "") + (got ? " got" : "") + '"><b class="tn">' + (x.k + 1) + '</b><div class="free">' + rew(x.free, x.coins) + (open && !got ? '<button class="btn gold sm" data-a="pclaim" data-k="' + x.k + '">Claim</button>' : got ? '<span class="mute">Claimed</span>' : "") + '</div>' +
        '<div class="premt">' + rew(x.prem, x.pcoins, 1) + '<span class="lk">' + ic("lock") + 'Premium</span></div></div>';
    }).join("") + '</div>' + '<div class="cols">' + weeklyPanel() + '</div>';
};
AFTER.pass = function(){ var k = MG.passTier(), el = document.querySelectorAll(".tier")[Math.max(0, k - 2)]; if (el && el.scrollIntoView) { var box = el.parentNode; box.scrollLeft = el.offsetLeft - 20; } };
ACT.pclaim = function(d){ var g = MG.passClaim(+d.k); if (g) { MG.sfx("coin"); toast("Tier " + (+d.k + 1) + ": " + (g.items.length ? g.items.map(function(it){ return it.n; }).join(", ") : "") + (g.items.length && g.coins ? " and " : "") + (g.coins ? coin(g.coins) : "") + (g.items.length || g.coins ? "" : "nothing on this tier")); } go("pass"); };
ACT.pclaimall = function(){ var t = MG.passTier(), k, n = 0, c = 0, g; for (k = 0; k < t; k++) { g = MG.passClaim(k); if (g) { n += g.items.length; c += g.coins; } } MG.sfx("coin"); toast("Claimed " + n + " items and " + coin(c)); go("pass"); };
ACT.pitem = function(d){ ACT.item(d); };
ACT.pbonus = function(){ var c = MG.passBonusClaim(); if (c) { MG.sfx("coin"); toast("Bonus tiers: " + coin("+" + c)); } go("pass"); };
U.nav.pass = "pass";

// ---- shop: the weekly ten, bundles, then packs ----
var shop0 = VIEW.shop;
VIEW.shop = function(){
  var s = S(), h = shop0(), cut = h.indexOf('<section class="panel"><h3>Featured today'), left = 7 - ((MG.day() + 3) % 7);
  if (cut > 0) h = h.slice(0, cut);
  return '<section class="panel"><h3>This week&#39;s shop <small>resets in ' + left + (left === 1 ? " day" : " days") + '</small></h3><p class="mute">Ten items you can buy outright, no packs. Three Legendary every week.</p><div class="items wk">' + MG.weekShop().filter(function(it){ return it.t !== "stadium"; }).map(function(it){
    var p = MG.shopPrice(it);
    return '<div class="shopi">' + U.itemCard(it) + '<small class="ty">' + TYPE[it.t] + '</small>' + (s.inv[it.id] ? '<span class="mute">Owned</span>' : '<button class="btn gold sm" data-a="wbuy" data-id="' + it.id + '"' + (s.coins < p ? " disabled" : "") + '>' + coin(p) + '</button>') + '</div>';
  }).join("") + '</div></section>' + (MG.weekStadiums ? '<section class="panel"><h3>Stadiums this week</h3><p class="mute">The ground your 5v5 games are played in. Three new ones every week.</p><div class="items wk">' + MG.weekStadiums().map(function(it){
    var p = MG.shopPrice(it);
    return '<div class="shopi">' + U.itemCard(it) + '<small class="ty">Stadium</small>' + (s.inv[it.id] ? '<span class="mute">Owned</span>' : '<button class="btn gold sm" data-a="wbuy" data-id="' + it.id + '"' + (s.coins < p ? " disabled" : "") + '>' + coin(p) + '</button>') + '</div>';
  }).join("") + '</div></section>' : "") +
  '<section class="panel"><h3>Bundles <small>buyable soon</small></h3><div class="bund">' + MG.BUNDLES.map(function(b){ return '<div class="bd"><b>' + b[0] + '</b><p class="mute">' + b[1] + '</p><button class="btn gold sm" disabled>Buyable soon</button></div>'; }).join("") + '</div></section>' + h;
};
var TYPE = {kit: "Kit", ball: "Ball", trail: "Trail", fx: "Celebration", emote: "Emote", court: "Cage", boot: "Boots", wrap: "Wrap", sticker: "Sticker", banner: "Banner", hair: "Hair", scene: "Scene", stadium: "Stadium"};
ACT.wbuy = function(d){ if (MG.shopBuy(d.id)) { MG.sfx("coin"); toast("Bought " + MG.ITEM[d.id].n + "."); } else toast("Not enough coins."); go("shop"); };
MG.KINDS.splice(6, 0, ["boot", "Boots"], ["wrap", "Wraps"], ["sticker", "Stickers"], ["banner", "Banners"]);

// ---- locker ----
var stkSlot = 0;
VIEW.locker = function(tab){
  var s = S(), t = tab || "kit", tabs = [["kit", "Kits"], ["hair", "Hair"], ["wrap", "Wraps"], ["boot", "Boots"], ["ball", "Balls"], ["trail", "Trails"], ["fx", "Celebrations"], ["emote", "Emotes"], ["sticker", "Stickers"], ["banner", "Banners"], ["scene", "Scenes"], ["stadium", "Stadiums"], ["court", "Cages"], ["bp", "Blueprints"], ["pre", "Presets"], ["me", "Player"]],
    all = MG.ITEMS.filter(function(it){ return it.t === t; }), list = all.filter(function(it){ return s.inv[it.id]; }), own = list.length, body;
  // only what you own is shown, so the locker stays quick however big the catalogue gets
  list.sort(function(a, b){ return a.r - b.r || (a.n < b.n ? -1 : 1); });
  if (t === "me") body = U.VIEW._editor ? U.VIEW._editor() : "";
  else if (t === "pre") body = presets();
  else if (t === "bp") body = MG.bpView ? MG.bpView() : "";
  else body = (t === "sticker" ? stickerSlots() : "") + '<p class="mute">' + own + ' of ' + all.length + ' collected. Tap one to use it' + (t === "sticker" ? " in the selected slot" : "") + '. Find the rest in the shop, packs and the season pass.</p><div class="items' + (t === "banner" ? " wide" : "") + '">' + list.map(U.itemCard).join("") + '</div>' + (t === "kit" && s.inv.custom ? VIEW._maker() : "");
  return '<div class="lock"><section class="panel prev"><canvas id="pv" width="440" height="560"></canvas><canvas id="pvb" width="140" height="140"></canvas><canvas class="pbn" data-bn="' + s.eq.banner + '" data-live="1" width="360" height="120"></canvas><div class="eq">' +
    ["kit", "wrap", "boot", "ball", "trail", "fx", "emote", "court"].map(function(k){ var it = MG.ITEM[s.eq[k]] || MG.ITEM.home; return '<div><span>' + TYPE[k] + '</span><b style="color:' + RAR(it).c + '">' + it.n + '</b></div>'; }).join("") + '</div></section>' +
    '<div>' + chips(tabs, t, "ltab") + body + '</div></div>';
};
function stickerSlots(){ var s = S(); return '<div class="slots">' + s.eq.stk.map(function(id, i){ return '<button class="slot' + (i === stkSlot ? " on" : "") + '" data-a="sslot" data-i="' + i + '"><canvas class="sq" data-stk="' + id + '" width="120" height="120"></canvas><small>Key ' + (i + 1) + '</small></button>'; }).join("") + '</div>'; }
ACT.sslot = function(d){ stkSlot = +d.i; go("locker", "sticker"); };
function presets(){
  var p = MG.presets(), i, h = '<p class="mute">Save your whole look (kit, wrap, boots, ball, trail, celebration, emote, banner, stickers, cage and player look) and switch in one tap.</p><div class="pres">';
  for (i = 0; i < 6; i++) h += '<div class="pre"><b>' + (p[i] ? esc(p[i].n) : "Empty slot " + (i + 1)) + '</b>' + (p[i] ? '<small>' + (MG.ITEM[p[i].eq.kit] || MG.ITEM.home).n + ' &middot; ' + (MG.ITEM[p[i].eq.wrap] || {n: "No wrap"}).n + '</small>' : "") + '<div class="row">' + (p[i] ? '<button class="btn sm" data-a="preuse" data-i="' + i + '">Use</button>' : "") + '<button class="btn ghost sm" data-a="presave" data-i="' + i + '">' + (p[i] ? "Overwrite" : "Save current") + '</button></div></div>';
  return h + '</div>';
}
ACT.presave = function(d){ var n = window.prompt ? window.prompt("Name this loadout", "Loadout " + (+d.i + 1)) : null; MG.preSave(+d.i, n ? String(n).replace(/[^\w \-]/g, "").slice(0, 18) : ""); toast("Saved."); go("locker", "pre"); };
ACT.preuse = function(d){ if (MG.preUse(+d.i)) toast("Loadout on."); go("locker", "pre"); };
var item0 = ACT.item;
ACT.item = function(d){
  var it = MG.ITEM[d.id], s = S(), r = RAR(it), src, wk;
  if (s.inv[it.id]) { if (it.t === "sticker") { MG.equip(it.id, stkSlot); stkSlot = (stkSlot + 1) % 4; } else MG.equip(it.id); if (U.cur() === "locker") go("locker", it.t); else { toast("Now using " + it.n + "."); go(U.cur(), U.arg()); } return; }
  wk = MG.weekShop().indexOf(it) >= 0;
  src = it.src === "pass" ? "Season pass reward (free track). Earn pass XP by playing." : it.src === "season" ? "Season pass premium reward. The premium track is buyable soon." : it.src === "shop" ? (wk ? "In the weekly shop right now." : "A weekly shop item. Watch for it when the shop rotates.") : it.src === "earn" ? "How to earn it: " + it.how + "." : "Found in packs.";
  modal('<div class="center"><span class="rr" style="color:' + r.c + '">' + r.n + ' ' + (TYPE[it.t] || "") + '</span><h2>' + it.n + '</h2>' + U.vis(it, "big") + '<p>' + src + '</p><div class="row center">' +
    (wk ? '<button class="btn gold" data-a="wbuy" data-id="' + it.id + '"' + (s.coins < MG.shopPrice(it) ? " disabled" : "") + '>Buy ' + coin(MG.shopPrice(it)) + '</button>' : it.src === "pack" ? '<button class="btn" data-a="go" data-v="shop">Go to the shop</button>' : it.src === "pass" || it.src === "season" ? '<button class="btn" data-a="go" data-v="pass">Season pass</button>' : "") + '<button class="btn ghost" data-a="close">Close</button></div></div>');
};

// ---- profile: your banner on top ----
var prof0 = VIEW.profile;
VIEW.profile = function(){ var s = S(); return '<div class="card0"><canvas class="pbn" data-bn="' + s.eq.banner + '" data-live="1" width="720" height="200"></canvas><div class="cardt"><b>' + esc(s.name || "You") + '</b><span>' + esc(s.title) + ' &middot; Level ' + s.lvl + ' &middot; Season pass tier ' + MG.passTier() + '</span></div></div>' + prof0(); };

// ---- settings: music ----
var set0 = VIEW.settings;
VIEW.settings = function(){ var s = S().set; return '<section class="panel"><h3>Music</h3><div class="set"><div>Music volume<small>The Megs theme plays in menus and matches</small></div><input type="range" data-set="music" min="0" max="1" step="0.05" value="' + (s.music == null ? 0.35 : s.music) + '"></div></section>' + set0(); };

// a Pass tab in the navigation
(function(){
  var nav = $("nav"), b = document.createElement("button"), rk = nav && nav.querySelector('[data-v="ranks"]');
  if (!nav) return;
  b.className = "tab"; b.setAttribute("data-a", "go"); b.setAttribute("data-v", "pass"); b.innerHTML = ic("star") + "Pass";
  nav.insertBefore(b, rk || null);
})();
MG.boot();
})();
