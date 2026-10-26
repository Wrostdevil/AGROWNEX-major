# Agrownex backend (Express + MongoDB)

The workspace API: diagnosis orchestration (calls the ML service), the
treatment ranking engine, community early-warning, the agent-assistant
endpoint, field records, notifications, dashboard and research metrics — plus
persistence in MongoDB and a health endpoint that separates API / DB / model
readiness.

## Honesty contract

This backend **refuses to fabricate**:

- **No DB → no secret success.** Routes that must persist (diagnoses,
  assistant conversations, community reports, field records, dashboards)
  answer `503` with `{ error: { code: "UNAVAILABLE", ... instructions }}`
  telling you exactly how to install or point MongoDB at the stack. The server
  itself still boots and serves DB-free routes.

- **No ML service/artifacts → no invented diagnosis.** The diagnosis
  orchestration returns `503 MODEL_UNAVAILABLE` with setup commands when the
  FastAPI service is down or its artifacts are missing.

- **No LLM key → labelled deterministic mode.** The agent orchestrator runs a
  rule-based tool plan (symptom lookup, budget filters, community trend
  rules) and labels replies with the actual `provider` it used, plus a safety
  footer. Nothing in the response claims to be an LLM when it is not one.

- **Bundled fallback treatments are labelled.** `GET /api/treatments` works
  without a DB using a bundled sample list `("sample")` and says so; ranking
  is computed live and explains each option's score factors.

## Health

`GET /api/health` →

```json
{
  "status": "degraded",
  "api": { "up": true, "provider": "express" },
  "db": { "ready": false, "state": "unavailable", "message": "..." },
  "ml": { "reachable": true, "trained": true, "instructions": [...] }
}
```

`status` is `ok` only when API + DB + trained model are all up; otherwise
`degraded` (still serving). The frontend `ConnectionBadge` renders this state
and never calls the fake "everything is fine".

## Routes (all under `/api`)

| Area | Endpoints |
|---|---|
| `health` | `GET /api/health` |
| `diagnoses` | `GET /api/diagnoses`, `POST /api/diagnoses`, `GET /api/diagnoses/:id` |
| `treatments` | `GET /api/treatments`, `POST /api/treatments/rank` |
| `community` | `GET/POST /api/community/reports`, `GET /api/community/reports/:id`, `GET /api/community/trends`, `GET /api/community/alerts` |
| `assistant` | `GET /api/assistant/conversations/:userId`, `POST /api/assistant/messages` |
| `fields` | `GET/POST /api/fields`, `GET/PATCH/DELETE /api/fields/:id`, `POST /api/fields/:id/observations` |
| `notifications` | `GET /api/notifications`, `PATCH /api/notifications/:id/read` |
| `research` | `GET /api/research/metrics` |
| `dashboard` | `GET /api/dashboard/summary` |

Errors: `400 VALIDATION_ERROR` (with `details`), `503 UNAVAILABLE` /
`MODEL_UNAVAILABLE`, `404 NOT_FOUND`, `429 rate limit`. Every handler is
wrapped (`ah()`) so thrown async errors hit the error middleware instead of
crashing the process — a handler failure always becomes a JSON error response.

## Setup (Windows PowerShell)

```powershell
cd backend
npm install
Copy-Item .env.example .env   # then edit MONGODB_URI if needed
npm run seed                  # idempotent; silently skips if DB is down
npm run dev                   # serves http://127.0.0.1:5000
```

### MongoDB

- **Local**: install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
  (Windows MSI default install; the service then listens on 27017). Keep
  `MONGODB_URI=mongodb://127.0.0.1:27017/agrownex`.
- **Atlas**: create a free cluster and paste the SRV string into `MONGODB_URI`.

`npm run seed` fills collections with clearly-labelled sample data: 8 treatment
options (marked `"sample"`), the knowledge-base documents, 5 labelled sample
community report series, and 2 notifications. Restart-safe; never claim false
success — without a DB it exits quietly after explaining why.

## Environment (`backend/.env.example`)

| Key | Meaning |
|---|---|
| `PORT` | Express port (5000) |
| `MONGODB_URI` | Mongo string; local or Atlas |
| `ML_SERVICE_URL` / `ML_TIMEOUT_MS` | FastAPI service address + call timeout |
| `CORS_ORIGINS` | Allowed browser origins (Vite dev server) |
| `RATE_LIMIT_*` | `/api` rate limit (requests / window / IP) |
| `LLM_PROVIDER` etc. | Optional LLM config; `none` = deterministic labelled mode |
| `ALERT_*` | Community early-warning thresholds (rule string stays in sync) |

## Tests

```powershell
npm run typecheck   # tsc --noEmit
npm test            # vitest: ranking engine, service trends, agent tools, safety review
```

21 tests: deterministic treatment ranking (budget cutoffs, score factors,
suitability), community trend + alert rule math with the documented alert
floors, the agent tool plan, fact composition, and the safety review
(negation-window so "not a confirmed outbreak" is not an overclaim flag).
