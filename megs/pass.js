// MEGS season pass, rebuilt: 50 tiers, every reward box the same size.
// Free track: an item every fifth tier, a free pack every fifth tier, coins every fifth tier, the rest empty.
// Premium track: exactly one item per tier. Pass items that do not fit this season are kept back for later seasons.
(function(){
"use strict";
var MG = window.MG, I = MG.ITEMS, S = function(){ return MG.S; };
function bySrc(src){ return I.filter(function(it){ return it.src === src; }).sort(function(a, b){ return a.r - b.r || (a.id < b.id ? -1 : 1); }); }
// spread n picks evenly over a list sorted by rarity, always keeping the rarest one at the end
function spread(list, n){ var out = [], i; if (list.length <= n) return list.slice(); for (i = 0; i < n; i++) out.push(list[Math.round(i * (list.length - 1) / (n - 1))]); return out; }
// which free pack each fifth tier gives: mostly Street, a few Pro, one Elite at the end
var FPK = [["street", 1], ["street", 1], ["street", 3], ["pro", 1], ["street", 3], ["pro", 1], ["street", 3], ["pro", 2], ["street", 5], ["elite", 1]];
MG.passTiers = function(){
  if (MG._pt) return MG._pt;
  var fr = bySrc("pass"), pr = bySrc("season"), n = MG.PASS_N, free = spread(fr, 10), prem, out = [], k, f, slot;
  // what is left of the free track moves to the premium pool; the premium track then takes one item per tier
  fr.forEach(function(it){ if (free.indexOf(it) < 0) pr.push(it); });
  pr.sort(function(a, b){ return a.r - b.r || (a.id < b.id ? -1 : 1); });
  prem = spread(pr, n);
  pr.forEach(function(it){ if (prem.indexOf(it) < 0 && free.indexOf(it) < 0) it.later = 1; });   // kept for a later season
  for (k = 0; k < n; k++) {
    slot = Math.floor(k / 5); f = {k: k, free: [], coins: 0, pack: null, prem: prem[k] ? [prem[k]] : [], pcoins: 0};
    if (k % 5 === 4 && free[slot]) f.free = [free[slot]];
    else if (k % 5 === 1) f.pack = {id: FPK[slot][0], n: FPK[slot][1]};
    else if (k % 5 === 2) f.coins = 150 + k * 10;
    out.push(f);
  }
  return MG._pt = out;
};
MG._pt = null;
// claiming a tier: its item, coins, or free pack pulls (no coins spent)
MG.passClaim = function(k){
  var p = MG.pass(), t = MG.passTiers()[k], s = S(), got = [], back = 0, pulls = [], pk, i;
  if (!t || p.got[k] || MG.passTier() <= k) return null;
  p.got[k] = 1;
  t.free.forEach(function(it){ s.inv[it.id] = s.inv[it.id] ? (+s.inv[it.id] || 1) + 1 : 1; got.push(it); });   // duplicates stack for trading
  if (t.pack) { pk = MG.PACKS.filter(function(x){ return x.id === t.pack.id; })[0]; for (i = 0; i < t.pack.n; i++) pulls.push(MG.grant(MG.roll(pk))); }
  s.coins += t.coins + back; MG.save();
  return {items: got, coins: t.coins + back, pulls: pulls};
};

// tiers waiting to be claimed: only the ones with something on them count
MG.passReady = function(){ var p = MG.pass(), t = MG.passTier(), tiers = MG.passTiers(), n = 0, k, x; for (k = 0; k < t; k++) { x = tiers[k]; if (!p.got[k] && (x.free.length || x.coins || x.pack)) n++; } return n; };
function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.packSpin) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, ACT = U.ACT, AFTER = U.AFTER, go = U.go, toast = U.toast, coin = U.coin, esc = U.esc, ic = U.ic;
  function rar(it){ return MG.RAR[it.r] || MG.RAR[0]; }
  function pkName(id){ var p = MG.PACKS.filter(function(x){ return x.id === id; })[0]; return p ? p.n : "Pack"; }
  var pass0 = VIEW.pass;
  // one reward box: always the same size, whatever is in it
  function cell(kind, x, st, pm){
    var it, h;
    if (kind === "item") {
      it = x; h = '<button class="pc it' + (it.r >= 5 ? " rare" : "") + (pm ? " pm" : "") + '" style="--r:' + rar(it).c + '" data-a="pitem" data-id="' + it.id + '"><span class="pv">' + U.vis(it, "") + '</span><span class="pn">' + esc(it.n) + '</span><span class="pr">' + rar(it).n + '</span>';
    } else if (kind === "pack") {
      h = '<div class="pc pk pk-' + x.id + '"><span class="pv"><span class="pki">' + ic("gift") + '</span>' + (x.n > 1 ? '<b class="pkn">x' + x.n + '</b>' : "") + '</span><span class="pn">' + pkName(x.id) + '</span><span class="pr">Free ' + (x.n > 1 ? x.n + " pulls" : "pull") + '</span>';
    } else if (kind === "coin") {
      h = '<div class="pc cn"><span class="pv"><span class="cni">' + ic("coin") + '</span></span><span class="pn">' + x + ' coins</span><span class="pr">Coins</span>';
    } else h = '<div class="pc em"><span class="pv"></span><span class="pn"></span><span class="pr"></span>';
    if (st === "lock") h += '<span class="plk">' + ic("lock") + '</span>';
    if (pm) h += '<span class="pmr">' + ic("star") + '</span>';
    if (st === "got") h += '<span class="pgot">Claimed</span>';
    return h + (kind === "item" ? '</button>' : '</div>');
  }
  // the premium card: the tier 50 reward on show, and what the track holds
  function prem(){
    var tiers = MG.passTiers(), last = tiers[MG.PASS_N - 1].prem[0], cnt = {}, k;
    tiers.forEach(function(x){ if (x.prem[0]) cnt[x.prem[0].r] = (cnt[x.prem[0].r] || 0) + 1; });
    return '<div class="phr"><div class="phrt"><span class="pmb">' + ic("star") + 'Premium</span><b>' + MG.PASS_N + ' rewards, one on every tier</b></div><div class="phrb">' +
      (last ? '<button class="phx" data-a="pitem" data-id="' + last.id + '" style="--r:' + rar(last).c + '"><span class="pv">' + U.vis(last, "big") + '</span><small>Tier ' + MG.PASS_N + '</small><b>' + esc(last.n) + '</b></button>' : "") +
      '<ul class="phl2">' + [7, 6, 5, 4, 3].filter(function(r){ return cnt[r]; }).map(function(r){ return '<li style="--r:' + MG.RAR[r].c + '"><b>' + cnt[r] + '</b> ' + MG.RAR[r].n + '</li>'; }).join("") + '</ul></div>' +
      '<button class="btn gold big pmbuy" disabled>' + ic("star") + 'Premium is buyable soon</button></div>';
  }
  VIEW.pass = function(){
    var p = MG.pass(), t = MG.passTier(), tiers = MG.passTiers(), into = p.xp % MG.PASS_XP, ready = MG.passReady(), old = pass0(), wk = old.lastIndexOf('<div class="cols">'), items = 0, packs = 0;
    tiers.forEach(function(x){ items += x.free.length; if (x.pack) packs++; });
    var head = '<section class="ph"><div class="phl"><span class="kick">Season ' + MG.SEASON.n + ' &middot; runs until Season ' + (MG.SEASON.n + 1) + ' is released</span><h2>' + esc(MG.SEASON.name) + ' Pass</h2>' +
      '<div class="pst"><div class="ptier"><small>Tier</small><b>' + t + '</b><small>of ' + MG.PASS_N + '</small></div><div class="pxp"><div class="pbar"><i style="width:' + (t >= MG.PASS_N ? 100 : Math.round(into / MG.PASS_XP * 100)) + '%"></i><span>' + (t >= MG.PASS_N ? "Pass complete" : into + " / " + MG.PASS_XP + " XP to tier " + (t + 1)) + '</span></div>' +
      '<p class="mute">Pass XP comes from every match, quests and weekly challenges. Free track: ' + items + ' items, ' + packs + ' free packs and coins. Premium: one item on every tier.</p></div></div></div>' +
      prem() + '</section>';
    var bar = '<div class="pnav"><button class="btn ghost sm" data-a="pscroll" data-d="-1">' + ic("back") + '</button><button class="btn ghost sm" data-a="pjump">My tier</button><button class="btn ghost sm pfw" data-a="pscroll" data-d="1">' + ic("back") + '</button>' +
      (ready ? '<button class="btn gold" data-a="pclaimall">Claim all (' + ready + ')</button>' : "") + '</div>';
    var track = '<div class="ptrack" id="ptrack"><div class="prow lbl"><span class="plab prem">Premium</span><span class="plab mid"></span><span class="plab">Free</span></div>' + tiers.map(function(x){
      var open = t > x.k, got = p.got[x.k], cur = x.k === t, fk = x.free.length ? "item" : x.pack ? "pack" : x.coins ? "coin" : "", fv = x.free[0] || x.pack || x.coins;
      return '<div class="pcol' + (open ? " open" : "") + (got ? " got" : "") + (cur ? " cur" : "") + '">' +
        cell(x.prem.length ? "item" : "", x.prem[0], "lock", 1) +
        '<div class="pnode"><i class="pl"></i><b>' + (x.k + 1) + '</b></div>' +
        cell(fk, fv, got ? "got" : open ? "" : "") +
        '<div class="pcl">' + (open && !got && fk ? '<button class="btn gold sm" data-a="pclaim" data-k="' + x.k + '">Claim</button>' : "") + '</div></div>';
    }).join("") + '</div>';
    var bonus = t >= MG.PASS_N ? '<section class="panel"><h3>Bonus tiers</h3><p class="mute">Every 1000 pass XP after tier 50 is a bonus tier worth ' + coin(MG.BONUS) + '.</p>' + (MG.passBonus() ? '<button class="btn gold" data-a="pbonus">Claim ' + MG.passBonus() + ' bonus ' + (MG.passBonus() === 1 ? "tier" : "tiers") + '</button>' : '<span class="mute">Next bonus tier in ' + (MG.PASS_XP - into) + ' XP</span>') + '</section>' : "";
    return head + bar + track + bonus + (wk >= 0 ? old.slice(wk) : "");
  };
  function scrollTo(k){ var tr = document.getElementById("ptrack"), c = tr && tr.querySelectorAll(".pcol")[Math.max(0, k)]; if (c) tr.scrollLeft = c.offsetLeft - tr.offsetLeft - 90; }
  AFTER.pass = function(){ scrollTo(MG.passTier() - 1); };
  ACT.pjump = function(){ scrollTo(MG.passTier() - 1); };
  ACT.pscroll = function(d){ var tr = document.getElementById("ptrack"); if (tr) tr.scrollBy({left: +d.d * tr.clientWidth * 0.8, behavior: "smooth"}); };
  function report(gs, title){
    var items = [], c = 0, pulls = [];
    gs.forEach(function(g){ if (!g) return; items = items.concat(g.items); c += g.coins; pulls = pulls.concat(g.pulls || []); });
    MG.sfx("coin");
    if (items.length || c) toast((items.length ? items.map(function(it){ return esc(it.n); }).join(", ") : "") + (items.length && c ? " and " : "") + (c ? coin(c) : ""));
    if (pulls.length) MG.packSpin(pulls, title); else go("pass");
  }
  ACT.pclaim = function(d){ report([MG.passClaim(+d.k)], "Tier " + (+d.k + 1) + " pack"); };
  ACT.pclaimall = function(){ var t = MG.passTier(), k, gs = []; for (k = 0; k < t; k++) gs.push(MG.passClaim(k)); report(gs, "Pass packs"); };
  var done0 = ACT.packDone;
  ACT.packDone = function(){ var v = U.cur(); U.close(); go(v === "pass" ? "pass" : "shop"); };
  // the look
  var st = document.createElement("style");
  st.textContent = [
    ".ph{display:flex;gap:1rem;flex-wrap:wrap;justify-content:space-between;align-items:stretch;padding:1.1rem 1.25rem;border-radius:20px;margin-bottom:.7rem;background:radial-gradient(120% 140% at 0% 0%,#5a2bd6 0%,#2a1466 38%,#10132b 80%);border:1px solid #4a36a0;box-shadow:0 12px 40px -18px #6b3dff}",
    ".phl{flex:1;min-width:280px}.ph h2{margin:.15rem 0 .6rem;font-size:1.7rem;letter-spacing:.01em}",
    ".pst{display:flex;gap:1rem;align-items:center}.ptier{flex:none;width:86px;height:86px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle,#14163a 0 62%,transparent 63%),conic-gradient(#ffd23b var(--p,0%),#2a2d55 0);line-height:1}.ptier b{font-size:1.9rem;margin:.1rem 0}.ptier small{font-size:.62rem;color:#c9cde6;text-transform:uppercase;letter-spacing:.08em}",
    ".pxp{flex:1}.pxp .pbar{height:24px}.pxp p{margin:.45rem 0 0;font-size:.8rem}",
    ".phr{flex:none;width:330px;position:relative;overflow:hidden;border-radius:18px;padding:.85rem 1rem 1rem;background:linear-gradient(150deg,#4a3410 0%,#2a1d08 45%,#170f04 100%);border:2px solid #d9a93a;box-shadow:0 0 0 1px #5a4310 inset,0 10px 40px -12px rgba(255,190,50,.55)}",
    ".phr:before{content:'';position:absolute;inset:-40% -60%;background:linear-gradient(115deg,transparent 42%,rgba(255,236,170,.18) 50%,transparent 58%);animation:pmshine 5s ease-in-out infinite;pointer-events:none}@keyframes pmshine{0%,60%{transform:translateX(-40%)}100%{transform:translateX(40%)}}",
    ".phrt{display:flex;flex-direction:column;gap:.25rem;margin-bottom:.55rem}.phrt b{color:#ffe7a3;font-size:1rem}.pmb{align-self:flex-start;display:inline-flex;align-items:center;gap:.3rem;background:linear-gradient(90deg,#ffd23b,#ff9d2e);color:#2a1a04;border-radius:999px;padding:.12rem .6rem;font-size:.7rem;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.pmb .ic{width:13px;height:13px}",
    ".phrb{display:flex;gap:.7rem;align-items:center}.phx{flex:none;width:118px;border-radius:14px;border:2px solid var(--r);background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--r) 35%,#1b1408),#120c03);padding:.35rem;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:.1rem;box-shadow:0 0 22px -6px var(--r)}.phx .pv canvas{height:96px!important;width:auto!important;max-width:100%}.phx small{font-size:.6rem;color:#e6c48a;letter-spacing:.1em;text-transform:uppercase}.phx b{font-size:.75rem}",
    ".phl2{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.25rem;font-size:.8rem;color:#f3e2b8}.phl2 b{color:var(--r);font-size:1rem}",
    ".pmbuy{width:100%;margin-top:.7rem;opacity:1!important;background:linear-gradient(90deg,#ffd23b,#ff9d2e)!important;color:#2a1a04!important;filter:grayscale(.15)}",
    ".pnav{display:flex;gap:.4rem;align-items:center;margin:.2rem 0 .5rem}.pnav .pfw .ic{transform:scaleX(-1)}.pnav .btn.gold{margin-left:auto}",
    ".ptrack{display:flex;gap:.45rem;overflow-x:auto;padding:.5rem .3rem .9rem;scroll-snap-type:x proximity;scrollbar-width:thin;border-radius:18px;background:linear-gradient(180deg,rgba(255,196,60,.16) 0,rgba(255,170,40,.06) 186px,transparent 187px)}",
    ".prow.lbl{flex:none;width:64px;display:grid;grid-template-rows:170px 40px 170px 36px;align-items:center}.plab{writing-mode:vertical-rl;transform:rotate(180deg);font-size:.7rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8a8ca8;justify-self:center}.plab.prem{color:#ffd23b;text-shadow:0 0 10px rgba(255,200,60,.6)}",
    ".pcol{flex:none;width:124px;display:grid;grid-template-rows:170px 40px 170px 36px;scroll-snap-align:start}",
    ".pc{position:relative;width:100%;height:170px;border-radius:14px;border:2px solid #2a2d55;background:#16182e;color:#f2f2f7;padding:.4rem .4rem .45rem;display:grid;grid-template-rows:1fr auto auto;gap:.15rem;text-align:center;overflow:hidden;font:inherit}",
    ".pc.it{border-color:var(--r);cursor:pointer;background:linear-gradient(180deg,#1b1e3a 55%,color-mix(in srgb,var(--r) 22%,#1b1e3a))}.pc.it.rare{box-shadow:0 0 18px -6px var(--r)}",
    ".pc .pv{display:flex;align-items:center;justify-content:center;min-height:0;position:relative}.pc .pv canvas,.pc .pv .sw{max-width:100%;max-height:100px;width:auto!important;height:100px!important;aspect-ratio:auto!important;object-fit:contain;display:block}",
    ".pc .pn{font-size:.72rem;font-weight:800;line-height:1.15;height:2.3em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.pc .pr{font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--r,#8a8ca8);height:1.1em}",
    ".pc.em{border-style:dashed;border-color:#34385f;background:rgba(22,24,46,.55)}",
    ".pc.pm{border:2px solid #d9a93a;background:linear-gradient(180deg,color-mix(in srgb,var(--r) 30%,#2a1d08) 0%,#1d1406 60%,#140d03 100%);box-shadow:inset 0 0 0 1px rgba(255,220,130,.25),inset 0 3px 0 var(--r)}.pc.pm.rare{box-shadow:inset 0 0 0 1px rgba(255,220,130,.25),inset 0 3px 0 var(--r),0 0 20px -6px #ffc23b}.pc.pm .pn{color:#ffeec4}",
    ".pmr{position:absolute;top:6px;left:6px;width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#ffd23b,#ff9d2e);display:grid;place-items:center;box-shadow:0 0 8px rgba(255,200,60,.6)}.pmr .ic{width:13px;height:13px;color:#2a1a04}",
    ".pc.cn{border-color:#5a4a1a;background:linear-gradient(180deg,#1b1e3a,#2a2410)}.cni .ic{width:54px;height:54px;color:#ffd23b;stroke-width:2.2}.pc.cn .pr{color:#ffd23b}",
    ".pc.pk{border-color:#3b6ef5;background:linear-gradient(180deg,#1b2350,#16182e)}.pc.pk-pro{border-color:#ff8a3d;background:linear-gradient(180deg,#3a2414,#16182e)}.pc.pk-elite{border-color:#c88aff;background:linear-gradient(180deg,#2e1a52,#16182e)}",
    ".pki{display:grid;place-items:center;width:70px;height:70px;border-radius:18px;background:linear-gradient(135deg,#5b7cff,#3b2ab5)}.pk-pro .pki{background:linear-gradient(135deg,#ffb04a,#e8542a)}.pk-elite .pki{background:linear-gradient(135deg,#e2a8ff,#7a3dff)}.pki .ic{width:40px;height:40px;color:#fff}.pkn{position:absolute;right:10px;bottom:4px;background:#ffd23b;color:#14163a;border-radius:8px;padding:0 .35rem;font-size:.8rem}.pc.pk .pr{color:#9ab6ff}",
    ".plk{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;background:rgba(10,11,26,.8);display:grid;place-items:center}.plk .ic{width:13px;height:13px;color:#e6c48a}",
    ".pgot{position:absolute;inset:auto 0 0 0;background:#1f8a5b;color:#fff;font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:.15rem 0}",
    ".pnode{position:relative;display:grid;place-items:center}.pnode .pl{position:absolute;left:-.3rem;right:-.3rem;top:50%;height:4px;margin-top:-2px;background:#2a2d55}.pcol.open .pnode .pl{background:linear-gradient(90deg,#b266ff,#ffd23b)}",
    ".pnode b{position:relative;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:.78rem;background:#14163a;border:2px solid #2a2d55;color:#8a8ca8}.pcol.open .pnode b{border-color:#ffd23b;color:#ffd23b}.pcol.cur .pnode b{background:#ffd23b;color:#14163a;box-shadow:0 0 14px #ffd23b}",
    ".pcol:not(.open) .pc{filter:saturate(.75) brightness(.85)}.pcol.cur .pc{outline:2px solid rgba(255,210,59,.5);outline-offset:2px}",
    ".pcl{display:flex;align-items:center;justify-content:center}"
  ].join("\n");
  document.head.appendChild(st);
  // the tier ring fills with progress
  var after0 = AFTER.pass;
  AFTER.pass = function(){ after0(); var r = document.querySelector(".ptier"), p = MG.pass(); if (r) r.style.setProperty("--p", (MG.passTier() >= MG.PASS_N ? 100 : (p.xp % MG.PASS_XP) / MG.PASS_XP * 100) + "%"); };
  if (U.cur && U.cur() === "pass") go("pass");
});
})();
