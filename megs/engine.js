// MEGS engine: ball physics, players, moves, shot meter, rival AI and match rules. No DOM in here.
(function(){
"use strict";
var MG = window.MG = window.MG || {};
var W = 9, D = 15, GW = 1.5, GH = 2, GD = 1.3, ARC = 8, BR = 0.11, PR = 0.36, DT = 1 / 60, PI = Math.PI, TF = 0.62, GC = 0.72;
MG.K = {W: W, D: D, GW: GW, GH: GH, GD: GD, ARC: ARC, BR: BR, PR: PR, DT: DT, TF: TF, GC: GC};

function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function hyp(x, y){ return Math.sqrt(x * x + y * y); }
function lerp(a, b, t){ return a + (b - a) * t; }
function wrap(a){ while (a > PI) a -= 2 * PI; while (a < -PI) a += 2 * PI; return a; }
function cp(a, b){ for (var k in b) a[k] = b[k]; }
function rng(seed){
  var s = seed >>> 0;
  return function(){
    s = s + 0x6D2B79F5 | 0;
    var t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function gauss(r){ return (r() + r() + r() + r() - 2) * 1.732; }
function segDist(px, py, ax, ay, bx, by){
  var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return hyp(px - ax - dx * t, py - ay - dy * t);
}
MG.rng = rng; MG.clamp = clamp; MG.lerp = lerp; MG.hyp = hyp;

// ---- ball flight: gravity, air drag and spin (Magnus curl) ----
function fly(s, h, g){
  var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy + s.vz * s.vz), k = 0.013 * sp, c = 0.022 * s.spin, vx = s.vx;
  s.vx += (-k * s.vx - c * s.vy) * h;
  s.vy += (-k * s.vy + c * vx) * h;
  s.vz += (-k * s.vz - g) * h;
  s.x += s.vx * h; s.y += s.vy * h; s.z += s.vz * h;
}
// where a kick would cross the goal plane
function plane(x0, y0, z0, yaw, el, spd, spin, g, ty){
  var ch = Math.cos(el) * spd, s = {x: x0, y: y0, z: z0, vx: Math.cos(yaw) * ch, vy: Math.sin(yaw) * ch, vz: Math.sin(el) * spd, spin: spin}, i, px, py, pz, f;
  for (i = 0; i < 400; i++) {
    px = s.x; py = s.y; pz = s.z;
    fly(s, 1 / 120, g);
    if (s.y <= ty) { f = (py - ty) / ((py - s.y) || 1); return {x: px + (s.x - px) * f, z: pz + (s.z - pz) * f}; }
    if (s.z < BR * 0.6) return {x: s.x, z: -1 - (s.y - ty)};
  }
  return {x: s.x, z: -9};
}
// launch velocity that sends the ball to (tx, tz) on the goal line: bisect on loft (or on power for a chip), then re-aim for curl
function solve(x0, y0, z0, tx, tz, spd, chip, spin, g){
  var ty = -0.3, ax = tx, dist = hyp(tx - x0, ty - y0), el = chip ? clamp(1.22 - dist * 0.05, 0.6, 1.1) : 0, lo, hi, mid = 0, i, j, res, yaw = 0, ch;
  for (j = 0; j < 3; j++) {
    yaw = Math.atan2(ty - y0, ax - x0);
    lo = chip ? 3 : -0.12; hi = chip ? 30 : 0.8;
    for (i = 0; i < 14; i++) {
      mid = (lo + hi) / 2;
      res = chip ? plane(x0, y0, z0, yaw, el, mid, spin, g, ty) : plane(x0, y0, z0, yaw, mid, spd, spin, g, ty);
      if (res.z > tz) hi = mid; else lo = mid;
    }
    ax -= res.x - tx;
  }
  if (chip) spd = mid; else el = mid;
  ch = Math.cos(el) * spd;
  return {vx: Math.cos(yaw) * ch, vy: Math.sin(yaw) * ch, vz: Math.sin(el) * spd};
}

// ---- players ----
function inp0(){ return {mx: 0, my: 0, sp: 0, sh: 0, a: 0, b: 0, c: 0, d: 0}; }
// rival brain settings for a level from 0 (beginner) to 10 (unfair); below 0 is a passive training dummy
function aiP(lv){
  var t = clamp(lv / 10, 0, 1);
  return {lv: lv, t: t, pass: lv < 0, react: lerp(0.42, 0.12, t), err: lerp(0.15, 0.02, t), bite: lerp(0.85, 0.1, t), tack: lerp(0.3, 1.6, t), skill: lerp(0.05, 1, t), range: lerp(6.5, 10.5, t), spd: lerp(0.86, 1.02, t),
    hist: [], dec: 0, side: 1, moveT: 0, fk: 0, rel: 0, aimX: 0, aimH: 0, w: 0, wt: 0, guess: false};
}
function mkP(i, o){
  o = o || {};
  var s = o.st || {}, st = {};
  ["pace", "shot", "ctrl", "power", "tackle", "block"].forEach(function(k){ st[k] = s[k] == null ? 5 : s[k]; });
  return {i: i, name: o.name || "P" + (i + 1), x: 0, y: 0, vx: 0, vy: 0, fa: 0, z: 0, vz: 0, st: st, stam: 1, tired: 0, act: "", at: 0, ad: 0, ax: 0, ay: 0, hit: 0, sd: 1, sa: 0,
    wind: -1, w0: 0, pull: false, aimX: 0, aimH: 0, prot: 0, legs: 0, jock: 0, lastCut: -9, lastBurst: -9, lastFake: -9, lastDrag: -9, lastMeg: -9, buf: "", bufT: -9, stride: 0, heat: 0, rel: null,
    mx0: 0, my0: 0, mx1: 0, my1: 0, inp: inp0(), prev: inp0(), ai: o.ai == null ? null : aiP(o.ai),
    stats: {shots: 0, goals: 0, twos: 0, perfect: 0, green: 0, megs: 0, ankles: 0, tackles: 0, blocks: 0, poss: 0}};
}
function act(p, name, dur, ax, ay){ p.act = name; p.at = 0; p.ad = dur; p.ax = ax || 0; p.ay = ay || 0; p.hit = 0; }
function ctl(p){ return (p.act === "" || p.act === "tackle" || p.act === "burst" || p.act === "cut") && p.z < 0.2; }
function maxSpd(m, p, sprint){
  var v = sprint ? 6.5 + 0.16 * (p.st.pace - 5) : 4.5 + 0.09 * (p.st.pace - 5);
  if (m.b.own === p.i) v *= 0.93;
  if (p.ai) v *= p.ai.spd;
  return v * (0.88 + 0.12 * p.stam);
}

// ---- match ----
// cfg: target (first to), two (long range counts double), take (make it, take it), clock (seconds, 0 = none), sc (possession clock),
// panna (a nutmeg wins), golden (next goal wins), far (only long range counts), grav and boun (ball feel), p0 / p1 (name, st, ai level)
function Match(cfg){
  var c = this.cfg = {target: 5, two: true, take: true, clock: 0, sc: 12, panna: false, golden: false, far: false, grav: 1, boun: 1}, k;
  cfg = cfg || {};
  for (k in c) if (cfg[k] != null) c[k] = cfg[k];
  this.r = rng(cfg.seed == null ? (Math.random() * 1e9) | 0 : cfg.seed);
  this.p = [mkP(0, cfg.p0), mkP(1, cfg.p1)];
  this.b = {x: 0, y: 0, z: BR, vx: 0, vy: 0, vz: 0, spin: 0, own: -1, last: -1, nop: [0, 0], shot: null, net: 0, inGoal: false};
  this.score = [0, 0]; this.t = 0; this.pt = 0; this.phase = ""; this.off = 0; this.poss = 0; this.need = -1; this.next = 0; this.win = -1; this.ko = 0; this.sc = c.sc; this.left = c.clock; this.ev = [];
  this.check(cfg.first || 0);
}
var M = Match.prototype;
M.emit = function(k, o){ o = o || {}; o.k = k; this.ev.push(o); };
// check ball: attacker at the top with the ball, defender between it and the goal
M.check = function(att){
  var m = this, b = m.b, a = m.p[att], d = m.p[1 - att], i, p;
  for (i = 0; i < 2; i++) {
    p = m.p[i]; p.vx = p.vy = p.z = p.vz = 0; p.act = ""; p.wind = -1; p.prot = 0; p.legs = 0; p.buf = ""; p.rel = null;
    if (p.ai) { p.ai.hist.length = 0; p.ai.w = 0; p.ai.fk = 0; p.ai.moveT = m.t + 1.4 + m.r() * 0.6; }
  }
  a.x = 0; a.y = 11; a.fa = -PI / 2; d.x = 0; d.y = 8.3; d.fa = PI / 2;
  b.own = att; b.last = att; b.x = 0; b.y = 10.5; b.z = BR; b.vx = b.vy = b.vz = b.spin = 0; b.shot = null; b.net = 0; b.inGoal = false; b.nop[0] = b.nop[1] = 0;
  m.off = att; m.poss = att; m.need = -1; m.sc = m.cfg.sc; m.phase = "check"; m.pt = 0; m.emit("check", {by: att});
};
// how hard the shooter is being closed down, 0..1
M.pressure = function(p){
  var o = this.p[1 - p.i], dx = o.x - p.x, dy = o.y - p.y, d = hyp(dx, dy), gl = hyp(p.x, p.y) || 1, front, pr;
  if (o.act === "stumble" || o.act === "megged" || (o.act === "slide" && o.at > 0.4)) return 0;
  front = d > 0.01 ? (dx * -p.x + dy * -p.y) / (d * gl) : 1;
  pr = clamp(1 - (d - 0.9) / 1.8, 0, 1) * (front > 0.25 ? 1 : 0.35);
  if (o.z > 0.1 || o.jock) pr = Math.min(1, pr * 1.2);
  return pr;
};
// half width of the green zone on the shot meter
M.green = function(p){
  var b = this.b, d = hyp(b.x, b.y), g = 0.085 * (1 + 0.07 * (p.st.shot - 5)) * (1 - 0.6 * this.pressure(p)) * (d > ARC ? 0.78 : d < 4.5 ? 1.15 : 1) * (1 - 0.25 * p.w0) * (0.75 + 0.25 * p.stam);
  if (p.pull) g *= 1.15;
  if (p.heat >= 2) g *= 1.2;
  return clamp(g, 0.018, 0.16);
};
M.meter = function(p){ return p.act === "wind" ? {m: Math.min(p.wind / TF, 1.25), gw: this.green(p)} : null; };
// where a shot goes: the corner you hold, otherwise the side the defender leaves open
M.aim = function(p, ax){
  var b = this.b, o = this.p[1 - p.i], half = GW - 0.36, xh;
  if (ax) return ax * half;
  if (o.y < b.y - 0.2) { xh = b.x + (o.x - b.x) * (b.y / (b.y - o.y)); if (Math.abs(xh) < GW + 0.7) return (xh > 0 ? -1 : 1) * half * 0.62; }
  return clamp(-b.x * 0.1, -0.6, 0.6);
};
M.shoot = function(p, w){
  var m = this, b = m.b, r = m.r, c = m.cfg, mm = Math.min(w / TF, 1.25), gw = m.green(p), e = mm - GC, ae = Math.abs(e), q = ae <= gw * 0.35 ? 2 : ae <= gw ? 1 : 0;
  var sig = q === 2 ? 0 : q === 1 ? 0.004 + 0.014 * ae / gw : Math.min(0.3, 0.035 + 0.6 * (ae - gw));
  var h = p.aimH, tx = m.aim(p, p.aimX), pw = (0.9 + 0.02 * p.st.power) * (q === 2 ? 1.07 : 1) * (mm < GC ? 0.6 + 0.4 * mm / GC : 1);
  var spd = (h < 0 ? 22 : 19.5) * pw, tz = h > 0 ? 1.45 : h < 0 ? 0.22 : 0.85 + r() * 0.2, spin = p.aimX && h >= 0 ? -p.aimX * (h > 0 ? 3 : 8) : 0;
  var v = solve(b.x, b.y, BR, tx, tz, spd, h > 0, spin, 9.8 * c.grav), yaw = gauss(r) * sig, el = gauss(r) * sig * 0.7 + (e > gw ? (e - gw) * 0.9 : 0), ke = h > 0 ? 1 + gauss(r) * sig : 1;
  var cs = Math.cos(yaw), sn = Math.sin(yaw), vx = v.vx * cs - v.vy * sn, vy = v.vx * sn + v.vy * cs, vh = hyp(vx, vy) || 1, nh = (vh * Math.cos(el) - v.vz * Math.sin(el)) * ke / vh;
  b.own = -1; b.last = p.i; b.nop[p.i] = 0.3; b.z = BR + 0.02; b.vx = vx * nh; b.vy = vy * nh; b.vz = (vh * Math.sin(el) + v.vz * Math.cos(el)) * ke; b.spin = spin;
  b.shot = {by: p.i, two: c.two && hyp(b.x, b.y) > ARC, q: q, megs: 0, hit: "", blk: 0};
  p.wind = -1; act(p, "kick", 0.24); p.rel = {m: mm, gw: gw, q: q, t: m.t};
  p.stats.shots++; if (q) p.stats.green++; if (q === 2) p.stats.perfect++;
  m.emit("kick", {by: p.i, q: q, pw: spd, h: h});
};
// first-time finish on a loose ball
M.volley = function(p){
  var m = this, b = m.b, r = m.r, c = m.cfg, sig = 0.03 + 0.006 * hyp(b.vx, b.vy) + (b.z > 0.6 ? 0.03 : 0), tx = m.aim(p, p.inp.mx > 0.4 ? 1 : p.inp.mx < -0.4 ? -1 : 0);
  var v = solve(b.x, b.y, b.z, tx, 0.8, 18 * (0.9 + 0.02 * p.st.power), false, 0, 9.8 * c.grav), yaw = gauss(r) * sig, cs = Math.cos(yaw), sn = Math.sin(yaw);
  b.vx = v.vx * cs - v.vy * sn; b.vy = v.vx * sn + v.vy * cs; b.vz = v.vz + gauss(r) * sig * 8; b.spin = 0; b.last = p.i; b.nop[p.i] = 0.3;
  b.shot = {by: p.i, two: c.two && hyp(b.x, b.y) > ARC, q: 0, megs: 0, hit: "", blk: 0};
  act(p, "kick", 0.24); p.stats.shots++; m.emit("kick", {by: p.i, q: 0, pw: 18, h: 0, vol: 1});
};

// ---- actions ----
M.ankles = function(p, o, dur){ act(o, "stumble", dur); o.wind = -1; p.stats.ankles++; this.emit("ankles", {by: p.i}); };
// turn button presses into moves. On the ball: a cut, b drag back, c burst, d megs. Off it: a tackle, b jockey (held), c slide.
M.press = function(p){
  var m = this, b = m.b, inp = p.inp, pv = p.prev, t = m.t, has = b.own === p.i, o = m.p[1 - p.i], mx = inp.mx, my = inp.my, l = hyp(mx, my), ks = ["a", "b", "c", "d"], i, k, dx, dy, d, fx, fy, px, py, s, cx, cy, n, fresh, dur;
  for (i = 0; i < 4; i++) if (inp[ks[i]] && !pv[ks[i]]) { p.buf = ks[i]; p.bufT = t; }
  if (p.act === "wind") {
    if (!inp.sh) { if (p.wind < 0.13) { p.wind = -1; act(p, "fake", 0.2); p.lastFake = t; m.emit("fake", {by: p.i}); } else m.shoot(p, p.wind); }
    return;
  }
  if (p.act !== "" && !(p.act === "burst" && p.buf === "a")) return;
  dx = b.x - p.x; dy = b.y - p.y; d = hyp(dx, dy) || 1;
  if (inp.sh && !pv.sh && p.act === "") {
    if (has) {
      if (m.need === p.i) m.emit("hint", {by: p.i});
      else { act(p, "wind", 9); p.wind = 0; p.w0 = Math.min(1, hyp(p.vx, p.vy) / 6.5); p.pull = t - p.lastDrag < 0.6; p.rel = null; }
    }
    else if (b.own < 0 && d < 1.05 && b.z < 1.7 && m.off === p.i && m.need < 0 && !b.inGoal) m.volley(p);
    else if (l > 0.3) { act(p, "lunge", 0.66, mx / l, my / l); p.legs = 0.4; }
    else { act(p, "jump", 0.5); p.vz = 4.3; }
    return;
  }
  k = p.buf;
  if (!k || t - p.bufT > 0.25) return;
  p.buf = "";
  if (!has) {
    if (p.act !== "") return;
    if (k === "a") { act(p, "tackle", 0.52, dx / d, dy / d); p.legs = 0.34; }
    else if (k === "c" && p.stam > 0.1) { if (l > 0.3) act(p, "slide", 1.05, mx / l, my / l); else act(p, "slide", 1.05, dx / d, dy / d); p.stam -= 0.12; }
    return;
  }
  fx = Math.cos(p.fa); fy = Math.sin(p.fa);
  if (k === "a") {
    if (t - p.lastBurst < 0.5 && p.stam > 0.12) {   // burst, then cut: roulette
      act(p, "spin", 0.44); p.sa = Math.atan2(p.vy, p.vx); p.sd = (o.x - p.x) * -fy + (o.y - p.y) * fx > 0 ? -1 : 1; p.prot = 0.46; p.stam -= 0.14; p.lastBurst = -9;
      dx = o.x - p.x; dy = o.y - p.y; d = hyp(dx, dy);
      if (d < 1.7 && dx * fx + dy * fy > 0 && o.act !== "stumble" && (o.act === "tackle" || o.jock || hyp(o.vx, o.vy) < 1.6)) m.ankles(p, o, 0.5);
      m.emit("move", {by: p.i, s: "spin"});
      return;
    }
    if (p.act !== "" || t - p.lastCut < 0.3) return;
    px = -fy; py = fx;
    s = l > 0.3 ? (mx * px + my * py >= 0 ? 1 : -1) : ((o.x - p.x) * px + (o.y - p.y) * py > 0 ? -1 : 1);
    cx = px * s * 0.92 + fx * 0.4; cy = py * s * 0.92 + fy * 0.4; n = hyp(cx, cy);
    fresh = t - p.lastCut > 0.9;
    act(p, "cut", 0.26, cx / n, cy / n); p.prot = fresh ? 0.2 + 0.012 * (p.st.ctrl - 5) : 0.08; p.lastCut = t; p.stam -= 0.05;
    dx = o.x - p.x; dy = o.y - p.y; d = hyp(dx, dy);
    // ankle breaker: the defender is reaching, or leaning the wrong way
    if (fresh && d < 2.3 && o.act !== "stumble" && ((o.act === "tackle" && o.at < 0.3) || (o.act === "lunge" && o.at < 0.3) || (!o.jock && o.vx * p.ax + o.vy * p.ay < -2.6))) m.ankles(p, o, 0.78);
    m.emit("move", {by: p.i, s: "cut"});
    return;
  }
  if (p.act !== "") return;
  if (k === "b") {
    if (t - p.lastDrag < 0.7) return;
    act(p, "drag", 0.3, -fx, -fy); p.prot = 0.16; p.lastDrag = t; p.stam -= 0.04; m.emit("move", {by: p.i, s: "drag"});
  } else if (k === "c") {
    if (t - p.lastBurst < 1.1 || p.stam < 0.14) return;
    dur = t - p.lastFake < 0.5 ? 0.42 : 0.34;
    if (l > 0.3) act(p, "burst", dur, mx / l, my / l); else act(p, "burst", dur, fx, fy);
    p.lastBurst = t; p.stam -= 0.13; m.emit("move", {by: p.i, s: "burst"});
  } else m.megs(p);
};
// nutmeg: only works on a defender who has committed (reaching, lunging, jumping) or is running flat out
M.megs = function(p){
  var m = this, b = m.b, o = m.p[1 - p.i], dx = o.x - p.x, dy = o.y - p.y, d = hyp(dx, dy) || 1, t = m.t;
  if (d > 2.1 || (dx * Math.cos(p.fa) + dy * Math.sin(p.fa)) / d < 0.55 || t - p.lastMeg < 1 || o.act === "stumble" || o.act === "megged") return;
  p.lastMeg = t; dx /= d; dy /= d;
  if (o.act !== "slide" && (o.legs > 0 || o.z > 0.05 || (hyp(o.vx, o.vy) > 3.9 && !o.jock))) {
    act(p, "megs", 0.5, dx, dy); p.sd = m.r() < 0.5 ? 1 : -1; p.prot = 0.6; p.stam -= 0.06;
    p.mx0 = b.x; p.my0 = b.y; p.mx1 = clamp(o.x + dx * 1.9, -W + 0.4, W - 0.4); p.my1 = clamp(o.y + dy * 1.9, 0.5, D - 0.4);
    act(o, "megged", 0.9); o.wind = -1; p.stats.megs++; m.emit("megs", {by: p.i});
    if (m.cfg.panna) { m.win = p.i; m.ko = 1; m.phase = "goal"; m.pt = 1; m.next = p.i; }
  } else {
    b.own = -1; b.last = p.i; b.nop[p.i] = 0.5; b.vx = dx * 4.5; b.vy = dy * 4.5; b.vz = 0; b.shot = null;
    act(p, "kick", 0.3); m.emit("read", {by: o.i});
  }
};
// poke or slide at the ball; a protected dribbler makes it miss
M.tackle = function(p){
  var m = this, b = m.b, o = m.p[1 - p.i], sl = p.act === "slide", dx, dy, d, reach, j;
  if (p.hit || b.own !== o.i || (!sl && (p.at < 0.1 || p.at > 0.25))) return;
  dx = b.x - p.x; dy = b.y - p.y; d = hyp(dx, dy) || 0.01;
  reach = sl ? 0.85 : 1.1 + 0.03 * (p.st.tackle - 5) - 0.02 * (o.st.ctrl - 5) + (o.act === "burst" ? 0.22 : 0);
  if (d > reach || (!sl && (dx * p.ax + dy * p.ay) / d < 0.4)) return;
  if (!sl && d > 0.7 && segDist(o.x, o.y, p.x, p.y, b.x, b.y) < 0.22) return;   // shielded by the body
  p.hit = 1;
  if (o.prot > 0 || o.act === "spin" || o.act === "megs") { if (o.act === "cut" || o.act === "spin") m.ankles(o, p, 0.78); return; }
  j = sl ? 7 : 5.2;
  b.own = -1; b.last = p.i; b.nop[o.i] = 0.4; b.shot = null; b.z = BR + 0.01;
  b.vx = (sl ? p.ax : dx / d) * j + (m.r() - 0.5) * 2.4; b.vy = (sl ? p.ay : dy / d) * j + (m.r() - 0.5) * 2.4; b.vz = 0.8 + m.r() * 1.6;
  o.wind = -1; act(o, "stumble", 0.3); p.stats.tackles++; m.emit("tackle", {by: p.i});
};
// one player for one tick: action timers, steering, stamina, facing
M.move = function(p, dt, frz){
  var m = this, b = m.b, inp = p.inp, has = b.own === p.i, mx = frz ? 0 : inp.mx, my = frz ? 0 : inp.my, l = hyp(mx, my), a = p.act, u, sprint, top, acc = 30, tvx, tvy, s, n, dvx, dvy, dv, sp, want, bx, by;
  if (l > 1) { mx /= l; my /= l; l = 1; }
  p.prot = Math.max(0, p.prot - dt); p.legs = Math.max(0, p.legs - dt);
  if (p.stam < 0) p.stam = 0;
  if (p.z > 0 || p.vz > 0) { p.vz -= 15 * dt; p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; p.vz = 0; } }
  sprint = !frz && inp.sp && !p.tired && l > 0.2;
  top = maxSpd(m, p, sprint); tvx = mx * top; tvy = my * top;
  p.jock = !frz && !has && inp.b && a === "" ? 1 : 0;
  if (p.jock) { tvx *= 0.78; tvy *= 0.78; acc = 40; }
  if (a) {
    p.at += dt; u = p.at / p.ad;
    if (a === "wind") {
      if (frz) { p.act = ""; p.wind = -1; }
      else {
        p.wind += dt; tvx *= 0.12; tvy *= 0.12;
        p.aimX = mx > 0.4 ? 1 : mx < -0.4 ? -1 : 0; p.aimH = my < -0.4 ? 1 : my > 0.4 ? -1 : 0;
        if (p.wind >= TF * 1.25) m.shoot(p, p.wind);
      }
    }
    else if (a === "cut") { if (p.at < 0.16) { tvx = p.ax * 7.4; tvy = p.ay * 7.4; acc = 90; } }
    else if (a === "drag") { if (p.at < 0.2) { tvx = p.ax * 6; tvy = p.ay * 6; acc = 80; } else { tvx *= 0.4; tvy *= 0.4; } }
    else if (a === "burst") {
      if (l > 0.3) { p.ax = lerp(p.ax, mx / l, 4 * dt); p.ay = lerp(p.ay, my / l, 4 * dt); n = hyp(p.ax, p.ay) || 1; p.ax /= n; p.ay /= n; }
      s = lerp(9.6, top, u); tvx = p.ax * s; tvy = p.ay * s; acc = 70;
    }
    else if (a === "spin") { s = p.sa + p.sd * Math.sin(PI * Math.min(1, u)) * 1.1; tvx = Math.cos(s) * 6.4; tvy = Math.sin(s) * 6.4; acc = 90; }
    else if (a === "megs") { s = Math.cos(PI * Math.min(1, u * 1.2)) * 4.2 * p.sd; tvx = p.ax * 6.6 - p.ay * s; tvy = p.ay * 6.6 + p.ax * s; acc = 90; }
    else if (a === "tackle") { if (p.at < 0.12) { tvx = p.ax * 4.2; tvy = p.ay * 4.2; acc = 70; } else { tvx *= 0.25; tvy *= 0.25; } m.tackle(p); }
    else if (a === "slide") { s = p.at < 0.36 ? lerp(7.6, 3, p.at / 0.36) : 0; tvx = p.ax * s; tvy = p.ay * s; acc = 60; if (p.at < 0.4) m.tackle(p); }
    else if (a === "lunge") { s = p.at < 0.26 ? 6.2 + 0.15 * (p.st.block - 5) : 0; tvx = p.ax * s; tvy = p.ay * s; acc = 70; }
    else if (a === "jump") { tvx *= 0.3; tvy *= 0.3; }
    else { tvx = 0; tvy = 0; }
    if (p.act === a && a !== "wind" && p.at >= p.ad) p.act = "";
  }
  dvx = tvx - p.vx; dvy = tvy - p.vy; dv = hyp(dvx, dvy); s = acc * dt;
  if (dv > s) { dvx *= s / dv; dvy *= s / dv; }
  p.vx += dvx; p.vy += dvy;
  p.x = clamp(p.x + p.vx * dt, -W + PR, W - PR); p.y = clamp(p.y + p.vy * dt, 0.3, D - PR);
  sp = hyp(p.vx, p.vy); p.stride += sp * dt;
  if (sprint && sp > 5) p.stam = Math.max(0, p.stam - 0.2 * dt); else p.stam = Math.min(1, p.stam + (sp < 1 ? 0.2 : 0.11) * dt);
  if (p.stam <= 0.02) p.tired = 1; else if (p.stam > 0.3) p.tired = 0;
  a = p.act; bx = b.x - p.x; by = b.y - p.y; want = p.fa;
  if (a === "spin") { p.fa = wrap(p.fa + p.sd * 14.3 * dt); return; }
  if (a === "wind" || a === "kick" || a === "fake") want = Math.atan2(-p.y, p.aimX * (GW - 0.4) - p.x);
  else if (a === "tackle" || a === "slide" || a === "lunge") want = Math.atan2(p.ay, p.ax);
  else if (a === "drag" || a === "megged" || a === "stumble" || a === "celebrate" || a === "sad" || a === "jump") want = p.fa;
  else if (has || a === "megs" || a === "burst" || a === "cut" || (sp > 4.8 && !p.jock)) { if (sp > 0.5) want = Math.atan2(p.vy, p.vx); }
  else if (hyp(bx, by) > 0.3) want = Math.atan2(by, bx);
  p.fa = wrap(p.fa + clamp(wrap(want - p.fa), -15 * dt, 15 * dt));
};
M.collide = function(){
  var a = this.p[0], c = this.p[1], dx = c.x - a.x, dy = c.y - a.y, d = hyp(dx, dy), k;
  if (d >= PR * 2 || d < 0.001 || a.act === "megs" || c.act === "megs" || a.act === "spin" || c.act === "spin") return;
  k = (PR * 2 - d) / 2 / d; a.x -= dx * k; a.y -= dy * k; c.x += dx * k; c.y += dy * k;
};

// ---- ball ----
M.ball = function(dt){
  var m = this, b = m.b, n, i, h;
  b.nop[0] -= dt; b.nop[1] -= dt;
  if (b.own >= 0) { m.carry(dt); return; }
  n = Math.max(1, Math.ceil(Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz) * dt / 0.07)); h = dt / n;
  for (i = 0; i < n && b.own < 0; i++) m.bstep(h, 9.8 * m.cfg.grav);
};
// the ball at a dribbler's feet
M.carry = function(dt){
  var m = this, b = m.b, p = m.p[b.own], a = p.act, reach = a === "burst" ? 0.95 : a === "drag" ? 0.28 : a === "wind" ? 0.42 : 0.52, tx, ty, u, k = Math.min(1, 22 * dt), ox = b.x, oy = b.y;
  if (a === "megs") { u = Math.min(1, p.at / 0.4); u = 1 - (1 - u) * (1 - u); tx = lerp(p.mx0, p.mx1, u); ty = lerp(p.my0, p.my1, u); k = 1; }
  else { tx = p.x + Math.cos(p.fa) * reach; ty = p.y + Math.sin(p.fa) * reach; }
  b.x = clamp(b.x + (tx - b.x) * k, -W + BR, W - BR); b.y = Math.min(b.y + (ty - b.y) * k, D - BR); b.z = BR; b.vz = 0;
  if (b.y < BR && Math.abs(b.x) > GW - BR) b.y = BR;
  b.vx = (b.x - ox) / dt; b.vy = (b.y - oy) / dt;
  if (b.y < -BR && m.phase === "live") { b.own = -1; b.net = 1; b.vx *= 0.3; b.vy = -3.5; b.shot = null; b.last = p.i; m.goal(); }
};
// one small step of a free ball: flight or roll, ground, goal frame, end wall, net, cage walls, bodies
M.bstep = function(h, g){
  var m = this, b = m.b, c = m.cfg, e = 0.72, R = BR + 0.06, s, dx, dy, dz, d, vn, inG;
  if (b.z > BR + 0.003 || Math.abs(b.vz) > 0.3) fly(b, h, g);
  else {
    b.z = BR; b.vz = 0; d = hyp(b.vx, b.vy);
    if (d > 0.02) { s = Math.max(0, d - (b.net ? 8 : 1.2) * h) / d; b.vx *= s; b.vy *= s; b.x += b.vx * h; b.y += b.vy * h; }
  }
  b.spin *= 1 - 0.6 * h;
  if (b.z < BR) {
    b.z = BR;
    if (b.vz < -1) { if (b.vz < -2.2) m.emit("bounce", {v: -b.vz}); b.vz = -b.vz * 0.62 * c.boun; b.vx *= 0.86; b.vy *= 0.86; }
    else b.vz = 0;
  }
  if (b.y < 0.6 && b.y > -0.4) {   // posts, then crossbar
    for (s = -1; s <= 1; s += 2) {
      dx = b.x - s * GW; dy = b.y; d = hyp(dx, dy);
      if (d < R && d > 0.0001 && b.z < GH + 0.05) {
        vn = (b.vx * dx + b.vy * dy) / d;
        if (vn < 0) { b.vx -= (1 + e) * vn * dx / d; b.vy -= (1 + e) * vn * dy / d; m.emit("post", {v: -vn}); if (b.shot) b.shot.hit = "post"; }
        b.x = s * GW + dx / d * R; b.y = dy / d * R;
      }
    }
    dy = b.y; dz = b.z - GH; d = hyp(dy, dz);
    if (d < R && d > 0.0001 && Math.abs(b.x) < GW) {
      vn = (b.vy * dy + b.vz * dz) / d;
      if (vn < 0) { b.vy -= (1 + e) * vn * dy / d; b.vz -= (1 + e) * vn * dz / d; m.emit("post", {v: -vn, bar: 1}); if (b.shot) b.shot.hit = "bar"; }
      b.y = dy / d * R; b.z = GH + dz / d * R;
    }
  }
  inG = Math.abs(b.x) < GW && b.z < GH;
  if (!b.net) {
    if (b.y < 0 && inG) b.net = 1;
    else if (b.y < BR && !inG) { b.y = BR; if (b.vy < 0) { m.emit("wall", {v: -b.vy}); b.vy *= -e; b.vx *= 0.94; } }
  }
  if (b.net) {   // inside the goal: the net soaks the ball up
    if (b.y < -GD + BR) { b.y = -GD + BR; if (b.vy < 0) { m.emit("net", {x: b.x, z: b.z, v: -b.vy, f: 0}); b.vy *= -0.12; b.vx *= 0.4; b.vz *= 0.4; } }
    if (Math.abs(b.x) > GW - BR) { s = b.x > 0 ? 1 : -1; b.x = s * (GW - BR); if (b.vx * s > 0) { m.emit("net", {x: b.x, z: b.z, v: b.vx * s, f: s}); b.vx *= -0.12; b.vy *= 0.5; } }
    if (b.z > GH - BR) { b.z = GH - BR; if (b.vz > 0) { m.emit("net", {x: b.x, z: b.z, v: b.vz, f: 2}); b.vz *= -0.1; } }
    if (!b.inGoal && b.y < -BR) { if (m.phase === "live") m.goal(); else b.inGoal = true; }
    if (b.y > 0.05) b.net = 0;
  }
  if (Math.abs(b.x) > W - BR) { s = b.x > 0 ? 1 : -1; b.x = s * (W - BR); if (b.vx * s > 0) { m.emit("wall", {v: b.vx * s}); b.vx *= -e; b.vy *= 0.94; } }
  if (b.y > D - BR) { b.y = D - BR; if (b.vy > 0) { m.emit("wall", {v: b.vy}); b.vy *= -e; b.vx *= 0.94; } }
  m.body();
};
// free ball against bodies: blocks, deflections, and shots that go through open legs
M.body = function(){
  var m = this, b = m.b, i, p, a, R, H, dx, dy, d, rvx, rvy, rel, nx, ny, vn;
  for (i = 0; i < 2; i++) {
    p = m.p[i]; a = p.act;
    if (b.nop[i] > 0) continue;
    R = a === "slide" || a === "lunge" ? 0.7 + 0.02 * (p.st.block - 5) : a === "tackle" ? 0.48 : 0.34;
    H = a === "slide" || a === "stumble" ? 0.6 : a === "lunge" ? 1.4 : (a === "jump" ? 2.35 : 1.78) + p.z;
    dx = b.x - p.x; dy = b.y - p.y; d = hyp(dx, dy);
    if (d >= R + BR || b.z > H || b.z < p.z - 0.05) continue;
    rvx = b.vx - p.vx; rvy = b.vy - p.vy; rel = hyp(rvx, rvy);
    if (rel < 0.5) continue;
    if (p.legs > 0 && a !== "slide" && b.z < 0.38 && rel > 6 && Math.abs(dx * rvy - dy * rvx) / rel < 0.17) {
      if (b.shot && !b.shot.megs) { b.shot.megs = 1; m.emit("legs", {by: b.shot.by}); }
      b.nop[i] = 0.3; continue;
    }
    if (ctl(p) && b.z < 0.95 && rel < 10.5) continue;   // slow enough to bring under control: pick() takes it
    nx = d > 0.001 ? dx / d : 0; ny = d > 0.001 ? dy / d : 1; vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; b.vz = b.vz * 0.5 + rel * 0.12 * m.r(); b.spin = 0; b.last = i;
      if (b.shot && b.shot.by !== i && !b.shot.blk) { b.shot.blk = 1; p.stats.blocks++; m.emit("block", {by: i, v: rel}); }
      else m.emit("thud", {v: rel});
    }
    b.x = p.x + nx * (R + BR + 0.01); b.y = p.y + ny * (R + BR + 0.01);
  }
};
M.pick = function(){
  var m = this, b = m.b, i, p, d, best = -1, bd = 9;
  if (b.own >= 0 || b.inGoal || b.net) return;
  for (i = 0; i < 2; i++) {
    p = m.p[i];
    if (b.nop[i] > 0 || !ctl(p)) continue;
    d = hyp(b.x - p.x, b.y - p.y);
    if (d < 0.8 && d < bd && b.z < 0.95 && hyp(b.vx - p.vx, b.vy - p.vy) < 10.5) { best = i; bd = d; }
  }
  if (best >= 0) m.gain(best);
};
M.gain = function(i){
  var m = this, b = m.b, p = m.p[i];
  if (b.shot && b.shot.by !== i) { p.stats.blocks++; m.emit("save", {by: i}); }
  b.shot = null; b.own = i; b.last = i; b.spin = 0; b.vz = 0; p.prot = 0.3;
  if (m.poss !== i) { m.poss = i; m.sc = m.cfg.sc; } else if (m.sc < 5) m.sc = 5;
  if (i === m.off) m.need = -1;
  else { if (m.need !== i) m.emit("turn", {by: i}); m.need = i; }
};
M.goal = function(){
  var m = this, b = m.b, c = m.cfg, s = b.shot, by = m.off, bad = m.need >= 0 && b.last === m.need ? 1 : 0, pts = s && s.by === by && s.two ? 2 : 1, p = m.p[by], o = m.p[1 - by];
  b.inGoal = true; b.shot = null; m.pt = 0;
  if (!bad && c.far && pts < 2) bad = 2;
  if (bad) { m.phase = "dead"; m.next = bad === 2 ? 1 - by : by; m.emit("nogoal", {why: bad}); return; }
  m.score[by] += pts; p.stats.goals++; if (pts === 2) p.stats.twos++; p.heat++; o.heat = 0;
  m.phase = "goal"; m.next = c.take ? by : 1 - by;
  if (c.golden || (c.target && m.score[by] >= c.target)) m.win = by;
  act(p, "celebrate", 9); act(o, "sad", 9); p.wind = -1; o.wind = -1;
  m.emit("goal", {by: by, pts: pts, q: s ? s.q : 0, megs: s ? s.megs : 0, hit: s ? s.hit : "", vol: s && s.vol ? 1 : 0, own: b.last !== by, top: b.z > 1.4, wide: Math.abs(b.x) > GW - 0.5, x: b.x, z: b.z});
};
// advance the match by one tick of DT
M.step = function(){
  var m = this, dt = DT, b = m.b, c = m.cfg, i, p, live = m.phase === "live";
  m.t += dt; m.pt += dt;
  if (m.phase === "check") {
    for (i = 0; i < 2; i++) cp(m.p[i].prev, m.p[i].inp);
    m.carry(dt);
    if (m.pt > 1.1) { m.phase = "live"; m.emit("go", {}); }
    return;
  }
  if (live) for (i = 0; i < 2; i++) { p = m.p[i]; if (p.ai) think(m, p); m.press(p); }
  for (i = 0; i < 2; i++) m.move(m.p[i], dt, !live);
  m.collide(); m.ball(dt);
  for (i = 0; i < 2; i++) cp(m.p[i].prev, m.p[i].inp);
  if (m.phase === "live") {
    m.pick();
    if (b.own >= 0) {
      m.p[b.own].stats.poss += dt;
      if (m.need === b.own && hyp(b.x, b.y) > ARC + 0.15) { m.off = b.own; m.need = -1; m.emit("live", {by: m.off}); }
    }
    if (b.shot && b.own < 0 && b.z <= BR + 0.01 && hyp(b.vx, b.vy) < 2.5) b.shot = null;
    if (c.sc) { m.sc -= dt; if (m.sc <= 0 && !b.shot) { m.emit("clock", {by: m.poss}); m.phase = "dead"; m.pt = 0; m.next = 1 - m.poss; return; } }
    if (c.clock) {
      m.left -= dt;
      if (m.left <= 0 && !b.shot) {
        m.left = 0;
        if (m.score[0] !== m.score[1]) { m.win = m.score[0] > m.score[1] ? 0 : 1; m.phase = "over"; m.emit("over", {win: m.win}); }
        else if (!c.golden) { c.golden = true; m.emit("golden", {}); }
      }
    }
  }
  else if (m.phase === "goal") { if (m.pt > 2.4) { if (m.win >= 0) { m.phase = "over"; m.emit("over", {win: m.win}); } else m.check(m.next); } }
  else if (m.phase === "dead") { if (m.pt > 1.3) m.check(m.next); }
};

