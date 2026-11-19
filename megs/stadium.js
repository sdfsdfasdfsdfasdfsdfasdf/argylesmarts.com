// MEGS stadiums: the ground around the 5-a-side pitch. A stand runs the whole width behind the far touchline and wraps
// round behind both goals, so the stadium fills the picture from the left edge to the right. Each stadium is an item:
// two are free, the rest come from the weekly shop or from packs.
(function(){
"use strict";
var MG = window.MG, R = MG.R, PI = Math.PI, TAU = PI * 2, clamp = MG.clamp, lerp = MG.lerp, TK = MG.TK, L = TK.L, H = TK.H, I = MG.ITEMS, BY = MG.ITEM;
function add(id, n, r, src, o){ o.t = "stadium"; o.id = id; o.n = n; o.r = r; o.src = src; I.push(o); BY[id] = o; return o; }
var MIX = ["#e6705e", "#f2f2f7", "#3b6ef5", "#ffd23b", "#5ee6a8", "#ff8ad1", "#2b2d36"], SKIN = ["#f1c9a5", "#e2b48c", "#c98f63", "#a86f4c", "#7a4e33", "#5a3826"];

// sky: top to bottom. face / seat / wall / ground: concrete, empty seats, the wall in front of the crowd, the ground round the pitch.
// roof: colour of the roof (none for an open ground). towers: floodlight pylons at the corners instead of lights on the roof.
// crowd: shirt colours. full: how full it is. board: [background, text, text]. fx: what is behind and above the stands.
add("sd_classic", "Floodlit Ground", 0, "free", {sky: ["#05071a", "#141838", "#262a52"], face: "#1a1d36", seat: "#262a4e", wall: "#10122a", ground: "#23592f", roof: "#10122a", rim: "#2c3160", light: "#fff6d6",
  crowd: MIX, full: 0.92, board: ["#14182f", "#ffd23b", "#3b6ef5"], flag: ["#3b6ef5", "#ffd23b", "#ff5d7a"], fx: ["stars", "skyline"]});
add("sd_park", "Park Pitch", 0, "free", {day: 1, sky: ["#4e9be6", "#8fc6f2", "#d9eefb"], face: "#6d5b47", seat: "#2f6f9a", wall: "#4a3b2e", ground: "#3d7f3f", roof: null, towers: 1, light: "#ffffff", ht: 0.62,
  crowd: ["#ffffff", "#2f6f9a", "#e85a4f", "#f2c14e", "#3b3b44", "#88c070"], full: 0.6, board: ["#ffffff", "#2f6f9a", "#e85a4f"], flag: ["#e85a4f", "#ffffff"], fx: ["sun", "clouds", "trees"]});
add("sd_bowl", "Red Bowl", 1, "shop", {day: 1, sky: ["#3f86d8", "#86bdf0", "#cfe7fb"], face: "#9a9ca8", seat: "#b8232c", wall: "#7b1c22", ground: "#2f7a3c", roof: "#e8ebf2", rim: "#ffffff", light: "#ffffff", tier: "#ffffff",
  crowd: ["#d6262f", "#d6262f", "#ffffff", "#d6262f", "#1d1d24", "#f2f2f7"], full: 0.97, board: ["#1d1d24", "#ffffff", "#ff4a52"], flag: ["#d6262f", "#ffffff"], fx: ["sun", "clouds"]});
add("sd_harbour", "Harbour Lights", 1, "pack", {sky: ["#1a2350", "#5a4a86", "#e98a6a"], face: "#2a3048", seat: "#2d5d8a", wall: "#1c2136", ground: "#2a6a3c", roof: "#1c2136", rim: "#ffb46a", light: "#ffe2b8",
  crowd: ["#2d8acd", "#ffffff", "#ffb46a", "#1c2136", "#e85a7a"], full: 0.88, board: ["#10142a", "#ffb46a", "#5ec8ff"], flag: ["#2d8acd", "#ffffff", "#ffb46a"], fx: ["moon", "water", "skyline"]});
add("sd_neon", "Neon Arena", 2, "shop", {sky: ["#05020f", "#130726", "#2a0c46"], face: "#120a24", seat: "#1d1036", wall: "#0b0617", ground: "#1d4a35", roof: "#0b0617", rim: "#ff3df0", light: "#d6f6ff", neon: ["#ff3df0", "#2ef2ff"],
  crowd: ["#ff3df0", "#2ef2ff", "#ffffff", "#7a3dff", "#16101f"], full: 0.95, board: ["#0b0617", "#ff3df0", "#2ef2ff"], flag: ["#ff3df0", "#2ef2ff"], fx: ["stars", "search", "skyline"]});
add("sd_winter", "Winter Park", 2, "pack", {day: 1, sky: ["#5d7494", "#9fb4cc", "#e3ecf5"], face: "#5b6478", seat: "#2d4a7a", wall: "#3a4256", ground: "#3a6e48", roof: "#f4f8ff", rim: "#ffffff", light: "#ffffff", snow: 1,
  crowd: ["#c8282f", "#ffffff", "#2d4a7a", "#1e2230", "#3a8a5a", "#f2c14e"], full: 0.85, board: ["#ffffff", "#2d4a7a", "#c8282f"], flag: ["#c8282f", "#ffffff", "#2d4a7a"], fx: ["mount", "pines"]});
add("sd_desert", "Desert Dome", 3, "shop", {day: 1, sky: ["#3a1d4e", "#d8614a", "#ffc46a"], face: "#b58a5a", seat: "#d8a25a", wall: "#8a6440", ground: "#3d7a3a", roof: "#f2e2c4", rim: "#ffe2a8", light: "#fff2d0",
  crowd: ["#ffffff", "#f2c14e", "#2f8a6a", "#c84a3a", "#1e1e24"], full: 0.9, board: ["#2a1a10", "#ffc46a", "#ffffff"], flag: ["#2f8a6a", "#ffffff", "#c84a3a"], fx: ["sun", "dunes", "palms"]});
add("sd_city", "Downtown Night", 3, "pack", {sky: ["#04060f", "#0c1430", "#1e2a58"], face: "#1c2236", seat: "#3a2e6e", wall: "#121628", ground: "#245a34", roof: "#121628", rim: "#ffd23b", light: "#fff6d6",
  crowd: ["#ffd23b", "#1c1c24", "#ffffff", "#3b6ef5", "#ff5d7a"], full: 0.96, board: ["#0c0f1f", "#ffd23b", "#ffffff"], flag: ["#ffd23b", "#1c1c24"], fx: ["skyline", "search", "stars"], big: 1});
add("sd_jungle", "Jungle Temple", 3, "shop", {day: 1, sky: ["#0f3a2a", "#3e7a4a", "#a8d08a"], face: "#6a6a52", seat: "#3e5a32", wall: "#4a4a3a", ground: "#2e6e36", roof: null, towers: 1, light: "#fff6c8", ht: 0.85,
  crowd: ["#f2c14e", "#e85a3a", "#2e6e36", "#ffffff", "#5a3a22"], full: 0.82, board: ["#2a2a1e", "#f2c14e", "#a8d08a"], flag: ["#f2c14e", "#e85a3a"], fx: ["mount", "trees", "rays"]});
add("sd_temple", "Sky Temple", 4, "pack", {day: 1, sky: ["#7fb4ff", "#cfe2ff", "#fff4d8"], face: "#efe6d0", seat: "#f6f0e2", wall: "#d8c89e", ground: "#3a8a4a", roof: "#ffd56a", rim: "#fff2b8", light: "#ffffff", tier: "#ffd56a",
  crowd: ["#ffffff", "#ffd56a", "#7fb4ff", "#f2f2f7", "#e8a838"], full: 0.9, board: ["#fff8e8", "#c8922a", "#5a8adf"], flag: ["#ffd56a", "#ffffff"], fx: ["rays", "clouds", "cloudsea"]});
add("sd_orbit", "Orbital Station", 4, "shop", {sky: ["#000004", "#050818", "#0d1636"], face: "#2a3040", seat: "#3a4a6a", wall: "#1a1e2a", ground: "#22503a", roof: "#c8d2e8", rim: "#5ee6ff", light: "#d8f4ff", neon: ["#5ee6ff", "#ffffff"],
  crowd: ["#5ee6ff", "#ffffff", "#c8d2e8", "#ff8a3d", "#1a1e2a"], full: 0.86, board: ["#0a0e1a", "#5ee6ff", "#ff8a3d"], flag: ["#5ee6ff", "#ff8a3d"], fx: ["stars", "planet"]});
add("sd_magma", "Magma Pit", 5, "pack", {sky: ["#0c0204", "#3a0806", "#a8240a"], face: "#2a1612", seat: "#3a1a12", wall: "#1a0a08", ground: "#2e5a2a", roof: "#1a0a08", rim: "#ff5a1a", light: "#ffd2a0", neon: ["#ff5a1a", "#ffb02e"], embers: 1,
  crowd: ["#ff5a1a", "#1a0a08", "#ffb02e", "#ffffff", "#7a1a0a"], full: 0.94, board: ["#140604", "#ff5a1a", "#ffb02e"], flag: ["#ff5a1a", "#1a0a08"], fx: ["lava", "mount"]});
add("sd_aurora", "Aurora Ice", 5, "shop", {sky: ["#020a18", "#0a2a3a", "#1a4a5a"], face: "#3a5a6e", seat: "#9ad8f0", wall: "#2a4252", ground: "#2e6a4a", roof: "#e8f8ff", rim: "#5effc8", light: "#e8fff8", snow: 1, neon: ["#5effc8", "#9ad8ff"],
  crowd: ["#ffffff", "#5effc8", "#2a6aa8", "#9ad8f0", "#1a2a3a"], full: 0.88, board: ["#081a24", "#5effc8", "#ffffff"], flag: ["#5effc8", "#ffffff"], fx: ["aurora", "stars", "mount"]});
add("sd_galaxy", "Galaxy Coliseum", 6, "pack", {sky: ["#05010f", "#1a0638", "#3a0c5a"], face: "#1e1236", seat: "#2e1a52", wall: "#140a26", ground: "#244a3a", roof: "#140a26", rim: "#c88aff", light: "#f4e8ff", neon: ["#c88aff", "#ffd23b"],
  crowd: ["#c88aff", "#ffd23b", "#ffffff", "#5ee6ff", "#ff5d9a"], full: 1, board: ["#0c0618", "#c88aff", "#ffd23b"], flag: ["#c88aff", "#ffd23b", "#5ee6ff"], fx: ["galaxy", "stars", "fire"], big: 1});
var LIST = I.filter(function(it){ return it.t === "stadium"; });
MG.SDFREE = ["sd_classic", "sd_park"];

// ---- the crowd for one stadium: dots on the far stand and on the two end stands, already in drawing order ----
function crowdFor(T){
  var r = MG.rng(T.id.length * 977 + T.n.length * 31), ht = T.ht || 1, z1 = 14 * ht, ez = 12.6 * ht, rows = 14, er = 12, out = {back: [], front: [], end: []}, row, i, x, y, z, n, c, u;
  function guy(x, y, z){ if (r() > T.full) return null; return [x, y, z, T.crowd[Math.floor(r() * T.crowd.length)], r() * 6, SKIN[Math.floor(r() * SKIN.length)], r()]; }
  for (row = 0; row < rows; row++) {
    n = 120; for (i = 0; i < n; i++) { x = -42 + (L + 84) * (i + r() * 0.8) / n; u = 1 + row * 1.6; y = -(H + 4 + u); z = 1 + u / 24 * (z1 - 1); c = guy(x, y, z); if (c) (row >= rows / 2 ? out.back : out.front).push(c); }
  }
  [0, 1].forEach(function(s){
    for (row = 0; row < er; row++) for (i = 0; i < 40; i++) {
      y = -H - 3 + (2 * H + 10) * (i + r() * 0.8) / 40; u = 0.8 + row * 1.9; x = s ? L + 9.5 + u : -9.5 - u; z = 1 + u / 24 * (ez - 1); c = guy(x, y, z); if (c) out.end.push(c);
    }
  });
  // far to near: depth along the view only depends on y and z, so the order holds wherever the camera slides
  function key(c){ return c[1] * 0.896 + c[2] * 0.444; }
  [out.back, out.front, out.end].forEach(function(a){ a.sort(function(p, q){ return key(p) - key(q); }); });
  return out;
}

// ---- what is behind and above the stands, drawn flat on the screen ----
function backdrop(v, T, t, y0){
  var g = v.g, w = v.w, h = v.h, fx = T.fx || [], r, i, x, y, s, gr, k;
  gr = g.createLinearGradient(0, Math.min(0, y0 - h * 0.6), 0, Math.max(40, y0 + 10)); T.sky.forEach(function(c, j){ gr.addColorStop(j / (T.sky.length - 1), c); }); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (y0 < 4) return;   // the stands fill the top of the picture: nothing behind them shows
  function has(k){ return fx.indexOf(k) >= 0; }
  if (has("galaxy")) {
    g.save(); g.translate(w * 0.62, y0 * 0.45); g.rotate(t * 0.02);
    for (i = 0; i < 3; i++) { gr = g.createRadialGradient(0, 0, 0, 0, 0, w * (0.25 + i * 0.12)); gr.addColorStop(0, ["rgba(255,220,255,.5)", "rgba(200,138,255,.25)", "rgba(94,230,255,.12)"][i]); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, w * (0.3 + i * 0.14), w * (0.08 + i * 0.03), i * 0.5, 0, TAU); g.fill(); }
    g.restore();
  }
  if (has("stars") || has("galaxy")) { r = MG.rng(7); g.fillStyle = "#fff"; for (i = 0; i < 160; i++) { x = r() * w; y = r() * y0; s = r() < 0.1 ? 2 : 1; g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + r()) + i)); g.fillRect(x, y, s, s); } g.globalAlpha = 1; }
  if (has("aurora")) {
    for (k = 0; k < 3; k++) { g.beginPath(); for (i = 0; i <= 40; i++) { x = i / 40 * w; y = y0 * (0.25 + k * 0.12) + Math.sin(i * 0.35 + t * 0.4 + k * 2) * y0 * 0.08; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      for (i = 40; i >= 0; i--) { x = i / 40 * w; y = y0 * (0.45 + k * 0.12) + Math.sin(i * 0.3 + t * 0.5 + k) * y0 * 0.1; g.lineTo(x, y); }
      g.fillStyle = ["rgba(94,255,200,.16)", "rgba(120,200,255,.12)", "rgba(200,120,255,.1)"][k]; g.fill(); }
  }
  if (has("planet")) {
    x = w * 0.78; y = y0 * 0.42; s = Math.min(w, y0) * 0.3; gr = g.createRadialGradient(x - s * 0.4, y - s * 0.4, s * 0.1, x, y, s); gr.addColorStop(0, "#ffd2a0"); gr.addColorStop(0.6, "#c86a3a"); gr.addColorStop(1, "#3a1a10"); g.fillStyle = gr; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    g.strokeStyle = "rgba(255,230,200,.55)"; g.lineWidth = Math.max(1.5, s * 0.06); g.beginPath(); g.ellipse(x, y, s * 1.7, s * 0.35, -0.25, 0, TAU); g.stroke();
    g.fillStyle = "#b8c8e0"; g.beginPath(); g.arc(w * 0.2, y0 * 0.25, s * 0.18, 0, TAU); g.fill();
  }
  if (has("sun") || has("moon")) {
    x = w * 0.8; y = y0 * 0.38; s = Math.max(10, Math.min(w, y0) * 0.11); gr = g.createRadialGradient(x, y, 0, x, y, s * 4); gr.addColorStop(0, has("moon") ? "rgba(255,240,220,.35)" : "rgba(255,250,220,.55)"); gr.addColorStop(1, "rgba(255,250,220,0)"); g.fillStyle = gr; g.fillRect(x - s * 4, y - s * 4, s * 8, s * 8);
    g.fillStyle = has("moon") ? "#fff2dc" : "#fffbe8"; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
    if (has("moon")) { g.fillStyle = "rgba(200,180,170,.4)"; g.beginPath(); g.arc(x - s * 0.3, y - s * 0.2, s * 0.22, 0, TAU); g.arc(x + s * 0.35, y + s * 0.3, s * 0.15, 0, TAU); g.fill(); }
  }
  if (has("rays")) { g.save(); g.translate(w * 0.5, -y0 * 0.2); for (i = 0; i < 9; i++) { g.rotate(0.2 + 0.02 * Math.sin(t * 0.3 + i)); g.fillStyle = "rgba(255,250,220,.07)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.06, h); g.lineTo(-w * 0.06, h); g.fill(); } g.restore(); }
  if (has("clouds")) { r = MG.rng(11); for (i = 0; i < 7; i++) { x = ((r() * w * 1.4 + t * (6 + r() * 6)) % (w * 1.4)) - w * 0.2; y = y0 * (0.15 + r() * 0.55); s = w * (0.05 + r() * 0.05); g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.ellipse(x, y, s * 1.6, s * 0.45, 0, 0, TAU); g.ellipse(x + s * 0.6, y - s * 0.25, s * 0.8, s * 0.45, 0, 0, TAU); g.ellipse(x - s * 0.5, y - s * 0.15, s * 0.7, s * 0.38, 0, 0, TAU); g.fill(); } }
  if (has("mount")) {
    g.fillStyle = T.snow ? "#7a8aa6" : has("lava") ? "#1a0806" : "#2e5a3a"; g.beginPath(); g.moveTo(0, y0);
    r = MG.rng(5); for (i = 0; i <= 10; i++) g.lineTo(i / 10 * w, y0 - y0 * (0.18 + r() * 0.3) * (i & 1 ? 1 : 0.6)); g.lineTo(w, y0); g.fill();
    if (T.snow) { g.fillStyle = "rgba(255,255,255,.75)"; r = MG.rng(5); for (i = 1; i < 10; i += 2) { r(); x = i / 10 * w; y = y0 - y0 * (0.18 + r() * 0.3); g.beginPath(); g.moveTo(x, y); g.lineTo(x - w * 0.035, y + y0 * 0.07); g.lineTo(x + w * 0.035, y + y0 * 0.07); g.fill(); } }
  }
  if (has("lava")) {
    gr = g.createLinearGradient(0, y0 * 0.5, 0, y0); gr.addColorStop(0, "rgba(255,90,26,0)"); gr.addColorStop(1, "rgba(255,120,30,.55)"); g.fillStyle = gr; g.fillRect(0, y0 * 0.5, w, y0 * 0.5);
    g.fillStyle = "#ff7a1a"; for (i = 0; i < 4; i++) { x = w * (0.15 + i * 0.24); g.beginPath(); g.moveTo(x - w * 0.006, y0); g.lineTo(x + w * 0.004 * Math.sin(t + i), y0 - y0 * 0.3); g.lineTo(x + w * 0.008, y0); g.fill(); }
  }
  if (has("dunes")) { for (k = 0; k < 2; k++) { g.fillStyle = k ? "#c87a4a" : "#a8603e"; g.beginPath(); g.moveTo(0, y0); for (i = 0; i <= 24; i++) g.lineTo(i / 24 * w, y0 - y0 * (0.1 + 0.07 * k) - Math.sin(i * 0.7 + k * 2) * y0 * 0.05); g.lineTo(w, y0); g.fill(); } }
  if (has("cloudsea")) { g.fillStyle = "rgba(255,255,255,.85)"; for (i = 0; i < 18; i++) { x = (i / 17) * w; g.beginPath(); g.arc(x, y0 - y0 * 0.04, w * 0.05 + (i % 3) * w * 0.01, PI, TAU); g.fill(); } }
  if (has("water")) { gr = g.createLinearGradient(0, y0 * 0.75, 0, y0); gr.addColorStop(0, "#2a3a6a"); gr.addColorStop(1, "#1a2448"); g.fillStyle = gr; g.fillRect(0, y0 * 0.78, w, y0 * 0.22); g.strokeStyle = "rgba(255,200,150,.35)"; g.lineWidth = 1; for (i = 0; i < 14; i++) { y = y0 * (0.8 + (i % 5) * 0.04); x = (i * 97 + t * 8) % w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * 0.04, y); g.stroke(); } }
  if (has("skyline")) {
    r = MG.rng(3); x = 0; var night = !has("sun");
    while (x < w) {
      var bw = w * (0.03 + r() * 0.05), bh = y0 * (0.12 + r() * (has("water") ? 0.35 : 0.5)), by = y0 - (has("water") ? y0 * 0.2 : 0) - bh;
      g.fillStyle = night ? "#0a0d1e" : "#5a6a8a"; g.fillRect(x, by, bw, bh + y0 * 0.25);
      if (night) for (i = 0; i < bh / 6; i++) for (k = 0; k < bw / 6; k++) if (r() < 0.35) { g.fillStyle = r() < 0.8 ? "rgba(255,220,140,.7)" : "rgba(140,220,255,.7)"; g.fillRect(x + 2 + k * 6, by + 3 + i * 6, 2, 3); }
      x += bw + w * 0.004;
    }
  }
  if (has("trees") || has("pines") || has("palms")) {
    r = MG.rng(9); for (i = 0; i < 26; i++) {
      x = (i + r() * 0.6) / 26 * w; s = y0 * (0.12 + r() * 0.12);
      if (has("pines")) { g.fillStyle = "#1e3a2e"; g.beginPath(); g.moveTo(x, y0 - s * 1.6); g.lineTo(x - s * 0.45, y0); g.lineTo(x + s * 0.45, y0); g.fill(); if (T.snow) { g.fillStyle = "rgba(255,255,255,.8)"; g.beginPath(); g.moveTo(x, y0 - s * 1.6); g.lineTo(x - s * 0.15, y0 - s * 1.1); g.lineTo(x + s * 0.15, y0 - s * 1.1); g.fill(); } }
      else if (has("palms")) { if (i % 3) continue; g.strokeStyle = "#3a2a1a"; g.lineWidth = Math.max(2, s * 0.08); g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + s * 0.2, y0 - s, x + s * 0.1, y0 - s * 1.7); g.stroke(); g.fillStyle = "#1e3a22"; for (k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + s * 0.1 + Math.cos(k * 1.05) * s * 0.35, y0 - s * 1.7 + Math.sin(k * 1.05) * s * 0.12 + s * 0.1, s * 0.4, s * 0.08, k * 1.05, 0, TAU); g.fill(); } }
      else { g.fillStyle = r() < 0.5 ? "#2e6a34" : "#3a7a3a"; g.beginPath(); g.arc(x, y0 - s * 0.6, s * 0.55, 0, TAU); g.arc(x + s * 0.35, y0 - s * 0.35, s * 0.45, 0, TAU); g.arc(x - s * 0.35, y0 - s * 0.35, s * 0.42, 0, TAU); g.fill(); }
    }
  }
  if (has("search")) { for (i = 0; i < 4; i++) { k = Math.sin(t * 0.5 + i * 1.7) * 0.5; x = w * (0.12 + i * 0.25); g.save(); g.translate(x, y0); g.rotate(k); gr = g.createLinearGradient(0, 0, 0, -y0); gr.addColorStop(0, "rgba(220,240,255,.22)"); gr.addColorStop(1, "rgba(220,240,255,0)"); g.fillStyle = gr; g.beginPath(); g.moveTo(-4, 0); g.lineTo(-y0 * 0.12, -y0 * 1.2); g.lineTo(y0 * 0.12, -y0 * 1.2); g.lineTo(4, 0); g.fill(); g.restore(); } }
  if (has("fire")) { for (k = 0; k < 3; k++) { var ft = (t * 0.45 + k * 0.37) % 1, fx0 = w * (0.2 + 0.3 * k), fy0 = y0 * (0.25 + 0.1 * k); if (ft > 0.6) continue; s = ft / 0.6; g.globalAlpha = 1 - s; g.fillStyle = T.flag[k % T.flag.length]; for (i = 0; i < 22; i++) { var fa = i / 22 * TAU; g.fillRect(fx0 + Math.cos(fa) * s * y0 * 0.25, fy0 + Math.sin(fa) * s * y0 * 0.25 + s * s * y0 * 0.08, 2.5, 2.5); } g.globalAlpha = 1; } }
}

