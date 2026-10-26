# Agrownex ML service (FastAPI)

Tabular crop-disease-risk service: validates requests, runs the trained
scikit-learn pipeline, and returns per-class probabilities plus SHAP feature
contributions. It **names its own state honestly** — with no trained artifacts
it answers `503 MODEL_UNAVAILABLE` with setup commands instead of inventing a
prediction.

## Status honesty (read first)

- The current artifact is trained on the **synthetic fixture**
  (`data/processed/crop-disease-fixture.csv`, 6,080 rows) — see
  `artifacts/SYNTHETIC_DATA NOTICE.txt` and `dataset.nature` in
  `artifacts/metadata.json`. Metrics below describe the fixture distribution,
  not field performance.

- Actual held-out numbers (test split, 1,216 rows, never used for candidate
  selection): the 3-fold stratified macro-F1 cross-validation picked
  **logistic-regression** (CV macro-F1 0.8468) over random-forest (0.8217) and
  a dummy most-frequent baseline (0.0515). Final test evaluation: accuracy
  **0.8347**, macro-F1 **0.8501**. The confusion matrix and per-class numbers
  live in `artifacts/metadata.json`.

- Probabilities are **model posteriors, not calibrated confidence** — no
  calibration study has been run. This warning is included in every response
  (`warnings` array).

- SHAP contributions explain **the model's learned associations on the
  fixture distribution**, not real field causes.

## Endpoints (port 8000)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{ status, model: { trained, name, reason? } }` |
| GET | `/model/info` | Full artifact metadata (or `503` + instructions) |
| POST | `/predict` | Class probabilities for a validated request |
| POST | `/explain` | SHAP contributions (requires artifacts) |
| POST | `/predict-and-explain` | Both in one response (what the frontend uses) |

`503` bodies always include a `detail.instructions` array with the exact
commands to remedy the state (train the model, etc.). Every request/POST body
is validated with Pydantic; unknown symptom ids, crops, or environment values
return `422` with the documented catalogue reference.

## Setup (Windows PowerShell)

```powershell
cd ml-service
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt

# 1) regenerate the deterministic fixture
.venv\Scripts\python.exe -m training.make_fixture

# 2) train + evaluate + persist artifacts to ml-service/artifacts/
.venv\Scripts\python.exe -m training.train

# 3) serve
.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

`/health` answers `{"status":"ok"}` with `model.trained: true` only after step 2.

## Artifacts (`ml-service/artifacts/`)

| File | Written by | Purpose |
|---|---|---|
| `model.joblib` | training | Fitted `Pipeline(preprocessor → classifier)` |
| `background.joblib` | training | Transformed background sample (linear-SHAP baseline) |
| `metadata.json` | training | Provenance, class/symptom vocabulary, metrics, baselines, limitations |
| `SYNTHETIC_DATA NOTICE.txt` | training | The honesty note shown above |

The explainer follows the actual winning algorithm: `SHAP TreeExplainer` for
tree ensembles; `SHAP LinearExplainer` (with the persisted background sample)
for linear models like the current logistic-regression. The served `method`
string always names the explainer actually used.

Artifact evidence produces the honest message (missing artifacts → `503` with
exact commands). Training tests write to pytest `tmp_path` only — they never
overwrite the serving artifacts.

## Tests

```powershell
.venv\Scripts\python.exe -m pytest -q
```

Covers: fixture determinism, the full training pipeline (metrics + artifacts in
a tmp dir), health, model-info consistency with artifacts, validation of
unknown inputs, honest `503` when artifacts are absent, prediction+explanation
shapes, and prediction/explanation agreement. Python version used here: 3.13
(`.venv`); see `requirements.txt` for pinned versions.
