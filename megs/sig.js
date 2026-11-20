// MEGS signature looks: every top skin (Celestial, Ultra, Admin) has its own thing, instead of all of them getting
// wings and a halo. Only Seraph keeps wings and a halo, and Game Master keeps wings.
(function(){
"use strict";
var MG = window.MG, R = MG.R, BY = MG.ITEM, PI = Math.PI, TAU = PI * 2;
var SIG = {
  su_sera: {sig: "", wings: 1, halo: 1}, ad_gm: {sig: "", wings: 1},
  ecl: {sig: "eclipse"}, cons: {sig: "orbs"}, flare: {sig: "jet"}, k_magma: {sig: "horns"}, s1_champ: {sig: "laurel"}, s1_kick: {sig: "balls"},
  su_star: {sig: "ring"}, su_sun: {sig: "blades"}, su_moon: {sig: "crescent"}, k_galaxy: {sig: "nebula"},
  ux_prism: {sig: "shards"}, ux_storm: {sig: "storm"}, ux_mech: {sig: "drones"}, ux_inferno: {sig: "cape"}, ux_abyss: {sig: "tail"},
  ad_arch: {sig: "cubes"}, ad_gold: {sig: "pauldrons"}, ad_dev: {sig: "code"}, ad_found: {sig: "sigil"}, s67: {sig: "67"}
};
Object.keys(SIG).forEach(function(id){ var it = BY[id], o = SIG[id]; if (!it) return; it.sig = o.sig; it.wings = o.wings ? 1 : 0; it.halo = o.halo ? 1 : 0; });
var dress0 = R.dress;
R.dress = function(sd, s){
  if (dress0) dress0(sd, s);
  var it = sd.it || {};
  sd.wings = !!it.wings && !s.calm; sd.halo = !!it.halo; sd.sig = s.calm ? "" : it.sig || "";
};

function hx(c, a){ return MG.hexA ? MG.hexA(c, a) : c; }
var fl0 = R.flair;
R.flair = function(g, P, J, HD, hip, s, sd, c, sg, t, phase){
  fl0.apply(this, arguments);
  var k = sd.sig; if (!k || !D[k]) return;
  // heights of the head and shoulders, measured from where they are drawn
  var y0 = P(0, 0, hip).y, y1 = P(0, 0, hip + 1).y, per = (y0 - y1) || 1;
  var zH = hip + (y0 - HD.y) / per, zS = J && J[0] && J[0].s && J[1] && J[1].s ? hip + (y0 - (J[0].s.y + J[1].s.y) / 2) / per : hip + 0.6, ctr = P(0, 0, hip + 0.3);
  if (!(J && J[0] && J[0].s)) J = [{s: P(0, -0.2, zS)}, {s: P(0, 0.2, zS)}];
  var X = {g: g, P: P, J: J, HD: HD, hip: hip, s: s, t: t, ph: phase, zH: zH, zS: zS, fc: sd.fc && sd.fc.length === 7 ? sd.fc : "#ffd23b",
    front: function(p){ return p.d < ctr.d; }, on: function(p){ return (p.d < ctr.d) === !!phase; }};
  g.save(); g.lineCap = "round"; g.lineJoin = "round"; D[k](X); g.restore();
};
function line(g, pts, w, col){ g.lineWidth = w; g.strokeStyle = col; g.beginPath(); pts.forEach(function(p, i){ if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke(); }
function shape(g, pts){ g.beginPath(); pts.forEach(function(p, i){ if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.closePath(); }
function glow(g, x, y, r, col, a){ var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hx(col, a)); gr.addColorStop(1, hx(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }

var D = {
  // Eclipse: a black sun behind the head with its corona burning round it
  eclipse: function(X){ if (X.ph) return; var g = X.g, c = X.P(-0.22, 0, X.zH + 0.05), r = X.s * 0.42, i, a;
    glow(g, c.x, c.y, r * 1.9, "#ffd98a", 0.55 + 0.15 * Math.sin(X.t * 2));
    g.strokeStyle = "rgba(255,233,168,.55)"; g.lineWidth = Math.max(1, X.s * 0.012);
    for (i = 0; i < 18; i++) { a = i * TAU / 18 + X.t * 0.25; var l = r * (1.25 + 0.25 * Math.sin(X.t * 3 + i * 1.7)); g.beginPath(); g.moveTo(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r); g.lineTo(c.x + Math.cos(a) * l, c.y + Math.sin(a) * l); g.stroke(); }
    g.fillStyle = "#050308"; g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill(); g.strokeStyle = "#fff3c4"; g.lineWidth = Math.max(1.5, X.s * 0.02); g.stroke(); },
  // Constellation: three stars of light circling the head
  orbs: function(X){ var g = X.g, i, a, p; for (i = 0; i < 3; i++) { a = X.t * 1.6 + i * TAU / 3; p = X.P(Math.cos(a) * 0.36, Math.sin(a) * 0.36, X.zH + 0.06 + 0.08 * Math.sin(X.t * 2 + i)); if (!X.on(p)) continue;
    glow(g, p.x, p.y, X.s * 0.12, "#7fb0ff", 0.8); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(p.x, p.y, Math.max(2, X.s * 0.028), 0, TAU); g.fill(); } },
  // Solar Flare: a jetpack firing on the back
  jet: function(X){ if (X.ph) return; var g = X.g; [-1, 1].forEach(function(k){
    var a = X.P(-0.2, k * 0.085, X.zS - 0.02), b = X.P(-0.2, k * 0.085, X.zS - 0.4), fl = 0.28 + 0.08 * Math.sin(X.t * 30 + k), e = X.P(-0.24, k * 0.085, X.zS - 0.4 - fl);
    line(g, [a, b], X.s * 0.1, "#3d0a05"); line(g, [a, b], X.s * 0.07, "#ff8a3d"); line(g, [X.P(-0.2, k * 0.085, X.zS - 0.08), X.P(-0.2, k * 0.085, X.zS - 0.14)], X.s * 0.072, "#fff1a8");
    var gr = g.createLinearGradient(b.x, b.y, e.x, e.y); gr.addColorStop(0, "rgba(255,255,220,.95)"); gr.addColorStop(0.35, "rgba(255,180,40,.85)"); gr.addColorStop(1, "rgba(255,70,20,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(b.x - X.s * 0.045, b.y); g.lineTo(b.x + X.s * 0.045, b.y); g.lineTo(e.x, e.y); g.closePath(); g.fill(); }); },
  // Magma Golem: two curved horns of cooling rock with glowing tips
  horns: function(X){ if (!X.ph) return; var g = X.g; [-1, 1].forEach(function(k){
    var pts = [], i, u; for (i = 0; i <= 8; i++) { u = i / 8; pts.push(X.P(0.02 - u * 0.12, k * (0.1 + Math.sin(u * 2.2) * 0.13), X.zH + 0.1 + u * 0.36)); }
    for (i = 0; i < 8; i++) line(g, [pts[i], pts[i + 1]], X.s * (0.07 - i * 0.0075), i > 5 ? "#ffb347" : i > 3 ? "#ff5a1f" : "#2b1a14"); }); },
  // Season 1 Champion: a golden laurel wreath
  laurel: function(X){ var g = X.g, i, a, p, q; for (i = 0; i < 16; i++) { a = i * TAU / 16; p = X.P(Math.cos(a) * 0.17, Math.sin(a) * 0.17, X.zH + 0.14); if (!X.on(p)) continue;
    q = X.P(Math.cos(a + 0.25) * 0.2, Math.sin(a + 0.25) * 0.2, X.zH + 0.2); g.fillStyle = i & 1 ? "#ffd766" : "#c9962a"; g.strokeStyle = "rgba(60,40,5,.7)"; g.lineWidth = 1;
    g.beginPath(); g.ellipse((p.x + q.x) / 2, (p.y + q.y) / 2, X.s * 0.045, X.s * 0.02, Math.atan2(q.y - p.y, q.x - p.x), 0, TAU); g.fill(); g.stroke(); } },
  // Season 1 Kickoff: two footballs keepy-uppy round the body
  balls: function(X){ var g = X.g, i, a, p, r; for (i = 0; i < 2; i++) { a = X.t * 1.3 + i * PI; p = X.P(Math.cos(a) * 0.6, Math.sin(a) * 0.6, X.hip + 0.3 + Math.abs(Math.sin(X.t * 3 + i)) * 0.5); if (!X.on(p)) continue;
    r = Math.max(4, X.s * 0.075); g.fillStyle = "#ffffff"; g.strokeStyle = "#1b1b22"; g.lineWidth = 1; g.beginPath(); g.arc(p.x, p.y, r, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = "#1b1b22"; g.beginPath(); g.arc(p.x, p.y, r * 0.35, 0, TAU); g.fill(); [0, 1, 2, 3, 4].forEach(function(j){ var b = j * TAU / 5 + X.t * 4; g.beginPath(); g.arc(p.x + Math.cos(b) * r * 0.78, p.y + Math.sin(b) * r * 0.78, r * 0.18, 0, TAU); g.fill(); }); } },
  // Starforged: a tilted planet ring round the waist
  ring: function(X){ var g = X.g, i, a, b, p, q; for (i = 0; i < 48; i++) { a = i * TAU / 48 + X.t * 0.3; b = a + TAU / 48;
    p = X.P(Math.cos(a) * 0.72, Math.sin(a) * 0.72, X.hip + 0.42 + 0.16 * Math.cos(a)); q = X.P(Math.cos(b) * 0.72, Math.sin(b) * 0.72, X.hip + 0.42 + 0.16 * Math.cos(b)); if (!X.on(p)) continue;
    line(g, [p, q], Math.max(2, X.s * 0.04), i % 6 < 3 ? "rgba(94,230,255,.85)" : "rgba(178,102,255,.8)");
    p = X.P(Math.cos(a) * 0.84, Math.sin(a) * 0.84, X.hip + 0.42 + 0.19 * Math.cos(a)); q = X.P(Math.cos(b) * 0.84, Math.sin(b) * 0.84, X.hip + 0.42 + 0.19 * Math.cos(b)); line(g, [p, q], 1, "rgba(255,255,255,.5)"); } },
  // Solar Emperor: a fan of golden sun blades behind the back
  blades: function(X){ if (X.ph) return; var g = X.g, i, a, b, tip, l, r, sw = 0.06 * Math.sin(X.t * 1.5);
    for (i = 0; i < 7; i++) { a = -1.25 + i * 2.5 / 6 + sw; b = X.P(-0.2, 0, X.zS - 0.05); tip = X.P(-0.32, Math.sin(a) * 0.82, X.zS - 0.05 + Math.cos(a) * 0.82); l = X.P(-0.22, Math.sin(a - 0.12) * 0.2, X.zS - 0.05 + Math.cos(a - 0.12) * 0.2); r = X.P(-0.22, Math.sin(a + 0.12) * 0.2, X.zS - 0.05 + Math.cos(a + 0.12) * 0.2);
      var gr = g.createLinearGradient(b.x, b.y, tip.x, tip.y); gr.addColorStop(0, "#b8860b"); gr.addColorStop(0.6, "#ffd23b"); gr.addColorStop(1, "#fff6d6");
      g.fillStyle = gr; shape(g, [b, l, tip, r]); g.fill(); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.stroke(); } },
  // Moon Oracle: a crescent moon rising behind the head
  crescent: function(X){ if (X.ph) return; var g = X.g, c = X.P(-0.2, 0, X.zH + 0.1), r = X.s * 0.36, o = r * 0.38;
    glow(g, c.x, c.y, r * 1.8, "#e6d6ff", 0.45);
    g.fillStyle = "#f3ecff"; g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.arc(c.x + o, c.y - o * 0.4, r * 0.86, 0, TAU, true); g.fill("evenodd");
    g.strokeStyle = "rgba(178,102,255,.6)"; g.lineWidth = Math.max(1, X.s * 0.012); g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.stroke(); },
  // Galaxy Legend: a swirling nebula behind the body
  nebula: function(X){ if (X.ph) return; var g = X.g, i, a, p; ["#b266ff", "#ff7ab8", "#5ee6ff", "#7fb0ff"].forEach(function(col, j){ a = X.t * 0.4 + j * TAU / 4; p = X.P(-0.3, Math.cos(a) * 0.32, X.hip + 0.6 + Math.sin(a) * 0.32); glow(g, p.x, p.y, X.s * 0.5, col, 0.4); });
    for (i = 0; i < 14; i++) { a = i * 2.4 + X.t * 0.2; p = X.P(-0.32, Math.cos(a) * (0.2 + i * 0.03), X.hip + 0.6 + Math.sin(a) * (0.2 + i * 0.03)); g.fillStyle = "#fff"; g.globalAlpha = 0.5 + 0.5 * Math.sin(X.t * 3 + i); g.fillRect(p.x, p.y, 2, 2); } g.globalAlpha = 1; },
  // Prism Titan: a crown of rainbow crystals floating over the shoulders
  shards: function(X){ var g = X.g, i, a, p, h; for (i = 0; i < 8; i++) { a = X.t * 0.7 + i * TAU / 8; p = X.P(Math.cos(a) * 0.46, Math.sin(a) * 0.46, X.zS + 0.3 + 0.05 * Math.sin(X.t * 2 + i)); if (!X.on(p)) continue;
    h = X.s * 0.12; g.fillStyle = "hsl(" + ((i * 45 + X.t * 60) % 360) + ",100%,68%)"; g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(p.x, p.y - h); g.lineTo(p.x + h * 0.32, p.y); g.lineTo(p.x, p.y + h * 0.6); g.lineTo(p.x - h * 0.32, p.y); g.closePath(); g.fill(); g.stroke(); } },
  // Storm Sovereign: a thundercloud over the head, striking now and then
  storm: function(X){ if (!X.ph) return; var g = X.g, c = X.P(0, 0, X.zH + 0.5), r = X.s * 0.1, i, f = (X.t * 0.8) % 1, side, a, b, pts;
    g.fillStyle = "#3a4152"; [[-1.4, 0.2], [-0.5, -0.3], [0.5, -0.25], [1.3, 0.2], [0, 0.25]].forEach(function(o){ g.beginPath(); g.arc(c.x + o[0] * r, c.y + o[1] * r, r * 1.05, 0, TAU); g.fill(); });
    if (f < 0.18) { side = Math.floor(X.t * 0.8) % 2 ? 1 : -1; a = c; b = X.J[side > 0 ? 1 : 0].s; pts = [a]; for (i = 1; i < 6; i++) pts.push({x: a.x + (b.x - a.x) * i / 6 + (i & 1 ? 1 : -1) * X.s * 0.06, y: a.y + (b.y - a.y) * i / 6}); pts.push(b);
      glow(g, b.x, b.y, X.s * 0.25, "#fff6a8", 0.6); line(g, pts, Math.max(2, X.s * 0.03), "#fff6a8"); line(g, pts, 1, "#ffffff"); } },
  // Neon Mech: two little drones flying round the head
  drones: function(X){ var g = X.g, i, a, p, w; for (i = 0; i < 2; i++) { a = X.t * 1.2 + i * PI; p = X.P(Math.cos(a) * 0.55, Math.sin(a) * 0.55, X.zH + 0.12 + 0.06 * Math.sin(X.t * 3 + i)); if (!X.on(p)) continue;
    w = Math.max(5, X.s * 0.08); glow(g, p.x, p.y + w, w * 1.8, "#38e1ff", 0.35); g.fillStyle = "#0c1020"; g.strokeStyle = "#38e1ff"; g.lineWidth = 1.2; g.beginPath(); g.rect(p.x - w / 2, p.y - w * 0.3, w, w * 0.6); g.fill(); g.stroke();
    g.fillStyle = "#ff2fb3"; g.beginPath(); g.arc(p.x, p.y, w * 0.12, 0, TAU); g.fill();
    g.strokeStyle = "rgba(220,240,255,.8)"; g.beginPath(); g.moveTo(p.x - w * 0.9 * Math.cos(X.t * 40), p.y - w * 0.45); g.lineTo(p.x + w * 0.9 * Math.cos(X.t * 40), p.y - w * 0.45); g.stroke(); } },
  // Inferno Titan: a burning cape
  cape: function(X){ if (X.ph) return; var g = X.g, top = [], bot = [], i, u, r, wv;
    for (i = 0; i <= 6; i++) { u = i / 6; r = -0.2 + u * 0.4; top.push(X.P(-0.1, r, X.zS)); wv = 0.06 * Math.sin(X.t * 4 + u * 5); bot.push(X.P(-0.34 - wv, r * 1.5, X.hip - 0.55 + Math.abs(wv))); }
    var gr = g.createLinearGradient(top[3].x, top[3].y, bot[3].x, bot[3].y); gr.addColorStop(0, "#3d0805"); gr.addColorStop(0.55, "#ff5a1f"); gr.addColorStop(1, "#ffd23b");
    shape(g, top.concat(bot.reverse())); g.fillStyle = gr; g.fill(); g.strokeStyle = "rgba(255,210,59,.7)"; g.lineWidth = 1; g.stroke();
    for (i = 0; i < 6; i++) { u = (X.t * 0.9 + i / 6) % 1; var p = X.P(-0.36, -0.28 + i * 0.11, X.hip - 0.55 + u * 0.5); g.fillStyle = "rgba(255,200,60," + (1 - u) + ")"; g.beginPath(); g.arc(p.x, p.y, Math.max(1.5, X.s * 0.016), 0, TAU); g.fill(); } },
  // Abyss Hunter: a shark tail swishing behind
  tail: function(X){ if (X.ph) return; var g = X.g, pts = [], i, u, end, f1, f2;
    for (i = 0; i <= 10; i++) { u = i / 10; pts.push(X.P(-0.12 - u * 0.55, Math.sin(X.t * 3 + u * 3) * 0.14 * u, X.hip + 0.05 - u * 0.3)); }
    for (i = 0; i < 10; i++) line(g, [pts[i], pts[i + 1]], X.s * (0.11 - i * 0.008), i % 3 === 1 ? "#38e1ff" : "#0d3550");
    end = pts[10]; u = Math.sin(X.t * 3 + 3) * 0.14; f1 = X.P(-0.82, u, X.hip - 0.02); f2 = X.P(-0.78, u, X.hip - 0.45);
    g.fillStyle = "#0d3550"; g.strokeStyle = "#38e1ff"; g.lineWidth = 1; shape(g, [end, f1, X.P(-0.72, u, X.hip - 0.22), f2]); g.fill(); g.stroke(); },
  // The Architect: golden wireframe cubes orbiting
  cubes: function(X){ var g = X.g, i, j, a, c, e = 0.07, cs, ed = [[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4],[0,4],[1,5],[2,6],[3,7]];
    for (i = 0; i < 4; i++) { a = X.t * 0.8 + i * TAU / 4; c = [Math.cos(a) * 0.6, Math.sin(a) * 0.6, X.zS - 0.1 + 0.1 * Math.sin(X.t * 2 + i)]; if (!X.on(X.P(c[0], c[1], c[2]))) continue;
      cs = []; for (j = 0; j < 8; j++) { var r = X.t * 1.5 + i, dx = (j & 1 ? e : -e), dy = (j & 2 ? e : -e), dz = (j & 4 ? e : -e); cs.push(X.P(c[0] + dx * Math.cos(r) - dy * Math.sin(r), c[1] + dx * Math.sin(r) + dy * Math.cos(r), c[2] + dz)); }
      g.strokeStyle = "#ffd23b"; g.lineWidth = Math.max(1, X.s * 0.012); g.beginPath(); ed.forEach(function(q){ g.moveTo(cs[q[0]].x, cs[q[0]].y); g.lineTo(cs[q[1]].x, cs[q[1]].y); }); g.stroke(); } },
  // Black Gold: spiked golden shoulder armour
  pauldrons: function(X){ if (!X.ph) return; var g = X.g, w = X.s * 0.1; [0, 1].forEach(function(i){ var p = X.J[i].s, k = i ? 1 : -1, j;
    g.fillStyle = "#ffd766"; g.strokeStyle = "#3d2c05"; g.lineWidth = Math.max(1, X.s * 0.012);
    g.beginPath(); g.ellipse(p.x, p.y - w * 0.15, w, w * 0.6, 0, PI, TAU); g.closePath(); g.fill(); g.stroke();
    for (j = 0; j < 3; j++) { var bx = p.x + (j - 1) * w * 0.55, h = w * (j === 1 ? 1.1 : 0.8); g.beginPath(); g.moveTo(bx - w * 0.18, p.y - w * 0.5); g.lineTo(bx + k * w * 0.15, p.y - w * 0.5 - h); g.lineTo(bx + w * 0.18, p.y - w * 0.5); g.closePath(); g.fillStyle = "#121212"; g.fill(); g.strokeStyle = "#ffd766"; g.stroke(); } }); },
  // Dev Mode: green code raining round the body
  code: function(X){ var g = X.g, i, a, z, p, u; g.font = "700 " + Math.max(8, Math.round(X.s * 0.09)) + "px monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    for (i = 0; i < 20; i++) { a = i * 2.4; u = (X.t * 0.5 + i * 0.137) % 1; z = X.zH + 0.35 - u * 1.6; p = X.P(Math.cos(a) * 0.5, Math.sin(a) * 0.5, z); if (!X.on(p)) continue;
      g.fillStyle = "rgba(61,255,122," + (Math.sin(u * PI) * 0.9) + ")"; g.fillText((i * 7 + Math.floor(X.t * 4)) % 3 ? "1" : "0", p.x, p.y); } },
  // Founder: a turning golden sigil behind the back
  sigil: function(X){ if (X.ph) return; var g = X.g, i, a, pts = [], c = X.P(-0.3, 0, X.zS - 0.05), r = 0.55, rot = X.t * 0.4;
    function q(a, rr){ return X.P(-0.3, Math.cos(a) * rr, X.zS - 0.05 + Math.sin(a) * rr); }
    glow(g, c.x, c.y, X.s * 0.6, "#ffd23b", 0.25);
    for (i = 0; i <= 40; i++) pts.push(q(i * TAU / 40 + rot, r)); line(g, pts, Math.max(1.5, X.s * 0.018), "rgba(255,210,59,.9)");
    pts = []; for (i = 0; i <= 40; i++) pts.push(q(i * TAU / 40 - rot, r * 0.8)); line(g, pts, 1, "rgba(255,240,180,.7)");
    pts = []; for (i = 0; i <= 5; i++) pts.push(q(i * TAU * 2 / 5 - rot, r * 0.8)); line(g, pts, Math.max(1, X.s * 0.014), "rgba(255,210,59,.85)");
    for (i = 0; i < 12; i++) { a = i * TAU / 12 + rot; line(g, [q(a, r * 0.86), q(a, r * 0.95)], 1.5, "#fff6d6"); } },
  // Six Seven: a 6 and a 7 orbiting
  "67": function(X){ var g = X.g; ["6", "7"].forEach(function(n, i){ var a = X.t * 1.1 + i * PI, p = X.P(Math.cos(a) * 0.58, Math.sin(a) * 0.58, X.zS + 0.05 + 0.1 * Math.sin(X.t * 2 + i)); if (!X.on(p)) return;
    g.font = "900 " + Math.max(10, Math.round(X.s * 0.22)) + "px " + R.FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = Math.max(2, X.s * 0.03); g.strokeStyle = "#1a0d33"; g.strokeText(n, p.x, p.y); g.fillStyle = i ? "#ffd23b" : "#b266ff"; g.fillText(n, p.x, p.y); }); }
};
})();