// ---- the stadium itself ----
var V = MG.TeamView.prototype, back0 = V.back;
function T0(v){ var id = v.stad || (MG.S && MG.S.eq && MG.S.eq.stadium) || "sd_classic"; return BY[id] && BY[id].t === "stadium" ? BY[id] : BY.sd_classic; }
// words on a board, drawn into the board's own plane so they lie flat on it instead of floating in front
function boardText(v, T, x0, y0, x1, y1, t, cheer, n){
  var g = v.g, i, u, q, e, f, x, y, l = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / l, dy = (y1 - y0) / l, words = cheer > 0.3 ? ["GOAL", "GOAL"] : ["MEGS", "ARGYLE SMARTS"];
  n = n || 9; g.font = "800 60px " + R.FONT; g.textAlign = "center"; g.textBaseline = "middle";
  for (i = 0; i < n; i++) {
    u = ((i + t * 0.25) % n) / n; x = lerp(x0, x1, u); y = lerp(y0, y1, u); q = v.pr(x, y, 0.45);
    if (q.x < -80 || q.x > v.w + 80 || q.d < 2) continue;
    e = v.pr(x + dx, y + dy, 0.45); f = v.pr(x, y, 1.45);
    g.save(); g.translate(q.x, q.y); g.transform((e.x - q.x) * 0.009, (e.y - q.y) * 0.009, -(f.x - q.x) * 0.009, -(f.y - q.y) * 0.009, 0, 0);
    g.fillStyle = cheer > 0.3 ? (Math.floor(t * 6) & 1 ? T.board[1] : "#ffffff") : i & 1 ? T.board[2] : T.board[1]; g.fillText(words[i & 1], 0, 0); g.restore();
  }
}
V.back = function(m){
  var v = this, g = v.g, w = v.w, h = v.h, t = v.t, T = T0(v), ht = T.ht || 1, z1 = 14 * ht, y1 = -H - 4 - 24, ez = 12.6 * ht, ex = 24, cheer = v.cheer || 0, i, q, c, s, k, x, y, a, gr, top;
  if (v._sid !== T.id) { v._sid = T.id; v._cr = crowdFor(T); }
  top = v.pr(L / 2, y1 - 3, z1 + (T.roof ? 5 : 1)).y;
  backdrop(v, T, t, top);
  // floodlight pylons behind the corners of the far stand
  if (T.towers) [-14, L + 14].forEach(function(px){
    v.line([px, y1 - 4, 0, px, y1 - 4, z1 + 16], 0.5, "#5a5e6e");
    v.poly([px - 3, y1 - 4, z1 + 15, px + 3, y1 - 4, z1 + 15, px + 3, y1 - 4, z1 + 19, px - 3, y1 - 4, z1 + 19], "#3a3e4e");
    for (k = 0; k < 6; k++) { q = v.pr(px - 2.5 + (k % 3) * 2.5, y1 - 4, z1 + 16 + Math.floor(k / 3) * 2); g.fillStyle = T.light; g.fillRect(q.x - q.s * 0.8, q.y - q.s * 0.6, q.s * 1.6, q.s * 1.2); }
    q = v.pr(px, y1 - 4, z1 + 17); gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.s * 14); gr.addColorStop(0, "rgba(255,250,230," + (T.day ? 0.1 : 0.4) + ")"); gr.addColorStop(1, "rgba(255,250,230,0)"); g.fillStyle = gr; g.fillRect(q.x - q.s * 14, q.y - q.s * 14, q.s * 28, q.s * 28);
  });
  // the ground beyond the pitch, out to the stands
  v.poly([-40, -H - 4, 0, L + 40, -H - 4, 0, L + 40, H + 12, 0, -40, H + 12, 0], T.ground);
  // far stand: the whole width of the picture, front wall, seats, aisles, back wall and roof
  v.poly([-70, y1, 0, L + 70, y1, 0, L + 70, y1, z1 + 1, -70, y1, z1 + 1], T.wall);
  v.poly([-70, -H - 4, 1, L + 70, -H - 4, 1, L + 70, y1, z1, -70, y1, z1], T.seat);
  for (x = -36; x <= L + 36; x += 12) v.poly([x - 0.5, -H - 4, 1, x + 0.5, -H - 4, 1, x + 0.5, y1, z1, x - 0.5, y1, z1], T.face);
  v.poly([-70, -H - 4, 0, L + 70, -H - 4, 0, L + 70, -H - 4, 1.05, -70, -H - 4, 1.05], T.wall);
  if (T.roof) {
    v.poly([-70, y1, z1, L + 70, y1, z1, L + 70, y1 - 2, z1 + 4.5, -70, y1 - 2, z1 + 4.5], T.roof);
    v.poly([-70, y1 - 2, z1 + 4.5, L + 70, y1 - 2, z1 + 4.5, L + 70, y1 - 2.4, z1 + 5.2, -70, y1 - 2.4, z1 + 5.2], T.rim);
    for (x = -66; x <= L + 66; x += 6) v.line([x, y1, z1, x, y1 - 2, z1 + 4.5], 0.12, T.rim, 0.45);
    v.line([-70, y1 - 1, z1 + 2.25, L + 70, y1 - 1, z1 + 2.25], 0.08, T.rim, 0.35);
    for (x = -60; x <= L + 60; x += 4) { q = v.pr(x, y1 + 0.2, z1 + 0.4); if (q.x < -4 || q.x > w + 4) continue; g.fillStyle = T.light; g.globalAlpha = 0.8; g.fillRect(q.x - q.s * 0.5, q.y - q.s * 0.12, q.s, q.s * 0.24); g.globalAlpha = 1; }
  }
  crowd(v, T, v._cr.back, t, cheer);
  // the tier front halfway up: an LED band
  k = 1 + 6.5 * 1.6; y = -(H + 4 + k); s = 1 + k / 24 * (z1 - 1);
  v.poly([-70, y, s - 0.2, L + 70, y, s - 0.2, L + 70, y, s + 0.8, -70, y, s + 0.8], T.tier || T.wall); s += 0.8;
  if (T.neon) { v.line([-70, y, s, L + 70, y, s], 0.12, T.neon[0], 0.9); }
  crowd(v, T, v._cr.front, t, cheer);
  // big screens and flags on the far roof
  if (T.roof || T.big) [10, L - 10].forEach(function(sx, j){
    var zz = z1 + (T.roof ? 5.2 : 1), a0 = v.pr(sx - 7, y1 - 2.4, zz), a1 = v.pr(sx + 7, y1 - 2.4, zz + 6.5);
    v.line([sx - 5, y1 - 2.4, zz, sx - 5, y1 - 2.4, zz + 1], 0.25, "#3a3e4e"); v.line([sx + 5, y1 - 2.4, zz, sx + 5, y1 - 2.4, zz + 1], 0.25, "#3a3e4e");
    v.poly([sx - 7, y1 - 2.4, zz + 1, sx + 7, y1 - 2.4, zz + 1, sx + 7, y1 - 2.4, zz + 7, sx - 7, y1 - 2.4, zz + 7], "#0a0b14");
    v.poly([sx - 6.6, y1 - 2.4, zz + 1.4, sx + 6.6, y1 - 2.4, zz + 1.4, sx + 6.6, y1 - 2.4, zz + 6.6, sx - 6.6, y1 - 2.4, zz + 6.6], cheer > 0.3 && Math.floor(t * 4) & 1 ? T.board[1] : "#141a34");
    q = v.pr(sx, y1 - 2.4, zz + 4); if (q.y < -40) return;
    g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 " + Math.max(6, Math.round(q.s * 2.2)) + "px " + R.FONT; g.fillStyle = "#fff";
    g.fillText(m && m.score ? (j ? (m.score[0] + " - " + m.score[1]) : cheer > 0.3 ? "GOAL!" : "MEGS") : "MEGS", q.x, q.y);
  });
  for (i = 0; i < 9; i++) {
    x = -30 + i * (L + 60) / 8; k = z1 + (T.roof ? 5.2 : 1);
    v.line([x, y1 - 2.4, k, x, y1 - 2.4, k + 4], 0.12, "#c8cad8");
    a = []; for (c = 0; c <= 6; c++) a.push(x + c * 0.5, y1 - 2.4, k + 4 - 0.1 - Math.sin(t * 5 + i + c * 0.9) * 0.18 * (c / 6) - c * 0.05);
    for (c = 6; c >= 0; c--) a.push(x + c * 0.5, y1 - 2.4, k + 2.6 - Math.sin(t * 5 + i + c * 0.9) * 0.18 * (c / 6) + c * 0.05);
    v.poly(a, T.flag[i % T.flag.length]);
  }
  // lights along the roof
  if (!T.towers) for (i = 0; i < 6; i++) {
    q = v.pr(-14 + i * (L + 28) / 5, y1 - 2.4, z1 + (T.roof ? 5.6 : 1.5)); g.fillStyle = T.light; g.fillRect(q.x - q.s * 1.6, q.y - q.s * 0.5, q.s * 3.2, q.s * 0.8);
    gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.s * 9); gr.addColorStop(0, "rgba(255,246,214," + (T.day ? 0.06 : 0.3) + ")"); gr.addColorStop(1, "rgba(255,246,214,0)"); g.fillStyle = gr; g.fillRect(q.x - q.s * 9, q.y - q.s * 9, q.s * 18, q.s * 18);
  }
  // the two end stands behind the goals, wrapping round to the near side
  [0, 1].forEach(function(sd){
    var d = sd ? 1 : -1, x0 = sd ? L + 9.5 : -9.5, x1 = x0 + d * ex, ya = -H - 4, yb = H + 12;
    v.poly([x0, ya, 0, x0, yb, 0, x0, yb, 1.05, x0, ya, 1.05], T.wall);
    v.poly([x0, ya, 1, x0, yb, 1, x1, yb, ez, x1, ya, ez], T.seat);
    for (y = -H + 4; y < H + 12; y += 11) v.poly([x0, y - 0.5, 1, x0, y + 0.5, 1, x1, y + 0.5, ez, x1, y - 0.5, ez], T.face);
    v.poly([x1, ya, ez, x1, yb, ez, x1, yb, ez + 2.5, x1, ya, ez + 2.5], T.wall);
    v.poly([x0, yb, 0, x1, yb, 0, x1, yb, ez + 2.5, x0, yb, 1.05], T.face);
  });
  crowd(v, T, v._cr.end, t, cheer);
  [0, 1].forEach(function(sd){
    var d = sd ? 1 : -1, x0 = sd ? L + 9.5 : -9.5, x1 = x0 + d * ex;
    if (T.roof) { v.poly([x1, -H - 4, ez + 2.5, x1, H + 12, ez + 2.5, x1 - d * 9, H + 12, ez + 5, x1 - d * 9, -H - 4, ez + 5], T.roof); v.line([x1 - d * 9, -H - 4, ez + 5, x1 - d * 9, H + 12, ez + 5], 0.2, T.rim); }
    if (T.neon) v.line([x0, -H - 4, 1.05, x0, H + 12, 1.05], 0.12, T.neon[1 % T.neon.length], 0.9);
  });
  // the boards: along the far touchline and behind each goal, scrolling
  g.textAlign = "center"; g.textBaseline = "middle";
  v.poly([-9, -H - 2.2, 0, L + 9, -H - 2.2, 0, L + 9, -H - 2.2, 0.9, -9, -H - 2.2, 0.9], T.board[0]);
  if (T.neon) v.line([-9, -H - 2.2, 0.9, L + 9, -H - 2.2, 0.9], 0.08, T.neon[0], 0.9);
  boardText(v, T, -6, -H - 2.21, L + 6, -H - 2.21, t, cheer, 9);
  // the benches on the far side, either side of halfway
  [L / 2 - 11, L / 2 + 11].forEach(function(bx){
    v.poly([bx - 3, -H - 2.1, 1.5, bx + 3, -H - 2.1, 1.5, bx + 3, -H - 1.1, 1.3, bx - 3, -H - 1.1, 1.3], "rgba(170,200,230,.45)");
    for (i = 0; i < 4; i++) { q = v.pr(bx - 2.2 + i * 1.45, -H - 1.8, 0.7); s = Math.max(1.2, q.s * 0.42); g.fillStyle = i & 1 ? T.board[1] : T.board[2]; g.fillRect(q.x - s / 2, q.y - s, s, s); g.fillStyle = SKIN[i % SKIN.length]; g.fillRect(q.x - s * 0.3, q.y - s * 1.55, s * 0.6, s * 0.55); }
  });
};
function crowd(v, T, list, t, cheer){
  var g = v.g, w = v.w, i, c, q, s, b;
  for (i = 0; i < list.length; i++) {
    c = list[i]; b = Math.max(0, Math.sin(t * 6 + c[4])) * cheer * 0.5 + Math.sin(t * 1.3 + c[4] * 3) * 0.04;
    q = v.pr(c[0], c[1], c[2] + b);
    if (q.x < -6 || q.x > w + 6 || q.y < -6 || q.y > v.h + 6) continue;
    s = Math.max(1.2, q.s * 0.42); g.fillStyle = c[3]; g.fillRect(q.x - s / 2, q.y - s, s, s);
    if (s > 1.6) { g.fillStyle = c[5]; g.fillRect(q.x - s * 0.3, q.y - s * 1.55, s * 0.6, s * 0.55); }
    if (cheer > 0.3 && c[6] < 0.25) { g.fillStyle = T.flag[Math.floor(c[6] * 40) % T.flag.length]; g.fillRect(q.x - s * 0.9, q.y - s * (2.1 + 0.3 * Math.sin(t * 9 + c[4])), s * 1.8, s * 0.35); }   // scarves up
    if (c[6] > 0.985 && Math.sin(t * 3 + c[4] * 9) > 0.97) { g.fillStyle = "#fff"; g.fillRect(q.x - s * 0.6, q.y - s * 1.6, s * 1.2, s * 1.2); }   // camera flashes
  }
}
// the boards behind each goal stand on the grass, so they go on after the pitch and before the nets
var pitch0 = V.pitch;
V.pitch = function(){
  pitch0.call(this);
  var v = this, T = T0(v), g = v.g;
  g.textAlign = "center"; g.textBaseline = "middle";
  [-4.4, L + 4.4].forEach(function(x){
    v.poly([x, -H + 2, 0, x, H - 2, 0, x, H - 2, 0.9, x, -H + 2, 0.9], T.board[0]);
    if (T.neon) v.line([x, -H + 2, 0.9, x, H - 2, 0.9], 0.08, T.neon[0], 0.9);
    if (x < 0) boardText(v, T, x + 0.01, H - 4, x + 0.01, -H + 4, v.t + 3, v.cheer || 0, 6); else boardText(v, T, x - 0.01, -H + 4, x - 0.01, H - 4, v.t + 3, v.cheer || 0, 6);
  });
};
// weather in front of everything: snow or embers
var draw0 = V.draw;
V.draw = function(m, dt){
  draw0.call(this, m, dt);
  var v = this, T = T0(v), g = v.g, i, x, y, r, n;
  if (!T.snow && !T.embers) return;
  g.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); r = MG.rng(17); n = Math.round(v.w * v.h / 9000);
  for (i = 0; i < n; i++) {
    var sp = 20 + r() * 40, ph = r(), x0 = r() * v.w;
    if (T.snow) { y = (ph * v.h + v.t * sp) % v.h; x = x0 + Math.sin(v.t + i) * 8; g.fillStyle = "rgba(255,255,255," + (0.35 + ph * 0.4) + ")"; g.fillRect(x, y, 1.5 + ph * 1.5, 1.5 + ph * 1.5); }
    else { y = v.h - (ph * v.h + v.t * sp) % v.h; x = x0 + Math.sin(v.t * 2 + i) * 6; g.globalAlpha = Math.min(1, y / v.h + 0.1) * 0.7; g.fillStyle = i & 1 ? "#ff7a1a" : "#ffc24a"; g.fillRect(x, y, 2, 2); g.globalAlpha = 1; }
  }
};

