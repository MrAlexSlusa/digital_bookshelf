import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

async function areFriends(userId, otherId) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM friendships
     WHERE status = 'accepted'
       AND LEAST(requester_id, addressee_id) = LEAST($1::integer, $2::integer)
       AND GREATEST(requester_id, addressee_id) = GREATEST($1::integer, $2::integer)`,
    [userId, otherId]
  );
  return rowCount > 0;
}

// Unread message counts per friend, for a badge.
messagesRouter.get('/unread', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT sender_id AS "friendId", COUNT(*)::int AS count
       FROM messages WHERE receiver_id = $1 AND read_at IS NULL
       GROUP BY sender_id`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

messagesRouter.get('/:friendId', async (req, res, next) => {
  try {
    const friendId = Number(req.params.friendId);
    if (!Number.isInteger(friendId)) return res.status(400).json({ error: 'Invalid friend id' });
    if (!(await areFriends(req.userId, friendId))) {
      return res.status(403).json({ error: 'You are not friends with this user' });
    }

    const { rows } = await pool.query(
      `SELECT id, sender_id AS "senderId", receiver_id AS "receiverId", content, created_at AS "createdAt"
       FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC, id ASC`,
      [req.userId, friendId]
    );

    await pool.query(
      `UPDATE messages SET read_at = now() WHERE sender_id = $1 AND receiver_id = $2 AND read_at IS NULL`,
      [friendId, req.userId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

messagesRouter.post('/:friendId', async (req, res, next) => {
  try {
    const friendId = Number(req.params.friendId);
    if (!Number.isInteger(friendId)) return res.status(400).json({ error: 'Invalid friend id' });
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Message content is required' });
    if (content.length > 4000) return res.status(400).json({ error: 'Message is too long' });
    if (!(await areFriends(req.userId, friendId))) {
      return res.status(403).json({ error: 'You are not friends with this user' });
    }

    const { rows } = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3)
       RETURNING id, sender_id AS "senderId", receiver_id AS "receiverId", content, created_at AS "createdAt"`,
      [req.userId, friendId, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});
