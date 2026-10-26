"""Pydantic request/response schemas — the service never accepts unvalidated input."""
from typing import Optional

from pydantic import BaseModel, Field, field_validator

CROPS = ["tomato", "maize", "wheat", "potato", "rice", "cotton"]

SYMPTOM_IDS = [
    "leaf-brown-spots",
    "leaf-yellowing",
    "leaf-powdery",
    "leaf-rust",
    "leaf-watersoaked",
    "leaf-curl",
    "leaf-tip-burn",
    "plant-wilting",
    "plant-stunted",
    "plant-lesion-stem",
    "plant-lodging",
    "fruit-rot",
    "fruit-spots",
    "ear-smut",
]

ENV_FIELDS = {
    "humidity": ["high", "normal", "low"],
    "recentRainfall": ["heavy", "moderate", "low"],
    "temperatureBand": ["15-25", "26-32", "above-32"],
    "soilMoisture": ["wet", "medium", "dry"],
    "drainage": ["poor", "adequate"],
    "growthStage": ["seedling", "vegetative", "flowering", "fruiting"],
}


class PredictRequest(BaseModel):
    crop_id: str = Field(..., description="One of the documented crops")
    symptom_ids: list[str] = Field(..., min_length=1, max_length=len(SYMPTOM_IDS))
    environment: dict[str, str] = Field(default_factory=dict)
    notes: Optional[str] = Field(None, max_length=500)

    @field_validator("crop_id")
    @classmethod
    def crop_must_exist(cls, value: str) -> str:
        if value not in CROPS:
            raise ValueError(f"Unknown crop '{value}'. Expected one of: {', '.join(CROPS)}")
        return value

    @field_validator("symptom_ids")
    @classmethod
    def symptoms_must_exist(cls, values: list[str]) -> list[str]:
        unknown = [value for value in values if value not in SYMPTOM_IDS]
        if unknown:
            raise ValueError(f"Unknown symptom id(s): {unknown}. See the documented catalogue in data/README.md")
        return values

    @field_validator("environment")
    @classmethod
    def env_values_must_exist(cls, values: dict[str, str]) -> dict[str, str]:
        unknown_keys = [key for key in values if key not in ENV_FIELDS]
        if unknown_keys:
            raise ValueError(f"Unknown environment key(s): {unknown_keys}. Expected keys: {list(ENV_FIELDS)}")
        bad = {key: value for key, value in values.items() if value not in ENV_FIELDS[key]}
        if bad:
            raise ValueError(f"Invalid environment value(s): {bad}. Allowed: {ENV_FIELDS}")
        return values


class FeatureContribution(BaseModel):
    feature: str
    label: str
    value: str
    contribution: float
    direction: str  # 'supports' | 'against'


class PredictResponse(BaseModel):
    conditionId: str
    conditionName: str
    probabilities: list[dict]  # [{'conditionId','name','probability'}]
    confidence: float
    warnings: list[str]
    requestId: str
    modelInfo: dict


class ExplainResponse(BaseModel):
    requestId: str
    method: str
    baseline: float
    classProbabilities: list[dict]
    features: list[FeatureContribution]
    caveats: list[str]


class PredictAndExplainResponse(BaseModel):
    conditionId: str
    conditionName: str
    probabilities: list[dict]
    confidence: float
    method: str
    baseline: float
    features: list[FeatureContribution]
    caveats: list[str]
    modelInfo: dict
    warnings: list[str]
    requestId: str


class ModelInfoResponse(BaseModel):
    service: str
    version: str
    model: dict
