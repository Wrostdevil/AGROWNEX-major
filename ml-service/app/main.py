"""FastAPI application exposing health, model info, predict + explain endpoints.

Fail-open design decision: when artifacts are missing, /predict*, /explain
answer 503 with a machine-readable document that includes the exact training
command — the service refuses to fabricate outputs, per the honesty policy.
"""
import sys
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

sys.path[:0] = [str(Path(__file__).resolve().parents[1])]

from app.config import ARTIFACT_DIR, METADATA_PATH, SERVICE_NAME, SERVICE_VERSION  # noqa: E402
from app.explainability.shap_explainer import explain_with_shap  # noqa: E402
from app.features import LABEL_MAP, request_to_feature_row  # noqa: E402
from app.inference.engine import ArtifactUnavailable, get_engine, model_available  # noqa: E402
from app.schemas import PredictRequest  # noqa: E402

app = FastAPI(title=SERVICE_NAME, version=SERVICE_VERSION, description=(
    "Crop Health Assessment ML Service. Serves the documented tabular "
    "disease-risk model. All probabilities are model posteriors, not "
    "calibrated confidences and not certified diagnoses."
))


def _not_ready_response() -> JSONResponse:
    err = ArtifactUnavailable()
    return JSONResponse(status_code=503, content={"detail": err.to_response()})


@app.get("/health")
def health() -> dict:
    return {
        "service": SERVICE_NAME,
        "status": "ok",
        "version": SERVICE_VERSION,
        "artifacts": {
            "dir": str(ARTIFACT_DIR),
            "present": model_available(),
        },
    }


@app.get("/model/info")
def model_info() -> dict:
    info = {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "model": {
            "trained": False,
            "name": None,
            "task": "tabular disease-risk assessment",
            "instructions": "cd ml-service && python -m training.make_fixture && python -m training.train",
        },
    }
    if model_available():
        metadata = __import__("json").loads(METADATA_PATH.read_text(encoding="utf-8"))
        info["model"] = {
            "trained": True,
            "name": metadata.get("model", {}).get("name"),
            "version": metadata.get("model", {}).get("version"),
            "task": metadata.get("model", {}).get("task"),
            "dataset": metadata.get("dataset", {}).get("name"),
            "datasetNature": metadata.get("dataset", {}).get("nature"),
            "metrics": metadata.get("metrics", {}),
            "limitations": metadata.get("limitations", []),
        }
    return info


def _run_predict(request_id: str, payload: PredictRequest) -> tuple[dict, Any]:
    """Real inference via the trained pipeline. Returns (prediction, row_frame)."""
    try:
        model, metadata = get_engine()
    except ArtifactUnavailable as err:
        raise PredictUnavailable(err) from None

    import pandas as pd

    row = request_to_feature_row(payload.crop_id, payload.symptom_ids, payload.environment)
    frame = pd.DataFrame([row])

    probabilities_raw = model.predict_proba(frame)[0]
    classes = list(model.classes_)
    order = sorted(range(len(classes)), key=lambda i: -probabilities_raw[i])
    probabilities = [
        {"conditionId": classes[i], "name": LABEL_MAP.get(classes[i], classes[i]), "probability": round(float(probabilities_raw[i]), 4)}
        for i in order
    ]
    top = probabilities[0]

    warnings = list(metadata.get("predictionWarnings", []))
    prediction = {
        "conditionId": top["conditionId"],
        "conditionName": top["name"],
        "probabilities": probabilities,
        "confidence": top["probability"],
        "warnings": warnings,
        "requestId": request_id,
        "modelInfo": {
            "name": metadata.get("model", {}).get("name"),
            "version": metadata.get("model", {}).get("version"),
            "task": metadata.get("model", {}).get("task"),
            "trained": True,
            "trainedOn": metadata.get("dataset", {}).get("name"),
            "producedAt": metadata.get("producedAt"),
            "limitations": metadata.get("limitations", []),
        },
    }
    return prediction, frame


class PredictUnavailable(Exception):
    """Internal exception carrying the honest not-ready response payload."""

    def __init__(self, cause: ArtifactUnavailable):
        super().__init__(cause.to_response()["message"])
        self.payload = cause.to_response()


def _explain(request_id: str, payload: PredictRequest, prediction: dict, frame: Any) -> dict:
    model, metadata = get_engine()
    explanation = explain_with_shap(model, metadata, frame, prediction["conditionId"])
    return {
        "requestId": request_id,
        **explanation,
        "classProbabilities": prediction["probabilities"],
        # farmer-friendly wording assembled from the REAL features used:
        "caveats": [
            *explanation["caveats"],
            f"Prediction context: crop {payload.crop_id}; symptoms {[s for s in payload.symptom_ids]}",
            "These associations come from a synthetic training fixture and require curated-data retraining before field use.",
        ],
    }


@app.post("/predict", response_model=None)
def predict(payload: PredictRequest):
    request_id = f"prediction-{uuid4()}"
    try:
        prediction, _ = _run_predict(request_id, payload)
    except PredictUnavailable as err:
        return JSONResponse(status_code=503, content={"detail": err.payload})
    return prediction


@app.post("/explain", response_model=None)
def explain(payload: PredictRequest):
    request_id = f"explanation-{uuid4()}"
    try:
        prediction, frame = _run_predict(request_id, payload)
        explanation = _explain(request_id, payload, prediction, frame)
    except PredictUnavailable as err:
        return JSONResponse(status_code=503, content={"detail": err.payload})
    return explanation


@app.post("/predict-and-explain", response_model=None)
def predict_and_explain(payload: PredictRequest):
    request_id = f"prediction-{uuid4()}"
    try:
        prediction, frame = _run_predict(request_id, payload)
        explanation = _explain(request_id, payload, prediction, frame)
    except PredictUnavailable as err:
        return JSONResponse(status_code=503, content={"detail": err.payload})
    warnings = list(prediction["warnings"])
    warnings.extend(
        w for w in ("Probability = model posterior on the training distribution; not a calibrated confidence.",)
        if w not in warnings
    )
    return {
        **prediction,
        "method": explanation["method"],
        "baseline": explanation["baseline"],
        "features": explanation["features"],
        "caveats": explanation["caveats"],
        "warnings": warnings,
    }


@app.exception_handler(HTTPException)
def http_error(_: object, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": {"message": exc.detail}})
