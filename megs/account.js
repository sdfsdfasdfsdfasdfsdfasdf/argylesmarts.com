// MEGS account box in the Locker: guests see Sign up and Log in; once you have an account you can change your
// username one time, and after that you ask an admin for a change instead.
(function(){
"use strict";
var MG = window.MG;
function waitUi(f){ if (MG.ui && MG.ui.ACT && MG.ui.VIEW && MG.ui.VIEW.locker && MG.net && MG.net.send) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, VIEW = U.VIEW, N = MG.net, esc = U.esc;
  function box(){
    var me = N.me, s = MG.S, stored = null;
    try { stored = JSON.parse(localStorage.getItem("megs.online") || "null"); } catch (e) {}
    if (!me && stored) return '<div class="set acct"><div>Account<small>Connecting to the Megs server...</small></div><div class="accb"><b>' + esc(s.name) + '</b></div></div>';
    if (!me) return '<div class="set acct"><div>Account<small>You are playing as a guest. Sign up to pick your username and keep your coins and items safe.</small></div><div class="accb"><b>' + esc(s.name) + '</b><button class="btn gold sm" data-a="acc" data-v="signup">Sign up</button><button class="btn sm" data-a="acc" data-v="login">Log in</button></div></div>';
    var sub = !me.renamed ? "You can change it one time." : me.asked ? "Change to " + esc(me.asked) + " requested. An admin will look at it." : "You have used your one name change.";
    return '<div class="set acct"><div>Username<small>' + sub + '</small></div><div class="accb">' +
      (!me.renamed ? '<input id="accRn" maxlength="16" autocomplete="off" value="' + esc(me.name) + '"><button class="btn sm" data-a="accRename">Change</button>'
        : '<b>' + esc(me.name) + '</b><button class="btn sm" data-a="accReq">' + (me.asked ? "Change my request" : "Request name change") + '</button>') + '</div></div>' +
      '<div class="set acct"><div>Passcode<small>Keep it to yourself.</small></div><div class="accb"><button class="btn sm ghost" data-a="accPass">Change passcode</button><button class="btn sm ghost" data-a="onlOut">Log out</button></div></div>';
  }
  var lk0 = VIEW.locker;
  VIEW.locker = function(){
    return lk0.apply(this, arguments).replace(/<div class="set"><div>Name<\/div><input[^>]*data-me="name"><\/div>/, box());
  };
  ACT.accRename = function(){
    var v = ((document.getElementById("accRn") || {}).value || "").trim();
    if (!v || v === N.me.name) return U.toast("Type the new username first.");
    U.modal('<div id="accm"><h2>Change your username to ' + esc(v) + '?</h2><p class="mute">You can only do this once. After that, name changes go through an admin.</p><p class="onlMsg" id="accMsg"></p><div class="row center"><button class="btn gold" data-a="accRenameGo" data-v="' + esc(v) + '">Change it</button><button class="btn ghost" data-a="close">Cancel</button></div></div>', "onlc");
  };
  ACT.accRenameGo = function(d){ N.send({t: "rename", name: d.v}); setTimeout(function(){ if (document.getElementById("accMsg") && !document.getElementById("accMsg").textContent) { U.close(); U.go("locker", U.arg && U.arg()); U.toast("Username changed."); } }, 900); };
  ACT.accReq = function(){
    U.modal('<div id="accm"><h2>Request a name change</h2><p class="mute">An admin will look at it. You will hear back here.</p><div class="accf"><input id="accW" maxlength="16" autocomplete="off" placeholder="The username you want" value="' + esc(N.me.asked || "") + '"><input id="accY" maxlength="200" autocomplete="off" placeholder="Why? (optional)"></div><p class="onlMsg" id="accMsg"></p><div class="row center"><button class="btn gold" data-a="accReqGo">Send request</button><button class="btn ghost" data-a="close">Cancel</button></div></div>', "onlc");
  };
  ACT.accReqGo = function(){ N.send({t: "namereq", want: ((document.getElementById("accW") || {}).value || "").trim(), why: ((document.getElementById("accY") || {}).value || "").trim()}); };
  ACT.accPass = function(){
    U.modal('<div id="accm"><h2>Change passcode</h2><div class="accf"><input id="accO" type="password" maxlength="64" autocomplete="current-password" placeholder="Current passcode"><input id="accN1" type="password" maxlength="64" autocomplete="new-password" placeholder="New passcode"><input id="accN2" type="password" maxlength="64" autocomplete="new-password" placeholder="New passcode again"></div><p class="onlMsg" id="accMsg"></p><div class="row center"><button class="btn gold" data-a="accPassGo">Change it</button><button class="btn ghost" data-a="close">Cancel</button></div></div>', "onlc");
  };
  ACT.accPassGo = function(){
    var o = document.getElementById("accO").value, a = document.getElementById("accN1").value, b = document.getElementById("accN2").value;
    if (a !== b) { document.getElementById("accMsg").textContent = "The two new passcodes don't match."; return; }
    N.send({t: "pass", old: o, next: a});
  };
  var st = document.createElement("style");
  st.textContent = [
    ".acct .accb{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;justify-content:flex-end}.acct .accb b{font-size:1.05rem}",
    ".acct input,.accf input{background:#0d0f26;border:1px solid #2f3466;color:#f2f2f7;border-radius:10px;padding:.45rem .6rem;font:inherit;min-width:0}",
    ".accf{display:flex;flex-direction:column;gap:.5rem;margin:.6rem 0}"
  ].join("\n");
  document.head.appendChild(st);
});
})();
