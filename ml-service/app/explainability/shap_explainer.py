"""Model-aware SHAP explanations for the trained artifact.

Explainer choice follows the actual winning algorithm, honestly:
- Tree ensemble (RandomForest and friends) → shap.TreeExplainer (exact).
- Linear model (e.g. logistic regression) → shap.LinearExplainer with the
  background sample persisted at training time (interventional features).
Contributions are associations learned by the model — not causal proof.
"""
from typing import Any


TREE_MODEL_MARKERS = ("RandomForest", "DecisionTree", "ExtraTrees", "GradientBoosting")


def _classifier_of(pipeline: Any) -> Any:
    return pipeline[-1] if hasattr(pipeline, "__len__") else pipeline


def _transformed_of(pipeline: Any, row_frame: Any) -> Any:
    transformed = pipeline[:-1].transform(row_frame) if hasattr(pipeline, "__len__") else row_frame
    if hasattr(transformed, "toarray"):  # sparse matrix → dense
        transformed = transformed.toarray()
    # Keep column names so contributions map back to understandable features.
    if not hasattr(transformed, "columns"):
        import numpy as np
        import pandas as pd

        try:
            names = pipeline[:-1].get_feature_names_out()
        except Exception:
            names = None
        columns = [str(n).split("__", 1)[-1] for n in names] if names is not None else None
        transformed = pd.DataFrame(np.asarray(transformed), columns=columns)
    return transformed


def _values_for_class(shap_values: Any, class_index: int) -> Any:
    import numpy as np

    arr = np.asarray(shap_values, dtype=object)
    if isinstance(shap_values, list):
        return np.asarray(shap_values[class_index])[0]
    if arr.ndim == 3:
        return np.asarray(arr[0, :, class_index], dtype=float)
    if arr.ndim == 2:
        return np.asarray(arr[0], dtype=float)
    return np.asarray(arr[0], dtype=float)


def _expected_value(explainer: Any, class_index: int) -> float:
    import numpy as np

    ev = explainer.expected_value
    arr = np.atleast_1d(np.asarray(ev, dtype=float))
    if arr.size > class_index:
        return float(arr[class_index])
    return float(arr.ravel()[0])


def explain_with_shap(pipeline: Any, metadata: dict, row_frame: Any, predicted_class: str) -> dict:
    """Returns {'method','baseline','features','caveats'} for the predicted class."""
    import numpy as np
    import shap

    classifier = _classifier_of(pipeline)
    transformed = _transformed_of(pipeline, row_frame)
    model_name = type(classifier).__name__

    if any(marker in model_name for marker in TREE_MODEL_MARKERS):
        explainer = shap.TreeExplainer(classifier)
        shap_values = explainer.shap_values(transformed)
        method = f"SHAP TreeExplainer on the trained {model_name}"
    else:
        # Linear models get an exact LinearExplainer over the persisted
        # background sample; without it the baseline would be meaningless.
        background = _load_background(metadata)
        if background is None:
            raise RuntimeError("linear model explanation needs the persisted background sample (background.joblib)")
        masker = shap.maskers.Independent(background)
        explainer = shap.LinearExplainer(classifier, masker)
        shap_values = explainer.shap_values(transformed)
        method = f"SHAP LinearExplainer on the trained {model_name}"

    classes = list(getattr(classifier, "classes_", []))
    class_index = classes.index(predicted_class) if predicted_class in classes else 0
    values = _values_for_class(shap_values, class_index)
    baseline = _expected_value(explainer, class_index)

    feature_names = transformed.columns if hasattr(transformed, "columns") else [str(i) for i in range(len(values))]

    features = []
    for name, contribution in zip(feature_names, values):
        contribution = float(contribution)
        features.append(
            {
                "feature": str(name),
                "label": _friendly_name(str(name), metadata),
                "value": _cell_value(row_frame, str(name)),
                "contribution": round(contribution, 5),
                "direction": "supports" if contribution > 0 else "against",
            }
        )
    features = sorted(features, key=lambda f: abs(f["contribution"]), reverse=True)
    features = features[: metadata.get("explanation_top_k", 8)]

    return {
        "method": method,
        "baseline": round(baseline, 5),
        "features": features,
        "caveats": [
            "Contributions describe this model's learned associations on the training distribution — they are not causal effects.",
            "Absence of a feature from this list does not mean it never matters for other inputs.",
        ],
    }


def _load_background(metadata: dict) -> Any:
    import json
    from pathlib import Path

    background_file = metadata.get("backgroundFile")
    if not background_file:
        return None
    import joblib  # only needed when artifacts exist

    artifact_dir = Path(metadata.get("artifactDir", "."))
    path = artifact_dir / background_file
    if not path.exists():
        return None
    return joblib.load(path)


def _friendly_name(name: str, metadata: dict) -> str:
    # Post-one-hot names look like 'crop_tomato', 'symptom_leaf-brown-spots', 'env_humidity_high'.
    if name.startswith("crop_"):
        return f"Crop = {name[len('crop_'):].replace('-', ' ').title()}"
    if name.startswith("symptom_"):
        readable = name[len("symptom_"):].replace("-", " ")
        return f"Reported symptom: {readable.title()}"
    if name.startswith("env_"):
        parts = name[len("env_"):].rsplit("_", 1)
        if len(parts) == 2:
            return f"{parts[0].replace('_', ' ').title()} = {parts[1]}"
        return parts[0].replace("_", " ").title()
    return name


def _cell_value(row_frame: Any, column: str) -> str:
    try:
        row = row_frame.iloc[0]
    except Exception:
        return ""
    try:
        if column in row_frame.iloc[0]:
            value = row[column]
            return str(value.item()) if hasattr(value, "item") else str(value)
    except Exception:
        pass
    # One-hot encoded columns encode "this value was present" — recover it.
    if column.startswith("crop_"):
        return column[5:]
    if column.startswith("env_"):
        field, _, encoded = column[4:].rpartition("_")
        actual = row.get(f"env_{field}", "")
        return f"{encoded} (actual: {actual})" if actual else encoded
    return ""
