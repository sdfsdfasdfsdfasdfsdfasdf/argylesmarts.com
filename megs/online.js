// MEGS online play. Ranked Solo, Duos, Trios, Squads and Team are played against real people when the server finds
// them; whoever is still missing after 15 seconds is a computer player. One player's browser (the host) runs the
// match; everyone else sends their keys to it and draws what it sends back, through the Megs server.
(function(){
"use strict";
var MG = window.MG;
function waitUi(f){ if (MG.ui && MG.net && MG.net.hook && MG.teamSides && MG.play && MG.now && MG.SIZE_N && MG.ui.ACT.rk) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, N = MG.net, esc = U.esc, S = function(){ return MG.S; };
  var Q = null, G = null, ON = {2: [0, 3], 3: [0, 1, 3], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4]}, ORDER = [3, 1, 4, 2, 0], POS = {x: 1, y: 1, z: 1};
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
    U.modal('<div class="center wq"><div class="spin"></div><h2>Waiting for ' + (party() ? "players and team mates" : "players") + '...</h2><p class="mute">Ranked ' + MG.SIZE_N[n] + ' (' + n + 'v' + n + '). Anyone not found in 15 seconds is a computer player.</p><p class="wqt"><b id="wqt">0</b> seconds</p>' +
      (lead ? '<button class="btn ghost" data-a="wqCancel">Cancel</button>' : '<p class="mute">The party leader can cancel.</p>') + '</div>');
    if (Q) clearInterval(Q.timer);
    Q = {mode: mode, timer: setInterval(function(){ var e = document.getElementById("wqt"); if (e) e.textContent = Math.floor((Date.now() - t0) / 1000); }, 250)};
  }
  function unwait(){ if (Q) clearInterval(Q.timer); Q = null; if (document.querySelector(".wq")) U.close(); }
  ACT.wqCancel = function(){ N.send({t: "unqueue"}); unwait(); };
  N.hook("queue", function(m){ if (m.on && /^rk\d$/.test(m.mode)) waiting(m.mode); else unwait(); });
  N.hook("err", function(m){ if (m.c === "queue") unwait(); });

  // ---- a match was made ----
  N.hook("match", function(mt){
    unwait();
    if (!/^rk\d$/.test(mt.mode) || !N.me) return;
    var n = +mt.mode.slice(2), me = N.me.id, mine = mt.members.filter(function(x){ return x.id === me; })[0];
    if (!mine) return;
    var sides = [0, 1].map(function(s){ return mt.members.filter(function(x){ return x.side === s && !x.left; }); });
    if (sides[0].length + sides[1].length < 2) { N.send({t: "mleave"}); return rk0({v: n}); }   // nobody else: the usual match against the computer
    G = {mt: mt, n: n, side: mine.side, host: mt.host === me, seq: 0, last: null, tgt: null, evq: [], end: null, inSent: "", inAt: 0, gone: {}};
    if (n === 1) start1(mt, sides); else startTeam(mt, n, sides);
  });
  N.hook("gone", function(m){
    if (!G || m.mid !== G.mt.id) return;
    if (m.host && !G.host) { U.toast("The host left the match."); var g = G; G = null; MG.stop(); U.go("play"); return g; }
    G.gone[m.id] = 1;
    // someone left: a computer player takes over their player
    var r = MG.now(); if (G.host && r && r.m && r.m.xh) { var i = G.idx && G.idx[m.id]; if (i != null) delete r.m.xh[i]; }
    U.toast("A player left. A computer player takes their place.");
  });

  function sideOf(x){ return Object.assign({}, x.look || {}, {name: x.name, ring: x.side ? "#ff5d7a" : "#3b6ef5"}); }
  function names(list){ return list.map(function(x){ return x.name; }).join(" & "); }
  function oo(name, foe, n){ return {name: name, foe: {name: foe}, back: "play", again: function(){ ACT.rk({v: n}); }}; }

  // 1v1 in the cage, two real players
  function start1(mt, sides){
    var seed = (mt.opts && mt.opts.seed) || 1, a = sides[0][0], b = sides[1][0], src = [null, null], o, info;
    src[G.side] = KEYS;
    info = oo("Ranked Solo", G.side ? a.name : b.name, 1);
    o = {name: "Ranked Solo", sub: "Online: " + a.name + " v " + b.name, cfg: {}, mode: "ranked", ranked: 1, sides: [sideOf(a), sideOf(b)], st: [EVEN, EVEN], ai: [null, null], src: src, court: S().eq.court, ball: S().eq.ball, first: seed % 2, forfeit: 0,
      done: function(res){ finish(res, function(r){ var out = MG.finish({mode: "ranked", win: r.win, me: r.me, sc: r.sc, opp: {id: -9, name: info.foe.name, elo: 0}, top: r.top || 0, ranked: 1});
        MG.sfx(r.win ? "win" : "lose"); U.go("result", {o: info, foe: {name: info.foe.name}, res: r, out: out}); }); },
      quit: quit};
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
    G.idx = idx; G.myI = idx[N.me.id];
    var src = [null, null]; src[G.side] = KEYS;
    var info = oo("Ranked " + MG.SIZE_N[n], names2[1 - G.side], n);
    var o = {team: 1, ranked: 1, size: n, mode: "rteam", name: "Ranked " + MG.SIZE_N[n], sub: "Online: " + names2[0] + " v " + names2[1], first: seed % 2, ball: S().eq.ball,
      cfg: {half: 90, n: n, lv: [cl[0].lv, cl[1].lv], mate: 6, human: [false, false], xh: xh, names: [teams[0].map(function(t){ return t.name; }), teams[1].map(function(t){ return t.name; })], seed: seed, first: seed % 2},
      sides: [{name: names2[0]}, {name: names2[1]}], teams: teams, src: src, st: [], ai: [], forfeit: 0,
      done: function(res){ finish(res, function(r){ r.ranked = 1; r.size = n;
        var out = MG.finish({mode: "rteam", win: r.win, draw: r.draw, me: r.me, sc: r.sc, opp: {name: info.foe.name, elo: 0, id: -1}, top: 0, team: 1, ranked: 1, size: n, t: r.t});
        MG.sfx(r.win ? "win" : "lose"); U.go("tres", {o: info, res: r, out: out}); }); },
      quit: quit};
    go(o);
  }
  function quit(){ N.send({t: "mleave"}); G = null; U.go("play"); }

  // ---- running the match: the host simulates, everyone else follows ----
  function go(o){
    MG.play(o);
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
