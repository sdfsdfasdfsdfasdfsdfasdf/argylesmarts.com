// Megs online: the connection to the game server, your online account, friends, invites and your party.
// The server keeps accounts, friends and parties; your look is sent so friends see your player in their lobby.
(function(){
"use strict";
var MG = window.MG, R = MG.R;
var KEY = "megs.online", WS_URL = (function(){ try { return localStorage.getItem("megs.ws") || ""; } catch (e) { return ""; } })() || "wss://online.argylesmarts.com/ws";
var N = MG.net = {on: false, busy: false, me: null, friends: [], reqs: [], sent: [], party: {leader: null, members: []}, invites: [], found: null, tab: "friends", err: ""};
var ws = null, tries = 0, timer = 0, lastLook = "", pend = null;
var LOOK_KEYS = ["kit", "cus", "look", "trail", "fx", "emote", "boot", "wrap", "hair", "banner"], ITEM_KEYS = ["kit", "trail", "fx", "emote", "boot", "wrap", "hair", "banner"];

function acct(){ try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
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
    if (a) send({t: "hello", id: a.id, key: a.key});
    else if (pend) { send(pend); pend = null; }
    changed();
  };
  ws.onmessage = function(e){ if (e.data === "pong") return; var m; try { m = JSON.parse(e.data); } catch (x) { return; } recv(m); };
  ws.onclose = function(){ ws = null; N.on = false; N.busy = false; N.me = null; changed(); retry(); };
  ws.onerror = function(){};
}
function retry(){ if (!acct() && !document.getElementById("onl")) return; tries++; clearTimeout(timer); timer = setTimeout(connect, Math.min(30000, 1500 * Math.pow(2, Math.min(tries, 5)))); }
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
    if (m.key) keep({id: m.id, key: m.key});
    N.pushLook();
  } else if (m.t === "err") {
    if (m.c === "auth" || m.c === "name") N.err = m.msg; else if (U) U.toast(U.esc(m.msg));
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
  } else if (m.t === "search") N.found = m;
  (N.hooks[m.t] || []).forEach(function(f){ f(m); });
  changed();
}
N.hooks = {};
N.hook = function(t, f){ (N.hooks[t] = N.hooks[t] || []).push(f); };

// ---- everything on screen that shows online state ----
function changed(){
  if (!MG.ui) return;
  if (document.getElementById("onl")) panel();
  slots(); badge(); invites();
}
function badge(){
  var b = document.querySelector('.rlb[data-a="friends"] small'), on, n;
  if (!b) return;
  on = N.friends.filter(function(f){ return f.on; }).length; n = N.reqs.length;
  b.innerHTML = !N.me ? (acct() ? "Connecting..." : "Make a username to add friends") : on + " online" + (n ? ' &middot; <i class="hot">' + n + ' request' + (n > 1 ? "s" : "") + '</i>' : "");
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
    el.innerHTML = p ? '<button class="rlF" data-a="onlMember" data-id="' + p.id + '"><canvas data-pid="' + p.id + '" width="240" height="320"></canvas><span class="rlFn"><b>' + U.esc(p.name) + '</b><small>' + (p.id === N.party.leader ? "Party leader" : p.on ? "In your party" : "Reconnecting...") + '</small></span></button>'
      : '<button class="rlS" data-a="rlInvite">' + U.ic("users") + '<b>Invite a friend</b><small>' + (N.me ? "Pick from your friends" : "Make a username first") + '</small></button>';
  });
  if (more) more.innerHTML = o.length > 2 ? "+" + (o.length - 2) + " more in your party: " + o.slice(2).map(function(p){ return U.esc(p.name); }).join(", ") : "";
}
function drawSlots(now){
  requestAnimationFrame(drawSlots);
  var cs = document.querySelectorAll("canvas[data-pid]"), t = now / 1000;
  if (!cs.length || document.body.classList.contains("playing")) return;
  [].forEach.call(cs, function(c, i){
    var p = N.party.members.filter(function(x){ return x.id === c.getAttribute("data-pid"); })[0];
    if (p) R.portrait(c, N.side(p), t + i * 3, {turn: 0.45 * Math.sin(t * 0.35 + i * 2)});
  });
}
requestAnimationFrame(drawSlots);

