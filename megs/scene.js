// MEGS scenes: animated backgrounds behind the menus (bought or earned like any other item), the home stage where your
// player stands, the Megs colours on a few screens, rank badges that get grander as you climb, livelier stickers,
// and the position you want to be matched into once online play arrives.
(function(){
"use strict";
var MG = window.MG, R = MG.R, I = MG.ITEMS, BY = MG.ITEM, PI = Math.PI, TAU = PI * 2, clamp = MG.clamp, lerp = MG.lerp, hexA = MG.hexA;
function add(t, id, n, r, src, o){ o = o || {}; o.t = t; o.id = id; o.n = n; o.r = r; o.src = src; I.push(o); BY[id] = o; return o; }
function rnd(n, k){ var r = MG.rng(n * 131 + k), a = [], i; for (i = 0; i < n; i++) a.push([r(), r(), r(), r()]); return a; }
function grad(g, y0, y1, cols){ var gr = g.createLinearGradient(0, y0, 0, y1); cols.forEach(function(c, i){ gr.addColorStop(i / (cols.length - 1), c); }); return gr; }

// ---- the scenes ----
var SC = [["sc_night", "Floodlit Night", 0, "free"], ["sc_street", "Street Cage", 0, "free"], ["sc_sunset", "Beach Sunset", 1, "shop"], ["sc_roof", "Rooftop Blue Hour", 1, "pack"],
  ["sc_snow", "Snow Day", 2, "pass"], ["sc_jungle", "Jungle", 2, "pack"], ["sc_dunes", "Dunes", 2, "shop"], ["sc_rain", "Neon Rain", 3, "shop"], ["sc_synth", "Synthwave", 3, "pack"],
  ["sc_ocean", "Underwater", 3, "pass"], ["sc_sakura", "Cherry Blossom", 3, "shop"], ["sc_arcade", "Arcade", 3, "pack"], ["sc_space", "Deep Space", 4, "shop"], ["sc_aurora", "Aurora", 4, "pass"],
  ["sc_volcano", "Volcano", 4, "pack"], ["sc_storm", "Thunderstorm", 4, "shop"], ["sc_candy", "Candy Land", 4, "pack"], ["sc_final", "Golden Final", 5, "season"], ["sc_galaxy", "Galaxy Core", 6, "pack"], ["sc_heaven", "Cloud Kingdom", 7, "season"]];
SC.forEach(function(s){ add("scene", s[0], s[1], s[2], s[3], {k: s[0].slice(3)}); });

function stadium(g, w, h, t, sky, crowd){
  var i, r = rnd(220, 3), x, y, gr;
  g.fillStyle = grad(g, 0, h * 0.62, sky); g.fillRect(0, 0, w, h);
  g.fillStyle = "#0d0f22"; g.beginPath(); g.moveTo(0, h * 0.62); g.lineTo(0, h * 0.34); g.quadraticCurveTo(w / 2, h * 0.22, w, h * 0.34); g.lineTo(w, h * 0.62); g.fill();
  for (i = 0; i < r.length; i++) { x = r[i][0] * w; y = lerp(h * 0.33, h * 0.6, r[i][1]) - Math.abs(x - w / 2) / w * h * 0.1; if (y < h * 0.27 + Math.pow((x - w / 2) / w, 2) * h * 0.4) continue; g.fillStyle = crowd[Math.floor(r[i][2] * crowd.length)]; g.globalAlpha = 0.5 + 0.5 * Math.max(0, Math.sin(t * 4 + i)); g.fillRect(x, y - (Math.sin(t * 5 + i) > 0.85 ? 2 : 0), 3, 3); }
  g.globalAlpha = 1;
  [0.12, 0.88].forEach(function(f){ x = w * f; g.fillStyle = "#1a1d36"; g.fillRect(x - 3, h * 0.12, 6, h * 0.5); g.fillStyle = "#fff6d6"; g.fillRect(x - 22, h * 0.1, 44, 14);
    gr = g.createRadialGradient(x, h * 0.12, 0, x, h * 0.12, h * 0.5); gr.addColorStop(0, "rgba(255,246,214,.45)"); gr.addColorStop(1, "rgba(255,246,214,0)"); g.fillStyle = gr; g.fillRect(x - h * 0.5, 0, h, h * 0.62);
    g.globalAlpha = 0.07; g.fillStyle = "#fff6d6"; g.beginPath(); g.moveTo(x, h * 0.12); g.lineTo(w / 2 - w * 0.25 * (f - 0.5) * 2, h); g.lineTo(w / 2 + w * 0.05 - w * 0.25 * (f - 0.5) * 2, h); g.fill(); g.globalAlpha = 1; });
  pitch(g, w, h, "#2f8a47", "#287a3d");
}
function pitch(g, w, h, a, b){
  var i, y0 = h * 0.62, n = 9, y, yy;
  for (i = 0; i < n; i++) { y = y0 + (h - y0) * Math.pow(i / n, 1.6); yy = y0 + (h - y0) * Math.pow((i + 1) / n, 1.6); g.fillStyle = i & 1 ? a : b; g.fillRect(0, y, w, yy - y + 1); }
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y0 + 4); g.lineTo(w, y0 + 4); g.stroke(); g.beginPath(); g.ellipse(w / 2, h * 0.86, w * 0.16, h * 0.07, 0, 0, TAU); g.stroke();
}
function stars(g, w, h, n, t, k){ rnd(n, k || 1).forEach(function(q, i){ g.fillStyle = "#fff"; g.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + q[2]) + i)); g.fillRect(q[0] * w, q[1] * h, 1 + q[3] * 1.6, 1 + q[3] * 1.6); }); g.globalAlpha = 1; }
function hills(g, w, h, y, amp, col, k, sharp){ var i, x; g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (i = 0; i <= 24; i++) { x = i / 24 * w; g.lineTo(x, y - amp * (sharp ? Math.abs(Math.sin(i * 1.3 + k)) : 0.5 + 0.5 * Math.sin(i * 0.7 + k))); } g.lineTo(w, h); g.fill(); }
function city(g, w, h, y, col, lit, t, k){ var r = rnd(40, k), x = 0, i = 0, bw, bh, a, b; while (x < w) { bw = 30 + r[i % 40][0] * 60; bh = (0.15 + r[i % 40][1] * 0.35) * h; g.fillStyle = col; g.fillRect(x, y - bh, bw - 3, bh + h); if (lit) for (a = 0; a < bw - 12; a += 9) for (b = 8; b < bh - 6; b += 12) if ((a * 7 + b * 13 + i) % 5 === 0) { g.fillStyle = lit; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.7 + a + b); g.fillRect(x + 6 + a, y - bh + b, 4, 6); } g.globalAlpha = 1; x += bw; i++; } }
var DRAW = {
  night: function(g, w, h, t){ if (R.homeStadium && w > 400) R.homeStadium(g, w, h, t); else stadium(g, w, h, t, ["#05071a", "#1a1f4a", "#2a2f66"], ["#e6705e", "#f2f2f7", "#3b6ef5", "#ffd23b", "#5ee6a8"]); },   // the default scene is your own stadium, lit up at night
  final: function(g, w, h, t){
    stadium(g, w, h, t, ["#1a0d05", "#4a2a0c", "#8a5a14"], ["#ffd23b", "#fff6c2", "#ffffff", "#ff4f7a"]);
    rnd(6, 9).forEach(function(q, i){ var u = (t * 0.35 + q[0]) % 1, x = q[1] * w, y = h * (0.5 - 0.35 * Math.min(1, u * 3)), j, a; if (u < 0.33) { g.fillStyle = "#fff6c2"; g.fillRect(x, y, 2, 6); return; } a = 1 - (u - 0.33) / 0.67; for (j = 0; j < 16; j++) { g.globalAlpha = a; g.fillStyle = ["#ffd23b", "#ff4f7a", "#5ee6ff", "#fff"][j % 4]; g.beginPath(); g.arc(x + Math.cos(j / 16 * TAU) * (1 - a) * 70, h * 0.15 + Math.sin(j / 16 * TAU) * (1 - a) * 70 + (1 - a) * 20, 2.2, 0, TAU); g.fill(); } });
    g.globalAlpha = 1; rnd(60, 4).forEach(function(q, i){ var y = (q[1] * h + t * (30 + q[2] * 40)) % h; g.fillStyle = ["#ffd23b", "#fff6c2", "#ffb938"][i % 3]; g.save(); g.translate(q[0] * w + Math.sin(t + i) * 10, y); g.rotate(t * 2 + i); g.fillRect(-3, -1.5, 6, 3); g.restore(); });
  },
  street: function(g, w, h, t){ var i, j; g.fillStyle = grad(g, 0, h, ["#2a0f33", "#a23b5a", "#ff9a5a"]); g.fillRect(0, 0, w, h); city(g, w, h, h * 0.66, "#1a0d24", "#ffd98a", t, 2); g.fillStyle = "#2b2d36"; g.fillRect(0, h * 0.66, w, h);
    g.strokeStyle = "rgba(200,205,230,.22)"; g.lineWidth = 1.2; for (i = -h; i < w; i += 16) { g.beginPath(); g.moveTo(i, h * 0.3); g.lineTo(i + h * 0.4, h * 0.7); g.stroke(); g.beginPath(); g.moveTo(i + h * 0.4, h * 0.3); g.lineTo(i, h * 0.7); g.stroke(); }
    g.fillStyle = "#4a4d5a"; for (j = 0; j < w; j += w / 6) g.fillRect(j, h * 0.28, 5, h * 0.42); g.fillRect(0, h * 0.28, w, 4); },
  sunset: function(g, w, h, t){ var i, y; g.fillStyle = grad(g, 0, h * 0.62, ["#3d1f6b", "#ff4f7a", "#ffb938"]); g.fillRect(0, 0, w, h); g.fillStyle = "#ffe08a"; g.beginPath(); g.arc(w * 0.5, h * 0.6, h * 0.14, PI, TAU); g.fill();
    g.fillStyle = grad(g, h * 0.6, h, ["#ff7a5a", "#3d1f6b"]); g.fillRect(0, h * 0.6, w, h); for (i = 0; i < 14; i++) { y = h * 0.62 + i * 10; g.fillStyle = "rgba(255,224,138," + (0.5 - i * 0.03) + ")"; g.fillRect(w * 0.5 - (40 - i * 2) + Math.sin(t * 2 + i) * 8, y, (80 - i * 4), 2); }
    [0.1, 0.86].forEach(function(f, k){ var x = w * f; g.strokeStyle = "#1a0d24"; g.lineWidth = 7; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + 20, h * 0.6, x + (k ? -10 : 30), h * 0.35); g.stroke(); g.fillStyle = "#1a0d24"; for (i = 0; i < 6; i++) { g.beginPath(); g.ellipse(x + (k ? -10 : 30) + Math.cos(i) * 30, h * 0.35 + Math.sin(i * 2) * 8 + 10, 34, 7, i - 0.3 + Math.sin(t + i) * 0.05, 0, TAU); g.fill(); } }); },
  roof: function(g, w, h, t){ g.fillStyle = grad(g, 0, h, ["#0a1238", "#27507a", "#ff9a5a"]); g.fillRect(0, 0, w, h); stars(g, w, h * 0.4, 60, t, 2); city(g, w, h, h * 0.75, "#14183a", "#ffd98a", t, 5); city(g, w, h, h * 0.86, "#0a0d24", "#5ee6ff", t, 8); },
  snow: function(g, w, h, t){ g.fillStyle = grad(g, 0, h, ["#7fb0ff", "#dff1ff"]); g.fillRect(0, 0, w, h); hills(g, w, h, h * 0.55, h * 0.25, "#b9cde6", 1, 1); hills(g, w, h, h * 0.72, h * 0.12, "#eef6ff", 3); g.fillStyle = "#fff"; rnd(120, 5).forEach(function(q, i){ g.globalAlpha = 0.5 + q[2] * 0.5; g.beginPath(); g.arc((q[0] * w + Math.sin(t + i) * 20) % w, (q[1] * h + t * (20 + q[2] * 30)) % h, 1 + q[3] * 2.4, 0, TAU); g.fill(); }); g.globalAlpha = 1; },
  jungle: function(g, w, h, t){ var i; g.fillStyle = grad(g, 0, h, ["#0c2a14", "#1f5a2a", "#3d8a3a"]); g.fillRect(0, 0, w, h); hills(g, w, h, h * 0.5, h * 0.2, "#174a24", 2); hills(g, w, h, h * 0.7, h * 0.15, "#0f3a1a", 4); hills(g, w, h, h * 0.88, h * 0.1, "#0a2a12", 6);
    g.strokeStyle = "#0a2a12"; g.lineWidth = 3; for (i = 0; i < 9; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.quadraticCurveTo(i * w / 8 + 20 * Math.sin(t * 0.6 + i), h * 0.2, i * w / 8 + 6, h * (0.25 + (i % 3) * 0.1)); g.stroke(); }
    rnd(30, 6).forEach(function(q, i){ g.fillStyle = "#e6ff8a"; g.globalAlpha = Math.max(0, Math.sin(t * 2 + i * 1.3)); g.beginPath(); g.arc(q[0] * w + Math.sin(t * 0.7 + i) * 20, q[1] * h * 0.9 + Math.cos(t * 0.5 + i) * 15, 2.2, 0, TAU); g.fill(); }); g.globalAlpha = 1; },
  dunes: function(g, w, h, t){ g.fillStyle = grad(g, 0, h, ["#ff9a3d", "#ffd98a", "#e6b46b"]); g.fillRect(0, 0, w, h); g.fillStyle = "#fff6d6"; g.beginPath(); g.arc(w * 0.75, h * 0.25, h * 0.08, 0, TAU); g.fill(); hills(g, w, h, h * 0.6, h * 0.12, "#d9a35a", 1); hills(g, w, h, h * 0.75, h * 0.1, "#c98a42", 2.5); hills(g, w, h, h * 0.9, h * 0.08, "#a86a2a", 5); },
  rain: function(g, w, h, t){ var i; g.fillStyle = grad(g, 0, h, ["#05050f", "#14082a", "#2a0f3d"]); g.fillRect(0, 0, w, h); city(g, w, h, h * 0.8, "#0d0a1f", "#ff2fb3", t, 3); city(g, w, h, h * 0.92, "#07060f", "#2ff3ff", t, 9);
    ["#ff2fb3", "#2ff3ff", "#ffd23b"].forEach(function(c, k){ var x = w * (0.2 + k * 0.3), y = h * (0.35 + k * 0.08); g.shadowColor = c; g.shadowBlur = 18 * (0.7 + 0.3 * Math.sin(t * 5 + k * 3)); g.strokeStyle = c; g.lineWidth = 3; g.strokeRect(x, y, 70, 28); g.font = "800 18px " + R.FONT; g.fillStyle = c; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(["MEGS", "24/7", "GOAL"][k], x + 35, y + 15); });
    g.shadowBlur = 0; g.strokeStyle = "rgba(160,200,255,.35)"; g.lineWidth = 1; rnd(140, 8).forEach(function(q){ var x = q[0] * w, y = (q[1] * h + t * 600 * (0.6 + q[2] * 0.4)) % h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 14); g.stroke(); }); },
  synth: function(g, w, h, t){ var i, y, x, hz = h * 0.58; g.fillStyle = grad(g, 0, hz, ["#14051f", "#5a1f6b", "#ff4f7a"]); g.fillRect(0, 0, w, h); stars(g, w, hz * 0.6, 50, t, 4);
    for (i = 0; i < 9; i++) { g.fillStyle = grad(g, hz - h * 0.3, hz, ["#ffd23b", "#ff4f7a"]); g.beginPath(); g.arc(w / 2, hz, h * 0.24, PI, TAU); g.fill(); } g.fillStyle = "#5a1f6b"; for (i = 0; i < 6; i++) g.fillRect(w / 2 - h * 0.25, hz - h * (0.03 + i * 0.035), h * 0.5, 3 + i * 0.6);
    hills(g, w, h, hz, h * 0.08, "#2a0f3d", 2, 1); g.fillStyle = "#0a0414"; g.fillRect(0, hz, w, h); g.strokeStyle = "#ff2fb3"; g.lineWidth = 1.5; g.shadowColor = "#ff2fb3"; g.shadowBlur = 8;
    for (i = 0; i < 14; i++) { y = hz + (h - hz) * Math.pow(((i + (t * 0.6) % 1) / 14), 2); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (i = -12; i <= 12; i++) { x = w / 2 + i * 40; g.beginPath(); g.moveTo(w / 2 + i * 6, hz); g.lineTo(w / 2 + i * w * 0.12, h); g.stroke(); } g.shadowBlur = 0; },
  ocean: function(g, w, h, t){ var i; g.fillStyle = grad(g, 0, h, ["#3b9bff", "#0e5a8a", "#06203d"]); g.fillRect(0, 0, w, h); for (i = 0; i < 6; i++) { g.globalAlpha = 0.08; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(w * (0.1 + i * 0.16) + Math.sin(t * 0.5 + i) * 20, 0); g.lineTo(w * (0.16 + i * 0.16), 0); g.lineTo(w * (0.3 + i * 0.12), h); g.lineTo(w * (0.2 + i * 0.12), h); g.fill(); } g.globalAlpha = 1;
    hills(g, w, h, h * 0.9, h * 0.06, "#0a2a3d", 2); rnd(14, 7).forEach(function(q, i){ var x = ((q[0] * w + t * (20 + q[2] * 30) * (i & 1 ? 1 : -1)) % (w + 60) + w + 60) % (w + 60) - 30, y = h * (0.3 + q[1] * 0.5), d = i & 1 ? 1 : -1; g.fillStyle = ["#ffb938", "#ff7ab8", "#5ee6ff"][i % 3]; g.beginPath(); g.ellipse(x, y, 12, 6, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x - d * 10, y); g.lineTo(x - d * 20, y - 7); g.lineTo(x - d * 20, y + 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.5)"; rnd(40, 3).forEach(function(q){ g.beginPath(); g.arc(q[0] * w + Math.sin(t * 2 + q[3] * 9) * 6, h - ((q[1] * h + t * 40 * (0.5 + q[2])) % h), 2 + q[3] * 4, 0, TAU); g.stroke(); }); },
  sakura: function(g, w, h, t){ g.fillStyle = grad(g, 0, h, ["#ffe6f0", "#ffc9de", "#c9e6ff"]); g.fillRect(0, 0, w, h); hills(g, w, h, h * 0.8, h * 0.06, "#7fbf8a", 2);
    [0.15, 0.85].forEach(function(f, k){ var x = w * f, i; g.strokeStyle = "#5a3a2a"; g.lineWidth = 10; g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + (k ? -30 : 30), h * 0.55, x + (k ? -60 : 60), h * 0.3); g.stroke(); for (i = 0; i < 14; i++) { g.fillStyle = i & 1 ? "#ff9ac9" : "#ffc9de"; g.beginPath(); g.arc(x + (k ? -60 : 60) + Math.cos(i * 1.7) * 70, h * 0.28 + Math.sin(i * 2.3) * 40, 30, 0, TAU); g.fill(); } });
    rnd(60, 2).forEach(function(q, i){ g.fillStyle = "#ff9ac9"; g.beginPath(); g.ellipse((q[0] * w + t * 30 + Math.sin(t + i) * 20) % w, (q[1] * h + t * (25 + q[2] * 25)) % h, 5, 2.5, t * 2 + i, 0, TAU); g.fill(); }); },
  arcade: function(g, w, h, t){ var i, j; g.fillStyle = "#0a0a1f"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(94,230,255,.12)"; for (i = 0; i < w; i += 24) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (j = 0; j < h; j += 24) { g.beginPath(); g.moveTo(0, j); g.lineTo(w, j); g.stroke(); }
    rnd(26, 5).forEach(function(q, i){ var y = (q[1] * h + t * 30 * (0.4 + q[2])) % (h + 40) - 20, x = Math.floor(q[0] * w / 24) * 24; g.fillStyle = ["#ff2fb3", "#2ff3ff", "#ffd23b", "#5ee6a8"][i % 4]; g.globalAlpha = 0.75; g.fillRect(x, Math.floor(y / 24) * 24, 24 * (1 + (i % 2)), 24); }); g.globalAlpha = 1; },
  space: function(g, w, h, t){ var gr; g.fillStyle = "#03040f"; g.fillRect(0, 0, w, h); gr = g.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, w * 0.5); gr.addColorStop(0, "rgba(178,102,255,.45)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); stars(g, w, h, 160, t, 9);
    g.fillStyle = grad(g, h * 0.3, h * 0.7, ["#ffb938", "#b3402e"]); g.beginPath(); g.arc(w * 0.75, h * 0.5, h * 0.16, 0, TAU); g.fill(); g.strokeStyle = "rgba(255,224,170,.6)"; g.lineWidth = 6; g.beginPath(); g.ellipse(w * 0.75, h * 0.5, h * 0.3, h * 0.07, -0.3, 0, TAU); g.stroke(); },
  aurora: function(g, w, h, t){ var i, x; g.fillStyle = grad(g, 0, h, ["#020414", "#0a1238", "#14306b"]); g.fillRect(0, 0, w, h); stars(g, w, h * 0.6, 100, t, 5);
    for (i = 0; i < 3; i++) { g.globalAlpha = 0.3; g.fillStyle = ["#5ee6a8", "#b266ff", "#5ee6ff"][i]; g.beginPath(); g.moveTo(0, h * 0.2); for (x = 0; x <= w; x += 20) g.lineTo(x, h * (0.25 + i * 0.07) + Math.sin(x * 0.01 + t * (0.6 + i * 0.2) + i) * h * 0.08); for (x = w; x >= 0; x -= 20) g.lineTo(x, h * (0.45 + i * 0.07) + Math.sin(x * 0.012 + t * 0.5 + i) * h * 0.05); g.fill(); }
    g.globalAlpha = 1; hills(g, w, h, h * 0.82, h * 0.1, "#dfe6f2", 1, 1); },
  volcano: function(g, w, h, t){ g.fillStyle = grad(g, 0, h, ["#1a0505", "#5a140a", "#ff5a1f"]); g.fillRect(0, 0, w, h); g.fillStyle = "#1a0d0a"; g.beginPath(); g.moveTo(w * 0.15, h); g.lineTo(w * 0.42, h * 0.38); g.lineTo(w * 0.58, h * 0.38); g.lineTo(w * 0.85, h); g.fill();
    g.fillStyle = "#ff8a1f"; g.shadowColor = "#ff5a1f"; g.shadowBlur = 30; g.fillRect(w * 0.43, h * 0.37, w * 0.14, 6); g.shadowBlur = 0; rnd(50, 3).forEach(function(q, i){ var u = (t * (0.3 + q[2] * 0.3) + q[0]) % 1; g.fillStyle = i & 1 ? "#ffd23b" : "#ff5a1f"; g.globalAlpha = 1 - u; g.beginPath(); g.arc(w * 0.5 + (q[1] - 0.5) * w * 0.4 * u, h * 0.37 - Math.sin(u * PI) * h * 0.3 + u * h * 0.2, 2.5, 0, TAU); g.fill(); }); g.globalAlpha = 1; hills(g, w, h, h * 0.92, h * 0.05, "#0c0605", 3); },
  storm: function(g, w, h, t){ var f = Math.sin(t * 1.7) > 0.96 || Math.sin(t * 2.9 + 1) > 0.985; g.fillStyle = grad(g, 0, h, f ? ["#9fb0d6", "#5a6478", "#2a2f3d"] : ["#0d1020", "#1f2433", "#2a2f3d"]); g.fillRect(0, 0, w, h);
    rnd(9, 2).forEach(function(q, i){ g.fillStyle = f ? "#5a6478" : "#2a2f3d"; g.beginPath(); g.ellipse((q[0] * w + t * 10) % (w + 200) - 100, q[1] * h * 0.4, 120 + q[2] * 80, 40, 0, 0, TAU); g.fill(); });
    if (f) { g.strokeStyle = "#eaf6ff"; g.lineWidth = 3; g.shadowColor = "#9fd0ff"; g.shadowBlur = 20; g.beginPath(); var x = w * (0.3 + 0.4 * ((Math.floor(t) * 0.37) % 1)), y = 0; g.moveTo(x, y); while (y < h * 0.8) { x += (Math.random() - 0.5) * 40; y += 30; g.lineTo(x, y); } g.stroke(); g.shadowBlur = 0; }
    pitch(g, w, h, "#24502f", "#1f4728"); },
  candy: function(g, w, h, t){ g.fillStyle = grad(g, 0, h, ["#ffc9f0", "#c9e6ff"]); g.fillRect(0, 0, w, h); hills(g, w, h, h * 0.7, h * 0.12, "#ff9ac9", 1); hills(g, w, h, h * 0.85, h * 0.08, "#9affd6", 3);
    rnd(10, 8).forEach(function(q, i){ var x = q[0] * w, y = h * (0.45 + q[1] * 0.3); g.strokeStyle = "#fff"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 60); g.stroke(); g.save(); g.translate(x, y); g.rotate(t * 0.5 + i); g.fillStyle = ["#ff4f7a", "#ffd23b", "#5ee6ff"][i % 3]; g.beginPath(); g.arc(0, 0, 16, 0, TAU); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 9, 0, PI * 1.5); g.stroke(); g.restore(); });
    rnd(30, 1).forEach(function(q, i){ g.fillStyle = "#fff"; g.globalAlpha = 0.6; g.beginPath(); g.arc(q[0] * w, (q[1] * h + t * 20) % h, 3, 0, TAU); g.fill(); }); g.globalAlpha = 1; },
  galaxy: function(g, w, h, t){ var i, a, r, k; g.fillStyle = "#02030b"; g.fillRect(0, 0, w, h); stars(g, w, h, 120, t, 3);
    for (k = 0; k < 2; k++) for (i = 0; i < 260; i++) { a = i * 0.08 + k * PI + t * 0.08; r = i * Math.min(w, h) * 0.0022; g.fillStyle = i % 7 ? (k ? "#b266ff" : "#5ee6ff") : "#fff"; g.globalAlpha = 0.25 + 0.5 * (1 - i / 260); g.beginPath(); g.arc(w / 2 + Math.cos(a) * r * 1.6, h / 2 + Math.sin(a) * r * 0.8, 1.5 + (1 - i / 260) * 2.5, 0, TAU); g.fill(); }
    g.globalAlpha = 1; var gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h * 0.2); gr.addColorStop(0, "rgba(255,246,214,.9)"); gr.addColorStop(1, "rgba(255,246,214,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); },
  heaven: function(g, w, h, t){ var i; g.fillStyle = grad(g, 0, h, ["#fff6d6", "#ffd98a", "#9fd0ff"]); g.fillRect(0, 0, w, h);
    for (i = 0; i < 10; i++) { g.globalAlpha = 0.12; g.fillStyle = "#fff"; g.beginPath(); g.moveTo(w / 2, -h * 0.2); g.lineTo(w / 2 + Math.cos(i / 10 * PI + t * 0.05) * w, h); g.lineTo(w / 2 + Math.cos((i + 0.4) / 10 * PI + t * 0.05) * w, h); g.fill(); }
    g.globalAlpha = 1; rnd(14, 6).forEach(function(q, i){ var x = (q[0] * w + t * (6 + q[2] * 8)) % (w + 300) - 150, y = h * (0.35 + q[1] * 0.6); g.fillStyle = "rgba(255,255,255,.9)"; [0, 1, 2, 3].forEach(function(j){ g.beginPath(); g.arc(x + j * 30, y - (j % 2) * 14, 34 - j * 3, 0, TAU); g.fill(); }); });
    [0.2, 0.8].forEach(function(f, k){ var x = w * f, y = h * (0.3 + 0.03 * Math.sin(t + k)); g.fillStyle = "#7fbf8a"; g.beginPath(); g.ellipse(x, y, 60, 14, 0, PI, TAU); g.fill(); g.fillStyle = "#a8763a"; g.beginPath(); g.moveTo(x - 60, y); g.lineTo(x, y + 50); g.lineTo(x + 60, y); g.fill(); }); }
};
R.scene = function(g, w, h, id, t){ var it = BY[id] || BY.sc_night; (DRAW[it.k] || DRAW.night)(g, w, h, t); };

// the Megs look for the screens that are about the game itself rather than a scene
function brand(g, w, h, t){
  var i, gr;
  g.fillStyle = "#0b0d1f"; g.fillRect(0, 0, w, h);
  gr = g.createRadialGradient(w * 0.15, h * 0.1, 0, w * 0.15, h * 0.1, w * 0.6); gr.addColorStop(0, "rgba(59,110,245,.35)"); gr.addColorStop(1, "rgba(59,110,245,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  gr = g.createRadialGradient(w * 0.9, h * 0.85, 0, w * 0.9, h * 0.85, w * 0.55); gr.addColorStop(0, "rgba(255,93,122,.28)"); gr.addColorStop(1, "rgba(255,93,122,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // cage mesh
  g.strokeStyle = "rgba(200,210,255,.05)"; g.lineWidth = 1; for (i = -h; i < w; i += 28) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); }
  // the big chevron stripes in the three Megs colours, drifting slowly
  ["#3b6ef5", "#ff5d7a", "#ffd23b"].forEach(function(c, k){ var x = ((t * 12 + k * 90) % (w + 400)) - 200; g.globalAlpha = 0.07; g.fillStyle = c; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x + 60 + h * 0.4, h / 2); g.lineTo(x + 60, h); g.lineTo(x, h); g.lineTo(x + h * 0.4, h / 2); g.fill(); });
  g.globalAlpha = 1;
  g.font = "900 " + Math.round(h * 0.28) + "px " + R.FONT; g.textAlign = "right"; g.textBaseline = "bottom"; g.fillStyle = "rgba(255,255,255,.025)"; g.fillText("MEGS", w - 20, h - 10);
}

