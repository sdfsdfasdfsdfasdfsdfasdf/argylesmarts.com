// MEGS lobby modes: Classic (ranked 1v1 to 5v5 on a field sized to the teams) is picked with small size buttons right
// above Play, like a game lobby's mode picker. Every other way to play sits behind the Game Modes button next to Play.
(function(){
"use strict";
var MG = window.MG;
function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.ui.VIEW.home && MG.ui.VIEW.play && MG.ui.AFTER && MG.ui.ACT.rk && MG.SIZE_N) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, ACT = U.ACT, AFTER = U.AFTER, ic = U.ic, esc = U.esc;
  function S(){ return MG.S; }
  function N(){ return MG.net || {}; }
  function party(){ return !!(N().inParty && N().inParty()); }
  function psize(){ return party() && N().party && N().party.members ? N().party.members.length : 1; }
  function leader(){ return !party() || N().party.leader === (N().me || {}).id; }
  function sel(){ var n = +((S().set || {}).csz) || 1, p = psize(); if (!(n === 1 && p === 2) && n < p) n = Math.min(5, p); return Math.max(1, Math.min(5, n)); }
  var FIELD = {1: "cage", 2: "small field", 3: "medium field", 4: "big field", 5: "full field"};

  function signed(){ return !!(MG.onlineSigned ? MG.onlineSigned() : N().signed && N().signed()); }
  function OQ(){ return MG.onlineQ ? MG.onlineQ() : {q: null, found: null}; }
  function pv(n){ return n === 1 && party(); }   // a party of two picking 1v1 plays each other
  function nameFor(n){ return pv(n) ? "Party 1v1" : "Ranked " + MG.SIZE_N[n]; }
  function subFor(n){ return pv(n) ? "You two play each other in the cage. No rank points." : n + "v" + n + " " + (n === 1 ? "in" : "on") + " the " + FIELD[n]; }
  function okSize(k){ var p = psize(); return k === 1 ? (p === 1 || p === 2) : k >= p; }
  function roster(mine, other, n, fill){
    function col(t, list){ var h = '<div><h5>' + t + '</h5>', i; for (i = 0; i < n; i++) h += list[i] ? '<span class="qn">' + esc(list[i]) + '</span>' : '<span class="qn ' + (fill ? "bot" : "open") + '">' + (fill ? "Bot" : "...") + '</span>'; return h + '</div>'; }
    return '<div class="qro">' + col("Your team", mine || []) + col("Other team", other || []) + '</div>';
  }
  function picker(){
    var o = OQ(), lead = leader();
    if (o.found) {
      var F = o.found, bots = F.mine.length + F.other.length < F.n * 2;
      return '<div class="cls srch found"><div class="clsH"><span class="kick">Match found</span><b>' + esc(F.title) + '</b><small>' + (bots ? "Bots (computer players) fill the empty spots" : "Everyone here is a real player") + '</small></div>' + roster(F.mine, F.other, F.n, 1) + '<i class="qbar"><em></em></i></div>';
    }
    if (o.q) {
      var Q = o.q, n = +String(Q.mode).slice(2) || 1, L = Q.lob;
      return '<div class="cls srch"><div class="clsH"><span class="kick">' + (Q.pk ? "Starting" : "Searching") + ' &middot; ' + esc(o.title(Q.mode)) + '</span><b>' + (Q.pk ? "Getting your party ready" : "Finding players") + ' <i id="qT">0:00</i></b><small id="qE">' + (Q.pk ? "" : "Bots fill any empty spots after 15 seconds") + '</small></div>' +
        (n > 1 && !Q.pk ? roster(L ? L.mine : [N().me ? N().me.name : "You"], L ? L.other : [], n, 0) : "") + '<i class="qspin"></i></div>';
    }
    var n = sel(), h = '<div class="cls"><div class="clsH"><span class="kick">Classic &middot; ' + (pv(n) ? "Party" : "Ranked") + '</span><b id="clsN">' + nameFor(n) + '</b><small id="clsF">' + subFor(n) + '</small></div><div class="clsS">';
    for (var k = 1; k <= 5; k++) {
      var off = !okSize(k) || !lead;
      h += '<button class="clsB' + (k === n ? " on" : "") + '"' + (off ? " disabled" : ' data-a="csz" data-v="' + k + '"') + ' title="' + nameFor(k) + '">' + k + 'v' + k + '</button>';
    }
    h += '</div>' + (signed() ? "" : '<p class="clsG">You\'re playing against bots. If you want to play online, <a href="#" data-a="acc" data-v="login">log in</a>.</p>');
    return h + '</div>';
  }
  function playRow(){
    var lead = leader(), o = OQ();
    if (o.found) return '<div class="rlPR"><button class="rlPlay load" disabled>' + '<b>Loading</b></button></div>';
    if (o.q) return '<div class="rlPR"><button class="rlPlay cancel" ' + (lead ? 'data-a="wqCancel"' : "disabled") + '>' + ic("x") + '<b>' + (lead ? "Cancel" : "Searching") + '</b></button></div>';
    return '<div class="rlPR"><button class="rlModes" data-a="go" data-v="play">' + ic("pitch") + '<b>Game<br>Modes</b></button>' +
      '<button class="rlPlay' + (lead ? "" : " wait") + '" data-a="rlPlay">' + ic("play") + '<b>' + (lead ? "Play" : "Ready") + '</b></button></div>' +
      (lead ? "" : '<small class="clsW">The party leader starts the game</small>');
  }
  MG.qdraw = function(){ if (U.cur && U.cur() === "home") { var g = document.querySelector(".rlGo"); if (g) { g.innerHTML = picker() + playRow(); var b = g.querySelector(".qbar em"); if (b) setTimeout(function(){ b.style.width = "100%"; }, 30); } } };
  setInterval(function(){
    var o = OQ(), t = document.getElementById("qT"), e = document.getElementById("qE");
    if (!o.q || !t) return;
    var s = Math.floor((Date.now() - o.q.t0) / 1000); t.textContent = Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2);
    if (e && o.q.ends && !o.q.pk) e.textContent = "Bots fill any empty spots in " + Math.max(0, Math.ceil((o.q.ends - Date.now()) / 1000)) + " s";
  }, 250);
  var home0 = VIEW.home;
  VIEW.home = function(){
    var h = home0.apply(this, arguments), i = h.indexOf('<button class="rlPlay"'), j = i >= 0 ? h.indexOf('</button>', i) : -1;
    if (i < 0 || j < 0) return h;
    return h.slice(0, i) + '<div class="rlGo">' + picker() + playRow() + '</div>' + h.slice(j + 9);
  };
  ACT.csz = function(d){
    var n = +d.v || 1; S().set.csz = n; MG.save();
    [].forEach.call(document.querySelectorAll(".clsB"), function(b, k){ b.classList.toggle("on", k + 1 === n); });
    var a = document.getElementById("clsN"), f = document.getElementById("clsF");
    if (a) a.textContent = nameFor(n); if (f) f.textContent = subFor(n);
    var kk = document.querySelector(".cls .clsH .kick"); if (kk) kk.innerHTML = "Classic &middot; " + (pv(n) ? "Party" : "Ranked");
    MG.sfx && MG.sfx("ui");
  };
  ACT.rlPlay = function(){
    if (!leader()) return U.toast("You're ready. The party leader starts the game.");
    var n = sel();
    if (pv(n)) return ACT.pv1();
    if (!signed()) U.toast("You're playing against bots. If you want to play online, log in.");
    ACT.rk({v: n});
  };

  // the old Play page becomes Game Modes: everything except Classic, which lives in the lobby
  var play0 = VIEW.play;
  VIEW.play = function(){
    var h = play0.apply(this, arguments), i = h.indexOf('<section class="plG rkg">'), j = i >= 0 ? h.indexOf('</section>', i) : -1;
    if (i >= 0 && j >= 0) h = h.slice(0, i) + h.slice(j + 10);
    return h.replace('<h1>Play</h1>', '<h1>Game Modes</h1>').replace("only Ranked earns rank points.", "rank points come from Classic in the lobby.");
  };

  var css = [
    ".rlGo{order:3;display:flex;flex-direction:column;gap:.5rem}",
    ".cls{background:rgba(10,12,40,.72);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:.55rem .6rem .6rem;backdrop-filter:blur(6px)}",
    ".clsH{display:flex;flex-direction:column;line-height:1.15;margin-bottom:.45rem}.clsH .kick{font-size:.62rem}.clsH b{font-size:1.05rem;letter-spacing:.02em}.clsH small{font-size:.7rem;color:#a9b0d6}",
    ".clsS{display:grid;grid-template-columns:repeat(5,1fr);gap:.3rem}",
    ".clsB{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#e8ebff;border-radius:8px;padding:.38rem 0;font:inherit;font-weight:800;font-size:.78rem;cursor:pointer;transition:transform .1s,background .1s}",
    ".clsB:hover:not([disabled]){transform:translateY(-2px);background:rgba(255,255,255,.14)}.clsB.on{background:linear-gradient(135deg,#ffe066,#ffb21e);color:#14163a;border-color:transparent;box-shadow:0 4px 14px -4px rgba(255,190,40,.8)}.clsB[disabled]{opacity:.35;cursor:not-allowed}",
    ".rlPR{display:flex;gap:.5rem;align-items:stretch;padding-right:8px}.rlPR .rlPlay{flex:1;min-width:0;min-height:84px;margin:0;gap:.4rem}.rlPR .rlPlay b{font-size:clamp(1.3rem,2.2vw,2rem)}.rlPR .rlPlay .ic{width:clamp(22px,2.4vw,34px);height:clamp(22px,2.4vw,34px)}",
    ".rlModes{flex:none;width:74px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:linear-gradient(135deg,#3a4180,#1d2150);color:#fff;font:inherit;cursor:pointer;transform:skewX(-8deg);transition:transform .12s}",
    ".rlModes>*{transform:skewX(8deg)}.rlModes b{font-size:.78rem;line-height:1.05;text-transform:uppercase;letter-spacing:.06em;text-align:center}.rlModes .ic{width:22px;height:22px}.rlModes:hover{transform:skewX(-8deg) scale(1.05)}",
    ".rlPlay.wait{filter:saturate(.4) brightness(.85)}.clsW{font-size:.72rem;color:#a9b0d6;text-align:center}",
    ".clsG{margin:.45rem 0 0;font-size:.72rem;line-height:1.3;color:#cfd6ff}.clsG a{color:#ffd23b;font-weight:800}",
    ".srch .clsH b{display:flex;align-items:baseline;gap:.4rem}.srch #qT{font-style:normal;color:#ffd23b;font-variant-numeric:tabular-nums}",
    ".qro{display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin:.2rem 0 .3rem}.qro h5{margin:0 0 .2rem;font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;color:#a9b0d6}",
    ".qn{display:block;padding:.2rem .4rem;margin-bottom:.2rem;border-radius:6px;background:rgba(255,255,255,.09);font-size:.72rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qn.bot{font-style:italic;font-weight:500;opacity:.7}.qn.open{opacity:.45;border:1px dashed rgba(255,255,255,.35);background:none}",
    ".qspin{display:block;height:4px;border-radius:9px;margin-top:.3rem;background:linear-gradient(90deg,transparent,#ffd23b,transparent);background-size:50% 100%;background-repeat:no-repeat;animation:qsp 1.1s linear infinite}@keyframes qsp{from{background-position:-50% 0}to{background-position:150% 0}}",
    ".qbar{display:block;height:5px;border-radius:9px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:.3rem}.qbar em{display:block;height:100%;width:0;background:#ffd23b;transition:width 2.5s linear}",
    ".rlPlay.cancel{background:linear-gradient(135deg,#ff6b6b,#d63b4a);color:#fff}.rlPlay.load{filter:saturate(.6);cursor:wait}",
    ".rlC{justify-content:center!important;padding-bottom:0!important}.rlParty{flex:1;display:flex;flex-direction:column;justify-content:center;max-height:100%}.rlLine{align-items:center!important}",
    ".rlMe canvas#hero{width:min(330px,38vh,46cqi)!important;height:min(440px,50vh,61cqi)!important}.lob{grid-template-rows:minmax(0,1fr)}.rlC,.rlR{min-height:0}",
    ".plT{padding-top:1.6rem!important;align-items:flex-start!important}.plT .ic{margin-top:.15rem}.plT span{min-width:0}",
    "@media(max-height:700px){.rlR .rlBox{padding:.4rem .7rem!important}.rlR .rlBox>small{display:none}.clsH small{display:none}.rlPR .rlPlay{min-height:62px}.rlModes{min-height:62px}.clsG{margin-top:.3rem;font-size:.66rem}}",
    "@media(max-width:900px){.rlGo{order:3}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  // the party changing (someone joins, leaves, or the leader changes) redraws the picker
  // the lobby may already be on screen from before this loaded: draw it again with the picker
  if (U.cur && U.cur() === "home" && !document.querySelector(".rlGo")) U.go("home");
  if (MG.net && MG.net.hook) MG.net.hook("party", function(){ setTimeout(function(){ if (U.cur && U.cur() === "home") { MG.qdraw(); } }, 0); });
});
})();
