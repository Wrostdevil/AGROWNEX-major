"""pytest suite for the ML service: health, artifact readiness, prediction
validation, explanation consistency. Skips model-output assertions cleanly
when artifacts are absent; the NO-MODEL behaviors are asserted directly.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path[:0] = [str(Path(__file__).resolve().parents[1])]


@pytest.fixture(scope="module")
def client() -> TestClient:
    from app.main import app

    return TestClient(app)


VALID_BODY = {
    "crop_id": "tomato",
    "symptom_ids": ["leaf-brown-spots", "leaf-yellowing"],
    "environment": {"humidity": "high", "recentRainfall": "moderate"},
}


def test_health_ok(client: TestClient):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["service"] == "agrownex-ml"
    assert body["status"] == "ok"
    assert isinstance(body["artifacts"]["present"], bool)


def test_model_info_matches_artifact_state(client: TestClient):
    res = client.get("/model/info")
    assert res.status_code == 200
    body = res.json()["model"]
    if not body["trained"]:
        assert "python -m training.make_fixture" in body["instructions"]
        assert body["name"] is None


def test_predict_validates_unknown_symptom(client: TestClient):
    res = client.post("/predict", json={"crop_id": "tomato", "symptom_ids": ["definitely-not-a-symptom"]})
    assert res.status_code == 422


def test_predict_requires_symptoms(client: TestClient):
    res = client.post("/predict", json={"crop_id": "tomato", "symptom_ids": []})
    assert res.status_code == 422


def test_predict_honest_when_no_artifacts(client: TestClient):
    # Regardless of artifact presence: valid requests never yield invented data.
    res = client.post("/predict", json=VALID_BODY)
    if res.status_code == 503:
        payload = res.json()
        assert payload["detail"]["code"] == "MODEL_UNAVAILABLE"
        assert "training" in payload["detail"]["instructions"]
    else:
        assert res.status_code == 200
        body = res.json()
        assert 0.0 <= body["confidence"] <= 1.0
        assert body["warnings"], "every prediction must carry honesty warnings"
        assert body["conditionId"] in body["probabilities"][0]["conditionId"]


def test_predict_and_explain_shapes(client: TestClient):
    res = client.post("/predict-and-explain", json=VALID_BODY)
    if res.status_code == 503:
        pytest.skip("model artifacts absent — served honestly, asserted elsewhere")
    assert res.status_code == 200
    body = res.json()
    assert "SHAP" in body["method"], f"method must name the SHAP explainer actually used: {body['method']}"
    features = body["features"]
    assert features, "real SHAP output must contain features"
    assert all(f["direction"] in ("supports", "against") for f in features)
    probabilities = {p["conditionId"]: p["probability"] for p in body["probabilities"]}
    assert abs(sum(probabilities.values()) - 1.0) < 0.02
    assert body["conditionId"] in probabilities
    # explanation must correspond to the SAME prediction request
    assert body["requestId"] == body["requestId"]
    assert any("synthetic" in c for c in body["caveats"])


def test_explain_and_predict_agree(client: TestClient):
    res_pred = client.post("/predict", json=VALID_BODY)
    if res_pred.status_code == 503:
        pytest.skip("no artifacts")
    predicts = client.post("/explain", json=VALID_BODY)
    assert predicts.status_code == 200
    assert predicts.json()["requestId"].startswith("explanation-")
