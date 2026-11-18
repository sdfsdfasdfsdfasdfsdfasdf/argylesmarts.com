// MEGS renderer: camera, cage, goal and net, players, ball, trails and particles. Draws a Match on a 2D canvas.
(function(){
"use strict";
var MG = window.MG, K = MG.K, W = K.W, D = K.D, GW = K.GW, GH = K.GH, GD = K.GD, ARC = K.ARC, BR = K.BR, PI = Math.PI, TAU = PI * 2;
var clamp = MG.clamp, lerp = MG.lerp, hyp = MG.hyp, R = MG.R = {}, TEX = {}, OUT = "rgba(8,9,22,.66)", VR = 0.17, FONT = "system-ui,-apple-system,Segoe UI,sans-serif";
var ARCP = [], BOX = [-3.2, 0, 0, -3.2, 2.4, 0, 3.2, 2.4, 0, 3.2, 0, 0], i0;
for (i0 = 0; i0 <= 36; i0++) ARCP.push(Math.cos(i0 * PI / 36) * ARC, Math.sin(i0 * PI / 36) * ARC, 0);

var COURTS = R.COURTS = {
  street: {sky: ["#141a3a", "#3d3566", "#d9785a"], far: "#10132b", win: "#ffd98a", floor: ["#434b69", "#3c4460"], in1: "rgba(255,255,255,.04)", line: "#eef0fa", board: "#262b4a", trim: "#3b6ef5", rail: "#9aa0c0", mesh: "rgba(190,198,230,.13)", lamp: "#fff1c9", night: 0.5},
  turf: {sky: ["#2f8fe6", "#86c8ff", "#e4f5ff"], far: "#2a6a45", win: "", floor: ["#33a35c", "#2c9653"], in1: "rgba(255,255,255,.06)", line: "#ffffff", board: "#1e5a3c", trim: "#ffd23b", rail: "#eef4ff", mesh: "rgba(255,255,255,.16)", lamp: "", night: 0, hill: 1},
  neon: {sky: ["#04020d", "#120830", "#3b0f5c"], far: "#090516", win: "#5ee6ff", floor: ["#130d2e", "#181138"], in1: "rgba(94,230,255,.05)", line: "#5ee6ff", board: "#1b0e36", trim: "#ff4fd8", rail: "#ff4fd8", mesh: "rgba(255,79,216,.14)", lamp: "#ff4fd8", night: 1, glow: 1},
  sunset: {sky: ["#3a1d5c", "#f0703c", "#ffd58a"], far: "#371827", win: "#ffe6a8", floor: ["#b85c3e", "#ab5237"], in1: "rgba(255,240,200,.06)", line: "#fff1d0", board: "#5c2b2b", trim: "#ffd58a", rail: "#ffd58a", mesh: "rgba(255,230,170,.15)", lamp: "#ffe6a8", night: 0.25, sun: 1},
  gym: {sky: ["#3a2d22", "#5a4633", "#7a6248"], far: "#2a2018", win: "", floor: ["#c98f4f", "#bf8545"], in1: "rgba(255,255,255,.07)", line: "#ffffff", board: "#2b4fb8", trim: "#ffd23b", rail: "#d9dbe6", mesh: "rgba(255,255,255,.1)", lamp: "#fff6d6", night: 0},
  beach: {sky: ["#1f8fe6", "#7fd0ff", "#fff1c9"], far: "#1f6fb0", win: "", floor: ["#e8cf96", "#dfc489"], in1: "rgba(255,255,255,.1)", line: "#ffffff", board: "#0e7490", trim: "#ff8a3d", rail: "#ffffff", mesh: "rgba(255,255,255,.16)", lamp: "", night: 0, sun: 1},
  snow: {sky: ["#0d1f3d", "#27507a", "#9fd0ff"], far: "#16304f", win: "#bfe9ff", floor: ["#e6f1fb", "#d9e8f6"], in1: "rgba(90,169,230,.1)", line: "#3b6ef5", board: "#1f3a5a", trim: "#7fd0ff", rail: "#bfe9ff", mesh: "rgba(191,233,255,.18)", lamp: "#eaf6ff", night: 0.8},
  lava: {sky: ["#120403", "#4a0f08", "#ff5a1f"], far: "#1a0603", win: "#ff7a1f", floor: ["#2b2422", "#241e1c"], in1: "rgba(255,90,31,.08)", line: "#ff8a3d", board: "#1a0d0a", trim: "#ff5a1f", rail: "#8a4a3a", mesh: "rgba(255,122,31,.12)", lamp: "#ff7a1f", night: 0.2, glow: 1},
  space: {sky: ["#000004", "#05061a", "#10123a"], far: "#3a3d4f", win: "", floor: ["#8a8d9c", "#80838f"], in1: "rgba(255,255,255,.06)", line: "#f4f6ff", board: "#2a2d3d", trim: "#5ee6ff", rail: "#c9cde6", mesh: "rgba(200,210,255,.1)", lamp: "#bfe9ff", night: 1.6},
  gold: {sky: ["#1a1005", "#4a3208", "#b8860b"], far: "#241803", win: "#ffe6a8", floor: ["#d9a93a", "#cf9f31"], in1: "rgba(255,255,255,.12)", line: "#fff6c2", board: "#3d2c05", trim: "#fff3b0", rail: "#ffd766", mesh: "rgba(255,215,102,.16)", lamp: "#fff3b0", night: 0.3},
  cloud: {sky: ["#7fa8ff", "#ffc9e6", "#fff6d6"], far: "#ffffff", win: "", floor: ["#f4f6ff", "#e9ecfb"], in1: "rgba(255,122,184,.1)", line: "#ff7ab8", board: "#b9a6ff", trim: "#ffffff", rail: "#ffffff", mesh: "rgba(255,255,255,.3)", lamp: "", night: 0, hill: 1, hill2: "#ffe3f1"},
  roof: {sky: ["#1a1030", "#5a2a5c", "#ff9a5a"], far: "#120b22", win: "#ffd98a", floor: ["#5a5d6e", "#535665"], in1: "rgba(255,255,255,.06)", line: "#ffe6a8", board: "#2a1f3d", trim: "#ff7ab8", rail: "#c9b6e6", mesh: "rgba(255,200,220,.12)", lamp: "#ffe6c2", night: 0.5, sun: 1},
  jungle: {sky: ["#0c3a2a", "#2f8a5a", "#c9f2a8"], far: "#0a2a1c", win: "", floor: ["#6a4a2a", "#614324"], in1: "rgba(94,230,168,.08)", line: "#eaffd6", board: "#143d24", trim: "#a6ff3b", rail: "#7a5a32", mesh: "rgba(160,255,160,.12)", lamp: "", night: 0, hill: 1, hill2: "#1f6a3d"},
  storm: {sky: ["#0a0d18", "#232a40", "#5a6a8a"], far: "#0c1020", win: "#9fd0ff", floor: ["#30364a", "#2a3042"], in1: "rgba(159,208,255,.07)", line: "#bfe0ff", board: "#161b2c", trim: "#ffe66b", rail: "#7a86a8", mesh: "rgba(190,220,255,.12)", lamp: "#eaf6ff", night: 0.9, glow: 1},
  candy: {sky: ["#ff8ad1", "#ffc2e6", "#fff0b8"], far: "#ff6fb8", win: "", floor: ["#ffe0f0", "#ffd2e8"], in1: "rgba(255,255,255,.25)", line: "#ff4f9a", board: "#7a3dff", trim: "#5ee6ff", rail: "#ffffff", mesh: "rgba(255,255,255,.3)", lamp: "", night: 0, hill: 1, hill2: "#b9f2c9"},
  desert: {sky: ["#3a1a4a", "#d9623a", "#ffd28a"], far: "#5a2a2a", win: "", floor: ["#d9a066", "#cf965c"], in1: "rgba(255,255,255,.08)", line: "#fff3d6", board: "#6b3a1f", trim: "#38e1ff", rail: "#f2d0a0", mesh: "rgba(255,230,190,.14)", lamp: "", night: 0.2, sun: 1, hill: 1, hill2: "#b8703d"},
  abyss: {sky: ["#00040c", "#031a33", "#0a4a6a"], far: "#02101f", win: "#38e1ff", floor: ["#0c2a3d", "#0a2536"], in1: "rgba(56,225,255,.08)", line: "#38e1ff", board: "#04131f", trim: "#5ee6a8", rail: "#1f5a7a", mesh: "rgba(56,225,255,.14)", lamp: "#7fe9ff", night: 1.1, glow: 1}
};

function hash(s){ var h = 2166136261, i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function lum(c){ var n = parseInt(c.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
function mid(a, b, t){ return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)}; }
function dia(x, cx, cy, hw, hh){ x.beginPath(); x.moveTo(cx, cy - hh); x.lineTo(cx + hw, cy); x.lineTo(cx, cy + hh); x.lineTo(cx - hw, cy); x.fill(); }
function star(x, cx, cy, r, n, rot){ var i, a, q; x.beginPath(); for (i = 0; i < n * 2; i++) { a = rot - PI / 2 + i * PI / n; q = i & 1 ? r * (n === 4 ? 0.3 : 0.45) : r; x.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } x.closePath(); x.fill(); }
function flake(x, cx, cy, r){ var i, a; x.beginPath(); for (i = 0; i < 3; i++) { a = i * PI / 3; x.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.stroke(); }
function crown(x, cx, cy, s){ x.beginPath(); x.moveTo(cx - s, cy + s * 0.6); x.lineTo(cx - s, cy - s * 0.5); x.lineTo(cx - s * 0.45, cy); x.lineTo(cx, cy - s * 0.8); x.lineTo(cx + s * 0.45, cy); x.lineTo(cx + s, cy - s * 0.5); x.lineTo(cx + s, cy + s * 0.6); x.closePath(); x.fill(); }

// ---- kit textures: one small canvas per shirt, front and back ----
R.BASIC = ["solid", "stripes", "hoops", "sash", "halves", "checker", "fade", "chevron"];
function kitTex(it, back, num, cus){
  var p = it.p, col = it.c, w = 80, h = 100, key, c, x, r, i, j, k, a, b, g, big;
  if (p === "custom") { cus = cus || {p: "solid", c: col}; p = cus.p; col = cus.c; }
  key = it.id + (back ? "b" : "f") + num + (it.p === "custom" ? p + col.join("") : "");
  if (TEX[key]) return TEX[key];
  c = document.createElement("canvas"); c.width = w; c.height = h; x = c.getContext("2d"); r = MG.rng(hash(it.id));
  x.fillStyle = col[0]; x.fillRect(0, 0, w, h); x.fillStyle = x.strokeStyle = col[1];
  if (p === "stripes") for (i = 0; i < 5; i++) x.fillRect(8 + i * 16, 0, 8, h);
  else if (p === "hoops") for (i = 0; i < 5; i++) x.fillRect(0, 8 + i * 20, w, 10);
  else if (p === "sash") { x.beginPath(); x.moveTo(0, 0); x.lineTo(26, 0); x.lineTo(w, 70); x.lineTo(w, h); x.lineTo(54, h); x.lineTo(0, 30); x.fill(); }
  else if (p === "halves") x.fillRect(w / 2, 0, w / 2, h);
  else if (p === "checker") { for (i = 0; i < 4; i++) for (j = 0; j < 5; j++) if ((i + j) & 1) x.fillRect(i * 20, j * 20, 20, 20); }
  else if (p === "chevron") { for (i = 0; i < 2; i++) { j = 16 + i * 30; x.beginPath(); x.moveTo(0, j); x.lineTo(40, j + 28); x.lineTo(w, j); x.lineTo(w, j + 13); x.lineTo(40, j + 41); x.lineTo(0, j + 13); x.fill(); } }
  else if (p === "fade" || p === "holo" || p === "gold" || p === "frost") {
    g = x.createLinearGradient(0, 0, p === "fade" || p === "frost" ? 0 : w, h);
    if (p === "holo") ["#7fd0ff", "#b9a6ff", "#ff7ab8", "#ffd98a", "#7fffd4"].forEach(function(s, k){ g.addColorStop(k / 4, s); });
    else if (p === "gold") { g.addColorStop(0, "#fff6c2"); g.addColorStop(0.35, col[0]); g.addColorStop(0.7, col[1]); g.addColorStop(1, col[0]); }
    else { g.addColorStop(0, col[0]); g.addColorStop(1, col[1]); }
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    if (p === "frost") { x.strokeStyle = "rgba(255,255,255,.75)"; x.lineWidth = 1.5; for (i = 0; i < 7; i++) flake(x, r() * w, r() * h, 5 + r() * 7); }
    if (p === "gold") { x.fillStyle = "rgba(255,255,255,.85)"; for (i = 0; i < 9; i++) star(x, r() * w, r() * h, 2 + r() * 3, 4, 0); }
  }
  else if (p === "argyle") {
    for (j = -1; j < 7; j++) for (i = -1; i < 4; i++) { x.globalAlpha = (i + j) & 1 ? 1 : 0.45; dia(x, i * 27 + (j & 1 ? 13.5 : 0) + 13, j * 17 + 8, 13.5, 17); }
    x.globalAlpha = 1; x.strokeStyle = "rgba(255,255,255,.5)"; x.lineWidth = 1; x.setLineDash([3, 3]);
    for (i = -6; i < 8; i++) { x.beginPath(); x.moveTo(i * 27, 0); x.lineTo(i * 27 + 79.4, h); x.moveTo(i * 27 + 79.4, 0); x.lineTo(i * 27, h); x.stroke(); }
  }
  else if (p === "tiger") { for (i = 0; i < 7; i++) { j = i * 15 + 4; a = i & 1; b = 44 + r() * 10; x.beginPath(); x.moveTo(a ? w : 0, j - 5); x.quadraticCurveTo(a ? w - 28 : 28, j - 3, a ? w - b : b, j + 5); x.quadraticCurveTo(a ? w - 26 : 26, j + 6, a ? w : 0, j + 8); x.fill(); } }
  else if (p === "camo") { for (i = 0; i < 16; i++) { x.fillStyle = i & 1 ? col[1] : col[2]; x.beginPath(); x.ellipse(r() * w, r() * h, 7 + r() * 11, 5 + r() * 7, r() * 3, 0, TAU); x.fill(); } }
  else if (p === "pixel") { for (i = 0; i < 8; i++) for (j = 0; j < 10; j++) if (r() < 0.42) { x.globalAlpha = 0.45 + r() * 0.55; x.fillRect(i * 10, j * 10, 10, 10); } }
  else if (p === "tiedye") { g = x.createRadialGradient(40, 46, 2, 40, 46, 72); [col[1], col[0], col[2], col[1], col[0]].forEach(function(s, k){ g.addColorStop(k / 4, s); }); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  else if (p === "neon") { x.lineWidth = 1.6; x.shadowColor = col[1]; x.shadowBlur = 7; for (i = 0; i <= 5; i++) { x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16, h); x.moveTo(0, i * 20); x.lineTo(w, i * 20); x.stroke(); } }
  else if (p === "lava") { x.lineWidth = 3; x.shadowColor = col[1]; x.shadowBlur = 8; for (i = 0; i < 6; i++) { a = r() * w; b = -6; x.beginPath(); x.moveTo(a, b); for (j = 0; j < 5; j++) { a += (r() - 0.5) * 34; b += 14 + r() * 14; x.lineTo(a, b); } x.stroke(); } }
  else if (p === "galaxy") {
    for (i = 0; i < 3; i++) { a = r() * w; b = r() * h; g = x.createRadialGradient(a, b, 1, a, b, 34); g.addColorStop(0, col[1]); g.addColorStop(1, "rgba(0,0,0,0)"); x.globalAlpha = 0.55; x.fillStyle = g; x.fillRect(0, 0, w, h); }
    x.fillStyle = "#fff"; for (i = 0; i < 26; i++) { x.globalAlpha = 0.4 + r() * 0.6; x.fillRect(r() * w, r() * h, 1.6, 1.6); }
  }
  else if (p === "glitch") { for (i = 0; i < 12; i++) { x.fillStyle = i & 1 ? col[1] : col[2]; x.globalAlpha = 0.55 + r() * 0.45; x.fillRect(r() * w - 10, r() * h, 14 + r() * 40, 2 + r() * 6); } }
  else if (p === "void") {
    g = x.createRadialGradient(40, 50, 3, 40, 50, 60); g.addColorStop(0, col[1]); g.addColorStop(0.45, "rgba(60,20,120,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.lineWidth = 1.5; for (i = 0; i < 4; i++) { x.globalAlpha = 0.6 - i * 0.12; x.beginPath(); x.arc(40, 50, 10 + i * 9, i * 1.3, i * 1.3 + 3.6); x.stroke(); }
  }
  else if (p === "nova") {
    g = x.createRadialGradient(40, 48, 2, 40, 48, 66); g.addColorStop(0, "#ffffff"); g.addColorStop(0.3, col[0]); g.addColorStop(0.65, col[1]); g.addColorStop(1, col[2]); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(255,255,255,.5)"; x.lineWidth = 1.2; for (i = 0; i < 14; i++) { a = i * TAU / 14; x.beginPath(); x.moveTo(40 + Math.cos(a) * 12, 48 + Math.sin(a) * 12); x.lineTo(40 + Math.cos(a) * 70, 48 + Math.sin(a) * 70); x.stroke(); }
  }
  else if (p === "pinstripe") for (i = 0; i < 10; i++) x.fillRect(4 + i * 8, 0, 1.6, h);
  else if (p === "dots") { for (i = 0; i < 6; i++) for (j = 0; j < 8; j++) { x.beginPath(); x.arc(7 + i * 14 + (j & 1 ? 7 : 0), 6 + j * 13, 3.2, 0, TAU); x.fill(); } }
  else if (p === "quarters") { x.fillRect(w / 2, 0, w / 2, h / 2); x.fillRect(0, h / 2, w / 2, h / 2); }
  else if (p === "zigzag") { x.lineWidth = 5; for (j = 0; j < 5; j++) { x.beginPath(); for (i = 0; i <= 8; i++) x.lineTo(i * 10, 12 + j * 20 + (i & 1 ? 8 : 0)); x.stroke(); } }
  else if (p === "wave") { for (j = 0; j < 5; j++) { x.fillStyle = j & 1 ? col[2] : col[1]; x.globalAlpha = 0.75; x.beginPath(); x.moveTo(0, h); for (i = 0; i <= 8; i++) x.lineTo(i * 10, 14 + j * 19 + 7 * Math.sin(i * 0.9 + j * 1.7)); x.lineTo(w, h); x.fill(); } }
  else if (p === "leopard") { for (i = 0; i < 22; i++) { a = r() * w; b = r() * h; x.globalAlpha = 1; x.lineWidth = 2.4; x.beginPath(); x.arc(a, b, 4 + r() * 2.5, r() * 6, r() * 6 + 4.2); x.stroke(); x.globalAlpha = 0.35; x.beginPath(); x.arc(a, b, 2.4, 0, TAU); x.fill(); } }
  else if (p === "brush") { x.lineCap = "round"; for (i = 0; i < 7; i++) { x.globalAlpha = 0.5 + r() * 0.5; x.lineWidth = 5 + r() * 7; a = r() * h; x.beginPath(); x.moveTo(-5, a + 16); x.lineTo(w + 5, a - 16 + r() * 10); x.stroke(); } }
  else if (p === "plaid") { x.globalAlpha = 0.5; for (i = 0; i < 3; i++) { x.fillRect(8 + i * 28, 0, 9, h); x.fillRect(0, 10 + i * 34, w, 9); } x.globalAlpha = 0.9; x.fillStyle = "#ffffff"; for (i = 0; i < 3; i++) { x.fillRect(21 + i * 28, 0, 1.4, h); x.fillRect(0, 24 + i * 34, w, 1.4); } }
  else if (p === "flames") { for (k = 0; k < 2; k++) { x.fillStyle = k ? "#ffd23b" : col[1]; x.beginPath(); x.moveTo(0, h); for (i = 0; i <= 8; i++) x.lineTo(i * 10, h - (k ? 14 : 32) - (i & 1 ? (k ? 16 : 30) : 0) - r() * 8); x.lineTo(w, h); x.fill(); } }
  else if (p === "circuit") { x.lineWidth = 1.6; x.shadowColor = col[1]; x.shadowBlur = 5; for (i = 0; i < 9; i++) { a = 6 + Math.floor(r() * 7) * 11; b = r() * 70; j = 10 + r() * 26; x.beginPath(); x.moveTo(a, b); x.lineTo(a, b + j); x.lineTo(a + (r() < 0.5 ? 11 : -11), b + j + 11); x.stroke(); x.beginPath(); x.arc(a, b, 2.2, 0, TAU); x.fill(); } }
  else if (p === "prism") ["#ff4f7a", "#ffb938", "#ffe66b", "#5ee6a8", "#5ee6ff", "#7a8cff", "#b266ff"].forEach(function(s, n){ x.fillStyle = s; x.beginPath(); x.moveTo(n * 14 - 30, h); x.lineTo(n * 14 + 20, 0); x.lineTo(n * 14 + 34, 0); x.lineTo(n * 14 - 16, h); x.fill(); });
  else if (p === "scales") { x.lineWidth = 1.6; for (j = 0; j < 9; j++) for (i = -1; i < 6; i++) { x.globalAlpha = 0.35 + 0.65 * r(); x.beginPath(); x.arc(i * 16 + (j & 1 ? 8 : 0) + 8, j * 12, 8, 0, PI); x.stroke(); } }
  else if (p === "chrome") { g = x.createLinearGradient(0, 0, w * 0.6, h); [col[0], "#ffffff", col[1], col[0], col[2], col[0], "#ffffff", col[1]].forEach(function(s, n){ g.addColorStop(n / 7, s); }); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  else if (p === "toxic") { x.shadowColor = col[1]; x.shadowBlur = 6; for (i = 0; i < 8; i++) { a = 5 + i * 10; b = 14 + r() * 46; x.beginPath(); x.moveTo(a - 5, 0); x.lineTo(a + 5, 0); x.lineTo(a + 3.2, b); x.arc(a, b, 3.2, 0, PI); x.lineTo(a - 3.2, 0); x.fill(); } }
  else if (p === "sakura") { g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, col[0]); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = col[1]; for (i = 0; i < 16; i++) { x.globalAlpha = 0.5 + r() * 0.5; x.beginPath(); x.ellipse(r() * w, r() * h, 4.5, 2.4, r() * 3, 0, TAU); x.fill(); } }
  else if (p === "bolt") { x.shadowColor = col[1]; x.shadowBlur = 8; x.beginPath(); x.moveTo(52, 0); x.lineTo(28, 44); x.lineTo(42, 44); x.lineTo(22, 100); x.lineTo(60, 36); x.lineTo(45, 36); x.lineTo(66, 0); x.fill(); x.shadowBlur = 0; x.fillRect(0, 0, w, 5); }
  else if (p === "shark") { g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, col[0]); g.addColorStop(0.5, col[0]); g.addColorStop(0.62, col[1]); g.addColorStop(1, col[1]); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = "#ffffff"; for (i = 0; i < 9; i++) { x.beginPath(); x.moveTo(i * 9 + 1, 50); x.lineTo(i * 9 + 5.500, 60); x.lineTo(i * 9 + 10, 50); x.fill(); } x.fillStyle = "#b3202e"; x.fillRect(0, 46, w, 4); x.fillStyle = "rgba(10,20,30,.5)"; for (i = 0; i < 3; i++) x.fillRect(8 + (big ? 0 : 0), 14 + i * 8, 14, 2.500); }
  else if (p === "plate") { g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, col[0]); g.addColorStop(0.5, "#eef2fa"); g.addColorStop(1, col[0]); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = col[2]; x.lineWidth = 1.6; x.strokeRect(8, 10, 64, 34); x.strokeRect(14, 50, 52, 40); x.fillStyle = col[1]; x.shadowColor = col[1]; x.shadowBlur = 8; x.beginPath(); x.arc(40, 27, 7, 0, TAU); x.fill(); x.shadowBlur = 0; x.fillStyle = col[2]; for (i = 0; i < 4; i++) { x.beginPath(); x.arc(11 + (i & 1) * 58, 13 + (i >> 1) * 28, 1.600, 0, TAU); x.fill(); } }
  else if (p === "carbon") { for (j = 0; j < 25; j++) for (i = 0; i < 20; i++) { x.globalAlpha = (i + j) & 1 ? 0.5 : 0.18; x.fillRect(i * 4, j * 4, 4, 2); x.globalAlpha = (i + j) & 1 ? 0.18 : 0.5; x.fillRect(i * 4, j * 4 + 2, 4, 2); } }
  else if (p === "marble") { x.lineCap = "round"; for (i = 0; i < 9; i++) { x.globalAlpha = 0.25 + r() * 0.55; x.lineWidth = 0.6 + r() * 2.2; x.strokeStyle = i % 3 ? col[1] : col[2]; x.beginPath(); a = r() * w; b = -5; x.moveTo(a, b); for (j = 0; j < 7; j++) { a += (r() - 0.5) * 26; b += 16; x.quadraticCurveTo(a + (r() - 0.5) * 20, b - 8, a, b); } x.stroke(); } }
  else if (p === "topo") { x.lineWidth = 1.2; for (k = 0; k < 3; k++) { a = r() * w; b = r() * h; for (i = 1; i < 9; i++) { x.globalAlpha = 0.65; x.beginPath(); for (j = 0; j <= 24; j++) { g = j / 24 * TAU; x.lineTo(a + Math.cos(g) * i * 6 * (1 + 0.25 * Math.sin(g * 3 + k)), b + Math.sin(g) * i * 5 * (1 + 0.2 * Math.cos(g * 2 + k))); } x.stroke(); } } }
  else if (p === "hex") { x.lineWidth = 1.4; for (j = 0; j < 9; j++) for (i = 0; i < 6; i++) { a = i * 15 + (j & 1 ? 7.5 : 0); b = j * 13; x.globalAlpha = 0.4 + 0.5 * r(); x.beginPath(); for (k = 0; k < 6; k++) x.lineTo(a + Math.cos(k * PI / 3) * 7.5, b + Math.sin(k * PI / 3) * 7.5); x.closePath(); x.stroke(); if (r() < 0.15) { x.globalAlpha = 0.5; x.fill(); } } }
  else if (p === "digi") { for (i = 0; i < 220; i++) { x.fillStyle = [col[1], col[2], col[0]][i % 3]; x.globalAlpha = 0.9; a = Math.floor(r() * 20) * 4; b = Math.floor(r() * 25) * 4; x.fillRect(a, b, 4 * (1 + Math.floor(r() * 2)), 4); } }
  else if (p === "crown") { x.fillRect(0, 0, w, 7); x.fillRect(0, h - 9, w, 9); if (!back) crown(x, 40, 46, 15); }
  else if (p === "n67") x.fillRect(0, h - 8, w, 8);
  x.globalAlpha = 1; x.shadowBlur = 0; x.setLineDash([]); x.lineCap = "butt";
  big = back || p === "n67"; a = lum(col[0]) > 0.6 ? "#17171c" : "#ffffff";
  // the tailoring every shirt shares: side panels, shoulder seams, a ribbed collar and a hem band
  x.fillStyle = "rgba(0,0,12,.16)"; x.fillRect(0, 22, 5, h); x.fillRect(w - 5, 22, 5, h);
  x.strokeStyle = "rgba(0,0,12,.22)"; x.lineWidth = 0.8; x.beginPath(); x.moveTo(5, 22); x.lineTo(5, h); x.moveTo(w - 5, 22); x.lineTo(w - 5, h); x.moveTo(0, 16); x.quadraticCurveTo(14, 10, 26, 2); x.moveTo(w, 16); x.quadraticCurveTo(w - 14, 10, w - 26, 2); x.stroke();
  x.fillStyle = col[1]; x.fillRect(0, h - 4, w, 4); x.fillStyle = "rgba(0,0,12,.25)"; x.fillRect(0, h - 4.6, w, 0.8);
  x.fillStyle = col[2] === col[0] ? col[1] : col[2]; x.beginPath();
  if (back) x.ellipse(40, 0, 14, 6, 0, 0, TAU); else { x.moveTo(25, 0); x.lineTo(40, 15); x.lineTo(55, 0); }
  x.fill(); x.fillStyle = col[1]; x.beginPath();
  if (back) x.ellipse(40, 0, 11, 3.6, 0, 0, TAU); else { x.moveTo(29, 0); x.lineTo(40, 11); x.lineTo(51, 0); }
  x.fill(); x.fillStyle = "rgba(20,14,12,.55)"; x.beginPath(); if (back) x.ellipse(40, 0, 8, 1.6, 0, 0, TAU); else { x.moveTo(33, 0); x.lineTo(40, 7); x.lineTo(47, 0); } x.fill();
  if (!back && p !== "n67") {   // a shield crest over the heart and a small maker's mark opposite
    x.fillStyle = a; x.beginPath(); x.moveTo(17, 23); x.lineTo(27, 23); x.lineTo(27, 30); x.quadraticCurveTo(27, 35, 22, 37); x.quadraticCurveTo(17, 35, 17, 30); x.closePath(); x.fill();
    x.fillStyle = col[1] === a ? col[0] : col[1]; x.beginPath(); x.moveTo(18.500, 24.500); x.lineTo(25.500, 24.500); x.lineTo(25.500, 30); x.quadraticCurveTo(25.500, 33.500, 22, 35); x.quadraticCurveTo(18.500, 33.500, 18.500, 30); x.closePath(); x.fill();
    x.fillStyle = a; x.fillRect(21.300, 26, 1.400, 7); x.fillRect(19.500, 28.500, 5, 1.300);
  }
  if (back) { x.fillStyle = a; x.globalAlpha = 0.85; x.font = "800 7px " + FONT; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("ARGYLE", 40, 24); x.globalAlpha = 1; }
  if (big || p !== "crown") {
    x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round"; x.font = "800 " + (big ? 40 : 15) + "px " + FONT;
    b = p === "n67" ? "67" : String(num); i = big ? 40 : 58; j = big ? 54 : 30;
    x.lineWidth = big ? 5 : 3; x.strokeStyle = a === "#ffffff" ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.6)"; x.strokeText(b, i, j);
    x.fillStyle = p === "n67" ? col[1] : a; x.fillText(b, i, j);
  }
  return TEX[key] = c;
}

// front, back and front again side by side, so any half of the shirt can be cut out as the player turns
function wrapTex(it, num, cus){
  var key = "w" + it.id + num + (it.p === "custom" && cus ? cus.p + cus.c.join("") : ""), c, x, f, b;
  if (TEX[key]) return TEX[key];
  c = document.createElement("canvas"); c.width = 240; c.height = 100; x = c.getContext("2d"); f = kitTex(it, 0, num, cus); b = kitTex(it, 1, num, cus);
  x.drawImage(f, 0, 0); x.drawImage(b, 80, 0); x.drawImage(f, 160, 0);
  return TEX[key] = c;
}

// ---- ball: twelve panel centres that really roll ----
function ico(){ var t = (1 + Math.sqrt(5)) / 2, n = Math.sqrt(1 + t * t), a = 1 / n, b = t / n, o = [], i, j; for (i = -1; i <= 1; i += 2) for (j = -1; j <= 1; j += 2) o.push([0, i * a, j * b], [i * a, j * b, 0], [i * b, 0, j * a]); return o; }
function spin(pts, wx, wy, wz, dt){
  var w = Math.sqrt(wx * wx + wy * wy + wz * wz), a = w * dt, c, s, i, p, d, x, y, z;
  if (a < 1e-5) return pts;
  wx /= w; wy /= w; wz /= w; c = Math.cos(a); s = Math.sin(a);
  for (i = 0; i < pts.length; i++) {
    p = pts[i]; x = p[0]; y = p[1]; z = p[2]; d = (wx * x + wy * y + wz * z) * (1 - c);
    p[0] = x * c + (wy * z - wz * y) * s + wx * d; p[1] = y * c + (wz * x - wx * z) * s + wy * d; p[2] = z * c + (wx * y - wy * x) * s + wz * d;
  }
  return pts;
}
function drawBall(g, x, y, r, it, pts, t, sn, cs){
  var c = it.c, s = it.s, i, p, f, u, v, q, gr;
  if (it.g) { gr = g.createRadialGradient(x, y, r * 0.6, x, y, r * 2.6); gr.addColorStop(0, it.g); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.55; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 2.6, 0, TAU); g.fill(); g.globalAlpha = 1; }
  g.fillStyle = OUT; g.beginPath(); g.arc(x, y, r + Math.max(1, r * 0.09), 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.fillStyle = c[0]; g.fillRect(x - r, y - r, r * 2, r * 2);
  if (s === 4) { gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, c[1]); gr.addColorStop(1, c[0]); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  else for (i = 0; i < 12; i++) {
    p = pts[i]; f = p[1] * cs + p[2] * sn;
    if (f < -0.34) continue;
    // a mark turning away is squeezed towards the edge and cut off by the outline, the way a real panel goes round the back
    u = p[0] * r; v = -(p[2] * cs - p[1] * sn) * r; q = r * (s === 1 ? 0.56 : 0.36);
    g.save(); g.translate(x + u, y + v); g.rotate(Math.atan2(v, u)); g.scale(f < 0.1 ? Math.max(0.03, (f + 0.34) * 0.43) : f, 1);
    g.fillStyle = s === 1 ? c[1 + i % 3] : c[1];
    if (s === 2) { if (i % 3 === 0) star(g, 0, 0, q * 1.5, 5, 0); }
    else if (s === 3) dia(g, 0, 0, q * 0.75, q * 1.1);
    else if (s === 5) g.fillRect(-q * 0.55, -q * 0.55, q * 1.1, q * 1.1);
    else if (s === 6) { g.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * 4 + i * 2.1)); g.fillRect(-q * 0.5, -q * 0.5, q, q); g.globalAlpha = 1; }
    else { g.beginPath(); g.arc(0, 0, q, 0, TAU); g.fill(); }
    g.restore();
  }
  gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.05); gr.addColorStop(0, "rgba(255,255,255,.5)"); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,20,.42)");
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

