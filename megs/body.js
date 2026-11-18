// MEGS bodies: every part of a player is a solid shape in 3D, so it turns with the player instead of popping.
// Heads with real hair styles, tapered arms and legs, patterned sleeves, shorts and socks, boots with soles and decals,
// full-body skins, hair items, and the extra pieces for the top rarities (wings, crowns, shards, constellations).
(function(){
"use strict";
var MG = window.MG, R = MG.R, I = MG.ITEMS, BY = MG.ITEM, PI = Math.PI, TAU = PI * 2, clamp = MG.clamp, lerp = MG.lerp, hyp = MG.hyp, OUT = R.OUT, hexA = MG.hexA, RH = 0.175;
function add(t, id, n, r, src, o){ o = o || {}; o.t = t; o.id = id; o.n = n; o.r = r; o.src = src; I.push(o); BY[id] = o; return o; }
function seeded(n, k){ var r = MG.rng(n * 7919 + k), a = [], i; for (i = 0; i < n; i++) a.push([r(), r(), r(), r()]); return a; }

// ---- hair items ----
var HS = [["crop", "Short Crop", 0, "free"], ["curly", "Curls", 0, "free"], ["long", "Long", 0, "free"], ["mohawk", "Mohawk", 1, "free"], ["buzz", "Buzz Cut", 0, "free"], ["bald", "Clean Shave", 0, "free"],
  ["afro", "Afro", 2, "pack"], ["pony", "Ponytail", 1, "shop"], ["bun", "Top Knot", 1, "pack"], ["spiky", "Spikes", 2, "shop"], ["quiff", "Quiff", 2, "pass"], ["rows", "Cornrows", 2, "pack"],
  ["dreads", "Locs", 3, "shop"], ["flat", "Flat Top", 2, "pack"], ["part", "Curtains", 1, "pack"], ["braids", "Twin Braids", 3, "pass"], ["faux", "Faux Hawk", 2, "shop"], ["band", "Headband", 2, "pack"],
  ["space", "Space Buns", 3, "shop"], ["slick", "Slick Back", 1, "pack"], ["swept", "Undercut", 2, "shop"], ["wild", "Wild Mane", 3, "pack"]];
HS.forEach(function(h){ add("hair", "h_" + h[0], h[1], h[2], h[3], {st: h[0]}); });
// coloured hair that moves: the colour comes with the item
[["spiky", "fire", "Fire Spikes", 5, "season"], ["long", "galaxy", "Nebula Locks", 5, "pack"], ["mohawk", "neon", "Neon Mohawk", 4, "shop"], ["afro", "rainbow", "Rainbow Afro", 4, "pass"],
  ["wild", "frost", "Frost Mane", 5, "shop"], ["swept", "gold", "Golden Sweep", 4, "pack"], ["dreads", "toxic", "Toxic Locs", 5, "pack"], ["quiff", "chrome", "Chrome Quiff", 6, "shop"],
  ["long", "star", "Starlight", 7, "season"], ["bun", "void", "Void Knot", 6, "pack"], ["braids", "sakura", "Blossom Braids", 5, "pass"], ["spiky", "bolt", "Storm Spikes", 6, "season"],
  ["curly", "rainbow", "Candy Curls", 3, "shop"], ["crop", "neon", "Neon Crop", 3, "pack"], ["faux", "fire", "Hot Head", 4, "pack"], ["flat", "gold", "Gold Block", 5, "shop"]]
  .forEach(function(h, k){ add("hair", "hx" + k, h[2], h[3], h[4], {st: h[0], fx: h[1]}); });
MG.HSTYLES = HS.map(function(h){ return h[0]; });
MG.HFREE = ["h_crop", "h_curly", "h_long", "h_mohawk", "h_buzz", "h_bald"];

// ---- full-body skins: the design runs over the sleeves, shorts and socks too, and most come with their own hair ----
[["su_graf", "Graffiti Suit", 3, "shop", "brush", ["#17171c", "#ff2fb3", "#2ff3ff"], {hair: "swept"}],
 ["su_camo", "Night Ops", 3, "pack", "camo", ["#1f2a14", "#3a4a2a", "#0f140a"], {hair: "buzz"}],
 ["su_arc", "Arcade Kid", 3, "pass", "pixel", ["#14254f", "#ffd23b", "#0a1226"], {hair: "spiky"}],
 ["su_tiger", "Tiger Claw", 3, "pack", "tiger", ["#ff9a1f", "#17171c", "#17171c"], {hair: "wild"}],
 ["su_circ", "Circuit Breaker", 3, "shop", "circuit", ["#062a1c", "#5ee6a8", "#031710"], {hair: "faux"}],
 ["su_lava", "Lava Walker", 4, "pack", "lava", ["#1a0d0a", "#ff5a1f", "#0c0605"], {hair: "spiky", hfx: "fire", f: "ember"}],
 ["su_ice", "Ice Giant", 4, "shop", "frost", ["#dff6ff", "#5aa9e6", "#27507a"], {hair: "wild", hfx: "frost", f: "frost"}],
 ["su_neon", "Neon Night", 4, "pass", "neon", ["#0d0824", "#5ee6ff", "#0d0824"], {hair: "mohawk", hfx: "neon", gl: "#5ee6ff"}],
 ["su_drag", "Dragon Scale", 4, "pack", "scales", ["#0f3d2a", "#ff5a1f", "#06170f"], {hair: "dreads", f: "ember"}],
 ["su_dye", "Festival", 4, "shop", "tiedye", ["#ffffff", "#ff4f7a", "#5ee6ff"], {hair: "afro", hfx: "rainbow"}],
 ["su_gold", "Gold Rush", 4, "season", "gold", ["#d9a93a", "#fff3b0", "#3d2c05"], {hair: "slick", hfx: "gold", f: "spark"}],
 ["su_neb", "Nebula Runner", 5, "pack", "galaxy", ["#0a1238", "#b266ff", "#060a22"], {hair: "long", hfx: "galaxy", f: "star", gl: "#b266ff"}],
 ["su_inf", "Inferno King", 5, "season", "flames", ["#2a0805", "#ffd23b", "#1a0603"], {hair: "spiky", hfx: "fire", f: "ember", gl: "#ff8a1f", eyes: "#ffd23b"}],
 ["su_tox", "Toxic Surge", 5, "shop", "toxic", ["#0c1408", "#a6ff3b", "#0c1408"], {hair: "dreads", hfx: "toxic", gl: "#a6ff3b", eyes: "#a6ff3b"}],
 ["su_sak", "Sakura Storm", 5, "pass", "sakura", ["#ffd6e6", "#ff7ab8", "#5a1f3d"], {hair: "braids", hfx: "sakura", f: "spark", gl: "#ff7ab8"}],
 ["su_glac", "Glacier Ghost", 5, "pack", "frost", ["#bfe9ff", "#ffffff", "#0e5a8a"], {hair: "long", hfx: "frost", f: "frost", gl: "#7fd0ff", eyes: "#7fd0ff"}],
 ["su_chr", "Chrome Phantom", 6, "shop", "chrome", ["#dfe6f2", "#7a8499", "#2a2f3d"], {hair: "quiff", hfx: "chrome", f: "star", gl: "#dfe6f2"}],
 ["su_gli", "Glitch Entity", 6, "pack", "glitch", ["#101425", "#ff2fb3", "#2ff3ff"], {hair: "swept", hfx: "neon", f: "bolt", gl: "#ff2fb3", eyes: "#2ff3ff"}],
 ["su_pri", "Prism Prophet", 6, "season", "prism", ["#ffffff", "#ff4f7a", "#22243f"], {hair: "afro", hfx: "rainbow", f: "star", gl: "#ff4f7a"}],
 ["su_void", "Void Walker", 6, "pack", "void", ["#050308", "#8a3dff", "#050308"], {hair: "bun", hfx: "void", f: "void", gl: "#8a3dff", eyes: "#c9a6ff"}],
 ["su_sera", "Seraph", 7, "season", "nova", ["#fff6d6", "#ffd766", "#c9a24a"], {hair: "long", hfx: "star", f: "corona", gl: "#ffd766", eyes: "#fff6d6", wings: 1, crown: 1}],
 ["su_star", "Starforged", 7, "pack", "galaxy", ["#0a1238", "#5ee6ff", "#060a22"], {hair: "wild", hfx: "galaxy", f: "star", gl: "#5ee6ff", eyes: "#5ee6ff", wings: 1, cons: 1}],
 ["su_sun", "Solar Emperor", 7, "season", "crown", ["#3d0a05", "#ffd23b", "#1a0603"], {hair: "spiky", hfx: "fire", f: "corona", gl: "#ffb938", eyes: "#ffd23b", wings: 1, crown: 1}],
 ["su_moon", "Moon Oracle", 7, "shop", "holo", ["#dfe6f2", "#b266ff", "#2a2f3d"], {hair: "braids", hfx: "star", f: "star", gl: "#e6d6ff", eyes: "#e6d6ff", wings: 1, cons: 1}]]
  .forEach(function(s){ var o = s[6]; o.p = s[4]; o.c = s[5]; o.full = 1; add("kit", s[0], s[1], s[2], s[3], o); });

// ---- the side the renderer builds: add hair, gloves and how much of the body the design covers ----
var dress0 = R.dress;
R.dress = function(sd, s){
  var it, lk, h;
  if (dress0) dress0(sd, s);
  it = sd.it; lk = s.look || {};
  h = BY[s.hair] && BY[s.hair].t === "hair" ? BY[s.hair] : BY["h_" + (MG.HSTYLES[(lk.hair || 0) % MG.HSTYLES.length])];
  sd.hst = it.hair || h.st; sd.hfx = it.hair ? it.hfx || "" : h.fx || ""; sd.hc = MG.HAIR[lk.hc || 0] || MG.HAIR[0];
  sd.full = !!(it.full || (sd.tier || 0) >= 3); sd.eyes = it.eyes || ""; sd.gloves = /^gk_/.test(it.id);
  if (sd.hd === "zeus") { sd.hst = "long"; sd.hfx = ""; sd.hc = "#f4f6ff"; }
  sd.ls = it.full === 1;
  sd.wings = it.wings || (sd.tier >= 7 && !s.calm); sd.crown = it.crown; sd.cons = it.cons;
};

// ---- shapes ----
// a tapered capsule: circles of radius ra at A and rb at B joined by their outer tangents
function capsule(g, A, B, ra, rb){
  var dx = B.x - A.x, dy = B.y - A.y, l = Math.sqrt(dx * dx + dy * dy), a, f, C;
  g.beginPath();
  if (l <= Math.abs(ra - rb) + 0.3) { C = ra >= rb ? A : B; g.arc(C.x, C.y, Math.max(ra, rb), 0, TAU); return; }
  a = Math.atan2(dy, dx); f = Math.acos(clamp((ra - rb) / l, -1, 1));
  g.arc(A.x, A.y, ra, a + f, a + TAU - f); g.arc(B.x, B.y, rb, a - f, a + f); g.closePath();
}
function frame(A, B, ra, rb){ var dx = B.x - A.x, dy = B.y - A.y, l = hyp(dx, dy) || 0.001, r = Math.max(ra, rb); return {ux: dx / l, uy: dy / l, nx: -dy / l, ny: dx / l, l: l, r: r}; }
function patOf(g, src){ var m = src._pm || (src._pm = []), i, p; for (i = 0; i < m.length; i++) if (m[i][0] === g) return m[i][1]; p = g.createPattern(src, "repeat"); m.push([g, p]); if (m.length > 30) m.shift(); return p; }
// the cloth of a kit: the lower part of the shirt texture, below the crest and number, repeated along a sleeve or a leg
function clothOf(sd){ var t = sd.tex[0], c, x; if (t._cl) return t._cl; c = document.createElement("canvas"); c.width = 80; c.height = 50; x = c.getContext("2d"); x.drawImage(t, 0, 50, 80, 50, 0, 0, 80, 50); return t._cl = c; }
function shadeLimb(g, A, F){
  var gr = g.createLinearGradient(A.x - F.nx * F.r, A.y - F.ny * F.r, A.x + F.nx * F.r, A.y + F.ny * F.r);
  gr.addColorStop(0, "rgba(0,0,14,.32)"); gr.addColorStop(0.3, "rgba(255,255,255,.12)"); gr.addColorStop(0.55, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,14,.36)");
  g.fillStyle = gr; g.fill();
}
// several pieces of bare skin joined without seams: outlines first, then the fills over them
function skin(g, list, col){
  list.forEach(function(q){ capsule(g, q[0], q[1], q[2], q[3]); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); });
  list.forEach(function(q){ capsule(g, q[0], q[1], q[2], q[3]); g.fillStyle = col; g.fill(); });
  list.forEach(function(q){ capsule(g, q[0], q[1], q[2], q[3]); shadeLimb(g, q[0], frame(q[0], q[1], q[2], q[3])); });
}
function solid(g, A, B, ra, rb, col){ capsule(g, A, B, ra, rb); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); g.fillStyle = col; g.fill(); shadeLimb(g, A, frame(A, B, ra, rb)); }
// a piece of clothing over a limb. o: {c, pat, off, bands: [[at, width, colour]], st: [Q0, Q1, colour, alpha], mat, glow, t}
function garment(g, A, B, ra, rb, o){
  var F = frame(A, B, ra, rb), k, p, i, b, x0, x1, w;
  capsule(g, A, B, ra, rb); g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke(); g.fillStyle = o.c; g.fill();
  g.save(); g.clip();
  if (o.pat) { k = 2 * F.r / 40; p = patOf(g, o.pat); if (p && p.setTransform) { p.setTransform(new DOMMatrix([F.nx * k, F.ny * k, F.ux * k, F.uy * k, A.x - F.nx * (F.r + k * (o.off || 0)), A.y - F.ny * (F.r + k * (o.off || 0))])); g.fillStyle = p; g.fillRect(Math.min(A.x, B.x) - F.r * 2, Math.min(A.y, B.y) - F.r * 2, Math.abs(B.x - A.x) + F.r * 4, Math.abs(B.y - A.y) + F.r * 4); } }
  if (o.mat && R.mat) { g.save(); g.transform(F.nx * 2 * F.r / 80, F.ny * 2 * F.r / 80, F.ux * F.l / 100, F.uy * F.l / 100, A.x - F.nx * F.r, A.y - F.ny * F.r); R.mat(g, o.mat, o.t); g.restore(); }
  if (o.st && o.st[3] > 0.02) { g.globalAlpha = o.st[3]; g.strokeStyle = o.st[2]; g.lineWidth = F.r * 0.42; if (o.glow) { g.shadowColor = o.glow; g.shadowBlur = F.r * 1.4; } g.beginPath(); g.moveTo(o.st[0].x, o.st[0].y); g.lineTo(o.st[1].x, o.st[1].y); g.stroke(); g.shadowBlur = 0; g.globalAlpha = 1; }
  for (i = 0; o.bands && i < o.bands.length; i++) {
    b = o.bands[i]; x0 = b[0] - b[1] / 2; x1 = b[0] + b[1] / 2; w = F.r * 1.6;
    g.fillStyle = b[2]; g.beginPath();
    g.moveTo(A.x + F.ux * F.l * x0 + F.nx * w, A.y + F.uy * F.l * x0 + F.ny * w); g.lineTo(A.x + F.ux * F.l * x1 + F.nx * w, A.y + F.uy * F.l * x1 + F.ny * w);
    g.lineTo(A.x + F.ux * F.l * x1 - F.nx * w, A.y + F.uy * F.l * x1 - F.ny * w); g.lineTo(A.x + F.ux * F.l * x0 - F.nx * w, A.y + F.uy * F.l * x0 - F.ny * w); g.fill();
  }
  capsule(g, A, B, ra, rb); shadeLimb(g, A, F);
  g.restore();
}
function hull(p){
  var a = p.slice().sort(function(m, n){ return m.x - n.x || m.y - n.y; }), lo = [], up = [], i;
  function cr(o, m, n){ return (m.x - o.x) * (n.y - o.y) - (m.y - o.y) * (n.x - o.x); }
  for (i = 0; i < a.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], a[i]) <= 0) lo.pop(); lo.push(a[i]); }
  for (i = a.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], a[i]) <= 0) up.pop(); up.push(a[i]); }
  up.pop(); lo.pop(); return lo.concat(up);
}
function poly(g, pts){ g.beginPath(); pts.forEach(function(p, i){ if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.closePath(); }

// ---- hair colours ----
var HFX = {
  fire: ["#ffe66b", "#ff8a1f", "#b3260a", "#ff8a1f"], neon: null, galaxy: ["#b266ff", "#3d1f8a", "#0a1238", "#b266ff"], frost: ["#ffffff", "#bfe9ff", "#5aa9e6", "#bfe9ff"],
  rainbow: null, gold: ["#fff6c2", "#ffd23b", "#a8761a", "#ffd23b"], toxic: ["#d6ff3b", "#5ee63b", "#0f3d14", "#a6ff3b"], chrome: ["#ffffff", "#c9d2e6", "#5a6478", "#dfe6f2"],
  star: ["#fffbe6", "#ffe08a", "#b8862a", "#fff6d6"], void: ["#3d1f6b", "#140a24", "#050308", "#8a3dff"], sakura: ["#ffe6f0", "#ff9ac9", "#c94f8a", "#ff7ab8"], bolt: ["#ffffff", "#bfe0ff", "#3b6ef5", "#9fd0ff"]
};
function hairPaint(g, fx, hc, cx, cy, r, t, sd){
  var gr, c, i;
  if (!fx) return hc;
  if (fx === "neon") return sd.fc || "#5ee6ff";
  if (fx === "rainbow") { gr = g.createLinearGradient(cx - r * 1.3, cy, cx + r * 1.3, cy); for (i = 0; i <= 6; i++) gr.addColorStop(i / 6, "hsl(" + Math.round((t * 90 + i * 60) % 360) + ",95%,62%)"); return gr; }
  c = HFX[fx]; gr = g.createLinearGradient(cx, cy - r * 1.6, cx, cy + r * 0.9);
  gr.addColorStop(0, c[0]); gr.addColorStop(0.4, c[1]); gr.addColorStop(1, c[2]);
  if (fx === "chrome") { i = ((t * 0.6) % 1.4) - 0.2; gr = g.createLinearGradient(cx - r * 1.4, cy - r, cx + r * 1.4, cy + r); gr.addColorStop(0, c[2]); gr.addColorStop(clamp(i, 0, 1), c[0]); gr.addColorStop(clamp(i + 0.15, 0, 1), c[2]); gr.addColorStop(1, c[1]); }
  return gr;
}
function hairGlow(fx, sd){ return fx === "neon" ? sd.fc || "#5ee6ff" : fx === "toxic" ? "#a6ff3b" : fx === "star" ? "#fff6d6" : fx === "void" ? "#8a3dff" : fx === "fire" ? "#ff8a1f" : fx === "bolt" ? "#9fd0ff" : ""; }

// ---- the head ----
// hairline height (sine of the latitude) all the way round the head; th = 0 is the middle of the forehead
function hl0(th){ return 0.04 + 0.46 * Math.cos(th) - 0.08 * Math.cos(2 * th); }
var LINE = {
  long: function(th){ return hl0(th) - 0.08 * (1 - Math.cos(th)); },
  part: function(th){ return hl0(th) - 0.24 * Math.exp(-th * th / 0.5) + 0.32 * Math.exp(-th * th / 0.006); },
  braids: function(th){ return hl0(th) - 0.1 * Math.exp(-th * th / 0.5) + 0.28 * Math.exp(-th * th / 0.006); },
  space: function(th){ return hl0(th) + 0.25 * Math.exp(-th * th / 0.006); },
  afro: function(th){ return hl0(th) - 0.06; }, wild: function(th){ return hl0(th) - 0.06; }
};
function wrapTh(th){ while (th > PI) th -= TAU; while (th < -PI) th += TAU; return th; }
// layer 0: the hair that hangs down behind the body. Layer 1: the head itself
function head2(g, F, H3, HD, layer){
  var P = F.P, s = F.s, sd = F.sd, t = F.t, r = RH * s, cx = HD.x, cy = HD.y, st = sd.hst || "crop", fx = sd.hfx, hc = sd.hc, lf = LINE[st] || hl0, vols = [], hang = [], paint, glow, i, v, p, run, hd = sd.hd, hairOn = !hd || hd === "zeus";
  function sp(th, hh, rad){ var cr = Math.sqrt(Math.max(0, 1 - hh * hh)), q = RH * (rad || 1); return P(H3[0] + Math.cos(th) * cr * q, H3[1] + Math.sin(th) * cr * q, H3[2] + hh * q); }
  function lp(f, rr, u){ return P(H3[0] + f * RH, H3[1] + rr * RH, H3[2] + u * RH); }
  function vis(p, rad){ return (HD.d - p.d) / (RH * (rad || 1)); }
  function onRim(p){ var dx = p.x - cx, dy = p.y - cy, l = hyp(dx, dy) || 1; return {x: cx + dx / l * r, y: cy + dy / l * r, d: p.d}; }
  // a patch on the face: points behind the head are pushed out to the outline, so the patch is cut by it as the head turns
  function patch(list){ return list.map(function(q){ var p = sp(q[0], q[1], q[2] || 1.01); return vis(p) < 0 ? onRim(p) : p; }); }
  paint = hairPaint(g, fx, hc, cx, cy, r, t, sd); glow = hairGlow(fx, sd);
  function hairFill(){ g.fillStyle = paint; if (glow) { g.shadowColor = glow; g.shadowBlur = r * 0.5; } g.fill(); g.shadowBlur = 0; }
  function blobAt(p, rad, sq){ return {d: p.d, f: function(){ g.beginPath(); g.ellipse(p.x, p.y, rad, rad * (sq || 1), 0, 0, TAU); g.lineWidth = 1.4; g.strokeStyle = "rgba(8,9,22,.45)"; g.stroke(); hairFill(); g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.ellipse(p.x - rad * 0.25, p.y - rad * 0.3, rad * 0.45, rad * 0.3, -0.5, 0, TAU); g.fill(); }}; }
  function chain(pts, r0, r1, hangs){ var i, a, b, mid; for (i = 0; i < pts.length - 1; i++) { a = pts[i]; b = pts[i + 1]; (function(a, b, ra, rb){ var it = {d: (a.d + b.d) / 2, f: function(){ capsule(g, a, b, ra, rb); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); hairFill(); }}; (hangs ? hang : vols).push(it); })(a, b, lerp(r0, r1, i / (pts.length - 1)), lerp(r0, r1, (i + 1) / (pts.length - 1))); } }
  // ---- the shapes each style adds ----
  if (hairOn) {
    if (st === "curly" || st === "afro") {
      seeded(st === "afro" ? 34 : 24, 3).forEach(function(q){ var th = q[0] * TAU, lo = lf(th) + 0.05, hh = lerp(lo, 0.98, q[1]), p = sp(th, hh, st === "afro" ? 1.28 + q[2] * 0.08 : 1.05); vols.push(blobAt(p, r * (st === "afro" ? 0.3 : 0.25) * (0.85 + q[3] * 0.3))); });
      if (st === "afro") vols.push({d: HD.d + RH * 0.6, f: function(){ var p = lp(-0.08, 0, 0.18); g.beginPath(); g.arc(p.x, p.y, r * 1.3, 0, TAU); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); hairFill(); }});
    }
    if (st === "spiky" || st === "wild") {
      seeded(st === "wild" ? 16 : 11, 9).forEach(function(q){
        var th = q[0] * TAU, hh = st === "wild" ? lerp(-0.25, 0.92, q[1]) : lerp(0.35, 0.95, q[1]);
        if (Math.abs(wrapTh(th)) < 1.1 && hh < 0.5) { th = PI - th; }
        var L = st === "wild" ? 1.45 + q[2] * 0.3 : 1.42 + q[2] * 0.22, b = [sp(th - 0.28, hh, 0.95), sp(th + 0.28, hh, 0.95), sp(th, hh - 0.2, 0.95), sp(th, Math.min(1, hh + 0.2), 0.95)], tip = sp(th + (st === "wild" ? 0.3 : 0.1), Math.min(1, hh + 0.12), L);
        vols.push({d: tip.d * 0.4 + b[0].d * 0.6, f: function(){ poly(g, hull(b.concat([tip]))); g.lineWidth = 1.6; g.strokeStyle = OUT; g.stroke(); hairFill(); }});
      });
    }
    if (st === "mohawk" || st === "faux") {
      vols.push({d: HD.d - RH * 0.2, f: function(){
        var a0 = st === "faux" ? 0.55 : 0.3, a1 = st === "faux" ? 2.25 : 2.9, n = st === "faux" ? 6 : 9, top = st === "faux" ? 1.28 : 1.58, base = [], tips = [], i, m, u;
        for (i = 0; i <= n; i++) { m = lerp(a0, a1, i / n); base.push(lp(Math.cos(m) * 0.96, 0, Math.sin(m) * 0.96)); }
        for (i = n; i >= 0; i--) { m = lerp(a0, a1, i / n); u = (i % 2 ? 0.86 : 1) * lerp(1.06, top, Math.sin(PI * i / n) * 0.8 + 0.2); tips.push(lp(Math.cos(m) * u, 0, Math.sin(m) * u)); }
        poly(g, base.concat(tips)); g.lineWidth = Math.max(2, r * 0.16); g.strokeStyle = OUT; g.stroke(); g.lineWidth = Math.max(1, r * 0.12); g.strokeStyle = paint; g.stroke(); hairFill();
      }});
    }
    if (st === "quiff") { vols.push(blobAt(sp(0.05, 0.62, 1.12), r * 0.42, 0.85)); vols.push(blobAt(sp(0.3, 0.5, 1.12), r * 0.3)); }
    if (st === "swept") { vols.push(blobAt(sp(0.35, 0.58, 1.1), r * 0.34, 0.8)); vols.push(blobAt(sp(0.75, 0.52, 1.08), r * 0.26, 0.8)); }
    if (st === "part") { vols.push(blobAt(sp(-0.38, 0.34, 1.06), r * 0.24, 1.2)); vols.push(blobAt(sp(0.38, 0.34, 1.06), r * 0.24, 1.2)); }
    if (st === "bun") vols.push(blobAt(sp(PI, 0.74, 1.14), r * 0.36));
    if (st === "space") { vols.push(blobAt(sp(1.25, 0.66, 1.12), r * 0.33)); vols.push(blobAt(sp(-1.25, 0.66, 1.12), r * 0.33)); }
    if (st === "flat") vols.push({d: HD.d - RH * 0.1, f: function(){ var c = [], top = [], a, b, u; for (a = -1; a <= 1; a += 2) for (b = -1; b <= 1; b += 2) for (u = 0; u < 2; u++) { (u ? top : c).push(lp(a * 0.8, b * 0.8, u ? 1.08 : 0.4)); } poly(g, hull(c.concat(top))); g.lineWidth = 1.8; g.strokeStyle = OUT; g.stroke(); hairFill(); poly(g, hull(top)); g.fillStyle = "rgba(0,0,0,.12)"; g.fill(); }});
    if (st === "pony") { p = [sp(PI, 0.32, 1.02)]; for (i = 1; i < 5; i++) p.push(lp(-1.05 - i * 0.12, 0.08 * Math.sin(t * 3.5 - i), 0.32 - i * 0.42)); chain(p, r * 0.24, r * 0.12, 1); }
    if (st === "braids") [-1, 1].forEach(function(k){ var q = [sp(k * 1.95, -0.05, 1.0)], i; for (i = 1; i < 6; i++) q.push(lp(-0.25 + i * 0.07, k * (0.95 + i * 0.02), -0.15 - i * 0.36)); chain(q, r * 0.2, r * 0.13, 1); });
    if (st === "long") hang.push({d: HD.d + RH * 0.7, f: function(){
      var top = [], bot = [], a, i, th;
      for (i = 0; i <= 12; i++) { th = lerp(PI / 2 - 0.45, PI * 1.5 + 0.45, i / 12); top.push(sp(th, 0.05, 1.05)); bot.push(P(H3[0] + Math.cos(th) * RH * 1.12, H3[1] + Math.sin(th) * RH * 1.18, H3[2] - RH * (2.6 + 0.15 * Math.cos(th * 3)))); }
      poly(g, top.concat(bot.reverse())); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); hairFill();
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 1.2; for (i = 2; i < 12; i += 3) { a = top[i]; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(bot[12 - i].x, bot[12 - i].y); g.stroke(); }
    }});
    if (st === "dreads") seeded(10, 21).forEach(function(q, k){ var th = lerp(1.45, TAU - 1.45, k / 9), b = sp(th, 0.15, 1.0), m = P(H3[0] + Math.cos(th) * RH * 1.12 - RH * 0.15, H3[1] + Math.sin(th) * RH * 1.12, H3[2] - RH * 0.75), e = P(H3[0] + Math.cos(th) * RH * 1.0 - RH * 0.35, H3[1] + Math.sin(th) * RH * 0.95, H3[2] - RH * (1.7 + q[0] * 0.5)); chain([b, m, e], r * 0.16, r * 0.11, 1); });
  }
  // ---- layer 0: hanging hair behind the body ----
  if (layer === 0) { hang.forEach(function(h){ if (h.d > F.NK.d) h.f(); }); return; }
  vols = vols.concat(hang.filter(function(h){ return h.d <= F.NK.d; }));
  vols.sort(function(a, b){ return b.d - a.d; });
  // things further away than the head go behind it
  vols.forEach(function(v){ if (v.d > HD.d) v.f(); });
  // ears, then the head
  ears(0);
  if (hd !== "robot") R.blob(g, cx, cy, r, r, sd.skin);
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip();
  v = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.05); v.addColorStop(0, "rgba(255,255,255,.2)"); v.addColorStop(0.6, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,12,.25)"); g.fillStyle = v; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  if (hd) mask2(g, sp, lp, vis, patch, cx, cy, r, sd, t);
  else face(g, sp, vis, r, sd, t, F.nod);
  if (hairOn && st !== "bald") {
    run = cap(st === "swept" || st === "mohawk" ? 0.4 : st === "buzz" ? 0.62 : st === "rows" ? 0.92 : 1, lf, 1.0);
    if (st === "swept") cap(1, function(th){ return 0.5 + 0.1 * Math.cos(th); }, 1.0);
    if (st === "rows" || st === "slick") lines(st === "rows" ? "rgba(0,0,0,.4)" : "rgba(255,255,255,.22)", st === "rows" ? 0.08 : 0.05);
    if (st === "band") band(0.5, sd.col[1] === sd.skin ? "#ff4f7a" : sd.col[1]);
    if (hd === "zeus") band(0.5, "#ffd23b");
    sparkle();
    g.fillStyle = "rgba(255,255,255,.14)"; g.beginPath(); g.ellipse(cx - r * 0.3, cy - r * 0.62, r * 0.32, r * 0.13, -0.4, 0, TAU); g.fill();
  } else if (!hd) { g.fillStyle = "rgba(255,255,255,.22)"; g.beginPath(); g.ellipse(cx - r * 0.3, cy - r * 0.55, r * 0.3, r * 0.14, -0.4, 0, TAU); g.fill(); }
  g.restore();
  ears(1);
  vols.forEach(function(v){ if (v.d <= HD.d) v.f(); });
  if (!hd && fx) flare();
  // ---- helpers that need the head's frame ----
  function ears(front){
    if (hd) return;
    [-1, 1].forEach(function(k){ var p = sp(k * PI / 2, -0.05, 0.98), v = vis(p); if ((v >= 0) !== !!front) return; g.fillStyle = OUT; g.beginPath(); g.ellipse(p.x, p.y, r * 0.15 * (0.4 + 0.6 * Math.max(0, v)) + 1, r * 0.22 + 1, 0, 0, TAU); g.fill(); g.fillStyle = sd.skin; g.beginPath(); g.ellipse(p.x, p.y, r * 0.15 * (0.4 + 0.6 * Math.max(0, v)), r * 0.22, 0, 0, TAU); g.fill(); });
  }
  // the scalp: the part of the head above the hairline. Returns the visible stretch of hairline
  function cap(alpha, fn, rad){
    var n = 40, pts = [], vs = [], i, k, a, u, st0 = -1, run = [], e, b;
    for (i = 0; i < n; i++) { pts.push(sp(i / n * TAU, fn(i / n * TAU), rad)); vs.push(vis(pts[i], rad)); }
    for (i = 0; i < n; i++) if (vs[i] >= 0 && vs[(i + n - 1) % n] < 0) { st0 = i; break; }
    g.beginPath();
    if (st0 < 0) { if (vs[0] >= 0) { poly(g, pts); } else if (vis(sp(0, 1, 1)) > 0) { g.rect(cx - r * 2, cy - r * 2, r * 4, r * 4); } else return []; }
    else {
      a = (st0 + n - 1) % n; u = vs[a] / (vs[a] - vs[st0]); run.push({x: lerp(pts[a].x, pts[st0].x, u), y: lerp(pts[a].y, pts[st0].y, u)});
      for (k = 0; k < n; k++) { i = (st0 + k) % n; if (vs[i] < 0) { a = (i + n - 1) % n; u = vs[a] / (vs[a] - vs[i]); run.push({x: lerp(pts[a].x, pts[i].x, u), y: lerp(pts[a].y, pts[i].y, u)}); break; } run.push(pts[i]); }
      e = run[run.length - 1]; b = run[0];
      g.moveTo(b.x, b.y); run.forEach(function(p){ g.lineTo(p.x, p.y); });
      g.lineTo(cx + (e.x - cx) * 4, cy + (e.y - cy) * 4); g.lineTo(cx, cy - r * 4); g.lineTo(cx + (b.x - cx) * 4, cy + (b.y - cy) * 4); g.closePath();
    }
    g.globalAlpha = alpha; hairFill(); g.globalAlpha = 1;
    if (run.length > 1) { g.strokeStyle = "rgba(0,0,10,.28)"; g.lineWidth = Math.max(1, r * 0.06); g.beginPath(); run.forEach(function(p, i){ if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke(); }
    return run;
  }
  function lines(col, w){
    var rho, m, p, q, prev;
    g.strokeStyle = col; g.lineWidth = Math.max(1, r * w);
    for (rho = -0.6; rho <= 0.61; rho += 0.3) { prev = null; g.beginPath();
      for (m = 0.4; m <= PI + 0.5; m += 0.12) { q = Math.sqrt(1 - rho * rho); p = lp(Math.cos(m) * q * 1.01, rho * 1.01, Math.sin(m) * q * 1.01); if (vis(p, 1.01) > 0.05 && Math.sin(m) * q > lf(m > PI / 2 ? PI : 0) - 0.05) { if (prev) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); prev = p; } else prev = null; }
      g.stroke(); }
  }
  function band(hh, col){ var i, p, prev = 0; g.strokeStyle = col; g.lineWidth = r * 0.2; g.beginPath(); for (i = 0; i <= 48; i++) { p = sp(i / 48 * TAU, hh, 1.01); if (vis(p) > 0) { if (prev) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); prev = 1; } else prev = 0; } g.stroke(); }
  function sparkle(){
    if (!fx || fx === "neon") return;
    seeded(12, 5).forEach(function(q, k){ var th = q[0] * TAU, hh = lerp(lf(th) + 0.1, 0.95, q[1]), p = sp(th, hh, 1.02), v = vis(p), a = Math.max(0, Math.sin(t * (2 + q[2] * 3) + k * 1.7)); if (v < 0.15 || a < 0.2) return;
      g.globalAlpha = a * v; g.fillStyle = fx === "sakura" ? "#ffffff" : fx === "fire" ? "#fff6a8" : "#ffffff"; R.star(g, p.x, p.y, r * (0.08 + 0.1 * a), 4, t); g.fill(); g.globalAlpha = 1; });
  }
  // flames, petals, bubbles or sparks lifting off the top of the head
  function flare(){
    var i, u, p, th, a;
    for (i = 0; i < 6; i++) {
      u = (t * (fx === "fire" ? 1.4 : 0.5) + i / 6) % 1; th = i * 2.4 + t * 0.3; p = sp(th, 0.55, 1.1); a = Math.sin(u * PI);
      if (fx === "fire") { g.globalAlpha = 0.85 * a; g.fillStyle = i & 1 ? "#ffd23b" : "#ff5a1f"; g.beginPath(); g.ellipse(p.x + Math.sin(t * 9 + i) * r * 0.1, p.y - r * (0.6 + u * 1.1), r * 0.13 * (1 - u * 0.6), r * 0.28 * (1 - u * 0.5), 0, 0, TAU); g.fill(); }
      else if (fx === "sakura") { g.globalAlpha = a; g.fillStyle = "#ff9ac9"; g.beginPath(); g.ellipse(p.x + Math.sin(t * 2 + i) * r * 0.5, p.y + r * (u * 2.2 - 0.6), r * 0.12, r * 0.06, t * 3 + i, 0, TAU); g.fill(); }
      else if (fx === "toxic") { g.globalAlpha = a * 0.8; g.strokeStyle = "#d6ff3b"; g.lineWidth = 1.2; g.beginPath(); g.arc(p.x, p.y - r * (0.5 + u * 1.2), r * 0.08 + r * 0.05 * u, 0, TAU); g.stroke(); }
      else if (fx === "bolt" && Math.sin(t * 11 + i * 3) > 0.7) { g.globalAlpha = 0.9; g.strokeStyle = "#eaf6ff"; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.x, p.y - r * 0.4); g.lineTo(p.x + r * 0.2, p.y - r * 0.8); g.lineTo(p.x - r * 0.1, p.y - r * 1.0); g.lineTo(p.x + r * 0.15, p.y - r * 1.4); g.stroke(); }
      else if (fx === "star" || fx === "galaxy" || fx === "gold" || fx === "frost") { g.globalAlpha = a * 0.9; g.fillStyle = fx === "gold" ? "#fff3b0" : "#ffffff"; R.star(g, p.x + Math.cos(th) * r * 0.4, p.y - r * (0.4 + u * 1.0), r * 0.1 * a + 1, 4, t); g.fill(); }
    }
    g.globalAlpha = 1;
  }
}
// eyes, brows, nose and mouth sit on the sphere, so they slide round and shrink into the outline as the head turns
function face(g, sp, vis, r, sd, t, nod){
  var k, p, v, a, b, m, e = sd.eyes, blink = (t * 0.37 % 1) > 0.97 ? 0.15 : 1;
  for (k = -1; k <= 1; k += 2) {
    p = sp(k * 0.42, 0.02 - 0.12 * nod, 1); v = vis(p);
    if (v > 0) {
      if (e) { g.fillStyle = e; g.shadowColor = e; g.shadowBlur = r * 0.6; }
      else g.fillStyle = "#15151c";
      g.beginPath(); g.ellipse(p.x, p.y, r * 0.105 * Math.pow(v, 0.85) + 0.3, r * 0.15 * blink, 0, 0, TAU); g.fill(); g.shadowBlur = 0;
      if (!e && r > 14 && blink === 1) { g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(p.x - r * 0.03, p.y - r * 0.05, r * 0.035, 0, TAU); g.fill(); }
      a = sp(k * 0.42 - 0.17, 0.3 - 0.1 * nod, 1.01); b = sp(k * 0.42 + 0.17, 0.3 - 0.1 * nod, 1.01);
      g.globalAlpha = clamp(v * 3, 0, 1); g.strokeStyle = sd.hst === "bald" || sd.hst === "buzz" ? "rgba(40,24,16,.55)" : sd.hc; g.lineWidth = Math.max(1, r * 0.07); g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 - r * 0.06, b.x, b.y); g.stroke(); g.globalAlpha = 1;
    }
  }
  p = sp(0, -0.14, 1.02); v = vis(p); if (v > 0) { g.globalAlpha = 0.3 * v; g.strokeStyle = "#3a2018"; g.lineWidth = Math.max(1, r * 0.05); a = sp(0.12, -0.2, 1.02); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(a.x, a.y); g.stroke(); g.globalAlpha = 1; }
  a = sp(-0.24, -0.42, 1); m = sp(0, -0.48, 1.01); b = sp(0.24, -0.42, 1);
  if (vis(m) > 0) { g.globalAlpha = clamp(vis(m) * 2.5, 0, 1); g.strokeStyle = "rgba(70,24,24,.75)"; g.lineWidth = Math.max(1, r * 0.06); g.beginPath(); g.moveTo(vis(a) > 0 ? a.x : m.x, vis(a) > 0 ? a.y : m.y); g.quadraticCurveTo(m.x, m.y + r * 0.04, vis(b) > 0 ? b.x : m.x, vis(b) > 0 ? b.y : m.y); g.stroke(); g.globalAlpha = 1; }
}
// the whole-head characters, rebuilt so their faces turn with them
function mask2(g, sp, lp, vis, patch, cx, cy, r, sd, t){
  var hd = sd.hd, k, p, v, c, pts, i, f;
  function glowEyes(col, w, h, th){ for (k = -1; k <= 1; k += 2) { p = sp(k * (th || 0.4), 0.02, 1.01); v = vis(p); if (v <= 0) continue; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = r * 0.8; g.beginPath(); g.ellipse(p.x, p.y, r * w * v + 0.4, r * h, 0, 0, TAU); g.fill(); g.shadowBlur = 0; } }
  if (hd === "robot") {
    g.restore();   // the robot's head is a box, drawn outside the round clip
    pts = []; for (i = 0; i < 8; i++) pts.push(lp(i & 1 ? 0.92 : -0.92, i & 2 ? 0.92 : -0.92, i & 4 ? 0.92 : -0.95));
    poly(g, hull(pts)); g.lineWidth = 2.2; g.strokeStyle = OUT; g.stroke(); g.fillStyle = "#aab3c6"; g.fill();
    // each face of the box, lit by how squarely it faces the camera
    [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1]].forEach(function(n){
      var c0 = lp(n[0] * 0.92, n[1] * 0.92, n[2] * 0.92), vv = vis(c0, 0.92), q = [], a, b;
      if (vv <= 0.02) return;
      for (a = -1; a <= 1; a += 2) for (b = -1; b <= 1; b += 2) q.push(n[0] ? lp(n[0] * 0.92, a * 0.92, b > 0 ? 0.92 : -0.95) : n[1] ? lp(a * 0.92, n[1] * 0.92, b > 0 ? 0.92 : -0.95) : lp(a * 0.92, b * 0.92, 0.92));
      poly(g, hull(q)); g.fillStyle = n[2] ? "rgba(255,255,255,.3)" : "rgba(255,255,255," + (0.12 * vv) + ")"; g.fill(); g.strokeStyle = "rgba(8,9,22,.35)"; g.lineWidth = 1; g.stroke();
      if (n[0] === 1) { q = [lp(0.93, -0.66, -0.14), lp(0.93, 0.66, -0.14), lp(0.93, 0.66, 0.26), lp(0.93, -0.66, 0.26)]; poly(g, q); g.fillStyle = "#0c1020"; g.fill(); q = [lp(0.94, -0.52, -0.02), lp(0.94, 0.52, -0.02), lp(0.94, 0.52, 0.12), lp(0.94, -0.52, 0.12)]; poly(g, q); g.fillStyle = "#38e1ff"; g.shadowColor = "#38e1ff"; g.shadowBlur = r * 0.6 * vv; g.fill(); g.shadowBlur = 0; }
      if (n[1]) { a = lp(0, n[1] * 0.93, 0); g.fillStyle = "#5a6478"; g.beginPath(); g.arc(a.x, a.y, r * 0.18 * Math.max(0.3, vv), 0, TAU); g.fill(); }
      if (n[0] === -1) { g.strokeStyle = "rgba(8,9,22,.45)"; g.lineWidth = 1.2; for (a = -2; a <= 2; a++) { b = lp(-0.93, -0.5, a * 0.15); c = lp(-0.93, 0.5, a * 0.15); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(c.x, c.y); g.stroke(); } }
    });
    p = lp(0, 0, 0.92); c = lp(0, 0, 1.55); g.strokeStyle = OUT; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(c.x, c.y); g.stroke();
    g.fillStyle = "#ff5d5d"; g.shadowColor = "#ff5d5d"; g.shadowBlur = (Math.sin(t * 6) > 0 ? 1 : 0.2) * r * 0.6; g.beginPath(); g.arc(c.x, c.y, r * 0.15, 0, TAU); g.fill(); g.shadowBlur = 0;
    g.save(); g.beginPath(); g.rect(0, 0, 0, 0); g.clip();   // balance the restore the caller makes
    return;
  }
  if (hd === "shark") {
    g.fillStyle = "#7d8ea3"; g.fillRect(cx - r, cy - r, r * 2, r * 2);
    pts = patch([[-0.95, -0.15], [-0.6, -0.05], [0, 0.02], [0.6, -0.05], [0.95, -0.15], [0.9, -0.55], [0.4, -0.8], [-0.4, -0.8], [-0.9, -0.55]]);
    poly(g, pts); g.fillStyle = "#eef2fa"; g.fill();
    pts = patch([[-0.55, -0.42], [0, -0.38], [0.55, -0.42], [0.45, -0.52], [0, -0.48], [-0.45, -0.52]]); poly(g, pts); g.fillStyle = "#b3202e"; g.fill();
    g.fillStyle = "#fff"; for (i = -2; i <= 2; i++) { p = sp(i * 0.2, -0.4, 1.02); if (vis(p) > 0.1) { g.beginPath(); g.moveTo(p.x - r * 0.05, p.y - r * 0.02); g.lineTo(p.x + r * 0.05, p.y - r * 0.02); g.lineTo(p.x, p.y + r * 0.07); g.fill(); } }
    for (k = -1; k <= 1; k += 2) { p = sp(k * 0.85, 0.12, 1.01); v = vis(p); if (v > 0) { g.fillStyle = "#0c1020"; g.beginPath(); g.ellipse(p.x, p.y, r * 0.11 * v + 0.4, r * 0.12, 0, 0, TAU); g.fill(); } }
    g.restore(); pts = [lp(0.05, 0, 0.96), lp(-0.6, 0, 0.8), lp(-0.5, 0, 1.95)]; poly(g, pts); g.lineWidth = Math.max(2, r * 0.14); g.strokeStyle = OUT; g.stroke(); g.lineWidth = Math.max(1, r * 0.1); g.strokeStyle = "#6b7c91"; g.stroke(); g.fillStyle = "#6b7c91"; g.fill();
    g.save(); g.beginPath(); g.rect(0, 0, 0, 0); g.clip(); return;
  }
  if (hd === "void") { g.fillStyle = "#07040d"; g.fillRect(cx - r, cy - r, r * 2, r * 2); g.strokeStyle = "rgba(138,61,255,.5)"; g.lineWidth = r * 0.12; g.beginPath(); g.arc(cx, cy, r * (0.92 + 0.04 * Math.sin(t * 3)), 0, TAU); g.stroke(); glowEyes("#c9a6ff", 0.16, 0.09, 0.36); return; }
  if (hd === "fire") { glowEyes("#ffe66b", 0.13, 0.13, 0.36); g.restore(); for (i = 0; i < 9; i++) { p = sp(i * TAU / 9 + t * 0.4, 0.7, 1.0); v = vis(p); if (v < -0.4) continue; g.fillStyle = i & 1 ? "#ffd23b" : "#ff5a1f"; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(p.x - r * 0.2, p.y + r * 0.1); g.quadraticCurveTo(p.x - r * 0.1, p.y - r * 0.6, p.x + Math.sin(t * 8 + i) * r * 0.2, p.y - r * (1.1 + 0.4 * Math.sin(t * 11 + i))); g.quadraticCurveTo(p.x + r * 0.2, p.y - r * 0.4, p.x + r * 0.2, p.y + r * 0.1); g.fill(); } g.globalAlpha = 1; g.save(); g.beginPath(); g.rect(0, 0, 0, 0); g.clip(); return; }
  if (hd === "zeus") {
    glowEyes("#38e1ff", 0.11, 0.11, 0.36);
    poly(g, patch([[-0.9, -0.1], [-0.5, -0.3], [0, -0.32], [0.5, -0.3], [0.9, -0.1], [0.8, -0.7], [0.3, -0.98], [-0.3, -0.98], [-0.8, -0.7]])); g.fillStyle = "#f4f6ff"; g.fill();
  }
  function onR(p){ var dx = p.x - cx, dy = p.y - cy, l = hyp(dx, dy) || 1; return {x: cx + dx / l * r, y: cy + dy / l * r}; }
}