// ---- the background behind the menus ----
var BG = null, SCENE_V = {home: 1, profile: 1, team: 1, campaign: 1, tres: 1, result: 1, cups: 1}, BRAND_V = {shop: 1, pass: 1, locker: 1, ranks: 1, ladder: 1, gauntlet: 1, party: 1};
function bgMode(){ var v = MG.ui && MG.ui.cur ? MG.ui.cur() : "home"; return SCENE_V[v] ? "scene" : BRAND_V[v] ? "brand" : ""; }
var lastBg = 0;
function bgTick(now){
  requestAnimationFrame(bgTick);
  var b = document.body, m, w, h, t, d, g;
  if (!BG) { BG = document.createElement("canvas"); BG.id = "scn"; b.insertBefore(BG, b.firstChild); }
  m = b.classList.contains("playing") ? "" : bgMode();
  b.classList.toggle("scn", m === "scene"); b.classList.toggle("brnd", m === "brand");
  BG.style.display = m ? "" : "none";
  if (!m || now - lastBg < 33) { heroTick(now / 1000); return; }
  lastBg = now; t = now / 1000; d = Math.min(1.5, window.devicePixelRatio || 1); w = window.innerWidth; h = window.innerHeight;
  if (BG.width !== Math.round(w * d) || BG.height !== Math.round(h * d)) { BG.width = Math.round(w * d); BG.height = Math.round(h * d); }
  g = BG.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.lineCap = "round";
  if (m === "scene") { R.scene(g, w, h, MG.S && MG.S.eq.scene || "sc_night", t); g.fillStyle = "rgba(8,9,24,.28)"; g.fillRect(0, 0, w, h); }
  else brand(g, w, h, t);
  heroTick(t);
}
requestAnimationFrame(bgTick);

