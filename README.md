# Digital Bookshelf

A personal app for tracking books you read: title/author/status, a grade,
free-form impressions, and a short survey (fixed questions plus any custom
ones you define in Settings).

## Stack

- **Client**: React + Vite (`client/`)
- **Server**: Express + SQLite via `better-sqlite3` (`server/`), data stored in `server/data/bookshelf.db`

## Getting started

```bash
npm install
npm run dev
```

This runs the API on `http://localhost:3001` and the client (with hot reload)
on `http://localhost:5173`, proxying `/api` requests to the server.

## Production build

```bash
npm run build   # builds client into client/dist
npm start       # runs the server, which serves client/dist and the API on one port
```

## Deploying

Because the server serves both the API and the built client from a single
process, it can be deployed as one service (e.g. Render, Railway, Fly.io) —
just run `npm install && npm run build` then `npm start`, and set a persistent
disk/volume for `server/data/` so the SQLite file survives restarts.