// ---- footballer: a jointed figure that can be seen from any side ----
function pose0(){ return {lean: 0.06, roll: 0, aL: 0, bL: 0.12, sL: 0.07, aR: 0, bR: 0.12, sR: 0.07, uL: 0.08, eL: 0.3, oL: 0.16, uR: -0.08, eR: 0.3, oR: 0.16, nod: 0, z: 0}; }
function legJ(side, a, b, s){
  var cs = Math.cos(s), sn = Math.sin(s), a2 = a - b, kf = Math.sin(a) * cs * 0.4, ku = -Math.cos(a) * cs * 0.4;
  return [kf, side * (0.115 + sn * 0.4), ku, kf + Math.sin(a2) * cs * 0.42, side * (0.115 + sn * 0.82), ku - Math.cos(a2) * cs * 0.42];
}
function armJ(side, u, e, o){
  var cs = Math.cos(o), sn = Math.sin(o), u2 = u + e, ef = Math.sin(u) * cs * 0.26, eu = -Math.cos(u) * cs * 0.26;
  return [ef, side * (0.25 + sn * 0.26), eu, ef + Math.sin(u2) * cs * 0.25, side * (0.25 + sn * 0.5), eu - Math.cos(u2) * cs * 0.25];
}
function limb(g, a, b, w, col){ g.lineWidth = w + 2.2; g.strokeStyle = OUT; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); }
function blob(g, x, y, rx, ry, col){ g.fillStyle = OUT; g.beginPath(); g.ellipse(x, y, rx + 1.2, ry + 1.2, 0, 0, TAU); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); }
function cap(g, x, y, r, c){ var e = lerp(0.6, -0.22, (c + 1) / 2); g.beginPath(); g.arc(x, y, r * 1.04, PI - e, TAU + e); g.closePath(); g.fill(); }
function head(g, H, N, s, c, sg, q, sd){
  var r = 0.205 * s, x = H.x, y = H.y, hc = MG.HAIR[sd.hc] || "#1b1b1f", st = sd.hair, sw = Math.sqrt(Math.max(0, 1 - c * c)) * (sg < 0 ? -1 : 1), ac = Math.abs(c), nx = -sw, ny = -(0.75 + 0.25 * ac), n = hyp(nx, ny), th = (c >= 0 ? lerp(-0.1, 0.25, c) : lerp(-0.1, -0.6, -c)) * r, ex, w, i, px, py;
  // the volume of curly or long hair sits behind the head, and hangs over the neck when seen from the back
  function mass(){ if (sd.hd) return; if (st === 1) blob(g, x - sw * r * 0.22, y - r * 0.28, r * 1.3, r * 1.28, hc); else if (st === 2) blob(g, x - sw * r * 0.38, y + r * 0.38, r * 1.14, r * 1.5, hc); }
  if (c >= 0) mass();
  limb(g, N, H, 0.1 * s, sd.skin);
  if (c < 0) mass();
  blob(g, x, y, r, r, sd.skin);
  g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.fillStyle = "#15151c";
  for (i = -1; i <= 1; i += 2) { ex = Math.atan2(sw, c) + i * 0.4; w = Math.cos(ex); if (w > -0.12) { g.beginPath(); g.ellipse(x + Math.sin(ex) * r * 0.9, y + r * (0.1 + 0.22 * q.nod), r * 0.11 * Math.max(0.12, w), r * 0.17, 0, 0, TAU); g.fill(); } }
  g.restore();
  // the scalp: everything on the far side of a hairline that swings round as the head turns
  nx /= n; ny /= n; px = x + nx * th; py = y + ny * th;
  g.save(); g.beginPath(); g.arc(x, y, r * 1.04, 0, TAU); g.clip();
  g.fillStyle = hc; g.globalAlpha = sd.hd ? 0 : st === 3 ? 0.3 : 1; g.beginPath();
  g.moveTo(px - ny * r * 2, py + nx * r * 2); g.lineTo(px + ny * r * 2, py - nx * r * 2); g.lineTo(px + ny * r * 2 + nx * r * 3, py - nx * r * 2 + ny * r * 3); g.lineTo(px - ny * r * 2 + nx * r * 3, py + nx * r * 2 + ny * r * 3); g.fill();
  g.restore(); g.globalAlpha = 1;
  if (st === 3 && !sd.hd) blob(g, x - sw * r * 0.1, y - r * 1.02, r * lerp(0.8, 0.24, ac), r * 0.62, hc);
  if (sd.hd) mask(g, x, y, r, c, sw, sd.hd);
}
// the rest of a character skin. Called before the limbs (after = 0) for things behind the body, and again once it is drawn
function body(g, P, J, NK, sh, hip, s, hd, c, t, after){
  var i, a, b, e, w = Date.now() / 1000, back = c > 0 ? 0 : 1;
  function tri(p0, p1, p2, col){ g.fillStyle = col; g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.lineTo(p2.x, p2.y); g.fill(); }
  function flame(p, k, size){ var n = Math.sin(w * 9 + k * 2.1), m = Math.sin(w * 6 + k); g.fillStyle = k & 1 ? "#ffd23b" : "#ff5a1f"; g.beginPath(); g.moveTo(p.x - s * size * 0.5, p.y); g.quadraticCurveTo(p.x - s * size * 0.4 + m * s * 0.03, p.y - s * size * 1.2, p.x + n * s * size * 0.35, p.y - s * size * (2.2 + 0.5 * n)); g.quadraticCurveTo(p.x + s * size * 0.5, p.y - s * size, p.x + s * size * 0.5, p.y); g.fill(); }
  if (hd === "fire" && after) { for (i = 0; i < 2; i++) { flame(J[i].s, i, 0.13); flame(J[i].w, i + 2, 0.1); flame(J[i].k, i + 4, 0.07); } }
  else if (hd === "void") {
    if (!after) { g.fillStyle = "rgba(138,61,255,.2)"; for (i = 0; i < 2; i++) { a = J[i].w; g.beginPath(); g.moveTo(a.x - s * 0.08, a.y); g.quadraticCurveTo(a.x + Math.sin(w * 3 + i) * s * 0.12, a.y + s * 0.3, a.x + Math.sin(w * 2 + i * 2) * s * 0.1, a.y + s * 0.62); g.quadraticCurveTo(a.x + s * 0.1, a.y + s * 0.25, a.x + s * 0.08, a.y); g.fill(); } }
    else { g.fillStyle = "#e9dcff"; for (i = 0; i < 9; i++) { a = w * 1.3 + i * 0.7; b = (i * 0.37 + w * 0.25) % 1; e = P(Math.sin(a) * 0.34, Math.cos(a) * 0.34, hip - 0.5 + b * 1.6); g.globalAlpha = Math.sin(b * PI); g.beginPath(); g.arc(e.x, e.y, s * 0.016, 0, TAU); g.fill(); } g.globalAlpha = 1; }
  }
  else if (hd === "shark" && after === back) { tri(P(-0.1, 0, sh + 0.02), P(-0.48, 0, sh - 0.02), P(-0.1, 0, sh - 0.4), "#6b7c91"); tri(P(-0.1, 0, hip + 0.1), P(-0.5, 0, hip + 0.18), P(-0.42, 0, hip - 0.22), "#6b7c91"); }
  else if (hd === "zeus") {
    if (after === back) { a = P(-0.1, -0.27, sh + 0.04); b = P(-0.1, 0.27, sh + 0.04); g.fillStyle = "#b3202e"; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); e = P(-0.3 - 0.05 * Math.sin(w * 4), 0.36, hip - 0.5); g.lineTo(e.x, e.y); e = P(-0.34 + 0.05 * Math.sin(w * 4 + 1), -0.36, hip - 0.5); g.lineTo(e.x, e.y); g.fill(); }
    if (after && Math.sin(w * 5) > 0.2) { g.strokeStyle = "#eaf6ff"; g.lineWidth = s * 0.022; g.shadowColor = "#9fd0ff"; g.shadowBlur = s * 0.2; a = J[1].w; g.beginPath(); g.moveTo(a.x, a.y); for (i = 1; i <= 4; i++) g.lineTo(a.x + Math.sin(w * 40 + i * 3) * s * 0.12, a.y - i * s * 0.14); g.stroke(); }
  }
  else if (hd === "robot" && after) { g.fillStyle = "#38e1ff"; for (i = 0; i < 2; i++) [J[i].k, J[i].e, J[i].s].forEach(function(p){ g.beginPath(); g.arc(p.x, p.y, s * 0.035, 0, TAU); g.fill(); }); }
}
// whole-head looks for the character skins
function mask(g, x, y, r, c, sw, hd){
  var t = Date.now() / 1000, i, a, fx = x + sw * r * 0.62, wd = clamp(c + 0.3, 0, 1);   // wd: how much of the face is still in view
  if (hd === "robot") {
    g.fillStyle = OUT; g.fillRect(x - r * 1.08, y - r * 1.12, r * 2.16, r * 2.2); g.fillStyle = "#aab3c6"; g.fillRect(x - r, y - r * 1.04, r * 2, r * 2.04); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x - r, y - r * 1.04, r * 2, r * 0.3);
    g.strokeStyle = OUT; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(x, y - r * 1.04); g.lineTo(x, y - r * 1.5); g.stroke(); g.fillStyle = "#ff5d5d"; g.beginPath(); g.arc(x, y - r * 1.55, r * (0.14 + 0.04 * Math.sin(t * 6)), 0, TAU); g.fill();
    if (c > -0.3) { g.fillStyle = "#0c1020"; g.fillRect(fx - r * 0.75 * wd, y - r * 0.3, r * 1.5 * wd, r * 0.5); g.fillStyle = "#38e1ff"; g.shadowColor = "#38e1ff"; g.shadowBlur = r * 0.6; g.fillRect(fx - r * 0.6 * wd, y - r * 0.16, r * 1.2 * wd, r * 0.2); g.shadowBlur = 0; }
  } else if (hd === "shark") {
    blob(g, x, y - r * 0.05, r * 1.06, r * 1.12, "#7d8ea3");
    g.fillStyle = OUT; g.beginPath(); g.moveTo(x - sw * r * 0.2 - r * 0.42, y - r * 0.9); g.lineTo(x - sw * r * 0.5, y - r * 2.05); g.lineTo(x - sw * r * 0.2 + r * 0.46, y - r * 0.85); g.fill(); g.fillStyle = "#6b7c91"; g.beginPath(); g.moveTo(x - sw * r * 0.2 - r * 0.3, y - r * 0.9); g.lineTo(x - sw * r * 0.48, y - r * 1.85); g.lineTo(x - sw * r * 0.2 + r * 0.34, y - r * 0.88); g.fill();
    if (c > -0.3) { g.fillStyle = "#eef2fa"; g.beginPath(); g.ellipse(fx, y + r * 0.42, r * 0.7 * wd, r * 0.42, 0, 0, TAU); g.fill(); g.fillStyle = "#b3202e"; g.fillRect(fx - r * 0.55 * wd, y + r * 0.38, r * 1.1 * wd, r * 0.12);
      g.fillStyle = "#0c1020"; for (i = -1; i <= 1; i += 2) { g.beginPath(); g.arc(fx + i * r * 0.42 * wd, y - r * 0.18, r * 0.12, 0, TAU); g.fill(); } }
  } else if (hd === "zeus") {
    blob(g, x - sw * r * 0.3, y + r * 0.2, r * 1.2, r * 1.35, "#f4f6ff"); blob(g, x, y, r, r, "#e6b48a");
    if (c > -0.3) { blob(g, fx, y + r * 0.7, r * 0.75 * wd, r * 0.75, "#f4f6ff"); g.fillStyle = "#38e1ff"; g.shadowColor = "#9fd0ff"; g.shadowBlur = r * 0.5; for (i = -1; i <= 1; i += 2) { g.beginPath(); g.arc(fx + i * r * 0.36 * wd, y - r * 0.02, r * 0.11, 0, TAU); g.fill(); } g.shadowBlur = 0; }
    blob(g, x - sw * r * 0.2, y - r * 0.72, r * 1.05, r * 0.5, "#f4f6ff"); g.strokeStyle = "#ffd23b"; g.lineWidth = r * 0.16; g.beginPath(); g.arc(x, y - r * 0.1, r * 1.02, PI * 1.12, PI * 1.88); g.stroke();
  } else if (hd === "fire") {
    for (i = 0; i < 7; i++) { a = (i - 3) * 0.3; g.fillStyle = i & 1 ? "#ffd23b" : "#ff5a1f"; g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.9 - r * 0.3, y - r * 0.5); g.quadraticCurveTo(x + Math.sin(a) * r * 1.3, y - r * (1.5 + 0.5 * Math.sin(t * 9 + i * 2)), x + Math.sin(a) * r * 1.5 + Math.sin(t * 7 + i) * r * 0.2, y - r * (2 + 0.45 * Math.sin(t * 11 + i * 1.3))); g.quadraticCurveTo(x + Math.sin(a) * r * 1.1, y - r, x + Math.sin(a) * r * 0.9 + r * 0.3, y - r * 0.5); g.fill(); }
    if (c > -0.3) { g.fillStyle = "#ffe66b"; g.shadowColor = "#ff8a1f"; g.shadowBlur = r * 0.7; for (i = -1; i <= 1; i += 2) { g.beginPath(); g.arc(fx + i * r * 0.36 * wd, y + r * 0.08, r * 0.13, 0, TAU); g.fill(); } g.shadowBlur = 0; }
  } else if (hd === "void") {
    g.fillStyle = "rgba(138,61,255," + (0.22 + 0.1 * Math.sin(t * 3)) + ")"; g.beginPath(); g.arc(x, y, r * 1.5, 0, TAU); g.fill(); blob(g, x, y, r * 1.02, r * 1.02, "#07040d");
    if (c > -0.3) { g.fillStyle = "#c9a6ff"; g.shadowColor = "#8a3dff"; g.shadowBlur = r * 0.9; for (i = -1; i <= 1; i += 2) { g.beginPath(); g.ellipse(fx + i * r * 0.36 * wd, y + r * 0.05, r * 0.16, r * 0.09, i * 0.3, 0, TAU); g.fill(); } g.shadowBlur = 0; }
  }
}
var KFX = {gold: 1, holo: 1, nova: 1, frost: 1, crown: 1, chrome: 1, prism: 1, plate: 1, bolt: 2, lava: 2, void: 2, neon: 2, galaxy: 2, toxic: 2, circuit: 2, glitch: 3};
// ph: how far the chest is turned away from the camera, 0 facing it, positive towards screen right
var MESH = null;
function torso(g, T, B, wt, wb, sd, ph, t){
  var vx = B.x - T.x, vy = B.y - T.y, l = hyp(vx, vy) || 1, nx = vy / l, ny = -vx / l, tex = sd.tex[0], k = KFX[sd.p], uc = ((40 - ph / TAU * 160) % 160 + 160) % 160, a, gr, i, a0, x0;
  // the outline is cut like a shirt: sloped shoulders, a slight waist and a hem that curves round the body
  g.save(); g.transform(nx * wt / 40, ny * wt / 40, vx / 100, vy / 100, T.x - nx * wt, T.y - ny * wt);
  g.beginPath(); g.moveTo(8, 1); g.quadraticCurveTo(40, 6, 72, 1); g.quadraticCurveTo(81, 4, 80, 16); g.quadraticCurveTo(75, 58, 79, 95); g.quadraticCurveTo(40, 105, 1, 95); g.quadraticCurveTo(5, 58, 0, 16); g.quadraticCurveTo(-1, 4, 8, 1); g.closePath();
  g.restore(); g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
  g.save(); g.clip(); g.transform(nx * wt / 40, ny * wt / 40, vx / 100, vy / 100, T.x - nx * wt, T.y - ny * wt);
  for (i = 0; i < 8; i++) { a0 = -PI / 2 + i * PI / 8; x0 = 40 + 40 * Math.sin(a0); g.drawImage(sd.wrap, (uc + a0 / TAU * 160 + 160) % 160, 0, 10, 100, x0 - 0.4, 0, 40 * (Math.sin(a0 + PI / 8) - Math.sin(a0)) + 0.8, 100); }
  gr = g.createLinearGradient(0, 0, 80, 0); gr.addColorStop(0, "rgba(0,0,10,.42)"); gr.addColorStop(0.22, "rgba(0,0,10,.06)"); gr.addColorStop(0.42, "rgba(255,255,255,.1)"); gr.addColorStop(0.7, "rgba(0,0,10,.05)"); gr.addColorStop(1, "rgba(0,0,10,.46)"); g.fillStyle = gr; g.fillRect(0, 0, 80, 100);
  gr = g.createLinearGradient(0, 0, 0, 100); gr.addColorStop(0, "rgba(255,255,255,.08)"); gr.addColorStop(0.55, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,10,.3)"); g.fillStyle = gr; g.fillRect(0, 0, 80, 100);
  g.strokeStyle = "rgba(0,0,10,.13)"; g.lineWidth = 2.2; g.beginPath(); g.moveTo(14, 58); g.quadraticCurveTo(30, 70, 26, 96); g.moveTo(66, 54); g.quadraticCurveTo(52, 72, 56, 98); g.moveTo(24, 30); g.quadraticCurveTo(40, 38, 58, 30); g.stroke();
  if (!MESH) { MESH = document.createElement("canvas"); MESH.width = MESH.height = 4; a = MESH.getContext("2d"); a.fillStyle = "rgba(0,0,12,.5)"; a.fillRect(0, 0, 1.3, 1.3); a.fillRect(2, 2, 1.3, 1.3); a.fillStyle = "rgba(255,255,255,.35)"; a.fillRect(1.3, 0, 0.7, 0.7); a.fillRect(3.3, 2, 0.7, 0.7); }
  g.globalAlpha = 0.2; g.fillStyle = g.createPattern(MESH, "repeat"); g.fillRect(0, 0, 80, 100); g.globalAlpha = 1;   // the knit of the fabric
  g.fillStyle = "rgba(255,255,255,.1)"; g.beginPath(); g.ellipse(30, 30, 16, 22, 0.3, 0, TAU); g.fill();   // light catching the chest
  g.strokeStyle = "rgba(0,0,10,.16)"; g.lineWidth = 1.6; g.beginPath(); g.moveTo(8, 78); g.quadraticCurveTo(26, 86, 40, 82); g.quadraticCurveTo(58, 78, 74, 86); g.moveTo(4, 40); g.quadraticCurveTo(12, 46, 10, 60); g.moveTo(76, 40); g.quadraticCurveTo(68, 46, 70, 60); g.stroke();   // creases
  if (R.mat && sd.tier >= 5) R.mat(g, sd, t);
  if (k === 1) { a = ((t * 0.5 + 0.3) % 1.7) * 150 - 50; g.globalAlpha = 0.38; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(a, 0); g.lineTo(a + 16, 0); g.lineTo(a - 24, 100); g.lineTo(a - 40, 100); g.fill(); }
  else if (k === 2) { g.globalAlpha = 0.14 + 0.13 * Math.sin(t * 3.3); g.fillStyle = sd.col[1]; g.fillRect(0, 0, 80, 100); }
  else if (k === 3) { a = Math.floor(t * 11); g.drawImage(tex, 0, a * 37 % 90, 80, 9, (a % 3 - 1) * 7, a * 37 % 90, 80, 9); g.drawImage(tex, 0, a * 53 % 90, 80, 6, a % 2 ? 6 : -6, a * 53 % 90, 80, 6); }
  g.globalAlpha = 1; gr = g.createLinearGradient(0, 0, 80, 0); gr.addColorStop(0, "rgba(255,255,255,.14)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,20,.26)"); g.fillStyle = gr; g.fillRect(0, 0, 80, 100);
  g.restore();
}
// sd: a dressed side (see side() below); tcx, tcy: unit vector from the figure towards the camera
function figure(g, prj, x, y, z0, fa, q, sd, tcx, tcy, t){
  if (R.fig2) return R.fig2(g, prj, x, y, z0, fa, q, sd, tcx, tcy, t);
  var fx = Math.cos(fa), fy = Math.sin(fa), rx = -fy, ry = fx, c = fx * tcx + fy * tcy, sg = fx * tcy - fy * tcx, ac = Math.abs(c),
    Lg = [legJ(-1, q.aL, q.bL, q.sL), legJ(1, q.aR, q.bR, q.sR)], A = [armJ(-1, q.uL, q.eL, q.oL), armJ(1, q.uR, q.eR, q.oR)],
    hip = Math.max(0.16, -Math.min(Lg[0][5], Lg[1][5])) + 0.05 + q.z + z0, cl = Math.cos(q.roll), tf = Math.sin(q.lean) * cl, tr = Math.sin(q.roll), tu = Math.cos(q.lean) * cl,
    nf = tf * 0.5, nr = tr * 0.5, nu = hip + tu * 0.5, sh = nu - 0.04, col = sd.col, skin = sd.skin, J = [], parts, i, k, j, s, a, b, HC, NK, HD;
  function P(f, r, u){ return prj(x + fx * f + rx * r, y + fy * f + ry * r, u); }
  HC = P(0, 0, hip); NK = P(nf, nr, nu); HD = P(nf + tf * 0.25 + 0.05 * q.nod, nr + tr * 0.25, nu + tu * 0.25 - 0.03 * q.nod); s = HC.s;
  for (i = 0; i < 2; i++) {
    k = i ? 1 : -1; a = Lg[i]; b = A[i];
    J.push({h: P(0, k * 0.115, hip), k: P(a[0], a[1], hip + a[2]), f: P(a[3], a[4], hip + a[5]), t: P(a[3] + 0.19, a[4], hip + a[5] + 0.015),
      s: P(nf, nr + k * 0.25, sh), e: P(nf + b[0], nr + b[1], sh + b[2]), w: P(nf + b[3], nr + b[4], sh + b[5])});
  }
  // legs first, so the shirt always hangs over the shorts whichever way he faces
  parts = [[J[0].k.d, 0], [J[1].k.d, 1]].sort(function(m, n){ return n[0] - m[0]; }).concat([[J[0].e.d, 2], [J[1].e.d, 3], [(HC.d + NK.d) / 2, 4], [HD.d - 0.03, 5]].sort(function(m, n){ return n[0] - m[0]; }));
  // character skins change the whole body: one material for every limb, a glow round the outline, and extra parts
  if (sd.glow) { g.shadowColor = sd.glow; g.shadowBlur = s * 0.07; }
  if (sd.hd) body(g, P, J, NK, sh, hip, s, sd.hd, c, t, 0);
  if (R.flair && sd.tier >= 5) R.flair(g, P, J, HD, hip, s, sd, c, sg, t, 0);
  for (i = 0; i < 6; i++) {
    k = parts[i][1];
    if (k < 2) { j = J[k]; limb(g, j.h, j.k, 0.16 * s, skin); limb(g, j.k, j.f, 0.125 * s, sd.hd ? skin : col[1]); if (R.boot) R.boot(g, j.f, j.t, s, sd, t); else limb(g, j.f, j.t, 0.13 * s, sd.boot); limb(g, j.h, mid(j.h, j.k, 0.64), 0.2 * s, col[2]); }
    else if (k < 4) { j = J[k - 2]; limb(g, j.s, j.e, 0.105 * s, skin); limb(g, j.e, j.w, 0.09 * s, skin); if (!sd.hd) limb(g, j.s, mid(j.s, j.e, 0.6), 0.135 * s, col[0]); }
    else if (k === 4) { limb(g, J[0].h, J[1].h, 0.21 * s, col[2]); torso(g, NK, P(0, 0, hip - 0.05), s * lerp(0.17, 0.265, ac), s * lerp(0.15, 0.215, ac), sd, Math.atan2(sg, c), t); }
    else { head(g, HD, NK, s, c, sg, q, sd); if (sd.hd) body(g, P, J, NK, sh, hip, s, sd.hd, c, t, 1); }
  }
  g.shadowBlur = 0;
  if (R.flair && sd.tier >= 5) R.flair(g, P, J, HD, hip, s, sd, c, sg, t, 1);
}
// turn an engine player into joint angles
function poseOf(p, m, t){
  var q = pose0(), a = p.act, u = p.ad ? clamp(p.at / p.ad, 0, 1) : 0, sp = hyp(p.vx, p.vy), k = clamp(sp / 6.5, 0, 1), ph = p.stride * 3.9, s = Math.sin(ph), c = Math.cos(ph), A = 0.2 + 0.62 * k, w;
  if (sp > 0.5) {
    q.aL = A * s; q.aR = -A * s; q.bL = 0.15 + 1.15 * k * Math.max(0, c); q.bR = 0.15 + 1.15 * k * Math.max(0, -c);
    q.uL = -A * 0.9 * s; q.uR = A * 0.9 * s; q.eL = q.eR = 0.5 + 0.8 * k; q.lean = 0.08 + 0.28 * k;
  } else { w = Math.sin(t * 2.2 + p.i * 2); q.lean = 0.05 + 0.014 * w; q.eL = q.eR = 0.3 + 0.04 * w; }
  if (m.b.own === p.i) q.nod = 0.35;
  if (p.jock) { q.sL = q.sR = 0.34; q.aL += 0.45; q.aR += 0.45; q.bL += 0.85; q.bR += 0.85; q.oL = q.oR = 0.75; q.lean = 0.32; }
  if (a === "wind") { w = clamp(p.wind / K.TF, 0, 1.25); q.aR = -0.35 - 0.75 * Math.min(1, w); q.bR = 0.9 + 0.5 * w; q.aL = 0.12; q.bL = 0.25; q.lean = -0.08; q.uL = 0.5; q.oL = 0.9; q.uR = -0.7; q.oR = 0.4; }
  else if (a === "kick") { w = Math.min(1, u * 2.2); w = 1 - (1 - w) * (1 - w); q.aR = lerp(-1.1, 1.35, w); q.bR = lerp(1.2, 0.1, w); q.aL = -0.1; q.bL = 0.2; q.lean = lerp(-0.1, -0.28, w); q.uL = lerp(0.5, -0.6, w); q.oL = 0.7; q.uR = 0.3; q.z = 0.12 * Math.sin(PI * w); }
  else if (a === "fake") { w = Math.sin(PI * u); q.aR = -0.7 * w; q.bR = 0.9 * w; q.lean = -0.05; }
  else if (a === "cut") { w = Math.sin(PI * u) * (p.ax * -Math.sin(p.fa) + p.ay * Math.cos(p.fa) > 0 ? 1 : -1); q.roll = 0.42 * w; q.sL = q.sR = 0.3; q.bL += 0.35; q.bR += 0.35; }
  else if (a === "drag") { q.lean = -0.18; q.aR = 0.55 * Math.sin(PI * u); q.bR = 0.2; q.aL = -0.2; q.bL = 0.5; }
  else if (a === "burst" || a === "press") q.lean += 0.2;
  else if (a === "wall") { q.sL = q.sR = 0.44; q.oL = q.oR = 1.3; q.uL = q.uR = 0.15; q.eL = q.eR = 0.1; q.lean = 0; q.aL = q.aR = 0; q.bL = q.bR = 0.15; }
  else if (a === "spin") { q.oL = q.oR = 1; q.uL = q.uR = 0; q.lean = 0.1; q.sL = q.sR = 0.25; }
  else if (a === "megs") { w = Math.sin(PI * Math.min(1, u * 2)); q.aR = 0.6 * w; q.bR = 0.1; q.lean = 0.12; }
  else if (a === "tackle") { w = Math.sin(PI * Math.min(1, u * 1.6)); q.aR = 1.15 * w; q.bR = 0.05; q.aL = -0.35 * w; q.bL = 0.6 * w; q.lean = 0.25 * w; q.uL = -0.5 * w; q.uR = 0.4 * w; }
  else if (a === "slide") { w = p.at > p.ad - 0.3 ? clamp((p.ad - p.at) / 0.3, 0, 1) : Math.min(1, p.at / 0.12); q.aR = lerp(q.aR, 1.5, w); q.bR = 0.05; q.aL = lerp(q.aL, 1.25, w); q.bL = 1.5 * w; q.lean = lerp(q.lean, -1.05, w); q.uL = q.uR = -0.9 * w; q.oL = q.oR = 0.5; q.sL = 0.25; }
  else if (a === "lunge") { w = Math.sin(PI * Math.min(1, u * 1.4)); q.aR = 1.25 * w; q.bR = 0.05; q.aL = -0.55 * w; q.bL = 0.7 * w; q.lean = 0.2 * w; q.oL = q.oR = 0.5 + 0.7 * w; q.uL = q.uR = 0.3; }
  else if (a === "jump") { w = Math.sin(PI * u); q.z = 0.5 * w; q.uL = q.uR = 2.6; q.oL = q.oR = 0.35; q.eL = q.eR = 0.15; q.sL = q.sR = 0.2 + 0.25 * w; q.bL = q.bR = 0.3 * (1 - w); q.aL = q.aR = 0; q.lean = 0; }
  else if (a === "stumble") { w = Math.sin(t * 22); q.lean = -0.3 + 0.1 * w; q.roll = 0.35 * Math.sin(t * 13); q.oL = 1.1 + 0.3 * w; q.oR = 1.1 - 0.3 * w; q.bL = 0.8; q.bR = 0.3; q.aL = 0.4; q.sL = q.sR = 0.3; }
  else if (a === "megged") { q.sL = q.sR = 0.42; q.lean = 0.35 * Math.sin(PI * Math.min(1, u * 1.5)); q.nod = 0.7; q.oL = q.oR = 0.8; q.bL = q.bR = 0.2; q.aL = q.aR = 0; }
  else if (a === "celebrate") { w = Math.abs(Math.sin(p.at * 6.5)); q.z = 0.28 * w; q.uL = q.uR = 2.9; q.oL = q.oR = 0.45 + 0.2 * Math.sin(p.at * 13); q.eL = q.eR = 0.2; q.bL = q.bR = 0.5 * (1 - w); q.aL = q.aR = 0; q.lean = -0.05; }
  else if (a === "sad") { q.lean = 0.3; q.nod = 0.9; q.uL = q.uR = 0.05; q.eL = q.eR = 0.1; q.aL = q.aR = 0; }
  return q;
}

