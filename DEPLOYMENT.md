# Deploying AgrowNex (Vercel + Render + MongoDB Atlas)

This guide deploys the project in layers:

```
Browser
  │
  ├── Vercel ── React/Vite frontend (static build from dist/)
  │
  ├── Render ── Express API (backend/)
  │                 │
  │                 └── Render ── FastAPI ML service (ml-service/)
  │
  └── MongoDB Atlas ── diagnoses, fields, community reports, notifications
```

## Why not everything on Vercel?

Vercel is an excellent host for the **frontend**, but the other two services are
long-running processes:

- The **ML service** installs about **489 MB** of Python packages
  (numpy, scipy, scikit-learn, pandas, SHAP, numba, llvmlite). That exceeds
  Vercel's serverless function size limit. It also needs a few seconds to load
  the model on cold start.
- The **Express API** keeps a persistent MongoDB connection and an in-process
  rate limiter. It *can* be adapted to Vercel Functions, but it is simpler and
  more reliable on a normal Node host.

So this setup uses:

| Layer | Host | Cost |
|---|---|---|
| Frontend | Vercel Hobby | Free |
| Express API | Render Free Web Service | Free (sleeps when idle) |
| FastAPI ML | Render Free Web Service | Free (sleeps when idle) |
| Database | MongoDB Atlas M0 | Free |

The repository already contains the needed config:

- `vercel.json` — Vite build + SPA deep-link rewrite
- `.vercelignore` — keeps backend/ML code out of the Vercel upload
- `render.yaml` — optional Render Blueprint for the two services

---

## 0. Prerequisites

Create free accounts on:

