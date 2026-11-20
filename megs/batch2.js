// MEGS batch 2 screens: rank backgrounds, the rank rewards panel, and the Season 1 loading screen.
(function(){
"use strict";
var MG = window.MG, R = MG.R, BY = MG.ITEM, TAU = Math.PI * 2;

// ---- the Season 1 loading screen: shown while the game starts ----
(function(){
  var d = document.createElement("div"); d.id = "s1load";
  d.innerHTML = '<canvas id="s1c"></canvas><div class="s1t"><span>Season 1</span><b>KICKOFF</b><i class="s1b"><em></em></i><small>Loading the cage...</small></div>';
  var st = document.createElement("style");
  st.textContent = "#s1load{position:fixed;inset:0;z-index:9000;background:radial-gradient(120% 90% at 30% 20%,#3b2bd6 0%,#16124a 45%,#06071a 100%);display:grid;place-items:center;transition:opacity .5s}#s1load.out{opacity:0;pointer-events:none}" +
    "#s1c{position:absolute;inset:0;width:100%;height:100%}.s1t{position:relative;text-align:center;color:#fff;display:flex;flex-direction:column;align-items:center;gap:.3rem;margin-top:38vh}" +
    ".s1t span{font-size:.9rem;font-weight:900;letter-spacing:.4em;text-transform:uppercase;color:#ffd23b}.s1t b{font-size:clamp(2.4rem,9vw,5.5rem);font-style:italic;font-weight:900;letter-spacing:.04em;line-height:.95;text-shadow:0 6px 30px rgba(59,110,245,.8),0 0 2px #fff}" +
    ".s1b{display:block;width:min(320px,70vw);height:8px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:.8rem}.s1b em{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd23b,#ff9d2e);animation:s1fill 1.6s ease-out forwards}@keyframes s1fill{to{width:100%}}" +
    ".s1t small{color:#a9b0d6;font-size:.8rem;margin-top:.2rem}";
  document.head.appendChild(st);
  document.body.appendChild(d);
  var cv = d.querySelector("canvas"), t0 = performance.now(), done = false;
  // the key art: three players from this season's pass on a floodlit stage, with light rays behind them
  function art(now){
    if (done) return;
    var t = (now - t0) / 1000, w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1), g, i;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.42);
    for (i = 0; i < 14; i++) { g.rotate(TAU / 14); g.fillStyle = i % 2 ? "rgba(255,210,59,.06)" : "rgba(127,176,255,.07)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.max(w, h), -60 - 30 * Math.sin(t + i)); g.lineTo(Math.max(w, h), 60 + 30 * Math.sin(t + i)); g.fill(); }
    g.restore();
    g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(w / 2, h * 0.66, Math.min(w * 0.42, 420), 34, 0, 0, TAU); g.fill();
    if (R && R.portrait && MG.ITEMS) {
      var pick = ["su_sun", "k_galaxy", "su_moon"].map(function(id){ return BY[id] ? id : "home"; }), sz = Math.min(h * 0.42, w * 0.3);
      [[-1, 0.8], [1, 0.8], [0, 1]].forEach(function(p, j){
        var c = art.cv || (art.cv = [0, 1, 2].map(function(){ return document.createElement("canvas"); })), cc = c[j], s = sz * p[1];
        cc.width = 300; cc.height = 400;
        try { R.portrait(cc, {kit: pick[j], look: {skin: (j * 2) % 5, hair: j * 5 + 2, hc: j, num: [7, 10, 9][j]}}, t + j, {turn: -p[0] * 0.35}); } catch (e) {}
        g.drawImage(cc, w / 2 + p[0] * sz * 0.62 - s * 0.375, h * 0.66 - s, s * 0.75, s);
      });
    }
    requestAnimationFrame(art);
  }
  requestAnimationFrame(art);
  function hide(){ if (done) return; done = true; d.classList.add("out"); setTimeout(function(){ d.remove(); }, 600); }
  var shown = performance.now();
  window.addEventListener("load", function(){ setTimeout(hide, Math.max(0, 1700 - (performance.now() - shown))); });
  setTimeout(hide, 6000);
  d.addEventListener("click", hide);
})();

// ---- rank backgrounds: the rank's colours with its badge ----
function waitR(f){ if (MG.R && MG.R.scene && MG.rankBadge) f(); else setTimeout(function(){ waitR(f); }, 0); }
waitR(function(){
  var sc0 = MG.R.scene;
  MG.R.scene = function(g, w, h, id, t){
    var it = BY[id];
    if (!it || !/^rk\d$/.test(it.k || "")) return sc0.apply(this, arguments);
    var k = +it.k.slice(2), T = MG.TIERS[k], gr = g.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, Math.max(w, h) * 0.75), i;
    gr.addColorStop(0, MG.hexA ? MG.hexA(T.c, 0.55) : T.c); gr.addColorStop(0.45, "#14163a"); gr.addColorStop(1, "#06071a");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h * 0.45); g.rotate((t || 0) * 0.05);
    for (i = 0; i < 18; i++) { g.rotate(TAU / 18); g.fillStyle = MG.hexA ? MG.hexA(T.c, i % 2 ? 0.07 : 0.03) : "rgba(255,255,255,.04)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.max(w, h), -Math.max(w, h) * 0.09); g.lineTo(Math.max(w, h), Math.max(w, h) * 0.09); g.fill(); }
    g.restore();
    g.globalAlpha = 0.85; MG.rankBadge(g, w / 2, h * 0.45, Math.min(w, h) * 0.5, k, t || 0); g.globalAlpha = 1;
  };
});

