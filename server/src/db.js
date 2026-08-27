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
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      author TEXT,
      cover_url TEXT,
      status TEXT NOT NULL DEFAULT 'read',
      date_added TIMESTAMPTZ NOT NULL DEFAULT now(),
      date_started TEXT,
      date_finished TEXT,
      grade REAL,
      impressions TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_fields (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      options TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, key)
    );

    CREATE TABLE IF NOT EXISTS survey_responses (
      id SERIAL PRIMARY KEY,
      book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      question_key TEXT NOT NULL,
      value TEXT,
      UNIQUE(book_id, question_key)
    );

    CREATE INDEX IF NOT EXISTS books_user_id_idx ON books(user_id);
    CREATE INDEX IF NOT EXISTS custom_fields_user_id_idx ON custom_fields(user_id);
    CREATE INDEX IF NOT EXISTS survey_responses_book_id_idx ON survey_responses(book_id);
  `);
}
