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
      avatar_url TEXT,
      bio TEXT,
      theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
      item_sort TEXT NOT NULL DEFAULT 'newest' CHECK (item_sort IN ('newest', 'oldest', 'title')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color TEXT NOT NULL DEFAULT '#7c6cf5';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
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

    CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY,
      requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (requester_id <> addressee_id)
    );

    -- One relationship per pair of users regardless of who sent the request.
    CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_idx
      ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      read_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS messages_conversation_idx
      ON messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at);
    CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx ON messages (receiver_id, read_at);
  `);
}
