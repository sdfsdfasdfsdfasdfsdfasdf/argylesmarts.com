// Megs online server.
// One Worker forwards WebSocket connections to one Durable Object ("Hub") that holds accounts, friends,
// parties, invites, matchmaking and a relay for match traffic. The game itself runs in the players' browsers:
// the match host simulates and the others send inputs, all passed through here.
import { DurableObject } from "cloudflare:workers";
import { CAT } from "./catalog.js";

const ORIGINS = ["https://argylesmarts.com", "https://www.argylesmarts.com"];
function okOrigin(o) {
  if (!o) return false;
  if (ORIGINS.indexOf(o) >= 0) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === "/health") return new Response("ok", { headers: { "access-control-allow-origin": "*" } });
    if (u.pathname === "/ws") {
      if ((req.headers.get("Upgrade") || "").toLowerCase() !== "websocket") return new Response("WebSocket only", { status: 426 });
      if (!okOrigin(req.headers.get("Origin"))) return new Response("Forbidden", { status: 403 });
      return env.HUB.get(env.HUB.idFromName("main")).fetch(req);
    }
    return new Response("Not found", { status: 404 });
  }
};

// ---------- helpers ----------
const NAME_RE = /^[A-Za-z0-9_]{3,16}$/;
const RESERVED = ["admin", "moderator", "megs", "system", "server", "support", "official", "staff", "null", "undefined"];
const BAD = ["fuck", "shit", "bitch", "cunt", "nigg", "fag", "rape", "porn", "dick", "pussy", "whore", "slut", "nazi", "hitler"];
// team size per online mode; r1 is ranked (1v1, solo only)
// rk1 to rk5 are Ranked Solo, Duos, Trios, Squads and Team; nobody found in 15 seconds means computer players fill in
const MODES = { r1: { size: 1, ranked: 1, solo: 1 }, q1: { size: 1 }, q5: { size: 5 }, rk1: { size: 1, ranked: 1, solo: 1 }, rk2: { size: 2, ranked: 1 }, rk3: { size: 3, ranked: 1 }, rk4: { size: 4, ranked: 1 }, rk5: { size: 5, ranked: 1 },
  // a party practising together against computer players: starts at once, never mixed with anyone else
  pk2: { size: 2, prac: 1 }, pk3: { size: 3, prac: 1 }, pk4: { size: 4, prac: 1 }, pk5: { size: 5, prac: 1 } };
