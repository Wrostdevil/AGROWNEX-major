# AgrowNex — explainable crop-advisory platform

AgrowNex is a crop advisory platform with a **real** backend (Express +
MongoDB), a **real** ML service (FastAPI + scikit-learn + SHAP), an agent
orchestrator with a deterministic fallback, community early-warning, and a
React (Vite) frontend that integrates all of it over a typed API layer.

The guiding rule across every layer: **name what is real, and say so when
something is not.** Missing database, untrained model, absent LLM key — the
system answers honestly (`503` + exact setup commands or a labelled local
result backed by the offline engine) instead of pretending success.

> **Data status:** the model currently shipped is trained on a *synthetic
> software-test fixture* (`data/`), clearly labelled in code, artifacts,
> responses and UI. Metrics describe that fixture — they are not
> field-validated numbers. Probabilities are model posteriors, not calibrated
> confidence (no calibration study has been run).

## Repository layout

```
Agrownex/
├── src/            # Frontend (React + Vite + TypeScript + Tailwind) — 15 app pages
├── backend/        # Express API (port 5000) + MongoDB persistence + agent orchestrator
├── ml-service/     # FastAPI (port 8000) + scikit-learn training + SHAP explanations
├── data/           # Synthetic fixture + schema documentation (see data/README.md)
├── scripts/        # smoke-api.ps1 end-to-end probe
└── docs/           # (empty — see the per-component READMEs below)
```

Docs: [`backend/README.md`](backend/README.md) ·
[`ml-service/README.md`](ml-service/README.md) ·
[`data/README.md`](data/README.md)

## Quick start (Windows PowerShell — three terminals)

```powershell
# 1) ML service (train once; artifacts then persist on disk)
cd ml-service
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m training.make_fixture
.venv\Scripts\python.exe -m training.train
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000

# 2) Backend API
cd backend
npm install
Copy-Item .env.example .env      # default MONGODB_URI = 127.0.0.1:27017
npm run seed                     # labelled sample data (skips if DB is down)
npm run dev                      # http://127.0.0.1:5000

# 3) Frontend
npm install
npm run dev                      # http://127.0.0.1:5173
```

Optional frontend override: copy `.env.example` (root) to `.env.local` and set
`VITE_API_BASE_URL` to your backend URL (default `http://127.0.0.1:5000`).

### MongoDB

Two supported paths — `backend/.env`:

- **Local:** install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
  (default MSI installs a service on `27017`), keep
  `MONGODB_URI=mongodb://127.0.0.1:27017/agrownex`.
- **Atlas:** paste a free-cluster SRV string.

Without Mongo the backend boots fine and DB-dependent routes answer
`503` with remediation instructions; `/api/health` reports
`status: "degraded", db.state: "unavailable"` and the frontend sidebar shows a
**DB not connected** badge with the setup hint. Nothing stores "successfully"
only to lose it silently. When the DB is up, persistence survives restarts
(diagnoses history, community reports + derived alerts, fields, notifications,
assistant conversations).

### Optional LLM (not required for any core flow)

`backend/.env` — `LLM_PROVIDER=none` (default) runs the deterministic
orchestrator and labels replies as rule-based. Setting an OpenAI-compatible
provider (`LLM_PROVIDER=openai-compatible`, `LLM_BASE_URL`, `LLM_API_KEY`,
`LLM_MODEL`) enables language-model composition on top of the same grounded
tool plan; the orchestrator's tool steps and safety review stay deterministic.

## What each layer guarantees

| Concern | Behavior |
|---|---|
| Diagnosis without ML | `503 MODEL_UNAVAILABLE` + setup instructions — never an invented diagnosis |
| Diagnosis with ML, no DB | API + ML both answer; persistence is refused honestly (`503 UNAVAILABLE`) |
| Frontend when API down | Explicit, visible fallback to the local analysis engine (toast + engine badge) |
| Treatment ranking | Deterministic: budget filter → scored options with per-factor explanations |
| Community alerts | Transparent rules: attention = ratio ≥ 1.6 & recent ≥ 10; watch = ratio ≥ 1.22 & recent ≥ 5 (env-tunable, rule string stays in sync) |
| Assistant without LLM | Real orchestrator with tool plan + safety review, replies labelled with actual provider; frontend shows a fallback notice if the backend is unreachable |
| SHAP explanations | Method string names the explainer actually used (TreeExplainer / LinearExplainer); contributions are learned associations, not causal claims |
| Unknown symptom ids / crops / env values | Rejected with `422` + documented catalogue reference |
| Starter data | Seeded rows are marked `sample` in data and shown as starter data in the UI; never presented as field evidence |

## Tests

```powershell
# backend (vitest)
cd backend
npm run typecheck
npm test

# ml-service (pytest) — trains in tmp dirs; never touches serving artifacts
cd ml-service
.venv\Scripts\python.exe -m pytest -q

# frontend
npm run typecheck
npm run build
```

End-to-end smoke against all three running services:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\smoke-api.ps1
```

The smoke script asserts the honest behaviors explicitly — e.g. the assistant
and diagnosis routes must return `503` (not fake success) while MongoDB is
absent, and `/predict-and-explain` must name the SHAP method it actually used.

## Known limitations (honest list)

1. **Synthetic fixture model.** All ML numbers describe the synthetic fixture
   distribution until curated, real field data replaces it (see
   `data/README.md` for the exact swap procedure).
2. **Uncalibrated probabilities.** No calibration study yet; the workspace copy
   says "model posterior" where precision matters.
3. **No Mongo installed by default.** DB-dependent flows (persistent history,
   stored community reports, assistant conversations) need local MongoDB or
   Atlas; until then those routes are honestly unavailable.
4. **3 npm-audit advisories in backend dev deps** at the time of writing
   (transitive, from tooling) — not yet addressed.
5. **LLM composition is off by default** — the deterministic orchestrator is
   not an LLM and says so.
