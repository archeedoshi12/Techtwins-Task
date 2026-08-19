# Application Processing System

## Live Demo

| Service | URL |
|---|---|
| Frontend — Submit Application | https://frontend-eta-eight-36.vercel.app |
| Frontend — Credits Webhook Tester | https://frontend-eta-eight-36.vercel.app/credits |
| Backend API | https://techtwins-task.onrender.com |
| GitHub Repository | https://github.com/archeedoshi12/Techtwins-Task |

> Note: Backend is on Render free tier — first request after inactivity may take ~50 seconds to wake up.

---

## What Was Built

| # | Feature | Endpoint |
|---|---|---|
| 1 | Submit application (non-blocking) | `POST /applications` |
| 2 | Background worker — AI skill extraction | BullMQ + Redis |
| 3 | Status polling endpoint | `GET /applications/:id` |
| 4 | Frontend form + live status page | Next.js App Router |
| 5 | Credits webhook (idempotent) | `POST /webhooks/credits` |
| 6 | Duplicate submission safety | `UNIQUE(email, resume_text)` |

---

## Evaluation Answers

### Does the response come back fast (not blocked on processing)?

Yes. `POST /applications` does two things synchronously: insert the DB row and enqueue a BullMQ job. Both are fast (~5ms). The HTTP 201 is returned immediately. The 2–3 second AI simulation runs entirely inside the worker process — the HTTP client never waits for it.

### Is the webhook truly idempotent?

Yes. The `webhook_events` table has `event_id TEXT PRIMARY KEY`. On every `POST /webhooks/credits` call, the handler runs inside a single transaction:

1. `INSERT INTO webhook_events (event_id) ... ON CONFLICT DO NOTHING`
2. If `rowCount === 0` → the event was already processed → return `{ status: 'duplicate' }` and rollback
3. If `rowCount === 1` → upsert user credits atomically → commit

No matter how many times the same `eventId` is retried, credits are added exactly once. The transaction ensures no partial state is possible.

### Does the worker avoid double-processing?

Two layers of protection:

- **BullMQ jobId = applicationId** — BullMQ deduplicates jobs with the same ID in the queue, so even if `POST /applications` is called twice with the same data, only one job enters the queue.
- **Worker status check** — before doing any work, the worker queries `SELECT status FROM applications WHERE id = $1`. If status is already `processed`, it exits immediately. This guards against edge cases where a job somehow runs twice.

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

Both services auto-deploy on every `git push` to `main`.

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

## Trade-offs & What I'd Do Differently With More Time

**Trade-offs made:**

- **BullMQ jobId deduplication** works within the Redis TTL window. For long-lived dedup guarantees, the DB `UNIQUE` constraint is the true source of truth — both layers together cover all cases.
- **Polling (2s interval)** is simple and sufficient here. WebSockets or SSE would reduce latency and server load in production.
- **API + Worker in one Render service** (`node src/start.js` spawns both) is a cost trade-off for free hosting. In production, these should be separate services with independent scaling.
- **Keyword matching** for skill extraction is naive by design. It's fast and deterministic, which is fine for a simulation, but not suitable for real resume parsing.
- **No authentication** — any userId can be passed to the credits webhook. In production, webhook signatures (e.g. Stripe's `Stripe-Signature` header) would verify the caller.

**With more time I would:**

- Replace keyword matching with a real NLP model or LLM API call for skill extraction
- Add WebSocket/SSE instead of polling for real-time status updates
- Separate the worker into its own service with proper process management (PM2 or a container)
- Add request validation with Zod/Joi and proper error handling middleware
- Add authentication so users can only see their own applications
- Add webhook signature verification to secure the credits endpoint
