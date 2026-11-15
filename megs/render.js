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
  sunset: {sky: ["#3a1d5c", "#f0703c", "#ffd58a"], far: "#371827", win: "#ffe6a8", floor: ["#b85c3e", "#ab5237"], in1: "rgba(255,240,200,.06)", line: "#fff1d0", board: "#5c2b2b", trim: "#ffd58a", rail: "#ffd58a", mesh: "rgba(255,230,170,.15)", lamp: "#ffe6a8", night: 0.25, sun: 1}
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
  var p = it.p, col = it.c, w = 80, h = 100, key, c, x, r, i, j, a, b, g, big;
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
  else if (p === "crown") { x.fillRect(0, 0, w, 7); x.fillRect(0, h - 9, w, 9); if (!back) crown(x, 40, 46, 15); }
  else if (p === "n67") x.fillRect(0, h - 8, w, 8);
  x.globalAlpha = 1; x.shadowBlur = 0; x.setLineDash([]); x.fillStyle = col[1]; x.beginPath();
  if (back) x.ellipse(40, 0, 13, 6, 0, 0, TAU); else { x.moveTo(27, 0); x.lineTo(40, 13); x.lineTo(53, 0); }
  x.fill();
  big = back || p === "n67"; a = lum(col[0]) > 0.6 ? "#17171c" : "#ffffff";
  if (big || p !== "crown") {
    x.textAlign = "center"; x.textBaseline = "middle"; x.lineJoin = "round"; x.font = "800 " + (big ? 40 : 15) + "px " + FONT;
    b = p === "n67" ? "67" : String(num); i = big ? 40 : 58; j = big ? 54 : 30;
    x.lineWidth = big ? 5 : 3; x.strokeStyle = a === "#ffffff" ? "rgba(0,0,0,.5)" : "rgba(255,255,255,.6)"; x.strokeText(b, i, j);
    x.fillStyle = p === "n67" ? col[1] : a; x.fillText(b, i, j);
  }
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
    if (f < 0.1) continue;
    u = x + p[0] * r * 0.92; v = y - (p[2] * cs - p[1] * sn) * r * 0.92; q = r * (s === 1 ? 0.56 : 0.36);
    g.fillStyle = s === 1 ? c[1 + i % 3] : c[1];
    if (s === 2) { if (i % 3 === 0) star(g, u, v, q * 1.5 * f, 5, 0); }
    else if (s === 3) dia(g, u, v, q * 0.75 * f, q * 1.1);
    else if (s === 5) g.fillRect(u - q * 0.55 * f, v - q * 0.55, q * 1.1 * f, q * 1.1);
    else if (s === 6) { g.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(t * 4 + i * 2.1)); g.fillRect(u - q * 0.5, v - q * 0.5, q, q); g.globalAlpha = 1; }
    else { g.beginPath(); g.ellipse(u, v, q * Math.max(0.3, f), q, Math.atan2(v - y, u - x), 0, TAU); g.fill(); }
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
  var r = 0.205 * s, x = H.x, y = H.y, hc = MG.HAIR[sd.hc] || "#1b1b1f", st = sd.hair, sw = Math.sqrt(Math.max(0, 1 - c * c)) * (sg < 0 ? -1 : 1), bx = x - sw * r * 0.16, ex, w, i;
  limb(g, N, H, 0.1 * s, sd.skin);
  if (c > 0 && (st === 1 || st === 2)) blob(g, bx, y + (st === 1 ? -r * 0.25 : r * 0.42), r * (st === 1 ? 1.3 : 1.14), r * (st === 1 ? 1.3 : 1.5), hc);
  blob(g, x, y, r, r, sd.skin);
  if (c > -0.3) {
    ex = sw * r * 0.72; w = r * 0.36 * Math.max(0.2, c); g.fillStyle = "#15151c";
    for (i = -1; i <= 1; i += 2) if (Math.abs(ex + i * w) < r * 0.82) { g.beginPath(); g.ellipse(x + ex + i * w, y + r * (0.1 + 0.22 * q.nod), r * 0.11, r * 0.17, 0, 0, TAU); g.fill(); }
  }
  g.fillStyle = hc;
  if (c <= 0 && (st === 1 || st === 2)) blob(g, bx, y + (st === 1 ? -r * 0.2 : r * 0.36), r * (st === 1 ? 1.3 : 1.12), r * (st === 1 ? 1.3 : 1.5), hc);
  else if (st === 3) { g.globalAlpha = 0.3; cap(g, bx, y, r, c); g.globalAlpha = 1; blob(g, bx, y - r * 1.02, r * lerp(0.8, 0.24, Math.abs(c)), r * 0.62, hc); }
  else cap(g, bx, y, r, c);
}
var KFX = {gold: 1, holo: 1, nova: 1, frost: 1, crown: 1, lava: 2, void: 2, neon: 2, galaxy: 2, glitch: 3};
function torso(g, T, B, wt, wb, sd, back, t){
  var vx = B.x - T.x, vy = B.y - T.y, l = hyp(vx, vy) || 1, nx = vy / l, ny = -vx / l, tex = sd.tex[back ? 1 : 0], k = KFX[sd.p], a, gr;
  g.beginPath(); g.moveTo(T.x - nx * wt, T.y - ny * wt); g.lineTo(T.x + nx * wt, T.y + ny * wt); g.lineTo(B.x + nx * wb, B.y + ny * wb); g.lineTo(B.x - nx * wb, B.y - ny * wb); g.closePath();
  g.lineWidth = 2.4; g.strokeStyle = OUT; g.stroke();
  g.save(); g.clip(); g.transform(nx * wt / 40, ny * wt / 40, vx / 100, vy / 100, T.x - nx * wt, T.y - ny * wt);
  g.drawImage(tex, 0, 0);
  if (k === 1) { a = ((t * 0.5 + 0.3) % 1.7) * 150 - 50; g.globalAlpha = 0.38; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(a, 0); g.lineTo(a + 16, 0); g.lineTo(a - 24, 100); g.lineTo(a - 40, 100); g.fill(); }
  else if (k === 2) { g.globalAlpha = 0.14 + 0.13 * Math.sin(t * 3.3); g.fillStyle = sd.col[1]; g.fillRect(0, 0, 80, 100); }
  else if (k === 3) { a = Math.floor(t * 11); g.drawImage(tex, 0, a * 37 % 90, 80, 9, (a % 3 - 1) * 7, a * 37 % 90, 80, 9); g.drawImage(tex, 0, a * 53 % 90, 80, 6, a % 2 ? 6 : -6, a * 53 % 90, 80, 6); }
  g.globalAlpha = 1; gr = g.createLinearGradient(0, 0, 80, 0); gr.addColorStop(0, "rgba(255,255,255,.14)"); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,20,.26)"); g.fillStyle = gr; g.fillRect(0, 0, 80, 100);
  g.restore();
}
// sd: a dressed side (see side() below); tcx, tcy: unit vector from the figure towards the camera
function figure(g, prj, x, y, z0, fa, q, sd, tcx, tcy, t){
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
  parts = [[J[0].k.d, 0], [J[1].k.d, 1], [J[0].e.d, 2], [J[1].e.d, 3], [(HC.d + NK.d) / 2, 4], [HD.d - 0.03, 5]].sort(function(m, n){ return n[0] - m[0]; });
  for (i = 0; i < 6; i++) {
    k = parts[i][1];
    if (k < 2) { j = J[k]; limb(g, j.h, j.k, 0.16 * s, skin); limb(g, j.k, j.f, 0.125 * s, col[1]); limb(g, j.f, j.t, 0.13 * s, sd.boot); limb(g, j.h, mid(j.h, j.k, 0.64), 0.2 * s, col[2]); }
    else if (k < 4) { j = J[k - 2]; limb(g, j.s, j.e, 0.105 * s, skin); limb(g, j.e, j.w, 0.09 * s, skin); limb(g, j.s, mid(j.s, j.e, 0.55), 0.13 * s, col[0]); }
    else if (k === 4) { limb(g, J[0].h, J[1].h, 0.21 * s, col[2]); torso(g, NK, P(0, 0, hip - 0.05), s * lerp(0.17, 0.265, ac), s * lerp(0.15, 0.215, ac), sd, c < 0, t); }
    else head(g, HD, NK, s, c, sg, q, sd);
  }
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
  else if (a === "burst") q.lean += 0.2;
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
function side(s){
  var it = MG.ITEM[s.kit] || MG.ITEM.home, lk = s.look || {}, cu = it.p === "custom" ? s.cus || {p: "solid", c: it.c} : null, col = cu ? cu.c : it.c, num = lk.num || 7;
  return {it: it, p: cu ? cu.p : it.p, col: col, tex: [kitTex(it, 0, num, cu), kitTex(it, 1, num, cu)], skin: MG.SKIN[lk.skin || 0] || MG.SKIN[0], hair: lk.hair || 0, hc: lk.hc || 0, aura: it.f || "",
    trail: (MG.ITEM[s.trail] || {}).k || "none", fx: (MG.ITEM[s.fx] || {}).k || "confetti", name: s.name || "", ring: s.ring || "#3b6ef5", human: !!s.human, boot: lum(col[1]) < 0.25 ? "#e9ebf5" : "#1b1b22"};
}
function View(cv){
  var v = this;
  v.cv = cv; v.g = cv.getContext("2d"); v.w = 960; v.h = 540; v.dpr = 1; v.t = 0; v.tick = 0;
  v.cam = {x: 0, y: 20, z: 7.4, f: 800, cx: 480, cy: 270, sn: Math.sin(0.5), cs: Math.cos(0.5), sx: 0, sy: 0, back: 9.2, k: 0.833};
  // options the settings screen can change
  v.o = {shake: 1, flash: 1, fx: 1, names: 1, rings: 1, meter: 1, aim: 1, pops: 1, zoom: 0, pan: 1, cb: 0, net: 1, trail: 1, aura: 1};
  v.parts = []; v.pops = []; v.nets = []; v.later = []; v.bolts = []; v.hist = []; v.pts = ico(); v.shake = 0; v.flash = 0; v.bg = null;
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
  var c = this.cam, ry = y - c.y, rz = z - c.z, d = -ry * c.cs - rz * c.sn, s = c.f / d;
  return {x: c.cx + c.sx + (x - c.x) * s, y: c.cy + c.sy - (rz * c.cs - ry * c.sn) * s, s: s, d: d};
};
// project a run of xyz points, cutting it where it passes behind the camera
V.run = function(a, closed){
  var v = this, c = v.cam, n = a.length / 3, out = [], near = 0.8, i, j, d0, d1, t;
  function dep(k){ return -(a[k * 3 + 1] - c.y) * c.cs - (a[k * 3 + 2] - c.z) * c.sn; }
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
    for (k = 0; k < 2; k++) { g.fillStyle = k ? th.far : "#4fa56f"; g.beginPath(); g.moveTo(0, h); for (x = 0; x <= w; x += 12) g.lineTo(x, h - h * (0.2 - k * 0.07 + 0.06 * Math.sin(x * 0.011 / sc + k * 2) + 0.03 * Math.sin(x * 0.03 / sc + k))); g.lineTo(w, h); g.fill(); }
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
  var v = this, th = v.th, i;
  v.poly([-W, 0, 0, W, 0, 0, W, D, 0, -W, D, 0], th.floor[0]);
  for (i = 1; i < 10; i += 2) v.poly([-W, i * 1.5, 0, W, i * 1.5, 0, W, i * 1.5 + 1.5, 0, -W, i * 1.5 + 1.5, 0], th.floor[1]);
  v.poly(ARCP, th.in1);
  if (th.glow) { v.line(ARCP, 0.34, th.line, 0.16); v.line(BOX, 0.3, th.line, 0.16); }
  v.line([-W, 0, 0, W, 0, 0, W, D, 0, -W, D, 0, -W, 0, 0], 0.09, th.line, 0.9); v.line(BOX, 0.08, th.line, 0.85); v.line(ARCP, 0.09, th.line, 0.9); v.line([-0.7, 11, 0, 0.7, 11, 0], 0.08, th.line, 0.8);
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
V.walls = function(){
  var v = this, th = v.th, e = GW + 0.1, b = -GD - 0.3, h = GH + 0.3, i;
  v.poly([-e, b, 0, e, b, 0, e, b, h, -e, b, h], "#0c0e20"); v.poly([-e, 0, 0, e, 0, 0, e, b, 0, -e, b, 0], "#171a33");
  for (i = -1; i <= 1; i += 2) v.poly([i * e, 0, 0, i * e, b, 0, i * e, b, h, i * e, 0, h], "#101228");
  v.poly([-e, 0, h, e, 0, h, e, 0, 3.4, -e, 0, 3.4], th.board); v.line([-e, 0, 3.4, e, 0, 3.4], 0.08, th.rail, 1); v.line([-e, 0, h, e, 0, h], 0.07, th.trim, 1);
  v.wall(-W, 0, -e, 0, "ARGYLE SMARTS"); v.wall(e, 0, W, 0, "MEGS 1v1"); v.wall(-W, 0, -W, D); v.wall(W, 0, W, D);
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
  for (i = 0; i < n.length; i++) { e = n[i]; if (e.f !== f) continue; t = v.t - e.t; d += e.amp * Math.exp(-((a - e.a) * (a - e.a) + (b - e.b) * (b - e.b)) * 1.8 - 3.2 * t) * Math.cos(11 * t); }
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
  n = Math.ceil(n * v.o.fx);
  for (i = 0; i < n && v.parts.length < 460; i++) {
    a = Math.random() * TAU; e = Math.random() * 2 - 1; sp = (o.sp || 0) * (0.35 + Math.random() * 0.65); f = Math.sqrt(1 - e * e);
    v.parts.push({x: x + (Math.random() - 0.5) * (o.r || 0), y: y + (Math.random() - 0.5) * (o.r || 0), z: z, vx: Math.cos(a) * sp * f, vy: Math.sin(a) * sp * f, vz: sp * e * 0.6 + (o.up || 0) * (0.5 + Math.random() * 0.5),
      l: (o.l || 0.5) * (0.6 + Math.random() * 0.4), m: o.l || 0.5, s: (o.s || 0.08) * (0.6 + Math.random() * 0.8), c: typeof c === "string" ? c : c[Math.floor(Math.random() * c.length)], k: o.k || 0, g: o.g == null ? 1 : o.g, a: Math.random() * TAU});
  }
};
V.ring = function(x, y, c){ this.parts.push({x: x, y: y, z: 0.04, vx: 0, vy: 0, vz: 0, l: 0.85, m: 0.85, s: 0.3, c: c, k: 4, g: 0, a: 0}); };
V.pop = function(x, y, z, txt, col, big){ if (this.o.pops) this.pops.push({x: x, y: y, z: z, txt: txt, col: col, l: big ? 1.3 : 0.95, m: big ? 1.3 : 0.95, big: big}); };
V.bolt = function(x, y){
  var p = [], ox = x + (Math.random() - 0.5) * 5, i;
  for (i = 0; i <= 7; i++) p.push(lerp(ox, x, i / 7) + (i && i < 7 ? (Math.random() - 0.5) * 1.4 : 0), y, lerp(13, 0, i / 7));
  this.bolts.push({p: p, l: 0.3}); this.emit(14, x, y, 0.2, {sp: 6, up: 2, l: 0.5, s: 0.07, c: ["#ffffff", "#9fd0ff"], k: 3, g: 0.6});
};
V.at = function(d, f){ this.later.push({t: this.t + d, f: f}); this.later.sort(function(a, b){ return a.t - b.t; }); };
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
  else if (k === "net") v.nets.push({f: e.f, a: e.f === 0 || e.f === 2 ? e.x : -b.y, b: e.f === 2 ? -b.y : e.z, amp: clamp(e.v * 0.03, 0.04, 0.55), t: v.t});
  else if (k === "megs") { v.pop(p.x, p.y, 2.35, "MEGS!", "#ffd23b", 1); v.emit(18, b.x, b.y, 0.3, {sp: 4.5, up: 2.5, l: 0.6, s: 0.1, c: ["#ffd23b", "#ffffff"], k: 2}); v.flash = Math.max(v.flash, 0.22); }
  else if (k === "ankles") v.pop(p.x, p.y, 2.35, "ANKLES!", "#ff7ab8", 1);
  else if (k === "tackle") { v.pop(p.x, p.y, 2.3, "TACKLE", "#7fd0ff"); v.emit(8, b.x, b.y, 0.1, DUST); }
  else if (k === "block") v.pop(p.x, p.y, 2.3, "BLOCKED", "#7fd0ff");
  else if (k === "save") v.pop(p.x, p.y, 2.3, "SAVED", "#7fd0ff");
  else if (k === "legs") v.pop(b.x, b.y, 1.3, "THROUGH THE LEGS", "#ffd23b", 1);
  else if (k === "read") v.pop(p.x, p.y, 2.3, "READ IT", "#7fd0ff");
  else if (k === "move") { if (e.s === "burst" || e.s === "cut") v.emit(4, p.x, p.y, 0.05, DUST); }
  else if (k === "goal") v.cele(m, e);
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
    for (i = 0; i < 54 * v.o.fx; i++) { a = Math.random() * PI; r = 2.4 + Math.random() * 1.6; v.parts.push({x: x + Math.cos(a) * r, y: 0.3, z: z + Math.sin(a) * r, vx: -Math.cos(a) * r / 0.55, vy: 0, vz: -Math.sin(a) * r / 0.55, l: 0.55, m: 0.55, s: 0.09, c: i & 1 ? "#8a3dff" : "#1a0d33", k: 0, g: 0, a: 0}); }
    v.at(0.55, function(){ v.ring(x, 0.6, "#8a3dff"); v.emit(40, x, 0.3, z, {sp: 9, l: 0.7, s: 0.08, c: ["#8a3dff", "#ffffff", "#5ee6ff"], k: 3, g: 0.2}); v.flash = Math.max(v.flash, 0.3); });
  }
  else { v.emit(48, -GW, 0.2, GH, {sp: 7, up: 5, l: 2.2, s: 0.09, c: col, k: 6, g: 0.45}); v.emit(48, GW, 0.2, GH, {sp: 7, up: 5, l: 2.2, s: 0.09, c: col, k: 6, g: 0.45}); }
};
V.fxDraw = function(dt){
  var v = this, g = v.g, ps = v.parts, sc = clamp(v.w / 960, 0.62, 1.15), n = 0, i, p, a, r, k, e;
  while (v.later.length && v.later[0].t <= v.t) v.later.shift().f();
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
var RIB = {line: "#ffffff", dust: "#cfd3e6", flame: "#ff7a1f", ice: "#9fe0ff", void: "#8a3dff", bolt: "#fff6a8", star: "#c9a6ff", spark: "#ffd766", pixel: "#5ee6a8"};
var TPART = {flame: [["#ff7a1f", "#ffd23b", "#ff4f2a"], 0, -0.25], ice: [["#bfe9ff", "#ffffff"], 1, 0.3], spark: [["#ffd766", "#fff3b0"], 2, 0.2], pixel: [["#5ee6a8", "#3b6ef5", "#ff7ab8"], 1, 0.4], star: [["#c9a6ff", "#ffffff"], 2, 0.1], void: [["#8a3dff", "#1a0d33"], 0, -0.1], dust: [["#cfd3e6"], 0, 0.3], bolt: [["#fff6a8"], 3, 0]};
var AURA = {spark: [["#ffd766", "#fff3b0"], 2, 0.6, -0.1], ember: [["#ff7a1f", "#ffd23b"], 0, 0.9, -0.2], frost: [["#bfe9ff", "#ffffff"], 2, -0.1, 0.12], star: [["#c9a6ff", "#ffffff", "#ff7ab8"], 2, 0.4, -0.05], glitch: [["#5ee6ff", "#ff4f7a"], 1, 0.2, 0], void: [["#8a3dff", "#3b1f8a"], 0, 0.7, -0.15]};
V.trail = function(m){
  var v = this, g = v.g, b = m.b, h = v.hist, sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz), sd = v.sides[b.last < 0 ? 0 : b.last], k = sd && v.o.trail ? sd.trail : "none",
    on = b.own < 0 && sp > 5 && !b.inGoal, T = TPART[k], thin = k === "dust" || k === "spark" || k === "pixel" || k === "star", n, i, a, c, u;
  if (on) { h.push(b.x, b.y, b.z + VR - BR); if (h.length > 42) h.splice(0, 3); } else if (h.length) h.splice(0, Math.min(h.length, 6));
  n = h.length / 3; if (k === "none" || n < 2) return;
  if (on && T && (v.tick & 1) && (k !== "dust" || b.z < 0.5)) v.emit(1, b.x, b.y, b.z + 0.1, {sp: 0.9, up: 0.5, l: 0.5, s: 0.065, c: T[0], k: T[1], g: T[2]});
  a = v.pr(h[0], h[1], h[2]);
  for (i = 1; i < n; i++) {
    c = v.pr(h[i * 3], h[i * 3 + 1], h[i * 3 + 2]); u = i / n;
    if (k === "bolt") { c.x += (Math.random() - 0.5) * 9 * (1 - u); c.y += (Math.random() - 0.5) * 9 * (1 - u); }
    g.globalAlpha = u * (thin ? 0.28 : 0.8); g.strokeStyle = k === "rainbow" ? "hsl(" + Math.round((i * 26 + v.t * 300) % 360) + ",95%,62%)" : RIB[k] || "#ffffff";
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
  var v = this, g = v.g, p = m.p[i], q = m.meter(p), rl = p.rel, H = 86, wd = 11, T = 1.25, cb = v.o.cb, mm, gw, a, x, y, tx;
  if (!q && !(rl && m.t - rl.t < 0.75)) return;
  mm = q ? q.m : rl.m; gw = q ? q.gw : rl.gw; a = v.pr(p.x, p.y, 1.05); if (a.d < 1.6) return; x = a.x + Math.max(26, a.s * 0.6); y = a.y + H / 2;
  function Y(u){ return y - H * clamp(u, 0, T) / T; }
  g.fillStyle = "rgba(8,9,22,.82)"; g.fillRect(x - 2, y - H - 2, wd + 4, H + 4); g.fillStyle = "#2a2f52"; g.fillRect(x, y - H, wd, H);
  g.fillStyle = cb ? "#2f7fe0" : "#27b36f"; g.fillRect(x, Y(K.GC + gw), wd, Y(K.GC - gw) - Y(K.GC + gw));
  g.fillStyle = cb ? "#d7ecff" : "#b9ffdc"; g.fillRect(x, Y(K.GC + gw * 0.35), wd, Y(K.GC - gw * 0.35) - Y(K.GC + gw * 0.35));
  g.fillStyle = "rgba(8,9,22,.9)"; g.fillRect(x - 5, Y(mm) - 3, wd + 10, 6);
  g.fillStyle = q ? "#ffffff" : rl.q === 2 ? (cb ? "#7fd0ff" : "#5ee6a8") : rl.q ? "#d6ff3b" : "#ff6b6b"; g.fillRect(x - 4, Y(mm) - 2, wd + 8, 4);
  if (q && v.o.aim && v.sides[i].human) {
    tx = v.pr(m.aim(p, p.aimX), 0, p.aimH > 0 ? 1.45 : p.aimH < 0 ? 0.22 : 0.9); g.strokeStyle = "#ffffff"; g.lineWidth = 2; g.globalAlpha = 0.9;
    g.beginPath(); g.arc(tx.x, tx.y, 7, 0, TAU); g.moveTo(tx.x - 11, tx.y); g.lineTo(tx.x + 11, tx.y); g.moveTo(tx.x, tx.y - 11); g.lineTo(tx.x, tx.y + 11); g.stroke(); g.globalAlpha = 1;
  }
};
// advance the effects by dt seconds and paint one frame
V.draw = function(m, dt){
  var v = this, g = v.g, c = v.cam, b = m.b, o = v.o, f0 = Math.max(v.w * c.k, 520), k = Math.min(1, dt * 3), ty = Math.max(b.y, m.p[0].y, m.p[1].y), tx = (b.x * 2 + m.p[0].x + m.p[1].x) / 4, i, list;
  v.t += dt; v.tick++;
  c.f = f0 * (1 + 0.14 * o.zoom); c.cx = v.w / 2; c.cy = Math.min(v.h * 0.5, f0 * 0.28125 / c.k);
  // stay behind whoever is furthest from goal so both players and the ball are always in shot
  c.y += (clamp(ty + c.back, c.back + 1, D + c.back) - c.y) * k; c.x += (clamp(tx, -W, W) * (v.w < 640 ? 0.8 : 0.55) * o.pan - c.x) * k;
  v.shake = Math.max(0, v.shake - dt * 2.4); c.sx = (Math.random() - 0.5) * v.shake * 16 * o.shake; c.sy = (Math.random() - 0.5) * v.shake * 12 * o.shake;
  spin(v.pts, -b.vy * 2.2, b.vx * 2.2, b.spin * 1.6, dt);
  g.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); g.globalAlpha = 1; g.lineCap = g.lineJoin = "round";
  g.fillStyle = v.th.far; g.fillRect(0, 0, v.w, v.h);
  v.back(); v.floor(m); v.walls(); v.net(); v.under(m);
  list = [[b.y, -1], [m.p[0].y, 0], [m.p[1].y, 1]].sort(function(p, q){ return p[0] - q[0]; });
  for (i = 0; i < 3; i++) if (list[i][0] < 0.12) v.ent(m, list[i][1]);
  v.frame();
  for (i = 0; i < 3; i++) if (list[i][0] >= 0.12) v.ent(m, list[i][1]);
  v.fxDraw(dt);
  if (o.meter) { v.meter(m, 0); v.meter(m, 1); }
  if (v.flash > 0) { if (o.flash) { g.fillStyle = "rgba(255,255,255," + Math.min(0.7, v.flash).toFixed(3) + ")"; g.fillRect(0, 0, v.w, v.h); } v.flash -= dt * 1.6; }
};

