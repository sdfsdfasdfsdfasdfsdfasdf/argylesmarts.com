// MEGS team football: 5 a side on a big pitch. Engine (players, ball, keepers, passing, rules, clock) and a broadcast-camera view.
// Pitch: x runs along the length from 0 to L, y across from -H to H. Team 0 attacks the goal at x = L, team 1 the goal at x = 0.
(function(){
"use strict";
var MG = window.MG, R = MG.R, DT = 1 / 60, PI = Math.PI, TAU = PI * 2, clamp = MG.clamp, lerp = MG.lerp, hyp = MG.hyp;
var L = 72, H = 22, GW = 3.4, GH = 2.35, GD = 1.8, BOXL = 14, BOXW = 11, SMALL = 5, BR = 0.11, SPOT = 10;
MG.TK = {L: L, H: H, GW: GW, GH: GH};
function gauss(r){ return (r() + r() + r() - 1.5) * 1.15; }
function wrap(a){ while (a > PI) a -= TAU; while (a < -PI) a += TAU; return a; }
// home spots for a 1-2-2 shape, attacking towards +x: [x share of the pitch, y share of the half width]
var SHAPE = [[0.03, 0], [0.22, -0.42], [0.22, 0.42], [0.47, -0.36], [0.47, 0.36]], ROLE = ["GK", "DEF", "DEF", "FWD", "FWD"];

// cfg: {half: real seconds per half, lv: [a, b] skill 0 to 10, mate: skill of a human side's team-mates, human: [bool, bool], names: [[5], [5]], seed, first}
function TeamMatch(cfg){
  var m = this, c = m.cfg = {half: 150, lv: [5, 5], mate: 6, human: [true, false], names: null, first: 0}, k, i, p, lv;
  for (k in cfg) c[k] = cfg[k];
  m.team = true; m.r = MG.rng(c.seed == null ? Math.floor(Math.random() * 1e9) : c.seed);
  m.p = []; m.ev = []; m.score = [0, 0]; m.half = 1; m.clock = 0; m.t = 0; m.inp = [{}, {}]; m.prev = [{}, {}]; m.ctl = [-1, -1]; m.ctlT = [0, 0];
  m.stats = [0, 1].map(function(){ return {shots: 0, ont: 0, goals: 0, passes: 0, pok: 0, tackles: 0, saves: 0, poss: 0, perfect: 0, green: 0, blocks: 0}; });
  m.b = {x: L / 2, y: 0, z: BR, vx: 0, vy: 0, vz: 0, own: -1, last: -1, lt: -1, to: -1, shot: null, net: 0};
  for (i = 0; i < 10; i++) {
    k = i < 5 ? 0 : 1; lv = c.human[k] && i % 5 !== 0 ? c.mate : c.lv[k];
    p = {i: i, tm: k, role: i % 5, x: 0, y: 0, vx: 0, vy: 0, fa: k ? PI : 0, act: "", at: 0, ad: 0, ax: 1, ay: 0, stride: 0, jock: 0, wind: -1, legs: 0, prot: 0, stam: 1, nop: 0, grab: 0, hold: 0,
      lv: lv, sk: lv / 10, name: c.names ? c.names[k][i % 5] : "", num: [1, 4, 5, 9, 10][i % 5], ai: {t: 0, dec: 0, rx: 0, ry: 0, shotX: null, rel: 0, pass: 0, aim: 0}, aimX: 0, aimH: 0, stats: {}};
    m.p.push(p);
  }
  m.kickoff(c.first || 0);
}
var M = TeamMatch.prototype;
M.emit = function(k, o){ o = o || {}; o.k = k; this.ev.push(o); };
M.gx = function(tm){ return tm ? 0 : L; };            // the goal this team attacks
M.ox = function(tm){ return tm ? L : 0; };            // the goal this team defends
M.dir = function(tm){ return tm ? -1 : 1; };
M.home = function(p){
  var m = this, s = SHAPE[p.role], d = m.dir(p.tm), bx = m.b.x, att = m.poss() === p.tm, x, y;
  x = m.ox(p.tm) + d * s[0] * L; y = s[1] * H * (p.tm ? -1 : 1);
  if (p.role) {
    x += (bx - L / 2) * 0.45 + d * (att ? (p.role > 2 ? 10 : 6) : -3);
    y += (m.b.y - y) * (att ? 0.15 : 0.32);
  }
  return {x: clamp(x, 2, L - 2), y: clamp(y, -H + 2, H - 2)};
};
// who has the ball: a team index, or -1 when it is loose
M.poss = function(){ var b = this.b; return b.own >= 0 ? this.p[b.own].tm : b.lt >= 0 && b.to >= 0 ? b.lt : -1; };
M.place = function(kt){
  var m = this, i, p, h;
  for (i = 0; i < 10; i++) {
    p = m.p[i]; h = SHAPE[p.role];
    p.x = m.ox(p.tm) + m.dir(p.tm) * h[0] * L * 0.9; p.y = h[1] * H * (p.tm ? -1 : 1) * 0.9; if (p.role) p.x = p.tm ? Math.max(p.x, L / 2 + 1.5) : Math.min(p.x, L / 2 - 1.5);
    p.vx = p.vy = 0; p.fa = p.tm ? PI : 0; p.act = ""; p.wind = -1; p.nop = 0; p.grab = 0; p.hold = 0; p.ai.shotX = null;
  }
};
M.kickoff = function(kt){
  var m = this, b = m.b, k = m.p[kt * 5 + 3];
  m.place(kt);
  k.x = L / 2 - m.dir(kt) * 0.4; k.y = 0; k.fa = kt ? PI : 0;
  b.x = L / 2; b.y = 0; b.z = BR; b.vx = b.vy = b.vz = 0; b.own = k.i; b.last = k.i; b.lt = kt; b.to = -1; b.shot = null; b.net = 0;
  m.phase = "kick"; m.pt = 1.2; m.kt = kt; m.ctl[kt] = k.i; m.ctl[1 - kt] = (1 - kt) * 5 + 3;
  m.emit("check", {by: kt});
};
M.restart = function(kind, tm, x, y){
  var m = this, b = m.b, best = null, bd = 1e9, i, p, d;
  if (kind === "gk") { best = m.p[tm * 5]; x = m.ox(tm) + m.dir(tm) * 5.5; y = 0; }
  else for (i = tm * 5 + 1; i < tm * 5 + 5; i++) { p = m.p[i]; d = hyp(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } }
  best.x = x - m.dir(tm) * 0.4 * (kind === "gk" ? 0 : 1); best.y = y; best.vx = best.vy = 0;
  b.x = x; b.y = y; b.z = BR; b.vx = b.vy = b.vz = 0; b.own = best.i; b.last = best.i; b.lt = tm; b.to = -1; b.shot = null;
  best.fa = Math.atan2(-y * 0.5, m.dir(tm) * 3);
  for (i = 0; i < 10; i++) { p = m.p[i]; if (p.tm !== tm) { d = hyp(p.x - x, p.y - y); if (d < 5) { p.x = x + (p.x - x) / (d || 1) * 5; p.y = clamp(y + (p.y - y) / (d || 1) * 5, -H + 0.5, H - 0.5); p.x = clamp(p.x, 0.5, L - 0.5); } } }
  best.prot = 0.8; best.ai.must = kind === "gk" ? 1 : kind === "throw" ? 1 : 0;
  m.phase = "restart"; m.pt = 0.9; m.ctl[tm] = best.i;
  m.emit("out", {kind: kind, by: tm});
};

// ---- the step ----
M.step = function(){
  var m = this, dt = DT, b = m.b, i, p, live, pt;
  m.t += dt;
  if (m.phase === "over") { for (i = 0; i < 10; i++) m.move(m.p[i], dt, 1); return; }
  if (m.phase === "goal" || m.phase === "half") {
    m.pt -= dt; m.ball(dt); for (i = 0; i < 10; i++) m.move(m.p[i], dt, 1);
    if (m.pt <= 0) {
      if (m.phase === "half") m.kickoff(1 - m.cfg.first);
      else if (m.end) m.full(); else m.kickoff(m.next);
    }
    return;
  }
  if (m.phase === "kick" || m.phase === "restart") {
    m.pt -= dt; m.carry(m.p[b.own], dt);
    for (i = 0; i < 10; i++) { p = m.p[i]; if (i !== b.own) { m.think(p, dt, 1); m.move(p, dt, 0); } else { p.vx = p.vy = 0; } }
    if (m.pt <= 0) { pt = m.phase; m.phase = "live"; if (pt === "kick") m.emit("go"); }
    return;
  }
  m.clock += dt; pt = m.poss(); if (pt >= 0) m.stats[pt].poss += dt;
  if (m.clock >= m.cfg.half && (b.own >= 0 || hyp(b.vx, b.vy) < 6)) {
    if (m.half === 1) { m.half = 2; m.clock = 0; m.phase = "half"; m.pt = 3; m.emit("half"); return; }
    m.full(); return;
  }
  m.control(dt);
  for (i = 0; i < 10; i++) { p = m.p[i]; if (m.ctl[p.tm] === i && m.cfg.human[p.tm]) m.human(p, dt); else m.think(p, dt, 0); }
  for (i = 0; i < 10; i++) m.move(m.p[i], dt, 0);
  m.collide(); m.contest(dt); m.ball(dt); m.pick();
};
M.full = function(){ var m = this, w = m.score[0] > m.score[1] ? 0 : m.score[1] > m.score[0] ? 1 : -1; m.phase = "over"; m.win = w; m.emit("over", {win: w}); };

// which player each human side is steering: the man on the ball, the man a pass is going to, or whoever is quickest to the ball
M.control = function(dt){
  var m = this, b = m.b, tm, best, bd, i, p, d, cur, inp, pr, alt;
  for (tm = 0; tm < 2; tm++) {
    if (!m.cfg.human[tm]) continue;
    inp = m.inp[tm]; pr = m.prev[tm]; m.ctlT[tm] -= dt; cur = m.p[m.ctl[tm]] || m.p[tm * 5 + 3];
    if (b.own >= 0 && m.p[b.own].tm === tm && b.own % 5) { m.ctl[tm] = b.own; continue; }
    if (b.own < 0 && b.to >= 0 && m.p[b.to].tm === tm && b.to % 5) { m.ctl[tm] = b.to; m.ctlT[tm] = 0.5; continue; }
    best = null; bd = 1e9; alt = null;
    for (i = tm * 5 + 1; i < tm * 5 + 5; i++) { p = m.p[i]; d = hyp(p.x - b.x, p.y - b.y) + (m.ox(tm) - p.x) * m.dir(tm) * -0.1; if (d < bd) { alt = best; bd = d; best = p; } else if (!alt || d < hyp(alt.x - b.x, alt.y - b.y)) alt = p; }
    if (inp.c && !pr.c) { m.ctl[tm] = best === cur ? alt.i : best.i; m.ctlT[tm] = 1.2; continue; }
    if (m.ctlT[tm] <= 0 && best !== cur && hyp(cur.x - b.x, cur.y - b.y) - bd > 2.5) { m.ctl[tm] = best.i; m.ctlT[tm] = 0.6; }
    if (!(m.ctl[tm] % 5)) m.ctl[tm] = best.i;
  }
};

// ---- a human side's player ----
M.human = function(p, dt){
  var m = this, b = m.b, inp = m.inp[p.tm], pr = m.prev[p.tm], has = b.own === p.i, l = hyp(inp.mx || 0, inp.my || 0), sp = m.spd(p, has), x, y, o, d;
  // the camera looks across the pitch from the +y side: right on the keys is +x, up is towards the far touchline (-y)
  x = inp.mx || 0; y = inp.my || 0;
  if (l > 0.12) { p.tx = p.x + x / l * 5; p.ty = p.y + y / l * 5; p.tv = sp * Math.min(1, l); }
  else { p.tx = p.x; p.ty = p.y; p.tv = 0; }
  if (has && (p.act === "" || p.act === "wind")) {
    if (inp.sh) { if (p.wind < 0) { p.wind = 0; p.act = "wind"; p.at = 0; p.ad = 99; } p.wind += dt; if (p.wind > 3.5) m.shoot(p, m.sweep(p)); }
    else if (p.wind >= 0) m.shoot(p, m.sweep(p));
    else if (inp.a && !pr.a) m.pass(p, x, y, 0);
    else if (inp.d && !pr.d) m.pass(p, x, y, 1);
  } else if (!has) {
    p.wind = -1; if (p.act === "wind") p.act = "";
    if (inp.b && !pr.b && p.act === "") m.tackle(p);
  }
  pr.sh = inp.sh; pr.a = inp.a; pr.b = inp.b; pr.c = inp.c; pr.d = inp.d;
};
M.spd = function(p, has){ return (has ? 5.6 : 6.3) * (0.86 + 0.14 * p.sk) * (p.wind >= 0 ? 0.55 : 1) * (this.cfg.human[p.tm] && this.ctl[p.tm] === p.i ? 1.08 : 1); };

// ---- shooting: a marker sweeps across the aim bar while shoot is held; the goal is the green part ----
M.range = function(p){ var d = hyp(this.gx(p.tm) - this.b.x, this.b.y); return Math.max(GW + 0.8, d * 0.42); };
M.green = function(p){ return clamp((GW - 0.3) / this.range(p), 0.06, 0.85); };
M.sweep = function(p){ var u; if (p.ai.shotX != null && !(this.cfg.human[p.tm] && this.ctl[p.tm] === p.i)) return p.ai.shotX; u = p.wind / 0.62 % 2; return u < 1 ? -1 + 2 * u : 3 - 2 * u; };
M.meter = function(p){ return p.wind >= 0 && this.b.own === p.i ? {m: this.sweep(p) * (p.tm ? -1 : 1), gw: this.green(p)} : null; };
M.target = function(p){ var m = this; return {x: m.gx(p.tm), y: clamp(m.sweep(p) * m.range(p), -H, H), z: 1}; };
M.shoot = function(p, sx){
  var m = this, b = m.b, r = m.r, gx = m.gx(p.tm), gw = m.green(p), q = Math.abs(sx) >= gw * 0.62 && Math.abs(sx) <= gw * 0.96 ? 2 : Math.abs(sx) <= gw ? 1 : 0, ty = sx * m.range(p), d = hyp(gx - b.x, ty - b.y),
    v = (21 + 4 * p.sk) * (q === 2 ? 1.12 : 1), T, tz = 0.35 + r() * 1.25, err = (q === 2 ? 0.004 : 0.01 + 0.03 * (1 - p.sk)) * (q ? 1 : 1.6), a;
  if (q === 2) tz = 0.5 + r() * 1.3;
  a = Math.atan2(ty - b.y, gx - b.x) + gauss(r) * err; T = d / v;
  b.own = -1; b.last = p.i; b.lt = p.tm; b.to = -1; p.nop = 0.3; b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.z = BR + 0.02; b.vz = Math.max(0, (tz - b.z + 0.5 * 9.8 * T * T) / T);
  b.shot = {by: p.i, tm: p.tm, q: q, t: m.t}; p.wind = -1; p.ai.shotX = null; p.act = "kick"; p.at = 0; p.ad = 0.3;
  m.stats[p.tm].shots++; if (q) m.stats[p.tm].green++; if (q === 2) m.stats[p.tm].perfect++;
  m.emit("kick", {by: p.tm, pw: 1, q: q}); m.keeper(1 - p.tm);
};
// the keeper of a side reads a shot: when it will reach the line, where, and whether he can get there
M.keeper = function(tm){
  var m = this, b = m.b, k = m.p[tm * 5], gx = m.ox(tm), T, yc, zc;
  if (!b.vx || (gx - b.x) / b.vx <= 0) return;
  T = (gx - b.x) / b.vx; yc = b.y + b.vy * T; zc = b.z + b.vz * T - 4.9 * T * T;
  k.ai.dive = {t: m.t + 0.26 + 0.2 * (1 - k.sk) + m.r() * 0.14, y: clamp(yc, -GW - 0.3, GW + 0.3), z: zc, T: m.t + T};
};

// ---- passing: to the best-placed team-mate, leaning towards the direction held ----
M.option = function(p, x, y){
  var m = this, b = m.b, best = null, bs = -1e9, l = hyp(x, y), i, q, lx, ly, d, s, open, j, o, seg, f;
  for (i = p.tm * 5; i < p.tm * 5 + 5; i++) {
    q = m.p[i]; if (q === p) continue;
    lx = q.x + q.vx * 0.5 + m.dir(p.tm) * (q.role ? 1.5 : 0); ly = q.y + q.vy * 0.5; d = hyp(lx - b.x, ly - b.y);
    if (d < 2.5 || d > 38) continue;
    open = 9;
    for (j = (1 - p.tm) * 5; j < (1 - p.tm) * 5 + 5; j++) {
      o = m.p[j]; seg = segD(b.x, b.y, lx, ly, o.x, o.y); open = Math.min(open, seg * 1.4, hyp(o.x - lx, o.y - ly));
    }
    f = (lx - b.x) * m.dir(p.tm);
    s = open * (m.cfg.human[p.tm] ? 0.9 : 0.55) + f * 0.09 - d * 0.035 - (q.role ? 0 : 2.2);
    if (l > 0.3) s += 3.2 * ((lx - b.x) * x + (ly - b.y) * y) / (d * l) - 1;
    if (s > bs) { bs = s; best = {q: q, x: lx, y: ly, d: d, s: s, open: open}; }
  }
  return best;
};
function segD(ax, ay, bx, by, px, py){ var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0; return hyp(ax + dx * t - px, ay + dy * t - py); }
M.pass = function(p, x, y, lob){
  var m = this, b = m.b, o = m.option(p, x, y), r = m.r, d, v, a, e, T;
  if (!o) { if (lob) o = {q: null, x: clamp(b.x + m.dir(p.tm) * 22, 2, L - 2), y: b.y * 0.5, d: 22}; else return false; }
  e = (0.02 + 0.06 * (1 - p.sk)) * (o.d / 20 + 0.5); a = Math.atan2(o.y - b.y, o.x - b.x) + gauss(r) * e; d = o.d;
  b.own = -1; b.last = p.i; b.lt = p.tm; b.to = o.q ? o.q.i : -1; b.shot = null; p.nop = 0.25; b.z = BR + 0.01;
  if (lob || d > 26) { b.vz = 5.5 + d * 0.16; T = 2 * b.vz / 9.8; v = d / T * 0.98; }
  else { v = clamp(5 + d * 0.72, 8, 22); b.vz = 0; }
  b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; p.act = "kick"; p.at = 0; p.ad = 0.22; p.wind = -1;
  m.stats[p.tm].passes++; m.emit("pass", {by: p.tm, pw: 0.35}); m.emit("kick", {by: p.tm, pw: 0.35, q: 0});
  return true;
};
M.tackle = function(p){ p.act = "tackle"; p.at = 0; p.ad = 0.45; p.didT = 0; };

// ---- the computer's players ----
M.think = function(p, dt, frozen){
  var m = this, b = m.b, a = p.ai, sk = p.sk, has = b.own === p.i, att = m.poss() === p.tm, dir = m.dir(p.tm), gx = m.gx(p.tm), h, d, o, best, bd, i, q, tt, mine, dist;
  a.t -= dt;
  if (p.role === 0) return m.gk(p, dt, frozen);
  if (frozen) { h = m.home(p); go(p, h.x, h.y, 4); return; }
  if (has) {
    if (p.wind >= 0) { p.wind += dt; if (p.wind >= a.rel) m.shoot(p, a.shotX); go(p, p.x, p.y, 0); return; }
    d = hyp(gx - b.x, b.y); o = m.nearOpp(p, b.x, b.y);
    if (a.must) { a.must = 0; if (m.pass(p, 0, 0, 0)) return; }
    if (d < 13 + 10 * sk && Math.abs(b.y) < 16 && (d < 10 || m.lane(p) > 1.1 || m.r() < 0.05) && m.r() < (1.8 + 3 * sk) * dt * (d < 13 ? 3 : 1)) {
      a.shotX = clamp((m.p[(1 - p.tm) * 5].y > b.y ? -1 : 1) * m.green(p) * (0.45 + 0.35 * m.r()) + gauss(m.r) * (0.12 + 0.4 * (1 - sk)), -1, 1);
      a.rel = 0.25 + m.r() * 0.2; p.wind = 0; p.act = "wind"; p.at = 0; p.ad = 99; return;
    }
    if (a.t <= 0) {
      a.t = 0.3 + m.r() * 0.4;
      best = m.option(p, dir, 0);
      if (best && ((o.d < 2.6 && best.open > 1.6) || (best.s > 3 + 2 * m.r() && (best.x - b.x) * dir > 3) || m.r() < 0.1)) { m.pass(p, dir, 0, best.d > 24 ? 1 : 0); return; }
    }
    // dribble towards goal, stepping round the nearest opponent
    q = -b.y * 0.4;
    if (o.d < 4 && (o.x - p.x) * dir > -0.5) q += (o.y > p.y ? -1 : 1) * 6 * clamp(1.2 - o.d * 0.25, 0, 1);   // step round him
    tt = Math.atan2(q, dir * 6);
    if (Math.abs(p.y) > H - 3) tt = Math.atan2(-p.y, dir * 2);
    go(p, p.x + Math.cos(tt) * 5, p.y + Math.sin(tt) * 5, m.spd(p, 1));
    return;
  }
  // a pass on its way to me: go and meet it
  if (b.to === p.i && b.own < 0) { tt = Math.max(0.2, hyp(b.x - p.x, b.y - p.y) / 10); go(p, b.x + b.vx * tt * 0.6, b.y + b.vy * tt * 0.6, m.spd(p, 0)); return; }
  // loose ball: the quickest of each side goes for it
  if (b.own < 0) {
    best = m.chaser(p.tm);
    if (best === p) { tt = clamp(hyp(b.x - p.x, b.y - p.y) / 7, 0, 1.2); go(p, b.x + b.vx * tt * 0.5, b.y + b.vy * tt * 0.5, m.spd(p, 0)); return; }
  }
  h = m.home(p);
  if (att) {
    // make a run into space ahead of the ball
    if (p.role > 2) { h.x = clamp(b.x + dir * (8 + 4 * sk), 4, L - 4); if (Math.abs(h.x - gx) < 6) h.x = gx - dir * 6; h.y = (p.role === 3 ? -1 : 1) * (p.tm ? -1 : 1) * (7 + 3 * Math.sin(m.t * 0.4 + p.i)); }
    go(p, h.x, h.y, m.spd(p, 0) * 0.85);
    return;
  }
  // defending: the nearest man presses the ball, the next covers, the rest mark
  mine = m.order(p.tm);
  if (b.own >= 0 && mine[0] === p) {
    q = m.p[b.own]; d = hyp(q.x - p.x, q.y - p.y);
    // close in on the ball itself, from the goal side when he can
    d = hyp(b.x - p.x, b.y - p.y);
    go(p, b.x - dir * (d > 2 ? 0.8 : 0.2) + q.vx * 0.15, b.y + q.vy * 0.15, m.spd(p, 0));
    if (d < 1.1 && p.act === "" && m.t > (p.ai.tk || 0) && m.r() < (0.5 + 1.4 * sk) * dt) { m.tackle(p); p.ai.tk = m.t + 1.3; }
    return;
  }
  if (b.own >= 0 && mine[1] === p) { go(p, lerp(b.x, m.ox(p.tm), 0.3), lerp(b.y, 0, 0.3), m.spd(p, 0) * 0.9); return; }
  q = m.mark(p); if (q) { go(p, q.x - dir * 1.6, q.y * 0.92, m.spd(p, 0) * 0.9); return; }
  go(p, h.x, h.y, m.spd(p, 0) * 0.8);
};
// how clear the line from the ball to the middle of the goal is (distance to the nearest outfield opponent)
M.lane = function(p){ var m = this, b = m.b, gx = m.gx(p.tm), best = 9, i; for (i = (1 - p.tm) * 5 + 1; i < (1 - p.tm) * 5 + 5; i++) best = Math.min(best, segD(b.x, b.y, gx, 0, m.p[i].x, m.p[i].y)); return best; };
M.nearOpp = function(p, x, y){ var m = this, bd = 1e9, bo = null, i, o, d; for (i = (1 - p.tm) * 5; i < (1 - p.tm) * 5 + 5; i++) { o = m.p[i]; d = hyp(o.x - x, o.y - y); if (d < bd) { bd = d; bo = o; } } return {d: bd, x: bo.x, y: bo.y, p: bo}; };
M.chaser = function(tm){ var m = this, b = m.b, bd = 1e9, bp = null, i, p, d; for (i = tm * 5 + 1; i < tm * 5 + 5; i++) { p = m.p[i]; if (m.cfg.human[tm] && m.ctl[tm] === i) continue; d = hyp(p.x - b.x, p.y - b.y); if (d < bd) { bd = d; bp = p; } } return bp; };
M.order = function(tm){ var m = this, b = m.b, a = [], i; for (i = tm * 5 + 1; i < tm * 5 + 5; i++) if (!(m.cfg.human[tm] && m.ctl[tm] === i)) a.push(m.p[i]); return a.sort(function(x, y){ return hyp(x.x - b.x, x.y - b.y) - hyp(y.x - b.x, y.y - b.y); }); };
M.mark = function(p){ var m = this, bd = 1e9, bo = null, i, o, d; for (i = (1 - p.tm) * 5 + 1; i < (1 - p.tm) * 5 + 5; i++) { o = m.p[i]; if (o.i === m.b.own) continue; d = hyp(o.x - p.x, o.y - p.y) + Math.abs(o.x - m.ox(p.tm)) * 0.3; if (d < bd) { bd = d; bo = o; } } return bo; };
function go(p, x, y, v){ p.tx = clamp(x, 0.4, L - 0.4); p.ty = clamp(y, -H + 0.4, H - 0.4); p.tv = v; }

// ---- keepers ----
M.gk = function(p, dt, frozen){
  var m = this, b = m.b, gx = m.ox(p.tm), dir = m.dir(p.tm), a = p.ai, has = b.own === p.i, d, bx, o, near, ty;
  if (has) {
    p.hold += dt; go(p, p.x, p.y, 0);
    if (p.hold > 1.1 + m.r() * 0.6 && !frozen) { p.hold = 0; if (!m.pass(p, dir, 0, 0)) m.pass(p, dir, 0, 1); }
    return;
  }
  if (a.dive && m.t >= a.dive.t && m.t < a.dive.T + 0.3) {
    go(p, gx + dir * 0.6, a.dive.y, 5.6 + 2.6 * p.sk);
    if (p.act === "" && Math.abs(a.dive.y - p.y) > 0.8) { p.act = "lunge"; p.at = 0; p.ad = 0.6; p.ax = 0; p.ay = a.dive.y > p.y ? 1 : -1; }
    return;
  }
  if (a.dive && m.t > a.dive.T + 0.3) a.dive = null;
  d = hyp(b.x - gx, b.y); near = (b.x - gx) * dir;
  // come out for a loose ball in the box if he gets there first
  if (b.own < 0 && near < BOXL && Math.abs(b.y) < BOXW && hyp(b.vx, b.vy) < 9 && !b.shot) {
    o = m.chaser(1 - p.tm);
    if (!o || hyp(b.x - p.x, b.y - p.y) < hyp(b.x - o.x, b.y - o.y) + 1) { go(p, b.x, b.y, 6.5); return; }
  }
  ty = clamp(b.y * (0.18 + 0.12 * Math.min(1, 12 / Math.max(d, 1))), -GW + 0.5, GW - 0.5);
  bx = gx + dir * clamp(0.6 + (near < 22 ? (22 - near) * 0.06 : 0), 0.6, 1.8);
  go(p, bx, ty, 5);
};

// ---- movement ----
M.move = function(p, dt, idle){
  var m = this, tx = p.tx == null ? p.x : p.tx, ty = p.ty == null ? p.y : p.ty, v = idle ? 0 : p.tv || 0, dx = tx - p.x, dy = ty - p.y, d = hyp(dx, dy), wx, wy, k, sp;
  if (p.act) { p.at += dt; if (p.at >= p.ad) { if (p.act === "tackle" && !p.didT) { p.act = "stumble"; p.at = 0; p.ad = 0.35; } else p.act = ""; } }
  if (p.act === "stumble") v = 0; else if (p.act === "tackle") v = Math.max(v, 7.2); else if (p.act === "lunge") v = 5.6 + 2.6 * p.sk;
  if (m.phase === "over" && p.cel) { v = 0; }
  if (d < 0.25) { wx = 0; wy = 0; } else { k = Math.min(v, d * 3.5) / d; wx = dx * k; wy = dy * k; }
  k = Math.min(1, dt * (p.act === "lunge" ? 14 : 9));
  p.vx += (wx - p.vx) * k; p.vy += (wy - p.vy) * k;
  p.x = clamp(p.x + p.vx * dt, -1, L + 1); p.y = clamp(p.y + p.vy * dt, -H - 1, H + 1);
  sp = hyp(p.vx, p.vy);
  if (sp > 0.3) { p.fa = wrap(p.fa + wrap(Math.atan2(p.vy, p.vx) - p.fa) * Math.min(1, dt * 10)); p.stride += sp * dt * 0.42; }
  else if (m.b.own < 0 || m.b.own !== p.i) p.fa += wrap(Math.atan2(m.b.y - p.y, m.b.x - p.x) - p.fa) * Math.min(1, dt * 4);
  if (p.nop > 0) p.nop -= dt; if (p.prot > 0) p.prot -= dt;
};
M.collide = function(){
  var m = this, i, j, a, c, dx, dy, d;
  for (i = 0; i < 10; i++) for (j = i + 1; j < 10; j++) {
    a = m.p[i]; c = m.p[j]; dx = c.x - a.x; dy = c.y - a.y; d = hyp(dx, dy);
    if (d < 0.7 && d > 0.001) { d = (0.7 - d) / d * 0.5; a.x -= dx * d; a.y -= dy * d; c.x += dx * d; c.y += dy * d; }
  }
};
// the ball at the feet of whoever has it
M.carry = function(p, dt){
  var b = this.b, k = Math.min(1, dt * 18), f = 0.48 + Math.min(0.25, hyp(p.vx, p.vy) * 0.03);
  b.x += (p.x + Math.cos(p.fa) * f - b.x) * k; b.y += (p.y + Math.sin(p.fa) * f - b.y) * k; b.z = BR; b.vx = p.vx; b.vy = p.vy; b.vz = 0;
};
// tackles and players walking into the ball
M.contest = function(dt){
  var m = this, b = m.b, o, i, p, d, w;
  if (b.own < 0) return;
  o = m.p[b.own];
  for (i = (1 - o.tm) * 5; i < (1 - o.tm) * 5 + 5; i++) {
    p = m.p[i]; d = hyp(b.x - p.x, b.y - p.y);
    if (p.act === "tackle" && !p.didT && p.at < 0.3 && d < 1.15) {
      // from in front or the side is a fair tackle; from behind it rarely comes off
      p.didT = 1; w = 0.46 + 0.25 * (p.sk - o.sk) + (o.wind >= 0 ? 0.2 : 0) - (o.prot > 0 ? 0.4 : 0) - ((p.x - o.x) * Math.cos(o.fa) + (p.y - o.y) * Math.sin(o.fa) < -0.2 ? 0.3 : 0);
      if (m.r() < w) { m.win(p, o); m.emit("tackle", {by: p.tm}); m.stats[p.tm].tackles++; return; }
      continue;
    }
    // walking into the ball only takes it off a carrier who is standing still or turning back
    if (p.act === "" && o.prot <= 0 && d < 0.5 && (hyp(o.vx, o.vy) < 2.5 || o.wind >= 0)) { p.grab += dt; if (p.grab > 0.3 + 0.45 * (1 - p.sk)) { p.grab = 0; m.win(p, o); m.emit("steal", {by: p.tm}); m.stats[p.tm].tackles++; return; } }
    else p.grab = 0;
  }
};
M.win = function(p, o){ var b = this.b; b.own = p.i; b.last = p.i; b.lt = p.tm; b.to = -1; b.shot = null; o.act = "stumble"; o.at = 0; o.ad = 0.5; o.wind = -1; o.ai.shotX = null; p.prot = 0.7; p.act = ""; p.ai.t = 0.2; };
M.pick = function(){
  var m = this, b = m.b, best = null, bd = 1e9, i, p, d, r;
  if (b.own >= 0) return;
  for (i = 0; i < 10; i++) {
    p = m.p[i]; if (p.nop > 0 || p.act === "stumble") continue;
    r = p.role === 0 && Math.abs(b.x - m.ox(p.tm)) < BOXL && Math.abs(b.y) < BOXW ? (p.act === "lunge" ? 1.25 : 0.9) : i === b.to ? 0.95 : b.to >= 0 && m.cfg.human[b.lt] && p.tm !== b.lt ? 0.38 : 0.6;   // a human's pass is hard to cut out
    d = hyp(b.x - p.x, b.y - p.y);
    if (d < r && b.z < (p.role === 0 ? 2.5 : 1.0) && d < bd) { bd = d; best = p; }
  }
  if (!best) return;
  // a keeper stopping a shot
  if (b.shot && b.shot.tm !== best.tm) {
    if (best.role === 0) {
      m.stats[best.tm].saves++; m.stats[b.shot.tm].ont++;
      if (hyp(b.vx, b.vy) > 17 && m.r() < 0.55) { b.vx = -b.vx * 0.35 + m.dir(best.tm) * 3; b.vy = (m.r() - 0.5) * 12; b.vz = 2 + m.r() * 3; best.nop = 0.5; b.shot = null; b.lt = best.tm; m.emit("save", {by: best.tm, parry: 1}); return; }
      m.emit("save", {by: best.tm});
    } else { if (b.z > 0.95 || m.r() < 0.55 || m.t - b.shot.t < 0.12) { best.nop = 0.15; return; }   // most shots squeeze past an outfield player
      m.stats[best.tm].blocks++; if (m.r() < 0.6) { b.vx *= -0.3; b.vy = (m.r() - 0.5) * 9; b.vz = 1 + m.r() * 2; best.nop = 0.3; b.shot = null; b.lt = best.tm; m.emit("block", {by: best.tm}); return; } m.emit("block", {by: best.tm}); }
  }
  if (b.to >= 0 && b.lt === best.tm && b.last !== best.i) m.stats[best.tm].pok++;
  b.own = best.i; b.last = best.i; b.lt = best.tm; b.to = -1; b.shot = null; best.prot = 0.35; best.wind = -1; best.hold = 0; best.ai.t = 0.15 + m.r() * 0.3;
};

// ---- the ball ----
M.ball = function(dt){
  var m = this, b = m.b, sp, n, gx, t;
  if (b.own >= 0) { m.carry(m.p[b.own], dt); m.lines(); return; }
  b.x += b.vx * dt; b.y += b.vy * dt;
  if (b.z > BR || b.vz > 0) { b.vz -= 9.8 * dt; b.z += b.vz * dt; if (b.z < BR) { b.z = BR; if (b.vz < -1.6) { m.emit("bounce", {v: -b.vz}); b.vz = -b.vz * 0.5; b.vx *= 0.88; b.vy *= 0.88; } else b.vz = 0; } }
  if (b.z <= BR + 0.001) { sp = hyp(b.vx, b.vy); if (sp > 0) { n = Math.max(0, sp - (1.5 + 0.32 * sp) * dt) / sp; b.vx *= n; b.vy *= n; } }
  else { b.vx *= 1 - 0.04 * dt; b.vy *= 1 - 0.04 * dt; }
  if (b.net) { m.netIn(); return; }
  m.lines();
};
// goals, posts, and the ball going out of play
M.lines = function(){
  var m = this, b = m.b, side, tm, inG;
  if (m.phase !== "live") return;
  side = b.x < 0 ? 0 : b.x > L ? 1 : -1;
  if (side >= 0) {
    // posts and crossbar
    if (Math.abs(Math.abs(b.y) - GW) < 0.2 && b.z < GH + 0.1 && b.own < 0 && Math.abs(b.x - (side ? L : 0)) < 0.35) { b.x = side ? L - 0.2 : 0.2; b.vx = -b.vx * 0.6; b.vy += (b.y > 0 ? 1 : -1) * Math.abs(b.vx) * 0.3; m.emit("post", {v: Math.abs(b.vx)}); return; }
    inG = Math.abs(b.y) < GW && b.z < GH;
    if (inG) { tm = side ? 0 : 1; m.goal(tm); return; }
    tm = side ? 1 : 0;   // the side defending this end
    if (b.lt === tm) m.restart("corner", 1 - tm, side ? L - 0.6 : 0.6, b.y > 0 ? H - 0.6 : -H + 0.6);
    else m.restart("gk", tm);
    return;
  }
  if (Math.abs(b.y) > H) m.restart("throw", 1 - (b.lt < 0 ? 0 : b.lt), clamp(b.x, 1, L - 1), b.y > 0 ? H - 0.3 : -H + 0.3);
};
M.netIn = function(){
  var b = this.b, gx = b.net === 2 ? L : 0, s = b.net === 2 ? 1 : -1;
  if ((b.x - gx) * s > GD) { b.x = gx + s * GD; b.vx *= -0.2; this.emit("net", {v: 4}); }
  if (Math.abs(b.y) > GW - 0.1) { b.y = (b.y > 0 ? 1 : -1) * (GW - 0.1); b.vy *= -0.3; }
  if (b.z > GH - 0.1) { b.z = GH - 0.1; b.vz = -Math.abs(b.vz) * 0.3; }
};
M.goal = function(tm){
  var m = this, b = m.b, s = b.shot, p = m.p[b.last];
  m.score[tm]++; m.stats[tm].goals++; if (s) m.stats[tm].ont++;
  b.net = tm ? 1 : 2; b.vx *= 0.4; b.shot = null;
  m.phase = "goal"; m.pt = 3.2; m.next = 1 - tm; m.end = 0;
  m.emit("goal", {by: tm, q: s ? s.q : 0, who: p && p.tm === tm ? p.name : "", own: p && p.tm !== tm, x: b.y, z: b.z, top: b.z > 1.6, wide: Math.abs(b.y) > GW - 0.8});
  m.emit("net", {v: 10});
  m.p.forEach(function(q){ q.cel = q.tm === tm ? 1 : 0; });
};

// ---- results, for the menus ----
M.result = function(){
  var m = this, s = m.stats, me = s[0], th = s[1];
  function conv(x){ return {shots: x.shots, goals: x.goals, twos: 0, perfect: x.perfect, green: x.green, megs: 0, ankles: 0, tackles: x.tackles, blocks: x.saves + x.blocks, poss: x.poss, passes: x.passes, pok: x.pok, saves: x.saves, ont: x.ont}; }
  return {win: m.win === 0, draw: m.win === -1, winner: m.win, sc: [m.score[0], m.score[1]], me: conv(me), them: conv(th), top: 0, t: m.t, team: 1};
};
M.clockText = function(){ var m = this, s = Math.min(45, m.clock / m.cfg.half * 45) + (m.half - 1) * 45, mm = Math.floor(s), ss = Math.floor((s - mm) * 60); return (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss; };
MG.TeamMatch = TeamMatch;

// =================== the view: a broadcast camera from the side of the pitch ===================
function TV(cv){
  var v = this, r = MG.rng(42), i, x, y, z, row;
  v.cv = cv; v.g = cv.getContext("2d"); v.w = 960; v.h = 540; v.dpr = 1; v.t = 0; v.sides = [[], []];
  v.cam = {x: L / 2, y: H + 27, z: 23, a: 0.46, f: 1300};
  v.parts = []; v.pops = []; v.pts = R.ico(); v.flash = 0; v.shake = 0; v.stick = [];
  v.o = {names: 1, rings: 1, meter: 1, aim: 1, pops: 1, fx: 1, shake: 1, flash: 1, cb: 0, aura: 1, trail: 1, zoom: 0};
  // the crowd: dots on the stand along the far touchline and behind each goal
  v.crowd = [];
  for (row = 0; row < 14; row++) for (i = 0; i < 70; i++) { x = -6 + (L + 12) * (i + r() * 0.8) / 70; y = -(H + 5 + row * 1.6); z = 0.8 + row * 0.95; v.crowd.push([x, y, z, ["#e6705e", "#f2f2f7", "#3b6ef5", "#ffd23b", "#5ee6a8", "#ff8ad1", "#2b2d36"][Math.floor(r() * 7)], r() * 6]); }
}
var V = TV.prototype;
V.resize = function(){
  var v = this, cv = v.cv, d = Math.min(2, window.devicePixelRatio || 1), w = Math.max(240, cv.clientWidth || 960), h = Math.max(150, cv.clientHeight || 540);
  if (v.w !== w || v.h !== h || v.dpr !== d || cv.width !== Math.round(w * d)) { v.w = w; v.h = h; v.dpr = d; cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
};
// o: {sides: [[5 sides], [5 sides]], ball, home (colour for the side's marker), names}
V.set = function(o){
  var v = this;
  v.ball = MG.ITEM[o.ball] || MG.ITEM.classic; v.sides = o.sides.map(function(t){ return t.map(function(s){ return R.side(s); }); }); v.ring = o.ring || ["#3b6ef5", "#ff5d7a"];
  v.parts.length = v.pops.length = 0; v.cam.x = L / 2; v.flash = v.shake = 0; v.stick = [];
};
V.pr = function(x, y, z){
  var c = this.cam, dx = x - c.x, dy = c.y - y, dz = z - c.z, ca = Math.cos(c.a), sa = Math.sin(c.a), d = dy * ca - dz * sa, u = dy * sa + dz * ca, f = c.f * this.w / 960 * (1 + 0.25 * this.o.zoom), s;
  d = Math.max(0.5, d); s = f / d;
  return {x: this.w / 2 + dx * s, y: this.h * 0.47 - u * s, s: s, d: d};
};
V.poly = function(a, col){ var v = this, g = v.g, i, q; g.fillStyle = col; g.beginPath(); for (i = 0; i < a.length; i += 3) { q = v.pr(a[i], a[i + 1], a[i + 2]); g.lineTo(q.x, q.y); } g.closePath(); g.fill(); };
V.line = function(a, w, col, al){ var v = this, g = v.g, i, q, s = 0; g.strokeStyle = col; g.globalAlpha = al == null ? 1 : al; g.beginPath(); for (i = 0; i < a.length; i += 3) { q = v.pr(a[i], a[i + 1], a[i + 2]); s += q.s; g.lineTo(q.x, q.y); } g.lineWidth = Math.max(1, w * s / (a.length / 3)); g.stroke(); g.globalAlpha = 1; };
V.event = function(m, e){
  var v = this, b = m.b, k = e.k, i;
  if (k === "goal") {
    v.flash = 0.55; v.shake = 0.5;
    for (i = 0; i < 140 * v.o.fx; i++) v.parts.push({x: b.x, y: b.y, z: 1 + Math.random() * 2, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.5) * 9, vz: 4 + Math.random() * 8, l: 2.5 + Math.random(), m: 3.5, c: ["#ffd23b", "#ff4f7a", "#5ee6a8", "#5ee6ff", "#ffffff"][i % 5], s: 0.12});
    v.pop(b.x, b.y, 3, "GOAL!", "#ffd23b", 1);
  }
  else if (k === "save") v.pop(b.x, b.y, 2.6, e.parry ? "PARRIED" : "SAVED", "#7fd0ff", 0);
  else if (k === "tackle" || k === "steal") v.pop(b.x, b.y, 2.4, k === "tackle" ? "TACKLE" : "STOLEN", "#d6ff3b", 0);
  else if (k === "block") v.pop(b.x, b.y, 2.4, "BLOCKED", "#ffffff", 0);
  else if (k === "post") { v.pop(b.x, b.y, 2.6, "POST!", "#ffffff", 0); v.shake = 0.2; }
  else if (k === "kick" && e.pw > 0.8) { v.shake = Math.max(v.shake, 0.12); for (i = 0; i < 8; i++) v.parts.push({x: b.x, y: b.y, z: 0.1, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, vz: 1 + Math.random() * 2, l: 0.5, m: 0.5, c: "#cfe6c0", s: 0.06}); }
};
V.pop = function(x, y, z, txt, col, big){ if (this.o.pops) this.pops.push({x: x, y: y, z: z, txt: txt, col: col, l: big ? 1.6 : 1, m: big ? 1.6 : 1, big: big}); };
V.sticker = function(i, id){ this.stick.push({i: i, id: id, l: 2.2}); };

V.back = function(){
  var v = this, g = v.g, w = v.w, h = v.h, gr, q, i, c, s, t = v.t;
  gr = g.createLinearGradient(0, 0, 0, h * 0.5); gr.addColorStop(0, "#070a1f"); gr.addColorStop(1, "#22264a"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // the stand along the far touchline, with its roof
  v.poly([-8, -H - 4, 0, L + 8, -H - 4, 0, L + 8, -H - 28, 14, -8, -H - 28, 14], "#1a1d36");
  v.poly([-8, -H - 28, 14, L + 8, -H - 28, 14, L + 8, -H - 31, 19, -8, -H - 31, 19], "#10122a");
  for (i = 0; i < v.crowd.length; i++) {
    c = v.crowd[i]; q = v.pr(c[0], c[1], c[2] + Math.max(0, Math.sin(t * 6 + c[4])) * (v.cheer || 0) * 0.5);
    if (q.x < -4 || q.x > w + 4) continue;
    s = Math.max(1.2, q.s * 0.42); g.fillStyle = c[3]; g.fillRect(q.x - s / 2, q.y - s, s, s); g.fillStyle = "#d9b38c"; g.fillRect(q.x - s * 0.3, q.y - s * 1.55, s * 0.6, s * 0.55);
  }
  // floodlights on the roof
  for (i = 0; i < 4; i++) {
    q = v.pr(-4 + i * (L + 8) / 3, -H - 31, 21); g.fillStyle = "#fff6d6"; g.fillRect(q.x - q.s * 1.6, q.y - q.s * 0.5, q.s * 3.2, q.s * 0.8);
    gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.s * 9); gr.addColorStop(0, "rgba(255,246,214,.35)"); gr.addColorStop(1, "rgba(255,246,214,0)"); g.fillStyle = gr; g.fillRect(q.x - q.s * 9, q.y - q.s * 9, q.s * 18, q.s * 18);
  }
  // advertising boards
  v.poly([-6, -H - 2.2, 0, L + 6, -H - 2.2, 0, L + 6, -H - 2.2, 0.9, -6, -H - 2.2, 0.9], "#14182f");
  g.font = "800 " + Math.round(v.pr(L / 2, -H - 2.2, 0.45).s * 0.6) + "px " + R.FONT; g.textAlign = "center"; g.textBaseline = "middle";
  for (i = 0; i < 8; i++) { q = v.pr(-2 + i * (L + 4) / 7, -H - 2.2, 0.45); g.fillStyle = i & 1 ? "#3b6ef5" : "#ffd23b"; g.fillText(i & 1 ? "ARGYLE SMARTS" : "MEGS", q.x, q.y); }
};
V.pitch = function(){
  var v = this, g = v.g, i, a, c, n = 14;
  v.poly([-7, -H - 2.2, 0, L + 7, -H - 2.2, 0, L + 7, H + 8, 0, -7, H + 8, 0], "#2a6b3a");
  for (i = 0; i < n; i++) v.poly([i * L / n, -H, 0, (i + 1) * L / n, -H, 0, (i + 1) * L / n, H, 0, i * L / n, H, 0], i & 1 ? "#3d9a55" : "#358c4b");
  if (!v.grass) { v.grass = document.createElement("canvas"); v.grass.width = v.grass.height = 64; a = v.grass.getContext("2d"); for (i = 0; i < 900; i++) { a.fillStyle = Math.random() < 0.5 ? "rgba(0,30,0,.18)" : "rgba(200,255,180,.08)"; a.fillRect(Math.random() * 64, Math.random() * 64, 1, 1 + Math.random() * 2); } }
  g.save(); g.fillStyle = g.createPattern(v.grass, "repeat"); g.beginPath(); [[-7, -H - 2.2], [L + 7, -H - 2.2], [L + 7, H + 8], [-7, H + 8]].forEach(function(pt){ var q = v.pr(pt[0], pt[1], 0); g.lineTo(q.x, q.y); }); g.fill(); g.restore();
  c = "rgba(255,255,255,.88)";
  v.line([0, -H, 0, L, -H, 0, L, H, 0, 0, H, 0, 0, -H, 0], 0.12, c);
  v.line([L / 2, -H, 0, L / 2, H, 0], 0.12, c);
  a = []; for (i = 0; i <= 40; i++) a.push(L / 2 + Math.cos(i * TAU / 40) * 7, Math.sin(i * TAU / 40) * 7, 0); v.line(a, 0.12, c);
  [0, 1].forEach(function(s){
    var x0 = s ? L : 0, d = s ? -1 : 1, arc = [], j;
    v.line([x0, -BOXW, 0, x0 + d * BOXL, -BOXW, 0, x0 + d * BOXL, BOXW, 0, x0, BOXW, 0], 0.12, c);
    v.line([x0, -SMALL, 0, x0 + d * 4.5, -SMALL, 0, x0 + d * 4.5, SMALL, 0, x0, SMALL, 0], 0.12, c);
    for (j = -10; j <= 10; j++) { var aa = j / 10 * 0.93; if (Math.cos(aa) * 7 + SPOT > BOXL) arc.push(x0 + d * (SPOT + Math.cos(aa) * 7), Math.sin(aa) * 7, 0); }
    if (arc.length) v.line(arc, 0.12, c);
    v.poly([x0 + d * SPOT - 0.15, -0.15, 0, x0 + d * SPOT + 0.15, -0.15, 0, x0 + d * SPOT + 0.15, 0.15, 0, x0 + d * SPOT - 0.15, 0.15, 0], c);
  });
};
V.goalBack = function(x0, d){
  var v = this, g = v.g, i, col = "rgba(240,244,255,.38)", b = x0 + d * GD;
  for (i = 0; i <= 12; i++) v.line([x0, -GW + i * GW / 6, GH, b, -GW + i * GW / 6, GH * 0.8, b, -GW + i * GW / 6, 0], 0.025, col);
  for (i = 0; i <= 6; i++) v.line([b, -GW, i * GH * 0.8 / 6, b, GW, i * GH * 0.8 / 6], 0.025, col);
  for (i = 0; i <= 4; i++) { v.line([x0, -GW, i * GH / 4, b, -GW, i * GH * 0.8 / 4], 0.025, col); v.line([x0, GW, i * GH / 4, b, GW, i * GH * 0.8 / 4], 0.025, col); }
};
V.goalFront = function(x0){ var v = this; v.line([x0, -GW, 0, x0, -GW, GH, x0, GW, GH, x0, GW, 0], 0.13, "#f4f6ff"); };

V.draw = function(m, dt){
  var v = this, g = v.g, b = m.b, c = v.cam, ents = [], i, p, q, a, s, sd, k, ctl, list, gr, tx, ty;
  v.t += dt; v.cheer = Math.max(0, (v.cheer || 0) - dt * 0.4);
  if (m.phase === "goal") v.cheer = 1;
  tx = clamp(b.x, 16, L - 16); ty = H + 27 + clamp(b.y, -H, H) * 0.35;
  c.x += (tx - c.x) * Math.min(1, dt * 2.6); c.y += (ty - c.y) * Math.min(1, dt * 1.8);
  g.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); g.lineCap = g.lineJoin = "round";
  if (v.shake > 0 && v.o.shake) { v.shake -= dt; g.translate((Math.random() - 0.5) * v.shake * 14, (Math.random() - 0.5) * v.shake * 14); }
  v.back(); v.pitch();
  v.goalBack(L, 1); v.goalBack(0, -1);
  // shadows
  for (i = 0; i < 10; i++) { p = m.p[i]; q = v.pr(p.x, p.y, 0); g.fillStyle = "rgba(0,10,0,.3)"; g.beginPath(); g.ellipse(q.x + q.s * 0.25, q.y, q.s * 0.42, q.s * 0.13, 0, 0, TAU); g.fill(); }
  q = v.pr(b.x, b.y, 0); g.fillStyle = "rgba(0,10,0," + (0.35 / (1 + b.z * 0.5)) + ")"; g.beginPath(); g.ellipse(q.x, q.y, q.s * 0.2 * (1 + b.z * 0.15), q.s * 0.08, 0, 0, TAU); g.fill();
  // markers on the ground under the players each human is steering
  for (k = 0; k < 2; k++) {
    if (!m.cfg.human[k] || m.ctl[k] < 0) continue; p = m.p[m.ctl[k]]; q = v.pr(p.x, p.y, 0.02);
    g.strokeStyle = v.ring[k]; g.lineWidth = Math.max(2, q.s * 0.08); g.globalAlpha = 0.9; g.beginPath(); g.ellipse(q.x, q.y, q.s * 0.6, q.s * 0.2, 0, 0, TAU); g.stroke(); g.globalAlpha = 1;
  }
  // players and ball, far to near
  for (i = 0; i < 10; i++) ents.push([v.pr(m.p[i].x, m.p[i].y, 0).d, i]);
  ents.push([v.pr(b.x, b.y, 0).d, -1]);
  ents.sort(function(x, y){ return y[0] - x[0]; });
  for (i = 0; i < ents.length; i++) {
    k = ents[i][1];
    if (k < 0) { v.spin(m, dt); q = v.pr(b.x, b.y, b.z + R.VR - BR); R.drawBall(g, q.x, q.y, Math.max(2.5, R.VR * q.s), v.ball, v.pts, v.t, Math.sin(c.a), Math.cos(c.a)); continue; }
    p = m.p[k]; sd = v.sides[p.tm][p.role]; q = R.poseOf(p, m, v.t);
    if (m.phase === "over" || (m.phase === "goal" && p.cel)) { if (p.cel || (m.phase === "over" && m.win === p.tm)) { q.uL = q.uR = 2.85; q.oL = q.oR = 0.5; q.z = 0.15 * Math.abs(Math.sin(v.t * 6 + k)); } else if (m.phase === "over") { q.lean = 0.3; q.nod = 0.9; } }
    a = Math.atan2(c.y - p.y, c.x - p.x); s = hyp(c.x - p.x, c.y - p.y) || 1;
    R.figure(g, function(x, y, z){ return v.pr(x, y, z); }, p.x, p.y, 0, p.fa, q, sd, (c.x - p.x) / s, (c.y - p.y) / s, v.t);
  }
  v.goalFront(L); v.goalFront(0);
  // floodlight glow and a soft vignette, like a TV picture
  gr = g.createRadialGradient(v.w / 2, v.h * 0.35, v.h * 0.2, v.w / 2, v.h * 0.5, v.w * 0.75); gr.addColorStop(0, "rgba(255,248,220,.07)"); gr.addColorStop(0.6, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,12,.38)"); g.fillStyle = gr; g.fillRect(0, 0, v.w, v.h);
  // the player each human is steering: an arrow and a name
  for (k = 0; k < 2; k++) {
    if (!m.cfg.human[k] || m.ctl[k] < 0) continue; p = m.p[m.ctl[k]]; q = v.pr(p.x, p.y, 2.35);
    g.fillStyle = v.ring[k]; g.strokeStyle = "rgba(8,9,22,.8)"; g.lineWidth = 2; g.beginPath(); g.moveTo(q.x - 7, q.y - 12); g.lineTo(q.x + 7, q.y - 12); g.lineTo(q.x, q.y - 2); g.closePath(); g.fill(); g.stroke();
    if (v.o.names && p.name) { g.font = "700 12px " + R.FONT; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.lineWidth = 3; g.strokeText(p.name, q.x, q.y - 16); g.fillStyle = "#fff"; g.fillText(p.name, q.x, q.y - 16); }
  }
  // shot lines and the aim bar
  for (i = 0; i < 10; i++) {
    p = m.p[i]; if (p.wind < 0 || b.own !== i) continue;
    a = m.target(p);
    if (v.o.aim) { g.setLineDash([9, 7]); g.lineDashOffset = -v.t * 40; g.strokeStyle = v.ring[p.tm]; g.lineWidth = 3; g.beginPath(); list = 14; for (k = 0; k <= list; k++) { q = v.pr(lerp(b.x, a.x, k / list), lerp(b.y, a.y, k / list), 0.05 + (k / list) * (k / list) * 0.9); g.lineTo(q.x, q.y); } g.stroke(); g.setLineDash([]); }
    if (m.cfg.human[p.tm] && m.ctl[p.tm] === i && v.o.meter) v.bar(m, p);
  }
  v.fx(dt); v.popDraw(dt); v.stickers(m, dt); v.radar(m);
  if (v.flash > 0 && v.o.flash) { g.fillStyle = "rgba(255,255,255," + Math.min(0.6, v.flash) + ")"; g.fillRect(-20, -20, v.w + 40, v.h + 40); v.flash -= dt * 1.5; }
};
V.spin = function(m, dt){ var b = m.b, sp = hyp(b.vx, b.vy); if (sp > 0.2) R.spin(this.pts, b.vy / sp, -b.vx / sp, 0, sp * dt / R.VR * 0.6); };
V.bar = function(m, p){
  var v = this, g = v.g, q = m.meter(p), Wd = 140, hh = 12, a = v.pr(p.x, p.y, 2.6), x = clamp(a.x - Wd / 2, 6, v.w - Wd - 6), y = Math.max(8, a.y - 34), gw = q.gw, mm = q.m, cb = v.o.cb;
  g.fillStyle = "rgba(8,9,22,.85)"; g.fillRect(x - 3, y - 3, Wd + 6, hh + 6); g.fillStyle = "#a8323e"; g.fillRect(x, y, Wd, hh);
  g.fillStyle = cb ? "#2f7fe0" : "#27b36f"; g.fillRect(x + Wd / 2 * (1 - gw), y, Wd * gw, hh);
  // perfect strikes are the strips just inside each post; the dark tick is where the keeper stands
  g.fillStyle = cb ? "#d7ecff" : "#b9ffdc"; g.fillRect(x + Wd / 2 * (1 - gw * 0.96), y, Wd / 2 * gw * 0.34, hh); g.fillRect(x + Wd / 2 * (1 + gw * 0.62), y, Wd / 2 * gw * 0.34, hh);
  a = m.p[(1 - p.tm) * 5].y / m.range(p) * (p.tm ? -1 : 1); g.fillStyle = "rgba(8,9,22,.85)"; g.fillRect(x + Wd / 2 * (1 + clamp(a, -1, 1)) - 2, y - 2, 4, hh + 4);
  g.fillStyle = "#fff"; g.fillRect(x + Wd / 2 * (1 - gw) - 1, y - 3, 2, hh + 6); g.fillRect(x + Wd / 2 * (1 + gw) - 1, y - 3, 2, hh + 6);
  a = x + Wd / 2 * (1 + clamp(mm, -1, 1)); g.fillStyle = "rgba(8,9,22,.9)"; g.fillRect(a - 4, y - 6, 8, hh + 12); g.fillStyle = "#fff"; g.fillRect(a - 2.5, y - 5, 5, hh + 10);
};
V.fx = function(dt){
  var v = this, g = v.g, i, p, q;
  for (i = v.parts.length - 1; i >= 0; i--) {
    p = v.parts[i]; p.l -= dt; if (p.l <= 0) { v.parts.splice(i, 1); continue; }
    p.vz -= 9.8 * dt * 0.6; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); if (!p.z) { p.vx *= 0.9; p.vy *= 0.9; }
    q = v.pr(p.x, p.y, p.z); g.globalAlpha = Math.min(1, p.l / p.m * 2); g.fillStyle = p.c; g.fillRect(q.x, q.y, Math.max(2, q.s * p.s), Math.max(2, q.s * p.s * 0.6));
  }
  g.globalAlpha = 1;
};
V.popDraw = function(dt){
  var v = this, g = v.g, i, p, q, k, sz;
  for (i = v.pops.length - 1; i >= 0; i--) {
    p = v.pops[i]; p.l -= dt; if (p.l <= 0) { v.pops.splice(i, 1); continue; }
    k = 1 - p.l / p.m; q = v.pr(p.x, p.y, p.z + k * 1.2); sz = (p.big ? 34 : 18) * (k < 0.12 ? 0.6 + k * 3.4 : 1);
    g.globalAlpha = Math.min(1, p.l * 2.5); g.font = "900 " + Math.round(sz) + "px " + R.FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 4; g.strokeStyle = "rgba(8,9,22,.85)"; g.strokeText(p.txt, q.x, q.y); g.fillStyle = p.col; g.fillText(p.txt, q.x, q.y);
  }
  g.globalAlpha = 1;
};
V.stickers = function(m, dt){
  var v = this, g = v.g, i, s, p, q, k;
  for (i = v.stick.length - 1; i >= 0; i--) {
    s = v.stick[i]; s.l -= dt; if (s.l <= 0) { v.stick.splice(i, 1); continue; }
    p = m.p[s.i]; if (!p) continue; q = v.pr(p.x, p.y, 2.9); k = Math.min(1, (2.2 - s.l) * 6);
    g.globalAlpha = Math.min(1, s.l * 3); R.sticker(g, s.id, q.x, q.y - 24, 44 * (0.6 + 0.4 * k), v.t); g.globalAlpha = 1;
  }
};
V.radar = function(m){
  var v = this, g = v.g, w = Math.min(180, v.w * 0.22), h = w * H * 2 / L, x0 = v.w / 2 - w / 2, y0 = v.h - h - 10, i, p, k;
  g.fillStyle = "rgba(8,9,22,.55)"; g.fillRect(x0 - 3, y0 - 3, w + 6, h + 6); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1; g.strokeRect(x0, y0, w, h); g.beginPath(); g.moveTo(x0 + w / 2, y0); g.lineTo(x0 + w / 2, y0 + h); g.stroke();
  for (i = 0; i < 10; i++) { p = m.p[i]; g.fillStyle = v.ring[p.tm]; k = m.cfg.human[p.tm] && m.ctl[p.tm] === i ? 4 : 2.6; g.beginPath(); g.arc(x0 + p.x / L * w, y0 + (p.y + H) / (2 * H) * h, k, 0, TAU); g.fill(); }
  g.fillStyle = "#fff"; g.beginPath(); g.arc(x0 + m.b.x / L * w, y0 + (m.b.y + H) / (2 * H) * h, 2.4, 0, TAU); g.fill();
};
MG.TeamView = TV;
})();
