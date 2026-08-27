# Digital Bookshelf

A personal app for tracking books you read: title/author/status, a grade,
free-form impressions, and a short survey (fixed questions plus any custom
ones you define in Settings). Requires an account — each user's books and
custom fields are private to them.

## Stack

- **Client**: React + Vite (`client/`)
- **Server**: Express + SQLite (via Node's built-in `node:sqlite`, requires Node 22.5+) (`server/`), data stored in `server/data/bookshelf.db`
- **Auth**: email/password accounts, sessions via `express-session` (httpOnly cookie), passwords hashed with scrypt

## Getting started

```bash
npm install
npm run dev
```

This runs the API on `http://localhost:3001` and the client (with hot reload)
on `http://localhost:5173`, proxying `/api` requests to the server. The first
time you open the app you'll be asked to create an account.

## Production build

```bash
npm run build   # builds client into client/dist
npm start       # runs the server, which serves client/dist and the API on one port
```

Set a `SESSION_SECRET` environment variable to a long random string in
production (it defaults to an insecure placeholder for local dev). Setting
`NODE_ENV=production` also marks the session cookie `secure`, so the app must
be served over HTTPS at that point.

## Deploying

Because the server serves both the API and the built client from a single
process, it can be deployed as one service (e.g. Render, Railway, Fly.io) —
just run `npm install && npm run build` then `npm start`, and set a persistent
disk/volume for `server/data/` so the SQLite file (and everyone's accounts)
survives restarts.
