// MEGS rank points. Only ranked matches (1v1 in the cage, or 2v2 to 5v5 on the big pitch) earn or lose them.
// Points come from winning, how well you played, and rare things you pulled off. Gains are capped each day,
// so climbing from Bronze to Legend (six rank-ups) takes at least three weeks of playing every day.
(function(){
"use strict";
var MG = window.MG, S = function(){ return MG.S; };
var MINS = [0, 250, 550, 900, 1300, 1700, 2100];
MG.TIERS.forEach(function(t, i){ t.min = MINS[i]; });
MG.RP_DAY = 100;
MG.SIZE_N = {1: "Solo", 2: "Duos", 3: "Trios", 4: "Squads", 5: "Team"};
MG.rankProg = function(rp){ var T = MG.TIERS, k = MG.tier(rp); return T[k + 1] ? Math.max(0, Math.min(1, (rp - T[k].min) / (T[k + 1].min - T[k].min))) : 1; };
// the CPU league moves onto the rank point scale; how hard a rival plays still follows their old strength
var league0 = MG.league;
MG.league = function(){ var w = league0(); if (!w.rp) { w.rp = 1; w.forEach(function(p){ p.elo = Math.max(0, Math.round((p.elo - 720) * 1.27)); }); } return w; };
MG.lvlFor = function(rp){ return MG.clamp((720 + rp / 1.27 - 930) / 160, 0, 10); };
// the same sums run on the server, which has the final say for signed-in players
var RARE = [["corner", 5, "Top corner goal"], ["mgoal", 6, "Goal through the legs"], ["vgoal", 4, "Volley goal"], ["post", 3, "In off the post"], ["pgoal", 2, ""], ["twos", 2, ""]];
MG.rankCalc = function(res){
  var m = res.me || {}, sc = res.sc || [0, 0], rare = [], r = 0, perf, pts;
  perf = Math.min(12, (m.goals || 0) * 2 + (m.megs || 0) * 2 + (m.ankles || 0) * 2 + (m.perfect || 0) + Math.floor((m.tackles || 0) / 2) + (m.blocks || 0) + Math.floor((m.pok || 0) / 10));
  RARE.forEach(function(x){ var n = Math.min(5, m[x[0]] || 0); if (!n) return; r += n * x[1]; if (x[2]) rare.push(x[2] + (n > 1 ? " x" + n : "")); });
  r = Math.min(15, r);
  if (res.win) pts = Math.min(40, 16 + perf + r + (sc[0] - sc[1] >= 3 ? 3 : 0) + (sc[1] === 0 ? 3 : 0));
  else if (res.draw) pts = Math.min(8, Math.floor((perf + r) / 3));
  else pts = Math.min(-3, -14 + Math.floor((perf + r) / 2));
  return {pts: pts, rare: rare};
};
// what this match is worth today, after the daily cap on gains
MG.rankPts = function(res){
  var s = S(), c = MG.rankCalc(res), d = MG.day(), cap = 0;
  if (!s.rpd || s.rpd.d !== d) s.rpd = {d: d, g: 0};
  if (c.pts > 0) { var left = Math.max(0, MG.RP_DAY - s.rpd.g); if (c.pts > left) { c.pts = left; cap = 1; } s.rpd.g += c.pts; }
  return {pts: c.pts, rare: c.rare, cap: cap};
};
MG.rankToday = function(){ var s = S(), d = MG.day(); return s.rpd && s.rpd.d === d ? s.rpd.g : 0; };
MG.rankLine = function(){ var s = S(), T = MG.TIERS, k = MG.tier(s.elo); return T[k].n + " &middot; " + s.elo + " rank points" + (T[k + 1] ? " &middot; " + (T[k + 1].min - s.elo) + " to " + T[k + 1].n : "") + " &middot; today " + MG.rankToday() + " of " + MG.RP_DAY; };
// everyone starts the new rank points at zero (Bronze), once
(function(s){ if (!s || s.rpv === 1) return; s.rpv = 1; s.elo = 0; s.peak = 0; s.eh = [0]; if (MG.save) MG.save(); })(MG.S);

function waitUi(f){ if (MG.ui && MG.ui.ACT && MG.teamGo) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT;
  // the ranked tiles on the Play screen
  ACT.rk = function(d){
    var n = +d.v || 1, s = S();
    if (n === 1) { if (MG.net && MG.net.inParty && MG.net.inParty()) return U.toast("A party plays ranked 2v2 and up."); return ACT.ranked(); }   // ranked 1v1 is in the cage
    var lv = MG.clamp(MG.lvlFor(s.elo) + (Math.random() - 0.5) * 1.2, 0.3, 9.5), k = Math.floor(Math.random() * 36), ch = MG.CAMP[Math.floor(k / 6)].m[k % 6], f = MG.club(ch);
    f.lv = lv;
    MG.teamGo({name: "Ranked " + MG.SIZE_N[n], sub: "Two halves of 1.5 minutes. Rank points are on the line.", foe: f, foeRp: s.elo, half: 90, mate: 6, n: n, ranked: 1, mode: "rteam", back: "home",
      again: function(){ ACT.rk({v: n}); }});
  };
  var st = document.createElement("style");
  st.textContent = ".rpw{font-size:.62rem;color:#a9b0d6;margin-left:.3rem;font-weight:600}.plG.rkg h3 small{color:#ffd23b}";
  document.head.appendChild(st);
});
})();
