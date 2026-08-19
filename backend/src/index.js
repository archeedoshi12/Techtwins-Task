require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');

const app = express();
app.use(cors({ origin: [process.env.FRONTEND_URL || 'http://localhost:3000'] }));
app.use(express.json());

app.use('/applications', require('./routes/applications'));
app.use('/webhooks', require('./routes/webhooks'));

app.get('/', (_, res) => res.json({
  service: 'Application Processing System API',
  status: 'ok',
  endpoints: [
    'POST /applications',
    'GET /applications/:id',
    'POST /webhooks/credits',
    'GET /webhooks/credits/:userId',
    'GET /health',
  ],
}));
app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

initDB()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] Listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[server] DB init failed:', err);
    process.exit(1);
  });