// ---- boots: a solid shoe seen from wherever the camera is ----
// profile of the shoe from heel to toe: [forward, up, half width], measured from the ankle
var SHOE = [[-0.055, -0.05, 0.033], [-0.068, -0.02, 0.035], [-0.063, 0.026, 0.037], [-0.015, 0.032, 0.039], [0.035, 0.018, 0.042], [0.085, 0.0, 0.043], [0.135, -0.017, 0.039], [0.175, -0.027, 0.032], [0.2, -0.037, 0.024], [0.207, -0.045, 0.02], [0.19, -0.052, 0.027], [0.07, -0.054, 0.04]];
function boot2(g, P, L, k, sd, t){
  var a = L.a, c = sd.bootc || [sd.boot, "#e9ebf5", "#e9ebf5"], kind = sd.bootk || 0, rr = sd.bootr || 0, pts = [], sole = [], i, w, ctr, side, vs, deco, gl = rr >= 4 && sd.bootg;
  function bp(f, u, ww){ return P(a[0] + f, a[1] + ww, a[2] + u); }
  for (i = 0; i < SHOE.length; i++) for (w = -1; w <= 1; w += 2) pts.push(bp(SHOE[i][0], SHOE[i][1], w * SHOE[i][2]));
  for (i = 0; i < SHOE.length; i++) if (SHOE[i][1] < -0.04 || i === 8) for (w = -1; w <= 1; w += 2) { sole.push(bp(SHOE[i][0], SHOE[i][1] - 0.004, w * (SHOE[i][2] + 0.003))); sole.push(bp(SHOE[i][0], -0.033, w * (SHOE[i][2] + 0.003))); }
  ctr = bp(0.06, 0, 0);
  if (gl) { g.save(); g.shadowColor = sd.bootg; g.shadowBlur = Math.max(4, ctr.s * (0.1 + 0.06 * Math.sin(t * 4))); }
  poly(g, hull(pts)); g.lineWidth = 2; g.strokeStyle = OUT; g.stroke(); g.fillStyle = c[0]; g.fill();
  if (gl) g.restore();
  g.save(); poly(g, hull(pts)); g.clip();
  // a sheen sweeping along the rarer boots
  if (rr >= 4) { i = hull(pts); w = ((t * 0.7) % 1.6) - 0.3; var gr = g.createLinearGradient(bp(-0.07, 0, 0).x, 0, bp(0.2, 0, 0).x, 0); gr.addColorStop(clamp(w, 0, 1), "rgba(255,255,255,0)"); gr.addColorStop(clamp(w + 0.08, 0, 1), "rgba(255,255,255,.45)"); gr.addColorStop(clamp(w + 0.16, 0, 1), "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(ctr.x - ctr.s, ctr.y - ctr.s, ctr.s * 2, ctr.s * 2); }
  // the upper of the rarer boots carries a print of its own
  if (rr >= 3) {
    var bx = bp(-0.07, 0.03, 0), ex = bp(0.21, -0.05, 0), bw = ex.x - bx.x, bh = ex.y - bx.y, j;
    g.globalAlpha = 0.5; g.strokeStyle = c[1]; g.lineWidth = Math.max(1, ctr.s * 0.006);
    if (rr <= 4) for (j = -6; j < 14; j++) { g.beginPath(); g.moveTo(bx.x + j * bw / 10, bx.y); g.lineTo(bx.x + j * bw / 10 + bh * 0.8, ex.y); g.stroke(); }
    else if (rr === 5) seeded(18, 7).forEach(function(q){ g.fillStyle = q[2] > 0.5 ? "#fff" : c[1]; g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + q[3] * 9)); R.star(g, bx.x + q[0] * bw, bx.y + q[1] * bh, ctr.s * (0.006 + q[2] * 0.008), 4, t); g.fill(); });
    else if (rr === 6) { for (j = 0; j < 5; j++) { var fx0 = bx.x + bw * (0.1 + j * 0.12), fl = Math.sin(t * 9 + j * 2); g.globalAlpha = 0.75; g.fillStyle = j & 1 ? "#ffd23b" : c[1]; g.beginPath(); g.moveTo(fx0, ex.y); g.quadraticCurveTo(fx0 + bw * 0.02, ex.y - bh * (0.5 + 0.1 * fl), fx0 + bw * (0.1 + 0.02 * fl), ex.y - bh * (0.85 + 0.1 * fl)); g.quadraticCurveTo(fx0 + bw * 0.08, ex.y - bh * 0.4, fx0 + bw * 0.12, ex.y); g.fill(); } }
    else { var gr2 = g.createLinearGradient(bx.x, bx.y, ex.x, ex.y); gr2.addColorStop(0, "#0a1238"); gr2.addColorStop(1, "#3d1f8a"); g.globalAlpha = 0.6; g.fillStyle = gr2; g.fillRect(bx.x, bx.y, bw, bh); seeded(24, 11).forEach(function(q){ g.fillStyle = "#fff"; g.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + q[3] * 9)); g.fillRect(bx.x + q[0] * bw, bx.y + q[1] * bh, 1.4, 1.4); }); }
    g.globalAlpha = 1;
  }
  poly(g, hull(sole)); g.fillStyle = rr >= 5 ? c[1] : kind === 2 ? c[1] : c[2]; if (rr >= 5) { g.shadowColor = c[1]; g.shadowBlur = ctr.s * 0.08; } g.fill(); g.shadowBlur = 0;
  // studs along the bottom edge
  g.fillStyle = "#17171c"; for (i = 0; i < 4; i++) { w = bp(-0.04 + i * 0.065, -0.062, 0); g.fillRect(w.x - ctr.s * 0.008, w.y - ctr.s * 0.004, ctr.s * 0.016, ctr.s * 0.014); }
  // each side of the shoe carries the decal, seen only when that side faces the camera
  for (side = -1; side <= 1; side += 2) {
    vs = (ctr.d - bp(0.06, 0, side * 0.045).d) / 0.045; if (vs <= 0.02) continue;
    g.globalAlpha = clamp(vs * 3, 0, 1);
    deco = function(list, col, glow){ var q = list.map(function(e){ var j, ww = 0.04; for (j = 0; j < SHOE.length - 1; j++) if (e[0] >= SHOE[j][0] && e[0] <= SHOE[j + 1][0]) ww = SHOE[j][2]; return bp(e[0], e[1], side * (ww + 0.002)); }); poly(g, q); g.fillStyle = col; if (glow) { g.shadowColor = glow; g.shadowBlur = ctr.s * 0.06; } g.fill(); g.shadowBlur = 0; };
    deco([[-0.066, -0.038], [-0.022, -0.038], [-0.022, 0.022], [-0.06, 0.024]], c[1]);   // heel counter
    if (kind === 1 || kind === 3) deco([[-0.015, -0.03], [0.11, -0.014], [0.15, -0.026], [0.12, -0.032], [0.0, -0.042]], kind === 3 ? c[1] : c[2] === "#e9ebf5" ? c[1] : c[2], kind === 3 ? c[1] : "");
    if (kind === 2) for (i = 0; i < 3; i++) deco([[0.0 + i * 0.03, -0.042], [0.022 + i * 0.03, -0.015], [0.0 + i * 0.03, 0.012], [0.012 + i * 0.03, 0.012], [0.034 + i * 0.03, -0.015], [0.012 + i * 0.03, -0.042]], c[1]);
    if (kind === 0) deco([[0.12, -0.034], [0.19, -0.042], [0.185, -0.032], [0.12, -0.02]], c[1]);
    if (rr >= 6) { deco([[0.02, 0.02], [0.06, -0.01], [0.04, -0.01], [0.08, -0.042], [0.03, -0.016], [0.05, -0.016]], "#ffffff", c[1]); }
    if (rr >= 7) { w = bp(-0.07, 0.04, side * 0.05); g.fillStyle = "#fff6d6"; g.shadowColor = "#ffe9a8"; g.shadowBlur = ctr.s * 0.08; for (i = 0; i < 4; i++) { g.beginPath(); g.ellipse(w.x - ctr.s * (0.012 + i * 0.012), w.y - ctr.s * (0.01 + i * 0.012), ctr.s * (0.04 - i * 0.005), ctr.s * 0.01, -0.7, 0, TAU); g.fill(); } g.shadowBlur = 0; }
    g.globalAlpha = 1;
  }
  // laces across the top of the foot
  g.strokeStyle = kind === 3 ? c[1] : "rgba(255,255,255,.85)"; g.lineWidth = Math.max(1, ctr.s * 0.008);
  for (i = 0; i < 3; i++) { w = 0.0 + i * 0.035; var l0 = bp(w, 0.033 - i * 0.012, -0.024), l1 = bp(w, 0.033 - i * 0.012, 0.024); g.beginPath(); g.moveTo(l0.x, l0.y); g.lineTo(l1.x, l1.y); g.stroke(); }
  g.restore();
  if (rr >= 5) { w = bp(0.17 + 0.02 * Math.sin(t * 3), 0.02 + 0.03 * Math.sin(t * 5), 0); g.fillStyle = "#fff"; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 7); R.star(g, w.x, w.y, Math.max(1.5, ctr.s * 0.025), 4, t); g.fill(); g.globalAlpha = 1; }
}
R.boot2 = boot2;

