# Megs online server

A Cloudflare Worker with one SQLite-backed Durable Object ("Hub") for accounts, friends, parties, invites,
ranked matchmaking and the match relay. Every commit that changes this folder redeploys it automatically.

- Runs on the Workers Free plan. Going over a free limit makes requests fail until the daily reset; it never bills.
- Redeploying disconnects everyone who is online for a moment, so batch server changes.
- Local test: `npm i` then `npx wrangler dev` here.
