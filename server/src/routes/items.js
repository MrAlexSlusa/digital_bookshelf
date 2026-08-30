import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const itemsRouter = Router();
itemsRouter.use(requireAuth);

const CATEGORIES = ['books', 'movies', 'articles', 'quotes'];

const SELECT_COLUMNS =
  'id, user_id, category, title, sub, year, hue, rating, verdict, impression, notes, keeps, facts, tags, cover_url AS "coverUrl", created_at';

async function findItem(id, userId) {
  const { rows } = await pool.query(`SELECT ${SELECT_COLUMNS} FROM items WHERE id = $1 AND user_id = $2`, [
    id,
    userId,
  ]);
  return rows[0] || null;
}

itemsRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM items WHERE user_id = $1 ORDER BY created_at ASC, id ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

itemsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!CATEGORIES.includes(body.category)) {
      return res.status(400).json({ error: 'Category must be one of ' + CATEGORIES.join(', ') });
    }
    const hue = Number.isFinite(body.hue) ? ((body.hue % 360) + 360) % 360 : Math.floor(Math.random() * 360);
    const { rows } = await pool.query(
      `INSERT INTO items (user_id, category, title, sub, year, hue, rating, verdict, impression, notes, keeps, facts, tags, cover_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${SELECT_COLUMNS}`,
      [
        req.userId,
        body.category,
        String(body.title).trim(),
        body.sub || null,
        body.year || null,
        hue,
        body.rating ?? null,
        body.verdict || null,
        body.impression || null,
        JSON.stringify(body.notes ?? []),
        JSON.stringify(body.keeps ?? []),
        JSON.stringify(body.facts ?? []),
        JSON.stringify(body.tags ?? []),
        body.coverUrl || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

itemsRouter.post('/bulk', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'No items to import' });
    if (items.length > 500) return res.status(400).json({ error: 'Import is limited to 500 items at a time' });

    for (const item of items) {
      if (!item?.title || !String(item.title).trim()) {
        return res.status(400).json({ error: 'Every item needs a title' });
      }
      if (!CATEGORIES.includes(item.category)) {
        return res.status(400).json({ error: 'Category must be one of ' + CATEGORIES.join(', ') });
      }
    }

    await client.query('BEGIN');
    const created = [];
    for (const item of items) {
      const hue = Math.floor(Math.random() * 360);
      const { rows } = await client.query(
        `INSERT INTO items (user_id, category, title, sub, year, hue, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING ${SELECT_COLUMNS}`,
        [
          req.userId,
          item.category,
          String(item.title).trim(),
          item.sub || null,
          item.year || null,
          hue,
          JSON.stringify(item.tags ?? []),
        ]
      );
      created.push(rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(created);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

itemsRouter.put('/:id', async (req, res, next) => {
  try {
    const existing = await findItem(req.params.id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Item not found' });
    const body = req.body || {};

    const category = body.category ?? existing.category;
    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Category must be one of ' + CATEGORIES.join(', ') });
    }
    const hue =
      body.hue !== undefined && Number.isFinite(body.hue)
        ? ((body.hue % 360) + 360) % 360
        : existing.hue;

    const { rows } = await pool.query(
      `UPDATE items SET category=$1, title=$2, sub=$3, year=$4, hue=$5, rating=$6, verdict=$7,
       impression=$8, notes=$9, keeps=$10, facts=$11, tags=$12, cover_url=$13
       WHERE id=$14 AND user_id=$15
       RETURNING ${SELECT_COLUMNS}`,
      [
        category,
        title,
        body.sub !== undefined ? body.sub : existing.sub,
        body.year !== undefined ? body.year : existing.year,
        hue,
        body.rating !== undefined ? body.rating : existing.rating,
        body.verdict !== undefined ? body.verdict : existing.verdict,
        body.impression !== undefined ? body.impression : existing.impression,
        JSON.stringify(body.notes !== undefined ? body.notes : existing.notes),
        JSON.stringify(body.keeps !== undefined ? body.keeps : existing.keeps),
        JSON.stringify(body.facts !== undefined ? body.facts : existing.facts),
        JSON.stringify(body.tags !== undefined ? body.tags : existing.tags),
        body.coverUrl !== undefined ? body.coverUrl || null : existing.coverUrl,
        req.params.id,
        req.userId,
      ]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

itemsRouter.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM items WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.userId,
    ]);
    if (rowCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
