# Digital Bookshelf

A personal app for tracking books you read: title/author/status, a grade,
free-form impressions, and a short survey (fixed questions plus any custom
ones you define in Settings). Each signed-in account has its own private
bookshelf.

## Stack

- **Client**: React + Vite (`client/`), deployed to **GitHub Pages**
- **Server**: Express + Postgres (`server/`), deployed to **Render**
- **Database**: **Neon** (serverless Postgres) — stores accounts, books, custom
  fields, and login sessions
- **Auth**: email/password accounts, hashed with bcrypt, backed by an
  httpOnly session cookie stored server-side in Postgres

## Local setup

1. Create a free [Neon](https://neon.tech) project and copy its Postgres
   connection string.
2. `cp server/.env.example server/.env` and fill in `DATABASE_URL` (and
   generate a `SESSION_SECRET` — the example file shows how).
3. Install and run:

```bash
npm install
npm run dev
```

This runs the API on `http://localhost:3001` and the client (with hot reload)
on `http://localhost:5173`, proxying `/api` requests to the server. Tables
are created automatically on first start.

## Production build

```bash
npm run build   # builds client into client/dist
npm start       # runs the server, which serves client/dist and the API on one port
```

## Deploying (Neon + Render + GitHub Pages)

This split — static frontend on GitHub Pages, API on Render, database on
Neon — runs the app 24/7 without you having to manage a server yourself.

### 1. Database (Neon)

Already done if you followed local setup — reuse the same Neon project, or
create a separate one for production.

### 2. API (Render)

The repo includes [`render.yaml`](render.yaml), so you can use Render's
"Blueprint" deploy:

1. Push this repo to GitHub.
2. In Render, **New > Blueprint**, point it at the repo. It reads
   `render.yaml` and creates a free web service.
3. Set the environment variables it asks for (Render prompts for anything
   marked `sync: false`):
   - `DATABASE_URL` — your Neon connection string
   - `CLIENT_ORIGIN` — your GitHub Pages URL, e.g. `https://<username>.github.io`
     (no trailing slash)
   - `SESSION_SECRET` is auto-generated for you.
4. Render builds and starts the service, and will restart it automatically if
   it ever crashes. `render.yaml` wires up `/api/health` as the health check.

   **Free-tier note**: Render's free web services spin down after ~15
   minutes idle and take a few seconds to wake back up on the next request —
   that's "always available", not "always warm". For a true always-on
   process, upgrade the service to a paid instance type in Render (one line
   change in `render.yaml` / the dashboard).

### 3. Frontend (GitHub Pages)

1. In GitHub, go to **Settings > Pages** and set Source to **GitHub Actions**.
2. Go to **Settings > Secrets and variables > Actions > Variables** and add
   `API_URL` set to your Render service URL + `/api`, e.g.
   `https://digital-bookshelf-api.onrender.com/api`.
3. Push to `main`. The included workflow
   ([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml))
   builds the client with that API URL baked in and publishes it to Pages.

Because the frontend (GitHub Pages) and API (Render) are on different
domains, the server issues cross-site session cookies (`SameSite=None;
Secure`) — this only works over HTTPS, which both platforms provide by
default, so no extra setup is needed there.

## Accounts

- `POST /api/auth/register` — create an account (`{ email, password }`,
  8+ characters)
- `POST /api/auth/login` — start a session
- `POST /api/auth/logout` — end the session
- `GET /api/auth/me` — current signed-in user, or `{ user: null }`

All book/custom-field/schema endpoints require a signed-in session and only
ever return that account's own data.
