import { Router } from 'express';
import { db } from '../db.js';

export const customFieldsRouter = Router();

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

customFieldsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM custom_fields ORDER BY sort_order, id').all();
  res.json(rows.map(serialize));
});

customFieldsRouter.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.label || !body.label.trim()) {
    return res.status(400).json({ error: 'Label is required' });
  }
  const type = body.type || 'text';
  const key = slugify(body.label);
  if (!key) return res.status(400).json({ error: 'Label must contain letters or numbers' });

  const maxOrder = db.prepare('SELECT MAX(sort_order) AS m FROM custom_fields').get();
  try {
    const info = db
      .prepare(
        `INSERT INTO custom_fields (key, label, type, options, sort_order)
         VALUES (@key, @label, @type, @options, @sort_order)`
      )
      .run({
        key,
        label: body.label.trim(),
        type,
        options: body.options ? JSON.stringify(body.options) : null,
        sort_order: (maxOrder.m ?? -1) + 1,
      });
    const row = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(serialize(row));
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'A field with a similar name already exists' });
    }
    throw err;
  }
});

customFieldsRouter.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Field not found' });
  const body = req.body || {};
  const label = body.label !== undefined ? body.label.trim() : existing.label;
  if (!label) return res.status(400).json({ error: 'Label is required' });
  db.prepare('UPDATE custom_fields SET label=@label, type=@type, options=@options WHERE id=@id').run({
    id: req.params.id,
    label,
    type: body.type ?? existing.type,
    options: body.options !== undefined ? JSON.stringify(body.options) : existing.options,
  });
  const row = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(req.params.id);
  res.json(serialize(row));
});

customFieldsRouter.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Field not found' });
  db.prepare('DELETE FROM survey_responses WHERE question_key = ?').run(`custom:${existing.key}`);
  db.prepare('DELETE FROM custom_fields WHERE id = ?').run(req.params.id);
  res.status(204).end();
});
