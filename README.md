# Application Processing System

## Architecture & Schema

### PostgreSQL Tables

```sql
applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'processed'
  skills      TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email, resume_text)                     -- duplicate-submission guard
)

users (
  id      TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0
)

webhook_events (
  event_id     TEXT PRIMARY KEY,                  -- idempotency key
  processed_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Design Decisions

| Concern | Approach |
|---|---|
| Non-blocking submit | Job enqueued to BullMQ immediately; HTTP 201 returned before any processing |
| Duplicate submissions | `UNIQUE(email, resume_text)` + `ON CONFLICT DO UPDATE` returns existing row; BullMQ `jobId = applicationId` deduplicates queue entries |
| Worker double-processing | Worker checks `status = 'pending'` before doing work; BullMQ jobId prevents duplicate jobs |
| Webhook idempotency | `INSERT INTO webhook_events ON CONFLICT DO NOTHING` inside a transaction; credit update only runs if insert succeeds (rowCount = 1) |
| Credit atomicity | Single transaction: insert event + upsert user credits — no partial state possible |

---

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

### 1. Backend

```bash
cd backend
cp .env .env          # edit DATABASE_URL / REDIS_URL if needed
npm install
npm start             # API server on :4000
# In a second terminal:
npm run worker        # BullMQ worker
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           
```

### 3. Test the webhook

```bash
curl -X POST http://localhost:4000/webhooks/credits \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt_001","type":"credit.purchased","userId":"user_1","amount":100}'

curl -X POST http://localhost:4000/webhooks/credits \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt_001","type":"credit.purchased","userId":"user_1","amount":100}'
```

---

## Trade-offs

- **BullMQ jobId deduplication** works within the Redis TTL window. For long-lived dedup, the DB `UNIQUE` constraint is the true source of truth.
- **Polling (2 s interval)** is simple and sufficient here. WebSockets or SSE would reduce latency in production.
- **In-process worker** (`npm run worker`) is a separate process for clarity. In production, use a managed worker pool or a separate service.
