// MEGS Ultra skins: the rarest skins in the game. They are never listed in the shop, the pass or the locker until
// you own one, and they only come out of a Galaxy Pack: 1 pull in 2500. Pulling one stops the pack opening for a
// reveal of its own.
(function(){
"use strict";
var MG = window.MG, R = MG.R, I = MG.ITEMS, BY = MG.ITEM, PI = Math.PI, TAU = PI * 2;
MG.ULTRA = 8; MG.ULTRA_CHANCE = 1 / 2500;
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
  if ((sd.tier || 0) !== 8) return;
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

// ---- the reveal: the pack opening stops. The screen goes black, the card beats like a heart while cracks of
// light spread across the whole screen, then it shatters, a shockwave rolls out, and the skin rises through rainbow
// light while the words slam in.
MG.ultraReveal = function(it, done){
  var ov = document.createElement("div"), cv = document.createElement("canvas"), fig = document.createElement("canvas"), t0 = performance.now(), dpr = Math.min(1.5, window.devicePixelRatio || 1), raf, stage = 0, i, j;
  var rnd = MG.rng ? MG.rng(Math.floor(Math.random() * 1e6)) : Math.random;
  ov.id = "uxr"; fig.width = 420; fig.height = 560;
  ov.innerHTML = '<div class="uxt"><span class="uxk">' + "ULTRA RARE".split("").map(function(c, k){ return '<i style="animation-delay:' + (k * 0.07).toFixed(2) + 's">' + (c === " " ? "&nbsp;" : c) + '</i>'; }).join("") + '</span><h2></h2><button class="btn gold big" disabled>Claim</button></div>';
  ov.querySelector("h2").textContent = it.n;
  ov.insertBefore(cv, ov.firstChild); document.body.appendChild(ov);
  var btn = ov.querySelector("button");
  btn.onclick = function(){ cancelAnimationFrame(raf); ov.remove(); done && done(); };
  // cracks: jagged lines from the card out to the edges of the screen, each with a branch
  var CR = [];
  for (i = 0; i < 11; i++) {
    var a = i * TAU / 11 + rnd() * 0.4, pts = [[0, 0]], l = 0, b = [];
    for (j = 1; j <= 9; j++) { l += 0.06 + rnd() * 0.06; a += (rnd() - 0.5) * 0.5; pts.push([Math.cos(a) * l, Math.sin(a) * l]); }
    var k = 3 + Math.floor(rnd() * 4), ba = a + (rnd() < 0.5 ? 0.8 : -0.8), bx = pts[k][0], by = pts[k][1];
    b.push([bx, by]); for (j = 0; j < 4; j++) { ba += (rnd() - 0.5) * 0.6; bx += Math.cos(ba) * 0.05; by += Math.sin(ba) * 0.05; b.push([bx, by]); }
    CR.push({p: pts, b: b, d: rnd() * 0.25});
  }
  // the shards the card breaks into
  var SH = [];
  for (i = 0; i < 26; i++) { var sa = i * TAU / 26, sp = 0.7 + rnd() * 1.1; SH.push({a: sa, v: sp, r: (rnd() - 0.5) * 12, s: 10 + rnd() * 22, h: (i * 47) % 360}); }
  var STAR = []; for (i = 0; i < 90; i++) STAR.push({a: rnd() * TAU, d: rnd(), v: 0.4 + rnd() * 1.4});
  function poly(g, pts, sx, sy, f){ var n = Math.max(1, Math.floor(pts.length * f)); g.beginPath(); g.moveTo(pts[0][0] * sx, pts[0][1] * sy); for (var q = 1; q < n; q++) g.lineTo(pts[q][0] * sx, pts[q][1] * sy); g.stroke(); }
  function back(x){ var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
  function frame(now){
    raf = requestAnimationFrame(frame);
    var t = (now - t0) / 1000, w = window.innerWidth, h = window.innerHeight, g = cv.getContext("2d"), cx = w / 2, cy = h * 0.45, D = Math.hypot(w, h), e, x, y, hue = (t * 140) % 360;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = "rgba(3,2,10," + Math.min(1, t * 2) + ")"; g.fillRect(0, 0, w, h);
    var BOOM = 2.3;
    if (t < BOOM) {
      // the heartbeat: faster and faster, and the screen shakes harder
      var beat = Math.pow(Math.max(0, Math.sin(t * t * 3.2)), 8), shake = Math.pow(t / BOOM, 2) * 12;
      x = cx + (rnd() - 0.5) * shake; y = cy + (rnd() - 0.5) * shake;
      if (stage === 0 && beat > 0.9) { stage = 1; if (MG.sfx) MG.sfx("ui"); } if (beat < 0.3) stage = 0;
      // light being pulled into the card
      g.save(); g.translate(x, y);
      for (i = 0; i < STAR.length; i++) { var st = STAR[i], u = 1 - ((t * st.v * 0.6 + st.d) % 1), r1 = u * D * 0.5, r2 = r1 + 30 + u * 60; g.strokeStyle = "hsla(" + ((hue + i * 7) % 360) + ",100%,70%," + (0.5 * (1 - u) * Math.min(1, t)) + ")"; g.lineWidth = 2; g.beginPath(); g.moveTo(Math.cos(st.a) * r1, Math.sin(st.a) * r1); g.lineTo(Math.cos(st.a) * r2, Math.sin(st.a) * r2); g.stroke(); }
      // glow
      var gl = 60 + 90 * beat + t * 40, gr = g.createRadialGradient(0, 0, 10, 0, 0, gl * 2.2); gr.addColorStop(0, "hsla(" + hue + ",100%,65%,.8)"); gr.addColorStop(1, "hsla(" + hue + ",100%,50%,0)"); g.fillStyle = gr; g.fillRect(-gl * 2.2, -gl * 2.2, gl * 4.4, gl * 4.4);
      // the cracks spread, first over the card and then over the whole screen
      var cf = Math.max(0, (t - 0.5) / (BOOM - 0.5));
      g.lineCap = "round"; g.lineJoin = "round";
      CR.forEach(function(c, n){ var f = Math.max(0, Math.min(1, (cf - c.d) * 1.35)); if (!f) return;
        g.strokeStyle = "hsla(" + ((hue + n * 33) % 360) + ",100%,75%,.9)"; g.lineWidth = 3 + 3 * beat; poly(g, c.p, D * 0.75, D * 0.75, f);
        g.strokeStyle = "rgba(255,255,255,.95)"; g.lineWidth = 1.2; poly(g, c.p, D * 0.75, D * 0.75, f);
        if (f > 0.5) { g.lineWidth = 1.5; poly(g, c.b, D * 0.75, D * 0.75, (f - 0.5) * 2); } });
      // the card itself
      var sc = 1 + 0.18 * beat + t * 0.12;
      g.scale(sc, sc); g.rotate(Math.sin(t * 9) * 0.04 * t);
      g.fillStyle = "#130d2b"; g.beginPath(); g.moveTo(0, -95); g.lineTo(72, 0); g.lineTo(0, 95); g.lineTo(-72, 0); g.closePath(); g.fill();
      g.lineWidth = 4; g.strokeStyle = "hsl(" + hue + ",100%,65%)"; g.stroke();
      g.fillStyle = "#fff"; g.font = "900 70px " + R.FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", 0, 4);
      g.restore();
      // one last flash just before it breaks
      if (t > BOOM - 0.25) { g.fillStyle = "rgba(255,255,255," + ((t - (BOOM - 0.25)) / 0.25) * 0.7 + ")"; g.fillRect(0, 0, w, h); }
    } else {
      e = t - BOOM;
      if (stage !== 9) { stage = 9; if (MG.sfx) MG.sfx("rare", 7); }
      var shk = Math.max(0, 1 - e * 2.5) * 18; x = cx + (rnd() - 0.5) * shk; y = cy + (rnd() - 0.5) * shk;
      // rainbow god-rays turning behind everything
      g.save(); g.translate(x, y); g.rotate(e * 0.3);
      var ra = Math.min(1, e * 1.5);
      for (i = 0; i < 20; i++) { g.fillStyle = "hsla(" + ((i * 18 + t * 50) % 360) + ",100%,60%," + (0.2 * ra) + ")"; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, D, i * TAU / 20, i * TAU / 20 + TAU / 46); g.closePath(); g.fill(); }
      g.restore();
      // stars streaking out
      for (i = 0; i < STAR.length; i++) { var s2 = STAR[i], u2 = (e * s2.v * 0.5 + s2.d) % 1, q1 = u2 * u2 * D * 0.7, q2 = q1 + 10 + u2 * 80; g.strokeStyle = "rgba(255,255,255," + 0.7 * u2 + ")"; g.lineWidth = 1 + u2 * 2; g.beginPath(); g.moveTo(x + Math.cos(s2.a) * q1, y + Math.sin(s2.a) * q1); g.lineTo(x + Math.cos(s2.a) * q2, y + Math.sin(s2.a) * q2); g.stroke(); }
      // shockwaves
      for (i = 0; i < 3; i++) { var sw = e - i * 0.12; if (sw <= 0 || sw > 1.2) continue; g.strokeStyle = "hsla(" + ((i * 120 + t * 90) % 360) + ",100%,70%," + (1 - sw / 1.2) + ")"; g.lineWidth = 10 * (1 - sw / 1.2) + 2; g.beginPath(); g.arc(x, y, sw * D * 0.6, 0, TAU); g.stroke(); }
      // the card's shards flying off and spinning
      SH.forEach(function(p){ var d = e * p.v * D * 0.45, px = x + Math.cos(p.a) * d, py = y + Math.sin(p.a) * d + e * e * 260; if (e > 2) return;
        g.save(); g.translate(px, py); g.rotate(p.r * e); g.globalAlpha = Math.max(0, 1 - e / 2); g.fillStyle = "hsl(" + ((p.h + t * 60) % 360) + ",100%,70%)"; g.strokeStyle = "#fff"; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(0, -p.s); g.lineTo(p.s * 0.6, p.s * 0.5); g.lineTo(-p.s * 0.6, p.s * 0.4); g.closePath(); g.fill(); g.stroke(); g.restore(); });
      g.globalAlpha = 1;
      // a spotlight from above and a glowing floor
      var sp = Math.min(1, e * 2), fh = Math.min(h * 0.62, 540), fw = fh * 0.75, rise = back(Math.min(1, e / 0.9)), sc2 = 0.55 + 0.45 * rise;
      var cone = g.createLinearGradient(x, 0, x, y + fh * 0.4); cone.addColorStop(0, "rgba(255,255,255," + 0.32 * sp + ")"); cone.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = cone; g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 40, 0); g.lineTo(x + fw * 0.7, y + fh * 0.42); g.lineTo(x - fw * 0.7, y + fh * 0.42); g.closePath(); g.fill();
      var fl = g.createRadialGradient(x, y + fh * 0.4, 0, x, y + fh * 0.4, fw * 0.8); fl.addColorStop(0, "hsla(" + hue + ",100%,70%," + 0.55 * sp + ")"); fl.addColorStop(1, "hsla(" + hue + ",100%,60%,0)");
      g.fillStyle = fl; g.beginPath(); g.ellipse(x, y + fh * 0.4, fw * 0.8, fw * 0.2, 0, 0, TAU); g.fill();
      // the skin rises up and lands with a little bounce, turning to show itself off
      R.portrait(fig, {kit: it.id, look: MG.S.look, name: ""}, t, {zoom: 2.65, spin: 1, pose: e > 1.2 ? "win" : ""});
      g.globalAlpha = Math.min(1, e * 3);
      g.drawImage(fig, x - fw * sc2 / 2, y - fh * sc2 * 0.6 + (1 - rise) * h * 0.4, fw * sc2, fh * sc2);
      g.globalAlpha = 1;
      // prism confetti falling for as long as you look
      for (i = 0; i < 70; i++) { var u3 = ((e * (0.12 + (i % 9) * 0.02) + i / 70) % 1), cx3 = (i * 97.3 % w) + Math.sin(e * 2 + i) * 20; g.save(); g.translate(cx3, u3 * (h + 40) - 20); g.rotate(e * 3 + i); g.fillStyle = "hsl(" + ((i * 41 + t * 40) % 360) + ",100%,66%)"; g.fillRect(-4, -7, 8, 14); g.restore(); }
      // the white flash of the break, fading out
      if (e < 0.5) { g.fillStyle = "rgba(255,255,255," + (1 - e / 0.5) + ")"; g.fillRect(0, 0, w, h); }
      if (!ov.classList.contains("on") && e > 0.35) { ov.classList.add("on"); setTimeout(function(){ btn.disabled = false; }, 1500); }
    }
  }
  raf = requestAnimationFrame(frame);
};

var st = document.createElement("style");
st.textContent = [
  "#uxr{position:fixed;inset:0;z-index:200}#uxr canvas{position:absolute;inset:0;width:100%;height:100%}",
  "#uxr .uxt{position:absolute;left:0;right:0;bottom:6vh;display:flex;flex-direction:column;align-items:center;gap:.4rem;pointer-events:none}#uxr .uxt button{pointer-events:auto;opacity:0;transition:opacity .5s 1.6s}#uxr.on .uxt button{opacity:1}",
  "#uxr .uxk{display:flex;font-weight:900;font-size:clamp(1.6rem,4vw,2.6rem);letter-spacing:.12em}",
  "#uxr .uxk i{font-style:normal;opacity:0;display:inline-block;background:linear-gradient(90deg,#ff4f7a,#ffd23b,#5ee6a8,#5ee6ff,#b266ff,#ff4f7a);background-size:600% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 10px rgba(255,255,255,.45))}",
  "#uxr.on .uxk i{animation:uxs .45s cubic-bezier(.2,1.6,.4,1) forwards,uxg 2.4s linear infinite}",
  "#uxr h2{margin:0;font-size:clamp(2.2rem,6vw,4rem);color:#fff;text-shadow:0 0 30px rgba(255,94,240,.8),0 0 6px #fff;opacity:0;transform:scale(1.6);transition:opacity .5s .9s,transform .6s .9s cubic-bezier(.2,1.4,.4,1)}#uxr.on h2{opacity:1;transform:none}",
  "@keyframes uxs{0%{opacity:0;transform:translateY(-60px) scale(2.4) rotate(-12deg)}100%{opacity:1;transform:none}}",
  "@keyframes uxg{to{background-position:600% 0}}",
  ".rl.ux{background:radial-gradient(circle,#2a1450,#0a0618)!important;border-color:#ff5ef0!important}.rl.ux .uxq{font-size:2.6rem;font-weight:900;color:#fff;display:block;text-align:center;line-height:1.6}"
].join("\n");
document.head.appendChild(st);
})();
