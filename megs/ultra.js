// MEGS Ultra skins: the rarest skins in the game. They are never listed in the shop, the pass or the locker until
// you own one, and they only come out of a Galaxy Pack, very rarely. Pulling one stops the pack opening for a
// reveal of its own.
(function(){
"use strict";
var MG = window.MG, R = MG.R, I = MG.ITEMS, BY = MG.ITEM, PI = Math.PI, TAU = PI * 2;
MG.ULTRA = 8; MG.ULTRA_CHANCE = 0.02;
MG.RAR[8] = {n: "Ultra", c: "#ff5ef0"};
function add(id, n, o){ o.t = "kit"; o.id = id; o.n = n; o.r = 8; o.src = "vault"; o.ux = 1; o.full = 1; I.push(o); BY[id] = o; }
// each one has its own head, not just its own colours
add("ux_prism", "Prism Titan", {p: "prism", c: ["#ffffff", "#ff4f7a", "#22243f"], hair: "afro", hfx: "rainbow", eyes: "#ffffff", gl: "#ff7ab8", f: "star", wings: 1, crown: 1});
add("ux_storm", "Storm Sovereign", {p: "gold", c: ["#fff3b0", "#ffd23b", "#3d2c05"], hd: "zeus", gl: "#ffd766", f: "corona", wings: 1, crown: 1});
add("ux_mech", "Neon Mech", {p: "circuit", c: ["#0c1020", "#38e1ff", "#ff2fb3"], hd: "robot", gl: "#38e1ff", eyes: "#38e1ff", f: "bolt"});
add("ux_inferno", "Inferno Titan", {p: "flames", c: ["#2a0805", "#ffd23b", "#1a0603"], hd: "fire", gl: "#ff8a1f", f: "ember", wings: 1});
add("ux_abyss", "Abyss Hunter", {p: "wave", c: ["#06243a", "#38e1ff", "#021018"], hd: "shark", gl: "#38e1ff", eyes: "#9ff6ff", f: "frost"});
MG.ultraList = function(){ return I.filter(function(it){ return it.ux; }); };

// a Galaxy pull has a small chance of one (only packs of everything or of kits)
var roll0 = MG.roll;
MG.roll = function(pk, force, kind){
  if (pk && pk.id === "galaxy" && (!kind || kind === "kit") && Math.random() < MG.ULTRA_CHANCE) { var u = MG.ultraList(); return u[Math.floor(Math.random() * u.length)]; }
  return roll0.apply(this, arguments);
};

// prism shards orbiting the body and a rainbow ring at the feet, on top of the Celestial halo and wings
var fl0 = R.flair;
R.flair = function(g, P, J, HD, hip, s, sd, c, sg, t, phase){
  fl0.apply(this, arguments);
  if ((sd.tier || 0) < 8) return;
  var ctr = P(0, 0, hip + 0.3), i, a, p, r = Math.max(3, s * 0.085), k, q;
  g.save(); g.lineJoin = "round";
  if (!phase) for (i = 0; i < 36; i++) {
    a = i * TAU / 36; p = P(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.01); q = P(Math.cos(a + TAU / 36) * 0.55, Math.sin(a + TAU / 36) * 0.55, 0.01);
    g.strokeStyle = "hsl(" + ((i * 10 + t * 90) % 360) + ",100%,62%)"; g.globalAlpha = 0.7; g.lineWidth = Math.max(2, s * 0.045); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke();
  }
  for (i = 0; i < 6; i++) {
    a = t * 1.1 + i * TAU / 6; p = P(Math.cos(a) * 0.66, Math.sin(a) * 0.66, hip + 0.55 + 0.2 * Math.sin(t * 2 + i));
    if ((p.d < ctr.d) !== !!phase) continue;
    k = r * (0.8 + 0.25 * Math.sin(t * 4 + i));
    g.globalAlpha = 0.95; g.fillStyle = "hsl(" + ((t * 80 + i * 60) % 360) + ",100%,66%)"; g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = Math.max(1, s * 0.018);
    g.beginPath(); g.moveTo(p.x, p.y - k * 1.5); g.lineTo(p.x + k * 0.8, p.y); g.lineTo(p.x, p.y + k * 1.5); g.lineTo(p.x - k * 0.8, p.y); g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
};

// ---- the reveal: the pack opening stops, the screen goes dark, light breaks through, and the skin appears ----
MG.ultraReveal = function(it, done){
  var ov = document.createElement("div"), cv = document.createElement("canvas"), fig = document.createElement("canvas"), t0 = performance.now(), shown = false, dpr = Math.min(1.5, window.devicePixelRatio || 1), raf;
  ov.id = "uxr"; fig.width = 420; fig.height = 560;
  ov.innerHTML = '<div class="uxt"><span class="uxk">Ultra rare</span><h2></h2><button class="btn gold big" disabled>Claim</button></div>';
  ov.querySelector("h2").textContent = it.n;
  ov.insertBefore(cv, ov.firstChild); document.body.appendChild(ov);
  var btn = ov.querySelector("button");
  btn.onclick = function(){ cancelAnimationFrame(raf); ov.remove(); done && done(); };
  function frame(now){
    raf = requestAnimationFrame(frame);
    var t = (now - t0) / 1000, w = window.innerWidth, h = window.innerHeight, g = cv.getContext("2d"), cx = w / 2, cy = h * 0.46, i, a, e, R0 = Math.hypot(w, h);
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 1: the screen goes dark and a light shakes and cracks
    g.fillStyle = "rgba(4,3,12," + Math.min(1, t * 1.6) + ")"; g.fillRect(0, 0, w, h);
    if (t < 1.4) {
      e = t / 1.4; var sh = e * 10 * Math.sin(t * 60);
      g.save(); g.translate(cx + sh, cy);
      g.fillStyle = "#14102e"; g.strokeStyle = "hsl(" + (t * 300 % 360) + ",100%,65%)"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -90); g.lineTo(70, 0); g.lineTo(0, 90); g.lineTo(-70, 0); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = "rgba(255,255,255,.85)"; g.font = "900 64px " + R.FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 0, 4);
      g.strokeStyle = "rgba(255,255,255," + e + ")"; g.lineWidth = 2;
      for (i = 0; i < 9; i++) { a = i * 2.39; var l = 30 + e * 220 * ((i * 37 % 10) / 10 + 0.4); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * l * 0.5 + Math.sin(i) * 12, Math.sin(a) * l * 0.5); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke(); }
      g.restore();
    }
    // 2: a white flash and rainbow beams turning behind
    if (t >= 1.4) {
      e = Math.min(1, (t - 1.4) / 0.5);
      g.save(); g.translate(cx, cy); g.rotate(t * 0.35);
      for (i = 0; i < 16; i++) { g.fillStyle = "hsla(" + ((i * 22.5 + t * 60) % 360) + ",100%,60%," + (0.22 * e) + ")"; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0, i * TAU / 16, i * TAU / 16 + TAU / 32); g.closePath(); g.fill(); }
      g.restore();
      var gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45); gr.addColorStop(0, "rgba(255,255,255," + 0.35 * e + ")"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // the skin itself, turning slowly on its pedestal
      R.portrait(fig, {kit: it.id, look: MG.S.look, name: ""}, t, {zoom: 2.65, spin: 1, pose: t > 2.6 ? "win" : ""});
      var fh = Math.min(h * 0.62, 520), fw = fh * 0.75, sc = 0.6 + 0.4 * e;
      g.globalAlpha = e; g.drawImage(fig, cx - fw * sc / 2, cy - fh * sc * 0.55, fw * sc, fh * sc); g.globalAlpha = 1;
      // confetti of shards
      for (i = 0; i < 40; i++) { var u = ((t - 1.4) * (0.3 + (i % 7) * 0.05) + i / 40) % 1; g.fillStyle = "hsl(" + (i * 37 % 360) + ",100%,65%)"; g.globalAlpha = (1 - u) * e; g.fillRect(cx + Math.cos(i * 2.1) * u * w * 0.6, cy + Math.sin(i * 2.1) * u * h * 0.6 + u * u * 120, 6, 10); }
      g.globalAlpha = 1;
    }
    var fl = t > 1.3 && t < 1.8 ? 1 - Math.abs(t - 1.45) / 0.35 : 0;
    if (fl > 0) { g.fillStyle = "rgba(255,255,255," + fl + ")"; g.fillRect(0, 0, w, h); }
    if (t > 1.45 && !shown) { shown = true; ov.classList.add("on"); if (MG.sfx) MG.sfx("rare", 7); setTimeout(function(){ btn.disabled = false; }, 900); }
  }
  raf = requestAnimationFrame(frame);
};

