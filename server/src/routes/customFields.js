import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const customFieldsRouter = Router();
customFieldsRouter.use(requireAuth);

function slugify(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function serialize(row) {
  return { ...row, options: row.options ? JSON.parse(row.options) : null };
}

customFieldsRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM custom_fields WHERE user_id = $1 ORDER BY sort_order, id',
      [req.session.userId]
    );
    res.json(rows.map(serialize));
  } catch (err) {
    next(err);
  }
});

customFieldsRouter.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    if (!body.label || !body.label.trim()) {
      return res.status(400).json({ error: 'Label is required' });
    }
    const type = body.type || 'text';
    const key = slugify(body.label);
    if (!key) return res.status(400).json({ error: 'Label must contain letters or numbers' });

    const maxOrder = await pool.query(
      'SELECT MAX(sort_order) AS m FROM custom_fields WHERE user_id = $1',
      [req.session.userId]
    );

    try {
      const { rows } = await pool.query(
        `INSERT INTO custom_fields (user_id, key, label, type, options, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          req.session.userId,
          key,
          body.label.trim(),
          type,
          body.options ? JSON.stringify(body.options) : null,
          (maxOrder.rows[0].m ?? -1) + 1,
        ]
      );
      res.status(201).json(serialize(rows[0]));
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A field with a similar name already exists' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

customFieldsRouter.put('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM custom_fields WHERE id = $1 AND user_id = $2',
      [req.params.id, req.session.userId]
    );
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Field not found' });
    const row = existing.rows[0];
    const body = req.body || {};
    const label = body.label !== undefined ? body.label.trim() : row.label;
    if (!label) return res.status(400).json({ error: 'Label is required' });

    const { rows } = await pool.query(
      'UPDATE custom_fields SET label=$1, type=$2, options=$3 WHERE id=$4 AND user_id=$5 RETURNING *',
      [
        label,
        body.type ?? row.type,
        body.options !== undefined ? JSON.stringify(body.options) : row.options,
        req.params.id,
        req.session.userId,
      ]
    );
    res.json(serialize(rows[0]));
  } catch (err) {
    next(err);
  }
});

customFieldsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query(
      'SELECT * FROM custom_fields WHERE id = $1 AND user_id = $2',
      [req.params.id, req.session.userId]
    );
    if (existing.rowCount === 0) return res.status(404).json({ error: 'Field not found' });
    const row = existing.rows[0];

    await pool.query(
      `DELETE FROM survey_responses
       WHERE question_key = $1
       AND book_id IN (SELECT id FROM books WHERE user_id = $2)`,
      [`custom:${row.key}`, req.session.userId]
    );
    await pool.query('DELETE FROM custom_fields WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.session.userId,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
