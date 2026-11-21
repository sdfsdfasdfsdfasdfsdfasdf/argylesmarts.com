// MEGS layout: the lobby fits the screen (no scrolling) with Season, Rank and Play stacked on the right; the Locker
// keeps its header and player still while only the item grid scrolls; ranked modes sit in a 2x2 grid; game set-up
// screens always have a clear way back to Play; and a proper credits page.
(function(){
"use strict";
var MG = window.MG;
function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.ui.VIEW.home && MG.ui.VIEW.credits && MG.ui.AFTER) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, AFTER = U.AFTER, ic = U.ic, esc = U.esc;
  // fit a screen to the window below the header: it gets the space that is left, and the page itself never scrolls
  function fit(sel){
    var el = document.querySelector(sel); if (!el || innerWidth <= 900) { document.body.classList.remove("nosc"); return; }
    document.body.classList.add("nosc");
    el.style.height = Math.max(320, innerHeight - el.getBoundingClientRect().top - window.scrollY * 0 - 12) + "px";
  }
  var cur = "";
  function after(name, f){ var a0 = AFTER[name]; AFTER[name] = function(a){ if (a0) a0.apply(this, arguments); cur = name; f(a); }; }
  after("home", function(){
    // Season and Rank become buttons, stacked above Play
    var R = document.querySelector(".rlR"); if (R) {
      var bx = R.querySelectorAll(".rlBox");
      if (bx[0]) { bx[0].setAttribute("data-a", "go"); bx[0].setAttribute("data-v", "pass"); bx[0].classList.add("rlBtn"); }
      var rk = R.querySelector(".rlRank"); if (rk) { rk.setAttribute("data-a", "go"); rk.setAttribute("data-v", "ranks"); rk.classList.add("rlBtn"); }
    }
    window.scrollTo(0, 0); fit(".lob");
  });
  after("locker", function(){ window.scrollTo(0, 0); fit(".lock"); });
  // every other screen scrolls as normal
  window.addEventListener("resize", function(){ if (cur === "home") fit(".lob"); else if (cur === "locker") fit(".lock"); });
  ["play", "shop", "pass", "ranks", "profile", "settings", "credits", "quick", "team", "field", "campaign", "ladder", "cups", "gauntlet", "party", "help", "admin", "result", "tres"].forEach(function(n){
    after(n, function(){ document.body.classList.remove("nosc"); });
  });
  // game set-up screens: a clear "Back to Play" at the top, and which step you are on
  var SETUP = {quick: "Practice Solo", team: "Practice with AI", field: "Solo Full Pitch", campaign: "Campaign", ladder: "The Ladder", cups: "Cups", gauntlet: "The Gauntlet", party: "Co-op"};
  Object.keys(SETUP).forEach(function(n){
    after(n, function(){
      var v = document.getElementById("view"); if (!v || v.querySelector(".gnav")) return;
      v.insertAdjacentHTML("afterbegin", '<div class="gnav"><button class="btn ghost sm" data-a="go" data-v="play">' + ic("back") + 'Back to Play</button><ol><li>Pick a mode</li><li class="on">Set up: ' + SETUP[n] + '</li><li>Kick off</li></ol></div>');
    });
  });
  after("play", function(){
    var v = document.getElementById("view"); if (!v || v.querySelector(".gnav")) return;
    v.insertAdjacentHTML("afterbegin", '<div class="gnav"><ol><li class="on">Pick a mode</li><li>Set up</li><li>Kick off</li></ol><span class="gtip">Ranked earns rank points. Practice is for warming up. Challenges have prizes.</span></div>');
  });

  // ---- credits ----
  VIEW.credits = function(){
    var I = MG.ITEMS || [], n = function(t){ return I.filter(function(it){ return it.t === t; }).length; };
    var facts = [
      [I.length, "items to collect"], [n("kit"), "skins"], [n("stadium"), "stadiums"], [n("banner"), "banners"], [MG.PASS_N || 50, "season pass tiers"],
      [(MG.TIERS || []).length, "ranks, Bronze to Legend"], [MG.BP_N || 5, "blueprints build a Celestial"], ["5", "team sizes, Solo to 5v5"], [MG.CAMP ? MG.CAMP.length * 6 : 36, "campaign matches"], ["15 s", "to find you a match online"]];
    var built = ["The cage: first to 5, long range counts double", "Nutmegs, ankle breakers and the perfect-strike aim bar", "5v5 on a full pitch, then 2v2, 3v3 and 4v4", "Season 1: Kickoff and its 50-tier pass",
      "Celestial skins and their blueprints", "Accounts with passcodes, friends and parties", "A bank on the server so nobody can give themselves coins", "Rank points, rare goals and rank rewards", "Online matches, with computer players filling in", "Stadiums that wrap round the whole pitch"];
    return '<div class="crv2"><button class="btn ghost" data-a="go" data-v="settings">' + ic("back") + 'Back</button>' +
      '<section class="crH"><span class="kick">Credits</span><h1>MEGS</h1><p>Cage football and 5v5</p><div class="crN"><div><small>Made by</small><b>Hudson Boyd</b></div><div><small>Made by</small><b>Auden Sattler</b></div></div></section>' +
      '<section class="crF">' + facts.map(function(f){ return '<div><b>' + esc(String(f[0])) + '</b><span>' + esc(f[1]) + '</span></div>'; }).join("") + '</section>' +
      '<section class="crB"><h3>Things we built</h3><ol>' + built.map(function(b){ return '<li>' + esc(b) + '</li>'; }).join("") + '</ol></section>' +
      '<p class="crT">Thanks for playing.</p></div>';
  };

  var st = document.createElement("style");
  st.textContent = [
    "body.nosc{overflow:hidden}body.nosc .lob{min-height:0!important}",
    ".rlR{justify-content:flex-end!important;gap:.6rem!important}.rlBtn{cursor:pointer;transition:transform .12s,border-color .12s}.rlBtn:hover{transform:translateX(-4px);border-color:#6b7cff}.rlBtn .kick::after{content:' \\203A';opacity:.7}",
    ".rlR .rlPlay{order:3;min-height:84px}.rlR .rlRank{order:2}.rlR .rlBox:not(.rlRank){order:1}",
    // the Locker: player panel and tabs stay put, only the grid of items scrolls
    "body.nosc .lock{align-items:stretch;overflow:hidden}body.nosc .lock>section.prev{overflow:auto;min-height:0}body.nosc .lock>div:last-child{display:flex;flex-direction:column;min-height:0}body.nosc .lock>div:last-child>:last-child{flex:1;min-height:0;overflow:auto;align-content:start;padding-right:.3rem}",
    // ranked: two by two (the full team takes the whole last row)
    ".plG.rkg{display:block}.plG.rkg .plR{grid-template-columns:repeat(2,minmax(0,1fr));max-width:820px}.plG.rkg .plT:nth-child(5){grid-column:1/-1}",
    // game navigation
    ".gnav{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:.8rem}.gnav ol{display:flex;gap:.3rem;margin:0;padding:0;list-style:none;counter-reset:s}.gnav li{counter-increment:s;font-size:.78rem;color:#a9b0d6;padding:.25rem .7rem;border-radius:999px;background:rgba(255,255,255,.05)}.gnav li::before{content:counter(s) '. '}.gnav li.on{background:#3b6ef5;color:#fff;font-weight:800}.gtip{font-size:.78rem;color:#a9b0d6}",
    // credits
    ".crv2{display:flex;flex-direction:column;gap:1rem;max-width:900px;margin:0 auto}.crv2>.btn{align-self:flex-start}",
    ".crH{text-align:center;padding:2rem 1rem;border-radius:22px;background:radial-gradient(120% 120% at 50% 0%,rgba(59,110,245,.45),rgba(10,12,32,.85));border:1px solid #2f3466}.crH h1{font-size:clamp(3rem,10vw,6rem);margin:.2rem 0;font-style:italic;letter-spacing:.06em;text-shadow:0 6px 30px rgba(59,110,245,.8)}.crH p{color:#a9b0d6;margin:0}",
    ".crN{display:flex;justify-content:center;gap:1rem;margin-top:1.2rem;flex-wrap:wrap}.crN div{display:flex;flex-direction:column;padding:.8rem 1.4rem;border-radius:16px;background:rgba(255,210,59,.1);border:1px solid rgba(255,210,59,.45)}.crN small{color:#ffd23b;font-size:.7rem;text-transform:uppercase;letter-spacing:.14em}.crN b{font-size:1.5rem}",
    ".crF{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:.6rem}.crF div{display:flex;flex-direction:column;align-items:center;text-align:center;padding:.9rem .5rem;border-radius:16px;background:rgba(10,12,32,.75);border:1px solid #2f3466}.crF b{font-size:1.6rem;color:#5ee6ff}.crF span{font-size:.78rem;color:#a9b0d6}",
    ".crB{padding:1rem 1.2rem;border-radius:18px;background:rgba(10,12,32,.75);border:1px solid #2f3466}.crB h3{margin:0 0 .5rem}.crB ol{margin:0;padding-left:1.3rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:.35rem 1.5rem}.crB li{color:#dfe3ff}.crT{text-align:center;color:#ffd23b;font-weight:800;letter-spacing:.1em}"
  ].join("\n");
  document.head.appendChild(st);
});
})();
