"""Generates the clearly-labelled SYNTHETIC training fixture (software-test data).

Honest scope: this fixture exists so the full training→serving→explaining
pipeline can run end-to-end without external downloads and so integration
tests exercise real model behaviour. It is NOT field data and MUST be
labelled as synthetic wherever it is used (dataset README + metadata output
keep this flag).

Generator: per condition, symptom probabilities come from hand-set weight
profiles plus bounded noise (seeded), producing a learnable structure with
real gradient — the trained model must EARN its metrics.
"""
from __future__ import annotations

import random
from pathlib import Path

import pandas as pd

from app.features import FEATURE_COLUMNS, TARGET_COLUMN
from app.schemas import SYMPTOM_IDS

FIXTURE_PATH = Path(__file__).resolve().parents[2] / "data" / "processed" / "crop-disease-fixture.csv"

SEED = 42
ROWS_PER_CLASS = 320

# crop → allowed conditions with sampling weights
CROP_CONDITIONS: dict[str, list[tuple[str, float]]] = {
    "tomato": [("tomato-early-blight", 3.0), ("tomato-powdery-mildew", 2.0), ("healthy", 2.0), ("generic-stress", 1.0)],
    "maize": [("maize-nclb", 3.0), ("healthy", 2.0), ("generic-stress", 1.0)],
    "wheat": [("wheat-stripe-rust", 3.0), ("healthy", 2.0), ("generic-stress", 1.0)],
    "potato": [("potato-late-blight", 3.0), ("healthy", 2.0), ("generic-stress", 1.0)],
    "rice": [("rice-leaf-yellowing", 3.0), ("healthy", 2.0), ("generic-stress", 1.0)],
    "cotton": [("cotton-mixed-stress", 3.0), ("healthy", 1.5), ("generic-stress", 1.5)],
}

# symptom (0..1) emphasis per condition
CONDITION_SYMPTOM_WEIGHTS: dict[str, dict[str, float]] = {
    "healthy": {sid: 0.05 for sid in SYMPTOM_IDS},
    "tomato-early-blight": {
        "leaf-brown-spots": 0.85, "leaf-yellowing": 0.55, "leaf-tip-burn": 0.3,
        "fruit-spots": 0.35, "plant-stunted": 0.25, "plant-lodging": 0.03,
        "leaf-powdery": 0.05, "leaf-rust": 0.04, "leaf-watersoaked": 0.1,
        "leaf-curl": 0.2, "plant-wilting": 0.2, "plant-lesion-stem": 0.1,
        "fruit-rot": 0.1, "ear-smut": 0.0,
    },
    "tomato-powdery-mildew": {
        "leaf-powdery": 0.9, "leaf-yellowing": 0.45, "leaf-curl": 0.3,
        "leaf-tip-burn": 0.25, "leaf-brown-spots": 0.2, "fruit-spots": 0.1,
        "plant-stunted": 0.2, "plant-lodging": 0.03, "leaf-rust": 0.04,
        "leaf-watersoaked": 0.05, "plant-wilting": 0.15, "plant-lesion-stem": 0.05,
        "fruit-rot": 0.05, "ear-smut": 0.0,
    },
    "maize-nclb": {
        "leaf-brown-spots": 0.8, "leaf-yellowing": 0.5, "plant-stunted": 0.35,
        "leaf-watersoaked": 0.25, "leaf-tip-burn": 0.3, "plant-lesion-stem": 0.15,
        "plant-lodging": 0.15, "leaf-powdery": 0.03, "leaf-rust": 0.1,
        "leaf-curl": 0.15, "fruit-rot": 0.0, "fruit-spots": 0.0,
        "plant-wilting": 0.15, "ear-smut": 0.1,
    },
    "wheat-stripe-rust": {
        "leaf-rust": 0.9, "leaf-yellowing": 0.5, "plant-stunted": 0.3,
        "leaf-tip-burn": 0.25, "plant-lodging": 0.25, "leaf-brown-spots": 0.2,
        "leaf-powdery": 0.03, "leaf-watersoaked": 0.05, "leaf-curl": 0.05,
        "plant-lesion-stem": 0.08, "fruit-rot": 0.0, "fruit-spots": 0.0,
        "plant-wilting": 0.08, "ear-smut": 0.08,
    },
    "potato-late-blight": {
        "leaf-watersoaked": 0.85, "leaf-brown-spots": 0.7, "plant-wilting": 0.5,
        "fruit-rot": 0.45, "leaf-yellowing": 0.4, "plant-lesion-stem": 0.25,
        "plant-stunted": 0.2, "leaf-tip-burn": 0.15, "leaf-rust": 0.03,
        "leaf-powdery": 0.03, "leaf-curl": 0.1, "plant-lodging": 0.05,
        "fruit-spots": 0.3, "ear-smut": 0.0,
    },
    "rice-leaf-yellowing": {
        "leaf-yellowing": 0.9, "plant-stunted": 0.55, "leaf-tip-burn": 0.4,
        "plant-lodging": 0.2, "leaf-brown-spots": 0.25, "leaf-watersoaked": 0.1,
        "leaf-powdery": 0.02, "leaf-rust": 0.05, "leaf-curl": 0.1,
        "plant-wilting": 0.12, "plant-lesion-stem": 0.05, "fruit-rot": 0.0,
        "fruit-spots": 0.0, "ear-smut": 0.0,
    },
    "cotton-mixed-stress": {
        "leaf-yellowing": 0.7, "leaf-brown-spots": 0.5, "leaf-curl": 0.5,
        "plant-stunted": 0.45, "leaf-tip-burn": 0.4, "plant-wilting": 0.3,
        "leaf-powdery": 0.15, "leaf-rust": 0.1, "leaf-watersoaked": 0.15,
        "fruit-spots": 0.2, "plant-lodging": 0.05, "plant-lesion-stem": 0.1,
        "fruit-rot": 0.1, "ear-smut": 0.0,
    },
    "generic-stress": {sid: 0.25 for sid in SYMPTOM_IDS},
}

