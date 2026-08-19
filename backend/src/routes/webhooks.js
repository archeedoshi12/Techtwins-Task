const { Router } = require('express');
const { pool } = require('../db');

const router = Router();

// POST /webhooks/credits
router.post('/credits', async (req, res) => {
  const { eventId, type, userId, amount } = req.body;

  if (!eventId || type !== 'credit.purchased' || !userId || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rowCount } = await client.query(
      'INSERT INTO webhook_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING',
      [eventId]
    );

    if (rowCount === 0) {
      await client.query('ROLLBACK');
      return res.json({ status: 'duplicate', message: 'Event already processed' });
    }

    // Upsert user and add credits atomically
    await client.query(
      `INSERT INTO users (id, credits) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET credits = users.credits + EXCLUDED.credits`,
      [userId, amount]
    );

    await client.query('COMMIT');
    return res.json({ status: 'ok', userId, amount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// GET /webhooks/credits/:userId
router.get('/credits/:userId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, credits FROM users WHERE id = $1',
      [req.params.userId]
    );
    if (!rows.length) return res.json({ userId: req.params.userId, credits: 0 });
    return res.json({ userId: rows[0].id, credits: rows[0].credits });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
