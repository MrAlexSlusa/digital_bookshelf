import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Create a Neon Postgres database and put its connection string in server/.env (see server/.env.example).'
  );
}

const useSsl = !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

// An idle client can emit an async error (e.g. the connection was dropped by
// the provider). Without this handler that crashes the whole process.
pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar_color TEXT NOT NULL DEFAULT '#7c6cf5',
      bio TEXT,
      theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
      item_sort TEXT NOT NULL DEFAULT 'newest' CHECK (item_sort IN ('newest', 'oldest', 'title')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color TEXT NOT NULL DEFAULT '#7c6cf5';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'dark';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS item_sort TEXT NOT NULL DEFAULT 'newest';

    -- Superseded by the "items" table below (one shelf, four categories,
    -- instead of a books-only schema with a fixed survey).
    DROP TABLE IF EXISTS survey_responses;
    DROP TABLE IF EXISTS custom_fields;
    DROP TABLE IF EXISTS books;

    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('books', 'movies', 'articles', 'quotes')),
      title TEXT NOT NULL,
      sub TEXT,
      year TEXT,
      hue INTEGER NOT NULL DEFAULT 200,
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      verdict TEXT,
      impression TEXT,
      notes JSONB NOT NULL DEFAULT '[]',
      keeps JSONB NOT NULL DEFAULT '[]',
      facts JSONB NOT NULL DEFAULT '[]',
      tags JSONB NOT NULL DEFAULT '[]',
      cover_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE items ADD COLUMN IF NOT EXISTS cover_url TEXT;

    CREATE INDEX IF NOT EXISTS items_user_category_idx ON items(user_id, category, created_at);
  `);
}
