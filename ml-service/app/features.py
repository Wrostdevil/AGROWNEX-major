"""Feature engineering shared by training and serving.

The schema is deliberately mirrored between the training pipeline and the
serving layer so a freshly trained artifact is wire-compatible with demands.
Dataset columns follow the documented fixture schema (see data/README.md):

    crop, symptom_<id>... (0/1), env_<field>..., target (condition id)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # allow `app.*` imports when run as `training.<mod>`

from app.schemas import ENV_FIELDS, SYMPTOM_IDS  # noqa: E402

FEATURE_COLUMNS = (
    ["crop"]
    + [f"symptom_{sid}" for sid in SYMPTOM_IDS]
    + [f"env_{field}" for field in ENV_FIELDS]
)

TARGET_COLUMN = "target"

LABEL_MAP = {
    "healthy": "Healthy (no marked stress pattern)",
    "tomato-early-blight": "Early blight-like pattern (brown leaf spots)",
    "tomato-powdery-mildew": "Powdery mildew pattern",
    "maize-nclb": "Northern leaf blight-like pattern",
    "wheat-stripe-rust": "Stripe rust-like pattern",
    "potato-late-blight": "Late blight-like pattern",
    "rice-leaf-yellowing": "Leaf yellowing stress pattern",
    "cotton-mixed-stress": "Mixed stress pattern",
    "generic-stress": "General stress pattern (uncertain)",
}

HUMAN_LABELS = {
    "crop": "Crop",
}
for sid in SYMPTOM_IDS:
    HUMAN_LABELS[f"symptom_{sid}"] = "Reported symptom: " + sid.replace("-", " ").replace("symptom ", "")
HUMAN_LABELS["symptom_leaf-brown-spots"] = "Brown leaf spots reported"
HUMAN_LABELS["symptom_leaf-yellowing"] = "Yellowing leaves reported"
HUMAN_LABELS["symptom_leaf-powdery"] = "Powdery coating reported"
HUMAN_LABELS["symptom_leaf-rust"] = "Rust-ish pustules reported"
HUMAN_LABELS["symptom_leaf-watersoaked"] = "Water-soaked patches reported"
HUMAN_LABELS["symptom_leaf-curl"] = "Leaf curl reported"
HUMAN_LABELS["symptom_leaf-tip-burn"] = "Leaf tip burn reported"
HUMAN_LABELS["symptom_plant-wilting"] = "Wilting reported"
HUMAN_LABELS["symptom_plant-stunted"] = "Stunted growth reported"
HUMAN_LABELS["symptom_plant-lesion-stem"] = "Stem lesions reported"
HUMAN_LABELS["symptom_plant-lodging"] = "Lodging reported"
HUMAN_LABELS["symptom_fruit-rot"] = "Fruit rot reported"
HUMAN_LABELS["symptom_fruit-spots"] = "Fruit spots reported"
HUMAN_LABELS["symptom_ear-smut"] = "Ear smut reported"
HUMAN_LABELS.update(
    {
        "env_humidity": "Humidity (provided)",
        "env_recentRainfall": "Recent rainfall (provided)",
        "env_temperatureBand": "Temperature band (provided)",
        "env_soilMoisture": "Soil moisture (provided)",
        "env_drainage": "Field drainage (provided)",
        "env_growthStage": "Growth stage (provided)",
    }
)


def request_to_feature_row(crop_id: str, symptom_ids: list[str], environment: dict[str, str]) -> dict:
    """Turn a validated API request into one feature-row dict (raw values)."""
    row: dict = {"crop": crop_id}
    for sid in SYMPTOM_IDS:
        row[f"symptom_{sid}"] = 1 if sid in symptom_ids else 0
    for field, allowed in ENV_FIELDS.items():
        value = environment.get(field)
        row[f"env_{field}"] = value if value in allowed else "unknown"
    return row
