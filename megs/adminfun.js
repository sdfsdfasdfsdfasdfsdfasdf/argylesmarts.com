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
  ["squeal", "High pitch", "A short high-pitched squeal (silent if they've muted the game)"],
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
// iPad and iPhone keep web sound off until the page is touched, so the prank sounds get woken on every tap too
(function(){
  function unlock(){
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state !== "running") actx.resume(); var b = actx.createBuffer(1, 1, 22050), s = actx.createBufferSource(); s.buffer = b; s.connect(actx.destination); s.start(0); } catch (e) {}
  }
  ["touchend", "pointerup", "click", "keydown"].forEach(function(k){ window.addEventListener(k, unlock, true); });
})();
function horn(len){
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume();
    var t = actx.currentTime, g = actx.createGain(), st = (MG.S && MG.S.set) || {}, lv = st.mute ? 0.0001 : Math.max(0.0001, 0.35 * (st.vol == null ? 0.7 : st.vol) / 0.7);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lv, t + 0.04); g.gain.setValueAtTime(lv, t + len - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    g.connect(actx.destination);
    [233, 294, 349, 466].forEach(function(f, i){ var o = actx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 1.02, t + len); o.detune.value = i * 4; o.connect(g); o.start(t); o.stop(t + len); });
  } catch (e) {}
}
// a short high squeal that warbles up and down; it follows the player's volume and doesn't play at all when muted
function squeal(){
  try {
    var st = (MG.S && MG.S.set) || {}; if (st.mute) return;
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume();
    var t = actx.currentTime, len = 1.6, lv = 0.12 * (st.vol == null ? 0.7 : st.vol) / 0.7, g = actx.createGain(), o = actx.createOscillator(), lfo = actx.createOscillator(), lg = actx.createGain();
    if (lv <= 0.001) return;
    o.type = "sine"; o.frequency.setValueAtTime(4200, t); o.frequency.linearRampToValueAtTime(6200, t + len);
    lfo.frequency.value = 9; lg.gain.value = 700; lfo.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lv, t + 0.08); g.gain.setValueAtTime(lv, t + len - 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g); g.connect(actx.destination); o.start(t); lfo.start(t); o.stop(t + len + 0.05); lfo.stop(t + len + 0.05);
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
// ---- drawn sounds: y (0 top, 1 bottom) maps to a pitch on a log scale, like a spectrogram ----
var LOF = 150, HIF = 6000;
function yHz(y){ return LOF * Math.pow(HIF / LOF, 1 - y); }
function hzY(f){ return 1 - Math.log(f / LOF) / Math.log(HIF / LOF); }
// strokes: [[[seconds, hertz], ...], ...]; plays each line as a smooth sine voice
function playDrawn(strokes, preview){
  try {
    var st = (MG.S && MG.S.set) || {}; if (st.mute && !preview) return;
    actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume();
    var t0 = actx.currentTime + 0.05, lv = 0.1 * (st.vol == null ? 0.7 : st.vol) / 0.7 / Math.sqrt(Math.max(1, strokes.length));
    strokes.forEach(function(s){
      var o = actx.createOscillator(), g = actx.createGain(), a = s[0][0], z = s[s.length - 1][0];
      o.type = "sine"; o.frequency.setValueAtTime(s[0][1], t0 + a);
      s.forEach(function(p){ o.frequency.linearRampToValueAtTime(p[1], t0 + p[0]); });
      g.gain.setValueAtTime(0.0001, t0 + a); g.gain.exponentialRampToValueAtTime(lv, t0 + a + 0.03); g.gain.setValueAtTime(lv, t0 + Math.max(a + 0.04, z - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + z + 0.02);
      o.connect(g); g.connect(actx.destination); o.start(t0 + a); o.stop(t0 + z + 0.05);
    });
  } catch (e) {}
}
// the pad (and the picture on the receiving screen): dark with note lines, each drawn line coloured by its pitch
function padDraw(cv, play, strokes){
  if (!cv) return; var g = cv.getContext("2d"), w = cv.width, h = cv.height, i;
  g.fillStyle = "#05061a"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 1;
  [200, 400, 800, 1600, 3200].forEach(function(f){ var y = hzY(f) * h; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillStyle = "rgba(255,255,255,.3)"; g.font = "11px sans-serif"; g.fillText(f + " Hz", 6, y - 3); });
  for (i = 1; i < 3; i++) { g.beginPath(); g.moveTo(w * i / 3, 0); g.lineTo(w * i / 3, h); g.stroke(); }
  (strokes || PAD.strokes).forEach(function(s){
    g.lineWidth = 6; g.lineCap = g.lineJoin = "round";
    for (var j = 1; j < s.length; j++) { var p = s[j - 1], q = s[j]; g.strokeStyle = "hsl(" + Math.round(300 - (1 - q[1]) * 260) + ",95%,62%)"; g.shadowColor = g.strokeStyle; g.shadowBlur = 10; g.beginPath(); g.moveTo(p[0] * w, p[1] * h); g.lineTo(q[0] * w, q[1] * h); g.stroke(); }
    g.shadowBlur = 0;
  });
  if (play > 0 && play < 1) { g.fillStyle = "rgba(255,255,255,.8)"; g.fillRect(play * w - 1, 0, 2, h); }
}
var PAD = {strokes: []};
// on the receiving screen: the drawing glows over the game while it plays
function showDrawn(strokes){
  var cv = document.createElement("canvas"), t0 = performance.now(), pts = strokes.map(function(s){ return s.map(function(p){ return [p[0] / 3, hzY(p[1])]; }); });
  cv.className = "fxCv"; cv.width = innerWidth; cv.height = innerHeight; cv.style.opacity = ".85"; document.body.appendChild(cv);
  (function f(){ var t = (performance.now() - t0) / 1000; if (t > 3.6) { cv.remove(); return; } var g = cv.getContext("2d"); padDraw(cv, t / 3, pts); g.globalCompositeOperation = "destination-out"; g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = "source-over"; requestAnimationFrame(f); })();
}
var RUN = {
  draw: function(m){ var s = Array.isArray(m.s) ? m.s : []; if (!s.length) return; playDrawn(s); showDrawn(s); },
  shake: function(){ body("animation:fxShake .45s linear 4", 1900); },
  horn: function(){ horn(1.4); },
  squeal: function(){ squeal(); },
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
  N.hook("adm", function(m){ if (m.op === "fun") U.toast(m.ok ? "Sent " + (m.k === "draw" ? "your sound" : esc((FUN.filter(function(x){ return x[0] === m.k; })[0] || [0, m.k])[1])) + " to " + esc(m.name) + "." : esc(m.msg || "Couldn't send that.")); });

  // ---- the Friends tab on the admin page ----
  var adm0 = VIEW.admin;
  VIEW.admin = function(){
    var h = adm0.apply(this, arguments), i = h.indexOf('<div class="tabs">');
    if (i < 0) return h;
    var j = h.indexOf("</div>", i), tabs = h.slice(i, j).replace(/ on"/g, '"').replace(/class="tab on/g, 'class="tab');
    var btn = '<button class="tab' + (tabOn ? " on" : "") + '" data-a="admFr">Friends' + (N.friends && N.friends.length ? " (" + N.friends.length + ")" : "") + '</button>';
    // every player found by a search gets a Watch button too
    h = h.replace(/(data-a="admCoins" data-id="([^"]+)">Give coins<\/button>)/g, '$1<button class="btn sm gold" data-a="admWatch" data-id="$2">Watch their match</button>');
    h = h.replace(/(<input type="text" maxlength="64" placeholder="New passcode" id="ap_([^"]+)">)/g, function(all, a, id){ return pranks(id) + '</div><div class="row">' + a; });
    if (!tabOn) return h.slice(0, j) + btn + h.slice(j);
    var end = h.lastIndexOf('<p class="mute">Coming next');
    return h.slice(0, i) + tabs + btn + "</div>" + friends() + (end > 0 ? h.slice(end) : "</div>");
  };
  // every prank for one player: pick one from the list, or draw a sound
  function pranks(id){
    return '<select id="afs_' + id + '">' + FUN.filter(function(x){ return x[0] !== "say"; }).map(function(x){ return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join("") + '</select>' +
      '<button class="btn sm" data-a="admFunSel" data-id="' + id + '">Send prank</button><input maxlength="80" placeholder="Message for their screen" id="afx_' + id + '"><button class="btn sm gold" data-a="admFun" data-id="' + id + '" data-k="say">Send message</button><button class="btn sm gold" data-a="admDraw" data-id="' + id + '">Draw a sound</button>';
  }
  function friends(){
    var list = (N.friends || []).slice().sort(function(a, b){ return (b.on ? 1 : 0) - (a.on ? 1 : 0); });
    if (!list.length) return '<p class="mute">You have no friends added yet. Add some from the Friends screen, then they show up here.</p>';
    return '<p class="mute">Open a friend to give coins or items, rename them or ban them. Pranks only reach friends who are online, last a few seconds and show who sent them.</p><div class="admL">' + list.map(function(f){
      return '<div class="admU"><div class="admH"><b>' + esc(f.name) + '</b><small>' + (f.on ? '<i class="dot on"></i> Online' : "Offline") + '</small><button class="btn sm gold" ' + (f.on ? 'data-a="admWatch" data-id="' + f.id + '"' : "disabled") + ' style="margin-left:auto">Watch</button><button class="btn sm ghost" data-a="admOpen" data-n="' + esc(f.name) + '">Open tools</button></div>' +
        '<div class="row fxRow">' + FUN.filter(function(x){ return x[0] !== "say"; }).map(function(x){ return '<button class="btn sm' + (f.on ? "" : " ghost") + '"' + (f.on ? ' data-a="admFun" data-id="' + f.id + '" data-k="' + x[0] + '"' : " disabled") + ' title="' + x[2] + '">' + x[1] + '</button>'; }).join("") + '</div>' +
        '<div class="row"><input maxlength="80" placeholder="A message for their screen" id="afx_' + f.id + '"' + (f.on ? "" : " disabled") + '><button class="btn sm gold"' + (f.on ? ' data-a="admFun" data-id="' + f.id + '" data-k="say"' : " disabled") + '>Send message</button><button class="btn sm gold"' + (f.on ? ' data-a="admDraw" data-id="' + f.id + '" data-n="' + esc(f.name) + '"' : " disabled") + '>Draw a sound</button></div></div>';
    }).join("") + '</div>';
  }
  ACT.admFunSel = function(d, b){ var id = b.getAttribute("data-id"), e = document.getElementById("afs_" + id); if (e) N.send({t: "adm", op: "fun", id: id, k: e.value, txt: ""}); };
  // ---- draw a sound: time runs left to right (3 seconds), pitch bottom to top, like a spectrogram ----
  PAD.id = null; PAD.cur = null;
  ACT.admDraw = function(d, b){
    PAD.id = b.getAttribute("data-id"); PAD.name = b.getAttribute("data-n") || ""; PAD.strokes = [];
    U.modal('<div class="sdraw"><h2>Draw a sound' + (PAD.name ? ' for ' + esc(PAD.name) : "") + '</h2><p class="mute">Draw lines: left to right is time (3 seconds), higher up is a higher note. Several lines play together. It plays at their volume, and not at all if they have muted the game.</p>' +
      '<canvas id="sdc" width="720" height="320"></canvas><div class="row"><button class="btn ghost" data-a="sdClear">Clear</button><button class="btn ghost" data-a="sdPlay">Hear it</button><button class="btn gold" data-a="sdSend">Send</button><button class="btn ghost" data-a="sdClose">Close</button></div></div>', "sdw");
    var cv = document.getElementById("sdc"); padDraw(cv, 0);
    function pos(e){ var r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return [MG.clamp((p.clientX - r.left) / r.width, 0, 1), MG.clamp((p.clientY - r.top) / r.height, 0, 1)]; }
    function start(e){ e.preventDefault(); if (PAD.strokes.length >= 12) return U.toast("That's the most lines one sound can have."); PAD.cur = [pos(e)]; PAD.strokes.push(PAD.cur); padDraw(cv, 0); }
    function move(e){ if (!PAD.cur) return; e.preventDefault(); var q = pos(e), l = PAD.cur[PAD.cur.length - 1]; if (Math.abs(q[0] - l[0]) + Math.abs(q[1] - l[1]) > 0.006 && PAD.cur.length < 150) { PAD.cur.push(q); padDraw(cv, 0); } }
    function end(){ PAD.cur = null; }
    cv.addEventListener("mousedown", start); cv.addEventListener("mousemove", move); window.addEventListener("mouseup", end);
    cv.addEventListener("touchstart", start, {passive: false}); cv.addEventListener("touchmove", move, {passive: false}); cv.addEventListener("touchend", end);
  };
  // turn the drawing into [seconds, hertz] points; lines drawn right to left are put in time order
  function toSound(){ return PAD.strokes.filter(function(s){ return s.length > 1; }).map(function(s){ var a = s.map(function(q){ return [Math.round(q[0] * 3 * 100) / 100, Math.round(yHz(q[1]))]; }); if (a[0][0] > a[a.length - 1][0]) a.reverse(); return a; }); }
  ACT.sdClear = function(){ PAD.strokes = []; padDraw(document.getElementById("sdc"), 0); };
  ACT.sdPlay = function(){ var s = toSound(); if (!s.length) return U.toast("Draw a line first."); playDrawn(s, true); var cv = document.getElementById("sdc"), t0 = performance.now(); (function f(){ var t = (performance.now() - t0) / 1000; if (!document.getElementById("sdc")) return; padDraw(cv, t / 3); if (t < 3.1) requestAnimationFrame(f); else padDraw(cv, 0); })(); };
  ACT.sdSend = function(){ var s = toSound(); if (!s.length) return U.toast("Draw a line first."); N.send({t: "adm", op: "fun", id: PAD.id, k: "draw", s: s}); };
  ACT.sdClose = function(){ U.close(); };
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
  var st = document.createElement("style"); st.textContent = ".fxRow{flex-wrap:wrap;gap:.35rem}.fxRow .btn{padding:.3rem .6rem}.sdraw #sdc{display:block;width:100%;max-width:720px;aspect-ratio:9/4;border-radius:12px;cursor:crosshair;touch-action:none;background:#05061a;margin:.4rem 0 .6rem}.sdraw .row{gap:.5rem;flex-wrap:wrap}.card.sdw{width:min(800px,94vw);max-width:none}"; document.head.appendChild(st);
});
})();
