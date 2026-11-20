// MEGS ui: every screen outside the match.
(function(){
"use strict";
var MG = window.MG, R = MG.R, VIEW = {}, AFTER = {}, ACT = {}, REG = [], tick = [], T0 = performance.now(), cur = "home", arg = null, pend = null, wait = 0, resA = null, party = null, quick = {mode: "quick", lv: 3};
var NAVOF = {quick: "home", ladder: "home", cups: "home", party: "home", pscore: "home", result: "home", help: "home", gauntlet: "home"};
var QM = ["quick", "field", "panna", "golden", "far", "moon", "blitz", "megmania", "turbo", "ice", "pinball", "heavy", "hot", "comeback"];
var MICO = {quick: "ball", panna: "bolt", golden: "star", far: "target", moon: "moon", blitz: "clock", practice: "ball", field: "pitch", megmania: "plus", turbo: "play", ice: "snow", pinball: "bounce", heavy: "weight", hot: "flame", comeback: "chart"};
var MCOL = {quick: "#2b62d9,#1a2f7a", panna: "#c2410c,#6b1d0a", golden: "#b9791a,#6b3d0c", far: "#0e7490,#0b3b52", moon: "#6d28d9,#2e1065", blitz: "#be123c,#5a0b22", field: "#15803d,#0b3d24", megmania: "#a21caf,#4a0d57", turbo: "#d97706,#7c2d12", ice: "#0284c7,#0c3a5e", pinball: "#db2777,#5b1040", heavy: "#475569,#1e293b", hot: "#dc2626,#5f1010", comeback: "#4f46e5,#221a6b"};
var TCOL = {none: "#2a2d55", dust: "#cfd3e6", line: "#ffffff", spark: "#ffd766", pixel: "#5ee6a8", rainbow: "linear-gradient(90deg,#ff4f7a,#ffd23b,#5ee6a8,#3b6ef5,#b266ff)", flame: "linear-gradient(90deg,#ff4f2a,#ffd23b)", ice: "#9fe0ff", bolt: "#fff6a8", star: "#c9a6ff", void: "linear-gradient(90deg,#0a0612,#8a3dff)", bubble: "#bfe9ff", leaf: "linear-gradient(90deg,#c2410c,#ffd23b)", toxic: "#a6ff3b", gold: "linear-gradient(90deg,#b8860b,#fff3b0)", comet: "linear-gradient(90deg,#16182e,#eaf6ff)", prism: "linear-gradient(90deg,#ff4f7a,#ffd23b,#5ee6a8,#5ee6ff,#b266ff)", nebula: "linear-gradient(90deg,#b266ff,#ff7ab8,#5ee6ff)"};
var FCOL = {confetti: "#ff7ab8", shock: "#3b6ef5", ink: "#5ee6a8", firework: "#ff4f7a", pixel: "#5ee6a8", bolt: "#9fd0ff", gold: "#ffd766", hole: "#8a3dff", ripple: "#3fcf8e", snow: "#dff1ff", laser: "#9fd0ff", volcano: "#ff5a1f", starfall: "#c9a6ff", aurora: "#5ee6a8", nova: "#ffb938"};
function $(id){ return document.getElementById(id); }
function S(){ return MG.S; }
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
function ic(n){ return '<svg class="ic" viewBox="0 0 24 24"><use href="#i-' + n + '"/></svg>'; }
function coin(n){ return '<span class="coin">' + ic("coin") + n + '</span>'; }
function tier(elo){ if (MG.rankHTML) return MG.rankHTML(elo); var t = MG.TIERS[MG.tier(elo)]; return '<span class="tier" style="--c:' + t.c + '">' + ic("shield") + t.n + '</span>'; }
function reg(side){ REG.push(side); return REG.length - 1; }
function head(t, sub){ return '<div class="vh"><button class="btn ghost sm" data-a="go" data-v="home">' + ic("back") + 'Back</button><div><h2>' + t + '</h2><p>' + (sub || "") + '</p></div></div>'; }
function chips(list, on, act){ return '<div class="chips">' + list.map(function(x){ return '<button class="chip' + (x[0] === on ? " on" : "") + '" data-a="' + act + '" data-id="' + x[0] + '">' + x[1] + '</button>'; }).join("") + '</div>'; }
function toast(h){ var d = document.createElement("div"); d.className = "toast"; d.innerHTML = h; $("toasts").appendChild(d); setTimeout(function(){ d.remove(); }, 3400); }
function modal(h, cls){ var m = $("modal"); m.innerHTML = '<div class="card ' + (cls || "") + '">' + h + '</div>'; m.hidden = false; paint(); }
function close(){ clearTimeout(wait); pend = null; $("modal").hidden = true; $("modal").innerHTML = ""; }
// draw every preview canvas on the page: data-s (a registered side), data-kit, data-ball
var ANIM = [], ticking = 0;
// emote canvases keep moving for as long as they are on the page
function emoTick(){
  var t = performance.now() / 1000;
  ANIM = ANIM.filter(function(c){ return document.contains(c); });
  ANIM.forEach(function(c){ R.portrait(c, MG.me(), t, {emote: c.dataset.emote, zoom: 3}); });
  if (ANIM.length) requestAnimationFrame(emoTick); else ticking = 0;
}
// in the shop and the locker the item cards stay still; only the big preview of the item you tapped moves
MG.still = function(c){ return (cur === "shop" || cur === "locker" || cur === "pass") && !c.classList.contains("big") && !c.classList.contains("emo") && !c.closest(".prev") && !c.closest("#modal"); };
function paint(){
  if (MG.paintX) MG.paintX();
  [].forEach.call(document.querySelectorAll("canvas[data-emote]"), function(c){ if (c._done) return; c._done = 1; if (MG.still(c)) { R.portrait(c, MG.me(), 1.2, {emote: c.dataset.emote, zoom: 3}); return; } ANIM.push(c); if (!ticking) { ticking = 1; requestAnimationFrame(emoTick); } });
  [].forEach.call(document.querySelectorAll("canvas[data-s],canvas[data-kit],canvas[data-ball]"), function(c){
    var d = c.dataset;
    if (c._done) return;
    c._done = 1;
    if (d.ball) R.ballIcon(c, d.ball, 0.8);
    else R.portrait(c, d.kit ? {kit: d.kit, cus: S().cus, look: S().look} : REG[+d.s], 1.3, {turn: +d.turn || 0, pose: d.pose || ""});
  });
}
function top(){
  var s = S();
  $("top").innerHTML = '<button class="me" data-a="go" data-v="profile"><canvas id="mep" width="96" height="124"></canvas><span><span class="nm">' + esc(s.name || "You") + '</span><span class="tt">' + esc(s.title) + ' &middot; Level ' + s.lvl + '</span><span class="xp"><i style="width:' + Math.round(s.xp / MG.xpNeed(s.lvl) * 100) + '%"></i></span></span></button>' +
    '<span class="pill">' + tier(s.elo) + '<b>' + s.elo + '</b></span><span class="pill">' + coin(s.coins) + '</span>';
  R.portrait($("mep"), MG.me(), 1.3, {bust: 1});
}
function go(v, a){
  var same = v === cur;
  cur = v; arg = a == null ? null : a; tick = []; REG = [];
  $("view").innerHTML = VIEW[v](arg); top();
  [].forEach.call(document.querySelectorAll("#nav [data-v]"), function(b){ b.classList.toggle("on", b.getAttribute("data-v") === (NAVOF[v] || v)); });
  if (AFTER[v]) AFTER[v](arg);
  paint(); if (!same) window.scrollTo(0, 0);
}
function loop(now){
  var t = (now - T0) / 1000, i;
  requestAnimationFrame(loop);
  if (!document.body.classList.contains("playing")) for (i = 0; i < tick.length; i++) tick[i](t);
}

// ---- home ----
function questRow(x){
  return '<div class="quest' + (x.q.c ? " done" : "") + '"><div><b>' + x.text + '</b><span class="bar"><i style="width:' + Math.round(x.q.p / x.need * 100) + '%"></i></span></div>' +
    (x.q.c ? '<span class="mute">Claimed</span>' : x.done ? '<button class="btn gold sm" data-a="claim" data-id="' + x.q.id + '">Claim ' + x.coins * 5 + ' XP</button>' : '<span class="mute">' + x.q.p + ' / ' + x.need + ' &middot; +' + x.coins * 5 + ' XP</span>') + '</div>';
}
VIEW.home = function(){
  var s = S(), m = [["ladder", "The Ladder", s.ladder + " of 20 rivals beaten", "ladder", "#1f8a5b,#0f4f3a"], ["cups", "Cups", s.cup ? "Cup in progress" : "Eight players, three rounds", "trophy", "#b9791a,#6b3d0c"], ["party", "Co-op", "Friends on one keyboard", "users", "#a23bb5,#4f1f6b"],
    ["field", "Full Field", "A whole pitch, a goal at each end", "pitch", "#15803d,#0b3d24"], ["gauntlet", "The Gauntlet", "Best run: " + (s.n.gaunt || 0) + (s.n.gaunt === 1 ? " round" : " rounds"), "shield", "#b91c1c,#4a0d0d"],
    ["quick", "Quick and Arcade", QM.length + " ways to play", "bolt", "#2b62d9,#1a2f7a"], ["practice", "Kickabout", "No clock, no score", "ball", "#2c8fa3,#15475a"], ["help", "How to play", "Moves, timing and rules", "book", "#3d4370,#22264a"]];
  return '<div class="hero"><canvas id="demo"></canvas><div class="heroT"><span class="kick">1v1 cage football</span><h2>Megs</h2><p>First to five. Long range counts double. Score and you keep the ball.</p>' +
    '<div class="row"><button class="btn big" data-a="ranked">' + ic("play") + 'Play Ranked</button><button class="btn ghost big" data-a="go" data-v="quick">Quick Match</button></div></div></div>' +
    '<div class="modes">' + m.map(function(x){ return '<button class="mode" style="--g:linear-gradient(135deg,' + x[4] + ')" data-a="' + (x[0] === "practice" || x[0] === "field" ? x[0] : "go") + '" data-v="' + x[0] + '">' + ic(x[3]) + '<b>' + x[1] + '</b><span>' + x[2] + '</span></button>'; }).join("") + '</div>' +
    '<div class="cols"><section class="panel"><h3>Daily quests</h3>' + MG.quests().map(questRow).join("") + '<p class="mute">Finish all three for a 750 XP bonus. New quests every day.</p></section>' +
    '<section class="panel"><h3>Lobby <small>simulated</small></h3><div id="lobby"></div><p class="mute"><b>' + MG.lobby() + '</b> CPU players are hanging around the cage. Everyone in here is computer controlled.</p></section></div>';
};
AFTER.home = function(){
  var box = $("lobby"), next = 0;
  MG.demo($("demo"));
  tick.push(function(t){
    var w, p, d;
    if (t < next || !box.isConnected) return;
    next = t + 1.6 + Math.random() * 2.6; w = MG.league(); p = w[Math.floor(Math.random() * w.length)];
    d = document.createElement("div"); d.className = "chat"; d.innerHTML = '<b style="color:' + MG.TIERS[MG.tier(p.elo)].c + '">' + esc(p.n) + '</b> ' + MG.CHAT[Math.floor(Math.random() * MG.CHAT.length)];
    box.appendChild(d); while (box.children.length > 6) box.removeChild(box.firstChild);
  });
};

// ---- starting matches ----
// a solo match against a rival from MG.foe, MG.rival or MG.bot
function start(foe, o){
  var s = S();
  o.sides = [MG.me(), foe.side]; o.st = [MG.myStats(), foe.st]; o.ai = [null, foe.lv]; o.src = [{k: "k1", arrows: 1, pad: 0, touch: 1}, null]; o.ball = s.eq.ball; o.court = s.eq.court;
  o.again = o.again || function(){ start(foe, o); };
  o.done = o.done || function(res){
    var out = MG.finish({mode: o.mode, win: res.win, me: res.me, sc: res.sc, opp: foe, top: res.top, ranked: o.ranked, arcade: o.arcade, ladder: o.ladder});
    MG.sfx(res.win ? "win" : "lose"); go("result", {o: o, foe: foe, res: res, out: out});
  };
  o.quit = function(){ go(o.back || "home"); };
  intro(foe, o);
}
function intro(foe, o){
  var s = S();
  REG = []; pend = function(){ MG.play(o); };
  modal('<div class="vs"><div><canvas data-s="' + reg(MG.me()) + '" data-turn="0.45" width="300" height="400"></canvas><b>' + esc(s.name || "You") + '</b><small>' + (o.ranked ? tier(s.elo) + " " + s.elo : esc(s.title)) + '</small></div><div class="v">VS</div>' +
    '<div><canvas data-s="' + reg(foe.side) + '" data-turn="-0.45" width="300" height="400"></canvas><b>' + esc(foe.name) + '</b><small>' + (foe.elo ? tier(foe.elo) + " " + foe.elo : MG.LEVELS[Math.round(MG.clamp(foe.lv, 0, 10))]) + '</small></div></div>' +
    '<p class="center"><b>' + o.name + '</b><br><span class="mute">' + (o.sub || "") + '</span></p>' + (foe.line ? '<p class="quote">' + esc(foe.line) + '</p>' : "") +
    '<div class="row center"><button class="btn big" data-a="kick">' + ic("play") + 'Kick off</button><button class="btn ghost" data-a="close">Back</button></div>', "wide");
}
ACT.kick = function(){ var f = pend; close(); if (f) f(); };
ACT.close = close;
ACT.go = function(d){ close(); go(d.v, d.arg); };
ACT.ranked = function(){
  var foe = MG.match();
  modal('<div class="center"><div class="spin"></div><h2>Finding a rival</h2><p class="mute">Looking through the CPU league for someone rated near ' + S().elo + '.</p><button class="btn ghost" data-a="close">Cancel</button></div>');
  wait = setTimeout(function(){ start(foe, {name: "Ranked 1v1", sub: "First to 5. Long range counts double. Your rating is on the line.", cfg: {}, mode: "ranked", ranked: 1, forfeit: 1, again: function(){ ACT.ranked(); }}); }, 800 + Math.random() * 1200);
};
ACT.field = function(){ quick.mode = "field"; go("quick"); };
ACT.practice = function(){
  var f = MG.bot(-1, 5);
  f.name = f.side.name = "Training dummy";
  start(f, {name: "Kickabout", sub: "No clock, no score. Pause to leave.", cfg: MG.MODES.practice.cfg, mode: "practice", first: 0, done: function(){ go("home"); }});
};
function rules(){ var st = S().set; return {target: st.clock ? 0 : st.target, two: !!st.two, take: !!st.take, sc: st.sc, clock: st.clock}; }
function ruleText(c){ return (c.clock ? Math.round(c.clock) + " seconds" : "First to " + c.target) + (c.two ? ". Long range counts double" : "") + (c.take ? ". Scorer keeps the ball." : ". Possession swaps after a goal."); }
VIEW.quick = function(){
  var ms = QM;
  return head("Quick and Arcade", "Pick a game, then how tough the rival should be. Nothing but coins and XP on the line.") +
    '<div class="modes">' + ms.map(function(k){ var m = MG.MODES[k]; return '<button class="mode' + (quick.mode === k ? " sel" : "") + '" style="--g:linear-gradient(135deg,' + MCOL[k] + ')" data-a="qmode" data-id="' + k + '">' + ic(MICO[k]) + '<b>' + m.n + '</b><span>' + (k === "quick" ? ruleText(rules()) : m.d) + '</span></button>'; }).join("") + '</div>' +
    '<section class="panel kickp"><h3>Rival</h3><div class="set"><div>Difficulty<small id="lvn">' + MG.LEVELS[quick.lv] + '</small></div><input type="range" min="0" max="10" step="1" value="' + quick.lv + '" id="qlv"></div>' +
    '<div class="row"><button class="btn big" data-a="playQuick">' + ic("play") + 'Kick off</button></div><p class="mute">The rules for Quick Match can be changed in Settings.</p></section>';
  // (the Rival panel with Kick off stays stuck to the bottom of the screen, so you never have to scroll to it)
};
AFTER.quick = function(){ $("qlv").addEventListener("input", function(){ quick.lv = +this.value; $("lvn").textContent = MG.LEVELS[quick.lv]; }); };
ACT.qmode = function(d){ quick.mode = d.id; go("quick"); };
ACT.playQuick = function(){
  var k = quick.mode, m = MG.MODES[k], f = MG.bot(quick.lv, Math.floor(Math.random() * 1e6)), c = k === "quick" ? rules() : m.cfg;
  S().set.diff = quick.lv; MG.save();
  start(f, {name: m.n, sub: k === "quick" ? ruleText(c) : m.d, cfg: c, mode: k, arcade: k !== "quick", back: "quick"});
};

// ---- after the match ----
VIEW.result = function(a){
  var res = a.res, out = a.out, me = res.me, th = res.them, w = res.win, tot = me.poss + th.poss || 1, cup = a.cup, s = S(), rn = ["quarter-final", "semi-final", "final"],
    rows = [["Shots", "shots"], ["In the green", "green"], ["Perfect", "perfect"], ["Megs", "megs"], ["Ankles broken", "ankles"], ["Tackles", "tackles"], ["Blocks", "blocks"]], h;
  resA = a;
  h = '<div class="res ' + (w ? "win" : "loss") + '"><span class="kick">' + esc(a.o.name) + '</span><h2>' + (res.quit ? "Forfeit" : w ? "You win" : "You lose") + '</h2><div class="score"><b>' + res.sc[0] + '</b><i>-</i><b>' + res.sc[1] + '</b></div><p class="mute">against ' + esc(a.foe.name) + '</p><div class="rw">' +
    (out.coins ? '<span class="pill">' + coin("+" + out.coins) + '</span>' : "") + (out.xp ? '<span class="pill">+' + out.xp + ' XP</span>' : "") + (out.pass ? '<span class="pill up">+' + out.pass + ' pass XP</span>' : "") + (out.tiers ? '<span class="pill up">Season pass: ' + out.tiers + (out.tiers === 1 ? " tier" : " tiers") + ' up</span>' : "") + (out.elo ? '<span class="pill ' + (out.elo > 0 ? "up" : "dn") + '">' + (out.elo > 0 ? "+" : "") + out.elo + ' rating</span>' : "") +
    (out.lv ? '<span class="pill up">Level ' + s.lvl + ': a skill point to spend</span>' : "") + (out.first ? '<span class="pill">First win of the day +100</span>' : "") + (out.ladder ? '<span class="pill up">Ladder rival beaten</span>' : "") + '</div>';
  if (a.res.win) h += '<div class="center"><canvas class="emo" data-emote="' + (MG.ITEM[s.eq.emote] || {k: "wave"}).k + '" width="300" height="400"></canvas></div>';
  if (a.gaunt) h += '<p class="got">' + (a.gaunt.end ? "The run ends in round " + (a.gaunt.k + 1) + ". Best run: " + (s.n.gaunt || 0) + "." : "Round " + (a.gaunt.k + 1) + " cleared. +" + a.gaunt.xp + " pass XP") + '</p>';
  if (cup) h += '<p class="got">' + (cup.champ ? "Champions! The cup is yours. +" + cup.prize + " pass XP" : cup.end ? "Knocked out in the " + rn[cup.round] + (cup.prize ? ". +" + cup.prize + " pass XP" : ".") : "Through to the " + rn[cup.round + 1] + ".") + '</p>';
  h += out.items.concat(cup ? cup.items : [], a.gaunt ? a.gaunt.items : []).map(function(it){ return '<p class="got" style="--r:' + MG.RAR[it.r].c + '">Unlocked: <b>' + it.n + '</b> <small>' + MG.RAR[it.r].n + '</small></p>'; }).join("") + out.quests.map(function(q){ return '<p class="got">Quest done: <b>' + q + '</b></p>'; }).join("") + (out.notes || []).map(function(q){ return '<p class="got bpn">' + q + '</p>'; }).join("");
  h += '<div class="cmp"><b>You</b><span></span><b>' + esc(a.foe.name) + '</b>' + rows.map(function(r){ return '<b>' + me[r[1]] + '</b><span>' + r[0] + '</span><b>' + th[r[1]] + '</b>'; }).join("") + '<b>' + Math.round(me.poss / tot * 100) + '%</b><span>Possession</span><b>' + Math.round(th.poss / tot * 100) + '%</b></div>';
  if (cup) h += bracket(cup.f, cup.log, s.cup ? s.cup.alive : null, s.cup ? s.cup.round : 9);
  return h + '<div class="row center">' + (cup ? (cup.end ? "" : '<button class="btn big" data-a="go" data-v="cups">Next round</button>') : '<button class="btn big" data-a="again">' + ic("play") + (a.gaunt ? (a.gaunt.end ? "New run" : "Next rival") : a.o.ranked ? "Next match" : "Play again") + '</button>') + (w ? '<button class="btn gold big" data-a="go" data-v="pass">' + ic("star") + 'Season pass</button>' : "") + '<button class="btn ghost big" data-a="go" data-v="' + (a.o.back || "home") + '">Done</button></div></div>';
};
ACT.again = function(){ var a = resA; if (a && a.o.again) a.o.again(); };

// ---- the Ladder ----
VIEW.ladder = function(){
  var s = S();
  return head("The Ladder", "Twenty rivals, each tougher than the last. Beat one to unlock the next.") + '<div class="lad">' + MG.RIVALS.map(function(v, i){
    var st = i < s.ladder ? "done" : i === s.ladder ? "next" : "lock";
    return '<div class="rv ' + st + '"><span class="no">' + (i + 1) + '</span><canvas data-s="' + reg(MG.rival(i).side) + '" width="120" height="160"></canvas><div class="rt"><b>' + esc(v[0]) + '</b><small>' + esc(v[5]) + '</small><span class="bar"><i style="width:' + Math.round(v[1] * 10) + '%"></i></span></div>' +
      (st === "lock" ? '<span class="mute">' + ic("lock") + '</span>' : '<button class="btn ' + (st === "done" ? "ghost " : "") + 'sm" data-a="rival" data-i="' + i + '">' + (st === "done" ? "Rematch" : "Play") + '</button>') + '</div>';
  }).join("") + '</div>';
};
ACT.rival = function(d){ var i = +d.i, t = i > 14 ? 5 : 3; start(MG.rival(i), {name: "Ladder: rival " + (i + 1) + " of 20", sub: "First to " + t + ". Long range counts double.", cfg: {target: t}, mode: "ladder", ladder: i, back: "ladder"}); };

// ---- the Gauntlet ----
VIEW.gauntlet = function(){
  var s = S(), k = s.run ? s.run.k : 0, f = MG.gauntFoe(k), b = MG.board("gaunt"), me = 0, i;
  for (i = 0; i < b.length; i++) if (b[i].me) me = i;
  return head("The Gauntlet", "Rivals one after another, each tougher than the last. Every game is first to 3. One loss ends the run.") + '<div class="cols"><section class="panel center"><span class="kick">' + (s.run ? "Run in progress" : "New run") + '</span><h2>Round ' + (k + 1) + '</h2>' +
    '<canvas class="big" data-s="' + reg(f.side) + '" width="300" height="400"></canvas><p><b>' + esc(f.name) + '</b><br><span class="mute">' + MG.LEVELS[Math.round(f.lv)] +  ' &middot; win: +' + (150 + 50 * k) + ' pass XP' + '</span></p><div class="row center"><button class="btn big" data-a="gauntPlay">' + ic("play") + 'Play round ' + (k + 1) + '</button></div></section>' +
    '<section class="panel"><h3>Best runs <small>simulated</small></h3><table class="tbl">' + b.slice(0, 8).map(function(x, n){ return '<tr class="' + (x.me ? "mine" : "") + '"><td>' + (n + 1) + '</td><td><b>' + esc(x.n) + '</b></td><td class="num">' + x.gaunt + '</td></tr>'; }).join("") +
    (me > 7 ? '<tr class="gap"><td colspan="3">&middot; &middot; &middot;</td></tr><tr class="mine"><td>' + (me + 1) + '</td><td><b>' + esc(b[me].n) + '</b></td><td class="num">' + b[me].gaunt + '</td></tr>' : "") + '</table><p class="mute">Your best run is ' + (s.n.gaunt || 0) + '. Clear 8 rounds in one run to earn the Survivor kit.</p></section></div>';
};
ACT.gauntPlay = function(){
  var s = S(), k = s.run ? s.run.k : 0, foe = MG.gauntFoe(k), o;
  if (!s.run) { s.run = {k: 0}; MG.save(); }
  o = {name: "Gauntlet: round " + (k + 1), sub: "First to 3. Lose and the run is over.", cfg: {target: 3}, mode: "gauntlet", forfeit: 1, back: "gauntlet", again: function(){ go("gauntlet"); }};
  o.done = function(res){
    var out = MG.finish({mode: "gauntlet", win: res.win, me: res.me, sc: res.sc, opp: foe, top: res.top}), gr = MG.gauntDone(res.win);
    MG.sfx(res.win ? "win" : "lose"); go("result", {o: o, foe: foe, res: res, out: out, gaunt: gr});
  };
  start(foe, o);
};

// ---- cups ----
function mrow(f, a, b, sa, sb){
  var d = sa != null;
  return '<div class="m"><div class="' + (f[a].me ? "mine " : "") + (d && sa > sb ? "w" : "") + '"><span>' + esc(MG.cupName(f, a)) + '</span><b>' + (d ? sa : "") + '</b></div><div class="' + (f[b].me ? "mine " : "") + (d && sb > sa ? "w" : "") + '"><span>' + esc(MG.cupName(f, b)) + '</span><b>' + (d ? sb : "") + '</b></div></div>';
}
function bracket(f, log, alive, round){
  var h = '<div class="br">', names = ["Quarter-finals", "Semi-finals", "Final"], r, i;
  for (r = 0; r < 3; r++) {
    h += '<div><h3>' + names[r] + '</h3>';
    if (log[r]) for (i = 0; i < log[r].length; i++) h += mrow(f, log[r][i][0], log[r][i][1], log[r][i][2], log[r][i][3]);
    else if (r === round && alive) for (i = 0; i < alive.length; i += 2) h += mrow(f, alive[i], alive[i + 1]);
    else for (i = 0; i < 4 >> r; i++) h += '<div class="m tbd"><div><span>To be decided</span></div><div><span>To be decided</span></div></div>';
    h += '</div>';
  }
  return h + '</div>';
}
VIEW.cups = function(){
  var s = S(), c = s.cup, rn = ["quarter-final", "semi-final", "final"];
  if (!c) return head("Cups", "Eight players, three knockout rounds. Lose once and you are out.") + '<div class="cols">' +
    '<section class="panel"><h3>Street Cup</h3><p>Free entry. The winner takes 2000 season pass XP. Quarter and semi-finals are first to 3, the final is first to 5.</p><button class="btn" data-a="cup" data-id="cup">Enter the cup</button></section>' +
    '<section class="panel"><h3>Weekend Cup</h3><p>Free entry, Saturdays and Sundays only. The winner takes 1400 season pass XP and the Weekender kit.</p><button class="btn" data-a="cup" data-id="wknd"' + (MG.weekend() ? "" : " disabled") + '>' + (MG.weekend() ? "Enter the cup" : "Opens at the weekend") + '</button></section></div><p class="mute">Cups won so far: ' + (s.n.cups || 0) + '. Your first cup win opens the Kit Maker.</p>';
  return head(c.kind === "wknd" ? "Weekend Cup" : "Street Cup", "You are in the " + rn[c.round] + ".") + bracket(c.f, c.log, c.alive, c.round) + '<div class="row center"><button class="btn big" data-a="cupPlay">' + ic("play") + 'Play the ' + rn[c.round] + '</button></div>';
};
ACT.cup = function(d){ if (MG.cupStart(d.id)) go("cups"); else toast("Not enough coins for the entry fee."); };
ACT.cupPlay = function(){
  var c = S().cup, foe, t, o;
  if (!c) return go("cups");
  foe = MG.cupFoe(); t = c.round === 2 ? 5 : 3;
  o = {name: (c.kind === "wknd" ? "Weekend Cup " : "Street Cup ") + ["quarter-final", "semi-final", "final"][c.round], sub: "First to " + t + ". Lose and you are out.", cfg: {target: t}, mode: "cup", forfeit: 1, back: "cups"};
  o.done = function(res){
    var out = MG.finish({mode: "cup", win: res.win, me: res.me, sc: res.sc, opp: foe, top: res.top}), cr = MG.cupDone(res.win, res.sc[0], res.sc[1]);
    MG.sfx(res.win ? "win" : "lose"); go("result", {o: o, foe: foe, res: res, out: out, cup: cr});
  };
  start(foe, o);
};

// ---- party: friends on one keyboard ----
function clean(v){ return String(v).replace(/[^\w \-]/g, "").trim().slice(0, 12); }
function pkits(){ return MG.ITEMS.filter(function(it){ return it.t === "kit" && it.id !== "custom" && (it.r <= 1 || S().inv[it.id]); }).map(function(it){ return it.id; }); }
function newParty(){ var s = S(); return {seats: [{n: s.name || "Player 1", cpu: 0, lv: 4, kit: s.eq.kit === "custom" ? "home" : s.eq.kit}, {n: "Player 2", cpu: 0, lv: 4, kit: "away"}], fmt: "stay", mode: "quick", wins: [], q: [], cur: [0, 1], log: [], stage: 0, champ: -1, sf: []}; }
function seatSide(p, i, ring){ var st = p.seats[i]; return {kit: st.kit, look: {skin: i * 2 % 5, hair: i % 4, hc: i * 3 % 7, num: 7 + i * 4}, trail: ["t_line", "t_spark", "t_rain", "t_ice"][i], fx: ["f_conf", "f_shock", "f_ink", "f_pix"][i], name: st.n, ring: ring, human: !st.cpu}; }
VIEW.party = function(){
  var p = party || (party = newParty()), fm = [["stay", "Winner stays on"], ["duel", "Best of three"], ["cup", "Knockout"]], ms = QM.filter(function(k){ return !MG.MODES[k].solo; }),
    fd = {stay: "Two play, the winner stays on and the loser goes to the back of the queue. First to three wins takes the party.", duel: "The first two players, best of three games.", cup: "Four players, two semi-finals and a final. Empty seats are filled by CPU players."};
  return head("Co-op", "Pass the keyboard around. Two play at a time: the player on the left uses the Player 1 keys, the player on the right uses the Player 2 keys.") +
    '<section class="panel"><h3>Players</h3>' + p.seats.map(function(st, i){
      return '<div class="seat"><canvas data-s="' + reg(seatSide(p, i, "#3b6ef5")) + '" width="96" height="128"></canvas><input type="text" maxlength="10" value="' + esc(st.n) + '" data-seat="' + i + '" data-f="n" aria-label="Player name">' +
        '<select data-seat="' + i + '" data-f="cpu" aria-label="Human or CPU"><option value="0"' + (st.cpu ? "" : " selected") + '>Human</option><option value="1"' + (st.cpu ? " selected" : "") + '>CPU</option></select>' +
        (st.cpu ? '<select data-seat="' + i + '" data-f="lv" aria-label="CPU level">' + MG.LEVELS.map(function(n, k){ return '<option value="' + k + '"' + (k === st.lv ? " selected" : "") + '>' + n + '</option>'; }).join("") + '</select>' : "") +
        '<button class="btn ghost sm" data-a="seatKit" data-i="' + i + '">' + ic("shirt") + 'Kit</button>' + (p.seats.length > 2 ? '<button class="btn ghost sm" data-a="seatDel" data-i="' + i + '" aria-label="Remove player">' + ic("x") + '</button>' : "") + '</div>';
    }).join("") + (p.seats.length < 4 ? '<div class="row"><button class="btn ghost sm" data-a="seatAdd">' + ic("plus") + 'Add a player</button></div>' : "") + '</section>' +
    '<section class="panel"><h3>Format</h3>' + chips(fm, p.fmt, "pfmt") + '<p class="mute">' + fd[p.fmt] + '</p><h3>Game</h3>' + chips(ms.map(function(k){ return [k, MG.MODES[k].n]; }), p.mode, "pmode") + '<p class="mute">' + (p.mode === "quick" ? ruleText(rules()) : MG.MODES[p.mode].d) + '</p></section>' +
    '<div class="row center"><button class="btn big" data-a="partyGo">' + ic("play") + 'Start the party</button></div>';
};
ACT.pfmt = function(d){ party.fmt = d.id; go("party"); };
ACT.pmode = function(d){ party.mode = d.id; go("party"); };
ACT.seatAdd = function(){ var k = pkits(); party.seats.push({n: "Player " + (party.seats.length + 1), cpu: 0, lv: 4, kit: k[(party.seats.length * 5 + 2) % k.length]}); go("party"); };
ACT.seatDel = function(d){ party.seats.splice(+d.i, 1); go("party"); };
ACT.seatKit = function(d){ var k = pkits(), st = party.seats[+d.i]; st.kit = k[(k.indexOf(st.kit) + 1) % k.length]; go("party"); };
ACT.partyGo = function(){
  var p = party, k = pkits(), n, i;
  if (p.fmt === "cup") while (p.seats.length < 4) p.seats.push({n: "CPU " + (p.seats.length + 1), cpu: 1, lv: 5, kit: k[(p.seats.length * 5 + 2) % k.length]});
  n = p.fmt === "duel" ? 2 : p.seats.length; p.wins = []; p.q = [];
  for (i = 0; i < n; i++) { p.wins.push(0); p.q.push(i); }
  p.log = []; p.stage = 0; p.champ = -1; p.sf = []; p.cur = [0, 1];
  go("pscore");
};
VIEW.pscore = function(){
  var p = party, a, b, h, ha, hb;
  if (!p || !p.wins.length) return VIEW.party();
  h = head("Co-op", {stay: "Winner stays on: first to three wins.", duel: "Best of three.", cup: "Knockout: two semi-finals and a final."}[p.fmt]) +
    '<section class="panel"><h3>Scores</h3><div class="pwins">' + p.wins.map(function(w, i){ return '<div class="' + (p.champ === i ? "champ" : "") + '"><canvas data-s="' + reg(seatSide(p, i, "#3b6ef5")) + '"' + (p.champ === i ? ' data-pose="win"' : "") + ' width="120" height="160"></canvas><b>' + esc(p.seats[i].n) + '</b><span>' + w + (w === 1 ? " win" : " wins") + '</span></div>'; }).join("") + '</div>' +
    p.log.map(function(l){ return '<div class="hrow"><span>' + esc(l) + '</span></div>'; }).join("") + '</section>';
  if (p.champ >= 0) return h + '<div class="res win"><span class="kick">Co-op over</span><h2>' + esc(p.seats[p.champ].n) + ' wins</h2><div class="row center"><button class="btn big" data-a="partyGo">Go again</button><button class="btn ghost big" data-a="go" data-v="party">Change players</button></div></div>';
  a = p.cur[0]; b = p.cur[1]; ha = !p.seats[a].cpu; hb = !p.seats[b].cpu;
  return h + '<div class="res"><span class="kick">' + (p.fmt === "cup" ? ["Semi-final 1", "Semi-final 2", "Final"][p.stage] : "Next up") + '</span><h2>' + esc(p.seats[a].n) + ' <i>v</i> ' + esc(p.seats[b].n) + '</h2><p class="mute">' +
    (ha && hb ? esc(p.seats[a].n) + " takes the Player 1 keys. " + esc(p.seats[b].n) + " takes the Player 2 keys." : ha || hb ? esc(p.seats[ha ? a : b].n) + " takes the Player 1 keys." : "Two CPU players. Sit back and watch.") +
    '</p><div class="row center"><button class="btn big" data-a="partyPlay">' + ic("play") + 'Kick off</button><button class="btn ghost big" data-a="go" data-v="party">End the party</button></div></div>';
};
ACT.partyPlay = function(){
  var p = party, a = p.cur[0], b = p.cur[1], sa = p.seats[a], sb = p.seats[b], both = !sa.cpu && !sb.cpu, m = MG.MODES[p.mode], c = p.mode === "quick" ? rules() : m.cfg, even = {pace: 6, shot: 6, ctrl: 6, power: 6, tackle: 6, block: 6}, solo = {k: "k1", arrows: 1, pad: 0, touch: 1};
  MG.play({name: sa.n + " v " + sb.n, sub: p.mode === "quick" ? ruleText(c) : m.d, cfg: c, sides: [seatSide(p, a, "#3b6ef5"), seatSide(p, b, "#ff5d5d")], st: [even, even], ai: [sa.cpu ? sa.lv : null, sb.cpu ? sb.lv : null],
    src: [sa.cpu ? null : both ? {k: "kp", pad: 0} : solo, sb.cpu ? null : both ? {k: "k2", pad: 1} : solo], court: S().eq.court, ball: S().eq.ball,
    done: function(res){ partyDone(res.winner, res.sc); }, quit: function(){ go("pscore"); }});
};
function partyDone(w, sc){
  var p = party, a = p.cur[0], b = p.cur[1], win = w === 0 ? a : b, lose = w === 0 ? b : a;
  p.wins[win]++; p.log.unshift(p.seats[a].n + " " + sc[0] + " - " + sc[1] + " " + p.seats[b].n);
  if (p.fmt === "stay") { p.q = [win].concat(p.q.filter(function(i){ return i !== win && i !== lose; }), [lose]); p.cur = [p.q[0], p.q[1]]; if (p.wins[win] >= 3) p.champ = win; }
  else if (p.fmt === "duel") { if (p.wins[win] >= 2) p.champ = win; }
  else { if (p.stage === 0) { p.sf = [win]; p.cur = [2, 3]; } else if (p.stage === 1) { p.sf.push(win); p.cur = [p.sf[0], p.sf[1]]; } else p.champ = win; p.stage++; }
  MG.sfx("win"); go("pscore");
}

// ---- locker ----
function swatch(it){
  var c;
  if (it.t === "court") { c = R.COURTS[it.id.replace("c_", "")]; return "background:linear-gradient(180deg," + c.sky[0] + "," + c.sky[2] + " 52%," + c.floor[0] + " 52%," + c.floor[1] + ")"; }
  return "background:" + (it.t === "trail" ? TCOL[it.k] : "radial-gradient(circle at 50% 40%,#ffffff," + FCOL[it.k] + " 45%,#16182e 78%)");
}
function vis(it, cls){ var x = MG.visX && MG.visX(it, cls); if (x) return x; return it.t === "emote" ? '<canvas class="' + cls + '" data-emote="' + it.k + '" width="300" height="400"></canvas>' : it.t === "kit" ? '<canvas class="' + cls + '" data-kit="' + it.id + '" width="300" height="400"></canvas>' : it.t === "ball" ? '<canvas class="sq ' + cls + '" data-ball="' + it.id + '" width="240" height="240"></canvas>' : '<span class="sw ' + cls + '" style="' + swatch(it) + '"></span>'; }
function itemCard(it){
  var s = S(), own = !!s.inv[it.id], r = MG.RAR[it.r];
  return '<button class="it' + (own ? "" : " off") + (s.eq[it.t] === it.id ? " on" : "") + (it.r >= 6 ? " hi" : "") + '" style="--r:' + r.c + '" data-a="item" data-id="' + it.id + '">' + vis(it, "") + '<span class="n">' + it.n + '</span><span class="rr">' + r.n + '</span>' + (+s.inv[it.id] > 1 ? '<span class="xn">x' + s.inv[it.id] + '</span>' : "") + (own ? "" : '<span class="lk">' + ic("lock") + '</span>') + '</button>';
}
function archBtns(on, act){ return MG.ARCH.map(function(a, i){ return '<button class="ar' + (on === i ? " on" : "") + '" data-a="' + act + '" data-i="' + i + '"><b>' + a[0] + '</b><small>' + a[1] + '</small></button>'; }).join(""); }
function editor(){
  var s = S(), st = MG.myStats(), pts = MG.points();
  function dots(list, k){ return '<div class="sws">' + list.map(function(c, i){ return '<button class="dot' + (s.look[k] === i ? " on" : "") + '" style="background:' + c + '" data-a="look" data-k="' + k + '" data-i="' + i + '" aria-label="Colour ' + (i + 1) + '"></button>'; }).join("") + '</div>'; }
  return '<section class="panel"><h3>Name and look</h3><div class="set"><div>Name</div><input type="text" maxlength="12" value="' + esc(s.name) + '" data-me="name"></div><div class="set"><div>Shirt number</div><input type="number" min="1" max="99" value="' + s.look.num + '" data-me="num"></div>' +
    '<div class="set"><div>Skin</div>' + dots(MG.SKIN, "skin") + '</div><div class="set"><div>Hair</div>' + '<button class="btn sm" data-a="ltab" data-id="hair">Pick a hair style</button>' + '</div><div class="set"><div>Hair colour</div>' + dots(MG.HAIR, "hc") + '</div>' +
    '<div class="set"><div>Title<small>Earn more on the Profile page</small></div><select data-me="title">' + MG.titles().map(function(t){ return '<option' + (t[0] === s.title ? " selected" : "") + '>' + t[0] + '</option>'; }).join("") + '</select></div></section>' +
    '<section class="panel"><h3>Play style</h3><div class="arch">' + archBtns(s.arch, "arch") + '</div><h3>Skills <small>' + pts + (pts === 1 ? " point" : " points") + ' to spend. You earn one every level.</small></h3>' +
    MG.STATS.map(function(x){ return '<div class="stat"><span>' + x[1] + '</span><span class="bar"><i style="width:' + st[x[0]] * 10 + '%"></i></span><b>' + st[x[0]] + '</b><button class="btn sm" data-a="spend" data-id="' + x[0] + '"' + (pts > 0 && st[x[0]] < 10 ? "" : " disabled") + ' aria-label="Add a point">' + ic("plus") + '</button></div>'; }).join("") +
    '<div class="row"><button class="btn ghost sm" data-a="respec">Take the points back</button></div></section>';
}
function maker(){
  var s = S();
  return '<section class="panel"><h3>Kit Maker</h3><p class="mute">Design the Custom Kit: a pattern and three colours.</p>' + chips(R.BASIC.map(function(p){ return [p, p.charAt(0).toUpperCase() + p.slice(1)]; }), s.cus.p, "cusp") +
    '<div class="row">' + ["Shirt", "Trim", "Shorts"].map(function(n, i){ return '<label class="pick">' + n + '<input type="color" value="' + s.cus.c[i] + '" data-cus="' + i + '"></label>'; }).join("") + '</div></section>';
}
VIEW.locker = function(tab){
  var s = S(), t = tab || "kit", tabs = [["kit", "Kits"], ["ball", "Balls"], ["trail", "Trails"], ["fx", "Celebrations"], ["emote", "Emotes"], ["court", "Cages"], ["me", "Player"]], list = MG.ITEMS.filter(function(it){ return it.t === t; }), own = list.filter(function(it){ return s.inv[it.id]; }).length;
  list.sort(function(a, b){ return (s.inv[b.id] ? 1 : 0) - (s.inv[a.id] ? 1 : 0) || a.r - b.r; });
  return '<div class="lock"><section class="panel prev"><canvas id="pv" width="440" height="560"></canvas><canvas id="pvb" width="140" height="140"></canvas><div class="eq">' +
    ["kit", "ball", "trail", "fx", "emote", "court"].map(function(k){ var it = MG.ITEM[s.eq[k]]; return '<div><span>' + {kit: "Kit", ball: "Ball", trail: "Trail", fx: "Celebration", emote: "Win emote", court: "Cage"}[k] + '</span><b style="color:' + MG.RAR[it.r].c + '">' + it.n + '</b></div>'; }).join("") + '</div></section>' +
    '<div>' + chips(tabs, t, "ltab") + (t === "me" ? editor() : '<p class="mute">' + own + ' of ' + list.length + ' collected. Tap an item you own to use it.</p><div class="items">' + list.map(itemCard).join("") + '</div>' + (t === "kit" && s.inv.custom ? maker() : "")) + '</div></div>';
};
AFTER.locker = function(){ var pv = $("pv"), pb = $("pvb"); tick.push(function(t){ if (!pv.isConnected) return; R.portrait(pv, MG.me(), t, {spin: 1}); R.ballIcon(pb, S().eq.ball, t); }); };
ACT.ltab = function(d){ go("locker", d.id); };
ACT.item = function(d){
  var it = MG.ITEM[d.id], s = S();
  if (s.inv[it.id]) { MG.equip(it.id); if (cur === "locker") go("locker", it.t); else { toast("Now using " + it.n + "."); go(cur, arg); } return; }
  modal('<div class="center"><span class="rr" style="color:' + MG.RAR[it.r].c + '">' + MG.RAR[it.r].n + '</span><h2>' + it.n + '</h2>' + vis(it, "big") +
    '<p>' + (it.how ? "How to earn it: " + it.how + "." : "Find it in packs" + (it.r <= MG.LEG ? ", or buy it when the shop features it." : ". Anything rarer than Legendary only comes from packs.")) + '</p><div class="row center">' + (it.how ? "" : '<button class="btn" data-a="go" data-v="shop">Go to the shop</button>') + '<button class="btn ghost" data-a="close">Close</button></div></div>');
};
ACT.look = function(d){ S().look[d.k] = +d.i; MG.save(); go("locker", "me"); };
ACT.hair = function(d){ S().look.hair = +d.id; MG.save(); go("locker", "me"); };
ACT.arch = function(d){ if (+d.i !== S().arch) { MG.respec(+d.i); go("locker", "me"); } };
ACT.spend = function(d){ if (MG.spend(d.id)) go("locker", "me"); };
ACT.respec = function(){ MG.respec(); go("locker", "me"); };
ACT.cusp = function(d){ var s = S(); s.cus.p = d.id; s.eq.kit = "custom"; MG.save(); go("locker", "kit"); };

// ---- shop ----
VIEW.shop = function(){
  var s = S(), fr = MG.freeReady(), kd = shopKind;
  return '<section class="panel"><h3>What do you want in your packs?</h3><div class="row wrap">' + MG.KINDS.map(function(k){ return '<button class="chip' + (k[0] === kd ? " on" : "") + '" data-a="kind" data-id="' + k[0] + '">' + k[1] + '</button>'; }).join("") + '</div><p class="mute">Mixed packs can hold anything. A pack of one kind costs a quarter more.</p></section>' +
    '<section class="panel daily"><div><h3>Daily crate</h3><p class="mute">One free item and 40 coins, once a day.</p></div><button class="btn gold" data-a="free"' + (fr ? "" : " disabled") + '>' + (fr ? "Open today&#39;s crate" : "Come back tomorrow") + '</button></section>' +
    '<div class="cols packs">' + MG.PACKS.map(function(p){
    return '<section class="panel pack ' + p.id + '"><div class="pk">' + ic("gift") + '</div><h2>' + p.n + (kd ? ": " + MG.KINDS.filter(function(k){ return k[0] === kd; })[0][1] : "") + '</h2><p>Three items in every pack.</p><div class="odds">' + MG.RAR.slice(0, 8).map(function(r, i){ return p.odds[i] ? '<span style="--r:' + r.c + '"><b>' + p.odds[i] + '%</b>' + r.n + '</span>' : ""; }).join("") + '</div>' +
      '<p class="mute">A Legendary or better is guaranteed at least every ' + p.pity + ' packs (' + (s.pity[p.id] || 0) + ' opened since your last one). Duplicates pay coins back.</p><button class="btn gold big" data-a="pack" data-id="' + p.id + '"' + (s.coins < MG.packCost(p, kd) ? " disabled" : "") + '>Open for ' + coin(MG.packCost(p, kd)) + '</button></section>';
  }).join("") + '</div><section class="panel"><h3>Featured today</h3><div class="items">' + MG.featured().map(function(it){
    return '<div class="shopi">' + itemCard(it) + (s.inv[it.id] ? '<span class="mute">Owned</span>' : '<button class="btn gold sm" data-a="buy" data-id="' + it.id + '"' + (s.coins < MG.PRICE[it.r] ? " disabled" : "") + '>' + coin(MG.PRICE[it.r]) + '</button>') + '</div>';
  }).join("") + '</div><p class="mute">Four different items every day. Coins come from wins (50 a win) and season pass tiers.</p></section>';
};
var shopKind = "";
ACT.kind = function(d){ shopKind = d.id || ""; go("shop"); };
ACT.free = function(){ var got = MG.freePack(); if (got) reveal(got, "Daily crate"); };
ACT.pack = function(d){
  var got = MG.openPack(d.id, shopKind);
  if (!got) return toast("Not enough coins.");
  reveal(got, "Pack opened");
};
// a pack opens as three reels of cards that spin past a marker and slow to a stop on what you won
function reveal(got, title){
  var best = 0, pool = MG.ITEMS.filter(function(it){ return !it.need && (!shopKind || it.t === shopKind); }), N = 34, WIN = 29;
  function card(it){ var r = MG.RAR[it.r]; return '<div class="rl" style="--r:' + r.c + '">' + (it.t === "emote" ? '<span class="sw" style="background:#22264a"></span>' : vis(it, "")) + '<b>' + it.n + '</b></div>'; }
  modal('<h2 class="center">' + title + '</h2>' + got.map(function(g, i){
    var h = "", k; best = Math.max(best, g.it.r);
    for (k = 0; k < N; k++) h += card(k === WIN ? g.it : pool[Math.floor(Math.random() * pool.length)]);
    return '<div class="reel"><div class="strip" data-i="' + i + '">' + h + '</div><i></i></div><p class="won" data-w="' + i + '" style="--r:' + MG.RAR[g.it.r].c + '"><b>' + MG.RAR[g.it.r].n + ': ' + g.it.n + '</b> ' + (g.dupe ? "Duplicate: " + coin("+" + g.back) : "New") + '</p>';
  }).join("") + '<div class="row center"><button class="btn big" data-a="packDone" id="rdone" disabled>Spinning...</button></div>', "wide");
  top();
  setTimeout(function(){
    [].forEach.call(document.querySelectorAll(".strip"), function(st){
      var i = +st.dataset.i, c = st.children[WIN], dur = 3.2 + i * 0.9;
      st.style.transition = "transform " + dur + "s cubic-bezier(.12,.72,.1,1)";
      st.style.transform = "translateX(" + -(c.offsetLeft + c.offsetWidth * (0.2 + Math.random() * 0.6) - st.parentNode.clientWidth / 2) + "px)";
      setTimeout(function(){ var w = document.querySelector('.won[data-w="' + i + '"]'); if (w) w.classList.add("show"); c.classList.add("hit"); MG.sfx("rare", Math.min(got[i].it.r, 6)); if (i === got.length - 1) { var b = document.getElementById("rdone"); if (b) { b.disabled = false; b.textContent = "Nice"; } } }, dur * 1000 + 80);
    });
  }, 60);
}
ACT.packDone = function(){ close(); go("shop"); };
ACT.buy = function(d){ if (MG.buy(d.id)) { MG.sfx("coin"); toast("Bought " + MG.ITEM[d.id].n + ". It is in your locker."); go("shop"); } };
ACT.claim = function(d){ var g = MG.claim(d.id); if (g) { MG.sfx("coin"); toast("Quest reward: +" + g + " season pass XP"); } go(cur, arg); };

// ---- ranks and profile ----
VIEW.ranks = function(key){
  var k = key || "elo", b = MG.board(k), tabs = [["elo", "Rating"], ["w", "Wins"], ["megs", "Megs"], ["cups", "Cups"], ["strk", "Best streak"], ["gaunt", "Gauntlet"]], me = 0, rows = "", i, x;
  for (i = 0; i < b.length; i++) if (b[i].me) me = i;
  for (i = 0; i < b.length; i++) {
    x = b[i];
    if (i >= 25 && Math.abs(i - me) > 2) { if (i === 25 || i === me + 3) rows += '<tr class="gap"><td colspan="4">&middot; &middot; &middot;</td></tr>'; continue; }
    rows += '<tr class="' + (x.me ? "mine" : "") + '"' + (x.me ? "" : ' data-a="peek" data-id="' + x.p.id + '"') + '><td>' + (i + 1) + '</td><td><b>' + (x.clan ? '<i class="clan">' + x.clan + '</i>' : "") + esc(x.n) + '</b><small>' + esc(x.title) + '</small></td><td>' + tier(x.elo) + '</td><td class="num">' + x[k] + '</td></tr>';
  }
  return chips(tabs, k, "rtab") + '<p class="mute">This is a simulated league. The other 160 players are CPU rivals, and their ratings drift a little every day. Win ranked matches to climb.</p><table class="tbl">' + rows + '</table>';
};
ACT.rtab = function(d){ go("ranks", d.id); };
ACT.peek = function(d){
  var p = MG.sim(+d.id), f = MG.foe(p);
  REG = [];
  modal('<div class="center"><canvas class="big" data-s="' + reg(f.side) + '" width="300" height="400"></canvas><h2>' + (p.clan ? '<i class="clan">' + p.clan + '</i>' : "") + esc(p.n) + '</h2><p class="mute">' + esc(p.title) + ' &middot; CPU player</p><div class="rw"><span class="pill">' + tier(p.elo) + '<b>' + p.elo + '</b></span><span class="pill">' + p.w + ' W &middot; ' + p.l + ' L</span><span class="pill">' + p.megs + ' megs</span><span class="pill">' + p.cups + ' cups</span></div>' +
    '<div class="row center"><button class="btn" data-a="kick">Play a friendly</button><button class="btn ghost" data-a="close">Close</button></div></div>');
  pend = function(){ start(f, {name: "Friendly", sub: "First to 3. Nothing on the line.", cfg: {target: 3}, mode: "friendly", back: "ranks"}); };
};
function spark(a){
  var lo = Math.min.apply(null, a) - 20, hi = Math.max.apply(null, a) + 20, n = a.length;
  return '<svg class="spark" viewBox="0 -4 300 78" preserveAspectRatio="none"><polyline fill="none" stroke="#3b6ef5" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="' + (n < 2 ? "0,35 300,35" : a.map(function(v, i){ return (i / (n - 1) * 300).toFixed(1) + "," + (70 - (v - lo) / (hi - lo) * 70).toFixed(1); }).join(" ")) + '"/></svg>';
}
VIEW.profile = function(){
  var s = S(), n = s.n, g = s.games, own = MG.ITEMS.filter(function(it){ return s.inv[it.id]; }).length, mn = {ladder: "Ladder", cup: "Cup", friendly: "Friendly", ranked: "Ranked", gauntlet: "Gauntlet"},
    st = [["Matches", g], ["Wins", n.w || 0], ["Win rate", g ? Math.round((n.w || 0) / g * 100) + "%" : "-"], ["Goals", n.goals || 0], ["Long range", n.twos || 0], ["Megs", n.megs || 0], ["Ankles broken", n.ankles || 0], ["Perfect strikes", n.perfect || 0],
      ["Blocks and saves", n.blocks || 0], ["Best streak", n.best || 0], ["Peak rating", s.peak], ["League rank", "#" + MG.rank()], ["Cups", n.cups || 0], ["Ladder", s.ladder + "/20"], ["Balls won back", n.tackles || 0], ["Best Gauntlet", n.gaunt || 0], ["Packs opened", n.packs || 0], ["Items", own + "/" + MG.ITEMS.length]];
  return '<div class="cols"><section class="panel"><h3>Career</h3><div class="stats">' + st.map(function(x){ return '<div><b>' + x[1] + '</b><span>' + x[0] + '</span></div>'; }).join("") + '</div></section>' +
    '<section class="panel"><h3>Rating</h3>' + spark(s.eh) + '<h3>Recent matches</h3>' + (s.hist.length ? s.hist.map(function(h){ return '<div class="hrow"><b class="' + (h.w ? "up" : "dn") + '">' + (h.w ? "W" : "L") + '</b><span>' + h.s + ' v ' + esc(h.o) + '</span><small>' + (MG.MODES[h.m] ? MG.MODES[h.m].n : mn[h.m] || h.m) + (h.d ? " " + (h.d > 0 ? "+" : "") + h.d : "") + '</small></div>'; }).join("") : '<p class="mute">No matches yet.</p>') + '</section></div>' +
    '<section class="panel"><h3>Titles</h3><div class="arch">' + MG.TITLES.map(function(t){ var ok = MG.stat(t[2]) >= t[3]; return '<button class="ar' + (ok ? "" : " off") + (s.title === t[0] ? " on" : "") + '"' + (ok ? ' data-a="title" data-id="' + t[0] + '"' : " disabled") + '><b>' + t[0] + '</b><small>' + t[1] + '</small></button>'; }).join("") + '</div></section>';
};
ACT.title = function(d){ S().title = d.id; MG.save(); go("profile"); };

// ---- settings ----
function lab(n, sub){ return '<div>' + n + (sub ? '<small>' + sub + '</small>' : "") + '</div>'; }
function tg(k, n, sub){ return '<div class="set">' + lab(n, sub) + '<input type="checkbox" class="tg" data-set="' + k + '"' + (S().set[k] ? " checked" : "") + ' aria-label="' + n + '"></div>'; }
function rg(k, n, lo, hi, step, sub){ return '<div class="set">' + lab(n, sub) + '<input type="range" data-set="' + k + '" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + S().set[k] + '" aria-label="' + n + '"></div>'; }
function sl(k, n, opts, sub){ return '<div class="set">' + lab(n, sub) + '<select data-set="' + k + '" aria-label="' + n + '">' + opts.map(function(o){ return '<option value="' + o[0] + '"' + (String(S().set[k]) === String(o[0]) ? " selected" : "") + '>' + o[1] + '</option>'; }).join("") + '</select></div>'; }
function keyRows(p){
  var kk = S().set[p], names = {up: "Up, towards the goal", down: "Down", left: "Left", right: "Right", sh: "Shoot or block", a: "Cut or tackle", b: "Drag back or jockey", c: "Burst or slide", d: "Megs or press", sp: "Sprint"};
  return Object.keys(names).map(function(k){ return '<div class="set"><div>' + names[k] + '</div><button class="btn ghost sm kb" data-a="bind" data-p="' + p + '" data-k="' + k + '">' + esc(MG.keyName(kk[k])) + '</button></div>'; }).join("");
}
VIEW.settings = function(){
  return '<div class="cols"><section class="panel"><h3>Sound</h3>' + tg("mute", "Mute everything") + rg("vol", "Master volume", 0, 1, 0.05) + rg("sfx", "Kicks and effects", 0, 1, 0.05) + rg("crowd", "Crowd", 0, 1, 0.05) +
    '<h3>Picture</h3>' + sl("fx", "Particles", [[0, "Few"], [1, "Normal"], [2, "Lots"]]) + sl("net", "Goal net", [[1, "Fine mesh"], [0, "Simple mesh"]], "Simple is lighter on slow devices") + tg("trail", "Ball trails") + tg("aura", "Kit auras") + rg("shake", "Screen shake", 0, 1.5, 0.1) + tg("flash", "Flashes", "Turn off if bright flashes bother you") + tg("slow", "Slow motion on goals") + sl("fps", "Frame rate", [[0, "Full"], [1, "Half, to save battery"]]) +
    '<h3>Camera</h3>' + rg("zoom", "Zoom", -1, 1, 0.1) + rg("pan", "Follow the ball sideways", 0, 1.5, 0.1) + '</section>' +
    '<section class="panel"><h3>On screen</h3>' + tg("meter", "Shot meter") + tg("aim", "Shot lines", "A dashed line shows where every shot is aimed, yours and theirs") + tg("pops", "Callouts", "PERFECT, MEGS and the rest") + tg("banner", "Goal banners") + tg("names", "Name tags") + tg("rings", "Sprint rings", "The ring under your player empties as you sprint") + tg("hints", "Control hints") + tg("cb", "Colour-blind meter", "Blue and white in place of green") + rg("hud", "Scoreboard size", 0.8, 1.4, 0.05) +
    '<h3>Quick Match and Co-op rules</h3>' + sl("target", "First to", [[3, "3 goals"], [5, "5 goals"], [7, "7 goals"], [11, "11 goals"]]) + sl("clock", "Match clock", [[0, "Off"], [60, "60 seconds"], [90, "90 seconds"], [180, "3 minutes"]], "With a clock on, most goals wins") + tg("two", "Long range counts double") + tg("take", "Scorer keeps the ball") + sl("sc", "Possession clock", [[0, "Off"], [8, "8 seconds"], [12, "12 seconds"], [20, "20 seconds"]]) + '</section></div>' +
    '<div class="cols"><section class="panel"><h3>Your keys <small>against the computer</small></h3>' + keyRows("k1") + '</section><section class="panel"><h3>Co-op: player 1</h3>' + keyRows("kp") + '</section></div><div class="cols"><section class="panel"><h3>Co-op: player 2</h3>' + keyRows("k2") + '</section><section class="panel"><h3>Sharing a keyboard</h3><p class="mute">In Co-op player 1 has W A S D with R T Y F G and left Shift to sprint, and player 2 has the arrow keys with J K L I O and right Shift. On your own you get W A S D to move, Space to shoot, K L I O for the moves and left Shift to sprint. Sprinting empties the ring under your player; let it fill back up.</p></section></div>' +
    '<div class="cols"><section class="panel"><h3>Gamepad and touch</h3>' + tg("pad", "Gamepads", "Stick to move, A shoot, X cut, B drag, Y burst, bumpers megs") + rg("tsize", "Touch button size", 0.7, 1.4, 0.05) + rg("top", "Touch button opacity", 0.3, 1, 0.05) + "" + tg("lefty", "Left-handed touch layout") + tg("buzz", "Vibration") +
    '<div class="row"><button class="btn ghost sm" data-a="keysReset">Reset the keys</button><button class="btn ghost sm" data-a="setReset">Reset every setting</button></div></section>' +
    '<section class="panel"><h3>Save data</h3><p class="mute">Your progress is stored in this browser only.</p><div class="row"><button class="btn ghost sm" data-a="export">Copy my save</button><button class="btn ghost sm" data-a="import">Load a save</button><button class="btn red sm" data-a="wipe">Reset my progress</button></div></section></div>';
};
ACT.bind = function(d, b){
  b.textContent = "Press a key"; b.classList.add("on");
  function on(e){ e.preventDefault(); e.stopPropagation(); window.removeEventListener("keydown", on, true); if (MG.code(e) && MG.code(e) !== "Escape") { S().set[d.p][d.k] = MG.code(e); MG.save(); } go("settings"); }   // a key the browser cannot name is ignored, never saved as blank
  window.addEventListener("keydown", on, true);
};
ACT.keysReset = function(){ var st = S().set; st.k1 = JSON.parse(JSON.stringify(MG.SET0.k1)); st.kp = JSON.parse(JSON.stringify(MG.SET0.kp)); st.k2 = JSON.parse(JSON.stringify(MG.SET0.k2)); MG.save(); go("settings"); };
ACT.setReset = function(){ S().set = JSON.parse(JSON.stringify(MG.SET0)); MG.save(); MG.applySet(); go("settings"); };
ACT.export = function(){ modal('<h2>Your save</h2><p class="mute">Copy this text somewhere safe. Paste it into Load a save in another browser to carry on there.</p><textarea id="sv" readonly>' + MG.exportSave() + '</textarea><div class="row center"><button class="btn" data-a="copy">Copy</button><button class="btn ghost" data-a="close">Close</button></div>'); };
ACT.copy = function(){ var t = $("sv"); t.select(); try { document.execCommand("copy"); toast("Copied."); } catch (e) { toast("Select the text and copy it by hand."); } };
ACT.import = function(){ modal('<h2>Load a save</h2><p class="mute">Paste a save copied from this game. It replaces the progress in this browser.</p><textarea id="sv"></textarea><div class="row center"><button class="btn" data-a="importGo">Load it</button><button class="btn ghost" data-a="close">Cancel</button></div>'); };
ACT.importGo = function(){ if (MG.importSave($("sv").value)) { close(); MG.applySet(); go("home"); toast("Save loaded."); } else toast("That does not look like a Megs save."); };
ACT.wipe = function(){ modal('<h2>Reset your progress?</h2><p>This clears your coins, items, rating and stats in this browser. Your settings are kept. It cannot be undone.</p><div class="row center"><button class="btn red" data-a="wipeGo">Reset everything</button><button class="btn ghost" data-a="close">Keep my progress</button></div>'); };
ACT.wipeGo = function(){ MG.reset(); party = null; close(); go("home"); welcome(); };

// ---- how to play ----
VIEW.help = function(){
  var k = S().set.k1;
  function key(c){ return '<kbd>' + esc(MG.keyName(k[c])) + '</kbd>'; }
  return head("How to play", "One goal, two players, no keeper.") + '<div class="cols"><section class="panel help"><h3>The game</h3><p>You and a rival share one goal. Whoever has the ball attacks and the other one defends. First to five wins.</p><p>A goal struck from outside the big arc counts double. Score and you keep the ball. Win it back and you have to take it out past the arc before you can score.</p><p>Hold on to the ball too long and the possession clock hands it over.</p>' +
    '<h3>Moving and shooting</h3><p>' + key("up") + key("left") + key("down") + key("right") + ' or the arrow keys to move, Shift to sprint.</p><p>Aim with left or right (a corner), or hold neither to aim at the open side. Hold ' + key("sh") + ' and a marker sweeps along the aim bar. Let go in the small green zone: its bright middle is a Perfect strike that goes exactly where you aimed, the rest of the green strays a little, and the red strays a lot. The further out you are, the smaller the green. Hold too long and the marker comes all the way back: then the shot goes off on its own, anywhere.</p><p>While the marker moves, hold up for a chip or down to drill it low. A quick tap of ' + key("sh") + ' is a fake shot.</p><p>While anyone winds up, a dashed line shows where the shot is going. Yours is blue, theirs is red: stand on the red line and block.</p></section>' +
    '<section class="panel help"><h3>On the ball</h3><p>' + key("a") + ' Cut: a sharp sidestep. Time it as the defender reaches in and you break their ankles.</p><p>' + key("b") + ' Drag back: pull the ball away. A shot straight after a drag has a wider green.</p><p>' + key("c") + ' Burst: a sprint touch past them. Burst and then Cut is a roulette spin.</p><p>' + key("d") + ' Megs: through their legs. It only works on a defender who has committed: mid tackle, mid lunge, pressing, or running flat out.</p>' +
    '<h3>Skill moves</h3><p>Elastico: ' + key("a") + ' then ' + key("a") + ' again. The second cut snaps back the other way.</p><p>Roulette: ' + key("c") + ' then ' + key("a") + '. A spin that shrugs off a tackle.</p><p>Rainbow: ' + key("b") + ' then ' + key("d") + '. Flick it over a defender who is standing close.</p><p>One-two: ' + key("d") + ' near the side boards with nobody in front. The ball comes back off the wall ahead of you.</p><p>Fake and go: tap ' + key("sh") + ' then ' + key("c") + ' for a longer burst.</p>' +
    '<h3>Winning the ball</h3><p>Get your feet on the ball and it is yours: walk into it while the dribbler is not shielding it or mid-move.</p><p>' + key("a") + ' Tackle: from close you come away with the ball, from further out you poke it loose. Miss and you are beaten.</p><p>' + key("d") + ' Press: a short charge at the ball. Fast, but it leaves you open to megs.</p><p>' + key("c") + ' Slide: long reach, long recovery.</p>' +
    '<h3>Blocking</h3><p>' + key("b") + ' Jockey: hold it to stay low and square. You move slower, megs do not work on you, and you stop low shots that come near.</p><p>' + key("sh") + ' Jump: stops high shots and chips.</p><p>' + key("sh") + ' with a direction: dive that way.</p><p>' + key("b") + ' and ' + key("sh") + ' together: Wall. Stand tall and wide for a moment.</p><p>Or just stand on the red shot line. Your body blocks too.</p>' +
    '<h3>Other ways to play</h3><p>A gamepad works: stick to move, A shoot, X cut, B drag, Y burst, bumpers megs, triggers sprint. On a phone or tablet, touch controls appear by themselves. Every key can be changed in Settings.</p></section></div>' +
    '<div class="row center"><button class="btn big" data-a="practice">' + ic("ball") + 'Try it in a Kickabout</button></div>';
};

// ---- first visit, input handling, boot ----
var arch0 = 5;
function welcome(){
  arch0 = 5;
  modal('<h2>Welcome to the cage</h2><p class="mute">Pick a style. You start as a guest; sign up in the Locker whenever you want a real name.</p><div class="arch" id="warch">' + archBtns(5, "arch0") + '</div><div class="row center"><button class="btn big" data-a="begin">Step into the cage</button></div>');
}
ACT.arch0 = function(d){ arch0 = +d.i; $("warch").innerHTML = archBtns(arch0, "arch0"); };
ACT.begin = function(){ var s = S(); s.name = s.name || (MG.guestName ? MG.guestName() : "Guest"); s.arch = arch0; MG.save(); close(); go("home"); toast("Tip: try a Kickabout first to learn the moves."); };
document.addEventListener("click", function(e){
  var b = e.target.closest("[data-a]"), a;
  if (!b || b.disabled) return;
  a = b.getAttribute("data-a");
  if (ACT[a]) { MG.sfx("ui"); ACT[a](b.dataset, b); }
});
function onInput(e){
  var el = e.target, d = el.dataset, s = S(), st;
  if (!d) return;
  if (d.set) { s.set[d.set] = el.type === "checkbox" ? (el.checked ? 1 : 0) : parseFloat(el.value); MG.save(); MG.applySet(); if (e.type === "change") MG.sfx("ui"); }
  else if (d.me === "name") { s.name = clean(el.value) || "Player"; MG.save(); if (e.type === "change") top(); }
  else if (d.me === "num") { s.look.num = MG.clamp(Math.round(+el.value) || 1, 1, 99); MG.save(); }
  else if (d.me === "title") { s.title = el.value; MG.save(); top(); }
  else if (d.cus) { s.cus.c[+d.cus] = el.value; if (s.inv.custom) s.eq.kit = "custom"; MG.save(); }
  else if (d.seat && party) {
    st = party.seats[+d.seat];
    if (d.f === "n") st.n = clean(el.value) || "Player " + (+d.seat + 1);
    else { st[d.f] = +el.value; if (e.type === "change" && d.f === "cpu") go("party"); }
  }
}
document.addEventListener("input", onInput); document.addEventListener("change", onInput);
VIEW._editor = editor; VIEW._maker = maker;
MG.ui = {go: go, toast: toast, VIEW: VIEW, ACT: ACT, AFTER: AFTER, modal: modal, close: close, coin: coin, ic: ic, esc: esc, reg: reg, head: head, chips: chips, itemCard: itemCard, vis: vis, paint: paint, start: start, top: top, tier: tier,
  tick: function(f){ tick.push(f); }, shopKind: function(){ return shopKind; }, cur: function(){ return cur; }, arg: function(){ return arg; }, nav: NAVOF, resA: function(a){ resA = a; }, pend: function(f){ pend = f; }};
// started from the last script, once every screen has been added
MG.boot = function(){ MG.load(); MG.applySet(); go("home"); requestAnimationFrame(loop); if (!S().name) welcome(); };
})();