const WAIT_BOTS = 15000;
// skins only admins can wear; anyone else has them taken off their look
const ADMIN_ITEMS = ["s67", "ad_arch", "ad_gm", "ad_gold", "ad_dev", "ad_found"];
// the one-time code that makes an account an admin (only its hash is here); it works for two accounts, then never again
const ADMIN_CLAIM = "ae02b0532d12090d920867735c86201b8a0ae3bc6c250feff7a279030ddc87b8", ADMIN_MAX = 2;
const now = () => Date.now();
const MIN_VER = 3;
// ---------- the bank: the server owns every account's coins and items, and opens the packs ----------
// Accounts made before this went live keep what they had; newer ones bring only a little guest progress with them.
const CUTOFF = 1795140000000, SEASON = 1, START_COINS = 500;
const WIN_COINS = 50, WIN_GAP = 30000, DAY_COINS = 3000, DAY_XP = 30000, XP_MAX = 3000, ULTRA = 1 / 2500;
const CODES = { "3b1fef17630831146ce458069b3a2c539f0c6fe21fe4ec05c4fe9249e3611962": "all", "97b9ebd519ecf14a27ab2e90924ef7f6f44c7325a172c6693807e14a0f04ec20": "coins" };
const IT = CAT.items, ITEM_KEYS = ["kit", "trail", "fx", "emote", "boot", "wrap", "hair", "banner", "ball", "court", "scene", "stadium", "sticker"];
const has = (id, f) => !!(IT[id] && IT[id][3].indexOf(f) >= 0);
const day = () => Math.floor(now() / 86400000);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function freshWal() { const inv = {}; for (const id of CAT.free) inv[id] = 1; return { coins: START_COINS, inv, seen: {}, bp: {}, pity: {}, pass: { s: SEASON, xp: 0, got: {}, bon: 0 }, free: 0, codes: {}, earn: { d: 0, c: 0, x: 0, last: 0 }, imp: 0, rp: 0, rpd: { d: 0, g: 0 } }; }
function passOf(w) { if (!w.pass || w.pass.s !== SEASON) w.pass = { s: SEASON, xp: 0, got: {}, bon: 0 }; return w.pass; }
function tierOf(w) { return Math.min(CAT.passN, Math.floor(passOf(w).xp / CAT.passXp)); }
function give(w, id) { w.inv[id] = w.inv[id] ? Math.min(99, (+w.inv[id] || 1) + 1) : 1; }
function roll(pk, force, kind) {
  const P = CAT.packs[pk];
  if (pk === "galaxy" && (!kind || kind === "kit") && Math.random() < ULTRA) return pick(Object.keys(IT).filter((id) => has(id, "u")));
  let r = Math.random() * 100, a = 0, q = 7;
  for (let i = 0; i < 8; i++) { a += P[1][i] || 0; if (r < a) { q = i; break; } }
  if (force && q < CAT.leg) q = CAT.leg;
  const of = (k) => Object.keys(IT).filter((id) => IT[id][0] === k && IT[id][2] === "pack" && !has(id, "f") && (!kind || IT[id][1] === kind));
  let pool;
  while (!(pool = of(q)).length && q > 0) q--;
  while (!pool.length && q < 8) pool = of(++q);
  return pick(pool);
}
// a pull: a new Celestial is only discovered (finding it again is a blueprint); anything else stacks as x2, x3...
function grant(w, id) {
  if (has(id, "c") && !w.inv[id]) { const first = !w.seen[id]; w.seen[id] = 1; if (!first) w.bp[id] = Math.min(CAT.bpN, (w.bp[id] || 0) + 1); return { id, cel: 1, first, bp: w.bp[id] || 0 }; }
  const d = !!w.inv[id]; give(w, id); return { id, dupe: d, n: w.inv[id] };
}
function bonusBp(w) {
  const pool = Object.keys(IT).filter((id) => has(id, "c") && !w.inv[id] && (w.bp[id] || 0) < CAT.bpN);
  if (!pool.length) { w.coins += 300; return "+300 coins"; }
  const id = pick(pool); w.bp[id] = (w.bp[id] || 0) + 1; return "Blueprint: " + id + " (" + w.bp[id] + "/" + CAT.bpN + ")";
}
function packCost(pk, kind) { return Math.max(10, Math.round(CAT.packs[pk][0] * (kind ? CAT.kindx[kind] || 1 : 1) / 10) * 10); }
// bringing a save that was made before the bank into an account
function importSave(w, d, old, admin) {
  if (!d || typeof d !== "object") return;
  const inv = d.inv || {};
  w.coins = Math.max(0, w.coins - START_COINS) + Math.max(0, Math.min(old ? 200000 : 1500, Math.floor(+d.coins || 0)));
  for (const id of Object.keys(inv)) {
    if (!IT[id] || has(id, "a")) continue;
    if (!old && (IT[id][0] > 2 || has(id, "c") || has(id, "u"))) continue;
    w.inv[id] = Math.max(w.inv[id] || 0, Math.min(old ? 10 : 1, Math.floor(+inv[id] || 1)));
  }
  if (old) {
    for (const id of Object.keys(d.seen || {})) if (has(id, "c")) w.seen[id] = 1;
    for (const id of Object.keys(d.bp || {})) if (has(id, "c")) w.bp[id] = Math.min(CAT.bpN, Math.floor(+d.bp[id] || 0));
    for (const k of Object.keys(d.pity || {})) if (CAT.packs[k]) w.pity[k] = Math.min(100, Math.floor(+d.pity[k] || 0));
    for (const k of Object.keys(d.codes || {})) w.codes[k] = 1;
    w.free = Math.floor(+d.free || 0);
  }
  if (d.pass && d.pass.s === SEASON) { const p = passOf(w); p.xp = Math.max(p.xp, Math.min(old ? 1e6 : 5000, Math.floor(+d.pass.xp || 0))); if (old) { for (const k of Object.keys(d.pass.got || {})) p.got[k] = 1; p.bon = Math.floor(+d.pass.bon || 0); } }
}
// ---------- passcodes: stored only as a salted, slow hash ----------
const PASS_ITER = 10000;
// the two admin accounts get these passcodes once (only the hashes are here)
const ADMIN_PASS = { hudsonboyd: ["63e29355b27a70863c84a15d0e993556", "07006ae4d71d76660e14401b77d39be92826e3926a9a162d3ae9ccaa9bdb3e6e"], audensattler: ["31e19a07da27f72c4bb86e4dc861f034", "1ac765c6a5cbea5cc2dd546d6595bab60c546270c0770abcfcef9d1119dde586"] };
function hexb(h) { const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.substr(i * 2, 2), 16); return b; }
async function passHash(pass, salt) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexb(salt), iterations: PASS_ITER }, k, 256);
  return [...new Uint8Array(bits)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function passErr(p) { p = String(p || ""); return p.length < 4 ? "Your passcode needs at least 4 characters" : p.length > 64 ? "That passcode is too long" : ""; }
const WAL_KEYS = ["coins", "inv", "seen", "bp", "pity", "pass", "free", "codes", "rp", "rpd"];
// ---------- matches: every reward from a match needs a ticket from when it kicked off ----------
// the same rank point sums as the game (rank.js); gains are capped each day so Bronze to Legend takes three weeks or more
const RP_DAY = 100, MATCH_XP = 1200, BONUS_DAY = 6000, RANK_MIN = [0, 250, 550, 900, 1300, 1700, 2100];
function rankTier(rp) { let k = 0; for (let i = 0; i < RANK_MIN.length; i++) if (rp >= RANK_MIN[i]) k = i; return k; }
// every rank reached gives its skin, boots, banner and background, for good
function rankGive(w) { const k = rankTier(Math.max(w.rp || 0, w.rpk || 0)), got = []; for (const id of Object.keys(IT)) if (has(id, "k") && (IT[id][4] || 9) <= k && !w.inv[id]) { w.inv[id] = 1; got.push(id); } return got; }
const RARE = [["corner", 5], ["mgoal", 6], ["vgoal", 4], ["post", 3], ["pgoal", 2], ["twos", 2]];
const num = (v, hi) => Math.max(0, Math.min(hi, Math.floor(+v || 0)));
function cleanRes(r) {
  r = r && typeof r === "object" ? r : {}; const me = r.me && typeof r.me === "object" ? r.me : {}, o = { quit: !!r.quit, win: !r.quit && !!r.win, draw: !r.quit && !r.win && !!r.draw, sc: [num((r.sc || [])[0], 40), num((r.sc || [])[1], 40)], me: {} };
  for (const k of ["goals", "megs", "ankles", "perfect", "tackles", "blocks", "pok", "twos", "corner", "mgoal", "vgoal", "post", "pgoal"]) o.me[k] = num(me[k], 60);
  for (const k of ["goals", "twos", "corner", "mgoal", "vgoal", "post", "pgoal"]) o.me[k] = Math.min(o.me[k], o.sc[0] + 1);
  if (o.win && o.sc[0] < o.sc[1]) o.win = false;
  return o;
}
function rankCalc(r) {
  const m = r.me, sc = r.sc; let rr = 0;
  const perf = Math.min(12, m.goals * 2 + m.megs * 2 + m.ankles * 2 + m.perfect + Math.floor(m.tackles / 2) + m.blocks + Math.floor(m.pok / 10));
  for (const x of RARE) rr += Math.min(5, m[x[0]] || 0) * x[1];
  rr = Math.min(15, rr);
  if (r.win) return Math.min(40, 16 + perf + rr + (sc[0] - sc[1] >= 3 ? 3 : 0) + (sc[1] === 0 ? 3 : 0));
  if (r.draw) return Math.min(8, Math.floor((perf + rr) / 3));
  return Math.min(-3, -14 + Math.floor((perf + rr) / 2));
}
// season pass XP for a match, the same shape as the game's sums, with a ceiling
function passCalc(r, t) {
  const m = r.me; let xp = (r.win ? 90 : 40) + m.goals * 8 + m.megs * 10 + m.perfect * 3;
  let extra = (r.win ? 60 : 25) + m.goals * 6 + m.megs * 12 + m.perfect * 4 + m.ankles * 8 + m.blocks * 3;
  if (t.ranked) extra = Math.round(extra * 1.25);
  if (t.team) { extra += 60 + 10 * m.goals; xp += 120; }
  return Math.min(MATCH_XP, Math.round(xp * (t.team ? 2 : 1.5)) + extra);
}
const rid = (n) => { const b = new Uint8Array(n); crypto.getRandomValues(b); return [...b].map((x) => x.toString(16).padStart(2, "0")).join(""); };
async function sha(s) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
function nameErr(n) {
  if (!NAME_RE.test(n || "")) return "Use 3 to 16 letters, numbers or _";
  const l = n.toLowerCase();
  if (RESERVED.indexOf(l) >= 0) return "That name is taken";
  if (BAD.some((w) => l.indexOf(w) >= 0)) return "Pick a different name";
  return "";
}

export class Hub extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    for (const q of [
      "CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT, lname TEXT UNIQUE, key TEXT, look TEXT DEFAULT '{}', rating INTEGER DEFAULT 1000, wins INTEGER DEFAULT 0, losses INTEGER DEFAULT 0, created INTEGER, seen INTEGER)",
      "CREATE TABLE IF NOT EXISTS friends(a TEXT, b TEXT, PRIMARY KEY(a, b))",
      "CREATE TABLE IF NOT EXISTS reqs(f TEXT, t TEXT, at INTEGER, PRIMARY KEY(f, t))",
      "CREATE TABLE IF NOT EXISTS party(uid TEXT PRIMARY KEY, leader TEXT)",
      "CREATE TABLE IF NOT EXISTS invites(f TEXT, t TEXT, at INTEGER, PRIMARY KEY(f, t))",
      "CREATE TABLE IF NOT EXISTS queue(leader TEXT PRIMARY KEY, mode TEXT, n INTEGER, rating INTEGER, at INTEGER)",
      "CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY, mode TEXT, ranked INTEGER, host TEXT, members TEXT, created INTEGER, done INTEGER DEFAULT 0, opts TEXT)",
      "CREATE TABLE IF NOT EXISTS mres(mid TEXT, uid TEXT, won INTEGER, PRIMARY KEY(mid, uid))",
      "CREATE TABLE IF NOT EXISTS gifts(id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, kind TEXT, val TEXT, at INTEGER, by TEXT)",
      "CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY AUTOINCREMENT, f TEXT, t TEXT, why TEXT, at INTEGER)",
      "CREATE TABLE IF NOT EXISTS sessions(tok TEXT PRIMARY KEY, uid TEXT, at INTEGER)",
      "CREATE TABLE IF NOT EXISTS namereq(id INTEGER PRIMARY KEY AUTOINCREMENT, uid TEXT, want TEXT, why TEXT, at INTEGER)",
      "CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT)",
      "CREATE TABLE IF NOT EXISTS seenby(uid TEXT, k TEXT, at INTEGER, PRIMARY KEY(uid, k))",
      "CREATE TABLE IF NOT EXISTS bans(k TEXT PRIMARY KEY, uid TEXT, at INTEGER)"
    ]) this.sql.exec(q);
    // columns added after the first version
    for (const c of ["admin INTEGER DEFAULT 0", "banned INTEGER DEFAULT 0", "save TEXT", "saved INTEGER DEFAULT 0", "wal TEXT", "pw TEXT", "renamed INTEGER DEFAULT 0"]) { try { this.sql.exec("ALTER TABLE users ADD COLUMN " + c); } catch (e) {} }
    // once: account codes stop working (everyone logs in with a username and passcode now), admins get their passcodes
    if (!this.sql.exec("SELECT 1 FROM meta WHERE k = 'passcodes'").toArray().length) {
      this.sql.exec("UPDATE users SET key = NULL");
      for (const n of Object.keys(ADMIN_PASS)) this.sql.exec("UPDATE users SET pw = ? WHERE lname = ? AND pw IS NULL", ADMIN_PASS[n][0] + ":" + ADMIN_PASS[n][1], n);
      this.sql.exec("INSERT INTO meta(k, v) VALUES('passcodes', ?)", String(now()));
    }
    // once: ranks move to rank points, and everyone starts again at zero (Bronze)
    if (!this.sql.exec("SELECT 1 FROM meta WHERE k = 'rp1'").toArray().length) { this.sql.exec("UPDATE users SET rating = 0"); this.sql.exec("INSERT INTO meta(k, v) VALUES('rp1', ?)", String(now())); }
    this.fails = new Map();
    // keep-alive pings are answered without waking the object, so idle players cost nothing
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(req) {
    // the network a player connects from is kept only as a short hash, for bans
    const ip = req.headers.get("CF-Connecting-IP") || "", iph = ip ? (await sha("megs-ip:" + ip)).slice(0, 24) : "";
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ uid: null, n: 0, t: now(), ip: iph });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // ---------- sockets ----------
  socks(uid) { return this.ctx.getWebSockets().filter((w) => { const a = w.deserializeAttachment(); return a && a.uid === uid; }); }
  online(uid) { return this.socks(uid).length > 0; }
  send(ws, o) { try { ws.send(JSON.stringify(o)); } catch (e) {} }
  to(uid, o) { const s = JSON.stringify(o); for (const w of this.socks(uid)) { try { w.send(s); } catch (e) {} } }
  user(id) { return this.sql.exec("SELECT id, name, look, rating, wins, losses, admin, banned FROM users WHERE id = ?", id).toArray()[0]; }
  pub(id) { const u = this.user(id); if (!u) return null; let look = {}; try { look = JSON.parse(u.look); } catch (e) {} return { id: u.id, name: u.name, look, rating: u.rating, admin: !!u.admin, on: this.online(id) }; }
  isAdmin(id) { const u = this.user(id); return !!(u && u.admin); }
  // what others see you wearing: only things this account really owns
  cleanLook(look, admin, uid) {
    const o = {}, inv = uid ? (this.wal(uid).inv) : {}; if (!look || typeof look !== "object") return "{}";
    for (const k of Object.keys(look).slice(0, 16)) {
      const v = look[k];
      if (typeof v === "string" && IT[v]) { if (has(v, "a") ? !admin : !(inv[v] || has(v, "f"))) continue; }
      else if (!admin && typeof v === "string" && ADMIN_ITEMS.indexOf(v) >= 0) continue;
      o[k] = v;
    }
    return JSON.stringify(o).slice(0, 3000);
  }
  // ---------- wallets ----------
  wal(uid) {
    const r = this.sql.exec("SELECT wal, save, created, admin FROM users WHERE id = ?", uid).toArray()[0];
    if (!r) return freshWal();
    let w = null; try { w = JSON.parse(r.wal || "null"); } catch (e) {}
    if (!w) {
      w = freshWal(); let d = null; try { d = JSON.parse(r.save || "null"); } catch (e) {}
      if (d) { importSave(w, d, r.created < CUTOFF, !!r.admin); w.imp = 1; }
      this.putWal(uid, w);
    }
    if (r.admin) for (const id of ADMIN_ITEMS) if (IT[id] && !w.inv[id]) w.inv[id] = 1;
    if (!r.admin) for (const id of ADMIN_ITEMS) delete w.inv[id];
    for (const id of CAT.free) if (!w.inv[id]) w.inv[id] = 1;
    rankGive(w);
    passOf(w);
    return w;
  }
  putWal(uid, w) { this.sql.exec("UPDATE users SET wal = ? WHERE id = ?", JSON.stringify(w), uid); }
  walOut(w) { const o = {}; for (const k of WAL_KEYS) o[k] = w[k]; return o; }
  pushWal(uid, w) { this.to(uid, { t: "wal", wal: this.walOut(w || this.wal(uid)) }); }
  withWal(d, w) { if (d && typeof d === "object") for (const k of WAL_KEYS) d[k] = w[k]; return d; }
  pushGifts(uid) { const list = this.sql.exec("SELECT id, kind, val FROM gifts WHERE uid = ?", uid).toArray(); if (list.length) this.to(uid, { t: "gift", list }); }
  summary(id) {
    const r = this.sql.exec("SELECT save, saved, seen FROM users WHERE id = ?", id).toArray()[0] || {}; let d = null; try { d = JSON.parse(r.save || "null"); } catch (e) {}
    return d ? { coins: d.coins | 0, lvl: d.lvl | 0, items: Object.keys(d.inv || {}).length, saved: r.saved, seen: r.seen } : { seen: r.seen };
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > (raw.startsWith('{"t":"save"') ? 400000 : 8192)) return;
    const a = ws.deserializeAttachment() || {};
    // simple flood guard: at most 80 messages a second per connection
    const t = now();
    if (t - a.t > 1000) { a.t = t; a.n = 0; }
    if (++a.n > 80) { ws.serializeAttachment(a); return; }
    ws.serializeAttachment(a);
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== "string") return;
    try {
      if (!a.uid) return await this.anon(ws, a, m);
      await this.handle(ws, a.uid, m);
    } catch (e) { this.send(ws, { t: "err", c: "server", msg: String(e && e.message || e).slice(0, 200) }); }
  }

  async webSocketClose(ws) { this.drop(ws); }
  async webSocketError(ws) { this.drop(ws); }

  drop(ws) {
    const a = ws.deserializeAttachment() || {};
    if (!a.uid) return;
    try { ws.close(1000, "bye"); } catch (e) {}
    if (this.socks(a.uid).some((w) => w !== ws)) return;   // still connected in another tab
    this.offline(a.uid);
  }
  offline(uid) {
    this.sql.exec("UPDATE users SET seen = ? WHERE id = ?", now(), uid);
    this.unqueue(uid);
    this.leaveMatch(uid, true);
    this.leaveParty(uid);
    this.tellFriends(uid);
  }

  // ---------- bans stick to the devices and networks a banned account used ----------
  keysOf(a) { const k = []; if (a.dev) k.push("dev:" + a.dev); if (a.ip) k.push("ip:" + a.ip); return k; }
  // a banned device is blocked for good; a banned network only stops new accounts, and only for a week (schools share one)
  blocked(a, signup) {
    for (const k of this.keysOf(a)) {
      const b = this.sql.exec("SELECT at FROM bans WHERE k = ?", k).toArray()[0];
      if (b && (k.startsWith("dev:") || (signup && now() - b.at < 7 * 86400000))) return true;
    }
    return false;
  }
  remember(uid, a) { for (const k of this.keysOf(a)) this.sql.exec("INSERT INTO seenby(uid, k, at) VALUES(?, ?, ?) ON CONFLICT(uid, k) DO UPDATE SET at = excluded.at", uid, k, now()); }
  banKeys(uid) {
    const ks = new Set(this.sql.exec("SELECT k FROM seenby WHERE uid = ?", uid).toArray().map((r) => r.k));
    for (const w of this.socks(uid)) for (const k of this.keysOf(w.deserializeAttachment() || {})) ks.add(k);
    for (const k of ks) this.sql.exec("INSERT INTO bans(k, uid, at) VALUES(?, ?, ?) ON CONFLICT(k) DO UPDATE SET uid = excluded.uid, at = excluded.at", k, uid, now());
  }
  // a new session for a device that just logged in; the device keeps the token, the server only its hash
  async session(ws, a, uid) {
    const tok = rid(24);
    this.sql.exec("INSERT INTO sessions(tok, uid, at) VALUES(?, ?, ?)", await sha(tok), uid, now());
    a.uid = uid; a.tok = await sha(tok); ws.serializeAttachment(a);
    this.remember(uid, a);
    const u = this.user(uid);
    this.send(ws, { t: "me", id: uid, tok, ...this.pub(uid), ...this.mine(uid), wins: u.wins, losses: u.losses });
    return this.hello(uid);
  }
  mine(uid) {
    const r = this.sql.exec("SELECT renamed FROM users WHERE id = ?", uid).toArray()[0] || {}, q = this.sql.exec("SELECT want FROM namereq WHERE uid = ?", uid).toArray()[0];
    return { renamed: !!r.renamed, asked: q ? q.want : null };
  }
  async anon(ws, a, m) {
    if (m.dev && /^[a-z0-9]{16,40}$/.test(String(m.dev)) && a.dev !== m.dev) { a.dev = String(m.dev); ws.serializeAttachment(a); }
    const BANNED = { t: "err", c: "banned", msg: "This device has been banned from Megs." };
    // pages older than the bank would undo purchases when they save; they are told to refresh instead
    if (["hello", "signup", "login"].indexOf(m.t) >= 0 && !(+m.ver >= MIN_VER)) return this.send(ws, { t: "err", c: "old", msg: "A new version of Megs is out. Refresh the page to keep playing." });
    if (m.t === "chk") return this.send(ws, this.blocked(a, false) ? BANNED : { t: "ok", c: "free" });
    if (m.t === "signup") {
      if (this.blocked(a, true)) return this.send(ws, BANNED);
      const name = String(m.name || "").trim(), e = nameErr(name) || passErr(m.pass);
      if (e) return this.send(ws, { t: "err", c: "name", msg: e });
      if (this.sql.exec("SELECT 1 FROM users WHERE lname = ?", name.toLowerCase()).toArray().length) return this.send(ws, { t: "err", c: "name", msg: "That name is taken" });
      const id = rid(8), salt = rid(16);
      this.sql.exec("INSERT INTO users(id, name, lname, look, created, seen, pw) VALUES(?, ?, ?, ?, ?, ?, ?)", id, name, name.toLowerCase(), "{}", now(), now(), salt + ":" + await passHash(String(m.pass), salt));
      return this.session(ws, a, id);
    }
    if (m.t === "login") {
      // a few wrong passcodes in a row and that username has to wait a bit
      const ln = String(m.name || "").trim().toLowerCase(), f = this.fails.get(ln) || { n: 0, at: now() };
      if (now() - f.at > 600000) { f.n = 0; f.at = now(); }
      if (f.n >= 8) return this.send(ws, { t: "err", c: "auth", msg: "Too many tries. Wait a few minutes and try again." });
      const r = this.sql.exec("SELECT id, pw, banned FROM users WHERE lname = ?", ln).toArray()[0];
      let ok = false;
      if (r && r.pw) { const [salt, h] = r.pw.split(":"); ok = (await passHash(String(m.pass || ""), salt)) === h; }
      if (!ok) { f.n++; this.fails.set(ln, f); return this.send(ws, { t: "err", c: "auth", msg: r && !r.pw ? "This account needs a new passcode. Ask an admin to set one." : "Wrong username or passcode." }); }
      this.fails.delete(ln);
      if (r.banned) return this.send(ws, { t: "err", c: "banned", msg: "This account has been banned." });
      if (!this.user(r.id).admin && this.blocked(a, false)) return this.send(ws, BANNED);
      return this.session(ws, a, r.id);
    }
    if (m.t === "hello") {
      const tk = await sha(String(m.tok || "")), r = this.sql.exec("SELECT uid FROM sessions WHERE tok = ? AND uid = ?", tk, String(m.id || "")).toArray()[0];
      if (!r) return this.send(ws, { t: "err", c: "auth", msg: "Please log in again.", out: 1 });
      if (this.user(m.id).banned) return this.send(ws, { t: "err", c: "banned", msg: "This account has been banned." });
      if (!this.user(m.id).admin && this.blocked(a, false)) return this.send(ws, BANNED);
      a.uid = m.id; a.tok = tk; ws.serializeAttachment(a); this.remember(m.id, a);
      this.sql.exec("UPDATE sessions SET at = ? WHERE tok = ?", now(), tk);
      const u = this.user(m.id);
      this.send(ws, { t: "me", id: m.id, ...this.pub(m.id), ...this.mine(m.id), wins: u.wins, losses: u.losses });
      return this.hello(m.id);
    }
    this.send(ws, { t: "err", c: "auth", msg: "Log in first" });
  }

  hello(uid) {
    this.sql.exec("UPDATE users SET seen = ? WHERE id = ?", now(), uid);
    // your saved progress, so any device you sign in on carries on where you left off
    const sv = this.sql.exec("SELECT save, saved FROM users WHERE id = ?", uid).toArray()[0] || {};
    let data = null; try { data = JSON.parse(sv.save || "null"); } catch (e) {}
    const w = this.wal(uid);
    // a brand-new wallet waits for the device's first save, so what the player already has comes with them
    this.to(uid, { t: "save", data: w.imp ? this.withWal(data, w) : data, at: sv.saved || 0 });
    if (w.imp) this.pushWal(uid, w);
    this.pushFriends(uid);
    this.tellFriends(uid);
    this.pushParty(uid);
    // reconnecting into a match that is still running
    const mt = this.myMatch(uid);
    if (mt) this.to(uid, this.matchMsg(mt, uid));
    for (const r of this.sql.exec("SELECT f FROM invites WHERE t = ? AND at > ?", uid, now() - 120000).toArray()) { const p = this.pub(r.f); if (p) this.to(uid, { t: "invite", from: p }); }
  }

  // ---------- friends ----------
  friendIds(uid) { return this.sql.exec("SELECT b FROM friends WHERE a = ?", uid).toArray().map((r) => r.b); }
  isFriend(a, b) { return this.sql.exec("SELECT 1 FROM friends WHERE a = ? AND b = ?", a, b).toArray().length > 0; }
  pushFriends(uid) {
    const list = this.friendIds(uid).map((id) => { const p = this.pub(id); if (p) p.party = this.leaderOf(id) || null; return p; }).filter(Boolean);
    const reqs = this.sql.exec("SELECT f FROM reqs WHERE t = ?", uid).toArray().map((r) => this.pub(r.f)).filter(Boolean);
    const sent = this.sql.exec("SELECT t FROM reqs WHERE f = ?", uid).toArray().map((r) => this.pub(r.t)).filter(Boolean);
    this.to(uid, { t: "friends", list, reqs, sent });
  }
  tellFriends(uid) { for (const f of this.friendIds(uid)) if (this.online(f)) this.pushFriends(f); }

  // ---------- parties ----------
  leaderOf(uid) { const r = this.sql.exec("SELECT leader FROM party WHERE uid = ?", uid).toArray()[0]; return r ? r.leader : null; }
  members(leader) { return this.sql.exec("SELECT uid FROM party WHERE leader = ?", leader).toArray().map((r) => r.uid); }
  pushParty(uid) {
    const L = this.leaderOf(uid);
    if (!L) return this.to(uid, { t: "party", leader: null, members: [] });
    const msg = { t: "party", leader: L, members: this.members(L).map((id) => this.pub(id)).filter(Boolean) };
    this.to(uid, msg);
  }
  pushPartyAll(L) { for (const id of this.members(L)) this.pushParty(id); }
  leaveParty(uid) {
    const L = this.leaderOf(uid);
    if (!L) return;
    this.unqueue(L);
    this.sql.exec("DELETE FROM party WHERE uid = ?", uid);
    let rest = this.members(L);
    if (rest.length === 1) { this.sql.exec("DELETE FROM party WHERE leader = ?", L); this.pushParty(rest[0]); rest = []; }
    else if (rest.length && L === uid) {
      const nl = rest.find((id) => this.online(id)) || rest[0];
      this.sql.exec("UPDATE party SET leader = ? WHERE leader = ?", nl, L);
      this.pushPartyAll(nl);
    } else if (rest.length) this.pushPartyAll(L);
    this.pushParty(uid);
    for (const id of rest.concat([uid])) this.tellFriends(id);
  }

  // ---------- matchmaking ----------
  unqueue(leader) {
    if (this.sql.exec("SELECT 1 FROM queue WHERE leader = ?", leader).toArray().length) {
      this.sql.exec("DELETE FROM queue WHERE leader = ?", leader);
      for (const id of this.members(leader).length ? this.members(leader) : [leader]) this.to(id, { t: "queue", on: false });
    }
  }
  unitOf(leader) { const m = this.members(leader); return m.length ? m : [leader]; }
  async tryMatch() {
    const rows = this.sql.exec("SELECT leader, mode, n, rating, at FROM queue ORDER BY at").toArray();
    const t = now();
    for (const mode of Object.keys(MODES)) {
      const M = MODES[mode], q = rows.filter((r) => r.mode === mode);
      if (M.prac) continue;
      if (M.size === 1) {
        // pair players; ranked widens the rating window the longer you wait
        const used = new Set();
        for (const a of q) {
          if (used.has(a.leader)) continue;
          let best = null;
          for (const b of q) {
            if (b === a || used.has(b.leader)) continue;
            const win = M.ranked && t - Math.min(a.at, b.at) < WAIT_BOTS - 1500 ? 100 + (t - Math.min(a.at, b.at)) / 1000 * 15 : 1e9;
            const d = Math.abs(a.rating - b.rating);
            if (d <= win && (!best || d < Math.abs(a.rating - best.rating))) best = b;
          }
          if (best) { used.add(a.leader); used.add(best.leader); this.startMatch(mode, [[a.leader], [best.leader]], !!M.ranked); }
        }
      } else if (q.length) {
        // fill teammates first, then the other side, oldest first; start when both sides are full,
        // or once the oldest has waited 15 seconds (computer players fill the empty spots)
        const A = [], B = [], took = [];
        for (const r of q) {
          const u = this.unitOf(r.leader);
          if (A.length + u.length <= M.size) A.push(...u); else if (B.length + u.length <= M.size) B.push(...u); else continue;
          took.push(r.leader);
        }
        const full = A.length === M.size && B.length === M.size, old = t - q[0].at >= WAIT_BOTS;
        if (full || old) { if (this.lob) delete this.lob[mode]; this.startMatch(mode, [A, B], !!M.ranked); continue; }
        // still gathering: tell everyone waiting who has joined so far and how long is left
        const sig = mode + ":" + A.join(",") + "|" + B.join(",");
        this.lob = this.lob || {};
        if (this.lob[mode] !== sig) {
          this.lob[mode] = sig;
          const nm = (id) => (this.user(id) || {}).name || "Player";
          const msg = { t: "lobby", mode, size: M.size, sides: [A.map(nm), B.map(nm)], ends: q[0].at + WAIT_BOTS };
          for (const id of [...A, ...B]) this.to(id, msg);
        }
      }
    }
    // anyone still waiting after 15 seconds plays with computer players instead
    for (const r of this.sql.exec("SELECT leader, mode, at FROM queue ORDER BY at").toArray()) {
      const M = MODES[r.mode]; if (!M || (M.size > 1 && !M.prac) || t - r.at < (M.prac ? 0 : WAIT_BOTS)) continue;
      this.startMatch(r.mode, [this.unitOf(r.leader), []], !!M.ranked);
    }
    if (this.sql.exec("SELECT 1 FROM queue").toArray().length) await this.ctx.storage.setAlarm(now() + 1000);
  }
  async alarm() { await this.tryMatch(); }

  startMatch(mode, sides, ranked, host, opts) {
    const id = rid(6), all = sides.flat();
    opts = Object.assign({ seed: Math.floor(Math.random() * 1e9) }, opts || {});
    for (const u of all) { const L = this.leaderOf(u) || u; this.sql.exec("DELETE FROM queue WHERE leader = ?", L); }
    const members = [];
    sides.forEach((s, i) => s.forEach((u) => members.push({ id: u, side: i })));
    this.sql.exec("INSERT INTO matches(id, mode, ranked, host, members, created, opts) VALUES(?, ?, ?, ?, ?, ?, ?)", id, mode, ranked ? 1 : 0, host || all[0], JSON.stringify(members), now(), JSON.stringify(opts || null).slice(0, 2000));
    const mt = this.match(id);
    for (const u of all) this.to(u, this.matchMsg(mt, u));
    return mt;
  }
  match(id) { const r = this.sql.exec("SELECT * FROM matches WHERE id = ?", id).toArray()[0]; if (r) { r.members = JSON.parse(r.members); try { r.opts = JSON.parse(r.opts); } catch (e) { r.opts = null; } } return r; }
  myMatch(uid) {
    for (const r of this.sql.exec("SELECT id, members FROM matches WHERE done = 0 AND created > ?", now() - 3 * 3600e3).toArray())
      if (JSON.parse(r.members).some((m) => m.id === uid && !m.left)) return this.match(r.id);
    return null;
  }
  matchMsg(mt, uid) {
    return { t: "match", id: mt.id, mode: mt.mode, ranked: !!mt.ranked, host: mt.host, you: uid, opts: mt.opts || null,
      members: mt.members.map((m) => ({ ...this.pub(m.id), side: m.side, left: !!m.left })) };
  }
  leaveMatch(uid, dropped) {
    const mt = this.myMatch(uid);
    if (!mt) return;
    const me = mt.members.find((m) => m.id === uid); me.left = 1;
    // walking out of (or dropping from) a ranked game against people that isn't over is a forfeit: it costs rank points
    if (mt.ranked && !mt.done && !me.pen && mt.members.length > 1) {
      me.pen = 1; const w = this.wal(uid); w.rp = Math.max(0, (w.rp || 0) - 16); w.tk = null; this.putWal(uid, w);
      this.sql.exec("UPDATE users SET rating = ? WHERE id = ?", w.rp, uid);
      for (const ws of this.socks(uid)) this.send(ws, { t: "wal", wal: this.walOut(w) });
    }
    this.sql.exec("UPDATE matches SET members = ? WHERE id = ?", JSON.stringify(mt.members), mt.id);
    const rest = mt.members.filter((m) => !m.left);
    for (const m of rest) this.to(m.id, { t: "gone", mid: mt.id, id: uid, host: mt.host === uid, dropped: !!dropped });
    if (!rest.length || mt.host === uid) this.sql.exec("UPDATE matches SET done = 1 WHERE id = ?", mt.id);
  }
  // ranked: rating changes once every player has reported and the reports agree (a quitter counts as a loss)
  settle(mid, force) {
    const mt = this.match(mid);
    if (!mt || !mt.ranked) return;
    if (this.sql.exec("SELECT 1 FROM mres WHERE mid = ? AND uid = 'settled'", mid).toArray().length) return;
    const res = this.sql.exec("SELECT uid, won FROM mres WHERE mid = ?", mid).toArray();
    const by = {}; res.forEach((r) => (by[r.uid] = r.won));
    const ids = mt.members.map((m) => m.id);
    if (ids.length !== 2) return;
    const [a, b] = ids, ra = by[a], rb = by[b];
    let winner = null;
    if (ra !== undefined && rb !== undefined) { if (ra === 1 && rb === 0) winner = a; else if (rb === 1 && ra === 0) winner = b; else if (!force) return; }
    else if (ra === 0 && rb === undefined) winner = b;
    else if (rb === 0 && ra === undefined) winner = a;
    else if (!force) return;
    this.sql.exec("UPDATE matches SET done = 1 WHERE id = ?", mid);
    this.sql.exec("INSERT OR REPLACE INTO mres(mid, uid, won) VALUES(?, 'settled', 1)", mid);
    if (!winner) return;
    const loser = winner === a ? b : a, W = this.user(winner), Lu = this.user(loser);
    const exp = 1 / (1 + Math.pow(10, (Lu.rating - W.rating) / 400)), d = Math.max(5, Math.round(32 * (1 - exp)));
    this.sql.exec("UPDATE users SET rating = rating + ?, wins = wins + 1 WHERE id = ?", d, winner);
    this.sql.exec("UPDATE users SET rating = MAX(0, rating - ?), losses = losses + 1 WHERE id = ?", d, loser);
    this.to(winner, { t: "rated", mid, delta: d, rating: W.rating + d });
    this.to(loser, { t: "rated", mid, delta: -d, rating: Math.max(0, Lu.rating - d) });
  }

  // ---------- admin tools: only for accounts with the admin flag ----------
  async admin(ws, uid, m) {
    if (!this.isAdmin(uid)) return this.send(ws, { t: "err", c: "adm", msg: "Admins only." });
    const op = String(m.op || ""), id = String(m.id || ""), out = (o) => this.send(ws, { t: "adm", op, ...o });
    if (op === "find") {
      const q = String(m.q || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16);
      const list = this.sql.exec("SELECT id, name, rating, admin, banned FROM users WHERE lname >= ? AND lname < ? ORDER BY lname LIMIT 20", q, q + "\uffff").toArray()
        .map((u) => ({ ...u, on: this.online(u.id), ...this.summary(u.id) }));
      return out({ list });
    }
    if (op === "online" || op === "all") {
      // everyone online right now, or every account there is (most recently seen first)
      const ids = new Set(); for (const w of this.ctx.getWebSockets()) { const a = w.deserializeAttachment(); if (a && a.uid) ids.add(a.uid); }
      const guests = this.ctx.getWebSockets().filter((w) => { const a = w.deserializeAttachment(); return !(a && a.uid); }).length;
      const rows = op === "online" ? [...ids].map((i) => this.sql.exec("SELECT id, name, rating, admin, banned, created, seen FROM users WHERE id = ?", i).toArray()[0]).filter(Boolean)
        : this.sql.exec("SELECT id, name, rating, admin, banned, created, seen FROM users ORDER BY seen DESC LIMIT 1000").toArray();
      const total = this.sql.exec("SELECT COUNT(*) AS c FROM users").one().c;
      return out({ list: rows.map((r) => ({ ...r, on: ids.has(r.id), ...this.summary(r.id) })), total, guests });
    }
    if (op === "names") {
      const list = this.sql.exec("SELECT id, uid, want, why, at FROM namereq ORDER BY id").toArray().map((r) => ({ ...r, name: (this.user(r.uid) || {}).name }));
      return out({ list });
    }
    if (op === "nameok" || op === "nameno") {
      const r = this.sql.exec("SELECT uid, want FROM namereq WHERE id = ?", +m.rid).toArray()[0];
      if (!r) return out({ rid: +m.rid });
      this.sql.exec("DELETE FROM namereq WHERE id = ?", +m.rid);
      if (op === "nameok") {
        if (this.sql.exec("SELECT 1 FROM users WHERE lname = ? AND id != ?", r.want.toLowerCase(), r.uid).toArray().length) return this.send(ws, { t: "err", c: "adm", msg: "That name was taken in the meantime." });
        this.sql.exec("UPDATE users SET name = ?, lname = ? WHERE id = ?", r.want, r.want.toLowerCase(), r.uid); this.tellFriends(r.uid);
      }
      this.to(r.uid, { t: "me", id: r.uid, ...this.pub(r.uid), ...this.mine(r.uid) });
      this.to(r.uid, { t: "ok", c: op === "nameok" ? "nameok" : "nameno", name: r.want });
      return out({ rid: +m.rid, name: r.want });
    }
    const u = this.user(id);
    if (op === "setpass") {
      if (!u) return this.send(ws, { t: "err", c: "adm", msg: "No such player." });
      const e = passErr(m.pass); if (e) return this.send(ws, { t: "err", c: "adm", msg: e });
      const salt = rid(16); this.sql.exec("UPDATE users SET pw = ? WHERE id = ?", salt + ":" + await passHash(String(m.pass), salt), id);
      // every device that account was logged in on has to log in again with the new passcode
      this.sql.exec("DELETE FROM sessions WHERE uid = ?", id);
      for (const w of this.socks(id)) { this.send(w, { t: "err", c: "auth", msg: "Your passcode was changed. Please log in again.", out: 1 }); const a = w.deserializeAttachment(); a.uid = null; a.tok = null; w.serializeAttachment(a); }
      if (id !== uid) this.offline(id);
      return out({ id, name: u.name });
    }
    if (op === "reports") {
      const list = this.sql.exec("SELECT id, f, t, why, at FROM reports ORDER BY id DESC LIMIT 50").toArray().map((r) => ({ ...r, fn: (this.user(r.f) || {}).name, tn: (this.user(r.t) || {}).name, tb: !!(this.user(r.t) || {}).banned }));
      return out({ list });
    }
    if (op === "rdel") { this.sql.exec("DELETE FROM reports WHERE id = ?", +m.rid); return out({ rid: +m.rid }); }
    if (!u) return this.send(ws, { t: "err", c: "adm", msg: "No such player." });
    if (op === "give") {
      const coins = Math.max(0, Math.min(1000000, Math.floor(+m.coins || 0))), item = String(m.item || "").slice(0, 40);
      if (item && ADMIN_ITEMS.indexOf(item) >= 0 && !u.admin) return this.send(ws, { t: "err", c: "adm", msg: "Admin skins can only go to admins." });
      if (item && !IT[item]) return this.send(ws, { t: "err", c: "adm", msg: "No such item." });
      const w = this.wal(id), list = [];
      if (coins) { w.coins += coins; list.push({ kind: "coins", val: String(coins) }); }
      if (item) { give(w, item); list.push({ kind: "item", val: item }); }
      this.putWal(id, w); this.pushWal(id, w); this.to(id, { t: "gift", list, applied: 1 });
      return out({ id, name: u.name, coins, item });
    }
    if (op === "ban" || op === "unban") {
      if (u.admin) return this.send(ws, { t: "err", c: "adm", msg: "Admins can't be banned." });
      this.sql.exec("UPDATE users SET banned = ? WHERE id = ?", op === "ban" ? 1 : 0, id);
      if (op === "unban") this.sql.exec("DELETE FROM bans WHERE uid = ?", id);
      if (op === "ban") { this.banKeys(id); this.sql.exec("DELETE FROM sessions WHERE uid = ?", id); for (const w of this.socks(id)) { this.send(w, { t: "err", c: "banned", msg: "This account has been banned." }); try { w.close(4003, "banned"); } catch (e) {} } this.unqueue(id); this.leaveMatch(id, true); this.leaveParty(id); this.tellFriends(id); }
      return out({ id, name: u.name });
    }
    if (op === "rename") {
      const name = String(m.name || "").trim(), e = nameErr(name);
      if (e) return this.send(ws, { t: "err", c: "adm", msg: e });
      const o = this.sql.exec("SELECT id FROM users WHERE lname = ?", name.toLowerCase()).toArray()[0];
      if (o && o.id !== id) return this.send(ws, { t: "err", c: "adm", msg: "That name is taken" });
      this.sql.exec("UPDATE users SET name = ?, lname = ? WHERE id = ?", name, name.toLowerCase(), id);
      this.to(id, { t: "me", id, ...this.pub(id) }); this.tellFriends(id);
      return out({ id, name });
    }
  }

  // ---------- the bank's transactions: every coin and item change goes through here ----------
  tx(ws, uid, m) {
    const w = this.wal(uid), op = String(m.op || ""), rid = m.rid, d0 = day(), e = w.earn || (w.earn = { d: 0, c: 0, x: 0, last: 0 });
    if (e.d !== d0) { e.d = d0; e.c = 0; e.x = 0; }
    const fail = (msg) => this.send(ws, { t: "tx", rid, op, ok: false, msg, wal: this.walOut(w) });
    const done = (res) => { this.putWal(uid, w); this.send(ws, { t: "tx", rid, op, ok: true, res: res || null, wal: this.walOut(w) }); };
    const addXp = (n) => { n = Math.max(0, Math.min(XP_MAX, Math.floor(+n || 0), DAY_XP - e.x)); e.x += n; passOf(w).xp += n; return n; };
    if (op === "sync") return done();
    if (op === "start") {
      // kick-off: the match gets a ticket; the rewards at the end need it
      const size = num(m.size, 5) || 1;
      w.tk = { id: String(rid) + ":" + now(), at: now(), ranked: !!m.ranked, team: !!m.team, size, mode: String(m.mode || "").slice(0, 20) };
      return done({ tk: w.tk.id });
    }
    if (op === "end") {
      const t = w.tk, res = { coins: 0, xp: 0, rp: 0, bp: null, capped: [] };
      if (!t || t.id !== String(m.tk || "")) return fail("That match didn't start properly, so it can't pay out.");
      w.tk = null;
      // a match can't be over faster than a real one
      const min = t.team ? 60000 : t.ranked ? 40000 : 15000, r = cleanRes(m.res);
      if (r.quit) {
        // a forfeit earns nothing, however long it lasted; in ranked it still costs rank points
        if (t.ranked) { w.rp = Math.max(0, (w.rp || 0) - 16); res.rp = -16; this.sql.exec("UPDATE users SET rating = ? WHERE id = ?", w.rp, uid); }
        res.quit = 1; return done(res);
      }
      if (now() - t.at < min) { this.putWal(uid, w); return fail("That match was too short to count."); }
      if (r.win) {
        const c = Math.min(WIN_COINS, DAY_COINS - e.c); if (c > 0) { w.coins += c; e.c += c; res.coins = c; } else res.capped.push("coins");
        if (Math.random() < CAT.bpChance) { const pool = Object.keys(IT).filter((id) => has(id, "c") && !w.inv[id] && (w.bp[id] || 0) < CAT.bpN); if (pool.length) { const id = pick(pool); w.bp[id] = (w.bp[id] || 0) + 1; res.bp = { id, n: w.bp[id], seen: !!w.seen[id] }; } }
      }
      let fw = 0; if (r.win && e.fw !== d0) { e.fw = d0; fw = 100; }   // first win of the day
      const want = Math.min(MATCH_XP, passCalc(r, t) + fw), got = Math.max(0, Math.min(want, DAY_XP - e.x)); e.x += got; passOf(w).xp += got; res.xp = got; if (got < want) res.capped.push("xp");
      if (t.ranked) {
        let pts = rankCalc(r);
        if (!w.rpd || w.rpd.d !== d0) w.rpd = { d: d0, g: 0 };
        if (pts > 0) { const left = Math.max(0, RP_DAY - w.rpd.g); if (pts > left) { pts = left; res.capped.push("rp"); } w.rpd.g += pts; }
        w.rp = Math.max(0, (w.rp || 0) + pts); res.rp = pts; w.rpk = Math.max(w.rpk || 0, w.rp); res.ranked = rankGive(w);
        this.sql.exec("UPDATE users SET rating = ? WHERE id = ?", w.rp, uid);
      }
      return done(res);
    }
    if (op === "xp") {
      // pass XP that isn't from a match: daily quests, weekly challenges, the campaign. Each kind has its own limit
      const why = String(m.why || ""), wk = Math.floor((d0 + 3) / 7), b = w.bx && w.bx.d === d0 ? w.bx : (w.bx = { d: d0, q: 0, o: 0, w: (w.bx && w.bx.wk === wk ? w.bx.w : 0), wk });
      if (b.wk !== wk) { b.wk = wk; b.w = 0; }
      let n = Math.floor(+m.n || 0);
      if (why === "quest") { if (b.q >= 4) return fail("Daily quest XP is used up for today."); b.q++; n = Math.min(n, 1500); }
      else if (why === "week") { if (b.w >= 4) return fail("Weekly challenge XP is used up for this week."); b.w++; n = Math.min(n, 3000); }
      else { n = Math.max(0, Math.min(n, 2000, BONUS_DAY - b.o)); b.o += n; }
      return done({ xp: addXp(n) });
    }
    if (op === "unlock") { const got = []; for (const id of (Array.isArray(m.ids) ? m.ids : []).slice(0, 40)) if (has(id, "n") && !w.inv[id]) { w.inv[id] = 1; got.push(id); } return done({ got }); }
    if (op === "pack" || op === "free") {
      const pk = op === "free" ? "street" : String(m.id || ""), kind = op === "free" ? "" : String(m.kind || ""), n = op === "free" ? 1 : [1, 3, 10].indexOf(+m.n) >= 0 ? +m.n : 1, P = CAT.packs[pk];
      if (!P || (kind && !CAT.kindx[kind])) return fail("That pack doesn't exist.");
      if (op === "free") { const cd = Math.floor(+m.day || 0); if (!(cd > (w.free || 0) && Math.abs(cd - d0) <= 1)) return fail("Your daily crate is already open."); w.free = cd; }
      else { const c = packCost(pk, kind) * n; if (w.coins < c) return fail("Not enough coins."); w.coins -= c; }
      const out = [];
      for (let i = 0; i < n; i++) {
        let id;
        if (op === "free") id = roll(pk, false, "");
        else { w.pity[pk] = (w.pity[pk] || 0) + 1; id = roll(pk, w.pity[pk] >= P[2], kind); if (IT[id][0] >= CAT.leg) w.pity[pk] = 0; }
        const g = grant(w, id);
        if (op === "pack" && P[3]) { g.extra = []; for (let j = 0; j < P[3][0]; j++) g.extra.push(bonusBp(w)); passOf(w).xp += P[3][1]; g.extra.push("+" + P[3][1] + " pass XP"); }
        out.push(g);
      }
      return done({ got: out });
    }
    if (op === "buy" || op === "wbuy") {
      const id = String(m.id || ""), I = IT[id];
      if (!I || w.inv[id] || has(id, "n") || I[0] > CAT.leg || (op === "buy" ? (I[2] !== "pack" && I[2] !== "shop") || ["banner", "scene", "stadium"].indexOf(I[1]) >= 0 : I[2] !== "shop" || I[1] === "banner" || I[1] === "scene")) return fail("You can't buy that.");
      const price = op === "buy" ? CAT.price[I[0]] : CAT.shopp[I[0]] || 400;
      if (w.coins < price) return fail("Not enough coins.");
      w.coins -= price; w.inv[id] = 1; return done({ id });
    }
    if (op === "bp") {
      const id = String(m.id || "");
      if (!has(id, "c") || w.inv[id] || !w.seen[id] || (w.bp[id] || 0) < CAT.bpN) return fail("Not ready to build.");
      if (w.coins < CAT.bpCost) return fail("Not enough coins.");
      w.coins -= CAT.bpCost; w.inv[id] = 1; return done({ id });
    }
    if (op === "pass") {
      const p = passOf(w), t = tierOf(w), out = [];
      for (const k of (Array.isArray(m.ks) ? m.ks : []).slice(0, CAT.passN)) {
        const T = CAT.pass[k]; if (!T || p.got[k] || k >= t) continue;
        p.got[k] = 1; const g = { k, items: [], coins: T[1], pulls: [] };
        for (const id of T[0]) { if (IT[id]) { give(w, id); g.items.push(id); } }
        w.coins += T[1];
        if (T[2] && CAT.packs[T[2][0]]) for (let i = 0; i < T[2][1]; i++) g.pulls.push(grant(w, roll(T[2][0], false, "")));
        g.bps = []; for (let i = 0; i < (T[3] || 0); i++) g.bps.push(bonusBp(w));
        out.push(g);
      }
      return done({ got: out });
    }
    if (op === "bonus") { const p = passOf(w), n = Math.max(0, Math.floor(p.xp / CAT.passXp) - CAT.passN - (p.bon || 0)); p.bon = (p.bon || 0) + n; w.coins += n * CAT.bonus; return done({ coins: n * CAT.bonus }); }
    if (op === "code") {
      return sha("megs:" + String(m.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "")).then((h) => {
        const k = CODES[h]; if (!k) return fail("That code did not work."); if (w.codes[h]) return fail("You already used that code.");
        w.codes[h] = 1;
        if (k === "all") for (const id of Object.keys(IT)) { if (has(id, "a") || has(id, "u")) continue; if (!w.inv[id]) w.inv[id] = 1; if (has(id, "c")) { w.seen[id] = 1; w.bp[id] = CAT.bpN; } }
        if (k === "coins") w.coins += 50000;
        return done({ k });
      });
    }
    return fail("Unknown request.");
  }

  // ---------- messages from a signed-in player ----------
  async handle(ws, uid, m) {
    const t = m.t;
    if (t === "save") {
      const d = JSON.stringify(m.data || null);
      if (!m.data || typeof m.data !== "object" || d.length > 380000) return;
      const w = this.wal(uid), u = this.user(uid);
      if (!w.imp) { const c = this.sql.exec("SELECT created FROM users WHERE id = ?", uid).one().created; importSave(w, m.data, c < CUTOFF, !!u.admin); w.imp = 1; this.putWal(uid, w); this.pushWal(uid, w); }
      // the bank's numbers replace whatever the device sent; if the device was off, it gets told the real ones
      const off = m.data.coins !== w.coins || Object.keys(m.data.inv || {}).length !== Object.keys(w.inv).length;
      this.sql.exec("UPDATE users SET save = ?, saved = ? WHERE id = ?", JSON.stringify(this.withWal(m.data, w)), Math.min(+m.at || now(), now() + 60000), uid);
      if (off) this.pushWal(uid, w);
      return;
    }
    if (t === "tx") return this.tx(ws, uid, m);
    if (t === "gack") {
      for (const id of (Array.isArray(m.ids) ? m.ids : []).slice(0, 100)) this.sql.exec("DELETE FROM gifts WHERE id = ? AND uid = ?", +id, uid);
      return;
    }
    if (t === "claim") {
      const ok = (await sha("megs-admin:" + String(m.code || "").trim().toUpperCase())) === ADMIN_CLAIM;
      const n = this.sql.exec("SELECT COUNT(*) AS c FROM users WHERE admin = 1").one().c;
      if (!ok || n >= ADMIN_MAX || this.isAdmin(uid)) return this.send(ws, { t: "err", c: "claim", msg: "That code did not work." });
      this.sql.exec("UPDATE users SET admin = 1 WHERE id = ?", uid);
      this.to(uid, { t: "me", id: uid, ...this.pub(uid) });
      this.pushWal(uid);
      this.tellFriends(uid);
      return this.send(ws, { t: "ok", c: "admin" });
    }
    if (t === "report") {
      const id = String(m.id || ""); if (!this.user(id) || id === uid) return;
      if (this.sql.exec("SELECT COUNT(*) AS c FROM reports WHERE f = ?", uid).one().c >= 30) return;
      this.sql.exec("INSERT INTO reports(f, t, why, at) VALUES(?, ?, ?, ?)", uid, id, String(m.why || "").slice(0, 200), now());
      return this.send(ws, { t: "ok", c: "reported" });
    }
    if (t === "adm") return this.admin(ws, uid, m);
    if (t === "look") {
      this.sql.exec("UPDATE users SET look = ? WHERE id = ?", this.cleanLook(m.look, this.isAdmin(uid), uid), uid);
      this.tellFriends(uid);
      const L = this.leaderOf(uid); if (L) this.pushPartyAll(L);
      return;
    }
    if (t === "logout") {
      // this device stops being you; the connection stays open as a guest
      const a = ws.deserializeAttachment() || {}; if (a.tok) this.sql.exec("DELETE FROM sessions WHERE tok = ?", a.tok);
      a.uid = null; a.tok = null; ws.serializeAttachment(a);
      if (!this.online(uid)) this.offline(uid);
      return this.send(ws, { t: "ok", c: "out" });
    }
    if (t === "pass") {
      const r = this.sql.exec("SELECT pw FROM users WHERE id = ?", uid).toArray()[0], e = passErr(m.next);
      if (e) return this.send(ws, { t: "err", c: "pass", msg: e });
      const [salt, h] = String(r.pw || ":").split(":");
      if (!r.pw || (await passHash(String(m.old || ""), salt)) !== h) return this.send(ws, { t: "err", c: "pass", msg: "Your current passcode is wrong." });
      const s2 = rid(16); this.sql.exec("UPDATE users SET pw = ? WHERE id = ?", s2 + ":" + await passHash(String(m.next), s2), uid);
      return this.send(ws, { t: "ok", c: "pass" });
    }
    if (t === "namereq") {
      const want = String(m.want || "").trim(), e = nameErr(want);
      if (e) return this.send(ws, { t: "err", c: "name", msg: e });
      if (this.sql.exec("SELECT 1 FROM users WHERE lname = ? AND id != ?", want.toLowerCase(), uid).toArray().length) return this.send(ws, { t: "err", c: "name", msg: "That name is taken" });
      this.sql.exec("DELETE FROM namereq WHERE uid = ?", uid);
      this.sql.exec("INSERT INTO namereq(uid, want, why, at) VALUES(?, ?, ?, ?)", uid, want, String(m.why || "").slice(0, 200), now());
      this.to(uid, { t: "me", id: uid, ...this.pub(uid), ...this.mine(uid) });
      return this.send(ws, { t: "ok", c: "namereq" });
    }
    if (t === "rename") {
      const name = String(m.name || "").trim(), e = nameErr(name);
      if (e) return this.send(ws, { t: "err", c: "name", msg: e });
      if (this.sql.exec("SELECT renamed FROM users WHERE id = ?", uid).one().renamed) return this.send(ws, { t: "err", c: "name", msg: "You've already changed your name once. Request a change instead." });
      const o = this.sql.exec("SELECT id FROM users WHERE lname = ?", name.toLowerCase()).toArray()[0];
      if (o && o.id !== uid) return this.send(ws, { t: "err", c: "name", msg: "That name is taken" });
      this.sql.exec("UPDATE users SET name = ?, lname = ?, renamed = 1 WHERE id = ?", name, name.toLowerCase(), uid);
      this.to(uid, { t: "me", id: uid, ...this.pub(uid), ...this.mine(uid) });
      this.tellFriends(uid);
      return;
    }
    if (t === "search") {
      const q = String(m.q || "").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16);
      if (q.length < 2) return this.send(ws, { t: "search", q, list: [] });
      const list = this.sql.exec("SELECT id FROM users WHERE lname >= ? AND lname < ? AND id != ? ORDER BY lname LIMIT 8", q, q + "\uffff", uid).toArray()
        .map((r) => { const p = this.pub(r.id); p.friend = this.isFriend(uid, r.id); return p; });
      return this.send(ws, { t: "search", q, list });
    }
    if (t === "freq") {
      const id = String(m.id || "");
      if (id === uid || !this.user(id) || this.isFriend(uid, id)) return;
      if (this.friendIds(uid).length >= 200) return this.send(ws, { t: "err", c: "friends", msg: "Your friends list is full" });
      // they already asked you: this accepts it
      if (this.sql.exec("SELECT 1 FROM reqs WHERE f = ? AND t = ?", id, uid).toArray().length) return this.handle(ws, uid, { t: "facc", id });
      if (this.sql.exec("SELECT COUNT(*) AS c FROM reqs WHERE f = ?", uid).one().c >= 50) return this.send(ws, { t: "err", c: "friends", msg: "Too many requests waiting" });
      this.sql.exec("INSERT OR IGNORE INTO reqs(f, t, at) VALUES(?, ?, ?)", uid, id, now());
      this.pushFriends(uid); this.pushFriends(id);
      return;
    }
    if (t === "facc" || t === "fdec") {
      const id = String(m.id || "");
      const had = this.sql.exec("SELECT 1 FROM reqs WHERE f = ? AND t = ?", id, uid).toArray().length;
      this.sql.exec("DELETE FROM reqs WHERE (f = ? AND t = ?) OR (f = ? AND t = ?)", id, uid, uid, id);
      if (had && t === "facc") { this.sql.exec("INSERT OR IGNORE INTO friends(a, b) VALUES(?, ?), (?, ?)", uid, id, id, uid); }
      this.pushFriends(uid); this.pushFriends(id);
      return;
    }
    if (t === "fdel") {
      const id = String(m.id || "");
      this.sql.exec("DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)", uid, id, id, uid);
      this.sql.exec("DELETE FROM reqs WHERE (f = ? AND t = ?) OR (f = ? AND t = ?)", uid, id, id, uid);
      this.pushFriends(uid); this.pushFriends(id);
      return;
    }
    if (t === "inv") {
      const id = String(m.id || "");
      if (!this.isFriend(uid, id)) return this.send(ws, { t: "err", c: "party", msg: "You can only invite friends" });
      if (!this.online(id)) return this.send(ws, { t: "err", c: "party", msg: "They are offline" });
      const L = this.leaderOf(uid) || uid;
      if (this.unitOf(L).length >= 5) return this.send(ws, { t: "err", c: "party", msg: "Your party is full" });
      if (this.leaderOf(id) && this.leaderOf(id) === this.leaderOf(uid)) return;
      this.sql.exec("INSERT OR REPLACE INTO invites(f, t, at) VALUES(?, ?, ?)", uid, id, now());
      this.to(id, { t: "invite", from: this.pub(uid) });
      return this.send(ws, { t: "ok", c: "invited", id });
    }
    if (t === "join" || t === "decline") {
      const from = String(m.id || "");
      const ok = this.sql.exec("SELECT 1 FROM invites WHERE f = ? AND t = ? AND at > ?", from, uid, now() - 120000).toArray().length;
      this.sql.exec("DELETE FROM invites WHERE f = ? AND t = ?", from, uid);
      if (t === "decline") { this.to(from, { t: "ok", c: "declined", id: uid, name: (this.user(uid) || {}).name }); return; }
      if (!ok) return this.send(ws, { t: "err", c: "party", msg: "That invite ran out" });
      if (this.myMatch(uid)) return this.send(ws, { t: "err", c: "party", msg: "Finish your match first" });
      let L = this.leaderOf(from);
      if (!L) { L = from; this.sql.exec("INSERT OR REPLACE INTO party(uid, leader) VALUES(?, ?)", from, from); }
      if (this.members(L).length >= 5) return this.send(ws, { t: "err", c: "party", msg: "That party is full" });
      if (this.leaderOf(uid)) this.leaveParty(uid);
      this.unqueue(uid); this.unqueue(L);
      this.sql.exec("INSERT OR REPLACE INTO party(uid, leader) VALUES(?, ?)", uid, L);
      this.pushPartyAll(L);
      for (const id of this.members(L)) this.tellFriends(id);
      return;
    }
    if (t === "leave") return this.leaveParty(uid);
    if (t === "kick" || t === "promote") {
      const L = this.leaderOf(uid), id = String(m.id || "");
      if (L !== uid || id === uid || this.leaderOf(id) !== L) return;
      if (t === "kick") { this.leaveParty(id); this.to(id, { t: "ok", c: "kicked" }); }
      else { this.sql.exec("UPDATE party SET leader = ? WHERE leader = ?", id, L); this.pushPartyAll(id); }
      return;
    }
    if (t === "pm") {
      // party lobby messages (chat, custom game settings, ready) go to everyone else in the party
      const L = this.leaderOf(uid); if (!L) return;
      for (const id of this.members(L)) if (id !== uid) this.to(id, { t: "pm", from: uid, d: m.d });
      return;
    }
    if (t === "queue") {
      const mode = String(m.mode || ""), M = MODES[mode];
      if (!M) return;
      const L = this.leaderOf(uid) || uid;
      if (L !== uid) return this.send(ws, { t: "err", c: "queue", msg: "Only the party leader can start" });
      if (this.myMatch(uid)) return this.send(ws, { t: "err", c: "queue", msg: "You are already in a match" });
      const unit = this.unitOf(L);
      if (M.solo && unit.length > 1) return this.send(ws, { t: "err", c: "queue", msg: "Ranked Solo is for one player. A party plays Duos and up." });
      if (unit.length > M.size) return this.send(ws, { t: "err", c: "queue", msg: "Your party is too big for that mode" });
      if (unit.some((id) => !this.online(id))) return this.send(ws, { t: "err", c: "queue", msg: "Everyone in the party needs to be online" });
      const r = this.user(L).rating;
      this.sql.exec("INSERT OR REPLACE INTO queue(leader, mode, n, rating, at) VALUES(?, ?, ?, ?, ?)", L, mode, unit.length, r, now());
      for (const id of unit) this.to(id, { t: "queue", on: true, mode });
      return this.tryMatch();
    }
    if (t === "unqueue") return this.unqueue(this.leaderOf(uid) || uid);
    if (t === "custom") {
      // party leader starts a private game with the party, sides picked in the lobby
      const L = this.leaderOf(uid);
      if (L !== uid) return this.send(ws, { t: "err", c: "queue", msg: "Only the party leader can start" });
      const mem = this.members(L).filter((id) => this.online(id));
      const sides = [[], []], want = m.sides || {};
      mem.forEach((id) => sides[want[id] === 1 ? 1 : 0].push(id));
      if (mem.some((id) => this.myMatch(id))) return this.send(ws, { t: "err", c: "queue", msg: "Someone is still in a match" });
      this.unqueue(L);
      this.startMatch("custom", sides, false, uid, m.opts);
      return;
    }
    if (t === "m") {
      // match traffic: the host sends state, the others send inputs; optional "to" sends to one player
      const mt = this.myMatch(uid); if (!mt) return;
      const s = JSON.stringify({ t: "m", from: uid, d: m.d });
      for (const x of mt.members) if (x.id !== uid && !x.left && (!m.to || m.to === x.id)) for (const w of this.socks(x.id)) { try { w.send(s); } catch (e) {} }
      return;
    }
    if (t === "result") {
      const mt = this.myMatch(uid); if (!mt) return;
      if (mt.host === uid) this.sql.exec("UPDATE matches SET done = 1 WHERE id = ?", mt.id);
      return;
    }
    if (t === "mleave") return this.leaveMatch(uid, false);
    if (t === "top") {
      const list = this.sql.exec("SELECT id, name, rating, wins, losses FROM users WHERE wins + losses > 0 ORDER BY rating DESC LIMIT 50").toArray();
      const me = this.user(uid);
      const rank = this.sql.exec("SELECT COUNT(*) AS c FROM users WHERE rating > ? AND wins + losses > 0", me.rating).one().c + 1;
      return this.send(ws, { t: "top", list, me: { rating: me.rating, wins: me.wins, losses: me.losses, rank } });
    }
    if (t === "resync") { this.pushFriends(uid); this.pushParty(uid); return; }
  }
}
