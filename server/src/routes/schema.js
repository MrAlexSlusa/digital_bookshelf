import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { FIXED_QUESTIONS } from '../surveySchema.js';

export const schemaRouter = Router();
schemaRouter.use(requireAuth);

schemaRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM custom_fields WHERE user_id = $1 ORDER BY sort_order, id',
      [req.session.userId]
    );
    const customFields = rows.map((row) => ({
      key: `custom:${row.key}`,
      label: row.label,
      type: row.type,
      options: row.options ? JSON.parse(row.options) : null,
      custom: true,
      id: row.id,
    }));
    res.json({
      fixedQuestions: FIXED_QUESTIONS.map((q) => ({ ...q, custom: false })),
      customFields,
    });
  } catch (err) {
    next(err);
  }
});
