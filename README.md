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
   minutes idle and take ~10-15 seconds to wake back up on the next request —
   that's "always available", not "always warm". See
   [Uptime monitoring and cold starts](#uptime-monitoring-and-cold-starts)
   below.

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

## Uptime monitoring and cold starts

[`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml) pings
`GET /api/health` from GitHub Actions. It reuses the same `API_URL` repository
variable as the Pages deploy, so there's nothing extra to configure. The ping
allows up to five attempts 30 seconds apart, so a cold start is waited out
rather than reported as an outage; if the API is genuinely down the run fails
and GitHub emails you. You can also run it by hand from the **Actions** tab.

**What it is good for: monitoring. What it does not do: keep the instance
warm.** The schedule asks for every 15 minutes, but GitHub treats cron as
best-effort and drops most ticks on a high-frequency schedule. Measured over
the first 19 hours, it fired 5 times — gaps of 2 to 4.5 hours — and the
`uptime` value in every response was under 12 seconds, meaning the process had
just cold-booted on each ping. Render had spun the instance down long before.

To actually avoid cold starts, pick one of:

- **An external pinger** — [UptimeRobot](https://uptimerobot.com)'s free tier
  or [cron-job.org](https://cron-job.org) genuinely fire every ~5 minutes,
  inside Render's ~15 minute idle window. Point an HTTP monitor at
  `<your-render-url>/api/health`.
- **A paid Render instance** — upgrade the instance type in `render.yaml` or
  the dashboard. No pinging, no cold starts, no free-tier hour ceiling, and
  crashes are restarted properly. The only real guarantee.

Two further caveats:

- **GitHub pauses cron workflows in repos with no commits for 60 days.**
  Re-enable from the Actions tab if the shelf goes quiet (GitHub warns first).
- **Render's free tier includes 750 instance-hours per month** against a ~730
  hour month, so one always-on free service fits — a second one won't.

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