- [Vercel](https://vercel.com) (sign in with GitHub)
- [Render](https://render.com) (sign in with GitHub)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

The code is already on GitHub:
<https://github.com/Wrostdevil/AGROWNEX-major>

---

## 1. Create the MongoDB database

1. In Atlas, create a **free M0 cluster**.
2. **Database Access** → **Add New Database User**:
   - Username: `agrownex`
   - Password: generate a strong password and save it
   - Role: **Read and write to any database**
3. **Network Access** → **Add IP Address** → allow `0.0.0.0/0`.
   - Render Free does not provide fixed outbound IPs, so this is required.
   - Use a strong password because the database is reachable from anywhere.
4. **Database** → **Connect** → **Drivers** → copy the `mongodb+srv://` URI.
5. Replace `<password>` with your password and add the database name before the
   `?`:

```
mongodb+srv://agrownex:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/agrownex?retryWrites=true&w=majority
```

If the password contains characters such as `@`, `#`, `/` or `:`, URL-encode
them first (for example `@` becomes `%40`).

Keep this URI for the next step.

---

## 2. Deploy the API and ML service on Render

### Option A — Blueprint (recommended, one repository connection)

1. Render Dashboard → **New +** → **Blueprint**.
2. Connect the `Wrostdevil/AGROWNEX-major` repository.
3. Render detects `render.yaml` and shows two services:
   - `agrownex-ml` — Python 3.12, root `ml-service`
   - `agrownex-api` — Node, root `backend`
4. When prompted, fill in:
   - **MONGODB_URI** — the Atlas URI from step 1
   - **CORS_ORIGINS** — enter `http://localhost:5173` for now; the Vercel URL is
     added after step 3
5. Click **Apply** and wait for both deploys to finish.
6. Copy the two public URLs from the Render dashboard. They normally look like:

```
https://agrownex-api.onrender.com
https://agrownex-ml.onrender.com
```

If a name was already taken, Render adds a suffix. If the ML URL is not exactly
`https://agrownex-ml.onrender.com`, open the **agrownex-api** service →
**Environment** → edit **ML_SERVICE_URL** to the real ML URL → save (Render
redeploys automatically).

The ML service already ships trained artifacts in `ml-service/artifacts/`, so
`/model/info` should report `trained: true`; no training step is needed.

### Option B — Create the two services manually

If you prefer not to use the Blueprint:

**ML service**

- New + → **Web Service** → connect the repo
- Name: `agrownex-ml`
- Root Directory: `ml-service`
- Runtime: **Python 3**
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`
- Environment variable: `PYTHON_VERSION=3.12.6`
- Plan: Free

**API service**

- New + → **Web Service** → connect the repo
- Name: `agrownex-api`
- Root Directory: `backend`
- Runtime: **Node**
- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `node dist/index.js`
- Health Check Path: `/api/health`
- Plan: Free
- Environment variables:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `MONGODB_URI` | your Atlas URI |
| `ML_SERVICE_URL` | `https://agrownex-ml.onrender.com` (use the real URL) |
| `ML_TIMEOUT_MS` | `60000` |
| `CORS_ORIGINS` | `http://localhost:5173` for now |

The API seeds starter data automatically on first boot.

---

## 3. Deploy the frontend on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import
   `Wrostdevil/AGROWNEX-major`.
2. Configure the project:
   - **Project Name:** `agrownex-major` (this determines the URL)
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (repository root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`
3. Add an environment variable:
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** your Render API URL, for example
     `https://agrownex-api.onrender.com`
   - Do **not** add a trailing slash.
   - Select at least the **Production** environment.
4. Click **Deploy**.
5. Copy the production URL, for example
   `https://agrownex-major.vercel.app`.

> Vite environment variables are embedded at build time. If you change
> `VITE_API_BASE_URL` later, go to **Deployments** → **Redeploy** (or push a
> commit). Editing the variable alone does not update the live bundle.

If you prefer the CLI instead of the dashboard:

```powershell
npm install -g vercel
vercel login
vercel --prod
```

---

## 4. Connect the frontend and API (CORS)

The API only accepts browser origins listed in `CORS_ORIGINS` (exact match, no
wildcards).

In Render → **agrownex-api** → **Environment**, set:

```dotenv
CORS_ORIGINS=http://localhost:5173,https://agrownex-major.vercel.app
```

Replace `agrownex-major.vercel.app` with your real Vercel domain. Save the
variable; Render redeploys the API.

- If you use a custom domain, add it too.
- Vercel **preview** deployments have separate URLs. Add one manually if you
  need the API to work from a preview build.
- If the actual Vercel domain differs (Vercel may append a suffix), use the
  exact domain shown in the dashboard.

---

## 5. Verify the deployment

Run these from PowerShell:

```powershell
Invoke-RestMethod https://agrownex-ml.onrender.com/health | ConvertTo-Json -Depth 5
Invoke-RestMethod https://agrownex-api.onrender.com/api/health | ConvertTo-Json -Depth 5
```

Expected:

- ML service: `status: "ok"` and `artifacts.present: true`
- API: `status: "ok"`, `db.ready: true`, `ml.reachable: true`,
  `ml.trained: true`

Then open the Vercel URL, go to **Diagnosis**, and submit a sample. A working
full stack produces a result labelled as coming from the trained model. If the
API or ML service is unreachable, the frontend deliberately falls back to the
local rules engine and labels that result as local.

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| API `/api/health` says `status: "degraded"` with `db.ready: false` | Atlas URI is wrong, password is not URL-encoded, or the Atlas IP allowlist does not include `0.0.0.0/0`. Check Render logs. |
| `ml.reachable: false` | `ML_SERVICE_URL` on the API service does not match the real ML service URL, or the ML service is still cold-starting. |
| `ml.trained: false` | `ml-service/artifacts/` is missing from the deploy. Confirm the ML service root is `ml-service` and the deploy is from the `main` branch. |
| `503 MODEL_UNAVAILABLE` in the app | The ML service is asleep, starting, or has no artifacts. Open the ML `/model/info` URL directly. |
| Browser console: `Origin ... is not in CORS_ORIGINS` | Add the exact Vercel origin (scheme + host, no trailing slash) to `CORS_ORIGINS` and redeploy the API. |
| Refreshing a deep link returns 404 | `vercel.json` is missing or the Vercel Root Directory is not the repo root. Redeploy with `vercel.json` present. |
| App still calls `127.0.0.1:5000` | `VITE_API_BASE_URL` was not set for the environment that was built, or the site was not redeployed after setting it. |
| First diagnosis uses the local engine | Render Free services sleep after inactivity. The first request can take 30–60 s, while the frontend waits 20 s for a diagnosis. Pre-warm both URLs before a demo, or use a paid always-on Render plan. |
| Render build fails installing numpy/scipy | `PYTHON_VERSION` is not `3.12.6` (or another 3.12.x). The pinned wheels do not support Render's newer default Python. |
| ML service runs out of memory | Free tier has 512 MB. The service uses roughly 190 MB after loading the model, so it should fit. If it does not, upgrade the instance or deploy the ML service as a Docker Space on Hugging Face. |

### Pre-warm before a demo

```powershell
# Wake both free services, then wait for /health to return "ok"
Invoke-RestMethod https://agrownex-ml.onrender.com/health
Invoke-RestMethod https://agrownex-api.onrender.com/api/health
```

Do this a minute or two before opening the frontend.

---

## 7. Frontend-only preview (optional)

If you only need to show the UI, import the repository into Vercel and deploy
without any environment variables. The app loads, and diagnosis falls back to
the labelled local rules engine because the API is unavailable. Database-backed
features (persistent history, community reports, fields) will show their
honest degraded state.

---

## 8. Security notes and free-tier limits

- This project has **no authentication**. Anyone with the URL can create data
  through the API. Do not use it for sensitive or personal data.
- CORS is a browser policy, not authentication. The Render API is public.
- Use a strong Atlas password and a least-privilege database user. Rotate the
  password immediately if it is exposed.
- The API has a default rate limit of 300 requests/minute/IP.
- Render Free services sleep after about 15 minutes of inactivity.
- Atlas M0 has a 512 MB storage limit.
- Vercel Hobby is free for personal/non-commercial projects.
