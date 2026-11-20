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
      '<small>' + esc(s.title) + ' &middot; Level ' + s.lvl + '</small></div><button class="btn sm ghost rlEd" data-a="go" data-v="locker">' + ic("shirt") + 'Edit look</button></div>' + slot(1) + '</div><p class="rlMore"></p>' +
      '<p class="rlSc mute">' + esc(sc.n) + ' &middot; <button class="lnk" data-a="go" data-v="locker" data-arg="scene">change backdrop</button></p></div>';
    var right = '<div class="rlR"><div class="rlBox"><span class="kick">Season ' + MG.SEASON.n + ': ' + esc(MG.SEASON.name) + '</span><span class="bar"><i style="width:' + Math.round((MG.pass().xp % MG.PASS_XP) / MG.PASS_XP * 100) + '%"></i></span><small class="mute">Tier ' + pt + ' &middot; ' + (MG.pass().xp % MG.PASS_XP) + ' / ' + MG.PASS_XP + ' XP</small></div>' +
      '<button class="rlPlay" data-a="rlPlay">' + ic("play") + '<b>Play</b></button></div>';
    return '<div class="lob">' + left + mid + right + '</div>';
  };
  AFTER.home = function(){};
  // every way to play, opened from the Play button. Online modes are against real people; everything under
  // "Vs computer" is against computer players. In a party, modes that only make sense alone are hidden.
  var ONLINE = [
    ["soonOn", "ranked", "bolt", "Ranked 1v1", "Real players, real ranks", "#2b62d9,#1a2f7a", "solo"],
    ["soonOn", "custom", "gear", "Custom Game", "Your party, your rules", "#7c3aed,#3b1d7a", "party"]];
  var VSAI = [
    ["go", "quick", "ball", "Quick Match", "Quick games and arcade modes", "#2c8fa3,#15475a", "solo"],
    ["go", "team", "users", "5v5", "Full pitch, four team-mates", "#15803d,#0b3d24", ""],
    ["field", "", "pitch", "1v1", "A whole pitch, a goal at each end", "#0e7490,#0b3b52", "solo"],
    ["go", "campaign", "trophy", "Campaign", "Road to the Galaxy Cup", "#b9791a,#6b3d0c", "solo"],
    ["go", "ladder", "ladder", "The Ladder", "Beat 20 rivals in a row", "#1f8a5b,#0f4f3a", "solo"],
    ["go", "cups", "trophy", "Cups", "Eight players, three rounds", "#a16207,#5a3a06", "solo"],
    ["go", "gauntlet", "shield", "The Gauntlet", "How long can you last?", "#b91c1c,#4a0d0d", "solo"],
    ["go", "party", "users", "Co-op", "Friends on one keyboard", "#a23bb5,#4f1f6b", ""],
    ["practice", "", "ball", "Kickabout", "No clock, no score", "#3d4370,#22264a", "solo"]];
  function tile(x){ return '<button class="rlT' + (x[0] === "soonOn" ? " soon" : "") + '" style="--g:linear-gradient(135deg,' + x[5] + ')" data-a="' + x[0] + '"' + (x[1] ? ' data-v="' + x[1] + '"' : "") + '>' + ic(x[2]) + '<b>' + x[3] + '</b><small>' + (x[0] === "soonOn" ? "Next update" : x[4]) + '</small></button>'; }
  ACT.rlPlay = function(){
    var party = MG.net && MG.net.inParty(), fit = function(x){ return party ? x[6] !== "solo" : x[6] !== "party"; };
    modal('<div class="rlM"><h2>Play</h2>' + (party ? '<p class="mute">You are in a party, so solo modes are hidden. Playing together online is the next update; until then these play on this device.</p>' : "") +
      '<h3>Online</h3><div class="rlGrid">' + ONLINE.filter(fit).map(tile).join("") + '</div>' +
      '<h3>Vs computer</h3><div class="rlGrid">' + VSAI.filter(fit).map(tile).join("") + '</div></div>', "wide");
  };
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
    "body:has(#view .lob) #nav{display:none}",
    ".lob{display:grid;grid-template-columns:240px minmax(0,1fr) 220px;gap:.8rem;min-height:calc(100vh - 175px);align-items:stretch}",
    ".rlL{display:flex;flex-direction:column;gap:.35rem;justify-content:center}",
    ".rlb{display:flex;align-items:center;gap:.7rem;text-align:left;color:#f2f2f7;background:linear-gradient(90deg,rgba(20,24,58,.92),rgba(20,24,58,.55));border:0;border-left:4px solid #3b6ef5;padding:.45rem .9rem .45rem .8rem;transform:skewX(-8deg);cursor:pointer;transition:transform .12s,background .12s;font:inherit}",
    ".rlb>*{transform:skewX(8deg)}.rlb .ic{width:26px;height:26px;flex:none;color:#9ab6ff}.rlb b{display:block;font-size:1.05rem;letter-spacing:.02em;text-transform:uppercase}.rlb small{display:block;color:#a9b0d6;font-size:.72rem}",
    ".rlb:hover,.rlb:focus-visible{background:linear-gradient(90deg,#2b4fd6,rgba(43,79,214,.55));transform:skewX(-8deg) translateX(6px)}.rlb.gold{border-left-color:#ffd23b}.rlb.gold .ic{color:#ffd23b}",
    ".rlC{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:1rem}",
    ".rlLine{display:flex;align-items:flex-end;justify-content:center;gap:.9rem;width:100%}",
    ".rlMe{display:flex;flex-direction:column;align-items:center;position:relative}.rlMe canvas#hero{width:min(270px,34vh);height:min(360px,45vh);filter:drop-shadow(0 18px 24px rgba(0,0,0,.55))}",
    ".rlPl{display:flex;flex-direction:column;align-items:center;gap:.15rem;background:rgba(10,12,32,.82);border:1px solid #2f3466;border-radius:14px;padding:.45rem 1.1rem;margin-top:-.6rem;min-width:200px;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.4)}.rlPl b{font-size:1.25rem}.rlPl small{color:#a9b0d6}",
    ".rlEd{margin-top:.5rem}",
    ".rlS{width:120px;height:min(240px,34vh);border:2px dashed rgba(170,180,240,.35);border-radius:18px;background:rgba(14,16,40,.45);color:#c9cde6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;cursor:pointer;font:inherit}.rlS .ic{width:34px;height:34px;opacity:.8}.rlS small{color:#8a8fb5}.rlS:hover{border-color:#9ab6ff;background:rgba(43,79,214,.18)}",
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