// ---- the whole figure ----
R.fig2 = function(g, prj, x, y, z0, fa, q, sd, tcx, tcy, t){
  var fx = Math.cos(fa), fy = Math.sin(fa), rx = -fy, ry = fx, c = fx * tcx + fy * tcy, sg = fx * tcy - fy * tcx, ac = Math.abs(c),
    Lg = [R.legJ(-1, q.aL, q.bL, q.sL), R.legJ(1, q.aR, q.bR, q.sR)], Ar = [R.armJ(-1, q.uL, q.eL, q.oL), R.armJ(1, q.uR, q.eR, q.oR)],
    hip = Math.max(0.16, -Math.min(Lg[0][5], Lg[1][5])) + 0.05 + q.z + z0, cl = Math.cos(q.roll), tf = Math.sin(q.lean) * cl, tr = Math.sin(q.roll), tu = Math.cos(q.lean) * cl,
    nf = tf * 0.5, nr = tr * 0.5, nu = hip + tu * 0.5, sh = nu - 0.04, col = sd.col, sk = sd.skin, ph = Math.atan2(sg, c), off = ph / TAU * 80, s, H3, HD, NK, HC, J = [], Jo = [], parts, i, k, F, cloth = sd.hd ? null : clothOf(sd), top = sd.tier >= 5 && !sd.hd ? sd : null, pipe = top ? sd.fc : "";
  function P(f, r, u){ return prj(x + fx * f + rx * r, y + fy * f + ry * r, u); }
  function pj(v){ return P(v[0], v[1], v[2]); }
  function at(a, b, u){ return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
  // a stripe down the outer side of a limb, and how squarely that side faces the camera
  function side(a, b, k, rad){ var p0 = P(a[0], a[1] + k * rad, a[2]), p1 = P(b[0], b[1] + k * rad, b[2]), m = pj(at(a, b, 0.5)), v = (m.d - P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + k * rad, (a[2] + b[2]) / 2).d) / rad; return [p0, p1, v]; }
  HC = P(0, 0, hip); s = HC.s; NK = P(nf, nr, nu);
  H3 = [nf + tf * 0.22 + 0.05 * q.nod, nr + tr * 0.22, nu + tu * 0.22 - 0.03 * q.nod]; HD = pj(H3);
  F = {P: P, s: s, t: t, sd: sd, NK: NK, nod: q.nod};
  for (i = 0; i < 2; i++) {
    k = i ? 1 : -1; var a = Lg[i], b = Ar[i];
    J.push({k: k, h: [0, k * 0.115, hip], n: [a[0], a[1], hip + a[2]], a: [a[3], a[4], hip + a[5]], s: [nf, nr + k * 0.215, sh], e: [nf + b[0], nr + b[1] - k * 0.035, sh + b[2]], w: [nf + b[3], nr + b[4] - k * 0.035, sh + b[5]]});
    Jo.push({h: pj(J[i].h), k: pj(J[i].n), f: pj(J[i].a), t: P(a[3] + 0.19, a[4], hip + a[5] + 0.015), s: pj(J[i].s), e: pj(J[i].e), w: pj(J[i].w)});
  }
  parts = [[Jo[0].k.d, 0], [Jo[1].k.d, 1]].sort(function(m, n){ return n[0] - m[0]; }).concat([[Jo[0].e.d, 2], [Jo[1].e.d, 3], [(HC.d + NK.d) / 2, 4], [HD.d - 0.03, 5]].sort(function(m, n){ return n[0] - m[0]; }));
  if (sd.glow) { g.shadowColor = sd.glow; g.shadowBlur = s * 0.07; }
  if (sd.hd) R.hbody(g, P, Jo, NK, sh, hip, s, sd.hd, c, t, 0);
  if (R.flair && sd.tier >= 5) R.flair(g, P, Jo, HD, hip, s, sd, c, sg, t, 0);
  extras(0);
  var behind = [0, 1].filter(function(i){ return Jo[i].e.d > (HC.d + NK.d) / 2 + 0.05 && Jo[i].w.d > HC.d; });
  behind.forEach(function(i){ arm(J[i]); });
  for (i = 0; i < 6; i++) {
    k = parts[i][1];
    if (k >= 2 && k < 4 && behind.indexOf(k - 2) >= 0) continue;
    if (k < 2) leg(J[k]);
    else if (k < 4) arm(J[k - 2]);
    else if (k === 4) torso();
    else { g.shadowBlur = 0; solid(g, NK, P(lerp(nf, H3[0], 0.6), lerp(nr, H3[1], 0.6), lerp(nu, H3[2], 0.6)), 0.046 * s, 0.042 * s, sk); head2(g, F, H3, HD, 1); if (sd.hd) R.hbody(g, P, Jo, NK, sh, hip, s, sd.hd, c, t, 1); }
    if (i === 1) { var sb = g.shadowBlur; g.shadowBlur = 0; head2(g, F, H3, HD, 0); g.shadowBlur = sb; }
  }
  g.shadowBlur = 0;
  if (R.flair && sd.tier >= 5) R.flair(g, P, Jo, HD, hip, s, sd, c, sg, t, 1);
  extras(1);

  function leg(L){
    var h = pj(L.h), n = pj(L.n), an = pj(L.a), cf = at(L.n, L.a, 0.3), so = at(L.n, L.a, 0.26), sm = at(L.h, L.n, 0.55), st;
    skin(g, [[h, n, 0.066 * s, 0.05 * s], [n, pj(cf), 0.05 * s, 0.053 * s], [pj(cf), an, 0.053 * s, 0.033 * s]], sk);
    if (!sd.hd) { st = side(so, L.a, L.k, 0.05); garment(g, pj(so), an, 0.056 * s, 0.037 * s, {c: col[1], pat: sd.full ? cloth : null, off: off, bands: [[0.07, 0.08, col[0]], [0.19, 0.05, col[0]]], st: top ? [st[0], st[1], pipe, clamp(st[2] * 2, 0, 1)] : null, glow: pipe, mat: top, t: t}); }
    boot2(g, P, L, L.k, sd, t);
    st = side(L.h, sm, L.k, 0.08);
    garment(g, h, pj(sm), 0.086 * s, 0.072 * s, {c: col[2], pat: sd.full ? cloth : null, off: off + 20, bands: [[0.94, 0.1, col[1]]], st: [st[0], st[1], top ? pipe : col[1], clamp(st[2] * 2.5, 0, 1)], glow: pipe, mat: top, t: t});
  }
  function arm(A){
    var sp = pj(A.s), e = pj(A.e), w = pj(A.w), d = [A.w[0] - A.e[0], A.w[1] - A.e[1], A.w[2] - A.e[2]], dl = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) || 1, sl = at(A.s, A.e, 0.56), st, hc;
    d = [d[0] / dl, d[1] / dl, d[2] / dl];
    var palm = [A.w[0] + d[0] * 0.075, A.w[1] + d[1] * 0.075, A.w[2] + d[2] * 0.075], th0 = [A.w[0] + d[0] * 0.02 + 0.022, A.w[1] + d[1] * 0.02 - A.k * 0.008, A.w[2] + d[2] * 0.02], th1 = [A.w[0] + d[0] * 0.055 + 0.03, A.w[1] + d[1] * 0.055 - A.k * 0.012, A.w[2] + d[2] * 0.055];
    hc = sd.gloves ? "#f2f4ff" : sk;
    if (sd.gloves) { skin(g, [[sp, e, 0.045 * s, 0.038 * s], [e, w, 0.037 * s, 0.028 * s]], sk); garment(g, w, pj(palm), 0.042 * s, 0.04 * s, {c: hc, bands: [[0.15, 0.3, col[0]]]}); }
    else skin(g, [[sp, e, 0.045 * s, 0.038 * s], [e, w, 0.037 * s, 0.028 * s], [w, pj(palm), 0.03 * s, 0.027 * s], [pj(th0), pj(th1), 0.013 * s, 0.011 * s]], sk);
    if (!sd.hd && sd.ls) { st = side(A.e, A.w, A.k, 0.04); garment(g, e, w, 0.048 * s, 0.037 * s, {c: col[0], pat: cloth, off: off + A.k * 20, bands: [[0.9, 0.14, col[1]]], st: top ? [st[0], st[1], pipe, clamp(st[2] * 2, 0, 1)] : null, glow: pipe, mat: top, t: t}); sl = A.e; }
    if (!sd.hd) { st = side(A.s, sl, A.k, 0.06); garment(g, sp, pj(sl), 0.064 * s, sd.ls ? 0.05 * s : 0.054 * s, {c: col[0], pat: cloth, off: off + A.k * 20, bands: sd.ls ? null : [[0.9, 0.16, col[1]]], st: top ? [st[0], st[1], pipe, clamp(st[2] * 2, 0, 1)] : null, glow: pipe, mat: top, t: t}); }
  }
  function torso(){
    var a = Jo[0].h, b = Jo[1].h;
    garment(g, a, b, 0.092 * s, 0.092 * s, {c: col[2], pat: sd.full ? cloth : null, off: off, mat: top, t: t});
    R.torso(g, NK, P(0, 0, hip - 0.05), s * lerp(0.14, 0.225, ac), s * lerp(0.125, 0.18, ac), sd, ph, t);
  }
  // wings, a crown, crystal shards and a constellation for the top rarities. phase 0 is behind the body, 1 in front
  function extras(phase){
    var i, j, u, a, p, pts, sdv;
    if (sd.wings) [-1, 1].forEach(function(k){
      var base = [-0.12, k * 0.07, sh - 0.03], flap = 0.12 * Math.sin(t * 2.2), fe = [], dsum = 0, i, ang, ln, tip, m1, m2, gr;
      var wc = sd.fc && sd.fc.length === 7 ? sd.fc : "#ffe9a8", tips = [];
      for (i = 0; i < 8; i++) { ang = 0.05 + i * 0.22 + flap * (1 - i / 10); ln = 1.05 - i * 0.075; tip = [-0.32 - i * 0.025, k * (0.1 + Math.cos(ang) * ln), sh + 0.05 + Math.sin(ang) * ln * 0.85 - i * 0.05]; m1 = at(base, tip, 0.6); m2 = m1.slice(); m1[2] += 0.11; m2[2] -= 0.09; m1[0] -= 0.04; fe.push([pj(base), pj(m1), pj(tip), pj(m2)]); tips.push(pj(tip)); dsum += pj(tip).d; }
      if ((dsum / 8 > HC.d) !== !phase) return;
      g.save(); g.shadowColor = wc; g.shadowBlur = s * 0.18;
      poly(g, [pj(base)].concat(tips)); gr = g.createRadialGradient(fe[0][0].x, fe[0][0].y, 0, fe[0][0].x, fe[0][0].y, s * 1.1); gr.addColorStop(0, hexA(wc, 0.7)); gr.addColorStop(1, hexA(wc, 0.12)); g.fillStyle = gr; g.fill();
      fe.slice().reverse().forEach(function(q, i){ gr = g.createLinearGradient(q[0].x, q[0].y, q[2].x, q[2].y); gr.addColorStop(0, hexA(wc, 0.95)); gr.addColorStop(0.7, "rgba(255,255,255,.75)"); gr.addColorStop(1, "rgba(255,255,255," + (0.35 + 0.2 * Math.sin(t * 3 + i)) + ")"); g.fillStyle = gr; g.beginPath(); g.moveTo(q[0].x, q[0].y); g.quadraticCurveTo(q[1].x, q[1].y, q[2].x, q[2].y); g.quadraticCurveTo(q[3].x, q[3].y, q[0].x, q[0].y); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1; g.stroke(); });
      g.restore();
    });
    if (sd.crown && phase) {
      pts = []; for (i = 0; i < 10; i++) { a = i / 10 * TAU + t * 0.4; pts.push([pj([H3[0] + Math.cos(a) * 0.15, H3[1] + Math.sin(a) * 0.15, H3[2] + 0.24]), pj([H3[0] + Math.cos(a) * 0.17, H3[1] + Math.sin(a) * 0.17, H3[2] + 0.24 + (i & 1 ? 0.06 : 0.12)])]); }
      g.save(); g.shadowColor = "#ffd23b"; g.shadowBlur = s * 0.12; g.strokeStyle = "#ffd766"; g.lineWidth = Math.max(1.5, s * 0.02);
      g.beginPath(); pts.forEach(function(q, i){ if (i) g.lineTo(q[0].x, q[0].y); else g.moveTo(q[0].x, q[0].y); }); g.closePath(); g.stroke();
      pts.forEach(function(q, i){ g.beginPath(); g.moveTo(q[0].x, q[0].y); g.lineTo(q[1].x, q[1].y); g.stroke(); if (!(i & 1)) { g.fillStyle = ["#ff4f7a", "#5ee6ff", "#5ee6a8"][i % 3]; g.beginPath(); g.arc(q[1].x, q[1].y, Math.max(1.5, s * 0.014), 0, TAU); g.fill(); } });
      g.restore();
    }
    if (sd.tier >= 6 && !sd.hd) for (i = 0; i < 3; i++) {
      a = t * 1.1 + i * TAU / 3; p = [Math.cos(a) * 0.62, Math.sin(a) * 0.62, hip + 0.55 + 0.12 * Math.sin(t * 2 + i)];
      sdv = pj(p); if ((sdv.d > HC.d) !== !phase) continue;
      pts = [pj([p[0], p[1], p[2] + 0.09]), pj([p[0] + Math.cos(a + t) * 0.04, p[1] + Math.sin(a + t) * 0.04, p[2]]), pj([p[0], p[1], p[2] - 0.09]), pj([p[0] - Math.cos(a + t) * 0.04, p[1] - Math.sin(a + t) * 0.04, p[2]])];
      g.save(); g.shadowColor = sd.fc || "#5ee6ff"; g.shadowBlur = s * 0.12; poly(g, pts); g.fillStyle = hexA(sd.fc && sd.fc.length === 7 ? sd.fc : "#5ee6ff", 0.75); g.fill(); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1; g.stroke(); g.restore();
    }
    if (sd.cons && phase) {
      g.save(); g.strokeStyle = "rgba(255,255,255," + (0.35 + 0.15 * Math.sin(t * 2)) + ")"; g.lineWidth = 1; g.shadowColor = sd.fc || "#5ee6ff"; g.shadowBlur = s * 0.08;
      [[Jo[0].s, Jo[0].e, Jo[0].w], [Jo[1].s, Jo[1].e, Jo[1].w], [Jo[0].h, Jo[0].k, Jo[0].f], [Jo[1].h, Jo[1].k, Jo[1].f], [NK, HC], [Jo[0].s, NK, Jo[1].s]].forEach(function(l){ g.beginPath(); l.forEach(function(p, i){ if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke(); l.forEach(function(p, i){ g.fillStyle = "#fff"; R.star(g, p.x, p.y, Math.max(1.5, s * (0.022 + 0.01 * Math.sin(t * 4 + i))), 4, t); g.fill(); }); });
      g.restore();
    }
  }
};

// ---- a boot on its own, side on, for the shop and locker ----
R.bootPreview = function(cv, it, t){
  var g = cv.getContext("2d"), w = cv.width, h = cv.height, S = w * 2.6, sd = {bootc: it.c, bootk: it.k, bootr: it.r, bootg: it.g || "", boot: it.c[0]}, fa = 0.35 + 0.25 * Math.sin(t * 0.8);
  function prj(x, y, z){ var cx = Math.cos(fa), sn = Math.sin(fa), u = x * cx - y * sn, v = x * sn + y * cx; return {x: w * 0.5 + (u - 0.065) * S, y: h * 0.62 - z * S + v * S * 0.25, s: S, d: 10 + v}; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.lineCap = g.lineJoin = "round";
  g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(w / 2, h * 0.62 + 0.06 * S, w * 0.34, h * 0.06, 0, 0, TAU); g.fill();
  boot2(g, prj, {a: [0, 0, 0.06]}, 1, sd, t);
};
// a hair style on its own, on a plain head
R.hairPreview = function(cv, it, t, look){
  R.portrait(cv, {kit: "home", hair: it.id, look: look || {skin: 1, hair: 0, hc: 0, num: 10}}, t, {bust: 1, turn: 0.5 * Math.sin(t * 0.7)});
};

// ---- how players move: a walk that rolls through the foot, a run with knee drive, heel kick and arm drive,
// leaning into turns, and small steps on the spot when turning while standing ----
R.gait = function(q, p, sp, t){
  var dt = t - (p._gt == null ? t : p._gt), turn, k, run, ph, i, side, f, s, c, hipA, knee, w, amp;
  if (!(dt > 0 && dt < 0.25)) dt = 0;
  turn = dt ? wrapTh(p.fa - (p._gf == null ? p.fa : p._gf)) / dt : 0; p._gt = t; p._gf = p.fa;
  p._gw = lerp(p._gw || 0, clamp(turn, -12, 12), dt ? Math.min(1, dt * 10) : 0); turn = p._gw;
  k = clamp((sp - 0.3) / 7, 0, 1); run = clamp((sp - 3) / 3.2, 0, 1);
  // cadence rises with speed: about one step a second walking, nearly two flat out
  p._gp = (p._gp || p.i * 1.7 || 0) + dt * (sp > 0.5 ? 4.6 + 1.0 * sp : Math.abs(turn) > 1.2 ? 9 : 0);
  ph = p._gp;
  if (sp <= 0.5) {
    w = Math.sin(t * 2.2 + p.i * 2); q.lean = 0.05 + 0.014 * w; q.eL = q.eR = 0.32 + 0.04 * w; q.roll = 0.03 * Math.sin(t * 1.1 + p.i);
    q.bL = q.bR = 0.14; q.sL = q.sR = 0.075;
    if (Math.abs(turn) > 1.2) {   // turning on the spot: lift one foot then the other
      s = Math.sin(ph); q.aL = 0.18 * Math.max(0, s); q.bL = 0.14 + 0.45 * Math.max(0, s); q.aR = 0.18 * Math.max(0, -s); q.bR = 0.14 + 0.45 * Math.max(0, -s);
      q.sL = q.sR = 0.1;
    }
    return;
  }
  amp = lerp(0.34, 0.62, run) * (0.55 + 0.45 * k);
  for (i = 0; i < 2; i++) {
    f = ph + i * PI; s = Math.sin(f); c = Math.cos(f);
    // the thigh swings forward and back, further forward than back when running
    hipA = amp * s + lerp(0.02, 0.16, run) + (s > 0 ? run * 0.12 * s : 0);
    // the knee bends most while the leg swings through, kicking the heel up when running; a little on landing
    knee = lerp(0.1, 0.2, run) + lerp(0.62, 1.75, run) * Math.pow(Math.max(0, Math.cos(f - 0.55)), 2) * (0.5 + 0.5 * k) + 0.12 * Math.max(0, Math.sin(f - PI * 0.85)) * (1 - run);
    if (i) { q.aR = hipA; q.bR = knee; } else { q.aL = hipA; q.bL = knee; }
  }
  // arms swing against the legs, elbows bend more the faster you go
  s = Math.sin(ph); w = lerp(0.24, 0.95, run) * (0.5 + 0.5 * k);
  q.uL = -w * s + 0.08 * run; q.uR = w * s + 0.08 * run; q.eL = lerp(0.3, 1.25, run) + lerp(0.1, 0.45, run) * Math.max(0, -s); q.eR = lerp(0.3, 1.25, run) + lerp(0.1, 0.45, run) * Math.max(0, s);
  q.oL = q.oR = lerp(0.12, 0.22, run);
  q.sL = q.sR = 0.05;
  // lean forward with speed, bounce at each stride, lean into the turn and splay the feet a touch
  q.lean = lerp(0.06, 0.24, run) + 0.04 * k;
  q.z = run * 0.035 * Math.max(0, Math.cos(2 * ph));
  q.roll = clamp(turn * (0.025 + 0.035 * k), -0.38, 0.38) + 0.03 * Math.sin(ph) * (1 - run);
  if (Math.abs(turn) > 2) { q.sL += 0.06; q.sR += 0.06; }
  q.nod = 0.05 * run;
};
})();
