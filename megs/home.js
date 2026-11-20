// MEGS home screen laid out like a car-football lobby: menu buttons down the left, your player (and your party) in the middle, and one big Play button bottom right that opens every way to play.
(function(){
"use strict";
var MG = window.MG, S = function(){ return MG.S; };
function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.ui.ACT && MG.passTiers) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, ACT = U.ACT, AFTER = U.AFTER, ic = U.ic, esc = U.esc, modal = U.modal, toast = U.toast;
  function btn(a, v, icon, label, sub, extra){ return '<button class="rlb' + (extra || "") + '" data-a="' + a + '"' + (v ? ' data-v="' + v + '"' : "") + '>' + ic(icon) + '<span><b>' + label + '</b>' + (sub ? '<small>' + sub + '</small>' : "") + '</span></button>'; }
  VIEW.home = function(){
    var s = S(), pt = MG.passTier(), rd = MG.passReady(), qs = MG.quests(), qd = qs.filter(function(x){ return x.q.c; }).length, qr = qs.filter(function(x){ return x.done && !x.q.c; }).length, sc = MG.ITEM[s.eq.scene] || MG.ITEM.sc_night;
    var left = '<nav class="rlL">' +
      btn("friends", "", "users", "Friends", "Find and invite friends") +
      btn("go", "locker", "shirt", "Locker", "Kits, boots, hair, stadiums") +
      btn("go", "shop", "cart", "Shop", "Packs and the weekly shelf") +
      btn("go", "pass", "star", "Season Pass", "Tier " + pt + " of " + MG.PASS_N + (rd ? ' &middot; <i class="hot">' + rd + ' to claim</i>' : ""), " gold") +
      btn("rlChal", "", "target", "Challenges", qd + " of " + qs.length + " daily done" + (qr ? ' &middot; <i class="hot">' + qr + ' to claim</i>' : "")) +
      btn("go", "campaign", "trophy", "Campaign", MG.campStars() + " of 108 stars") +
      btn("go", "ranks", "chart", "Ranks", "Leaderboards") +
      btn("go", "profile", "user", "Profile", "Stats and banner") +
      btn("go", "settings", "gear", "Settings", "Keys, sound, graphics") +
      btn("go", "help", "book", "How to play", "Moves and rules") + '</nav>';
    // the spots beside you hold your party; net.js fills them in
    var slot = function(i){ return '<div class="rlSlot" data-i="' + i + '"><button class="rlS" data-a="rlInvite">' + ic("users") + '<b>Invite a friend</b><small>Pick from your friends</small></button></div>'; };
    var mid = '<div class="rlC"><div class="rlLine">' + slot(0) + '<div class="rlMe"><canvas id="hero" width="420" height="560"></canvas><div class="rlPl"><b>' + esc(s.name || "You") + '</b>' + MG.rankHTML(s.elo) +
      '<small>' + esc(s.title) + ' &middot; Level ' + s.lvl + '</small></div><button class="btn sm ghost rlEd" data-a="go" data-v="locker">' + ic("shirt") + 'Edit look</button></div>' + slot(1) + '</div><p class="rlMore"></p></div>';
    var right = '<div class="rlR"><div class="rlBox"><span class="kick">Season ' + MG.SEASON.n + ': ' + esc(MG.SEASON.name) + '</span><span class="bar"><i style="width:' + Math.round((MG.pass().xp % MG.PASS_XP) / MG.PASS_XP * 100) + '%"></i></span><small class="mute">Tier ' + pt + ' &middot; ' + (MG.pass().xp % MG.PASS_XP) + ' / ' + MG.PASS_XP + ' XP</small></div>' +
      '<button class="rlPlay" data-a="rlPlay">' + ic("play") + '<b>Play</b></button></div>';
    return '<div class="lob">' + left + mid + right + '</div>';
  };
  AFTER.home = function(){};
  // every way to play, in three plain groups: play a match now, take on a challenge, or just mess about.
  // Each card says what it is, how long it takes and what you get. Online modes sit at the bottom until they open.
  // [action, view, icon, name, what it is, colours, solo/party/both, tag]
  var NOW = [
    ["go", "quick", "ball", "Quick Match", "You against one computer player. First to 5 goals.", "#2c8fa3,#15475a", "solo", "Start here"],
    ["go", "team", "users", "5v5", "Your team of five against theirs, on a full pitch.", "#15803d,#0b3d24", "", "About 5 min"],
    ["field", "", "pitch", "1v1 Full Pitch", "One against one, a goal at each end.", "#0e7490,#0b3b52", "solo", "About 3 min"]];
  var CHAL = [
    ["go", "campaign", "trophy", "Campaign", "Beat each club to reach the Galaxy Cup.", "#b9791a,#6b3d0c", "solo", "Story"],
    ["go", "ladder", "ladder", "The Ladder", "20 rivals in a row. Lose and you drop down.", "#1f8a5b,#0f4f3a", "solo", "Climb"],
    ["go", "cups", "trophy", "Cups", "A knockout cup: 8 players, 3 rounds.", "#a16207,#5a3a06", "solo", "Prizes"],
    ["go", "gauntlet", "shield", "The Gauntlet", "Endless rivals, each one harder. How far can you go?", "#b91c1c,#4a0d0d", "solo", "High score"]];
  var FUN = [
    ["practice", "", "ball", "Kickabout", "Practise moves. No clock, no score.", "#3d4370,#22264a", "solo", "Learn"],
    ["go", "party", "users", "Co-op", "Two players on one keyboard.", "#a23bb5,#4f1f6b", "", "Same device"]];
  var ONLINE = [
    ["soonOn", "ranked", "bolt", "Ranked 1v1", "Real players, real ranks.", "#2b62d9,#1a2f7a", "solo", "Next update"],
    ["soonOn", "custom", "gear", "Custom Game", "Your party, your rules.", "#7c3aed,#3b1d7a", "party", "Next update"]];
  function tile(x){ return '<button class="plT' + (x[0] === "soonOn" ? " soon" : "") + (x[7] === "Start here" ? " best" : "") + '" style="--g:linear-gradient(135deg,' + x[5] + ')" data-a="' + x[0] + '"' + (x[1] ? ' data-v="' + x[1] + '"' : "") + '>' + ic(x[2]) + '<span><b>' + x[3] + '</b><small>' + x[4] + '</small></span><i>' + x[7] + '</i></button>'; }
  function group(name, sub, list, fit, cls){ list = list.filter(fit); return list.length ? '<section class="plG ' + (cls || "") + '"><h3>' + name + '<small>' + sub + '</small></h3><div class="plR">' + list.map(tile).join("") + '</div></section>' : ""; }
  VIEW.play = function(){
    var party = MG.net && MG.net.inParty(), fit = function(x){ return party ? x[6] !== "solo" : x[6] !== "party"; };
    return '<div class="plv"><div class="plh"><button class="btn ghost" data-a="go" data-v="home">' + ic("back") + 'Back</button><h1>Play</h1><p class="mute">Every mode earns XP; wins earn coins.</p></div>' +
      (party ? '<p class="mute">You are in a party, so modes for one player are hidden. Playing together online comes in the next update; for now these play on this device.</p>' : "") +
      group("Play a match", "against the computer", NOW, fit) + group("Challenges", "longer runs with rewards", CHAL, fit) + group("Just for fun", "practise or play with a friend next to you", FUN, fit) +
      group("Online", "against real players, coming in the next update", ONLINE, fit, "dim") + '</div>';
  };
  ACT.rlPlay = function(){ U.go("play"); };

  // ---- credits, from Settings ----
  var set0 = VIEW.settings;
  VIEW.settings = function(){ return set0.apply(this, arguments) + '<section class="panel"><h3>Credits</h3><p class="mute">The people who made Megs.</p><button class="btn" data-a="go" data-v="credits">' + ic("star") + 'Credits</button></section>'; };
  VIEW.credits = function(){
    return '<div class="crv"><button class="btn ghost" data-a="go" data-v="settings">' + ic("back") + 'Back</button><div class="crc"><span class="kick">Credits</span><h1>MEGS</h1><p class="mute">Made by</p>' +
      '<div class="crn"><b>Hudson Boyd</b><b>Auden Sattler</b></div><p class="mute">Thanks for playing.</p></div></div>';
  };

  // ---- rank up: the bar fills, the badge turns into the next rank ----
  function within(elo, k){ var T = MG.TIERS, a = T[k].min, b = T[k + 1] ? T[k + 1].min : a; return b > a ? Math.max(0, Math.min(1, (elo - a) / (b - a))) : 1; }
  MG.rankUp = function(from, to){
    var k0 = MG.tier(from), k1 = MG.tier(to), T = MG.TIERS, k = k0, t0 = performance.now(), raf, cv, bar, nm;
    if (k1 <= k0) return;
    modal('<div class="rku"><span class="kick">Rank up</span><canvas id="rkc" width="220" height="220"></canvas><h2 id="rkn" style="color:' + T[k0].c + '">' + T[k0].n + '</h2><span class="rkb"><i id="rkf" style="width:' + Math.round(within(from, k0) * 100) + '%;background:' + T[k0].c + '"></i></span><p class="mute" id="rke">' + from + ' rating</p><div class="row center"><button class="btn gold" data-a="close" id="rkok" disabled>Nice</button></div></div>');
    cv = document.getElementById("rkc"); bar = document.getElementById("rkf"); nm = document.getElementById("rkn");
    setTimeout(function(){ if (bar) { bar.style.transition = "width 1.3s cubic-bezier(.3,.8,.3,1)"; bar.style.width = "100%"; } }, 350);
    setTimeout(function(){
      if (!bar) return; k = k1; MG.sfx("rare", 6);
      cv.classList.add("pop"); nm.textContent = T[k1].n; nm.style.color = T[k1].c; nm.classList.add("pop");
      bar.style.transition = "none"; bar.style.width = "0%"; bar.style.background = T[k1].c;
      document.getElementById("rke").textContent = to + " rating";
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ bar.style.transition = "width .9s ease-out"; bar.style.width = Math.round(within(to, k1) * 100) + "%"; }); });
      document.getElementById("rkok").disabled = false;
    }, 1750);
    function draw(now){
      if (!document.contains(cv)) return cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
      var g = cv.getContext("2d"), t = (now - t0) / 1000, f = Math.max(0, 1 - Math.abs(t - 1.75) / 0.35), i;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 220, 220);
      if (k === k1) { g.save(); g.translate(110, 110); g.rotate(t * 0.5); for (i = 0; i < 12; i++) { g.fillStyle = MG.hexA(T[k1].c, 0.16); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 110, i * Math.PI / 6, i * Math.PI / 6 + Math.PI / 12); g.closePath(); g.fill(); } g.restore(); }
      MG.rankBadge(g, 110, 112, 140 * (1 + 0.15 * f), k, t);
      if (f > 0) { g.fillStyle = "rgba(255,255,255," + f * 0.8 + ")"; g.beginPath(); g.arc(110, 110, 100, 0, Math.PI * 2); g.fill(); }
    }
    raf = requestAnimationFrame(draw);
  };
  var res0 = AFTER.result;
  AFTER.result = function(a){
    if (res0) res0.apply(this, arguments);
    var e = a && a.out && a.out.elo, now = S().elo;
    if (e > 0 && MG.tier(now - e) < MG.tier(now)) setTimeout(function(){ MG.rankUp(now - e, now); }, 900);
  };
  (function hookRated(){ if (!MG.net || !MG.net.hook) return setTimeout(hookRated, 200); MG.net.hook("rated", function(m){ if (m.delta > 0 && MG.tier(m.rating - m.delta) < MG.tier(m.rating)) MG.rankUp(m.rating - m.delta, m.rating); }); })();
  ACT.soonOn = function(d){ toast(d.v === "custom" ? "Custom games with your party arrive in the next update." : "Online ranked against real players arrives in the next update."); };
  ACT.rlChal = function(){
    var qs = MG.quests();
    modal('<h2>Challenges</h2><h3>Daily quests</h3>' + qs.map(function(x){
      return '<div class="quest' + (x.q.c ? " done" : "") + '"><div><b>' + x.text + '</b><span class="bar"><i style="width:' + Math.round(x.q.p / x.need * 100) + '%"></i></span></div>' +
        (x.q.c ? '<span class="mute">Claimed</span>' : x.done ? '<button class="btn gold sm" data-a="claim" data-id="' + x.q.id + '">Claim ' + x.coins * 5 + ' XP</button>' : '<span class="mute">' + x.q.p + ' / ' + x.need + '</span>') + '</div>';
    }).join("") + '<h3>Weekly challenges</h3>' + MG.weekly().map(function(x){
      return '<div class="quest' + (x.q.c ? " done" : "") + '"><div><b>' + x.text + '</b><span class="bar"><i style="width:' + Math.round(x.q.p / x.need * 100) + '%"></i></span></div>' +
        (x.q.c ? '<span class="mute">Claimed</span>' : x.done ? '<button class="btn gold sm" data-a="wclaim" data-id="' + x.q.id + '">Claim ' + x.xp + ' XP</button>' : '<span class="mute">' + x.q.p + ' / ' + x.need + '</span>') + '</div>';
    }).join("") + '<div class="row center"><button class="btn ghost" data-a="close">Close</button></div>', "wide");
  };
  // the old full menu still exists for anything that links to it
  if (!VIEW.help && VIEW.howto) VIEW.help = VIEW.howto;
  var st = document.createElement("style");
  st.textContent = [
    "body:has(#view .lob) #nav{display:none}body:has(#view .plv) #nav{display:none}",
    ".plv{min-height:calc(100vh - 175px);display:flex;flex-direction:column;gap:.5rem}.plh p{margin:0 0 0 auto}",
    ".plG h3{margin:.2rem 0 .4rem;font-size:.85rem;letter-spacing:.1em;text-transform:uppercase;color:#e6e8f5}.plG h3 small{margin-left:.6rem;letter-spacing:0;text-transform:none;color:#a9b0d6;font-weight:400}",
    ".plR{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:.6rem}",
    ".plT{position:relative;display:flex;align-items:center;gap:.8rem;text-align:left;min-height:84px;padding:.7rem .9rem;border:0;border-radius:16px;background:var(--g);color:#fff;cursor:pointer;font:inherit;box-shadow:0 8px 20px rgba(0,0,0,.35);transition:transform .12s}",
    ".plT:hover{transform:translateY(-3px)}.plT .ic{width:34px;height:34px;flex:none}.plT span{display:flex;flex-direction:column;gap:.15rem}.plT b{font-size:1.15rem}.plT small{opacity:.88;font-size:.8rem;line-height:1.25}",
    ".plT i{position:absolute;top:.45rem;right:.6rem;font-style:normal;font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;background:rgba(0,0,0,.3);border-radius:999px;padding:.12rem .45rem}",
    ".plT.best{outline:3px solid #ffd23b;outline-offset:2px}.plT.best i{background:#ffd23b;color:#1a1405}.plG.dim .plT{filter:saturate(.45) brightness(.75);min-height:64px}",
    ".kickp{position:sticky;bottom:10px;z-index:5;box-shadow:0 -8px 30px rgba(0,0,0,.45);display:flex;align-items:center;gap:1.2rem;padding:.6rem 1rem}.kickp>h3,.kickp>p{display:none}.kickp .set{flex:1;border:0;padding:0}.kickp .row{margin:0;order:-1}.kickbar{position:sticky;bottom:10px;z-index:5}",
    ".plh{display:flex;align-items:center;gap:1rem}.plh h1{margin:0;font-size:2.4rem;letter-spacing:.06em;text-transform:uppercase}",
    ".plv h3{margin:1rem 0 .4rem;font-size:.9rem;letter-spacing:.1em;text-transform:uppercase;color:#a9b0d6}.plv .rlGrid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.7rem}.plv .rlT{min-height:150px;padding:1rem;transform:skewX(-4deg)}.plv .rlT>*{transform:skewX(4deg)}.plv .rlT b{font-size:1.4rem}.plv .rlT .ic{width:36px;height:36px}",
    ".crv{min-height:calc(100vh - 175px)}.crc{display:flex;flex-direction:column;align-items:center;gap:.4rem;margin-top:8vh;text-align:center}.crc h1{font-size:4rem;letter-spacing:.2em;margin:.2rem 0 1rem}.crn{display:flex;flex-direction:column;gap:.6rem;font-size:1.8rem;margin:.4rem 0 1.4rem}",
    ".rku{display:flex;flex-direction:column;align-items:center;gap:.4rem;text-align:center}.rku h2{margin:0;font-size:2rem}.rkb{display:block;width:min(360px,80vw);height:14px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}.rkb i{display:block;height:100%;border-radius:999px}",
    "#rkc.pop,#rkn.pop{animation:rkp .5s ease-out}@keyframes rkp{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}",
    ".lob{display:grid;grid-template-columns:240px minmax(0,1fr) 220px;gap:.8rem;min-height:calc(100vh - 175px);align-items:stretch}",
    ".rlL{display:flex;flex-direction:column;gap:.35rem;justify-content:center}",
    ".rlb{display:flex;align-items:center;gap:.7rem;text-align:left;color:#f2f2f7;background:linear-gradient(90deg,rgba(20,24,58,.92),rgba(20,24,58,.55));border:0;border-left:4px solid #3b6ef5;padding:.45rem .9rem .45rem .8rem;transform:skewX(-8deg);cursor:pointer;transition:transform .12s,background .12s;font:inherit}",
    ".rlb>*{transform:skewX(8deg)}.rlb .ic{width:26px;height:26px;flex:none;color:#9ab6ff}.rlb b{display:block;font-size:1.05rem;letter-spacing:.02em;text-transform:uppercase}.rlb small{display:block;color:#a9b0d6;font-size:.72rem}",
    ".rlb:hover,.rlb:focus-visible{background:linear-gradient(90deg,#2b4fd6,rgba(43,79,214,.55));transform:skewX(-8deg) translateX(6px)}.rlb.gold{border-left-color:#ffd23b}.rlb.gold .ic{color:#ffd23b}",
    ".rlC{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:1rem}",
    ".rlLine{display:flex;align-items:flex-end;justify-content:center;gap:.9rem;width:100%}",
    ".rlMe{display:flex;flex-direction:column;align-items:center;position:relative}.rlMe canvas#hero{width:min(300px,38vh);height:min(400px,50vh);filter:drop-shadow(0 18px 24px rgba(0,0,0,.55))}",
    ".rlPl{display:flex;flex-direction:column;align-items:center;gap:.15rem;background:rgba(10,12,32,.82);border:1px solid #2f3466;border-radius:14px;padding:.45rem 1.1rem;margin-top:-.6rem;min-width:200px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.4)}.rlPl b{font-size:1.25rem}.rlPl small{color:#a9b0d6}",
    ".rlEd{margin-top:.5rem}",
    ".rlS{width:150px;height:150px;aspect-ratio:1;border:2px dashed rgba(170,180,240,.35);border-radius:18px;background:rgba(14,16,40,.45);color:#c9cde6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;cursor:pointer;font:inherit}.rlS .ic{width:34px;height:34px;opacity:.8}.rlS small{color:#8a8fb5}.rlS:hover{border-color:#9ab6ff;background:rgba(43,79,214,.18)}",
    ".rlT.soon{filter:saturate(.45) brightness(.8)}.rlM h3{margin:.8rem 0 .4rem;font-size:.85rem;letter-spacing:.08em;text-transform:uppercase;color:#a9b0d6}",
    ".rlSc{margin:.6rem 0 0;font-size:.8rem}.lnk{background:none;border:0;color:#9ab6ff;text-decoration:underline;cursor:pointer;font:inherit;padding:0}",
    ".rlR{display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;gap:1rem;padding-bottom:1rem}",
    ".rlBox{background:rgba(10,12,32,.82);border:1px solid #2f3466;border-radius:14px;padding:.7rem .9rem;display:flex;flex-direction:column;gap:.35rem}",
    ".rlPlay{align-self:flex-end;display:flex;align-items:center;justify-content:center;gap:.6rem;width:210px;height:84px;border:0;border-radius:14px;cursor:pointer;color:#14163a;font:inherit;background:linear-gradient(135deg,#ffe066,#ffb21e);box-shadow:0 10px 30px -6px rgba(255,190,40,.7),inset 0 -5px 0 rgba(0,0,0,.18);transform:skewX(-8deg);transition:transform .12s}",
    ".rlPlay>*{transform:skewX(8deg)}.rlPlay b{font-size:2rem;letter-spacing:.08em;text-transform:uppercase}.rlPlay .ic{width:38px;height:38px}.rlPlay:hover{transform:skewX(-8deg) scale(1.04)}",
    ".rlM h2{margin-top:0}.rlGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:.5rem}",
    ".rlT{display:flex;flex-direction:column;align-items:flex-start;gap:.2rem;min-height:92px;padding:.7rem;border:0;border-radius:14px;color:#fff;text-align:left;cursor:pointer;background:var(--g);font:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}.rlT .ic{width:28px;height:28px;opacity:.9}.rlT b{font-size:1.1rem}.rlT small{color:rgba(255,255,255,.8)}.rlT:hover{filter:brightness(1.15)}",
    "@media(max-width:900px){.lob{grid-template-columns:1fr;min-height:0}.rlL{order:2;display:grid;grid-template-columns:1fr 1fr}.rlC{order:1}.rlR{order:3}.rlS{display:none}.rlPlay{align-self:stretch;width:auto}}"
  ].join("\n");
  document.head.appendChild(st);
  if (U.cur && U.cur() === "home") U.go("home");
});
})();
