// MEGS admins: their own skins, a badge others can see, and an Admin page for running the game.
// Being an admin is decided by the server; admin skins are taken off anyone it does not call an admin.
(function(){
"use strict";
var MG = window.MG, R = MG.R, I = MG.ITEMS, BY = MG.ITEM, TAU = Math.PI * 2;
MG.RAR[9] = {n: "Admin", c: "#ffd23b"};
function add(id, n, o){ o.t = "kit"; o.id = id; o.n = n; o.r = 9; o.src = "admin"; o.adm = 1; o.full = 1; I.push(o); BY[id] = o; }
add("ad_arch", "The Architect", {p: "circuit", c: ["#0a0a0f", "#ffd23b", "#1a1405"], hd: "robot", gl: "#ffd23b", eyes: "#ffd23b", f: "spark"});
add("ad_gm", "Game Master", {p: "crown", c: ["#2a0f4a", "#ffd23b", "#12061f"], hair: "long", hfx: "star", eyes: "#ffd23b", gl: "#b266ff", f: "corona", wings: 1, crown: 1});
add("ad_gold", "Black Gold", {p: "chrome", c: ["#121212", "#ffd766", "#000000"], hd: "void", gl: "#ffd766", f: "spark"});
add("ad_dev", "Dev Mode", {p: "glitch", c: ["#03140a", "#3dff7a", "#001a08"], hair: "spiky", hfx: "toxic", eyes: "#3dff7a", gl: "#3dff7a", f: "bolt"});
add("ad_found", "Founder", {p: "nova", c: ["#fffbe6", "#ffd23b", "#8a6a1a"], hd: "zeus", gl: "#fff6d6", f: "corona", wings: 1, crown: 1});
// the 67 kit is admin only now
(function(){ var s = BY.s67; if (!s) return; s.src = "admin"; s.adm = 1; s.r = 9; delete s.need; delete s.how; })();
MG.adminItems = function(){ return I.filter(function(it){ return it.adm; }); };

// admins get every admin skin; everyone else loses them (and goes back to the home kit if one was on)
MG.adminSync = function(){
  var S = MG.S, ch = false;
  if (!S) return;
  MG.adminItems().forEach(function(it){
    if (S.admin && !S.inv[it.id]) { S.inv[it.id] = 1; ch = true; }
    if (!S.admin && S.inv[it.id]) { delete S.inv[it.id]; ch = true; }
  });
  if (!S.admin && BY[S.eq.kit] && BY[S.eq.kit].adm) { S.eq.kit = "home"; ch = true; }
  if (ch) MG.save();
};
MG.adminSync();
// the all-items promo code never hands out admin skins
var unl = MG.unlocks;
MG.unlocks = function(){ var r = unl.apply(this, arguments); MG.adminSync(); return r; };

// a gold ring of hexagons at the feet and pillars of light: the admin aura
var fl0 = R.flair;
R.flair = function(g, P, J, HD, hip, s, sd, c, sg, t, phase){
  fl0.apply(this, arguments);
  if ((sd.tier || 0) !== 9) return;
  var ctr = P(0, 0, hip + 0.3), i, a, p, q, k;
  g.save(); g.lineJoin = "round";
  if (!phase) {
    g.strokeStyle = "#ffd23b"; g.lineWidth = Math.max(2, s * 0.04); g.globalAlpha = 0.85; g.beginPath();
    for (i = 0; i <= 6; i++) { a = i * TAU / 6 + t * 0.6; p = P(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.01); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
    g.stroke(); g.globalAlpha = 0.4; g.beginPath();
    for (i = 0; i <= 6; i++) { a = i * TAU / 6 - t * 0.9; p = P(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0.01); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
    g.stroke();
  }
  for (i = 0; i < 4; i++) {
    a = i * TAU / 4 + t * 0.4; p = P(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0); q = P(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 1.4 + 0.3 * Math.sin(t * 2 + i));
    if ((p.d < ctr.d) !== !!phase) continue;
    var gr = g.createLinearGradient(p.x, p.y, q.x, q.y); gr.addColorStop(0, "rgba(255,210,59,.55)"); gr.addColorStop(1, "rgba(255,210,59,0)");
    g.strokeStyle = gr; g.globalAlpha = 1; g.lineWidth = Math.max(3, s * 0.07); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
  }
  // a small crown floating over the head, in front
  if (phase && HD) {
    k = Math.max(4, s * 0.12); var cx = HD.x, cy = HD.y - s * 0.42 + Math.sin(t * 2) * s * 0.03;
    g.globalAlpha = 1; g.fillStyle = "#ffd23b"; g.strokeStyle = "rgba(8,9,22,.75)"; g.lineWidth = Math.max(1, s * 0.015);
    g.beginPath(); g.moveTo(cx - k, cy + k * 0.5); g.lineTo(cx - k * 1.05, cy - k * 0.4); g.lineTo(cx - k * 0.5, cy + k * 0.05); g.lineTo(cx, cy - k * 0.6); g.lineTo(cx + k * 0.5, cy + k * 0.05); g.lineTo(cx + k * 1.05, cy - k * 0.4); g.lineTo(cx + k, cy + k * 0.5); g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
};

// ---- the Admin page ----
function waitUi(f){ if (MG.ui && MG.ui.ACT && MG.ui.VIEW && MG.net) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, VIEW = U.VIEW, N = MG.net, esc = U.esc, coin = U.coin, A = {tab: "players", list: null, reports: null, q: ""};
  function ago(t){ if (!t) return "never"; var m = Math.round((Date.now() - t) / 60000); return m < 2 ? "just now" : m < 120 ? m + " min ago" : m < 2880 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " days ago"; }
  VIEW.admin = function(){
    if (!(N.me && N.me.admin)) return '<div class="adv"><button class="btn ghost" data-a="go" data-v="home">' + U.ic("back") + 'Back</button><p class="mute">Admins only.</p></div>';
    var h = '<div class="adv"><div class="plh"><button class="btn ghost" data-a="go" data-v="home">' + U.ic("back") + 'Back</button><h1>Admin</h1></div><div class="tabs">' +
      [["players", "Players"], ["reports", "Reports"]].map(function(x){ return '<button class="tab' + (A.tab === x[0] ? " on" : "") + '" data-a="admTab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join("") + '</div>';
    if (A.tab === "players") {
      h += '<div class="row"><input id="admQ" maxlength="16" autocomplete="off" placeholder="Search usernames (2+ letters)" value="' + esc(A.q) + '"><button class="btn" data-a="admFind">Search</button></div><datalist id="admItems">' +
        I.filter(function(it){ return !it.need; }).map(function(it){ return '<option value="' + it.id + '">' + esc(it.n) + ' (' + MG.RAR[it.r].n + ' ' + it.t + ')</option>'; }).join("") + '</datalist><div class="admL">';
      h += (A.list || []).map(function(u){
        return '<div class="admU"><div class="admH"><b>' + esc(u.name) + '</b>' + (u.admin ? '<span class="admB">ADMIN</span>' : "") + (u.banned ? '<span class="admX">Banned</span>' : "") + '<small>' + (u.on ? "Online" : "Seen " + ago(u.seen)) + ' &middot; Rating ' + u.rating + (u.items != null ? ' &middot; Level ' + u.lvl + ' &middot; ' + u.coins + ' coins &middot; ' + u.items + ' items' : ' &middot; no saved progress') + '</small></div>' +
          '<div class="row"><input type="number" min="1" max="1000000" placeholder="Coins" id="ac_' + u.id + '"><button class="btn sm" data-a="admCoins" data-id="' + u.id + '">Give coins</button>' +
          '<input list="admItems" placeholder="Item id" id="ai_' + u.id + '"><button class="btn sm" data-a="admItem" data-id="' + u.id + '">Give item</button></div>' +
          '<div class="row"><input maxlength="16" placeholder="New username" id="an_' + u.id + '"><button class="btn sm ghost" data-a="admRename" data-id="' + u.id + '">Rename</button>' +
          (u.admin ? "" : '<button class="btn sm ' + (u.banned ? "ghost" : "red") + '" data-a="' + (u.banned ? "admUnban" : "admBan") + '" data-id="' + u.id + '">' + (u.banned ? "Unban" : "Ban") + '</button>') + '</div></div>';
      }).join("") || (A.list ? '<p class="mute">Nobody found.</p>' : '<p class="mute">Search for a player to give coins or items, rename them or ban them. Gifts arrive the next time they are online.</p>');
      h += '</div>';
    } else {
      h += '<div class="admL">' + ((A.reports || []).map(function(r){
        return '<div class="admU"><div class="admH"><b>' + esc(r.tn || "?") + '</b>' + (r.tb ? '<span class="admX">Banned</span>' : "") + '<small>Reported by ' + esc(r.fn || "?") + ' &middot; ' + ago(r.at) + '</small></div><p>' + esc(r.why || "(no reason given)") + '</p><div class="row">' +
          (r.tb ? "" : '<button class="btn sm red" data-a="admBan" data-id="' + r.t + '">Ban ' + esc(r.tn || "") + '</button>') + '<button class="btn sm ghost" data-a="admRdel" data-rid="' + r.id + '">Dismiss</button></div></div>';
      }).join("") || '<p class="mute">' + (A.reports ? "No reports." : "Loading...") + '</p>') + '</div>';
    }
    return h + '<p class="mute">Coming next: start and end seasons, change the shop shelf and pack odds, and make promo codes from here.</p></div>';
  };
  function redraw(){ if (U.cur() === "admin") { var q = document.getElementById("admQ"), f = q && document.activeElement === q; U.go("admin"); if (f) { q = document.getElementById("admQ"); q.focus(); } } }
  function val(id){ var e = document.getElementById(id); return e ? e.value.trim() : ""; }
  ACT.admTab = function(d){ A.tab = d.v; if (d.v === "reports") N.send({t: "adm", op: "reports"}); redraw(); };
  ACT.admFind = function(){ A.q = val("admQ"); if (A.q.length < 2) return U.toast("Type at least 2 letters."); N.send({t: "adm", op: "find", q: A.q}); };
  ACT.admCoins = function(d){ var n = Math.floor(+val("ac_" + d.id)); if (!(n > 0)) return U.toast("Type how many coins."); N.send({t: "adm", op: "give", id: d.id, coins: n}); };
  ACT.admItem = function(d){ var v = val("ai_" + d.id); if (!BY[v]) return U.toast("Pick an item id from the list."); N.send({t: "adm", op: "give", id: d.id, item: v}); };
  ACT.admRename = function(d){ var v = val("an_" + d.id); if (!v) return U.toast("Type the new username."); N.send({t: "adm", op: "rename", id: d.id, name: v}); };
  ACT.admBan = function(d, b){ if (!b.getAttribute("data-sure")) { b.setAttribute("data-sure", "1"); b.textContent = "Sure? Ban"; return; } N.send({t: "adm", op: "ban", id: d.id}); };
  ACT.admUnban = function(d){ N.send({t: "adm", op: "unban", id: d.id}); };
  ACT.admRdel = function(d){ N.send({t: "adm", op: "rdel", rid: d.rid}); };
  N.hook("adm", function(m){
    if (m.op === "find") A.list = m.list;
    else if (m.op === "reports") A.reports = m.list;
    else if (m.op === "rdel") { A.reports = (A.reports || []).filter(function(r){ return r.id !== m.rid; }); }
    else if (m.op === "give") U.toast("Sent to " + esc(m.name) + ": " + (m.coins ? m.coins + " coins" : "") + (m.item ? (BY[m.item] || {}).n || m.item : "") + ".");
    else if (m.op === "ban" || m.op === "unban" || m.op === "rename") { U.toast(m.op === "ban" ? esc(m.name) + " is banned." : m.op === "unban" ? esc(m.name) + " is unbanned." : "Renamed to " + esc(m.name) + "."); if (A.q) N.send({t: "adm", op: "find", q: A.q}); if (A.tab === "reports") N.send({t: "adm", op: "reports"}); }
    redraw();
  });
  document.addEventListener("keydown", function(e){ if (e.key === "Enter" && document.activeElement && document.activeElement.id === "admQ") ACT.admFind(); });

  var st = document.createElement("style");
  st.textContent = [
    "body:has(#view .adv) #nav{display:none}.adv{display:flex;flex-direction:column;gap:.6rem;min-height:calc(100vh - 175px)}",
    ".adv input{background:#0d0f26;border:1px solid #2f3466;color:#f2f2f7;border-radius:10px;padding:.45rem .6rem;font:inherit;min-width:0;width:140px}#admQ{flex:1;width:auto}",
    ".adv .tabs{display:flex;gap:.3rem}.adv .tab{background:rgba(255,255,255,.05);border:1px solid #2f3466;color:#c9cde6;border-radius:999px;padding:.3rem .9rem;cursor:pointer;font:inherit}.adv .tab.on{background:#b8860b;border-color:#ffd23b;color:#fff}",
    ".admL{display:flex;flex-direction:column;gap:.5rem}.admU{background:rgba(10,12,32,.85);border:1px solid #2f3466;border-radius:14px;padding:.7rem .9rem;display:flex;flex-direction:column;gap:.45rem}",
    ".admH{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}.admH small{color:#a9b0d6;flex-basis:100%}",
    ".admB{font-size:.66rem;font-weight:900;letter-spacing:.12em;color:#1a1405;background:linear-gradient(135deg,#fff3b0,#ffd23b 50%,#b8860b);border-radius:6px;padding:.1rem .4rem;box-shadow:0 0 10px rgba(255,210,59,.5)}",
    ".admX{font-size:.7rem;font-weight:800;color:#fff;background:#b91c1c;border-radius:6px;padding:.1rem .4rem}",
    ".rlPl.adm,.rlFn.adm{border-color:#ffd23b;box-shadow:0 0 0 1px #ffd23b,0 8px 30px rgba(255,210,59,.35);background:linear-gradient(180deg,rgba(60,45,5,.9),rgba(10,12,32,.9))}"
  ].join("\n");
  document.head.appendChild(st);
});
})();