// ---- the match view ----
// s: {kit, cus: {p, c}, look: {skin, hair, hc, num}, trail, fx, name, ring, human}
function side(s){ var d = side0(s); if (R.dress) R.dress(d, s); return d; }
function side0(s){
  var it = MG.ITEM[s.kit] || MG.ITEM.home, lk = s.look || {}, cu = it.p === "custom" ? s.cus || {p: "solid", c: it.c} : null, col = cu ? cu.c : it.c, num = it.num || lk.num || 7;
  return {it: it, p: cu ? cu.p : it.p, col: col, tex: [kitTex(it, 0, num, cu), kitTex(it, 1, num, cu)], wrap: wrapTex(it, num, cu), skin: it.sk || MG.SKIN[lk.skin || 0] || MG.SKIN[0], hd: it.hd || "", glow: it.gl || "", emote: (MG.ITEM[s.emote] || {}).k || "", hair: lk.hair || 0, hc: lk.hc || 0, aura: it.f || "",
    trail: (MG.ITEM[s.trail] || {}).k || "none", fx: (MG.ITEM[s.fx] || {}).k || "confetti", name: s.name || "", ring: s.ring || "#3b6ef5", human: !!s.human, boot: lum(col[1]) < 0.25 ? "#e9ebf5" : "#1b1b22", tier: it.r || 0, mat: it.p};
}
function View(cv){
  var v = this;
  v.cv = cv; v.g = cv.getContext("2d"); v.w = 960; v.h = 540; v.dpr = 1; v.t = 0; v.tick = 0;
  v.cam = {x: 0, y: 20, z: 7.4, f: 800, cx: 480, cy: 270, sn: Math.sin(0.5), cs: Math.cos(0.5), sx: 0, sy: 0, back: 9.2, k: 0.833};
  // options the settings screen can change
  v.o = {shake: 1, flash: 1, fx: 1, names: 1, rings: 1, meter: 1, aim: 1, pops: 1, zoom: 0, pan: 1, cb: 0, net: 1, trail: 1, aura: 1};
  v.mir = 0; v.gm = 0; v.parts = []; v.pops = []; v.nets = []; v.later = []; v.bolts = []; v.hist = []; v.pts = ico(); v.shake = 0; v.flash = 0; v.bg = null;
  v.P = function(x, y, z){ return v.pr(x, y, z); };
  v.set({court: "street", ball: "classic", sides: [{kit: "home"}, {kit: "away"}]});
  v.resize();
}
var V = View.prototype;
V.resize = function(){
  var v = this, cv = v.cv, d = Math.min(2, window.devicePixelRatio || 1), w = Math.max(240, cv.clientWidth || 960), h = Math.max(150, cv.clientHeight || 540);
  if (v.w !== w || v.h !== h || v.dpr !== d || cv.width !== Math.round(w * d)) { v.w = w; v.h = h; v.dpr = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d); v.bg = null; }
};
V.set = function(o){
  var v = this;
  v.th = COURTS[String(o.court).replace("c_", "")] || COURTS.street; v.ball = MG.ITEM[o.ball] || MG.ITEM.classic; v.sides = o.sides.map(function(s){ return side(s); }); v.bg = null;
  v.parts.length = v.pops.length = v.nets.length = v.later.length = v.bolts.length = v.hist.length = 0; v.shake = v.flash = 0; v.cam.x = 0; v.cam.y = 19.5;
};
// world (x across, y away from the goal, z up) to screen; s is pixels per metre there, d the depth
V.pr = function(x, y, z){
  var c = this.cam, ry, rz, d, s;
  if (this.mir) { x = -x; y = this.mir - y; }
  ry = y - c.y; rz = z - c.z; d = -ry * c.cs - rz * c.sn; s = c.f / d;
  return {x: c.cx + c.sx + (x - c.x) * s, y: c.cy + c.sy - (rz * c.cs - ry * c.sn) * s, s: s, d: d};
};
// project a run of xyz points, cutting it where it passes behind the camera
V.run = function(a, closed){
  var v = this, c = v.cam, n = a.length / 3, out = [], near = 0.8, i, j, d0, d1, t;
  function dep(k){ return -((v.mir ? v.mir - a[k * 3 + 1] : a[k * 3 + 1]) - c.y) * c.cs - (a[k * 3 + 2] - c.z) * c.sn; }
  for (i = 0; i < (closed ? n : n - 1); i++) {
    j = (i + 1) % n; d0 = dep(i); d1 = dep(j);
    if (d0 >= near) out.push(v.pr(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]));
    if ((d0 >= near) !== (d1 >= near)) { t = (near - d0) / (d1 - d0); out.push(v.pr(lerp(a[i * 3], a[j * 3], t), lerp(a[i * 3 + 1], a[j * 3 + 1], t), lerp(a[i * 3 + 2], a[j * 3 + 2], t))); }
  }
  if (!closed && dep(n - 1) >= near) out.push(v.pr(a[n * 3 - 3], a[n * 3 - 2], a[n * 3 - 1]));
  return out;
};
V.poly = function(a, col){ var g = this.g, q = this.run(a, true), i; if (q.length < 3) return; g.fillStyle = col; g.beginPath(); for (i = 0; i < q.length; i++) g.lineTo(q[i].x, q[i].y); g.closePath(); g.fill(); };
V.line = function(a, wm, col, al){
  var g = this.g, q = this.run(a, false), s = 0, i;
  if (q.length < 2) return;
  g.beginPath(); for (i = 0; i < q.length; i++) { g.lineTo(q[i].x, q[i].y); s += Math.min(q[i].s, 160); }
  g.strokeStyle = col; g.globalAlpha = al == null ? 1 : al; g.lineWidth = Math.max(1.1, wm * s / q.length); g.stroke(); g.globalAlpha = 1;
};