// ---- the home stage: your player standing in your scene ----
function heroTick(t){
  var c = document.getElementById("hero"), q;
  if (!c || document.body.classList.contains("playing")) return;
  q = c.getBoundingClientRect(); if (q.bottom < 0) return;
  R.portrait(c, MG.me(), t, {turn: 0.45 * Math.sin(t * 0.35), emote: (t % 14) > 11 ? (MG.ITEM[MG.S.eq.emote] || {}).k : ""});
}
function waitUi(f){ if (MG.ui && MG.ui.VIEW) f(); else setTimeout(function(){ waitUi(f); }, 0); }

// ---- rank badges ----
MG.rankBadge = function(g, cx, cy, S, k, t){
  var T = MG.TIERS[k], c = T.c, i, a, gr, sh = function(sc){ g.beginPath(); g.moveTo(cx, cy - S * 0.5 * sc); g.lineTo(cx + S * 0.42 * sc, cy - S * 0.34 * sc); g.lineTo(cx + S * 0.38 * sc, cy + S * 0.12 * sc); g.quadraticCurveTo(cx + S * 0.3 * sc, cy + S * 0.38 * sc, cx, cy + S * 0.52 * sc); g.quadraticCurveTo(cx - S * 0.3 * sc, cy + S * 0.38 * sc, cx - S * 0.38 * sc, cy + S * 0.12 * sc); g.lineTo(cx - S * 0.42 * sc, cy - S * 0.34 * sc); g.closePath(); };
  function gem(x, y, r, col, rot){ g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = col; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, -r * 0.2); g.lineTo(0, r); g.lineTo(-r * 0.8, -r * 0.2); g.closePath(); g.fill(); g.fillStyle = "rgba(255,255,255,.65)"; g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, -r * 0.2); g.lineTo(0, -r * 0.05); g.closePath(); g.fill(); g.strokeStyle = "rgba(8,9,22,.6)"; g.lineWidth = Math.max(1, r * 0.12); g.beginPath(); g.moveTo(0, -r); g.lineTo(r * 0.8, -r * 0.2); g.lineTo(0, r); g.lineTo(-r * 0.8, -r * 0.2); g.closePath(); g.stroke(); g.restore(); }
  g.save(); g.lineJoin = "round";
  if (k >= 5) { gr = g.createRadialGradient(cx, cy, 0, cx, cy, S * 0.8); gr.addColorStop(0, hexA(c, 0.45 + 0.15 * Math.sin(t * 3))); gr.addColorStop(1, hexA(c, 0)); g.fillStyle = gr; g.fillRect(cx - S, cy - S, S * 2, S * 2); }
  if (k >= 6) for (i = 0; i < 10; i++) { a = i / 10 * TAU + t * 0.6; g.fillStyle = i & 1 ? "#ffd23b" : "#ff4f7a"; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + i); g.beginPath(); g.moveTo(cx + Math.cos(a - 0.08) * S * 0.45, cy + Math.sin(a - 0.08) * S * 0.45); g.lineTo(cx + Math.cos(a) * S * 0.7, cy + Math.sin(a) * S * 0.7); g.lineTo(cx + Math.cos(a + 0.08) * S * 0.45, cy + Math.sin(a + 0.08) * S * 0.45); g.fill(); g.globalAlpha = 1; }
  // wings from Gold up
  if (k >= 2) [-1, 1].forEach(function(d){ for (i = 0; i < (k >= 4 ? 4 : 3); i++) { g.fillStyle = i & 1 ? MG.mix(c, "#ffffff", 0.4) : c; g.strokeStyle = "rgba(8,9,22,.55)"; g.lineWidth = 1; g.beginPath(); g.ellipse(cx + d * S * (0.42 + i * 0.05), cy - S * (0.02 + i * 0.08) + Math.sin(t * 2) * S * 0.01 * (k >= 5 ? 1 : 0), S * (0.2 - i * 0.025), S * 0.06, d * (0.5 + i * 0.25), 0, TAU); g.fill(); g.stroke(); } });
  if (k === 4) { // Diamond: the badge is itself a cut diamond
    g.beginPath(); g.moveTo(cx, cy - S * 0.5); g.lineTo(cx + S * 0.4, cy - S * 0.12); g.lineTo(cx, cy + S * 0.52); g.lineTo(cx - S * 0.4, cy - S * 0.12); g.closePath();
    gr = g.createLinearGradient(cx - S * 0.4, cy - S * 0.5, cx + S * 0.4, cy + S * 0.5); gr.addColorStop(0, "#e6f4ff"); gr.addColorStop(0.45, c); gr.addColorStop(1, "#1f4fd1"); g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(1.5, S * 0.05); g.strokeStyle = "rgba(8,9,22,.7)"; g.stroke();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - S * 0.4, cy - S * 0.12); g.lineTo(cx + S * 0.4, cy - S * 0.12); g.moveTo(cx - S * 0.2, cy - S * 0.31); g.lineTo(cx, cy - S * 0.12); g.lineTo(cx + S * 0.2, cy - S * 0.31); g.moveTo(cx - S * 0.2, cy - S * 0.12); g.lineTo(cx, cy + S * 0.52); g.lineTo(cx + S * 0.2, cy - S * 0.12); g.stroke();
    gem(cx - S * 0.5, cy + S * 0.25, S * 0.09, "#7fb0ff"); gem(cx + S * 0.5, cy + S * 0.25, S * 0.09, "#7fb0ff");
  } else {
    sh(1); gr = g.createLinearGradient(cx, cy - S * 0.5, cx, cy + S * 0.5); gr.addColorStop(0, MG.mix(c, "#ffffff", 0.45)); gr.addColorStop(0.5, c); gr.addColorStop(1, MG.mix(c, "#000000", 0.45)); g.fillStyle = gr; g.fill(); g.lineWidth = Math.max(1.5, S * 0.05); g.strokeStyle = "rgba(8,9,22,.75)"; g.stroke();
    if (k >= 1) { sh(0.78); g.lineWidth = Math.max(1, S * 0.03); g.strokeStyle = "rgba(255,255,255,.55)"; g.stroke(); }
    // chevrons for the lower ranks, gems for the higher ones
    if (k <= 2) for (i = 0; i <= k; i++) { g.strokeStyle = "rgba(8,9,22,.65)"; g.lineWidth = Math.max(2, S * 0.07); g.beginPath(); g.moveTo(cx - S * 0.18, cy - S * 0.05 + i * S * 0.13 - k * S * 0.06); g.lineTo(cx, cy + S * 0.08 + i * S * 0.13 - k * S * 0.06); g.lineTo(cx + S * 0.18, cy - S * 0.05 + i * S * 0.13 - k * S * 0.06); g.stroke(); }
    if (k === 2) { g.fillStyle = "#fff6c2"; R.star(g, cx, cy - S * 0.3, S * 0.09, 5, 0); g.fill(); }
    if (k === 3) { gem(cx, cy, S * 0.2, "#5ee6d6"); g.strokeStyle = "#e6fffb"; g.lineWidth = Math.max(1, S * 0.03); g.beginPath(); g.arc(cx, cy + S * 0.05, S * 0.3, PI * 0.15, PI * 0.85); g.stroke(); }
    if (k >= 5) { gem(cx, cy + S * 0.04, S * 0.2, k === 6 ? "#ff4f7a" : "#b266ff"); gem(cx - S * 0.2, cy + S * 0.22, S * 0.09, "#5ee6ff"); gem(cx + S * 0.2, cy + S * 0.22, S * 0.09, "#5ee6ff"); }
  }
  // a crown for Master, a burning crown for Legend
  if (k >= 5) {
    a = cy - S * 0.62; g.fillStyle = k === 6 ? "#ffd23b" : "#e6d6ff"; g.strokeStyle = "rgba(8,9,22,.7)"; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - S * 0.26, a + S * 0.14); g.lineTo(cx - S * 0.28, a - S * 0.06); g.lineTo(cx - S * 0.13, a + S * 0.04); g.lineTo(cx, a - S * 0.12); g.lineTo(cx + S * 0.13, a + S * 0.04); g.lineTo(cx + S * 0.28, a - S * 0.06); g.lineTo(cx + S * 0.26, a + S * 0.14); g.closePath(); g.fill(); g.stroke();
    gem(cx, a + S * 0.06, S * 0.05, k === 6 ? "#ff4f7a" : "#b266ff");
    if (k === 6) for (i = 0; i < 5; i++) { g.fillStyle = i & 1 ? "#ffd23b" : "#ff5a1f"; g.globalAlpha = 0.85; g.beginPath(); var fx = cx + (i - 2) * S * 0.12; g.moveTo(fx - S * 0.05, a - S * 0.04); g.quadraticCurveTo(fx, a - S * (0.2 + 0.08 * Math.sin(t * 9 + i)), fx + Math.sin(t * 7 + i) * S * 0.04, a - S * (0.3 + 0.08 * Math.sin(t * 11 + i))); g.quadraticCurveTo(fx + S * 0.05, a - S * 0.15, fx + S * 0.05, a - S * 0.04); g.fill(); g.globalAlpha = 1; }
  }
  if (k >= 3) { i = (t * 0.8) % 2; if (i < 1) { g.fillStyle = "#fff"; g.globalAlpha = Math.sin(i * PI); R.star(g, cx + S * 0.22, cy - S * 0.25, S * 0.1, 4, t); g.fill(); g.globalAlpha = 1; } }
  g.restore();
};
MG.rankHTML = function(elo){ var k = MG.tier(elo), T = MG.TIERS[k]; return '<span class="rk" style="--c:' + T.c + '"><canvas data-rk="' + k + '" width="64" height="64"></canvas>' + T.n + '</span>'; };

