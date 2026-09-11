# Digital Bookshelf

A personal "kept media" shelf — books, movies, articles and quotes, each with
your impressions, a star rating, dated notes, kept lines/scenes, and a small
facts-and-tags grid. Browse it as a 3D carousel; open an item to fly it to
camera and read back everything you wrote about it. Each signed-in account
has its own private shelf.

## Stack

- **Client**: React + Vite (`client/`), deployed to **GitHub Pages**
- **Server**: Express + Postgres (`server/`), deployed to **Render**
- **Database**: **Neon** (serverless Postgres) — stores accounts, shelf items
  (with their notes/kept lines/facts/tags as JSONB), and login sessions
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
   that's "always available", not "always warm". See
   [Keeping the API awake](#keeping-the-api-awake-247) below.

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

## Keeping the API awake 24/7

[`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) pings
`GET /api/health` every 10 minutes from GitHub Actions, which keeps the free
Render instance from ever going idle long enough to spin down. It reuses the
same `API_URL` repository variable as the Pages deploy, so once that's set
there's nothing else to configure — the workflow starts running on its
schedule as soon as it's on `main`.

The ping allows up to five attempts 30 seconds apart, so a genuine cold start
is waited out rather than reported as an outage. If the API really is down,
the run fails and GitHub emails you — it doubles as a free uptime monitor.
You can also trigger it by hand from the **Actions** tab (**Run workflow**).

Two things worth knowing:

- **GitHub pauses cron workflows in repos with no commits for 60 days.** If
  the shelf goes quiet for a couple of months, re-enable the workflow from the
  Actions tab (GitHub emails a warning first).
- **Render's free tier includes 750 instance-hours per month**, and a month is
  ~730 hours, so one always-on free service fits — but a second one won't.

For a guaranteed always-on process with no pinging, upgrade the service to a
paid instance type in Render (one line in `render.yaml` / the dashboard) and
delete this workflow.

## Accounts

- `POST /api/auth/register` — create an account (`{ email, password }`,
  8+ characters)
- `POST /api/auth/login` — start a session
- `POST /api/auth/logout` — end the session
- `GET /api/auth/me` — current signed-in user, or `{ user: null }`

## Shelf items

- `GET /api/items` — every item in the signed-in account's shelf (all
  categories; the client groups them client-side)
- `POST /api/items` — create an item: `{ category, title, sub, year, hue,
  rating, verdict, impression, notes, keeps, facts, tags }` (`category` is
  one of `books`, `movies`, `articles`, `quotes`; everything but `category`
  and `title` is optional)
- `PUT /api/items/:id` — partial update, same shape
- `DELETE /api/items/:id`

All `/api/items` endpoints require a signed-in session and only ever return
that account's own data. `notes`, `keeps`, `facts`, and `tags` are freeform
JSON arrays (dated notes, kept quotes/scenes, `[label, value]` fact pairs,
and plain tag strings) — the client owns their shape.