# environment emphasis per condition: field → [probabilities over allowed values]
ENV_CHOICES = {
    "humidity": ["high", "normal", "low"],
    "recentRainfall": ["heavy", "moderate", "low"],
    "temperatureBand": ["15-25", "26-32", "above-32"],
    "soilMoisture": ["wet", "medium", "dry"],
    "drainage": ["poor", "adequate"],
    "growthStage": ["seedling", "vegetative", "flowering", "fruiting"],
}

CONDITION_ENV_WEIGHTS: dict[str, dict[str, list[float]]] = {
    "healthy": {
        "humidity": [0.3, 0.45, 0.25], "recentRainfall": [0.2, 0.4, 0.4],
        "temperatureBand": [0.35, 0.5, 0.15], "soilMoisture": [0.15, 0.6, 0.25],
        "drainage": [0.2, 0.8], "growthStage": [0.2, 0.35, 0.25, 0.2],
    },
    "tomato-early-blight": {
        "humidity": [0.55, 0.35, 0.1], "recentRainfall": [0.45, 0.4, 0.15],
        "temperatureBand": [0.25, 0.6, 0.15], "soilMoisture": [0.3, 0.55, 0.15],
        "drainage": [0.35, 0.65], "growthStage": [0.1, 0.3, 0.3, 0.3],
    },
    "tomato-powdery-mildew": {
        "humidity": [0.25, 0.5, 0.25], "recentRainfall": [0.15, 0.35, 0.5],
        "temperatureBand": [0.3, 0.55, 0.15], "soilMoisture": [0.15, 0.55, 0.3],
        "drainage": [0.25, 0.75], "growthStage": [0.1, 0.3, 0.35, 0.25],
    },
    "maize-nclb": {
        "humidity": [0.6, 0.3, 0.1], "recentRainfall": [0.5, 0.35, 0.15],
        "temperatureBand": [0.3, 0.6, 0.1], "soilMoisture": [0.35, 0.5, 0.15],
        "drainage": [0.3, 0.7], "growthStage": [0.05, 0.4, 0.35, 0.2],
    },
    "wheat-stripe-rust": {
        "humidity": [0.6, 0.3, 0.1], "recentRainfall": [0.45, 0.4, 0.15],
        "temperatureBand": [0.65, 0.3, 0.05], "soilMoisture": [0.3, 0.55, 0.15],
        "drainage": [0.25, 0.75], "growthStage": [0.2, 0.45, 0.25, 0.1],
    },
    "potato-late-blight": {
        "humidity": [0.75, 0.2, 0.05], "recentRainfall": [0.65, 0.3, 0.05],
        "temperatureBand": [0.55, 0.4, 0.05], "soilMoisture": [0.6, 0.35, 0.05],
        "drainage": [0.55, 0.45], "growthStage": [0.1, 0.3, 0.3, 0.3],
    },
    "rice-leaf-yellowing": {
        "humidity": [0.55, 0.35, 0.1], "recentRainfall": [0.4, 0.4, 0.2],
        "temperatureBand": [0.2, 0.45, 0.35], "soilMoisture": [0.5, 0.4, 0.1],
        "drainage": [0.5, 0.5], "growthStage": [0.25, 0.4, 0.2, 0.15],
    },
    "cotton-mixed-stress": {
        "humidity": [0.35, 0.45, 0.2], "recentRainfall": [0.3, 0.4, 0.3],
        "temperatureBand": [0.15, 0.4, 0.45], "soilMoisture": [0.25, 0.45, 0.3],
        "drainage": [0.35, 0.65], "growthStage": [0.15, 0.3, 0.3, 0.25],
    },
    "generic-stress": {
        "humidity": [0.35, 0.4, 0.25], "recentRainfall": [0.3, 0.4, 0.3],
        "temperatureBand": [0.3, 0.45, 0.25], "soilMoisture": [0.25, 0.5, 0.25],
        "drainage": [0.3, 0.7], "growthStage": [0.25, 0.3, 0.25, 0.2],
    },
}