// ---- livelier stickers ----
var stk0 = R.sticker;
R.sticker = function(g, id, cx, cy, S, t){
  var it = BY[id], k = it && it.k, b, r = S / 2, i, a;
  if (!it) return;
  b = 1 + 0.06 * Math.sin(t * 5 + id.length);   // a little bounce
  g.save(); g.translate(cx, cy + Math.sin(t * 5 + id.length) * S * 0.02); g.scale(b, 2 - b); if (k === "text") g.rotate(Math.sin(t * 2.4 + id.length) * 0.06); g.translate(-cx, -cy);
  if (k === "face" && it.e === "angry") { g.translate((Math.random() - 0.5) * S * 0.02, 0); }
  stk0(g, id, cx, cy, S, t);
  if (k === "face") {
    g.save(); g.beginPath(); g.arc(cx, cy, r * 0.9, 0, TAU); g.clip();
    if (it.e !== "angry" && it.e !== "shades") { g.fillStyle = "rgba(255,110,140,.35)"; g.beginPath(); g.ellipse(cx - r * 0.5, cy + r * 0.2, r * 0.17, r * 0.1, 0, 0, TAU); g.ellipse(cx + r * 0.5, cy + r * 0.2, r * 0.17, r * 0.1, 0, 0, TAU); g.fill(); }
    g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.ellipse(cx - r * 0.32, cy - r * 0.5, r * 0.32, r * 0.16, -0.5, 0, TAU); g.fill();
    if (it.e === "angry") { g.fillStyle = "rgba(255,40,40," + (0.15 + 0.15 * Math.sin(t * 8)) + ")"; g.fillRect(cx - r, cy - r, r * 2, r * 2); }
    g.restore();
    if (it.e === "angry") for (i = 0; i < 2; i++) { a = (t * 1.5 + i * 0.5) % 1; g.fillStyle = "rgba(230,235,245," + (1 - a) + ")"; g.beginPath(); g.arc(cx + (i ? 1 : -1) * r * (0.8 + a * 0.3), cy - r * (0.7 + a * 0.6), r * (0.12 + a * 0.15), 0, TAU); g.fill(); }
    if (it.e === "star" || it.e === "shades") for (i = 0; i < 3; i++) { a = t * 2 + i * TAU / 3; g.fillStyle = "#fff6a8"; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + i); R.star(g, cx + Math.cos(a) * r * 1.05, cy + Math.sin(a) * r * 1.05, r * 0.14, 4, t); g.fill(); g.globalAlpha = 1; }
    if (it.e === "dizzy") for (i = 0; i < 3; i++) { a = t * 3 + i * TAU / 3; g.fillStyle = "#ffd23b"; R.star(g, cx + Math.cos(a) * r * 0.7, cy - r * 0.95 + Math.sin(a) * r * 0.18, r * 0.12, 5, t); g.fill(); }
  } else if (it.r >= 3) { for (i = 0; i < 2; i++) { a = (t * 0.9 + i * 0.5) % 1; g.fillStyle = "#fff"; g.globalAlpha = Math.sin(a * PI); R.star(g, cx + (i ? 1 : -1) * r * 0.7, cy - r * (0.2 + a * 0.6), r * 0.12, 4, t); g.fill(); } g.globalAlpha = 1; }
  g.restore();
};

waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, ACT = U.ACT, esc = U.esc, modal = U.modal, S = function(){ return MG.S; };
  // previews for the new item types and the rank badges
  var vis0 = MG.visX;
  MG.visX = function(it, cls){
    if (it.t === "hair") return '<canvas class="' + cls + '" data-hair="' + it.id + '" width="300" height="400"></canvas>';
    if (it.t === "scene") return '<canvas class="bn ' + cls + '" data-scn="' + it.id + '" width="360" height="200"></canvas>';
    return vis0 ? vis0(it, cls) : "";
  };
  var LV = [], on = 0;
  function tick(){ var t = performance.now() / 1000; LV = LV.filter(function(c){ return document.contains(c); }); LV.forEach(function(c){ draw(c, t); }); if (LV.length) requestAnimationFrame(tick); else on = 0; }
  function draw(c, t){
    var d = c.dataset, g = c.getContext("2d");
    if (d.hair) R.portrait(c, Object.assign({}, MG.me(), {hair: d.hair, kit: MG.S.eq.kit}), t, {bust: 1, turn: 0.6 * Math.sin(t * 0.6)});
    else if (d.scn) { g.setTransform(c.width / 360, 0, 0, c.height / 200, 0, 0); R.scene(g, 360, 200, d.scn, t); }
    else if (d.rk) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); MG.rankBadge(g, c.width / 2, c.height / 2 + c.height * 0.06, c.width * 0.62, +d.rk, t); }
    else if (d.boot2) R.bootPreview(c, MG.ITEM[d.boot2], t);
  }
  var px0 = MG.paintX;
  MG.paintX = function(){
    if (px0) px0();
    [].forEach.call(document.querySelectorAll("canvas[data-hair],canvas[data-scn],canvas[data-rk]"), function(c){
      var it = MG.ITEM[c.dataset.hair || c.dataset.scn || ""];
      if (c._done) return; c._done = 1;
      if ((c.dataset.scn || (c.dataset.rk && +c.dataset.rk >= 3) || (it && (it.fx || c.classList.contains("big")))) && !MG.still(c)) { LV.push(c); if (!on) { on = 1; requestAnimationFrame(tick); } }
      else draw(c, 1.4);
    });
  };
  // the home stage
  var home1 = VIEW.home;
  VIEW.home = function(a){
    var s = S(), h = home1(a), sc = MG.ITEM[s.eq.scene] || MG.ITEM.sc_night;
    return '<section class="stage0"><canvas id="hero" width="300" height="400"></canvas><div class="st0t"><span class="kick">' + esc(sc.n) + '</span><b>' + esc(s.name || "You") + '</b>' + MG.rankHTML(s.elo) +
      '<span class="mute">' + esc(s.title) + ' &middot; Level ' + s.lvl + '</span><div class="row"><button class="btn sm ghost" data-a="go" data-v="locker" data-arg="scene">Change scene</button><button class="btn sm ghost" data-a="go" data-v="locker">Locker</button></div></div></section>' + h;
  };
  // where you want to play once online matches arrive
  MG.POS = [["any", "Anywhere", "Put me wherever a team needs a player"], ["gk", "Keeper", "Stand in goal and stop shots"], ["def", "Defender", "Win the ball and start attacks"], ["fwd", "Striker", "Stay up top and score"]];
  ACT.online = function(){
    var s = S(), p = s.pos || "any";
    modal('<h2>Online is coming soon</h2><p>When it arrives, matchmaking will put you in a team with people who picked the other spots, so every side has a keeper, defenders and strikers. Pick yours now and it will be ready.</p><div class="pos">' +
      MG.POS.map(function(o){ return '<button class="chip big' + (o[0] === p ? " on" : "") + '" data-a="pos" data-id="' + o[0] + '"><b>' + o[1] + '</b><small>' + o[2] + '</small></button>'; }).join("") + '</div><div class="row center"><button class="btn" data-a="go" data-v="team">Play 5v5</button><button class="btn ghost" data-a="close">Close</button></div>');
  };
  MG.KINDS.push(["hair", "Hair"], ["scene", "Scenes"]);
  if (U.cur && U.cur()) U.go(U.cur(), U.arg());
  ACT.pos = function(d){ S().pos = d.id; MG.save(); U.toast("You will queue as: " + MG.POS.filter(function(o){ return o[0] === d.id; })[0][1] + "."); ACT.online(); };
});
})();