var st = document.createElement("style");
st.textContent = [
  "#uxr{position:fixed;inset:0;z-index:200}#uxr canvas{position:absolute;inset:0;width:100%;height:100%}",
  "#uxr .uxt{position:absolute;left:0;right:0;bottom:7vh;display:flex;flex-direction:column;align-items:center;gap:.5rem;opacity:0;transform:translateY(20px);transition:opacity .6s .5s,transform .6s .5s}",
  "#uxr.on .uxt{opacity:1;transform:none}",
  "#uxr .uxk{font-weight:900;letter-spacing:.3em;text-transform:uppercase;font-size:1rem;background:linear-gradient(90deg,#ff4f7a,#ffd23b,#5ee6a8,#5ee6ff,#b266ff,#ff4f7a);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:uxg 2s linear infinite}",
  "#uxr h2{margin:0;font-size:clamp(2rem,5vw,3.4rem);color:#fff;text-shadow:0 0 24px rgba(255,94,240,.7)}",
  "@keyframes uxg{to{background-position:200% 0}}",
  ".rl.ux{background:radial-gradient(circle,#2a1450,#0a0618)!important;border-color:#ff5ef0!important}.rl.ux .uxq{font-size:2.6rem;font-weight:900;color:#fff;display:block;text-align:center;line-height:1.6}"
].join("\n");
document.head.appendChild(st);
})();
