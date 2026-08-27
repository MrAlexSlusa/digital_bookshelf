import { Router } from 'express';
import { db } from '../db.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  requireAuth,
  COOKIE_NAME,
  COOKIE_OPTIONS,
} from '../auth.js';

export const authRouter = Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post('/signup', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !isValidEmail(String(email))) {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const { hash, salt } = hashPassword(String(password));
  const info = db
    .prepare('INSERT INTO users (email, password_hash, password_salt) VALUES (?, ?, ?)')
    .run(normalizedEmail, hash, salt);

  const { token } = createSession(info.lastInsertRowid);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.status(201).json({ id: info.lastInsertRowid, email: normalizedEmail });
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !verifyPassword(String(password), user.password_hash, user.password_salt)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { token } = createSession(user.id);
  res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  res.json({ id: user.id, email: user.email });
});

authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (token) destroySession(token);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});
