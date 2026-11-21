// MEGS item previews for goal celebrations and ball trails: instead of a grey bubble, a small animated picture
// of the real thing (a goal going in with the celebration, or a ball flying round with its trail).
(function(){
"use strict";
var MG = window.MG, TAU = Math.PI * 2;
var vis0 = MG.visX;
MG.visX = function(it, cls){
  if (it.t === "fx") return '<canvas class="sq ' + cls + '" data-fxp="' + (it.k || "confetti") + '" width="200" height="200"></canvas>';
  if (it.t === "trail") return '<canvas class="sq ' + cls + '" data-trp="' + (it.k || "none") + '" width="200" height="200"></canvas>';
  return vis0 ? vis0(it, cls) : "";
};
function rnd(i, s){ var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }
var PAL = ["#ff4f7a", "#5ee6ff", "#ffd23b", "#5ee6a8", "#b266ff", "#ffffff"];
function ball(g, x, y, r){
  g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = "#1b1b22"; g.lineWidth = Math.max(1, r * 0.12); g.stroke();
  g.fillStyle = "#1b1b22"; g.beginPath(); g.arc(x, y, r * 0.34, 0, TAU); g.fill();
}
function bg(g, w, h){ var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#1b2a6b"); gr.addColorStop(1, "#0b0d24"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
function goal(g, w, h){
  var x0 = w * 0.2, x1 = w * 0.8, y0 = h * 0.42, y1 = h * 0.86, i;
  g.fillStyle = "#1f7a3a"; g.fillRect(0, y1, w, h - y1);
  g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1;
  for (i = 1; i < 8; i++) { g.beginPath(); g.moveTo(x0 + (x1 - x0) * i / 8, y0); g.lineTo(x0 + (x1 - x0) * i / 8, y1); g.stroke(); }
  for (i = 1; i < 5; i++) { g.beginPath(); g.moveTo(x0, y0 + (y1 - y0) * i / 5); g.lineTo(x1, y0 + (y1 - y0) * i / 5); g.stroke(); }
  g.strokeStyle = "#fff"; g.lineWidth = 4; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.lineTo(x1, y1); g.stroke();
}
// ---- goal celebrations: the ball goes in, then the effect plays ----
var FX = {
  confetti: function(g, w, h, u, cx, cy){ for (var i = 0; i < 46; i++) { var a = rnd(i, 1) * TAU, sp = 40 + rnd(i, 2) * 70, x = cx + Math.cos(a) * sp * u * 1.4, y = cy - Math.abs(Math.sin(a)) * sp * u * 1.6 + 120 * u * u; g.save(); g.translate(x, y); g.rotate(u * 12 + i); g.fillStyle = PAL[i % 5]; g.fillRect(-4, -2, 8, 4); g.restore(); } },
  shock: function(g, w, h, u, cx, cy){ for (var k = 0; k < 3; k++) { var v = u * 1.4 - k * 0.18; if (v <= 0) continue; g.strokeStyle = "rgba(160,210,255," + Math.max(0, 1 - v) + ")"; g.lineWidth = 6 * (1 - v) + 1; g.beginPath(); g.ellipse(cx, cy, v * 110, v * 60, 0, 0, TAU); g.stroke(); } },
  ink: function(g, w, h, u, cx, cy){ for (var i = 0; i < 9; i++) { var a = rnd(i, 3) * TAU, d = 20 + rnd(i, 4) * 60, r = (8 + rnd(i, 5) * 18) * Math.min(1, u * 3); g.fillStyle = PAL[i % 5]; g.globalAlpha = 0.9 - u * 0.5; g.beginPath(); g.arc(cx + Math.cos(a) * d * Math.min(1, u * 2.5), cy + Math.sin(a) * d * 0.6 * Math.min(1, u * 2.5), r, 0, TAU); g.fill(); } g.globalAlpha = 1; },
  firework: function(g, w, h, u, cx, cy){ [[0.3, 0.3, 0], [0.7, 0.25, 0.2], [0.5, 0.18, 0.4]].forEach(function(f, k){ var v = (u - f[2]) * 1.6; if (v <= 0 || v > 1) return; for (var i = 0; i < 18; i++) { var a = i / 18 * TAU; g.fillStyle = PAL[(i + k) % 5]; g.globalAlpha = 1 - v; g.beginPath(); g.arc(w * f[0] + Math.cos(a) * v * 50, h * f[1] + Math.sin(a) * v * 50 + v * v * 20, 2.6, 0, TAU); g.fill(); } }); g.globalAlpha = 1; },
  pixel: function(g, w, h, u, cx, cy){ for (var i = 0; i < 36; i++) { var a = rnd(i, 6) * TAU, d = u * (40 + rnd(i, 7) * 80); g.fillStyle = ["#3dff7a", "#5ee6ff", "#ff2fb3", "#ffd23b"][i % 4]; g.globalAlpha = 1 - u; g.fillRect(Math.round((cx + Math.cos(a) * d) / 6) * 6, Math.round((cy + Math.sin(a) * d * 0.7) / 6) * 6, 6, 6); } g.globalAlpha = 1; },
  bolt: function(g, w, h, u, cx, cy){ if (u < 0.5) { g.fillStyle = "rgba(255,246,168," + (0.5 - u) + ")"; g.fillRect(0, 0, w, h); } var x = cx, y = 0, i; g.strokeStyle = "#fff6a8"; g.lineWidth = 4 * (1 - u) + 1; g.beginPath(); g.moveTo(x, y); for (i = 1; i <= 7; i++) { x = cx + (rnd(i, Math.floor(u * 8)) - 0.5) * 40; y = cy * i / 7; g.lineTo(x, y); } g.stroke(); },
  gold: function(g, w, h, u, cx, cy){ for (var i = 0; i < 22; i++) { var x = rnd(i, 8) * w, y = -20 + ((u * 1.3 + rnd(i, 9)) % 1) * (h + 30); g.fillStyle = "#ffd23b"; g.strokeStyle = "#a8780b"; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, 7 * Math.abs(Math.cos(u * 9 + i)) + 1.5, 7, 0, 0, TAU); g.fill(); g.stroke(); } },
  hole: function(g, w, h, u, cx, cy){ var gr = g.createRadialGradient(cx, cy, 0, cx, cy, 40 * u + 4); gr.addColorStop(0, "#000"); gr.addColorStop(1, "rgba(80,20,140,0)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 44 * u + 4, 0, TAU); g.fill(); for (var i = 0; i < 30; i++) { var a = rnd(i, 10) * TAU + u * 6, d = (1 - u) * (30 + rnd(i, 11) * 80); g.fillStyle = "#b266ff"; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 2.2, 0, TAU); g.fill(); } },
  ripple: function(g, w, h, u, cx, cy){ for (var k = 0; k < 4; k++) { var v = u * 1.3 - k * 0.15; if (v <= 0) continue; g.strokeStyle = "rgba(94,230,255," + Math.max(0, 0.9 - v) + ")"; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy + 20, v * 90, v * 30, 0, 0, TAU); g.stroke(); } },
  snow: function(g, w, h, u, cx, cy){ for (var i = 0; i < 34; i++) { var x = rnd(i, 12) * w + Math.sin(u * 6 + i) * 8, y = ((u + rnd(i, 13)) % 1) * h; g.fillStyle = "#fff"; g.globalAlpha = 0.85; g.beginPath(); g.arc(x, y, 1.5 + rnd(i, 14) * 2.5, 0, TAU); g.fill(); } g.globalAlpha = 1; },
  laser: function(g, w, h, u, cx, cy){ for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + (i - 2.5) * 0.35 + Math.sin(u * 8 + i) * 0.25; g.strokeStyle = ["#ff2fb3", "#5ee6ff", "#3dff7a"][i % 3]; g.globalAlpha = 0.8 * (1 - u * 0.6); g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200); g.stroke(); } g.globalAlpha = 1; },
  volcano: function(g, w, h, u, cx, cy){ for (var i = 0; i < 30; i++) { var a = -Math.PI / 2 + (rnd(i, 15) - 0.5) * 1.2, sp = 60 + rnd(i, 16) * 90, x = cx + Math.cos(a) * sp * u, y = cy + Math.sin(a) * sp * u + 140 * u * u; g.fillStyle = i % 3 ? "#ff5a1f" : "#ffd23b"; g.beginPath(); g.arc(x, y, 3 + rnd(i, 17) * 3, 0, TAU); g.fill(); } },
  starfall: function(g, w, h, u, cx, cy){ for (var i = 0; i < 12; i++) { var p = (u * 1.2 + rnd(i, 18)) % 1, x = rnd(i, 19) * w + p * 60 - 30, y = p * h; g.strokeStyle = "rgba(255,246,200," + (1 - p) + ")"; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 18, y - 18); g.stroke(); g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(x, y, 2.5, 0, TAU); g.fill(); } },
  aurora: function(g, w, h, u, cx, cy){ for (var k = 0; k < 3; k++) { g.strokeStyle = ["rgba(61,255,170,.5)", "rgba(178,102,255,.45)", "rgba(94,230,255,.4)"][k]; g.lineWidth = 10; g.beginPath(); for (var x = 0; x <= w; x += 8) { var y = h * 0.22 + k * 14 + Math.sin(x * 0.04 + u * 6 + k) * 12; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); } },
  nova: function(g, w, h, u, cx, cy){ var r = 10 + u * 70; g.fillStyle = "rgba(255,255,255," + (1 - u) + ")"; g.beginPath(); g.arc(cx, cy, r * 0.4, 0, TAU); g.fill(); for (var i = 0; i < 12; i++) { var a = i / 12 * TAU + u; g.strokeStyle = "rgba(255,210,59," + (1 - u) + ")"; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5); g.lineTo(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3); g.stroke(); } }
};
function drawFx(c, t){
  var g = c.getContext("2d"), w = c.width, h = c.height, k = c.dataset.fxp, cy = h * 0.62, cx = w / 2, p = t % 2.6, u;
  bg(g, w, h); goal(g, w, h);
  if (p < 0.6) { u = p / 0.6; ball(g, w * 0.5 + (1 - u) * 20, h * 1.05 - u * (h * 1.05 - cy), 9 + (1 - u) * 6); return; }
  ball(g, cx, cy + 6, 9);
  u = Math.min(1, (p - 0.6) / 1.6);
  (FX[k] || FX.confetti)(g, w, h, u, cx, cy);
}
// ---- ball trails: a ball looping round with its trail behind it ----
var TR = {dust: "#c8a27a", line: "#ffffff", spark: "#ffd23b", pixel: "#3dff7a", flame: "#ff6a2b", ice: "#9fe8ff", bolt: "#fff6a8", star: "#fff6c8", void: "#6a2bb8", bubble: "#9fe8ff", leaf: "#5ecf6a", toxic: "#9dff3b", gold: "#ffd23b", comet: "#cfe2ff", nebula: "#ff7ab8"};
function pos(t){ return {x: 100 + Math.sin(t * 1.6) * 62, y: 100 + Math.sin(t * 3.2) * 34}; }
function drawTrail(c, t){
  var g = c.getContext("2d"), w = c.width, h = c.height, k = c.dataset.trp, n = 26, i, a, b, u, col = TR[k] || "#fff";
  bg(g, w, h); g.fillStyle = "#1f7a3a"; g.fillRect(0, h * 0.86, w, h);
  g.save(); g.scale(w / 200, h / 200);
  if (k !== "none") for (i = n; i > 0; i--) {
    a = pos(t - i * 0.03); b = pos(t - (i - 1) * 0.03); u = 1 - i / n;
    if (k === "bolt") { b.x += (Math.random() - 0.5) * 8 * (1 - u); b.y += (Math.random() - 0.5) * 8 * (1 - u); }
    var cc = k === "rainbow" || k === "prism" ? "hsl(" + Math.round((i * 22 + t * 300) % 360) + ",95%,62%)" : k === "flame" ? (u > 0.6 ? "#ffd23b" : u > 0.3 ? "#ff6a2b" : "#b81f0a") : col;
    if (k === "dust" || k === "spark" || k === "star" || k === "bubble" || k === "leaf" || k === "gold" || k === "pixel") {
      g.globalAlpha = u; g.fillStyle = cc; g.strokeStyle = cc;
      if (k === "pixel") g.fillRect(a.x - 3, a.y - 3 + (i % 3), 6, 6);
      else if (k === "bubble") { g.lineWidth = 1.5; g.beginPath(); g.arc(a.x, a.y - i * 0.6, 2 + u * 4, 0, TAU); g.stroke(); }
      else { g.beginPath(); g.arc(a.x + (rnd(i, 1) - 0.5) * 8, a.y + (rnd(i, 2) - 0.5) * 8, k === "dust" ? 3.5 * u : 2.2, 0, TAU); g.fill(); }
    } else {
      g.globalAlpha = u * 0.9; g.strokeStyle = cc; g.lineCap = "round"; g.lineWidth = (k === "bolt" ? 3 : 10) * u + 1;
      if (k === "void" || k === "nebula" || k === "toxic") { g.shadowColor = cc; g.shadowBlur = 10; }
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.shadowBlur = 0;
    }
  }
  g.globalAlpha = 1; a = pos(t); ball(g, a.x, a.y, 9);
  g.restore();
}
// one loop draws every preview on screen
var on = 0;
function tick(){
  var cs = document.querySelectorAll("canvas[data-fxp],canvas[data-trp]"), t = performance.now() / 1000;
  if (!cs.length) { on = 0; return; }
  for (var i = 0; i < cs.length; i++) { var c = cs[i]; if (!c.offsetParent) continue; if (c.dataset.fxp) drawFx(c, t + i * 0.37); else drawTrail(c, t + i * 0.37); }
  requestAnimationFrame(tick);
}
setInterval(function(){ if (!on && document.querySelector("canvas[data-fxp],canvas[data-trp]")) { on = 1; requestAnimationFrame(tick); } }, 400);
})();