// ---- a preview of a stadium for the locker and the shop ----
var PV = null;
R.stadPreview = function(c, id, t){
  var w = c.width, h = c.height, g = c.getContext("2d");
  if (!PV) { var cv = document.createElement("canvas"); PV = new MG.TeamView(cv); }
  if (PV.cv.width !== w || PV.cv.height !== h) { PV.cv.width = w; PV.cv.height = h; }
  PV.w = w; PV.h = h; PV.dpr = 1; PV.stad = id; PV.t = t; PV.cheer = 0;
  PV.cam = {x: L / 2, y: H + 26, z: 13, a: 0.12, f: 640};
  PV.g.setTransform(1, 0, 0, 1, 0, 0); PV.g.lineCap = PV.g.lineJoin = "round";
  PV.back(null); PV.pitch(); PV.goalBack(L, 1); PV.goalBack(0, -1); PV.goalFront(L); PV.goalFront(0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.drawImage(PV.cv, 0, 0);
};

// ---- the shop sells three stadiums a week, on their own shelf ----
var SW = {w: -1, n: 0, list: []};
MG.weekStadiums = function(){
  var w = MG.week(), r, pool, out = [], i;
  if (SW.w === w && SW.n === I.length) return SW.list;
  r = MG.rng(w * 4423 + 71); pool = LIST.filter(function(it){ return it.src === "shop" && it.r <= MG.LEG; });
  for (i = 0; i < 3 && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  SW = {w: w, n: I.length, list: out}; return out;
};
var shop0 = MG.weekShop;
MG.weekShop = function(){ var a = shop0().filter(function(it){ return it.t !== "stadium"; }); return a.concat(MG.weekStadiums()); };

function waitUi(f){ if (MG.ui && MG.ui.VIEW) f(); else setTimeout(function(){ waitUi(f); }, 0); }
waitUi(function(){
  var U = MG.ui, VIEW = U.VIEW, S = function(){ return MG.S; };
  var s = S(); if (s) { MG.SDFREE.forEach(function(k){ s.inv[k] = 1; }); if (!BY[s.eq.stadium]) s.eq.stadium = "sd_classic"; }
  var vis0 = MG.visX;
  MG.visX = function(it, cls){ if (it.t === "stadium") return '<canvas class="bn ' + cls + '" data-std="' + it.id + '" width="360" height="200"></canvas>'; return vis0 ? vis0(it, cls) : ""; };
  var LV = [], on = 0;
  function tick(){ var t = performance.now() / 1000; LV = LV.filter(function(c){ return document.contains(c); }); LV.forEach(function(c){ R.stadPreview(c, c.dataset.std, t); }); if (LV.length) requestAnimationFrame(tick); else on = 0; }
  var px0 = MG.paintX;
  MG.paintX = function(){
    if (px0) px0();
    [].forEach.call(document.querySelectorAll("canvas[data-std]"), function(c){
      if (c._done) return; c._done = 1;
      if (c.classList.contains("big")) { LV.push(c); if (!on) { on = 1; requestAnimationFrame(tick); } } else R.stadPreview(c, c.dataset.std, 1.4);
    });
  };
  MG.KINDS.push(["stadium", "Stadiums"]);
  if (U.cur && U.cur()) U.go(U.cur(), U.arg());
});
})();