NOISE = 0.15  # bound for uniform symptom noise


def _pick(rng: random.Random, options: list[str], weights: list[float]) -> str:
    return rng.choices(options, weights=weights, k=1)[0]


def generate_fixture(rows_per_class: int = ROWS_PER_CLASS) -> pd.DataFrame:
    rng = random.Random(SEED)
    rows: list[dict] = []
    for crop, conditions in CROP_CONDITIONS.items():
        labels = [c for c, _ in conditions]
        weights = [w for _, w in conditions]
        for _ in range(rows_per_class * len(conditions)):
            target = rng.choices(labels, weights=weights, k=1)[0]
            row: dict = {"crop": crop}
            for sid in SYMPTOM_IDS:
                base = CONDITION_SYMPTOM_WEIGHTS[target].get(sid, 0.05)
                noise = rng.uniform(-NOISE, NOISE)
                probability = max(0.0, min(1.0, base + noise))
                row[f"symptom_{sid}"] = 1 if rng.random() < probability else 0
            env_weights = CONDITION_ENV_WEIGHTS[target]
            for field, options in ENV_CHOICES.items():
                row[f"env_{field}"] = _pick(rng, options, env_weights[field])
            row[TARGET_COLUMN] = target
            rows.append(row)
    return pd.DataFrame(rows, columns=(*FEATURE_COLUMNS, TARGET_COLUMN))


def main() -> None:
    FIXTURE_PATH.parent.mkdir(parents=True, exist_ok=True)
    frame = generate_fixture()
    frame.to_csv(FIXTURE_PATH, index=False)
    print(f"fixture written: {FIXTURE_PATH} ({frame.shape[0]} rows, {frame.shape[1]} columns)")
    print("NOTE: synthetic, clearly-labelled software-test data — not field evidence.")


if __name__ == "__main__":
    main()