// ---- previews for the menus ----
// o: {spin, turn, pose: "win", zoom, bust}
R.portrait = function(cv, s, t, o){
  o = o || {};
  var g = cv.getContext("2d"), w = cv.width, h = cv.height, S = h / (o.bust ? 1.02 : o.zoom || 2.3), by = h * (o.bust ? 1.82 : 0.94), q = pose0(), sd = s.tex ? s : side(s), wv = Math.sin(t * 2.2), fa = PI / 2 + (o.spin ? t * 0.9 : o.turn || 0);
  function prj(x, y, z){ return {x: w / 2 + x * S, y: by - z * S - y * S * 0.14, s: S, d: 10 - y}; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = g.lineJoin = "round";
  q.lean = 0.04 + 0.012 * wv; q.eL = q.eR = 0.32 + 0.04 * wv;
  if (o.pose === "win") { q.uL = q.uR = 2.85; q.oL = q.oR = 0.5 + 0.12 * wv; q.eL = q.eR = 0.2; q.z = 0.1 * Math.abs(Math.sin(t * 5)); }
  g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.ellipse(w / 2, by, S * 0.36, S * 0.09, 0, 0, TAU); g.fill();
  figure(g, prj, 0, 0, 0, fa, q, sd, 0, 1, t);
};
R.ballIcon = function(cv, id, t){
  var g = cv.getContext("2d"), w = cv.width, h = cv.height;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h);
  drawBall(g, w / 2, h / 2, Math.min(w, h) * 0.34, MG.ITEM[id] || MG.ITEM.classic, spin(ico(), 0.35, 0.2, 1, 0.6 + t), t, 0.3, 0.95);
};
R.View = View; R.side = side;
})();
