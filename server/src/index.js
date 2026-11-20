// Megs online server.
// One Worker forwards WebSocket connections to one Durable Object ("Hub") that holds accounts, friends,
// parties, invites, matchmaking and a relay for match traffic. The game itself runs in the players' browsers:
// the match host simulates and the others send inputs, all passed through here.
import { DurableObject } from "cloudflare:workers";

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
const MODES = { r1: { size: 1, ranked: 1, solo: 1 }, q1: { size: 1 }, q5: { size: 5 } };
const now = () => Date.now();
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
      "CREATE TABLE IF NOT EXISTS mres(mid TEXT, uid TEXT, won INTEGER, PRIMARY KEY(mid, uid))"
    ]) this.sql.exec(q);
    // keep-alive pings are answered without waking the object, so idle players cost nothing
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(req) {
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ uid: null, n: 0, t: now() });
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  // ---------- sockets ----------
  socks(uid) { return this.ctx.getWebSockets().filter((w) => { const a = w.deserializeAttachment(); return a && a.uid === uid; }); }
  online(uid) { return this.socks(uid).length > 0; }
  send(ws, o) { try { ws.send(JSON.stringify(o)); } catch (e) {} }
  to(uid, o) { const s = JSON.stringify(o); for (const w of this.socks(uid)) { try { w.send(s); } catch (e) {} } }
  user(id) { return this.sql.exec("SELECT id, name, look, rating, wins, losses FROM users WHERE id = ?", id).toArray()[0]; }
  pub(id) { const u = this.user(id); if (!u) return null; let look = {}; try { look = JSON.parse(u.look); } catch (e) {} return { id: u.id, name: u.name, look, rating: u.rating, on: this.online(id) }; }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 8192) return;
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
    const uid = a.uid;
    try { ws.close(1000, "bye"); } catch (e) {}
    if (this.socks(uid).some((w) => w !== ws)) return;   // still connected in another tab
    this.sql.exec("UPDATE users SET seen = ? WHERE id = ?", now(), uid);
    this.unqueue(uid);
    this.leaveMatch(uid, true);
    this.leaveParty(uid);
    this.tellFriends(uid);
  }

  async anon(ws, a, m) {
    if (m.t === "signup") {
      const name = String(m.name || "").trim(), e = nameErr(name);
      if (e) return this.send(ws, { t: "err", c: "name", msg: e });
      if (this.sql.exec("SELECT 1 FROM users WHERE lname = ?", name.toLowerCase()).toArray().length) return this.send(ws, { t: "err", c: "name", msg: "That name is taken" });
      const id = rid(8), key = rid(24);
      this.sql.exec("INSERT INTO users(id, name, lname, key, look, created, seen) VALUES(?, ?, ?, ?, ?, ?, ?)", id, name, name.toLowerCase(), await sha(key), JSON.stringify(m.look || {}).slice(0, 3000), now(), now());
      a.uid = id; ws.serializeAttachment(a);
      this.send(ws, { t: "me", id, key, ...this.pub(id), wins: 0, losses: 0 });
      return this.hello(id);
    }
    if (m.t === "hello") {
      const r = this.sql.exec("SELECT key FROM users WHERE id = ?", String(m.id || "")).toArray()[0];
      if (!r || r.key !== await sha(String(m.key || ""))) return this.send(ws, { t: "err", c: "auth", msg: "That account code did not work" });
      a.uid = m.id; ws.serializeAttachment(a);
      const u = this.user(m.id);
      this.send(ws, { t: "me", id: m.id, ...this.pub(m.id), wins: u.wins, losses: u.losses });
      return this.hello(m.id);
    }
    this.send(ws, { t: "err", c: "auth", msg: "Sign in first" });
  }

  hello(uid) {
    this.sql.exec("UPDATE users SET seen = ? WHERE id = ?", now(), uid);
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
      if (M.size === 1) {
        // pair players; ranked widens the rating window the longer you wait
        const used = new Set();
        for (const a of q) {
          if (used.has(a.leader)) continue;
          let best = null;
          for (const b of q) {
            if (b === a || used.has(b.leader)) continue;
            const win = M.ranked ? 100 + (t - Math.min(a.at, b.at)) / 1000 * 15 : 1e9;
            const d = Math.abs(a.rating - b.rating);
            if (d <= win && (!best || d < Math.abs(a.rating - best.rating))) best = b;
          }
          if (best) { used.add(a.leader); used.add(best.leader); this.startMatch(mode, [[a.leader], [best.leader]], !!M.ranked); }
        }
      } else if (q.length >= 2) {
        // fill two sides with whole parties, oldest first; the game fills the empty spots with computer players
        const A = [], B = [];
        for (const r of q) { const u = this.unitOf(r.leader); if (A.length + u.length <= M.size && A.length <= B.length) A.push(...u); else if (B.length + u.length <= M.size) B.push(...u); else if (A.length + u.length <= M.size) A.push(...u); }
        if (A.length && B.length) this.startMatch(mode, [A, B], false);
      }
    }
    if (this.sql.exec("SELECT 1 FROM queue").toArray().length) await this.ctx.storage.setAlarm(now() + 3000);
  }
  async alarm() { await this.tryMatch(); }

  startMatch(mode, sides, ranked, host, opts) {
    const id = rid(6), all = sides.flat();
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
    this.sql.exec("UPDATE matches SET members = ? WHERE id = ?", JSON.stringify(mt.members), mt.id);
    // quitting a ranked match counts as a loss
    if (mt.ranked) this.sql.exec("INSERT OR REPLACE INTO mres(mid, uid, won) VALUES(?, ?, 0)", mt.id, uid);
    const rest = mt.members.filter((m) => !m.left);
    for (const m of rest) this.to(m.id, { t: "gone", mid: mt.id, id: uid, host: mt.host === uid, dropped: !!dropped });
    if (!rest.length || mt.host === uid) { this.sql.exec("UPDATE matches SET done = 1 WHERE id = ?", mt.id); if (mt.ranked) this.settle(mt.id, true); }
    else if (mt.ranked) this.settle(mt.id, false);
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

  // ---------- messages from a signed-in player ----------
  async handle(ws, uid, m) {
    const t = m.t;
    if (t === "look") {
      this.sql.exec("UPDATE users SET look = ? WHERE id = ?", JSON.stringify(m.look || {}).slice(0, 3000), uid);
      this.tellFriends(uid);
      const L = this.leaderOf(uid); if (L) this.pushPartyAll(L);
      return;
    }
    if (t === "rename") {
      const name = String(m.name || "").trim(), e = nameErr(name);
      if (e) return this.send(ws, { t: "err", c: "name", msg: e });
      const o = this.sql.exec("SELECT id FROM users WHERE lname = ?", name.toLowerCase()).toArray()[0];
      if (o && o.id !== uid) return this.send(ws, { t: "err", c: "name", msg: "That name is taken" });
      this.sql.exec("UPDATE users SET name = ?, lname = ? WHERE id = ?", name, name.toLowerCase(), uid);
      this.to(uid, { t: "me", id: uid, ...this.pub(uid) });
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
      if (M.solo && unit.length > 1) return this.send(ws, { t: "err", c: "queue", msg: "Ranked is solo only for now" });
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
      if (mt.ranked) { this.sql.exec("INSERT OR REPLACE INTO mres(mid, uid, won) VALUES(?, ?, ?)", mt.id, uid, m.won ? 1 : 0); this.settle(mt.id, false); }
      else if (mt.host === uid) this.sql.exec("UPDATE matches SET done = 1 WHERE id = ?", mt.id);
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
