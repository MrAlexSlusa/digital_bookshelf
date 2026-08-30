import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const friendsRouter = Router();
friendsRouter.use(requireAuth);

async function findFriendship(id, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM friendships WHERE id = $1 AND (requester_id = $2 OR addressee_id = $2)`,
    [id, userId]
  );
  return rows[0] || null;
}

// Accepted friends.
friendsRouter.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, f.id AS "friendshipId"
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
       WHERE f.status = 'accepted' AND (f.requester_id = $1 OR f.addressee_id = $1)
       ORDER BY u.email ASC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Requests sent to me, still pending.
friendsRouter.get('/requests', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.id AS "friendshipId", u.id, u.email, f.created_at AS "createdAt"
       FROM friendships f
       JOIN users u ON u.id = f.requester_id
       WHERE f.status = 'pending' AND f.addressee_id = $1
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Requests I sent, still pending.
friendsRouter.get('/sent', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.id AS "friendshipId", u.id, u.email, f.created_at AS "createdAt"
       FROM friendships f
       JOIN users u ON u.id = f.addressee_id
       WHERE f.status = 'pending' AND f.requester_id = $1
       ORDER BY f.created_at DESC`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

friendsRouter.post('/', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const { rows: userRows } = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    const target = userRows[0];
    if (!target) return res.status(404).json({ error: 'No account with that email' });
    if (target.id === req.userId) return res.status(400).json({ error: "You can't add yourself" });

    const existing = await pool.query(
      `SELECT * FROM friendships WHERE LEAST(requester_id, addressee_id) = LEAST($1::integer, $2::integer)
       AND GREATEST(requester_id, addressee_id) = GREATEST($1::integer, $2::integer)`,
      [req.userId, target.id]
    );
    const current = existing.rows[0];

    if (current) {
      if (current.status === 'accepted') return res.status(409).json({ error: 'Already friends' });
      if (current.status === 'pending') return res.status(409).json({ error: 'A request is already pending' });
      // Previously declined — let it be sent again, from whoever is asking now.
      const { rows } = await pool.query(
        `UPDATE friendships SET status = 'pending', requester_id = $1, addressee_id = $2, updated_at = now()
         WHERE id = $3 RETURNING id AS "friendshipId"`,
        [req.userId, target.id, current.id]
      );
      return res.status(201).json(rows[0]);
    }

    const { rows } = await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2) RETURNING id AS "friendshipId"`,
      [req.userId, target.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

friendsRouter.post('/:id/accept', async (req, res, next) => {
  try {
    const friendship = await findFriendship(req.params.id, req.userId);
    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (friendship.addressee_id !== req.userId) {
      return res.status(403).json({ error: 'Only the recipient can accept a request' });
    }
    if (friendship.status !== 'pending') return res.status(409).json({ error: 'Request is no longer pending' });

    await pool.query(`UPDATE friendships SET status = 'accepted', updated_at = now() WHERE id = $1`, [
      friendship.id,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

friendsRouter.post('/:id/decline', async (req, res, next) => {
  try {
    const friendship = await findFriendship(req.params.id, req.userId);
    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    if (friendship.addressee_id !== req.userId) {
      return res.status(403).json({ error: 'Only the recipient can decline a request' });
    }
    if (friendship.status !== 'pending') return res.status(409).json({ error: 'Request is no longer pending' });

    await pool.query(`UPDATE friendships SET status = 'declined', updated_at = now() WHERE id = $1`, [
      friendship.id,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Remove a friend, or cancel a request I sent.
friendsRouter.delete('/:id', async (req, res, next) => {
  try {
    const friendship = await findFriendship(req.params.id, req.userId);
    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    await pool.query('DELETE FROM friendships WHERE id = $1', [friendship.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
