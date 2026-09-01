import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const accountRouter = Router();
accountRouter.use(requireAuth);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const AVATAR_DATA_URL_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;
const MAX_AVATAR_BYTES = 1_500_000;
const THEMES = ['dark', 'light'];
const ITEM_SORTS = ['newest', 'oldest', 'title'];

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    theme: row.theme,
    itemSort: row.item_sort,
    createdAt: row.created_at,
  };
}

accountRouter.patch('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = existing.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found' });

    const displayName =
      body.displayName !== undefined ? String(body.displayName).trim().slice(0, 60) || null : user.display_name;

    const avatarColor = body.avatarColor !== undefined ? String(body.avatarColor).trim() : user.avatar_color;
    if (!HEX_COLOR_RE.test(avatarColor)) {
      return res.status(400).json({ error: 'Avatar colour must be a hex value like #7c6cf5' });
    }

    let avatarUrl = body.avatarUrl !== undefined ? body.avatarUrl : user.avatar_url;
    if (avatarUrl !== null && avatarUrl !== undefined) {
      avatarUrl = String(avatarUrl).trim();
      if (avatarUrl === '') {
        avatarUrl = null;
      } else {
        if (!AVATAR_DATA_URL_RE.test(avatarUrl)) {
          return res.status(400).json({ error: 'Profile picture must be a PNG, JPEG, WEBP or GIF' });
        }
        if (avatarUrl.length > MAX_AVATAR_BYTES) {
          return res.status(400).json({ error: 'Profile picture is too large (max ~1MB)' });
        }
      }
    }

    const bio = body.bio !== undefined ? String(body.bio).trim().slice(0, 280) || null : user.bio;

    const theme = body.theme !== undefined ? String(body.theme) : user.theme;
    if (!THEMES.includes(theme)) {
      return res.status(400).json({ error: 'Theme must be one of ' + THEMES.join(', ') });
    }

    const itemSort = body.itemSort !== undefined ? String(body.itemSort) : user.item_sort;
    if (!ITEM_SORTS.includes(itemSort)) {
      return res.status(400).json({ error: 'Sort order must be one of ' + ITEM_SORTS.join(', ') });
    }

    const result = await pool.query(
      `UPDATE users SET display_name = $1, avatar_color = $2, avatar_url = $3, bio = $4, theme = $5, item_sort = $6
       WHERE id = $7 RETURNING *`,
      [displayName, avatarColor, avatarUrl, bio, theme, itemSort, req.userId]
    );
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

accountRouter.patch('/email', async (req, res, next) => {
  try {
    const newEmail = String(req.body?.email || '').trim().toLowerCase();
    const currentPassword = String(req.body?.currentPassword || '');
    if (!EMAIL_RE.test(newEmail)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = existing.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const taken = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [newEmail, req.userId]);
    if (taken.rowCount > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const result = await pool.query('UPDATE users SET email = $1 WHERE id = $2 RETURNING *', [
      newEmail,
      req.userId,
    ]);
    res.json({ user: publicUser(result.rows[0]) });
  } catch (err) {
    next(err);
  }
});

accountRouter.patch('/password', async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = existing.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.userId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

accountRouter.delete('/', async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '');

    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    const user = existing.rows[0];
    if (!user) return res.status(404).json({ error: 'Account not found' });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    // Cascades to the user's items via the FK; the session is destroyed
    // separately since it lives in its own store, not the users table.
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);

    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('bookshelf.sid');
      res.status(204).end();
    });
  } catch (err) {
    next(err);
  }
});
