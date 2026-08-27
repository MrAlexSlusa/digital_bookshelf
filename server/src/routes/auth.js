import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { pool } from '../db.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return { id: row.id, email: row.email, createdAt: row.created_at };
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );
    const user = result.rows[0];

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      res.status(201).json({ user: publicUser(user) });
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      res.json({ user: publicUser(user) });
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('bookshelf.sid');
    res.status(204).end();
  });
});

authRouter.get('/me', async (req, res, next) => {
  try {
    if (!req.session?.userId) return res.json({ user: null });
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [
      req.session.userId,
    ]);
    if (result.rowCount === 0) return res.json({ user: null });
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});
