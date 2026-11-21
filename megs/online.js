// MEGS online play. Ranked Solo, Duos, Trios, Squads and Team are played against real people when the server finds
// them; whoever is still missing after 15 seconds is a computer player. One player's browser (the host) runs the
// match; everyone else sends their keys to it and draws what it sends back, through the Megs server.
(function(){
"use strict";
var MG = window.MG;
function waitUi(f){ if (MG.ui && MG.net && MG.net.hook && MG.teamSides && MG.play && MG.now && MG.SIZE_N && MG.ui.ACT.rk) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, N = MG.net, esc = U.esc, S = function(){ return MG.S; };
  var Q = null, G = null, ON = {1: [3], 2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4]}, ORDER = [3, 1, 4, 2, 0], POS = {x: 1, y: 1, z: 1};
  var EVEN = {pace: 6, shot: 6, ctrl: 6, power: 6, tackle: 6, block: 6}, KEYS = {k: "k1", arrows: 1, pad: 0, touch: 1};
  function signed(){ return !!(N.signed && N.signed()); }
  function party(){ return !!(N.inParty && N.inParty()); }

  // ---- looking for a match ----
  var rk0 = ACT.rk;
  ACT.rk = function(d){
    var n = +d.v || 1;
    if (!signed()) return rk0.apply(this, arguments);   // guests play the computer on this device
    if (n === 1 && party()) return U.toast("Ranked Solo is for one player. A party plays Duos and up.");
    if (party() && N.party.leader !== N.me.id) return U.toast("The party leader picks the mode.");
    N.send({t: "queue", mode: "rk" + n});
  };
  function waiting(mode){
    var n = +String(mode).slice(2) || 1, lead = !party() || N.party.leader === N.me.id, t0 = Date.now();
    U.modal('<div class="center wq"><div class="spin"></div><h2>Waiting for ' + (party() ? "players and team mates" : "players") + '...</h2><p class="mute">Ranked ' + MG.SIZE_N[n] + ' (' + n + 'v' + n + '). Anyone not found in 15 seconds is a bot (computer player).</p><p class="wqt"><b id="wqt">0</b> seconds</p><div id="wqr"></div>' +
      (lead ? '<button class="btn ghost" data-a="wqCancel">Cancel</button>' : '<p class="mute">The party leader can cancel.</p>') + '</div>');
    if (Q) clearInterval(Q.timer);
    Q = {mode: mode, timer: setInterval(function(){ var e = document.getElementById("wqt"); if (e) e.textContent = Math.floor((Date.now() - t0) / 1000); var x = document.getElementById("wqe"); if (x && Q && Q.ends) x.textContent = "Bots fill any empty spots in " + Math.max(0, Math.ceil((Q.ends - Date.now()) / 1000)) + " s"; }, 250)};
  }
  // 2v2 and up: who has joined so far, and how long until bots fill the rest
  var LCSS = '<style>.qlob{display:flex;gap:14px;align-items:flex-start;margin:12px 0 4px;text-align:left}.qlob h4{margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.7}.qlob>div{flex:none!important;width:42%!important;min-width:0}.qlob .vs{align-self:center;flex:none;font-weight:800;opacity:.6}.qlob li{list-style:none;padding:6px 10px;margin:0 0 5px;border-radius:9px;background:rgba(255,255,255,.08);font-weight:700}.qlob li.bot{opacity:.65;font-weight:500;font-style:italic}.qlob li.open{opacity:.45;border:1px dashed rgba(255,255,255,.35);background:none;font-weight:500}.qlob li.me{outline:2px solid var(--acc,#ffd23f)}.qlob ul{margin:0;padding:0}.lobb{height:6px;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:12px}.lobb i{display:block;height:100%;background:var(--acc,#ffd23f);width:0;transition:width 2.4s linear}</style>';
  function col(title, list, n, fill){
    var me = N.me ? N.me.name : "", h = '<div><h4>' + esc(title) + '</h4><ul>', i;
    for (i = 0; i < n; i++) h += list[i] ? '<li class="' + (list[i] === me ? "me" : "") + '">' + esc(list[i]) + '</li>' : '<li class="' + (fill ? "bot" : "open") + '">' + (fill ? "Bot" : "Waiting for a player...") + '</li>';
    return h + '</ul></div>';
  }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
  N.hook("lobby", function(m){
    if (!Q || Q.mode !== m.mode) return;
    var me = N.me ? N.me.name : "", mine = m.sides[1].indexOf(me) >= 0 ? 1 : 0, r = document.getElementById("wqr"), joined = m.sides[0].length + m.sides[1].length;
    Q.ends = m.ends; var tq = document.querySelector(".wqt"); if (tq) tq.style.display = "none";
    if (r) r.innerHTML = LCSS + '<p class="mute" style="margin:8px 0 0">' + joined + ' of ' + (m.size * 2) + ' players found. Still looking for the rest...</p><div class="qlob">' + col("Your team", m.sides[mine], m.size) + '<span class="vs">VS</span>' + col("Other team", m.sides[1 - mine], m.size) + '</div><p class="mute" id="wqe"></p>';
  });
  // once everyone is in: a short loading screen with both teams, any bots marked as bots
  function loading(title, sides, n, mySide, cb){
    var nm = function(x){ return x.name || "Player"; }, a = sides[mySide].map(nm), b = sides[1 - mySide].map(nm);
    U.modal(LCSS + '<div class="center wq lobw"><span class="kick">' + esc(title) + '</span><h2>Match found</h2><div class="qlob">' + col("Your team", a, n, 1) + '<span class="vs">VS</span>' + col("Other team", b, n, 1) + '</div>' +
      (a.length + b.length < n * 2 ? '<p class="mute">Not everyone showed up, so bots (computer players) fill the empty spots.</p>' : '<p class="mute">Everyone here is a real player. Good luck.</p>') + '<div class="lobb"><i id="lobi"></i></div></div>');
    setTimeout(function(){ var i = document.getElementById("lobi"); if (i) i.style.width = "100%"; }, 30);
    setTimeout(function(){ if (document.querySelector(".lobw")) U.close(); cb(); }, 2700);
  }
  function unwait(){ if (Q) clearInterval(Q.timer); Q = null; if (document.querySelector(".wq")) U.close(); }
  ACT.wqCancel = function(){ N.send({t: "unqueue"}); unwait(); };
  N.hook("queue", function(m){ if (m.on && /^rk\d$/.test(m.mode)) waiting(m.mode); else if (m.on && /^pk\d$/.test(m.mode)) U.modal('<div class="center wq"><div class="spin"></div><h2>Starting with your party...</h2></div>'); else unwait(); });

  // ---- in a party: only party games, and only the leader starts them ----
  function leader(){ return !party() || N.party.leader === N.me.id; }
  var allow = 0, play0 = MG.play;
  MG.play = function(o){
    if (party() && !allow) { U.toast(leader() ? "You're in a party, so only party games can be played. Leave the party to play this on your own." : "You're in a party. The party leader picks the game."); U.go("play"); return; }
    return play0.apply(this, arguments);
  };
  var prac0 = ACT.prac;
  ACT.prac = function(d){
    if (!party()) return prac0.apply(this, arguments);
    if (!leader()) return U.toast("The party leader picks the game.");
    N.send({t: "queue", mode: "pk" + (Math.max(2, +d.v || 2))});
  };
  var play1 = U.VIEW.play;
  U.VIEW.play = function(){
    if (!party()) return play1.apply(this, arguments);
    var lead = leader(), n = N.party.members.length, ic = U.ic;
    function tile(a, k, name, sub, col){ var ok = k >= n; return '<button class="plT' + (lead && ok ? "" : " soon") + '" style="--g:linear-gradient(135deg,' + col + ')"' + (lead && ok ? ' data-a="' + a + '" data-v="' + k + '"' : "") + '>' + ic("users") + '<span><b>' + name + '</b><small>' + (ok ? sub : "Your party is too big for this") + '</small></span><i>' + k + 'v' + k + '</i></button>'; }
    var C = {2: "#0e7490,#0b3b52", 3: "#15803d,#0b3d24", 4: "#a16207,#5a3a06", 5: "#b91c1c,#4a0d0d"}, K = [2, 3, 4, 5];
    return '<div class="plh"><button class="btn ghost" data-a="go" data-v="home">' + ic("back") + 'Back</button><h1>Play</h1></div>' +
      '<section class="panel ptip"><b>' + (lead ? "You lead the party (" + n + " players)." : "You're in a party. The party leader picks the game, and you join it automatically.") + '</b> <span class="mute">Only games you can play together are shown. Leave the party to play anything else.</span></section>' +
      '<section class="plG rkg"><h3>Ranked<small>your party against other players; computer players fill any gaps after 15 seconds</small></h3><div class="plR">' + K.map(function(k){ return tile("rk", k, "Ranked " + MG.SIZE_N[k], "Your party together, for rank points.", C[k]); }).join("") + '</div></section>' +
      '<section class="plG"><h3>Practice with AI<small>your party together against computer players, no rank points</small></h3><div class="plR">' + K.map(function(k){ return tile("prac", k, "Practice " + MG.SIZE_N[k], "Warm up together.", C[k]); }).join("") + '</div></section>';
  };
  N.hook("err", function(m){ if (m.c === "queue") unwait(); });

  // ---- a match was made ----
  N.hook("match", function(mt){
    unwait();
    if (!/^(rk|pk)\d$/.test(mt.mode) || !N.me) return;
    var n = +mt.mode.slice(2), me = N.me.id, mine = mt.members.filter(function(x){ return x.id === me; })[0];
    if (!mine) return;
    var sides = [0, 1].map(function(s){ return mt.members.filter(function(x){ return x.side === s && !x.left; }); });
    var title = (mt.ranked ? "Ranked " : "Practice ") + MG.SIZE_N[n];
    if (sides[0].length + sides[1].length < 2) { N.send({t: "mleave"}); return loading(title, sides, n, mine.side, function(){ mt.ranked ? rk0({v: n}) : prac0({v: n}); }); }   // nobody else: the usual match against bots
    G = {mt: mt, rk: !!mt.ranked, n: n, side: mine.side, host: mt.host === me, seq: 0, last: null, tgt: null, evq: [], end: null, inSent: "", inAt: 0, gone: {}};
    var g1 = G;
    loading(title, sides, n, mine.side, function(){ if (G !== g1) return; startTeam(mt, n, sides); });   // 1v1 too: every Classic game is on the field, sized to the teams
  });
  N.hook("gone", function(m){
    if (!G || m.mid !== G.mt.id) return;
    if (m.host && !G.host) { U.toast("The host left the match."); var g = G; G = null; MG.stop(); U.go("home"); return g; }
    G.gone[m.id] = 1;
    // someone left: a computer player takes over their player
    var r = MG.now(); if (G.host && r && r.m && r.m.xh) { var i = G.idx && G.idx[m.id]; if (i != null) delete r.m.xh[i]; }
    U.toast("A player left. A computer player takes their place.");
  });

  function sideOf(x){ return Object.assign({}, x.look || {}, {name: x.name, ring: x.side ? "#ff5d7a" : "#3b6ef5"}); }
  function names(list){ return list.map(function(x){ return x.name; }).join(" & "); }
  function oo(name, foe, n){ return {name: name, foe: {name: foe}, back: "home", again: function(){ ACT.rk({v: n}); }}; }

  // 1v1 in the cage, two real players
  function start1(mt, sides){
    var seed = (mt.opts && mt.opts.seed) || 1, a = sides[0][0], b = sides[1][0], src = [null, null], o, info;
    src[G.side] = KEYS;
    info = oo("Ranked Solo", G.side ? a.name : b.name, 1);
    o = {name: "Ranked Solo", sub: "Online: " + a.name + " v " + b.name, cfg: {}, mode: "ranked", ranked: 1, sides: [sideOf(a), sideOf(b)], st: [EVEN, EVEN], ai: [null, null], src: src, court: S().eq.court, ball: S().eq.ball, first: seed % 2, forfeit: 0, live: 1,
      done: function(res){ finish(res, function(r){ var out = MG.finish({mode: "ranked", win: r.win, me: r.me, sc: r.sc, opp: {id: -9, name: info.foe.name, elo: 0}, top: r.top || 0, ranked: 1});
        MG.sfx(r.win ? "win" : "lose"); U.go("result", {o: info, foe: {name: info.foe.name}, res: r, out: out}); }); },
      quit: function(){ forfeit(o, info); }};
    go(o, function(m){ return G.side; });
  }
  // 2v2 to 5v5 on the big pitch: real players take forwards first, computer players fill the rest
  function startTeam(mt, n, sides){
    var seed = (mt.opts && mt.opts.seed) || 1, T = MG.teamSides, rps = mt.members.map(function(x){ return x.rating || 0; }), avg = rps.reduce(function(a, b){ return a + b; }, 0) / rps.length;
    function club(k){ k = k % 36; var c = MG.club(MG.CAMP[Math.floor(k / 6)].m[k % 6]); c.lv = MG.clamp(MG.lvlFor(avg), 0.3, 9.5); return c; }
    var cl = [club(seed), club(seed + 11)], teams = [T.foe(cl[0]), T.foe(cl[1])], xh = [], idx = {}, names2 = [cl[0].name, cl[1].name];
    [0, 1].forEach(function(s){
      var roles = ORDER.filter(function(r){ return ON[n].indexOf(r) >= 0; }).slice(0, sides[s].length);
      sides[s].forEach(function(x, j){ var i = s * 5 + roles[j]; xh.push(i); idx[x.id] = i; teams[s][roles[j]] = Object.assign({}, teams[s][roles[j]], sideOf(x), {calm: false}); });
      if (sides[s].length) names2[s] = names(sides[s]);
    });
    // anyone on the pitch who isn't a real player is labelled a bot
    [0, 1].forEach(function(s){ ON[n].forEach(function(r){ var i = s * 5 + r; if (xh.indexOf(i) < 0 && teams[s][r]) teams[s][r] = Object.assign({}, teams[s][r], {name: String(teams[s][r].name || "Player").split(" ")[0] + " (bot)"}); }); });
    G.idx = idx; G.myI = idx[N.me.id]; var G0 = G;
    var src = [null, null]; src[G.side] = KEYS;
    var title = (G.rk ? "Ranked " : "Practice ") + MG.SIZE_N[n], info = oo(title, names2[1 - G.side], n);
    if (!G.rk) info.again = function(){ ACT.prac({v: n}); };
    var o = {team: 1, ranked: G.rk ? 1 : 0, size: n, mode: G.rk ? "rteam" : "team", name: title, sub: "Online: " + names2[0] + " v " + names2[1], first: seed % 2, ball: S().eq.ball,
      cfg: {half: 90, n: n, lv: [cl[0].lv, cl[1].lv], mate: 6, human: [false, false], xh: xh, names: [teams[0].map(function(t){ return t.name; }), teams[1].map(function(t){ return t.name; })], seed: seed, first: seed % 2},
      sides: [{name: names2[0]}, {name: names2[1]}], teams: teams, src: src, st: [], ai: [], forfeit: 0, live: 1,
      done: function(res){ finish(res, function(r){ r.ranked = G0.rk ? 1 : 0; r.size = n;
        var out = MG.finish({mode: G0.rk ? "rteam" : "team", win: r.win, draw: r.draw, me: r.me, sc: r.sc, opp: {name: info.foe.name, elo: 0, id: -1}, top: 0, team: 1, ranked: G0.rk ? 1 : 0, size: n, t: r.t});
        MG.sfx(r.win ? "win" : "lose"); U.go("tres", {o: info, res: r, out: out}); }); },
      quit: function(){ forfeit(o, info); }};
    go(o);
  }
  function quit(){ N.send({t: "mleave"}); G = null; U.go("home"); }
  // leaving a game against real people is a forfeit: it earns nothing, and in ranked it costs rank points
  function forfeit(o, info){
    if (o.ranked) MG.finish({mode: o.mode, quit: 1, online: 1, win: false, me: {}, sc: [0, 0], opp: {id: -1, name: info.foe.name, elo: 0}, top: 0, ranked: 1, team: o.team ? 1 : 0, size: o.size || 1});
    quit(); U.toast(o.ranked ? "You left the match. It counts as a forfeit: no rewards, and you lost rank points." : "You left the match. Forfeits earn nothing.");
  }

  // ---- running the match: the host simulates, everyone else follows ----
  function go(o){
    allow = 1; try { MG.play(o); } finally { allow = 0; }
    var r = MG.now(); if (!r || !r.m || !G) return;
    var m = r.m;
    if (o.team) { m.meI = G.myI; if (G.host && m.xh[G.myI]) m.xh[G.myI].inp = m.inp[G.side]; }
    G.team = !!o.team;
    if (G.host) {
      var step0 = m.step, k = 0;
      m.step = function(){ step0.apply(this, arguments); for (var i = 0; i < m.ev.length; i++) G.evq.push(m.ev[i]); if (++k % 4 === 0) snap(m); };
    } else {
      m.step = function(){ follow(m); sendInput(m); };
    }
  }
  function pick(o, prev, out){
    var k, v, d = {}, any = 0;
    for (k in o) {
      v = o[k];
      if (typeof v === "number") v = Math.round(v * 1000) / 1000;
      else if (Array.isArray(v)) { if (!v.length || v.length > 6 || !v.every(function(x){ return typeof x === "number"; })) continue; v = v.map(function(x){ return Math.round(x * 1000) / 1000; }); }
      else if (typeof v !== "string" && typeof v !== "boolean") continue;
      if (!prev || String(prev[k]) !== String(v)) { d[k] = v; any = 1; }
      if (out) out[k] = v;
    }
    return any ? d : 0;
  }
  // the host sends what changed about 15 times a second, and everything every two seconds
  function snap(m){
    var full = !G.last || G.seq % 30 === 0, L = G.last || {p: [], b: null, m: null}, nl = {p: [], b: {}, m: {}}, s = {k: "s", n: ++G.seq, p: [], ev: G.evq.splice(0)};
    m.p.forEach(function(p, i){ nl.p[i] = {}; s.p[i] = pick(p, full ? null : L.p[i], nl.p[i]); });
    s.b = pick(m.b, full ? null : L.b, nl.b); s.m = pick(m, full ? null : L.m, nl.m);
    s.ev = s.ev.map(function(e){ var c = {}; for (var k in e) if (typeof e[k] !== "object" && typeof e[k] !== "function") c[k] = e[k]; return c; });
    G.last = nl;
    N.send({t: "m", d: s});
  }
  function put(o, d, tgt){ for (var k in d) { var v = d[k]; if (k === "ev" || typeof o[k] === "function") continue; if (POS[k] && tgt) tgt[k] = v; else o[k] = v; } }
  function follow(m){
    var t = G.tgt;
    if (G.inbox) { G.inbox.forEach(function(s){
        if (!t) t = G.tgt = {p: m.p.map(function(){ return {}; }), b: {}};
        s.p.forEach(function(d, i){ if (d && m.p[i]) put(m.p[i], d, t.p[i]); });
        if (s.b) put(m.b, s.b, t.b); if (s.m) put(m, s.m, null);
        (s.ev || []).forEach(function(e){ m.ev.push(e); });
      }); G.inbox = null; }
    if (!t) return;
    // ease towards where the host says everyone is, so the picture stays smooth between updates
    function ease(o, tg){ for (var k in tg) { var d = tg[k] - o[k]; o[k] = Math.abs(d) > 4 ? tg[k] : o[k] + d * 0.35; } }
    m.p.forEach(function(p, i){ ease(p, t.p[i]); }); ease(m.b, t.b);
  }
  // everyone else sends their keys when they change, and at least four times a second
  function sendInput(m){
    var inp = G.team ? m.inp[G.side] : m.p[G.side].inp, v = [inp.mx || 0, inp.my || 0, inp.sp || 0, inp.sh || 0, inp.a || 0, inp.b || 0, inp.c || 0, inp.d || 0].map(function(x){ return Math.round(x * 100) / 100; }), key = v.join(","), now = Date.now();
    if (key === G.inSent && now - G.inAt < 250) return;
    G.inSent = key; G.inAt = now;
    N.send({t: "m", to: G.mt.host, d: {k: "i", i: G.team ? G.myI : G.side, v: v}});
  }
  N.hook("m", function(msg){
    if (!G) return; var d = msg.d || {}, r = MG.now();
    if (d.k === "s" && !G.host) { (G.inbox = G.inbox || []).push(d); return; }
    if (d.k === "i" && G.host && r && r.m) {
      var inp = G.team ? (r.m.xh[d.i] && r.m.xh[d.i].inp) : (r.m.p[d.i] && r.m.p[d.i].inp), v = d.v || [];
      if (!inp) return;
      inp.mx = +v[0] || 0; inp.my = +v[1] || 0; inp.sp = +v[2] || 0; inp.sh = +v[3] || 0; inp.a = +v[4] || 0; inp.b = +v[5] || 0; inp.c = +v[6] || 0; inp.d = +v[7] || 0;
      return;
    }
    if (d.k === "e" && !G.host) { G.end = d.r; if (G.wait) { var f = G.wait; G.wait = null; f(); } }
  });
  // the end: the host sends everyone the final score from their own side; nobody else trusts their own copy
  function flip(r){ return {win: r.winner === 1, draw: r.winner === -1 || !!r.draw, winner: r.winner, sc: [r.sc[1], r.sc[0]], me: r.them, them: r.me, top: 0, t: r.t, team: r.team}; }
  function finish(res, show){
    if (!G) return show(res);
    var g = G;
    if (g.host) {
      if (res.winner == null) res.winner = res.win ? 0 : res.draw ? -1 : 1;
      N.send({t: "m", d: {k: "e", r: [res, flip(res)]}}); N.send({t: "result"});
      G = null; return show(res);
    }
    var done = function(){ var e = g.end; G = null; show(e ? e[g.side] : res); };
    if (g.end) return done();
    g.wait = done; setTimeout(function(){ if (g.wait) { g.wait = null; done(); } }, 6000);
  }
  var st = document.createElement("style");
  st.textContent = ".wq .wqt{font-size:.9rem;color:#a9b0d6}.wq .wqt b{font-size:1.6rem;color:#ffd23b;margin-right:.2rem}";
  document.head.appendChild(st);
});
})();
