// MEGS play: sound, controls, the match loop and its HUD.
(function(){
"use strict";
var MG = window.MG, R = MG.R, K = MG.K, DT = K.DT, run = null, demo = null, stageView = null, keys = {}, AC = null, out = null, nz = null, amb = null;
var TOUCH = {x: 0, y: 0, sh: 0, a: 0, b: 0, c: 0, d: 0, sp: 0, id: null, on: false};
function $(id){ return document.getElementById(id); }
function set(el, v){ if (el && el._v !== v) { el._v = v; el.textContent = v; } }
function buzz(ms){ if (MG.S.set.buzz && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

// ---- sound: everything is synthesised, there are no audio files ----
function ac(){
  var C = window.AudioContext || window.webkitAudioContext, d, i;
  if (AC || !C) return AC;
  AC = new C(); out = AC.createGain(); out.connect(AC.destination);
  nz = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); d = nz.getChannelData(0); for (i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return AC;
}
function tone(f0, f1, d, type, g, at){
  var t = AC.currentTime + (at || 0), o = AC.createOscillator(), e = AC.createGain();
  if (g <= 0.0005) return;
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + d);
  e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(e); e.connect(out); o.start(t); o.stop(t + d + 0.03);
}
function hiss(d, g, f, q, type, at, atk){
  var t = AC.currentTime + (at || 0), s = AC.createBufferSource(), fl = AC.createBiquadFilter(), e = AC.createGain();
  if (g <= 0.0005) return;
  s.buffer = nz; s.loop = true; fl.type = type || "bandpass"; fl.frequency.value = f; fl.Q.value = q || 1;
  e.gain.setValueAtTime(0.001, t); e.gain.linearRampToValueAtTime(g, t + (atk || 0.006)); e.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(fl); fl.connect(e); e.connect(out); s.start(t); s.stop(t + d + 0.05);
}
MG.sfx = function(k, v){
  var s = MG.S.set, g = s.mute ? 0 : s.vol * s.sfx, c = s.mute ? 0 : s.vol * s.crowd, p;
  if ((g <= 0 && c <= 0) || !ac()) return;
  if (AC.state === "suspended") AC.resume();
  if (k === "kick") { p = MG.clamp((v || 18) / 22, 0.5, 1.1); hiss(0.08, 0.5 * g * p, 700, 0.8, "lowpass"); tone(170, 55, 0.13, "sine", 0.7 * g * p); }
  else if (k === "bounce") tone(120, 70, 0.08, "sine", MG.clamp((v || 3) / 9, 0.1, 0.5) * g);
  else if (k === "post") { tone(930, 900, 0.5, "triangle", 0.4 * g); tone(1870, 1840, 0.35, "sine", 0.22 * g); tone(2790, 2700, 0.2, "sine", 0.1 * g); }
  else if (k === "wall") hiss(0.14, MG.clamp((v || 4) / 14, 0.08, 0.4) * g, 2600, 4);
  else if (k === "net") hiss(0.4, MG.clamp((v || 6) / 16, 0.15, 0.5) * g, 4200, 0.7, "highpass");
  else if (k === "thud") { tone(95, 60, 0.1, "sine", 0.5 * g); hiss(0.05, 0.25 * g, 500, 1, "lowpass"); }
  else if (k === "perfect") { tone(1320, 1320, 0.12, "sine", 0.22 * g); tone(1980, 1980, 0.2, "sine", 0.18 * g, 0.07); }
  else if (k === "megs") { tone(620, 930, 0.09, "square", 0.12 * g); tone(930, 1400, 0.12, "square", 0.12 * g, 0.1); }
  else if (k === "ankles") tone(520, 180, 0.28, "sawtooth", 0.13 * g);
  else if (k === "turn") tone(300, 200, 0.12, "triangle", 0.2 * g);
  else if (k === "whistle") { tone(2350, 2350, 0.22, "square", 0.07 * g); tone(2480, 2480, 0.22, "square", 0.05 * g); }
  else if (k === "goal") { hiss(1.8, 0.5 * c, 1100, 0.6, "bandpass", 0, 0.25); hiss(1.5, 0.3 * c, 2400, 0.8, "bandpass", 0.05, 0.3); tone(2350, 2350, 0.5, "square", 0.06 * g, 0.15); }
  else if (k === "final") [0, 0.3, 0.6].forEach(function(t, i){ tone(2350, 2350, i === 2 ? 0.7 : 0.2, "square", 0.07 * g, t); });
  else if (k === "ui") tone(680, 680, 0.045, "triangle", 0.1 * g);
  else if (k === "coin") { tone(1250, 1250, 0.07, "square", 0.08 * g); tone(1880, 1880, 0.12, "square", 0.08 * g, 0.07); }
  else if (k === "win") [523, 659, 784, 1047].forEach(function(f, i){ tone(f, f, 0.22, "triangle", 0.16 * g, i * 0.11); });
  else if (k === "lose") [392, 330, 262].forEach(function(f, i){ tone(f, f, 0.3, "triangle", 0.14 * g, i * 0.16); });
  else if (k === "rare") for (p = 0; p <= (v || 0) + 2; p++) tone(440 * Math.pow(1.26, p), 440 * Math.pow(1.26, p), 0.2, "triangle", 0.14 * g, p * 0.08);
};
// a quiet bed of crowd noise while a match is on
function ambOn(){
  var s = MG.S.set, f;
  ambOff(); if (s.mute || !ac()) return;
  amb = {s: AC.createBufferSource(), g: AC.createGain()}; f = AC.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 420; f.Q.value = 0.5;
  amb.s.buffer = nz; amb.s.loop = true; amb.g.gain.value = 0.05 * s.vol * s.crowd; amb.s.connect(f); f.connect(amb.g); amb.g.connect(out); amb.s.start();
}
function ambOff(){ if (amb) { try { amb.s.stop(); } catch (e) {} amb = null; } }

// ---- controls: keyboard, gamepad and touch all feed the same eight inputs ----
MG.keyName = function(c){
  var m = {Space: "Space", ShiftLeft: "L Shift", ShiftRight: "R Shift", ControlLeft: "L Ctrl", ControlRight: "R Ctrl", AltLeft: "L Alt", AltRight: "R Alt", Enter: "Enter", Comma: ",", Period: ".", Slash: "/", Semicolon: ";", Quote: "'", BracketLeft: "[", BracketRight: "]", Minus: "-", Equal: "=", Tab: "Tab", Backspace: "Bksp", CapsLock: "Caps"};
  return m[c] || String(c).replace(/^Key|^Digit/, "").replace(/^Arrow/, "").replace(/^Numpad/, "Num ");
};
function down(b){ return b && (b.pressed || b.value > 0.5); }
function read(src, inp){
  var st = MG.S.set, x = 0, y = 0, kk, gp, t, l;
  inp.sp = inp.sh = inp.a = inp.b = inp.c = inp.d = 0;
  if (src.k) {
    kk = st[src.k]; x += (keys[kk.right] ? 1 : 0) - (keys[kk.left] ? 1 : 0); y += (keys[kk.down] ? 1 : 0) - (keys[kk.up] ? 1 : 0);
    if (keys[kk.sp]) inp.sp = 1; if (keys[kk.sh]) inp.sh = 1; if (keys[kk.a]) inp.a = 1; if (keys[kk.b]) inp.b = 1; if (keys[kk.c]) inp.c = 1; if (keys[kk.d]) inp.d = 1;
  }
  if (src.arrows) { x += (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0); y += (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0); }
  if (src.pad != null && st.pad && navigator.getGamepads) {
    gp = navigator.getGamepads()[src.pad];
    if (gp && gp.connected) {
      t = gp.buttons; if (Math.abs(gp.axes[0]) > 0.22 || Math.abs(gp.axes[1]) > 0.22) { x += gp.axes[0]; y += gp.axes[1]; }
      x += (down(t[15]) ? 1 : 0) - (down(t[14]) ? 1 : 0); y += (down(t[13]) ? 1 : 0) - (down(t[12]) ? 1 : 0);
      if (down(t[0])) inp.sh = 1; if (down(t[2])) inp.a = 1; if (down(t[1])) inp.b = 1; if (down(t[3])) inp.c = 1; if (down(t[4]) || down(t[5])) inp.d = 1; if (down(t[6]) || down(t[7])) inp.sp = 1;
    }
  }
  if (src.touch && TOUCH.on) {
    x += TOUCH.x; y += TOUCH.y; if (TOUCH.sh) inp.sh = 1; if (TOUCH.a) inp.a = 1; if (TOUCH.b) inp.b = 1; if (TOUCH.c) inp.c = 1; if (TOUCH.d) inp.d = 1;
    if (TOUCH.sp || (st.auto && Math.sqrt(TOUCH.x * TOUCH.x + TOUCH.y * TOUCH.y) > 0.93)) inp.sp = 1;
  }
  l = Math.sqrt(x * x + y * y); if (l > 1) { x /= l; y /= l; }
  inp.mx = x; inp.my = y;
}
function wire(){
  var joy = $("joy"), knob = $("knob");
  function jmove(e){
    var r = joy.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2), l = Math.sqrt(x * x + y * y);
    if (l > 1) { x /= l; y /= l; }
    TOUCH.x = x; TOUCH.y = y; knob.style.transform = "translate(" + Math.round(x * r.width * 0.3) + "px," + Math.round(y * r.height * 0.3) + "px)";
  }
  function jend(e){ if (e.pointerId !== TOUCH.id) return; TOUCH.id = null; TOUCH.x = TOUCH.y = 0; knob.style.transform = ""; }
  joy.addEventListener("pointerdown", function(e){ TOUCH.on = true; TOUCH.id = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (x) {} jmove(e); e.preventDefault(); });
  joy.addEventListener("pointermove", function(e){ if (e.pointerId === TOUCH.id) jmove(e); });
  joy.addEventListener("pointerup", jend); joy.addEventListener("pointercancel", jend);
  ["sh", "a", "b", "c", "d", "sp"].forEach(function(k){
    var b = $("t" + k);
    function off(){ TOUCH[k] = 0; b.classList.remove("on"); }
    b.addEventListener("pointerdown", function(e){ TOUCH.on = true; TOUCH[k] = 1; b.classList.add("on"); try { b.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("contextmenu", function(e){ e.preventDefault(); });
  });
  window.addEventListener("touchstart", function(){ $("stage").classList.add("touch"); }, {passive: true});
  if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) $("stage").classList.add("touch");
  window.addEventListener("keydown", function(e){
    if (!run) return;
    keys[e.code] = 1;
    if ((e.code === "Escape" || e.code === "KeyP") && !e.repeat && !run.over) pause(!run.paused);
    if (/^Arrow|^Space$|^Slash$|^Quote$/.test(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", function(e){ keys[e.code] = 0; });
  window.addEventListener("blur", function(){ keys = {}; });
  document.addEventListener("visibilitychange", function(){ if (document.hidden && run && !run.over && !run.paused) pause(true); });
  $("bpause").addEventListener("click", function(){ if (run && !run.over) pause(!run.paused); });
  $("pause").addEventListener("click", function(e){
    var b = e.target.closest("[data-p]"), a = b && b.getAttribute("data-p"), r = run, o, res;
    if (!a || !r) return;
    MG.sfx("ui");
    if (a === "resume") pause(false);
    else if (a === "mute") { MG.S.set.mute = MG.S.set.mute ? 0 : 1; MG.save(); pause(true); }
    else if (a === "restart") { r.m = r.mk(); r.view.set(r.vs); r.top = 0; r.over = 0; pause(false); banner(r.o.name, r.o.sub || ""); }
    else if (a === "quit") { o = r.o; res = result(r); res.win = false; res.quit = 1; stop(); if (o.forfeit) o.done(res); else o.quit(res); }
  });
}

// ---- HUD ----
function banner(a, b){
  var el = $("banner");
  if (!MG.S.set.banner && a !== "FULL TIME") return;
  el.firstChild.textContent = a; el.lastChild.textContent = b || ""; el.lastChild.style.display = b ? "" : "none";
  el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
}
function fmt(s){ s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + s % 60; }
function hintRow(r, has){
  var st = MG.S.set, src = r.one, kk = src && src.k ? st[src.k] : null, n = MG.keyName, list = has ? [["sh", "Shoot: hold, let go in the green"], ["a", "Cut"], ["b", "Drag back"], ["c", "Burst"], ["d", "Megs"], ["sp", "Sprint"]] : [["sh", "Block"], ["a", "Tackle"], ["b", "Jockey"], ["c", "Slide"], ["sp", "Sprint"]], lab = has ? ["Cut", "Drag", "Burst", "Megs"] : ["Tackle", "Jockey", "Slide", ""];
  $("hint").innerHTML = kk ? list.map(function(x){ return "<span><kbd>" + n(kk[x[0]]) + "</kbd>" + x[1] + "</span>"; }).join("") : "";
  ["a", "b", "c", "d"].forEach(function(k, i){ $("t" + k).textContent = lab[i]; $("t" + k).style.visibility = lab[i] ? "" : "hidden"; });
  $("tsh").textContent = has ? "SHOOT" : "BLOCK";
}
function hud(r, dt){
  var m = r.m, c = m.cfg, b = m.b, chip = "", has, sc = $("sc");
  set($("s0"), m.score[0]); set($("s1"), m.score[1]);
  set($("rule"), c.clock ? fmt(m.left) : c.golden ? "GOLDEN GOAL" : c.target ? "FIRST TO " + c.target : "FREE PLAY");
  set(sc, c.sc ? String(Math.max(0, Math.ceil(m.sc))) : ""); sc.className = c.sc && m.sc < 4 ? "low" : "";
  if (r.chipT > 0) { r.chipT -= dt; chip = r.chip; }
  else if (m.phase === "live" && m.need >= 0) chip = r.src[m.need] ? "Take it out past the arc" : "Rival has to clear the arc";
  else if (m.phase === "live" && c.two && b.own >= 0 && MG.hyp(b.x, b.y) > K.ARC) chip = "Long range: counts double";
  else if (m.phase === "live" && c.far && b.own >= 0 && MG.hyp(b.x, b.y) <= K.ARC) chip = "Too close: shoot from outside the arc";
  set($("chip"), chip);
  has = r.one ? (b.own === r.oneI ? 1 : 0) : -1;
  if (has !== r.has) { r.has = has; hintRow(r, has === 1); }
}

// ---- the match ----
function applyView(v){
  var s = MG.S.set, o = v.o;
  o.shake = s.shake; o.flash = s.flash; o.fx = [0.45, 1, 1.6][s.fx] || 1; o.names = s.names; o.rings = s.rings; o.meter = s.meter; o.aim = s.aim; o.pops = s.pops;
  o.zoom = s.zoom; o.pan = s.pan; o.cb = s.cb; o.net = s.net; o.trail = s.trail; o.aura = s.aura;
}
MG.applySet = function(){
  var st = $("stage"), s = MG.S.set;
  if (run) applyView(run.view);
  st.style.setProperty("--ts", s.tsize); st.style.setProperty("--to", s.top); st.style.setProperty("--hud", s.hud);
  st.classList.toggle("lefty", !!s.lefty); st.classList.toggle("nohint", !s.hints);
  if (amb) amb.g.gain.value = s.mute ? 0 : 0.05 * s.vol * s.crowd;
};
function pause(on){
  var r = run, b = $("pause");
  r.paused = on; b.hidden = !on; keys = {};
  if (on) {
    b.querySelector("[data-p=mute]").textContent = "Sound: " + (MG.S.set.mute ? "off" : "on");
    b.querySelector("[data-p=restart]").style.display = r.o.forfeit ? "none" : "";
    $("pnote").textContent = r.o.forfeit ? "Quitting now counts as a loss." : "";
  } else r.last = performance.now();
  MG.applySet();
}
function result(r){ var m = r.m; return {win: m.win === 0, winner: m.win, sc: [m.score[0], m.score[1]], me: m.p[0].stats, them: m.p[1].stats, top: r.top, t: m.t, ko: m.ko}; }
function stop(){
  if (!run) return;
  cancelAnimationFrame(run.raf); run = null; ambOff(); keys = {};
  $("stage").hidden = true; $("pause").hidden = true; document.body.classList.remove("playing");
}
MG.stop = stop;
function onEvent(r, e){
  var m = r.m, k = e.k, st = MG.S.set;
  r.view.event(m, e);
  if (k === "kick") { MG.sfx("kick", e.pw); if (e.q === 2) MG.sfx("perfect"); }
  else if (k === "bounce") MG.sfx("bounce", e.v);
  else if (k === "post") { MG.sfx("post"); buzz(40); }
  else if (k === "wall") MG.sfx("wall", e.v);
  else if (k === "net") MG.sfx("net", e.v);
  else if (k === "megs") { MG.sfx("megs"); buzz(60); if (m.cfg.panna) banner("PANNA!", "A nutmeg ends it"); }
  else if (k === "ankles") MG.sfx("ankles");
  else if (k === "tackle" || k === "block" || k === "save" || k === "thud") MG.sfx("thud");
  else if (k === "turn") MG.sfx("turn");
  else if (k === "go") MG.sfx("whistle");
  else if (k === "hint") { r.chip = "Take it past the arc before you shoot"; r.chipT = 1.6; }
  else if (k === "goal") {
    if (e.by === 0 && e.top && e.wide) r.top++;
    MG.sfx("goal"); buzz(120);
    banner("GOAL!", e.pts === 2 ? "Long range: counts double" : e.megs ? "Through the legs" : e.hit ? "In off the " + (e.hit === "bar" ? "crossbar" : "post") : e.vol ? "First-time finish" : e.q === 2 ? "Perfect strike" : "");
    if (st.slow) { r.ts = 0.3; r.slow = 0.9; }
  }
  else if (k === "nogoal") banner("NO GOAL", e.why === 2 ? "Only long range counts here" : "Take it out past the arc first");
  else if (k === "clock") { banner("TIME UP", "Possession lost"); MG.sfx("whistle"); }
  else if (k === "golden") { banner("GOLDEN GOAL", "Next goal wins"); MG.sfx("whistle"); }
  else if (k === "over") { r.over = 2.4; MG.sfx("final"); banner("FULL TIME", r.o.sides[e.win].name + " wins"); }
}
function frame(now){
  var r = run, dt, n = 0, m, i, ev;
  if (!r) return;
  r.raf = requestAnimationFrame(frame);
  dt = Math.min(0.05, (now - r.last) / 1000); r.last = now;
  if (r.paused) return;
  m = r.m; r.view.resize(); r.acc += dt * r.ts;
  while (r.acc >= DT && n < 4) {
    for (i = 0; i < 2; i++) if (r.src[i] && m.phase !== "over") read(r.src[i], m.p[i].inp);
    m.step(); ev = m.ev;
    for (i = 0; i < ev.length; i++) onEvent(r, ev[i]);
    ev.length = 0; r.acc -= DT; n++;
  }
  if (r.acc > DT * 4) r.acc = 0;
  if (r.slow > 0) { r.slow -= dt; if (r.slow <= 0) r.ts = 1; }
  hud(r, dt);
  r.skip = !r.skip;
  if (!MG.S.set.fps || r.skip) r.view.draw(m, dt * r.ts * (MG.S.set.fps ? 2 : 1));
  if (r.over > 0) { r.over -= dt; if (r.over <= 0) { i = result(r); ev = r.o; stop(); ev.done(i); } }
}
// o: {name, sub, cfg, sides: [a, b], st: [a, b], ai: [level or null, ...], src: [controls or null, ...], court, ball, first, forfeit, done(result), quit(result)}
MG.play = function(o){
  var v, r, n = 0;
  MG.demoStop(); stop();
  $("stage").hidden = false; document.body.classList.add("playing");
  if (!stageView) { stageView = new R.View($("cv")); wire(); }
  v = stageView; v.resize();
  r = run = {o: o, view: v, src: o.src, acc: 0, ts: 1, slow: 0, last: performance.now(), paused: false, over: 0, top: 0, chip: "", chipT: 0, has: -2, skip: false, one: null, oneI: -1,
    vs: {court: o.court || MG.S.eq.court, ball: o.ball || MG.S.eq.ball, sides: o.sides}};
  r.mk = function(){
    var c = {p0: {name: o.sides[0].name, st: o.st[0], ai: o.ai[0]}, p1: {name: o.sides[1].name, st: o.st[1], ai: o.ai[1]}, first: o.first == null ? (Math.random() < 0.5 ? 0 : 1) : o.first}, k;
    for (k in o.cfg) c[k] = o.cfg[k];
    return new MG.Match(c);
  };
  r.m = r.mk(); v.set(r.vs); applyView(v);
  o.src.forEach(function(s, i){ if (s) { n++; r.one = s; r.oneI = i; } });
  if (n !== 1) { r.one = null; r.oneI = -1; }
  set($("n0"), o.sides[0].name); set($("n1"), o.sides[1].name);
  TOUCH.x = TOUCH.y = TOUCH.sh = TOUCH.a = TOUCH.b = TOUCH.c = TOUCH.d = TOUCH.sp = 0;
  MG.applySet(); ambOn(); banner(o.name, o.sub || "");
  r.raf = requestAnimationFrame(frame);
};

// ---- a match that plays itself behind the home screen ----
MG.demo = function(cv){
  var v = new R.View(cv), d = {raf: 0, m: null, n: 0, last: 0};
  MG.demoStop();
  function next(){
    var w = MG.league(), f = MG.foe(w[Math.floor(Math.random() * 70)]), me = MG.me();
    me.human = false; me.name = ""; f.side.name = "";
    v.set({court: MG.S.eq.court, ball: MG.S.eq.ball, sides: [me, f.side]}); applyView(v);
    v.o.names = v.o.rings = v.o.pops = v.o.shake = v.o.flash = v.o.meter = 0; v.o.fx = Math.min(1, v.o.fx);
    d.m = new MG.Match({p0: {ai: 7, st: f.st}, p1: {ai: 7, st: f.st}, target: 3});
  }
  function tick(now){
    var m = d.m, i = MG.clamp(Math.round((now - d.last) / 16.7), 1, 3);
    if (!cv.isConnected) return MG.demoStop();
    d.raf = requestAnimationFrame(tick); d.last = now; v.resize();
    while (i--) { m.step(); m.ev.forEach(function(e){ v.event(m, e); }); m.ev.length = 0; }
    v.draw(m, 1 / 60);
    if (m.phase === "over" && ++d.n > 150) { d.n = 0; next(); }
  }
  next(); demo = d; d.last = performance.now(); d.raf = requestAnimationFrame(tick);
};
MG.demoStop = function(){ if (demo) cancelAnimationFrame(demo.raf); demo = null; };
})();
