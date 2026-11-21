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
  function sel(){ var n = +((S().set || {}).csz) || 1; if (n < psize()) n = Math.min(5, psize()); return Math.max(1, Math.min(5, n)); }
  var FIELD = {1: "small field", 2: "small field", 3: "medium field", 4: "big field", 5: "full field"};

  function picker(){
    var n = sel(), p = psize(), lead = leader(), h = '<div class="cls"><div class="clsH"><span class="kick">Classic &middot; Ranked</span><b id="clsN">Ranked ' + MG.SIZE_N[n] + '</b><small id="clsF">' + n + 'v' + n + ' on the ' + FIELD[n] + '</small></div><div class="clsS">';
    for (var k = 1; k <= 5; k++) {
      var off = k < p || !lead;
      h += '<button class="clsB' + (k === n ? " on" : "") + '"' + (off ? " disabled" : ' data-a="csz" data-v="' + k + '"') + ' title="Ranked ' + MG.SIZE_N[k] + '">' + k + 'v' + k + '</button>';
    }
    return h + '</div></div>';
  }
  function playRow(){
    var lead = leader();
    return '<div class="rlPR"><button class="rlModes" data-a="go" data-v="play">' + ic("pitch") + '<b>Game<br>Modes</b></button>' +
      '<button class="rlPlay' + (lead ? "" : " wait") + '" data-a="rlPlay">' + ic("play") + '<b>' + (lead ? "Play" : "Ready") + '</b></button></div>' +
      (lead ? "" : '<small class="clsW">The party leader starts the game</small>');
  }
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
    if (a) a.textContent = "Ranked " + MG.SIZE_N[n]; if (f) f.textContent = n + "v" + n + " on the " + FIELD[n];
    MG.sfx && MG.sfx("ui");
  };
  ACT.rlPlay = function(){
    if (!leader()) return U.toast("You're ready. The party leader starts the game.");
    ACT.rk({v: sel()});
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
    "@media(max-width:900px){.rlGo{order:3}}"
  ].join("");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  // the party changing (someone joins, leaves, or the leader changes) redraws the picker
  if (MG.net && MG.net.hook) MG.net.hook("party", function(){ setTimeout(function(){ if (U.cur && U.cur() === "home") { var g = document.querySelector(".rlGo"); if (g) g.innerHTML = picker() + playRow(); } }, 0); });
});
})();
