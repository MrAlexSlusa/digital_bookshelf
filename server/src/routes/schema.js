import { Router } from 'express';
import { db } from '../db.js';
import { FIXED_QUESTIONS } from '../surveySchema.js';

export const schemaRouter = Router();

schemaRouter.get('/', (req, res) => {
  const customRows = db.prepare('SELECT * FROM custom_fields ORDER BY sort_order, id').all();
  const customFields = customRows.map((row) => ({
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
});