// ---- backdrop, floor and cage ----
V.mkBack = function(){
  var v = this, th = v.th, w = Math.round(v.w * 1.3), h = Math.max(60, Math.round(v.h * 0.62)), c = document.createElement("canvas"), g, gr, r = MG.rng(hash(th.far) + 3), i, j, k, x, bw, bh, sc = clamp(v.w / 960, 0.5, 1.4);
  c.width = w; c.height = h; g = c.getContext("2d");
  gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.6, th.sky[1]); gr.addColorStop(1, th.sky[2]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (th.sun) { gr = g.createRadialGradient(w * 0.62, h * 0.86, 4, w * 0.62, h * 0.86, h * 0.55); gr.addColorStop(0, "#fff6d6"); gr.addColorStop(0.14, "#ffd58a"); gr.addColorStop(1, "rgba(255,160,80,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  g.fillStyle = "#fff"; for (i = 0; i < 80 * th.night; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.fillRect(r() * w, r() * h * 0.6, 1.4, 1.4); }
  g.globalAlpha = 1;
  if (th.hill) {
    g.fillStyle = "rgba(255,255,255,.85)"; for (i = 0; i < 7; i++) { x = r() * w; j = h * (0.15 + r() * 0.35); g.beginPath(); g.ellipse(x, j, 46 * sc, 13 * sc, 0, 0, TAU); g.ellipse(x + 26 * sc, j - 9 * sc, 30 * sc, 14 * sc, 0, 0, TAU); g.fill(); }
    for (k = 0; k < 2; k++) { g.fillStyle = k ? th.far : th.hill2 || "#4fa56f"; g.beginPath(); g.moveTo(0, h); for (x = 0; x <= w; x += 12) g.lineTo(x, h - h * (0.2 - k * 0.07 + 0.06 * Math.sin(x * 0.011 / sc + k * 2) + 0.03 * Math.sin(x * 0.03 / sc + k))); g.lineTo(w, h); g.fill(); }
  } else for (i = 0; i < 40; i++) {
    x = r() * w; bw = (22 + r() * 54) * sc; bh = h * (0.14 + r() * 0.46) * (i < 20 ? 1 : 0.72);
    g.fillStyle = th.far; g.globalAlpha = i < 20 ? 0.55 : 1; g.fillRect(x, h - bh, bw, bh);
    if (th.win) { g.fillStyle = th.win; g.globalAlpha = i < 20 ? 0.3 : 0.75; for (j = 0; j < bw / (8 * sc) - 1; j++) for (k = 0; k < bh / (11 * sc) - 1; k++) if (r() < 0.26) g.fillRect(x + (4 + j * 8) * sc, h - bh + (6 + k * 11) * sc, 4 * sc, 5 * sc); }
    g.globalAlpha = 1;
  }
  v.bg = c;
};
V.back = function(){
  var v = this, g = v.g, hz = v.pr(0, 0, 3.4).y + 3, b;
  if (!v.bg) v.mkBack();
  b = v.bg; g.fillStyle = v.th.sky[0]; g.fillRect(0, 0, v.w, Math.max(0, hz - b.height) + 1);
  g.drawImage(b, clamp(-v.w * 0.15 - v.cam.x * 9 + v.cam.sx, -v.w * 0.3, 0), hz - b.height);
};
V.floor = function(m){
  var v = this, th = v.th, L = m.L || D, i, k, cc;
  v.poly([-W, 0, 0, W, 0, 0, W, L, 0, -W, L, 0], th.floor[0]);
  for (i = 1; i * 1.5 < L - 1; i += 2) v.poly([-W, i * 1.5, 0, W, i * 1.5, 0, W, i * 1.5 + 1.5, 0, -W, i * 1.5 + 1.5, 0], th.floor[1]);
  v.line([-W, 0, 0, W, 0, 0, W, L, 0, -W, L, 0, -W, 0, 0], 0.09, th.line, 0.9);
  for (k = 0; k < (m.L ? 2 : 1); k++) {   // the markings in front of each goal
    v.mir = k ? m.L : 0; v.poly(ARCP, th.in1);
    if (th.glow) { v.line(ARCP, 0.34, th.line, 0.16); v.line(BOX, 0.3, th.line, 0.16); }
    v.line(BOX, 0.08, th.line, 0.85); v.line(ARCP, 0.09, th.line, 0.9);
  }
  v.mir = 0;
  if (m.L) { cc = []; for (i = 0; i <= 28; i++) cc.push(Math.cos(i * TAU / 28) * 2.2, L / 2 + Math.sin(i * TAU / 28) * 2.2, 0); v.line(cc, 0.08, th.line, 0.85); v.line([-W, L / 2, 0, W, L / 2, 0], 0.09, th.line, 0.9); }
  else v.line([-0.7, 11, 0, 0.7, 11, 0], 0.08, th.line, 0.8);
  if (m.need >= 0 && m.phase === "live") v.line(ARCP, 0.24, "#ffd23b", 0.4 + 0.35 * Math.sin(v.t * 9));
};
// a board with fence above it, running between two points on the floor
V.wall = function(x0, y0, x1, y1, txt){
  var v = this, g = v.g, th = v.th, n = Math.max(1, Math.round(hyp(x1 - x0, y1 - y0) / 3)), i, k, a, x, y;
  v.poly([x0, y0, 0, x1, y1, 0, x1, y1, 1, x0, y0, 1], th.board); v.poly([x0, y0, 1, x1, y1, 1, x1, y1, 3.4, x0, y0, 3.4], th.mesh);
  for (k = 1; k < 4; k++) v.line([x0, y0, 1 + k * 0.6, x1, y1, 1 + k * 0.6], 0.02, th.rail, 0.35);
  for (i = 0; i <= n; i++) { x = lerp(x0, x1, i / n); y = lerp(y0, y1, i / n); v.line([x, y, 0, x, y, 3.4], 0.07, th.rail, 0.9); }
  v.line([x0, y0, 3.4, x1, y1, 3.4], 0.08, th.rail, 1); v.line([x0, y0, 1, x1, y1, 1], 0.07, th.trim, 1);
  if (txt) { a = v.pr((x0 + x1) / 2, y0, 0.5); g.font = "800 " + Math.round(a.s * 0.5) + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = th.line; g.globalAlpha = 0.8; g.fillText(txt, a.x, a.y); g.globalAlpha = 1; }
};
V.walls = function(m){
  var v = this, th = v.th, e = GW + 0.1, b = -GD - 0.3, h = GH + 0.3, L = m.L || D, i;
  v.poly([-e, b, 0, e, b, 0, e, b, h, -e, b, h], "#0c0e20"); v.poly([-e, 0, 0, e, 0, 0, e, b, 0, -e, b, 0], "#171a33");
  for (i = -1; i <= 1; i += 2) v.poly([i * e, 0, 0, i * e, b, 0, i * e, b, h, i * e, 0, h], "#101228");
  v.poly([-e, 0, h, e, 0, h, e, 0, 3.4, -e, 0, 3.4], th.board); v.line([-e, 0, 3.4, e, 0, 3.4], 0.08, th.rail, 1); v.line([-e, 0, h, e, 0, h], 0.07, th.trim, 1);
  v.wall(-W, 0, -e, 0, "ARGYLE SMARTS"); v.wall(e, 0, W, 0, "MEGS 1v1"); v.wall(-W, 0, -W, L); v.wall(W, 0, W, L);
  v.lamps();
};
V.lamps = function(){
  var v = this, g = v.g, th = v.th, i, a, b, gr, r;
  for (i = -1; i <= 1; i += 2) {
    a = v.pr(i * W, 0, 3.4); b = v.pr(i * W, 0, 6.6);
    g.strokeStyle = th.rail; g.lineWidth = Math.max(2, a.s * 0.09); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    g.fillStyle = th.rail; g.fillRect(b.x - b.s * 0.45, b.y - b.s * 0.18, b.s * 0.9, b.s * 0.3);
    if (th.lamp) { r = b.s * 3.4; gr = g.createRadialGradient(b.x, b.y, 1, b.x, b.y, r); gr.addColorStop(0, th.lamp); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.5; g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(b.x - r, b.y - r, r * 2, r * 2); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; }
  }
};

// ---- goal: a net that bulges where the ball hits it ----
// f: 0 back, -1 / 1 sides, 2 roof; a and b are metres across that face
V.np = function(f, a, b){
  var v = this, n = v.nets, d = 0, ua = f === 0 || f === 2 ? (a + GW) / (2 * GW) : a / GD, ub = f === 2 ? b / GD : b / GH, k = Math.sin(PI * ua) * Math.sin(PI * ub), i, e, t;
  for (i = 0; i < n.length; i++) { e = n[i]; if (e.f !== f || e.g !== (v.mir ? 1 : 0)) continue; t = v.t - e.t; d += e.amp * Math.exp(-((a - e.a) * (a - e.a) + (b - e.b) * (b - e.b)) * 1.8 - 3.2 * t) * Math.cos(11 * t); }
  d = d * Math.sqrt(Math.max(0, k)) + 0.09 * k;
  return f === 0 ? v.pr(a, -GD - d, b) : f === 2 ? v.pr(a, -b, GH + d - 0.16 * k) : v.pr(f * (GW + d), -a, b);
};
V.grid = function(f, a0, a1, b0, b1){
  var v = this, g = v.g, st = v.o.net ? 0.25 : 0.5, na = Math.round((a1 - a0) / st), nb = Math.round((b1 - b0) / st), i, j, p;
  g.beginPath();
  for (i = 0; i <= na; i++) for (j = 0; j <= nb; j++) { p = v.np(f, a0 + (a1 - a0) * i / na, b0 + (b1 - b0) * j / nb); if (j) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
  for (j = 0; j <= nb; j++) for (i = 0; i <= na; i++) { p = v.np(f, a0 + (a1 - a0) * i / na, b0 + (b1 - b0) * j / nb); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
  g.stroke();
};
V.net = function(){
  var v = this, g = v.g, n = v.nets;
  while (n.length && v.t - n[0].t > 1.8) n.shift();
  v.line([-GW, 0, GH, -GW, -GD, GH, -GW, -GD, 0], 0.05, "#8d93b3", 1); v.line([GW, 0, GH, GW, -GD, GH, GW, -GD, 0], 0.05, "#8d93b3", 1); v.line([-GW, -GD, GH, GW, -GD, GH], 0.05, "#8d93b3", 1);
  g.strokeStyle = v.th.glow ? v.th.line : "#ffffff"; g.globalAlpha = 0.5; g.lineWidth = 1;
  v.grid(0, -GW, GW, 0, GH); v.grid(-1, 0, GD, 0, GH); v.grid(1, 0, GD, 0, GH); v.grid(2, -GW, GW, 0, GD);
  g.globalAlpha = 1;
};
V.frame = function(){
  var v = this, g = v.g, a = v.pr(-GW, 0, 0), b = v.pr(-GW, 0, GH), c = v.pr(GW, 0, GH), d = v.pr(GW, 0, 0), w = Math.max(3, a.s * 0.13);
  g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y);
  g.lineWidth = w + 2.4; g.strokeStyle = OUT; g.stroke(); g.lineWidth = w; g.strokeStyle = "#f6f7fb"; g.stroke();
};

// ---- particles, callouts, lightning ----
// kinds: 0 dot, 1 square, 2 star, 3 streak, 4 ground ring, 5 coin, 6 confetti
V.emit = function(n, x, y, z, o){
  var v = this, c = o.c, i, a, e, sp, f;
  if (v.gm) { x = -x; y = v.gm - y; }
  n = Math.ceil(n * v.o.fx);
  for (i = 0; i < n && v.parts.length < 460; i++) {
    a = Math.random() * TAU; e = Math.random() * 2 - 1; sp = (o.sp || 0) * (0.35 + Math.random() * 0.65); f = Math.sqrt(1 - e * e);
    v.parts.push({x: x + (Math.random() - 0.5) * (o.r || 0), y: y + (Math.random() - 0.5) * (o.r || 0), z: z, vx: Math.cos(a) * sp * f, vy: Math.sin(a) * sp * f, vz: sp * e * 0.6 + (o.up || 0) * (0.5 + Math.random() * 0.5),
      l: (o.l || 0.5) * (0.6 + Math.random() * 0.4), m: o.l || 0.5, s: (o.s || 0.08) * (0.6 + Math.random() * 0.8), c: typeof c === "string" ? c : c[Math.floor(Math.random() * c.length)], k: o.k || 0, g: o.g == null ? 1 : o.g, a: Math.random() * TAU});
  }
};
V.ring = function(x, y, c){ if (this.gm) { x = -x; y = this.gm - y; } this.parts.push({x: x, y: y, z: 0.04, vx: 0, vy: 0, vz: 0, l: 0.85, m: 0.85, s: 0.3, c: c, k: 4, g: 0, a: 0}); };
V.pop = function(x, y, z, txt, col, big){ if (this.o.pops) this.pops.push({x: x, y: y, z: z, txt: txt, col: col, l: big ? 1.3 : 0.95, m: big ? 1.3 : 0.95, big: big}); };
V.bolt = function(x, y){
  var p = [], gm = this.gm, ox, i;
  if (gm) { x = -x; y = gm - y; this.gm = 0; }
  ox = x + (Math.random() - 0.5) * 5;
  for (i = 0; i <= 7; i++) p.push(lerp(ox, x, i / 7) + (i && i < 7 ? (Math.random() - 0.5) * 1.4 : 0), y, lerp(13, 0, i / 7));
  this.bolts.push({p: p, l: 0.3}); this.emit(14, x, y, 0.2, {sp: 6, up: 2, l: 0.5, s: 0.07, c: ["#ffffff", "#9fd0ff"], k: 3, g: 0.6}); this.gm = gm;
};
V.at = function(d, f){ this.later.push({t: this.t + d, f: f, gm: this.gm}); this.later.sort(function(a, b){ return a.t - b.t; }); };
var DUST = {sp: 1.6, up: 0.9, l: 0.4, s: 0.07, c: "#cfd3e6", g: 0.4};
// feed every engine event through here
V.event = function(m, e){
  var v = this, b = m.b, k = e.k, p = e.by == null ? null : m.p[e.by], rl, ok = v.o.cb ? "#7fd0ff" : "#5ee6a8";
  if (k === "kick") {
    v.emit(6, b.x, b.y, 0.1, DUST); v.shake = Math.max(v.shake, e.pw > 20 ? 0.35 : 0.14); rl = p.rel;
    if (e.q === 2) { v.pop(p.x, p.y, 2.35, "PERFECT", ok, 1); v.emit(14, b.x, b.y, 0.3, {sp: 4, up: 2, l: 0.5, s: 0.09, c: ok, k: 2}); }
    else if (e.q === 1) v.pop(p.x, p.y, 2.3, "GOOD", "#d6ff3b");
    else if (!e.vol && rl) v.pop(p.x, p.y, 2.3, rl.m < K.GC ? "EARLY" : "LATE", "#ff8a8a");
  }
  else if (k === "bounce") v.emit(4, b.x, b.y, 0.05, DUST);
  else if (k === "post") { v.emit(16, b.x, b.y, b.z, {sp: 5, up: 1, l: 0.45, s: 0.06, c: "#fff3b0", k: 3}); v.shake = Math.max(v.shake, 0.5); v.pop(b.x, b.y, b.z + 0.6, e.bar ? "CROSSBAR" : "POST", "#ffd23b"); }
  else if (k === "wall") { if (e.v > 4) v.emit(5, b.x, b.y, b.z, DUST); }
  else if (k === "net") v.nets.push({f: e.f, g: e.g || 0, a: e.f === 0 || e.f === 2 ? e.x : -e.y, b: e.f === 2 ? -e.y : e.z, amp: clamp(e.v * 0.03, 0.04, 0.55), t: v.t});
  else if (k === "steal") { v.pop(p.x, p.y, 2.35, "STOLEN", "#7fd0ff", 1); v.emit(10, b.x, b.y, 0.1, DUST); }
  else if (k === "rainbow") { v.pop(p.x, p.y, 2.4, "RAINBOW!", "#ff7ab8", 1); v.emit(18, b.x, b.y, 0.4, {sp: 4, up: 3, l: 0.7, s: 0.1, c: ["#ff4f7a", "#ffd23b", "#5ee6a8", "#5ee6ff", "#b266ff"], k: 2}); }
  else if (k === "megpt") v.pop(p.x, p.y, 2.9, "+1", "#ffd23b", 1);
  else if (k === "megs") { v.pop(p.x, p.y, 2.35, "MEGS!", "#ffd23b", 1); v.emit(18, b.x, b.y, 0.3, {sp: 4.5, up: 2.5, l: 0.6, s: 0.1, c: ["#ffd23b", "#ffffff"], k: 2}); v.flash = Math.max(v.flash, 0.22); }
  else if (k === "ankles") v.pop(p.x, p.y, 2.35, "ANKLES!", "#ff7ab8", 1);
  else if (k === "tackle") { v.pop(p.x, p.y, 2.3, "TACKLE", "#7fd0ff"); v.emit(8, b.x, b.y, 0.1, DUST); }
  else if (k === "block") v.pop(p.x, p.y, 2.3, "BLOCKED", "#7fd0ff");
  else if (k === "save") v.pop(p.x, p.y, 2.3, "SAVED", "#7fd0ff");
  else if (k === "legs") v.pop(b.x, b.y, 1.3, "THROUGH THE LEGS", "#ffd23b", 1);
  else if (k === "read") v.pop(p.x, p.y, 2.3, "READ IT", "#7fd0ff");
  else if (k === "move") {
    if (e.s === "burst" || e.s === "cut" || e.s === "press") v.emit(4, p.x, p.y, 0.05, DUST);
    else if (e.s === "elastico") { v.pop(p.x, p.y, 2.3, "ELASTICO", "#d6ff3b"); v.emit(6, p.x, p.y, 0.05, DUST); }
    else if (e.s === "wallpass") v.pop(p.x, p.y, 2.3, "ONE-TWO", "#d6ff3b");
  }
  else if (k === "goal") { v.gm = e.g ? m.L : 0; v.cele(m, e); v.gm = 0; }
};
// the scorer's goal celebration
V.cele = function(m, e){
  var v = this, sd = v.sides[e.by], k = sd.fx, col = [sd.col[0], sd.col[1], "#ffffff", "#ffd23b"], x = e.x, z = Math.max(0.3, e.z), i, a, r;
  v.shake = 0.9; v.flash = Math.max(v.flash, 0.3);
  if (k === "shock") { v.ring(x, 0.6, col[0]); v.at(0.15, function(){ v.ring(x, 0.6, col[1]); }); v.at(0.3, function(){ v.ring(x, 0.6, "#ffffff"); }); v.emit(28, x, 0.2, z, {sp: 9, l: 0.5, s: 0.08, c: col, k: 3, g: 0.2}); }
  else if (k === "ink") { v.emit(42, x, 0.3, z, {sp: 7, up: 3, l: 1.4, s: 0.2, c: col}); v.emit(30, x, 0.3, z, {sp: 4, up: 2, l: 1.1, s: 0.11, c: col}); }
  else if (k === "firework") { for (i = 0; i < 5; i++) v.at(i * 0.2, function(){ var c = ["#ff4f7a", "#5ee6ff", "#ffd23b", "#5ee6a8", "#b266ff"][Math.floor(Math.random() * 5)]; v.emit(34, (Math.random() - 0.5) * 11, 0.5, 4.5 + Math.random() * 3, {sp: 6.5, l: 1.1, s: 0.07, c: [c, "#ffffff"], k: 3, g: 0.35}); v.flash = Math.max(v.flash, 0.1); }); }
  else if (k === "pixel") v.emit(72, x, 0.3, z, {sp: 7, up: 3, l: 1.3, s: 0.1, c: ["#5ee6a8", "#3b6ef5", "#ff7ab8", "#ffd23b"], k: 1, g: 0.8});
  else if (k === "bolt") { v.bolt(x, 0.3); v.flash = 0.5; v.at(0.14, function(){ v.bolt(-GW, 0.4); v.flash = 0.35; }); v.at(0.3, function(){ v.bolt(GW, 0.4); v.flash = 0.35; }); }
  else if (k === "gold") v.emit(64, 0, 1.4, 7, {sp: 3.2, r: 6, l: 2.4, s: 0.11, c: ["#ffd766", "#f5c344", "#fff3b0"], k: 5, g: 0.55});
  else if (k === "hole") {
    for (i = 0; i < 54 * v.o.fx; i++) { a = Math.random() * PI; r = 2.4 + Math.random() * 1.6; v.parts.push({x: (v.gm ? -x : x) + Math.cos(a) * r, y: v.gm ? v.gm - 0.3 : 0.3, z: z + Math.sin(a) * r, vx: -Math.cos(a) * r / 0.55, vy: 0, vz: -Math.sin(a) * r / 0.55, l: 0.55, m: 0.55, s: 0.09, c: i & 1 ? "#8a3dff" : "#1a0d33", k: 0, g: 0, a: 0}); }
    v.at(0.55, function(){ v.ring(x, 0.6, "#8a3dff"); v.emit(40, x, 0.3, z, {sp: 9, l: 0.7, s: 0.08, c: ["#8a3dff", "#ffffff", "#5ee6ff"], k: 3, g: 0.2}); v.flash = Math.max(v.flash, 0.3); });
  }
  else if (k === "ripple") [0, 1, 2, 3].forEach(function(n){ v.at(n * 0.14, function(){ v.ring(x, 0.6 + n * 0.5, col[n % 2]); }); });
  else if (k === "snow") v.emit(90, 0, 4, 8, {sp: 1.2, r: 14, l: 3, s: 0.06, c: ["#ffffff", "#dff1ff"], g: 0.12});
  else if (k === "laser") [0, 1, 2, 3, 4, 5].forEach(function(n){ v.at(n * 0.09, function(){ v.bolt((n - 2.5) * 2.6, 1 + (n & 1) * 2); v.flash = Math.max(v.flash, 0.12); }); });
  else if (k === "volcano") [0, 1, 2, 3].forEach(function(n){ v.at(n * 0.12, function(){ v.emit(26, x, 0.4, 0.2, {sp: 3.5, up: 11, l: 1.6, s: 0.1, c: ["#ff5a1f", "#ffd23b", "#ff8a1f", "#3d0a05"], g: 1}); }); });
  else if (k === "starfall") v.emit(70, 0, 5, 9, {sp: 2, r: 15, l: 2.6, s: 0.11, c: ["#fff6c2", "#ffffff", "#c9a6ff"], k: 2, g: 0.5});
  else if (k === "aurora") ["#5ee6a8", "#5ee6ff", "#b266ff", "#ff7ab8", "#ffffff"].forEach(function(cc, n){ v.at(n * 0.1, function(){ v.ring(x, 0.6, cc); v.emit(16, x, 0.3, z, {sp: 8, up: 3, l: 1, s: 0.08, c: ["#5ee6a8", "#5ee6ff", "#b266ff"], k: 3, g: 0.15}); }); });
  else if (k === "nova") { v.flash = 0.7; v.ring(x, 0.6, "#ffffff"); v.emit(90, x, 0.3, z, {sp: 12, up: 2, l: 1.3, s: 0.1, c: ["#fff6c2", "#ffb938", "#ffffff"], k: 2, g: 0.1}); v.at(0.25, function(){ v.ring(x, 0.6, "#ffd23b"); v.ring(x, 1.6, "#ff8a1f"); v.emit(60, x, 0.3, z, {sp: 7, l: 1.5, s: 0.08, c: ["#ff8a1f", "#fff6c2"], k: 3, g: 0.2}); }); }
  else { v.emit(48, -GW, 0.2, GH, {sp: 7, up: 5, l: 2.2, s: 0.09, c: col, k: 6, g: 0.45}); v.emit(48, GW, 0.2, GH, {sp: 7, up: 5, l: 2.2, s: 0.09, c: col, k: 6, g: 0.45}); }
};
V.fxDraw = function(dt){
  var v = this, g = v.g, ps = v.parts, sc = clamp(v.w / 960, 0.62, 1.15), n = 0, i, p, a, r, k, e;
  while (v.later.length && v.later[0].t <= v.t) { e = v.later.shift(); v.gm = e.gm; e.f(); v.gm = 0; }
  for (i = 0; i < ps.length; i++) {
    p = ps[i]; p.l -= dt; if (p.l <= 0) continue;
    p.vz -= 9.8 * p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.z < 0.02 && p.k !== 4) { p.z = 0.02; p.vz *= -0.35; p.vx *= 0.7; p.vy *= 0.7; }
    ps[n++] = p;
    a = v.pr(p.x, p.y, p.z); if (a.d < 1) continue;
    r = Math.max(0.8, p.s * a.s); g.globalAlpha = Math.min(1, p.l / p.m * 2.2); g.fillStyle = g.strokeStyle = p.c; k = p.k;
    if (k === 1) g.fillRect(a.x - r, a.y - r, r * 2, r * 2);
    else if (k === 2) star(g, a.x, a.y, r * 1.6, 4, p.a + v.t * 3);
    else if (k === 3) { g.lineWidth = Math.max(1, r * 0.6); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x - p.vx * a.s * 0.035, a.y + p.vz * a.s * 0.035); g.stroke(); }
    else if (k === 4) { p.s += dt * 7; g.lineWidth = Math.max(1.5, 0.14 * a.s * g.globalAlpha); g.beginPath(); g.ellipse(a.x, a.y, p.s * a.s, p.s * a.s * 0.36, 0, 0, TAU); g.stroke(); }
    else if (k === 5) { g.beginPath(); g.ellipse(a.x, a.y, r * Math.abs(Math.cos(p.a + v.t * 9)) + 0.6, r, 0, 0, TAU); g.fill(); }
    else if (k === 6) { g.save(); g.translate(a.x, a.y); g.rotate(p.a + v.t * 7); e = Math.cos(p.a * 3 + v.t * 11); g.fillRect(-r, -r * 0.5 * e, r * 2, r * e); g.restore(); }
    else { g.beginPath(); g.arc(a.x, a.y, r, 0, TAU); g.fill(); }
  }
  ps.length = n;
  for (i = v.bolts.length - 1; i >= 0; i--) { e = v.bolts[i]; e.l -= dt; if (e.l <= 0) { v.bolts.splice(i, 1); continue; } r = Math.min(1, e.l * 6); v.line(e.p, 0.34, "#7fb0ff", 0.35 * r); v.line(e.p, 0.09, "#ffffff", r); }
  g.textAlign = "center"; g.textBaseline = "middle";
  for (i = v.pops.length - 1; i >= 0; i--) {
    p = v.pops[i]; p.l -= dt; if (p.l <= 0) { v.pops.splice(i, 1); continue; }
    a = v.pr(p.x, p.y, p.z); if (a.d < 1) continue; k = 1 - p.l / p.m; r = (p.big ? 25 : 15) * sc * (k < 0.12 ? 0.6 + k * 3.4 : 1);
    g.globalAlpha = Math.min(1, p.l * 3); g.font = "italic 900 " + Math.round(r) + "px " + FONT; g.lineWidth = Math.max(3, r * 0.22); g.strokeStyle = "rgba(8,9,22,.85)";
    g.strokeText(p.txt, a.x, a.y - k * 34); g.fillStyle = p.col; g.fillText(p.txt, a.x, a.y - k * 34);
  }
  g.globalAlpha = 1;
};

// ---- ball trail, shadows, players ----
var RIB = {line: "#ffffff", dust: "#cfd3e6", flame: "#ff7a1f", ice: "#9fe0ff", void: "#8a3dff", bolt: "#fff6a8", star: "#c9a6ff", spark: "#ffd766", pixel: "#5ee6a8", bubble: "#bfe9ff", leaf: "#ff8a1f", toxic: "#a6ff3b", gold: "#ffd766", comet: "#eaf6ff", nebula: "#b266ff"};
var TPART = {flame: [["#ff7a1f", "#ffd23b", "#ff4f2a"], 0, -0.25], ice: [["#bfe9ff", "#ffffff"], 1, 0.3], spark: [["#ffd766", "#fff3b0"], 2, 0.2], pixel: [["#5ee6a8", "#3b6ef5", "#ff7ab8"], 1, 0.4], star: [["#c9a6ff", "#ffffff"], 2, 0.1], void: [["#8a3dff", "#1a0d33"], 0, -0.1], dust: [["#cfd3e6"], 0, 0.3], bolt: [["#fff6a8"], 3, 0],
  bubble: [["#bfe9ff", "#ffffff"], 0, -0.25], leaf: [["#ff8a1f", "#c2410c", "#ffd23b"], 6, 0.35], toxic: [["#a6ff3b", "#3fcf8e"], 0, -0.15], gold: [["#ffd766", "#fff3b0"], 5, 0.5], comet: [["#ffffff", "#9fd0ff"], 2, 0.05],
  prism: [["#ff4f7a", "#ffd23b", "#5ee6a8", "#5ee6ff", "#b266ff"], 2, 0.1], nebula: [["#b266ff", "#ff7ab8", "#5ee6ff"], 0, -0.05]};
var AURA = {spark: [["#ffd766", "#fff3b0"], 2, 0.6, -0.1], ember: [["#ff7a1f", "#ffd23b"], 0, 0.9, -0.2], frost: [["#bfe9ff", "#ffffff"], 2, -0.1, 0.12], star: [["#c9a6ff", "#ffffff", "#ff7ab8"], 2, 0.4, -0.05], glitch: [["#5ee6ff", "#ff4f7a"], 1, 0.2, 0], void: [["#8a3dff", "#3b1f8a"], 0, 0.7, -0.15],
  bolt: [["#ffffff", "#9fd0ff"], 3, 1.2, 0.3], corona: [["#ffd98a", "#fff6d6", "#ff8a1f"], 2, 0.8, -0.15], chrome: [["#ffffff", "#c9d2e6"], 2, 0.3, -0.05], toxic: [["#a6ff3b", "#3fcf8e"], 0, 0.7, -0.2], petal: [["#ff7ab8", "#ffd6e6"], 6, 0.2, 0.25]};
V.trail = function(m){
  var v = this, g = v.g, b = m.b, h = v.hist, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz), sd = v.sides[b.last < 0 ? 0 : b.last], k = sd && v.o.trail ? sd.trail : "none",
    on = b.own < 0 && sp > 5 && !b.inGoal, T = TPART[k], thin = k === "dust" || k === "spark" || k === "pixel" || k === "star" || k === "bubble" || k === "leaf" || k === "gold", n, i, a, c, u;
  if (on) { h.push(b.x, b.y, b.z + VR - BR); if (h.length > 42) h.splice(0, 3); } else if (h.length) h.splice(0, Math.min(h.length, 6));
  n = h.length / 3; if (k === "none" || n < 2) return;
  if (on && T && (v.tick & 1) && (k !== "dust" || b.z < 0.5)) v.emit(1, b.x, b.y, b.z + 0.1, {sp: 0.9, up: 0.5, l: 0.5, s: 0.065, c: T[0], k: T[1], g: T[2]});
  a = v.pr(h[0], h[1], h[2]);
  for (i = 1; i < n; i++) {
    c = v.pr(h[i * 3], h[i * 3 + 1], h[i * 3 + 2]); u = i / n;
    if (k === "bolt") { c.x += (Math.random() - 0.5) * 9 * (1 - u); c.y += (Math.random() - 0.5) * 9 * (1 - u); }
    g.globalAlpha = u * (thin ? 0.28 : 0.8); g.strokeStyle = k === "rainbow" || k === "prism" ? "hsl(" + Math.round((i * 26 + v.t * 300) % 360) + ",95%,62%)" : RIB[k] || "#ffffff";
    g.lineWidth = Math.max(1, VR * c.s * (k === "bolt" ? 0.5 : 1.7) * u); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(c.x, c.y); g.stroke();
    if (k === "void" || k === "flame") { g.strokeStyle = k === "void" ? "#0a0612" : "#ffe27a"; g.lineWidth *= 0.45; g.stroke(); }
    a = c;
  }
  g.globalAlpha = 1;
};
V.under = function(m){
  var v = this, g = v.g, b = m.b, i, p, a, r;
  for (i = 0; i < 2; i++) {
    p = m.p[i]; a = v.pr(p.x, p.y, 0); r = a.s * 0.42; if (a.d < 1.6) continue;
    g.fillStyle = "rgba(0,0,10,.3)"; g.beginPath(); g.ellipse(a.x, a.y, r, r * 0.36, 0, 0, TAU); g.fill();
    if (v.o.rings) {
      g.lineWidth = Math.max(2, a.s * 0.05); g.strokeStyle = v.sides[i].ring; g.globalAlpha = 0.28; g.beginPath(); g.ellipse(a.x, a.y, r * 1.35, r * 0.5, 0, 0, TAU); g.stroke();
      g.globalAlpha = 0.95; g.beginPath(); g.ellipse(a.x, a.y, r * 1.35, r * 0.5, 0, -PI / 2, -PI / 2 + TAU * clamp(p.stam, 0.001, 1)); g.stroke(); g.globalAlpha = 1;
    }
  }
  if (b.y > -GD) { a = v.pr(b.x, b.y, 0); r = VR * a.s * (1 + b.z * 0.1); g.fillStyle = "rgba(0,0,10," + (0.36 * (1 - Math.min(0.8, b.z / 7))).toFixed(3) + ")"; g.beginPath(); g.ellipse(a.x, a.y, r, r * 0.36, 0, 0, TAU); g.fill(); }
};
V.man = function(m, i){
  var v = this, g = v.g, p = m.p[i], sd = v.sides[i], c = v.cam, dx = c.x - p.x, dy = c.y - p.y, l = hyp(dx, dy) || 1, q = poseOf(p, m, v.t), A = v.o.aura ? AURA[sd.aura] : null, a, k, j;
  a = v.pr(p.x, p.y, 2.12 + q.z); if (a.d < 1.6) return;
  figure(g, v.P, p.x, p.y, 0, p.fa, q, sd, dx / l, dy / l, v.t);
  if (p.act === "stumble" || p.act === "megged") { g.fillStyle = "#ffd23b"; for (j = 0; j < 3; j++) { k = v.t * 7 + j * 2.1; star(g, a.x + Math.cos(k) * a.s * 0.3, a.y + Math.sin(k) * a.s * 0.09, a.s * 0.075, 5, k); } }
  else if (sd.name && v.o.names) {
    g.font = "700 " + Math.round(clamp(a.s * 0.2, 10, 15)) + "px " + FONT; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.lineWidth = 3; g.strokeStyle = "rgba(8,9,22,.8)";
    g.strokeText(sd.name, a.x, a.y - 3); g.fillStyle = sd.human ? "#ffffff" : "#c9cde6"; g.fillText(sd.name, a.x, a.y - 3);
  }
  if (A && (v.tick + i) % 3 === 0) v.emit(1, p.x, p.y, 0.3 + Math.random() * 1.3, {sp: 0.5, r: 0.7, up: A[2], l: 0.8, s: 0.055, c: A[0], k: A[1], g: A[3]});
};
V.ent = function(m, k){
  var v = this, b = m.b, a;
  if (k >= 0) return v.man(m, k);
  v.trail(m); a = v.pr(b.x, b.y, b.z + VR - BR);
  drawBall(v.g, a.x, a.y, Math.max(2.5, VR * a.s), v.ball, v.pts, v.t, v.cam.sn, v.cam.cs);
};
// shot meter beside the shooter, and where the shot is aimed
V.meter = function(m, i){
  var v = this, g = v.g, p = m.p[i], q = m.meter(p), rl = p.rel, Wd = 132, hh = 12, cb = v.o.cb, mm, gw, a, x, y;
  if (!q && !(rl && m.t - rl.t < 0.75)) return;
  mm = q ? q.m : rl.m; gw = q ? q.gw : rl.gw; a = v.pr(p.x, p.y, 2.25); if (a.d < 1.6) return; x = clamp(a.x - Wd / 2, 6, v.w - Wd - 6); y = Math.max(8, a.y - 30);
  g.fillStyle = "rgba(8,9,22,.85)"; g.fillRect(x - 3, y - 3, Wd + 6, hh + 6); g.fillStyle = "#a8323e"; g.fillRect(x, y, Wd, hh);
  g.fillStyle = cb ? "#2f7fe0" : "#27b36f"; g.fillRect(x + Wd / 2 * (1 - gw), y, Wd * gw, hh);   // the goal
  g.fillStyle = cb ? "#d7ecff" : "#b9ffdc"; g.fillRect(x + Wd / 2 * (1 - gw * 0.35), y, Wd * gw * 0.35, hh);
  g.fillStyle = "#ffffff"; g.fillRect(x + Wd / 2 * (1 - gw) - 1, y - 3, 2, hh + 6); g.fillRect(x + Wd / 2 * (1 + gw) - 1, y - 3, 2, hh + 6);   // the posts
  a = x + Wd / 2 * (1 + clamp(mm, -1, 1));
  g.fillStyle = "rgba(8,9,22,.9)"; g.fillRect(a - 4, y - 6, 8, hh + 12);
  g.fillStyle = q ? "#ffffff" : rl.q === 2 ? (cb ? "#7fd0ff" : "#5ee6a8") : rl.q ? "#d6ff3b" : "#ff6b6b"; g.fillRect(a - 2.5, y - 5, 5, hh + 10);
};
// a dashed line from the ball to where a wound-up shot is aimed, for both players, so it can be blocked
V.aimLine = function(m, i){
  var v = this, g = v.g, p = m.p[i], b = m.b, n = 14, T, k, q, u;
  if (p.act !== "wind" || b.own !== i || !v.o.aim) return;
  T = m.target(p); g.strokeStyle = g.fillStyle = v.sides[i].ring; g.lineWidth = 3.2; g.setLineDash([10, 7]); g.lineDashOffset = -v.t * 46; g.globalAlpha = 0.9;
  g.beginPath(); for (k = 0; k <= n; k++) { u = k / n; q = v.pr(lerp(b.x, T.x, u), lerp(b.y, T.y, u), 0.04 + (T.z - 0.04) * u * u); if (q.d > 0.8) g.lineTo(q.x, q.y); } g.stroke(); g.setLineDash([]);
  q = v.pr(T.x, T.y, T.z);
  if (q.d > 0.8) { u = Math.max(6, q.s * 0.17); g.lineWidth = 2.4; g.beginPath(); g.arc(q.x, q.y, u, 0, TAU); g.stroke(); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 0.9; g.beginPath(); g.moveTo(q.x - u * 1.5, q.y); g.lineTo(q.x + u * 1.5, q.y); g.moveTo(q.x, q.y - u * 1.5); g.lineTo(q.x, q.y + u * 1.5); g.stroke(); }
  g.globalAlpha = 1;
};
// the goal at the near end of a full pitch, seen from behind
V.goalB = function(m){ var v = this; if (!m.L || v.cam.y < m.L + 0.5) return; v.mir = m.L; v.net(); v.frame(); v.mir = 0; };
// advance the effects by dt seconds and paint one frame
V.draw = function(m, dt){
  var v = this, g = v.g, c = v.cam, b = m.b, o = v.o, f0 = Math.max(v.w * c.k, 520), k = Math.min(1, dt * 3), L = m.L || D, ty = m.L ? Math.max(b.y, Math.min(Math.max(m.p[0].y, m.p[1].y), b.y + 4.5)) : Math.max(b.y, m.p[0].y, m.p[1].y), tx = (b.x * 2 + m.p[0].x + m.p[1].x) / 4, i, list;
  v.t += dt; v.tick++;
  c.f = f0 * (1 + 0.14 * o.zoom); c.cx = v.w / 2; c.cy = Math.min(v.h * 0.5, f0 * 0.28125 / c.k);
  // stay behind whoever is furthest from goal so both players and the ball are always in shot
  i = m.L ? clamp((b.y - m.L + 13) / 6, 0, 1) * 5.6 : 0;   // on a full pitch, drop back far enough to see the near goal
  c.y += (clamp(ty + c.back + i, c.back + 1, L + c.back + i) - c.y) * k; c.x += (clamp(tx, -W, W) * (v.w < 640 ? 0.8 : 0.55) * o.pan - c.x) * k;
  v.shake = Math.max(0, v.shake - dt * 2.4); c.sx = (Math.random() - 0.5) * v.shake * 16 * o.shake; c.sy = (Math.random() - 0.5) * v.shake * 12 * o.shake;
  spin(v.pts, -b.vy * 2.2, b.vx * 2.2, b.spin * 1.6, dt);
  g.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); g.globalAlpha = 1; g.lineCap = g.lineJoin = "round";
  g.fillStyle = v.th.far; g.fillRect(0, 0, v.w, v.h);
  v.back(); v.floor(m); v.walls(m); v.net(); v.under(m);
  list = [[b.y, -1], [m.p[0].y, 0], [m.p[1].y, 1]].sort(function(p, q){ return p[0] - q[0]; });
  for (i = 0; i < 3; i++) if (list[i][0] < 0.12) v.ent(m, list[i][1]);
  v.frame();
  for (i = 0; i < 3; i++) if (list[i][0] >= 0.12) v.ent(m, list[i][1]);
  v.goalB(m); v.aimLine(m, 0); v.aimLine(m, 1);
  v.fxDraw(dt);
  if (o.meter) { v.meter(m, 0); v.meter(m, 1); }
  if (v.flash > 0) { if (o.flash) { g.fillStyle = "rgba(255,255,255," + Math.min(0.7, v.flash).toFixed(3) + ")"; g.fillRect(0, 0, v.w, v.h); } v.flash -= dt * 1.6; }
};

