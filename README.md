# Application Processing System

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://frontend-eta-eight-36.vercel.app |
| Backend API | https://techtwins-task.onrender.com |

> Note: Backend is on Render free tier — first request after inactivity may take ~50 seconds to wake up.

---

## Architecture & Schema

### PostgreSQL Tables

```sql
applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',   
  skills      TEXT[],
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email, resume_text)                     
)

users (
  id      TEXT PRIMARY KEY,
  credits INTEGER NOT NULL DEFAULT 0
)

webhook_events (
  event_id     TEXT PRIMARY KEY,                  
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

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) — Vercel |
| Backend + Worker | Express.js + BullMQ — Render (single free service) |
| Database | PostgreSQL — Render |
| Queue | Redis — Upstash |

---

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL running on `localhost:5432`
- Redis running on `localhost:6379`

### 1. Backend

```bash
cd backend
cp .env .env.local   
npm install
node src/index.js &  # API server on :4000
node src/worker.js   # BullMQ worker (separate terminal)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

### 3. Test the webhook

```bash
# First call — credits added
curl -X POST http://localhost:4000/webhooks/credits \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt_001","type":"credit.purchased","userId":"user_1","amount":100}'

# Second call with same eventId — returns duplicate, credits NOT added again
curl -X POST http://localhost:4000/webhooks/credits \
  -H "Content-Type: application/json" \
  -d '{"eventId":"evt_001","type":"credit.purchased","userId":"user_1","amount":100}'
```

---

## Deployment

Both services auto-deploy on every `git push` to `main` — no manual steps needed.

| Service | Platform | Auto-deploy |
|---|---|---|
| Frontend | Vercel | ✅ on push |
| Backend + Worker | Render Web Service | ✅ on push |
| PostgreSQL | Render | managed |
| Redis | Upstash | managed |

### Environment Variables

**Render (backend):**
```
DATABASE_URL   = <Render PostgreSQL internal URL>
REDIS_URL      = rediss://default:PASSWORD@pro-pelican-151203.upstash.io:6379
PORT           = 4000
FRONTEND_URL   = https://frontend-eta-eight-36.vercel.app
```

**Vercel (frontend):**
```
NEXT_PUBLIC_API_URL = https://techtwins-task.onrender.com
```

---

## Trade-offs

- **BullMQ jobId deduplication** works within the Redis TTL window. For long-lived dedup, the DB `UNIQUE` constraint is the true source of truth.
- **Polling (2s interval)** is simple and sufficient here. WebSockets or SSE would reduce latency in production.
- **API + Worker in one process** (`node src/index.js & node src/worker.js`) is a cost trade-off for free hosting. In production, run them as separate services.
- **Render free tier** spins down after inactivity — first request may take ~50s to wake up.

## What I'd Do Differently With More Time

- Replace keyword matching with a real NLP model or LLM API call for skill extraction
- Add WebSocket/SSE instead of polling for real-time status updates
- Separate the worker into its own service with proper process management (PM2)
- Add request validation with Zod/Joi and proper error handling middleware
- Add authentication so users can only see their own applications
