import { Router } from 'express';
import { asyncHandler } from '../asyncHandler.js';
import { hashPassword, verifyPassword } from '../auth.js';
import { db } from '../db.js';

export const authRouter = Router();

function sanitizeUser(user) {
  return { id: user.id, email: user.email };
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { password } = req.body || {};
    const email = normalizeEmail(req.body?.email);

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const password_hash = await hashPassword(password);

    let info;
    try {
      info = db
        .prepare('INSERT INTO users (email, password_hash) VALUES (@email, @password_hash)')
        .run({ email, password_hash });
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      throw err;
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    req.session.userId = user.id;
    res.status(201).json(sanitizeUser(user));
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { password } = req.body || {};
    const email = normalizeEmail(req.body?.email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.userId = user.id;
    res.json(sanitizeUser(user));
  })
);

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('bookshelf.sid');
    res.status(204).end();
  });
});

authRouter.get('/me', (req, res) => {
  const user = req.session.userId
    ? db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId)
    : null;
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json(sanitizeUser(user));
});
