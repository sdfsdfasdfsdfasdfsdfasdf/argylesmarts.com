// MEGS admin extras: a Friends tab on the admin page (open the usual tools for a friend, or send them a prank), and
// the pranks themselves, which run on whoever receives them for a few seconds: shake, an air horn, flips, confetti...
(function(){
"use strict";
var MG = window.MG, TAU = Math.PI * 2;

// [key, button label, what it does]
var FUN = [
  ["shake", "Shake", "Shakes their screen"], ["horn", "Air horn", "A loud air horn"], ["flip", "Mirror", "Mirrors their screen"],
  ["upside", "Upside down", "Turns their screen upside down"], ["confetti", "Confetti", "Confetti everywhere"], ["spin", "Spin", "One full spin"],
  ["invert", "Invert", "Inverts the colours"], ["rainbow", "Rainbow", "Cycles every colour"], ["tiny", "Tiny", "Shrinks the whole game"],
  ["megs", "MEGS!", "A giant MEGS! across the screen"], ["goal", "Fake goal", "A fake GOAL! with a horn"], ["disco", "Disco", "Flashing disco lights"],
  ["balls", "Ball rain", "Footballs rain down"], ["jelly", "Jelly", "The screen wobbles like jelly"], ["blur", "Blurry", "Everything goes blurry"],
  ["say", "Message", "Shows your message big on their screen"]];

// ---- running a prank on this screen ----
var css = document.createElement("style");
css.textContent = "@keyframes fxShake{0%,100%{transform:none}10%,50%,90%{transform:translate(-14px,6px) rotate(-1deg)}30%,70%{transform:translate(14px,-6px) rotate(1deg)}}" +
  "@keyframes fxSpin{to{transform:rotate(360deg)}}@keyframes fxRain{to{filter:hue-rotate(360deg)}}" +
  "@keyframes fxJelly{0%,100%{transform:none}20%{transform:scale(1.06,.94) skewX(4deg)}40%{transform:scale(.94,1.06) skewX(-4deg)}60%{transform:scale(1.04,.96) skewX(2deg)}80%{transform:scale(.97,1.03) skewX(-1deg)}}" +
  "@keyframes fxPop{0%{transform:translate(-50%,-50%) scale(.2) rotate(-12deg);opacity:0}15%{transform:translate(-50%,-50%) scale(1.15) rotate(-6deg);opacity:1}80%{transform:translate(-50%,-50%) scale(1) rotate(-6deg);opacity:1}100%{transform:translate(-50%,-50%) scale(1.4) rotate(-6deg);opacity:0}}" +
  ".fxTxt{position:fixed;left:50%;top:50%;z-index:99999;pointer-events:none;font-weight:900;font-style:italic;text-align:center;white-space:nowrap;animation:fxPop 2.6s ease-out forwards;text-shadow:0 8px 0 #14163a,0 0 40px rgba(255,200,40,.8)}" +
  ".fxFrom{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:99999;pointer-events:none;background:rgba(10,12,40,.85);color:#ffd23b;border:1px solid rgba(255,210,59,.5);border-radius:99px;padding:.35rem .9rem;font-size:.8rem;font-weight:800}" +
  ".fxCv{position:fixed;inset:0;width:100%;height:100%;z-index:99998;pointer-events:none}";
document.head.appendChild(css);

function body(style, ms){
  var b = document.body, keep = b.getAttribute("style") || "";
  b.style.cssText = keep + ";" + style; b.style.transformOrigin = "50% 50%";
  setTimeout(function(){ b.setAttribute("style", keep); if (!keep) b.removeAttribute("style"); }, ms);
}
function text(t, size, col){
  var d = document.createElement("div"); d.className = "fxTxt"; d.textContent = t; d.style.fontSize = size; d.style.color = col || "#ffd23b";
  document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 2700);
}
var actx = null;
function horn(len){
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume();
    var t = actx.currentTime, g = actx.createGain(), muted = MG.S && MG.S.set && MG.S.set.mute;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.35, t + 0.04); g.gain.setValueAtTime(muted ? 0.0001 : 0.35, t + len - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    g.connect(actx.destination);
    [233, 294, 349, 466].forEach(function(f, i){ var o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.02, t + len); o.detune.value = i * 4; o.connect(g); o.start(t); o.stop(t + len); });
  } catch (e) {}
}
// confetti, balls and disco lights are drawn on a canvas over everything
function overlay(ms, draw){
  var cv = document.createElement("canvas"), t0 = performance.now(), parts = [], i, w, h;
  cv.className = "fxCv"; document.body.appendChild(cv);
  function size(){ w = cv.width = innerWidth; h = cv.height = innerHeight; }
  size();
  for (i = 0; i < 160; i++) parts.push({x: Math.random() * w, y: -Math.random() * h, vx: (Math.random() - 0.5) * 120, vy: 120 + Math.random() * 260, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, c: ["#ffd23b", "#ff5d7a", "#3b6ef5", "#5ee6a8", "#ff8ad1", "#ffffff"][i % 6], s: 6 + Math.random() * 10});
  var last = t0;
  (function frame(now){
    var dt = Math.min(0.05, (now - last) / 1000), g = cv.getContext("2d"), k = (now - t0) / ms; last = now;
    if (k >= 1) { cv.remove(); return; }
    g.clearRect(0, 0, w, h); draw(g, parts, dt, k, w, h, now / 1000);
    requestAnimationFrame(frame);
  })(t0);
}
function ball(g, x, y, r, a){
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = "#fff"; g.strokeStyle = "#14163a"; g.lineWidth = r * 0.12; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill(); g.stroke();
  g.fillStyle = "#14163a"; g.beginPath(); for (var i = 0; i < 5; i++) { var q = -Math.PI / 2 + i * TAU / 5; g.lineTo(Math.cos(q) * r * 0.42, Math.sin(q) * r * 0.42); } g.fill();
  g.restore();
}
var RUN = {
  shake: function(){ body("animation:fxShake .45s linear 4", 1900); },
  horn: function(){ horn(1.4); },
  flip: function(){ body("transform:scaleX(-1);transition:transform .3s", 5000); },
  upside: function(){ body("transform:rotate(180deg);transition:transform .4s", 5000); },
  spin: function(){ body("animation:fxSpin 1.4s cubic-bezier(.5,0,.3,1) 1", 1500); },
  invert: function(){ body("filter:invert(1) hue-rotate(180deg)", 5000); },
  rainbow: function(){ body("animation:fxRain 1.5s linear 4", 6000); },
  tiny: function(){ body("transform:scale(.55);transition:transform .4s", 5000); },
  jelly: function(){ body("animation:fxJelly .7s ease-in-out 4", 2900); },
  blur: function(){ body("filter:blur(6px);transition:filter .3s", 3500); },
  megs: function(){ text("MEGS!", "min(28vw,320px)"); },
  goal: function(){ text("GOAL!", "min(24vw,260px)", "#fff"); horn(0.9); },
  say: function(m){ text(m.txt || "Hello!", "min(7vw,64px)", "#fff"); },
  confetti: function(){ overlay(4500, function(g, P, dt, k, w, h){ P.forEach(function(p){ p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = 1 - Math.max(0, k - 0.8) * 5; g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); }); }); },
  balls: function(){ overlay(4500, function(g, P, dt, k){ P.slice(0, 50).forEach(function(p){ p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; g.globalAlpha = 1 - Math.max(0, k - 0.8) * 5; ball(g, p.x, p.y, p.s * 1.6, p.r); }); }); },
  disco: function(){ overlay(4000, function(g, P, dt, k, w, h, t){ var i, c = ["255,59,122", "59,110,245", "94,230,168", "255,210,59"]; for (i = 0; i < 4; i++) { var a = t * 2 + i * TAU / 4, x = w / 2 + Math.cos(a) * w * 0.35, y = h / 2 + Math.sin(a * 1.3) * h * 0.3, gr = g.createRadialGradient(x, y, 0, x, y, Math.max(w, h) * 0.35); gr.addColorStop(0, "rgba(" + c[i] + ",.45)"); gr.addColorStop(1, "rgba(" + c[i] + ",0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); } g.fillStyle = "rgba(0,0,0," + (Math.sin(t * 18) > 0 ? 0.12 : 0) + ")"; g.fillRect(0, 0, w, h); }); }
};
function from(name){ var d = document.createElement("div"); d.className = "fxFrom"; d.textContent = "Prank from " + name; document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 3500); }

function waitUi(f){ if (MG.ui && MG.ui.ACT && MG.ui.VIEW && MG.ui.VIEW.admin && MG.net && MG.net.hook) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, ACT = U.ACT, VIEW = U.VIEW, N = MG.net, esc = U.esc, tabOn = false;
  N.hook("fun", function(m){ var f = RUN[m.k]; if (!f) return; try { f(m); } catch (e) {} from(m.from || "an admin"); });
  N.hook("adm", function(m){ if (m.op === "watch" && !m.ok) U.toast(esc(m.msg || "Couldn't watch that.")); });
  N.hook("adm", function(m){ if (m.op === "fun") U.toast(m.ok ? "Sent " + esc((FUN.filter(function(x){ return x[0] === m.k; })[0] || [0, m.k])[1]) + " to " + esc(m.name) + "." : esc(m.msg || "Couldn't send that.")); });

  // ---- the Friends tab on the admin page ----
  var adm0 = VIEW.admin;
  VIEW.admin = function(){
    var h = adm0.apply(this, arguments), i = h.indexOf('<div class="tabs">');
    if (i < 0) return h;
    var j = h.indexOf("</div>", i), tabs = h.slice(i, j).replace(/ on"/g, '"').replace(/class="tab on/g, 'class="tab');
    var btn = '<button class="tab' + (tabOn ? " on" : "") + '" data-a="admFr">Friends' + (N.friends && N.friends.length ? " (" + N.friends.length + ")" : "") + '</button>';
    // every player found by a search gets a Watch button too
    h = h.replace(/(data-a="admCoins" data-id="([^"]+)">Give coins<\/button>)/g, '$1<button class="btn sm gold" data-a="admWatch" data-id="$2">Watch their match</button>');
    if (!tabOn) return h.slice(0, j) + btn + h.slice(j);
    var end = h.lastIndexOf('<p class="mute">Coming next');
    return h.slice(0, i) + tabs + btn + "</div>" + friends() + (end > 0 ? h.slice(end) : "</div>");
  };
  function friends(){
    var list = (N.friends || []).slice().sort(function(a, b){ return (b.on ? 1 : 0) - (a.on ? 1 : 0); });
    if (!list.length) return '<p class="mute">You have no friends added yet. Add some from the Friends screen, then they show up here.</p>';
    return '<p class="mute">Open a friend to give coins or items, rename them or ban them. Pranks only reach friends who are online, last a few seconds and show who sent them.</p><div class="admL">' + list.map(function(f){
      return '<div class="admU"><div class="admH"><b>' + esc(f.name) + '</b><small>' + (f.on ? '<i class="dot on"></i> Online' : "Offline") + '</small><button class="btn sm gold" ' + (f.on ? 'data-a="admWatch" data-id="' + f.id + '"' : "disabled") + ' style="margin-left:auto">Watch</button><button class="btn sm ghost" data-a="admOpen" data-n="' + esc(f.name) + '">Open tools</button></div>' +
        '<div class="row fxRow">' + FUN.filter(function(x){ return x[0] !== "say"; }).map(function(x){ return '<button class="btn sm' + (f.on ? "" : " ghost") + '"' + (f.on ? ' data-a="admFun" data-id="' + f.id + '" data-k="' + x[0] + '"' : " disabled") + ' title="' + x[2] + '">' + x[1] + '</button>'; }).join("") + '</div>' +
        '<div class="row"><input maxlength="80" placeholder="A message for their screen" id="afx_' + f.id + '"' + (f.on ? "" : " disabled") + '><button class="btn sm gold"' + (f.on ? ' data-a="admFun" data-id="' + f.id + '" data-k="say"' : " disabled") + '>Send message</button></div></div>';
    }).join("") + '</div>';
  }
  ACT.admWatch = function(d, b){ N.send({t: "adm", op: "watch", id: b.getAttribute("data-id")}); };
  ACT.admFr = function(){ tabOn = true; U.go("admin"); };
  var tab0 = ACT.admTab; ACT.admTab = function(){ tabOn = false; return tab0.apply(this, arguments); };
  var open0 = ACT.admOpen; ACT.admOpen = function(){ tabOn = false; return open0.apply(this, arguments); };
  ACT.admFun = function(d, b){
    var k = b.getAttribute("data-k"), id = b.getAttribute("data-id"), e = document.getElementById("afx_" + id), txt = k === "say" && e ? e.value.trim() : "";
    if (k === "say" && !txt) return U.toast("Type a message first.");
    N.send({t: "adm", op: "fun", id: id, k: k, txt: txt});
  };
  N.hook("friends", function(){ if (tabOn && U.cur && U.cur() === "admin") U.go("admin"); });
  var st = document.createElement("style"); st.textContent = ".fxRow{flex-wrap:wrap;gap:.35rem}.fxRow .btn{padding:.3rem .6rem}"; document.head.appendChild(st);
});
})();
