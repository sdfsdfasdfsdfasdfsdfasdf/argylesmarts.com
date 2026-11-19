// MEGS rules for where items come from, and the pack, blueprint and pass systems built on them.
// - Banners and scenes only come from the season pass.
// - Mythic and Exotic items only come from the season pass.
// - Celestial items are found in packs, then built: find it once, collect 5 of its blueprints (won at random from wins), pay 1000 coins.
// - The free pass track holds only ten items; everything else on the pass is on the premium track.
// - Packs are single pulls: buy 1, 3 or 10, and they open one after another.
(function(){
"use strict";
var MG = window.MG, I = MG.ITEMS, S = function(){ return MG.S; };
function hash(s){ var h = 7, i; for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
MG.CEL = 7; MG.BP_N = 5; MG.BP_COST = 1000; MG.BP_CHANCE = 0.18;

// ---- where everything comes from ----
I.forEach(function(it){
  if (it.src === "free" || it.src === "earn" || it.need || it.t === "stadium" && it.r <= MG.LEG) return;
  if (it.t === "banner" || it.t === "scene") { if (it.src !== "pass" && it.src !== "season") it.src = hash(it.id) % 3 ? "season" : "pass"; return; }
  if (it.r === 5 || it.r === 6) { if (it.src === "pack" || it.src === "shop") it.src = hash(it.id) % 4 ? "season" : "pass"; return; }
  if (it.r === MG.CEL && (it.src === "pack" || it.src === "shop")) { it.src = "pack"; it.cel = 1; }
});
MG.DUPE[MG.CEL] = 400;

// ---- packs: one item a pull ----
var PK = {street: [100, [50, 28, 14, 6, 1.9, 0, 0, 0.1], 60], pro: [500, [0, 30, 38, 22, 9.5, 0, 0, 0.5], 20], elite: [1000, [0, 0, 28, 46, 24, 0, 0, 2], 6]};
MG.PACKS.forEach(function(p){ var o = PK[p.id]; if (o) { p.cost = o[0]; p.odds = o[1]; p.pity = o[2]; } });
// a pack of one kind: small things are much cheaper, kits and stadiums cost a quarter more
MG.KIND_X = {boot: 0.3, sticker: 0.25, trail: 0.35, emote: 0.4, ball: 0.45, wrap: 0.5, hair: 0.5, fx: 0.8, court: 1, kit: 1.25, stadium: 1.25};
MG.packCost = function(pk, kind){ return Math.max(10, Math.round(pk.cost * (kind ? MG.KIND_X[kind] || 1 : 1) / 10) * 10); };
// the two big packs pay out more than an item: Celestial blueprints and season pass XP on every pull
MG.PACKS.push({id: "champ", n: "Champion Pack", cost: 2000, odds: [0, 0, 0, 52, 44, 0, 0, 4], pity: 3, bonus: {bp: 1, xp: 250}},
  {id: "galaxy", n: "Galaxy Pack", cost: 5000, odds: [0, 0, 0, 0, 88, 0, 0, 12], pity: 1, bonus: {bp: 2, xp: 1000}});
MG.packBonus = function(pk){ var b = pk.bonus; return b ? "Every pull also gives " + b.bp + (b.bp > 1 ? " Celestial blueprints" : " Celestial blueprint") + " and " + b.xp + " season pass XP" + (b.xp >= MG.PASS_XP ? " (a whole tier)" : "") + "." : ""; };
// a bonus blueprint goes to a random Celestial you have not built; with none left it pays 300 coins instead
function bonusBp(s){
  var pool = MG.celList().filter(function(x){ return !s.inv[x.id] && (s.bp[x.id] || 0) < MG.BP_N; }), it;
  if (!pool.length) { s.coins += 300; return "+300 coins"; }
  it = pool[Math.floor(Math.random() * pool.length)]; s.bp[it.id] = (s.bp[it.id] || 0) + 1; return "Blueprint: " + it.n + " (" + s.bp[it.id] + "/" + MG.BP_N + ")";
}
function store(){ var s = S(); if (!s.seen) s.seen = {}; if (!s.bp) s.bp = {}; return s; }
// what a pull gives you: a normal item goes in your locker (a duplicate pays coins back); a Celestial is only discovered
function grant(it){
  var s = store(), d, first;
  if (it.cel && !s.inv[it.id]) {
    first = !s.seen[it.id]; s.seen[it.id] = 1;
    if (!first) s.bp[it.id] = Math.min(MG.BP_N, (s.bp[it.id] || 0) + 1);   // found again: that counts as a blueprint
    return {it: it, cel: 1, first: first, bp: s.bp[it.id] || 0};
  }
  d = !!s.inv[it.id]; if (d) s.coins += MG.DUPE[it.r]; else s.inv[it.id] = 1;
  return {it: it, dupe: d, back: d ? MG.DUPE[it.r] : 0};
}
MG.openPack = function(id, kind, n){
  var s = store(), pk = MG.PACKS.filter(function(p){ return p.id === id; })[0], out = [], i, it, c;
  n = n || 1; if (!pk) return null; c = MG.packCost(pk, kind) * n;
  if (s.coins < c) return null;
  s.coins -= c; s.n.packs = (s.n.packs || 0) + n;
  for (i = 0; i < n; i++) {
    s.pity[id] = (s.pity[id] || 0) + 1;
    it = MG.roll(pk, s.pity[id] >= pk.pity, kind); if (it.r >= MG.LEG) s.pity[id] = 0;
    var g = grant(it);
    if (pk.bonus) { g.extra = []; for (var j = 0; j < pk.bonus.bp; j++) g.extra.push(bonusBp(s)); MG.passAdd(pk.bonus.xp); g.extra.push("+" + pk.bonus.xp + " pass XP"); }
    out.push(g);
  }
  MG.save(); return out;
};
MG.freePack = function(){ var s = store(); if (!MG.freeReady()) return null; s.free = MG.day(); var g = grant(MG.roll(MG.PACKS[0])); MG.save(); return [g]; };
// the featured four and buying outright: Legendary at most, never pass items
MG.featured = function(){
  var r = MG.rng(MG.day() * 7919 + 13), pool = I.filter(function(it){ return !it.need && it.r <= MG.LEG && (it.src === "pack" || it.src === "shop") && it.t !== "banner" && it.t !== "scene" && it.t !== "stadium"; }), out = [], i;
  for (i = 0; i < 4 && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
};
var buy0 = MG.buy;
MG.buy = function(id){ var it = MG.ITEM[id]; if (!it || MG.featured().indexOf(it) < 0) return false; return buy0(id); };

// ---- Celestial blueprints ----
MG.celList = function(){ return I.filter(function(it){ return it.cel; }).sort(function(a, b){ return a.n < b.n ? -1 : 1; }); };
MG.bpState = function(id){ var s = store(); return {seen: !!s.seen[id], bp: s.bp[id] || 0, own: !!s.inv[id]}; };
MG.bpReady = function(id){ var b = MG.bpState(id); return !b.own && b.seen && b.bp >= MG.BP_N && S().coins >= MG.BP_COST; };
MG.bpBuild = function(id){ var s = store(); if (!MG.bpReady(id)) return false; s.coins -= MG.BP_COST; s.inv[id] = 1; MG.save(); return true; };
// a win sometimes drops a blueprint for a random Celestial you have not built yet
var fin0 = MG.finish;
MG.finish = function(res){
  var out = fin0(res), s = store(), pool, it;
  if (!res.win || res.party || res.practice) return out;
  if (Math.random() < MG.BP_CHANCE) {
    pool = MG.celList().filter(function(x){ return !s.inv[x.id] && (s.bp[x.id] || 0) < MG.BP_N; });
    if (pool.length) {
      it = pool[Math.floor(Math.random() * pool.length)]; s.bp[it.id] = (s.bp[it.id] || 0) + 1;
      (out.notes = out.notes || []).push('Blueprint found: <b>' + it.n + '</b> (' + s.bp[it.id] + ' of ' + MG.BP_N + ')' + (s.seen[it.id] ? "" : '. Find it in a pack to be able to build it.'));
      MG.save();
    }
  }
  return out;
};

// ---- the season pass: ten items on the free track, the rest on premium ----
function bySrc(src){ return I.filter(function(it){ return it.src === src; }).sort(function(a, b){ return a.r - b.r || (a.id < b.id ? -1 : 1); }); }
MG.PASS_FREE = 10;
MG.passTiers = function(){
  if (MG._pt) return MG._pt;
  var fr = bySrc("pass"), pr = bySrc("season"), n = MG.PASS_N, F = MG.PASS_FREE, pick = [], out = [], i, k, a, b;
  for (i = 0; i < fr.length; i++) (Math.floor((i + 1) * F / fr.length) > Math.floor(i * F / fr.length) ? pick : pr).push(fr[i]);
  pr.sort(function(a, b){ return a.r - b.r || (a.id < b.id ? -1 : 1); });
  for (k = 0; k < n; k++) {
    a = k % 5 === 4 && pick[(k - 4) / 5] ? [pick[(k - 4) / 5]] : [];
    b = pr.slice(Math.floor(k * pr.length / n), Math.floor((k + 1) * pr.length / n));
    out.push({k: k, free: a, coins: !a.length && k % 2 === 1 ? 120 + k * 8 : 0, prem: b, pcoins: b.length ? 0 : 250 + k * 8});
  }
  return MG._pt = out;
};
MG._pt = null;

// ---- screens ----
function waitUi(f){ if (MG.ui && MG.ui.VIEW && MG.ui.ACT.item) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, ACT = U.ACT, modal = U.modal, close = U.close, go = U.go, toast = U.toast, coin = U.coin, esc = U.esc;
  store();
  for (var j = MG.KINDS.length - 1; j >= 0; j--) if (MG.KINDS[j][0] === "banner" || MG.KINDS[j][0] === "scene") MG.KINDS.splice(j, 1);   // pass only now
  function rar(it){ return MG.RAR[it.r] || MG.RAR[0]; }
  function bar(n){ var h = "", i; for (i = 0; i < MG.BP_N; i++) h += '<i class="' + (i < n ? "on" : "") + '"></i>'; return '<span class="bpb">' + h + '</span>'; }
  // the shop: packs are pulls now
  var shop0 = VIEW.shop;
  VIEW.shop = function(){
    return what(shop0()).replace(/A pack of one kind costs a quarter more\./, "Picking one kind changes the price: boots, stickers, trails, emotes, balls, wraps and hair are much cheaper; kits and stadiums cost a quarter more.").replace(/<section class="panel pack (\w+)">([\s\S]*?)Three items in every pack\./g, function(x, id, mid){ var pk = MG.PACKS.filter(function(p){ return p.id === id; })[0], b = pk && MG.packBonus(pk); return '<section class="panel pack ' + id + '">' + mid + 'One item a pull. Open 1, 3 or 10 at once.' + (b ? '</p><p class="pkb">' + b : ""); }).replace(/ packs \((\d+) opened since your last one\)/g, " pulls ($1 since your last one)").replace(/guaranteed at least every 1 pulls \(\d+ since your last one\)/g, "guaranteed on every pull").replace(/>Open for /g, ">Open ") +
      '<section class="panel"><h3>Celestial items</h3><p class="mute">A Celestial from a pack is only discovered. To build it you also need ' + MG.BP_N + ' of its blueprints (wins drop them at random) and ' + coin(MG.BP_COST) + '. Your progress is in the Locker under Blueprints.</p></section>';
  };
  // under every buy button: what you are getting
  var GET = {kit: "the full outfit: shirt, shorts and socks", wrap: "a pattern that goes over whatever kit you wear", boot: "a pair of boots", ball: "a match ball for your games", trail: "a trail behind the ball when you strike it",
    fx: "a goal celebration effect", emote: "an emote your player can do", sticker: "a sticker to send in matches with keys 1 to 4", banner: "a banner for your profile", hair: "a hairstyle", scene: "a backdrop for the menus", stadium: "a stadium for your 5-a-side games", court: "a cage for your 1v1 games"};
  function what(h){
    h = h.replace(/<div class="shopi">([\s\S]*?data-id="([^"]+)"[\s\S]*?)<\/div>/g, function(x, inner, id){ var it = MG.ITEM[id]; if (!it) return x; return '<div class="shopi">' + inner + '<small class="get">You get <b>' + esc(it.n) + '</b>: ' + (GET[it.t] || "this item") + '. Yours to keep.</small></div>'; });
    return h.replace(/(<section class="panel pack (\w+)">[\s\S]*?<\/button>)(<\/section>)/g, function(x, inner, id, end){
      var pk = MG.PACKS.filter(function(p){ return p.id === id; })[0], kd = U.shopKind ? U.shopKind() : "", kn = kd ? (MG.KINDS.filter(function(k){ return k[0] === kd; })[0] || ["", "item"])[1].toLowerCase() : "";
      return inner + '<small class="get">You get one random ' + (kn ? kn.replace(/s$/, "") : "item") + ' per pull, with the odds above' + (pk && pk.bonus ? ', plus ' + pk.bonus.bp + (pk.bonus.bp > 1 ? " blueprints" : " blueprint") + ' and ' + pk.bonus.xp + ' pass XP' : "") + '. Celestials count as discovered.</small>' + end;
    });
  }
  ACT.pack = function(d){
    var pk = MG.PACKS.filter(function(p){ return p.id === d.id; })[0], kind = U.shopKind ? U.shopKind() : "", c = MG.packCost(pk, kind), s = S();
    modal('<h2 class="center">' + esc(pk.n) + '</h2><p class="center mute">Each pull is one item, revealed one at a time.</p><div class="row center">' + [1, 3, 10].map(function(n){
      return '<button class="btn gold big" data-a="packN" data-id="' + pk.id + '" data-n="' + n + '"' + (s.coins < c * n ? " disabled" : "") + '>Open ' + n + ' &middot; ' + coin(c * n) + '</button>';
    }).join("") + '</div><div class="row center"><button class="btn ghost" data-a="close">Cancel</button></div>');
  };
  ACT.packN = function(d){ var got = MG.openPack(d.id, U.shopKind ? U.shopKind() : "", +d.n); if (!got) return toast("Not enough coins."); spin(got); };
  ACT.free = function(){ var got = MG.freePack(); if (got) spin(got, "Daily crate"); };
  // one reel; each item spins in after the one before, quickly
  function spin(got, title){
    var pool = I.filter(function(it){ return !it.need && it.src === "pack"; }), N = 26, WIN = 21, i = 0, dur = got.length >= 10 ? 0.85 : 1.25, timer = null, done = false;
    function card(it){ return '<div class="rl" style="--r:' + rar(it).c + '">' + (it.t === "emote" ? '<span class="sw" style="background:#22264a"></span>' : U.vis(it, "")) + '<b>' + esc(it.n) + '</b></div>'; }
    function line(g){ var r = rar(g.it); return '<p class="won show" style="--r:' + r.c + '"><b>' + r.n + ': ' + esc(g.it.n) + '</b> ' + (g.cel ? (g.first ? "Discovered! Build it with " + MG.BP_N + " blueprints" : "Found again: +1 blueprint (" + g.bp + " of " + MG.BP_N + ")") : g.dupe ? "Duplicate: " + coin("+" + g.back) : "New") + (g.extra ? '<small class="pkx">' + g.extra.map(esc).join(" &middot; ") + '</small>' : "") + '</p>'; }
    modal('<h2 class="center">' + (title || "Opening " + got.length) + ' <small class="mute" id="pkn"></small></h2><div class="reel"><div class="strip" id="pks"></div><i></i></div><div id="pkw" class="pkw"></div><div class="row center"><button class="btn ghost" data-a="pkSkip" id="pkskip">Skip</button><button class="btn big" data-a="packDone" id="rdone" disabled>Opening...</button></div>', "wide");
    function finish(){ done = true; clearTimeout(timer); var w = document.getElementById("pkw"); if (w) w.innerHTML = got.map(line).join(""); var b = document.getElementById("rdone"); if (b) { b.disabled = false; b.textContent = "Nice"; } var k = document.getElementById("pkskip"); if (k) k.remove(); U.paint && U.paint(); }
    ACT.pkSkip = finish;
    function next(){
      var st = document.getElementById("pks"), g, h = "", k, c;
      if (!st || done) return;
      if (i >= got.length) return finish();
      g = got[i]; document.getElementById("pkn").textContent = (i + 1) + " of " + got.length;
      for (k = 0; k < N; k++) h += card(k === WIN ? g.it : pool[Math.floor(Math.random() * pool.length)]);
      st.style.transition = "none"; st.style.transform = "translateX(0)"; st.innerHTML = h; if (U.paint) U.paint();
      c = st.children[WIN];
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        st.style.transition = "transform " + dur + "s cubic-bezier(.15,.75,.12,1)";
        st.style.transform = "translateX(" + -(c.offsetLeft + c.offsetWidth * (0.25 + Math.random() * 0.5) - st.parentNode.clientWidth / 2) + "px)";
      }); });
      timer = setTimeout(function(){
        if (done) return; c.classList.add("hit"); MG.sfx("rare", Math.min(g.it.r, 6));
        var w = document.getElementById("pkw"); if (w) w.insertAdjacentHTML("afterbegin", line(g));
        i++; timer = setTimeout(next, got.length >= 10 ? 220 : 380);
      }, dur * 1000 + 60);
    }
    U.top && U.top(); setTimeout(next, 60);
  }
  MG.packSpin = spin; MG.grant = grant;
  // ---- promo codes: type 1 2 3 4 5 6 7 8 9 on a menu screen. Only hashes of the codes are kept here ----
  var CODES = {"3b1fef17630831146ce458069b3a2c539f0c6fe21fe4ec05c4fe9249e3611962": "all", "97b9ebd519ecf14a27ab2e90924ef7f6f44c7325a172c6693807e14a0f04ec20": "coins"}, seq = 0;
  window.addEventListener("keydown", function(e){
    var c = e.code || "", m = /^(Digit|Numpad)([1-9])$/.exec(c), el = document.activeElement;
    if (document.body.classList.contains("playing") || (el && /INPUT|TEXTAREA|SELECT/.test(el.tagName))) return;
    if (!m) { seq = 0; return; }
    seq = +m[2] === seq + 1 ? seq + 1 : +m[2] === 1 ? 1 : 0;
    if (seq === 9) { seq = 0; modal('<h2>Promo code</h2><p class="mute">Got a code? Type it here.</p><input type="text" id="pcode" maxlength="24" autocomplete="off" aria-label="Promo code" placeholder="CODE"><div class="row center"><button class="btn gold" data-a="pcRedeem">Redeem</button><button class="btn ghost" data-a="close">Close</button></div>'); setTimeout(function(){ var i = document.getElementById("pcode"); if (i) i.focus(); }, 30); }
  });
  ACT.pcRedeem = function(){
    var i = document.getElementById("pcode"), raw = i ? i.value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
    if (!raw || !window.crypto || !crypto.subtle) return toast("That code did not work.");
    crypto.subtle.digest("SHA-256", new TextEncoder().encode("megs:" + raw)).then(function(b){
      var hx = Array.prototype.map.call(new Uint8Array(b), function(x){ return (x < 16 ? "0" : "") + x.toString(16); }).join(""), k = CODES[hx], s = store();
      if (!k) return toast("That code did not work.");
      s.codes = s.codes || {}; if (s.codes[hx]) return toast("You already used that code.");
      s.codes[hx] = 1;
      if (k === "all") { I.forEach(function(it){ s.inv[it.id] = 1; if (it.cel) { s.seen[it.id] = 1; s.bp[it.id] = MG.BP_N; } }); toast("Code redeemed: every item is now in your locker."); }
      else if (k === "coins") { s.coins += 50000; toast("Code redeemed: " + coin("+50000")); }
      MG.save(); MG.sfx("rare", 7); close(); if (U.top) U.top(); go(U.cur(), U.arg());
    });
  };
  // a Celestial you have not built: how close you are
  var item0 = ACT.item;
  ACT.item = function(d){
    var it = MG.ITEM[d.id], b, r;
    if (!it || !it.cel || S().inv[it.id]) return item0(d);
    b = MG.bpState(it.id); r = rar(it);
    modal('<div class="center"><span class="rr" style="color:' + r.c + '">' + r.n + '</span><h2>' + esc(it.n) + '</h2>' + U.vis(it, "big") +
      '<div class="bpst"><p>' + (b.seen ? "Discovered in a pack" : "Not discovered yet: find it in a pack") + '</p><p>Blueprints ' + bar(b.bp) + ' ' + b.bp + ' of ' + MG.BP_N + '</p><p class="mute">Wins drop blueprints at random.</p></div><div class="row center">' +
      '<button class="btn gold" data-a="bpBuild" data-id="' + it.id + '"' + (MG.bpReady(it.id) ? "" : " disabled") + '>Build for ' + coin(MG.BP_COST) + '</button><button class="btn ghost" data-a="close">Close</button></div></div>');
  };
  ACT.bpBuild = function(d){ if (MG.bpBuild(d.id)) { MG.sfx("rare", 6); close(); toast("Built " + esc(MG.ITEM[d.id].n) + ". It is in your locker."); go(U.cur(), U.arg()); } };
  // the Blueprints tab in the locker
  MG.bpView = function(){
    return '<p class="mute">Celestial items are built, not unlocked: discover one in a pack, collect ' + MG.BP_N + ' of its blueprints from wins, then pay ' + coin(MG.BP_COST) + '.</p><div class="bpl">' + MG.celList().map(function(it){
      var b = MG.bpState(it.id);
      return '<button class="bpi' + (b.own ? " own" : "") + '" data-a="item" data-id="' + it.id + '" style="--r:' + rar(it).c + '"><b>' + esc(it.n) + '</b><small>' + (b.own ? "Built" : (b.seen ? "Discovered" : "Not discovered") + " &middot; " + b.bp + "/" + MG.BP_N) + '</small>' + bar(b.own ? MG.BP_N : b.bp) + '</button>';
    }).join("") + '</div>';
  };
  if (U.cur && U.cur()) go(U.cur(), U.arg());
});
})();
