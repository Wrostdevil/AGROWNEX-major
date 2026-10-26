"""Reproducible training: baseline comparison → final pipeline → artifacts.

Writes model.joblib + metadata.json to ml-service/artifacts. Metrics in the
metadata are produced by ACTUAL held-out evaluation on the loaded dataset
(this run's fixture). Seeds fixed for reproduction.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import ARTIFACT_DIR, RANDOM_SEED  # noqa: E402
from app.features import LABEL_MAP, TARGET_COLUMN  # noqa: E402
from training.dataset import load_dataset  # noqa: E402

SYNTHETIC_FIXTURE_NOTE = (
    "SYNTHETIC FIXTURE — this artifact was trained on the generated software-test "
    "fixture, not on curated field data. Its numbers describe the fixture "
    "distribution and must not be presented as field-validated performance."
)


def train(csv_path: Path | None = None, artifact_dir: Path | None = None) -> dict:
    """Trains, evaluates, and persists artifacts.

    artifact_dir defaults to app.config.ARTIFACT_DIR. Tests pass their own
    tmp_path so the real serving artifacts are never overwritten by pytest.
    """
    artifacts = artifact_dir or ARTIFACT_DIR
    import numpy as np
    import pandas as pd
    from sklearn.compose import ColumnTransformer
    from sklearn.dummy import DummyClassifier
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder

    path = csv_path or Path(__file__).resolve().parents[2] / "data" / "processed" / "crop-disease-fixture.csv"
    frame = load_dataset(path)
    y = frame[TARGET_COLUMN]
    X = frame.drop(columns=[TARGET_COLUMN])

    categorical = [column for column in X.columns if X[column].dtype == object]
    numeric = [column for column in X.columns if column not in categorical]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_SEED
    )

    preprocessor = ColumnTransformer(
        transformers=[("categorical", OneHotEncoder(handle_unknown="ignore"), categorical)],
        remainder="passthrough",
    )

    candidates = {
        "dummy-most-frequent": Pipeline([("prep", preprocessor), ("clf", DummyClassifier(strategy="most_frequent"))]),
        "logistic-regression": Pipeline(
            [("prep", preprocessor), ("clf", LogisticRegression(max_iter=2000, random_state=RANDOM_SEED))]
        ),
        "random-forest": Pipeline(
            [("prep", preprocessor), ("clf", RandomForestClassifier(n_estimators=240, min_samples_leaf=2, random_state=RANDOM_SEED, n_jobs=-1))]
        ),
    }

    # Candidate selection uses 3-fold macro-F1 cross-validation on the TRAINING
    # split only; the test split stays untouched until the final evaluation.
    baseline_scores: dict[str, float] = {}
    for name, pipeline in candidates.items():
        scores = _cv_macro_f1(pipeline, X_train, y_train)
        baseline_scores[name] = round(scores, 4)

    best_name = max(baseline_scores, key=baseline_scores.get)
    final = candidates[best_name]
    final.fit(X_train, y_train)

    y_pred = final.predict(X_test)
    classes = sorted(set(y_test) | set(y_pred))
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "macroF1": round(float(f1_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "macroPrecision": round(float(precision_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "macroRecall": round(float(recall_score(y_test, y_pred, average="macro", zero_division=0)), 4),
        "perClass": {
            cls: {
                "precision": round(float(precision_score(y_test, y_pred, labels=[cls], average="macro", zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, y_pred, labels=[cls], average="macro", zero_division=0)), 4),
                "f1": round(float(f1_score(y_test, y_pred, labels=[cls], average="macro", zero_division=0)), 4),
            }
            for cls in classes
        },
        "confusionMatrix": {
            "classes": classes,
            "matrix": confusion_matrix(y_test, y_pred, labels=classes).tolist(),
        },
        "heldOutTestSize": int(len(y_test)),
    }

    # Feature names for explainability docs (post one-hot).
    try:
        feature_names = list(final.named_steps["prep"].get_feature_names_out())
        feature_names = [name.split("__", 1)[-1] for name in feature_names]
    except Exception:
        feature_names = list(X.columns)

    artifacts.mkdir(parents=True, exist_ok=True)
    import joblib

    joblib.dump(final, artifacts / "model.joblib")

    # Persist a small transformed background sample: linear-SHAP baselines are
    # computed against it at serving time (TreeExplainer does not need it).
    background_dir = artifacts
    background_frame = None
    prep_step = final.named_steps.get("prep") if hasattr(final, "named_steps") else None
    try:
        sample = X_train.sample(n=min(60, len(X_train)), random_state=RANDOM_SEED)
        transformed = prep_step.transform(sample) if prep_step is not None else sample
        if hasattr(transformed, "toarray"):
            transformed = transformed.toarray()
        try:
            names = prep_step.get_feature_names_out() if prep_step is not None else None
        except Exception:
            names = None
        import pandas as pd

        columns = [str(n).split("__", 1)[-1] for n in names] if names is not None else list(sample.columns)
        background_frame = pd.DataFrame(transformed, columns=columns)
        joblib.dump(background_frame, background_dir / "background.joblib")
    except Exception as exc:  # non-fatal: explanations degrade for linear models
        print(f"warning: could not persist background sample: {exc}")

    is_synthetic = "fixture" in path.name.lower()
    metadata = {
        "model": {
            "name": f"agrownex-crop-risk [{best_name}]",
            "version": "0.1.0",
            "task": "tabular disease-risk assessment (multiclass)",
            "trainingAlgorithm": best_name,
            "classes": classes,
            "classLabels": {cls: LABEL_MAP.get(cls, cls) for cls in classes},
            "featureCount": len(feature_names),
            "operationNature": "synthetic-fixture training" if is_synthetic else "dataset training",
        },
        "dataset": {
            "name": path.name,
            "path": str(path),
            "nature": "synthetic-fixture (software-test use; labelled SYNTHETIC)" if is_synthetic else "user-provided dataset (documented in data/README.md)",
            "rows": int(len(frame)),
            "rowsPerClass": int(y.value_counts().min()) if is_synthetic else None,
            "features": list(X.columns),
            "classDistribution": {cls: int(count) for cls, count in y.value_counts().items()},
        },
        "preprocessing": {
            "oneHotCategorical": categorical,
            "passthroughNumeric": numeric,
            "seed": RANDOM_SEED,
        },
        "metrics": metrics,
        "baselines": baseline_scores,
        "selectedOn": "3-fold stratified macro-F1 cross-validation on the training split (test split untouched until final evaluation)",
        "producedAt": datetime.now(timezone.utc).isoformat(),
        "predictionWarnings": ["Model posterior, not calibrated confidence.", "Not a certified diagnosis — verify with local agricultural advisory."],
        "explanation_top_k": 8,
        "backgroundFile": "background.joblib" if background_frame is not None else None,
        "artifactDir": str(artifacts),
        "limitations": [
            "Trained on a synthetic fixture; predictions describe fixture-like inputs until retrained on curated data." if is_synthetic else "Limitations depend on the dataset provided; review before field use.",
            "Feature contributions explain the MODEL, not real field causes.",
            "No calibration study — treat probability as an uncalibrated posterior.",
        ],
        "csvPath": str(path),
    }
    (artifacts / "metadata.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    (artifacts / "SYNTHETIC_DATA NOTICE.txt").write_text(SYNTHETIC_FIXTURE_NOTE, encoding="utf-8")
    return metadata


def _cv_macro_f1(pipeline: object, X: pd.DataFrame, y: pd.Series, folds: int = 3) -> float:
    """Mean macro-F1 across stratified folds, fitted inside each fold only on that fold's training part."""
    from sklearn.metrics import f1_score
    from sklearn.model_selection import StratifiedKFold
    from sklearn.base import clone

    skf = StratifiedKFold(n_splits=folds, shuffle=True, random_state=RANDOM_SEED)
    scores: list[float] = []
    for train_idx, valid_idx in skf.split(X, y):
        fold_model = clone(pipeline)
        fold_model.fit(X.iloc[train_idx], y.iloc[train_idx])
        predictions = fold_model.predict(X.iloc[valid_idx])
        scores.append(float(f1_score(y.iloc[valid_idx], predictions, average="macro", zero_division=0)))
    return float(sum(scores) / len(scores))


def main() -> None:
    metadata = train()
    print(json.dumps({k: metadata[k] for k in ("model", "baselines", "metrics")}, indent=2)[:1200])
    print("artifacts written to ml-service/artifacts (model.joblib, metadata.json)")


if __name__ == "__main__":
    main()
