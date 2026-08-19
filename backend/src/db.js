require('dotenv').config();
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const newUUID = () => randomUUID();

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id          UUID PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      resume_text TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      skills      TEXT[],
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (email, resume_text)
    );

    CREATE TABLE IF NOT EXISTS users (
      id      TEXT PRIMARY KEY,
      credits INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id   TEXT PRIMARY KEY,
      processed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initDB, newUUID };