// ---- rival AI: it only presses the same buttons a player has ----
function go(p, inp, tx, ty, sp){
  var dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy), s = Math.min(1, d / 0.5);
  if (d > 0.06) { inp.mx = dx / d * s; inp.my = dy / d * s; }
  inp.sp = sp && d > 1.2 ? 1 : 0;
  return d;
}
function megOpen(o){ return o.act !== "slide" && (o.legs > 0 || o.z > 0.05 || (hyp(o.vx, o.vy) > 3.9 && !o.jock)); }
// how clear the best shooting lane is (metres between the defender and the line to a target)
function lanes(m, p, o){
  var b = m.b, best = {s: 0, c: -9}, s, c, down = o.act === "stumble" || o.act === "megged" || (o.act === "slide" && o.at > 0.3);
  for (s = -1; s <= 1; s++) {
    c = down || o.y > b.y ? 5 : segDist(o.x, o.y, b.x, b.y, s * (GW - 0.36), 0) - (o.act === "lunge" ? 0.4 : 0) + (s ? 0.04 : 0);
    if (c > best.c) { best.c = c; best.s = s; }
  }
  return best;
}
function block(m, p, a, inp, o, dist){
  var b = m.b, r = m.r, read = r() < 0.3 + 0.6 * a.t, tx = read ? m.aim(o, o.aimX) : r() < 0.5 ? 0 : (r() < 0.5 ? -1 : 1) * (GW - 0.36), lx = tx - b.x, ly = -b.y, l = hyp(lx, ly) || 1, off = ((p.x - b.x) * ly - (p.y - b.y) * lx) / l, k;
  inp.mx = inp.my = 0;
  if (Math.abs(off) < 0.45 || dist < 1.2) { if (dist < 1.7 || (read && o.aimH > 0)) inp.sh = 1; }
  else { k = off > 0 ? 1 : -1; inp.mx = -k * ly / l; inp.my = k * lx / l; inp.sh = 1; }
}
function think(m, p){
  var a = p.ai, b = m.b, o = m.p[1 - p.i], inp = p.inp, r = m.r, t = m.t, has = b.own === p.i, dx = o.x - p.x, dy = o.y - p.y, dd = hyp(dx, dy), d = hyp(b.x, b.y), k, u, tx, ty, ln, down, dist, need, sx, sy, gd, gap, qx;
  inp.mx = inp.my = inp.sp = inp.sh = inp.a = inp.b = inp.c = inp.d = 0;
  if (a.pass) { u = d || 1; go(p, inp, b.x - b.x / u * 2.5, Math.max(0.8, b.y - b.y / u * 2.5), 0); inp.b = 1; return; }
  if (b.own !== o.i) a.w = 0;
  if (has) {
    if (p.act === "wind") { inp.sh = p.wind < a.rel ? 1 : 0; inp.mx = a.aimX; inp.my = -a.aimH; return; }
    down = o.act === "stumble" || o.act === "megged" || (o.act === "slide" && o.at > 0.25) || (o.act === "lunge" && o.at > 0.15) || (o.act === "tackle" && o.at > 0.25) || o.z > 0.15;
    if (m.need === p.i) {   // won it back: take it out past the arc
      u = hyp(p.x, p.y) || 1;
      go(p, inp, clamp(p.x / u * (ARC + 1.5) + (o.x > p.x ? -2 : 2), -W + 1, W - 1), clamp(p.y / u * (ARC + 1.5) + 1, 2, D - 1), dd < 4);
      if (p.act === "" && dd < 1.5 && o.act === "tackle" && o.at < 0.1 && r() < a.skill) inp.a = 1;
      return;
    }
    ln = lanes(m, p, o);
    a.dec -= DT;
    if (a.dec <= 0) { a.dec = 0.5 + r() * 0.7; a.side = o.x > p.x ? -1 : 1; if (Math.abs(p.x) > 6 && (p.x > 0 ? 1 : -1) === a.side) a.side = -a.side; }
    if (p.act === "") {
      need = 0.66 - 0.16 * a.t;
      if ((ln.c > need && d < a.range && (d < 6.2 || r() < 1.2 * DT)) || m.sc < 1.5 || (down && d < 8.5 && ln.c > 0.45)) {
        a.aimX = ln.s; a.aimH = dd < 2.4 && ln.c < need && d > 3.5 ? 1 : r() < 0.3 ? -1 : 0; a.rel = Math.max(0.2, TF * (GC + gauss(r) * a.err)); inp.sh = 1; return;
      }
      if (a.fk && t > a.fk) { a.fk = 0; if (o.z > 0.1 || o.act === "lunge") inp.c = 1; }
      else if (dd < 1.5 && o.act === "tackle" && o.at < 0.06 && r() < a.skill * 0.8) { if (a.lv >= 3 && r() < 0.3) inp.d = 1; else inp.a = 1; }
      else if (dd < 2.3 && o.y < p.y + 0.4 && t > a.moveT) {
        a.moveT = t + lerp(1.5, 0.6, a.t) * (0.7 + 0.6 * r()); k = r();
        if (megOpen(o) && dd < 1.9 && k < a.skill * 0.7) inp.d = 1;
        else if (down) inp.c = 1;
        else if (k < 0.28) { a.rel = 0.04; a.aimX = a.aimH = 0; inp.sh = 1; a.fk = t + 0.3; return; }
        else if (k < 0.62) { a.side = -a.side; inp.a = 1; }
        else if (k < 0.8 && d > 5) inp.b = 1;
        else if (p.stam > 0.3) inp.c = 1;
      }
    }
    tx = clamp(p.x * 0.3, -1, 1) - p.x; ty = 1.8 - p.y; u = hyp(tx, ty) || 1; tx /= u; ty /= u;
    if (dd < 2.7 && o.y < p.y + 0.3 && !down) { qx = -ty * a.side; ty = ty * 0.5 + tx * a.side * 0.9; tx = tx * 0.5 + qx * 0.9; u = hyp(tx, ty) || 1; tx /= u; ty /= u; }
    inp.mx = tx; inp.my = ty; inp.sp = (down || o.y > p.y || m.sc < 4) && p.stam > 0.25 ? 1 : 0;
    return;
  }
  if (b.own < 0) {   // loose ball: go and get it, finish first time if it sits up
    k = clamp(hyp(b.x - p.x, b.y - p.y) / 7, 0, 0.5);
    go(p, inp, clamp(b.x + b.vx * k, -W + 0.4, W - 0.4), clamp(b.y + b.vy * k, 0.4, D - 0.4), 1);
    if (p.act === "" && m.off === p.i && m.need < 0 && hyp(b.x - p.x, b.y - p.y) < 0.95 && b.z < 1.5 && d < 7 && r() < a.skill * 0.25) inp.sh = 1;
    return;
  }
  // defending: stay between the ball and the goal, reacting to where the ball was a moment ago
  a.hist.push(b.x, b.y); k = Math.max(1, Math.round(a.react / DT)) * 2;
  while (a.hist.length > k) a.hist.splice(0, 2);
  sx = a.hist[0]; sy = a.hist[1]; gd = hyp(sx, sy) || 1;
  gap = Math.min(clamp(1.15 + 0.17 * (gd - 4), 1.1, 2.8) + (1 - a.t) * 0.45, gd * 0.75);
  dist = hyp(b.x - p.x, b.y - p.y);
  k = go(p, inp, sx - sx / gd * gap, Math.max(0.7, sy - sy / gd * gap), 1);
  if (k < 1 && dist < 3.2) { inp.sp = 0; inp.b = 1; }
  if (p.act !== "") return;
  if (o.act === "wind" && !a.w) { a.w = 1; a.guess = r() < a.bite * clamp(3 - dist, 0.15, 1); a.wt = t + a.react + (a.guess ? 0 : 0.07); }
  if (a.w === 1 && t >= a.wt) { a.w = 2; if ((o.act === "wind" || a.guess) && dist < 2.8) { block(m, p, a, inp, o, dist); return; } }
  if (a.w && o.act !== "wind" && o.act !== "fake" && !(a.w === 1 && a.guess)) a.w = 0;
  k = o.act === "burst" || o.act === "wind" || (o.act === "drag" && o.at > 0.16) ? 3.5 : 1;
  if (dist < 1.02 && r() < a.tack * DT * k * (o.prot > 0 && r() < a.skill ? 0.1 : 1)) inp.a = 1;
  else if (o.act === "wind" && dist > 1.3 && dist < 2.4 && r() < a.skill * 2 * DT) { inp.mx = (b.x - p.x) / dist; inp.my = (b.y - p.y) / dist; inp.c = 1; }
}
MG.Match = Match;
})();
