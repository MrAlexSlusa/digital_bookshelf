import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const booksRouter = Router();
booksRouter.use(requireAuth);

const BOOK_FIELDS = [
  'title',
  'author',
  'cover_url',
  'status',
  'date_started',
  'date_finished',
  'grade',
  'impressions',
];

async function getResponsesForBook(bookId) {
  const { rows } = await pool.query(
    'SELECT question_key, value FROM survey_responses WHERE book_id = $1',
    [bookId]
  );
  const responses = {};
  for (const row of rows) responses[row.question_key] = row.value;
  return responses;
}

async function findBook(id, userId) {
  const { rows } = await pool.query('SELECT * FROM books WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return rows[0] || null;
}

booksRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 ORDER BY date_added DESC',
      [req.session.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

booksRouter.get('/:id', async (req, res, next) => {
  try {
    const book = await findBook(req.params.id, req.session.userId);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json({ ...book, responses: await getResponsesForBook(book.id) });
  } catch (err) {
    next(err);
  }
});

booksRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO books (user_id, title, author, cover_url, status, date_started, date_finished, grade, impressions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.session.userId,
        body.title.trim(),
        body.author || null,
        body.cover_url || null,
        body.status || 'read',
        body.date_started || null,
        body.date_finished || null,
        body.grade ?? null,
        body.impressions || null,
      ]
    );
    res.status(201).json({ ...rows[0], responses: {} });
  } catch (err) {
    next(err);
  }
});

booksRouter.put('/:id', async (req, res, next) => {
  try {
    const existing = await findBook(req.params.id, req.session.userId);
    if (!existing) return res.status(404).json({ error: 'Book not found' });
    const body = req.body || {};
    const updated = { ...existing };
    for (const field of BOOK_FIELDS) {
      if (field in body) updated[field] = body[field];
    }
    if (!updated.title || !String(updated.title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const { rows } = await pool.query(
      `UPDATE books SET title=$1, author=$2, cover_url=$3, status=$4,
       date_started=$5, date_finished=$6, grade=$7, impressions=$8
       WHERE id=$9 AND user_id=$10
       RETURNING *`,
      [
        updated.title,
        updated.author,
        updated.cover_url,
        updated.status,
        updated.date_started,
        updated.date_finished,
        updated.grade,
        updated.impressions,
        req.params.id,
        req.session.userId,
      ]
    );
    res.json({ ...rows[0], responses: await getResponsesForBook(rows[0].id) });
  } catch (err) {
    next(err);
  }
});

booksRouter.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.session.userId,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: 'Book not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

booksRouter.put('/:id/responses', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const book = await findBook(req.params.id, req.session.userId);
    if (!book) {
      client.release();
      return res.status(404).json({ error: 'Book not found' });
    }
    const responses = req.body || {};
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(responses)) {
      await client.query(
        `INSERT INTO survey_responses (book_id, question_key, value)
         VALUES ($1, $2, $3)
         ON CONFLICT (book_id, question_key) DO UPDATE SET value = excluded.value`,
        [book.id, key, value === null || value === undefined ? null : String(value)]
      );
    }
    await client.query('COMMIT');
    res.json(await getResponsesForBook(book.id));
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});
