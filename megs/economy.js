// MEGS bank: when you are signed in, the server owns your coins and items. Packs are opened on the server, every
// purchase and reward goes through it, and whatever the server says you have is what you have. Changing the numbers
// in the browser does nothing: the server's copy comes straight back.
(function(){
"use strict";
var MG = window.MG, BY = MG.ITEM;
function waitUi(f){ if (MG.ui && MG.ui.ACT && MG.net && MG.packSpin && MG.adminSync) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, N = MG.net, esc = U.esc, coin = U.coin, toast = U.toast, rid = 0, wait = {};
  var LIVE = {shop: 1, locker: 1, pass: 1, home: 1};
  // what you wear falls back to the free version of that slot if the bank says you don't own it
  var DEF = {}; MG.ITEMS.forEach(function(it){ if (it.src === "free" && !DEF[it.t]) DEF[it.t] = it.id; });
  N.signed = function(){ return !!(N.me && N.on); };
  function apply(w, redraw){
    var S = MG.S; if (!S || !w) return;
    S.coins = w.coins; S.inv = w.inv; S.seen = w.seen; S.bp = w.bp; S.pity = w.pity; S.pass = w.pass; S.free = w.free; S.codes = w.codes;
    if (w.rp != null) { S.elo = w.rp; S.peak = Math.max(S.peak || 0, w.rp); S.rpd = w.rpd || S.rpd; }
    Object.keys(S.eq || {}).forEach(function(k){ var id = S.eq[k]; if (id && BY[id] && !w.inv[id] && id !== "custom" && DEF[BY[id].t]) S.eq[k] = DEF[BY[id].t]; });
    MG.adminSync(); MG.save(); if (U.top) U.top();
    if (redraw && LIVE[U.cur()] && document.getElementById("modal").hidden) U.go(U.cur(), U.arg && U.arg());
  }
  N.hook("wal", function(m){ apply(m.wal, true); });
  N.hook("tx", function(m){ if (m.wal) apply(m.wal, false); var f = wait[m.rid]; if (f) { delete wait[m.rid]; f(m); } });
  // ask the bank; answers come back with your real wallet
  function call(op, args){
    return new Promise(function(res){
      var id = ++rid, o = args || {}; o.t = "tx"; o.op = op; o.rid = id;
      if (!N.signed() || !N.send(o)) return res({ok: false, msg: N.me ? "Reconnecting to the Megs server. Try again in a moment." : "Log in first."});
      wait[id] = res; setTimeout(function(){ if (wait[id]) { delete wait[id]; res({ok: false, msg: "The Megs server didn't answer. Try again."}); } }, 9000);
    });
  }
  MG.bank = call;
  function needAccount(){
    if (N.signed()) return false;
    if (N.me || (localStorage.getItem("megs.online"))) { toast("Reconnecting to the Megs server. Try again in a moment."); return true; }
    U.modal('<h2>Sign up to use the shop</h2><p class="mute">Coins and items are kept safe on your account, so packs, the shop and the pass need one. It takes a few seconds.</p><div class="row center"><button class="btn gold" data-a="acc" data-v="signup">Sign up</button><button class="btn" data-a="acc" data-v="login">Log in</button><button class="btn ghost" data-a="close">Later</button></div>');
    return true;
  }
  function pull(g){
    var o = {it: BY[g.id], cel: g.cel, first: g.first, bp: g.bp, dupe: g.dupe, n: g.n};
    if (g.extra) o.extra = g.extra.map(function(x){ return x.replace(/^Blueprint: (\S+)/, function(a, id){ return "Blueprint: " + ((BY[id] || {}).n || id); }); });
    return o;
  }
  function busy(b, on){ if (b && b.tagName === "BUTTON") { b.disabled = on; } }

  // ---- spending ----
  ACT.packN = function(d, b){
    if (needAccount()) return;
    busy(b, true);
    call("pack", {id: d.id, kind: U.shopKind ? U.shopKind() : "", n: +d.n || 1}).then(function(r){
      busy(b, false);
      if (!r.ok) return toast(esc(r.msg));
      MG.packSpin(r.res.got.filter(function(g){ return BY[g.id]; }).map(pull));
    });
  };
  ACT.free = function(){
    if (needAccount()) return;
    call("free", {day: MG.day()}).then(function(r){ if (!r.ok) return toast(esc(r.msg)); MG.packSpin(r.res.got.map(pull), "Daily crate"); });
  };
  function buyer(op){ return function(d){
    if (needAccount()) return;
    call(op, {id: d.id}).then(function(r){ if (!r.ok) return toast(esc(r.msg)); MG.sfx("coin"); toast("Bought " + esc(BY[d.id].n) + ". It is in your locker."); U.close(); U.go("shop"); });
  }; }
  ACT.buy = buyer("buy"); ACT.wbuy = buyer("wbuy");
  ACT.bpBuild = function(d){
    if (needAccount()) return;
    call("bp", {id: d.id}).then(function(r){ if (!r.ok) return toast(esc(r.msg)); MG.sfx("rare", 6); U.close(); toast("Built " + esc(BY[d.id].n) + ". It is in your locker."); U.go(U.cur(), U.arg && U.arg()); });
  };
  // ---- the pass ----
  function claim(ks, title){
    if (needAccount()) return;
    call("pass", {ks: ks}).then(function(r){
      if (!r.ok) return toast(esc(r.msg));
      var items = [], c = 0, pulls = [];
      var bps = [];
      r.res.got.forEach(function(g){ items = items.concat(g.items.map(function(id){ return BY[id]; }).filter(Boolean)); c += g.coins; pulls = pulls.concat(g.pulls.map(pull)); (g.bps || []).forEach(function(x){ bps.push(x.replace(/^Blueprint: (\S+)/, function(a, id){ return "Blueprint: " + ((BY[id] || {}).n || id); })); }); });
      MG.sfx("coin");
      if (items.length || c) toast((items.length ? items.map(function(it){ return esc(it.n); }).join(", ") : "") + (items.length && c ? " and " : "") + (c ? coin(c) : ""));
      if (bps.length) setTimeout(function(){ toast(bps.map(esc).join(", ")); }, 400);
      if (pulls.length) MG.packSpin(pulls, title); else U.go("pass");
    });
  }
  ACT.pclaim = function(d){ claim([+d.k], "Tier " + (+d.k + 1) + " pack"); };
  ACT.pclaimall = function(){ var t = MG.passTier(), ks = [], k; for (k = 0; k < t; k++) if (!MG.pass().got[k]) ks.push(k); claim(ks, "Pass packs"); };
  ACT.pbonus = function(){ if (needAccount()) return; call("bonus").then(function(r){ if (r.ok && r.res.coins) { MG.sfx("coin"); toast("Bonus tiers: " + coin("+" + r.res.coins)); } U.go("pass"); }); };
  // ---- promo codes are checked by the server (the admin code still goes through Friends) ----
  var pc0 = ACT.pcRedeem;
  ACT.pcRedeem = function(){
    var i = document.getElementById("pcode"), v = i ? i.value.trim().toUpperCase() : "";
    if (/^MEGS-/.test(v)) return pc0.apply(this, arguments);
    if (!v) return toast("That code did not work.");
    if (needAccount()) return;
    call("code", {code: v}).then(function(r){
      if (!r.ok) return toast(esc(r.msg));
      MG.sfx("rare", 7); U.close(); toast(r.res.k === "all" ? "Code redeemed: every item is now in your locker." : "Code redeemed: " + coin("+50000")); U.go(U.cur(), U.arg && U.arg());
    });
  };

  // ---- earning: the server pays out, and only what a real game can earn ----
  MG.BP_CHANCE = 0;   // blueprints from wins are rolled by the server now
  // pass XP that isn't from a match goes up with what it was for (quests, weekly challenges, the campaign)
  var xpq = {}, xpt = 0, inMatch = 0;
  MG.xpWhy = "";
  var add0 = MG.passAdd;
  MG.passAdd = function(x){
    var r = add0.apply(this, arguments);
    if (N.signed() && x > 0 && !inMatch) { var k = MG.xpWhy || "other"; xpq[k] = (xpq[k] || 0) + x; clearTimeout(xpt); xpt = setTimeout(function(){ var q = xpq; xpq = {}; Object.keys(q).forEach(function(why){ call("xp", {n: q[why], why: why}); }); }, 800); }
    return r;
  };
  function why(fn, k){ var f0 = MG[fn]; if (!f0) return; MG[fn] = function(){ var w0 = MG.xpWhy; MG.xpWhy = k; try { return f0.apply(this, arguments); } finally { MG.xpWhy = w0; } }; }
  why("claim", "quest"); why("weekClaim", "week"); why("campDone", "camp");
  // every match gets a ticket when it kicks off; the rewards at the end are worked out by the server
  var tk = null, play0 = MG.play;
  MG.play = function(o){
    tk = null;
    if (N.signed() && o) call("start", {ranked: o.ranked ? 1 : 0, team: o.team ? 1 : 0, size: o.size || (o.team ? 5 : 1), mode: o.mode || ""}).then(function(r){ if (r.ok) tk = r.res.tk; });
    return play0.apply(this, arguments);
  };
  var fin0 = MG.finish;
  MG.finish = function(res){
    var S = MG.S, c0 = S.coins, out;
    inMatch = 1; try { out = fin0.apply(this, arguments); } finally { inMatch = 0; }
    if (!N.signed() || res.party || res.practice) return out;
    S.coins = c0;   // what a match pays comes from the server
    var me = res.me || {}, keep = {};
    ["goals", "megs", "ankles", "perfect", "tackles", "blocks", "pok", "twos", "corner", "mgoal", "vgoal", "post", "pgoal"].forEach(function(k){ keep[k] = me[k] || 0; });
    call("end", {tk: tk, res: {win: !!res.win, draw: !!res.draw, sc: res.sc, me: keep}}).then(function(r){
      tk = null;
      if (!r.ok) { toast(esc(r.msg)); return; }
      var x = r.res;
      if (x.bp) { var it = BY[x.bp.id]; if (it) toast("Blueprint found: <b>" + esc(it.n) + "</b> (" + x.bp.n + " of " + MG.BP_N + ")" + (x.bp.seen ? "" : ". Find it in a pack to be able to build it.")); }
      // the results screen shows what the server actually paid
      var rw = document.querySelector(".res .rw");
      if (rw) [].forEach.call(rw.querySelectorAll(".pill"), function(p){ var t = p.textContent;
        if (/pass XP$/.test(t)) p.textContent = "+" + x.xp + " pass XP";
        else if (/rank points$/.test(t)) { p.textContent = (x.rp > 0 ? "+" : "") + x.rp + " rank points"; p.className = "pill " + (x.rp > 0 ? "up" : x.rp < 0 ? "dn" : ""); }
      });
      if (x.capped && x.capped.length) toast("Daily limit reached for " + x.capped.map(function(c){ return {coins: "coins", xp: "pass XP", rp: "rank points"}[c]; }).join(" and ") + ". It resets tomorrow.");
    });
    return out;
  };
  var unl0 = MG.unlocks;
  MG.unlocks = function(){ var got = unl0.apply(this, arguments); if (N.signed() && got && got.length) call("unlock", {ids: got.map(function(it){ return it.id; })}); return got; };
  // when you come online, the wallet arrives on its own; this asks again after a reconnect
  N.hook("me", function(){ setTimeout(function(){ if (N.signed()) call("sync"); }, 1500); });
});
})();
