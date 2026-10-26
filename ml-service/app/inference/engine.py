"""Inference engine — loads trained artifacts or honestly reports unavailability.

Rule: if artifacts are missing the service answers with HTTP 503 and the
exact preparation command; it NEVER returns a fabricated prediction.
"""
import json
import random
import threading
import time
import uuid
from pathlib import Path
from typing import Any, Optional

from app.config import (
    ARTIFACT_DIR,
    METADATA_PATH,
    MISSING_ARTIFACT_INSTRUCTIONS,
    MODEL_PATH,
    RANDOM_SEED,
)

_lock = threading.Lock()
_model: Any = None
_metadata: Optional[dict] = None
_checkedOnce = False


def model_available() -> bool:
    return MODEL_PATH.exists() and METADATA_PATH.exists()


def get_engine() -> tuple[Any, dict]:
    """Lazy-load artifacts (thread-safe). Raises ArtifactUnavailable when missing."""
    global _model, _metadata, _checkedOnce
    with _lock:
        if not model_available():
            raise ArtifactUnavailable(MISSING_ARTIFACT_INSTRUCTIONS)
        if _model is None or _metadata is None:
            import joblib  # local import: only needed when artifacts exist

            _model = joblib.load(MODEL_PATH)
            _metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        _checkedOnce = True
        return _model, _metadata


class ArtifactUnavailable(Exception):
    """Raised when predictions are requested before artifacts were trained."""

    def __init__(self, instructions: str = MISSING_ARTIFACT_INSTRUCTIONS):
        super().__init__("Model artifacts are not prepared yet")
        self.instructions = instructions

    def to_response(self) -> dict:
        return {
            "code": "MODEL_UNAVAILABLE",
            "message": (
                "No trained model artifact is installed in ml-service/artifacts. "
                "The service refuses to invent predictions — run the documented "
                "training commands first."
            ),
            "instructions": self.instructions,
        }


def fresh_request_id() -> str:
    rng = random.Random(RANDOM_SEED ^ time.time_ns())
    return f"prediction-{uuid.UUID(int=rng.getrandbits(128), version=4)}"


def artifact_dir_ready(message_sink: list[str]) -> bool:
    """Reports artifact status honestly (used by /model/info)."""
    if model_available():
        return True
    if not ARTIFACT_DIR.exists():
        message_sink.append(f"artifact directory does not exist: {ARTIFACT_DIR}")
    else:
        missing = [path.name for path in (MODEL_PATH, METADATA_PATH) if not path.exists()]
        message_sink.append(f"missing artifacts: {', '.join(missing)}")
    return False


def artifacts_root() -> Path:
    return ARTIFACT_DIR