function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.ui.VIEW.ranks && MG.rankCalc) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, esc = U.esc;
  // guests keep their rank rewards on this device; accounts get them from the server
  function grant(){ if (MG.net && MG.net.me) return; var got = MG.rankGrant(); if (got.length) { MG.save(); U.toast("Rank reward" + (got.length > 1 ? "s" : "") + " unlocked: " + got.map(function(it){ return esc(it.n); }).join(", ")); } }
  grant();
  var fin0 = MG.finish;
  MG.finish = function(res){ var out = fin0.apply(this, arguments); if (res && res.ranked) setTimeout(grant, 1500); return out; };
  // the rank rewards on the Ranks page
  var rk0 = VIEW.ranks;
  VIEW.ranks = function(){
    var s = MG.S, have = MG.tier(Math.max(s.elo || 0, s.peak || 0)), T = MG.TIERS, k, h = "";
    for (k = 1; k < T.length; k++) {
      var ok = k <= have;
      h += '<div class="rkr' + (ok ? " on" : "") + '" style="--c:' + T[k].c + '"><div class="rkh">' + MG.rankHTML(T[k].min) + '<small>' + (ok ? "Unlocked" : T[k].min + " rank points") + '</small></div><div class="rki">' +
        (MG.RANK_ITEMS[k] || []).map(function(id){ var it = BY[id]; return '<button class="rkit" data-a="item" data-id="' + id + '" title="' + esc(it.n) + '">' + U.vis(it, "") + '<span>' + {kit: "Skin", boot: "Boots", banner: "Banner", scene: "Background"}[it.t] + '</span></button>'; }).join("") + '</div></div>';
    }
    return '<section class="panel rkrw"><h3>Rank rewards <small>reach a rank in Ranked and its skin, boots, banner and background are yours</small></h3><div class="rkg">' + h + '</div></section>' + rk0.apply(this, arguments);
  };
  var st = document.createElement("style");
  st.textContent = ".rkg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.6rem}.rkr{border:1px solid #2f3466;border-left:4px solid var(--c);border-radius:14px;padding:.55rem .7rem;background:rgba(10,12,32,.6);filter:saturate(.5) brightness(.8)}.rkr.on{filter:none;box-shadow:0 0 18px -8px var(--c)}" +
    ".rkh{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.4rem}.rkh small{color:#a9b0d6;font-size:.72rem}.rki{display:grid;grid-template-columns:repeat(4,1fr);gap:.35rem}" +
    ".rkit{display:flex;flex-direction:column;align-items:center;gap:.15rem;background:#16182e;border:1px solid #2a2d55;border-radius:10px;padding:.25rem;color:#dfe3ff;cursor:pointer;font:inherit;min-width:0}.rkit canvas,.rkit .sw{width:100%!important;height:58px!important;object-fit:contain}.rkit span{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}";
  document.head.appendChild(st);
});
})();
