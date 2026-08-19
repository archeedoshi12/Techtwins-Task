const { Router } = require('express');
const { pool, newUUID } = require('../db');
const { applicationQueue } = require('../queue');

const router = Router();

// POST /applications
router.post('/', async (req, res) => {
  const { name, email, resumeText } = req.body;
  if (!name || !email || !resumeText) {
    return res.status(400).json({ error: 'name, email, and resumeText are required' });
  }

  try {
    const id = newUUID();
    // UNIQUE(email, resume_text) prevents duplicate rows; ON CONFLICT returns existing row
    const { rows } = await pool.query(
      `INSERT INTO applications (id, name, email, resume_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email, resume_text) DO UPDATE SET email = EXCLUDED.email
       RETURNING id, status, created_at`,
      [id, name, email, resumeText]
    );

    const app = rows[0];

    // Only enqueue if freshly inserted (status will be 'pending')
    if (app.status === 'pending') {
      await applicationQueue.add(
        'process',
        { applicationId: app.id },
        {
          jobId: app.id, // BullMQ deduplicates by jobId
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        }
      );
    }

    return res.status(201).json({ id: app.id, status: app.status });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /applications/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, status, skills, created_at FROM applications WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