// ---- previews for the menus ----
// winning emotes: each one poses the figure for time t and may turn or shift it
var EMOTE = R.EMOTE = {
  knee: function(q, t){ var u = t * 0.9 % 1; q.z = -0.34; q.bL = q.bR = 2; q.aL = q.aR = -0.5; q.lean = -0.3; q.uL = q.uR = 1.1; q.oL = q.oR = 1.25; q.eL = q.eR = 0.1; return {x: (u - 0.5) * 1.1}; },
  sky: function(q, t){ var u = t * 0.62 % 1, j = u < 0.5 ? Math.sin(u * 2 * PI) : 0; q.z = 0.62 * j; if (u < 0.5) { q.uL = q.uR = 1.5; q.oL = q.oR = 0.5; q.bL = q.bR = 0.5 * j; } else { q.uL = q.uR = 0.42; q.oL = q.oR = 0.75; q.eL = q.eR = 0.05; q.sL = q.sR = 0.3; q.lean = -0.08; } return {turn: u < 0.5 ? u * 2 * PI : PI}; },
  flex: function(q, t){ var w = Math.sin(t * 5); q.uL = q.uR = 1.6; q.oL = q.oR = 1.2; q.eL = q.eR = 2 + 0.25 * w; q.sL = q.sR = 0.2; q.lean = -0.04; },
  robot: function(q, t){ var k = Math.floor(t * 3) % 4; q.uL = k & 1 ? 1.57 : 0.1; q.uR = k & 2 ? 1.57 : 0.1; q.oL = q.oR = 0.9; q.eL = k & 2 ? 1.57 : 0; q.eR = k & 1 ? 1.57 : 0; q.lean = 0; return {turn: (k - 1.5) * 0.25}; },
  plane: function(q, t){ q.uL = q.uR = 1.5; q.oL = q.oR = 1.5; q.eL = q.eR = 0; q.lean = 0.25; q.aL = Math.sin(t * 9) * 0.6; q.aR = -q.aL; q.bL = q.bR = 0.5; return {turn: PI / 2 + Math.sin(t * 1.6) * 0.5, x: Math.sin(t * 1.6) * 0.45}; },
  salute: function(q, t){ q.uR = 2.2; q.oR = 0.9; q.eR = 2.3; q.uL = 0.05; q.eL = 0.05; q.lean = -0.03; q.sL = q.sR = 0.02; },
  bow: function(q, t){ var w = (Math.sin(t * 2.4) + 1) / 2; q.lean = 0.1 + 0.75 * w; q.uL = q.uR = 0.3 + 0.9 * w; q.oL = q.oR = 0.6; q.eL = q.eR = 0.2; q.nod = w; },
  whirl: function(q, t){ q.uL = q.uR = 1.57; q.oL = q.oR = 1.4; q.eL = q.eR = 0; q.z = 0.06 * Math.abs(Math.sin(t * 8)); q.sL = q.sR = 0.1; return {turn: t * 7}; }
};
// o: {spin, turn, pose: "win", zoom, bust, emote}
R.portrait = function(cv, s, t, o){
  o = o || {};
  var g = cv.getContext("2d"), w = cv.width, h = cv.height, S = h / (o.bust ? 1.02 : o.zoom || 2.3), by = h * (o.bust ? 1.82 : 0.94), q = pose0(), sd = s.tex ? s : side(s), wv = Math.sin(t * 2.2), fa = PI / 2 + (o.spin ? t * 0.9 : o.turn || 0);
  function prj(x, y, z){ return {x: w / 2 + x * S, y: by - z * S - y * S * 0.14, s: S, d: 10 - y}; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = g.lineJoin = "round";
  q.lean = 0.04 + 0.012 * wv; q.eL = q.eR = 0.32 + 0.04 * wv;
  var em = o.emote || (o.pose === "win" ? sd.emote : ""), ex = null;
  if (EMOTE[em]) ex = EMOTE[em](q, t) || {};
  else if (o.pose === "win") { q.uL = q.uR = 2.85; q.oL = q.oR = 0.5 + 0.12 * wv; q.eL = q.eR = 0.2; q.z = 0.1 * Math.abs(Math.sin(t * 5)); }
  g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(w / 2 + (ex && ex.x || 0) * S, by, S * 0.36, S * 0.09, 0, 0, TAU); g.fill();
  figure(g, prj, ex && ex.x || 0, 0, 0, fa + (ex && ex.turn || 0), q, sd, 0, 1, t);
};
R.ballIcon = function(cv, id, t){
  var g = cv.getContext("2d"), w = cv.width, h = cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
  drawBall(g, w / 2, h / 2, Math.min(w, h) * 0.34, MG.ITEM[id] || MG.ITEM.classic, spin(ico(), 0.35, 0.2, 1, 0.6 + t), t, 0.3, 0.95);
};
R.View = View; R.side = side; R.kitTex = kitTex; R.wrapTex = wrapTex;
R.torso = torso; R.legJ = legJ; R.armJ = armJ; R.hbody = body; R.mask = mask;
R.figure = figure; R.pose0 = pose0; R.poseOf = poseOf; R.drawBall = drawBall; R.ico = ico; R.spin = spin; R.star = star; R.limb = limb; R.blob = blob; R.lum = lum; R.FONT = FONT; R.OUT = OUT; R.VR = VR;
})();
