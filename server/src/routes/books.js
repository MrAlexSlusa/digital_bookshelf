import { Router } from 'express';
import { db } from '../db.js';

export const booksRouter = Router();

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

function getResponsesForBook(bookId) {
  const rows = db
    .prepare('SELECT question_key, value FROM survey_responses WHERE book_id = ?')
    .all(bookId);
  const responses = {};
  for (const row of rows) responses[row.question_key] = row.value;
  return responses;
}

booksRouter.get('/', (req, res) => {
  const books = db
    .prepare('SELECT * FROM books WHERE user_id = ? ORDER BY date_added DESC')
    .all(req.session.userId);
  res.json(books);
});

booksRouter.get('/:id', (req, res) => {
  const book = db
    .prepare('SELECT * FROM books WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json({ ...book, responses: getResponsesForBook(book.id) });
});

booksRouter.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.title || !body.title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const info = db
    .prepare(
      `INSERT INTO books (user_id, title, author, cover_url, status, date_started, date_finished, grade, impressions)
       VALUES (@user_id, @title, @author, @cover_url, @status, @date_started, @date_finished, @grade, @impressions)`
    )
    .run({
      user_id: req.session.userId,
      title: body.title.trim(),
      author: body.author || null,
      cover_url: body.cover_url || null,
      status: body.status || 'read',
      date_started: body.date_started || null,
      date_finished: body.date_finished || null,
      grade: body.grade ?? null,
      impressions: body.impressions || null,
    });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...book, responses: {} });
});

booksRouter.put('/:id', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM books WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!existing) return res.status(404).json({ error: 'Book not found' });
  const body = req.body || {};
  const updated = { ...existing };
  for (const field of BOOK_FIELDS) {
    if (field in body) updated[field] = body[field];
  }
  if (!updated.title || !String(updated.title).trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  db.prepare(
    `UPDATE books SET title=@title, author=@author, cover_url=@cover_url, status=@status,
     date_started=@date_started, date_finished=@date_finished, grade=@grade, impressions=@impressions
     WHERE id=@id`
  ).run({ ...updated, id: req.params.id });
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  res.json({ ...book, responses: getResponsesForBook(book.id) });
});

booksRouter.delete('/:id', (req, res) => {
  const info = db
    .prepare('DELETE FROM books WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.session.userId);
  if (info.changes === 0) return res.status(404).json({ error: 'Book not found' });
  res.status(204).end();
});

booksRouter.put('/:id/responses', (req, res) => {
  const book = db
    .prepare('SELECT id FROM books WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.session.userId);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  const responses = req.body || {};
  const upsert = db.prepare(
    `INSERT INTO survey_responses (book_id, question_key, value)
     VALUES (@bookId, @key, @value)
     ON CONFLICT(book_id, question_key) DO UPDATE SET value = excluded.value`
  );
  db.exec('BEGIN');
  try {
    for (const [key, value] of Object.entries(responses)) {
      upsert.run({ bookId: book.id, key, value: value === null || value === undefined ? null : String(value) });
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  res.json(getResponsesForBook(book.id));
});