// ---- the Friends panel ----
function panel(){
  var el = document.getElementById("onl"), U = MG.ui, esc = U.esc, h, a = acct();
  if (!el) return;
  if (!N.me) {
    if (a && (N.busy || N.on) && !N.err) { el.innerHTML = '<h2>Friends</h2><p class="mute">Connecting to the Megs server...</p>'; return; }
    h = '<h2>Make your username</h2><p class="mute">Friends find you by this name. Letters, numbers and _ only, 3 to 16 long. Use a made-up name, not your real one.</p>' +
      '<div class="row"><input id="onlName" maxlength="16" autocomplete="off" value="' + esc(((MG.S.name || "") + "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 16)) + '"><button class="btn" data-a="onlSignup">Create</button></div>' +
      '<p class="onlMsg">' + esc(N.err) + '</p>' +
      '<details class="onlAlt"><summary>Already have an account on another device?</summary><p class="mute">Paste the account code from Friends on that device.</p><div class="row"><input id="onlCode" autocomplete="off" placeholder="Account code"><button class="btn ghost" data-a="onlCode">Sign in</button></div></details>' +
      (!N.on && !N.busy ? '<p class="mute">Can\'t reach the server right now. <button class="lnk" data-a="onlRetry">Try again</button></p>' : "");
    el.innerHTML = h;
    return;
  }
  var on = N.friends.filter(function(f){ return f.on; }), off = N.friends.filter(function(f){ return !f.on; });
  var inMine = function(id){ return N.party.members.some(function(p){ return p.id === id; }); };
  function row(f){
    var st = f.on ? (inMine(f.id) ? "In your party" : f.party ? "In a party" : "Online") : "Offline";
    return '<div class="frow"><i class="dot' + (f.on ? " on" : "") + '"></i><span class="fn"><b>' + esc(f.name) + '</b><small>' + st + '</small></span>' +
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
      return '<div class="frow"><i class="dot' + (f.on ? " on" : "") + '"></i><span class="fn"><b>' + esc(f.name) + '</b></span>' + (f.friend || N.friends.some(function(x){ return x.id === f.id; }) ? '<span class="mute">Friends</span>' : sentTo(f.id) ? '<span class="mute">Request sent</span>' : '<button class="btn sm" data-a="onlAdd" data-id="' + f.id + '">Add friend</button>') + '</div>';
    }).join("") : '<p class="mute">Nobody with a name starting like that.</p>';
    else h += '<p class="mute">Type at least 2 letters of their username.</p>';
  }
  h += '</div>';
  if (N.inParty()) h += '<div class="row"><button class="btn ghost sm" data-a="onlLeave">Leave party</button></div>';
  h += '<details class="onlAlt"><summary>Your account code</summary><p class="mute">This code is your account. Use it to sign in on another device. Anyone who has it can use your account, so keep it private.</p><div class="row"><input id="onlMy" readonly value="' + (a ? esc(a.id + "." + a.key) : "") + '"><button class="btn ghost sm" data-a="onlCopy">Copy</button></div></details>';
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
  ACT.onlSignup = function(){
    var v = (document.getElementById("onlName") || {}).value || "";
    N.err = ""; pend = {t: "signup", name: v.trim(), look: myLook()};
    if (ws && ws.readyState === 1) { send(pend); pend = null; } else connect();
  };
  ACT.onlCode = function(){
    var v = ((document.getElementById("onlCode") || {}).value || "").trim(), p = v.split(".");
    if (p.length !== 2 || !/^[0-9a-f]{16}$/.test(p[0]) || !/^[0-9a-f]{48}$/.test(p[1])) { N.err = "That does not look like an account code."; panel(); return; }
    keep({id: p[0], key: p[1]}); N.err = "";
    if (ws && ws.readyState === 1) send({t: "hello", id: p[0], key: p[1]}); else connect();
  };
  ACT.onlCopy = function(){ var i = document.getElementById("onlMy"); if (!i) return; i.select(); try { navigator.clipboard.writeText(i.value); } catch (e) { document.execCommand("copy"); } U.toast("Account code copied. Keep it private."); };
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
      '<button class="btn ghost" data-a="onlLeave">Leave party</button><button class="btn ghost" data-a="close">Close</button></div>');
  };
  ACT.onlPromote = function(d){ send({t: "promote", id: d.id}); U.close(); };
  ACT.onlKick = function(d){ send({t: "kick", id: d.id}); U.close(); };
  var ah = AFTER.home;
  AFTER.home = function(a){ if (ah) ah(a); [].forEach.call(document.querySelectorAll(".rlSlot"), function(e){ e.removeAttribute("data-k"); }); slots(); badge(); };
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
