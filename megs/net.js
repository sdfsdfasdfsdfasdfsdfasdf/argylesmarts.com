// Megs online: the connection to the game server, your online account, friends, invites and your party.
// The server keeps accounts, friends and parties; your look is sent so friends see your player in their lobby.
(function(){
"use strict";
var MG = window.MG, R = MG.R;
var KEY = "megs.online", WS_URL = (function(){ try { return localStorage.getItem("megs.ws") || ""; } catch (e) { return ""; } })() || "wss://online.argylesmarts.com/ws";
MG.guestName = function(){ return "Guest" + (1000 + Math.floor(Math.random() * 9000)); };
var N = MG.net = {on: false, busy: false, me: null, friends: [], reqs: [], sent: [], party: {leader: null, members: []}, invites: [], found: null, tab: "friends", err: ""};
var ws = null, tries = 0, timer = 0, lastLook = "", pend = null, dirty = false, synced = false, SAVE_KEY = "megs.save.v1";
var LOOK_KEYS = ["kit", "cus", "look", "trail", "fx", "emote", "boot", "wrap", "hair", "banner"], ITEM_KEYS = ["kit", "trail", "fx", "emote", "boot", "wrap", "hair", "banner"];

// you stay logged in on this device with a session token (never your passcode). Old account codes no longer work.
function acct(){ var a = null; try { a = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {} if (a && !a.tok) { keep(null); N.oldOut = true; a = null; } return a; }
function keep(a){ try { if (a) localStorage.setItem(KEY, JSON.stringify(a)); else localStorage.removeItem(KEY); } catch (e) {} }
function send(o){ if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } return false; }
N.send = send;
N.inParty = function(){ return !!(N.me && N.party.leader && N.party.members.length > 1); };
N.leader = function(){ return !N.inParty() || N.party.leader === N.me.id; };
function myLook(){ var m = MG.me(), o = {}; LOOK_KEYS.forEach(function(k){ if (m[k] != null) o[k] = m[k]; }); return o; }
// a friend's look turned into something the renderer can draw; items this copy of the game does not know are dropped
N.side = function(p){
  var l = p.look || {}, s = {name: p.name, ring: "#ff5d7a"};
  LOOK_KEYS.forEach(function(k){ if (l[k] != null) s[k] = l[k]; });
  ITEM_KEYS.forEach(function(k){ if (s[k] && !MG.ITEM[s[k]] && s[k] !== "custom") delete s[k]; });
  if (s.kit === "custom" && !(s.cus && s.cus.c)) delete s.kit;
  if (!s.look || typeof s.look !== "object") delete s.look;
  return s;
};

// ---- connection: only opened once you have an account or open Friends, then kept alive and re-opened if it drops ----
function connect(){
  if (ws && ws.readyState <= 1) return;
  clearTimeout(timer); N.busy = true; changed();
  try { ws = new WebSocket(WS_URL); } catch (e) { ws = null; return retry(); }
  ws.onopen = function(){
    tries = 0; N.on = true; N.busy = false;
    var a = acct();
    if (a) send({t: "hello", id: a.id, tok: a.tok});
    else if (pend) { send(pend); pend = null; }
    changed();
  };
  ws.onmessage = function(e){ if (e.data === "pong") return; var m; try { m = JSON.parse(e.data); } catch (x) { return; } recv(m); };
  ws.onclose = function(){ ws = null; N.on = false; N.busy = false; N.me = null; synced = false; changed(); retry(); };
  ws.onerror = function(){};
}
function retry(){ if (N.banned || (!acct() && !document.getElementById("onl"))) return; tries++; clearTimeout(timer); timer = setTimeout(connect, Math.min(30000, 1500 * Math.pow(2, Math.min(tries, 5)))); }
// ---- your progress lives on your account: every change is sent up, and a new device picks it up when you sign in ----
var save0 = MG.save;
MG.save = function(){ if (N.adopting) return; if (MG.S) MG.S.at = Date.now(); dirty = true; return save0.apply(this, arguments); };
function flush(){ if (dirty && synced && N.me && ws && ws.readyState === 1) { dirty = false; send({t: "save", data: MG.S, at: MG.S.at || Date.now()}); } }
setInterval(flush, 15000);
document.addEventListener("visibilitychange", function(){ if (document.hidden) flush(); });
window.addEventListener("pagehide", flush);
function gotSave(m){
  var S = MG.S, mine = S.acct === N.me.id, lat = S.at || 0, d = m.data;
  if (d && (!mine || m.at > lat + 1000)) {
    // the account's progress wins: load it in place of what this device has
    try { if (sessionStorage.getItem("megs.adopt") === String(m.at)) throw 0; sessionStorage.setItem("megs.adopt", String(m.at)); } catch (e) { synced = true; return; }
    d.acct = N.me.id; d.at = m.at;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) { return; }
    N.adopting = true;
    location.reload(); return;
  }
  S.acct = N.me.id; synced = true; dirty = true; flush();
}
function gotGifts(m){
  var S = MG.S, U = MG.ui, got = [];
  // gifts now land straight in your wallet on the server; this only says what arrived
  if (m.applied) { m.list.forEach(function(g){ got.push(g.kind === "coins" ? g.val + " coins" : (MG.ITEM[g.val] || {}).n || g.val); }); if (U && got.length) { U.toast("A gift from the Megs team: " + U.esc(got.join(", ")) + "."); if (MG.sfx) MG.sfx("rare", 5); } return; }
  m.list.forEach(function(g){
    if (g.kind === "coins") { S.coins += +g.val || 0; got.push((+g.val) + " coins"); }
    else if (g.kind === "item" && MG.ITEM[g.val]) { S.inv[g.val] = S.inv[g.val] ? (+S.inv[g.val] || 1) + 1 : 1; got.push(MG.ITEM[g.val].n); }
  });
  MG.save(); if (MG.adminSync) MG.adminSync();
  send({t: "gack", ids: m.list.map(function(g){ return g.id; })});
  if (U && got.length) { U.toast("A gift from the Megs team: " + U.esc(got.join(", ")) + "."); if (U.top) U.top(); if (MG.sfx) MG.sfx("rare", 5); }
}
setInterval(function(){
  if (ws && ws.readyState === 1) ws.send("ping");
  // your look follows you: when you change kit or boots your friends see it
  if (N.me) { var l = JSON.stringify(myLook()); if (l !== lastLook) { lastLook = l; send({t: "look", look: myLook()}); } }
}, 25000);
N.pushLook = function(){ if (N.me) { lastLook = JSON.stringify(myLook()); send({t: "look", look: myLook()}); } };
document.addEventListener("visibilitychange", function(){ if (!document.hidden && acct() && !ws) { tries = 0; connect(); } });

function recv(m){
  var U = MG.ui;
  if (m.t === "me") {
    N.me = m; N.err = "";
    if (m.tok) keep({id: m.id, tok: m.tok});
    if (MG.S && MG.S.name !== m.name) { MG.S.name = m.name; MG.save(); if (U && U.top) U.top(); }
    if (U && document.getElementById("accm") && m.tok) { U.close(); U.toast("Welcome, " + U.esc(m.name) + "."); }
    if (U && U.cur() === "locker" && document.getElementById("modal").hidden) U.go("locker", U.arg && U.arg());
    if (MG.S && !!MG.S.admin !== !!m.admin) { MG.S.admin = !!m.admin; MG.save(); if (MG.adminSync) MG.adminSync(); }
    N.pushLook();
  } else if (m.t === "save") gotSave(m);
  else if (m.t === "gift") gotGifts(m);
  else if (m.t === "err") {
    if (m.c === "banned") { N.banned = true; N.err = m.msg; keep(null); if (U) U.toast(m.msg); }
    else if (m.c === "auth" && m.out) { keep(null); N.me = null; synced = false; if (U) U.toast(U.esc(m.msg)); }
    else if (document.getElementById("accMsg") && (m.c === "auth" || m.c === "name" || m.c === "pass")) document.getElementById("accMsg").textContent = m.msg;
    else if (m.c === "auth" || m.c === "name") N.err = m.msg; else if (U) U.toast(U.esc(m.msg));
  } else if (m.t === "friends") { N.friends = m.list; N.reqs = m.reqs; N.sent = m.sent; }
  else if (m.t === "party") {
    var was = N.inParty();
    N.party = m;
    if (U && was && !N.inParty()) U.toast("Your party has ended.");
  } else if (m.t === "invite") {
    N.invites = N.invites.filter(function(x){ return x.from.id !== m.from.id; });
    N.invites.push({from: m.from, at: Date.now()});
    if (MG.sfx) MG.sfx("ui");
  } else if (m.t === "ok") {
    if (!U) return;
    if (m.c === "invited") U.toast("Invite sent.");
    else if (m.c === "declined") U.toast(U.esc(m.name || "They") + " said not now.");
    else if (m.c === "kicked") U.toast("You were removed from the party.");
    else if (m.c === "admin") { U.toast("You are now an admin. Your admin skins are in your locker."); if (U.cur() === "home") U.go("home"); }
    else if (m.c === "reported") U.toast("Thanks. An admin will take a look.");
    else if (m.c === "pass") { U.close(); U.toast("Passcode changed."); }
    else if (m.c === "namereq") { U.close(); if (U.cur() === "locker") U.go("locker", U.arg && U.arg()); U.toast("Name change requested. An admin will look at it."); }
    else if (m.c === "nameok") U.toast("Your name is now " + U.esc(m.name) + ".");
    else if (m.c === "nameno") U.toast("Your name change to " + U.esc(m.name) + " was turned down.");
  } else if (m.t === "search") N.found = m;
  (N.hooks[m.t] || []).forEach(function(f){ f(m); });
  changed();
}
N.hooks = {};
N.hook = function(t, f){ (N.hooks[t] = N.hooks[t] || []).push(f); };

// ---- everything on screen that shows online state ----
function changed(){
  if (!MG.ui) return;
  if (N.me && N.me.admin && MG.ui.cur() === "home" && !document.querySelector('.rlL [data-v="admin"]') && MG.ui.AFTER.home) MG.ui.AFTER.home();
  if (document.getElementById("onl")) panel();
  slots(); badge(); invites();
}
function badge(){
  var b = document.querySelector('.rlb[data-a="friends"] small'), on, n;
  if (!b) return;
  on = N.friends.filter(function(f){ return f.on; }).length; n = N.reqs.length;
  b.innerHTML = !N.me ? (acct() ? "Connecting..." : "Log in or sign up to add friends") : on + " online" + (n ? ' &middot; <i class="hot">' + n + ' request' + (n > 1 ? "s" : "") + '</i>' : "");
}
function invites(){
  var box = document.getElementById("invc"), U = MG.ui, now = Date.now();
  N.invites = N.invites.filter(function(x){ return now - x.at < 115000; });
  if (!box) { box = document.createElement("div"); box.id = "invc"; document.body.appendChild(box); }
  box.innerHTML = N.invites.map(function(x){
    return '<div class="inv"><b>' + U.esc(x.from.name) + '</b> invited you to their party<div class="row"><button class="btn sm" data-a="onlJoin" data-id="' + x.from.id + '">Join</button><button class="btn sm ghost" data-a="onlNo" data-id="' + x.from.id + '">Not now</button></div></div>';
  }).join("");
}
setInterval(function(){ if (N.invites.length) invites(); }, 5000);

// the two spots beside you on the home screen: party members, or a button to invite someone
function others(){ return N.inParty() ? N.party.members.filter(function(p){ return p.id !== N.me.id; }) : []; }
function slots(){
  var U = MG.ui, els = document.querySelectorAll(".rlSlot"), o = others(), more = document.querySelector(".rlMore");
  [].forEach.call(els, function(el, i){
    var p = o[i], key = p ? p.id + JSON.stringify(p.look) + p.name + (p.id === N.party.leader) + p.on : "empty" + !!N.me;
    if (el.getAttribute("data-k") === key) return;
    el.setAttribute("data-k", key);
    el.innerHTML = p ? '<button class="rlF" data-a="onlMember" data-id="' + p.id + '"><canvas data-pid="' + p.id + '" width="240" height="320"></canvas><span class="rlFn' + (p.admin ? " adm" : "") + '"><b>' + U.esc(p.name) + '</b>' + (p.admin ? '<span class="admB">ADMIN</span>' : "") + '<small>' + (p.id === N.party.leader ? "Party leader" : p.on ? "In your party" : "Reconnecting...") + '</small></span></button>'
      : '<button class="rlS" data-a="rlInvite">' + U.ic("users") + '<b>Invite a friend</b><small>' + (N.me ? "Pick from your friends" : "Sign up first") + '</small></button>';
  });
  if (more) more.innerHTML = o.length > 2 ? "+" + (o.length - 2) + " more in your party: " + o.slice(2).map(function(p){ return U.esc(p.name); }).join(", ") : "";
}
function drawSlots(now){
  requestAnimationFrame(drawSlots);
  var cs = document.querySelectorAll("canvas[data-pid]"), t = now / 1000;
  if (!cs.length || document.body.classList.contains("playing")) return;
  [].forEach.call(cs, function(c, i){
    var p = N.party.members.filter(function(x){ return x.id === c.getAttribute("data-pid"); })[0];
    if (p) R.portrait(c, N.side(p), t + i * 3, {zoom: 2.65, turn: 0.45 * Math.sin(t * 0.35 + i * 2)});
  });
}
requestAnimationFrame(drawSlots);

// ---- the Friends panel ----
function panel(){
  var el = document.getElementById("onl"), U = MG.ui, esc = U.esc, h, a = acct();
  if (!el) return;
  if (!N.me) {
    if (a && (N.busy || N.on) && !N.err) { el.innerHTML = '<h2>Friends</h2><p class="mute">Connecting to the Megs server...</p>'; return; }
    h = '<h2>Friends</h2><p class="mute">Log in or sign up to add friends, party up and keep your coins and items safe on your account.</p>' +
      '<div class="row center"><button class="btn gold" data-a="acc" data-v="signup">Sign up</button><button class="btn" data-a="acc" data-v="login">Log in</button></div>' +
      (!N.on && !N.busy && a ? '<p class="mute">Can\'t reach the server right now. <button class="lnk" data-a="onlRetry">Try again</button></p>' : "");
    el.innerHTML = h;
    return;
  }
  var on = N.friends.filter(function(f){ return f.on; }), off = N.friends.filter(function(f){ return !f.on; });
  var inMine = function(id){ return N.party.members.some(function(p){ return p.id === id; }); };
  function row(f){
    var st = f.on ? (inMine(f.id) ? "In your party" : f.party ? "In a party" : "Online") : "Offline";
    return '<div class="frow"><i class="dot' + (f.on ? " on" : "") + '"></i><span class="fn"><b>' + esc(f.name) + (f.admin ? ' <span class="admB">ADMIN</span>' : "") + '</b><small>' + st + '</small></span>' +
      (f.on && !inMine(f.id) ? '<button class="btn sm" data-a="onlInv" data-id="' + f.id + '">Invite</button>' : "") +
      '<button class="btn sm ghost" data-a="onlDel" data-id="' + f.id + '" data-n="' + esc(f.name) + '">Remove</button></div>';
  }
  var tabs = [["friends", "Friends (" + on.length + " online)"], ["reqs", "Requests" + (N.reqs.length ? " (" + N.reqs.length + ")" : "")], ["add", "Add friend"]];
  h = '<h2>Friends</h2><p class="mute">Signed in as <b>' + esc(N.me.name) + '</b></p><div class="tabs">' + tabs.map(function(x){ return '<button class="tab' + (N.tab === x[0] ? " on" : "") + '" data-a="onlTab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join("") + '</div><div class="flist">';
  if (N.tab === "friends") h += N.friends.length ? on.concat(off).map(row).join("") : '<p class="mute">No friends yet. Use Add friend to find someone by their username.</p>';
  else if (N.tab === "reqs") {
    h += N.reqs.length ? N.reqs.map(function(f){ return '<div class="frow"><span class="fn"><b>' + esc(f.name) + '</b><small>Wants to be friends</small></span><button class="btn sm" data-a="onlAcc" data-id="' + f.id + '">Accept</button><button class="btn sm ghost" data-a="onlDec" data-id="' + f.id + '">Decline</button></div>'; }).join("") : '<p class="mute">No requests waiting.</p>';
    if (N.sent.length) h += '<h3>Sent</h3>' + N.sent.map(function(f){ return '<div class="frow"><span class="fn"><b>' + esc(f.name) + '</b><small>Waiting for them</small></span><button class="btn sm ghost" data-a="onlDel" data-id="' + f.id + '" data-n="' + esc(f.name) + '">Cancel</button></div>'; }).join("");
  } else {
    var sentTo = function(id){ return N.sent.some(function(f){ return f.id === id; }); };
    h += '<div class="row"><input id="onlQ" maxlength="16" autocomplete="off" placeholder="Search usernames" value="' + esc(N.q || "") + '"></div>';
    if (N.found && N.found.q && N.found.q === (N.q || "").toLowerCase().replace(/[^a-z0-9_]/g, "")) h += N.found.list.length ? N.found.list.map(function(f){
      return '<div class="frow"><i class="dot' + (f.on ? " on" : "") + '"></i><span class="fn"><b>' + esc(f.name) + '</b></span>' + (f.friend || N.friends.some(function(x){ return x.id === f.id; }) ? '<span class="mute">Friends</span>' : sentTo(f.id) ? '<span class="mute">Request sent</span>' : '<button class="btn sm" data-a="onlAdd" data-id="' + f.id + '">Add friend</button>') + '<button class="btn sm ghost" data-a="onlRep" data-id="' + f.id + '" data-n="' + esc(f.name) + '">Report</button></div>';
    }).join("") : '<p class="mute">Nobody with a name starting like that.</p>';
    else h += '<p class="mute">Type at least 2 letters of their username.</p>';
  }
  h += '</div>';
  if (N.inParty()) h += '<div class="row"><button class="btn ghost sm" data-a="onlLeave">Leave party</button></div>';
  h += '<div class="row"><button class="btn ghost sm" data-a="onlOut">Log out</button></div>';
  var keepQ = document.activeElement && document.activeElement.id === "onlQ", pos = keepQ ? document.activeElement.selectionStart : 0;
  el.innerHTML = h;
  var q = document.getElementById("onlQ");
  if (q) { q.oninput = function(){ N.q = q.value; clearTimeout(N.qt); N.qt = setTimeout(function(){ send({t: "search", q: q.value}); }, 250); }; if (keepQ) { q.focus(); q.setSelectionRange(pos, pos); } }
}

function waitUi(f){ if (MG.ui && MG.ui.ACT && MG.ui.VIEW) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, AFTER = U.AFTER;
  ACT.friends = function(){ U.modal('<div id="onl"></div><div class="row center"><button class="btn ghost" data-a="close">Close</button></div>', "wide onlc"); if (!ws) connect(); panel(); };
  ACT.rlInvite = function(){ N.tab = "friends"; ACT.friends(); };
  ACT.onlRetry = function(){ tries = 0; connect(); };
  // ---- log in and sign up: a username and a passcode ----
  ACT.acc = function(d){
    var up = d.v === "signup";
    U.modal('<div id="accm"><h2>' + (up ? "Sign up" : "Log in") + '</h2><p class="mute">' + (up ? "Pick a username (letters, numbers and _, 3 to 16 long; a made-up name, not your real one) and a passcode only you know. Your coins, items and pass are saved to it." : "Your username and passcode. What is saved on your account comes with you.") + '</p>' +
      '<div class="accf"><input id="accN" maxlength="16" autocomplete="username" placeholder="Username"><input id="accP" type="password" maxlength="64" autocomplete="' + (up ? "new-password" : "current-password") + '" placeholder="Passcode">' +
      (up ? '<input id="accP2" type="password" maxlength="64" autocomplete="new-password" placeholder="Passcode again">' : "") + '</div><p class="onlMsg" id="accMsg"></p>' +
      '<div class="row center"><button class="btn gold" data-a="accGo" data-v="' + d.v + '">' + (up ? "Sign up" : "Log in") + '</button><button class="btn ghost" data-a="acc" data-v="' + (up ? "login" : "signup") + '">' + (up ? "I have an account" : "Make an account") + '</button><button class="btn ghost" data-a="close">Cancel</button></div></div>', "onlc");
    setTimeout(function(){ var i = document.getElementById("accN"); if (i) i.focus(); }, 50);
  };
  ACT.accGo = function(d){
    var n = (document.getElementById("accN") || {}).value || "", p = (document.getElementById("accP") || {}).value || "", p2 = document.getElementById("accP2"), msg = document.getElementById("accMsg");
    n = n.trim();
    if (!n || !p) { msg.textContent = "Type your username and passcode."; return; }
    if (p2 && p2.value !== p) { msg.textContent = "The two passcodes don't match."; return; }
    msg.textContent = d.v === "signup" ? "Making your account..." : "Logging in...";
    N.err = ""; pend = d.v === "signup" ? {t: "signup", name: n, pass: p} : {t: "login", name: n, pass: p};
    if (ws && ws.readyState === 1 && !N.me) { send(pend); pend = null; } else connect();
  };
  document.addEventListener("keydown", function(e){ if (e.key === "Enter" && document.getElementById("accm") && /^acc/.test((document.activeElement || {}).id || "")) { var b = document.querySelector('#accm [data-a="accGo"]'); if (b) b.click(); } });
  ACT.onlTab = function(d){ N.tab = d.v; panel(); if (d.v === "add") { var q = document.getElementById("onlQ"); if (q) q.focus(); } };
  ACT.onlAdd = function(d){ send({t: "freq", id: d.id}); U.toast("Friend request sent."); };
  ACT.onlAcc = function(d){ send({t: "facc", id: d.id}); };
  ACT.onlDec = function(d){ send({t: "fdec", id: d.id}); };
  ACT.onlDel = function(d, b){
    if (b.getAttribute("data-sure")) { send({t: "fdel", id: d.id}); return; }
    b.setAttribute("data-sure", "1"); b.textContent = "Sure?"; setTimeout(function(){ if (document.contains(b)) { b.removeAttribute("data-sure"); b.textContent = "Remove"; } }, 3000);
  };
  ACT.onlInv = function(d){ send({t: "inv", id: d.id}); };
  ACT.onlJoin = function(d){ N.invites = N.invites.filter(function(x){ return x.from.id !== d.id; }); send({t: "join", id: d.id}); invites(); if (U.cur() !== "home") U.go("home"); };
  ACT.onlNo = function(d){ N.invites = N.invites.filter(function(x){ return x.from.id !== d.id; }); send({t: "decline", id: d.id}); invites(); };
  ACT.onlLeave = function(){ send({t: "leave"}); U.close(); };
  ACT.onlMember = function(d){
    var p = N.party.members.filter(function(x){ return x.id === d.id; })[0], lead = N.party.leader === N.me.id;
    if (!p) return;
    U.modal('<h2>' + U.esc(p.name) + '</h2><p class="mute">' + (p.id === N.party.leader ? "Party leader" : "In your party") + '</p><div class="row center">' +
      (lead ? '<button class="btn" data-a="onlPromote" data-id="' + p.id + '">Make leader</button><button class="btn ghost" data-a="onlKick" data-id="' + p.id + '">Remove from party</button>' : "") +
      '<button class="btn ghost" data-a="onlLeave">Leave party</button><button class="btn ghost" data-a="onlRep" data-id="' + p.id + '" data-n="' + U.esc(p.name) + '">Report</button><button class="btn ghost" data-a="close">Close</button></div>');
  };
  // signing out: copy your code first, it is the only way back in. This device keeps its progress as a guest save
  ACT.onlOut = function(d, b){
    if (!b.getAttribute("data-sure")) { b.setAttribute("data-sure", "1"); b.textContent = "Sure? Log out"; return; }
    if (synced && ws && ws.readyState === 1) send({t: "save", data: MG.S, at: MG.S.at || Date.now()});
    send({t: "logout"});
    keep(null); synced = false; dirty = false; N.me = null; N.friends = []; N.reqs = []; N.sent = []; N.invites = []; N.party = {leader: null, members: []};
    if (MG.S) { MG.S.admin = false; if (MG.adminSync) MG.adminSync(); MG.save(); }
    var w = ws; ws = null; if (w) { w.onclose = null; setTimeout(function(){ try { w.close(); } catch (e) {} }, 300); } N.on = false;
    if (MG.S) { MG.S.name = MG.guestName(); MG.save(); }
    U.close(); U.toast("Logged out. This device keeps its progress as a guest."); U.go("home");
  };
  ACT.onlRep = function(d){
    U.modal('<h2>Report ' + U.esc(d.n || "player") + '</h2><p class="mute">Tell the admins what happened, like a rude username.</p><div class="row"><input id="repWhy" maxlength="200" autocomplete="off" placeholder="What happened?" style="flex:1"></div><div class="row center"><button class="btn red" data-a="onlRepGo" data-id="' + d.id + '">Send report</button><button class="btn ghost" data-a="close">Cancel</button></div>', "onlc");
  };
  ACT.onlRepGo = function(d){ send({t: "report", id: d.id, why: ((document.getElementById("repWhy") || {}).value || "").trim()}); U.close(); };
  // the admin code goes in the promo code box
  var pc0 = ACT.pcRedeem;
  ACT.pcRedeem = function(){
    var i = document.getElementById("pcode"), v = i ? i.value.trim().toUpperCase() : "";
    if (/^MEGS-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(v)) { if (!N.me) return U.toast("Log in first."); send({t: "claim", code: v}); U.close(); return; }
    return pc0.apply(this, arguments);
  };
  // accounts used to sign in with a code; anyone still holding one is told once why they are logged out
  acct();
  if (N.oldOut) setTimeout(function(){ U.toast("Accounts now use a username and passcode. Log in again from the Locker."); }, 1500);
  ACT.onlPromote = function(d){ send({t: "promote", id: d.id}); U.close(); };
  ACT.onlKick = function(d){ send({t: "kick", id: d.id}); U.close(); };
  var ah = AFTER.home;
  AFTER.home = function(a){ if (ah) ah(a);
    if (N.me && N.me.admin) {
      var pl = document.querySelector(".rlMe .rlPl"), nav = document.querySelector(".rlL");
      if (pl && !pl.classList.contains("adm")) { pl.classList.add("adm"); pl.querySelector("b").insertAdjacentHTML("afterend", '<span class="admB">ADMIN</span>'); }
      if (nav && !nav.querySelector('[data-v="admin"]')) nav.insertAdjacentHTML("afterbegin", '<button class="rlb gold" data-a="go" data-v="admin">' + U.ic("shield") + '<span><b>Admin</b><small>Players, gifts and reports</small></span></button>');
    } [].forEach.call(document.querySelectorAll(".rlSlot"), function(e){ e.removeAttribute("data-k"); }); slots(); badge(); };
  // equipping something sends your new look straight away
  var eq = MG.equip;
  MG.equip = function(id){ var r = eq.apply(this, arguments); if (r) setTimeout(N.pushLook, 0); return r; };
  if (acct()) connect();
  changed();

  var st = document.createElement("style");
  st.textContent = [
    ".rlSlot{display:flex}",
    ".rlF{display:flex;flex-direction:column;align-items:center;gap:.2rem;background:none;border:0;padding:0;cursor:pointer;color:inherit;font:inherit}",
    ".rlF canvas{width:min(170px,22vh);height:min(226px,29vh);filter:drop-shadow(0 14px 18px rgba(0,0,0,.5))}",
    ".rlFn{display:flex;flex-direction:column;align-items:center;background:rgba(10,12,32,.82);border:1px solid #2f3466;border-radius:12px;padding:.25rem .8rem;margin-top:-.5rem;min-width:120px}.rlFn small{color:#a9b0d6;font-size:.72rem}",
    ".rlF:hover .rlFn{border-color:#9ab6ff}",
    ".rlMore{min-height:1em;margin:.3rem 0 0;font-size:.8rem;color:#a9b0d6}",
    "#invc{position:fixed;left:1rem;bottom:1rem;z-index:60;display:flex;flex-direction:column;gap:.5rem}",
    "#invc .inv{background:rgba(14,16,40,.96);border:1px solid #3b6ef5;border-radius:14px;padding:.7rem .9rem;box-shadow:0 12px 30px rgba(0,0,0,.5);max-width:300px}#invc .row{margin-top:.5rem;gap:.4rem}",
    ".onlc .tabs{display:flex;gap:.3rem;flex-wrap:wrap;margin:.4rem 0 .6rem}.onlc .tab{background:rgba(255,255,255,.05);border:1px solid #2f3466;color:#c9cde6;border-radius:999px;padding:.3rem .8rem;cursor:pointer;font:inherit}.onlc .tab.on{background:#2b4fd6;color:#fff;border-color:#2b4fd6}",
    ".onlc .flist{display:flex;flex-direction:column;gap:.35rem;max-height:46vh;overflow:auto}",
    ".frow{display:flex;align-items:center;gap:.6rem;background:rgba(255,255,255,.04);border-radius:10px;padding:.45rem .7rem}.frow .fn{flex:1;display:flex;flex-direction:column}.frow .fn small{color:#a9b0d6;font-size:.75rem}",
    ".dot{width:10px;height:10px;border-radius:50%;background:#555b80;flex:none}.dot.on{background:#3ddc84;box-shadow:0 0 8px #3ddc84}",
    ".onlc input{flex:1;min-width:0;background:#0d0f26;border:1px solid #2f3466;color:#f2f2f7;border-radius:10px;padding:.5rem .7rem;font:inherit}",
    ".onlMsg{color:#ff8a9e;min-height:1.2em;margin:.3rem 0}.onlAlt{margin-top:.8rem}.onlAlt summary{cursor:pointer;color:#9ab6ff}"
  ].join("\n");
  document.head.appendChild(st);
});
})();
