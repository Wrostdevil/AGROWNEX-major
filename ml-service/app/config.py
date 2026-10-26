"""Configuration for the FastAPI ML service (12-factor via environment)."""
import os
from pathlib import Path

SERVICE_NAME = "agrownex-ml"
SERVICE_VERSION = "0.1.0"

# Artifact directory: trained model + metadata live here (git-ignored).
ARTIFACT_DIR = Path(os.environ.get("ML_ARTIFACT_DIR", Path(__file__).resolve().parents[1] / "artifacts"))
MODEL_PATH = ARTIFACT_DIR / "model.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"

TRAIN_FIXTURE_PATH = Path(
    os.environ.get(
        "ML_TRAIN_FIXTURE",
        Path(__file__).resolve().parents[2] / "data" / "processed" / "crop-disease-fixture.csv",
    )
)

MISSING_ARTIFACT_INSTRUCTIONS = (
    "cd ml-service && python -m training.make_fixture && python -m training.train"
)

RANDOM_SEED = 42
